import { config } from "dotenv";
config({ path: ".env.local" });

import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { COOKIE_NAME, issueSessionToken } from "../src/lib/session";

// Verifies every past paper end-to-end: DB record → files on disk → page
// and PDF routes returning 200 from the running dev server. Mints its own
// session cookie so the checks exercise the real authenticated routes.
const BASE = "http://localhost:3000";
const UPLOAD_ROOT = resolve(join(process.cwd(), "data", "uploads"));
const COOKIE = `${COOKIE_NAME}=${issueSessionToken()}`;

function diskPathFor(urlPath: string): string | null {
  const prefix = "/api/uploads/";
  if (!urlPath.startsWith(prefix)) return null;
  return join(UPLOAD_ROOT, urlPath.slice(prefix.length));
}

async function httpStatus(url: string): Promise<number> {
  try {
    const res = await fetch(url, { redirect: "manual", headers: { cookie: COOKIE } });
    return res.status;
  } catch {
    return 0;
  }
}

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const papers = await prisma.pastPaper.findMany({
    include: { subject: { select: { shortCode: true } } },
    orderBy: [{ subjectId: "asc" }, { year: "desc" }],
  });
  console.log(`${papers.length} papers in DB\n`);

  const problems: string[] = [];

  for (const p of papers) {
    const label = `${p.subject.shortCode} ${p.year} ${p.paperName}`;
    const issues: string[] = [];

    // 1. Files on disk
    const fileChecks: Array<[string, string | null]> = [
      ["question paper", p.questionPaperPath],
      ["MC paper", p.mcPaperPath],
      ["marking guide", p.markingGuidePath],
    ];
    for (const [what, urlPath] of fileChecks) {
      if (!urlPath) continue;
      const disk = diskPathFor(urlPath);
      if (!disk) {
        issues.push(`${what}: unexpected path format "${urlPath}"`);
      } else if (!existsSync(disk)) {
        issues.push(`${what}: MISSING on disk (${urlPath})`);
      } else if (statSync(disk).size < 1024) {
        issues.push(`${what}: suspiciously small (${statSync(disk).size} bytes)`);
      }
    }

    // 2. hasMarkingGuide flag consistency
    if (p.hasMarkingGuide && !p.markingGuidePath) {
      issues.push("hasMarkingGuide=true but no markingGuidePath");
    }
    if (!p.hasMarkingGuide && p.markingGuidePath) {
      issues.push("markingGuidePath set but hasMarkingGuide=false");
    }

    // 3. Page route
    const pageUrl = `${BASE}/subjects/${p.subject.shortCode}/past-papers/${p.id}`;
    const pageStatus = await httpStatus(pageUrl);
    if (pageStatus !== 200) issues.push(`page returned ${pageStatus}`);

    // 4. PDF routes
    for (const [what, urlPath] of fileChecks) {
      if (!urlPath) continue;
      const s = await httpStatus(`${BASE}${urlPath}`);
      if (s !== 200) issues.push(`${what} route returned ${s} (${urlPath})`);
    }

    if (issues.length) {
      problems.push(`✗ ${label}\n    ${issues.join("\n    ")}`);
      console.log(`✗ ${label}: ${issues.length} issue(s)`);
    } else {
      console.log(`✓ ${label}`);
    }
  }

  console.log(
    problems.length
      ? `\n${problems.length} paper(s) with problems:\n\n${problems.join("\n")}`
      : "\nAll papers verified clean.",
  );

  await prisma.$disconnect();
  if (problems.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
