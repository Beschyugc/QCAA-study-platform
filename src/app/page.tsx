import { requireUser } from "@/lib/auth";
import { signOut } from "./actions";

export default async function Home() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-2xl font-semibold">QCAA Study Platform</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as {user.email}
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-input px-3 py-2 text-sm"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
