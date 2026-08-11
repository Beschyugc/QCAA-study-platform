import Link from "next/link";
import { Target } from "lucide-react";

/**
 * Says out loud when the plan below is running on thin evidence.
 *
 * The recommendation engine scores topics largely on the proportion of their
 * objectives rated red or amber. An unrated objective contributes nothing —
 * so while most of the syllabus is unrated, the ranking is driven by the
 * factors that remain (overdue cards, staleness, exam proximity) and is much
 * closer to a guess than the confident ordering it looks like.
 *
 * §40 of the brief: show "not enough evidence" rather than a number that
 * looks real. A plan presented without this caveat is the dashboard
 * implying it knows something it doesn't.
 *
 * Disappears on its own once enough objectives are rated — no dismiss
 * button, because dismissing it wouldn't make the plan better informed.
 */
export function EvidenceNotice({
  unrated,
  total,
}: {
  unrated: number;
  total: number;
}) {
  if (total === 0) return null;
  const proportion = unrated / total;
  // Below a third unrated the ranking has enough to work with; nagging past
  // that point would train him to ignore the banner that matters.
  if (proportion < 0.34) return null;

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[color:var(--streak-ember)] bg-[color:color-mix(in_srgb,var(--streak-ember)_10%,transparent)] p-4 sm:flex-row sm:items-center">
      <Target
        className="h-5 w-5 shrink-0"
        style={{ color: "var(--streak-ember)" }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[color:var(--text)]">
          {unrated} of {total} objectives have no rating yet
        </p>
        <p className="mt-0.5 text-[0.64rem] text-[color:var(--text-muted)]">
          The plan below still ranks on overdue cards and how long since you studied each
          topic — but not on what you actually know, because that isn&apos;t recorded yet.
          Working out your level is the one thing that fixes it.
        </p>
      </div>
      <Link
        href="/placement"
        className="shrink-0 rounded-xl px-4 py-2 text-center text-xs font-semibold"
        style={{ background: "var(--streak-ember)", color: "#2a1405" }}
      >
        Work out my level
      </Link>
    </div>
  );
}
