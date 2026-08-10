/**
 * Restores a bundle made by `npm run backup` onto this machine.
 *
 * Run:  npm run restore -- "<path to bundle>"           (dry run — reports only)
 *       npm run restore -- "<path to bundle>" --write   (actually restores)
 *
 * Dry run by default, like every other destructive script here, because this
 * REPLACES the database on this machine. Anything studied here and not in
 * the bundle is gone afterwards — so the existing database is moved aside to
 * dev.db.replaced-<timestamp> rather than deleted, which makes a mistaken
 * restore recoverable instead of final.
 *
 * Stop the dev server first. Overwriting a database file out from under a
 * running server is how you get a corrupt file and a confusing crash.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { copyFileSync, cpSync, existsSync, readFileSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

function main() {
  const bundleArg = process.argv[2];
  const write = process.argv.includes("--write");
  if (!bundleArg || bundleArg === "--write") {
    throw new Error('usage: npm run restore -- "<path to bundle>" [--write]');
  }

  const bundleDir = resolve(bundleArg);
  const bundleDb = join(bundleDir, "dev.db");
  const bundleData = join(bundleDir, "data");
  if (!existsSync(bundleDb)) throw new Error(`No dev.db in ${bundleDir}`);

  const appRoot = process.cwd();
  const targetDb = resolve(appRoot, (process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace(/^file:/, ""));
  const targetData = join(appRoot, "data");

  // Report what's in the bundle before touching anything.
  const exportPath = join(bundleDir, "export.json");
  if (existsSync(exportPath)) {
    const bundle = JSON.parse(readFileSync(exportPath, "utf-8")) as {
      exportedAt: string;
      counts: Record<string, number>;
    };
    console.log(`Bundle taken ${bundle.exportedAt}`);
    for (const [key, n] of Object.entries(bundle.counts)) {
      if (n > 0) console.log(`  ${key.padEnd(20)} ${n}`);
    }
  }

  console.log(`\nWould restore:`);
  console.log(`  ${bundleDb}\n    -> ${targetDb}`);
  if (existsSync(bundleData)) console.log(`  ${bundleData}\n    -> ${targetData}`);

  if (existsSync(targetDb)) {
    console.log(
      `\nThis machine already has a database at ${targetDb}.` +
        `\nIt will be moved aside (not deleted), and anything in it that isn't in the bundle` +
        `\nwill no longer be what the app reads.`,
    );
  }

  if (!write) {
    console.log(`\nDry run — nothing changed. Re-run with --write to restore.`);
    return;
  }

  if (existsSync(targetDb)) {
    const aside = `${targetDb}.replaced-${timestamp()}`;
    renameSync(targetDb, aside);
    console.log(`\nPrevious database moved to:\n  ${aside}`);
  }

  copyFileSync(bundleDb, targetDb);
  console.log(`Restored database.`);

  if (existsSync(bundleData)) {
    cpSync(bundleData, targetData, { recursive: true });
    console.log(`Restored data/ (uploads + local-auth.json).`);
  }

  console.log(
    `\nDone. If .env.local doesn't exist yet, copy .env.example to .env.local and set` +
      `\nAPP_SESSION_SECRET to any random string:` +
      `\n  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` +
      `\n\nThen: npm run dev`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
