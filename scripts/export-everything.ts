/**
 * Read-only dump of the whole curriculum tree + every flashcard to JSON,
 * so the deck can be exported out of Supabase into a document.
 *
 * Run:  npx tsx scripts/export-everything.ts <outfile.json>
 *
 * Writes nothing to the database. No AI calls.
 *
 * Same import discipline as the seed scripts: config() first, Prisma pulled
 * in dynamically afterwards, so DATABASE_URL is populated before the client
 * singleton is constructed.
 */
import { config } from "dotenv";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error("usage: export-everything.ts <outfile.json>");

  const { prisma } = await import("../src/lib/prisma");

  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          topics: {
            orderBy: { order: "asc" },
            include: {
              subtopics: {
                orderBy: { order: "asc" },
                include: {
                  learningObjectives: { orderBy: { createdAt: "asc" } },
                },
              },
              lesson: true,
            },
          },
        },
      },
    },
  });

  const cards = await prisma.card.findMany({
    orderBy: [{ subjectId: "asc" }, { topicId: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      subjectId: true,
      topicId: true,
      subtopicId: true,
      objectiveId: true,
      cardType: true,
      complexity: true,
      front: true,
      back: true,
      extra: true,
      tags: true,
    },
  });

  // tags is stored as a JSON-encoded string (SQLite has no array column);
  // decode back to a real array so the export shape matches what it always
  // was rather than double-encoding.
  const cardsOut = cards.map((c) => ({
    ...c,
    tags: (() => {
      try {
        const parsed = JSON.parse(c.tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
  }));

  const assumed = await prisma.assumedKnowledge.findMany().catch(() => []);
  const timetable = await prisma.timetableBlock.findMany().catch(() => []);
  const papers = await prisma.pastPaper.findMany().catch(() => []);
  const videos = await prisma.topicVideo.findMany().catch(() => []);

  writeFileSync(
    out,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        counts: {
          subjects: subjects.length,
          cards: cardsOut.length,
          assumedKnowledge: assumed.length,
          timetableBlocks: timetable.length,
          pastPapers: papers.length,
          topicVideos: videos.length,
        },
        subjects,
        cards: cardsOut,
        assumed,
        timetable,
        papers,
      },
      null,
      2,
    ),
  );
  console.log(`wrote ${out}: ${cards.length} cards, ${subjects.length} subjects`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
