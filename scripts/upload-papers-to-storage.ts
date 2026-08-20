/**
 * Pushes the past-paper PDFs from data/uploads into Supabase Storage.
 *
 * They lived on local disk while the app was localhost-only. That cannot
 * survive on Vercel: the folder is gitignored, and the filesystem is rebuilt
 * on every deploy, so every paper would 404 in production.
 *
 * The bucket is private. Nothing is served straight from Supabase — the
 * app's own /api/uploads route still gates each file on the session and
 * streams it through, exactly as it did from disk.
 *
 *   npx tsx scripts/upload-papers-to-storage.ts [--dry-run]
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { config } from "dotenv";

config({ path: ".env.supabase" });
config({ path: ".env.local" });

const DRY = process.argv.includes("--dry-run");
const BUCKET = "past-papers";
const ROOT = join(process.cwd(), "data", "uploads");

const SUPABASE_URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !KEY) {
  console.error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local");
  process.exit(1);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function ensureBucket() {
  const existing = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, {
    headers,
  });
  if (existing.ok) {
    console.log(`bucket "${BUCKET}" already exists`);
    return;
  }
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
  });
  if (!res.ok) throw new Error(`create bucket failed: ${res.status} ${await res.text()}`);
  console.log(`created private bucket "${BUCKET}"`);
}

async function main() {
  const files = await walk(ROOT);
  let bytes = 0;
  for (const f of files) bytes += (await stat(f)).size;
  console.log(`${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB\n`);

  if (DRY) {
    for (const f of files.slice(0, 5)) {
      console.log("  would upload:", relative(ROOT, f).replace(/\\/g, "/"));
    }
    console.log(`  ...and ${Math.max(0, files.length - 5)} more`);
    return;
  }

  await ensureBucket();

  let done = 0;
  let failed = 0;
  for (const file of files) {
    const key = relative(ROOT, file).replace(/\\/g, "/");
    const body = await readFile(file);
    // upsert:true so a re-run repairs a partial upload instead of erroring.
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(key)}`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/pdf",
          "x-upsert": "true",
        },
        body: new Uint8Array(body),
      },
    );
    if (!res.ok) {
      failed++;
      console.log(`  FAILED ${key}: ${res.status} ${await res.text()}`);
    } else {
      done++;
      if (done % 20 === 0) console.log(`  ${done}/${files.length}...`);
    }
  }
  console.log(`\nuploaded ${done}, failed ${failed}`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
