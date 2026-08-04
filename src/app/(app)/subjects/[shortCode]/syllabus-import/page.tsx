import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UploadForm } from "./upload-form";

export default async function SyllabusImportPage({
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/subjects/${subject.shortCode}`}
        className="text-sm text-muted-foreground"
      >
        &larr; {subject.name}
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">
        Syllabus import — {subject.name}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Upload the QCAA syllabus PDF. The AI drafts the unit/topic/subtopic/
        objective structure — review and fix it below before saving.
        Nothing is written until you click Save.
      </p>
      <UploadForm shortCode={subject.shortCode} />
    </div>
  );
}
