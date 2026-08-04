"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { setRagStatus, type RagStatus } from "../actions";

type Item = {
  id: string;
  text: string;
  ragStatus: string;
  breadcrumb: string;
  isStale: boolean;
};

const KEY_TO_STATUS: Record<string, RagStatus> = {
  "1": "red",
  "2": "amber",
  "3": "green",
};

const RAG_COLOUR: Record<string, string> = {
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#22c55e",
  unrated: "#a1a1aa",
};

type Filter = "all" | "red" | "amber" | "green" | "unrated" | "stale";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "red", label: "Red" },
  { value: "amber", label: "Amber" },
  { value: "green", label: "Green" },
  { value: "unrated", label: "Unrated" },
  { value: "stale", label: "Stale greens" },
];

export function RateList({
  shortCode,
  initialItems,
}: {
  shortCode: string;
  initialItems: Item[];
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>("all");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "stale") return items.filter((i) => i.isStale);
    return items.filter((i) => i.ragStatus === filter);
  }, [items, filter]);

  useEffect(() => {
    setFocusedIndex(0);
  }, [filter]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, visible.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (event.key in KEY_TO_STATUS) {
        const status = KEY_TO_STATUS[event.key];
        const item = visible[focusedIndex];
        if (!item) return;
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, ragStatus: status, isStale: false } : i,
          ),
        );
        setRagStatus(shortCode, item.id, status);
        setFocusedIndex((i) => Math.min(i + 1, visible.length - 1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusedIndex, visible, shortCode]);

  useEffect(() => {
    refs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1">
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

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing in this filter.</p>
      ) : (
        <ul className="space-y-1">
          {visible.map((item, index) => (
            <li
              key={item.id}
              ref={(el) => {
                refs.current[index] = el;
              }}
              onClick={() => setFocusedIndex(index)}
              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                index === focusedIndex
                  ? "border-ring bg-muted"
                  : "border-transparent"
              }`}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
