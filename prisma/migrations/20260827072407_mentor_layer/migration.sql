-- CreateEnum
CREATE TYPE "PeriodTaskStatus" AS ENUM ('pending', 'done', 'partial', 'skipped');

-- CreateEnum
CREATE TYPE "BankSourceKind" AS ENUM ('qcaa', 'generated');

-- CreateEnum
CREATE TYPE "BankVerdict" AS ENUM ('correct', 'partial', 'wrong');

-- CreateTable
CREATE TABLE "PeriodTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "slotKey" TEXT NOT NULL,
    "blockId" TEXT,
    "subjectId" TEXT,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "objectiveIds" JSONB NOT NULL DEFAULT '[]',
    "questionIds" JSONB NOT NULL DEFAULT '[]',
    "minutes" INTEGER NOT NULL DEFAULT 40,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" "PeriodTaskStatus" NOT NULL DEFAULT 'pending',
    "report" TEXT,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceKind" "BankSourceKind" NOT NULL DEFAULT 'generated',
    "topicTag" TEXT NOT NULL,
    "objectiveIds" JSONB NOT NULL DEFAULT '[]',
    "prompt" TEXT NOT NULL,
    "working" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 2,
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "revealedWorking" BOOLEAN NOT NULL DEFAULT false,
    "confidence" INTEGER,
    "verdict" "BankVerdict",
    "feedback" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeriodTask_userId_date_idx" ON "PeriodTask"("userId", "date");

-- CreateIndex
CREATE INDEX "PeriodTask_subjectId_idx" ON "PeriodTask"("subjectId");

-- CreateIndex
CREATE INDEX "BankQuestion_userId_subjectId_idx" ON "BankQuestion"("userId", "subjectId");

-- CreateIndex
CREATE INDEX "BankQuestion_topicTag_idx" ON "BankQuestion"("topicTag");

-- CreateIndex
CREATE INDEX "BankResponse_userId_questionId_idx" ON "BankResponse"("userId", "questionId");

-- CreateIndex
CREATE INDEX "BankResponse_verdict_idx" ON "BankResponse"("verdict");

-- AddForeignKey
ALTER TABLE "PeriodTask" ADD CONSTRAINT "PeriodTask_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankResponse" ADD CONSTRAINT "BankResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "BankQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
