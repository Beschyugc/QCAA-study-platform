import { prisma } from "@/lib/prisma";
import {
  ACTIVE_TOPIC_CAP,
  MASTERY_MIN_STUDY_MINUTES,
  MASTERY_MIN_CARD_REVIEWS,
  MASTERY_MIN_RECENT_QUALITY,
} from "@/config/unlocking";

// Everything-unlocked mode: Beschy decided the progressive lock wasn't
// useful — every topic in every unit should be open from the start.
// Called after a full curriculum (re)build; activates ALL topics for the
// subject so rebuilds never re-lock anything. (The old behaviour activated
// only the first ACTIVE_TOPIC_CAP topics of the lowest-numbered unit.)
export async function initializeUnlockState(userId: string, subjectId: string) {
  await prisma.topic.updateMany({
    where: { userId, unit: { subjectId }, unlockState: "locked" },
    data: { unlockState: "active", unlockedAt: new Date() },
  });
}

export type MasteryEvidence = {
  totalObjectives: number;
  greenObjectives: number;
  allObjectivesGreen: boolean;
  // Card/study-minute checks aren't wired up until Phase 4-6 exist. Shown
  // as informational "not yet tracked" rather than silently passing, so
  // the evidence dialogue doesn't lie about what it actually verified.
  cardReviewsTracked: false;
  studyMinutesTracked: false;
  minCardReviews: number;
  minRecentQuality: number;
  minStudyMinutes: number;
  gatePasses: boolean;
};

export async function computeMasteryEvidence(
  userId: string,
  topicId: string,
): Promise<MasteryEvidence> {
  const objectives = await prisma.learningObjective.findMany({
    where: { userId, subtopic: { topicId } },
    select: { ragStatus: true },
  });
  const totalObjectives = objectives.length;
  const greenObjectives = objectives.filter((o) => o.ragStatus === "green").length;
  const allObjectivesGreen = totalObjectives > 0 && greenObjectives === totalObjectives;

  return {
    totalObjectives,
    greenObjectives,
    allObjectivesGreen,
    cardReviewsTracked: false,
    studyMinutesTracked: false,
    minCardReviews: MASTERY_MIN_CARD_REVIEWS,
    minRecentQuality: MASTERY_MIN_RECENT_QUALITY,
    minStudyMinutes: MASTERY_MIN_STUDY_MINUTES,
    // Only the checkable-today criterion gates the default path; card/study
    // checks join once those phases exist.
    gatePasses: allObjectivesGreen,
  };
}

// Marks a topic mastered and activates the next topic in its unit, if the
// active-topic cap allows it. `override` bypasses the evidence gate (the
// confirm dialogue always offers this — §6: "let me proceed anyway").
export async function confirmMastery(
  userId: string,
  topicId: string,
  override: boolean,
) {
  const evidence = await computeMasteryEvidence(userId, topicId);
  if (!evidence.gatePasses && !override) {
    throw new Error("Mastery gate not satisfied and override not set");
  }

  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: topicId },
  });

  await prisma.topic.update({
    where: { id: topicId },
    data: { unlockState: "mastered", masteredAt: new Date(), needsReview: false },
  });

  const activeCount = await prisma.topic.count({
    where: { userId, unitId: topic.unitId, unlockState: "active" },
  });
  if (activeCount < ACTIVE_TOPIC_CAP) {
    const nextTopic = await prisma.topic.findFirst({
      where: { userId, unitId: topic.unitId, unlockState: "locked" },
      orderBy: { order: "asc" },
    });
    if (nextTopic) {
      await prisma.topic.update({
        where: { id: nextTopic.id },
        data: { unlockState: "active", unlockedAt: new Date() },
      });
    }
  }
}

// Regression path (§6): rating an objective in a mastered topic red flags
// the topic needs_review — a visual state, not a hard revert back to
// active/locked.
export async function flagIfMasteredTopicRegressed(
  userId: string,
  objectiveId: string,
) {
  const objective = await prisma.learningObjective.findUniqueOrThrow({
    where: { id: objectiveId },
    include: { subtopic: { select: { topicId: true } } },
  });
  if (objective.ragStatus !== "red") return;

  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: objective.subtopic.topicId },
  });
  if (topic.unlockState === "mastered" && !topic.needsReview) {
    await prisma.topic.update({
      where: { id: topic.id },
      data: { needsReview: true },
    });
  }
}
