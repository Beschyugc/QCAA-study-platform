import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssumedKnowledgeManager } from "./manager";

export default async function AssumedKnowledgePage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const user = await requireUser();

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: shortCode.toUpperCase() },
    include: {
      assumedKnowledge: { orderBy: { category: "asc" } },
      units: {
        orderBy: { order: "asc" },
        include: { topics: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!subject) notFound();

  const topics = subject.units.flatMap((u) =>
    u.topics.map((t) => ({ id: t.id, label: `Unit ${u.number} · T${t.number} ${t.title}` })),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/subjects/${subject.shortCode}`}
        className="text-sm text-muted-foreground"
      >
        &larr; {subject.name}
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">
        Assumed knowledge — {subject.name}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        The stuff that's not on the formula sheet but is assumed. Exact trig
        values, log laws, standard derivatives — whatever your subject
        expects you to just know.
      </p>
      <AssumedKnowledgeManager
        shortCode={subject.shortCode}
        subjectId={subject.id}
        topics={topics}
        entries={subject.assumedKnowledge}
      />
    </div>
  );
}
