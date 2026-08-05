"use server";

import { requireUser } from "@/lib/auth";
import { qcaaSystemPrompt } from "@/lib/ai/prompts/qcaa";
import { prisma } from "@/lib/prisma";
import { generateText, AiUnavailableError } from "@/lib/ai/provider";
import { addDays, startOfLocalDay } from "@/lib/date";

// §11.1 Study coach mode: "Gets a structured summary of my stats... and
// returns an analysis with specific recommendations. It must reference
// actual numbers from my data, not generic study advice." The system
// prompt below enforces that; the stats object is the only data source —
// nothing here is invented.
export async function getCoachAnalysis() {
  const user = await requireUser();

  try {
    const since = addDays(startOfLocalDay(new Date()), -13); // last 2 weeks

    const [subjects, sessions, objectives, reviews, pastAttempts] = await Promise.all([
      prisma.subject.findMany({ where: { userId: user.id } }),
      prisma.studySession.findMany({ where: { userId: user.id, startedAt: { gte: since } } }),
      prisma.learningObjective.findMany({
        where: { userId: user.id },
        select: { ragStatus: true, subtopic: { select: { topic: { select: { unit: { select: { subjectId: true } } } } } } },
      }),
      prisma.review.findMany({ where: { userId: user.id, reviewedAt: { gte: since } }, select: { quality: true } }),
      prisma.paperAttempt.findMany({
        where: { userId: user.id, completedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: { percentage: true, paper: { select: { subject: { select: { name: true } } } } },
      }),
    ]);

    const nameById = new Map(subjects.map((s) => [s.id, s.name]));
    const hoursBySubject: Record<string, number> = {};
    for (const s of sessions) {
      hoursBySubject[nameById.get(s.subjectId) ?? s.subjectId] =
        (hoursBySubject[nameById.get(s.subjectId) ?? s.subjectId] ?? 0) + s.focusMinutes / 60;
    }

    const ragBySubject: Record<string, { red: number; amber: number; green: number; unrated: number }> = {};
    for (const o of objectives) {
      const name = nameById.get(o.subtopic.topic.unit.subjectId) ?? "unknown";
      ragBySubject[name] ??= { red: 0, amber: 0, green: 0, unrated: 0 };
      ragBySubject[name][o.ragStatus as "red" | "amber" | "green" | "unrated"]++;
    }

    const stats = {
      last14Days: { hoursBySubject: Object.fromEntries(Object.entries(hoursBySubject).map(([k, v]) => [k, Number(v.toFixed(1))])) },
      ragDistributionBySubject: ragBySubject,
      cardAccuracyLast14Days:
        reviews.length > 0 ? Math.round((reviews.filter((r) => r.quality >= 3).length / reviews.length) * 100) : null,
      cardReviewCountLast14Days: reviews.length,
      recentPastPaperScores: pastAttempts.map((a) => ({
        subject: a.paper.subject.name,
        percentage: a.percentage,
      })),
      subjectPriorityWeights: Object.fromEntries(subjects.map((s) => [s.name, s.priorityWeight])),
    };

    const response = await generateText([
      {
        role: "system",
        content: `${qcaaSystemPrompt("Your job right now: act as his study coach, using the real stats from his study platform.")}

You will be given real stats from his study platform. Reference ACTUAL NUMBERS from this data in your analysis — never give generic advice like "study more" without tying it to something specific in the stats. Be direct, not diplomatic to the point of uselessness. Respond with ONLY valid JSON: {"analysis": "<3-5 sentence analysis citing specific numbers>", "recommendations": "<3 specific, numbered next actions>"}`,
      },
      { role: "user", content: `Stats:\n${JSON.stringify(stats, null, 2)}` },
    ], { jsonMode: true });

    const parsed = JSON.parse(response);

    const conversation = await prisma.aiConversation.create({
      data: { userId: user.id, mode: "study_coach", title: `Coach check-in ${new Date().toLocaleDateString()}` },
    });
    await prisma.aiMessage.create({
      data: {
        userId: user.id,
        conversationId: conversation.id,
        role: "assistant",
        content: `${parsed.analysis}\n\n${parsed.recommendations}`,
      },
    });

    return { analysis: parsed.analysis, recommendations: parsed.recommendations, stats, error: null };
  } catch (error) {
    return {
      analysis: null,
      recommendations: null,
      stats: null,
      error: error instanceof AiUnavailableError ? error.message : "Coach analysis failed.",
    };
  }
}
