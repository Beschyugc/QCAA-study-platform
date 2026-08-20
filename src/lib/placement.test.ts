import { describe, it, expect } from "vitest";
import {
  assembleQuestion,
  foldMarksOntoObjectives,
  ragFromAverage,
  ragFromSelfGrades,
  SELF_GRADE_WEIGHT,
  type ExamQuestion,
  type ObjectiveContext,
} from "./placement";
import type { SelfGrade } from "./placement";
import type { BlueprintItem } from "./placement-blueprint";

/**
 * The no-AI placement path turns self-reported grades into the red/amber/
 * green rating the recommendation engine scores on. That rating decides
 * what the student is told to study for weeks, so the thresholds are worth
 * pinning down with synthetic input — which is also the only honest way to
 * test this, since real input would mean inventing what the student knows.
 */
describe("ragFromAverage", () => {
  it("is green only at 0.75 and above", () => {
    expect(ragFromAverage(0.75)).toBe("green");
    expect(ragFromAverage(1)).toBe("green");
    expect(ragFromAverage(0.74)).toBe("amber");
  });

  it("is red only at 0.25 and below", () => {
    expect(ragFromAverage(0.25)).toBe("red");
    expect(ragFromAverage(0)).toBe("red");
    expect(ragFromAverage(0.26)).toBe("amber");
  });

  it("treats the uncertain middle as amber, never green", () => {
    for (const v of [0.3, 0.4, 0.5, 0.6, 0.7]) {
      expect(ragFromAverage(v)).toBe("amber");
    }
  });
});

describe("ragFromSelfGrades", () => {
  const all = (g: SelfGrade, n: number): SelfGrade[] => Array.from({ length: n }, () => g);

  it("returns null with no evidence rather than guessing a rating", () => {
    // §40: no evidence must not become a confident-looking value.
    expect(ragFromSelfGrades([])).toBeNull();
  });

  it("rates a topic green only when it was known consistently", () => {
    expect(ragFromSelfGrades(all("know", 5))).toBe("green");
  });

  it("rates a topic red when it was consistently not known", () => {
    expect(ragFromSelfGrades(all("dont_know", 5))).toBe("red");
  });

  it("does not let one confident answer carry a topic to green", () => {
    // know + dont_know averages 0.5 — the honest reading is "unreliable",
    // and calling that green would stop the planner ever revisiting it.
    expect(ragFromSelfGrades(["know", "dont_know"])).toBe("amber");
  });

  it("treats all-partial as amber, not green", () => {
    expect(ragFromSelfGrades(all("partial", 4))).toBe("amber");
  });

  it("never calls a topic green while anything in it was outright unknown", () => {
    // Averages 0.75, which the threshold alone would call green — but there
    // is a hole in the topic, and green stops the planner scheduling it.
    expect(ragFromSelfGrades(["know", "know", "know", "dont_know"])).toBe("amber");
    expect(ragFromSelfGrades(["know", "know", "dont_know", "dont_know"])).toBe("amber");
  });

  it("weights partial credit as exactly half", () => {
    expect(SELF_GRADE_WEIGHT.partial).toBe(0.5);
    // Two partials and two knows = 0.75, and nothing was a blank, so this
    // is the one shape that reaches green without a clean sweep.
    expect(ragFromSelfGrades(["partial", "partial", "know", "know"])).toBe("green");
  });
});

/**
 * The exam path's two pieces that don't need a database or a model: turning
 * whatever the model returned into a question that is definitely answerable,
 * and turning the marks back into evidence about dot points.
 *
 * Both are places where a silent failure produces a paper that still looks
 * fine — a multiple-choice question with no right answer in the list, or a
 * bundled question whose marks only ever land on the first dot point.
 */
const CONTEXT: ObjectiveContext = {
  text: "explain how negative feedback maintains body temperature",
  topicTitle: "Homeostasis",
  unitNumber: 3,
  subtopicTitle: "Regulation",
};

function slot(overrides: Partial<BlueprintItem> = {}): BlueprintItem {
  return {
    id: "q1",
    format: "mcq",
    topicId: "t1",
    subtopicId: "s1",
    objectiveIds: ["o1"],
    marks: 1,
    seconds: 55,
    band: "simple_familiar",
    ...overrides,
  };
}

const context = (ids: string[]) => new Map(ids.map((id) => [id, CONTEXT]));

