import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Where the app passphrase lives: one row in the database.
 *
 * It used to be data/local-auth.json, which was right while this was a
 * localhost-only app on one machine. It stopped being right the moment the
 * app went back to being hosted — the file is gitignored, so it is absent in
 * production, and Vercel rebuilds its filesystem on every deploy, so even
 * writing one there would vanish. Putting it in Postgres means the same
 * passphrase works on the desktop, the school computer, and a phone,
 * because all three are talking to the same database.
 *
 * Still scrypt with a per-passphrase salt, and still compared with
 * timingSafeEqual. Only the storage moved.
 */
const SINGLETON_ID = "singleton";

export async function hasPassphrase(): Promise<boolean> {
  const row = await prisma.appAuth.findUnique({
    where: { id: SINGLETON_ID },
    select: { id: true },
  });
  return row !== null;
}

export async function setPassphrase(passphrase: string): Promise<void> {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(passphrase, salt, 64).toString("hex");
  await prisma.appAuth.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, salt, hash },
    update: { salt, hash },
  });
}

export async function verifyPassphrase(passphrase: string): Promise<boolean> {
  const row = await prisma.appAuth.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return false;
  const candidate = scryptSync(passphrase, row.salt, 64);
  const stored = Buffer.from(row.hash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}
