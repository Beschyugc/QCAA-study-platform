import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RateList } from "./rate-list";

export default async function RatePage({
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
    where: { userId: user.id, subtopic: { topic: { unit: { subjectId: subject.id } } } },
    include: {
      subtopic: { include: { topic: { select: { number: true, title: true } } } },
    },
    orderBy: [{ ragStatus: "asc" }, { createdAt: "asc" }],
  });

  const items = objectives.map((o) => ({
    id: o.id,
    text: o.text,
    ragStatus: o.ragStatus,
    breadcrumb: `Topic ${o.subtopic.topic.number} · ${o.subtopic.title}`,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/subjects/${subject.shortCode}`}
          className="text-sm text-muted-foreground"
        >
          &larr; {subject.name}
        </Link>
        <h1 className="text-2xl font-semibold">Rate mode</h1>
        <p className="text-sm text-muted-foreground">
          ↑/↓ to move, 1 = red, 2 = amber, 3 = green
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No learning objectives yet — add some from the subject page first.
        </p>
      ) : (
        <RateList shortCode={subject.shortCode} initialItems={items} />
      )}
    </div>
  );
}
