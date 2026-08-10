-- CreateEnum
CREATE TYPE "MistakeCategory" AS ENUM ('knowledge_gap', 'conceptual_misunderstanding', 'incorrect_method', 'calculation_error', 'formula_forgotten', 'misread_question', 'insufficient_working', 'time_management', 'other');

-- CreateEnum
CREATE TYPE "MistakeStatus" AS ENUM ('new', 'reviewing', 'improving', 'mastered');

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT,
    "cardId" TEXT,
    "category" "MistakeCategory" NOT NULL,
    "status" "MistakeStatus" NOT NULL DEFAULT 'new',
    "whatWentWrong" TEXT NOT NULL,
    "whyItHappened" TEXT,
    "fixAction" TEXT,
    "source" TEXT,
    "marksLost" INTEGER,
    "timesRepeated" INTEGER NOT NULL DEFAULT 1,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewAt" TIMESTAMP(3),
    "masteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mistake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mistake_userId_idx" ON "Mistake"("userId");

-- CreateIndex
CREATE INDEX "Mistake_subjectId_idx" ON "Mistake"("subjectId");

-- CreateIndex
CREATE INDEX "Mistake_status_idx" ON "Mistake"("status");

-- CreateIndex
CREATE INDEX "Mistake_nextReviewAt_idx" ON "Mistake"("nextReviewAt");

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
