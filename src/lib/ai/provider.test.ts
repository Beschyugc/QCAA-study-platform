import { describe, it, expect } from "vitest";
import { stripJsonFences } from "./provider";

describe("stripJsonFences", () => {
  it("strips ```json fences", () => {
    const input = '```json\n[{"a":1}]\n```';
    expect(stripJsonFences(input)).toBe('[{"a":1}]');
  });

  it("strips bare ``` fences without a language tag", () => {
    const input = '```\n{"a":1}\n```';
    expect(stripJsonFences(input)).toBe('{"a":1}');
  });

  it("leaves unfenced JSON untouched", () => {
    const input = '{"a":1}';
    expect(stripJsonFences(input)).toBe('{"a":1}');
  });

  it("trims surrounding whitespace either way", () => {
    expect(stripJsonFences('  \n{"a":1}\n  ')).toBe('{"a":1}');
  });

  it("handles the exact shape a real Claude response returned", () => {
    // Confirmed against a live API call during Phase 12 verification —
    // Claude wrapped valid JSON in fences despite the system prompt
    // explicitly saying not to.
    const input = '```json\n[\n  {\n    "number": 3,\n    "title": "Motion"\n  }\n]\n```';
    const stripped = stripJsonFences(input);
    expect(() => JSON.parse(stripped)).not.toThrow();
    expect(JSON.parse(stripped)).toEqual([{ number: 3, title: "Motion" }]);
  });
});
