import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Proxy already redirects unauthenticated/unauthorized requests away from
// protected routes (see proxy.ts), but Next.js Server Functions are not
// guaranteed to sit behind a proxy matcher forever — always re-check here
// too. This is the actual enforcement point, not a formality.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowedEmail = process.env.APP_ALLOWED_EMAIL?.toLowerCase();

  if (!user || user.email?.toLowerCase() !== allowedEmail) {
    redirect("/login");
  }

  return user;
}
