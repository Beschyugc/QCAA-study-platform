import { describe, it, expect } from "vitest";
import {
  findClashes,
  getBlocksForDay,
  getCurrentPeriod,
  classifyBlock,
  getNextBlocks,
  getNextDepartureBlocks,
  isWeekend,
  timeToMinutes,
  type TimetableBlockLike,
} from "./timetable";

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

// Beschy's real Wednesday, as imported. Kept faithful — including the two
// slots that carry two blocks each, because that ambiguity is the thing these
// helpers have to survive rather than paper over.
const wednesday: TimetableBlockLike[] = [
  { id: "w1", dayOfWeek: 3, periodName: "P1", startTime: "07:50", endTime: "09:09", subjectId: null, label: "ENG (EARLY — leave 7:30!)" },
  { id: "w2", dayOfWeek: 3, periodName: "P2", startTime: "09:10", endTime: "10:29", subjectId: "psy", label: null },
  { id: "w3", dayOfWeek: 3, periodName: "P3", startTime: "11:10", endTime: "12:29", subjectId: "bio", label: null },
  { id: "w4", dayOfWeek: 3, periodName: "Lunch", startTime: "12:30", endTime: "13:09", subjectId: null, label: "Lunch" },
  { id: "w5", dayOfWeek: 3, periodName: "P4", startTime: "13:10", endTime: "13:49", subjectId: null, label: "Cert III Fitness" },
  { id: "w6", dayOfWeek: 3, periodName: "P4", startTime: "13:10", endTime: "13:49", subjectId: "bio", label: null },
  { id: "w7", dayOfWeek: 3, periodName: "P5", startTime: "13:50", endTime: "15:09", subjectId: "psy", label: null },
  { id: "w8", dayOfWeek: 3, periodName: "P5", startTime: "13:50", endTime: "15:09", subjectId: "pe", label: null },
  { id: "w9", dayOfWeek: 3, periodName: "Wind down", startTime: "20:45", endTime: "20:45", subjectId: null, label: "Wind down → BED 9PM" },
];

describe("getBlocksForDay", () => {
  it("returns one day in start order", () => {
    const day = getBlocksForDay(wednesday, 3);
    expect(day.map((b) => b.id)).toEqual(["w1","w2","w3","w4","w5","w6","w7","w8","w9"]);
  });

  it("keeps the zero-length wind-down marker instead of dropping it", () => {
    expect(getBlocksForDay(wednesday, 3).some((b) => b.startTime === b.endTime)).toBe(true);
  });

  it("returns nothing for a day with no blocks", () => {
    expect(getBlocksForDay(wednesday, 6)).toEqual([]);
  });
});

describe("getNextBlocks", () => {
  it("returns the next block after now", () => {
    // Wednesday 2026-08-05, 10:45 AEST = 00:45 UTC.
    const now = new Date("2026-08-05T00:45:00.000Z");
    expect(getNextBlocks(wednesday, now).map((b) => b.id)).toEqual(["w3"]);
  });

  it("returns BOTH blocks when the next slot is contested, rather than guessing", () => {
    // 12:45 AEST — next up is the 13:10 slot, which has two blocks.
    const now = new Date("2026-08-05T02:45:00.000Z");
    expect(getNextBlocks(wednesday, now).map((b) => b.id).sort()).toEqual(["w5","w6"]);
  });

  it("excludes a block starting exactly now — that one is current, not next", () => {
    const now = new Date("2026-08-05T01:10:00.000Z"); // 11:10 AEST, P3 start
    expect(getNextBlocks(wednesday, now).map((b) => b.id)).not.toContain("w3");
  });

  it("returns empty once the day is done, so the caller can fall through", () => {
    const now = new Date("2026-08-05T11:00:00.000Z"); // 21:00 AEST
    expect(getNextBlocks(wednesday, now)).toEqual([]);
  });
});

