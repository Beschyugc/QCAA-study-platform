import { prisma } from "@/lib/prisma";
import { generateText, AiUnavailableError } from "@/lib/ai/provider";
import { stripJsonFences } from "@/lib/cards";
import { qcaaSystemPrompt, QCAA_COMPLEXITY_BANDS } from "@/lib/ai/prompts/qcaa";
import {
  buildBlueprint,
  hardnessPrior,
  ragFromScores,
  refineHardness,
  type BlueprintItem,
  type BlueprintObjective,
  type ComplexityBand,
  type QuestionFormat,
} from "@/lib/placement-blueprint";

/**
 * Placement: work out what Beschy already knows, dot point by dot point, so
 * the app stops guessing.
 *
 * Everything else keys off the red/amber/green rating — the recommendation
 * engine scores on proportionRedAmber, the daily card target scales with it,
 * the coach reads it. But a rating you set by feel before you've tested
 * yourself is just a mood. This produces one grounded in answers.
 *
 * This used to ask two open questions per TOPIC: about a dozen questions for a
 * whole subject, and a rating stamped identically across every objective
 * underneath. That could tell him "you're amber on Cells" and nothing more —
 * which is not a level, it's a vibe with a colour. The paper it builds now
 * covers every syllabus dot point, in multiple choice, short response and
 * extended response, sized to a real 60-90 minute sitting, and rates each dot
 * point on its own evidence. placement-blueprint.ts decides the shape of the
 * paper; this file gets the model to write it and mark it.
 *
 * Deliberately covers LOCKED topics too. The point is to find out where he
 * actually is, and he may well already know the first few topics of a subject
 * — that can't be discovered by only asking about the one topic that happens
 * to be unlocked.
 */

export type PlacementResult = {
  topicId: string;
  topicTitle: string;
  rag: "red" | "amber" | "green";
  verdict: string;
};

export type ExamQuestion = {
  /** Stable within the paper. Answers key off it. */
  id: string;
  format: QuestionFormat;
  topicId: string;
  topicTitle: string;
  unitNumber: number;
  subtopicTitle: string;
  /** The syllabus dot points this question is evidence about. */
  objectiveIds: string[];
  marks: number;
  band: ComplexityBand;
  /** Data table, scenario or source the question refers to. Markdown. */
  stimulus: string | null;
  question: string;
  /** Multiple choice only. */
  options: string[] | null;
  correctIndex: number | null;
  /** Written responses only: what a full-mark answer has to contain. */
  markingPoints: string[];
};

export type PlacementExam = {
  shortCode: string;
  subjectName: string;
  questions: ExamQuestion[];
  totalMarks: number;
  estimatedMinutes: number;
  /** Dot points asked about / dot points in the subject. */
  coverage: { covered: number; total: number };
  /** How many questions fell back to raw syllabus wording because the model
   *  didn't return a usable one. Shown, not hidden — a paper quietly padded
   *  with "explain this dot point" is worth knowing about. */
  unwritten: number;
};

export type ExamAnswer = {
  id: string;
  /** Written response text. Empty for an unanswered question. */
  text: string;
  /** Chosen option index for multiple choice, or null. */
  choice: number | null;
};

export type ExamMark = {
  id: string;
  awarded: number;
  marks: number;
  feedback: string;
};

export type ObjectiveRating = {
  objectiveId: string;
  text: string;
  topicId: string;
  rag: "red" | "amber" | "green";
};

export type ExamResult = {
  awarded: number;
  available: number;
  marks: ExamMark[];
  objectives: ObjectiveRating[];
  topics: PlacementResult[];
};

// ---------------------------------------------------------------------------
// Building the paper
// ---------------------------------------------------------------------------

type LoadedObjective = BlueprintObjective & {
  text: string;
  topicTitle: string;
  unitNumber: number;
  subtopicTitle: string;
};

