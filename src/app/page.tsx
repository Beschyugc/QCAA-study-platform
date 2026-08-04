import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signOut } from "./actions";

export default async function Home() {
  const user = await requireUser();
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    orderBy: { priorityWeight: "desc" },
  });

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-1 text-center">
        <h1 className="text-2xl font-semibold">QCAA Study Platform</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.email}
        </p>
      </div>

      <ul className="w-full max-w-md space-y-2">
        {subjects.map((subject) => (
          <li key={subject.id}>
            <Link
              href={`/subjects/${subject.shortCode}`}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted"
            >
              <span className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: subject.colour }}
                />
                {subject.name}
              </span>
              <span className="text-sm text-muted-foreground">
                weight {subject.priorityWeight.toFixed(2)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex gap-4 text-sm">
        <Link href="/plan" className="underline">
          Today's Plan
        </Link>
        <Link href="/timer" className="underline">
          Study Timer
        </Link>
        <Link href="/review" className="underline">
          Review — reds, stale greens, unrated
        </Link>
      </div>

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
