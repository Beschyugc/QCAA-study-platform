"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { AiUnavailableError } from "@/lib/ai/provider";
import {
  applyFallbackPlacement,
  applyObjectivePlacement,
  buildFallbackPlacementQuestions,
  buildPlacementExam,
  gradePlacementExam,
  type ExamAnswer,
  type ExamResult,
  type FallbackPlacementCard,
  type PlacementExam,
  type PlacementResult,
  type SelfGrade,
} from "@/lib/placement";

function message(error: unknown): string {
  if (error instanceof AiUnavailableError) return error.message;
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function startPlacement(
  shortCode: string,
): Promise<{ exam: PlacementExam | null; error: string | null }> {
  const user = await requireUser();
  try {
    return { exam: await buildPlacementExam(user.id, shortCode.toUpperCase()), error: null };
  } catch (error) {
    return { exam: null, error: message(error) };
  }
}

/**
 * The paper comes back from the client rather than being held server-side.
 *
 * It has to survive a reload — an hour and a half of answers lost to a stray
 * refresh would be unforgivable — and there is no table to park it in. So the
 * client keeps it, in localStorage, and hands it back to be marked. Single
 * user, own machine: the only person who could tamper with the answer key is
 * the person being diagnosed, and lying to your own diagnostic is already
 * possible by just typing the wrong thing.
 */
export async function submitPlacement(
  exam: PlacementExam,
  answers: ExamAnswer[],
): Promise<{ result: ExamResult | null; error: string | null }> {
  const user = await requireUser();
  try {
    const result = await gradePlacementExam(user.id, exam, answers);
    // Written straight away: a diagnostic you have to remember to apply is a
    // diagnostic that silently doesn't count.
    await applyObjectivePlacement(user.id, result.objectives);
    revalidatePath(`/subjects/${exam.shortCode.toUpperCase()}`);
    revalidatePath("/");
    return { result, error: null };
  } catch (error) {
    return { result: null, error: message(error) };
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
