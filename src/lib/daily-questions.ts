import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/provider";
import { stripJsonFences } from "@/lib/cards";
import { localDateKey } from "@/lib/date";

/**
 * A daily question set per subject.
 *
 * The point is that there is always something to do for every subject, even on
 * a day when the spaced-repetition queue is empty. Cards test recall; these
 * test whether you can actually write an answer, which is what the exam asks
 * for.
 *
 * Sourced from what the app already knows is weak: the active topic first,
 * then anything rated red or amber, then recently mastered topics to keep them
 * warm, then anything flagged needs_review. Never from locked topics.
 */

export type DailyQuestion = {
  topicId: string;
  topicTitle: string;
  question: string;
  marks: number;
  /** What a full-mark answer must contain — shown only after answering. */
  markingPoints: string[];
};

export type DailyResponse = { answer: string; awarded: number; feedback: string };

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 15;

/** Brisbane calendar day, matching every other date boundary in the app. */
export function today(now = new Date()): Date {
  return new Date(`${localDateKey(now)}T00:00:00.000Z`);
}

type Candidate = {
  topicId: string;
  title: string;
  weight: number;
  objectives: string[];
};

/**
 * Which topics today's questions come from, and how heavily each is drawn on.
 *
 * Weights are deliberately coarse — this decides roughly how many questions a
 * topic contributes, and pretending to more precision than that would be
 * false confidence.
 */
async function candidates(userId: string, subjectId: string): Promise<Candidate[]> {
  const topics = await prisma.topic.findMany({
    where: {
      userId,
      unit: { subjectId },
      // Locked topics never appear. Unlocking is the whole progression model.
      unlockState: { in: ["active", "mastered"] },
    },
    include: {
      subtopics: {
        orderBy: { order: "asc" },
        include: { learningObjectives: { select: { text: true, ragStatus: true } } },
      },
    },
    orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
  });

  return topics
    .map((topic) => {
      const objectives = topic.subtopics.flatMap((s) => s.learningObjectives);
      if (objectives.length === 0) return null;

      const red = objectives.filter((o) => o.ragStatus === "red").length;
      const amber = objectives.filter((o) => o.ragStatus === "amber").length;

      let weight = topic.unlockState === "active" ? 3 : 1;
      if (red > 0) weight += 3;
      else if (amber > 0) weight += 1.5;
      if (topic.needsReview) weight += 2;

      return {
        topicId: topic.id,
        title: topic.title,
        weight,
        objectives: objectives.map((o) => o.text),
      };
    })
    .filter((c): c is Candidate => c !== null);
}

export async function generateDailySet(
  userId: string,
  subjectId: string,
): Promise<DailyQuestion[]> {
  const subject = await prisma.subject.findFirstOrThrow({
    where: { id: subjectId, userId },
    select: { name: true },
  });

  const pool = await candidates(userId, subjectId);
  if (pool.length === 0) {
    throw new Error(
      "No unlocked topics with objectives yet — import the syllabus and unlock a topic first.",
    );
  }

  const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);
  const count = Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, pool.length * 3));

  // Allocate at least one question to every candidate topic, then distribute
  // the rest by weight — so a red topic dominates without a green one silently
  // disappearing from rotation entirely.
  const allocation = pool.map((c) => ({
    ...c,
    questions: Math.max(1, Math.round((c.weight / totalWeight) * count)),
  }));

  const response = await generateText(
    [
      {
        role: "system",
        content: `You write short exam-style questions for a Year 12 QCAA General ${subject.name} student.

For each topic below, write the requested number of questions.

Each question must:
- be answerable in writing in 1-4 minutes
- carry a realistic mark allocation (1-6 marks)
- use QCAA command verbs (identify, describe, explain, analyse, evaluate, determine) and be marked accordingly — a 1-mark "identify" is not the same as a 5-mark "evaluate"
- be open-response. No multiple choice
- come from the objectives given, using the syllabus's own terminology
- for anything mathematical, write notation as inline LaTeX between single dollar signs

Also give markingPoints: the specific things a full-mark answer must contain, one string per mark where possible. These are what the answer gets marked against, so be concrete, not "shows understanding".

Return ONLY a JSON array:
[{"topicId": "...", "question": "...", "marks": 3, "markingPoints": ["...", "...", "..."]}]

Use the exact topicId strings given.`,
      },
      {
        role: "user",
        content: allocation
          .map(
            (a) =>
              `topicId: ${a.topicId}\ntopic: ${a.title}\nquestions wanted: ${a.questions}\nobjectives:\n${a.objectives.slice(0, 10).map((o) => `- ${o}`).join("\n")}`,
          )
          .join("\n\n"),
      },
    ],
    { jsonMode: true, maxTokens: 16000 },
  );

  const parsed = JSON.parse(stripJsonFences(response)) as DailyQuestion[];
  const byId = new Map(pool.map((c) => [c.topicId, c]));

  return parsed
    .filter((q) => byId.has(q.topicId) && typeof q.question === "string")
    .slice(0, MAX_QUESTIONS)
    .map((q) => ({
      topicId: q.topicId,
      topicTitle: byId.get(q.topicId)!.title,
      question: q.question,
      marks: Number.isFinite(q.marks) ? Math.max(1, Math.min(10, Math.round(q.marks))) : 2,
      markingPoints: Array.isArray(q.markingPoints) ? q.markingPoints : [],
    }));
}

