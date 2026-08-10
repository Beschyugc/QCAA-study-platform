import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The whole "auth" system for a private, single-user, localhost-only app:
 * a signed cookie, no database round trip, no external identity provider.
 * Replaces the old Supabase magic-link session entirely.
 */

export const COOKIE_NAME = "studyline_session";

// 90 days: this gates one person's own machine, not a bank. Optimise for
// "don't make me log in every week", not session hygiene that matters when
// the thing behind it is reachable from the internet.
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function secret(): string {
  const s = process.env.APP_SESSION_SECRET;
  if (!s) {
    throw new Error(
      "APP_SESSION_SECRET is not set — see .env.local. Generate one with: " +
        `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

/** A token is just `<issuedAtMs>.<hmac>` — no payload worth encrypting, only
 * worth authenticating (nobody else can forge a valid one) and expiring. */
export function issueSessionToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [issuedAt, providedSig] = parts;
  if (!issuedAt || !providedSig) return false;

  const expectedSig = sign(issuedAt);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const age = Date.now() - Number(issuedAt);
  return Number.isFinite(age) && age >= 0 && age < MAX_AGE_SECONDS * 1000;
}
