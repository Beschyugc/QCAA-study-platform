import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Single-user local app — every row in the database is scoped by this
// constant rather than a real per-account id. It used to be the Supabase
// auth.users UUID for APP_ALLOWED_EMAIL; there is no such table any more,
// so this is now the one fixed value every model's userId column holds.
export const LOCAL_USER_ID = "local";

// proxy.ts already redirects unauthenticated requests away from protected
// routes, but Next.js Server Functions are not guaranteed to sit behind a
// proxy matcher forever — always re-check here too. This is the actual
// enforcement point, not a formality.
export async function requireUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (!verifySessionToken(token)) {
    redirect("/login");
  }

  return { id: LOCAL_USER_ID, email: "local@studyline.app" };
}
