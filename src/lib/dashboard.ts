import { prisma } from "@/lib/prisma";
import { LINE_ORDER, lineFor, type SubjectCode } from "@/config/tokens";
import {
  classifyBlock,
  findClashes,
  getBlocksForDay,
  getCurrentPeriod,
  getNextDepartureBlocks,
  localDayAndMinutes,
  timeToMinutes,
  type BlockKind,
  type TimetableBlockLike,
} from "@/lib/timetable";

/**
 * Query layer for the dashboard. Every number here comes from the database.
 * Where there is no data the shape returned is empty or null and the component
 * renders an empty state — nothing in this file invents a plausible-looking
 * figure to fill a gap.
 *
 * Worth knowing while reading this: right now the curriculum tables are
 * genuinely empty (0 units, 0 topics, 0 objectives, 0 cards). Almost
 * everything below correctly returns zeroes. That is the data being honest,
 * not the queries being broken.
 */

export type LineStation = {
  topicId: string;
  number: number;
  title: string;
  state: "locked" | "active" | "mastered";
  needsReview: boolean;
  cardsDue: number;
  redObjectives: number;
  amberObjectives: number;
  greenObjectives: number;
};

export type LineState = {
  code: SubjectCode;
  subjectId: string;
  name: string;
  label: string;
  icon: string;
  /** Ordered stations along the line: every topic in the subject, unit order then topic order. */
  stations: LineStation[];
  /** Index into `stations` of the active topic, or -1 if none is active. */
  activeIndex: number;
  /** "U3 T3" — where the train is. Null when nothing is active. */
  position: string | null;
  masteredCount: number;
  cardsDue: number;
  redObjectives: number;
};

export type DashboardBlock = TimetableBlockLike & {
  subjectCode: SubjectCode | null;
  /**
   * True when subjectCode was read off the label rather than a real link
   * (see classifyBlock). The UI marks these so a guess never reads as a fact.
   */
  codeInferred: boolean;
  kind: BlockKind;
  /** True when another block shares this start time. */
  clashes: boolean;
};

export type NextDeparture = {
  blocks: DashboardBlock[];
  startTime: string;
  minutesAway: number;
  /** The line for the departure, when exactly one subject is involved. */
  code: SubjectCode | null;
  /** Set only when the slot is contested, so the panel can say so out loud. */
  clashNote: string | null;
};

/** Sunday = 0, matching TimetableBlock.dayOfWeek and lib/date.ts. */
export function currentWeekday(now: Date): number {
  return localDayAndMinutes(now).day;
}

async function loadBlocks(userId: string): Promise<TimetableBlockLike[]> {
  const rows = await prisma.timetableBlock.findMany({ where: { userId } });
  return rows.map((r) => ({
    id: r.id,
    dayOfWeek: r.dayOfWeek,
    periodName: r.periodName,
    startTime: r.startTime,
    endTime: r.endTime,
    subjectId: r.subjectId,
    label: r.label,
    room: r.room,
  }));
}

/**
 * The full week of timetable blocks plus a subjectId -> shortCode map, so the
 * week strip can switch days without another round trip. 86 rows total — not
 * worth paginating.
 */
export async function getWeek(userId: string): Promise<{
  blocks: TimetableBlockLike[];
  codeBySubjectId: Map<string, SubjectCode>;
}> {
  const [blocks, subjects] = await Promise.all([
    loadBlocks(userId),
    prisma.subject.findMany({ where: { userId }, select: { id: true, shortCode: true } }),
  ]);
  const codeBySubjectId = new Map<string, SubjectCode>();
  for (const s of subjects) {
    if (lineFor(s.shortCode)) codeBySubjectId.set(s.id, s.shortCode as SubjectCode);
  }
  return { blocks, codeBySubjectId };
}

function decorate(
  block: TimetableBlockLike,
  codeBySubjectId: Map<string, SubjectCode>,
  knownCodes: ReadonlySet<string>,
  clashes: boolean,
): DashboardBlock {
  const { kind, inferredCode } = classifyBlock(block, knownCodes);
  const linked = block.subjectId ? (codeBySubjectId.get(block.subjectId) ?? null) : null;
  return {
    ...block,
    subjectCode: linked ?? (inferredCode as SubjectCode | null),
    codeInferred: linked === null && inferredCode !== null,
    kind,
    clashes,
  };
}

export function decorateDay(
  blocks: TimetableBlockLike[],
  codeBySubjectId: Map<string, SubjectCode>,
  dayOfWeek: number,
): DashboardBlock[] {
  const forDay = getBlocksForDay(blocks, dayOfWeek);
  const clashing = findClashes(forDay);
  const knownCodes = new Set(codeBySubjectId.values());
  return forDay.map((b) => decorate(b, codeBySubjectId, knownCodes, clashing.has(b.startTime)));
}

