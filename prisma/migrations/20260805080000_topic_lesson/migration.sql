-- CreateTable
CREATE TABLE "TopicLesson" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "objectivesHash" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicLesson_topicId_key" ON "TopicLesson"("topicId");

-- CreateIndex
CREATE INDEX "TopicLesson_userId_idx" ON "TopicLesson"("userId");

-- AddForeignKey
ALTER TABLE "TopicLesson" ADD CONSTRAINT "TopicLesson_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
