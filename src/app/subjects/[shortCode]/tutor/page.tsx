import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TutorClient } from "./tutor-client";

export default async function TutorPage({
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
        include: {
          topics: {
            where: { unlockState: { in: ["active", "mastered"] } },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
  if (!subject) notFound();

  const topics = subject.units.flatMap((u) =>
    u.topics.map((t) => ({ id: t.id, label: `T${t.number} ${t.title}` })),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/subjects/${subject.shortCode}`}
        className="text-sm text-muted-foreground"
      >
        &larr; {subject.name}
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">AI Tutor — {subject.name}</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        Free-tier Gemini — don't send anything sensitive; Google may use
        free-tier inputs to improve their models.
      </p>
      <TutorClient subjectId={subject.id} topics={topics} />
    </div>
  );
}
