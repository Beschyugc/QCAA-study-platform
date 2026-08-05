import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activeProviderName } from "@/lib/ai/provider";
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

  const provider = activeProviderName();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/subjects/${subject.shortCode}`}
        className="text-sm text-muted-foreground"
      >
        &larr; {subject.name}
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">AI Tutor — {subject.name}</h1>
      {/* Names the provider actually in use. This previously hard-coded a
          warning about free-tier Gemini and Google training on inputs — true
          when Gemini was the plan, wrong since Phase 7 switched to Claude, and
          worse than silence because it named the wrong company. */}
      <p className="mb-6 text-xs text-muted-foreground">
        {provider === "Claude"
          ? "Answers come from Claude, using this topic's syllabus objectives and your ratings as context."
          : provider === "Gemini"
            ? "Answers come from Gemini. On Google's free tier, don't send anything sensitive — inputs may be used to improve their models."
            : provider === "fallback"
              ? "Answers come from the configured fallback provider."
              : "No AI provider is configured, so asking a question won't work yet."}
      </p>
      <TutorClient subjectId={subject.id} topics={topics} />
    </div>
  );
}
