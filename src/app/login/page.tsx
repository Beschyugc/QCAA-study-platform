import { hasPassphrase } from "@/lib/local-auth-store";
import { LoginForm } from "./login-form";

/* Whether a passphrase exists is a fact about the database right now, not
 * about build time. Prerendered, this page froze the answer from whenever
 * the deploy ran: after a passphrase reset it still offered the sign-in
 * form, with nothing to sign in against, which locks the account out
 * entirely. It was static back when the answer came off the local disk of
 * the one machine that built it. It cannot be now. */
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const setup = !(await hasPassphrase());

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">STUDYLINE</h1>
          <p className="text-sm text-muted-foreground">
            {setup
              ? "First run — create your local passphrase"
              : "Enter your passphrase"}
          </p>
        </div>
        <LoginForm setup={setup} />
      </div>
    </div>
  );
}
