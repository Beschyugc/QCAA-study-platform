/**
 * Sets each subject's real external and mock external dates.
 *
 * Sources, both verified against the primary document, not transcribed once
 * and trusted:
 * - Real externals: QCAA external assessment timetable 2026 (the official
 *   PDF, "snr_ext_assess_timetable_2026.pdf" in the Master Pack), read
 *   directly off its actual day/session table.
 * - Mocks: "2026 RGS Mock Exam Timetable.docx", parsed as a real table
 *   (rows/cells/gridSpan) rather than flattened prose, specifically because
 *   a flattened read of this document scrambled the day-to-subject mapping
 *   badly enough to be unusable — this rule zero applies here: no
 *   invented/guessed exam dates.
 *
 * Where a subject sits two papers (Biology, Psychology, Methods), the
 * EARLIER paper's date is stored — that's when the stakes for that subject
 * actually begin, and the dashboard shows one countdown per subject, not
 * per paper.
 *
 * Run: npx tsx scripts/set-exam-dates.ts [--write]
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const WRITE = process.argv.includes("--write");
const LOCAL_USER_ID = "local";

// All times Australia/Brisbane, which doesn't observe daylight saving, so a
// plain date (no time-of-day) is enough for a day-level countdown.
const EXAM_DATES: Record<string, { mock: string; real: string; note: string }> = {
  ENG: { mock: "2026-09-08", real: "2026-10-27", note: "single paper" },
  PE: { mock: "2026-09-09", real: "2026-10-28", note: "single paper" },
  BIO: { mock: "2026-09-11", real: "2026-11-02", note: "Paper 1 date (Paper 2 same day)" },
  PSY: { mock: "2026-09-16", real: "2026-11-10", note: "Paper 1 date (Paper 2 next day)" },
  MM: { mock: "2026-09-18", real: "2026-11-13", note: "Paper 1 date (Paper 2 same day)" },
};

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  for (const [code, dates] of Object.entries(EXAM_DATES)) {
    const subject = await prisma.subject.findFirst({
      where: { userId: LOCAL_USER_ID, shortCode: code },
    });
    if (!subject) {
      console.log(`  ${code}: no subject row, skipping`);
      continue;
    }
    console.log(
      `${code} — mock ${dates.mock}, real external ${dates.real} (${dates.note})` +
        (WRITE ? "" : " [dry run]"),
    );
    if (WRITE) {
      await prisma.subject.update({
        where: { id: subject.id },
        data: {
          mockExternalDate: new Date(`${dates.mock}T00:00:00`),
          nextAssessmentDate: new Date(`${dates.real}T00:00:00`),
        },
      });
    }
  }

  if (!WRITE) console.log("\nDry run — nothing written. Re-run with --write to save.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
