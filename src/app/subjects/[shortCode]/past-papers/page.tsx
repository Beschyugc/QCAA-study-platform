import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UploadForm } from "./upload-form";
import { deletePastPaper } from "./actions";

export default async function PastPapersPage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const user = await requireUser();

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: shortCode.toUpperCase() },
    include: {
      pastPapers: {
        orderBy: [{ year: "desc" }, { paperName: "asc" }],
        include: { attempts: { orderBy: { startedAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!subject) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/subjects/${subject.shortCode}`} className="text-sm text-muted-foreground">
        &larr; {subject.name}
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Past papers — {subject.name}</h1>

      <UploadForm shortCode={subject.shortCode} subjectId={subject.id} />

      <ul className="mt-6 space-y-2">
        {subject.pastPapers.map((paper) => (
          <li
            key={paper.id}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
          >
            <span className="flex-1">
              {paper.year} — {paper.paperName} ({paper.totalMarks} marks)
              {paper.attempts[0] && (
                <span className="ml-2 text-xs text-muted-foreground">
                  last attempt: {paper.attempts[0].percentage?.toFixed(0) ?? "—"}%
                </span>
              )}
            </span>
            <Link
              href={`/subjects/${subject.shortCode}/past-papers/${paper.id}`}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Attempt
            </Link>
            <form
              action={async () => {
                "use server";
                await deletePastPaper(shortCode, paper.id);
              }}
            >
              <button type="submit" className="text-xs text-destructive underline">
                Delete
              </button>
            </form>
          </li>
        ))}
        {subject.pastPapers.length === 0 && (
          <p className="text-sm text-muted-foreground">No past papers uploaded yet.</p>
        )}
      </ul>
    </div>
  );
}