describe("assembleQuestion", () => {
  it("keeps a well-formed multiple-choice question", () => {
    const { question, unwritten } = assembleQuestion(
      slot(),
      {
        id: "q1",
        question: "Which describes negative feedback?",
        options: ["A", "B", "C", "D"],
        correctIndex: 2,
      },
      context(["o1"]),
    );
    expect(unwritten).toBe(false);
    expect(question.format).toBe("mcq");
    expect(question.correctIndex).toBe(2);
    expect(question.marks).toBe(1);
  });

  it("refuses a multiple-choice question whose answer isn't in the list", () => {
    // The worst possible failure: it looks like a question, he picks an
    // option, and every option is marked wrong. Better to ask it in words.
    for (const correctIndex of [4, -1, 1.5, undefined]) {
      const { question, unwritten } = assembleQuestion(
        slot(),
        { id: "q1", question: "Which one?", options: ["A", "B", "C", "D"], correctIndex },
        context(["o1"]),
      );
      expect(unwritten).toBe(true);
      expect(question.format).not.toBe("mcq");
      expect(question.correctIndex).toBeNull();
    }
  });

  it("refuses a multiple-choice question with too few options", () => {
    const { unwritten } = assembleQuestion(
      slot(),
      { id: "q1", question: "Which one?", options: ["A", "B"], correctIndex: 0 },
      context(["o1"]),
    );
    expect(unwritten).toBe(true);
  });

  it("refuses a written question with no marking points", () => {
    // Nothing to mark it against means the marker invents its own standard,
    // which is how a wrong answer scores four out of five.
    const { unwritten } = assembleQuestion(
      slot({ format: "short", marks: 3 }),
      { id: "q1", question: "Explain negative feedback.", markingPoints: [] },
      context(["o1"]),
    );
    expect(unwritten).toBe(true);
  });

  it("keeps a well-formed written question, stimulus and all", () => {
    const { question, unwritten } = assembleQuestion(
      slot({ format: "extended", marks: 9, band: "complex_unfamiliar" }),
      {
        id: "q1",
        question: "Evaluate the claim.",
        stimulus: "| temp | rate |\n| --- | --- |\n| 30 | 4 |",
        markingPoints: ["states a position", "uses the data", "concludes"],
      },
      context(["o1"]),
    );
    expect(unwritten).toBe(false);
    expect(question.format).toBe("extended");
    expect(question.marks).toBe(9);
    expect(question.stimulus).toContain("| temp | rate |");
    expect(question.markingPoints).toHaveLength(3);
  });

  it("falls back to the syllabus wording, still covering every dot point", () => {
    // The model returning nothing must not lose the dot points — an unasked
    // dot point comes back unrated, and unrated reads as "fine" downstream.
    const { question, unwritten } = assembleQuestion(
      slot({ format: "short", marks: 4, objectiveIds: ["o1", "o2"] }),
      undefined,
      context(["o1", "o2"]),
    );
    expect(unwritten).toBe(true);
    expect(question.objectiveIds).toEqual(["o1", "o2"]);
    expect(question.question).toContain("Explain how negative feedback");
    expect(question.markingPoints).toHaveLength(2);
  });

  it("never leaves a fallback question as unanswerable multiple choice", () => {
    const { question } = assembleQuestion(slot(), undefined, context(["o1"]));
    expect(question.format).toBe("short");
    expect(question.options).toBeNull();
    expect(question.marks).toBeGreaterThan(0);
  });

  it("carries the topic and unit through for the paper's headings", () => {
    const { question } = assembleQuestion(
      slot(),
      { id: "q1", question: "Which one?", options: ["A", "B", "C"], correctIndex: 0 },
      context(["o1"]),
    );
    expect(question.topicTitle).toBe("Homeostasis");
    expect(question.unitNumber).toBe(3);
    expect(question.subtopicTitle).toBe("Regulation");
  });
});

describe("foldMarksOntoObjectives", () => {
  const q = (
    id: string,
    marks: number,
    objectiveIds: string[],
  ): Pick<ExamQuestion, "id" | "marks" | "objectiveIds"> => ({ id, marks, objectiveIds });

  it("scores a dot point as the fraction of the marks its question earned", () => {
    const folded = foldMarksOntoObjectives(
      [q("q1", 4, ["o1"])],
      [{ id: "q1", awarded: 3 }],
    );
    expect(folded.get("o1")).toEqual([0.75]);
  });

  it("counts a bundled question for every dot point it covers", () => {
    // The whole justification for bundling. If this only credited the first
    // dot point, the other two would come back unrated off a question he
    // actually answered.
    const folded = foldMarksOntoObjectives(
      [q("q1", 8, ["o1", "o2", "o3"])],
      [{ id: "q1", awarded: 8 }],
    );
    expect(folded.get("o1")).toEqual([1]);
    expect(folded.get("o2")).toEqual([1]);
    expect(folded.get("o3")).toEqual([1]);
  });

  it("gathers every question that touched a dot point", () => {
    const folded = foldMarksOntoObjectives(
      [q("q1", 1, ["o1"]), q("q2", 2, ["o1"]), q("q3", 4, ["o1", "o2"])],
      [
        { id: "q1", awarded: 1 },
        { id: "q2", awarded: 0 },
        { id: "q3", awarded: 2 },
      ],
    );
    expect(folded.get("o1")).toEqual([1, 0, 0.5]);
    expect(folded.get("o2")).toEqual([0.5]);
  });

  it("leaves a dot point out entirely when its question wasn't marked", () => {
    // No evidence must not become a zero — a zero would rate it red off
    // nothing, which is a different lie from leaving it unrated.
    const folded = foldMarksOntoObjectives([q("q1", 3, ["o1"])], []);
    expect(folded.has("o1")).toBe(false);
  });

  it("does not divide by zero on a zero-mark question", () => {
    const folded = foldMarksOntoObjectives([q("q1", 0, ["o1"])], [{ id: "q1", awarded: 0 }]);
    expect(folded.get("o1")).toEqual([0]);
  });
});
