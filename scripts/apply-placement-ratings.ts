/**
 * Writes placement marking into the app as RAG ratings.
 *
 * Input is a JSON file of { "<question number>": "red" | "amber" | "green" },
 * which is the marking of each answer. Each question's rating is applied to
 * the syllabus objectives of the subtopic it diagnosed, using the mapping
 * emitted alongside the paper.
 *
 * Two deliberate rules:
 *   - A question with no rating leaves its objectives alone. Unrated is an
 *     honest state; guessing green because nothing came back is not.
 *   - Where several questions cover one subtopic, the WORST rating wins.
 *     Getting one of three integration questions right does not mean
 *     integration is green, and the cost of a false green is that the topic
 *     never resurfaces.
 *
 * Ratings go through the same ragHistory append as the UI, so the app's
 * staleness and regression logic keeps working.
 *
 *   npx tsx scripts/apply-placement-ratings.ts <mapping.json> <marking.json> [--dry-run]
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env.supabase" });
config({ path: ".env.local" });

type Rag = "red" | "amber" | "green";

const SEVERITY: Record<Rag, number> = { red: 0, amber: 1, green: 2 };

type MappingEntry = {
  question: number;
  subtopic: string;
  objectiveIds: string[];
};

async function main() {
  const [mappingPath, markingPath] = process.argv.slice(2);
  const dry = process.argv.includes("--dry-run");
  if (!mappingPath || !markingPath) {
    console.error(
      "usage: npx tsx scripts/apply-placement-ratings.ts <mapping.json> <marking.json> [--dry-run]",
    );
    process.exit(1);
  }

  const mapping = JSON.parse(readFileSync(mappingPath, "utf-8")) as {
    questions: MappingEntry[];
  };
  const marking = JSON.parse(readFileSync(markingPath, "utf-8")) as Record<string, Rag>;

  // Worst rating per objective.
  const worst = new Map<string, Rag>();
  let markedQuestions = 0;

  for (const entry of mapping.questions) {
    const rating = marking[String(entry.question)];
    if (!rating) continue;
    if (!(rating in SEVERITY)) {
      throw new Error(`Q${entry.question}: "${rating}" is not red/amber/green.`);
    }
    markedQuestions++;
    for (const id of entry.objectiveIds) {
      const existing = worst.get(id);
      if (!existing || SEVERITY[rating] < SEVERITY[existing]) worst.set(id, rating);
    }
  }

  const tally = { red: 0, amber: 0, green: 0 };
  for (const r of worst.values()) tally[r]++;

  console.log(`questions marked   : ${markedQuestions} of ${mapping.questions.length}`);
  console.log(`objectives to set  : ${worst.size}`);
  console.log(`  red ${tally.red} · amber ${tally.amber} · green ${tally.green}`);

  if (dry) {
    console.log("\nDRY RUN — nothing written.");
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const now = new Date().toISOString();
  let written = 0;

  for (const [id, status] of worst) {
    const objective = await prisma.learningObjective.findUnique({ where: { id } });
    if (!objective) {
      console.log(`  skipped ${id} — no such objective`);
      continue;
    }
    const history = Array.isArray(objective.ragHistory) ? objective.ragHistory : [];
    await prisma.learningObjective.update({
      where: { id },
      data: {
        ragStatus: status,
        ragUpdatedAt: now,
        ragHistory: [...history, { status, timestamp: now, source: "placement" }],
      },
    });
    written++;
  }

  console.log(`\nwrote ${written} objective ratings.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
