"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the magic link should send you back to.
 *
 * The `origin` header is the right answer when present — it makes the link
 * return to whatever host you signed in from, so localhost and production both
 * work with no configuration. But it is not guaranteed: some clients omit it,
 * and a missing origin previously produced
 * `emailRedirectTo: "null/auth/callback"` — a link that cannot possibly work,
 * with no clue why. That matters most on a phone, where there are no dev tools
 * to diagnose it.
 */
async function resolveOrigin(): Promise<string | null> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin && origin !== "null") return origin;

  // Behind a proxy the original host survives here even when origin doesn't.
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  // Last resort on Vercel. The production URL is preferred over VERCEL_URL,
  // which on a preview deployment is a one-off hostname.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return null;
}

export async function sendMagicLink(
  _prevState: { error?: string; sent?: boolean },
  formData: FormData,
): Promise<{ error?: string; sent?: boolean }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const allowedEmail = process.env.APP_ALLOWED_EMAIL?.toLowerCase();

  // "Not configured" and "wrong email" used to produce the same message, so a
  // missing APP_ALLOWED_EMAIL in production looked exactly like a typo.
  if (!allowedEmail) {
    return {
      error:
        "Sign-in isn't configured on this deployment — APP_ALLOWED_EMAIL is missing from its environment variables.",
    };
  }
  if (!email) return { error: "Enter your email address." };
  if (email !== allowedEmail) {
    return { error: "That email isn't allowed to sign in to this app." };
  }

  const origin = await resolveOrigin();
  if (!origin) {
    return {
      error: "Couldn't work out where to send you back to. Try again from the site's normal URL.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };

  return { sent: true };
}
