import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeachBackClient } from "./teach-back-client";

export default async function TeachBackPage({
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

  const objectives = await prisma.learningObjective.findMany({
    where: {
      userId: user.id,
      subtopic: { topic: { unit: { subjectId: subject.id }, unlockState: { in: ["active", "mastered"] } } },
    },
    include: { subtopic: { include: { topic: { select: { number: true, title: true } } } } },
    orderBy: [{ ragStatus: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/subjects/${subject.shortCode}`} className="text-sm text-muted-foreground">
        &larr; {subject.name}
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">Teach it back — {subject.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Explain the concept in your own words. If you're wrong or missing
        something, I'll ask questions instead of just telling you — you
        should end up finding the gap yourself.
      </p>
      <TeachBackClient
        shortCode={subject.shortCode}
        objectives={objectives.map((o) => ({
          id: o.id,
          text: o.text,
          ragStatus: o.ragStatus,
          breadcrumb: `Topic ${o.subtopic.topic.number} · ${o.subtopic.title}`,
        }))}
      />
    </div>
  );
}
