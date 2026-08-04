"use server";

import { PDFParse } from "pdf-parse";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJson } from "@/lib/ai/provider";
import { syllabusExtractionPrompt } from "@/lib/ai/prompts/syllabus-extraction";

// Extracts text from the uploaded syllabus PDF and asks the AI to structure
// it. Returns the raw JSON text for the review UI to show, edit, and
// eventually hand to importCurriculum() (same code path as manual JSON
// import) once the user confirms — nothing is written to the DB here.
export async function extractSyllabus(
  shortCode: string,
  formData: FormData,
) {
  const user = await requireUser();
  const subject = await prisma.subject.findFirstOrThrow({
    where: { userId: user.id, shortCode: shortCode.toUpperCase() },
  });

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No PDF file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  const { text } = await parser.getText();

  if (!text.trim()) {
    throw new Error("Could not extract any text from that PDF");
  }

  const prompt = syllabusExtractionPrompt(subject.name, text);
  const json = await generateJson(prompt);

  // Validate it's parseable JSON before handing it back — surface a clear
  // error now rather than a confusing one when the review form tries to
  // parse it later.
  JSON.parse(json);

  return json;
}
