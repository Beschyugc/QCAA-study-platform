import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STALE_GREEN_DAYS } from "@/config/rag";
import { ReviewList } from "./review-list";

export default async function ReviewPage() {
  const user = await requireUser();

  const objectives = await prisma.learningObjective.findMany({
    where: { userId: user.id },
    include: {
      subtopic: {
        include: {
          topic: {
            select: {
              number: true,
              title: true,
              unit: {
                select: { subject: { select: { name: true, shortCode: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: [{ ragStatus: "asc" }, { ragUpdatedAt: "asc" }],
  });

  const staleCutoff = Date.now() - STALE_GREEN_DAYS * 24 * 60 * 60 * 1000;
  const items = objectives.map((o) => ({
    id: o.id,
    text: o.text,
    ragStatus: o.ragStatus,
    subjectName: o.subtopic.topic.unit.subject.name,
    shortCode: o.subtopic.topic.unit.subject.shortCode,
    breadcrumb: `${o.subtopic.topic.unit.subject.name} · Topic ${o.subtopic.topic.number} · ${o.subtopic.title}`,
    isStale:
      o.ragStatus === "green" &&
      !!o.ragUpdatedAt &&
      o.ragUpdatedAt.getTime() < staleCutoff,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-muted-foreground">
        &larr; All subjects
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">Review — all subjects</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every red, stale green, and unrated objective across every subject.
        Click through to a subject's Rate mode to actually update a rating.
      </p>
      <ReviewList items={items} />
    </div>
  );
}