async function loadObjectives(userId: string, shortCode: string) {
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
                include: {
                  learningObjectives: {
                    orderBy: { createdAt: "asc" },
                    select: { id: true, text: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!subject) throw new Error("Subject not found");

  const objectives: LoadedObjective[] = [];
  let order = 0;
  for (const unit of subject.units) {
    for (const topic of unit.topics) {
      for (const subtopic of topic.subtopics) {
        for (const objective of subtopic.learningObjectives) {
          objectives.push({
            objectiveId: objective.id,
            topicId: topic.id,
            subtopicId: subtopic.id,
            order: order++,
            hardness: hardnessPrior(objective.text, subtopic.title),
            text: objective.text,
            topicTitle: topic.title,
            unitNumber: unit.number,
            subtopicTitle: subtopic.title,
          });
        }
      }
    }
  }
  return { subject, objectives };
}

/**
 * Asks the model how hard QCAA actually gets on each dot point.
 *
 * This is the part the syllabus wording can't tell you. Two dot points can
 * both say "explain" and one of them turns up as a 9-mark extended response
 * every second year while the other has never been more than a two-marker.
 * The model has read the papers; the verb-based prior hasn't.
 *
 * Best-effort about its OWN answer: garbled JSON, a missing dot point, a
 * number outside 0-1 — the priors stand and the paper is still built. Losing
 * the refinement makes the paper slightly less well-aimed, which is a bad
 * trade for refusing to build one at all.
 *
 * But an AiUnavailableError is rethrown, because it means no model is coming
 * for the question-writing pass either. Swallowing it would hand back 45
 * questions of raw syllabus wording, no multiple choice, and no clue anything
 * had gone wrong — when there is a perfectly good no-AI path (the flashcard
 * self-report below) that the UI only knows to offer if it sees this error.
 */
async function refineWithModel(
  subjectName: string,
  objectives: LoadedObjective[],
): Promise<LoadedObjective[]> {
  // Short local codes rather than UUIDs: 90 uuids is a couple of thousand
  // wasted tokens and 90 more chances to mangle one.
  const codeOf = new Map(objectives.map((o, i) => [o.objectiveId, `o${i + 1}`]));
  const byCode = new Map(objectives.map((o, i) => [`o${i + 1}`, o]));

  try {
    const response = await generateText(
      [
        {
          role: "system",
          content: `${qcaaSystemPrompt(`Your job right now: judge how demanding QCAA external assessment actually is on each ${subjectName} syllabus dot point.`)}

${QCAA_COMPLEXITY_BANDS}

For each dot point, give "hard": a number from 0 to 1 — the share of the assessment QCAA sets on that dot point that lands in the complex_familiar or complex_unfamiliar bands, judged from how it has actually been examined.

0.1 means it shows up as a one-mark recall item and nothing more. 0.9 means it is regularly the extended response, or the multi-step problem that separates the top band.

Judge the assessment, not the content. An obscure term that is only ever defined is still low.

Return ONLY a JSON array, one entry per dot point given:
[{"id": "o1", "hard": 0.4}]`,
        },
        {
          role: "user",
          content: objectives
            .map((o) => `${codeOf.get(o.objectiveId)} [${o.subtopicTitle}] ${o.text}`)
            .join("\n"),
        },
      ],
      { jsonMode: true, maxTokens: 8000 },
    );

    const parsed = JSON.parse(stripJsonFences(response)) as { id: string; hard: number }[];
    const estimates = new Map<string, number>();
    for (const row of Array.isArray(parsed) ? parsed : []) {
      if (byCode.has(row?.id)) estimates.set(row.id, Number(row.hard));
    }
    return objectives.map((o, i) => ({
      ...o,
      hardness: refineHardness(o.hardness, estimates.get(`o${i + 1}`)),
    }));
  } catch (error) {
    if (error instanceof AiUnavailableError) throw error;
    return objectives;
  }
}

/** Runs jobs a few at a time. One batch per topic is a lot of calls to fire at
 *  once, and a rate limit halfway through loses the whole paper. */
async function inBatches<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>) {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    out.push(...(await Promise.all(items.slice(i, i + limit).map(run))));
  }
  return out;
}

