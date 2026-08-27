"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, Minus, X } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { LINES, type SubjectCode } from "@/config/tokens";
import { saveBankResponse } from "./actions";

export type BankResponseView = {
  id: string;
  response: string;
  revealedWorking: boolean;
  verdict: "correct" | "partial" | "wrong" | null;
  feedback: string | null;
  createdAt: string;
};

export type BankQuestionView = {
  id: string;
  source: string;
  sourceKind: "qcaa" | "generated";
  topicTag: string;
  prompt: string;
  working: string;
  answer: string;
  marks: number;
  difficulty: number;
  subjectCode: string;
  responses: BankResponseView[];
};

export function BankClient({
  questions,
  subjects,
  activeSubject,
  showingAll,
  unmarkedCount,
  pinnedIds,
}: {
  questions: BankQuestionView[];
  subjects: { shortCode: string; name: string }[];
  activeSubject: string | null;
  showingAll: boolean;
  unmarkedCount: number;
  pinnedIds: string[];
}) {
  return (
    <div>
      <header className="mb-5">
        <h1 className="mb-1 text-2xl font-semibold">Question bank</h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          Answer it, then reveal the working. Nothing gets marked here — your answers are just
          kept, and Claude marks them in bulk when you ask.
        </p>
        {unmarkedCount > 0 && (
          <p className="mt-2 text-xs text-[color:var(--text-faint)]">
            {unmarkedCount} answer{unmarkedCount === 1 ? "" : "s"} waiting to be marked. Say
            &ldquo;mark my bank answers&rdquo; in a session.
          </p>
        )}
      </header>

      {pinnedIds.length === 0 && (
        <nav className="mb-5 flex flex-wrap gap-1.5">
          <FilterLink href="/bank" active={!activeSubject && !showingAll}>
            Unanswered
          </FilterLink>
          <FilterLink href="/bank?all=1" active={!activeSubject && showingAll}>
            All
          </FilterLink>
          {subjects.map((s) => (
            <FilterLink
              key={s.shortCode}
              href={`/bank?subject=${s.shortCode}&all=1`}
              active={activeSubject === s.shortCode}
            >
              {s.shortCode}
            </FilterLink>
          ))}
        </nav>
      )}

      {questions.length === 0 ? (
        <p className="py-10 text-center text-sm text-[color:var(--text-muted)]">
          Nothing here. {showingAll ? "The bank is empty for this filter." : "Everything in this filter has an answer logged — try All."}
        </p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`signage rounded-md border px-2.5 py-1 text-[0.7rem] font-semibold transition-colors ${
        active
          ? "border-[color:var(--text-faint)] bg-[color:var(--surface-raised)] text-[color:var(--text)]"
          : "border-[color:var(--hairline)] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
      }`}
    >
      {children}
    </Link>
  );
}

function QuestionCard({ question }: { question: BankQuestionView }) {
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const line = LINES[question.subjectCode as SubjectCode];

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await saveBankResponse({
          questionId: question.id,
          response: answer,
          revealedWorking: revealed,
          confidence,
        });
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save.");
      }
    });
  }

  return (
    <li className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--surface)] p-4">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        {line && (
          <span
            className="signage rounded-full px-1.5 py-px text-[0.64rem] font-bold"
            style={{
              background: `var(--line-${line.slug}-dim)`,
              color: `var(--line-${line.slug}-bright)`,
            }}
          >
            {question.subjectCode}
          </span>
        )}
        <span className="signage text-[0.64rem] font-semibold text-[color:var(--text-faint)]">
          {question.topicTag}
        </span>
        <span className="text-[0.64rem] text-[color:var(--text-faint)]">
          {question.marks} mark{question.marks === 1 ? "" : "s"}
        </span>
        <span
          className={`ml-auto text-[0.64rem] ${
            question.sourceKind === "qcaa"
              ? "text-[color:var(--text-muted)]"
              : "text-[color:var(--text-faint)]"
          }`}
          title={
            question.sourceKind === "qcaa"
              ? "A real QCAA external question"
              : "Written to target a specific objective — good practice, but not what QCAA actually asked"
          }
        >
          {question.source}
        </span>
      </div>

      <div className="text-sm">
        <Markdown>{question.prompt}</Markdown>
      </div>

      {question.responses.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-l-2 border-[color:var(--hairline)] pl-3">
          {question.responses.map((r) => (
            <li key={r.id} className="text-xs">
              <span className="tabular text-[color:var(--text-faint)]">{r.createdAt}</span>
              <VerdictTag verdict={r.verdict} />
              {r.revealedWorking && (
                <span className="ml-1.5 text-[0.64rem] text-[color:var(--text-faint)]">
                  (peeked)
                </span>
              )}
              <p className="mt-0.5 whitespace-pre-wrap text-[color:var(--text-muted)]">
                {r.response}
              </p>
              {r.feedback && (
                <p className="mt-0.5 text-[color:var(--text-faint)]">{r.feedback}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <label className="mt-3 block">
        <span className="sr-only">Your answer</span>
        <textarea
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setSaved(false);
          }}
          rows={3}
          placeholder="Your answer and working..."
          className="w-full rounded-md border border-[color:var(--hairline)] bg-[color:var(--surface-raised)] p-2 text-sm"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setRevealed((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-[color:var(--hairline)] px-2 py-1 text-xs text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]"
        >
          {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {revealed ? "Hide working out" : "Show working out"}
        </button>

        <span className="ml-auto flex items-center gap-1">
          <span className="text-[0.64rem] text-[color:var(--text-faint)]">Felt:</span>
          {[
            { v: 3, label: "Solid" },
            { v: 2, label: "Shaky" },
            { v: 1, label: "Guessed" },
          ].map((c) => (
            <button
              key={c.v}
              onClick={() => setConfidence(confidence === c.v ? null : c.v)}
              className={`rounded-md border px-1.5 py-1 text-[0.64rem] transition-colors ${
                confidence === c.v
                  ? "border-[color:var(--text-faint)] bg-[color:var(--surface-raised)] text-[color:var(--text)]"
                  : "border-[color:var(--hairline)] text-[color:var(--text-faint)] hover:text-[color:var(--text-muted)]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </span>

        <button
          onClick={save}
          disabled={pending || !answer.trim()}
          className="rounded-md border border-[color:var(--text-faint)] bg-[color:var(--surface-raised)] px-2.5 py-1 text-xs font-medium transition-opacity disabled:opacity-40"
        >
          {saved ? "Saved" : pending ? "Saving..." : "Save answer"}
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs text-[color:var(--state-danger)]">{error}</p>}

      {revealed && (
        <div className="mt-3 rounded-md border border-dashed border-[color:var(--hairline)] bg-[color:var(--surface-raised)] p-3">
          <p className="signage mb-1.5 text-[0.64rem] font-bold text-[color:var(--text-faint)]">
            WORKING OUT
          </p>
          <div className="text-sm text-[color:var(--text-muted)]">
            <Markdown>{question.working}</Markdown>
          </div>
          <p className="signage mt-3 mb-1 text-[0.64rem] font-bold text-[color:var(--text-faint)]">
            ANSWER
          </p>
          <div className="text-sm">
            <Markdown>{question.answer}</Markdown>
          </div>
        </div>
      )}
    </li>
  );
}

function VerdictTag({ verdict }: { verdict: BankResponseView["verdict"] }) {
  if (!verdict) {
    return (
      <span className="ml-1.5 text-[0.64rem] text-[color:var(--text-faint)]">not marked yet</span>
    );
  }
  const map = {
    correct: { Icon: Check, label: "correct" },
    partial: { Icon: Minus, label: "partial" },
    wrong: { Icon: X, label: "wrong" },
  } as const;
  const { Icon, label } = map[verdict];
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[0.64rem] text-[color:var(--text-muted)]">
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
