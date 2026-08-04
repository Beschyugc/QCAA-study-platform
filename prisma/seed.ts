import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SUBJECTS } from "../src/config/subjects";

config({ path: ".env.local" });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const allowedEmail = process.env.APP_ALLOWED_EMAIL;
  if (!allowedEmail) throw new Error("APP_ALLOWED_EMAIL is not set");

  const { rows } = await pool.query<{ id: string }>(
    "SELECT id FROM auth.users WHERE email = $1",
    [allowedEmail],
  );
  const userId = rows[0]?.id;
  if (!userId) {
    throw new Error(
      `No auth.users row for ${allowedEmail} yet — sign in at least once before seeding.`,
    );
  }

  for (const subject of SUBJECTS) {
    await prisma.subject.upsert({
      where: { userId_shortCode: { userId, shortCode: subject.shortCode } },
      create: { ...subject, userId },
      update: { ...subject },
    });
  }

  console.log(`Seeded ${SUBJECTS.length} subjects for ${allowedEmail}`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
