"use client";

import { useState, useTransition } from "react";
import {
  generateCardsFromText,
  extractTextFromFile,
  saveGeneratedCards,
  type DraftCard,
} from "./actions";

type Topic = { id: string; label: string };
type ReviewCard = DraftCard & { accepted: boolean };

export function GenerateClient({
  shortCode,
  subjectId,
  topics,
}: {
  shortCode: string;
  subjectId: string;
  topics: Topic[];
}) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [topicLabel, setTopicLabel] = useState(topics[0]?.label ?? "");
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState<ReviewCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();
  const [extracting, startExtract] = useTransition();
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleFile(file: File) {
    setError(null);
    startExtract(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await extractTextFromFile(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotes(result.text ?? "");
    });
  }

  function handleGenerate() {
    if (!notes.trim() || !topicId) return;
    setError(null);
    startGenerate(async () => {
      const result = await generateCardsFromText(topicLabel, notes);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDrafts(result.cards!.map((c) => ({ ...c, accepted: true })));
      setSaved(false);
    });
  }

  function handleSave() {
    const accepted = drafts?.filter((d) => d.accepted) ?? [];
    if (accepted.length === 0) return;
    startSave(async () => {
      await saveGeneratedCards(shortCode, subjectId, topicId, accepted);
      setSaved(true);
      setDrafts(null);
      setNotes("");
    });
  }

  return (
    <div className="space-y-4">
      <select
        value={topicId}
        onChange={(e) => {
          setTopicId(e.target.value);
          setTopicLabel(topics.find((t) => t.id === e.target.value)?.label ?? "");
        }}
        className="w-full rounded-md border border-input bg-transparent px-2 py-2 text-sm"
      >
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>

      {!drafts && (
        <>
          <input
            type="file"
            accept=".pdf,.txt"
            disabled={extracting}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="block text-sm"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste notes here, or upload a PDF/text file above…"
            rows={10}
            className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={generating || extracting || !notes.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate cards"}
          </button>
        </>
      )}

      {drafts && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {drafts.filter((d) => d.accepted).length} of {drafts.length} selected. Edit, uncheck, or delete before saving.
          </p>
          <ul className="space-y-2">
            {drafts.map((d, i) => (
              <li key={i} className="rounded-md border border-border p-3">
                <div className="mb-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={d.accepted}
                    onChange={() =>
                      setDrafts((prev) =>
                        prev!.map((c, idx) => (idx === i ? { ...c, accepted: !c.accepted } : c)),
                      )
                    }
                  />
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{d.cardType}</span>
                </div>
                <textarea
                  value={d.front}
                  onChange={(e) =>
                    setDrafts((prev) =>
                      prev!.map((c, idx) => (idx === i ? { ...c, front: e.target.value } : c)),
                    )
                  }
                  rows={2}
                  className="mb-1 w-full rounded border border-input bg-transparent p-1 text-sm"
                />
                <textarea
                  value={d.back}
                  onChange={(e) =>
                    setDrafts((prev) =>
                      prev!.map((c, idx) => (idx === i ? { ...c, back: e.target.value } : c)),
                    )
                  }
                  rows={2}
                  className="w-full rounded border border-input bg-transparent p-1 text-sm"
                />
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || drafts.filter((d) => d.accepted).length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : `Save ${drafts.filter((d) => d.accepted).length} cards`}
            </button>
            <button onClick={() => setDrafts(null)} className="text-sm text-muted-foreground underline">
              Discard
            </button>
          </div>
        </div>
      )}

      {saved && <p className="text-sm text-green-600">Saved.</p>}
    </div>
  );
}
