// Pure — no DB access. Figures out whether "now" falls inside a
// timetabled block, in Brisbane local time regardless of server timezone
// (same reasoning as lib/date.ts).
export type TimetableBlockLike = {
  id: string;
  dayOfWeek: number; // 0=Sun .. 6=Sat
  periodName: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  subjectId: string | null;
  label: string | null;
};

const APP_TIMEZONE = "Australia/Brisbane";

function localDayAndMinutes(date: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekdayShort = parts.find((p) => p.type === "weekday")!.value;
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  const minute = Number(parts.find((p) => p.type === "minute")!.value);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return { day: dayMap[weekdayShort], minutes: hour * 60 + minute };
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function getCurrentPeriod(
  blocks: TimetableBlockLike[],
  now: Date,
): TimetableBlockLike | null {
  const { day, minutes } = localDayAndMinutes(now);
  return (
    blocks.find(
      (b) =>
        b.dayOfWeek === day &&
        timeToMinutes(b.startTime) <= minutes &&
        minutes < timeToMinutes(b.endTime),
    ) ?? null
  );
}

export function isWeekend(now: Date): boolean {
  const { day } = localDayAndMinutes(now);
  return day === 0 || day === 6;
}
