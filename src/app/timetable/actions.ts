"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractFromImage } from "@/lib/ai/vision";
import { AiUnavailableError } from "@/lib/ai/provider";

export async function createTimetableBlock(
  dayOfWeek: number,
  periodName: string,
  subjectId: string | null,
  label: string | null,
  startTime: string,
  endTime: string,
  room: string | null,
) {
  const user = await requireUser();
  await prisma.timetableBlock.create({
    data: { userId: user.id, dayOfWeek, periodName, subjectId, label, startTime, endTime, room },
  });
  revalidatePath("/timetable");
}

export async function deleteTimetableBlock(id: string) {
  const user = await requireUser();
  await prisma.timetableBlock.delete({ where: { id, userId: user.id } });
  revalidatePath("/timetable");
}

// Splits a line on tabs if any are present (spreadsheet paste, or the AI
// extraction prompt below, both use tabs specifically to avoid this), else
// falls back to commas. A pure comma-split broke on real data: a label
// like "UGC BLOCK — film, post, verify (start early if dinner's done)"
// has commas inside the field itself, which shifted every column after it
// and corrupted the row. Confirmed against a real photo-extracted row.
function splitRow(line: string): string[] {
  return (line.includes("\t") ? line.split("\t") : line.split(",")).map((c) => c.trim());
}

// Bulk paste: one line per block, tab-separated preferred (falls back to
// comma-separated for simple rows without embedded commas) —
// day,period,subject_code_or_label,start,end,room. Day is 0-6 (Sun-Sat) or
// a weekday name. If subject_code matches a known subject shortCode, the
// block links to that subject; otherwise the text is kept as a free-text
// label (Gym, Study Hall, UGC Block, ...) rather than being dropped — a
// full daily routine has plenty of non-class blocks worth tracking too.
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
    .filter((line) => line.trim())
    .map(splitRow);

  let created = 0;
  for (const [day, period, codeOrLabel, start, end, room] of rows) {
    if (!day || !period || !codeOrLabel || !start || !end) continue;
    const dayNum = /^\d+$/.test(day) ? Number(day) : dayNames[day.toLowerCase().slice(0, 3)];
    if (dayNum === undefined) continue;
    const subjectId = bySubjectCode.get(codeOrLabel.toUpperCase()) ?? null;
    await prisma.timetableBlock.create({
      data: {
        userId: user.id,
        dayOfWeek: dayNum,
        periodName: period,
        subjectId,
        label: subjectId ? null : codeOrLabel,
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

// Photo of a printed/handwritten/digital calendar -> the same CSV shape
// importTimetableCsv() already parses, so the review UI and import logic
// are shared rather than duplicated for this input method.
export async function extractTimetableFromPhoto(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No image provided");

  const subjects = await prisma.subject.findMany({ where: { userId: user.id } });
  const codes = subjects.map((s) => `${s.shortCode} (${s.name})`).join(", ");

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

  try {
    const csv = await extractFromImage(
      base64,
      mediaType,
      `This is a screenshot of a weekly calendar/timetable — it may include school classes AND personal routine blocks (gym, meals, study blocks, wind-down, etc.). Extract EVERY block into rows, ONE PER LINE, fields separated by a literal TAB character (not commas — block titles often contain commas, e.g. "UGC BLOCK — film, post, verify", and a comma separator would corrupt those rows), no header row, in exactly this field order:
day [TAB] period [TAB] subject_or_label [TAB] start_time [TAB] end_time [TAB] room

- day: full or 3-letter weekday name (Mon, Tue, ...) — use the actual weekday the block is under, not a date
- period: a short label for the slot (P1, "Morning", etc.) — invent something short and reasonable if the source doesn't label periods
- subject_or_label: if this block is clearly one of these known subjects, use its exact code: ${codes}. Otherwise, use the block's own name verbatim (e.g. "Gym", "Study Hall", "UGC Block — film, post, verify", "Lunch", "Drive to school", "Wind down") — don't skip non-class blocks, don't shorten them, just label them as-is, commas and all.
- start_time / end_time: 24-hour HH:MM
- room: room number/name if visible, else leave blank

If the same recurring block appears on multiple days, output one row per day. Output ONLY the tab-separated rows — no commentary, no markdown fences, no header row.`,
    );
    return { csv, error: null };
  } catch (error) {
    return {
      csv: null,
      error: error instanceof AiUnavailableError ? error.message : "Could not read the image.",
    };
  }
}
