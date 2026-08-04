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
  // Optional so the existing tests and any caller that only cares about timing
  // don't have to supply it. Every imported block currently has room === null:
  // the calendar screenshots Beschy imported in Phase 10 didn't carry rooms.
  room?: string | null;
};

import { LABEL_SUBJECT_CODE, STUDY_BLOCK_PATTERNS } from "@/config/timetable";

const APP_TIMEZONE = "Australia/Brisbane";

export function localDayAndMinutes(date: Date): { day: number; minutes: number } {
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

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * The next block starting strictly after `now`, in timetable order.
 *
 * Two blocks can share a start time — Beschy's real Wednesday has both
 * "Cert III Fitness" and Biology in P4, and both Psychology and PE in P5.
 * That is either an A/B week rotation or an import artefact and is unresolved,
 * so this returns EVERY block at that start time rather than silently picking
 * one. Callers render the ambiguity instead of hiding it.
 *
 * Returns [] once the day is over — the caller falls through to the first
 * after-school study block, per §4.1.
 */
export function getNextBlocks(
  blocks: TimetableBlockLike[],
  now: Date,
): TimetableBlockLike[] {
  const { day, minutes } = localDayAndMinutes(now);
  const upcoming = blocks
    .filter((b) => b.dayOfWeek === day && timeToMinutes(b.startTime) > minutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  if (upcoming.length === 0) return [];
  const soonest = timeToMinutes(upcoming[0].startTime);
  return upcoming.filter((b) => timeToMinutes(b.startTime) === soonest);
}

/** Blocks for one weekday, in start order. Zero-length blocks are kept — the
 *  real data has a 20:45–20:45 wind-down marker and dropping it would quietly
 *  lose a row Beschy put there deliberately. */
export function getBlocksForDay(
  blocks: TimetableBlockLike[],
  dayOfWeek: number,
): TimetableBlockLike[] {
  return blocks
    .filter((b) => b.dayOfWeek === dayOfWeek)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export type BlockKind = "class" | "study" | "routine";

/**
 * What kind of block this is, for Next Departure.
 *
 * `knownCodes` is the set of the user's real subject shortCodes, so a label
 * beginning "ENG" only resolves when English actually exists. Returns the
 * inferred code separately from the linked one — the caller renders inferred
 * matches differently, because a regex on free text is a guess, not data.
 */
export function classifyBlock(
  block: TimetableBlockLike,
  knownCodes: ReadonlySet<string>,
): { kind: BlockKind; inferredCode: string | null } {
  if (block.subjectId) return { kind: "class", inferredCode: null };

  const label = block.label ?? "";
  const match = label.match(LABEL_SUBJECT_CODE);
  const candidate = match?.[1] ?? null;
  if (candidate && knownCodes.has(candidate)) {
    return { kind: "class", inferredCode: candidate };
  }

  if (STUDY_BLOCK_PATTERNS.some((p) => p.test(label))) {
    return { kind: "study", inferredCode: null };
  }
  return { kind: "routine", inferredCode: null };
}

/**
 * The next CLASS or STUDY block after `now` — routine is skipped, because you
 * cannot start a study session for "Drive home". Falls back to [] when the day
 * has nothing left, so the caller can show the nothing-booked invitation.
 *
 * Like getNextBlocks, returns every block sharing the soonest start time
 * rather than picking one out of a contested slot.
 */
export function getNextDepartureBlocks(
  blocks: TimetableBlockLike[],
  now: Date,
  knownCodes: ReadonlySet<string>,
): TimetableBlockLike[] {
  const { day, minutes } = localDayAndMinutes(now);
  const candidates = blocks
    .filter(
      (b) =>
        b.dayOfWeek === day &&
        timeToMinutes(b.startTime) > minutes &&
        classifyBlock(b, knownCodes).kind !== "routine",
    )
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  if (candidates.length === 0) return [];
  const soonest = timeToMinutes(candidates[0].startTime);
  return candidates.filter((b) => timeToMinutes(b.startTime) === soonest);
}

/** Start times that carry more than one block — the clash markers in Today. */
export function findClashes(blocks: TimetableBlockLike[]): Set<string> {
  const seen = new Map<string, number>();
  for (const b of blocks) seen.set(b.startTime, (seen.get(b.startTime) ?? 0) + 1);
  return new Set([...seen].filter(([, n]) => n > 1).map(([t]) => t));
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
