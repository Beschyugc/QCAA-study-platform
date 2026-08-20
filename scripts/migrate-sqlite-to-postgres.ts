/**
 * One-shot copy of the local SQLite build's data into Supabase Postgres.
 *
 * Written to be re-runnable and self-describing rather than clever: it asks
 * Postgres for the column types and the foreign-key graph instead of
 * hardcoding either, so it keeps working if the schema moves on.
 *
 * The two conversions that actually matter, both from how Prisma writes
 * SQLite:
 *   - Booleans are stored as INTEGER 0/1        -> real booleans
 *   - DateTimes are stored as ISO-8601 TEXT     -> Date
 *
 *   npx tsx scripts/migrate-sqlite-to-postgres.ts [--dry-run]
 */
import Database from "better-sqlite3";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env.supabase" });
config({ path: ".env.local" });

const DRY = process.argv.includes("--dry-run");
const SQLITE_PATH = "prisma/dev.db";

type Column = { name: string; dataType: string; udtName: string };

async function main() {
  const pg = new Client({ connectionString: process.env.DIRECT_URL });
  await pg.connect();
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  // --- what tables exist on each side ---------------------------------
  const pgTables: string[] = (
    await pg.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          AND table_name <> '_prisma_migrations'`,
    )
  ).rows.map((r) => r.table_name);

  const sqliteTables = new Set(
    sqlite
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table'
          AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'`,
      )
      .all()
      .map((r) => (r as { name: string }).name),
  );

  // --- order tables so parents land before children -------------------
  const deps = new Map<string, Set<string>>(pgTables.map((t) => [t, new Set()]));
  const fks = await pg.query(`
    SELECT tc.table_name AS child, ccu.table_name AS parent
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`);
  for (const { child, parent } of fks.rows) {
    // Self-references resolve within a table, not between tables, so they
    // must not create a cycle in the ordering.
    if (child !== parent) deps.get(child)?.add(parent);
  }

  const ordered: string[] = [];
  const seen = new Set<string>();
  const visiting = new Set<string>();
  const visit = (t: string) => {
    if (seen.has(t) || visiting.has(t)) return;
    visiting.add(t);
    for (const p of deps.get(t) ?? []) visit(p);
    visiting.delete(t);
    seen.add(t);
    ordered.push(t);
  };
  for (const t of pgTables) visit(t);

  // --- copy ------------------------------------------------------------
  let totalRows = 0;
  const report: string[] = [];

  for (const table of ordered) {
    if (!sqliteTables.has(table)) {
      report.push(`  ${table.padEnd(24)} — not in SQLite, skipped`);
      continue;
    }

    const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<
      string,
      unknown
    >[];
    if (rows.length === 0) {
      report.push(`  ${table.padEnd(24)} — empty`);
      continue;
    }

    const columns: Column[] = (
      await pg.query(
        `SELECT column_name AS name, data_type AS "dataType", udt_name AS "udtName"
           FROM information_schema.columns
          WHERE table_schema='public' AND table_name=$1`,
        [table],
      )
    ).rows;
    const byName = new Map(columns.map((c) => [c.name, c]));

    // Only copy columns both sides agree on.
    const cols = Object.keys(rows[0]).filter((c) => byName.has(c));

    const convert = (col: string, value: unknown) => {
      if (value === null || value === undefined) return null;
      const type = byName.get(col)!.dataType;
      if (type === "boolean") return value === 1 || value === true;
      if (type.startsWith("timestamp") || type === "date") {
        return value instanceof Date ? value : new Date(String(value));
      }
      return value;
    };

    if (DRY) {
      report.push(`  ${table.padEnd(24)} — would copy ${rows.length} rows`);
      totalRows += rows.length;
      continue;
    }

    // Batched multi-row INSERT. ON CONFLICT DO NOTHING makes the whole
    // script safe to run twice.
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      const params: unknown[] = [];
      const tuples = slice.map((row) => {
        const placeholders = cols.map((c) => {
          params.push(convert(c, row[c]));
          return `$${params.length}`;
        });
        return `(${placeholders.join(",")})`;
      });
      const colList = cols.map((c) => `"${c}"`).join(",");
      await pg.query(
        `INSERT INTO "${table}" (${colList}) VALUES ${tuples.join(",")}
         ON CONFLICT DO NOTHING`,
        params,
      );
    }

    const after = await pg.query(`SELECT COUNT(*)::int AS c FROM "${table}"`);
    report.push(
      `  ${table.padEnd(24)} — ${String(rows.length).padStart(5)} read, ${String(after.rows[0].c).padStart(5)} now in Postgres`,
    );
    totalRows += rows.length;
  }

  console.log(DRY ? "DRY RUN — nothing written\n" : "Copied\n");
  console.log(report.join("\n"));
  console.log(`\n  total rows read: ${totalRows}`);

  sqlite.close();
  await pg.end();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
