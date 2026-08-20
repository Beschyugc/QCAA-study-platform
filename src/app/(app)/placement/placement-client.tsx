"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  ExamAnswer,
  ExamQuestion,
  ExamResult,
  FallbackPlacementCard,
  PlacementExam,
  PlacementResult,
  SelfGrade,
} from "@/lib/placement";
import type { QuestionFormat } from "@/lib/placement-blueprint";
import { ClozeText } from "@/components/cloze-text";
import { InlineMarkdown, Markdown } from "@/components/markdown";
import { Latex } from "@/components/latex";

type Stage = "pick" | "sitting" | "fallback" | "done";

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

const SECTION_LABEL: Record<QuestionFormat, string> = {
  mcq: "Section A · Multiple choice",
  short: "Section B · Short response",
  extended: "Section C · Extended response",
};

const BAND_LABEL: Record<string, string> = {
  simple_familiar: "simple familiar",
  complex_familiar: "complex familiar",
  complex_unfamiliar: "complex unfamiliar",
};

/**
 * A paper takes an hour and a half. Losing it to a stray refresh, a phone
 * locking, or a tab being closed by accident would be unforgivable, and there
 * is no table on the server to park it in — so it lives here, the same way the
 * study timer survives a browser restart.
 */
const STORAGE_KEY = "placement-in-progress";

type InProgress = { exam: PlacementExam; answers: Record<string, ExamAnswer>; startedAt: number };

