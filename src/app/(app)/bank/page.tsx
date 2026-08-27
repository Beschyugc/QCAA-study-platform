import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BankClient, type BankQuestionView } from "./bank-client";

/**
 * The question bank.
 *
 * Two query params, both optional:
 *   ?ids=a,b,c    the exact questions a Today task points at
 *   ?subject=MM   everything for one subject
 * With neither, it shows the questions with no attempt logged yet — which is
 * the honest default for a log whose purpose is to accumulate evidence.
 */
export default async function BankPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; subject?: string; all?: string }>;
}) {
  const user = await requireUser();
  const { ids, subject, all } = await searchParams;

  const idList = ids?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  const questions = await prisma.bankQuestion.findMany({
    where: {
      userId: user.id,
      isActive: true,
      ...(idList.length > 0 ? { id: { in: idList } } : {}),
      ...(subject ? { subject: { shortCode: subject.toUpperCase() } } : {}),
    },
    orderBy: [{ topicTag: "asc" }, { difficulty: "asc" }, { createdAt: "asc" }],
    include: {
      subject: { select: { shortCode: true, name: true } },
      responses: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    take: idList.length > 0 ? 200 : 80,
  });

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { shortCode: true, name: true },
  });

  const showAll = all === "1" || idList.length > 0;
  const view: BankQuestionView[] = questions
    .filter((q) => (showAll ? true : q.responses.length === 0))
    .map((q) => ({
      id: q.id,
      source: q.source,
      sourceKind: q.sourceKind,
      topicTag: q.topicTag,
      prompt: q.prompt,
      working: q.working,
      answer: q.answer,
      marks: q.marks,
      difficulty: q.difficulty,
      subjectCode: q.subject.shortCode,
      responses: q.responses.map((r) => ({
        id: r.id,
        response: r.response,
        revealedWorking: r.revealedWorking,
        verdict: r.verdict,
        feedback: r.feedback,
        createdAt: r.createdAt.toISOString().slice(0, 16).replace("T", " "),
      })),
    }));

  const unmarked = await prisma.bankResponse.count({
    where: { userId: user.id, verdict: null },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <BankClient
        questions={view}
        subjects={subjects}
        activeSubject={subject?.toUpperCase() ?? null}
        showingAll={showAll}
        unmarkedCount={unmarked}
        pinnedIds={idList}
      />
    </div>
  );
}
