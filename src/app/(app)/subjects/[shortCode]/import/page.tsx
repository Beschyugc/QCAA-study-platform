import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ImportForm } from "./import-form";

export default async function ImportPage({
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
        Import curriculum — {subject.name}
      </h1>
      <p className="mb-6 text-sm text-destructive">
        This replaces the entire curriculum tree for this subject. Export
        first if you want a backup.
      </p>
      <ImportForm shortCode={subject.shortCode} />
    </div>
  );
}
