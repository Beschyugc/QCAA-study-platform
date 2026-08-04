"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { LINES, type SubjectCode } from "@/config/tokens";
import type { DashboardBlock } from "@/lib/dashboard";

/**
 * Today, class by class, plus a week strip to flick to any other day.
 * This is the panel that answers "what subjects do I have on what day".
 *
 * Past periods dim with a tick, the current period gets a rail marker, future
 * periods stay at full contrast — so the eye lands on "where am I now" without
 * reading a word.
 */

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function LineTag({ code, inferred }: { code: SubjectCode; inferred: boolean }) {
  const line = LINES[code];
  return (
    <span
      className={`signage rounded-full px-1.5 py-px text-[0.64rem] font-bold ${
        // A dashed edge means "we read this off the label, nobody linked it".
        inferred ? "border border-dashed opacity-80" : ""
      }`}
      style={{
        background: `var(--line-${line.slug}-dim)`,
        color: `var(--line-${line.slug}-bright)`,
        borderColor: inferred ? `var(--line-${line.slug})` : undefined,
      }}
      title={
        inferred
          ? `Guessed from the label — this block isn't linked to ${line.name} in the timetable`
          : line.name
      }
    >
      {code}
      {inferred && <span aria-hidden>?</span>}
      {inferred && <span className="sr-only"> (inferred from label, not linked)</span>}
    </span>
  );
}

export function TodayPanel({
  days,
  today,
  todayLabel,
  currentBlockId,
  nowMinutes,
}: {
  /** Blocks keyed by dayOfWeek (0=Sun). Whole week, so switching days is instant. */
  days: Record<number, DashboardBlock[]>;
  today: number;
  todayLabel: string;
  currentBlockId: string | null;
  /** Brisbane minutes past midnight, for dimming periods already gone. */
  nowMinutes: number;
}) {
  const [selected, setSelected] = useState(today);
  const blocks = days[selected] ?? [];
  const isToday = selected === today;
  const clashCount = new Set(blocks.filter((b) => b.clashes).map((b) => b.startTime)).size;

  return (
    <div>
      <h2 className="signage mb-3.5 flex items-center gap-2 font-display text-xs font-bold text-[color:var(--text-muted)]">
        {isToday ? `Today — ${DAY_NAMES[selected]}` : DAY_NAMES[selected]}
        <span className="tabular ml-auto font-body text-xs font-normal tracking-normal text-[color:var(--text-faint)]">
          {todayLabel}
        </span>
      </h2>

      <div className="mb-3.5 flex gap-1.5" role="tablist" aria-label="Day of week">
        {DAY_LABELS.map((label, day) => (
          <button
            key={day}
            role="tab"
            aria-selected={selected === day}
            aria-label={DAY_NAMES[day]}
            onClick={() => setSelected(day)}
            className={`signage flex-1 rounded-md border py-1.5 text-xs font-semibold transition-colors ${
              selected === day
                ? "border-[color:var(--text-faint)] bg-[color:var(--surface-raised)] text-[color:var(--text)]"
                : "border-[color:var(--hairline)] text-[color:var(--text-faint)] hover:text-[color:var(--text-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {blocks.length === 0 ? (
        <p className="py-6 text-center text-xs text-[color:var(--text-muted)]">
          Nothing timetabled on {DAY_NAMES[selected]}.
        </p>
      ) : (
        <ul>
          {blocks.map((block) => {
            // Only dim by clock time on the actual current day — Friday's
            // 9am period isn't "past" just because it's 3pm on Wednesday.
            const past = isToday && toMinutes(block.endTime) <= nowMinutes;
            const current = block.id === currentBlockId;
            return (
              <li
                key={block.id}
                className="grid grid-cols-[3px_46px_1fr_auto] items-center gap-2.5 border-b border-[color:color-mix(in_srgb,var(--hairline)_55%,transparent)] py-1.5 text-xs last:border-b-0"
              >
                <span
                  className={`h-5 w-[3px] rounded-sm ${current ? "bg-[color:var(--text)]" : ""}`}
                  aria-hidden
                />
                <span
                  className={`tabular ${past ? "text-[color:var(--text-faint)]" : "text-[color:var(--text-muted)]"}`}
                >
                  {block.startTime}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  {block.subjectCode && (
                    <LineTag code={block.subjectCode} inferred={block.codeInferred} />
                  )}
                  <span
                    className={`truncate ${past ? "text-[color:var(--text-faint)]" : "text-[color:var(--text-muted)]"}`}
                  >
                    {block.label ?? block.periodName}
                  </span>
                </span>
                <span className="tabular text-[0.64rem] text-[color:var(--text-faint)]">
                  {block.clashes ? (
                    <span className="text-[color:var(--state-danger)]">clash</span>
                  ) : current ? (
                    <span className="text-[color:var(--text)]">now</span>
                  ) : past ? (
                    <Check className="h-3 w-3" aria-label="done" />
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {clashCount > 0 && (
        <p className="mt-2.5 flex gap-1.5 text-[0.64rem] text-[color:var(--state-danger)]">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
          <span>
            {clashCount === 1 ? "One slot has" : `${clashCount} slots have`} two blocks booked at
            once. Rotation week, or an import artefact — worth a look before the planner leans on
            this day.
          </span>
        </p>
      )}
    </div>
  );
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
