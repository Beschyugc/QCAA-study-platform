/**
 * Repairs the past-paper PDFs lost in the Supabase → local migration.
 *
 * restore-from-export.ts recreated the PastPaper rows with placeholder paths
 * (past-papers/local/<id>-question.pdf) but the PDFs themselves were never
 * copied into data/uploads. This script:
 *
 *   1. Re-derives which archive file belongs to each paper (same grouping
 *      rules as import-past-papers.ts, matched on subject + year + paperName)
 *   2. Copies it to data/uploads/past-papers/local/<id>-{question,mc,marking-guide}.pdf
 *   3. Normalises the DB paths to the /api/uploads/... URL convention that
 *      UI-uploaded papers already use, so <a href> links work everywhere.
 *
 * Run: npx tsx scripts/restore-paper-pdfs.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const ARCHIVE =
  "C:/Users/spenc/cLAUDE/School work for claude/1Schoolwork/QCAA_External_Past_Papers_2020-2024_2026_Syllabus_Filtered/QCAA_External_Past_Papers_2020-2024";

const FOLDERS: Record<string, string> = {
  MM: "Mathematical_Methods",
  BIO: "Biology",
  PSY: "Psychology",
  ENG: "English_General",
  PE: "Physical_Education",
};

const DEST = join(process.cwd(), "data", "uploads", "past-papers", "local");

type Found = {
  paperName: string;
  questionPaper: string;
  mcPaper: string | null;
  markingGuide: string | null;
};

// Same grouping rules as import-past-papers.ts — see that file for the
// explanation of the three archive shapes.
function groupYear(dir: string, year: number): Found[] {
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const has = (name: string) => (files.includes(name) ? name : null);
  const sharedGuide = has(`${year}_Marking_Guide.pdf`);

  const papers: Found[] = [];

  for (const file of files) {
    const match = file.match(/^\d{4}_Paper_(\d)_Question_and_Response\.pdf$/);
    if (!match) continue;
    const n = Number(match[1]);
    const filteredVersion = has(`${year}_2026_Filtered_Paper_${n}_Question_and_Response.pdf`);
    papers.push({
      paperName: `Paper ${n}${filteredVersion ? " (2026-filtered)" : ""}`,
      questionPaper: filteredVersion ?? file,
      mcPaper: has(`${year}_Paper_${n}_Multiple_Choice.pdf`),
      markingGuide: has(`${year}_Paper_${n}_Marking_Guide.pdf`) ?? sharedGuide,
    });
  }
  if (papers.length > 0) return papers;

  const filteredSingle =
    has(`${year}_2026_Filtered_Question_and_Response.pdf`) ??
    has(`${year}_2026_Filtered_Question_Book.pdf`);
  const originalSingle =
    has(`${year}_Question_and_Response.pdf`) ?? has(`${year}_Question_Book.pdf`);

  if (filteredSingle || originalSingle) {
    papers.push({
      paperName: `External paper${filteredSingle ? " (2026-filtered)" : ""}`,
      questionPaper: (filteredSingle ?? originalSingle)!,
      mcPaper: has(`${year}_Multiple_Choice.pdf`),
      markingGuide: sharedGuide,
    });
  }
  return papers;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  mkdirSync(DEST, { recursive: true });

  const papers = await prisma.pastPaper.findMany({
    include: { subject: { select: { shortCode: true } } },
  });

  let copied = 0;
  let fixed = 0;
  const problems: string[] = [];

  for (const p of papers) {
    const label = `${p.subject.shortCode} ${p.year} ${p.paperName}`;
    const folder = FOLDERS[p.subject.shortCode];
    if (!folder) {
      problems.push(`${label}: no archive folder mapping`);
      continue;
    }
    const yearDir = join(ARCHIVE, folder, String(p.year));
    if (!existsSync(yearDir)) {
      problems.push(`${label}: archive year folder missing (${yearDir})`);
      continue;
    }

    const found = groupYear(yearDir, p.year).find((f) => f.paperName === p.paperName);
    if (!found) {
      problems.push(`${label}: no archive match for paperName`);
      continue;
    }

    const place = (srcName: string | null, suffix: string): string | null => {
      if (!srcName) return null;
      const destName = `${p.id}-${suffix}.pdf`;
      const destAbs = join(DEST, destName);
      if (!existsSync(destAbs)) {
        copyFileSync(join(yearDir, srcName), destAbs);
        copied++;
      }
      return `/api/uploads/past-papers/local/${destName}`;
    };

    const questionPaperPath = place(found.questionPaper, "question")!;
    // Only place files the DB row expects — keeps flags consistent.
    const mcPaperPath = p.mcPaperPath ? place(found.mcPaper, "mc") : null;
    const markingGuidePath = p.markingGuidePath ? place(found.markingGuide, "marking-guide") : null;

    if (p.mcPaperPath && !mcPaperPath) problems.push(`${label}: DB expects MC paper, archive has none`);
    if (p.markingGuidePath && !markingGuidePath)
      problems.push(`${label}: DB expects marking guide, archive has none`);

    await prisma.pastPaper.update({
      where: { id: p.id },
      data: {
        questionPaperPath,
        mcPaperPath: mcPaperPath ?? (p.mcPaperPath ? p.mcPaperPath : null),
        markingGuidePath: markingGuidePath ?? (p.markingGuidePath ? p.markingGuidePath : null),
      },
    });
    fixed++;
    console.log(`✓ ${label}`);
  }

  console.log(`\n${fixed}/${papers.length} papers fixed, ${copied} files copied.`);
  if (problems.length) {
    console.log(`\nProblems:\n  ${problems.join("\n  ")}`);
  }

  await prisma.$disconnect();
  if (problems.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
