import { prisma } from "@/lib/prisma";
import { startOfLocalDay, localDateKey, addDays } from "@/lib/date";
import { getBlocksForDay, localDayAndMinutes, timeToMinutes } from "@/lib/timetable";

/**
 * The Today board: one day's PeriodTasks, joined onto the real timetable so
 * each instruction sits against the period it belongs to.
 *
 * The join is by `slotKey` matched against the block's periodName, not by
 * blockId. Timetable blocks are re-imported whenever the school calendar
 * changes and their ids do not survive that; "P3" does. blockId is kept as a
 * hint and used only when the slotKey is ambiguous.
 */

export type MentorSlot = {
  /** Present when this slot corresponds to a real timetabled block. */
  blockId: string | null;
  slotKey: string;
  label: string;
  startTime: string | null;
  endTime: string | null;
  /** True once the clock has passed this block's end time, today only. */
  past: boolean;
  current: boolean;
  tasks: MentorTask[];
};

export type MentorTask = {
  id: string;
  title: string;
  detail: string;
  subjectCode: string | null;
  subjectName: string | null;
  minutes: number;
  priority: number;
  status: "pending" | "done" | "partial" | "skipped";
  report: string | null;
  objectiveIds: string[];
  questionIds: string[];
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function getMentorDay(userId: string, date: Date) {
  const dayStart = startOfLocalDay(date);
  const { day: todayDow, minutes: nowMinutes } = localDayAndMinutes(new Date());
  const targetDow = localDayAndMinutes(date).day;
  const isToday = localDateKey(date) === localDateKey(new Date());

  const [tasks, blocks, subjects] = await Promise.all([
    prisma.periodTask.findMany({
      where: { userId, date: dayStart },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { subject: { select: { shortCode: true, name: true } } },
    }),
    prisma.timetableBlock.findMany({ where: { userId } }),
    prisma.subject.findMany({ where: { userId } }),
  ]);

  const dayBlocks = getBlocksForDay(blocks, targetDow);

  // Slots come from the timetable so a day with no tasks written yet still
  // renders its periods — an empty period reads as "nothing set for this
  // one", which is information, rather than the day looking blank.
  const slots: MentorSlot[] = dayBlocks.map((b) => {
    const subjectName = b.subjectId ? subjects.find((s) => s.id === b.subjectId)?.name : null;
    return {
      blockId: b.id,
      slotKey: b.periodName,
      label: subjectName ?? b.label ?? b.periodName,
      startTime: b.startTime,
      endTime: b.endTime,
      past: isToday && targetDow === todayDow && timeToMinutes(b.endTime) <= nowMinutes,
      current:
        isToday &&
        targetDow === todayDow &&
        timeToMinutes(b.startTime) <= nowMinutes &&
        nowMinutes < timeToMinutes(b.endTime),
      tasks: [],
    };
  });

  const unplaced: MentorTask[] = [];

  for (const t of tasks) {
    const task: MentorTask = {
      id: t.id,
      title: t.title,
      detail: t.detail,
      subjectCode: t.subject?.shortCode ?? null,
      subjectName: t.subject?.name ?? null,
      minutes: t.minutes,
      priority: t.priority,
      status: t.status,
      report: t.report,
      objectiveIds: asStringArray(t.objectiveIds),
      questionIds: asStringArray(t.questionIds),
    };

    const slot =
      (t.blockId ? slots.find((s) => s.blockId === t.blockId) : undefined) ??
      slots.find((s) => s.slotKey === t.slotKey);

    if (slot) slot.tasks.push(task);
    else unplaced.push({ ...task, title: `${t.slotKey} — ${task.title}` });
  }

  return { slots, unplaced, isToday, dayOfWeek: targetDow, dateKey: localDateKey(date) };
}

/** How much of the written plan Beschy has actually closed out, by day. */
export async function getMentorStreak(userId: string, days = 14) {
  const today = startOfLocalDay(new Date());
  const from = addDays(today, -(days - 1));
  const rows = await prisma.periodTask.findMany({
    where: { userId, date: { gte: from, lte: today } },
    select: { date: true, status: true },
  });

  const byDate = new Map<string, { total: number; done: number }>();
  for (const r of rows) {
    const key = localDateKey(r.date);
    const e = byDate.get(key) ?? { total: 0, done: 0 };
    e.total += 1;
    if (r.status === "done" || r.status === "partial") e.done += 1;
    byDate.set(key, e);
  }
  return byDate;
}
