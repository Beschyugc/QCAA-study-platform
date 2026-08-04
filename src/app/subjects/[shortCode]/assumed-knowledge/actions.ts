"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialState } from "@/lib/srs/sm2";

function revalidate(shortCode: string) {
  revalidatePath(`/subjects/${shortCode}/assumed-knowledge`);
}

export async function createAssumedKnowledge(
  shortCode: string,
  subjectId: string,
  category: string,
  prompt: string,
  answer: string,
  latex: string | null,
  notes: string | null,
) {
  const user = await requireUser();
  await prisma.assumedKnowledge.create({
    data: { userId: user.id, subjectId, category, prompt, answer, latex, notes },
  });
  revalidate(shortCode);
}

export async function updateAssumedKnowledge(
  shortCode: string,
  id: string,
  data: Partial<{ category: string; prompt: string; answer: string; latex: string; notes: string }>,
) {
  const user = await requireUser();
  await prisma.assumedKnowledge.update({ where: { id, userId: user.id }, data });
  revalidate(shortCode);
}

export async function deleteAssumedKnowledge(shortCode: string, id: string) {
  const user = await requireUser();
  await prisma.assumedKnowledge.delete({ where: { id, userId: user.id } });
  revalidate(shortCode);
}

export async function convertToCard(shortCode: string, id: string, topicId: string) {
  const user = await requireUser();
  const entry = await prisma.assumedKnowledge.findUniqueOrThrow({
    where: { id, userId: user.id },
  });

  const card = await prisma.card.create({
    data: {
      userId: user.id,
      subjectId: entry.subjectId,
      topicId,
      cardType: entry.latex ? "formula" : "basic",
      front: entry.prompt,
      back: entry.latex ?? entry.answer,
      tags: ["assumed-knowledge"],
    },
  });
  const init = initialState();
  await prisma.cardScheduling.create({
    data: {
      userId: user.id,
      cardId: card.id,
      dueDate: new Date(),
      intervalDays: init.intervalDays,
      easeFactor: init.easeFactor,
      repetitions: init.repetitions,
      lapses: init.lapses,
      learningStep: init.learningStep,
      state: init.state,
    },
  });
  revalidatePath(`/subjects/${shortCode}/cards`);
}
