import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CardsManager } from "./cards-manager";

export default async function CardsPage({
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
      cards: {
        orderBy: { createdAt: "desc" },
        include: { scheduling: true },
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cards — {subject.name}</h1>
        <Link
          href={`/subjects/${subject.shortCode}/reviewer`}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Review
        </Link>
      </div>

      <CardsManager
        shortCode={subject.shortCode}
        subjectId={subject.id}
        topics={topics}
        cards={subject.cards.map((c) => ({
          id: c.id,
          front: c.front,
          back: c.back,
          cardType: c.cardType,
          isSuspended: c.isSuspended,
          state: c.scheduling?.state ?? "new",
        }))}
      />
    </div>
  );
}
