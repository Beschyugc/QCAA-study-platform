"use client";

import { useState, useTransition } from "react";
import { extractSyllabus } from "./actions";
import { importCurriculum } from "../import/actions";

export function UploadForm({ shortCode }: { shortCode: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [extracting, startExtract] = useTransition();
  const [saving, startSave] = useTransition();

  function handleExtract() {
    if (!file) return;
    setError(null);
    startExtract(async () => {
      try {
        const formData = new FormData();
        formData.set("file", file);
        const result = await extractSyllabus(shortCode, formData);
        setJson(JSON.stringify(JSON.parse(result), null, 2));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Extraction failed");
      }
    });
  }

  function handleSave() {
    setError(null);
    startSave(async () => {
      try {
        await importCurriculum(shortCode, "json", json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          onClick={handleExtract}
          disabled={!file || extracting}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {extracting ? "Extracting…" : "Extract"}
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {json && (
        <>
          <p className="text-sm text-muted-foreground">
            Review and edit before saving — this is a draft, not final.
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={20}
            className="w-full rounded-md border border-input bg-transparent p-2 font-mono text-xs"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save (replaces existing curriculum)"}
          </button>
        </>
      )}
    </div>
  );
}
