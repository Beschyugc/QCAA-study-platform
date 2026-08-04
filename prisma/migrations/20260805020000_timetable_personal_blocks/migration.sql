-- AlterTable
ALTER TABLE "TimetableBlock" ADD COLUMN     "label" TEXT,
ALTER COLUMN "subjectId" DROP NOT NULL;
