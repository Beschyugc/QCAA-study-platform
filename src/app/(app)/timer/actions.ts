"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { localDateKey, startOfLocalDay, startOfLocalWeek, addDays } from "@/lib/date";

export async function startStudySession(
  subjectId: string,
  topicId: string | null,
  sessionType: "in_school" | "after_school" | "weekend",
) {
  const user = await requireUser();
  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      subjectId,
      topicId,
      sessionType,
      startedAt: new Date(),
    },
  });
  return { id: session.id, startedAt: session.startedAt.toISOString() };
}

export async function endStudySession(
  sessionId: string,
  focusMinutes: number,
  breakMinutes: number,
  completedNaturally: boolean,
) {
  const user = await requireUser();
  await prisma.studySession.update({
    where: { id: sessionId, userId: user.id },
    data: { endedAt: new Date(), focusMinutes, breakMinutes, completedNaturally },
  });
  revalidatePath("/timer");
}

export async function getStudyStats() {
  const user = await requireUser();
  const now = new Date();
  const startOfToday = startOfLocalDay(now);
  const startOfWeek = startOfLocalWeek(now);

  const [todaySessions, weekSessions, allDates] = await Promise.all([
    prisma.studySession.aggregate({
      where: { userId: user.id, startedAt: { gte: startOfToday } },
      _sum: { focusMinutes: true },
    }),
    prisma.studySession.aggregate({
      where: { userId: user.id, startedAt: { gte: startOfWeek } },
      _sum: { focusMinutes: true },
    }),
    prisma.studySession.findMany({
      where: { userId: user.id, focusMinutes: { gt: 0 } },
      select: { startedAt: true },
      orderBy: { startedAt: "desc" },
      take: 400,
    }),
  ]);

  // Streak: consecutive days (including today) with at least one session,
  // measured in Brisbane calendar days (see lib/date.ts).
  const daysWithStudy = new Set(allDates.map((s) => localDateKey(s.startedAt)));
  // If today has no session yet, start counting from yesterday — an
  // in-progress streak shouldn't look broken before the day is even over.
  let streak = 0;
  let cursor = startOfToday;
  if (!daysWithStudy.has(localDateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while (daysWithStudy.has(localDateKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return {
    todayMinutes: todaySessions._sum.focusMinutes ?? 0,
    weekMinutes: weekSessions._sum.focusMinutes ?? 0,
    streak,
  };
}
