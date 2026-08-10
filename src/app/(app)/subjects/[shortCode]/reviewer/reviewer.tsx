"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { gradeCard, undoReview, buryCard } from "./actions";
import { MISTAKE_CATEGORIES } from "@/config/mistakes";
import { recordMistakeForCard } from "@/app/(app)/mistakes/actions";
import { setCardSuspended } from "../cards/actions";
import { previewIntervals } from "@/lib/srs/sm2";
import type { Quality, SchedulingState } from "@/lib/srs/sm2";
import { isCloseEnough } from "@/lib/fuzzy-match";
import { Latex } from "@/components/latex";
import { InlineMarkdown } from "@/components/markdown";
import { ClozeText } from "@/components/cloze-text";
import { OcclusionView } from "./occlusion-view";

type Item = {
  id: string;
  front: string;
  back: string;
  cardType: string;
  extra: string | null;
  scheduling: SchedulingState & { dueDate: string };
};

const GRADE_KEYS: Record<string, { quality: Quality; label: string }> = {
  "1": { quality: 0, label: "Again" },
  "2": { quality: 3, label: "Hard" },
  "3": { quality: 4, label: "Good" },
  "4": { quality: 5, label: "Easy" },
};

// Anki's grade colours, so the buttons read at a glance.
const GRADE_STYLES: Record<Quality, string> = {
  0: "border-red-500/40 text-red-300 hover:bg-red-500/10",
  3: "border-amber-500/40 text-amber-300 hover:bg-amber-500/10",
  4: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
  5: "border-sky-500/40 text-sky-300 hover:bg-sky-500/10",
};

type UndoEntry = {
  reviewId: string;
  cardId: string;
  previous: SchedulingState & { dueDate: string };
  wasSuspended: boolean;
};

