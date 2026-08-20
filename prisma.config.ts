import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// .env.supabase holds the Postgres pair; .env.local is still read after it
// for the AI keys and session secret. Neither overrides an already-set real
// environment variable, so Vercel's own env wins in CI.
config({ path: ".env.supabase" });
config({ path: ".env.local" });

// Migrations must go over the SESSION-mode pooler (DIRECT_URL, :5432).
// pgbouncer's transaction mode on :6543 cannot run them — it does not keep
// prepared statements or advisory locks across statements, and prisma
// migrate needs both. Falls back to DATABASE_URL so `prisma generate` still
// works on a fresh clone with no env files present.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
