import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

async function main() {
  const subjects = await prisma.subject.findMany({ select: { id: true, shortCode: true } });
  for (const s of subjects) {
    const cards = await prisma.card.count({ where: { subjectId: s.id } });
    console.log(`${s.shortCode}: ${cards} cards`);
    const topics = await prisma.topic.findMany({
      where: { unit: { subjectId: s.id } },
      select: {
        number: true,
        title: true,
        _count: { select: { cards: true } },
        unit: { select: { number: true } },
      },
      orderBy: [{ unit: { number: "asc" } }, { number: "asc" }],
    });
    for (const t of topics)
      console.log(`  U${t.unit.number} T${t.number} ${t.title}: ${t._count.cards}`);
  }
  const types = await prisma.card.groupBy({ by: ["cardType"], _count: { _all: true } });
  console.log(JSON.stringify(types));
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
