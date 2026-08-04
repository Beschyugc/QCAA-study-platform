import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NEW_CARDS_PER_DAY, REVIEWS_PER_DAY } from "@/config/srs";
import { dailyCardTarget } from "@/config/daily";
import { Reviewer } from "./reviewer";

export default async function ReviewerPage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const user = await requireUser();

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: shortCode.toUpperCase() },
  });
  if (!subject) notFound();

  const now = new Date();
  // §6: while a topic is active, the reviewer only draws from that topic's
  // cards plus any mastered topic's cards. Locked-topic cards never appear.
  const dueCards = await prisma.card.findMany({
    where: {
      userId: user.id,
      subjectId: subject.id,
      isSuspended: false,
      topic: { unlockState: { in: ["active", "mastered"] } },
      scheduling: { dueDate: { lte: now } },
    },
    include: { scheduling: true },
    orderBy: { scheduling: { dueDate: "asc" } },
  });

  // The daily set: 10-20 cards, scaled by how this subject is rated. A
  // red-heavy subject drills more; a green one just stays warm.
  const ragRows = await prisma.learningObjective.groupBy({
    by: ["ragStatus"],
    where: {
      userId: user.id,
      subtopic: { topic: { unit: { subjectId: subject.id }, unlockState: { in: ["active", "mastered"] } } },
    },
    _count: true,
  });
  const counts = { red: 0, amber: 0, green: 0, unrated: 0 };
  for (const row of ragRows) counts[row.ragStatus] = row._count;
  const target = dailyCardTarget(counts);

  const reviewCards = dueCards
    .filter((c) => c.scheduling && c.scheduling.state !== "new")
    .slice(0, REVIEWS_PER_DAY);

  // New cards top the set up to the target. Without this, a subject whose
  // reviews are all scheduled for next week would show nothing to do — and
  // the brief is explicit that there is always work for every subject.
  const newCards = dueCards
    .filter((c) => c.scheduling?.state === "new")
    .slice(0, Math.min(NEW_CARDS_PER_DAY, Math.max(0, target - reviewCards.length)));

  const queue = [...reviewCards, ...newCards];

  const items = queue.map((c) => ({
    id: c.id,
    front: c.front,
    back: c.back,
    cardType: c.cardType,
    extra: c.extra,
    scheduling: {
      dueDate: c.scheduling!.dueDate.toISOString(),
      intervalDays: c.scheduling!.intervalDays,
      easeFactor: c.scheduling!.easeFactor,
      repetitions: c.scheduling!.repetitions,
      lapses: c.scheduling!.lapses,
      learningStep: c.scheduling!.learningStep,
      state: c.scheduling!.state,
    },
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/subjects/${subject.shortCode}/cards`}
        className="text-sm text-muted-foreground"
      >
        &larr; Cards
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">
        Reviewing — {subject.name}
      </h1>
      <Reviewer shortCode={subject.shortCode} initialItems={items} />
    </div>
  );
}
