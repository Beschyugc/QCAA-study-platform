import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GenerateClient } from "./generate-client";

export default async function GenerateCardsPage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const user = await requireUser();

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: shortCode.toUpperCase() },
    include: {
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/subjects/${subject.shortCode}/cards`} className="text-sm text-muted-foreground">
        &larr; Cards
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">Generate cards — {subject.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Paste or upload notes, get a draft batch of cards, review each one before anything saves.
      </p>
      <GenerateClient shortCode={subject.shortCode} subjectId={subject.id} topics={topics} />
    </div>
  );
}
