/**
 * Writes a batch of Today-board instructions from a JSON plan file.
 *
 *   npx tsx scripts/seed-period-tasks.ts <plan.json> [--dry-run]
 *
 * The plan is a file rather than code because the whole design is that these
 * get rewritten every few days off the back of what Beschy reports. Editing
 * JSON is the cheap path; editing a seeding script is not.
 *
 * Re-running is safe. Every date in the file is cleared before its tasks are
 * inserted — but only the PENDING ones. A task Beschy already marked done or
 * skipped carries his report on it, and silently replacing that would destroy
 * the only record of what actually happened that day.
 *
 * Slots are matched to the timetable by periodName ("P3", "Schoolwork"). The
 * Wednesday P4/P5 clash is real and unresolved in the source data, so a task
 * aimed at those slots should name a blockId explicitly or say in its detail
 * which of the two it means.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env.supabase" });
config({ path: ".env.local" });

const LOCAL_USER_ID = "local";

type PlanTask = {
  slot: string;
  subject?: string; // shortCode
  blockId?: string;
  title: string;
  detail: string;
  minutes?: number;
  priority?: number;
  objectiveIds?: string[];
  questionIds?: string[];
};

type PlanDay = { date: string; tasks: PlanTask[] };
type Plan = { days: PlanDay[] };

async function main() {
  const [planPath] = process.argv.slice(2);
  const dry = process.argv.includes("--dry-run");
  if (!planPath) {
    console.error("usage: npx tsx scripts/seed-period-tasks.ts <plan.json> [--dry-run]");
    process.exit(1);
  }

  const plan = JSON.parse(readFileSync(planPath, "utf-8")) as Plan;
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const subjects = await prisma.subject.findMany({ where: { userId: LOCAL_USER_ID } });
  const byCode = new Map(subjects.map((s) => [s.shortCode, s.id]));

  const blocks = await prisma.timetableBlock.findMany({ where: { userId: LOCAL_USER_ID } });

  let inserted = 0;
  let preserved = 0;

  for (const day of plan.days) {
    const dayStart = new Date(`${day.date}T00:00:00+10:00`);
    const dow = new Date(`${day.date}T12:00:00+10:00`).getUTCDay();

    const existing = await prisma.periodTask.findMany({
      where: { userId: LOCAL_USER_ID, date: dayStart },
    });
    const settled = existing.filter((t) => t.status !== "pending");
    preserved += settled.length;

    console.log(
      `${day.date} (dow ${dow}) — ${day.tasks.length} task(s)` +
        (settled.length ? `, keeping ${settled.length} already actioned` : ""),
    );

    for (const [i, t] of day.tasks.entries()) {
      const subjectId = t.subject ? byCode.get(t.subject) : undefined;
      if (t.subject && !subjectId) throw new Error(`${day.date}: no subject "${t.subject}"`);

      // Warn rather than fail: a slot that doesn't exist still renders, it
      // just lands in "Not tied to a period" instead of against a class.
      const slotBlocks = blocks.filter((b) => b.dayOfWeek === dow && b.periodName === t.slot);
      if (slotBlocks.length === 0) {
        console.log(`   ! ${t.slot}: no timetable block on this day — will show as unplaced`);
      } else if (slotBlocks.length > 1 && !t.blockId) {
        console.log(`   ! ${t.slot}: ${slotBlocks.length} blocks share this slot (clash)`);
      }

      console.log(`   ${t.slot.padEnd(11)} ${(t.subject ?? "--").padEnd(4)} ${t.title}`);

      if (dry) continue;

      // Clear only this date's pending rows, once, before the first insert.
      if (i === 0) {
        await prisma.periodTask.deleteMany({
          where: { userId: LOCAL_USER_ID, date: dayStart, status: "pending" },
        });
      }

      await prisma.periodTask.create({
        data: {
          userId: LOCAL_USER_ID,
          date: dayStart,
          order: i,
          slotKey: t.slot,
          blockId: t.blockId ?? slotBlocks[0]?.id ?? null,
          subjectId: subjectId ?? null,
          title: t.title,
          detail: t.detail,
          minutes: t.minutes ?? 40,
          priority: t.priority ?? 2,
          objectiveIds: t.objectiveIds ?? [],
          questionIds: t.questionIds ?? [],
        },
      });
      inserted++;
    }
  }

  console.log(
    dry
      ? "\nDRY RUN — nothing written."
      : `\nwrote ${inserted} period tasks; left ${preserved} already-actioned rows alone.`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
