"use client";

import { useMemo, useState, useTransition } from "react";
import { Latex } from "@/components/latex";
import {
  createAssumedKnowledge,
  updateAssumedKnowledge,
  deleteAssumedKnowledge,
  convertToCard,
} from "./actions";

type Entry = {
  id: string;
  category: string;
  prompt: string;
  answer: string;
  latex: string | null;
  notes: string | null;
};
type Topic = { id: string; label: string };

export function AssumedKnowledgeManager({
  shortCode,
  subjectId,
  topics,
  entries,
}: {
  shortCode: string;
  subjectId: string;
  topics: Topic[];
  entries: Entry[];
}) {
  const [pending, startTransition] = useTransition();
  const [drillMode, setDrillMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [category, setCategory] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [latex, setLatex] = useState("");

  const categories = useMemo(
    () => ["all", ...new Set(entries.map((e) => e.category))],
    [entries],
  );
  const visible = useMemo(
    () => (categoryFilter === "all" ? entries : entries.filter((e) => e.category === categoryFilter)),
    [entries, categoryFilter],
  );

  function handleCreate() {
    if (!category.trim() || !prompt.trim() || !answer.trim()) return;
    startTransition(async () => {
      await createAssumedKnowledge(
        shortCode,
        subjectId,
        category,
        prompt,
        answer,
        latex || null,
        null,
      );
      setPrompt("");
      setAnswer("");
      setLatex("");
    });
  }

  if (drillMode) {
    return <DrillMode entries={visible} onExit={() => setDrillMode(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-md border border-border p-4">
        <h2 className="text-sm font-medium">Add entry</h2>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. Exact trig values)"
          className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Prompt (e.g. sin(30°))"
          className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Answer (plain text)"
          className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
        <input
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          placeholder="LaTeX (optional, e.g. \frac{1}{2})"
          className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
        {latex.trim() && (
          <div className="rounded-md border border-dashed border-input p-2 text-sm">
            <Latex>{latex}</Latex>
          </div>
        )}
        <button
          onClick={handleCreate}
          disabled={pending}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="flex items-center justify-between">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={() => setDrillMode(true)}
          disabled={visible.length === 0}
          className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Drill mode
        </button>
      </div>

      <ul className="space-y-2">
        {visible.map((entry) => (
          <li key={entry.id} className="rounded-md border border-border p-3">
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {entry.category}
            </span>
            <p className="mt-1 text-sm font-medium">{entry.prompt}</p>
            <p className="text-sm text-muted-foreground">
              {entry.latex ? <Latex>{entry.latex}</Latex> : entry.answer}
            </p>
            <div className="mt-2 flex gap-3 text-xs">
              {topics.length > 0 && (
                <button
                  onClick={() =>
                    startTransition(() => convertToCard(shortCode, entry.id, topics[0].id))
                  }
                  disabled={pending}
                  className="text-muted-foreground underline"
                >
                  Make flashcard
                </button>
              )}
              <button
                onClick={() =>
                  startTransition(() => deleteAssumedKnowledge(shortCode, entry.id))
                }
                disabled={pending}
                className="text-destructive underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        )}
      </ul>
    </div>
  );
}

function DrillMode({ entries, onExit }: { entries: Entry[]; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const current = entries[index];

  if (!current) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-lg font-medium">Drill complete.</p>
        <button onClick={onExit} className="text-muted-foreground underline">
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <button onClick={onExit} className="text-muted-foreground underline">
          Exit drill
        </button>
        <span className="text-muted-foreground">
          {index + 1} / {entries.length}
        </span>
      </div>
      <div className="min-h-32 rounded-md border border-border p-6 text-center">
        <p className="text-lg">{current.prompt}</p>
        {revealed && (
          <>
            <hr className="my-4 border-border" />
            <p className="text-lg">
              {current.latex ? <Latex>{current.latex}</Latex> : current.answer}
            </p>
          </>
        )}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
          >
            Reveal
          </button>
        ) : (
          <button
            onClick={() => {
              setRevealed(false);
              setIndex((i) => i + 1);
            }}
            className="rounded-md border border-input px-6 py-2 text-sm"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
