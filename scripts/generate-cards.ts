/**
 * Generates flashcards for every topic from its real syllabus objectives.
 *
 * Run:  npx tsx scripts/generate-cards.ts [--write] [MM BIO ...]
 *
 * Dry run by default. Cards are cached per topic under scripts/.card-cache/
 * so a failed write doesn't mean paying for the generation twice.
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
import { PrismaPg } from "@prisma/adapter-pg";
import type { DraftCard } from "../src/lib/cards";

// See the note in import-syllabuses.ts: anything touching the DB or the AI
// provider must be imported after config() has run.
async function deps() {
  const cards = await import("../src/lib/cards");
  return cards;
}

const CACHE_DIR = join(__dirname, ".card-cache");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const only = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());
  const d = await deps();

  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  console.log(write ? "MODE: WRITE\n" : "MODE: dry run (nothing is written)\n");

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

  for (const subject of subjects) {
    console.log(`${subject.shortCode} — ${subject.name}`);

    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        const existing = await prisma.card.count({
          where: { userId: subject.userId, topicId: topic.id },
        });
        if (existing > 0) {
          console.log(`  U${unit.number} ${topic.title.slice(0, 44)} — ${existing} cards already, skipping`);
          continue;
        }

        const objectives = await d.objectivesForTopic(subject.userId, topic.id);
        if (objectives.length === 0) {
          console.log(`  U${unit.number} ${topic.title.slice(0, 44)} — no objectives, skipping`);
          continue;
        }

        const cachePath = join(CACHE_DIR, `${topic.id}.json`);
        let cards: DraftCard[];
        if (existsSync(cachePath)) {
          cards = JSON.parse(readFileSync(cachePath, "utf8"));
        } else {
          const target = d.cardTargetFor(objectives.length);
          try {
            cards = await d.draftCardsForTopic(subject.name, topic.title, objectives, target);
            writeFileSync(cachePath, JSON.stringify(cards, null, 2));
          } catch (err) {
            console.log(`  U${unit.number} ${topic.title.slice(0, 44)} — FAILED: ${(err as Error).message.slice(0, 70)}`);
            continue;
          }
        }

        totalMade += cards.length;
        console.log(
          `  U${unit.number} ${topic.title.slice(0, 44).padEnd(46)} ${String(objectives.length).padStart(3)} obj -> ${String(cards.length).padStart(2)} cards`,
        );

        if (write) {
          totalSaved += await d.saveCards(
            subject.userId,
            subject.id,
            topic.id,
            cards,
            ["syllabus-generated", subject.shortCode],
          );
        }
      }
    }
    console.log();
  }

  console.log(`TOTAL drafted ${totalMade}${write ? `, saved ${totalSaved}` : ""}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
