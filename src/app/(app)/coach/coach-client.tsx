"use client";

import { useState, useTransition } from "react";
import { getCoachAnalysis } from "./actions";

export function CoachClient({ pastCheckIns }: { pastCheckIns: { date: string; content: string }[] }) {
  const [result, setResult] = useState<{ analysis: string; recommendations: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const r = await getCoachAnalysis();
      if (r.error) {
        setError(r.error);
        return;
      }
      setResult({ analysis: r.analysis!, recommendations: r.recommendations! });
    });
  }

  return (
    <div className="space-y-6">
      <button
        onClick={run}
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Analyzing…" : "Get check-in"}
      </button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="rounded-md border border-border p-4">
          <p className="mb-3 text-sm">{result.analysis}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{result.recommendations}</p>
        </div>
      )}

      {pastCheckIns.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium">Past check-ins</h2>
          <ul className="space-y-2">
            {pastCheckIns.map((c) => (
              <li key={c.date} className="rounded-md border border-border p-3 text-sm">
                <p className="mb-1 text-xs text-muted-foreground">
                  {new Date(c.date).toLocaleDateString()}
                </p>
                <p className="whitespace-pre-wrap">{c.content}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
