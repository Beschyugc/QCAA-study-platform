// Dumps learning objectives for named topics so card authoring is grounded
// in the real syllabus wording. Usage: npx tsx scripts/dump-objectives.ts ENG PE
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const only = process.argv.slice(2).map((a) => a.toUpperCase());
  const subjects = await prisma.subject.findMany({
    where: only.length ? { shortCode: { in: only } } : {},
    include: {
      units: {
        orderBy: { number: "asc" },
        include: {
          topics: {
            orderBy: { order: "asc" },
            include: {
              subtopics: {
                orderBy: { order: "asc" },
                include: { learningObjectives: { orderBy: { createdAt: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  for (const s of subjects) {
    for (const u of s.units) {
      for (const t of u.topics) {
        console.log(`\n=== ${s.shortCode} U${u.number}T${t.number} ${t.title} ===`);
        for (const st of t.subtopics) {
          console.log(`  -- ${st.title}`);
          for (const o of st.learningObjectives) console.log(`     * ${o.text}`);
        }
      }
    }
  }
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
