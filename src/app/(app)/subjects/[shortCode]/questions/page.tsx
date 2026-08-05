import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lineFor } from "@/config/tokens";
import { today, type DailyQuestion, type DailyResponse } from "@/lib/daily-questions";
import { QuestionsClient } from "./questions-client";

export const dynamic = "force-dynamic";

export default async function QuestionsPage({
  params,
}: PageProps<"/subjects/[shortCode]/questions">) {
  const { shortCode } = await params;
  const user = await requireUser();
  const code = shortCode.toUpperCase();
  if (!lineFor(code)) notFound();

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: code },
    select: { id: true },
  });
  if (!subject) notFound();

  // Today's set if it already exists — nothing is generated just by visiting.
  const set = await prisma.dailyQuestionSet.findUnique({
    where: { userId_subjectId_date: { userId: user.id, subjectId: subject.id, date: today() } },
  });

  return (
    <QuestionsClient
      shortCode={code}
      initialSetId={set?.id ?? null}
      initialQuestions={(set?.questions as unknown as DailyQuestion[]) ?? []}
      initialResponses={(set?.responses as unknown as DailyResponse[]) ?? []}
      initialAwarded={set?.scoreAwarded ?? null}
      initialAvailable={set?.scoreAvailable ?? null}
    />
  );
}
