/*
  Warnings:

  - Added the required column `updatedAt` to the `CalendarEvent` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "googleEventId" TEXT,
    "title" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "isStudyBlock" BOOLEAN NOT NULL DEFAULT false,
    "subjectId" TEXT,
    "topicId" TEXT,
    "activityType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarEvent_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CalendarEvent_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CalendarEvent" ("end", "googleEventId", "id", "isStudyBlock", "start", "subjectId", "title", "userId") SELECT "end", "googleEventId", "id", "isStudyBlock", "start", "subjectId", "title", "userId" FROM "CalendarEvent";
DROP TABLE "CalendarEvent";
ALTER TABLE "new_CalendarEvent" RENAME TO "CalendarEvent";
CREATE UNIQUE INDEX "CalendarEvent_googleEventId_key" ON "CalendarEvent"("googleEventId");
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");
CREATE INDEX "CalendarEvent_start_idx" ON "CalendarEvent"("start");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
