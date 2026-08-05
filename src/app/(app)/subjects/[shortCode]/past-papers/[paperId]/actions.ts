"use server";

import { revalidatePath } from "next/cache";
import { PDFParse } from "pdf-parse";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText, AiUnavailableError } from "@/lib/ai/provider";

function revalidate(shortCode: string, paperId: string) {
  revalidatePath(`/subjects/${shortCode}/past-papers/${paperId}`);
}

export async function startAttempt(
  shortCode: string,
  paperId: string,
  conditions: "timed" | "open" | "untimed",
) {
  const user = await requireUser();
  const paper = await prisma.pastPaper.findUniqueOrThrow({ where: { id: paperId, userId: user.id } });
  const attempt = await prisma.paperAttempt.create({
    data: {
      userId: user.id,
      paperId,
      startedAt: new Date(),
      totalMarks: paper.totalMarks,
      conditions,
    },
  });
  revalidate(shortCode, paperId);
  return attempt.id;
}

export async function addResponse(
  shortCode: string,
  paperId: string,
  attemptId: string,
  questionNumber: string,
  marksAvailable: number,
  topicId: string | null,
  myAnswer: string,
) {
  const user = await requireUser();
  await prisma.attemptResponse.create({
    data: { userId: user.id, attemptId, questionNumber, marksAvailable, topicId, myAnswer },
  });
  revalidate(shortCode, paperId);
}

export async function deleteResponse(shortCode: string, paperId: string, id: string) {
  const user = await requireUser();
  await prisma.attemptResponse.delete({ where: { id, userId: user.id } });
  revalidate(shortCode, paperId);
}

export async function finishAttempt(shortCode: string, paperId: string, attemptId: string) {
  const user = await requireUser();
  const attempt = await prisma.paperAttempt.findUniqueOrThrow({
    where: { id: attemptId, userId: user.id },
  });
  const timeTakenMinutes = Math.round((Date.now() - attempt.startedAt.getTime()) / 60_000);
  await prisma.paperAttempt.update({
    where: { id: attemptId },
    data: { completedAt: new Date(), timeTakenMinutes },
  });
  revalidate(shortCode, paperId);
}

export async function awardMarks(
  shortCode: string,
  paperId: string,
  responseId: string,
  marksAwarded: number,
  errorCategory:
    | "conceptual_gap"
    | "calculation_error"
    | "misread_question"
    | "ran_out_of_time"
    | "poor_communication"
    | null,
  feedback: string | null,
) {
  const user = await requireUser();
  await prisma.attemptResponse.update({
    where: { id: responseId, userId: user.id },
    data: { marksAwarded, errorCategory, feedback },
  });

  // Recompute the attempt's raw score / percentage from all marked responses.
  const response = await prisma.attemptResponse.findUniqueOrThrow({
    where: { id: responseId },
    select: { attemptId: true },
  });
  const responses = await prisma.attemptResponse.findMany({
    where: { attemptId: response.attemptId },
  });
  const rawScore = responses.reduce((sum, r) => sum + (r.marksAwarded ?? 0), 0);
  const attempt = await prisma.paperAttempt.findUniqueOrThrow({ where: { id: response.attemptId } });
  await prisma.paperAttempt.update({
    where: { id: response.attemptId },
    // null, not 0, when the paper's mark total isn't set. Reporting 0% for
    // "we don't know the denominator" reads as "you scored nothing" and would
    // drag down every average and chart built on it.
    data: {
      rawScore,
      percentage: attempt.totalMarks > 0 ? (rawScore / attempt.totalMarks) * 100 : null,
    },
  });

  revalidate(shortCode, paperId);
}

// Marking guide text is extracted once per paper and cached in-memory for
// the lifetime of the server process — re-parsing a PDF on every question
// of every attempt would be wasteful. Cold starts re-parse; that's fine,
// it's a few seconds against a small PDF, not a user-facing cost worth
// solving with a DB column right now.
const markingGuideCache = new Map<string, string>();

async function getMarkingGuideText(paperId: string, url: string): Promise<string> {
  const cached = markingGuideCache.get(paperId);
  if (cached) return cached;
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  const { text } = await parser.getText();
  markingGuideCache.set(paperId, text);
  return text;
}

export async function aiSuggestMark(shortCode: string, paperId: string, responseId: string) {
  const user = await requireUser();
  try {
    const [response, paper] = await Promise.all([
      prisma.attemptResponse.findUniqueOrThrow({ where: { id: responseId, userId: user.id } }),
      prisma.pastPaper.findUniqueOrThrow({ where: { id: paperId, userId: user.id } }),
    ]);
    if (!paper.markingGuidePath) {
      return { error: "No marking guide uploaded for this paper.", suggestedMarks: null, explanation: null };
    }

    const guideText = await getMarkingGuideText(paperId, paper.markingGuidePath);

    const result = await generateText([
      {
        role: "system",
        content: `You are a QCAA exam marker. You'll be given the marking guide text for an entire paper and one student response to one question. Find that question's marking criteria in the guide, compare the response against it, and suggest a mark. The student has final say — you're a suggestion, not the authority. Respond with ONLY valid JSON: {"suggestedMarks": <number>, "explanation": "<1-2 sentences on what's missing or right>"}`,
      },
      {
        role: "user",
        content: `Marking guide (full paper):\n${guideText.slice(0, 12000)}\n\nQuestion ${response.questionNumber} (${response.marksAvailable} marks available). Student's response:\n${response.myAnswer}`,
      },
    ], { jsonMode: true });

    const parsed = JSON.parse(result);
    return { error: null, suggestedMarks: parsed.suggestedMarks, explanation: parsed.explanation };
  } catch (error) {
    return {
      error: error instanceof AiUnavailableError ? error.message : "AI marking failed.",
      suggestedMarks: null,
      explanation: null,
    };
  }
}
