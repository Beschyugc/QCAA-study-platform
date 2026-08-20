import { describe, it, expect } from "vitest";
import {
  bandFor,
  buildBlueprint,
  FORMAT_SECONDS,
  hardnessPrior,
  ragFromScores,
  refineHardness,
  type BlueprintObjective,
} from "./placement-blueprint";

/**
 * The blueprint decides what a 90-minute diagnostic asks about, and the answer
 * decides what the planner tells him to study for weeks afterwards. Every
 * property tested here is one that, if it broke silently, would produce a
 * paper that still looked fine and was quietly measuring the wrong thing:
 * a dot point never asked about, an exam that runs to three hours, or a
 * "green" on a topic with a hole in it.
 */

/** A synthetic syllabus: `topics` topics, `subtopics` each, `perSubtopic` dot
 *  points each, hardness cycling so the ranking has something to bite on. */
function syllabus(topics: number, subtopics: number, perSubtopic: number): BlueprintObjective[] {
  const out: BlueprintObjective[] = [];
  let order = 0;
  for (let t = 0; t < topics; t++) {
    for (let s = 0; s < subtopics; s++) {
      for (let o = 0; o < perSubtopic; o++) {
        out.push({
          objectiveId: `t${t}s${s}o${o}`,
          topicId: `t${t}`,
          subtopicId: `t${t}s${s}`,
          order: order++,
          // Spread across the full range rather than clustering, so extended
          // responses have a clear set of anchors to find.
          hardness: ((order * 37) % 100) / 100,
        });
      }
    }
  }
  return out;
}

describe("hardnessPrior", () => {
  it("reads the cognitive verb the syllabus point is written with", () => {
    // The verb is the syllabus's own promise about how hard the point gets —
    // see VERB_HARDNESS. A recall point must never outrank an evaluate one.
    expect(hardnessPrior("recall the structure of DNA")).toBeLessThan(
      hardnessPrior("evaluate the ethical implications of gene editing"),
    );
    expect(hardnessPrior("identify the parts of a neuron")).toBeLessThan(
      hardnessPrior("explain how an action potential propagates"),
    );
  });

  it("finds the verb when the point does not open with it", () => {
    // "Using X, explain Y" is common in QCAA syllabuses and must not fall
    // through to the unknown-verb default.
    const embedded = hardnessPrior("using the data provided, evaluate the claim");
    const opening = hardnessPrior("evaluate the claim");
    expect(embedded).toBeGreaterThanOrEqual(opening);
  });

  it("lifts points that come with data, an investigation or an evaluation", () => {
    // Same verb, harder assessment: QCAA builds complex_unfamiliar items out
    // of unseen stimulus.
    expect(hardnessPrior("describe the trend shown in the data")).toBeGreaterThan(
      hardnessPrior("describe the parts of a cell"),
    );
  });

  it("never lets escalators turn a recall point into an evaluate one", () => {
    const stacked = hardnessPrior(
      "recall the data table model equation limitations relationship experiment",
    );
    expect(stacked).toBeLessThan(hardnessPrior("evaluate a claim"));
  });

  it("gives an unrecognised point a middling score, not zero", () => {
    // Zero would exile it to multiple choice permanently and invisibly.
    const unknown = hardnessPrior("zzz qqq wibble");
    expect(unknown).toBeGreaterThan(0.2);
    expect(unknown).toBeLessThan(0.8);
  });

  it("stays inside 0-1 whatever it is given", () => {
    for (const text of ["", "evaluate data experiment model limitation relationship", "recall"]) {
      const h = hardnessPrior(text);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(1);
    }
  });
});

describe("refineHardness", () => {
  it("keeps the syllabus prior when the model said nothing", () => {
    expect(refineHardness(0.4, undefined)).toBe(0.4);
    expect(refineHardness(0.4, NaN)).toBe(0.4);
  });

  it("lets the model move the number without letting it take over", () => {
    // The model has read past papers, so it gets a vote; it also invents
    // numbers for points it has never seen assessed, so it doesn't get a veto.
    const moved = refineHardness(0.2, 1);
    expect(moved).toBeGreaterThan(0.2);
    expect(moved).toBeLessThan(0.6);
  });
});

describe("bandFor", () => {
  it("maps to QCAA's three bands at the documented thresholds", () => {
    expect(bandFor(0.1)).toBe("simple_familiar");
    expect(bandFor(0.4)).toBe("complex_familiar");
    expect(bandFor(0.7)).toBe("complex_unfamiliar");
  });
});

