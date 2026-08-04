"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { generateLesson } from "@/lib/lessons";
import { AiUnavailableError } from "@/lib/ai/provider";

export async function buildLesson(shortCode: string, topicId: string) {
  const user = await requireUser();
  try {
    await generateLesson(user.id, topicId);
    revalidatePath(`/subjects/${shortCode}/learn/${topicId}`);
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof AiUnavailableError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not write the lesson.",
    };
  }
}
