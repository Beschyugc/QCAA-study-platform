import { describe, expect, it } from "vitest";
import { escapeControlCharsInStrings, parseCardJson, bandTargetsFor } from "./cards";

describe("parseCardJson", () => {
  it("parses ordinary JSON untouched", () => {
    const cards = parseCardJson('[{"front":"a","back":"b","cardType":"basic"}]');
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe("a");
  });

  it("strips the ```json fences the model adds anyway", () => {
    const cards = parseCardJson('```json\n[{"front":"a","back":"b","cardType":"basic"}]\n```');
    expect(cards[0].back).toBe("b");
  });

  // The exact failure that lost two complex_unfamiliar batches: a multi-line
  // model answer puts a raw newline inside a JSON string.
  it("recovers a multi-line answer with unescaped newlines", () => {
    const raw = '[{"front":"Q (5 marks)","back":"Marking points:\n- first — 1 mark\n- second — 1 mark","cardType":"basic"}]';
    expect(() => JSON.parse(raw)).toThrow();

    const cards = parseCardJson(raw);
    expect(cards).toHaveLength(1);
    expect(cards[0].back).toContain("Marking points:");
    expect(cards[0].back).toContain("- second — 1 mark");
  });

  it("handles tabs and carriage returns inside strings", () => {
    const cards = parseCardJson('[{"front":"a\tb","back":"c\r\nd","cardType":"basic"}]');
    expect(cards[0].front).toBe("a\tb");
    expect(cards[0].back).toBe("c\r\nd");
  });
});

describe("escapeControlCharsInStrings", () => {
  it("leaves newlines BETWEEN fields alone — only ones inside strings are illegal", () => {
    const pretty = '[\n  {\n    "front": "a",\n    "back": "b"\n  }\n]';
    expect(escapeControlCharsInStrings(pretty)).toBe(pretty);
  });

  it("does not double-escape an already-escaped newline", () => {
    const already = '[{"back":"line1\\nline2"}]';
    expect(escapeControlCharsInStrings(already)).toBe(already);
  });

  it("does not treat an escaped quote as ending the string", () => {
    const withQuote = '[{"back":"he said \\"go\\" then\nstopped"}]';
    const parsed = JSON.parse(escapeControlCharsInStrings(withQuote));
    expect(parsed[0].back).toBe('he said "go" then\nstopped');
  });
});

describe("bandTargetsFor", () => {
  it("splits roughly to the shape of a real QCAA paper, not evenly", () => {
    const t = bandTargetsFor(20);
    expect(t.simple_familiar).toBeGreaterThan(t.complex_familiar);
    expect(t.complex_familiar).toBeGreaterThan(t.complex_unfamiliar);
  });

  it("gives a thin topic a floor and a fat one a ceiling", () => {
    const thin = bandTargetsFor(1);
    const fat = bandTargetsFor(200);
    const total = (x: ReturnType<typeof bandTargetsFor>) =>
      x.simple_familiar + x.complex_familiar + x.complex_unfamiliar;
    expect(total(thin)).toBeGreaterThanOrEqual(23);
    expect(total(fat)).toBeLessThanOrEqual(73);
  });
});
