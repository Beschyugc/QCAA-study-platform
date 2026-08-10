import { hasPassphrase } from "@/lib/local-auth-store";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const setup = !hasPassphrase();

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
