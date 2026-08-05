import { NextResponse } from "next/server";

// Always live — a cached health check tells you about a build that may no
// longer be the one serving traffic, which is the opposite of the point.
export const dynamic = "force-dynamic";

/**
 * Which build is actually deployed, and is the AI configured.
 *
 * This exists because "the site returns 200" does not distinguish a successful
 * new deployment from an old one still serving after a failed build — exactly
 * the situation when the Vercel build broke at postinstall. Comparing the sha
 * here against the local HEAD answers it in one request.
 *
 * Deliberately reports only whether keys are PRESENT, never any part of their
 * value, since this endpoint is public.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    // Injected by Vercel at build time; undefined in local dev.
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    env: process.env.VERCEL_ENV ?? "development",
    config: {
      database: Boolean(process.env.DATABASE_URL),
      anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      anthropicModel: process.env.ANTHROPIC_MODEL ?? null,
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    time: new Date().toISOString(),
  });
}
