import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

// Local SQLite file — one connection string, no pooler, no direct-vs-pooled
// split the way Supabase needed. Kept as a fallback-only lookup (not
// prisma's env() helper) so `prisma generate` still works with no
// .env.local at all, e.g. straight after a fresh clone before the file
// exists.
const migrationUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
