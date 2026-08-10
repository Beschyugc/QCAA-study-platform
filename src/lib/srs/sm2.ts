import {
  STARTING_EASE,
  MINIMUM_EASE,
  LAPSE_EASE_PENALTY,
  LEECH_THRESHOLD,
  LEARNING_STEPS_MINUTES,
  RELEARNING_STEPS_MINUTES,
  HARD_INTERVAL_FACTOR,
  EASY_BONUS,
  INTERVAL_FUZZ,
} from "@/config/srs";

// Pure SM-2 scheduler. No database access — input state in, output state
// out (§7.1: "Input state, output state"). The UI/DB layer is responsible
// for persisting SchedulingState and for suspending the Card when
// becameLeech is true.

export type Quality = 0 | 3 | 4 | 5; // Again, Hard, Good, Easy — brief §7.1

export type SrsState = "new" | "learning" | "review" | "relearning" | "leech";

export type SchedulingState = {
  state: SrsState;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  learningStep: number;
};

export type ReviewResult = {
  next: SchedulingState;
  dueAt: Date;
  becameLeech: boolean;
};

export function initialState(): SchedulingState {
  return {
    state: "new",
    easeFactor: STARTING_EASE,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    learningStep: 0,
  };
}

function easeDelta(quality: 3 | 4 | 5): number {
  // Classic SM-2 formula: EF' = EF + (0.1 - (5-q)(0.08 + (5-q)(0.02)))
  const q = quality;
  return 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
}

function fuzzedDays(days: number, random: () => number): number {
  const factor = 1 + (random() * 2 - 1) * INTERVAL_FUZZ; // [1 - fuzz, 1 + fuzz]
  return days * factor;
}

function minutesFromNow(now: Date, minutes: number): Date {
  return new Date(now.getTime() + minutes * 60_000);
}

function daysFromNow(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 86_400_000);
}

export const GRADES: readonly { quality: Quality; label: string }[] = [
  { quality: 0, label: "Again" },
  { quality: 3, label: "Hard" },
  { quality: 4, label: "Good" },
  { quality: 5, label: "Easy" },
];

/** Anki-style short delay, e.g. "<1m", "10m", "3h", "4d", "2.5mo", "1.4y". */
export function formatDelay(from: Date, to: Date): string {
  const minutes = (to.getTime() - from.getTime()) / 60_000;
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;
  const months = days / 30.4;
  if (months < 12) return `${round1(months)}mo`;
  return `${round1(days / 365)}y`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * What each button would schedule, for the labels under Again/Hard/Good/Easy.
 * Fuzz is neutralised so the preview matches what the user actually gets
 * (within the ±5% spread) and doesn't flicker between renders.
 */
export function previewIntervals(
  current: SchedulingState,
  now: Date,
): { quality: Quality; label: string; interval: string }[] {
  const noFuzz = () => 0.5; // maps to a fuzz factor of exactly 1
  return GRADES.map(({ quality, label }) => ({
    quality,
    label,
    interval: formatDelay(now, review(current, quality, now, noFuzz).dueAt),
  }));
}

export function review(
  current: SchedulingState,
  quality: Quality,
  now: Date,
  random: () => number = Math.random,
): ReviewResult {
  const isLearningPhase =
    current.state === "new" || current.state === "learning";
  const isRelearningPhase =
    current.state === "relearning" || current.state === "leech";

  if (quality === 0) {
    // Again.
    if (isLearningPhase) {
      // Restart learning steps — no lapse recorded; lapses count review
      // failures, not struggling to learn a card for the first time.
      return {
        next: { ...current, state: "learning", learningStep: 0 },
        dueAt: minutesFromNow(now, LEARNING_STEPS_MINUTES[0]),
        becameLeech: false,
      };
    }

    if (current.state === "review") {
      const lapses = current.lapses + 1;
      const easeFactor = Math.max(MINIMUM_EASE, current.easeFactor - LAPSE_EASE_PENALTY);
      const becameLeech = lapses >= LEECH_THRESHOLD;
      return {
        next: {
          state: becameLeech ? "leech" : "relearning",
          easeFactor,
          intervalDays: 0,
          repetitions: 0,
          lapses,
          learningStep: 0,
        },
        dueAt: minutesFromNow(now, RELEARNING_STEPS_MINUTES[0]),
        becameLeech,
      };
    }

    // isRelearningPhase: repeated failure while already relearning/leech.
    // Restart the (single) relearning step; lapses don't increment again —
    // they count review->relearning transitions, not retries within one.
    return {
      next: { ...current, learningStep: 0 },
      dueAt: minutesFromNow(now, RELEARNING_STEPS_MINUTES[0]),
      becameLeech: false,
    };
  }

  // quality is 3, 4, or 5 — some grade of success.
  if (isLearningPhase) {
    const nextStep = current.learningStep + 1;
    if (nextStep < LEARNING_STEPS_MINUTES.length) {
      return {
        next: { ...current, state: "learning", learningStep: nextStep },
        dueAt: minutesFromNow(now, LEARNING_STEPS_MINUTES[nextStep]),
        becameLeech: false,
      };
    }
    // Graduate. Ease doesn't move during the learning phase — it starts
    // adjusting once the card enters the review queue.
    return {
      next: {
        ...current,
        state: "review",
        repetitions: 1,
        intervalDays: fuzzedDays(1, random),
        learningStep: 0,
      },
      dueAt: daysFromNow(now, fuzzedDays(1, random)),
      becameLeech: false,
    };
  }

  if (isRelearningPhase) {
    // Graduating back out of relearning: treated the same as a fresh
    // learning graduation (back to a 1-day interval). The ease penalty
    // already applied at lapse time; not touched again here. Judgement
    // call — the brief doesn't fully specify post-relearning scheduling.
    return {
      next: {
        ...current,
        state: "review",
        repetitions: 1,
        intervalDays: fuzzedDays(1, random),
        learningStep: 0,
      },
      dueAt: daysFromNow(now, fuzzedDays(1, random)),
      becameLeech: false,
    };
  }

  // current.state === "review"
  const repetitions = current.repetitions + 1;
  const easeFactor = Math.max(
    MINIMUM_EASE,
    current.easeFactor + easeDelta(quality),
  );
  // Hard, Good and Easy have to diverge in interval, not just in ease —
  // otherwise the three buttons schedule identically and only Again means
  // anything. Hard advances on a fixed small multiple of the previous
  // interval, ignoring ease; Easy takes the Good interval and adds a bonus.
  let intervalDays: number;
  if (quality === 3) {
    intervalDays = Math.max(1, current.intervalDays * HARD_INTERVAL_FACTOR);
  } else if (repetitions === 1) {
    intervalDays = 1;
  } else if (repetitions === 2) {
    intervalDays = 6;
  } else {
    intervalDays = current.intervalDays * easeFactor;
  }
  if (quality === 5) intervalDays *= EASY_BONUS;
  intervalDays = fuzzedDays(intervalDays, random);

  return {
    next: {
      state: "review",
      easeFactor,
      intervalDays,
      repetitions,
      lapses: current.lapses,
      learningStep: 0,
    },
    dueAt: daysFromNow(now, intervalDays),
    becameLeech: false,
  };
}
