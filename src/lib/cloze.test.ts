import { describe, it, expect } from "vitest";
import {
  hasCloze,
  parseCloze,
  clozeOrdinals,
  clozeQuestion,
  clozeAnswer,
} from "./cloze";

const SIMPLE = "A population bottleneck directly reduces {{c1::genetic diversity}}.";

describe("hasCloze", () => {
  it("detects a deletion", () => {
    expect(hasCloze(SIMPLE)).toBe(true);
  });

  it("is false for plain text", () => {
    expect(hasCloze("No deletions here.")).toBe(false);
  });

  it("does not treat other double braces as a deletion", () => {
    expect(hasCloze("Set notation {{a, b}} is not cloze.")).toBe(false);
  });

  it("is not affected by a previous call's regex state", () => {
    // A module-level regex with /g carries lastIndex between calls.
    expect(hasCloze(SIMPLE)).toBe(true);
    expect(hasCloze(SIMPLE)).toBe(true);
  });
});

describe("parseCloze", () => {
  it("splits text and deletion in order", () => {
    expect(parseCloze(SIMPLE)).toEqual([
      { kind: "text", text: "A population bottleneck directly reduces " },
      { kind: "deletion", ordinal: 1, answer: "genetic diversity" },
      { kind: "text", text: "." },
    ]);
  });

  it("captures a hint when present", () => {
    const segs = parseCloze("The capital is {{c1::Paris::city}}.");
    expect(segs[1]).toEqual({
      kind: "deletion",
      ordinal: 1,
      answer: "Paris",
      hint: "city",
    });
  });

  it("handles several deletions", () => {
    const segs = parseCloze("{{c1::A}} then {{c2::B}}");
    expect(segs.filter((s) => s.kind === "deletion")).toHaveLength(2);
  });

  it("returns a single text segment when there is nothing to delete", () => {
    expect(parseCloze("plain")).toEqual([{ kind: "text", text: "plain" }]);
  });

  it("spans newlines inside a deletion", () => {
    const segs = parseCloze("{{c1::line one\nline two}}");
    expect(segs[0]).toMatchObject({ answer: "line one\nline two" });
  });
});

describe("clozeOrdinals", () => {
  it("lists distinct ordinals ascending", () => {
    expect(clozeOrdinals("{{c2::B}} {{c1::A}} {{c2::C}}")).toEqual([1, 2]);
  });

  it("is empty for plain text", () => {
    expect(clozeOrdinals("nothing")).toEqual([]);
  });
});

describe("clozeQuestion", () => {
  it("hides the deletion behind a placeholder", () => {
    expect(clozeQuestion(SIMPLE)).toBe(
      "A population bottleneck directly reduces [...].",
    );
  });

  it("never leaks the answer text", () => {
    expect(clozeQuestion(SIMPLE)).not.toContain("genetic diversity");
  });

  it("shows the hint instead of the placeholder", () => {
    expect(clozeQuestion("The capital is {{c1::Paris::city}}.")).toBe(
      "The capital is [city].",
    );
  });

  it("blanks every deletion when no ordinal is given", () => {
    expect(clozeQuestion("{{c1::A}} and {{c2::B}}")).toBe("[...] and [...]");
  });

  it("blanks only the requested ordinal, revealing the others", () => {
    expect(clozeQuestion("{{c1::A}} and {{c2::B}}", 1)).toBe("[...] and B");
    expect(clozeQuestion("{{c1::A}} and {{c2::B}}", 2)).toBe("A and [...]");
  });
});

describe("clozeAnswer", () => {
  it("fills every deletion back in", () => {
    expect(clozeAnswer(SIMPLE)).toBe(
      "A population bottleneck directly reduces genetic diversity.",
    );
  });

  it("drops the hint, keeping the answer", () => {
    expect(clozeAnswer("The capital is {{c1::Paris::city}}.")).toBe(
      "The capital is Paris.",
    );
  });

  it("leaves plain text untouched", () => {
    expect(clozeAnswer("plain")).toBe("plain");
  });
});
