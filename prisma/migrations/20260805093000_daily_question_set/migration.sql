-- CreateTable
CREATE TABLE "DailyQuestionSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "questions" JSONB NOT NULL,
    "responses" JSONB NOT NULL DEFAULT '[]',
    "completedAt" TIMESTAMP(3),
    "scoreAwarded" DOUBLE PRECISION,
    "scoreAvailable" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestionSet_userId_subjectId_date_key" ON "DailyQuestionSet"("userId", "subjectId", "date");

-- CreateIndex
CREATE INDEX "DailyQuestionSet_userId_idx" ON "DailyQuestionSet"("userId");

-- AddForeignKey
ALTER TABLE "DailyQuestionSet" ADD CONSTRAINT "DailyQuestionSet_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
