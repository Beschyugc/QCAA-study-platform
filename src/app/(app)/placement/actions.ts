"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { AiUnavailableError } from "@/lib/ai/provider";
import {
  applyFallbackPlacement,
  applyPlacement,
  buildFallbackPlacementQuestions,
  buildPlacementQuestions,
  gradePlacement,
  type FallbackPlacementCard,
  type PlacementQuestion,
  type PlacementResult,
  type SelfGrade,
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

// No-AI fallback — see lib/placement.ts's header comment on that section.

export async function startFallbackPlacement(
  shortCode: string,
): Promise<{ cards: FallbackPlacementCard[] | null; error: string | null }> {
  const user = await requireUser();
  try {
    return { cards: await buildFallbackPlacementQuestions(user.id, shortCode.toUpperCase()), error: null };
  } catch (error) {
    return { cards: null, error: message(error) };
  }
}

export async function submitFallbackPlacement(
  shortCode: string,
  gradesByTopic: [string, SelfGrade[]][],
): Promise<{ results: PlacementResult[] | null; error: string | null }> {
  const user = await requireUser();
  try {
    const results = await applyFallbackPlacement(user.id, new Map(gradesByTopic));
    revalidatePath(`/subjects/${shortCode.toUpperCase()}`);
    revalidatePath("/");
    return { results, error: null };
  } catch (error) {
    return { results: null, error: message(error) };
  }
}
