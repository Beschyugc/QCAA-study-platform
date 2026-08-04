// A learning objective rated green for longer than this with no related
// flashcard reviews or study sessions gets flagged "stale" for re-rating.
// We never silently downgrade it — just surface it (§5.2 of the build brief).
export const STALE_GREEN_DAYS = 21;
