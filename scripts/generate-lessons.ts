/**
 * Pre-generates the Learn lesson for every topic.
 *
 * Lessons are cached on TopicLesson and keyed by a hash of the topic's
 * objective text, so generating them here — locally, where an API key exists —
 * makes the Learn section work in production even while Vercel has no
 * ANTHROPIC_API_KEY. It converts the single biggest AI feature from "fails at
 * school" to "already there".
 *
 * Run: npx tsx scripts/generate-lessons.ts [--write] [MM BIO ...]
 *
 * Dry run by default. Existing lessons are skipped unless --force, so a run
 * that dies partway can be resumed without paying twice.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());

  const { generateLesson, hashObjectives } = await import("../src/lib/lessons");
  const { objectivesForTopic } = await import("../src/lib/cards");

  console.log(write ? "MODE: WRITE\n" : "MODE: dry run\n");

  const topics = await prisma.topic.findMany({
    where: only.length > 0 ? { unit: { subject: { shortCode: { in: only } } } } : {},
    include: { unit: { include: { subject: true } }, lesson: true },
    orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
  });

  let made = 0;
  let skipped = 0;
  let failed = 0;

  for (const topic of topics) {
    const label = `${topic.unit.subject.shortCode} U${topic.unit.number} ${topic.title.slice(0, 42)}`;
    const objectives = await objectivesForTopic(topic.userId, topic.id);

    if (objectives.length === 0) {
      console.log(`${label.padEnd(56)} no objectives — skipped`);
      skipped++;
      continue;
    }

    // Skip when a lesson already matches the current objectives; regenerate
    // only if the syllabus changed under it, or --force.
    if (topic.lesson && !force && topic.lesson.objectivesHash === hashObjectives(objectives)) {
      console.log(`${label.padEnd(56)} already current — skipped`);
      skipped++;
      continue;
    }

    if (!write) {
      console.log(`${label.padEnd(56)} would generate (${objectives.length} objectives)`);
      made++;
      continue;
    }

    try {
      const markdown = await generateLesson(topic.userId, topic.id);
      console.log(`${label.padEnd(56)} ${markdown.length.toLocaleString()} chars`);
      made++;
    } catch (err) {
      console.log(`${label.padEnd(56)} FAILED: ${(err as Error).message.slice(0, 60)}`);
      failed++;
    }
  }

  console.log(`\nTOTAL generated ${made}, skipped ${skipped}, failed ${failed}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
