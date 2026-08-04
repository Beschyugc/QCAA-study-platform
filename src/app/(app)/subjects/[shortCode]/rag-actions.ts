"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Rates a whole topic red / amber / green in one go.
 *
 * The rating is stored on each learning objective rather than on the topic,
 * because that is the level the recommendation engine already scores against
 * (proportionRedAmber). Writing it here means a rating made on the subject
 * page immediately changes what the afternoon plan suggests — no second
 * system, no sync step.
 *
 * Objective-level nuance is still available on the dedicated rating page; this
 * is the fast path for "I know this whole topic is shaky".
 */
export async function setTopicRag(
  shortCode: string,
  topicId: string,
  rag: "red" | "amber" | "green",
) {
  const user = await requireUser();

  // Scoped by userId AND topicId so a guessed topic id can't rate someone
  // else's curriculum.
  const topic = await prisma.topic.findFirst({
    where: { id: topicId, userId: user.id },
    select: { id: true, unlockState: true },
  });
  if (!topic) throw new Error("Topic not found");
  if (topic.unlockState === "locked") {
    throw new Error("Locked topics can't be rated — master the previous one first");
  }

  await prisma.learningObjective.updateMany({
    where: { userId: user.id, subtopic: { topicId } },
    data: { ragStatus: rag, ragUpdatedAt: new Date() },
  });

  revalidatePath(`/subjects/${shortCode}`);
  revalidatePath("/");
}
