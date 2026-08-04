import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NEW_CARDS_PER_DAY, REVIEWS_PER_DAY } from "@/config/srs";
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

  const newCards = dueCards
    .filter((c) => c.scheduling?.state === "new")
    .slice(0, NEW_CARDS_PER_DAY);
  const reviewCards = dueCards
    .filter((c) => c.scheduling && c.scheduling.state !== "new")
    .slice(0, REVIEWS_PER_DAY);
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
