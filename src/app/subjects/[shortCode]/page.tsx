import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CurriculumTree } from "./curriculum-tree";

export default async function SubjectPage({
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
            orderBy: { order: "asc" },
            include: {
              subtopics: {
                orderBy: { order: "asc" },
                include: {
                  learningObjectives: { orderBy: { createdAt: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!subject) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-muted-foreground">
            &larr; All subjects
          </Link>
          <h1 className="text-2xl font-semibold">{subject.name}</h1>
        </div>
        <Link
          href={`/subjects/${subject.shortCode}/rate`}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Rate mode
        </Link>
      </div>

      <CurriculumTree subject={subject} />
    </div>
  );
}
