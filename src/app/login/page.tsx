"use client";

import { useActionState } from "react";
import { sendMagicLink } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(sendMagicLink, {});

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">QCAA Study Platform</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with a magic link
          </p>
        </div>

        {state.sent ? (
          <p className="text-center text-sm">
            Check your email — click the link to sign in.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
