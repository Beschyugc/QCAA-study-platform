import { describe, it, expect } from "vitest";
import { buildTeachBackPrompt, stripStatusTag } from "./teach-back";

describe("stripStatusTag", () => {
  it("extracts the status and strips the tag from the visible text", () => {
    const { status, text } = stripStatusTag("[STATUS:resolved] Nice, that's exactly right.");
    expect(status).toBe("resolved");
    expect(text).toBe("Nice, that's exactly right.");
  });

  it("recognises all four status values", () => {
    expect(stripStatusTag("[STATUS:questioning] ...").status).toBe("questioning");
    expect(stripStatusTag("[STATUS:offered_explanation] ...").status).toBe("offered_explanation");
    expect(stripStatusTag("[STATUS:explained] ...").status).toBe("explained");
    expect(stripStatusTag("[STATUS:resolved] ...").status).toBe("resolved");
  });

  it("defaults to questioning and returns the full text if the model forgot the tag", () => {
    const { status, text } = stripStatusTag("What happens to the constant here?");
    expect(status).toBe("questioning");
    expect(text).toBe("What happens to the constant here?");
  });
});

describe("buildTeachBackPrompt", () => {
  it("adds no exchange-count note below the narrowing threshold", () => {
    // Rule 2 in the base prompt legitimately mentions "[EXCHANGE_COUNT]" as
    // a forward reference, so check for the appended note's actual content
    // rather than that token, which is always present.
    const prompt = buildTeachBackPrompt(1);
    expect(prompt).not.toContain("This is exchange");
  });

  it("adds the narrowing note at exchange 3", () => {
    const prompt = buildTeachBackPrompt(3);
    expect(prompt).toContain("exchange 3-4");
    expect(prompt).not.toContain("exchange 5+");
  });

  it("adds the offer-to-explain note at exchange 5, not the narrowing note", () => {
    const prompt = buildTeachBackPrompt(5);
    expect(prompt).toContain("exchange 5+");
    expect(prompt).not.toContain("exchange 3-4");
  });

  it("always includes the full base rules regardless of exchange count", () => {
    expect(buildTeachBackPrompt(0)).toContain("do NOT state the correction");
    expect(buildTeachBackPrompt(10)).toContain("do NOT state the correction");
  });
});
