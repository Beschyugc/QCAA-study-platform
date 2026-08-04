import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudyStats } from "./actions";
import { TimerClient } from "./timer-client";

export default async function TimerPage() {
  const user = await requireUser();
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
      <TimerClient subjects={subjectOptions} initialStats={stats} />
    </div>
  );
}
