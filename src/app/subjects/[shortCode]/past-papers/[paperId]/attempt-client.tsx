"use client";

import { useState, useTransition } from "react";
import {
  startAttempt,
  addResponse,
  deleteResponse,
  finishAttempt,
  awardMarks,
  aiSuggestMark,
} from "./actions";

type Topic = { id: string; label: string };
type ErrorCategory =
  | "conceptual_gap"
  | "calculation_error"
  | "misread_question"
  | "ran_out_of_time"
  | "poor_communication";
type Response = {
  id: string;
  questionNumber: string;
  marksAvailable: number;
  marksAwarded: number | null;
  topicId: string | null;
  myAnswer: string;
  errorCategory: ErrorCategory | null;
};
type Attempt = {
  id: string;
  completedAt: string | null;
  percentage: number | null;
  rawScore: number | null;
  responses: Response[];
};

const ERROR_CATEGORIES: { value: ErrorCategory; label: string }[] = [
  { value: "conceptual_gap", label: "Conceptual gap" },
  { value: "calculation_error", label: "Calculation error" },
  { value: "misread_question", label: "Misread question" },
  { value: "ran_out_of_time", label: "Ran out of time" },
  { value: "poor_communication", label: "Poor communication" },
];

export function AttemptClient({
  shortCode,
  paperId,
  totalMarks,
  hasMarkingGuide,
  topics,
  attempt,
  previousAttempts,
}: {
  shortCode: string;
  paperId: string;
  totalMarks: number;
  hasMarkingGuide: boolean;
  topics: Topic[];
  attempt: Attempt | null;
  previousAttempts: { percentage: number | null; startedAt: string }[];
}) {
  const [pending, startTransition] = useTransition();

  if (!attempt) {
    return <StartPanel shortCode={shortCode} paperId={paperId} />;
  }

  if (!attempt.completedAt) {
    return (
      <ResponseEntryPanel
        shortCode={shortCode}
        paperId={paperId}
        attempt={attempt}
        topics={topics}
      />
    );
  }

  const allMarked = attempt.responses.every((r) => r.marksAwarded !== null);
  if (!allMarked) {
    return (
      <MarkingPanel
        shortCode={shortCode}
        paperId={paperId}
        attempt={attempt}
        hasMarkingGuide={hasMarkingGuide}
      />
    );
  }

  return (
    <ResultsPanel
      totalMarks={totalMarks}
      attempt={attempt}
      topics={topics}
      previousAttempts={previousAttempts}
      onRetry={() =>
        startTransition(async () => {
          await startAttempt(shortCode, paperId, "untimed");
        })
      }
      pending={pending}
    />
  );
}

