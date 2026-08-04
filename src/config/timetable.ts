/**
 * How a timetable block is classified for the dashboard.
 *
 * Beschy's imported timetable mixes three kinds of block in one table: school
 * classes linked to a subject, personal routine (drive, gym, dinner, UGC), and
 * study time described only by a free-text label. Next Departure must only ever
 * offer the first and third — "Drive to school" is not a departure you can
 * start a timer for.
 *
 * These live in config, not in the classifier, so the vocabulary can be edited
 * without touching logic — the same discipline as the recommendation weights.
 */

/** A label matching any of these means the block is study time. */
export const STUDY_BLOCK_PATTERNS: RegExp[] = [
  /schoolwork/i,
  /\bstudy\b/i,
  /\banki\b/i,
  /\bhomework\b/i,
  /\brevision\b/i,
  /past paper/i,
];

/**
 * Some class blocks were imported with the subject in the LABEL instead of
 * linked via subjectId — Beschy's Wednesday P1 is `"ENG (EARLY — leave 7:30!)"`
 * with subjectId null. Rather than let those vanish from Next Departure, a
 * leading all-caps token is read as a subject shortCode.
 *
 * Deliberately strict: 2-4 uppercase letters followed by a word boundary, at
 * the very start. That matches "ENG (EARLY...)" but not "Cert III Fitness",
 * "SCHOOLWORK — Anki + homework" or "UGC BLOCK". Anything it does match is
 * still marked as INFERRED in the UI — a guess is never presented as a fact.
 */
export const LABEL_SUBJECT_CODE = /^\s*([A-Z]{2,4})\b/;
