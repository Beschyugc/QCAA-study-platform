"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText, AiUnavailableError } from "@/lib/ai/provider";
import { startOfLocalWeek, addDays } from "@/lib/date";

type RagHistoryEntry = { status: string; timestamp: string };

export async function generateWeeklyReview() {
  const user = await requireUser();
  const weekStart = startOfLocalWeek(new Date());
  const weekEnd = addDays(weekStart, 7);

  const [subjects, sessions, masteredTopics, reviews, plans, attempts] = await Promise.all([
    prisma.subject.findMany({ where: { userId: user.id } }),
    prisma.studySession.findMany({
      where: { userId: user.id, startedAt: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.topic.findMany({
      where: { userId: user.id, masteredAt: { gte: weekStart, lt: weekEnd } },
      include: { unit: { include: { subject: true } } },
    }),
    prisma.review.findMany({ where: { userId: user.id, reviewedAt: { gte: weekStart, lt: weekEnd } } }),
    prisma.dailyPlan.findMany({ where: { userId: user.id, date: { gte: weekStart, lt: weekEnd } } }),
    prisma.paperAttempt.findMany({
      where: { userId: user.id, startedAt: { gte: weekStart, lt: weekEnd } },
    }),
  ]);

  const objectives = await prisma.learningObjective.findMany({
    where: { userId: user.id },
    select: { ragHistory: true },
  });
  let ragMovements = 0;
  for (const o of objectives) {
    const history = (o.ragHistory as unknown as RagHistoryEntry[]) ?? [];
    ragMovements += history.filter((h) => {
      const t = new Date(h.timestamp);
      return t >= weekStart && t < weekEnd;
    }).length;
  }

  const hoursBySubject: Record<string, number> = {};
  for (const s of sessions) {
    hoursBySubject[s.subjectId] = (hoursBySubject[s.subjectId] ?? 0) + s.focusMinutes / 60;
  }
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

  const cardsCorrect = reviews.filter((r) => r.quality >= 3).length;
  const plansFollowed = plans.filter((p) => p.wasFollowed).length;

  const stats = {
    weekStart: weekStart.toISOString().slice(0, 10),
    hoursBySubject: Object.fromEntries(
      Object.entries(hoursBySubject).map(([id, hrs]) => [subjectNameById.get(id) ?? id, Number(hrs.toFixed(1))]),
    ),
    totalHours: Number((sessions.reduce((sum, s) => sum + s.focusMinutes, 0) / 60).toFixed(1)),
    topicsMastered: masteredTopics.map((t) => `${t.unit.subject.name} T${t.number} ${t.title}`),
    ragMovements,
    cardReviews: reviews.length,
    cardAccuracy: reviews.length > 0 ? Math.round((cardsCorrect / reviews.length) * 100) : null,
    plansGenerated: plans.length,
    plansFollowed,
    pastPapersAttempted: attempts.length,
  };

  let aiSummary: string | null = null;
  let aiRecommendations: string | null = null;
  try {
    const response = await generateText([
      {
        role: "system",
        content: `You are a study coach writing a weekly review for a Year 12 QCAA General student. Use ONLY the numbers provided — never invent statistics. Be direct and specific, not generic ("study more"). Respond with ONLY valid JSON: {"summary": "<3-4 sentence narrative summary of the week>", "recommendations": "<exactly 3 specific priorities for next week, as a short numbered list>"}`,
      },
      { role: "user", content: `This week's stats:\n${JSON.stringify(stats, null, 2)}` },
    ], { jsonMode: true });
    const parsed = JSON.parse(response);
    aiSummary = parsed.summary;
    aiRecommendations = parsed.recommendations;
  } catch (error) {
    aiSummary = error instanceof AiUnavailableError ? null : null;
  }

  await prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId: user.id, weekStart } },
    create: { userId: user.id, weekStart, statsJson: stats, aiSummary, aiRecommendations },
    update: { statsJson: stats, aiSummary, aiRecommendations },
  });

  revalidatePath("/weekly-review");
}
