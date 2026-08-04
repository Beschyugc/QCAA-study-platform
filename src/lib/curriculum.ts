import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { CurriculumRow } from "@/lib/curriculum-csv";
import { initializeUnlockState } from "@/lib/unlocking";

/** The shape the AI syllabus extraction returns, and the manual JSON import accepts. */
export type JsonUnit = {
  number: number;
  title: string;
  topics: {
    number: number;
    title: string;
    subtopics: {
      title: string;
      learningObjectives: { text: string; qcaaReference?: string | null }[];
    }[];
  }[];
};

/**
 * Flattens the nested JSON curriculum into the flat rows replaceCurriculumTree
 * expects. Lives here rather than in the import server action so scripts and
 * the UI share one implementation — a second copy would be free to drift, and
 * the thing it would drift on is how empty subtopics are preserved.
 *
 * A subtopic with no objectives still emits one row, so the topic survives the
 * round trip. Dropping it would silently delete a station from the map.
 */
export function jsonToRows(units: JsonUnit[]): CurriculumRow[] {
  return units.flatMap((unit) =>
    unit.topics.flatMap((topic) =>
      topic.subtopics.flatMap((subtopic) =>
        subtopic.learningObjectives.length === 0
          ? [
              {
                unitNumber: unit.number,
                unitTitle: unit.title,
                topicNumber: topic.number,
                topicTitle: topic.title,
                subtopicTitle: subtopic.title,
                objectiveText: "",
                qcaaReference: "",
              },
            ]
          : subtopic.learningObjectives.map((o) => ({
              unitNumber: unit.number,
              unitTitle: unit.title,
              topicNumber: topic.number,
              topicTitle: topic.title,
              subtopicTitle: subtopic.title,
              objectiveText: o.text,
              qcaaReference: o.qcaaReference ?? "",
            })),
      ),
    ),
  );
}

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
  // Ids are generated up front so the whole tree can go in as four bulk
  // inserts instead of one round trip per row.
  //
  // This used to create each unit, topic, subtopic and objective in sequence
  // inside the transaction. Against a remote Supabase that is one network
  // round trip per row, and a real QCAA syllabus is ~90 rows — Psychology and
  // English both blew Prisma's 5s interactive-transaction ceiling and rolled
  // back, so those subjects simply could not be imported at all. Batching
  // takes it to four statements and well under a second.
  const units = new Map<number, { id: string; title: string; order: number }>();
  const topics = new Map<string, { id: string; unitId: string; number: number; title: string; order: number }>();
  const subtopics = new Map<string, { id: string; topicId: string; title: string; order: number }>();
  const objectives: { id: string; subtopicId: string; text: string; qcaaReference: string | null }[] = [];

  for (const row of rows) {
    let unit = units.get(row.unitNumber);
    if (!unit) {
      unit = { id: randomUUID(), title: row.unitTitle, order: units.size };
      units.set(row.unitNumber, unit);
    }

    const topicKey = `${row.unitNumber}:${row.topicNumber}`;
    let topic = topics.get(topicKey);
    if (!topic) {
      const order = [...topics.keys()].filter((k) => k.startsWith(`${row.unitNumber}:`)).length;
      topic = {
        id: randomUUID(),
        unitId: unit.id,
        number: row.topicNumber,
        title: row.topicTitle,
        order,
      };
      topics.set(topicKey, topic);
    }

    const subtopicKey = `${topicKey}:${row.subtopicTitle}`;
    let subtopic = subtopics.get(subtopicKey);
    if (!subtopic) {
      const order = [...subtopics.keys()].filter((k) => k.startsWith(`${topicKey}:`)).length;
      subtopic = { id: randomUUID(), topicId: topic.id, title: row.subtopicTitle, order };
      subtopics.set(subtopicKey, subtopic);
    }

    if (row.objectiveText.trim()) {
      objectives.push({
        id: randomUUID(),
        subtopicId: subtopic.id,
        text: row.objectiveText,
        qcaaReference: row.qcaaReference || null,
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    // Cascades through topics, subtopics and objectives.
    await tx.unit.deleteMany({ where: { subjectId } });

    await tx.unit.createMany({
      data: [...units].map(([number, u]) => ({
        id: u.id,
        userId,
        subjectId,
        number,
        title: u.title,
        order: u.order,
      })),
    });
    await tx.topic.createMany({
      data: [...topics.values()].map((t) => ({
        id: t.id,
        userId,
        unitId: t.unitId,
        number: t.number,
        title: t.title,
        order: t.order,
      })),
    });
    await tx.subtopic.createMany({
      data: [...subtopics.values()].map((s) => ({
        id: s.id,
        userId,
        topicId: s.topicId,
        title: s.title,
        order: s.order,
      })),
    });
    await tx.learningObjective.createMany({
      data: objectives.map((o) => ({
        id: o.id,
        userId,
        subtopicId: o.subtopicId,
        text: o.text,
        qcaaReference: o.qcaaReference,
      })),
    });
  });

  await initializeUnlockState(userId, subjectId);
}
