"use client";

import { useMemo, useState } from "react";
import { Latex } from "@/components/latex";
import type { SubjectCode } from "@/config/tokens";
import { LINES } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";

/**
 * Drill mode — deliberately NOT the SM-2 scheduler.
 *
 * Beschy's own words on this material: "it's pretty quick to master... it'll
 * probably take a day to master all that shit." Spacing this out over weeks
 * the way the card deck does would be the wrong tool for exact trig values
 * and log laws — this is stuff you hammer once, hard, until it sticks, not
 * stuff that needs to be forgotten a little before it's worth re-testing.
 *
 * So: a session-local repeat-until-correct loop. Nothing here touches
 * CardScheduling. Missed entries go to the back of the queue and come around
 * again; the session is over when the queue is empty, i.e. every entry has
 * been marked "got it" at least once in this sitting. Getting something
 * wrong five times just means five more laps — there's no penalty beyond
 * that, and no state survives a refresh. That's the point.
 */

export type DrillEntry = {
  id: string;
  category: string;
  prompt: string;
  answer: string;
  latex: string | null;
  /** Present when the pool spans multiple subjects, so the card can be tagged. */
  subjectCode?: SubjectCode;
};

/** Deterministic-enough shuffle for a study session — no seed needed. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function DrillMode({
  entries,
  title,
  onExit,
}: {
  entries: DrillEntry[];
  title?: string;
  onExit: () => void;
}) {
  const total = entries.length;
  const [queue, setQueue] = useState<DrillEntry[]>(() => shuffle(entries));
  const [mastered, setMastered] = useState(0);
  const [missedThisRound, setMissedThisRound] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = queue[0];
  const line = current?.subjectCode ? LINES[current.subjectCode] : null;

  function gotIt() {
    setQueue((q) => q.slice(1));
    setMastered((m) => m + 1);
    setRevealed(false);
  }

  function missedIt() {
    setQueue((q) => [...q.slice(1), q[0]]);
    setMissedThisRound((m) => m + 1);
    setRevealed(false);
  }

  function restart() {
    setQueue(shuffle(entries));
    setMastered(0);
    setMissedThisRound(0);
    setRevealed(false);
  }

  if (total === 0) {
    return (
      <div className="space-y-3 text-center text-sm text-[color:var(--text-muted)]">
        <p>Nothing to drill in this selection.</p>
        <button onClick={onExit} className="underline underline-offset-4 hover:text-[color:var(--text)]">
          Back
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-sm space-y-5 py-8 text-center">
        <p className="font-display text-lg font-semibold text-[color:var(--text)]">
          Drill complete — {total} / {total} mastered.
        </p>
        <p className="text-xs text-[color:var(--text-muted)]">
          {missedThisRound === 0
            ? "Clean sweep, no misses."
            : `${missedThisRound} miss${missedThisRound === 1 ? "" : "es"} along the way, but everything landed.`}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={restart}
            className="rounded-lg bg-[color:var(--state-good)] px-4 py-2 text-xs font-semibold text-[#06231a]"
          >
            Go again
          </button>
          <button
            onClick={onExit}
            className="rounded-lg border border-[color:var(--hairline)] px-4 py-2 text-xs font-semibold text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
          >
            Exit drill
          </button>
        </div>
      </div>
    );
  }

  const progressPct = Math.round((mastered / total) * 100);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between text-xs">
        <button
          onClick={onExit}
          className="text-[color:var(--text-muted)] underline underline-offset-4 hover:text-[color:var(--text)]"
        >
          Exit drill
        </button>
        {title && <span className="text-[color:var(--text-faint)]">{title}</span>}
        <span className="tabular text-[color:var(--text-muted)]">
          {mastered} / {total} mastered
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[color:var(--surface-raised)]">
        <span
          className="block h-full rounded-full bg-[color:var(--state-good)] transition-[width] duration-[180ms]"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="min-h-40 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-[0.64rem] text-[color:var(--text-faint)]">
          {line && (
            <span
              className="signage flex items-center gap-1 font-display font-bold"
              style={{ color: `var(--line-${line.slug}-bright)` }}
            >
              <LineIcon name={line.icon} className="h-3 w-3" />
              {line.label}
            </span>
          )}
          <span>{current.category}</span>
        </div>
        <p className="font-display text-lg text-[color:var(--text)]">{current.prompt}</p>
        {revealed && (
          <>
            <hr className="my-4 border-[color:var(--hairline)]" />
            <p className="text-lg text-[color:var(--text)]">
              {current.latex ? <Latex>{current.latex}</Latex> : current.answer}
            </p>
          </>
        )}
      </div>

      <div className="mt-5 flex justify-center gap-3">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="rounded-lg bg-[color:var(--state-good)] px-6 py-2.5 text-xs font-semibold text-[#06231a]"
          >
            Reveal
          </button>
        ) : (
          <>
            <button
              onClick={missedIt}
              className="rounded-lg border border-[color:var(--state-danger)] px-6 py-2.5 text-xs font-semibold text-[color:var(--state-danger)]"
            >
              Missed it
            </button>
            <button
              onClick={gotIt}
              className="rounded-lg bg-[color:var(--state-good)] px-6 py-2.5 text-xs font-semibold text-[#06231a]"
            >
              Got it
            </button>
          </>
        )}
      </div>

      {queue.length > 1 && (
        <p className="mt-4 text-center text-[0.64rem] text-[color:var(--text-faint)]">
          {queue.length - 1} more in the queue
          {missedThisRound > 0 ? ` (${missedThisRound} missed so far)` : ""}
        </p>
      )}
    </div>
  );
}

/** Convenience used by both the subject-scoped manager and the top-level page. */
export function useDrillScope<T extends { category: string }>(entries: T[]) {
  return useMemo(() => ["all", ...new Set(entries.map((e) => e.category))], [entries]);
}
