/**
 * The blueprint for a full-length placement exam.
 *
 * The old placement asked two questions per TOPIC — six to twenty questions
 * for a whole subject, all of them open-response. That is enough to sort
 * "knows the subject" from "doesn't", and nothing more. It cannot tell you
 * that you're fine on enzyme structure and lost on enzyme kinetics, because
 * it never asked about either specifically: it asked about "Cells".
 *
 * This module builds a paper that covers every syllabus dot point, in a fixed
 * time budget, in the three formats QCAA actually uses. It is deliberately
 * pure — no database, no AI. It decides WHAT to ask about and IN WHAT FORM;
 * placement.ts feeds it the syllabus and gets the model to write the actual
 * words.
 *
 * Two things make that fit in 90 minutes rather than four hours:
 *
 * 1. Not every dot point deserves an extended response. Most deserve one
 *    multiple-choice question. The split is driven by how likely QCAA is to
 *    ask a HARD question about that dot point — which the syllabus itself
 *    mostly tells you, through the cognitive verb it's written with.
 * 2. Real exam questions cover several dot points at once. A 9-mark extended
 *    response spans a whole subtopic; one MCQ can carry two closely-related
 *    recall points. Bundling is how full coverage fits the clock.
 */

export type QuestionFormat = "mcq" | "short" | "extended";

/**
 * How long each format actually takes, in seconds.
 *
 * Taken from QCAA external assessment timing rather than invented: Paper 1
 * allows roughly a minute per multiple-choice item, short response items run
 * a minute per mark, and an extended response is 8-10 minutes of writing.
 * These numbers are the whole reason the paper lands where it does, so they
 * are exported and tested rather than buried as literals.
 */
export const FORMAT_SECONDS: Record<QuestionFormat, number> = {
  mcq: 55,
  short: 150,
  extended: 480,
};

/** Marks a format carries, matching the mark discipline in prompts/qcaa.ts. */
export const FORMAT_MARKS: Record<QuestionFormat, number> = {
  mcq: 1,
  short: 3,
  extended: 8,
};

/**
 * The most dot points one item of each format can honestly test.
 *
 * An extended response spanning five dot points of one subtopic is a normal
 * QCAA question. An MCQ spanning five is a trick, not a diagnostic — which is
 * why mcq tops out at two, and only goes to two when the clock demands it.
 */
export const FORMAT_COVERAGE: Record<QuestionFormat, number> = {
  mcq: 1,
  short: 2,
  extended: 5,
};

/** QCAA's own bands — see QCAA_COMPLEXITY_BANDS in prompts/qcaa.ts. */
export type ComplexityBand = "simple_familiar" | "complex_familiar" | "complex_unfamiliar";

export type BlueprintObjective = {
  objectiveId: string;
  topicId: string;
  subtopicId: string;
  /** Document order across the whole subject — unit, then topic, then
   *  subtopic, then objective. Bundling follows it so a grouped question
   *  reads as one coherent question rather than a grab bag. */
  order: number;
  /** 0-1: how likely QCAA is to ask a demanding question about this point. */
  hardness: number;
};

export type BlueprintItem = {
  /** Stable within one paper — used as the React key and the answer key. */
  id: string;
  format: QuestionFormat;
  topicId: string;
  subtopicId: string;
  objectiveIds: string[];
  marks: number;
  seconds: number;
  /** The band the question should be written to. Highest-hardness dot point
   *  in the bundle decides it — a bundle is only as easy as its hardest part. */
  band: ComplexityBand;
};

export type Blueprint = {
  items: BlueprintItem[];
  totalSeconds: number;
  totalMarks: number;
  counts: Record<QuestionFormat, number>;
  /** Dot points covered / dot points available. Should be 1. Surfaced so a
   *  gap shows up in the UI instead of silently flattering the result. */
  coverage: { covered: number; total: number };
};

// ---------------------------------------------------------------------------
// Hardness: how likely a hard question is on this dot point
// ---------------------------------------------------------------------------

