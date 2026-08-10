import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NEW_CARDS_PER_DAY, REVIEWS_PER_DAY } from "@/config/srs";
import { dailyCardTarget } from "@/config/daily";
import { Reviewer } from "./reviewer";

export const dynamic = "force-dynamic";

/** QCAA's degree-of-difficulty bands, in exam order. */
const BANDS = ["simple_familiar", "complex_familiar", "complex_unfamiliar"] as const;

/**
 * The reviewer, optionally scoped to one topic or one subtopic.
 *
 * `?topicId=` and `?subtopicId=` are honoured — they were being linked to from
 * the subject overview and silently ignored here, so "drill this topic" quietly
 * reviewed the whole subject instead.
 *
 * Scoping only ever NARROWS the queue. It can't reach a locked topic's cards,
 * because that filter is applied regardless.
 */
export default async function ReviewerPage({
  params,
  searchParams,
}: PageProps<"/subjects/[shortCode]/reviewer">) {
  const { shortCode } = await params;
  const query = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const topicId = one(query.topicId);
  const subtopicId = one(query.subtopicId);

  // `?band=` drills one QCAA degree-of-difficulty band. Narrows like the topic
  // scope does — it can never widen the queue or reach a locked topic. An
  // unrecognised value 404s rather than being ignored, so a typo can't silently
  // review the whole subject while the header claims otherwise.
  const bandParam = one(query.band);
  const band = BANDS.find((b) => b === bandParam) ?? null;
  if (bandParam && !band) notFound();

  const user = await requireUser();

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: shortCode.toUpperCase() },
  });
  if (!subject) notFound();

  // Resolve the scope up front so a bad or foreign id 404s rather than
  // silently falling back to the whole subject.
  const scope = subtopicId
    ? await prisma.subtopic.findFirst({
        where: { id: subtopicId, userId: user.id, topic: { unit: { subjectId: subject.id } } },
        select: { id: true, title: true, topic: { select: { id: true, title: true, unlockState: true } } },
      })
    : null;
  if (subtopicId && !scope) notFound();

  const topic = topicId
    ? await prisma.topic.findFirst({
        where: { id: topicId, userId: user.id, unit: { subjectId: subject.id } },
        select: { id: true, title: true, unlockState: true },
      })
    : (scope?.topic ?? null);
  if (topicId && !topic) notFound();

  // Refuse a locked topic outright rather than returning an empty queue that
  // looks like "you're all caught up".
  if (topic && topic.unlockState === "locked") {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <h1 className="font-display text-base text-[color:var(--text)]">
          {topic.title} is still locked
        </h1>
        <p className="mt-2 text-xs text-[color:var(--text-muted)]">
          Master the topic before it and this one&apos;s cards open up.
        </p>
        <Link
          href={`/subjects/${subject.shortCode}`}
          className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: "var(--line)", color: "#0f1420" }}
        >
          Back to {subject.shortCode}
        </Link>
      </div>
    );
  }

  const now = new Date();
  // While a topic is active, the reviewer only draws from that topic's cards
  // plus any mastered topic's cards. Locked-topic cards never appear.
  const dueCards = await prisma.card.findMany({
    where: {
      userId: user.id,
      subjectId: subject.id,
      isSuspended: false,
      topic: { unlockState: { in: ["active", "mastered"] } },
      ...(topic ? { topicId: topic.id } : {}),
      ...(scope ? { subtopicId: scope.id } : {}),
      ...(band ? { complexity: band } : {}),
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
      subtopic: {
        ...(scope ? { id: scope.id } : {}),
        topic: {
          unit: { subjectId: subject.id },
          unlockState: { in: ["active", "mastered"] },
          ...(topic ? { id: topic.id } : {}),
        },
      },
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
  // there should always be work for every subject.
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

  const scopeLabel = scope?.title ?? topic?.title ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/subjects/${subject.shortCode}`}
        className="text-[0.64rem] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
      >
        &larr; All topics
      </Link>
      <h1 className="mt-1 font-display text-2xl font-medium text-[color:var(--text)]">
        {scopeLabel ?? subject.name}
      </h1>
      {scopeLabel && (
        <p className="mt-1 text-[0.64rem] text-[color:var(--text-faint)]">
          {scope ? `Subtopic of ${scope.topic.title}` : "Whole topic"} ·{" "}
          <Link href={`/subjects/${subject.shortCode}/reviewer`} className="underline">
            review the whole subject instead
          </Link>
        </p>
      )}
      <div className="mt-5">
        <Reviewer shortCode={subject.shortCode} initialItems={items} />
      </div>
    </div>
  );
}
