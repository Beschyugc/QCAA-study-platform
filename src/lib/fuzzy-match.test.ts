import { describe, it, expect } from "vitest";
import { similarity, isCloseEnough } from "./fuzzy-match";

describe("similarity", () => {
  it("is 1 for identical strings", () => {
    expect(similarity("mitochondria", "mitochondria")).toBe(1);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(similarity("Mitochondria", "  mitochondria  ")).toBe(1);
  });

  it("tolerates a single typo", () => {
    expect(similarity("mitochondria", "mitochondrea")).toBeGreaterThan(0.85);
  });

  it("is low for very different strings", () => {
    expect(similarity("mitochondria", "ribosome")).toBeLessThan(0.5);
  });

  it("handles empty strings without throwing", () => {
    expect(similarity("", "")).toBe(1);
    expect(similarity("x", "")).toBe(0);
  });
});

describe("isCloseEnough", () => {
  it("accepts near matches at the default threshold", () => {
    expect(isCloseEnough("photosynthesis", "photosythesis")).toBe(true);
  });

  it("rejects unrelated answers", () => {
    expect(isCloseEnough("photosynthesis", "cellular respiration")).toBe(false);
  });

  it("respects a custom threshold", () => {
    expect(isCloseEnough("cat", "cot", 0.9)).toBe(false);
    expect(isCloseEnough("cat", "cot", 0.6)).toBe(true);
  });
});
