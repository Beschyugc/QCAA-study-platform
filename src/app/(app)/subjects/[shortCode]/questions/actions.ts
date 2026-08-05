"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AiUnavailableError } from "@/lib/ai/provider";
import { getOrCreateTodaysSet, markDailySet, type DailyQuestion, type DailyResponse } from "@/lib/daily-questions";

function message(error: unknown): string {
  if (error instanceof AiUnavailableError) return error.message;
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function startTodaysQuestions(shortCode: string): Promise<{
  setId: string | null;
  questions: DailyQuestion[] | null;
  error: string | null;
}> {
  const user = await requireUser();
  try {
    const subject = await prisma.subject.findFirstOrThrow({
      where: { userId: user.id, shortCode: shortCode.toUpperCase() },
      select: { id: true },
    });
    const set = await getOrCreateTodaysSet(user.id, subject.id);
    revalidatePath(`/subjects/${shortCode.toUpperCase()}/questions`);
    return {
      setId: set.id,
      questions: set.questions as unknown as DailyQuestion[],
      error: null,
    };
  } catch (error) {
    return { setId: null, questions: null, error: message(error) };
  }
}

export async function submitTodaysQuestions(
  shortCode: string,
  setId: string,
  answers: string[],
): Promise<{
  result: { awarded: number; available: number; responses: DailyResponse[] } | null;
  error: string | null;
}> {
  const user = await requireUser();
  try {
    const result = await markDailySet(user.id, setId, answers);
    revalidatePath(`/subjects/${shortCode.toUpperCase()}/questions`);
    revalidatePath("/");
    return { result, error: null };
  } catch (error) {
    return { result: null, error: message(error) };
  }
}
