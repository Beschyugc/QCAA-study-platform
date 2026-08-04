"use client";

import { useRef, useState, useTransition } from "react";
import { createPastPaper } from "./actions";

export function UploadForm({ shortCode, subjectId }: { shortCode: string; subjectId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    formData.set("subjectId", subjectId);
    setError(null);
    startTransition(async () => {
      try {
        await createPastPaper(shortCode, formData);
        formRef.current?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2 rounded-md border border-border p-4">
      <h2 className="text-sm font-medium">Upload paper</h2>
      <div className="flex gap-2">
        <input
          name="year"
          type="number"
          placeholder="Year"
          required
          className="w-24 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
        <input
          name="paperName"
          placeholder="Paper name (e.g. Paper 1)"
          required
          className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
        <input
          name="totalMarks"
          type="number"
          placeholder="Total marks"
          required
          className="w-32 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
        />
      </div>
      <label className="block text-xs text-muted-foreground">
        Question paper (required)
        <input name="questionPaper" type="file" accept=".pdf" required className="mt-1 block text-sm" />
      </label>
      <label className="block text-xs text-muted-foreground">
        Multiple choice paper (optional)
        <input name="mcPaper" type="file" accept=".pdf" className="mt-1 block text-sm" />
      </label>
      <label className="block text-xs text-muted-foreground">
        Marking guide (optional, enables self-marking + AI-assist)
        <input name="markingGuide" type="file" accept=".pdf" className="mt-1 block text-sm" />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
