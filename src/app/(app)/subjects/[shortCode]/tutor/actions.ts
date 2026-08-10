"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText, AiUnavailableError } from "@/lib/ai/provider";
import { buildTopicContext } from "@/lib/ai/context";
import { ASK_SYSTEM_PROMPT } from "@/lib/ai/prompts/ask";
import { HINT_SYSTEM_PROMPT } from "@/lib/ai/prompts/hint";
import { getTodayRequestCount } from "@/lib/ai/request-counter";

async function getOrCreateConversation(
  userId: string,
  conversationId: string | null,
  subjectId: string,
  topicId: string,
  mode: "ask" | "hint",
) {
  if (conversationId) {
    return prisma.aiConversation.findUniqueOrThrow({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }
  const created = await prisma.aiConversation.create({
    data: { userId, subjectId, topicId, mode },
  });
  return { ...created, messages: [] };
}

// Metadata only, not the PDF text — the marking guide already gets parsed
// per-question for AI marking (past-papers/[paperId]/actions.ts) and doing
// that again here on every ask-panel message would be a second, heavier
// content pipeline for a general Q&A flow that doesn't need it. Naming the
// paper is enough for "help me with this paper" to land on-topic.
async function buildPaperContext(userId: string, paperId: string): Promise<string> {
  const paper = await prisma.pastPaper.findFirst({
    where: { id: paperId, userId },
    select: { year: true, paperName: true, totalMarks: true, hasMarkingGuide: true },
  });
  if (!paper) return "";

  return `\n\nThe student has this past paper open right now: ${paper.year} ${paper.paperName}. ${
    paper.totalMarks > 0 ? `It's worth ${paper.totalMarks} marks.` : "Its total marks aren't recorded."
  } ${paper.hasMarkingGuide ? "A marking guide is on file for it." : "No marking guide is on file for it."} If their question is about this paper, answer with that paper in mind rather than asking which one they mean.`;
}

export async function askQuestion(
  shortCode: string,
  topicId: string,
  subjectId: string,
  conversationId: string | null,
  question: string,
  paperId?: string | null,
) {
  const user = await requireUser();

  try {
    const conversation = await getOrCreateConversation(
      user.id,
      conversationId,
      subjectId,
      topicId,
      "ask",
    );
    const context = await buildTopicContext(user.id, topicId);
    const paperContext = paperId ? await buildPaperContext(user.id, paperId) : "";

    await prisma.aiMessage.create({
      data: { userId: user.id, conversationId: conversation.id, role: "user", content: question },
    });

    const answer = await generateText([
      { role: "system", content: `${ASK_SYSTEM_PROMPT}\n\n${context}${paperContext}` },
      ...conversation.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: question },
    ]);

    await prisma.aiMessage.create({
      data: { userId: user.id, conversationId: conversation.id, role: "assistant", content: answer },
    });

    return { conversationId: conversation.id, answer, error: null };
  } catch (error) {
    return {
      conversationId,
      answer: null,
      error:
        error instanceof AiUnavailableError
          ? error.message
          : "Something went wrong asking the AI. Try again.",
    };
  }
}

export async function getHint(
  shortCode: string,
  topicId: string,
  subjectId: string,
  conversationId: string | null,
  problem: string,
  level: 1 | 2 | 3 | 4,
) {
  const user = await requireUser();

  try {
    const conversation = await getOrCreateConversation(
      user.id,
      conversationId,
      subjectId,
      topicId,
      "hint",
    );
    const context = await buildTopicContext(user.id, topicId);

    if (level === 1) {
      await prisma.aiMessage.create({
        data: { userId: user.id, conversationId: conversation.id, role: "user", content: problem },
      });
    }

    const hint = await generateText([
      { role: "system", content: `${HINT_SYSTEM_PROMPT}\n\n${context}` },
      { role: "user", content: `Problem: ${problem}\n\nGive level ${level} hint.` },
    ]);

    await prisma.aiMessage.create({
      data: {
        userId: user.id,
        conversationId: conversation.id,
        role: "assistant",
        content: `[Level ${level}] ${hint}`,
      },
    });

    return { conversationId: conversation.id, hint, error: null };
  } catch (error) {
    return {
      conversationId,
      hint: null,
      error:
        error instanceof AiUnavailableError
          ? error.message
          : "Something went wrong getting a hint. Try again.",
    };
  }
}

export async function getRequestCountToday() {
  const user = await requireUser();
  return getTodayRequestCount(user.id);
}
