import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SUBJECTS } from "../src/config/subjects";

// LOCAL_USER_ID inlined rather than imported from src/lib/auth — that
// module pulls in next/headers, which only resolves inside the Next.js
// runtime and breaks a plain tsx script. Same constant either way.
const LOCAL_USER_ID = "local";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  for (const subject of SUBJECTS) {
    await prisma.subject.upsert({
      where: { userId_shortCode: { userId: LOCAL_USER_ID, shortCode: subject.shortCode } },
      create: { ...subject, userId: LOCAL_USER_ID },
      update: { ...subject },
    });
  }

  console.log(`Seeded ${SUBJECTS.length} subjects for ${LOCAL_USER_ID}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
