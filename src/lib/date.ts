// Day-boundary helpers anchored to Queensland time, not the server's local
// timezone (Vercel runs UTC) and not raw UTC-ISO slicing either — both of
// those broke the streak calculation across the AEST offset (a session
// logged at 10pm AEST is still "today" in Brisbane but already the next
// UTC day). Queensland doesn't observe daylight saving, so a fixed +10:00
// offset is correct year-round — unlike Australia/Sydney.
const APP_TIMEZONE = "Australia/Brisbane";
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function localDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localWeekday(date: Date): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(date);
  return WEEKDAY_INDEX[short];
}

export function startOfLocalDay(date: Date): Date {
  return new Date(`${localDateKey(date)}T00:00:00+10:00`);
}

export function startOfLocalWeek(date: Date): Date {
  return addDays(startOfLocalDay(date), -localWeekday(date));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
