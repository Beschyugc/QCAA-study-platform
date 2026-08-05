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

    const [subjects, sessions, objectives, reviews, pastAttempts, topics] = await Promise.all([
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
      // Topic-level progress. Without this the coach only saw objective
      // counts and, because the key didn't name its unit, reported them as
      // topics — telling Beschy to "work through 88 topics" in Methods, which
      // has 10. Wrong by an order of magnitude, in the one place that is
      // supposed to be citing his real numbers.
      prisma.topic.findMany({
        where: { userId: user.id },
        select: { title: true, unlockState: true, unit: { select: { number: true, subjectId: true } } },
        orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
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

    const topicsBySubject: Record<string, { total: number; mastered: number; locked: number; currentlyOn: string | null }> = {};
    for (const t of topics) {
      const name = nameById.get(t.unit.subjectId) ?? "unknown";
      topicsBySubject[name] ??= { total: 0, mastered: 0, locked: 0, currentlyOn: null };
      topicsBySubject[name].total++;
      if (t.unlockState === "mastered") topicsBySubject[name].mastered++;
      if (t.unlockState === "locked") topicsBySubject[name].locked++;
      if (t.unlockState === "active") topicsBySubject[name].currentlyOn = `U${t.unit.number} ${t.title}`;
    }

    const stats = {
      last14Days: { hoursBySubject: Object.fromEntries(Object.entries(hoursBySubject).map(([k, v]) => [k, Number(v.toFixed(1))])) },
      topicProgressBySubject: topicsBySubject,
      // Named for what it counts. These are individual learning objectives —
      // there are far more of them than topics, and conflating the two
      // produced advice that was wrong by an order of magnitude.
      learningObjectiveRagCountsBySubject: ragBySubject,
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

You will be given real stats from his study platform. Reference ACTUAL NUMBERS from this data in your analysis — never give generic advice like "study more" without tying it to something specific in the stats. Be direct, not diplomatic to the point of uselessness. "topicProgressBySubject" counts TOPICS; "learningObjectiveRagCountsBySubject" counts individual LEARNING OBJECTIVES, of which each topic has several. Never describe objective counts as topics.

Respond with ONLY valid JSON: {"analysis": "<3-5 sentence analysis citing specific numbers>", "recommendations": "<3 specific, numbered next actions>"}`,
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