const FORMAT_BRIEF: Record<QuestionFormat, string> = {
  mcq: `MULTIPLE CHOICE (1 mark)
- One question, then exactly four options.
- Exactly one option is defensibly correct. The other three must be real misconceptions a Year 12 student holds — a swapped cause and effect, the right idea at the wrong scale, the neighbouring term. Never filler, never obviously absurd, never "all of the above".
- Options are one line each and roughly the same length, so length doesn't give the answer away.
- Vary which position the answer sits in across the paper.
- markingPoints: [].`,
  short: `SHORT RESPONSE
- Answerable in 2-5 sentences or a short calculation, in about the marks-in-minutes it carries.
- Open the question with a QCAA cognitive verb and mark it accordingly.
- markingPoints: one per mark, concrete enough to mark against. Not "shows understanding".
- options: null, correctIndex: null.`,
  extended: `EXTENDED RESPONSE
- A stimulus (a short scenario, data set or source) plus a question demanding a position and sustained reasoning across the dot points listed.
- Must genuinely require every dot point given — this is the question that tests whether he can connect them.
- markingPoints: one per mark, covering the content points AND the judgement/conclusion the verb demands.
- options: null, correctIndex: null.`,
};

async function writeQuestions(
  subjectName: string,
  items: BlueprintItem[],
  objectiveById: Map<string, LoadedObjective>,
): Promise<Map<string, Partial<ExamQuestion>>> {
  const written = new Map<string, Partial<ExamQuestion>>();

  // One call per topic. A single call for the whole paper would be 45
  // questions of JSON in one response, which is where truncation lives.
  const byTopic = new Map<string, BlueprintItem[]>();
  for (const item of items) {
    const list = byTopic.get(item.topicId) ?? [];
    list.push(item);
    byTopic.set(item.topicId, list);
  }

  await inBatches([...byTopic.values()], 3, async (batch) => {
    const topicTitle = objectiveById.get(batch[0].objectiveIds[0])?.topicTitle ?? "";
    try {
      const response = await generateText(
        [
          {
            role: "system",
            content: `${qcaaSystemPrompt(`Your job right now: write part of a full-length ${subjectName} placement exam, covering the topic "${topicTitle}". It is sat under exam conditions, so every question has to be answerable from the paper alone.`)}

${QCAA_COMPLEXITY_BANDS}

You are given one entry per question, with the format to write it in, the QCAA difficulty band to pitch it at, the marks it carries, and the syllabus dot points it must test. Write every one.

${FORMAT_BRIEF.mcq}

${FORMAT_BRIEF.short}

${FORMAT_BRIEF.extended}

Rules for all of them:
- Test the dot points given, and nothing outside them.
- Where several dot points are listed, ONE question must cover all of them together. Do not write a question about the first and ignore the rest.
- Pitch it at the band given. A simple_familiar question states everything needed; a complex_unfamiliar one puts known content in a context he has not met.
- Use the syllabus's own terminology. Australian spelling.
- "stimulus" is a string when the question needs data, a scenario or a source to refer to, otherwise null. Use a markdown table for data.

Return ONLY a JSON array, one entry per id given:
[{"id": "q3", "question": "...", "stimulus": null, "options": ["...","...","...","..."], "correctIndex": 1, "markingPoints": []}]`,
          },
          {
            role: "user",
            content: batch
              .map((item) => {
                const points = item.objectiveIds
                  .map((id) => `  - ${objectiveById.get(id)?.text ?? ""}`)
                  .join("\n");
                const subtopic = objectiveById.get(item.objectiveIds[0])?.subtopicTitle ?? "";
                return `id: ${item.id}\nformat: ${item.format}\nband: ${item.band}\nmarks: ${item.marks}\nsubtopic: ${subtopic}\ndot points:\n${points}`;
              })
              .join("\n\n"),
          },
        ],
        { jsonMode: true, maxTokens: 16000 },
      );

      const parsed = JSON.parse(stripJsonFences(response)) as Partial<ExamQuestion>[];
      for (const row of Array.isArray(parsed) ? parsed : []) {
        if (typeof row?.id === "string") written.set(row.id, row);
      }
    } catch {
      // This topic's questions fall back to syllabus wording. One failed batch
      // must not take the other topics down with it.
    }
  });

  return written;
}

/**
 * Turns a blueprint slot plus whatever the model returned into a question that
 * is definitely answerable.
 *
 * A multiple-choice question with three options, or one whose correctIndex
 * points past the end of the list, is worse than no question — it produces a
 * confident wrong rating. Anything that doesn't validate becomes a written
 * response against the syllabus wording instead, which is always answerable
 * and always honest about what it's asking.
 */
