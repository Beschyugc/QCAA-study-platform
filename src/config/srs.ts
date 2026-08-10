// SM-2 defaults (§7.1 of the build brief).
export const STARTING_EASE = 2.5;
export const MINIMUM_EASE = 1.3;
export const LAPSE_EASE_PENALTY = 0.2;
export const LEECH_THRESHOLD = 8;

// Learning/relearning steps, in minutes.
export const LEARNING_STEPS_MINUTES = [1, 10];
export const RELEARNING_STEPS_MINUTES = [10];

// Interval modifiers on a review-phase success. Without these, Hard, Good
// and Easy all schedule identically (interval x ease) and only ease moves,
// which is not how Anki behaves.
export const HARD_INTERVAL_FACTOR = 1.2;
export const EASY_BONUS = 1.3;

// ±5% so reviews don't clump into avalanches on the same day.
export const INTERVAL_FUZZ = 0.05;

// Daily caps, configurable per subject in a later phase — global default
// for now.
export const NEW_CARDS_PER_DAY = 20;
export const REVIEWS_PER_DAY = 200;
