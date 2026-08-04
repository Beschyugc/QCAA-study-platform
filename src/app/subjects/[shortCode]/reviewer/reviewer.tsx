"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { gradeCard, undoReview, buryCard } from "./actions";
import { setCardSuspended } from "../cards/actions";
import type { Quality, SchedulingState } from "@/lib/srs/sm2";
import { isCloseEnough } from "@/lib/fuzzy-match";
import { Latex } from "@/components/latex";

type Item = {
  id: string;
  front: string;
  back: string;
  cardType: string;
  scheduling: SchedulingState & { dueDate: string };
};

const GRADE_KEYS: Record<string, { quality: Quality; label: string }> = {
  "1": { quality: 0, label: "Again" },
  "2": { quality: 3, label: "Hard" },
  "3": { quality: 4, label: "Good" },
  "4": { quality: 5, label: "Easy" },
};

type UndoEntry = {
  reviewId: string;
  cardId: string;
  previous: SchedulingState & { dueDate: string };
  wasSuspended: boolean;
};

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

  const current = queue[0];
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
    setLastUndo({
      reviewId,
      cardId: current.id,
      previous: current.scheduling,
      wasSuspended: false,
    });
    setQueue((q) => q.slice(1));
    setRevealed(false);
    setTypedAnswer("");
    setStartedAt(Date.now());
    setDone((d) => ({ count: d.count + 1 }));
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
    return (
      <div className="space-y-3 text-sm">
        <p className="text-lg font-medium">
          Session complete — {done.count} card{done.count === 1 ? "" : "s"} reviewed.
        </p>
        <Link
          href={`/subjects/${shortCode}/cards`}
          className="text-muted-foreground underline"
        >
          Back to cards
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
        <span>New: {remaining.new}</span>
        <span>Learning: {remaining.learning}</span>
        <span>Due: {remaining.due}</span>
      </div>

      <div className="min-h-40 rounded-md border border-border p-6 text-center">
        <div className="whitespace-pre-wrap text-lg">
          {current.cardType === "formula" ? (
            <Latex block>{current.front}</Latex>
          ) : (
            current.front
          )}
        </div>

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

        {revealed && (
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
            <div className="whitespace-pre-wrap text-lg">
              {current.cardType === "formula" ? (
                <Latex block>{current.back}</Latex>
              ) : (
                current.back
              )}
            </div>
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
              className="rounded-md border border-input px-4 py-2 text-sm"
            >
              {label} ({key})
            </button>
          ))
        )}
      </div>

      <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
        <button onClick={handleSuspend}>Suspend (s)</button>
        <button onClick={handleBury}>Bury until tomorrow (b)</button>
        {lastUndo && <button onClick={handleUndo}>Undo last (u)</button>}
      </div>
    </div>
  );
}
