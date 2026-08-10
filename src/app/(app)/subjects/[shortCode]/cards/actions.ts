"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialState } from "@/lib/srs/sm2";
import { encodeTags, decodeTags } from "@/lib/cards";

function revalidate(shortCode: string) {
  revalidatePath(`/subjects/${shortCode}/cards`);
  revalidatePath(`/subjects/${shortCode}/reviewer`);
}

export type CardType = "basic" | "cloze" | "formula" | "type_in";

export async function createCard(
  shortCode: string,
  subjectId: string,
  topicId: string,
  cardType: CardType,
  front: string,
  back: string,
  tags: string[] = [],
) {
  const user = await requireUser();
  const card = await prisma.card.create({
    data: {
      userId: user.id,
      subjectId,
      topicId,
      cardType,
      front,
      back,
      tags: encodeTags(tags),
    },
  });

  const init = initialState();
  await prisma.cardScheduling.create({
    data: {
      userId: user.id,
      cardId: card.id,
      dueDate: new Date(), // new cards are immediately due
      intervalDays: init.intervalDays,
      easeFactor: init.easeFactor,
      repetitions: init.repetitions,
      lapses: init.lapses,
      learningStep: init.learningStep,
      state: init.state,
    },
  });

  revalidate(shortCode);
}

export async function updateCard(
  shortCode: string,
  id: string,
  data: { front?: string; back?: string },
) {
  const user = await requireUser();
  await prisma.card.update({ where: { id, userId: user.id }, data });
  revalidate(shortCode);
}

export async function deleteCard(shortCode: string, id: string) {
  const user = await requireUser();
  await prisma.card.delete({ where: { id, userId: user.id } });
  revalidate(shortCode);
}

export async function setCardSuspended(
  shortCode: string,
  id: string,
  isSuspended: boolean,
) {
  const user = await requireUser();
  await prisma.card.update({
    where: { id, userId: user.id },
    data: { isSuspended },
  });
  revalidate(shortCode);
}

// ---------- bulk operations ----------

export async function bulkSuspend(
  shortCode: string,
  ids: string[],
  isSuspended: boolean,
) {
  const user = await requireUser();
  await prisma.card.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { isSuspended },
  });
  revalidate(shortCode);
}

export async function bulkDelete(shortCode: string, ids: string[]) {
  const user = await requireUser();
  await prisma.card.deleteMany({ where: { id: { in: ids }, userId: user.id } });
  revalidate(shortCode);
}

export async function bulkMoveTopic(
  shortCode: string,
  ids: string[],
  topicId: string,
) {
  const user = await requireUser();
  await prisma.card.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { topicId },
  });
  revalidate(shortCode);
}

// Prisma's updateMany can't push into a scalar array per-row, so retag
// each card individually inside one transaction.
export async function bulkRetag(shortCode: string, ids: string[], tag: string) {
  const user = await requireUser();
  const cards = await prisma.card.findMany({
    where: { id: { in: ids }, userId: user.id },
    select: { id: true, tags: true },
  });
  await prisma.$transaction(
    cards.map((c) => {
      const current = decodeTags(c.tags);
      const next = current.includes(tag) ? current : [...current, tag];
      return prisma.card.update({
        where: { id: c.id },
        data: { tags: encodeTags(next) },
      });
    }),
  );
  revalidate(shortCode);
}
