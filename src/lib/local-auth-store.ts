import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Where the local passphrase lives: a single JSON file outside the SQLite
 * database, gitignored, never synced to anything but this machine (or a
 * Drive folder the student explicitly puts the whole app in). Not a Prisma
 * model — a passphrase for a single-user local app doesn't need a table,
 * a migration, or to live next to the study data it's gating.
 */
const STORE_PATH = join(process.cwd(), "data", "local-auth.json");

type StoredAuth = { salt: string; hash: string };

export function hasPassphrase(): boolean {
  return existsSync(STORE_PATH);
}

export function setPassphrase(passphrase: string): void {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(passphrase, salt, 64).toString("hex");
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify({ salt, hash } satisfies StoredAuth));
}

export function verifyPassphrase(passphrase: string): boolean {
  if (!existsSync(STORE_PATH)) return false;
  const { salt, hash } = JSON.parse(readFileSync(STORE_PATH, "utf-8")) as StoredAuth;
  const candidate = scryptSync(passphrase, salt, 64);
  const stored = Buffer.from(hash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}
