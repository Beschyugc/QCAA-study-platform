import { describe, it, expect } from "vitest";
import { scoreTopicPriority, type PriorityFactors } from "./recommendation";
import { RECOMMENDATION_WEIGHTS as W } from "@/config/recommendation";

const NEUTRAL: PriorityFactors = {
  subjectPriorityWeight: 1,
  proportionRedAmber: 0,
  daysSinceLastStudied: 0,
  cardsOverdue: 0,
  paceVarianceDays: null,
  daysUntilAssessment: null,
  recentPastPaperErrorRate: null,
  needsReview: false,
};

describe("scoreTopicPriority", () => {
  it("scores zero when every factor is at its floor", () => {
    const result = scoreTopicPriority(NEUTRAL);
    expect(result.score).toBe(0);
  });

  it("scales linearly with proportion of red/amber objectives", () => {
    const half = scoreTopicPriority({ ...NEUTRAL, proportionRedAmber: 0.5 });
    const full = scoreTopicPriority({ ...NEUTRAL, proportionRedAmber: 1 });
    expect(full.score).toBeCloseTo(half.score * 2, 10);
    expect(full.score).toBeCloseTo(W.redAmberProportion, 10);
  });

  it("caps days-since-last-studied so ancient neglect doesn't dominate", () => {
    const atCap = scoreTopicPriority({ ...NEUTRAL, daysSinceLastStudied: W.daysSinceLastStudiedCap });
    const wayOver = scoreTopicPriority({ ...NEUTRAL, daysSinceLastStudied: W.daysSinceLastStudiedCap * 10 });
    expect(wayOver.score).toBe(atCap.score);
  });

  it("treats never-studied as at least as urgent as the staleness cap", () => {
    const atCap = scoreTopicPriority({ ...NEUTRAL, daysSinceLastStudied: W.daysSinceLastStudiedCap });
    const never = scoreTopicPriority({ ...NEUTRAL, daysSinceLastStudied: null });
    expect(never.score).toBeGreaterThanOrEqual(atCap.score);
  });

  it("caps cards overdue", () => {
    const atCap = scoreTopicPriority({ ...NEUTRAL, cardsOverdue: W.cardsOverdueCap });
    const wayOver = scoreTopicPriority({ ...NEUTRAL, cardsOverdue: W.cardsOverdueCap * 5 });
    expect(wayOver.score).toBe(atCap.score);
  });

  it("contributes zero for pace variance when no target is set, not a penalty", () => {
    const noTarget = scoreTopicPriority({ ...NEUTRAL, paceVarianceDays: null });
    expect(noTarget.score).toBe(0);
  });

  it("does not penalize being ahead of pace", () => {
    const ahead = scoreTopicPriority({ ...NEUTRAL, paceVarianceDays: -10 });
    expect(ahead.score).toBe(0);
  });

  it("adds points for being behind pace, capped", () => {
    const behind = scoreTopicPriority({ ...NEUTRAL, paceVarianceDays: 5 });
    expect(behind.score).toBeCloseTo(5 * W.paceVarianceDays, 10);
    const behindOverCap = scoreTopicPriority({
      ...NEUTRAL,
      paceVarianceDays: W.paceVarianceCap * 10,
    });
    expect(behindOverCap.score).toBeCloseTo(W.paceVarianceCap * W.paceVarianceDays, 10);
  });

  it("assessment proximity is steep near the deadline, not linear", () => {
    const farOut = scoreTopicPriority({ ...NEUTRAL, daysUntilAssessment: 25 });
    const midway = scoreTopicPriority({ ...NEUTRAL, daysUntilAssessment: 15 });
    const imminent = scoreTopicPriority({ ...NEUTRAL, daysUntilAssessment: 1 });
    // Halving the remaining days more than doubles the contribution
    // (quadratic curve), proving it's steep rather than linear.
    expect(midway.score).toBeGreaterThan(farOut.score * 2);
    expect(imminent.score).toBeGreaterThan(midway.score);
  });

  it("contributes zero once the assessment is outside the proximity window", () => {
    const outsideWindow = scoreTopicPriority({
      ...NEUTRAL,
      daysUntilAssessment: W.assessmentProximityWindowDays + 5,
    });
    expect(outsideWindow.score).toBe(0);
  });

  it("contributes zero for a past-due assessment date rather than going negative", () => {
    const overdue = scoreTopicPriority({ ...NEUTRAL, daysUntilAssessment: -3 });
    expect(overdue.score).toBe(0);
  });

  it("past-paper error rate contributes zero when there's no data yet", () => {
    const noData = scoreTopicPriority({ ...NEUTRAL, recentPastPaperErrorRate: null });
    expect(noData.score).toBe(0);
  });

  it("past-paper error rate scales when data exists", () => {
    const someErrors = scoreTopicPriority({ ...NEUTRAL, recentPastPaperErrorRate: 0.5 });
    expect(someErrors.score).toBeCloseTo(0.5 * W.pastPaperErrorRate, 10);
  });

  it("adds a flat boost for needs_review", () => {
    const flagged = scoreTopicPriority({ ...NEUTRAL, needsReview: true });
    expect(flagged.score).toBeCloseTo(W.needsReviewBoost, 10);
  });

  it("multiplies the whole thing by subject priority weight", () => {
    const highWeight = scoreTopicPriority({ ...NEUTRAL, proportionRedAmber: 1, subjectPriorityWeight: 1.0 });
    const lowWeight = scoreTopicPriority({ ...NEUTRAL, proportionRedAmber: 1, subjectPriorityWeight: 0.35 });
    expect(lowWeight.score).toBeCloseTo(highWeight.score * 0.35, 10);
  });

  it("contributions array sums to the raw subtotal, and score is subtotal times weight", () => {
    const factors: PriorityFactors = {
      subjectPriorityWeight: 0.8,
      proportionRedAmber: 0.6,
      daysSinceLastStudied: 5,
      cardsOverdue: 10,
      paceVarianceDays: 3,
      daysUntilAssessment: 10,
      recentPastPaperErrorRate: 0.2,
      needsReview: true,
    };
    const result = scoreTopicPriority(factors);
    const summed = result.contributions.reduce((s, c) => s + c.points, 0);
    expect(summed).toBeCloseTo(result.rawSubtotal, 10);
    expect(result.score).toBeCloseTo(result.rawSubtotal * 0.8, 10);
  });
});
