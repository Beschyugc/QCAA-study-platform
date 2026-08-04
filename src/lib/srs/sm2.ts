import {
  STARTING_EASE,
  MINIMUM_EASE,
  LAPSE_EASE_PENALTY,
  LEECH_THRESHOLD,
  LEARNING_STEPS_MINUTES,
  RELEARNING_STEPS_MINUTES,
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
  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 6;
  else intervalDays = current.intervalDays * easeFactor;
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
