import { describe, it, expect } from "vitest";
import { localDateKey, startOfLocalDay, startOfLocalWeek, addDays } from "./date";

describe("localDateKey", () => {
  it("treats a late-evening AEST timestamp as the correct Brisbane calendar day", () => {
    // 2026-08-04 22:34 AEST = 2026-08-04 12:34 UTC — same UTC day here,
    // but the case that broke the original bug was the reverse direction
    // (see startOfLocalDay test below).
    const d = new Date("2026-08-04T12:34:00.000Z");
    expect(localDateKey(d)).toBe("2026-08-04");
  });

  it("treats an early-morning AEST timestamp as still the same Brisbane day, even though UTC has not rolled over into it yet", () => {
    // 2026-08-04 00:30 AEST = 2026-08-03 14:30 UTC. A naive
    // toISOString().slice(0,10) would say "2026-08-03" here, which is the
    // exact bug this module exists to fix.
    const d = new Date("2026-08-03T14:30:00.000Z");
    expect(localDateKey(d)).toBe("2026-08-04");
  });
});

describe("startOfLocalDay", () => {
  it("returns midnight Brisbane time as a UTC instant", () => {
    const d = new Date("2026-08-04T12:34:00.000Z");
    const start = startOfLocalDay(d);
    // Midnight AEST (+10:00) = 14:00 UTC the previous day.
    expect(start.toISOString()).toBe("2026-08-03T14:00:00.000Z");
  });

  it("is idempotent for a timestamp already at local midnight", () => {
    const start = startOfLocalDay(new Date("2026-08-03T14:00:00.000Z"));
    expect(localDateKey(start)).toBe(localDateKey(new Date("2026-08-04T00:00:00+10:00")));
  });
});

describe("startOfLocalWeek", () => {
  it("rolls back to the most recent Sunday in Brisbane time", () => {
    // 2026-08-04 is a Tuesday in Brisbane.
    const tuesday = new Date("2026-08-04T12:00:00.000Z");
    const weekStart = startOfLocalWeek(tuesday);
    expect(localDateKey(weekStart)).toBe("2026-08-02"); // the preceding Sunday
  });

  it("stays put when already Sunday", () => {
    // 2026-08-02 is a Sunday.
    const sunday = new Date("2026-08-02T01:00:00.000Z");
    const weekStart = startOfLocalWeek(sunday);
    expect(localDateKey(weekStart)).toBe("2026-08-02");
  });
});

describe("addDays", () => {
  it("moves by exactly N calendar days regardless of DST-like edge cases", () => {
    const d = new Date("2026-08-04T12:00:00.000Z");
    expect(localDateKey(addDays(d, -1))).toBe("2026-08-03");
    expect(localDateKey(addDays(d, 7))).toBe("2026-08-11");
  });
});
