import { describe, expect, it } from "vitest";
import { DAILY_CARDS_MAX, DAILY_CARDS_MIN, dailyCardTarget } from "./daily";

describe("dailyCardTarget", () => {
  it("gives an all-red subject the maximum", () => {
    expect(dailyCardTarget({ red: 20, amber: 0, green: 0, unrated: 0 })).toBe(DAILY_CARDS_MAX);
  });

  it("gives an all-green subject close to the minimum", () => {
    const target = dailyCardTarget({ red: 0, amber: 0, green: 20, unrated: 0 });
    expect(target).toBeGreaterThanOrEqual(DAILY_CARDS_MIN);
    expect(target).toBeLessThanOrEqual(DAILY_CARDS_MIN + 2);
  });

  it("never drops below the floor — every subject always has work", () => {
    expect(dailyCardTarget({ red: 0, amber: 0, green: 0, unrated: 0 })).toBe(DAILY_CARDS_MIN);
    expect(dailyCardTarget({ red: 0, amber: 0, green: 999, unrated: 0 })).toBeGreaterThanOrEqual(
      DAILY_CARDS_MIN,
    );
  });

  it("never exceeds the ceiling, however red things get", () => {
    expect(dailyCardTarget({ red: 999, amber: 5, green: 0, unrated: 3 })).toBeLessThanOrEqual(
      DAILY_CARDS_MAX,
    );
  });

  it("puts a red-heavy subject above an otherwise identical green-heavy one", () => {
    const red = dailyCardTarget({ red: 15, amber: 5, green: 0, unrated: 0 });
    const green = dailyCardTarget({ red: 0, amber: 5, green: 15, unrated: 0 });
    expect(red).toBeGreaterThan(green);
  });

  it("treats unrated as more urgent than green but less than amber", () => {
    const base = { red: 0, green: 0 };
    const unrated = dailyCardTarget({ ...base, amber: 0, unrated: 20 });
    const amber = dailyCardTarget({ ...base, amber: 20, unrated: 0 });
    const green = dailyCardTarget({ red: 0, amber: 0, green: 20, unrated: 0 });
    expect(unrated).toBeLessThan(amber);
    expect(unrated).toBeGreaterThan(green);
  });
});
