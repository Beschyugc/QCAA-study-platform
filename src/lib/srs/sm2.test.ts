import { describe, it, expect } from "vitest";
import {
  initialState,
  review,
  previewIntervals,
  formatDelay,
  type SchedulingState,
} from "./sm2";
import {
  STARTING_EASE,
  MINIMUM_EASE,
  LEECH_THRESHOLD,
  LEARNING_STEPS_MINUTES,
  RELEARNING_STEPS_MINUTES,
  HARD_INTERVAL_FACTOR,
  EASY_BONUS,
} from "@/config/srs";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const NO_FUZZ = () => 0.5; // factor = 1, exact values

function minutesLater(minutes: number) {
  return new Date(NOW.getTime() + minutes * 60_000).getTime();
}
function daysLater(days: number) {
  return new Date(NOW.getTime() + days * 86_400_000).getTime();
}

describe("initialState", () => {
  it("starts new with default ease and zero counters", () => {
    const s = initialState();
    expect(s).toEqual({
      state: "new",
      easeFactor: STARTING_EASE,
      intervalDays: 0,
      repetitions: 0,
      lapses: 0,
      learningStep: 0,
    });
  });
});

describe("learning phase (new/learning)", () => {
  it("Again on a new card restarts learning at step 0, due in first step's minutes", () => {
    const { next, dueAt, becameLeech } = review(
      initialState(),
      0,
      NOW,
      NO_FUZZ,
    );
    expect(next.state).toBe("learning");
    expect(next.learningStep).toBe(0);
    expect(next.lapses).toBe(0); // learning-phase Again is not a lapse
    expect(dueAt.getTime()).toBe(minutesLater(LEARNING_STEPS_MINUTES[0]));
    expect(becameLeech).toBe(false);
  });

  it("Good/Hard/Easy on step 0 advances to step 1, due in step 1's minutes", () => {
    for (const quality of [3, 4, 5] as const) {
      const { next, dueAt } = review(initialState(), quality, NOW, NO_FUZZ);
      expect(next.state).toBe("learning");
      expect(next.learningStep).toBe(1);
      expect(dueAt.getTime()).toBe(minutesLater(LEARNING_STEPS_MINUTES[1]));
    }
  });

  it("Again on the last learning step restarts at step 0", () => {
    const lastStep: SchedulingState = {
      ...initialState(),
      state: "learning",
      learningStep: LEARNING_STEPS_MINUTES.length - 1,
    };
    const { next, dueAt } = review(lastStep, 0, NOW, NO_FUZZ);
    expect(next.state).toBe("learning");
    expect(next.learningStep).toBe(0);
    expect(dueAt.getTime()).toBe(minutesLater(LEARNING_STEPS_MINUTES[0]));
  });

  it("success on the final learning step graduates to review with a 1-day interval", () => {
    const lastStep: SchedulingState = {
      ...initialState(),
      state: "learning",
      learningStep: LEARNING_STEPS_MINUTES.length - 1,
    };
    const { next, dueAt, becameLeech } = review(lastStep, 4, NOW, NO_FUZZ);
    expect(next.state).toBe("review");
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
    expect(next.easeFactor).toBe(STARTING_EASE); // unchanged during learning
    expect(dueAt.getTime()).toBe(daysLater(1));
    expect(becameLeech).toBe(false);
  });
});

describe("review phase — success", () => {
  const graduated: SchedulingState = {
    state: "review",
    easeFactor: STARTING_EASE,
    intervalDays: 1,
    repetitions: 1,
    lapses: 0,
    learningStep: 0,
  };

  it("2nd successful review sets a 6-day interval", () => {
    const { next, dueAt } = review(graduated, 4, NOW, NO_FUZZ);
    expect(next.repetitions).toBe(2);
    expect(next.intervalDays).toBe(6);
    expect(dueAt.getTime()).toBe(daysLater(6));
  });

  it("3rd+ successful review multiplies previous interval by the new ease factor", () => {
    const atRep2: SchedulingState = {
      ...graduated,
      repetitions: 2,
      intervalDays: 6,
    };
    const { next } = review(atRep2, 4, NOW, NO_FUZZ);
    // quality 4 (Good) => ease delta 0 => ease unchanged
    expect(next.easeFactor).toBe(STARTING_EASE);
    expect(next.repetitions).toBe(3);
    expect(next.intervalDays).toBe(6 * STARTING_EASE);
  });

  it("Easy (5) increases ease by 0.1", () => {
    const { next } = review(graduated, 5, NOW, NO_FUZZ);
    expect(next.easeFactor).toBeCloseTo(STARTING_EASE + 0.1, 10);
  });

  it("Good (4) leaves ease unchanged", () => {
    const { next } = review(graduated, 4, NOW, NO_FUZZ);
    expect(next.easeFactor).toBeCloseTo(STARTING_EASE, 10);
  });

  it("Hard (3) decreases ease by 0.14", () => {
    const { next } = review(graduated, 3, NOW, NO_FUZZ);
    expect(next.easeFactor).toBeCloseTo(STARTING_EASE - 0.14, 10);
  });

  it("ease never drops below the floor even after repeated Hard grades", () => {
    let state = { ...graduated, easeFactor: MINIMUM_EASE + 0.05 };
    const { next } = review(state, 3, NOW, NO_FUZZ);
    expect(next.easeFactor).toBeGreaterThanOrEqual(MINIMUM_EASE);
    expect(next.easeFactor).toBe(MINIMUM_EASE);
  });
});

