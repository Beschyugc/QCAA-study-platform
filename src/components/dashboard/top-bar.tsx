import Link from "next/link";
import { Flame } from "lucide-react";

/**
 * Sticky top bar. Brand, progression, streak, timer readout.
 *
 * The level and XP meter are deliberately ABSENT for now. The gamification
 * tables don't exist yet (step 10 of the build order), so there is no XP to
 * report — and rendering "Level 1 · 0 XP" would be inventing a progression
 * system that hasn't been built. The slot appears the moment there is a real
 * number to put in it.
 *
 * The streak is real: computed from study_sessions in Brisbane calendar days
 * by getStudyStats().
 */
export function TopBar({
  streak,
  timerLabel,
}: {
  streak: number;
  /** Live readout from a running session, or null when nothing is running. */
  timerLabel: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--hairline)] bg-[color:color-mix(in_srgb,var(--ink)_92%,transparent)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-5 px-4 py-3.5 sm:px-7">
        <Link
          href="/"
          className="signage flex items-center gap-2.5 font-display text-base font-bold text-[color:var(--text)]"
        >
          <span
            className="h-2.5 w-2.5 rounded-full bg-[color:var(--line-methods)]"
            style={{ boxShadow: "0 0 0 4px var(--line-methods-glow)" }}
          />
          STUDYLINE
        </Link>

        {/* Streak reads as an ember count. No countdown, no "about to lose it"
            pressure — see the guardrails: a broken streak is stated once,
            quietly, and never used as a threat. */}
        {streak > 0 && (
          <span
            className="flex items-center gap-1.5 text-xs text-[color:var(--streak-ember)]"
            title={`${streak} day study streak`}
          >
            <Flame className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular">{streak}</span>
            <span className="sr-only">day streak</span>
          </span>
        )}

        <Link
          href="/timer"
          className="ml-auto flex items-center gap-2 rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3.5 py-1.5 text-xs text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-raised)]"
        >
          {timerLabel ? (
            <>
              <span className="h-2 w-2 rounded-full bg-[color:var(--state-good)]" aria-hidden />
              <span className="tabular">{timerLabel}</span>
            </>
          ) : (
            <span className="text-[color:var(--text-muted)]">Start timer</span>
          )}
        </Link>
      </div>
    </header>
  );
}
