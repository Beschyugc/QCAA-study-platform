/**
 * Points each period task at the bank questions that drill the same objectives.
 *
 *   npx tsx scripts/link-bank-to-tasks.ts [--dry-run]
 *
 * Matching is by shared LearningObjective id, not by topic tag. A tag match
 * would attach every U3T4 question to every U3T4 task, and "Introduction to
 * integration" is twelve objectives wide — Beschy would open a task about
 * initial conditions and get handed questions on trapeziums.
 *
 * Only questions from the same subject are considered, and only pending
 * tasks are rewritten: a task he has already worked through should keep the
 * question list he actually saw.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env.supabase" });
config({ path: ".env.local" });

const LOCAL_USER_ID = "local";

function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

async function main() {
  const dry = process.argv.includes("--dry-run");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const [tasks, questions] = await Promise.all([
    prisma.periodTask.findMany({
      where: { userId: LOCAL_USER_ID, status: "pending" },
      orderBy: { date: "asc" },
    }),
    prisma.bankQuestion.findMany({
      where: { userId: LOCAL_USER_ID, isActive: true },
      select: { id: true, subjectId: true, objectiveIds: true, source: true },
    }),
  ]);

  let linked = 0;

  for (const task of tasks) {
    const wanted = new Set(ids(task.objectiveIds));
    if (wanted.size === 0 || !task.subjectId) continue;

    const matches = questions
      .filter((q) => q.subjectId === task.subjectId)
      .filter((q) => ids(q.objectiveIds).some((o) => wanted.has(o)))
      .map((q) => q.id);

    if (matches.length === 0) continue;

    console.log(
      `${task.date.toISOString().slice(0, 10)} ${task.slotKey.padEnd(11)} ${matches.length} question(s)  ${task.title.slice(0, 50)}`,
    );

    if (!dry) {
      await prisma.periodTask.update({
        where: { id: task.id },
        data: { questionIds: matches },
      });
    }
    linked++;
  }

  console.log(dry ? `\nDRY RUN — ${linked} tasks would be linked.` : `\nlinked ${linked} tasks.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
