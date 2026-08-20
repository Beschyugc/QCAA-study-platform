"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasPassphrase, setPassphrase, verifyPassphrase } from "@/lib/local-auth-store";
import { COOKIE_NAME, MAX_AGE_SECONDS, issueSessionToken } from "@/lib/session";

async function startSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, issueSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function createPassphrase(
  _prevState: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  // Someone else may have raced us to /login and already set it up (two
  // tabs open on first run) — re-check rather than silently overwrite
  // whatever passphrase they just chose.
  if (await hasPassphrase()) {
    return { error: "A passphrase already exists — sign in instead." };
  }

  const passphrase = String(formData.get("passphrase") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (passphrase.length < 6) {
    return { error: "Passphrase must be at least 6 characters." };
  }
  if (passphrase !== confirm) {
    return { error: "Passphrases don't match." };
  }

  await setPassphrase(passphrase);
  await startSession();
  redirect("/");
}

export async function login(
  _prevState: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const passphrase = String(formData.get("passphrase") ?? "");

  if (!(await verifyPassphrase(passphrase))) {
    return { error: "Wrong passphrase." };
  }

  await startSession();
  redirect("/");
}
