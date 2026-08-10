/**
 * Makes a complete, portable backup of everything this app owns.
 *
 * Run:  npm run backup            (writes to ../STUDYLINE-backups/)
 *       npm run backup -- <dir>   (writes somewhere else, e.g. a USB stick)
 *
 * A bundle contains:
 *   dev.db          the whole database, byte-exact — cards, reviews,
 *                   scheduling, mistakes, lessons, calendar, ratings
 *   data/           uploaded files (card media, past papers) AND
 *                   local-auth.json, so your passphrase comes with it
 *   export.json     the same content as portable JSON — readable without
 *                   this app at all, and survives schema changes the raw
 *                   .db would not
 *   RESTORE.txt     how to put it back
 *
 * The database is copied with SQLite's VACUUM INTO rather than a plain file
 * copy. A plain copy of a database that's being written to — which it is,
 * any time the dev server is running — can produce a subtly corrupt file
 * that only fails later. VACUUM INTO takes a consistent snapshot and is
 * safe to run against a live database.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import Database from "better-sqlite3";

const LOCAL_USER_ID = "local";

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

async function main() {
  const appRoot = process.cwd();
  const dbPath = resolve(appRoot, (process.env.DATABASE_URL ?? "").replace(/^file:/, ""));
  if (!existsSync(dbPath)) throw new Error(`No database at ${dbPath}`);

  const targetRoot = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(appRoot, "..", "STUDYLINE-backups");
  const bundleDir = join(targetRoot, `studyline-${timestamp()}`);
  mkdirSync(bundleDir, { recursive: true });

  // 1. Database — consistent snapshot, safe against a running server.
  const db = new Database(dbPath, { readonly: true });
  const dbOut = join(bundleDir, "dev.db");
  db.exec(`VACUUM INTO '${dbOut.replace(/\\/g, "/").replace(/'/g, "''")}'`);
  db.close();
  console.log(`  dev.db      snapshot taken`);

  // 2. Uploads + the local passphrase file.
  const dataDir = join(appRoot, "data");
  if (existsSync(dataDir)) {
    cpSync(dataDir, join(bundleDir, "data"), { recursive: true });
    console.log(`  data/       copied (uploads + local-auth.json)`);
  } else {
    console.log(`  data/       nothing to copy yet`);
  }

  // 3. Portable JSON, readable without this app.
  const { prisma } = await import("../src/lib/prisma");
  const { exportAllData } = await import("../src/lib/export");
  const bundle = await exportAllData(LOCAL_USER_ID);
  writeFileSync(join(bundleDir, "export.json"), JSON.stringify(bundle, null, 2));
  await prisma.$disconnect();

  const total = Object.values(bundle.counts).reduce((a, b) => a + b, 0);
  console.log(`  export.json ${total} rows across ${Object.keys(bundle.counts).length} tables`);

  writeFileSync(
    join(bundleDir, "RESTORE.txt"),
    `STUDYLINE backup — ${bundle.exportedAt}

WHAT'S HERE
  dev.db       the whole database (the real thing — everything below is
               derived from it)
  data/        uploaded files, and local-auth.json (your passphrase)
  export.json  the same content as portable JSON

ROW COUNTS
${Object.entries(bundle.counts)
  .filter(([, n]) => n > 0)
  .map(([k, n]) => `  ${k.padEnd(20)} ${n}`)
  .join("\n")}

TO RESTORE ONTO ANOTHER MACHINE
  1. Copy the whole 'app' folder there (or 'git clone' it), then:
       npm install
  2. Copy this bundle's dev.db over    app/prisma/dev.db
     Copy this bundle's data/ over     app/data/
  3. Create app/.env.local from .env.example. Set APP_SESSION_SECRET to any
     random string (a different one per machine is fine — it only decides
     whether you have to sign in again).
  4. npm run dev

  Or, from inside the app folder:
       npm run restore -- "<path to this bundle>"
     which does steps 2 and 3 for you.

WARNING — TWO COPIES DIVERGE
  If you restore onto a second machine and then study on BOTH, the two
  databases drift apart and there is no merge. Whichever you restore from
  next silently wins, and the other machine's work is gone.

  To genuinely use both machines, don't copy at all — leave the database on
  one machine and open it from the other over your home network:
       npm run share
  prints the address to use.
`,
  );

  console.log(`\nBackup written to:\n  ${bundleDir}`);
  console.log(`\nCopy that folder to your laptop, or read RESTORE.txt inside it.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
