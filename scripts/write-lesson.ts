/**
 * Writes a hand-authored lesson (Markdown file) straight into TopicLesson,
 * bypassing the AI — for topics worth authoring by hand rather than
 * spending API credit on, or while the Anthropic balance is at zero.
 *
 * Run: npx tsx scripts/write-lesson.ts <SUBJECT_CODE> <unit> <topic> <path/to/lesson.md>
 * Example: npx tsx scripts/write-lesson.ts BIO 3 1 scripts/content/bio-u3t1-lesson.md
 *
 * objectivesHash is computed the same way generateLesson() does, from the
 * topic's live objectives — so this lesson is marked stale exactly when an
 * AI-generated one would be, if the syllabus changes under it later.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const [code, unitArg, topicArg, mdPath] = process.argv.slice(2);
  if (!code || !unitArg || !topicArg || !mdPath) {
    throw new Error("usage: write-lesson.ts <SUBJECT_CODE> <unit> <topic> <path/to/lesson.md>");
  }

  const { prisma } = await import("../src/lib/prisma");
  const { objectivesForTopic } = await import("../src/lib/cards");
  const { hashObjectives } = await import("../src/lib/lessons");

  const LOCAL_USER_ID = "local";
  const unitNumber = Number(unitArg);
  const topicNumber = Number(topicArg);

  const topic = await prisma.topic.findFirst({
    where: {
      userId: LOCAL_USER_ID,
      number: topicNumber,
      unit: { number: unitNumber, subject: { shortCode: code.toUpperCase() } },
    },
    include: { unit: { include: { subject: true } } },
  });
  if (!topic) throw new Error(`No ${code} U${unitNumber} T${topicNumber} for user ${LOCAL_USER_ID}`);

  const objectives = await objectivesForTopic(LOCAL_USER_ID, topic.id);
  if (objectives.length === 0) throw new Error("Topic has no objectives — nothing to hash against.");

  const markdown = readFileSync(resolve(mdPath), "utf-8");
  const hash = hashObjectives(objectives);

  await prisma.topicLesson.upsert({
    where: { topicId: topic.id },
    create: {
      userId: LOCAL_USER_ID,
      topicId: topic.id,
      markdown,
      objectivesHash: hash,
      model: "hand-authored",
    },
    update: {
      markdown,
      objectivesHash: hash,
      model: "hand-authored",
    },
  });

  console.log(
    `Wrote lesson for ${code} U${unitNumber} T${topicNumber} — "${topic.title}" ` +
      `(${objectives.length} objectives, ${markdown.length} chars)`,
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
