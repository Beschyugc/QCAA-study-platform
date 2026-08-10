import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EXPORT_ORDER, MODEL_BY_KEY } from "./export";

/**
 * The export shipped for a long time silently missing four tables — the
 * whole Mistake Folder, every written lesson, the 244 mapped videos and the
 * daily question sets. Nothing failed; the backup file just quietly didn't
 * contain them, which is the worst possible way for a backup to be wrong.
 *
 * This reads schema.prisma directly and fails the moment a user-scoped
 * model exists that the export doesn't cover, so adding a model to the
 * schema forces a decision about whether it belongs in a backup.
 */

function schemaModels(): { name: string; body: string }[] {
  const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf-8");
  const out: { name: string; body: string }[] = [];
  const re = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(schema)) !== null) out.push({ name: m[1], body: m[2] });
  return out;
}

describe("exportAllData coverage", () => {
  it("covers every user-scoped model in the schema", () => {
    // A model is user-scoped (and so belongs in a personal backup) if it
    // carries a userId column. Join/lookup tables without one are out of
    // scope by construction.
    const userScoped = schemaModels()
      .filter((m) => /^\s*userId\s+String/m.test(m.body))
      .map((m) => m.name);

    // Prisma's accessor name is the model name with a lowercased first
    // letter — the same mapping MODEL_BY_KEY encodes by hand.
    const covered = new Set(Object.values(MODEL_BY_KEY));
    const missing = userScoped.filter(
      (name) => !covered.has(name.charAt(0).toLowerCase() + name.slice(1)),
    );

    expect(missing, `these user-scoped models are not in EXPORT_ORDER: ${missing.join(", ")}`).toEqual([]);
  });

  it("has one model mapping per export key, with no duplicates", () => {
    expect(Object.keys(MODEL_BY_KEY).sort()).toEqual([...EXPORT_ORDER].sort());
    const models = Object.values(MODEL_BY_KEY);
    expect(new Set(models).size).toBe(models.length);
  });

  it("lists parents before children, so a restore can insert in order", () => {
    const position = (key: string) => EXPORT_ORDER.indexOf(key as never);
    // Spot-check the relationships that actually constrain insert order.
    expect(position("subjects")).toBeLessThan(position("units"));
    expect(position("units")).toBeLessThan(position("topics"));
    expect(position("topics")).toBeLessThan(position("subtopics"));
    expect(position("subtopics")).toBeLessThan(position("learningObjectives"));
    expect(position("cards")).toBeLessThan(position("cardScheduling"));
    expect(position("cards")).toBeLessThan(position("reviews"));
    expect(position("cards")).toBeLessThan(position("mistakes"));
    expect(position("topics")).toBeLessThan(position("topicLessons"));
    expect(position("pastPapers")).toBeLessThan(position("paperAttempts"));
    expect(position("paperAttempts")).toBeLessThan(position("attemptResponses"));
    expect(position("aiConversations")).toBeLessThan(position("aiMessages"));
  });
});
