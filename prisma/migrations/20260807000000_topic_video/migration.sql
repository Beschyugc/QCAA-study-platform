-- CreateTable
CREATE TABLE "TopicVideo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicVideo_topicId_youtubeId_key" ON "TopicVideo"("topicId", "youtubeId");

-- CreateIndex
CREATE INDEX "TopicVideo_userId_idx" ON "TopicVideo"("userId");

-- CreateIndex
CREATE INDEX "TopicVideo_topicId_idx" ON "TopicVideo"("topicId");

-- AddForeignKey
ALTER TABLE "TopicVideo" ADD CONSTRAINT "TopicVideo_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