export type ObjectiveContext = {
  text: string;
  topicTitle: string;
  unitNumber: number;
  subtopicTitle: string;
};

export function assembleQuestion(
  item: BlueprintItem,
  raw: Partial<ExamQuestion> | undefined,
  objectiveById: Map<string, ObjectiveContext>,
): { question: ExamQuestion; unwritten: boolean } {
  const objectives = item.objectiveIds.map((id) => objectiveById.get(id)!).filter(Boolean);
  const first = objectives[0];
  const base = {
    id: item.id,
    topicId: item.topicId,
    topicTitle: first?.topicTitle ?? "",
    unitNumber: first?.unitNumber ?? 0,
    subtopicTitle: first?.subtopicTitle ?? "",
    objectiveIds: item.objectiveIds,
    band: item.band,
  };

  const options = Array.isArray(raw?.options) ? raw.options.filter((o) => typeof o === "string") : [];
  const correctIndex = Number(raw?.correctIndex);
  const questionText = typeof raw?.question === "string" ? raw.question.trim() : "";
  const markingPoints = Array.isArray(raw?.markingPoints)
    ? raw.markingPoints.filter((p): p is string => typeof p === "string")
    : [];
  const stimulus = typeof raw?.stimulus === "string" && raw.stimulus.trim() ? raw.stimulus : null;

  const mcqUsable =
    item.format === "mcq" &&
    questionText !== "" &&
    options.length >= 3 &&
    Number.isInteger(correctIndex) &&
    correctIndex >= 0 &&
    correctIndex < options.length;

  if (mcqUsable) {
    return {
      unwritten: false,
      question: {
        ...base,
        format: "mcq",
        marks: 1,
        stimulus,
        question: questionText,
        options,
        correctIndex,
        markingPoints: [],
      },
    };
  }

  const writtenUsable = item.format !== "mcq" && questionText !== "" && markingPoints.length > 0;
  if (writtenUsable) {
    return {
      unwritten: false,
      question: {
        ...base,
        format: item.format,
        marks: item.marks,
        stimulus,
        question: questionText,
        options: null,
        correctIndex: null,
        markingPoints,
      },
    };
  }

  // Fallback: the syllabus statement, asked directly. It is what the exam will
  // demand of him in those words, so it is never a wasted question — it just
  // isn't dressed up as one.
  return {
    unwritten: true,
    question: {
      ...base,
      format: item.format === "mcq" ? "short" : item.format,
      marks: item.format === "mcq" ? 2 : item.marks,
      stimulus: null,
      question:
        objectives.length === 1
          ? `${capitalise(objectives[0].text)}`
          : `Answer the following together:\n${objectives.map((o) => `- ${capitalise(o.text)}`).join("\n")}`,
      options: null,
      correctIndex: null,
      markingPoints: objectives.map((o) => o.text),
    },
  };
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The whole paper: every dot point in the subject, sized to a real sitting.
 */
export async function buildPlacementExam(
  userId: string,
  shortCode: string,
  options: { targetMinutes?: number; maxMinutes?: number } = {},
): Promise<PlacementExam> {
  const { subject, objectives } = await loadObjectives(userId, shortCode);
  if (objectives.length === 0) {
    throw new Error(
      "This subject has no syllabus objectives yet, so there's nothing to build a paper from. Import the syllabus first.",
    );
  }

  const rated = await refineWithModel(subject.name, objectives);
  const blueprint = buildBlueprint(rated, options);
  const objectiveById = new Map(rated.map((o) => [o.objectiveId, o]));
  const written = await writeQuestions(subject.name, blueprint.items, objectiveById);

  let unwritten = 0;
  const questions = blueprint.items.map((item) => {
    const assembled = assembleQuestion(item, written.get(item.id), objectiveById);
    if (assembled.unwritten) unwritten++;
    return assembled.question;
  });

  return {
    shortCode,
    subjectName: subject.name,
    questions,
    totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
    estimatedMinutes: Math.round(blueprint.totalSeconds / 60),
    coverage: blueprint.coverage,
    unwritten,
  };
}

// ---------------------------------------------------------------------------
// Marking it
// ---------------------------------------------------------------------------

/** Written responses marked per call. Small enough that one bad batch costs
 *  a few questions rather than the paper, and that the response can't run
 *  past the token ceiling mid-JSON. */
const MARKING_BATCH = 8;

/**
 * Turns question marks into per-dot-point evidence.
 *
 * A question covering three dot points is evidence about all three, so the
 * fraction it scored counts once for each. That is the whole reason a bundled
 * question is allowed to exist — and the reason bundling is kept small, since
 * one wrong answer then darkens three ratings at once.
 *
 * Exported for tests: this is where a mark becomes a claim about what he
 * knows, and getting it wrong would be invisible in the UI.
 */
export function foldMarksOntoObjectives(
  questions: Pick<ExamQuestion, "id" | "marks" | "objectiveIds">[],
  marks: Pick<ExamMark, "id" | "awarded">[],
): Map<string, number[]> {
  const awardedById = new Map(marks.map((m) => [m.id, m.awarded]));
  const byObjective = new Map<string, number[]>();

  for (const question of questions) {
    const awarded = awardedById.get(question.id);
    if (awarded === undefined) continue;
    const fraction = question.marks > 0 ? awarded / question.marks : 0;
    for (const objectiveId of question.objectiveIds) {
      byObjective.set(objectiveId, [...(byObjective.get(objectiveId) ?? []), fraction]);
    }
  }
  return byObjective;
}

/**
 * Marks the paper and turns it into a rating for every dot point it covered.
 *
 * Multiple choice is marked here, in code — there is nothing for a model to
 * judge about whether he picked option C, and paying for that judgement would
 * also let it disagree with itself.
 *
 * An unanswered question scores zero rather than being skipped. "I don't know"
 * is the single most informative answer in a diagnostic, and dropping blanks
 * would quietly flatter the result.
 */
export async function gradePlacementExam(
  userId: string,
  exam: PlacementExam,
  answers: ExamAnswer[],
): Promise<ExamResult> {
  const answerById = new Map(answers.map((a) => [a.id, a]));
  const marks = new Map<string, ExamMark>();

  for (const question of exam.questions) {
    if (question.format !== "mcq" || question.correctIndex === null) continue;
    const choice = answerById.get(question.id)?.choice ?? null;
    const correct = choice === question.correctIndex;
    marks.set(question.id, {
      id: question.id,
      awarded: correct ? 1 : 0,
      marks: 1,
      feedback: correct
        ? "Correct."
        : choice === null
          ? `Not answered. The answer was ${String.fromCharCode(65 + question.correctIndex)}.`
          : `You chose ${String.fromCharCode(65 + choice)}. The answer was ${String.fromCharCode(65 + question.correctIndex)}.`,
    });
  }

  const writtenQuestions = exam.questions.filter((q) => q.format !== "mcq");
  const batches: ExamQuestion[][] = [];
  for (let i = 0; i < writtenQuestions.length; i += MARKING_BATCH) {
    batches.push(writtenQuestions.slice(i, i + MARKING_BATCH));
  }

  const marked = await inBatches(batches, 3, async (batch) => {
    try {
      const response = await generateText(
        [
          {
            role: "system",
            content: `${qcaaSystemPrompt(`Your job right now: mark his ${exam.subjectName} placement exam against the marking points given, the way a QCAA marker would.`)}

For each question, award a whole number of marks from 0 to the marks available, based strictly on which marking points the answer actually covers. A blank answer, or "I don't know", scores 0.

Do not be generous. An inflated mark here means he spends weeks revising something he already knows and never gets told about the thing he doesn't.

Give one or two sentences of feedback addressed to him as "you", naming the marking points he missed. No praise padding. On full marks, say what he did well in one clause and stop.

Return ONLY a JSON array, one entry per id given:
[{"id": "q4", "awarded": 2, "feedback": "..."}]`,
          },
          {
            role: "user",
            content: batch
              .map((q) => {
                const answer = answerById.get(q.id)?.text?.trim();
                return [
                  `id: ${q.id} (${q.marks} marks)`,
                  q.stimulus ? `Stimulus:\n${q.stimulus}` : null,
                  `Question: ${q.question}`,
                  `Marking points:\n${q.markingPoints.map((p) => `- ${p}`).join("\n")}`,
                  `His answer: ${answer || "(no answer given)"}`,
                ]
                  .filter(Boolean)
                  .join("\n");
              })
              .join("\n\n"),
          },
        ],
        { jsonMode: true, maxTokens: 8000 },
      );
      return JSON.parse(stripJsonFences(response)) as { id: string; awarded: number; feedback: string }[];
    } catch {
      return [] as { id: string; awarded: number; feedback: string }[];
    }
  });

  const byId = new Map(exam.questions.map((q) => [q.id, q]));
  for (const row of marked.flat()) {
    const question = byId.get(row?.id);
    if (!question) continue;
    marks.set(question.id, {
      id: question.id,
      awarded: Math.max(0, Math.min(question.marks, Math.round(Number(row.awarded) || 0))),
      marks: question.marks,
      feedback: typeof row.feedback === "string" ? row.feedback : "",
    });
  }

  // A question the marker never returned is left at zero rather than dropped.
  // Dropping it would remove the dot point's only evidence and leave it
  // unrated, which reads as "fine" everywhere downstream.
  for (const question of writtenQuestions) {
    if (marks.has(question.id)) continue;
    marks.set(question.id, {
      id: question.id,
      awarded: 0,
      marks: question.marks,
      feedback: "This one couldn't be marked automatically — treat it as unproven and check it yourself.",
    });
  }

  const fractionsByObjective = foldMarksOntoObjectives(exam.questions, [...marks.values()]);

  const objectiveRows = await prisma.learningObjective.findMany({
    where: { id: { in: [...fractionsByObjective.keys()] }, userId },
    select: { id: true, text: true, subtopic: { select: { topicId: true, topic: { select: { title: true } } } } },
  });

  const objectives: ObjectiveRating[] = [];
  for (const row of objectiveRows) {
    const rag = ragFromScores(fractionsByObjective.get(row.id) ?? []);
    if (rag === null) continue;
    objectives.push({
      objectiveId: row.id,
      text: row.text,
      topicId: row.subtopic.topicId,
      rag,
    });
  }

  // Topic rollup, for the summary. Built from every fraction underneath the
  // topic rather than from the dot-point ratings, so one dot point with two
  // questions on it doesn't count the same as one with four.
  const topicTitle = new Map(objectiveRows.map((r) => [r.subtopic.topicId, r.subtopic.topic.title]));
  const topicFractions = new Map<string, number[]>();
  const topicOf = new Map(objectiveRows.map((r) => [r.id, r.subtopic.topicId]));
  for (const [objectiveId, fractions] of fractionsByObjective) {
    const topicId = topicOf.get(objectiveId);
    if (!topicId) continue;
    topicFractions.set(topicId, [...(topicFractions.get(topicId) ?? []), ...fractions]);
  }

  const topics: PlacementResult[] = [];
  for (const [topicId, fractions] of topicFractions) {
    const rag = ragFromScores(fractions);
    if (rag === null) continue;
    const dotPoints = objectives.filter((o) => o.topicId === topicId);
    const red = dotPoints.filter((o) => o.rag === "red").length;
    const green = dotPoints.filter((o) => o.rag === "green").length;
    const percent = Math.round((fractions.reduce((s, f) => s + f, 0) / fractions.length) * 100);
    topics.push({
      topicId,
      topicTitle: topicTitle.get(topicId) ?? "",
      rag,
      verdict: `${percent}% across ${dotPoints.length} dot point${dotPoints.length === 1 ? "" : "s"} — ${green} secure, ${red} not started.`,
    });
  }

  const allMarks = exam.questions.map((q) => marks.get(q.id)!).filter(Boolean);
  return {
    awarded: allMarks.reduce((sum, m) => sum + m.awarded, 0),
    available: allMarks.reduce((sum, m) => sum + m.marks, 0),
    marks: allMarks,
    objectives,
    topics,
  };
}

/**
 * Writes the dot-point ratings onto the objectives, where everything reads
 * them, appending to rag_history rather than overwriting it — the point is
 * being able to watch a dot point go red -> amber -> green over the year.
 */
export async function applyObjectivePlacement(
  userId: string,
  ratings: ObjectiveRating[],
): Promise<void> {
  if (ratings.length === 0) return;
  const now = new Date();
  const timestamp = now.toISOString();

  const existing = await prisma.learningObjective.findMany({
    where: { id: { in: ratings.map((r) => r.objectiveId) }, userId },
    select: { id: true, ragHistory: true },
  });
  const historyById = new Map(
    existing.map((o) => [o.id, Array.isArray(o.ragHistory) ? o.ragHistory : []]),
  );

  await prisma.$transaction(
    ratings
      .filter((r) => historyById.has(r.objectiveId))
      .map((r) =>
        prisma.learningObjective.update({
          where: { id: r.objectiveId },
          data: {
            ragStatus: r.rag,
            ragUpdatedAt: now,
            ragHistory: [...historyById.get(r.objectiveId)!, { status: r.rag, timestamp }],
          },
        }),
      ),
  );
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

// ---------------------------------------------------------------------------
// No-AI fallback.
//
// buildPlacementQuestions/gradePlacement both need a live model call — one to
// write the questions, one to mark free-text answers. With no AI available
// (no key, or the account out of credit — see PROGRESS.md), placement was
// simply unusable. This path needs no model at all: it draws real questions
// from the flashcards that already exist (real content, already correct —
// nothing generated), and grading is the same honest self-report the SM-2
// reviewer already runs on ("Again/Hard/Good/Easy" there, "I knew it / partly
// / didn't" here) rather than free-text marking. Self-report is not a lesser
// kind of evidence in this app — it's the same trust model the whole card
// scheduler is built on.
// ---------------------------------------------------------------------------

export type FallbackPlacementCard = {
  topicId: string;
  topicTitle: string;
  unitNumber: number;
  /** Stable id for this prompt — a card id, or `objective:<id>`. */
  cardId: string;
  front: string;
  back: string;
  /** "basic" | "cloze" | "formula" for a card, or "objective" for a
   * syllabus-objective prompt (which has no answer side to reveal). */
  cardType: string;
};

/** Self-graded honesty on one prompt: how well the student actually knew it,
 *  told by them, not inferred or generated. */
export type SelfGrade = "know" | "partial" | "dont_know";

const FALLBACK_CARDS_PER_TOPIC = 3;
/** Matches the AI path's "two short questions on every topic". */
const FALLBACK_OBJECTIVES_PER_TOPIC = 2;

/**
 * Picks n objectives spread ACROSS a topic's subtopics rather than taking
 * the first n.
 *
 * A topic's objectives arrive grouped by subtopic (Science understanding,
 * then SHE, then Science inquiry). Taking the first two would rate the whole
 * topic on one subtopic every time, and for the science subjects that means
 * the "science as a human endeavour" and inquiry strands — separately
 * assessable, and the ones students under-revise — would never be sampled
 * at all.
 */
function spreadAcross<T>(groups: T[][], n: number): T[] {
  const out: T[] = [];
  let round = 0;
  while (out.length < n) {
    const before = out.length;
    for (const group of groups) {
      if (out.length >= n) break;
      if (group[round] !== undefined) out.push(group[round]);
    }
    if (out.length === before) break; // every group exhausted
    round++;
  }
  return out;
}

export async function buildFallbackPlacementQuestions(
  userId: string,
  shortCode: string,
): Promise<FallbackPlacementCard[]> {
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
                include: {
                  learningObjectives: {
                    orderBy: { createdAt: "asc" },
                    select: { id: true, text: true },
                  },
                },
              },
              cards: {
                where: { isSuspended: false, cardType: { in: ["basic", "cloze", "formula"] } },
                orderBy: { createdAt: "asc" },
                take: FALLBACK_CARDS_PER_TOPIC,
                select: { id: true, front: true, back: true, cardType: true },
              },
            },
          },
        },
      },
    },
  });
  if (!subject) throw new Error("Subject not found");

  const out: FallbackPlacementCard[] = [];
  for (const unit of subject.units) {
    for (const topic of unit.topics) {
      // Objectives first. These ARE the assessment spec, already written as
      // tasks ("Calculate population growth rate...", "Explain that
      // ecosystems are composed of..."), so asking "can you do this?"
      // against the syllabus's own wording needs nothing generated and
      // matches what the exam will actually demand. A flashcard tests
      // recall of one fact; an objective tests the thing being rated.
      const objectives = spreadAcross(
        topic.subtopics.map((s) => s.learningObjectives),
        FALLBACK_OBJECTIVES_PER_TOPIC,
      );
      for (const objective of objectives) {
        out.push({
          topicId: topic.id,
          topicTitle: topic.title,
          unitNumber: unit.number,
          cardId: `objective:${objective.id}`,
          front: objective.text,
          back: "", // nothing to reveal — this is a self-assessment, not a quiz
          cardType: "objective",
        });
      }

      // Then a few real cards as a recall check, so the rating isn't built
      // purely on self-belief about the objective wording.
      for (const card of topic.cards) {
        out.push({
          topicId: topic.id,
          topicTitle: topic.title,
          unitNumber: unit.number,
          cardId: card.id,
          front: card.front,
          back: card.back,
          cardType: card.cardType,
        });
      }
    }
  }
  if (out.length === 0) {
    throw new Error(
      "This subject has no objectives or cards yet, so there's nothing to build a diagnostic from.",
    );
  }
  return out;
}

