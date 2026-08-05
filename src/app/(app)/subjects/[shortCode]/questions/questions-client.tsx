"use client";

import { useState, useTransition } from "react";
import { InlineMarkdown } from "@/components/markdown";
import { startTodaysQuestions, submitTodaysQuestions } from "./actions";
import type { DailyQuestion, DailyResponse } from "@/lib/daily-questions";

export function QuestionsClient({
  shortCode,
  initialSetId,
  initialQuestions,
  initialResponses,
  initialAwarded,
  initialAvailable,
}: {
  shortCode: string;
  initialSetId: string | null;
  initialQuestions: DailyQuestion[];
  initialResponses: DailyResponse[];
  initialAwarded: number | null;
  initialAvailable: number | null;
}) {
  const [setId, setSetId] = useState(initialSetId);
  const [questions, setQuestions] = useState<DailyQuestion[]>(initialQuestions);
  const [answers, setAnswers] = useState<Record<number, string>>(
    Object.fromEntries(initialResponses.map((r, i) => [i, r.answer])),
  );
  const [responses, setResponses] = useState<DailyResponse[]>(initialResponses);
  const [score, setScore] = useState<{ awarded: number; available: number } | null>(
    initialAwarded !== null && initialAvailable !== null
      ? { awarded: initialAwarded, available: initialAvailable }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const marked = responses.length > 0 && score !== null;

  function begin() {
    setError(null);
    start(async () => {
      const result = await startTodaysQuestions(shortCode);
      if (result.error || !result.questions) {
        setError(result.error ?? "Could not build today's questions.");
        return;
      }
      setSetId(result.setId);
      setQuestions(result.questions);
    });
  }

  function submit() {
    if (!setId) return;
    setError(null);
    start(async () => {
      const payload = questions.map((_, i) => answers[i] ?? "");
      const result = await submitTodaysQuestions(shortCode, setId, payload);
      if (result.error || !result.result) {
        setError(result.error ?? "Could not mark your answers.");
        return;
      }
      setResponses(result.result.responses);
      setScore({ awarded: result.result.awarded, available: result.result.available });
    });
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-7 text-center">
        <p className="font-display text-base text-[color:var(--text)]">Today&apos;s questions</p>
        <p className="mx-auto mt-2 max-w-md text-xs text-[color:var(--text-muted)]">
          A fresh set written from what you&apos;re actually weakest on — the topic you&apos;re on,
          plus anything you&apos;ve rated red or amber. Written answers, marked against real marking
          points.
        </p>
        <button
          onClick={begin}
          disabled={pending}
          className="mt-5 rounded-xl px-5 py-2.5 text-xs font-semibold disabled:opacity-60"
          style={{ background: "var(--line)", color: "#0f1420" }}
        >
          {pending ? "Writing your questions…" : "Get today's questions"}
        </button>
        {error && <p className="mt-3 text-xs text-[color:var(--state-danger)]">{error}</p>}
      </div>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const answered = Object.values(answers).filter((a) => a.trim() !== "").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4">
        <h2 className="font-display text-lg text-[color:var(--text)]">Today&apos;s questions</h2>
        {marked ? (
          <p className="tabular text-xs" style={{ color: "var(--line-bright)" }}>
            {score!.awarded} / {score!.available} marks
          </p>
        ) : (
          <p className="tabular text-xs text-[color:var(--text-muted)]">
            {answered} of {questions.length} answered · {totalMarks} marks
          </p>
        )}
      </div>

      <ol className="flex flex-col gap-3.5">
        {questions.map((q, i) => {
          const response = responses[i];
          return (
            <li
              key={i}
              className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3.5"
            >
              <div className="flex items-baseline gap-2">
                <span className="tabular text-[0.64rem] text-[color:var(--text-faint)]">
                  {q.topicTitle}
                </span>
                <span className="tabular ml-auto text-[0.64rem] text-[color:var(--text-muted)]">
                  {response ? `${response.awarded}/${q.marks}` : `${q.marks} marks`}
                </span>
              </div>

              <p className="mt-1 text-sm text-[color:var(--text)]">
                <InlineMarkdown>{q.question}</InlineMarkdown>
              </p>

              {marked ? (
                <>
                  <p className="mt-2.5 whitespace-pre-wrap rounded-lg bg-[color:var(--surface-raised)] p-2.5 text-xs text-[color:var(--text-muted)]">
                    {response?.answer.trim() || "(no answer given)"}
                  </p>
                  <p
                    className="mt-2 text-[0.64rem]"
                    style={{
                      color:
                        (response?.awarded ?? 0) === q.marks
                          ? "var(--state-good)"
                          : (response?.awarded ?? 0) === 0
                            ? "var(--state-danger)"
                            : "var(--streak-ember)",
                    }}
                  >
                    {response?.feedback}
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[0.64rem] text-[color:var(--text-faint)]">
                      What full marks needed
                    </summary>
                    <ul className="ml-4 mt-1.5 list-disc">
                      {q.markingPoints.map((point, j) => (
                        <li key={j} className="text-[0.64rem] text-[color:var(--text-muted)]">
                          <InlineMarkdown>{point}</InlineMarkdown>
                        </li>
                      ))}
                    </ul>
                  </details>
                </>
              ) : (
                <textarea
                  value={answers[i] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                  rows={3}
                  placeholder="Write your answer."
                  className="mt-2.5 w-full rounded-lg border border-[color:var(--hairline)] bg-transparent p-2.5 text-xs text-[color:var(--text)] outline-none focus:border-[color:var(--text-faint)]"
                />
              )}
            </li>
          );
        })}
      </ol>

      {!marked && (
        <button
          onClick={submit}
          disabled={pending}
          className="mt-4 rounded-xl px-5 py-2.5 text-xs font-semibold disabled:opacity-60"
          style={{ background: "var(--line)", color: "#0f1420" }}
        >
          {pending ? "Marking…" : "Mark my answers"}
        </button>
      )}

      {marked && (
        <p className="mt-4 text-xs text-[color:var(--text-muted)]">
          Done for today. A new set is written tomorrow — it&apos;ll lean on whatever you dropped
          marks on here.
        </p>
      )}

      {error && <p className="mt-3 text-xs text-[color:var(--state-danger)]">{error}</p>}
    </div>
  );
}
