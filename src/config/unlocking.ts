// How many topics per subject can be `active` at once. School moves at its
// own pace — sometimes you need two open. Brief default is 1, max 3.
export const ACTIVE_TOPIC_CAP = 1;

// Mastery gate thresholds (§6 of the build brief). All of these must pass
// before the mastery confirm dialogue's default path succeeds — but the
// dialogue always offers "confirm anyway" regardless of whether they pass.
export const MASTERY_MIN_STUDY_MINUTES = 90;
export const MASTERY_MIN_CARD_REVIEWS = 3;
export const MASTERY_MIN_RECENT_QUALITY = 3;
