import Link from "next/link";
import { notFound } from "next/navigation";
import { BotMessageSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttemptClient } from "./attempt-client";

export default async function PaperAttemptPage({
  params,
}: {
  params: Promise<{ shortCode: string; paperId: string }>;
}) {
  const { shortCode, paperId } = await params;
  const user = await requireUser();

  const paper = await prisma.pastPaper.findFirst({
    where: { id: paperId, userId: user.id },
    include: {
      attempts: {
        orderBy: { startedAt: "desc" },
        take: 1,
        include: { responses: { orderBy: { questionNumber: "asc" } } },
      },
    },
  });
  if (!paper) notFound();

  const [topics, previousAttempts] = await Promise.all([
    prisma.topic.findMany({
      where: { userId: user.id, unit: { subjectId: paper.subjectId } },
      orderBy: { number: "asc" },
    }),
    prisma.paperAttempt.findMany({
      where: { userId: user.id, paperId, completedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: { percentage: true, startedAt: true },
    }),
  ]);

  const latestAttempt = paper.attempts[0] ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/subjects/${shortCode}/past-papers`} className="text-sm text-muted-foreground">
        &larr; Past papers
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">
        {paper.year} {paper.paperName}
      </h1>
      <div className="mb-6 flex gap-3 text-xs text-muted-foreground">
        <a href={paper.questionPaperPath} target="_blank" rel="noreferrer" className="underline">
          Question paper
        </a>
        {paper.mcPaperPath && (
          <a href={paper.mcPaperPath} target="_blank" rel="noreferrer" className="underline">
            MC paper
          </a>
        )}
        {paper.markingGuidePath && (
          <a href={paper.markingGuidePath} target="_blank" rel="noreferrer" className="underline">
            Marking guide
          </a>
        )}
      </div>

      {/* The only AI affordance already on this page is "AI suggest" inside
          marking, scoped to one response once you're marking an attempt.
          This is the general "ask about this paper" entry point — it reuses
          the existing subject tutor rather than a second chat surface, just
          pre-pointed at this paper so the student doesn't have to explain
          which one they mean. */}
      <Link
        href={`/subjects/${shortCode}/tutor?paperId=${paper.id}`}
        className="mb-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        <BotMessageSquare className="h-4 w-4" aria-hidden />
        Ask AI about this paper
      </Link>

      <AttemptClient
        shortCode={shortCode}
        paperId={paperId}
        totalMarks={paper.totalMarks}
        hasMarkingGuide={paper.hasMarkingGuide}
        topics={topics.map((t) => ({ id: t.id, label: `T${t.number} ${t.title}` }))}
        attempt={
          latestAttempt
            ? {
                id: latestAttempt.id,
                completedAt: latestAttempt.completedAt?.toISOString() ?? null,
                percentage: latestAttempt.percentage,
                rawScore: latestAttempt.rawScore,
                responses: latestAttempt.responses.map((r) => ({
                  id: r.id,
                  questionNumber: r.questionNumber,
                  marksAvailable: r.marksAvailable,
                  marksAwarded: r.marksAwarded,
                  topicId: r.topicId,
                  myAnswer: r.myAnswer ?? "",
                  errorCategory: r.errorCategory,
                })),
              }
            : null
        }
        previousAttempts={previousAttempts.map((a) => ({
          percentage: a.percentage,
          startedAt: a.startedAt.toISOString(),
        }))}
      />
    </div>
  );
}
