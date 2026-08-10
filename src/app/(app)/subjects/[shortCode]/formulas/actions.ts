"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initialState } from "@/lib/srs/sm2";
import { encodeTags } from "@/lib/cards";

function revalidate(shortCode: string) {
  revalidatePath(`/subjects/${shortCode}/formulas`);
}

export async function createFormula(
  shortCode: string,
  subjectId: string,
  topicId: string | null,
  latex: string,
  plainText: string,
  description: string,
  category: string,
  onFormulaSheet: boolean,
) {
  const user = await requireUser();
  await prisma.formulaEntry.create({
    data: {
      userId: user.id,
      subjectId,
      topicId,
      latex,
      plainText,
      description,
      category,
      onFormulaSheet,
    },
  });
  revalidate(shortCode);
}

export async function updateFormula(
  shortCode: string,
  id: string,
  data: Partial<{
    latex: string;
    plainText: string;
    description: string;
    category: string;
    onFormulaSheet: boolean;
  }>,
) {
  const user = await requireUser();
  await prisma.formulaEntry.update({ where: { id, userId: user.id }, data });
  revalidate(shortCode);
}

export async function deleteFormula(shortCode: string, id: string) {
  const user = await requireUser();
  await prisma.formulaEntry.delete({ where: { id, userId: user.id } });
  revalidate(shortCode);
}

// One click -> a formula card (front = description, back = LaTeX),
// tagged "formula-sheet-drill" so these can be reviewed as their own deck.
export async function convertFormulaToCard(
  shortCode: string,
  formulaId: string,
  topicId: string,
) {
  const user = await requireUser();
  const formula = await prisma.formulaEntry.findUniqueOrThrow({
    where: { id: formulaId, userId: user.id },
  });

  const card = await prisma.card.create({
    data: {
      userId: user.id,
      subjectId: formula.subjectId,
      topicId,
      cardType: "formula",
      front: formula.description,
      back: formula.latex,
      tags: encodeTags(["formula-drill"]),
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
