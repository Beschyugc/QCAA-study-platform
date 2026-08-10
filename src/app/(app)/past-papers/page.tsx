import Link from "next/link";
import { BotMessageSquare, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LINES, LINE_ORDER } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";
import { Wrap, Zone, Empty } from "@/components/dashboard/shell";

export const dynamic = "force-dynamic";

/**
 * Cross-subject past paper index. Previously papers were only reachable one
 * subject at a time from a small link at the bottom of the subject overview
 * — this is the "every paper, in order" view the sidebar's Past papers row
 * points at.
 *
 * Ordering is deliberate, per the same rule the sidebar uses to lay out
 * subjects (LINE_ORDER), then newest paper first within each subject.
 */
export default async function PastPapersIndexPage() {
  const user = await requireUser();

  const papers = await prisma.pastPaper.findMany({
    where: { userId: user.id },
    include: {
      subject: { select: { shortCode: true, name: true } },
      attempts: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { percentage: true, rawScore: true, completedAt: true },
      },
    },
  });

  const bySubject = new Map<string, typeof papers>();
  for (const paper of papers) {
    const code = paper.subject.shortCode;
    const list = bySubject.get(code) ?? [];
    list.push(paper);
    bySubject.set(code, list);
  }
  for (const list of bySubject.values()) {
    list.sort((a, b) => b.year - a.year || a.paperName.localeCompare(b.paperName));
  }

  return (
    <Wrap>
      <Zone eyebrow="Past papers">
        <h1 className="font-display text-2xl font-medium text-[color:var(--text)]">
          Every paper, in order
        </h1>
        <p className="mt-1.5 max-w-xl text-xs text-[color:var(--text-muted)]">
          {papers.length} papers across every subject, grouped the same way the sidebar orders
          your subjects and newest first within each one.
        </p>
      </Zone>

      {papers.length === 0 && (
        <Zone>
          <Empty headline="No past papers yet">
            Import one from a subject&apos;s past papers page to see it here.
          </Empty>
        </Zone>
      )}

      {LINE_ORDER.map((code) => {
        const line = LINES[code];
        const subjectPapers = bySubject.get(code) ?? [];
        if (subjectPapers.length === 0) return null;

        return (
          <Zone key={code}>
            <div className="mb-3 flex items-center gap-2">
              <span style={{ color: `var(--line-${line.slug}-bright)` }}>
                <LineIcon name={line.icon} className="h-4 w-4" />
              </span>
              <h2
                className="signage font-display text-xs font-bold"
                style={{ color: `var(--line-${line.slug}-bright)` }}
              >
                {line.label}
              </h2>
              <span className="text-[0.64rem] text-[color:var(--text-faint)]">
                {subjectPapers.length} paper{subjectPapers.length === 1 ? "" : "s"}
              </span>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subjectPapers.map((paper) => {
                const lastAttempt = paper.attempts[0] ?? null;
                return (
                  <li key={paper.id}>
                    <Link
                      href={`/subjects/${code}/past-papers/${paper.id}`}
                      className="flex h-full flex-col gap-1.5 rounded-xl border border-[color:var(--hairline)] border-l-[3px] bg-[color:var(--surface)] px-4 py-3.5 transition-colors hover:bg-[color:var(--surface-raised)]"
                      style={{ borderLeftColor: `var(--line-${line.slug})` }}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-display text-sm font-semibold text-[color:var(--text)]">
                          {paper.year}
                        </span>
                        <FileText
                          className="h-3.5 w-3.5 shrink-0 text-[color:var(--text-faint)]"
                          aria-hidden
                        />
                      </span>
                      <span className="text-xs text-[color:var(--text-muted)]">
                        {paper.paperName}
                      </span>

                      <span className="mt-1 flex flex-wrap gap-1">
                        {/* Imported papers arrive with totalMarks unset (0) because the
                            total can't be read out of the PDFs. Say "not set" rather
                            than "0 marks", which reads as a paper worth nothing — same
                            rule the per-subject past papers list follows. */}
                        <Chip>{paper.totalMarks > 0 ? `${paper.totalMarks} marks` : "marks not set"}</Chip>
                        {paper.hasMarkingGuide && <Chip>Marking guide</Chip>}
                        {paper.mcPaperPath && <Chip>MC paper</Chip>}
                      </span>

                      {lastAttempt && (
                        <span className="mt-auto pt-1 text-[0.64rem] text-[color:var(--text-faint)]">
                          Last attempt:{" "}
                          {lastAttempt.percentage === null
                            ? `${lastAttempt.rawScore ?? 0} marks — set the total to get a %`
                            : `${lastAttempt.percentage.toFixed(0)}%`}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Zone>
        );
      })}

      <Zone>
        <Link
          href="/ai"
          className="inline-flex items-center gap-2 text-xs text-[color:var(--text-muted)] underline decoration-[color:var(--hairline)] underline-offset-4 hover:text-[color:var(--text)]"
        >
          <BotMessageSquare className="h-3.5 w-3.5" aria-hidden />
          Have a question about one? Open any paper and ask AI right from it.
        </Link>
      </Zone>
    </Wrap>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[color:var(--hairline)] px-2 py-0.5 text-[0.6rem] text-[color:var(--text-faint)]">
      {children}
    </span>
  );
}
