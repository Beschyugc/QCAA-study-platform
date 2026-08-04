"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText, AiUnavailableError } from "@/lib/ai/provider";
import { buildTeachBackPrompt, stripStatusTag } from "@/lib/ai/prompts/teach-back";
import { setRagStatus, type RagStatus } from "../actions";

type TranscriptEntry = { role: "user" | "assistant"; content: string };

export async function startTeachBackSession(objectiveId: string) {
  const user = await requireUser();
  const session = await prisma.teachBackSession.create({
    data: { userId: user.id, objectiveId },
  });
  return session.id;
}

// "Same point" exchange count: number of assistant turns since the last
// resolution (or since the start, if there hasn't been one yet). This is
// what buildTeachBackPrompt uses to decide whether to inject the
// narrowing/offer-to-explain instructions — tracked by the app, not left
// to the model to silently count across a long context.
function exchangeCountOnCurrentPoint(transcript: TranscriptEntry[]): number {
  let count = 0;
  for (let i = transcript.length - 1; i >= 0; i--) {
    if (transcript[i].role === "assistant") count++;
  }
  return count;
}

export async function submitTeachBack(sessionId: string, studentText: string) {
  const user = await requireUser();

  try {
    const session = await prisma.teachBackSession.findUniqueOrThrow({
      where: { id: sessionId, userId: user.id },
      include: { objective: true },
    });

    const transcript = (session.transcriptJson as unknown as TranscriptEntry[]) ?? [];
    const exchangeCount = exchangeCountOnCurrentPoint(transcript);

    const response = await generateText([
      {
        role: "system",
        content: `${buildTeachBackPrompt(exchangeCount)}\n\nThe objective being taught back: "${session.objective.text}"`,
      },
      ...transcript,
      { role: "user", content: studentText },
    ]);

    const { status, text } = stripStatusTag(response);

    const newTranscript: TranscriptEntry[] = [
      ...transcript,
      { role: "user", content: studentText },
      { role: "assistant", content: response },
    ];

    const isEnded = status === "resolved" || status === "explained";

    await prisma.teachBackSession.update({
      where: { id: sessionId },
      data: {
        transcriptJson: newTranscript,
        attempts: session.attempts + 1,
        ...(isEnded
          ? { endedAt: new Date(), resolvedCorrectly: status === "resolved" }
          : {}),
      },
    });

    return { status, text, error: null };
  } catch (error) {
    return {
      status: "questioning" as const,
      text: null,
      error:
        error instanceof AiUnavailableError
          ? error.message
          : "Something went wrong. Try again.",
    };
  }
}

export async function updateRagAfterTeachBack(
  shortCode: string,
  objectiveId: string,
  status: RagStatus,
) {
  await setRagStatus(shortCode, objectiveId, status);
}