/**
 * QCAA syllabus objectives are written starting with a cognitive verb, and
 * the verb is a promise about how the point can be assessed. A dot point that
 * says "recall the structure of DNA" cannot become a 9-mark evaluate; one
 * that says "evaluate the impact of..." will never be a one-mark recall.
 *
 * So the verb is the strongest available signal for "how hard does this get",
 * and it is free, deterministic and checkable — which is why it is the base
 * estimate rather than something asked of a model. The model refines these
 * (see refineHardness); it does not replace them.
 *
 * Values are the fraction of assessment on this point that lands in the
 * complex bands, roughly, from the verb groupings in prompts/qcaa.ts.
 */
const VERB_HARDNESS: Record<string, number> = {
  // Recall band — simple_familiar almost by definition.
  recall: 0.1,
  identify: 0.12,
  state: 0.1,
  name: 0.1,
  list: 0.1,
  label: 0.1,
  define: 0.12,
  select: 0.2,
  // Description band — the mark is for content, not reasoning.
  describe: 0.3,
  outline: 0.28,
  summarise: 0.3,
  demonstrate: 0.32,
  represent: 0.32,
  symbolise: 0.3,
  // Application band — routine method, applied.
  apply: 0.5,
  calculate: 0.5,
  determine: 0.52,
  solve: 0.55,
  use: 0.45,
  interpret: 0.55,
  sequence: 0.4,
  organise: 0.4,
  classify: 0.38,
  // Reasoning band — needs a mechanism, a relationship, a comparison.
  explain: 0.65,
  analyse: 0.7,
  compare: 0.62,
  contrast: 0.6,
  distinguish: 0.55,
  examine: 0.65,
  investigate: 0.68,
  infer: 0.7,
  deduce: 0.72,
  derive: 0.72,
  // Judgement band — where complex_unfamiliar marks live.
  evaluate: 0.9,
  appraise: 0.88,
  justify: 0.85,
  assess: 0.82,
  critique: 0.88,
  discuss: 0.8,
  argue: 0.85,
  synthesise: 0.88,
  predict: 0.78,
  propose: 0.8,
  design: 0.82,
  develop: 0.78,
  construct: 0.7,
  create: 0.75,
  extrapolate: 0.8,
  modify: 0.7,
};

/** Middle of the road when no verb is recognised — not 0, which would quietly
 *  exile the dot point to multiple choice forever. */
const UNKNOWN_VERB_HARDNESS = 0.45;

/**
 * Signals that lift a dot point above what its verb alone suggests, because
 * QCAA reliably builds its hard items out of them.
 *
 * Data, graphs and models are where complex_unfamiliar questions come from in
 * the sciences: the content is known, the stimulus is new. "Describe the
 * trend shown in the data" is a describe verb doing complex_familiar work.
 */
const ESCALATORS: { pattern: RegExp; lift: number; why: string }[] = [
  { pattern: /\b(data|graph|table|stimulus|source|scenario|case study)\b/i, lift: 0.12, why: "unseen stimulus" },
  { pattern: /\b(experiment|investigation|method|variable|reliabilit|validit)\w*/i, lift: 0.12, why: "inquiry strand" },
  { pattern: /\b(model|equation|formula|derivat|proof|prove)\w*/i, lift: 0.1, why: "formal reasoning" },
  { pattern: /\b(limitation|assumption|ethical|implication|impact|consequence)s?\b/i, lift: 0.1, why: "evaluative framing" },
  { pattern: /\b(relationship|interaction|effect of|influence of)\b/i, lift: 0.08, why: "cause and effect" },
];

/**
 * The base estimate for one dot point, before the model sees it.
 *
 * Exported and tested because everything downstream — which dot points get an
 * extended response, which get one line of multiple choice — hangs off this
 * number, and a silently wrong one would misdirect the entire study plan.
 */
export function hardnessPrior(objectiveText: string, subtopicTitle = ""): number {
  const text = objectiveText.trim();
  const firstWord = text.toLowerCase().match(/[a-z]+/)?.[0] ?? "";

  // The verb is normally first, but syllabus points are sometimes written
  // "using X, explain Y" — so fall back to the first recognised verb anywhere.
  let base = VERB_HARDNESS[firstWord];
  if (base === undefined) {
    for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
      if (VERB_HARDNESS[word] !== undefined) {
        base = VERB_HARDNESS[word];
        break;
      }
    }
  }
  if (base === undefined) base = UNKNOWN_VERB_HARDNESS;

  const haystack = `${text} ${subtopicTitle}`;
  let lift = 0;
  for (const escalator of ESCALATORS) {
    if (escalator.pattern.test(haystack)) lift += escalator.lift;
  }

  // Escalators can stack, but they can't turn a recall point into an
  // evaluate one — cap the lift so the verb stays the dominant signal.
  return clamp01(base + Math.min(lift, 0.25));
}

