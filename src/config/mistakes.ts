/**
 * The mistake taxonomy.
 *
 * Nine categories, split into two families that need completely different
 * repairs. That split is the whole point of the folder: "I got it wrong" is
 * useless, "I got it wrong four times and every one was a misread question" is
 * a instruction to slow down reading, not to re-read the textbook.
 */

export type MistakeCategory =
  | "knowledge_gap"
  | "conceptual_misunderstanding"
  | "incorrect_method"
  | "calculation_error"
  | "formula_forgotten"
  | "misread_question"
  | "insufficient_working"
  | "time_management"
  | "other";

export type MistakeFamily = "content" | "execution";

export type CategoryMeta = {
  id: MistakeCategory;
  label: string;
  family: MistakeFamily;
  /** What this category means, in the second person. */
  hint: string;
  /** What actually fixes it — shown on the record so the next step is obvious. */
  fix: string;
};

export const MISTAKE_CATEGORIES: CategoryMeta[] = [
  {
    id: "knowledge_gap",
    label: "Knowledge gap",
    family: "content",
    hint: "You didn't know the content. Not a slip — you hadn't learnt it.",
    fix: "Go back to the lesson and the cards for this topic before attempting it again.",
  },
  {
    id: "conceptual_misunderstanding",
    label: "Conceptual misunderstanding",
    family: "content",
    hint: "You knew the words but had the idea itself wrong.",
    fix: "Teach it back out loud. A wrong model survives re-reading; it rarely survives explaining.",
  },
  {
    id: "formula_forgotten",
    label: "Formula forgotten",
    family: "content",
    hint: "You knew what to do but couldn't recall the formula or standard result.",
    fix: "Add it to Assumed knowledge and drill it — this is exactly what that deck is for.",
  },
  {
    id: "incorrect_method",
    label: "Incorrect method",
    family: "execution",
    hint: "You picked the wrong approach for the question in front of you.",
    fix: "Practise selecting between methods, not executing one. Complex-familiar cards drill this.",
  },
  {
    id: "calculation_error",
    label: "Calculation / algebra error",
    family: "execution",
    hint: "Right method, wrong arithmetic or algebra.",
    fix: "Slow the working down and check the line before the answer. Marks for method still stand.",
  },
  {
    id: "misread_question",
    label: "Misread the question",
    family: "execution",
    hint: "You answered a question that wasn't asked — often the wrong cognitive verb.",
    fix: "Underline the command verb before writing. Describing an 'evaluate' scores nothing.",
  },
  {
    id: "insufficient_working",
    label: "Insufficient working or justification",
    family: "execution",
    hint: "The answer was right but you didn't show enough to earn the marks.",
    fix: "One scoring point per mark, stated explicitly. Match the length to the allocation.",
  },
  {
    id: "time_management",
    label: "Time management",
    family: "execution",
    hint: "You ran out of time, or spent it in the wrong place.",
    fix: "Practise under timed conditions and budget roughly 1.5 minutes per mark.",
  },
  {
    id: "other",
    label: "Other",
    family: "execution",
    hint: "Doesn't fit the rest.",
    fix: "Write what happened in your own words — the pattern usually names itself later.",
  },
];

export const CATEGORY_BY_ID = new Map(MISTAKE_CATEGORIES.map((c) => [c.id, c]));

export type MistakeStatus = "new" | "reviewing" | "improving" | "mastered";

export const STATUSES: { id: MistakeStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "reviewing", label: "Reviewing" },
  { id: "improving", label: "Improving" },
  { id: "mastered", label: "Mastered" },
];

/**
 * How long until a repaired mistake comes back to be checked.
 *
 * Deliberately shorter than the card scheduler's intervals: a mistake is
 * already evidence of a weak spot, so it earns a tighter leash than a card you
 * have never got wrong.
 */
export const REVIEW_DAYS: Record<MistakeStatus, number | null> = {
  new: 1,
  reviewing: 3,
  improving: 7,
  mastered: null,
};

/** The next status up when a review goes well. Mastered is the ceiling. */
export function promote(status: MistakeStatus): MistakeStatus {
  return status === "new" ? "reviewing"
    : status === "reviewing" ? "improving"
    : "mastered";
}

/**
 * A failed review drops one step rather than resetting to `new`.
 *
 * Resetting would erase the evidence that you had improved at all, and make
 * the folder read as though no progress ever happens.
 */
export function demote(status: MistakeStatus): MistakeStatus {
  return status === "mastered" ? "improving"
    : status === "improving" ? "reviewing"
    : "new";
}
