import Link from "next/link";

export type ExamSubject = {
  shortCode: string;
  name: string;
  colour: string;
  mockExternalDate: Date | null;
  nextAssessmentDate: Date | null;
};

function daysUntil(date: Date, now: Date): number {
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfDate.getTime() - startOfNow.getTime()) / 86_400_000);
}

function nearestUpcoming(
  subjects: ExamSubject[],
  field: "mockExternalDate" | "nextAssessmentDate",
  now: Date,
): { subject: ExamSubject; days: number } | null {
  let best: { subject: ExamSubject; days: number } | null = null;
  for (const s of subjects) {
    const date = s[field];
    if (!date) continue;
    const days = daysUntil(date, now);
    if (days < 0) continue; // already sat
    if (!best || days < best.days) best = { subject: s, days };
  }
  return best;
}

function CountdownTile({
  label,
  entry,
  emptyText,
}: {
  label: string;
  entry: { subject: ExamSubject; days: number } | null;
  emptyText: string;
}) {
  return (
    <div className="flex-1 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface-raised)] p-4">
      <p className="signage text-[0.64rem] font-semibold text-[color:var(--text-faint)]">
        {label}
      </p>
      {entry ? (
        <>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="tabular-nums font-display text-3xl font-semibold text-[color:var(--text)]">
              {entry.days}
            </span>
            <span className="text-xs text-[color:var(--text-muted)]">
              day{entry.days === 1 ? "" : "s"}
            </span>
          </div>
          <Link
            href={`/subjects/${entry.subject.shortCode}`}
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
            style={{ color: entry.subject.colour }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: entry.subject.colour }}
            />
            {entry.subject.name}
          </Link>
        </>
      ) : (
        <p className="mt-1.5 text-xs text-[color:var(--text-faint)]">{emptyText}</p>
      )}
    </div>
  );
}

/** Prominent dashboard countdowns to the nearest mock and the nearest real
 * external, across every subject — never invented, always sourced from the
 * dates set on Subject.mockExternalDate / Subject.nextAssessmentDate. */
export function ExamCountdowns({ subjects }: { subjects: ExamSubject[] }) {
  const now = new Date();
  const nextMock = nearestUpcoming(subjects, "mockExternalDate", now);
  const nextExternal = nearestUpcoming(subjects, "nextAssessmentDate", now);

  if (!nextMock && !nextExternal) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <CountdownTile label="Next mock" entry={nextMock} emptyText="No mock dates set" />
      <CountdownTile
        label="Next external"
        entry={nextExternal}
        emptyText="No external dates set"
      />
    </div>
  );
}
