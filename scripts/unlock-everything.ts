import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

// Flips every locked topic to active across all subjects and units.
// Mastered topics are left alone — only `locked` rows change.
async function main() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const before = await prisma.topic.groupBy({
    by: ["unlockState"],
    _count: { _all: true },
  });
  console.log("Before:", JSON.stringify(before));

  const result = await prisma.topic.updateMany({
    where: { unlockState: "locked" },
    data: { unlockState: "active", unlockedAt: new Date() },
  });
  console.log(`Unlocked ${result.count} topics.`);

  const after = await prisma.topic.groupBy({
    by: ["unlockState"],
    _count: { _all: true },
  });
  console.log("After:", JSON.stringify(after));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
