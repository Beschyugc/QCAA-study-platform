/**
 * Imports the five QCAA syllabuses from Beschy's "School work for claude"
 * archive into the curriculum tree.
 *
 * Run:  npx tsx scripts/import-syllabuses.ts [--write] [MM BIO ...]
 *
 * Without --write it extracts and reports only, touching nothing. That is the
 * default on purpose: replaceCurriculumTree DELETES the subject's existing
 * tree, so a careless run is destructive.
 *
 * Raw AI output is cached to scripts/.syllabus-cache/ before any parsing or
 * DB work. Each extraction is a ~30k-token call against the real API; losing
 * one to a downstream bug and paying for it twice is avoidable.
 *
 * This is the same code path as the UI (extract text -> syllabusExtractionPrompt
 * -> generateJson -> jsonToRows -> replaceCurriculumTree), just driven from a
 * script because doing it five times through a browser upload form is slower
 * and less inspectable.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFParse } from "pdf-parse";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { JsonUnit } from "../src/lib/curriculum";

/**
 * src/lib/prisma.ts builds its singleton at module-evaluation time from
 * process.env.DATABASE_URL. ES imports are hoisted above the config() call
 * above, so a static `import ... from "../src/lib/curriculum"` would
 * construct that client before the env file is loaded and silently connect
 * to localhost:5432. Everything that reaches the DB or the AI provider is
 * therefore imported lazily, after config() has run.
 */
async function deps() {
  const [{ generateJson }, { syllabusExtractionPrompt }, curriculum] = await Promise.all([
    import("../src/lib/ai/provider"),
    import("../src/lib/ai/prompts/syllabus-extraction"),
    import("../src/lib/curriculum"),
  ]);
  return {
    generateJson,
    syllabusExtractionPrompt,
    jsonToRows: curriculum.jsonToRows,
    replaceCurriculumTree: curriculum.replaceCurriculumTree,
  };
}

const ARCHIVE =
  "C:/Users/spenc/cLAUDE/School work for claude/1Schoolwork/QCAA_External_Past_Papers_2020-2024_2026_Syllabus_Filtered/QCAA_External_Past_Papers_2020-2024";

// The "2025 syllabus for 2026 EA" edition is the one that governs Beschy's
// external assessment — not the older archived versions sitting alongside.
const SYLLABUSES: { code: string; path: string }[] = [
  { code: "MM", path: `${ARCHIVE}/Mathematical_Methods/00_Syllabus/Mathematical_Methods_2025_Syllabus_for_2026_EA.pdf` },
  { code: "BIO", path: `${ARCHIVE}/Biology/00_Syllabus/Biology_2025_Syllabus_for_2026_EA.pdf` },
  { code: "PSY", path: `${ARCHIVE}/Psychology/00_Syllabus/Psychology_2025_Syllabus_for_2026_EA.pdf` },
  { code: "ENG", path: `${ARCHIVE}/English_General/00_Syllabus/English_General_2025_Syllabus_for_2026_EA.pdf` },
  { code: "PE", path: `${ARCHIVE}/Physical_Education/00_Syllabus/Physical_Education_2025_Syllabus_for_2026_EA.pdf` },
];

const CACHE_DIR = join(__dirname, ".syllabus-cache");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Strips ```json fences — Claude adds them even when told not to. */
function stripFences(s: string): string {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

async function extract(
  code: string,
  path: string,
  subjectName: string,
  d: Awaited<ReturnType<typeof deps>>,
): Promise<JsonUnit[]> {
  const cachePath = join(CACHE_DIR, `${code}.json`);
  if (existsSync(cachePath)) {
    console.log(`  using cached extraction (${cachePath})`);
    return JSON.parse(readFileSync(cachePath, "utf8"));
  }

  if (!existsSync(path)) throw new Error(`syllabus PDF not found: ${path}`);
  const { text } = await new PDFParse({ data: readFileSync(path) }).getText();
  if (!text.trim()) throw new Error(`no text extracted from ${path}`);
  console.log(`  ${text.length.toLocaleString()} chars of PDF text -> Claude`);

  const raw = await d.generateJson(d.syllabusExtractionPrompt(subjectName, text), {
    maxTokens: 32000,
  });

  let units: JsonUnit[];
  try {
    units = JSON.parse(stripFences(raw));
  } catch (err) {
    // Keep the unparseable response — almost always a truncation, and the
    // tail shows exactly where it stopped.
    const failPath = join(CACHE_DIR, `${code}.FAILED.txt`);
    writeFileSync(failPath, raw);
    throw new Error(
      `could not parse ${code} extraction (${raw.length} chars, saved to ${failPath}): ${(err as Error).message}`,
    );
  }

  writeFileSync(cachePath, JSON.stringify(units, null, 2));
  return units;
}

function summarise(units: JsonUnit[]) {
  const topics = units.flatMap((u) => u.topics);
  const subtopics = topics.flatMap((t) => t.subtopics);
  const objectives = subtopics.flatMap((s) => s.learningObjectives);
  return {
    units: units.length,
    topics: topics.length,
    subtopics: subtopics.length,
    objectives: objectives.length,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const only = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());
  const targets = only.length > 0 ? SYLLABUSES.filter((s) => only.includes(s.code)) : SYLLABUSES;

  const d = await deps();
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  console.log(write ? "MODE: WRITE (replaces existing curriculum)\n" : "MODE: dry run (nothing is written)\n");

  const results: Record<string, ReturnType<typeof summarise> & { error?: string }> = {};

  for (const { code, path } of targets) {
    const subject = await prisma.subject.findFirst({ where: { shortCode: code } });
    if (!subject) {
      console.log(`${code}: no such subject in the database — skipping\n`);
      continue;
    }

    console.log(`${code} — ${subject.name}`);
    try {
      const units = await extract(code, path, subject.name, d);
      const stats = summarise(units);
      results[code] = stats;
      console.log(
        `  ${stats.units} units · ${stats.topics} topics · ${stats.subtopics} subtopics · ${stats.objectives} objectives`,
      );
      for (const u of units) {
        console.log(`    U${u.number} ${u.title}`);
        for (const t of u.topics) console.log(`      T${t.number} ${t.title}`);
      }

      if (write) {
        const rows = d.jsonToRows(units);
        await d.replaceCurriculumTree(subject.userId, subject.id, rows);
        console.log(`  WROTE ${rows.length} rows`);
      }
    } catch (err) {
      console.error(err);
      const message = (err as Error).message || String(err);
      results[code] = { units: 0, topics: 0, subtopics: 0, objectives: 0, error: message };
      console.log(`  FAILED: ${message}`);
    }
    console.log();
  }

  console.log("SUMMARY");
  for (const [code, r] of Object.entries(results)) {
    console.log(
      r.error
        ? `  ${code.padEnd(4)} FAILED — ${r.error.slice(0, 90)}`
        : `  ${code.padEnd(4)} ${String(r.topics).padStart(3)} topics, ${String(r.objectives).padStart(4)} objectives`,
    );
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
