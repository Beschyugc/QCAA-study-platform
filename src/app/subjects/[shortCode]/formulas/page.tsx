import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormulasManager } from "./formulas-manager";

export default async function FormulasPage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const user = await requireUser();

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: shortCode.toUpperCase() },
    include: {
      formulaEntries: { orderBy: { category: "asc" } },
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/subjects/${subject.shortCode}`}
        className="text-sm text-muted-foreground"
      >
        &larr; {subject.name}
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">
        Formula sheet — {subject.name}
      </h1>
      <FormulasManager
        shortCode={subject.shortCode}
        subjectId={subject.id}
        topics={topics}
        formulas={subject.formulaEntries}
      />
    </div>
  );
}