/** One graded card this session, kept for the end-of-session summary. */
type HistoryEntry = {
  cardId: string;
  front: string;
  quality: Quality;
  timeTakenMs: number;
  mistakeLogged: boolean;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function Reviewer({
  shortCode,
  initialItems,
}: {
  shortCode: string;
  initialItems: Item[];
}) {
  const [queue, setQueue] = useState(initialItems);
  const [revealed, setRevealed] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [startedAt, setStartedAt] = useState(Date.now());
  const [done, setDone] = useState({ count: 0 });
  const [lastUndo, setLastUndo] = useState<UndoEntry | null>(null);
  /** The card just failed, while the "why did you miss it?" prompt is showing. */
  const [missed, setMissed] = useState<{ cardId: string; front: string } | null>(null);

  // Session-level timing, separate from `startedAt` (which resets every
  // card to time individual answers). Fixed at first render so switching
  // tabs or re-rendering doesn't restart the session clock.
  const [sessionStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Ticks the visible session timer once a second. Stops once the queue is
  // empty — a frozen clock on the summary screen is more useful than one
  // that keeps climbing after the session is actually over.
  useEffect(() => {
    if (queue.length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [queue.length]);

  const current = queue[0];

  // What each button would schedule. Keyed on the card so the labels are
  // computed once per card rather than on every keystroke of a typed answer.
  const intervalFor = useMemo(() => {
    const map: Record<Quality, string> = { 0: "", 3: "", 4: "", 5: "" };
    if (!current) return map;
    for (const p of previewIntervals(current.scheduling, new Date())) {
      map[p.quality] = p.interval;
    }
    return map;
  }, [current]);

  const remaining = {
    new: queue.filter((i) => i.scheduling.state === "new").length,
    learning: queue.filter((i) =>
      ["learning", "relearning"].includes(i.scheduling.state),
    ).length,
    due: queue.filter((i) => i.scheduling.state === "review").length,
  };

  async function grade(quality: Quality) {
    if (!current) return;
    const timeTakenMs = Date.now() - startedAt;
    const { reviewId } = await gradeCard(
      shortCode,
      current.id,
      quality,
      timeTakenMs,
    );
    // Offer to log WHY only on Again. Asking after every grade would turn a
    // 20-card session into 20 forms; asking on a lapse catches the ones that
    // actually cost marks. It sits beside the next card rather than blocking
    // it, so ignoring the prompt costs nothing.
    setMissed(quality === 0 ? { cardId: current.id, front: current.front } : null);
    setLastUndo({
      reviewId,
      cardId: current.id,
      previous: current.scheduling,
      wasSuspended: false,
    });
    setHistory((h) => [
      ...h,
      { cardId: current.id, front: current.front, quality, timeTakenMs, mistakeLogged: false },
    ]);
    setQueue((q) => q.slice(1));
    setRevealed(false);
    setTypedAnswer("");
    setStartedAt(Date.now());
    setDone((d) => ({ count: d.count + 1 }));
  }

  /** Marks a card's history entry as explained, whether that happened via
   * the inline "why did you miss it?" prompt or from the summary screen. */
  async function logMistake(cardId: string, categoryId: string) {
    setHistory((h) =>
      h.map((entry) => (entry.cardId === cardId ? { ...entry, mistakeLogged: true } : entry)),
    );
    await recordMistakeForCard(cardId, categoryId);
  }

  async function handleUndo() {
    if (!lastUndo) return;
    await undoReview(
      shortCode,
      lastUndo.reviewId,
      lastUndo.cardId,
      lastUndo.previous,
      lastUndo.wasSuspended,
    );
    setLastUndo(null);
    // Simplest correct behaviour: reload so the undone card reappears in
    // the queue in its right place rather than trying to splice it back
    // into client state by hand.
    window.location.reload();
  }

  async function handleSuspend() {
    if (!current) return;
    await setCardSuspended(shortCode, current.id, true);
    setQueue((q) => q.slice(1));
    setRevealed(false);
    setTypedAnswer("");
  }

  async function handleBury() {
    if (!current) return;
    await buryCard(shortCode, current.id);
    setQueue((q) => q.slice(1));
    setRevealed(false);
    setTypedAnswer("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === " ") {
        event.preventDefault();
        setRevealed(true);
      } else if (event.key in GRADE_KEYS && revealed) {
        grade(GRADE_KEYS[event.key].quality);
      } else if (event.key === "s") {
        handleSuspend();
      } else if (event.key === "b") {
        handleBury();
      } else if (event.key === "u") {
        handleUndo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, revealed, lastUndo]);

  if (!current) {
    if (history.length === 0) {
      // The queue was empty before a single card was graded — nothing to
      // summarise, and a "0 correct / 0 wrong" summary would just be noise.
      return (
        <div className="space-y-3 text-sm">
          <p className="text-lg font-medium">Nothing due right now.</p>
          <Link href={`/subjects/${shortCode}/cards`} className="text-muted-foreground underline">
            Back to cards
          </Link>
        </div>
      );
    }
    return (
      <SessionSummary
        shortCode={shortCode}
        history={history}
        totalMs={now - sessionStartedAt}
        onLogMistake={logMistake}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span>New: {remaining.new}</span>
          <span>Learning: {remaining.learning}</span>
          <span>Due: {remaining.due}</span>
        </div>
        <span className="tabular-nums" title="Time since this session started">
          ⏱ {formatDuration(now - sessionStartedAt)}
        </span>
      </div>

      <div className="min-h-40 rounded-md border border-border p-6 text-center">
        {current.cardType === "image_occlusion" ? (
          <OcclusionView extra={current.extra} revealed={revealed} />
        ) : (
          <div className="whitespace-pre-wrap text-lg">
            {current.cardType === "formula" ? (
              <Latex block>{current.front}</Latex>
            ) : current.cardType === "cloze" ? (
              // The deletion has to be blanked here, or the card prints its
              // own answer on the question side and tests nothing.
              <ClozeText text={current.front} revealed={revealed} />
            ) : (
              // Not raw text: generated cards carry inline LaTeX for anything
              // mathematical, and printing "$e^{2x}$" at a Methods student is
              // worse than useless.
              <InlineMarkdown>{current.front}</InlineMarkdown>
            )}
          </div>
        )}

        {current.cardType === "type_in" && !revealed && (
          <input
            autoFocus
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setRevealed(true);
              }
            }}
            placeholder="Type your answer, then Enter"
            className="mt-3 w-full rounded-md border border-input bg-transparent px-3 py-2 text-center text-sm"
          />
        )}

        {revealed && current.cardType !== "image_occlusion" && (
          <>
            <hr className="my-4 border-border" />
            {current.cardType === "type_in" && (
              <p
                className={`mb-2 text-sm ${
                  isCloseEnough(typedAnswer, current.back)
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                You typed: "{typedAnswer || "(nothing)"}" —{" "}
                {isCloseEnough(typedAnswer, current.back) ? "close enough" : "not quite"}
              </p>
            )}
            {/* A cloze card already shows its answer in place above. Its back
                is only worth printing when it carries genuine extra notes
                rather than a copy of the front. */}
            {!(
              current.cardType === "cloze" &&
              (!current.back.trim() || current.back.trim() === current.front.trim())
            ) && (
              <div className="whitespace-pre-wrap text-lg">
                {current.cardType === "formula" ? (
                  <Latex block>{current.back}</Latex>
                ) : (
                  <InlineMarkdown>{current.back}</InlineMarkdown>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
          >
            Reveal (space)
          </button>
        ) : (
          Object.entries(GRADE_KEYS).map(([key, { quality, label }]) => (
            <button
              key={key}
              onClick={() => grade(quality)}
              className={`flex min-w-20 flex-col items-center rounded-md border px-4 py-2 text-sm ${GRADE_STYLES[quality]}`}
            >
              <span>
                {label} ({key})
              </span>
              <span className="mt-0.5 text-[11px] tabular-nums opacity-70">
                {intervalFor[quality]}
              </span>
            </button>
          ))
        )}
      </div>

      {missed && (
        <div className="mx-auto mt-4 max-w-xl rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[color:var(--text)]">
              Why did you miss that?
            </p>
            <button
              onClick={() => setMissed(null)}
              className="text-[0.64rem] text-[color:var(--text-faint)] hover:text-[color:var(--text)]"
            >
              skip
            </button>
          </div>
          <p className="mt-0.5 text-[0.64rem] text-[color:var(--text-muted)]">
            Goes to your Mistake folder with what fixes it. Same card missed twice counts once, with a tally.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MISTAKE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                title={c.hint}
                onClick={async () => {
                  const target = missed;
                  setMissed(null);
                  await logMistake(target.cardId, c.id);
                }}
                className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--ink)] px-2.5 py-1.5 text-[0.64rem] font-semibold text-[color:var(--text-muted)] hover:border-[color:var(--line)] hover:text-[color:var(--text)]"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
        <button onClick={handleSuspend}>Suspend (s)</button>
        <button onClick={handleBury}>Bury until tomorrow (b)</button>
        {lastUndo && <button onClick={handleUndo}>Undo last (u)</button>}
      </div>
    </div>
  );
}

/**
 * End-of-session report: how long it took, what stuck and what didn't, and
 * a last chance to explain any wrong card that was skipped mid-session (the
 * inline "why did you miss it?" prompt has a "skip" button — this is the
 * catch-all for anything skipped there, not a duplicate of it).
 */
function SessionSummary({
  shortCode,
  history,
  totalMs,
  onLogMistake,
}: {
  shortCode: string;
  history: HistoryEntry[];
  totalMs: number;
  onLogMistake: (cardId: string, categoryId: string) => Promise<void>;
}) {
  const correct = history.filter((h) => h.quality > 0).length;
  const wrong = history.filter((h) => h.quality === 0);
  const avgMs = history.reduce((sum, h) => sum + h.timeTakenMs, 0) / history.length;
  const [openFor, setOpenFor] = useState<string | null>(null);

  return (
    <div className="space-y-5 text-sm">
      <div>
        <p className="text-lg font-medium">
          Session complete — {history.length} card{history.length === 1 ? "" : "s"} reviewed.
        </p>
        <p className="text-xs text-muted-foreground">
          Took {formatDuration(totalMs)} · {formatDuration(avgMs)} per card on average
        </p>
      </div>

      <div className="flex gap-6">
        <Stat label="Correct" value={correct} className="text-emerald-400" />
        <Stat label="Wrong" value={wrong.length} className="text-red-400" />
        <Stat label="Accuracy" value={`${Math.round((correct / history.length) * 100)}%`} />
      </div>

      {wrong.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-[color:var(--text)]">
            Cards you got wrong
          </p>
          <ul className="flex flex-col gap-2">
            {wrong.map((entry) => (
              <li
                key={entry.cardId}
                className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[color:var(--text-muted)]">{entry.front}</p>
                  {entry.mistakeLogged ? (
                    <span className="shrink-0 text-[0.64rem] text-emerald-400">logged ✓</span>
                  ) : (
                    <button
                      onClick={() => setOpenFor(openFor === entry.cardId ? null : entry.cardId)}
                      className="shrink-0 rounded-lg border border-[color:var(--hairline)] px-2 py-1 text-[0.64rem] font-semibold text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                    >
                      Why did I miss this?
                    </button>
                  )}
                </div>
                {openFor === entry.cardId && !entry.mistakeLogged && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {MISTAKE_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        title={c.hint}
                        onClick={async () => {
                          setOpenFor(null);
                          await onLogMistake(entry.cardId, c.id);
                        }}
                        className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--ink)] px-2.5 py-1.5 text-[0.64rem] font-semibold text-[color:var(--text-muted)] hover:border-[color:var(--line)] hover:text-[color:var(--text)]"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href={`/subjects/${shortCode}/cards`} className="text-muted-foreground underline">
        Back to cards
      </Link>
    </div>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div>
      <p className={`tabular-nums text-xl font-semibold ${className}`}>{value}</p>
      <p className="text-[0.64rem] text-muted-foreground">{label}</p>
    </div>
  );
}
