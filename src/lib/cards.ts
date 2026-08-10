import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/provider";
import { initialState } from "@/lib/srs/sm2";
import { qcaaSystemPrompt, QCAA_COMPLEXITY_BANDS } from "@/lib/ai/prompts/qcaa";

export type ComplexityBand = "simple_familiar" | "complex_familiar" | "complex_unfamiliar";

export type DraftCard = {
  front: string;
  back: string;
  cardType: "basic" | "cloze";
  complexity?: ComplexityBand;
};

/**
 * How many cards a topic gets, per band.
 *
 * Scaled off the objective count, which is the honest measure of how much
 * content the topic actually has. The split follows the shape of a real QCAA
 * paper (roughly 60/20/20) rather than an even spread — a deck that is a third
 * complex_unfamiliar trains for an exam that does not exist.
 *
 * The old single target of 8-24 per topic is what left Methods with 8 cards on
 * some topics. These are deliberately several times larger.
 */
export function bandTargetsFor(objectiveCount: number): Record<ComplexityBand, number> {
  const total = Math.max(24, Math.min(72, Math.round(objectiveCount * 3.2)));
  return {
    simple_familiar: Math.round(total * 0.55),
    complex_familiar: Math.round(total * 0.28),
    complex_unfamiliar: Math.round(total * 0.17),
  };
}

/** Retained for callers that still want one number for a topic. */
export function cardTargetFor(objectiveCount: number): number {
  const t = bandTargetsFor(objectiveCount);
  return t.simple_familiar + t.complex_familiar + t.complex_unfamiliar;
}

/**
 * What kind of question to write, per band.
 *
 * Without this the model writes the same shape of card forty times — a
 * definition with the term on the front. Variety has to be asked for
 * explicitly, and the useful variety is different at each band.
 */
const QUESTION_TYPES: Record<ComplexityBand, string> = {
  simple_familiar: `Rotate deliberately through these shapes, roughly evenly:
- Definition: term on the front, precise meaning on the back (and sometimes reversed — meaning on the front, "what is this called?").
- State-the-rule: a law, formula, standard result or condition, recalled exactly.
- One-step application: a single substitution or a single routine operation with a definite answer.
- Label / identify: name the structure, stage, part or category being described.
- Sequence: put the steps or stages of a known process in order.`,

  complex_familiar: `Rotate deliberately through these shapes, roughly evenly:
- Multi-step calculation: three or more steps, answer with units. Put the full working on the back, not just the result.
- Select-the-method: give a scenario where more than one approach looks plausible and ask which applies and why.
- Mechanism: "explain why X leads to Y" — the back must contain an actual causal chain, not a description.
- Compare or contrast: two named things addressed against each other on stated criteria.
- Data interpretation: a small table or set of values in the front, asking what it shows. Refer to the actual numbers on the back.`,

  complex_unfamiliar: `Rotate deliberately through these shapes:
- Novel scenario: a context the syllabus never mentions, requiring content it does. Real, plausible situations — not "imagine a planet where".
- Synthesis: a question only answerable by combining two different parts of the course. Name both on the back.
- Evaluate or justify: a claim to judge, with criteria. The back must make a judgement AND support it — either alone scores nothing.
- Error-spotting: a worked solution or an argument containing one specific flaw. The back identifies the flaw, explains why it is wrong, and gives the correction.
- Devise: ask the student to design an approach, experiment or strategy, with the back giving what a full-mark response must contain.`,
};

/** How tight a card should be. An atomic-recall rule ruins a complex question. */
const CARD_SHAPE: Record<ComplexityBand, string> = {
  simple_familiar:
    "Atomic — one fact, definition, relationship or step per card, never a paragraph. Front is a question; back is the answer and nothing else.",
  complex_familiar:
    "A short exam-style question. State a mark allocation in the front like (3 marks). The back gives the full working or the distinct scoring points, one per mark, named explicitly.",
  complex_unfamiliar:
    "A proper exam question with a stated context and a mark allocation (typically 4-8 marks). The back is a model response plus an explicit list of the marking points a grader would award. Length follows the marks — do not pad.",
};

/**
 * Drafts cards for one topic at ONE complexity band.
 *
 * Split per band rather than asking for a mixed batch in a single call, for
 * two reasons. A mixed request drifts — the model settles into whichever band
 * it started with and the "20% complex_unfamiliar" quietly becomes 5%. And a
 * 50-card topic in one response overruns the token ceiling and comes back as
 * truncated, unparseable JSON, which is the bug that made this script look
 * like it was choking on bad PDFs.
 *
 * `avoid` carries the fronts of cards that already exist for the topic. This
 * matters a great deal now that the imported Anki deck covers Biology and
 * Psychology recall densely — without it, a generation run would produce
 * hundreds of near-duplicate definition cards.
 */
