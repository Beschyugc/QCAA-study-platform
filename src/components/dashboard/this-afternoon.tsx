"use client";

import { useState } from "react";
import Link from "next/link";
import { LINES, type SubjectCode } from "@/config/tokens";
import { formatDuration } from "./after-school";

/**
 * The recommendation engine's output as an ordered plan.
 *
 * Every item carries a `why?` that expands into the actual scoring breakdown —
 * factor, raw value, points — straight out of scoreTopicPriority. Not a
 * paraphrase of the reasoning, the reasoning itself. §4.4 calls this
 * non-negotiable, and it is the difference between a plan you can argue with
 * and a black box telling you what to do.
 */

export type PlanItem = {
  topicId: string;
  topicTitle: string;
  position: string | null;
  subjectId: string;
  code: SubjectCode;
  minutes: number;
  /** One-line reason, e.g. "3 red objectives · 22 cards overdue". */
  summary: string;
  contributions: { factor: string; rawValue: string; points: number }[];
  score: number;
  subjectPriorityWeight: number;
};

export function ThisAfternoon({
  items,
  studyMinutes,
}: {
  items: PlanItem[];
  studyMinutes: number;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const planned = items.reduce((sum, i) => sum + i.minutes, 0);

  return (
    <div>
      <h2 className="signage mb-3.5 flex items-center gap-2 font-display text-xs font-bold text-[color:var(--text-muted)]">
        This afternoon
        <span className="tabular ml-auto font-body text-xs font-normal tracking-normal text-[color:var(--text-faint)]">
          {planned > 0 ? `Planned ${formatDuration(planned)}` : ""}
        </span>
      </h2>

      <ul className="flex flex-col gap-2.5">
        {items.map((item) => {
          const line = LINES[item.code];
          const isOpen = open === item.topicId;
          return (
            <li
              key={item.topicId}
              className="rounded-xl border border-l-[3px] border-[color:var(--hairline)] px-3.5 py-3"
              style={{ borderLeftColor: `var(--line-${line.slug})` }}
            >
              <div className="flex items-baseline gap-2.5">
                <span
                  className="signage font-display text-xs font-bold"
                  style={{ color: `var(--line-${line.slug}-bright)` }}
                >
                  {line.label}
                </span>
                <span className="tabular ml-auto text-xs text-[color:var(--text-muted)]">
                  {formatDuration(item.minutes)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                {item.position ? `${item.position} — ` : ""}
                {item.topicTitle}
              </p>
              <p className="mt-0.5 text-[0.64rem] text-[color:var(--text-faint)]">{item.summary}</p>

              <button
                onClick={() => setOpen(isOpen ? null : item.topicId)}
                aria-expanded={isOpen}
                className="mt-1.5 text-[0.64rem] text-[color:var(--text-faint)] underline underline-offset-[3px] hover:text-[color:var(--text-muted)]"
              >
                {isOpen ? "hide" : "why?"}
              </button>

              {isOpen && (
                <div className="mt-2 border-t border-[color:var(--hairline)] pt-2 text-[0.64rem]">
                  {item.contributions.map((c) => (
                    <div
                      key={c.factor}
                      className="tabular flex justify-between gap-3 py-px text-[color:var(--text-muted)]"
                    >
                      <span>{c.factor}</span>
                      <span className="flex gap-3">
                        <span className="text-[color:var(--text-faint)]">{c.rawValue}</span>
                        <span className="w-11 text-right text-[color:var(--text)]">
                          {c.points >= 0 ? "+" : ""}
                          {c.points.toFixed(2)}
                        </span>
                      </span>
                    </div>
                  ))}
                  <div className="tabular mt-1 flex justify-between border-t border-[color:var(--hairline)] pt-1">
                    <span className="text-[color:var(--text-muted)]">
                      × subject weight {item.subjectPriorityWeight.toFixed(2)}
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: `var(--line-${line.slug}-bright)` }}
                    >
                      {item.score.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/timer?subjectId=${items[0].subjectId}&topicId=${items[0].topicId}&start=1`}
          className="flex-1 rounded-xl bg-[color:var(--state-good)] px-4 py-2.5 text-center text-xs font-semibold text-[#06231a] transition-[filter] duration-[180ms] hover:brightness-110"
        >
          Start plan
        </Link>
        <Link
          href="/plan"
          className="rounded-xl border border-[color:var(--hairline)] px-4 py-2.5 text-xs font-semibold text-[color:var(--text-muted)] transition-colors duration-[180ms] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
        >
          Full plan
        </Link>
      </div>

      {planned > studyMinutes && studyMinutes > 0 && (
        <p className="mt-2 text-[0.64rem] text-[color:var(--state-danger)]">
          This plan is {formatDuration(planned - studyMinutes)} longer than tonight&apos;s study
          block. Worth trimming rather than running late.
        </p>
      )}
    </div>
  );
}
