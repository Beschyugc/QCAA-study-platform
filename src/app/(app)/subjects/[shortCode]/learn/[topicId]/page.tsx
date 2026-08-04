import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLesson } from "@/lib/lessons";
import { Markdown } from "@/components/markdown";
import { LessonActions } from "./lesson-actions";

export const dynamic = "force-dynamic";

/**
 * The Learn section for one topic: a lesson written from that topic's real
 * QCAA objectives, generated once and cached.
 *
 * Locked topics are refused here, not just hidden. Letting you read ahead
 * through a URL would quietly undo the unlocking the whole app is built
 * around.
 */
export default async function LearnTopic({
  params,
}: PageProps<"/subjects/[shortCode]/learn/[topicId]">) {
  const { shortCode, topicId } = await params;
  const user = await requireUser();
  const code = shortCode.toUpperCase();

  const topic = await prisma.topic.findFirst({
    where: { id: topicId, userId: user.id },
    include: {
      unit: { include: { subject: true } },
      subtopics: {
        orderBy: { order: "asc" },
        include: { learningObjectives: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!topic || topic.unit.subject.shortCode !== code) notFound();

  if (topic.unlockState === "locked") {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <Lock className="mx-auto h-6 w-6 text-[color:var(--state-locked)]" aria-hidden />
        <h1 className="mt-3 font-display text-base text-[color:var(--text)]">
          {topic.title} is still locked
        </h1>
        <p className="mt-2 text-xs text-[color:var(--text-muted)]">
          Master the topic before it and this one opens — lessons, cards and questions together.
        </p>
        <Link
          href={`/subjects/${code}`}
          className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: "var(--line)", color: "#0f1420" }}
        >
          Back to {code}
        </Link>
      </div>
    );
  }

  const lesson = await getLesson(user.id, topicId);
  const objectives = topic.subtopics.flatMap((s) => s.learningObjectives);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/subjects/${code}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[0.64rem] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        All topics
      </Link>

      <p className="tabular text-[0.64rem] text-[color:var(--text-faint)]">
        Unit {topic.unit.number} — {topic.unit.title}
      </p>
      <h1 className="mt-1 font-display text-2xl font-medium text-[color:var(--text)]">
        {topic.title}
      </h1>
      <p className="mt-1 text-[0.64rem] text-[color:var(--text-muted)]">
        {objectives.length} syllabus objectives
      </p>

      <div className="mt-6">
        {lesson ? (
          <>
            {lesson.stale && (
              <p className="mb-4 rounded-lg border border-[color:var(--streak-ember)] px-3 py-2 text-[0.64rem] text-[color:var(--streak-ember)]">
                The syllabus for this topic changed after this lesson was written — regenerate it to
                match.
              </p>
            )}
            <article className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-5 sm:p-7">
              <Markdown>{lesson.markdown}</Markdown>
            </article>
          </>
        ) : (
          <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-7 text-center">
            <p className="font-display text-base text-[color:var(--text)]">No lesson yet</p>
            <p className="mx-auto mt-2 max-w-md text-xs text-[color:var(--text-muted)]">
              Claude will write one from the {objectives.length} QCAA objectives for this topic —
              what it is, what you have to be able to do, where marks get lost, and questions to
              check yourself. It takes about a minute, and it&apos;s saved afterwards.
            </p>
          </div>
        )}

        <LessonActions shortCode={code} topicId={topicId} hasLesson={lesson !== null} />
      </div>

      <details className="mt-6 rounded-xl border border-[color:var(--hairline)] px-4 py-3">
        <summary className="cursor-pointer text-xs font-semibold text-[color:var(--text-muted)]">
          The raw syllabus objectives ({objectives.length})
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {topic.subtopics.map((subtopic) => (
            <li key={subtopic.id}>
              <p className="text-[0.64rem] font-semibold text-[color:var(--text-faint)]">
                {subtopic.title}
              </p>
              <ul className="ml-4 mt-1 list-disc">
                {subtopic.learningObjectives.map((o) => (
                  <li key={o.id} className="text-[0.64rem] text-[color:var(--text-muted)]">
                    {o.text}
                    {o.qcaaReference && (
                      <span className="tabular ml-1.5 text-[color:var(--text-faint)]">
                        {o.qcaaReference}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
