import { prisma } from "@/lib/prisma";

/**
 * Every user-scoped table, dumped flat. §16: "Never lose data... I want to
 * be able to walk away from this app with my content." Deliberately a flat
 * object of arrays (one key per table) rather than trying to reconstruct
 * nested relations — the ids are all in there, so a restore goes
 * table-by-table against the same schema (see scripts/restore-backup.ts).
 *
 * `EXPORT_ORDER` is the single source of truth for what's in a backup, and
 * it is deliberately ordered PARENT FIRST — restore inserts in this order
 * and deletes in reverse, so foreign keys are always satisfied.
 *
 * If you add a model to schema.prisma, add it here too. The test in
 * export.test.ts fails when the schema has a user-scoped model this list
 * doesn't cover — because this silently missing four tables (the whole
 * Mistake Folder, every written lesson, the mapped videos and the daily
 * question sets) is exactly the kind of "backup" that loses your work
 * without ever telling you.
 */
export const EXPORT_ORDER = [
  "subjects",
  "units",
  "topics",
  "subtopics",
  "learningObjectives",
  "cards",
  "cardMedia",
  "cardScheduling",
  "reviews",
  "topicLessons",
  "topicVideos",
  "studySessions",
  "dailyPlans",
  "weeklyReviews",
  "dailyQuestionSets",
  "formulaEntries",
  "assumedKnowledge",
  "documents",
  "pastPapers",
  "paperAttempts",
  "attemptResponses",
  "aiConversations",
  "aiMessages",
  "teachBackSessions",
  "timetableBlocks",
  "calendarEvents",
  "mistakes",
  // PeriodTask before BankQuestion is not a foreign-key requirement — neither
  // references the other — but both come after subjects, which they do
  // reference. BankResponse must follow BankQuestion.
  "periodTasks",
  "bankQuestions",
  "bankResponses",
] as const;

export type ExportKey = (typeof EXPORT_ORDER)[number];

/** Maps each export key to its Prisma model accessor name. */
export const MODEL_BY_KEY: Record<ExportKey, string> = {
  subjects: "subject",
  units: "unit",
  topics: "topic",
  subtopics: "subtopic",
  learningObjectives: "learningObjective",
  cards: "card",
  cardMedia: "cardMedia",
  cardScheduling: "cardScheduling",
  reviews: "review",
  topicLessons: "topicLesson",
  topicVideos: "topicVideo",
  studySessions: "studySession",
  dailyPlans: "dailyPlan",
  weeklyReviews: "weeklyReview",
  dailyQuestionSets: "dailyQuestionSet",
  formulaEntries: "formulaEntry",
  assumedKnowledge: "assumedKnowledge",
  documents: "document",
  pastPapers: "pastPaper",
  paperAttempts: "paperAttempt",
  attemptResponses: "attemptResponse",
  aiConversations: "aiConversation",
  aiMessages: "aiMessage",
  teachBackSessions: "teachBackSession",
  timetableBlocks: "timetableBlock",
  calendarEvents: "calendarEvent",
  mistakes: "mistake",
  periodTasks: "periodTask",
  bankQuestions: "bankQuestion",
  bankResponses: "bankResponse",
};

export type ExportBundle = {
  exportedAt: string;
  userId: string;
  /** Bumped when the shape changes incompatibly, so a restore can refuse
   * rather than half-apply a bundle it doesn't understand. */
  formatVersion: number;
  counts: Record<string, number>;
} & Record<ExportKey, unknown[]>;

export const EXPORT_FORMAT_VERSION = 2;

export async function exportAllData(userId: string): Promise<ExportBundle> {
  const client = prisma as unknown as Record<string, { findMany: (a: unknown) => Promise<unknown[]> }>;

  const entries = await Promise.all(
    EXPORT_ORDER.map(async (key) => {
      const rows = await client[MODEL_BY_KEY[key]].findMany({ where: { userId } });
      return [key, rows] as const;
    }),
  );

  const data = Object.fromEntries(entries) as Record<ExportKey, unknown[]>;
  const counts = Object.fromEntries(
    entries.map(([key, rows]) => [key, rows.length]),
  ) as Record<string, number>;

  return {
    exportedAt: new Date().toISOString(),
    userId,
    formatVersion: EXPORT_FORMAT_VERSION,
    counts,
    ...data,
  };
}
