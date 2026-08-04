/**
 * How many cards a subject serves per day.
 *
 * The brief is 10-20 a day per subject, with more for the subjects that need
 * more work. "Need more work" is measured by the red/amber/green ratings,
 * which is the same signal driving the recommendation engine — so rating a
 * topic red genuinely changes how much drilling it gets, rather than just
 * colouring a dot.
 *
 * These are a floor and a ceiling on the DAILY SET, not on the SRS itself.
 * Spaced repetition still decides which cards are due and when; this decides
 * how many of them you're asked to sit down and do, plus how many new ones get
 * introduced to top the set up when reviews alone don't fill it.
 */

export const DAILY_CARDS_MIN = 10;
export const DAILY_CARDS_MAX = 20;

/**
 * Weight per rating. A red topic pulls the subject's daily target up; a green
 * one lets it drift down toward the floor.
 */
export const RAG_WEIGHT = { red: 1, amber: 0.5, green: 0.1, unrated: 0.4 } as const;

export type RagCounts = { red: number; amber: number; green: number; unrated: number };

/**
 * Daily card target for a subject.
 *
 * Unrated sits between amber and green on purpose: an unrated topic is an
 * unknown, and the safer error is to drill it a bit more than it may deserve
 * rather than assume it's fine. Placement replaces that guess with a real
 * rating.
 */
export function dailyCardTarget(counts: RagCounts): number {
  const total = counts.red + counts.amber + counts.green + counts.unrated;
  if (total === 0) return DAILY_CARDS_MIN;

  const weighted =
    (counts.red * RAG_WEIGHT.red +
      counts.amber * RAG_WEIGHT.amber +
      counts.green * RAG_WEIGHT.green +
      counts.unrated * RAG_WEIGHT.unrated) /
    total;

  return Math.round(DAILY_CARDS_MIN + (DAILY_CARDS_MAX - DAILY_CARDS_MIN) * weighted);
}
