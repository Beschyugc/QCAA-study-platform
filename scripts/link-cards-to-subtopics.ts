/**
 * Assigns every existing card to a subtopic.
 *
 * Cards were generated per TOPIC, from all of that topic's objectives at once,
 * so none of them recorded which subtopic they came from. That makes
 * "drill just this subtopic" impossible. Rather than regenerate 593 cards,
 * this classifies the ones that already exist — one call per topic, mapping
 * card fronts onto that topic's subtopic titles.
 *
 * Run: npx tsx scripts/link-cards-to-subtopics.ts [--write] [MM BIO ...]
 *
 * Dry run by default. A card whose subtopic the model won't commit to is left
 * unassigned rather than forced into one — an unassigned card still appears
 * when drilling the whole topic, which is the honest fallback.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const only = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());

  const { generateText } = await import("../src/lib/ai/provider");
  const { stripJsonFences } = await import("../src/lib/cards");

  console.log(write ? "MODE: WRITE\n" : "MODE: dry run\n");

  const topics = await prisma.topic.findMany({
    where: only.length > 0 ? { unit: { subject: { shortCode: { in: only } } } } : {},
    include: {
      unit: { include: { subject: true } },
      subtopics: { orderBy: { order: "asc" }, include: { learningObjectives: { select: { text: true } } } },
      cards: { select: { id: true, front: true, subtopicId: true } },
    },
    orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
  });

  let assigned = 0;
  let skipped = 0;

  for (const topic of topics) {
    const unassigned = topic.cards.filter((c) => c.subtopicId === null);
    if (unassigned.length === 0 || topic.subtopics.length === 0) continue;

    // One subtopic means there's nothing to decide.
    if (topic.subtopics.length === 1) {
      const only = topic.subtopics[0];
      console.log(`${topic.unit.subject.shortCode} ${topic.title.slice(0, 40).padEnd(42)} ${unassigned.length} -> "${only.title}" (sole subtopic)`);
      if (write) {
        await prisma.card.updateMany({
          where: { id: { in: unassigned.map((c) => c.id) } },
          data: { subtopicId: only.id },
        });
      }
      assigned += unassigned.length;
      continue;
    }

    const response = await generateText(
      [
        {
          role: "system",
          content: `You are filing flashcards under the correct subtopic of a QCAA senior syllabus topic.

For each card, choose the subtopicId whose learning objectives it actually tests. If a card genuinely spans both, or you cannot tell, return null for that card — a wrong filing is worse than none, because it hides the card from the subtopic it belongs to.

Return ONLY a JSON array, one entry per card, in the order given:
[{"cardIndex": 0, "subtopicId": "..." or null}]`,
        },
        {
          role: "user",
          content:
            `Subtopics:\n` +
            topic.subtopics
              .map(
                (s) =>
                  `subtopicId: ${s.id}\ntitle: ${s.title}\nobjectives:\n${s.learningObjectives.slice(0, 8).map((o) => `- ${o.text}`).join("\n")}`,
              )
              .join("\n\n") +
            `\n\nCards:\n` +
            unassigned.map((c, i) => `${i}. ${c.front}`).join("\n"),
        },
      ],
      { jsonMode: true, maxTokens: 8000 },
    );

    const parsed = JSON.parse(stripJsonFences(response)) as {
      cardIndex: number;
      subtopicId: string | null;
    }[];
    const validIds = new Set(topic.subtopics.map((s) => s.id));

    let topicAssigned = 0;
    for (const entry of parsed) {
      const card = unassigned[entry.cardIndex];
      if (!card || !entry.subtopicId || !validIds.has(entry.subtopicId)) continue;
      if (write) {
        await prisma.card.update({
          where: { id: card.id },
          data: { subtopicId: entry.subtopicId },
        });
      }
      topicAssigned++;
    }
    assigned += topicAssigned;
    skipped += unassigned.length - topicAssigned;
    console.log(
      `${topic.unit.subject.shortCode} ${topic.title.slice(0, 40).padEnd(42)} ${topicAssigned}/${unassigned.length} filed`,
    );
  }

  console.log(`\nTOTAL filed ${assigned}, left unassigned ${skipped}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
