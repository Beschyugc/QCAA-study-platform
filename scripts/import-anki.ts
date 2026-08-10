/**
 * Imports Beschy's Anki export (Biology, Psychology, Math methods — 2,101
 * cards) into the Card table.
 *
 * Run: npx tsx scripts/import-anki.ts [--write]
 *
 * Dry run by default; --write actually inserts. Idempotent either way: an
 * entry already imported (matched by its `anki:<ankiNoteId>` tag on an
 * existing card) is skipped, so a partial or repeated run never duplicates
 * cards.
 *
 * complexity is deliberately left NULL on every row — these cards were never
 * authored against a QCAA complexity band, and guessing one would corrupt
 * the deck's reported simple/complex mix.
 *
 * Bulk insert, chunked. A per-card loop inside prisma.$transaction is the bug
 * that rolled back two syllabus imports before: against remote Supabase it
 * blows Prisma's 5s interactive-transaction ceiling. Same two-createMany
 * shape as saveCards() in src/lib/cards.ts, just run once per 500-row chunk
 * instead of once for the whole 2,101-row set.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { initialState } from "../src/lib/srs/sm2";

// Inlined rather than imported from ../src/lib/cards: that module imports
// the Prisma singleton, and a top-level value import here would hoist above
// config() below and build it with an empty DATABASE_URL. See "Import
// discipline" in PROGRESS.md.
function encodeTags(tags: string[]): string {
  return JSON.stringify(tags);
}
function decodeTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const EXPORT_PATH = join(__dirname, "..", "..", "[C] anki-export.json");
const CHUNK_SIZE = 500;

const SUBJECT_CODES: Record<string, string> = {
  Biology: "BIO",
  Psychology: "PSY",
  "Math methods": "MM",
};

type AnkiEntry = {
  ankiNoteId: number;
  noteType: "Cloze" | "Basic";
  deck: string;
  subject: string;
  deckKind: string;
  unit: number;
  topic: number;
  tags: string[];
  fields: Record<string, string>;
};

type CardRow = {
  id: string;
  userId: string;
  subjectId: string;
  topicId: string;
  cardType: "basic" | "cloze";
  front: string;
  back: string;
  tags: string; // JSON-encoded string[] — see encodeTags/decodeTags above
};

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

/**
 * Cloze notes carry the text (with {{c1::...}} markers intact) in "Text" and
 * an optional "Back Extra" note. Basic notes are a plain "Front"/"Back" pair.
 * Verified against the real export before writing this — field names differ
 * by note type and guessing them would have silently produced empty cards.
 */
function textsFor(entry: AnkiEntry): { front: string; back: string; cardType: "basic" | "cloze" } {
  if (entry.noteType === "Cloze") {
    return {
      front: entry.fields["Text"] ?? "",
      back: entry.fields["Back Extra"] ?? "",
      cardType: "cloze",
    };
  }
  return {
    front: entry.fields["Front"] ?? "",
    back: entry.fields["Back"] ?? "",
    cardType: "basic",
  };
}

