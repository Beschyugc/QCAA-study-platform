"use client";

import { useTransition } from "react";
import { generateWeeklyReview } from "./actions";

type Review = {
  weekStart: string;
  stats: Record<string, unknown>;
  aiSummary: string | null;
  aiRecommendations: string | null;
};

export function WeeklyReviewClient({ reviews }: { reviews: Review[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <button
        onClick={() => startTransition(() => generateWeeklyReview())}
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Generating…" : "Generate this week's review"}
      </button>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews generated yet.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.weekStart} className="rounded-md border border-border p-4">
              <h2 className="mb-2 text-sm font-medium">
                Week of {new Date(review.weekStart).toLocaleDateString()}
              </h2>
              {review.aiSummary && <p className="mb-2 text-sm">{review.aiSummary}</p>}
              {review.aiRecommendations && (
                <p className="mb-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {review.aiRecommendations}
                </p>
              )}
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Raw stats</summary>
                <pre className="mt-1 overflow-x-auto">{JSON.stringify(review.stats, null, 2)}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
