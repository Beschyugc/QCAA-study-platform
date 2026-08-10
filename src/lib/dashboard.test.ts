import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect } from "vitest";
import { buildAfternoonPlan, type LineState } from "./dashboard";
import type { TopicRecommendation } from "./recommendation-data";

// §8: at school, in a real subject class, the plan locks to that subject's
// own weak content instead of whichever subject scores highest overall.
// This is the one rule the whole "school vs home" feature rests on, so it's
// tested directly rather than only smoke-tested through the dashboard page.

function line(code: string, subjectId: string): LineState {
  return {
    code: code as LineState["code"],
    subjectId,
    name: code,
    label: code,
    icon: "circle",
    stations: [],
    activeIndex: -1,
    position: null,
    masteredCount: 0,
    cardsDue: 0,
    redObjectives: 0,
  };
}

function rec(subjectId: string, topicId: string, score: number): TopicRecommendation {
  return {
    topicId,
    topicNumber: 1,
    topicTitle: `Topic ${topicId}`,
    subjectId,
    subjectName: subjectId,
    subjectColour: "#000000",
    factors: {
      subjectPriorityWeight: 1,
      proportionRedAmber: 0,
      daysSinceLastStudied: 0,
      cardsOverdue: 0,
      paceVarianceDays: null,
      daysUntilAssessment: null,
      recentPastPaperErrorRate: null,
      needsReview: false,
    },
    result: { score, rawSubtotal: score, subjectPriorityWeight: 1, contributions: [] },
  };
}

describe("buildAfternoonPlan", () => {
  const lines = [line("BIO", "bio-id"), line("MM", "mm-id")];
  // Methods scores higher than Biology across the board.
  const recommendations = [rec("mm-id", "mm-topic", 90), rec("bio-id", "bio-topic", 50)];

  it("picks the highest-scoring subject overall when nothing locks it", () => {
    const plan = buildAfternoonPlan(recommendations, lines, 90, null);
    expect(plan[0].code).toBe("MM");
  });

  it("locks to the current class's subject even though another subject scores higher", () => {
    const plan = buildAfternoonPlan(recommendations, lines, 90, "BIO");
    expect(plan.every((item) => item.code === "BIO")).toBe(true);
    expect(plan[0].topicId).toBe("bio-topic");
  });

  it("returns nothing rather than falling back to another subject when the locked subject has no recommendations", () => {
    const plan = buildAfternoonPlan(recommendations, lines, 90, "ENG");
    expect(plan).toHaveLength(0);
  });
});
