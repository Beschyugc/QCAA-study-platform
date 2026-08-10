"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function revalidate() {
  revalidatePath("/calendar");
}

export async function createEvent(data: {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  subjectId?: string;
  topicId?: string;
  activityType?: string;
  notes?: string;
}) {
  const user = await requireUser();
  if (!data.title.trim()) throw new Error("Title is required");

  const start = new Date(`${data.date}T${data.startTime}:00`);
  const end = new Date(`${data.date}T${data.endTime}:00`);
  if (end <= start) throw new Error("End time must be after start time");

  await prisma.calendarEvent.create({
    data: {
      userId: user.id,
      title: data.title.trim(),
      start,
      end,
      subjectId: data.subjectId || null,
      topicId: data.topicId || null,
      activityType: data.activityType || null,
      notes: data.notes?.trim() || null,
      isStudyBlock: Boolean(data.subjectId),
      source: "manual",
    },
  });
  revalidate();
}

export async function updateEvent(
  id: string,
  data: {
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    subjectId?: string | null;
    topicId?: string | null;
    activityType?: string | null;
    notes?: string | null;
  },
) {
  const user = await requireUser();
  const existing = await prisma.calendarEvent.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Event not found");

  // Recompute start/end together whenever either the date or a time
  // changes, so a lone startTime edit doesn't strand the day component
  // from the already-stored end timestamp. Local getters, not
  // toISOString() — that reads UTC, which is the wrong calendar day near
  // midnight in Brisbane (UTC+10) and always the wrong clock time.
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const toHM = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const date = data.date ?? toLocalDate(existing.start);
  const startTime = data.startTime ?? toHM(existing.start);
  const endTime = data.endTime ?? toHM(existing.end);
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);
  if (end <= start) throw new Error("End time must be after start time");

  await prisma.calendarEvent.update({
    where: { id },
    data: {
      title: data.title?.trim() ?? undefined,
      start,
      end,
      ...(data.subjectId !== undefined ? { subjectId: data.subjectId || null } : {}),
      ...(data.topicId !== undefined ? { topicId: data.topicId || null } : {}),
      ...(data.activityType !== undefined ? { activityType: data.activityType || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
    },
  });
  revalidate();
}

export async function setEventStatus(
  id: string,
  status: "scheduled" | "completed" | "skipped",
) {
  const user = await requireUser();
  await prisma.calendarEvent.update({
    where: { id, userId: user.id },
    data: { status },
  });
  revalidate();
}

export async function deleteEvent(id: string) {
  const user = await requireUser();
  await prisma.calendarEvent.delete({ where: { id, userId: user.id } });
  revalidate();
}

/** Creates a manual event straight from a dashboard recommendation's
 * "Start" action — source is stamped "recommendation" so it's visibly
 * distinguishable from something the student typed in themselves. */
export async function createEventFromRecommendation(data: {
  title: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  subjectId: string;
  topicId: string;
}) {
  const user = await requireUser();
  const start = new Date(`${data.date}T${data.startTime}:00`);
  const end = new Date(start.getTime() + data.durationMinutes * 60_000);

  await prisma.calendarEvent.create({
    data: {
      userId: user.id,
      title: data.title,
      start,
      end,
      subjectId: data.subjectId,
      topicId: data.topicId,
      isStudyBlock: true,
      source: "recommendation",
    },
  });
  revalidate();
}
