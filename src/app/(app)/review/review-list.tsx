"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  text: string;
  ragStatus: string;
  subjectName: string;
  shortCode: string;
  breadcrumb: string;
  isStale: boolean;
};

const RAG_COLOUR: Record<string, string> = {
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#22c55e",
  unrated: "#a1a1aa",
};

type Filter = "reds" | "stale" | "unrated" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "reds", label: "All reds" },
  { value: "stale", label: "Stale greens" },
  { value: "unrated", label: "Unrated" },
  { value: "all", label: "Everything" },
];

export function ReviewList({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<Filter>("reds");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const subjects = useMemo(
    () => [...new Set(items.map((i) => i.shortCode))],
    [items],
  );

  const visible = useMemo(() => {
    let result = items;
    if (filter === "reds") result = result.filter((i) => i.ragStatus === "red");
    else if (filter === "stale") result = result.filter((i) => i.isStale);
    else if (filter === "unrated")
      result = result.filter((i) => i.ragStatus === "unrated");
    if (subjectFilter !== "all")
      result = result.filter((i) => i.shortCode === subjectFilter);
    return result;
  }, [items, filter, subjectFilter]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-1">
        <button
          onClick={() => setSubjectFilter("all")}
          className={`rounded-full px-3 py-1 text-xs ${
            subjectFilter === "all" ? "underline" : "text-muted-foreground"
          }`}
        >
          All subjects
        </button>
        {subjects.map((sc) => (
          <button
            key={sc}
            onClick={() => setSubjectFilter(sc)}
            className={`rounded-full px-3 py-1 text-xs ${
              subjectFilter === sc ? "underline" : "text-muted-foreground"
            }`}
          >
            {sc}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing in this filter — nice.
        </p>
      ) : (
        <ul className="space-y-1">
          {visible.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: RAG_COLOUR[item.ragStatus] }}
              />
              <span className="flex-1">
                {item.text}
                <span className="ml-2 text-xs text-muted-foreground">
                  {item.breadcrumb}
                </span>
                {item.isStale && (
                  <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-600">
                    stale
                  </span>
                )}
              </span>
              <Link
                href={`/subjects/${item.shortCode}/rate`}
                className="shrink-0 text-xs text-muted-foreground underline"
              >
                Rate
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
