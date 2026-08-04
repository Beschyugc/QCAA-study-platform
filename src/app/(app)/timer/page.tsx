import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudyStats } from "./actions";
import { TimerClient } from "./timer-client";

export default async function TimerPage({ searchParams }: PageProps<"/timer">) {
  const user = await requireUser();
  // Deep-link params from the dashboard: /timer?subjectId=..&topicId=..&start=1
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const [subjects, stats] = await Promise.all([
    prisma.subject.findMany({
      where: { userId: user.id },
      orderBy: { priorityWeight: "desc" },
      include: {
        units: {
          include: {
            topics: {
              where: { unlockState: { in: ["active", "mastered"] } },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    }),
    getStudyStats(),
  ]);

  const subjectOptions = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    topics: s.units.flatMap((u) =>
      u.topics.map((t) => ({ id: t.id, label: `T${t.number} ${t.title}` })),
    ),
  }));

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-semibold">Study Timer</h1>
      <TimerClient
        subjects={subjectOptions}
        initialStats={stats}
        initialSubjectId={one(params.subjectId)}
        initialTopicId={one(params.topicId)}
        sessionType={one(params.sessionType) === "in_school" ? "in_school" : "after_school"}
        autoStart={one(params.start) === "1"}
      />
    </div>
  );
}
