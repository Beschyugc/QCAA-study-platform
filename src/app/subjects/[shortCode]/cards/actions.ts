"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialState } from "@/lib/srs/sm2";

function revalidate(shortCode: string) {
  revalidatePath(`/subjects/${shortCode}/cards`);
  revalidatePath(`/subjects/${shortCode}/reviewer`);
}

export async function createCard(
  shortCode: string,
  subjectId: string,
  topicId: string,
  cardType: "basic" | "cloze",
  front: string,
  back: string,
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
