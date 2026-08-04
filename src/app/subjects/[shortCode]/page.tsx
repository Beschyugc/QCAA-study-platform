import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CurriculumTree } from "./curriculum-tree";
import { RagHeatmap } from "./heatmap";
import { ProgressionMap } from "./progression-map";

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
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href={`/subjects/${subject.shortCode}/export?format=csv`}
            className="rounded-md border border-input px-3 py-2"
          >
            Export CSV
          </a>
          <a
            href={`/subjects/${subject.shortCode}/export?format=json`}
            className="rounded-md border border-input px-3 py-2"
          >
            Export JSON
          </a>
          <Link
            href={`/subjects/${subject.shortCode}/import`}
            className="rounded-md border border-input px-3 py-2"
          >
            Import
          </Link>
          <Link
            href={`/subjects/${subject.shortCode}/syllabus-import`}
            className="rounded-md border border-input px-3 py-2"
          >
            Syllabus PDF
          </Link>
          <Link
            href={`/subjects/${subject.shortCode}/rate`}
            className="rounded-md border border-input px-3 py-2"
          >
            Rate mode
          </Link>
          <Link
            href={`/subjects/${subject.shortCode}/formulas`}
            className="rounded-md border border-input px-3 py-2"
          >
            Formulas
          </Link>
          <Link
            href={`/subjects/${subject.shortCode}/assumed-knowledge`}
            className="rounded-md border border-input px-3 py-2"
          >
            Assumed Knowledge
          </Link>
          <Link
            href={`/subjects/${subject.shortCode}/cards`}
            className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground"
          >
            Cards
          </Link>
        </div>
      </div>

      <ProgressionMap shortCode={subject.shortCode} units={subject.units} />
      <RagHeatmap units={subject.units} />
      <CurriculumTree subject={subject} />
    </div>
  );
}