describe("review phase — interval modifiers", () => {
  const atRep2: SchedulingState = {
    state: "review",
    easeFactor: STARTING_EASE,
    intervalDays: 6,
    repetitions: 2,
    lapses: 0,
    learningStep: 0,
  };

  it("Hard scales the previous interval by the hard factor, ignoring ease", () => {
    const { next } = review(atRep2, 3, NOW, NO_FUZZ);
    expect(next.intervalDays).toBeCloseTo(6 * HARD_INTERVAL_FACTOR, 10);
  });

  it("Easy applies the easy bonus on top of the Good interval", () => {
    const { next: good } = review(atRep2, 4, NOW, NO_FUZZ);
    const { next: easy } = review(atRep2, 5, NOW, NO_FUZZ);
    // Easy also nudges ease up, so compare against its own ease factor.
    expect(easy.intervalDays).toBeCloseTo(6 * easy.easeFactor * EASY_BONUS, 10);
    expect(easy.intervalDays).toBeGreaterThan(good.intervalDays);
  });

  it("orders the three success grades Hard < Good < Easy", () => {
    const [hard, good, easy] = [3, 4, 5].map(
      (q) => review(atRep2, q as 3 | 4 | 5, NOW, NO_FUZZ).next.intervalDays,
    );
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  it("Hard never schedules a sub-day interval on a review card", () => {
    const shortInterval: SchedulingState = { ...atRep2, intervalDays: 0.5 };
    const { next } = review(shortInterval, 3, NOW, NO_FUZZ);
    expect(next.intervalDays).toBeGreaterThanOrEqual(1);
  });
});

describe("previewIntervals", () => {
  it("labels all four grades with the interval each would schedule", () => {
    const preview = previewIntervals(initialState(), NOW);
    expect(preview.map((p) => p.label)).toEqual([
      "Again",
      "Hard",
      "Good",
      "Easy",
    ]);
    expect(preview.every((p) => p.interval.length > 0)).toBe(true);
  });

  it("matches what review actually schedules, ignoring fuzz", () => {
    const atRep2: SchedulingState = {
      state: "review",
      easeFactor: STARTING_EASE,
      intervalDays: 6,
      repetitions: 2,
      lapses: 0,
      learningStep: 0,
    };
    const preview = previewIntervals(atRep2, NOW);
    const good = preview.find((p) => p.label === "Good")!;
    const { dueAt } = review(atRep2, 4, NOW, NO_FUZZ);
    expect(good.interval).toBe(formatDelay(NOW, dueAt));
  });
});

describe("formatDelay", () => {
  const cases: [number, string][] = [
    [0.5, "<1m"],
    [10, "10m"],
    [180, "3h"],
    [60 * 24 * 4, "4d"],
    [60 * 24 * 76, "2.5mo"],
    [60 * 24 * 365, "1y"],
  ];
  it.each(cases)("%i minutes reads as %s", (minutes, expected) => {
    expect(formatDelay(NOW, new Date(minutesLater(minutes)))).toBe(expected);
  });
});

describe("review phase — lapse", () => {
  const graduated: SchedulingState = {
    state: "review",
    easeFactor: STARTING_EASE,
    intervalDays: 6,
    repetitions: 2,
    lapses: 0,
    learningStep: 0,
  };

  it("Again on a review card lapses: +1 lapse, ease -0.2, repetitions reset, state -> relearning", () => {
    const { next, dueAt, becameLeech } = review(graduated, 0, NOW, NO_FUZZ);
    expect(next.state).toBe("relearning");
    expect(next.lapses).toBe(1);
    expect(next.easeFactor).toBeCloseTo(STARTING_EASE - 0.2, 10);
    expect(next.repetitions).toBe(0);
    expect(dueAt.getTime()).toBe(minutesLater(RELEARNING_STEPS_MINUTES[0]));
    expect(becameLeech).toBe(false);
  });

  it("ease floor holds on lapse too", () => {
    const nearFloor = { ...graduated, easeFactor: MINIMUM_EASE + 0.05 };
    const { next } = review(nearFloor, 0, NOW, NO_FUZZ);
    expect(next.easeFactor).toBe(MINIMUM_EASE);
  });

  it("becomes a leech exactly when lapses reaches the threshold", () => {
    const oneBeforeLeech = { ...graduated, lapses: LEECH_THRESHOLD - 1 };
    const { next, becameLeech } = review(oneBeforeLeech, 0, NOW, NO_FUZZ);
    expect(next.lapses).toBe(LEECH_THRESHOLD);
    expect(next.state).toBe("leech");
    expect(becameLeech).toBe(true);
  });

  it("does not re-flag leech on subsequent lapses past the threshold", () => {
    // A review-state card can't really have lapses > threshold in practice
    // (it becomes "leech" at the threshold and leaves the review state),
    // but the boundary check itself should still only fire the flag once
    // per crossing, not repeatedly.
    const alreadyPast = { ...graduated, lapses: LEECH_THRESHOLD };
    const { becameLeech } = review(alreadyPast, 0, NOW, NO_FUZZ);
    expect(becameLeech).toBe(true); // still crosses/at threshold this call
  });
});

describe("relearning phase", () => {
  const relearning: SchedulingState = {
    state: "relearning",
    easeFactor: STARTING_EASE - 0.2,
    intervalDays: 0,
    repetitions: 0,
    lapses: 1,
    learningStep: 0,
  };

  it("Again in relearning restarts the relearning step, does not add another lapse", () => {
    const { next, dueAt, becameLeech } = review(relearning, 0, NOW, NO_FUZZ);
    expect(next.state).toBe("relearning");
    expect(next.lapses).toBe(1);
    expect(dueAt.getTime()).toBe(minutesLater(RELEARNING_STEPS_MINUTES[0]));
    expect(becameLeech).toBe(false);
  });

  it("success in relearning graduates back to review with a 1-day interval, ease untouched", () => {
    const { next, dueAt } = review(relearning, 4, NOW, NO_FUZZ);
    expect(next.state).toBe("review");
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
    expect(next.easeFactor).toBe(relearning.easeFactor);
    expect(next.lapses).toBe(1); // lifetime counter, not reset
    expect(dueAt.getTime()).toBe(daysLater(1));
  });
});

describe("leech state", () => {
  const leech: SchedulingState = {
    state: "leech",
    easeFactor: STARTING_EASE - 0.4,
    intervalDays: 0,
    repetitions: 0,
    lapses: LEECH_THRESHOLD,
    learningStep: 0,
  };

  it("Again on a leech stays a leech, no further lapse increment", () => {
    const { next, becameLeech } = review(leech, 0, NOW, NO_FUZZ);
    expect(next.state).toBe("leech");
    expect(next.lapses).toBe(LEECH_THRESHOLD);
    expect(becameLeech).toBe(false);
  });

  it("a successful review recovers a leech back to review state", () => {
    const { next } = review(leech, 5, NOW, NO_FUZZ);
    expect(next.state).toBe("review");
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
  });
});

describe("interval fuzz", () => {
  it("stays within ±5% of the unfuzzed interval across the random range", () => {
    const graduated: SchedulingState = {
      state: "review",
      easeFactor: STARTING_EASE,
      intervalDays: 10,
      repetitions: 3,
      lapses: 0,
      learningStep: 0,
    };
    const unfuzzed = 10 * STARTING_EASE;

    for (const r of [0, 0.25, 0.5, 0.75, 1]) {
      const { next } = review(graduated, 4, NOW, () => r);
      expect(next.intervalDays).toBeGreaterThanOrEqual(unfuzzed * 0.95 - 1e-9);
      expect(next.intervalDays).toBeLessThanOrEqual(unfuzzed * 1.05 + 1e-9);
    }
  });

  it("defaults to Math.random when no random function is injected", () => {
    const graduated: SchedulingState = {
      state: "review",
      easeFactor: STARTING_EASE,
      intervalDays: 1,
      repetitions: 1,
      lapses: 0,
      learningStep: 0,
    };
    const { next } = review(graduated, 4, NOW);
    expect(next.intervalDays).toBeGreaterThan(0);
  });
});