function StartPanel({ shortCode, paperId }: { shortCode: string; paperId: string }) {
  const [conditions, setConditions] = useState<"timed" | "open" | "untimed">("timed");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <div className="flex gap-2">
        {(["timed", "open", "untimed"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setConditions(c)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              conditions === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <button
        onClick={() =>
          startTransition(async () => {
            await startAttempt(shortCode, paperId, conditions);
          })
        }
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Starting…" : "Start attempt"}
      </button>
    </div>
  );
}

function ResponseEntryPanel({
  shortCode,
  paperId,
  attempt,
  topics,
}: {
  shortCode: string;
  paperId: string;
  attempt: Attempt;
  topics: Topic[];
}) {
  const [pending, startTransition] = useTransition();
  const [questionNumber, setQuestionNumber] = useState("");
  const [marksAvailable, setMarksAvailable] = useState(1);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [answer, setAnswer] = useState("");

  function handleAdd() {
    if (!questionNumber.trim() || !answer.trim()) return;
    startTransition(async () => {
      await addResponse(shortCode, paperId, attempt.id, questionNumber, marksAvailable, topicId || null, answer);
      setQuestionNumber("");
      setAnswer("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-md border border-border p-4">
        <div className="flex gap-2">
          <input
            value={questionNumber}
            onChange={(e) => setQuestionNumber(e.target.value)}
            placeholder="Q#"
            className="w-16 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          />
          <input
            type="number"
            value={marksAvailable}
            onChange={(e) => setMarksAvailable(Number(e.target.value))}
            className="w-20 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          />
          {topics.length > 0 && (
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer…"
          rows={3}
          className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={pending}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Add response
        </button>
      </div>

      <ul className="space-y-1">
        {attempt.responses.map((r) => (
          <li key={r.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <span className="flex-1">
              Q{r.questionNumber} ({r.marksAvailable} marks): {r.myAnswer.slice(0, 60)}
              {r.myAnswer.length > 60 ? "…" : ""}
            </span>
            <button
              onClick={() => startTransition(() => deleteResponse(shortCode, paperId, r.id))}
              className="text-xs text-destructive underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => startTransition(() => finishAttempt(shortCode, paperId, attempt.id))}
        disabled={pending || attempt.responses.length === 0}
        className="rounded-md border border-input px-4 py-2 text-sm disabled:opacity-50"
      >
        Finish attempt
      </button>
    </div>
  );
}

function MarkingPanel({
  shortCode,
  paperId,
  attempt,
  hasMarkingGuide,
}: {
  shortCode: string;
  paperId: string;
  attempt: Attempt;
  hasMarkingGuide: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Mark each response against the guide.
      </p>
      {attempt.responses.map((r) => (
        <ResponseMarker
          key={r.id}
          shortCode={shortCode}
          paperId={paperId}
          response={r}
          hasMarkingGuide={hasMarkingGuide}
        />
      ))}
    </div>
  );
}

function ResponseMarker({
  shortCode,
  paperId,
  response,
  hasMarkingGuide,
}: {
  shortCode: string;
  paperId: string;
  response: Response;
  hasMarkingGuide: boolean;
}) {
  const [marks, setMarks] = useState(response.marksAwarded ?? 0);
  const [errorCategory, setErrorCategory] = useState<ErrorCategory | "">("");
  const [aiSuggestion, setAiSuggestion] = useState<{ marks: number; explanation: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function suggest() {
    setAiError(null);
    startTransition(async () => {
      const result = await aiSuggestMark(shortCode, paperId, response.id);
      if (result.error) {
        setAiError(result.error);
        return;
      }
      setAiSuggestion({ marks: result.suggestedMarks!, explanation: result.explanation! });
    });
  }

  function save() {
    startTransition(() =>
      awardMarks(shortCode, paperId, response.id, marks, errorCategory || null, aiSuggestion?.explanation ?? null),
    );
  }

  return (
    <div className="rounded-md border border-border p-3">
      <p className="mb-1 text-xs text-muted-foreground">
        Q{response.questionNumber} — {response.marksAvailable} marks available
      </p>
      <p className="mb-2 whitespace-pre-wrap text-sm">{response.myAnswer}</p>

      {aiSuggestion && (
        <div className="mb-2 rounded-md bg-muted p-2 text-xs">
          AI suggests {aiSuggestion.marks}/{response.marksAvailable}: {aiSuggestion.explanation}
        </div>
      )}
      {aiError && <p className="mb-2 text-xs text-destructive">{aiError}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={marks}
          onChange={(e) => setMarks(Number(e.target.value))}
          min={0}
          max={response.marksAvailable}
          className="w-16 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
        <span className="text-xs text-muted-foreground">/ {response.marksAvailable}</span>
        <select
          value={errorCategory}
          onChange={(e) => setErrorCategory(e.target.value as ErrorCategory)}
          className="rounded-md border border-input bg-transparent px-2 py-1 text-xs"
        >
          <option value="">No error category</option>
          {ERROR_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {hasMarkingGuide && (
          <button onClick={suggest} disabled={pending} className="text-xs text-muted-foreground underline">
            AI suggest
          </button>
        )}
        <button
          onClick={save}
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          Save
        </button>
        {response.marksAwarded !== null && (
          <span className="text-xs text-green-600">saved: {response.marksAwarded}</span>
        )}
      </div>
    </div>
  );
}

function ResultsPanel({
  totalMarks,
  attempt,
  topics,
  previousAttempts,
  onRetry,
  pending,
}: {
  totalMarks: number;
  attempt: Attempt;
  topics: Topic[];
  previousAttempts: { percentage: number | null; startedAt: string }[];
  onRetry: () => void;
  pending: boolean;
}) {
  const topicLabel = new Map(topics.map((t) => [t.id, t.label]));
  const byTopic = new Map<string, { available: number; awarded: number }>();
  for (const r of attempt.responses) {
    const key = r.topicId ?? "untagged";
    const entry = byTopic.get(key) ?? { available: 0, awarded: 0 };
    entry.available += r.marksAvailable;
    entry.awarded += r.marksAwarded ?? 0;
    byTopic.set(key, entry);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border p-4 text-center">
        <p className="text-3xl font-semibold">{attempt.percentage?.toFixed(0)}%</p>
        <p className="text-sm text-muted-foreground">
          {attempt.rawScore} / {totalMarks} marks
        </p>
      </div>

      {previousAttempts.length > 1 && (
        <div className="text-sm">
          <p className="mb-1 font-medium">Previous attempts</p>
          <ul className="text-xs text-muted-foreground">
            {previousAttempts.map((a, i) => (
              <li key={i}>
                {new Date(a.startedAt).toLocaleDateString()}: {a.percentage?.toFixed(0)}%
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1 text-sm font-medium">Breakdown by topic</p>
        <ul className="space-y-1 text-sm">
          {[...byTopic.entries()].map(([topicId, { available, awarded }]) => (
            <li key={topicId} className="flex justify-between rounded-md border border-border px-3 py-1.5">
              <span>{topicId === "untagged" ? "Untagged" : (topicLabel.get(topicId) ?? topicId)}</span>
              <span>
                {awarded}/{available} ({available > 0 ? Math.round((awarded / available) * 100) : 0}%)
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={onRetry} disabled={pending} className="rounded-md border border-input px-4 py-2 text-sm">
        Attempt again
      </button>
    </div>
  );
}
