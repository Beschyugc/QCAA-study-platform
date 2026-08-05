import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/provider";
import { initialState } from "@/lib/srs/sm2";
import { qcaaSystemPrompt } from "@/lib/ai/prompts/qcaa";

export type DraftCard = { front: string; back: string; cardType: "basic" | "cloze" };

/**
 * How many cards a topic gets. The brief asks for 10-20 a day per subject, so
 * a topic needs enough cards to sustain that without the same handful
 * recycling every session — but generating hundreds from a thin topic just
 * produces padding.
 *
 * Scaled off the objective count, which is the honest measure of how much
 * content the topic actually has.
 */
export function cardTargetFor(objectiveCount: number): number {
  return Math.max(8, Math.min(24, Math.round(objectiveCount * 1.2)));
}

/**
 * Drafts cards for one topic from its real syllabus objectives.
 *
 * The objectives are the QCAA wording, so the cards test what's actually
 * assessed rather than a paraphrase of a paraphrase.
 */
export async function draftCardsForTopic(
  subjectName: string,
  topicTitle: string,
  objectives: string[],
  target: number,
): Promise<DraftCard[]> {
  const response = await generateText(
    [
      {
        role: "system",
        content: `${qcaaSystemPrompt(`Your job right now: write flashcards for ${subjectName}, on the topic "${topicTitle}".`)}

Write exactly ${target} cards covering the syllabus objectives given, in proportion to their weight.

Rules:
- Atomic: one fact, definition, relationship or step per card. Never a paragraph.
- Test recall or understanding, not recognition. Avoid yes/no and "which of these" phrasing.
- Prefer "basic" (front = question, back = answer).
- Use "cloze" only where a fill-in-the-blank genuinely tests it better; put {{c1::the answer}} inline in the front, and repeat the full sentence on the back.
- For calculations, put the method on the back, not just a number.
- Use the syllabus's own terminology — this is what the exam will use.
- No card may reference "the syllabus", "the objective" or "the above".
- Write ALL mathematical notation as inline LaTeX between single dollar signs:
  $e^{2x}$, $\\frac{dy}{dx}$, $\\lim_{h \\to 0}$. Never ASCII substitutes like
  "a^h", "(x+h)/h" or "-->". Ordinary prose stays plain — dollars are for
  maths only.

Respond with ONLY a valid JSON array:
[{"front": "...", "back": "...", "cardType": "basic"}]`,
      },
      { role: "user", content: objectives.map((o, i) => `${i + 1}. ${o}`).join("\n") },
    ],
    // A 24-card batch runs past the 8k default and comes back as truncated,
    // unparseable JSON.
    { jsonMode: true, maxTokens: 16000 },
  );

  const parsed = JSON.parse(stripJsonFences(response)) as DraftCard[];
  return parsed.filter(
    (c) => c && typeof c.front === "string" && typeof c.back === "string" && c.front.trim() !== "",
  );
}

/** Claude wraps JSON in ```json fences even when told not to. */
export function stripJsonFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

/**
 * Bulk-inserts cards and their initial SRS scheduling.
 *
 * Two statements, not two per card. The previous per-card loop inside a
 * transaction was ~50 round trips for a 25-card batch, which against remote
 * Supabase overran Prisma's 5s interactive-transaction ceiling and rolled the
 * whole thing back — the same failure that made two syllabuses unimportable.
 */
export async function saveCards(
  userId: string,
  subjectId: string,
  topicId: string,
  cards: DraftCard[],
  tags: string[],
): Promise<number> {
  if (cards.length === 0) return 0;

  const init = initialState();
  const rows = cards.map((card) => ({
    id: randomUUID(),
    userId,
    subjectId,
    topicId,
    cardType: card.cardType === "cloze" ? ("cloze" as const) : ("basic" as const),
    front: card.front,
    back: card.back,
    tags,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.card.createMany({ data: rows });
    await tx.cardScheduling.createMany({
      data: rows.map((r) => ({
        userId,
        cardId: r.id,
        // Due immediately: a newly generated card is new, and the SRS
        // scheduler decides from there.
        dueDate: new Date(),
        intervalDays: init.intervalDays,
        easeFactor: init.easeFactor,
        repetitions: init.repetitions,
        lapses: init.lapses,
        learningStep: init.learningStep,
        state: init.state,
      })),
    });
  });

  return rows.length;
}

/** Objectives for a topic, in syllabus order, as plain strings. */
export async function objectivesForTopic(userId: string, topicId: string): Promise<string[]> {
  const subtopics = await prisma.subtopic.findMany({
    where: { userId, topicId },
    orderBy: { order: "asc" },
    include: { learningObjectives: { orderBy: { createdAt: "asc" }, select: { text: true } } },
  });
  return subtopics
    .flatMap((s) => s.learningObjectives.map((o) => o.text))
    .filter((t) => t.trim() !== "");
}
