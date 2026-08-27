/**
 * Loads question-bank questions from a JSON file.
 *
 *   npx tsx scripts/seed-bank-questions.ts <questions.json> [--dry-run]
 *
 * Idempotent on `source` + `prompt`: re-running updates the working and answer
 * of a question already loaded rather than creating a duplicate. That matters
 * because the working out is the part most likely to get improved later, and a
 * second copy of a question would split Beschy's attempt history across two
 * rows.
 *
 * `sourceKind` must be stated per question and is never inferred. "qcaa" means
 * the question was transcribed from a real external paper; "generated" means
 * it was written to hit a specific objective. Both are useful practice, but
 * only the first is evidence of what QCAA actually asks, and quietly labelling
 * a written question as QCAA would corrupt the one signal that distinguishes
 * them.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env.supabase" });
config({ path: ".env.local" });

const LOCAL_USER_ID = "local";

type Q = {
  subject: string;
  source: string;
  sourceKind: "qcaa" | "generated";
  topicTag: string;
  prompt: string;
  working: string;
  answer: string;
  marks?: number;
  difficulty?: number;
  objectiveIds?: string[];
};

async function main() {
  const [path] = process.argv.slice(2);
  const dry = process.argv.includes("--dry-run");
  if (!path) {
    console.error("usage: npx tsx scripts/seed-bank-questions.ts <questions.json> [--dry-run]");
    process.exit(1);
  }

  const { questions } = JSON.parse(readFileSync(path, "utf-8")) as { questions: Q[] };
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const subjects = await prisma.subject.findMany({ where: { userId: LOCAL_USER_ID } });
  const byCode = new Map(subjects.map((s) => [s.shortCode, s.id]));

  let created = 0;
  let updated = 0;

  for (const q of questions) {
    const subjectId = byCode.get(q.subject);
    if (!subjectId) throw new Error(`no subject "${q.subject}"`);

    const existing = await prisma.bankQuestion.findFirst({
      where: { userId: LOCAL_USER_ID, source: q.source, prompt: q.prompt },
      select: { id: true },
    });

    console.log(
      `${existing ? "update" : "create"}  ${q.subject.padEnd(4)} ${q.topicTag.padEnd(5)} ${q.prompt.slice(0, 62).replace(/\n/g, " ")}`,
    );
    if (dry) continue;

    const data = {
      userId: LOCAL_USER_ID,
      subjectId,
      source: q.source,
      sourceKind: q.sourceKind,
      topicTag: q.topicTag,
      prompt: q.prompt,
      working: q.working,
      answer: q.answer,
      marks: q.marks ?? 2,
      difficulty: q.difficulty ?? 2,
      objectiveIds: q.objectiveIds ?? [],
    };

    if (existing) {
      await prisma.bankQuestion.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.bankQuestion.create({ data });
      created++;
    }
  }

  console.log(dry ? "\nDRY RUN — nothing written." : `\ncreated ${created}, updated ${updated}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
