"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CATEGORY_BY_ID,
  REVIEW_DAYS,
  demote,
  promote,
  type MistakeCategory,
  type MistakeStatus,
} from "@/config/mistakes";

function daysFromNow(days: number | null): Date | null {
  return days === null ? null : new Date(Date.now() + days * 86_400_000);
}

export type RecordMistakeInput = {
  subjectId: string;
  topicId?: string | null;
  cardId?: string | null;
  category: MistakeCategory;
  whatWentWrong: string;
  whyItHappened?: string | null;
  source?: string | null;
  marksLost?: number | null;
};

/**
 * Logs a lost mark.
 *
 * If the same card has already been logged and isn't mastered yet, this bumps
 * the existing record instead of adding a second one — a mistake made twice is
 * one weakness with a count, not two separate events. That count is what makes
 * the REPEATED tile meaningful, and it also demotes the status, since getting
 * it wrong again is evidence the repair didn't hold.
 */
export async function recordMistake(input: RecordMistakeInput) {
  const user = await requireUser();

  if (!CATEGORY_BY_ID.has(input.category)) {
    return { ok: false as const, error: "Unknown category." };
  }
  const what = input.whatWentWrong.trim();
  if (!what) return { ok: false as const, error: "Say what went wrong." };

  // Scope-check the subject so a foreign id can't write into someone else's data.
  const subject = await prisma.subject.findFirst({
    where: { id: input.subjectId, userId: user.id },
    select: { id: true },
  });
  if (!subject) return { ok: false as const, error: "Unknown subject." };

  const existing = input.cardId
    ? await prisma.mistake.findFirst({
        where: { userId: user.id, cardId: input.cardId, NOT: { status: "mastered" } },
      })
    : null;

  if (existing) {
    const status = demote(existing.status as MistakeStatus);
    await prisma.mistake.update({
      where: { id: existing.id },
      data: {
        category: input.category,
        whatWentWrong: what,
        whyItHappened: input.whyItHappened?.trim() || existing.whyItHappened,
        timesRepeated: { increment: 1 },
        status,
        lastSeenAt: new Date(),
        nextReviewAt: daysFromNow(REVIEW_DAYS[status]),
      },
    });
  } else {
    await prisma.mistake.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        topicId: input.topicId || null,
        cardId: input.cardId || null,
        category: input.category,
        whatWentWrong: what,
        whyItHappened: input.whyItHappened?.trim() || null,
        fixAction: CATEGORY_BY_ID.get(input.category)!.fix,
        source: input.source?.trim() || null,
        marksLost: typeof input.marksLost === "number" ? input.marksLost : null,
        nextReviewAt: daysFromNow(REVIEW_DAYS.new),
      },
    });
  }

  revalidatePath("/mistakes");
  return { ok: true as const };
}

/**
 * Log a mistake straight from a card that was just failed in the reviewer.
 *
 * The subject and topic come off the card rather than from the caller, so the
 * reviewer doesn't have to thread them through and can't mislabel one. This is
 * the path Examora's folder has no equivalent for — theirs only captures from
 * self-marked exams and manual entry, so the errors made while drilling, which
 * are the most frequent ones, never get recorded anywhere.
 */
export async function recordMistakeForCard(
  cardId: string,
  category: MistakeCategory,
  whyItHappened?: string,
) {
  const user = await requireUser();
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: user.id },
    select: { id: true, subjectId: true, topicId: true, front: true },
  });
  if (!card) return { ok: false as const, error: "Unknown card." };

  return recordMistake({
    subjectId: card.subjectId,
    topicId: card.topicId,
    cardId: card.id,
    category,
    whatWentWrong: card.front.slice(0, 300),
    whyItHappened: whyItHappened ?? null,
    source: "Card reviewer",
  });
}

/** Advance or knock back a record after re-attempting it. */
export async function reviewMistake(id: string, wentWell: boolean) {
  const user = await requireUser();
  const m = await prisma.mistake.findFirst({ where: { id, userId: user.id } });
  if (!m) return { ok: false as const, error: "Not found." };

  const status = wentWell
    ? promote(m.status as MistakeStatus)
    : demote(m.status as MistakeStatus);

  await prisma.mistake.update({
    where: { id },
    data: {
      status,
      lastSeenAt: new Date(),
      nextReviewAt: daysFromNow(REVIEW_DAYS[status]),
      masteredAt: status === "mastered" ? new Date() : null,
      // A failed review is another instance of the same lost mark.
      ...(wentWell ? {} : { timesRepeated: { increment: 1 } }),
    },
  });

  revalidatePath("/mistakes");
  return { ok: true as const, status };
}

export async function deleteMistake(id: string) {
  const user = await requireUser();
  // deleteMany, not delete: it scopes by userId in the same statement, so a
  // guessed id belonging to someone else deletes nothing instead of throwing.
  await prisma.mistake.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/mistakes");
  return { ok: true as const };
}