/**
 * Blends the model's estimate into the prior.
 *
 * Weighted towards the prior on purpose. The model has read past papers and
 * genuinely knows that, say, Psychology's ethics dot points attract extended
 * responses year after year — that's worth having. But it will also confidently
 * invent a number for a dot point it has never seen assessed, and an invented
 * number should not be able to override what the syllabus wording plainly says.
 */
export function refineHardness(prior: number, modelEstimate: number | undefined): number {
  if (modelEstimate === undefined || !Number.isFinite(modelEstimate)) return prior;
  return clamp01(prior * 0.6 + clamp01(modelEstimate) * 0.4);
}

/** The band a question on this dot point should be written to. */
export function bandFor(hardness: number): ComplexityBand {
  if (hardness >= 0.7) return "complex_unfamiliar";
  if (hardness >= 0.4) return "complex_familiar";
  return "simple_familiar";
}

// ---------------------------------------------------------------------------
// The paper
// ---------------------------------------------------------------------------

export type BlueprintOptions = {
  /** Where the paper should land. Depth is added until it reaches this, so a
   *  small syllabus still produces a real sitting rather than a 20-minute quiz.
   *  Defaults to the middle of the 60-90 minute window. */
  targetMinutes?: number;
  /** Hard ceiling. The paper is never allowed over this. */
  maxMinutes?: number;
};

/** A diagnostic with five extended responses is an exam, not a diagnostic —
 *  and every one of them has to be marked by a model afterwards. */
const MAX_EXTENDED = 3;
/** Under this many dot points there isn't enough material to build a coherent
 *  extended response without it just being the whole subject at once. */
const MIN_OBJECTIVES_FOR_EXTENDED = 12;
/** The share of remaining dot points that earn a written short response.
 *  The rest are checked by multiple choice. */
const SHORT_RESPONSE_SHARE = 0.35;