export const SELF_GRADE_WEIGHT: Record<SelfGrade, number> = {
  know: 1,
  partial: 0.5,
  dont_know: 0,
};

/** Same red/amber/green thresholds gradePlacement's prompt asks the model
 *  for, applied to an average self-grade instead of a model's judgement:
 *  ≥0.75 confidently correct -> green, ≤0.25 -> red, otherwise amber.
 *
 *  Exported for tests: this is the function that decides what the planner
 *  believes about a whole topic, and getting it wrong would quietly
 *  misdirect weeks of study. */
export function ragFromAverage(avg: number): "red" | "amber" | "green" {
  if (avg >= 0.75) return "green";
  if (avg <= 0.25) return "red";
  return "amber";
}

/**
 * The rating a set of self-grades produces, split out from the database
 * write so it can be tested with synthetic input.
 *
 * Green additionally requires that NOTHING in the set was outright unknown.
 * On the average alone, three known and one blank scores 0.75 and would
 * come back green — a topic with a hole in it, marked secure, which the
 * planner would then stop scheduling. gradePlacement's prompt tells the
 * model "do not be generous — an inflated rating means the student wastes
 * weeks studying the wrong thing"; this is that instruction expressed as
 * code, since here there's no model to follow it.
 */
export function ragFromSelfGrades(grades: SelfGrade[]): "red" | "amber" | "green" | null {
  if (grades.length === 0) return null;
  const avg = grades.reduce((sum, g) => sum + SELF_GRADE_WEIGHT[g], 0) / grades.length;
  const rag = ragFromAverage(avg);
  if (rag === "green" && grades.includes("dont_know")) return "amber";
  return rag;
}

export async function applyFallbackPlacement(
  userId: string,
  gradesByTopic: Map<string, SelfGrade[]>,
): Promise<PlacementResult[]> {
  const topicIds = [...gradesByTopic.keys()];
  const topics = await prisma.topic.findMany({
    where: { id: { in: topicIds }, userId },
    select: { id: true, title: true },
  });
  const titleById = new Map(topics.map((t) => [t.id, t.title]));

  const results: PlacementResult[] = [];
  for (const [topicId, grades] of gradesByTopic) {
    if (!titleById.has(topicId)) continue;
    // Single source of truth for the thresholds, so the tested function and
    // the one that actually writes ratings can't drift apart.
    const rag = ragFromSelfGrades(grades);
    if (rag === null) continue; // no evidence for this topic — leave it unrated
    const knowCount = grades.filter((g) => g === "know").length;
    const gapCount = grades.filter((g) => g === "dont_know").length;
    results.push({
      topicId,
      topicTitle: titleById.get(topicId)!,
      rag,
      verdict:
        `You said you knew ${knowCount} of ${grades.length}` +
        (gapCount > 0 ? `, with ${gapCount} you didn't` : "") +
        `. Self-reported.`,
    });
  }

  await applyPlacement(userId, results);
  return results;
}
