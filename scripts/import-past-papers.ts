/**
 * Imports the QCAA past papers, MC papers and marking guides from Beschy's
 * archive into Supabase Storage and the PastPaper table.
 *
 * Run: npx tsx scripts/import-past-papers.ts [--write] [MM BIO ...]
 *
 * Dry run by default; --write uploads and inserts. Re-running skips papers
 * already imported (matched on subject + year + name), so a partial run can be
 * resumed without duplicating uploads.
 *
 * totalMarks is deliberately left at 0, meaning "not set". The mark total
 * cannot be read out of these PDFs — several subjects' papers are scanned
 * images with no text layer at all, and the ones with text don't state a
 * total. Inventing a number would corrupt every percentage the app later
 * calculates from it, so the UI asks for it when you sit the paper instead.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ARCHIVE =
  "C:/Users/spenc/cLAUDE/School work for claude/1Schoolwork/QCAA_External_Past_Papers_2020-2024_2026_Syllabus_Filtered/QCAA_External_Past_Papers_2020-2024";

/** Archive folder name -> the subject shortCode in the database. */
const FOLDERS: Record<string, string> = {
  Mathematical_Methods: "MM",
  Biology: "BIO",
  Psychology: "PSY",
  English_General: "ENG",
  Physical_Education: "PE",
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type Found = {
  paperName: string;
  questionPaper: string;
  mcPaper: string | null;
  markingGuide: string | null;
  filtered: boolean;
};

/**
 * Groups a year folder's files into papers.
 *
 * The archive uses three shapes, and assuming only the first silently imported
 * nothing at all for English and PE:
 *
 *   {year}_Paper_{N}_Question_and_Response.pdf   Methods, Biology, Psychology
 *                                                (two papers per year)
 *   {year}_Question_and_Response.pdf             PE (one paper per year)
 *   {year}_Question_Book.pdf                     English (one paper per year)
 *
 * Marking guides likewise come per-paper ({year}_Paper_1_Marking_Guide.pdf) or
 * one per year ({year}_Marking_Guide.pdf). The per-paper one wins when present.
 *
 * Where a "2026_Filtered" version exists it is preferred and labelled as such:
 * it is the same paper with questions on content no longer assessable in 2026
 * removed, which is what Beschy should actually be sitting. The unfiltered
 * original is left in the archive rather than imported alongside, so the list
 * doesn't double.
 */
function groupYear(dir: string, year: number): Found[] {
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const has = (name: string) => (files.includes(name) ? name : null);
  const sharedGuide = has(`${year}_Marking_Guide.pdf`);

  const papers: Found[] = [];

  // Shape 1: numbered papers.
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
      filtered: filteredVersion !== null,
    });
  }
  if (papers.length > 0) return papers.sort((a, b) => a.paperName.localeCompare(b.paperName));

  // Shape 2 and 3: a single paper for the year.
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
      filtered: filteredSingle !== null,
    });
  }
  return papers;
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const only = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());

  const { uploadToBucket } = await import("../src/lib/storage");

  console.log(write ? "MODE: WRITE (uploads to Storage)\n" : "MODE: dry run\n");

  let imported = 0;
  let skipped = 0;
  let bytes = 0;

  for (const [folder, code] of Object.entries(FOLDERS)) {
    if (only.length > 0 && !only.includes(code)) continue;

    const subject = await prisma.subject.findFirst({ where: { shortCode: code } });
    if (!subject) {
      console.log(`${code}: not in the database — skipping\n`);
      continue;
    }
    const base = join(ARCHIVE, folder);
    if (!existsSync(base)) {
      console.log(`${code}: ${base} missing — skipping\n`);
      continue;
    }

    console.log(`${code} — ${subject.name}`);

    const years = readdirSync(base)
      .filter((d) => /^\d{4}$/.test(d))
      .sort();

    for (const yearName of years) {
      const year = Number(yearName);
      for (const paper of groupYear(join(base, yearName), year)) {
        const paperName = paper.paperName;

        const existing = await prisma.pastPaper.findFirst({
          where: { userId: subject.userId, subjectId: subject.id, year, paperName },
        });
        if (existing) {
          skipped++;
          continue;
        }

        const qPath = join(base, yearName, paper.questionPaper);
        bytes += statSync(qPath).size;

        console.log(
          `  ${year} ${paperName}${paper.mcPaper ? " +MC" : ""}${paper.markingGuide ? " +guide" : ""}`,
        );

        if (!write) continue;

        const upload = async (fileName: string) => {
          const full = join(base, yearName, fileName);
          const file = new File([readFileSync(full)], fileName, { type: "application/pdf" });
          const { path } = await uploadToBucket("past-papers", subject.userId, file);
          return path;
        };

        const questionPaperPath = await upload(paper.questionPaper);
        const mcPaperPath = paper.mcPaper ? await upload(paper.mcPaper) : null;
        const markingGuidePath = paper.markingGuide ? await upload(paper.markingGuide) : null;

        await prisma.pastPaper.create({
          data: {
            userId: subject.userId,
            subjectId: subject.id,
            year,
            paperName,
            questionPaperPath,
            mcPaperPath,
            markingGuidePath,
            // 0 means "not set" — see the note at the top of this file.
            totalMarks: 0,
            hasMarkingGuide: markingGuide2Bool(markingGuidePath),
          },
        });
        imported++;
      }
    }
    console.log();
  }

  console.log(
    `TOTAL imported ${imported}, already present ${skipped}, ~${(bytes / 1048576).toFixed(1)} MB of question papers`,
  );
  await prisma.$disconnect();
}

function markingGuide2Bool(path: string | null): boolean {
  return path !== null;
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
