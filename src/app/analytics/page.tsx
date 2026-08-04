import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { localDateKey, addDays, startOfLocalDay } from "@/lib/date";
import { AnalyticsCharts } from "./charts";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const since = addDays(startOfLocalDay(new Date()), -29);

  const [sessions, subjects, reviews] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId: user.id, startedAt: { gte: since } },
      select: { startedAt: true, focusMinutes: true },
    }),
    prisma.subject.findMany({
      where: { userId: user.id },
      include: {
        units: {
          include: {
            topics: { include: { subtopics: { include: { learningObjectives: true } } } },
          },
        },
      },
    }),
    prisma.review.findMany({
      where: { userId: user.id },
      select: { quality: true, reviewedAt: true },
      orderBy: { reviewedAt: "desc" },
      take: 500,
    }),
  ]);

  // Study time trend, last 30 days.
  const minutesByDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    minutesByDay.set(localDateKey(addDays(since, i)), 0);
  }
  for (const s of sessions) {
    const key = localDateKey(s.startedAt);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + s.focusMinutes);
  }
  const trend = [...minutesByDay.entries()].map(([date, minutes]) => ({
    date: date.slice(5), // MM-DD
    minutes: Math.round(minutes),
  }));

  // RAG distribution per subject.
  const ragDistribution = subjects.map((s) => {
    const objectives = s.units.flatMap((u) =>
      u.topics.flatMap((t) => t.subtopics.flatMap((st) => st.learningObjectives)),
    );
    const counts = { red: 0, amber: 0, green: 0, unrated: 0 };
    for (const o of objectives) counts[o.ragStatus as keyof typeof counts]++;
    return { subject: s.shortCode, ...counts };
  });

  // Card retention: overall + rolling.
  const overallRetention =
    reviews.length > 0
      ? Math.round((reviews.filter((r) => r.quality >= 3).length / reviews.length) * 100)
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-muted-foreground">
        &larr; Dashboard
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <a
          href="/analytics/export"
          className="rounded-md border border-input px-3 py-2 text-sm"
        >
          Export CSV
        </a>
      </div>

      <AnalyticsCharts
        trend={trend}
        ragDistribution={ragDistribution}
        overallRetention={overallRetention}
        totalReviews={reviews.length}
      />
    </div>
  );
}