async function main() {
  const write = process.argv.includes("--write");
  console.log(write ? "MODE: WRITE\n" : "MODE: dry run (nothing is written)\n");

  const entries: AnkiEntry[] = JSON.parse(readFileSync(EXPORT_PATH, "utf8"));
  console.log(`loaded ${entries.length} entries from ${EXPORT_PATH}\n`);

  // Subjects + units + topics, to resolve each entry's real topicId.
  const subjects = await prisma.subject.findMany({
    where: { shortCode: { in: Object.values(SUBJECT_CODES) } },
    include: { units: { include: { topics: true } } },
  });

  type Resolved = { topicId: string; subjectId: string; userId: string };
  const topicIndex = new Map<string, Resolved>();
  const userIdsInScope = new Set<string>();
  for (const s of subjects) {
    userIdsInScope.add(s.userId);
    for (const u of s.units) {
      for (const t of u.topics) {
        topicIndex.set(`${s.shortCode}:${u.number}:${t.number}`, {
          topicId: t.id,
          subjectId: s.id,
          userId: s.userId,
        });
      }
    }
  }

  // Existing anki:<id> tags already in the DB, for dedupe. Only tags are
  // fetched — cheap even as the table grows across re-runs.
  const existing = await prisma.card.findMany({
    where: { userId: { in: [...userIdsInScope] } },
    select: { tags: true },
  });
  const alreadyImported = new Set<number>();
  for (const c of existing) {
    for (const t of decodeTags(c.tags)) {
      if (t.startsWith("anki:")) {
        const id = Number(t.slice("anki:".length));
        if (!Number.isNaN(id)) alreadyImported.add(id);
      }
    }
  }

  const rows: CardRow[] = [];
  const unresolved: { entry: AnkiEntry; reason: string }[] = [];
  let dupeSkipped = 0;

  type SubjectStats = { resolved: number; deduped: number; unresolved: number; basic: number; cloze: number };
  const stats: Record<string, SubjectStats> = {};
  for (const name of Object.keys(SUBJECT_CODES)) {
    stats[name] = { resolved: 0, deduped: 0, unresolved: 0, basic: 0, cloze: 0 };
  }

  for (const entry of entries) {
    const s = (stats[entry.subject] ??= { resolved: 0, deduped: 0, unresolved: 0, basic: 0, cloze: 0 });

    const code = SUBJECT_CODES[entry.subject];
    if (!code) {
      unresolved.push({ entry, reason: `unknown subject "${entry.subject}"` });
      s.unresolved++;
      continue;
    }

    const key = `${code}:${entry.unit}:${entry.topic}`;
    const resolved = topicIndex.get(key);
    if (!resolved) {
      unresolved.push({ entry, reason: `no Topic for ${code} unit ${entry.unit} topic ${entry.topic}` });
      s.unresolved++;
      continue;
    }

    if (alreadyImported.has(entry.ankiNoteId)) {
      dupeSkipped++;
      s.deduped++;
      continue;
    }

    const { front, back, cardType } = textsFor(entry);
    rows.push({
      id: randomUUID(),
      userId: resolved.userId,
      subjectId: resolved.subjectId,
      topicId: resolved.topicId,
      cardType,
      front,
      back,
      tags: encodeTags([...entry.tags, `anki:${entry.ankiNoteId}`]),
    });
    s.resolved++;
    if (cardType === "cloze") s.cloze++;
    else s.basic++;
  }

  console.log("PER-SUBJECT (from file)");
  for (const [name, s] of Object.entries(stats)) {
    console.log(
      `  ${name.padEnd(14)} ${String(s.resolved).padStart(4)} to import ` +
        `(${s.cloze} cloze, ${s.basic} basic) | ${String(s.deduped).padStart(4)} already imported | ${s.unresolved} unresolved`,
    );
  }

  if (unresolved.length > 0) {
    console.log(`\nUNRESOLVED (${unresolved.length}) — skipped, not written:`);
    for (const { entry, reason } of unresolved.slice(0, 25)) {
      console.log(`  ankiNoteId ${entry.ankiNoteId}: ${reason}`);
    }
    if (unresolved.length > 25) console.log(`  ...and ${unresolved.length - 25} more`);
  }

  console.log(
    `\nTOTAL: ${entries.length} in file | ${rows.length} to import | ${dupeSkipped} already imported (skipped) | ${unresolved.length} unresolved (skipped)`,
  );

  if (write && rows.length > 0) {
    console.log(`\nWriting ${rows.length} cards in chunks of ${CHUNK_SIZE}...`);
    const init = initialState();
    let written = 0;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      await prisma.$transaction(async (tx) => {
        await tx.card.createMany({ data: chunk });
        await tx.cardScheduling.createMany({
          data: chunk.map((r) => ({
            userId: r.userId,
            cardId: r.id,
            dueDate: new Date(),
            intervalDays: init.intervalDays,
            easeFactor: init.easeFactor,
            repetitions: init.repetitions,
            lapses: init.lapses,
            learningStep: init.learningStep,
            state: init.state,
          })),
        });
      });
      written += chunk.length;
      console.log(`  ${written}/${rows.length}`);
    }
    console.log(`\nWROTE ${written} cards.`);

    console.log("\nDATABASE TOTALS (per subject, after write)");
    const subjectRows = await prisma.subject.findMany({
      where: { shortCode: { in: Object.values(SUBJECT_CODES) } },
    });
    for (const s of subjectRows) {
      const count = await prisma.card.count({ where: { subjectId: s.id } });
      console.log(`  ${s.shortCode.padEnd(4)} ${s.name.padEnd(20)} ${count} cards`);
    }
  } else if (!write) {
    console.log("\n(dry run — nothing written; re-run with --write to import)");
  } else {
    console.log("\nnothing to import.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
