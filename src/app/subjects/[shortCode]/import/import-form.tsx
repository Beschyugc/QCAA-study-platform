"use client";

import { useState, useTransition } from "react";
import { importCurriculum } from "./actions";

export function ImportForm({ shortCode }: { shortCode: string }) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setText(await file.text());
    if (file.name.endsWith(".json")) setFormat("json");
    else if (file.name.endsWith(".csv")) setFormat("csv");
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await importCurriculum(shortCode, format, text);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={format === "csv"}
            onChange={() => setFormat("csv")}
          />
          CSV
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={format === "json"}
            onChange={() => setFormat("json")}
          />
          JSON
        </label>
      </div>

      <input
        type="file"
        accept=".csv,.json"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-sm"
      />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          format === "csv"
            ? "unit_number,unit_title,topic_number,topic_title,subtopic_title,objective_text,qcaa_reference\n…"
            : "[{ \"number\": 3, \"title\": \"...\", \"topics\": [...] }]"
        }
        rows={14}
        className="w-full rounded-md border border-input bg-transparent p-2 font-mono text-xs"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={pending || !text.trim()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Importing…" : "Replace curriculum"}
      </button>
    </div>
  );
}
