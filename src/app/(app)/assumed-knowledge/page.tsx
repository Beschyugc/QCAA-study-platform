import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LINE_ORDER } from "@/config/tokens";
import { AssumedKnowledgeClient, type SubjectGroup } from "./client";

/**
 * Cross-subject assumed knowledge — trig values, log laws, cell structures,
 * landmark studies, whatever your five subjects each assume you already
 * know. Lives at the top level (not under a subject) for the same reason
 * past papers and the timer do: you don't go looking for this inside one
 * subject, you drill the basics across all of them at once.
 *
 * Per-subject CRUD still lives at /subjects/[shortCode]/assumed-knowledge —
 * this page is read + drill only, sourced from the same table.
 */
export default async function AssumedKnowledgePage() {
  const user = await requireUser();

  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    select: {
      shortCode: true,
      name: true,
      assumedKnowledge: {
        orderBy: [{ category: "asc" }, { prompt: "asc" }],
        select: { id: true, category: true, prompt: true, answer: true, latex: true },
      },
    },
  });

  const byCode = new Map(subjects.map((s) => [s.shortCode, s]));

  const groups: SubjectGroup[] = LINE_ORDER.filter((code) => byCode.has(code)).map((code) => {
    const subject = byCode.get(code)!;
    return {
      code,
      name: subject.name,
      entries: subject.assumedKnowledge.map((e) => ({
        id: e.id,
        category: e.category,
        prompt: e.prompt,
        answer: e.answer,
        latex: e.latex,
        subjectCode: code,
      })),
    };
  });

  const total = groups.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-7">
      <h1 className="mb-1 flex items-center gap-2.5 font-display text-2xl font-semibold text-[color:var(--text)]">
        Assumed knowledge
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--text-muted)]">
        Not on the formula sheet, but assumed. {total} entr{total === 1 ? "y" : "ies"} across{" "}
        {groups.filter((g) => g.entries.length > 0).length} subject
        {groups.filter((g) => g.entries.length > 0).length === 1 ? "" : "s"} — trig values and log
        laws for Methods, cell structures for Biology, landmark studies for Psychology, energy
        systems for PE, and technique definitions for English. Drill mode is a fast
        repeat-until-correct loop, not the spaced-repetition deck: everything resets each session.
      </p>

      <AssumedKnowledgeClient subjects={groups} />
    </div>
  );
}
