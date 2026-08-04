"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { AiUnavailableError } from "@/lib/ai/provider";
import {
  applyPlacement,
  buildPlacementQuestions,
  gradePlacement,
  type PlacementQuestion,
  type PlacementResult,
} from "@/lib/placement";

function message(error: unknown): string {
  if (error instanceof AiUnavailableError) return error.message;
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function startPlacement(
  shortCode: string,
): Promise<{ questions: PlacementQuestion[] | null; error: string | null }> {
  const user = await requireUser();
  try {
    return { questions: await buildPlacementQuestions(user.id, shortCode.toUpperCase()), error: null };
  } catch (error) {
    return { questions: null, error: message(error) };
  }
}

export async function submitPlacement(
  shortCode: string,
  answers: { topicId: string; question: string; answer: string }[],
): Promise<{ results: PlacementResult[] | null; error: string | null }> {
  const user = await requireUser();
  try {
    const results = await gradePlacement(user.id, shortCode.toUpperCase(), answers);
    // Written straight away: a diagnostic you have to remember to apply is a
    // diagnostic that silently doesn't count.
    await applyPlacement(user.id, results);
    revalidatePath(`/subjects/${shortCode.toUpperCase()}`);
    revalidatePath("/");
    return { results, error: null };
  } catch (error) {
    return { results: null, error: message(error) };
  }
}
