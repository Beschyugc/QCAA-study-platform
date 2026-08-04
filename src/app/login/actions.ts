"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(
  _prevState: { error?: string; sent?: boolean },
  formData: FormData,
): Promise<{ error?: string; sent?: boolean }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const allowedEmail = process.env.APP_ALLOWED_EMAIL?.toLowerCase();

  if (!email || email !== allowedEmail) {
    return { error: "That email isn't allowed to sign in to this app." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  return { sent: true };
}
