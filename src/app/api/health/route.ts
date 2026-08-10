import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { hasPassphrase } from "@/lib/local-auth-store";

// Always live — a cached health check tells you about a state that may no
// longer be current, which is the opposite of the point.
export const dynamic = "force-dynamic";

/**
 * Local-build status: is the database file present, is a passphrase set up,
 * is the AI configured. No deploy identity or magic-link plumbing to report
 * any more — this only ever runs on http://localhost.
 *
 * Deliberately reports only whether keys are PRESENT, never any part of
 * their value.
 */
export async function GET() {
  const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "");
  const dbFileExists = dbPath ? existsSync(join(process.cwd(), dbPath)) : false;

  return NextResponse.json({
    ok: true,
    env: process.env.NODE_ENV,
    config: {
      database: Boolean(process.env.DATABASE_URL),
      databaseFileExists: dbFileExists,
      sessionSecret: Boolean(process.env.APP_SESSION_SECRET),
      passphraseSet: hasPassphrase(),
      anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      anthropicModel: process.env.ANTHROPIC_MODEL ?? null,
      geminiKey: Boolean(process.env.GEMINI_API_KEY),
    },
    time: new Date().toISOString(),
  });
}
