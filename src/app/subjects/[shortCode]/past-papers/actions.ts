"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToBucket } from "@/lib/storage";

export async function createPastPaper(shortCode: string, formData: FormData) {
  const user = await requireUser();
  const subjectId = String(formData.get("subjectId"));
  const year = Number(formData.get("year"));
  const paperName = String(formData.get("paperName"));
  const totalMarks = Number(formData.get("totalMarks"));

  const questionPaperFile = formData.get("questionPaper") as File | null;
  const mcFile = formData.get("mcPaper") as File | null;
  const markingGuideFile = formData.get("markingGuide") as File | null;

  if (!questionPaperFile || questionPaperFile.size === 0) {
    throw new Error("Question paper PDF is required");
  }

  const questionPaper = await uploadToBucket("past-papers", user.id, questionPaperFile);
  const mc = mcFile && mcFile.size > 0 ? await uploadToBucket("past-papers", user.id, mcFile) : null;
  const markingGuide =
    markingGuideFile && markingGuideFile.size > 0
      ? await uploadToBucket("past-papers", user.id, markingGuideFile)
      : null;

  await prisma.pastPaper.create({
    data: {
      userId: user.id,
      subjectId,
      year,
      paperName,
      totalMarks,
      questionPaperPath: questionPaper.url,
      mcPaperPath: mc?.url ?? null,
      markingGuidePath: markingGuide?.url ?? null,
      hasMarkingGuide: !!markingGuide,
    },
  });

  revalidatePath(`/subjects/${shortCode}/past-papers`);
}

export async function deletePastPaper(shortCode: string, id: string) {
  const user = await requireUser();
  await prisma.pastPaper.delete({ where: { id, userId: user.id } });
  revalidatePath(`/subjects/${shortCode}/past-papers`);
}
