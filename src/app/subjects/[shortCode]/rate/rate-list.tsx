"use client";

import { useEffect, useRef, useState } from "react";
import { setRagStatus, type RagStatus } from "../actions";

type Item = {
  id: string;
  text: string;
  ragStatus: string;
  breadcrumb: string;
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

export function RateList({
  shortCode,
  initialItems,
}: {
  shortCode: string;
  initialItems: Item[];
}) {
  const [items, setItems] = useState(initialItems);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (event.key in KEY_TO_STATUS) {
        const status = KEY_TO_STATUS[event.key];
        const item = items[focusedIndex];
        if (!item) return;
        setItems((prev) =>
          prev.map((i, idx) =>
            idx === focusedIndex ? { ...i, ragStatus: status } : i,
          ),
        );
        setRagStatus(shortCode, item.id, status);
        setFocusedIndex((i) => Math.min(i + 1, items.length - 1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusedIndex, items, shortCode]);

  useEffect(() => {
    refs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
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
          </span>
        </li>
      ))}
    </ul>
  );
}
