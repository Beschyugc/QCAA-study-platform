import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setCardSuspended } from "../cards/actions";

export default async function LeechesPage({
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

  const leeches = await prisma.card.findMany({
    where: { userId: user.id, subjectId: subject.id, scheduling: { state: "leech" } },
    include: { scheduling: true, topic: { select: { number: true, title: true } } },
    orderBy: { scheduling: { lapses: "desc" } },
  });

  async function unsuspend(formData: FormData) {
    "use server";
    await setCardSuspended(shortCode, String(formData.get("cardId")), false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/subjects/${subject.shortCode}/cards`}
        className="text-sm text-muted-foreground"
      >
        &larr; Cards
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">
        Leeches — {subject.name}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Cards you've failed 8+ times. They're suspended (won't show in
        Review) until you rewrite them, break them into smaller cards, or
        decide they're fine as-is and unsuspend them.
      </p>

      {leeches.length === 0 ? (
        <p className="text-sm text-muted-foreground">None — nice.</p>
      ) : (
        <ul className="space-y-2">
          {leeches.map((card) => (
            <li key={card.id} className="rounded-md border border-border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-destructive">
                  {card.scheduling?.lapses} lapses
                </span>
                <span>
                  Topic {card.topic.number}: {card.topic.title}
                </span>
              </div>
              <p className="text-sm">{card.front}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <Link
                  href={`/subjects/${subject.shortCode}/cards`}
                  className="text-muted-foreground underline"
                >
                  Edit
                </Link>
                <form action={unsuspend}>
                  <input type="hidden" name="cardId" value={card.id} />
                  <button type="submit" className="text-muted-foreground underline">
                    Unsuspend
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