describe("buildBlueprint", () => {
  it("covers every syllabus dot point", () => {
    // The one property the whole feature exists for. A dot point that is never
    // asked about comes back unrated, and unrated reads as "fine" everywhere
    // downstream.
    for (const size of [
      syllabus(4, 3, 7), // 84 — a science subject
      syllabus(10, 2, 4), // 80 — Maths Methods shape
      syllabus(3, 1, 22), // 66 — PE shape, few subtopics
      syllabus(2, 2, 4), // 16 — a barely-imported syllabus
    ]) {
      const bp = buildBlueprint(size);
      const asked = new Set(bp.items.flatMap((i) => i.objectiveIds));
      expect(asked.size).toBe(size.length);
      expect(bp.coverage.covered).toBe(bp.coverage.total);
    }
  });

  it("never asks the same dot point twice", () => {
    // Double-counting would weight one point's score twice in its own rating.
    const bp = buildBlueprint(syllabus(4, 3, 7));
    const all = bp.items.flatMap((i) => i.objectiveIds);
    expect(new Set(all).size).toBe(all.length);
  });

  it("fits inside the time ceiling", () => {
    for (const size of [syllabus(4, 3, 7), syllabus(6, 4, 6), syllabus(3, 1, 22)]) {
      const bp = buildBlueprint(size, { maxMinutes: 90 });
      expect(bp.totalSeconds).toBeLessThanOrEqual(90 * 60);
    }
  });

  it("lands in the 60-90 minute window for a real-sized syllabus", () => {
    // 66-95 dot points is the actual range across his five subjects.
    for (const n of [66, 79, 88, 94]) {
      const bp = buildBlueprint(syllabus(4, 3, Math.ceil(n / 12)).slice(0, n));
      expect(bp.totalSeconds).toBeGreaterThanOrEqual(60 * 60);
      expect(bp.totalSeconds).toBeLessThanOrEqual(90 * 60);
    }
  });

  it("asks in all three formats", () => {
    // He asked for multiple choice, short answer and long response. A paper
    // that is all one of them tests one skill and calls it a level.
    const bp = buildBlueprint(syllabus(4, 3, 7));
    expect(bp.counts.mcq).toBeGreaterThan(0);
    expect(bp.counts.short).toBeGreaterThan(0);
    expect(bp.counts.extended).toBeGreaterThan(0);
  });

  it("spends its extended responses on the hardest dot points", () => {
    const objectives = syllabus(4, 3, 7);
    const bp = buildBlueprint(objectives);
    const hardnessById = new Map(objectives.map((o) => [o.objectiveId, o.hardness]));
    const extended = bp.items.filter((i) => i.format === "extended");
    const mcq = bp.items.filter((i) => i.format === "mcq");

    const peak = (ids: string[]) => Math.max(...ids.map((id) => hardnessById.get(id)!));
    const hardestExtended = Math.max(...extended.map((i) => peak(i.objectiveIds)));
    const hardestMcq = Math.max(...mcq.map((i) => peak(i.objectiveIds)));
    expect(hardestExtended).toBeGreaterThan(hardestMcq);
  });

  it("keeps a bundled question inside one topic", () => {
    // A question spanning two topics is not a question, it's a quiz — and it
    // makes the resulting rating impossible to attribute.
    const objectives = syllabus(4, 3, 7);
    const topicById = new Map(objectives.map((o) => [o.objectiveId, o.topicId]));
    for (const item of buildBlueprint(objectives).items) {
      const topics = new Set(item.objectiveIds.map((id) => topicById.get(id)));
      expect(topics.size).toBe(1);
    }
  });

  it("is deterministic — the same syllabus produces the same paper", () => {
    const objectives = syllabus(4, 3, 7);
    const a = buildBlueprint(objectives);
    const b = buildBlueprint([...objectives].reverse());
    expect(b.items.map((i) => `${i.format}:${i.objectiveIds.join(",")}`)).toEqual(
      a.items.map((i) => `${i.format}:${i.objectiveIds.join(",")}`),
    );
  });

  it("bundles multiple choice rather than dropping written responses", () => {
    // The trade that matters. A syllabus too big for one-MCQ-per-dot-point
    // must still come back with short and extended responses on it — the
    // first version of this traded them away and produced a 65-question quiz.
    // 105 dot points: one multiple-choice question each would already be 96
    // minutes, so something has to give.
    const big = syllabus(5, 3, 7);
    const bp = buildBlueprint(big);
    expect(bp.counts.short).toBeGreaterThan(5);
    expect(bp.counts.extended).toBeGreaterThan(0);
    expect(bp.coverage.covered).toBe(big.length);
  });

  it("still covers everything on a syllabus far too big for the clock", () => {
    // Past the point where bundling alone can save it, short responses are
    // given up one at a time — but coverage and the extended response are the
    // last things to go, and the paper still respects the ceiling.
    const huge = syllabus(6, 4, 6); // 144 dot points
    const bp = buildBlueprint(huge);
    expect(bp.coverage.covered).toBe(huge.length);
    expect(bp.counts.extended).toBeGreaterThan(0);
    expect(bp.totalSeconds).toBeLessThanOrEqual(90 * 60);
  });

  it("returns an empty paper rather than throwing on an empty syllabus", () => {
    const bp = buildBlueprint([]);
    expect(bp.items).toEqual([]);
    expect(bp.totalSeconds).toBe(0);
  });

  it("prices each item at its format's time cost", () => {
    for (const item of buildBlueprint(syllabus(4, 3, 7)).items) {
      expect(item.seconds).toBe(FORMAT_SECONDS[item.format]);
    }
  });
});

describe("ragFromScores", () => {
  it("returns null with no evidence rather than guessing", () => {
    expect(ragFromScores([])).toBeNull();
  });

  it("uses the same thresholds as the rest of placement", () => {
    expect(ragFromScores([1, 1, 1, 1])).toBe("green");
    expect(ragFromScores([0.75])).toBe("green");
    expect(ragFromScores([0.5])).toBe("amber");
    expect(ragFromScores([0.25])).toBe("red");
    expect(ragFromScores([0, 0])).toBe("red");
  });

  it("refuses green when any question on the point scored zero", () => {
    // Three right and one blank averages 0.75. That is a dot point with a hole
    // in it, and a green would stop the planner ever scheduling it again.
    expect(ragFromScores([1, 1, 1, 0])).toBe("amber");
  });
});
