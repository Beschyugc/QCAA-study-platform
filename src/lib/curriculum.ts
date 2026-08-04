import { prisma } from "@/lib/prisma";
import type { CurriculumRow } from "@/lib/curriculum-csv";
import { initializeUnlockState } from "@/lib/unlocking";

// Full replace: deletes the subject's existing curriculum tree and rebuilds
// it from flat rows. Used by both CSV/JSON import and AI syllabus import,
// since after review they're the same operation — write a curriculum tree
// from a flat row list. RAG ratings reset (new rows get new ids); fine
// pre-Phase-4 since nothing references these ids yet.
export async function replaceCurriculumTree(
  userId: string,
  subjectId: string,
  rows: CurriculumRow[],
) {
  await prisma.$transaction(async (tx) => {
    await tx.unit.deleteMany({ where: { subjectId } });

    const unitOrder = new Map<number, number>();
    const topicOrder = new Map<string, number>();
    const subtopicOrder = new Map<string, number>();
    const unitIds = new Map<number, string>();
    const topicIds = new Map<string, string>();
    const subtopicIds = new Map<string, string>();

    for (const row of rows) {
      let unitId = unitIds.get(row.unitNumber);
      if (!unitId) {
        const order = unitOrder.size;
        unitOrder.set(row.unitNumber, order);
        const unit = await tx.unit.create({
          data: {
            userId,
            subjectId,
            number: row.unitNumber,
            title: row.unitTitle,
            order,
          },
        });
        unitId = unit.id;
        unitIds.set(row.unitNumber, unitId);
      }

      const topicKey = `${row.unitNumber}:${row.topicNumber}`;
      let topicId = topicIds.get(topicKey);
      if (!topicId) {
        const order = [...topicOrder.keys()].filter((k) =>
          k.startsWith(`${row.unitNumber}:`),
        ).length;
        topicOrder.set(topicKey, order);
        const topic = await tx.topic.create({
          data: {
            userId,
            unitId,
            number: row.topicNumber,
            title: row.topicTitle,
            order,
          },
        });
        topicId = topic.id;
        topicIds.set(topicKey, topicId);
      }

      const subtopicKey = `${topicKey}:${row.subtopicTitle}`;
      let subtopicId = subtopicIds.get(subtopicKey);
      if (!subtopicId) {
        const order = [...subtopicOrder.keys()].filter((k) =>
          k.startsWith(`${topicKey}:`),
        ).length;
        subtopicOrder.set(subtopicKey, order);
        const subtopic = await tx.subtopic.create({
          data: { userId, topicId, title: row.subtopicTitle, order },
        });
        subtopicId = subtopic.id;
        subtopicIds.set(subtopicKey, subtopicId);
      }

      if (row.objectiveText.trim()) {
        await tx.learningObjective.create({
          data: {
            userId,
            subtopicId,
            text: row.objectiveText,
            qcaaReference: row.qcaaReference || null,
          },
        });
      }
    }
  });

  await initializeUnlockState(userId, subjectId);
}
