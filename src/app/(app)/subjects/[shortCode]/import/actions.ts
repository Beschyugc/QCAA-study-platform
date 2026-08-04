"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonToRows, replaceCurriculumTree } from "@/lib/curriculum";
import { csvToRows } from "@/lib/curriculum-csv";

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
