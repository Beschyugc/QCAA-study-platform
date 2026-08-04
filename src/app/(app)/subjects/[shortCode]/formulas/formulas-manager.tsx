"use client";

import { useMemo, useState, useTransition } from "react";
import { Latex } from "@/components/latex";
import {
  createFormula,
  updateFormula,
  deleteFormula,
  convertFormulaToCard,
} from "./actions";

type Formula = {
  id: string;
  latex: string;
  plainText: string;
  description: string;
  category: string;
  onFormulaSheet: boolean;
};
type Topic = { id: string; label: string };

export function FormulasManager({
  shortCode,
  subjectId,
  topics,
  formulas,
}: {
  shortCode: string;
  subjectId: string;
  topics: Topic[];
  formulas: Formula[];
}) {
  const [pending, startTransition] = useTransition();
  const [showNotOnSheetOnly, setShowNotOnSheetOnly] = useState(false);
  const [drillMode, setDrillMode] = useState(false);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");

  const [latex, setLatex] = useState("");
  const [plainText, setPlainText] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [onSheet, setOnSheet] = useState(false);

  const visible = useMemo(
    () => (showNotOnSheetOnly ? formulas.filter((f) => !f.onFormulaSheet) : formulas),
    [formulas, showNotOnSheetOnly],
  );

  function handleCreate() {
    if (!latex.trim() || !description.trim()) return;
    startTransition(async () => {
      await createFormula(
        shortCode,
        subjectId,
        null,
        latex,
        plainText || latex,
        description,
        category || "General",
        onSheet,
      );
      setLatex("");
      setPlainText("");
      setDescription("");
    });
  }

  if (drillMode) {
    return (
      <DrillMode formulas={visible} onExit={() => setDrillMode(false)} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-md border border-border p-4">
        <h2 className="text-sm font-medium">Add formula</h2>
        <textarea
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          placeholder="LaTeX, e.g. \frac{d}{dx}e^x = e^x"
          rows={2}
          className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
        />
        {latex.trim() && (
          <div className="rounded-md border border-dashed border-input p-2 text-sm">
            <Latex block>{latex}</Latex>
          </div>
        )}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description — when/why you'd use this"
          className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. Differentiation)"
            className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          />
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={onSheet}
              onChange={(e) => setOnSheet(e.target.checked)}
            />
            On formula sheet
          </label>
        </div>
        <button
          onClick={handleCreate}
          disabled={pending}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={showNotOnSheetOnly}
            onChange={(e) => setShowNotOnSheetOnly(e.target.checked)}
          />
          Not on formula sheet only (must memorise)
        </label>
        <button
          onClick={() => setDrillMode(true)}
          disabled={visible.length === 0}
          className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Drill mode
        </button>
      </div>

      <ul className="space-y-2">
        {visible.map((f) => (
          <FormulaRow
            key={f.id}
            shortCode={shortCode}
            formula={f}
            topics={topics}
            defaultTopicId={topicId}
          />
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">No formulas yet.</p>
        )}
      </ul>
    </div>
  );
}

function FormulaRow({
  shortCode,
  formula,
  topics,
  defaultTopicId,
}: {
  shortCode: string;
  formula: Formula;
  topics: Topic[];
  defaultTopicId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="rounded-md border border-border p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5">{formula.category}</span>
        {formula.onFormulaSheet && (
          <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-green-600">
            on sheet
          </span>
        )}
      </div>
      <div className="mb-1">
        <Latex block>{formula.latex}</Latex>
      </div>
      <p className="text-sm text-muted-foreground">{formula.description}</p>
      <div className="mt-2 flex gap-3 text-xs">
        <button
          onClick={() =>
            startTransition(() =>
              updateFormula(shortCode, formula.id, {
                onFormulaSheet: !formula.onFormulaSheet,
              }),
            )
          }
          disabled={pending}
          className="text-muted-foreground underline"
        >
          {formula.onFormulaSheet ? "Mark not on sheet" : "Mark on sheet"}
        </button>
        {topics.length > 0 && (
          <button
            onClick={() =>
              startTransition(() =>
                convertFormulaToCard(shortCode, formula.id, defaultTopicId),
              )
            }
            disabled={pending}
            className="text-muted-foreground underline"
          >
            Make flashcard
          </button>
        )}
        <button
          onClick={() => startTransition(() => deleteFormula(shortCode, formula.id))}
          disabled={pending}
          className="text-destructive underline"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function DrillMode({ formulas, onExit }: { formulas: Formula[]; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reversed, setReversed] = useState(false); // false: show description, guess formula
  const current = formulas[index];

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

  function next() {
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <button onClick={onExit} className="text-muted-foreground underline">
          Exit drill
        </button>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={reversed}
            onChange={(e) => setReversed(e.target.checked)}
          />
          Show formula, guess description
        </label>
        <span className="text-muted-foreground">
          {index + 1} / {formulas.length}
        </span>
      </div>

      <div className="min-h-32 rounded-md border border-border p-6 text-center">
        {!reversed ? (
          <>
            <p className="text-lg">{current.description}</p>
            {revealed && (
              <>
                <hr className="my-4 border-border" />
                <Latex block>{current.latex}</Latex>
              </>
            )}
          </>
        ) : (
          <>
            <Latex block>{current.latex}</Latex>
            {revealed && (
              <>
                <hr className="my-4 border-border" />
                <p className="text-lg">{current.description}</p>
              </>
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
            Reveal
          </button>
        ) : (
          <button
            onClick={next}
            className="rounded-md border border-input px-6 py-2 text-sm"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