describe("findClashes", () => {
  it("flags exactly the two contested start times", () => {
    expect([...findClashes(wednesday)].sort()).toEqual(["13:10", "13:50"]);
  });

  it("does not flag a normal single-block period", () => {
    expect(findClashes(wednesday).has("11:10")).toBe(false);
  });
});

describe("timeToMinutes", () => {
  it("converts HH:MM to minutes past midnight", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("13:49")).toBe(829);
    expect(timeToMinutes("20:45")).toBe(1245);
  });
});

describe("classifyBlock", () => {
  const known = new Set(["MM", "BIO", "PSY", "ENG", "PE"]);

  it("treats a linked block as a class", () => {
    expect(classifyBlock(wednesday[1], known)).toEqual({ kind: "class", inferredCode: null });
  });

  it("recovers the subject from a label that starts with a known code", () => {
    // "ENG (EARLY — leave 7:30!)" — imported without a subject link.
    expect(classifyBlock(wednesday[0], known)).toEqual({ kind: "class", inferredCode: "ENG" });
  });

  it("does not mistake Cert III Fitness for a subject", () => {
    expect(classifyBlock(wednesday[4], known)).toEqual({ kind: "routine", inferredCode: null });
  });

  it("does not invent a subject for an unknown leading code", () => {
    const ugc = { ...wednesday[0], id: "u", label: "UGC BLOCK — film, post, verify" };
    expect(classifyBlock(ugc, known)).toEqual({ kind: "routine", inferredCode: null });
  });

  it("recognises study blocks by their label", () => {
    const schoolwork = { ...wednesday[0], id: "s", label: "SCHOOLWORK — Anki + homework" };
    expect(classifyBlock(schoolwork, known).kind).toBe("study");
  });

  it("calls gym and dinner routine", () => {
    for (const label of ["Gym", "Dinner + chill", "Drive home", "Reset + snack"]) {
      const b = { ...wednesday[0], id: label, label };
      expect(classifyBlock(b, known).kind, label).toBe("routine");
    }
  });
});

describe("getNextDepartureBlocks", () => {
  const known = new Set(["MM", "BIO", "PSY", "ENG", "PE"]);

  it("skips routine — a drive to school is not a departure you can start", () => {
    // 07:09 AEST = 21:09 UTC the previous day.
    const now = new Date("2026-08-04T21:09:00.000Z");
    const next = getNextDepartureBlocks(wednesday, now, known);
    // 07:25 "Drive to school" is skipped in favour of 07:50 English.
    expect(next.map((b) => b.id)).toEqual(["w1"]);
  });

  it("narrows the P4 slot to the real class, since Cert III Fitness is routine", () => {
    // findClashes flags 13:10 because two blocks sit there, but only one of
    // them is something you can start a session for. The departure panel is
    // right to show Biology alone.
    const now = new Date("2026-08-05T02:45:00.000Z"); // 12:45 AEST
    expect(getNextDepartureBlocks(wednesday, now, known).map((b) => b.id)).toEqual(["w6"]);
  });

  it("returns both blocks when two real subjects contest a slot", () => {
    // P5 is the genuine ambiguity: Psychology and PE, both linked, same time.
    const now = new Date("2026-08-05T03:45:00.000Z"); // 13:45 AEST
    expect(getNextDepartureBlocks(wednesday, now, known).map((b) => b.id).sort()).toEqual([
      "w7",
      "w8",
    ]);
  });

  it("returns the study block when no classes are left", () => {
    const study = {
      ...wednesday[0],
      id: "sw",
      startTime: "16:15",
      endTime: "18:00",
      periodName: "Schoolwork",
      label: "SCHOOLWORK — Anki + homework",
    };
    const now = new Date("2026-08-05T05:30:00.000Z"); // 15:30 AEST
    expect(getNextDepartureBlocks([...wednesday, study], now, known).map((b) => b.id)).toEqual([
      "sw",
    ]);
  });

  it("returns empty when only routine remains", () => {
    const now = new Date("2026-08-05T09:00:00.000Z"); // 19:00 AEST
    expect(getNextDepartureBlocks(wednesday, now, known)).toEqual([]);
  });
});
