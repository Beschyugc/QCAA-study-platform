import { describe, it, expect } from "vitest";
import { ragFromAverage, ragFromSelfGrades, SELF_GRADE_WEIGHT } from "./placement";
import type { SelfGrade } from "./placement";

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
