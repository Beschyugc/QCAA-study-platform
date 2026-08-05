"use client";

import { useState, useTransition } from "react";
import type { TopicRecommendation } from "@/lib/recommendation-data";
import { generateDailyPlan, updatePlanItemStatus, type PlanItem } from "./actions";

export function PlanClient({
  recommendations,
  existingItems,
}: {
  recommendations: TopicRecommendation[];
  existingItems: PlanItem[] | null;
}) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalMinutes = existingItems?.reduce((sum, i) => sum + i.minutes, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">
            {/* "Full plan", not "today's schedule". The dashboard's This
                Afternoon caps to the study time your timetable actually leaves
                free (1h45 on a Wednesday); this page ranks everything without
                that constraint. Labelling both "Plan (N min)" showed two
                different totals for the same day with no explanation. */}
            {existingItems ? `Full plan — ${totalMinutes} min if you had the time` : "No plan generated yet"}
          </h2>
          <button
            onClick={() => startTransition(() => generateDailyPlan())}
            disabled={pending || recommendations.length === 0}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Generating…" : existingItems ? "Regenerate" : "Generate today's plan"}
          </button>
        </div>

        {existingItems && (
          <ul className="space-y-1">
            {existingItems.map((item) => (
              <li
                key={item.topicId}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  item.status === "done"
                    ? "border-green-500/30 bg-green-500/10"
                    : item.status === "skipped"
                      ? "border-border opacity-50"
                      : "border-border"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.subjectColour }}
                />
                <span className="flex-1">
                  {item.minutes} min: {item.subjectName} T{item.topicNumber} {item.topicTitle}
                </span>
                {item.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        startTransition(() => updatePlanItemStatus(item.topicId, "done"))
                      }
                      className="text-xs text-muted-foreground underline"
                    >
                      Done
                    </button>
                    <button
                      onClick={() =>
                        startTransition(() => updatePlanItemStatus(item.topicId, "skipped"))
                      }
                      className="text-xs text-muted-foreground underline"
                    >
                      Skip
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">All active-topic priority scores</h2>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active topics yet — unlock some by building out your curriculum.
          </p>
        ) : (
          <ul className="space-y-1">
            {recommendations.map((rec) => (
              <li key={rec.topicId} className="rounded-md border border-border">
                <button
                  onClick={() =>
                    setExpanded(expanded === rec.topicId ? null : rec.topicId)
                  }
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: rec.subjectColour }}
                  />
                  <span className="flex-1">
                    {rec.subjectName} · T{rec.topicNumber} {rec.topicTitle}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {rec.result.score.toFixed(1)}
                  </span>
                </button>
                {expanded === rec.topicId && (
                  <div className="border-t border-border px-3 py-2">
                    <table className="w-full text-xs">
                      <tbody>
                        {rec.result.contributions.map((c) => (
                          <tr key={c.factor}>
                            <td className="py-0.5 text-muted-foreground">{c.factor}</td>
                            <td className="py-0.5 text-muted-foreground">{c.rawValue}</td>
                            <td className="py-0.5 text-right font-mono">
                              +{c.points.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-border">
                          <td className="pt-1 font-medium">Raw subtotal</td>
                          <td></td>
                          <td className="pt-1 text-right font-mono font-medium">
                            {rec.result.rawSubtotal.toFixed(1)}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted-foreground">
                            × subject weight ({rec.result.subjectPriorityWeight.toFixed(2)})
                          </td>
                          <td></td>
                          <td className="text-right font-mono font-medium">
                            = {rec.result.score.toFixed(1)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