export async function draftCardsForBand(
  subjectName: string,
  topicTitle: string,
  objectives: string[],
  band: ComplexityBand,
  target: number,
  avoid: string[] = [],
): Promise<DraftCard[]> {
  if (target <= 0) return [];

  // Enough to steer away from duplicates without burning the context window
  // on a 900-card Biology topic.
  const avoidBlock =
    avoid.length > 0
      ? `\n\nCards for this topic that ALREADY EXIST. Do not rewrite, rephrase or re-test any of these — cover what they miss:\n${avoid
          .slice(0, 120)
          .map((f) => `- ${f.replace(/\s+/g, " ").slice(0, 120)}`)
          .join("\n")}`
      : "";

  const response = await generateText(
    [
      {
        role: "system",
        content: `${qcaaSystemPrompt(`Your job right now: write flashcards for ${subjectName}, on the topic "${topicTitle}".`)}

${QCAA_COMPLEXITY_BANDS}

Write exactly ${target} cards, ALL at the ${band} band, covering the syllabus objectives given in proportion to their weight.

Shape of a ${band} card:
${CARD_SHAPE[band]}

${QUESTION_TYPES[band]}

Rules:
- Every card must be answerable from the objectives given. Do not reach beyond them.
- Test recall or understanding, not recognition. No yes/no, no "which of these".
- Vary the question stem. Forty cards that all begin "What is..." is a failed batch.
- Prefer "basic" (front = question, back = answer). Use "cloze" only where a fill-in-the-blank genuinely tests it better; put {{c1::the answer}} inline in the front and repeat the full sentence on the back.
- Use the syllabus's own terminology — that is the wording the exam will use.
- No card may reference "the syllabus", "the objective" or "the above". Each card stands alone.
- Write ALL mathematical notation as inline LaTeX between single dollar signs:
  $e^{2x}$, $\\frac{dy}{dx}$, $\\lim_{h \\to 0}$. Never ASCII substitutes like
  "a^h", "(x+h)/h" or "-->". Ordinary prose stays plain — dollars are for
  maths only.
${
  band === "complex_unfamiliar"
    ? `
This band is the hard one to fake. If this topic genuinely cannot support ${target} questions in a NEW context — some content is definitional and no amount of framing makes it unfamiliar — return fewer cards rather than dressing up familiar questions in a thin scenario. A short honest batch is worth more than a padded one.`
    : ""
}${avoidBlock}

Respond with ONLY a valid JSON array:
[{"front": "...", "back": "...", "cardType": "basic"}]`,
      },
      { role: "user", content: objectives.map((o, i) => `${i + 1}. ${o}`).join("\n") },
    ],
    // Complex bands carry model answers and marking points, so they run far
    // longer per card than a definition.
    { jsonMode: true, maxTokens: band === "simple_familiar" ? 16000 : 24000 },
  );

  const parsed = parseCardJson(response);
  return parsed
    .filter(
      (c) => c && typeof c.front === "string" && typeof c.back === "string" && c.front.trim() !== "",
    )
    .map((c) => ({ ...c, complexity: band }));
}

/** Claude wraps JSON in ```json fences even when told not to. */
export function stripJsonFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

/**
 * Escapes raw control characters that appear INSIDE JSON string literals.
 *
 * JSON forbids a literal newline inside a string, but a model writing a
 * multi-line model answer emits exactly that:
 *
 *     {"back": "Marking points:
 *     - Apply P(0) = -500 — 1 mark"}
 *
 * which `JSON.parse` rejects with "Bad control character in string literal".
 * Two complex_unfamiliar batches were lost to this on the first real run —
 * the longer the answer, the likelier it is, so it hits the highest-value
 * cards hardest.
 *
 * Tracks whether it is inside a string and respects backslash escapes, so a
 * newline between fields (legal, and how the JSON is formatted) is untouched
 * while one inside a value gets escaped.
 */
export function escapeControlCharsInStrings(s: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (const ch of s) {
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        out +=
          ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : ch === "\t" ? "\\t"
          : `\\u${code.toString(16).padStart(4, "0")}`;
        continue;
      }
    }
    out += ch;
  }
  return out;
}

/**
 * Parses a model's JSON array, repairing unescaped control characters only if
 * the strict parse fails. Repair-second rather than repair-always: valid JSON
 * should never be touched.
 */
export function parseCardJson(response: string): DraftCard[] {
  const cleaned = stripJsonFences(response);
  try {
    return JSON.parse(cleaned) as DraftCard[];
  } catch {
    return JSON.parse(escapeControlCharsInStrings(cleaned)) as DraftCard[];
  }
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
    complexity: card.complexity ?? null,
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

/**
 * Fronts of the cards a topic already has, to feed `draftCardsForBand`'s
 * `avoid` list. Capped, because a Biology topic can hold several hundred
 * imported Anki cards and the prompt only needs enough to establish what
 * ground is already covered.
 */
export async function existingFrontsForTopic(
  userId: string,
  topicId: string,
  limit = 120,
): Promise<string[]> {
  const cards = await prisma.card.findMany({
    where: { userId, topicId },
    select: { front: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return cards.map((c) => c.front);
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
