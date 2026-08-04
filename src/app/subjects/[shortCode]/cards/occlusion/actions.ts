"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadCardMedia } from "@/lib/storage";
import { initialState } from "@/lib/srs/sm2";

export async function uploadOcclusionImage(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  return uploadCardMedia(user.id, file);
}

export type Region = { x: number; y: number; w: number; h: number; label?: string };

// One region -> one Card. All cards share `extra` = { imageUrl, regions,
// targetIndex } so the reviewer can draw every region on the front
// (all hidden) and reveal the full image on the back — see reviewer.tsx
// comment for why this is a scoped-down version of Anki's occlusion modes.
export async function createOcclusionCards(
  shortCode: string,
  subjectId: string,
  topicId: string,
  imageUrl: string,
  regions: Region[],
) {
  const user = await requireUser();

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < regions.length; i++) {
      const card = await tx.card.create({
        data: {
          userId: user.id,
          subjectId,
          topicId,
          cardType: "image_occlusion",
          front: regions[i].label || `Region ${i + 1}`,
          back: regions[i].label || `Region ${i + 1}`,
          extra: JSON.stringify({ imageUrl, regions, targetIndex: i }),
        },
      });
      const init = initialState();
      await tx.cardScheduling.create({
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
    }
  });

  revalidatePath(`/subjects/${shortCode}/cards`);
  revalidatePath(`/subjects/${shortCode}/reviewer`);
}
