// Every coefficient the priority-score formula uses (§9.4 of the build
// brief). Edit these to change what gets recommended — never hardcode a
// weight inline in lib/recommendation.ts.
export const RECOMMENDATION_WEIGHTS = {
  // Subject priority weight (config/subjects.ts) is used directly, 0-1,
  // no separate coefficient — it IS the base multiplier for everything else.

  // Proportion of this topic's objectives rated red/amber (0-1). More
  // red/amber -> higher priority.
  redAmberProportion: 25,

  // Days since the subject was last studied, saturating at 14 days (no
  // extra urgency for "haven't touched it in 6 months" vs "in 2 weeks" —
  // both are just "overdue").
  daysSinceLastStudied: 1.5,
  daysSinceLastStudiedCap: 14,

  // Cards overdue in this topic, saturating at 20 (a big backlog doesn't
  // need to dominate the score once it's clearly the top priority).
  cardsOverdue: 0.8,
  cardsOverdueCap: 20,

  // Schedule variance: how many days behind target pace this subject is.
  // Being ahead contributes 0, not negative — ahead-of-pace shouldn't
  // actively suppress a subject's priority below baseline.
  paceVarianceDays: 2,
  paceVarianceCap: 21,

  // Days until the next assessment — steep and nonlinear on purpose
  // (brief: "closer -> higher priority, steeply"). Squared curve inside
  // a 30-day window; 0 contribution once no assessment is set or it's
  // more than 30 days out.
  assessmentProximity: 40,
  assessmentProximityWindowDays: 30,

  // Recent past-paper error rate on this topic (0-1). Not populated until
  // Phase 12 exists — contributes 0 until then, not a fabricated value.
  pastPaperErrorRate: 20,

  // Flat boost for a topic flagged needs_review (§6 regression path).
  needsReviewBoost: 15,
} as const;

// Daily plan generation (§9.6).
export const DAILY_PLAN_MINUTE_CEILING = 180;
export const DAILY_PLAN_SESSION_MINUTES = 45; // default block length per recommended topic
export const DAILY_PLAN_MAX_ITEMS = 6;