/** Today's set, generated on first request and reused after. */
export async function getOrCreateTodaysSet(userId: string, subjectId: string) {
  const date = today();
  const existing = await prisma.dailyQuestionSet.findUnique({
    where: { userId_subjectId_date: { userId, subjectId, date } },
  });
  if (existing) return existing;

  const questions = await generateDailySet(userId, subjectId);
  return prisma.dailyQuestionSet.create({
    data: { userId, subjectId, date, questions },
  });
}

/**
 * Marks a completed set against the marking points.
 *
 * A blank answer scores zero and is told so plainly. Marking generously would
 * make the whole thing decorative.
 */
export async function markDailySet(
  userId: string,
  setId: string,
  answers: string[],
): Promise<{ awarded: number; available: number; responses: DailyResponse[] }> {
  const set = await prisma.dailyQuestionSet.findFirstOrThrow({
    where: { id: setId, userId },
    include: { subject: { select: { name: true } } },
  });
  const questions = set.questions as unknown as DailyQuestion[];

  const response = await generateText(
    [
      {
        role: "system",
        content: `You are marking a Year 12 QCAA General ${set.subject.name} student's answers against the marking points given.

For each question award a whole number of marks from 0 to the marks available, based strictly on which marking points the answer actually covers. A blank or "I don't know" answer scores 0.

Give one or two sentences of feedback addressed to the student as "you", naming the marking points they missed. No praise padding. If they got full marks, say what they did well in one clause and stop.

Return ONLY a JSON array, one entry per question in the same order:
[{"awarded": 2, "feedback": "..."}]`,
      },
      {
        role: "user",
        content: questions
          .map(
            (q, i) =>
              `Q${i + 1} (${q.marks} marks): ${q.question}\nMarking points:\n${q.markingPoints.map((p) => `- ${p}`).join("\n")}\nStudent answer: ${answers[i]?.trim() || "(no answer given)"}`,
          )
          .join("\n\n"),
      },
    ],
    { jsonMode: true, maxTokens: 8000 },
  );

  const marked = JSON.parse(stripJsonFences(response)) as { awarded: number; feedback: string }[];

  const responses: DailyResponse[] = questions.map((q, i) => ({
    answer: answers[i] ?? "",
    awarded: Math.max(0, Math.min(q.marks, Math.round(marked[i]?.awarded ?? 0))),
    feedback: marked[i]?.feedback ?? "",
  }));

  const awarded = responses.reduce((sum, r) => sum + r.awarded, 0);
  const available = questions.reduce((sum, q) => sum + q.marks, 0);

  await prisma.dailyQuestionSet.update({
    where: { id: setId },
    data: { responses, completedAt: new Date(), scoreAwarded: awarded, scoreAvailable: available },
  });

  return { awarded, available, responses };
}
