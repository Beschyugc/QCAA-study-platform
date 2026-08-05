import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/provider";
import { stripJsonFences } from "@/lib/cards";
import { qcaaSystemPrompt } from "@/lib/ai/prompts/qcaa";

/**
 * Placement: work out what Beschy already knows, per topic, so the app stops
 * guessing.
 *
 * Everything else keys off the red/amber/green rating — the recommendation
 * engine scores on proportionRedAmber, the daily card target scales with it,
 * the coach reads it. But a rating you set by feel before you've tested
 * yourself is just a mood. This produces one grounded in answers.
 *
 * Deliberately covers LOCKED topics too. The point is to find out where he
 * actually is, and he may well already know the first few topics of a subject
 * — that can't be discovered by only asking about the one topic that happens
 * to be unlocked.
 */

export type PlacementQuestion = {
  topicId: string;
  topicTitle: string;
  unitNumber: number;
  question: string;
};

export type PlacementResult = {
  topicId: string;
  topicTitle: string;
  rag: "red" | "amber" | "green";
  verdict: string;
};

/** Questions per topic. Two is enough to separate "knows it" from "doesn't"
 *  without turning a diagnostic into an exam nobody finishes. */
const QUESTIONS_PER_TOPIC = 2;

export async function buildPlacementQuestions(
  userId: string,
  shortCode: string,
): Promise<PlacementQuestion[]> {
  const subject = await prisma.subject.findFirst({
    where: { userId, shortCode },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          topics: {
            orderBy: { order: "asc" },
            include: {
              subtopics: {
                orderBy: { order: "asc" },
                include: { learningObjectives: { select: { text: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!subject) throw new Error("Subject not found");

  const topics = subject.units.flatMap((unit) =>
    unit.topics.map((topic) => ({
      id: topic.id,
      unitNumber: unit.number,
      title: topic.title,
      objectives: topic.subtopics.flatMap((s) => s.learningObjectives.map((o) => o.text)),
    })),
  );
  const usable = topics.filter((t) => t.objectives.length > 0);
  if (usable.length === 0) throw new Error("No syllabus objectives to build questions from");

  const response = await generateText(
    [
      {
        role: "system",
        content: `${qcaaSystemPrompt(`Your job right now: write a placement diagnostic for ${subject.name}, to find out which topics he already knows.`)}

Write exactly ${QUESTIONS_PER_TOPIC} questions per topic.

Each question must:
- be answerable in two or three sentences, or a short calculation
- test whether the student genuinely understands the topic, not whether they can recall one term
- be open-response. No multiple choice, no yes/no
- use the syllabus's own terminology

Return ONLY a JSON array:
[{"topicId": "...", "question": "..."}]

Use the exact topicId strings given. ${QUESTIONS_PER_TOPIC} entries per topicId.`,
      },
      {
        role: "user",
        content: usable
          .map(
            (t) =>
              `topicId: ${t.id}\ntopic: U${t.unitNumber} ${t.title}\nobjectives:\n${t.objectives
                .slice(0, 12)
                .map((o) => `- ${o}`)
                .join("\n")}`,
          )
          .join("\n\n"),
      },
    ],
    { jsonMode: true, maxTokens: 16000 },
  );

  const parsed = JSON.parse(stripJsonFences(response)) as { topicId: string; question: string }[];
  const byId = new Map(usable.map((t) => [t.id, t]));

  // Drop anything referencing a topic that isn't in this subject — a
  // hallucinated id must not become a question about nothing.
  return parsed
    .filter((q) => byId.has(q.topicId) && typeof q.question === "string")
    .map((q) => {
      const topic = byId.get(q.topicId)!;
      return {
        topicId: q.topicId,
        topicTitle: topic.title,
        unitNumber: topic.unitNumber,
        question: q.question,
      };
    });
}

/**
 * Marks the answers and turns them into per-topic ratings.
 *
 * A skipped answer is treated as red, not ignored — "I don't know" is the most
 * informative answer in a diagnostic, and dropping it would quietly flatter
 * the result.
 */
export async function gradePlacement(
  userId: string,
  shortCode: string,
  answers: { topicId: string; question: string; answer: string }[],
): Promise<PlacementResult[]> {
  const subject = await prisma.subject.findFirst({ where: { userId, shortCode } });
  if (!subject) throw new Error("Subject not found");

  const topicIds = [...new Set(answers.map((a) => a.topicId))];
  const topics = await prisma.topic.findMany({
    where: { id: { in: topicIds }, userId },
    select: { id: true, title: true },
  });
  const titleById = new Map(topics.map((t) => [t.id, t.title]));

  const response = await generateText(
    [
      {
        role: "system",
        content: `${qcaaSystemPrompt(`Your job right now: mark a ${subject.name} placement diagnostic, to work out how well he knows each topic.`)}

For each topicId, judge the answers given and return one rating:
- "green": answers are correct and show real understanding. Needs revision only.
- "amber": partially right, or right but shallow, or one of two answers wrong. Needs work.
- "red": wrong, blank, or "I don't know". Needs teaching from the start.

Blank or "I don't know" answers are red. Do not be generous — an inflated rating means the student wastes weeks studying the wrong thing.

Also give a one-sentence verdict per topic, addressed to the student as "you", specific about what they did or didn't show. No praise padding.

Return ONLY a JSON array:
[{"topicId": "...", "rag": "red|amber|green", "verdict": "..."}]`,
      },
      {
        role: "user",
        content: answers
          .map(
            (a) =>
              `topicId: ${a.topicId}\nQ: ${a.question}\nA: ${a.answer.trim() || "(no answer given)"}`,
          )
          .join("\n\n"),
      },
    ],
    { jsonMode: true, maxTokens: 8000 },
  );

  const parsed = JSON.parse(stripJsonFences(response)) as PlacementResult[];
  return parsed
    .filter((r) => titleById.has(r.topicId) && ["red", "amber", "green"].includes(r.rag))
    .map((r) => ({ ...r, topicTitle: titleById.get(r.topicId)! }));
}

/** Writes the placement ratings onto the objectives, where everything reads them. */
export async function applyPlacement(userId: string, results: PlacementResult[]): Promise<void> {
  const now = new Date();
  await prisma.$transaction(
    results.map((r) =>
      prisma.learningObjective.updateMany({
        where: { userId, subtopic: { topicId: r.topicId } },
        data: { ragStatus: r.rag, ragUpdatedAt: now },
      }),
    ),
  );
}
