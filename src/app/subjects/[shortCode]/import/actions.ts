"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvToRows, type CurriculumRow } from "@/lib/curriculum-csv";

type JsonUnit = {
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

function jsonToRows(units: JsonUnit[]): CurriculumRow[] {
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
// it from the file. Simple and predictable for "edit in a spreadsheet,
// re-import" — but it means RAG ratings and rag_history reset, since new
// rows get new ids. Fine pre-Phase-4 (no cards reference these ids yet);
// worth revisiting once cards/reviews exist.
export async function importCurriculum(
  shortCode: string,
  format: "csv" | "json",
  text: string,
) {
  const user = await requireUser();
  const subject = await prisma.subject.findFirstOrThrow({
    where: { userId: user.id, shortCode: shortCode.toUpperCase() },
  });

  const rows =
    format === "csv" ? csvToRows(text) : jsonToRows(JSON.parse(text));

  await prisma.$transaction(async (tx) => {
    await tx.unit.deleteMany({ where: { subjectId: subject.id } });

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
            userId: user.id,
            subjectId: subject.id,
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
            userId: user.id,
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
          data: {
            userId: user.id,
            topicId,
            title: row.subtopicTitle,
            order,
          },
        });
        subtopicId = subtopic.id;
        subtopicIds.set(subtopicKey, subtopicId);
      }

      if (row.objectiveText.trim()) {
        await tx.learningObjective.create({
          data: {
            userId: user.id,
            subtopicId,
            text: row.objectiveText,
            qcaaReference: row.qcaaReference || null,
          },
        });
      }
    }
  });

  redirect(`/subjects/${shortCode}`);
}
