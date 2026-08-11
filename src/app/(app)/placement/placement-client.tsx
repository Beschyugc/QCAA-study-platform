"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LINES, type SubjectCode } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";
import {
  startPlacement,
  submitPlacement,
  startFallbackPlacement,
  submitFallbackPlacement,
} from "./actions";
import type {
  FallbackPlacementCard,
  PlacementQuestion,
  PlacementResult,
  SelfGrade,
} from "@/lib/placement";
import { ClozeText } from "@/components/cloze-text";
import { InlineMarkdown } from "@/components/markdown";
import { Latex } from "@/components/latex";

type Stage = "pick" | "answering" | "fallback" | "done";

const SELF_GRADE_LABEL: Record<SelfGrade, string> = {
  know: "Knew it",
  partial: "Partly",
  dont_know: "Didn't know",
};
const SELF_GRADE_STYLE: Record<SelfGrade, string> = {
  know: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
  partial: "border-amber-500/40 text-amber-300 hover:bg-amber-500/10",
  dont_know: "border-red-500/40 text-red-300 hover:bg-red-500/10",
};

const RAG_COLOUR = {
  red: "var(--state-danger)",
  amber: "var(--streak-ember)",
  green: "var(--state-good)",
} as const;

export function PlacementClient({
  subjects,
}: {
  subjects: { code: SubjectCode; topics: number; rated: number }[];
}) {
  const [stage, setStage] = useState<Stage>("pick");
  const [code, setCode] = useState<SubjectCode | null>(null);
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<PlacementResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Fallback (no AI) state.
  const [fallbackCards, setFallbackCards] = useState<FallbackPlacementCard[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [grades, setGrades] = useState<Record<string, SelfGrade>>({});

  function begin(subject: SubjectCode) {
    setCode(subject);
    setError(null);
    start(async () => {
      const result = await startPlacement(subject);
      if (result.error || !result.questions) {
        setError(result.error ?? "Could not build the diagnostic.");
        return;
      }
      setQuestions(result.questions);
      setAnswers({});
      setStage("answering");
    });
  }

  function beginFallback(subject: SubjectCode) {
    setCode(subject);
    setError(null);
    start(async () => {
      const result = await startFallbackPlacement(subject);
      if (result.error || !result.cards) {
        setError(result.error ?? "Could not build a card-based diagnostic.");
        return;
      }
      setFallbackCards(result.cards);
      setRevealed({});
      setGrades({});
      setStage("fallback");
    });
  }

  function finishFallback() {
    if (!code) return;
    setError(null);
    start(async () => {
      const byTopic = new Map<string, SelfGrade[]>();
      for (const card of fallbackCards) {
        const grade = grades[card.cardId];
        if (!grade) continue; // ungraded cards contribute no evidence, same as a skipped question
        const list = byTopic.get(card.topicId) ?? [];
        list.push(grade);
        byTopic.set(card.topicId, list);
      }
      const result = await submitFallbackPlacement(code, [...byTopic.entries()]);
      if (result.error || !result.results) {
        setError(result.error ?? "Could not save the ratings.");
        return;
      }
      setResults(result.results);
      setStage("done");
    });
  }

  function finish() {
    if (!code) return;
    setError(null);
    start(async () => {
      const payload = questions.map((q, i) => ({
        topicId: q.topicId,
        question: q.question,
        answer: answers[i] ?? "",
      }));
      const result = await submitPlacement(code, payload);
      if (result.error || !result.results) {
        setError(result.error ?? "Could not mark the diagnostic.");
        return;
      }
      setResults(result.results);
      setStage("done");
    });
  }

  if (stage === "pick") {
    return (
      <>
        <p className="max-w-xl text-xs text-[color:var(--text-muted)]">
          Pick a subject and you&apos;ll get two short questions on every topic in it — including
          the ones still locked, because the point is to find out what you already know. Answer
          what you can and skip what you can&apos;t; a blank answer is genuinely useful information,
          not a failure.
        </p>
        <p className="mt-2 max-w-xl text-xs text-[color:var(--text-muted)]">
          Everything gets marked, each topic comes back red, amber or green, and that rating goes
          straight into what the planner tells you to do.
        </p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {subjects.map((subject) => {
            const line = LINES[subject.code];
            return (
              <li key={subject.code}>
                <button
                  onClick={() => begin(subject.code)}
                  disabled={pending || subject.topics === 0}
                  className="flex w-full items-center gap-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--surface-raised)] disabled:opacity-50"
                >
                  <span style={{ color: `var(--line-${line.slug}-bright)` }}>
                    <LineIcon name={line.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="signage block font-display text-xs font-bold"
                      style={{ color: `var(--line-${line.slug}-bright)` }}
                    >
                      {line.label}
                    </span>
                    <span className="mt-0.5 block text-[0.64rem] text-[color:var(--text-muted)]">
                      {subject.topics === 0
                        ? "No syllabus imported"
                        : `${subject.topics} topics · ${subject.topics * 2} questions · ~${Math.round(subject.topics * 2 * 1.5)} min`}
                    </span>
                  </span>
                  {subject.rated > 0 && (
                    <span className="text-[0.64rem] text-[color:var(--text-faint)]">rated</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {pending && (
          <p className="mt-4 text-xs text-[color:var(--text-muted)]">
            Writing your questions from the syllabus — about a minute.
          </p>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-[color:var(--state-danger)] px-4 py-3">
            <p className="text-xs text-[color:var(--state-danger)]">{error}</p>
            {error.toLowerCase().includes("credit") && code && (
              <>
                <p className="mt-1.5 text-[0.64rem] text-[color:var(--text-muted)]">
                  No AI needed for this: you can be placed off real flashcards instead — see the
                  front, decide honestly if you knew it, and that becomes the rating.
                </p>
                <button
                  onClick={() => beginFallback(code)}
                  disabled={pending}
                  className="mt-2 rounded-lg px-3 py-1.5 text-[0.64rem] font-semibold"
                  style={{ background: "var(--state-good)", color: "#06231a" }}
                >
                  Use flashcards instead
                </button>
              </>
            )}
          </div>
        )}
      </>
    );
  }

  if (stage === "answering") {
    const line = code ? LINES[code] : null;
    const answered = Object.values(answers).filter((a) => a.trim() !== "").length;
    return (
      <div style={line ? ({ "--line-bright": `var(--line-${line.slug}-bright)` } as React.CSSProperties) : undefined}>
        <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-[color:var(--hairline)] bg-[color:var(--ink)] px-4 py-3 sm:-mx-7 sm:px-7">
          <p className="tabular text-xs text-[color:var(--text-muted)]">
            {answered} of {questions.length} answered
          </p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color:var(--surface-raised)]">
            <div
              className="h-full rounded-full transition-[width] duration-[180ms]"
              style={{
                width: `${(answered / Math.max(1, questions.length)) * 100}%`,
                background: line ? `var(--line-${line.slug})` : "var(--state-good)",
              }}
            />
          </div>
        </div>

        <ol className="flex flex-col gap-4">
          {questions.map((q, i) => (
            <li
              key={i}
              className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3.5"
            >
              <p className="tabular text-[0.64rem] text-[color:var(--text-faint)]">
                U{q.unitNumber} · {q.topicTitle}
              </p>
              <p className="mt-1 text-sm text-[color:var(--text)]">{q.question}</p>
              <textarea
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                rows={3}
                placeholder="Answer as best you can — or leave it blank if you don't know."
                className="mt-2.5 w-full rounded-lg border border-[color:var(--hairline)] bg-transparent p-2.5 text-xs text-[color:var(--text)] outline-none focus:border-[color:var(--text-faint)]"
              />
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={finish}
            disabled={pending}
            className="rounded-xl bg-[color:var(--state-good)] px-5 py-2.5 text-xs font-semibold text-[#06231a] disabled:opacity-60"
          >
            {pending ? "Marking…" : "Mark it"}
          </button>
          <button
            onClick={() => setStage("pick")}
            disabled={pending}
            className="rounded-xl border border-[color:var(--hairline)] px-5 py-2.5 text-xs font-semibold text-[color:var(--text-muted)]"
          >
            Back
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-[color:var(--state-danger)]">{error}</p>}
      </div>
    );
  }

  if (stage === "fallback") {
    const line = code ? LINES[code] : null;
    const gradedCount = Object.keys(grades).length;
    return (
      <div style={line ? ({ "--line-bright": `var(--line-${line.slug}-bright)` } as React.CSSProperties) : undefined}>
        <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-[color:var(--hairline)] bg-[color:var(--ink)] px-4 py-3 sm:-mx-7 sm:px-7">
          <p className="tabular text-xs text-[color:var(--text-muted)]">
            {gradedCount} of {fallbackCards.length} graded
          </p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color:var(--surface-raised)]">
            <div
              className="h-full rounded-full transition-[width] duration-[180ms]"
              style={{
                width: `${(gradedCount / Math.max(1, fallbackCards.length)) * 100}%`,
                background: line ? `var(--line-${line.slug})` : "var(--state-good)",
              }}
            />
          </div>
        </div>

        <ol className="flex flex-col gap-4">
          {fallbackCards.map((card) => {
            // An objective prompt has no answer side — it asks "can you do
            // this?" about the syllabus statement itself, so it goes
            // straight to the grade buttons with no reveal step.
            const isObjective = card.cardType === "objective";
            const isRevealed = isObjective || revealed[card.cardId];
            return (
              <li
                key={card.cardId}
                className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3.5"
              >
                <p className="tabular flex items-center gap-2 text-[0.64rem] text-[color:var(--text-faint)]">
                  <span>
                    U{card.unitNumber} · {card.topicTitle}
                  </span>
                  {isObjective && (
                    <span className="rounded bg-[color:var(--surface-raised)] px-1.5 py-0.5 font-semibold">
                      syllabus objective
                    </span>
                  )}
                </p>
                {isObjective && (
                  <p className="mt-1.5 text-[0.64rem] text-[color:var(--text-muted)]">
                    Could you do this in an exam, right now?
                  </p>
                )}
                <div className="mt-1 text-sm text-[color:var(--text)]">
                  {card.cardType === "formula" ? (
                    <Latex block>{card.front}</Latex>
                  ) : card.cardType === "cloze" ? (
                    <ClozeText text={card.front} revealed={Boolean(isRevealed)} />
                  ) : (
                    <InlineMarkdown>{card.front}</InlineMarkdown>
                  )}
                </div>

                {!isRevealed ? (
                  <button
                    onClick={() => setRevealed((prev) => ({ ...prev, [card.cardId]: true }))}
                    className="mt-2.5 rounded-lg border border-[color:var(--hairline)] px-3 py-1.5 text-[0.64rem] font-semibold text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                  >
                    Reveal answer
                  </button>
                ) : (
                  <>
                    {!isObjective && (
                      <div className="mt-2 border-t border-[color:var(--hairline)] pt-2 text-xs text-[color:var(--text-muted)]">
                        {card.cardType === "formula" ? (
                          <Latex block>{card.back}</Latex>
                        ) : (
                          <InlineMarkdown>{card.back}</InlineMarkdown>
                        )}
                      </div>
                    )}
                    <div className="mt-2.5 flex gap-2">
                      {(Object.keys(SELF_GRADE_LABEL) as SelfGrade[]).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGrades((prev) => ({ ...prev, [card.cardId]: g }))}
                          className={`rounded-lg border px-2.5 py-1.5 text-[0.64rem] font-semibold ${
                            grades[card.cardId] === g
                              ? SELF_GRADE_STYLE[g]
                              : "border-[color:var(--hairline)] text-[color:var(--text-faint)] hover:text-[color:var(--text)]"
                          }`}
                        >
                          {SELF_GRADE_LABEL[g]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={finishFallback}
            disabled={pending || gradedCount === 0}
            className="rounded-xl bg-[color:var(--state-good)] px-5 py-2.5 text-xs font-semibold text-[#06231a] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save ratings"}
          </button>
          <button
            onClick={() => setStage("pick")}
            disabled={pending}
            className="rounded-xl border border-[color:var(--hairline)] px-5 py-2.5 text-xs font-semibold text-[color:var(--text-muted)]"
          >
            Back
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-[color:var(--state-danger)]">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <h2 className="font-display text-lg text-[color:var(--text)]">Here&apos;s where you are</h2>
      <p className="mt-1 text-xs text-[color:var(--text-muted)]">
        Saved. Every topic below is now rated, and the planner is already using it.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {results.map((r) => (
          <li
            key={r.topicId}
            className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: RAG_COLOUR[r.rag] }}
                aria-label={r.rag}
              />
              <span className="text-xs font-semibold text-[color:var(--text)]">{r.topicTitle}</span>
              <span
                className="signage ml-auto text-[0.64rem] font-bold"
                style={{ color: RAG_COLOUR[r.rag] }}
              >
                {r.rag}
              </span>
            </div>
            <p className="mt-1.5 text-[0.64rem] text-[color:var(--text-muted)]">{r.verdict}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={code ? `/subjects/${code}` : "/"}
          className="rounded-xl bg-[color:var(--state-good)] px-5 py-2.5 text-xs font-semibold text-[#06231a]"
        >
          Go to {code}
        </Link>
        <button
          onClick={() => {
            setStage("pick");
            setResults([]);
          }}
          className="rounded-xl border border-[color:var(--hairline)] px-5 py-2.5 text-xs font-semibold text-[color:var(--text-muted)]"
        >
          Do another subject
        </button>
      </div>
    </>
  );
}
