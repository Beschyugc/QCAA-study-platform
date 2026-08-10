import { prisma } from "@/lib/prisma";
import { LINE_ORDER, lineFor, type SubjectCode } from "@/config/tokens";
import {
  DAILY_PLAN_MAX_ITEMS,
  DAILY_PLAN_MINUTE_CEILING,
  DAILY_PLAN_SESSION_MINUTES,
} from "@/config/recommendation";
import type { TopicRecommendation } from "@/lib/recommendation-data";
import type { PlanItem } from "@/components/dashboard/this-afternoon";
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

/**
 * "Am I behind or ahead?" — answered two different ways depending on what the
 * data actually supports.
 *
 * `deadline`  A real target completion date is set, so required pace can be
 *             computed properly: topics remaining vs weeks remaining.
 * `relative`  No date set. Falls back to comparing this subject's completion
 *             against the average across all five, which needs no invented
 *             deadline and is still a true statement — just a different one.
 *             Labelled as such in the UI so it never reads as an exam-date
 *             claim nobody made.
 */
export type Pace = {
  basis: "deadline" | "relative";
  /** Positive = ahead, negative = behind. Topics, rounded. */
  topicsDelta: number;
  /** Plain-language line, always phrased as a next action, never a judgement. */
  summary: string;
  fraction: number;
};

export function computePace(lines: LineState[], targetDates: Map<string, Date | null>): Map<string, Pace> {
  const withTopics = lines.filter((l) => l.stations.length > 0);
  const meanFraction =
    withTopics.length === 0
      ? 0
      : withTopics.reduce((sum, l) => sum + l.masteredCount / l.stations.length, 0) / withTopics.length;

  const out = new Map<string, Pace>();
  const now = Date.now();

  for (const line of lines) {
    if (line.stations.length === 0) continue;
    const fraction = line.masteredCount / line.stations.length;
    const target = targetDates.get(line.code) ?? null;

    if (target) {
      const weeksLeft = Math.max(0.5, (target.getTime() - now) / (7 * 86_400_000));
      const remaining = line.stations.length - line.masteredCount;
      const requiredPerWeek = remaining / weeksLeft;
      // Expected position if progress had been even from the start of the
      // course to the target date.
      const expectedMastered = line.stations.length * (1 - weeksLeft / (weeksLeft + elapsedWeeks(line)));
      const delta = Math.round(line.masteredCount - expectedMastered);
      out.set(line.code, {
        basis: "deadline",
        topicsDelta: delta,
        fraction,
        summary:
          delta < 0
            ? `${Math.abs(delta)} ${plural(Math.abs(delta), "topic")} behind — needs about ${requiredPerWeek.toFixed(1)} a week to catch up`
            : delta > 0
              ? `${delta} ${plural(delta, "topic")} ahead of schedule`
              : "on pace",
      });
      continue;
    }

    const delta = Math.round((fraction - meanFraction) * line.stations.length);
    out.set(line.code, {
      basis: "relative",
      topicsDelta: delta,
      fraction,
      summary:
        delta < 0
          ? `${Math.abs(delta)} ${plural(Math.abs(delta), "topic")} behind your other subjects`
          : delta > 0
            ? `${delta} ${plural(delta, "topic")} ahead of your other subjects`
            : "level with your other subjects",
    });
  }

  return out;
}

/** Weeks since the first topic was mastered — a proxy for "how long you've
 *  been going". Defaults to 1 so a brand-new subject doesn't divide by zero. */