export function nextDeparture(
  blocks: TimetableBlockLike[],
  codeBySubjectId: Map<string, SubjectCode>,
  now: Date,
): NextDeparture | null {
  const knownCodes = new Set(codeBySubjectId.values());
  // Classes and study blocks only — routine is skipped, so "Drive to school"
  // never gets offered as something to start a timer for.
  const next = getNextDepartureBlocks(blocks, now, knownCodes);
  if (next.length === 0) return null;

  const { minutes } = localDayAndMinutes(now);
  const decorated: DashboardBlock[] = next.map((b) =>
    decorate(b, codeBySubjectId, knownCodes, next.length > 1),
  );

  // Only claim a line when the departure is unambiguous. Two subjects at the
  // same time means we genuinely don't know which one is on.
  const codes = [...new Set(decorated.map((d) => d.subjectCode).filter(Boolean))];

  return {
    blocks: decorated,
    startTime: next[0].startTime,
    minutesAway: timeToMinutes(next[0].startTime) - minutes,
    code: codes.length === 1 ? (codes[0] as SubjectCode) : null,
    clashNote:
      next.length > 1
        ? "Two blocks are booked at this time — the timetable import doesn't say which one is on."
        : null,
  };
}

export function currentBlock(
  blocks: TimetableBlockLike[],
  now: Date,
): TimetableBlockLike | null {
  return getCurrentPeriod(blocks, now);
}

/**
 * Every subject's line: its stations, where the train is, and the counts the
 * map and Zone 3 need.
 *
 * One query per concern rather than per subject — with five subjects and a
 * potentially long topic list, N+1 here would be felt on every dashboard load,
 * and the brief asks for interactive in under 1.5s.
 */
export async function getLineStates(userId: string): Promise<LineState[]> {
  const subjects = await prisma.subject.findMany({
    where: { userId, isActive: true },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          topics: {
            orderBy: { order: "asc" },
            include: {
              subtopics: { include: { learningObjectives: { select: { ragStatus: true } } } },
            },
          },
        },
      },
    },
  });

  const topicIds = subjects.flatMap((s) => s.units.flatMap((u) => u.topics.map((t) => t.id)));

  // Cards due per topic, in one grouped query rather than one per station.
  const dueRows =
    topicIds.length === 0
      ? []
      : await prisma.card.groupBy({
          by: ["topicId"],
          where: {
            userId,
            topicId: { in: topicIds },
            isSuspended: false,
            scheduling: { dueDate: { lte: new Date() } },
          },
          _count: true,
        });
  const dueByTopic = new Map(dueRows.map((r) => [r.topicId, r._count]));

  const states: LineState[] = [];

  for (const code of LINE_ORDER) {
    const subject = subjects.find((s) => s.shortCode === code);
    const line = lineFor(code);
    if (!subject || !line) continue;

    const stations: LineStation[] = [];
    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        const objectives = topic.subtopics.flatMap((st) => st.learningObjectives);
        stations.push({
          topicId: topic.id,
          number: topic.number,
          title: topic.title,
          state: topic.unlockState,
          needsReview: topic.needsReview,
          cardsDue: dueByTopic.get(topic.id) ?? 0,
          redObjectives: objectives.filter((o) => o.ragStatus === "red").length,
          amberObjectives: objectives.filter((o) => o.ragStatus === "amber").length,
          greenObjectives: objectives.filter((o) => o.ragStatus === "green").length,
        });
      }
    }

    const activeIndex = stations.findIndex((s) => s.state === "active");
    // Position is written from the unit/topic numbers rather than the array
    // index, so it reads "U3 T3" even when earlier units are partly imported.
    let position: string | null = null;
    if (activeIndex >= 0) {
      for (const unit of subject.units) {
        const match = unit.topics.find((t) => t.id === stations[activeIndex].topicId);
        if (match) {
          position = `U${unit.number} T${match.number}`;
          break;
        }
      }
    }

    states.push({
      code,
      subjectId: subject.id,
      name: subject.name,
      label: line.label,
      icon: line.icon,
      stations,
      activeIndex,
      position,
      masteredCount: stations.filter((s) => s.state === "mastered").length,
      cardsDue: stations.reduce((sum, s) => sum + s.cardsDue, 0),
      redObjectives: stations.reduce((sum, s) => sum + s.redObjectives, 0),
    });
  }

  return states;
}
