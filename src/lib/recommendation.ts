import { RECOMMENDATION_WEIGHTS as W } from "@/config/recommendation";

// Pure scoring function — no DB access, same discipline as lib/srs/sm2.ts.
// The DB query layer (recommendation-data.ts) gathers real factors; this
// just turns factors into a score with an itemised breakdown, so the "why
// is this recommended?" panel (§9.4) can show the actual numbers, not a
// black box.

export type PriorityFactors = {
  subjectPriorityWeight: number; // 0-1, from config/subjects.ts
  proportionRedAmber: number; // 0-1
  daysSinceLastStudied: number | null; // null = never studied this subject
  cardsOverdue: number;
  paceVarianceDays: number | null; // positive = behind pace; null = no target set
  daysUntilAssessment: number | null; // null = no assessment date set
  recentPastPaperErrorRate: number | null; // 0-1; null = no data yet (Phase 12)
  needsReview: boolean;
};

export type Contribution = {
  factor: string;
  rawValue: string;
  points: number;
};

export type PriorityResult = {
  score: number;
  rawSubtotal: number;
  subjectPriorityWeight: number;
  contributions: Contribution[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function scoreTopicPriority(factors: PriorityFactors): PriorityResult {
  const contributions: Contribution[] = [];

  const redAmberPoints = factors.proportionRedAmber * W.redAmberProportion;
  contributions.push({
    factor: "Red/amber objectives",
    rawValue: `${Math.round(factors.proportionRedAmber * 100)}%`,
    points: redAmberPoints,
  });

  const daysSincePoints =
    factors.daysSinceLastStudied === null
      ? W.daysSinceLastStudied * W.daysSinceLastStudiedCap
      : clamp(factors.daysSinceLastStudied, 0, W.daysSinceLastStudiedCap) *
        W.daysSinceLastStudied;
  contributions.push({
    factor: "Days since last studied",
    rawValue: factors.daysSinceLastStudied === null ? "never" : `${factors.daysSinceLastStudied}d`,
    points: daysSincePoints,
  });

  const cardsOverduePoints =
    clamp(factors.cardsOverdue, 0, W.cardsOverdueCap) * W.cardsOverdue;
  contributions.push({
    factor: "Cards overdue",
    rawValue: String(factors.cardsOverdue),
    points: cardsOverduePoints,
  });

  const pacePoints =
    factors.paceVarianceDays === null
      ? 0
      : clamp(factors.paceVarianceDays, 0, W.paceVarianceCap) * W.paceVarianceDays;
  contributions.push({
    factor: "Behind target pace",
    rawValue: factors.paceVarianceDays === null ? "no target set" : `${factors.paceVarianceDays}d behind`,
    points: pacePoints,
  });

  let assessmentPoints = 0;
  if (factors.daysUntilAssessment !== null && factors.daysUntilAssessment >= 0) {
    const t = clamp(
      1 - factors.daysUntilAssessment / W.assessmentProximityWindowDays,
      0,
      1,
    );
    assessmentPoints = t * t * W.assessmentProximity; // steep near the deadline
  }
  contributions.push({
    factor: "Days until assessment",
    rawValue: factors.daysUntilAssessment === null ? "not set" : `${factors.daysUntilAssessment}d`,
    points: assessmentPoints,
  });

  const pastPaperPoints =
    factors.recentPastPaperErrorRate === null
      ? 0
      : factors.recentPastPaperErrorRate * W.pastPaperErrorRate;
  contributions.push({
    factor: "Recent past-paper errors",
    rawValue: factors.recentPastPaperErrorRate === null ? "no data yet" : `${Math.round(factors.recentPastPaperErrorRate * 100)}%`,
    points: pastPaperPoints,
  });

  const needsReviewPoints = factors.needsReview ? W.needsReviewBoost : 0;
  contributions.push({
    factor: "Needs review flag",
    rawValue: factors.needsReview ? "yes" : "no",
    points: needsReviewPoints,
  });

  const rawSubtotal = contributions.reduce((sum, c) => sum + c.points, 0);
  const score = rawSubtotal * factors.subjectPriorityWeight;

  return {
    score,
    rawSubtotal,
    subjectPriorityWeight: factors.subjectPriorityWeight,
    contributions,
  };
}
