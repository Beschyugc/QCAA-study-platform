import Link from "next/link";
import { notFound } from "next/navigation";
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
