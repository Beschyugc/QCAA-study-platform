import { prisma } from "@/lib/prisma";
import { scoreTopicPriority, type PriorityFactors, type PriorityResult } from "@/lib/recommendation";

export type TopicRecommendation = {
  topicId: string;
  topicNumber: number;
  topicTitle: string;
  subjectId: string;
  subjectName: string;
  subjectColour: string;
  factors: PriorityFactors;
  result: PriorityResult;
};

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export async function getTopicRecommendations(userId: string): Promise<TopicRecommendation[]> {
  const activeTopics = await prisma.topic.findMany({
    where: { userId, unlockState: "active" },
    include: {
      unit: { include: { subject: true } },
      subtopics: { include: { learningObjectives: true } },
    },
  });

  const now = new Date();
  const recommendations: TopicRecommendation[] = [];

  for (const topic of activeTopics) {
    const subject = topic.unit.subject;
    const objectives = topic.subtopics.flatMap((s) => s.learningObjectives);
    const redAmberCount = objectives.filter(
      (o) => o.ragStatus === "red" || o.ragStatus === "amber",
    ).length;
    const proportionRedAmber = objectives.length === 0 ? 0 : redAmberCount / objectives.length;

    const [lastSession, cardsOverdue] = await Promise.all([
      prisma.studySession.findFirst({
        where: { userId, subjectId: subject.id },
        orderBy: { startedAt: "desc" },
      }),
      prisma.card.count({
        where: {
          userId,
          topicId: topic.id,
          isSuspended: false,
          scheduling: { dueDate: { lte: now } },
        },
      }),
    ]);

    const daysSinceLastStudied = lastSession ? daysBetween(now, lastSession.startedAt) : null;

    // Pace variance: how far behind a naive "mastered topics so far vs.
    // required rate to hit targetCompletionDate" estimate. Deliberately
    // conservative — returns null (no contribution) rather than a
    // fabricated number whenever there isn't enough data to trust it.
    let paceVarianceDays: number | null = null;
    if (subject.targetCompletionDate) {
      const [totalTopics, masteredTopics] = await Promise.all([
        prisma.topic.count({ where: { userId, unit: { subjectId: subject.id } } }),
        prisma.topic.count({
          where: { userId, unit: { subjectId: subject.id }, unlockState: "mastered" },
        }),
      ]);
      const daysRemaining = daysBetween(subject.targetCompletionDate, now);
      const topicsRemaining = totalTopics - masteredTopics;
      if (totalTopics > 0 && daysRemaining > 0 && topicsRemaining > 0) {
        const requiredTopicsPerDay = topicsRemaining / daysRemaining;
        // Recent pace proxy: topics mastered in the last 30 days.
        const recentlyMastered = await prisma.topic.count({
          where: {
            userId,
            unit: { subjectId: subject.id },
            unlockState: "mastered",
            masteredAt: { gte: new Date(now.getTime() - 30 * 86_400_000) },
          },
        });
        const actualTopicsPerDay = recentlyMastered / 30;
        if (actualTopicsPerDay > 0 && actualTopicsPerDay < requiredTopicsPerDay) {
          const daysNeededAtActualPace = topicsRemaining / actualTopicsPerDay;
          paceVarianceDays = Math.max(0, Math.round(daysNeededAtActualPace - daysRemaining));
        } else if (actualTopicsPerDay === 0) {
          // No recent progress at all and behind pace numerically — flag
          // it, but don't pretend to know a precise day count.
          paceVarianceDays = Math.round(requiredTopicsPerDay * 7); // rough: a week's worth of required pace as urgency
        }
      }
    }

    const daysUntilAssessment = subject.nextAssessmentDate
      ? daysBetween(subject.nextAssessmentDate, now)
      : null;

    const factors: PriorityFactors = {
      subjectPriorityWeight: subject.priorityWeight,
      proportionRedAmber,
      daysSinceLastStudied,
      cardsOverdue,
      paceVarianceDays,
      daysUntilAssessment,
      recentPastPaperErrorRate: null, // Phase 12 not built yet
      needsReview: topic.needsReview,
    };

    recommendations.push({
      topicId: topic.id,
      topicNumber: topic.number,
      topicTitle: topic.title,
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColour: subject.colour,
      factors,
      result: scoreTopicPriority(factors),
    });
  }

  return recommendations.sort((a, b) => b.result.score - a.result.score);
}
