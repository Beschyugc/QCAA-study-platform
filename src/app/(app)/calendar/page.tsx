import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local calendar date as a key — never UTC, or a review just before/after
 * midnight in the browser's timezone lands on the wrong day's cell. */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** 0 = nothing, 4 = a big day. Tuned for "did you touch this subject today",
 * not "how many of the 3,532 cards exist" — most real sessions are 10-40
 * reviews, so the top tier should be reachable on an actual good day. */
function tierFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count < 5) return 1;
  if (count < 15) return 2;
  if (count < 30) return 3;
  return 4;
}
const TIER_PERCENT = [0, 25, 50, 75, 100];

export default async function CalendarPage({
  searchParams,
}: PageProps<"/calendar">) {
  const user = await requireUser();
  const params = await searchParams;
  const monthParam = typeof params.month === "string" ? params.month : undefined;

  const now = new Date();
  const match = monthParam?.match(/^(\d{4})-(\d{2})$/);
  const year = match ? Number(match[1]) : now.getFullYear();
  const month = match ? Number(match[2]) : now.getMonth() + 1; // 1-indexed

  const monthStart = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = monthStart.getDay(); // 0 = Sunday

  const prevMonthDate = new Date(year, month - 2, 1);
  const nextMonthDate = new Date(year, month, 1);
  const monthHref = (d: Date) => `/calendar?month=${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

  // Streak needs "today backward" regardless of which month is on screen, so
  // it's queried from a fixed window rather than the visible month's range.
  const streakWindowStart = addDays(startOfDay(now), -400);
  const queryStart = streakWindowStart < monthStart ? streakWindowStart : monthStart;

  const reviews = await prisma.review.findMany({
    where: { userId: user.id, reviewedAt: { gte: queryStart } },
    select: { reviewedAt: true },
  });

  const countsByDay = new Map<string, number>();
  for (const r of reviews) {
    const key = dayKey(r.reviewedAt);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  // Consecutive days with >=1 review, walking back from today. If today has
  // no reviews yet, that doesn't break a streak still standing from
  // yesterday — it just hasn't extended it yet.
  let streak = 0;
  let cursor = startOfDay(now);
  if ((countsByDay.get(dayKey(cursor)) ?? 0) === 0) cursor = addDays(cursor, -1);
  while ((countsByDay.get(dayKey(cursor)) ?? 0) > 0) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const activeDaysThisMonth = Array.from({ length: daysInMonth }, (_, i) =>
    countsByDay.get(`${year}-${pad(month)}-${pad(i + 1)}`),
  ).filter((c) => (c ?? 0) > 0).length;

  const todayKey = dayKey(now);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-[color:var(--text)]">
            Calendar
          </h1>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            {activeDaysThisMonth} of {daysInMonth} days studied this month
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-[color:var(--hairline)] px-3 py-1.5">
            <Flame className="h-4 w-4" style={{ color: "var(--streak-ember)" }} aria-hidden />
            <span className="tabular-nums text-sm font-semibold text-[color:var(--text)]">
              {streak}
            </span>
            <span className="text-[0.64rem] text-[color:var(--text-muted)]">day streak</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={monthHref(prevMonthDate)}
            className="rounded-lg p-1.5 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <p className="font-display text-sm font-semibold text-[color:var(--text)]">
            {MONTH_NAMES[month - 1]} {year}
          </p>
          <Link
            href={monthHref(nextMonthDate)}
            className="rounded-lg p-1.5 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_LABELS.map((d, i) => (
            <div
              key={i}
              className="pb-1 text-center text-[0.64rem] font-semibold text-[color:var(--text-faint)]"
            >
              {d}
            </div>
          ))}

          {Array.from({ length: firstWeekday }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const key = `${year}-${pad(month)}-${pad(day)}`;
            const count = countsByDay.get(key) ?? 0;
            const tier = tierFor(count);
            const isToday = key === todayKey;
            return (
              <div
                key={day}
                title={count > 0 ? `${count} card${count === 1 ? "" : "s"} reviewed` : "No reviews"}
                className="relative flex aspect-square flex-col items-center justify-center rounded-lg text-[0.7rem] tabular-nums"
                style={{
                  background:
                    tier === 0
                      ? "var(--surface-raised)"
                      : `color-mix(in srgb, var(--state-good) ${TIER_PERCENT[tier]}%, var(--surface-raised))`,
                  color: tier >= 3 ? "#0f1420" : "var(--text-muted)",
                  outline: isToday ? "1.5px solid var(--text)" : undefined,
                  outlineOffset: isToday ? "-1.5px" : undefined,
                }}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-end gap-1.5 text-[0.64rem] text-[color:var(--text-faint)]">
          <span>Less</span>
          {TIER_PERCENT.map((pct, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded"
              style={{
                background:
                  i === 0
                    ? "var(--surface-raised)"
                    : `color-mix(in srgb, var(--state-good) ${pct}%, var(--surface-raised))`,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <p className="mt-4 text-center text-[0.64rem] text-[color:var(--text-faint)]">
        Counts flashcard reviews only — one square per day, coloured by how many cards you reviewed
        that day.
      </p>
    </div>
  );
}
