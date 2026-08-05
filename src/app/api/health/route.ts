import { NextResponse } from "next/server";
import { headers } from "next/headers";

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
  // The URL a magic link would come back to, computed the same way the login
  // action computes it. A wrong value here — localhost, or a preview
  // hostname — is the classic "signs in on my laptop, fails on my phone"
  // failure, and it is otherwise invisible until someone tries it on a
  // different device. Not a secret: it's the site's own public address.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const magicLinkReturnsTo = host
    ? `${proto}://${host}/auth/callback`
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/auth/callback`
      : null;

  return NextResponse.json({
    magicLinkReturnsTo,
    ok: true,
    // Injected by Vercel at build time; undefined in local dev.
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    env: process.env.VERCEL_ENV ?? "development",
    config: {
      database: Boolean(process.env.DATABASE_URL),
      anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      anthropicModel: process.env.ANTHROPIC_MODEL ?? null,
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      // Without this nobody can sign in at all — the single most likely
      // reason "it works on my laptop but not my phone".
      allowedEmail: Boolean(process.env.APP_ALLOWED_EMAIL),
    },
    time: new Date().toISOString(),
  });
}
