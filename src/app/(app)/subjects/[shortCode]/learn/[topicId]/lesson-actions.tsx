"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { buildLesson } from "../actions";

export function LessonActions({
  shortCode,
  topicId,
  hasLesson,
}: {
  shortCode: string;
  topicId: string;
  hasLesson: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run() {
    setError(null);
    start(async () => {
      const result = await buildLesson(shortCode, topicId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={run}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-60"
          style={{ background: hasLesson ? "transparent" : "var(--line)", color: hasLesson ? "var(--text-muted)" : "#0f1420", border: hasLesson ? "1px solid var(--hairline)" : "none" }}
        >
          {hasLesson ? (
            <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} aria-hidden />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          )}
          {pending ? "Writing…" : hasLesson ? "Rewrite lesson" : "Write the lesson"}
        </button>

        <Link
          href={`/subjects/${shortCode}/reviewer?topicId=${topicId}`}
          className="inline-flex items-center rounded-xl border border-[color:var(--hairline)] px-4 py-2.5 text-xs font-semibold text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
        >
          Drill the cards →
        </Link>

        <Link
          href={`/subjects/${shortCode}/tutor?topicId=${topicId}`}
          className="inline-flex items-center rounded-xl border border-[color:var(--hairline)] px-4 py-2.5 text-xs font-semibold text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
        >
          Ask about this topic
        </Link>
      </div>

      {error && <p className="mt-2 text-xs text-[color:var(--state-danger)]">{error}</p>}
      {pending && (
        <p className="mt-2 text-[0.64rem] text-[color:var(--text-faint)]">
          Writing a full lesson takes about a minute — leave this tab open.
        </p>
      )}
    </>
  );
}
