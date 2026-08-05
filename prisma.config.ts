import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

// The datasource here is used by the Prisma CLI only (migrate, studio),
// pointed at the DIRECT (non-pooled) connection — migrations need a stable
// connection, not Supabase's transaction pooler. The runtime PrismaClient
// gets DATABASE_URL (the pooled connection) from src/lib/prisma.ts via the
// pg driver adapter instead.
//
// Resolved with plain process.env rather than prisma's env() helper, and only
// attached when a URL actually exists. env() resolves EAGERLY and throws
// PrismaConfigEnvError if the variable is missing, which took down the whole
// config file — including for `prisma generate`, which needs no database
// connection whatsoever. Since generate runs in postinstall, a missing
// DIRECT_URL failed the entire Vercel build at npm install.
//
// Deployment only needs DATABASE_URL; DIRECT_URL is for running migrations.
// Falling back to DATABASE_URL keeps `prisma migrate` usable anywhere both
// aren't set, and omitting the datasource entirely keeps generate working when
// neither is.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
