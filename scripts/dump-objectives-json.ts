// Dumps every learning objective of the named subjects as JSON, in the shape
// the placement paper builder reads. Same fields as the Methods dump that came
// before it, plus the subtopic id — Biology and Psychology repeat subtopic
// TITLES across topics ("Science understanding" appears four times), so a
// title is not an identifier and mapping on one would merge unrelated topics.
//
//   npx tsx scripts/dump-objectives-json.ts BIO PSY ENG PE
import { config } from "dotenv";
config({ path: ".env.supabase" });
config({ path: ".env.local" });

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const OUT = join(process.cwd(), "..", "[C] Placement Papers", "objectives");

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

  mkdirSync(OUT, { recursive: true });

  for (const s of subjects) {
    const rows = [];
    for (const u of s.units) {
      for (const t of u.topics) {
        for (const st of t.subtopics) {
          for (const o of st.learningObjectives) {
            rows.push({
              id: o.id,
              text: o.text,
              rag: o.ragStatus,
              un: u.number,
              tn: t.number,
              tt: t.title,
              sid: st.id,
              stt: st.title,
            });
          }
        }
      }
    }
    const file = join(OUT, `${s.shortCode.toLowerCase()}-objectives.json`);
    writeFileSync(file, JSON.stringify(rows, null, 1), "utf-8");
    console.log(`${s.shortCode.padEnd(4)} ${String(rows.length).padStart(3)} objectives -> ${file}`);
  }
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
