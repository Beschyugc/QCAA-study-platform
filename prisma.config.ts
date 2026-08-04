import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });

// This datasource block is used by the Prisma CLI only (migrate, studio),
// pointed at the DIRECT (non-pooled) connection — migrations need a stable
// connection, not Supabase's transaction pooler. The runtime PrismaClient
// gets DATABASE_URL (the pooled connection) from src/lib/prisma.ts via the
// pg driver adapter instead.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
