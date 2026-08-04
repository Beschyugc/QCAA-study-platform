import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudyStats } from "./timer/actions";
import { getTopicRecommendations } from "@/lib/recommendation-data";
import { signOut } from "./actions";

export default async function Home() {
  const user = await requireUser();

  const [subjects, stats, recommendations, dueCardCounts] = await Promise.all([
    prisma.subject.findMany({ where: { userId: user.id }, orderBy: { priorityWeight: "desc" } }),
    getStudyStats(),
    getTopicRecommendations(user.id),
    prisma.card.groupBy({
      by: ["subjectId"],
      where: {
        userId: user.id,
        isSuspended: false,
        topic: { unlockState: { in: ["active", "mastered"] } },
        scheduling: { dueDate: { lte: new Date() } },
      },
      _count: true,
    }),
  ]);

  const dueBySubject = new Map(dueCardCounts.map((d) => [d.subjectId, d._count]));
  const totalDue = dueCardCounts.reduce((sum, d) => sum + d._count, 0);

  return (
    <div className="mx-auto min-h-screen max-w-md space-y-6 bg-background px-4 py-12">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">QCAA Study Platform</h1>
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
      </div>

      <div className="flex justify-around rounded-md border border-border py-3 text-center text-xs text-muted-foreground">
        <div>
          <div className="text-lg font-semibold text-foreground">{totalDue}</div>
          Cards due
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{Math.round(stats.todayMinutes)}m</div>
          Today
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{stats.streak}🔥</div>
          Streak
        </div>
      </div>

      {recommendations.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-medium">Top priorities</h2>
            <Link href="/plan" className="text-xs text-muted-foreground underline">
              Full plan
            </Link>
          </div>
          <ul className="space-y-1">
            {recommendations.slice(0, 3).map((rec) => (
              <li
                key={rec.topicId}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: rec.subjectColour }}
                />
                <span className="flex-1">
                  {rec.subjectName} · T{rec.topicNumber} {rec.topicTitle}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-2">
        {subjects.map((subject) => (
          <li key={subject.id}>
            <Link
              href={`/subjects/${subject.shortCode}`}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted"
            >
              <span className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.colour }} />
                {subject.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {dueBySubject.get(subject.id) ?? 0} due
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        <Link href="/plan" className="underline">
          Today's Plan
        </Link>
        <Link href="/timer" className="underline">
          Study Timer
        </Link>
        <Link href="/timetable" className="underline">
          Timetable
        </Link>
        <Link href="/review" className="underline">
          Review
        </Link>
        <Link href="/analytics" className="underline">
          Analytics
        </Link>
        <Link href="/weekly-review" className="underline">
          Weekly Review
        </Link>
      </div>

      <form action={signOut} className="text-center">
        <button type="submit" className="rounded-md border border-input px-3 py-2 text-sm">
          Sign out
        </button>
      </form>
    </div>
  );
}
