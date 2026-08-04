"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { replaceCurriculumTree } from "@/lib/curriculum";
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

  await replaceCurriculumTree(user.id, subject.id, rows);
  redirect(`/subjects/${shortCode}`);
}
