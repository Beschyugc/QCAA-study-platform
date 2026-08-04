"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { review, type Quality, type SchedulingState } from "@/lib/srs/sm2";

export async function gradeCard(
  shortCode: string,
  cardId: string,
  quality: Quality,
  timeTakenMs?: number,
) {
  const user = await requireUser();
  const scheduling = await prisma.cardScheduling.findUniqueOrThrow({
    where: { cardId, userId: user.id },
  });

  const current: SchedulingState = {
    state: scheduling.state,
    easeFactor: scheduling.easeFactor,
    intervalDays: scheduling.intervalDays,
    repetitions: scheduling.repetitions,
    lapses: scheduling.lapses,
    learningStep: scheduling.learningStep,
  };

  const now = new Date();
  const { next, dueAt, becameLeech } = review(current, quality, now);

  const [reviewRow] = await prisma.$transaction([
    prisma.review.create({
      data: {
        userId: user.id,
        cardId,
        reviewedAt: now,
        quality,
        intervalBefore: current.intervalDays,
        intervalAfter: next.intervalDays,
        easeBefore: current.easeFactor,
        easeAfter: next.easeFactor,
        timeTakenMs,
      },
    }),
    prisma.cardScheduling.update({
      where: { cardId },
      data: {
        dueDate: dueAt,
        intervalDays: next.intervalDays,
        easeFactor: next.easeFactor,
        repetitions: next.repetitions,
        lapses: next.lapses,
        learningStep: next.learningStep,
        state: next.state,
      },
    }),
    ...(becameLeech
      ? [
          prisma.card.update({
            where: { id: cardId },
            data: { isSuspended: true },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/subjects/${shortCode}/reviewer`);
  revalidatePath(`/subjects/${shortCode}/cards`);

  return { becameLeech, reviewId: reviewRow.id };
}

// Restores the exact pre-grade snapshot the reviewer UI captured before
// calling gradeCard, and deletes the Review row that call created.
export async function undoReview(
  shortCode: string,
  reviewId: string,
  cardId: string,
  previous: SchedulingState & { dueDate: string },
  wasSuspended: boolean,
) {
  const user = await requireUser();
  await prisma.$transaction([
    prisma.review.delete({ where: { id: reviewId, userId: user.id } }),
    prisma.cardScheduling.update({
      where: { cardId, userId: user.id },
      data: {
        dueDate: new Date(previous.dueDate),
        intervalDays: previous.intervalDays,
        easeFactor: previous.easeFactor,
        repetitions: previous.repetitions,
        lapses: previous.lapses,
        learningStep: previous.learningStep,
        state: previous.state,
      },
    }),
    prisma.card.update({
      where: { id: cardId, userId: user.id },
      data: { isSuspended: wasSuspended },
    }),
  ]);
  revalidatePath(`/subjects/${shortCode}/reviewer`);
}

export async function buryCard(shortCode: string, cardId: string) {
  const user = await requireUser();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.cardScheduling.update({
    where: { cardId, userId: user.id },
    data: { dueDate: tomorrow },
  });
  revalidatePath(`/subjects/${shortCode}/reviewer`);
}
