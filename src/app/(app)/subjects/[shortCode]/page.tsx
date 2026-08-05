import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lineFor } from "@/config/tokens";
import { TopicList, type TopicRow } from "@/components/subject/topic-list";

export const dynamic = "force-dynamic";

/**
 * Subject overview: every topic in unlock order, with its red/amber/green
 * control and what's left to do on it.
 *
 * This replaces the old curriculum-tree dump. The tree, heatmap and
 * progression map still exist on their own routes (Syllabus tab) — this page
 * answers the narrower question "what do I do in this subject next".
 */
export default async function SubjectOverview({
  params,
}: PageProps<"/subjects/[shortCode]">) {
  const { shortCode } = await params;
  const user = await requireUser();
  const code = shortCode.toUpperCase();
  if (!lineFor(code)) notFound();

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: code },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          topics: {
            orderBy: { order: "asc" },
            include: {
              subtopics: {
                orderBy: { order: "asc" },
                include: {
                  learningObjectives: { select: { ragStatus: true } },
                  cards: { select: { id: true, isSuspended: true, scheduling: { select: { dueDate: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!subject) notFound();

  const allTopicIds = subject.units.flatMap((u) => u.topics.map((t) => t.id));

  // Card totals and due counts per topic, in two grouped queries rather than
  // a pair per topic.
  const [cardRows, dueRows] = await Promise.all([
    allTopicIds.length === 0
      ? []
      : prisma.card.groupBy({
          by: ["topicId"],
          where: { userId: user.id, topicId: { in: allTopicIds }, isSuspended: false },
          _count: true,
        }),
    allTopicIds.length === 0
      ? []
      : prisma.card.groupBy({
          by: ["topicId"],
          where: {
            userId: user.id,
            topicId: { in: allTopicIds },
            isSuspended: false,
            // Locked topics have cards, but none of them are due — they
            // aren't yours yet. Counting them would show "22 due" next to a
            // topic you can't open, which is just a lie with a number on it.
            topic: { unlockState: { in: ["active", "mastered"] } },
            scheduling: { dueDate: { lte: new Date() } },
          },
          _count: true,
        }),
  ]);
  const cardsByTopic = new Map(cardRows.map((r) => [r.topicId, r._count]));
  const dueByTopic = new Map(dueRows.map((r) => [r.topicId, r._count]));

  const topics: TopicRow[] = subject.units.flatMap((unit) =>
    unit.topics.map((topic, index) => {
      const objectives = topic.subtopics.flatMap((s) => s.learningObjectives);
      return {
        id: topic.id,
        unitNumber: unit.number,
        unitTitle: unit.title,
        // Position within the unit, so numbering reads T1, T2, T3 even where
        // the syllabus numbered things oddly.
        number: index + 1,
        title: topic.title,
        state: topic.unlockState,
        needsReview: topic.needsReview,
        cardCount: cardsByTopic.get(topic.id) ?? 0,
        cardsDue: dueByTopic.get(topic.id) ?? 0,
        objectives: objectives.length,
        red: objectives.filter((o) => o.ragStatus === "red").length,
        amber: objectives.filter((o) => o.ragStatus === "amber").length,
        green: objectives.filter((o) => o.ragStatus === "green").length,
        unrated: objectives.filter((o) => o.ragStatus === "unrated").length,
        subtopics: topic.subtopics.map((subtopic) => {
          const live = subtopic.cards.filter((c) => !c.isSuspended);
          return {
            id: subtopic.id,
            title: subtopic.title,
            objectives: subtopic.learningObjectives.length,
            cards: live.length,
            // Locked topics show no due count anywhere, so subtopics of one
            // don't either.
            cardsDue:
              topic.unlockState === "locked"
                ? 0
                : live.filter((c) => c.scheduling && c.scheduling.dueDate <= new Date()).length,
            red: subtopic.learningObjectives.filter((o) => o.ragStatus === "red").length,
            amber: subtopic.learningObjectives.filter((o) => o.ragStatus === "amber").length,
            green: subtopic.learningObjectives.filter((o) => o.ragStatus === "green").length,
          };
        }),
      };
    }),
  );

  const totalCards = topics.reduce((sum, t) => sum + t.cardCount, 0);
  const unrated = topics.reduce((sum, t) => sum + t.unrated, 0);
  const totalObjectives = topics.reduce((sum, t) => sum + t.objectives, 0);

  return (
    <div className="flex flex-col gap-5">
      {totalCards === 0 && (
        <Callout
          headline="No flashcards for this subject yet"
          body="The syllabus is imported, so there's real content to build from — cards just haven't been generated."
          href={`/subjects/${code}/cards/generate`}
          cta="Generate cards →"
        />
      )}

      {unrated === totalObjectives && totalObjectives > 0 && (
        <Callout
          headline="Nothing rated yet"
          body="Mark each topic red, amber or green and the planner starts putting your time where it's weakest. Red gets the most, green just stays warm."
          href={`/subjects/${code}/rate`}
          cta="Rate the syllabus →"
        />
      )}

      <TopicList shortCode={code} topics={topics} />

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[color:var(--hairline)] pt-4 text-[0.64rem] text-[color:var(--text-muted)]">
        {[
          ["past-papers", "Past papers"],
          ["teach-back", "Teach it back"],
          ["formulas", "Formulas"],
          ["assumed-knowledge", "Assumed knowledge"],
          ["cards", "Card browser"],
          ["leeches", "Leeches"],
        ].map(([slug, label]) => (
          <Link
            key={slug}
            href={`/subjects/${code}/${slug}`}
            className="underline underline-offset-4 hover:text-[color:var(--text)]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Callout({
  headline,
  body,
  href,
  cta,
}: {
  headline: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[color:var(--text)]">{headline}</p>
        <p className="mt-0.5 text-[0.64rem] text-[color:var(--text-muted)]">{body}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-lg px-3.5 py-2 text-[0.64rem] font-semibold"
        style={{ background: "var(--line)", color: "#0f1420" }}
      >
        {cta}
      </Link>
    </div>
  );
}
