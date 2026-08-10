"use client";

import { useActionState } from "react";
import { createPassphrase, login } from "./actions";

export function LoginForm({ setup }: { setup: boolean }) {
  const [state, formAction, pending] = useActionState(
    setup ? createPassphrase : login,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="password"
        name="passphrase"
        required
        minLength={6}
        autoFocus
        placeholder="Passphrase"
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {setup && (
        <input
          type="password"
          name="confirm"
          required
          minLength={6}
          placeholder="Confirm passphrase"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "…" : setup ? "Create account" : "Sign in"}
      </button>
      {setup && (
        <p className="text-center text-xs text-muted-foreground">
          This is stored only on this machine, in{" "}
          <code>app/data/local-auth.json</code>. Nothing is sent anywhere.
        </p>
      )}
    </form>
  );
}