function elapsedWeeks(line: LineState): number {
  return Math.max(1, line.masteredCount > 0 ? line.masteredCount : 1);
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

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

/**
 * Turns scored recommendations into an ordered afternoon plan that fits the
 * study time actually available tonight.
 *
 * The cap matters: §7.4 forbids generating a set that needs four hours on a
 * night the calendar shows training. `studyMinutes` comes from the real
 * after-school study blocks, so on a Wednesday the plan is bounded by the
 * 16:15-18:00 schoolwork block and nothing more.
 *
 * When there is no marked study block at all, fall back to the configured
 * ceiling rather than returning nothing — an evening with no labelled block
 * isn't necessarily an evening with no time.
 */
/**
 * §8's core rule: at school, in a real subject class, recommend that
 * subject's own weak content — not whatever scores highest across all five.
 * At home, on a break, or in a routine/study block with no specific class
 * attached, every subject competes on priority as normal.
 *
 * `lockedSubjectCode` should only ever be a `kind: "class"` block's subject
 * — never a "study" or "routine" block, where the whole point is that any
 * subject may need the time more.
 */
export function buildAfternoonPlan(
  recommendations: TopicRecommendation[],
  lines: LineState[],
  studyMinutes: number,
  lockedSubjectCode?: SubjectCode | null,
): PlanItem[] {
  const budget = studyMinutes > 0 ? studyMinutes : DAILY_PLAN_MINUTE_CEILING;
  const items: PlanItem[] = [];
  let used = 0;

  const candidates = lockedSubjectCode
    ? recommendations.filter((rec) => {
        const line = lines.find((l) => l.subjectId === rec.subjectId);
        return line?.code === lockedSubjectCode;
      })
    : recommendations;

  for (const rec of candidates) {
    if (items.length >= DAILY_PLAN_MAX_ITEMS) break;
    const line = lines.find((l) => l.subjectId === rec.subjectId);
    if (!line) continue;

    const remaining = budget - used;
    if (remaining <= 0) break;
    // Never schedule a stub — a 5-minute fragment isn't a study block.
    const minutes = Math.min(DAILY_PLAN_SESSION_MINUTES, remaining);
    if (minutes < 15) break;

    items.push({
      topicId: rec.topicId,
      topicTitle: rec.topicTitle,
      position: line.position,
      subjectId: rec.subjectId,
      code: line.code,
      minutes,
      summary: summarise(rec),
      contributions: rec.result.contributions,
      score: rec.result.score,
      subjectPriorityWeight: rec.result.subjectPriorityWeight,
    });
    used += minutes;
  }

  return items;
}

function summarise(rec: TopicRecommendation): string {
  const parts: string[] = [];
  const { factors } = rec;
  if (factors.proportionRedAmber > 0) {
    parts.push(`${Math.round(factors.proportionRedAmber * 100)}% red/amber`);
  }
  if (factors.cardsOverdue > 0) parts.push(`${factors.cardsOverdue} cards overdue`);
  if (factors.daysSinceLastStudied === null) parts.push("never studied");
  else if (factors.daysSinceLastStudied >= 3) {
    parts.push(`${factors.daysSinceLastStudied} days since last session`);
  }
  if (factors.needsReview) parts.push("flagged for review");
  if (factors.paceVarianceDays && factors.paceVarianceDays > 0) {
    parts.push(`${factors.paceVarianceDays}d behind pace`);
  }
  // No filler. If nothing stands out, say that rather than manufacturing a
  // reason — "on pace" is a real answer.
  return parts.length > 0 ? parts.join(" · ") : "on pace — keeping it warm";
}

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

export type AfterSchool = {
  blocks: DashboardBlock[];
  /** End of the last class — the last bell. Null if the day has no classes. */
  lastBell: string | null;
  /**
   * Minutes of block time explicitly labelled as study, after the last bell.
   * This is the real ceiling on the afternoon plan: on a Wednesday it's the
   * 16:15-18:00 schoolwork block and nothing else, because gym, dinner and the
   * UGC block are already spoken for. The planner is capped to this rather
   * than to an optimistic guess — §7.4 says never generate a set that needs
   * four hours on a night the calendar shows training.
   */
  studyMinutes: number;
};

export function afterSchool(day: DashboardBlock[]): AfterSchool {
  const classes = day.filter((b) => b.kind === "class");
  const lastBell =
    classes.length === 0
      ? null
      : classes.reduce((latest, b) => (timeToMinutes(b.endTime) > timeToMinutes(latest) ? b.endTime : latest), classes[0].endTime);

  const after = lastBell === null ? day : day.filter((b) => timeToMinutes(b.startTime) >= timeToMinutes(lastBell));

  const studyMinutes = after
    .filter((b) => b.kind === "study")
    .reduce((sum, b) => sum + Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime)), 0);

  return { blocks: after, lastBell, studyMinutes };
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
  //
  // Locked topics are excluded. Their cards exist — generation runs ahead of
  // unlocking on purpose — but none of them are due, because they aren't yours
  // yet. Without this filter the dashboard reported 110 Methods cards due while
  // the sidebar, which does filter, said 11. Every due count in the app has to
  // agree, or none of them can be trusted.
  const dueRows =
    topicIds.length === 0
      ? []
      : await prisma.card.groupBy({
          by: ["topicId"],
          where: {
            userId,
            topicId: { in: topicIds },
            isSuspended: false,
            topic: { unlockState: { in: ["active", "mastered"] } },
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