export function buildBlueprint(
  objectives: BlueprintObjective[],
  options: BlueprintOptions = {},
): Blueprint {
  const targetSeconds = (options.targetMinutes ?? 75) * 60;
  const maxSeconds = (options.maxMinutes ?? 90) * 60;

  if (objectives.length === 0) {
    return {
      items: [],
      totalSeconds: 0,
      totalMarks: 0,
      counts: { mcq: 0, short: 0, extended: 0 },
      coverage: { covered: 0, total: 0 },
    };
  }

  const pool = [...objectives].sort((a, b) => a.order - b.order);

  // The paper we'd write with no clock at all: a couple of extended responses,
  // about a third of the rest written out longhand, everything else checked by
  // one multiple-choice question per dot point.
  let extendedCount =
    pool.length < MIN_OBJECTIVES_FOR_EXTENDED
      ? 0
      : Math.max(1, Math.min(MAX_EXTENDED, Math.round(pool.length / 40)));
  let shortShare = SHORT_RESPONSE_SHARE;

  // Step 1: buy time by bundling multiple choice, before touching anything
  // else. Two closely-related recall points share one stem — both still get
  // asked, the signal is just slightly coarser. That is a far cheaper trade
  // than deleting a written response, which removes the only evidence on the
  // paper of whether he can construct an answer rather than recognise one.
  //
  // Ordering this first is the whole difference between a 65-question
  // multiple-choice quiz and an exam. It was the other way round at first, and
  // Biology came out 82% multiple choice.
  let mcqCoverage = 1;
  if (layOut(pool, extendedCount, shortShare, 1).totalSeconds > maxSeconds) mcqCoverage = 2;

  let plan = layOut(pool, extendedCount, shortShare, mcqCoverage);

  // Step 2: still over the ceiling — an unusually large syllabus. Give up
  // short responses before extended ones; losing every extended response
  // means losing the only question that tests sustained reasoning.
  while (plan.totalSeconds > maxSeconds) {
    if (shortShare > MIN_SHORT_SHARE) {
      shortShare = Math.max(MIN_SHORT_SHARE, round2(shortShare - SHARE_STEP));
    } else if (extendedCount > 0) {
      extendedCount -= 1;
    } else {
      break; // nothing left to give — the subject is simply enormous
    }
    plan = layOut(pool, extendedCount, shortShare, mcqCoverage);
  }

  // Step 3: for a smaller subject there is time going spare. Spend it in the
  // order it's worth most — first un-bundle the multiple choice so every dot
  // point gets its own item and its own rating, then convert recall checks
  // into written answers. A 30-minute paper calling itself a full diagnostic
  // is a worse lie than an 88-minute one.
  if (mcqCoverage === 2) {
    const unbundled = layOut(pool, extendedCount, shortShare, 1);
    if (unbundled.totalSeconds <= maxSeconds) {
      mcqCoverage = 1;
      plan = unbundled;
    }
  }
  while (plan.totalSeconds < targetSeconds && shortShare < MAX_SHORT_SHARE) {
    const next = layOut(pool, extendedCount, round2(shortShare + SHARE_STEP), mcqCoverage);
    if (next.totalSeconds > maxSeconds) break;
    shortShare = round2(shortShare + SHARE_STEP);
    plan = next;
  }
  // Last resort for a very small syllabus: another extended response.
  while (
    plan.totalSeconds < targetSeconds &&
    extendedCount < MAX_EXTENDED &&
    pool.length >= MIN_OBJECTIVES_FOR_EXTENDED
  ) {
    const next = layOut(pool, extendedCount + 1, shortShare, mcqCoverage);
    if (next.totalSeconds > maxSeconds || next.totalSeconds <= plan.totalSeconds) break;
    extendedCount += 1;
    plan = next;
  }

  return plan;
}

/** Steps used when trading short responses for time. Kept off raw float
 *  arithmetic — repeatedly subtracting 0.05 drifts, and the drift was enough
 *  to change how many short responses a paper got. */
const SHARE_STEP = 0.05;
const MIN_SHORT_SHARE = 0.05;
const MAX_SHORT_SHARE = 0.75;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * One candidate paper, for a given amount of depth. Called repeatedly by the
 * fitting loop above, so it must be deterministic: same inputs, same paper.
 */
function layOut(
  pool: BlueprintObjective[],
  extendedCount: number,
  shortShare: number,
  mcqCoverage: number,
): Blueprint {
  const claimed = new Set<string>();
  const items: BlueprintItem[] = [];

  // Ranked hardest first, ties broken by document order so the result never
  // depends on the input array's incidental ordering.
  const byHardness = [...pool].sort((a, b) => b.hardness - a.hardness || a.order - b.order);

  // --- Extended responses -------------------------------------------------
  // Anchored on the hardest unclaimed dot point, then filled out with its
  // neighbours from the same subtopic (falling back to the same topic). A
  // question spanning two topics is not a question, it's a quiz.
  for (let i = 0; i < extendedCount; i++) {
    const anchor = byHardness.find((o) => !claimed.has(o.objectiveId));
    if (!anchor) break;
    const bundle = gather(pool, anchor, claimed, FORMAT_COVERAGE.extended);
    if (bundle.length === 0) break;
    items.push(makeItem("extended", bundle));
    for (const o of bundle) claimed.add(o.objectiveId);
  }

  // --- Short responses ----------------------------------------------------
  const remaining = byHardness.filter((o) => !claimed.has(o.objectiveId));
  const shortTarget = Math.round(remaining.length * shortShare);
  for (const anchor of remaining) {
    if (claimedBy(items, "short") >= shortTarget) break;
    if (claimed.has(anchor.objectiveId)) continue;
    const bundle = gather(pool, anchor, claimed, FORMAT_COVERAGE.short);
    if (bundle.length === 0) continue;
    items.push(makeItem("short", bundle));
    for (const o of bundle) claimed.add(o.objectiveId);
  }

  // --- Multiple choice ----------------------------------------------------
  // Everything still standing. This is the coverage guarantee: the loop runs
  // until nothing is unclaimed, so no dot point can fall off the paper.
  for (const objective of pool) {
    if (claimed.has(objective.objectiveId)) continue;
    const bundle = gather(pool, objective, claimed, mcqCoverage);
    if (bundle.length === 0) continue;
    items.push(makeItem("mcq", bundle));
    for (const o of bundle) claimed.add(o.objectiveId);
  }

  // Presented in document order within each section, so the paper walks the
  // syllabus rather than jumping around by difficulty.
  const order = new Map(pool.map((o, i) => [o.objectiveId, i]));
  const sectionRank: Record<QuestionFormat, number> = { mcq: 0, short: 1, extended: 2 };
  items.sort(
    (a, b) =>
      sectionRank[a.format] - sectionRank[b.format] ||
      (order.get(a.objectiveIds[0]) ?? 0) - (order.get(b.objectiveIds[0]) ?? 0),
  );
  items.forEach((item, i) => {
    item.id = `q${i + 1}`;
  });

  const counts = { mcq: 0, short: 0, extended: 0 };
  for (const item of items) counts[item.format] += 1;

  return {
    items,
    totalSeconds: items.reduce((sum, i) => sum + i.seconds, 0),
    totalMarks: items.reduce((sum, i) => sum + i.marks, 0),
    counts,
    coverage: { covered: claimed.size, total: pool.length },
  };
}

