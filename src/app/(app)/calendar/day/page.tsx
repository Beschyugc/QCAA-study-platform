import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeek, decorateDay } from "@/lib/dashboard";
import { LINES } from "@/config/tokens";
import { DayEvents } from "./day-events";

export const dynamic = "force-dynamic";

const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function parseDateParam(raw: string | undefined): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date();
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function DayPage({
  searchParams,
}: PageProps<"/calendar/day">) {
  const user = await requireUser();
  const params = await searchParams;
  const dateParam = typeof params.date === "string" ? params.date : undefined;
  const date = parseDateParam(dateParam);
  const dateKey = isoDate(date);
  const dayOfWeek = date.getDay();

  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [{ blocks, codeBySubjectId }, events, subjects] = await Promise.all([
    getWeek(user.id),
    prisma.calendarEvent.findMany({
      where: { userId: user.id, start: { gte: dayStart, lt: dayEnd } },
      orderBy: { start: "asc" },
      include: { subject: { select: { shortCode: true, name: true } }, topic: { select: { title: true } } },
    }),
    prisma.subject.findMany({
      where: { userId: user.id },
      orderBy: { priorityWeight: "desc" },
      include: {
        units: {
          include: {
            topics: {
              where: { unlockState: { in: ["active", "mastered"] } },
              orderBy: { order: "asc" },
              select: { id: true, number: true, title: true },
            },
          },
        },
      },
    }),
  ]);

  const dayBlocks = decorateDay(blocks, codeBySubjectId, dayOfWeek);
  const today = isoDate(new Date());
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const subjectOptions = subjects.map((s) => ({
    id: s.id,
    shortCode: s.shortCode,
    name: s.name,
    topics: s.units.flatMap((u) =>
      u.topics.map((t) => ({ id: t.id, label: `U${u.number} T${t.number} ${t.title}` })),
    ),
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/calendar"
        // py-1.5 keeps this a ~27px tap target on a phone — it measured
        // 15px, under the 24px minimum.
        className="mb-3 inline-flex items-center gap-1.5 py-1.5 text-[0.64rem] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        Month view
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-[color:var(--text)]">
            {WEEKDAY_NAMES[dayOfWeek]}
          </h1>
          <p className="text-xs text-[color:var(--text-muted)]">
            {date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            {dateKey === today && (
              <span className="ml-2 rounded-full bg-[color:var(--state-good)] px-2 py-0.5 text-[0.6rem] font-semibold text-[#06231a]">
                Today
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href={`/calendar/day?date=${isoDate(prevDate)}`}
            className="rounded-lg border border-[color:var(--hairline)] px-3 py-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
          >
            ← Prev
          </Link>
          <Link
            href={`/calendar/day?date=${isoDate(nextDate)}`}
            className="rounded-lg border border-[color:var(--hairline)] px-3 py-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
          >
            Next →
          </Link>
        </div>
      </div>

      {dayBlocks.length > 0 && (
        <div className="mb-6">
          <p className="signage mb-2 text-[0.64rem] font-semibold text-[color:var(--text-faint)]">
            Timetable
          </p>
          <ul className="flex flex-col gap-1.5">
            {dayBlocks.map((b) => {
              const line = b.subjectCode ? LINES[b.subjectCode] : null;
              return (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-lg border border-l-[3px] border-[color:var(--hairline)] px-3 py-2 text-xs"
                  style={{ borderLeftColor: line ? `var(--line-${line.slug})` : "var(--hairline)" }}
                >
                  <span className="tabular-nums text-[color:var(--text-faint)]">
                    {b.startTime}–{b.endTime}
                  </span>
                  <span className="text-[color:var(--text)]">
                    {b.label ?? line?.label ?? b.periodName}
                  </span>
                  {b.room && <span className="text-[color:var(--text-faint)]">· {b.room}</span>}
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 text-[0.6rem] text-[color:var(--text-faint)]">
            Read-only — imported from your timetable.
          </p>
        </div>
      )}

      <DayEvents
        dateKey={dateKey}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start.toISOString(),
          end: e.end.toISOString(),
          subjectId: e.subjectId,
          subjectCode: e.subject?.shortCode ?? null,
          subjectName: e.subject?.name ?? null,
          topicId: e.topicId,
          topicTitle: e.topic?.title ?? null,
          activityType: e.activityType,
          status: e.status,
          notes: e.notes,
          source: e.source,
        }))}
        subjects={subjectOptions}
      />
    </div>
  );
}
