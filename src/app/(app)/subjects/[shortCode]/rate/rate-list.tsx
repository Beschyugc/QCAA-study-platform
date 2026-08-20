"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/* The three buttons on every row. Rating used to be keyboard-only — 1/2/3 on
 * the focused row — which is fast once you know it and completely invisible
 * if you don't: there was nothing on screen to click, so the page looked
 * broken rather than efficient. The keys still work and are still the quick
 * way through 400 objectives; these just make the same action visible. */
const CHOICES: { status: RagStatus; label: string; title: string }[] = [
  { status: "red", label: "R", title: "Red — don't know this (key: 1)" },
  { status: "amber", label: "Y", title: "Yellow — shaky (key: 2)" },
  { status: "green", label: "G", title: "Green — solid (key: 3)" },
];

type Filter = "all" | "red" | "amber" | "green" | "unrated" | "stale";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "red", label: "Red" },
  { value: "amber", label: "Yellow" },
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
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "stale") return items.filter((i) => i.isStale);
    return items.filter((i) => i.ragStatus === filter);
  }, [items, filter]);

  /* Optimistic, but it puts the old value back if the write fails. The
   * previous version fired setRagStatus and ignored the result, so a failed
   * save left the dot showing a rating the database never took — the one
   * outcome worse than not saving is believing you saved. */
  const apply = useCallback(
    async (item: Item, status: RagStatus) => {
      const previous = item.ragStatus;
      setError(null);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, ragStatus: status, isStale: false } : i,
        ),
      );
      try {
        await setRagStatus(shortCode, item.id, status);
      } catch {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, ragStatus: previous } : i)),
        );
        setError("Couldn't save that rating — check your connection and retry.");
      }
    },
    [shortCode],
  );

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
        const item = visible[focusedIndex];
        if (!item) return;
        void apply(item, KEY_TO_STATUS[event.key]);
        setFocusedIndex((i) => Math.min(i + 1, visible.length - 1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusedIndex, visible, apply]);

  useEffect(() => {
    refs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  const counts = useMemo(() => {
    const c = { red: 0, amber: 0, green: 0, unrated: 0 };
    for (const i of items) if (i.ragStatus in c) c[i.ragStatus as keyof typeof c]++;
    return c;
  }, [items]);

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

      <p className="mb-3 text-xs text-muted-foreground">
        {counts.green} green · {counts.amber} yellow · {counts.red} red ·{" "}
        {counts.unrated} still unrated
      </p>

      {error && (
        <p className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

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
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm ${
                index === focusedIndex
                  ? "border-ring bg-muted"
                  : "border-transparent"
              }`}
            >
              <span className="flex shrink-0 gap-1 pt-0.5" role="group" aria-label="Rating">
                {CHOICES.map((choice) => {
                  const active = item.ragStatus === choice.status;
                  return (
                    <button
                      key={choice.status}
                      type="button"
                      title={choice.title}
                      aria-pressed={active}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedIndex(index);
                        void apply(item, choice.status);
                      }}
                      className="h-6 w-6 rounded-full border text-[11px] font-semibold transition-opacity"
                      style={{
                        borderColor: RAG_COLOUR[choice.status],
                        backgroundColor: active
                          ? RAG_COLOUR[choice.status]
                          : "transparent",
                        color: active ? "#fff" : RAG_COLOUR[choice.status],
                        opacity: active ? 1 : 0.55,
                      }}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </span>

              <span
                className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: RAG_COLOUR[item.ragStatus] }}
                aria-hidden
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
