import { describe, it, expect } from "vitest";
import { getCurrentPeriod, isWeekend, type TimetableBlockLike } from "./timetable";

const blocks: TimetableBlockLike[] = [
  { id: "1", dayOfWeek: 2, periodName: "P3", startTime: "10:00", endTime: "10:50", subjectId: "s1", label: null },
  { id: "2", dayOfWeek: 2, periodName: "P4", startTime: "10:50", endTime: "11:40", subjectId: "s2", label: null },
];

describe("getCurrentPeriod", () => {
  it("finds the block containing the current Brisbane time", () => {
    // Tuesday 2026-08-04, 10:20 AEST = 00:20 UTC.
    const now = new Date("2026-08-04T00:20:00.000Z");
    const found = getCurrentPeriod(blocks, now);
    expect(found?.id).toBe("1");
  });

  it("returns null between periods", () => {
    // 11:45 AEST = 01:45 UTC — after P4 ends.
    const now = new Date("2026-08-04T01:45:00.000Z");
    expect(getCurrentPeriod(blocks, now)).toBeNull();
  });

  it("handles the boundary at exactly the start time (inclusive)", () => {
    const now = new Date("2026-08-04T00:00:00.000Z"); // 10:00 AEST exactly
    expect(getCurrentPeriod(blocks, now)?.id).toBe("1");
  });

  it("handles the boundary at exactly the end time (exclusive)", () => {
    const now = new Date("2026-08-04T00:50:00.000Z"); // 10:50 AEST exactly -> P4 starts
    expect(getCurrentPeriod(blocks, now)?.id).toBe("2");
  });

  it("correctly resolves the Brisbane weekday even when UTC is still the previous day", () => {
    // An early-morning block: 00:20-01:00 AEST on Tuesday. 2026-08-04
    // 00:20 AEST = 2026-08-03 14:20 UTC (Monday in UTC terms) — a naive
    // UTC-day check would look for Monday's blocks and find nothing.
    const earlyBlock: TimetableBlockLike = {
      id: "3",
      dayOfWeek: 2,
      periodName: "Early",
      startTime: "00:20",
      endTime: "01:00",
      subjectId: "s3",
      label: null,
    };
    const now = new Date("2026-08-03T14:20:00.000Z");
    expect(getCurrentPeriod([...blocks, earlyBlock], now)?.id).toBe("3");
  });

  it("returns null on a day with no blocks", () => {
    const wednesday = new Date("2026-08-05T00:20:00.000Z");
    expect(getCurrentPeriod(blocks, wednesday)).toBeNull();
  });
});

describe("isWeekend", () => {
  it("is true on Saturday and Sunday in Brisbane time", () => {
    expect(isWeekend(new Date("2026-08-08T00:00:00.000Z"))).toBe(true); // Sat
    expect(isWeekend(new Date("2026-08-09T00:00:00.000Z"))).toBe(true); // Sun
  });

  it("is false on a weekday", () => {
    expect(isWeekend(new Date("2026-08-04T00:00:00.000Z"))).toBe(false); // Tue
  });
});
