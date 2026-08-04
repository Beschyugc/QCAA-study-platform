"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createTimetableBlock(
  dayOfWeek: number,
  periodName: string,
  subjectId: string,
  startTime: string,
  endTime: string,
  room: string | null,
) {
  const user = await requireUser();
  await prisma.timetableBlock.create({
    data: { userId: user.id, dayOfWeek, periodName, subjectId, startTime, endTime, room },
  });
  revalidatePath("/timetable");
}

export async function deleteTimetableBlock(id: string) {
  const user = await requireUser();
  await prisma.timetableBlock.delete({ where: { id, userId: user.id } });
  revalidatePath("/timetable");
}

// Bulk paste: one line per block, tab or comma separated —
// day,period,subjectShortCode,start,end,room. Day is 0-6 (Sun-Sat) or a
// weekday name. Skips lines that don't resolve to a known subject rather
// than failing the whole paste.
export async function importTimetableCsv(text: string) {
  const user = await requireUser();
  const subjects = await prisma.subject.findMany({ where: { userId: user.id } });
  const bySubjectCode = new Map(subjects.map((s) => [s.shortCode.toUpperCase(), s.id]));
  const dayNames: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  };

  const rows = text
    .trim()
    .split("\n")
    .map((line) => line.split(/\t|,/).map((c) => c.trim()));

  let created = 0;
  for (const [day, period, code, start, end, room] of rows) {
    if (!day || !period || !code || !start || !end) continue;
    const dayNum = /^\d+$/.test(day) ? Number(day) : dayNames[day.toLowerCase().slice(0, 3)];
    const subjectId = bySubjectCode.get(code.toUpperCase());
    if (dayNum === undefined || !subjectId) continue;
    await prisma.timetableBlock.create({
      data: {
        userId: user.id,
        dayOfWeek: dayNum,
        periodName: period,
        subjectId,
        startTime: start,
        endTime: end,
        room: room || null,
      },
    });
    created++;
  }
  revalidatePath("/timetable");
  return { created, total: rows.length };
}
