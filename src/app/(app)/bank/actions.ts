"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Save an attempt. Nothing is marked here — that is the whole point.
 *
 * Beschy asked for a question log that just remembers what he typed so that
 * later he can say "check what's in my memory and tell me what's right". An
 * app that graded him instantly would be a worse version of that: it would
 * need an answer-matching heuristic, and a heuristic that marks "the empty
 * street, because of diffusion of responsibility" wrong for not containing
 * the phrase "bystander effect" teaches him to write for the matcher.
 *
 * So this stores. Claude marks in bulk, later, reading whole answers.
 *
 * `revealedWorking` is passed in from the client because it is a fact about
 * how the attempt was made, not about the attempt: an answer typed after
 * peeking is not evidence of recall. It is stored either way — a peeked
 * attempt is still practice — but it never counts as a green rating.
 */
export async function saveBankResponse(input: {
  questionId: string;
  response: string;
  revealedWorking: boolean;
  confidence: number | null;
}) {
  const user = await requireUser();

  const question = await prisma.bankQuestion.findFirst({
    where: { id: input.questionId, userId: user.id },
    select: { id: true },
  });
  if (!question) throw new Error("No such question.");

  const text = input.response.trim();
  if (!text) throw new Error("Nothing to save.");

  await prisma.bankResponse.create({
    data: {
      userId: user.id,
      questionId: question.id,
      response: text,
      revealedWorking: input.revealedWorking,
      confidence: input.confidence,
    },
  });

  revalidatePath("/bank");
}

export async function deleteBankResponse(id: string) {
  const user = await requireUser();
  const existing = await prisma.bankResponse.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("No such response.");
  await prisma.bankResponse.delete({ where: { id } });
  revalidatePath("/bank");
}
