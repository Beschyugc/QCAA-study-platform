-- Row Level Security, scoped to userId, on every table.
--
-- CAVEAT: the app connects via Prisma using the Supabase "postgres" pooler
-- role, which has BYPASSRLS and therefore ignores these policies entirely.
-- These are defense-in-depth for any future direct client-side/anon-key
-- access (e.g. Realtime, Storage-adjacent queries) -- they are NOT the
-- primary access control. The primary control is: every Next.js route
-- handler must resolve the Supabase auth session server-side and filter
-- every Prisma query by that userId explicitly. See lib/auth.ts.

ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subject_owner_access" ON "Subject"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "Unit" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unit_owner_access" ON "Unit"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "Topic" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topic_owner_access" ON "Topic"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "Subtopic" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subtopic_owner_access" ON "Subtopic"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "LearningObjective" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LearningObjective_owner_access" ON "LearningObjective"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "Card" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Card_owner_access" ON "Card"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "CardMedia" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CardMedia_owner_access" ON "CardMedia"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Review_owner_access" ON "Review"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "CardScheduling" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CardScheduling_owner_access" ON "CardScheduling"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "StudySession" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "StudySession_owner_access" ON "StudySession"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "DailyPlan" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DailyPlan_owner_access" ON "DailyPlan"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "WeeklyReview" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "WeeklyReview_owner_access" ON "WeeklyReview"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "FormulaEntry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FormulaEntry_owner_access" ON "FormulaEntry"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "AssumedKnowledge" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AssumedKnowledge_owner_access" ON "AssumedKnowledge"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Document_owner_access" ON "Document"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "PastPaper" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PastPaper_owner_access" ON "PastPaper"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "PaperAttempt" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PaperAttempt_owner_access" ON "PaperAttempt"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "AttemptResponse" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AttemptResponse_owner_access" ON "AttemptResponse"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "AiConversation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AiConversation_owner_access" ON "AiConversation"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "AiMessage" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AiMessage_owner_access" ON "AiMessage"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "TeachBackSession" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TeachBackSession_owner_access" ON "TeachBackSession"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "TimetableBlock" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TimetableBlock_owner_access" ON "TimetableBlock"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CalendarEvent_owner_access" ON "CalendarEvent"
  FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);
