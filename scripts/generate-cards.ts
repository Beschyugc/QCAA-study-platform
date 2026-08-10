/**
 * Generates flashcards for every topic from its real syllabus objectives.
 *
 * Run:  npx tsx scripts/generate-cards.ts [--plan|--write] [--bands=...] [MM BIO ...]
 *
 * Three modes, cheapest first:
 *   --plan   costs nothing. Reports what each topic is short of per band and
 *            how many AI calls a real run would make. Use this first.
 *   (none)   generates and caches, but writes nothing to the database. This
 *            still calls the AI and still costs money — "dry run" means "no
 *            database writes", not "no spend".
 *   --write  generates (or reuses the cache) and saves.
 *
 * Cards are cached per topic AND band under scripts/.card-cache/ so a failure
 * part-way through doesn't mean paying for the generation twice.
 *
 * Cards are generated for LOCKED topics too, deliberately. Unlocking should
 * feel like opening a door onto something already there, and the reviewer
 * already filters to unlocked topics — so a locked topic's cards exist but
 * are unreachable until you get there.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { DraftCard } from "../src/lib/cards";

// See the note in import-syllabuses.ts: anything touching the DB or the AI
// provider must be imported after config() has run.
async function deps() {
  const cards = await import("../src/lib/cards");
  return cards;
}

const CACHE_DIR = join(__dirname, ".card-cache");

type Band = "simple_familiar" | "complex_familiar" | "complex_unfamiliar";
const ALL_BANDS: Band[] = ["simple_familiar", "complex_familiar", "complex_unfamiliar"];
const SHORT: Record<Band, string> = {
  simple_familiar: "SF",
  complex_familiar: "CF",
  complex_unfamiliar: "CU",
};
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const plan = args.includes("--plan");
  const only = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());

  // --bands=complex_familiar,complex_unfamiliar restricts a run to the bands
  // that are actually missing. Biology and Psychology already have dense
  // recall coverage from the Anki import, so regenerating simple_familiar for
  // them would be paying for duplicates.
  const bandArg = args.find((a) => a.startsWith("--bands="));
  const bands: Band[] = bandArg
    ? (bandArg.slice(8).split(",").filter((b) => ALL_BANDS.includes(b as Band)) as Band[])
    : ALL_BANDS;
  if (bands.length === 0) throw new Error(`--bands must name at least one of ${ALL_BANDS.join(", ")}`);

  const d = await deps();

  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  console.log(
    plan
      ? "MODE: plan (no AI calls, no writes, no cost)\n"
      : write
        ? "MODE: WRITE\n"
        : "MODE: dry run — CALLS THE AI AND COSTS MONEY, but writes nothing\n",
  );

  const subjects = await prisma.subject.findMany({
    where: only.length > 0 ? { shortCode: { in: only } } : {},
    include: {
      units: {
        orderBy: { order: "asc" },
        include: { topics: { orderBy: { order: "asc" } } },
      },
    },
  });

  let totalMade = 0;
  let totalSaved = 0;
  let plannedCalls = 0;
  let plannedCards = 0;

  for (const subject of subjects) {
    console.log(`${subject.shortCode} — ${subject.name}`);

    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        const objectives = await d.objectivesForTopic(subject.userId, topic.id);
        if (objectives.length === 0) {
          console.log(`  U${unit.number} ${topic.title.slice(0, 44)} — no objectives, skipping`);
          continue;
        }

        // What the topic already holds, per band. Cards imported from Anki and
        // everything generated before bands existed come back under `null`,
        // and count towards simple_familiar — that is what they are, and
        // treating them as missing would regenerate 1,800 duplicates.
        const byBand = await prisma.card.groupBy({
          by: ["complexity"],
          where: { userId: subject.userId, topicId: topic.id },
          _count: true,
        });
        const held: Record<string, number> = {
          simple_familiar: 0,
          complex_familiar: 0,
          complex_unfamiliar: 0,
        };
        for (const row of byBand) {
          held[row.complexity ?? "simple_familiar"] += row._count;
        }

        const targets = d.bandTargetsFor(objectives.length);
        const avoid = await d.existingFrontsForTopic(subject.userId, topic.id);
        const label = `U${unit.number} ${topic.title.slice(0, 40)}`;
        const parts: string[] = [];

        for (const band of bands) {
          const deficit = targets[band] - held[band];
          if (deficit <= 0) {
            parts.push(`${SHORT[band]} ok(${held[band]})`);
            continue;
          }

          if (plan) {
            plannedCalls += 1;
            plannedCards += deficit;
            parts.push(`${SHORT[band]} need ${deficit}`);
            continue;
          }

          // Cached per topic AND band, so a failure part-way through a topic
          // doesn't mean paying to regenerate the bands that already worked.
          const cachePath = join(CACHE_DIR, `${topic.id}.${band}.json`);
          let cards: DraftCard[];
          if (existsSync(cachePath)) {
            cards = JSON.parse(readFileSync(cachePath, "utf8"));
          } else {
            try {
              cards = await d.draftCardsForBand(
                subject.name,
                topic.title,
                objectives,
                band,
                deficit,
                avoid,
              );
              writeFileSync(cachePath, JSON.stringify(cards, null, 2));
            } catch (err) {
              parts.push(`${SHORT[band]} FAILED(${(err as Error).message.slice(0, 40)})`);
              continue;
            }
          }

          totalMade += cards.length;
          parts.push(`${SHORT[band]} +${cards.length}`);

          if (write && cards.length > 0) {
            totalSaved += await d.saveCards(subject.userId, subject.id, topic.id, cards, [
              "syllabus-generated",
              subject.shortCode,
              band,
            ]);
          }
        }

        console.log(
          `  ${label.padEnd(44)} ${String(objectives.length).padStart(3)} obj  ${parts.join("  ")}`,
        );
      }
    }
    console.log();
  }

  if (plan) {
    console.log(
      `PLAN: ${plannedCards} cards short across ${plannedCalls} AI calls ` +
        `(one call per topic per band). Nothing was generated and nothing was spent.`,
    );
  } else {
    console.log(`TOTAL drafted ${totalMade}${write ? `, saved ${totalSaved}` : ""}`);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
