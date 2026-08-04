import Link from "next/link";
import { LINES } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";
import { Empty } from "./shell";
import type { LineState, NextDeparture as NextDepartureData } from "@/lib/dashboard";

/**
 * The most important element after the map: whatever comes first, a timetabled
 * class or a study block, with one click to a running timer already tagged to
 * the right subject and topic.
 *
 * Four states, all real:
 *   1. A departure with a known line and an active topic  -> start, fully tagged
 *   2. A departure with a known line but no topic yet     -> point at the gap
 *   3. A contested departure (two subjects, one slot)     -> show both, don't guess
 *   4. Nothing left today                                 -> invite, don't apologise
 *
 * There is no split-flap here yet. It belongs to a *transition* between
 * departures, which needs the value to change while the page is open — that
 * arrives with the live clock in step 6. Animating it on first paint would be
 * decoration pretending to be information.
 */
export function NextDeparture({
  departure,
  lines,
  totalCardsDue,
}: {
  departure: NextDepartureData | null;
  lines: LineState[];
  totalCardsDue: number;
}) {
  if (!departure) {
    return (
      <Empty headline="Nothing booked.">
        {totalCardsDue > 0 ? (
          <>
            <span className="tabular">{totalCardsDue}</span> cards due across your lines.
          </>
        ) : (
          "The day's timetable is done."
        )}
        <StartLink className="mt-4" href="/timer">
          Start a study block
        </StartLink>
      </Empty>
    );
  }

  const line = departure.code ? LINES[departure.code] : null;
  const lineState = departure.code ? lines.find((l) => l.code === departure.code) : null;
  const activeStation =
    lineState && lineState.activeIndex >= 0 ? lineState.stations[lineState.activeIndex] : null;
  const primary = departure.blocks[0];

  // A class period starts an in_school session; anything else is after_school.
  // The distinction is real — it lands in StudySession.sessionType and the
  // weekly review reads it back.
  const isClass = departure.blocks.some((b) => b.subjectId !== null);

  return (
    <div>
      <div className="flex items-center gap-4 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface-raised)] px-4 py-4">
        <span className="tabular text-[2.4414rem] font-bold leading-none tracking-tight">
          {departure.startTime}
        </span>
        <span className="min-w-0">
          {departure.blocks.map((block) => {
            const blockLine = block.subjectCode ? LINES[block.subjectCode] : null;
            return (
              <span
                key={block.id}
                className="flex items-center gap-2"
                // Inline colour, not a Tailwind class: the line is data-driven,
                // so the class name can't be statically known at build time and
                // Tailwind would purge it. `color` cascades to the icon, which
                // strokes with currentColor.
                style={{
                  color: blockLine ? `var(--line-${blockLine.slug}-bright)` : "var(--text)",
                }}
              >
                {blockLine && <LineIcon name={blockLine.icon} className="h-4 w-4 shrink-0" />}
                <span className="signage truncate font-display text-xl font-bold">
                  {blockLine ? blockLine.label : (block.label ?? block.periodName)}
                </span>
              </span>
            );
          })}
          <span className="mt-0.5 block text-xs text-[color:var(--text-muted)]">
            {primary.periodName}
            {primary.room ? ` · ${primary.room}` : " · room not set"}
          </span>
        </span>
        <span className="ml-auto shrink-0 text-right">
          <b className="tabular block text-xl font-bold">{departure.minutesAway}</b>
          <span className="signage text-[0.64rem] text-[color:var(--text-faint)]">min</span>
        </span>
      </div>

      {departure.clashNote && (
        <p className="mt-2.5 text-[0.64rem] text-[color:var(--state-danger)]">
          {departure.clashNote}
        </p>
      )}

      {departure.blocks.some((b) => b.codeInferred) && (
        <p className="mt-2.5 text-[0.64rem] text-[color:var(--text-faint)]">
          Subject read from the block&apos;s label — it isn&apos;t linked in the timetable, so this
          is a guess.
        </p>
      )}

      {activeStation ? (
        <>
          <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[color:var(--text-muted)]">
            <span>
              {lineState?.position} ·{" "}
              <span className="text-[color:var(--text)]">{activeStation.title}</span>
            </span>
            <span className="tabular">{activeStation.cardsDue} cards due</span>
            {activeStation.redObjectives > 0 && (
              <span className="tabular text-[color:var(--state-danger)]">
                {activeStation.redObjectives} red
              </span>
            )}
          </div>
          <StartLink
            className="mt-3.5 w-full"
            href={`/timer?subjectId=${lineState!.subjectId}&topicId=${activeStation.topicId}&sessionType=${isClass ? "in_school" : "after_school"}&start=1`}
          >
            {isClass ? "Start class session" : "Start study block"} →
          </StartLink>
        </>
      ) : line && lineState ? (
        // The line is known but has no active topic — which right now is true
        // of all five subjects. Say what's missing and where to fix it rather
        // than offering a start button that would log an untagged session.
        <>
          <p className="mt-3.5 text-xs text-[color:var(--text-faint)]">
            No active topic in {line.name} yet — a session started now couldn&apos;t be tagged to
            anything.
          </p>
          <StartLink className="mt-3.5 w-full" href={`/subjects/${line.code}`} variant="quiet">
            Set up {line.name} topics →
          </StartLink>
        </>
      ) : (
        <StartLink className="mt-3.5 w-full" href="/timer" variant="quiet">
          Start a study block →
        </StartLink>
      )}
    </div>
  );
}

function StartLink({
  href,
  children,
  className = "",
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "quiet";
}) {
  const styles =
    variant === "primary"
      ? "bg-[color:var(--state-good)] text-[#06231a] hover:brightness-110"
      : "border border-[color:var(--hairline)] bg-transparent text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]";
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-[filter,background-color,color] duration-[180ms] ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}
