import Link from "next/link";
import { LINES } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";
import type { LineState, Pace } from "@/lib/dashboard";

/**
 * One row per subject: where you are, whether you're behind, what's left to do.
 *
 * Behind-pace copy is always a next action ("needs 2 sessions this week"),
 * never a verdict ("you're failing Methods"). A bad week should read as
 * information, not an accusation.
 */
export function LineRows({
  lines,
  pace,
  questionsDone,
}: {
  lines: LineState[];
  pace: Map<string, Pace>;
  /** Subject codes whose daily question set is already finished today. */
  questionsDone: Set<string>;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {lines.map((line) => {
        const def = LINES[line.code];
        const p = pace.get(line.code);
        const total = line.stations.length;
        const progress = total === 0 ? 0 : line.masteredCount / total;
        const behind = (p?.topicsDelta ?? 0) < 0;

        return (
          <li key={line.code}>
            <Link
              href={`/subjects/${line.code}`}
              className="grid grid-cols-[3px_1fr_auto] items-center gap-x-3.5 gap-y-1 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3 transition-colors duration-[180ms] hover:bg-[color:var(--surface-raised)] sm:grid-cols-[3px_180px_1fr_112px_88px]"
            >
              <span
                aria-hidden
                className="hidden h-6 w-[3px] rounded-sm sm:block"
                style={{ background: `var(--line-${def.slug})` }}
              />

              <span
                className="signage flex items-center gap-2 font-display text-xs font-bold"
                style={{ color: `var(--line-${def.slug}-bright)` }}
              >
                <LineIcon name={def.icon} className="h-3.5 w-3.5 shrink-0" />
                {def.label}
              </span>

              <span className="col-span-2 sm:col-span-1">
                <span className="block h-1.5 overflow-hidden rounded-full bg-[color:var(--surface-raised)]">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.round(progress * 100)}%`,
                      background: `var(--line-${def.slug})`,
                    }}
                  />
                </span>
                <span
                  className={`mt-1 block text-[0.64rem] ${
                    behind ? "text-[color:var(--state-danger)]" : "text-[color:var(--text-faint)]"
                  }`}
                >
                  {p?.summary ?? "not set up"}
                </span>
              </span>

              <span className="tabular text-[0.64rem] text-[color:var(--text-muted)]">
                {line.position ?? "—"}
                <span className="ml-1 text-[color:var(--text-faint)]">
                  ({line.masteredCount}/{total})
                </span>
              </span>

              <span className="flex justify-end gap-3 text-[0.64rem]">
                <span className="tabular text-[color:var(--text-muted)]">{line.cardsDue} due</span>
                {/* There is always work here: either the day's questions are
                    still outstanding, or they're done. Never "nothing to do". */}
                <span
                  className="tabular"
                  style={{
                    color: questionsDone.has(line.code)
                      ? "var(--state-good)"
                      : "var(--text-faint)",
                  }}
                  title={
                    questionsDone.has(line.code)
                      ? "Today's questions are done"
                      : "Today's questions aren't done yet"
                  }
                >
                  {questionsDone.has(line.code) ? "Q ✓" : "Q"}
                </span>
                {line.redObjectives > 0 && (
                  <span className="tabular text-[color:var(--state-danger)]">
                    {line.redObjectives} red
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
