import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod, isWeekend } from "@/lib/timetable";
import { TimetableClient } from "./timetable-client";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TimetablePage() {
  const user = await requireUser();
  const [blocks, subjects] = await Promise.all([
    prisma.timetableBlock.findMany({
      where: { userId: user.id },
      include: { subject: { select: { name: true, shortCode: true, colour: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.subject.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  const now = new Date();
  const current = getCurrentPeriod(blocks, now);
  const status = isWeekend(now)
    ? "Weekend — after-school logic applies all day"
    : current
      ? `Now: ${current.label ?? current.periodName}`
      : "Free period / after school";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Timetable</h1>
      <p className="mb-6 text-sm text-muted-foreground">{status}</p>
      <TimetableClient
        subjects={subjects}
        blocksByDay={DAY_NAMES.map((name, day) => ({
          day,
          name,
          blocks: blocks.filter((b) => b.dayOfWeek === day),
        }))}
      />
    </div>
  );
}