/**
 * Collects an anchor plus up to `size - 1` unclaimed neighbours, preferring
 * the same subtopic and never leaving the topic.
 */
function gather(
  pool: BlueprintObjective[],
  anchor: BlueprintObjective,
  claimed: Set<string>,
  size: number,
): BlueprintObjective[] {
  if (claimed.has(anchor.objectiveId)) return [];
  const bundle = [anchor];
  const eligible = (o: BlueprintObjective) => !claimed.has(o.objectiveId) && o.objectiveId !== anchor.objectiveId;

  for (const o of pool) {
    if (bundle.length >= size) break;
    if (eligible(o) && o.subtopicId === anchor.subtopicId) bundle.push(o);
  }
  for (const o of pool) {
    if (bundle.length >= size) break;
    if (eligible(o) && o.topicId === anchor.topicId && !bundle.includes(o)) bundle.push(o);
  }
  return bundle.sort((a, b) => a.order - b.order);
}

function makeItem(format: QuestionFormat, bundle: BlueprintObjective[]): BlueprintItem {
  const hardest = Math.max(...bundle.map((o) => o.hardness));
  return {
    id: "", // assigned once the paper is in its final order
    format,
    topicId: bundle[0].topicId,
    subtopicId: bundle[0].subtopicId,
    objectiveIds: bundle.map((o) => o.objectiveId),
    // A multi-mark question covering more ground carries more marks, but an
    // MCQ is one mark whatever it bundles — you either pick the option or you
    // don't.
    marks:
      format === "mcq"
        ? FORMAT_MARKS.mcq
        : FORMAT_MARKS[format] + (bundle.length - 1),
    seconds: FORMAT_SECONDS[format],
    band: bandFor(hardest),
  };
}

/** How many dot points are already committed to items of a given format. */
function claimedBy(items: BlueprintItem[], format: QuestionFormat): number {
  return items.filter((i) => i.format === format).reduce((sum, i) => sum + i.objectiveIds.length, 0);
}

// ---------------------------------------------------------------------------
// Turning marks back into ratings
// ---------------------------------------------------------------------------

/** Same thresholds the rest of placement uses — see ragFromAverage. */
export function ragFromScores(fractions: number[]): "red" | "amber" | "green" | null {
  if (fractions.length === 0) return null;
  const avg = fractions.reduce((sum, f) => sum + f, 0) / fractions.length;
  if (avg >= 0.75) {
    // A dot point with one question scored zero is not secure, whatever the
    // average says. Same guard as the self-report path, same reason: an
    // inflated green stops the planner scheduling a topic with a hole in it.
    return fractions.some((f) => f === 0) ? "amber" : "green";
  }
  if (avg <= 0.25) return "red";
  return "amber";
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