function loadInProgress(): InProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InProgress;
    return parsed?.exam?.questions?.length ? parsed : null;
  } catch {
    return null;
  }
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PlacementClient({
  subjects,
}: {
  subjects: { code: SubjectCode; topics: number; objectives: number; rated: number }[];
}) {
  const [stage, setStage] = useState<Stage>("pick");
  const [code, setCode] = useState<SubjectCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // The paper being sat.
  const [exam, setExam] = useState<PlacementExam | null>(null);
  const [answers, setAnswers] = useState<Record<string, ExamAnswer>>({});
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [resumable, setResumable] = useState<InProgress | null>(null);

  // Fallback (no AI) state.
  const [fallbackCards, setFallbackCards] = useState<FallbackPlacementCard[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [grades, setGrades] = useState<Record<string, SelfGrade>>({});
  const [fallbackResults, setFallbackResults] = useState<PlacementResult[]>([]);

  // Offer to resume an unfinished paper before offering to start a new one.
  // localStorage can't be read while rendering on the server, so this is the
  // one place it has to happen after mount — same as the study timer does.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setResumable(loadInProgress()), []);

  // Persist on every change. Cheap — the paper is a few hundred KB at most —
  // and it means the answer typed a second before the battery died is saved.
  useEffect(() => {
    if (stage !== "sitting" || !exam || startedAt === null) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ exam, answers, startedAt }));
    } catch {
      // Out of quota: the paper still works, it just won't survive a reload.
    }
  }, [stage, exam, answers, startedAt]);

  useEffect(() => {
    if (stage !== "sitting" || startedAt === null) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [stage, startedAt]);

  // Memoised so the derived lists below aren't rebuilt on every keystroke of a
  // 45-question paper.
  const questions = useMemo(() => exam?.questions ?? [], [exam]);
  const current = questions[index];

  const answeredIds = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      const a = answers[q.id];
      if (!a) continue;
      if (q.format === "mcq" ? a.choice !== null : a.text.trim() !== "") set.add(q.id);
    }
    return set;
  }, [questions, answers]);

  const sections = useMemo(() => {
    const out: { format: QuestionFormat; from: number; to: number }[] = [];
    questions.forEach((q, i) => {
      const last = out[out.length - 1];
      if (last && last.format === q.format) last.to = i;
      else out.push({ format: q.format, from: i, to: i });
    });
    return out;
  }, [questions]);

  const setAnswer = useCallback((id: string, patch: Partial<ExamAnswer>) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...{ text: "", choice: null }, ...prev[id], ...patch, id },
    }));
  }, []);

  function begin(subject: SubjectCode) {
    setCode(subject);
    setError(null);
    start(async () => {
      const response = await startPlacement(subject);
      if (response.error || !response.exam) {
        setError(response.error ?? "Could not build the paper.");
        return;
      }
      setExam(response.exam);
      setAnswers({});
      setIndex(0);
      setStartedAt(Date.now());
      setConfirmFinish(false);
      setStage("sitting");
    });
  }

  function resume(saved: InProgress) {
    setExam(saved.exam);
    setAnswers(saved.answers ?? {});
    setCode(saved.exam.shortCode as SubjectCode);
    setStartedAt(saved.startedAt);
    setIndex(0);
    setConfirmFinish(false);
    setStage("sitting");
  }

  function discardSaved() {
    localStorage.removeItem(STORAGE_KEY);
    setResumable(null);
  }

  function beginFallback(subject: SubjectCode) {
    setCode(subject);
    setError(null);
    start(async () => {
      const response = await startFallbackPlacement(subject);
      if (response.error || !response.cards) {
        setError(response.error ?? "Could not build a card-based diagnostic.");
        return;
      }
      setFallbackCards(response.cards);
      setRevealed({});
      setGrades({});
      setStage("fallback");
    });
  }

  function finish() {
    if (!exam) return;
    setError(null);
    start(async () => {
      const payload: ExamAnswer[] = exam.questions.map(
        (q) => answers[q.id] ?? { id: q.id, text: "", choice: null },
      );
      const response = await submitPlacement(exam, payload);
      if (response.error || !response.result) {
        setError(response.error ?? "Could not mark the paper.");
        return;
      }
      // Only cleared once the marks are safely back — a failed submit must not
      // take the answers with it.
      localStorage.removeItem(STORAGE_KEY);
      setResumable(null);
      setResult(response.result);
      setStage("done");
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
        byTopic.set(card.topicId, [...(byTopic.get(card.topicId) ?? []), grade]);
      }
      const response = await submitFallbackPlacement(code, [...byTopic.entries()]);
      if (response.error || !response.results) {
        setError(response.error ?? "Could not save the ratings.");
        return;
      }
      setFallbackResults(response.results);
      setResult(null);
      setStage("done");
    });
  }

  // ---------------------------------------------------------------- pick ---

  if (stage === "pick") {
    return (
      <>
        {resumable && (
          <div className="mb-4 rounded-xl border border-[color:var(--streak-ember)] bg-[color:var(--surface)] px-4 py-3">
            <p className="text-xs font-semibold text-[color:var(--text)]">
              You&apos;ve got an unfinished {resumable.exam.shortCode} paper.
            </p>
            <p className="mt-1 text-[0.64rem] text-[color:var(--text-muted)]">
              {resumable.exam.questions.length} questions, started{" "}
              {new Date(resumable.startedAt).toLocaleString("en-AU", {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
              .
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => resume(resumable)}
                className="rounded-lg px-3 py-1.5 text-[0.64rem] font-semibold"
                style={{ background: "var(--state-good)", color: "#06231a" }}
              >
                Pick up where you left off
              </button>
              <button
                onClick={discardSaved}
                className="rounded-lg border border-[color:var(--hairline)] px-3 py-1.5 text-[0.64rem] font-semibold text-[color:var(--text-muted)]"
              >
                Bin it
              </button>
            </div>
          </div>
        )}

        <p className="max-w-xl text-xs text-[color:var(--text-muted)]">
          Pick a subject and you get a full paper on it — every dot point in the syllabus, in
          multiple choice, short response and extended response, including the topics still locked.
          Sit it in one go if you can: it runs about the length of a real external exam.
        </p>
        <p className="mt-2 max-w-xl text-xs text-[color:var(--text-muted)]">
          Answer what you can and skip what you can&apos;t — a blank is genuinely useful
          information, not a failure. Every dot point comes back red, amber or green on its own
          evidence, and that goes straight into what the planner tells you to do.
        </p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {subjects.map((subject) => {
            const line = LINES[subject.code];
            return (
              <li key={subject.code}>
                <button
                  onClick={() => begin(subject.code)}
                  disabled={pending || subject.objectives === 0}
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
                      {subject.objectives === 0
                        ? "No syllabus imported"
                        : `${subject.objectives} dot points · ${subject.topics} topics · 60-90 min`}
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
            Writing the paper from your syllabus — a few minutes. It&apos;s writing a question
            against every dot point, so give it a moment.
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

  // ------------------------------------------------------------- sitting ---

  if (stage === "sitting" && exam && current) {
    const line = code ? LINES[code] : null;
    const section = SECTION_LABEL[current.format];
    const overrun = elapsed > exam.estimatedMinutes * 60;
    const unanswered = questions.length - answeredIds.size;

    return (
      <div>
        <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-[color:var(--hairline)] bg-[color:var(--ink)] px-4 py-3 sm:-mx-7 sm:px-7">
          <div className="flex items-baseline justify-between gap-3">
            <p className="signage text-[0.64rem] font-bold text-[color:var(--text-muted)]">
              {section}
            </p>
            <p
              className="tabular text-xs font-semibold"
              style={{ color: overrun ? "var(--streak-ember)" : "var(--text-muted)" }}
            >
              {formatClock(elapsed)} / {exam.estimatedMinutes}:00
            </p>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color:var(--surface-raised)]">
              <div
                className="h-full rounded-full transition-[width] duration-[180ms]"
                style={{
                  width: `${(answeredIds.size / Math.max(1, questions.length)) * 100}%`,
                  background: line ? `var(--line-${line.slug})` : "var(--state-good)",
                }}
              />
            </div>
            <button
              onClick={() => setShowGrid((v) => !v)}
              className="tabular shrink-0 text-[0.64rem] text-[color:var(--text-muted)] underline-offset-2 hover:underline"
            >
              {index + 1} / {questions.length}
            </button>
          </div>

          {showGrid && (
            <div className="mt-3">
              {sections.map((s) => (
                <div key={s.format} className="mb-2">
                  <p className="signage text-[0.6rem] font-bold text-[color:var(--text-faint)]">
                    {SECTION_LABEL[s.format]}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {questions.slice(s.from, s.to + 1).map((q, offset) => {
                      const i = s.from + offset;
                      const done = answeredIds.has(q.id);
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setIndex(i);
                            setShowGrid(false);
                          }}
                          className={`tabular h-6 w-6 rounded text-[0.6rem] font-semibold ${
                            i === index
                              ? "bg-[color:var(--text)] text-[color:var(--ink)]"
                              : done
                                ? "bg-[color:var(--surface-raised)] text-[color:var(--text)]"
                                : "border border-[color:var(--hairline)] text-[color:var(--text-faint)]"
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {index === 0 && (
          <div className="mb-3 rounded-xl border border-[color:var(--hairline)] px-4 py-3">
            <p className="text-[0.64rem] leading-relaxed text-[color:var(--text-muted)]">
              {exam.questions.length} questions, {exam.totalMarks} marks, covering all{" "}
              {exam.coverage.total} dot points in {exam.shortCode}. Your answers save as you type —
              you can close this and come back.
            </p>
            {exam.unwritten > 0 && (
              <p className="mt-1.5 text-[0.64rem] leading-relaxed text-[color:var(--streak-ember)]">
                {exam.unwritten} of them couldn&apos;t be written as proper exam questions and are
                the raw syllabus wording instead. Still worth answering — just be aware they read
                like a checklist, not a paper.
              </p>
            )}
          </div>
        )}

        <QuestionCard
          question={current}
          number={index + 1}
          answer={answers[current.id]}
          onChange={(patch) => setAnswer(current.id, patch)}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-xl border border-[color:var(--hairline)] px-4 py-2.5 text-xs font-semibold text-[color:var(--text-muted)] disabled:opacity-40"
          >
            Back
          </button>
          {index < questions.length - 1 ? (
            <button
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="rounded-xl bg-[color:var(--state-good)] px-5 py-2.5 text-xs font-semibold text-[#06231a]"
            >
              Next
            </button>
          ) : (
            <span className="text-[0.64rem] text-[color:var(--text-faint)]">Last question.</span>
          )}
          <button
            onClick={() => setConfirmFinish(true)}
            disabled={pending}
            className="ml-auto rounded-xl border border-[color:var(--hairline)] px-4 py-2.5 text-xs font-semibold text-[color:var(--text-muted)]"
          >
            {pending ? "Marking…" : "Finish"}
          </button>
        </div>

        {confirmFinish && !pending && (
          <div className="mt-3 rounded-xl border border-[color:var(--streak-ember)] px-4 py-3">
            <p className="text-xs text-[color:var(--text)]">
              {unanswered === 0
                ? "Everything's answered. Mark it?"
                : `${unanswered} question${unanswered === 1 ? "" : "s"} still blank. Blanks count as not known — which is fine if that's true, and a waste of the paper if it isn't.`}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={finish}
                className="rounded-lg px-3 py-1.5 text-[0.64rem] font-semibold"
                style={{ background: "var(--state-good)", color: "#06231a" }}
              >
                Mark it
              </button>
              <button
                onClick={() => setConfirmFinish(false)}
                className="rounded-lg border border-[color:var(--hairline)] px-3 py-1.5 text-[0.64rem] font-semibold text-[color:var(--text-muted)]"
              >
                Keep going
              </button>
            </div>
          </div>
        )}

        {pending && (
          <p className="mt-3 text-xs text-[color:var(--text-muted)]">
            Marking every written answer against its marking points — a minute or two.
          </p>
        )}
        {error && <p className="mt-3 text-xs text-[color:var(--state-danger)]">{error}</p>}
      </div>
    );
  }

  // ------------------------------------------------------------ fallback ---

  if (stage === "fallback") {
    const line = code ? LINES[code] : null;
    const gradedCount = Object.keys(grades).length;
    return (
      <div>
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

  // ---------------------------------------------------------------- done ---

  return (
    <ResultsView
      code={code}
      result={result}
      fallbackResults={fallbackResults}
      exam={exam}
      answers={answers}
      onRestart={() => {
        setStage("pick");
        setResult(null);
        setFallbackResults([]);
        setExam(null);
        setAnswers({});
      }}
    />
  );
}

// ---------------------------------------------------------------------------

function QuestionCard({
  question,
  number,
  answer,
  onChange,
}: {
  question: ExamQuestion;
  number: number;
  answer: ExamAnswer | undefined;
  onChange: (patch: Partial<ExamAnswer>) => void;
}) {
  // Focus follows the question so tapping Next on a phone lands in the answer
  // box, rather than needing a second tap for every one of 45 questions.
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    textarea.current?.blur();
  }, [question.id]);

  return (
    <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="tabular text-[0.64rem] font-semibold text-[color:var(--text)]">
          Q{number}
        </span>
        <span className="tabular text-[0.64rem] text-[color:var(--text-faint)]">
          U{question.unitNumber} · {question.topicTitle}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="rounded bg-[color:var(--surface-raised)] px-1.5 py-0.5 text-[0.6rem] text-[color:var(--text-muted)]">
            {BAND_LABEL[question.band] ?? question.band}
          </span>
          <span className="tabular text-[0.64rem] font-semibold text-[color:var(--text-muted)]">
            {question.marks} {question.marks === 1 ? "mark" : "marks"}
          </span>
        </span>
      </div>
      <p className="mt-0.5 text-[0.6rem] text-[color:var(--text-faint)]">{question.subtopicTitle}</p>

      {question.stimulus && (
        <div className="mt-3 rounded-lg border border-[color:var(--hairline)] bg-[color:var(--surface-raised)] px-3 py-2.5">
          <Markdown>{question.stimulus}</Markdown>
        </div>
      )}

      <div className="mt-3 text-sm leading-relaxed text-[color:var(--text)]">
        <InlineMarkdown>{question.question}</InlineMarkdown>
      </div>

      {question.format === "mcq" && question.options ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {question.options.map((option, i) => {
            const chosen = answer?.choice === i;
            return (
              <li key={i}>
                <button
                  onClick={() => onChange({ choice: chosen ? null : i })}
                  className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                    chosen
                      ? "border-[color:var(--state-good)] bg-[color:var(--state-good)]/10 text-[color:var(--text)]"
                      : "border-[color:var(--hairline)] text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)]"
                  }`}
                >
                  <span className="tabular shrink-0 font-semibold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <InlineMarkdown>{option}</InlineMarkdown>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <textarea
          ref={textarea}
          value={answer?.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={question.format === "extended" ? 14 : 5}
          placeholder={
            question.format === "extended"
              ? "Take a position and argue it. Leave it blank if you'd have no idea in the exam."
              : "Answer as best you can — or leave it blank if you don't know."
          }
          className="mt-3 w-full rounded-lg border border-[color:var(--hairline)] bg-transparent p-3 text-xs leading-relaxed text-[color:var(--text)] outline-none focus:border-[color:var(--text-faint)]"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ResultsView({
  code,
  result,
  fallbackResults,
  exam,
  answers,
  onRestart,
}: {
  code: SubjectCode | null;
  result: ExamResult | null;
  fallbackResults: PlacementResult[];
  exam: PlacementExam | null;
  answers: Record<string, ExamAnswer>;
  onRestart: () => void;
}) {
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [showPaper, setShowPaper] = useState(false);

  const topics = result ? result.topics : fallbackResults;
  const percent =
    result && result.available > 0 ? Math.round((result.awarded / result.available) * 100) : null;

  const byTopic = useMemo(() => {
    const map = new Map<string, ExamResult["objectives"]>();
    for (const objective of result?.objectives ?? []) {
      map.set(objective.topicId, [...(map.get(objective.topicId) ?? []), objective]);
    }
    return map;
  }, [result]);

  const markById = useMemo(
    () => new Map((result?.marks ?? []).map((m) => [m.id, m])),
    [result],
  );

  return (
    <>
      <h2 className="font-display text-lg text-[color:var(--text)]">Here&apos;s where you are</h2>
      {percent !== null && result ? (
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          <span className="tabular font-semibold text-[color:var(--text)]">
            {result.awarded}/{result.available}
          </span>{" "}
          — {percent}%. Every dot point below is now rated on what you actually wrote, and the
          planner is already using it.
        </p>
      ) : (
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          Saved. Every topic below is now rated, and the planner is already using it.
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {topics.map((topic) => {
          const dotPoints = byTopic.get(topic.topicId) ?? [];
          const open = openTopic === topic.topicId;
          return (
            <li
              key={topic.topicId}
              className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3"
            >
              <button
                onClick={() => setOpenTopic(open ? null : topic.topicId)}
                disabled={dotPoints.length === 0}
                className="flex w-full items-center gap-2.5 text-left"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: RAG_COLOUR[topic.rag] }}
                  aria-label={topic.rag}
                />
                <span className="min-w-0 flex-1 text-xs font-semibold text-[color:var(--text)]">
                  {topic.topicTitle}
                </span>
                <span
                  className="signage text-[0.64rem] font-bold"
                  style={{ color: RAG_COLOUR[topic.rag] }}
                >
                  {topic.rag}
                </span>
              </button>
              <p className="mt-1.5 text-[0.64rem] text-[color:var(--text-muted)]">{topic.verdict}</p>

              {open && dotPoints.length > 0 && (
                <ul className="mt-2.5 flex flex-col gap-1.5 border-t border-[color:var(--hairline)] pt-2.5">
                  {dotPoints.map((objective) => (
                    <li key={objective.objectiveId} className="flex items-start gap-2">
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: RAG_COLOUR[objective.rag] }}
                        aria-label={objective.rag}
                      />
                      <span className="text-[0.64rem] leading-relaxed text-[color:var(--text-muted)]">
                        {objective.text}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {result && exam && (
        <div className="mt-4">
          <button
            onClick={() => setShowPaper((v) => !v)}
            className="text-xs font-semibold text-[color:var(--text-muted)] underline-offset-2 hover:underline"
          >
            {showPaper ? "Hide the marked paper" : "Go through the marked paper"}
          </button>

          {showPaper && (
            <ol className="mt-3 flex flex-col gap-3">
              {exam.questions.map((question, i) => {
                const mark = markById.get(question.id);
                const answer = answers[question.id];
                return (
                  <li
                    key={question.id}
                    className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="tabular text-[0.64rem] font-semibold text-[color:var(--text)]">
                        Q{i + 1}
                      </span>
                      <span className="tabular text-[0.6rem] text-[color:var(--text-faint)]">
                        {question.topicTitle}
                      </span>
                      <span
                        className="tabular ml-auto text-[0.64rem] font-semibold"
                        style={{
                          color:
                            !mark || mark.awarded === 0
                              ? "var(--state-danger)"
                              : mark.awarded === mark.marks
                                ? "var(--state-good)"
                                : "var(--streak-ember)",
                        }}
                      >
                        {mark?.awarded ?? 0}/{question.marks}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-[color:var(--text)]">
                      <InlineMarkdown>{question.question}</InlineMarkdown>
                    </div>

                    {question.format === "mcq" && question.options ? (
                      <ul className="mt-2 flex flex-col gap-1">
                        {question.options.map((option, oi) => {
                          const isCorrect = oi === question.correctIndex;
                          const isChosen = answer?.choice === oi;
                          if (!isCorrect && !isChosen) return null;
                          return (
                            <li
                              key={oi}
                              className="flex items-start gap-2 text-[0.64rem]"
                              style={{
                                color: isCorrect ? "var(--state-good)" : "var(--state-danger)",
                              }}
                            >
                              <span className="tabular shrink-0 font-semibold">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <InlineMarkdown>{option}</InlineMarkdown>
                                {isCorrect ? " — the answer" : " — what you picked"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <>
                        <p className="mt-2 whitespace-pre-wrap text-[0.64rem] text-[color:var(--text-muted)]">
                          {answer?.text?.trim() || "(you left this blank)"}
                        </p>
                        {question.markingPoints.length > 0 && (
                          <ul className="mt-2 border-t border-[color:var(--hairline)] pt-2">
                            {question.markingPoints.map((point, pi) => (
                              <li
                                key={pi}
                                className="text-[0.6rem] leading-relaxed text-[color:var(--text-faint)]"
                              >
                                · {point}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}

                    {mark?.feedback && (
                      <p className="mt-2 text-[0.64rem] leading-relaxed text-[color:var(--text-muted)]">
                        {mark.feedback}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={code ? `/subjects/${code}` : "/"}
          className="rounded-xl bg-[color:var(--state-good)] px-5 py-2.5 text-xs font-semibold text-[#06231a]"
        >
          Go to {code}
        </Link>
        <button
          onClick={onRestart}
          className="rounded-xl border border-[color:var(--hairline)] px-5 py-2.5 text-xs font-semibold text-[color:var(--text-muted)]"
        >
          Do another subject
        </button>
      </div>
    </>
  );
}
