"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, CircleDashed, Minus, SkipForward } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { LINES, type SubjectCode } from "@/config/tokens";
import type { MentorSlot, MentorTask } from "@/lib/mentor";
import { setPeriodTaskStatus } from "./actions";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Day = {
  slots: MentorSlot[];
  unplaced: MentorTask[];
  isToday: boolean;
  dayOfWeek: number;
  dateKey: string;
};

/**
 * Only slots that carry an instruction are shown by default. Beschy's real
 * day has fifteen blocks in it, most of them "Drive to school" and "Wind
 * down", and rendering all of them buries the four that matter. The full
 * timetable is one click away rather than gone.
 */
export function TodayBoard({
  day,
  prevKey,
  nextKey,
}: {
  day: Day;
  prevKey: string;
  nextKey: string;
}) {
  const [showAll, setShowAll] = useState(false);

  const withTasks = day.slots.filter((s) => s.tasks.length > 0);
  const visible = showAll ? day.slots : withTasks;
  const allTasks = [...day.slots.flatMap((s) => s.tasks), ...day.unplaced];
  const done = allTasks.filter((t) => t.status === "done" || t.status === "partial").length;
  const minutesLeft = allTasks.reduce((m, t) => m + (t.status === "pending" ? t.minutes : 0), 0);

  return (
    <div>
      <header className="mb-6">
        <div className="mb-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {day.isToday ? "Today" : DAY_NAMES[day.dayOfWeek]}
          </h1>
          <span className="tabular text-sm text-[color:var(--text-faint)]">{day.dateKey}</span>
          <span className="ml-auto flex items-center gap-1">
            <Link
              href={`/today?d=${prevKey}`}
              aria-label="Previous day"
              className="rounded-md p-1 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={`/today?d=${nextKey}`}
              aria-label="Next day"
              className="rounded-md p-1 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </span>
        </div>
        {allTasks.length > 0 ? (
          <p className="text-sm text-[color:var(--text-muted)]">
            {done} of {allTasks.length} done · {minutesLeft} min still on the board
          </p>
        ) : (
          <p className="text-sm text-[color:var(--text-muted)]">
            Nothing written for this day yet. Ask Claude to plan it.
          </p>
        )}
      </header>

      {day.unplaced.length > 0 && (
        <section className="mb-6">
          <h2 className="signage mb-2 font-display text-xs font-bold text-[color:var(--text-muted)]">
            Not tied to a period
          </h2>
          <ul className="space-y-2">
            {day.unplaced.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ul>
        </section>
      )}

      <ul className="space-y-5">
        {visible.map((slot) => (
          <li key={slot.blockId ?? slot.slotKey}>
            <div className="mb-2 flex items-center gap-2.5">
              <span
                className={`h-5 w-[3px] rounded-sm ${slot.current ? "bg-[color:var(--text)]" : "bg-[color:var(--hairline)]"}`}
                aria-hidden
              />
              <span className="tabular text-xs text-[color:var(--text-muted)]">
                {slot.startTime}
              </span>
              <span
                className={`text-sm font-semibold ${slot.past ? "text-[color:var(--text-faint)]" : ""}`}
              >
                {slot.label}
              </span>
              <span className="signage text-[0.64rem] text-[color:var(--text-faint)]">
                {slot.slotKey}
              </span>
              {slot.current && (
                <span className="signage text-[0.64rem] font-bold text-[color:var(--text)]">
                  NOW
                </span>
              )}
            </div>
            {slot.tasks.length === 0 ? (
              <p className="pl-6 text-xs text-[color:var(--text-faint)]">Nothing set.</p>
            ) : (
              <ul className="space-y-2 pl-6">
                {slot.tasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {day.slots.length > withTasks.length && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-6 text-xs text-[color:var(--text-muted)] underline underline-offset-4 hover:text-[color:var(--text)]"
        >
          {showAll
            ? "Hide the periods with nothing set"
            : `Show all ${day.slots.length} timetabled periods`}
        </button>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: MentorTask }) {
  const [open, setOpen] = useState(task.status === "pending");
  const [report, setReport] = useState(task.report ?? "");
  const [pending, startTransition] = useTransition();

  const line = task.subjectCode ? LINES[task.subjectCode as SubjectCode] : null;
  const settled = task.status !== "pending";

  function mark(status: "done" | "partial" | "skipped" | "pending") {
    startTransition(async () => {
      await setPeriodTaskStatus(task.id, status, report);
    });
  }

  return (
    <li
      className={`rounded-lg border border-[color:var(--hairline)] bg-[color:var(--surface)] ${settled ? "opacity-70" : ""}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-2.5 p-3 text-left"
      >
        {line && (
          <span
            className="signage mt-px shrink-0 rounded-full px-1.5 py-px text-[0.64rem] font-bold"
            style={{
              background: `var(--line-${line.slug}-dim)`,
              color: `var(--line-${line.slug}-bright)`,
            }}
          >
            {task.subjectCode}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-medium ${task.status === "done" ? "line-through" : ""}`}
          >
            {task.title}
          </span>
          <span className="mt-0.5 block text-[0.7rem] text-[color:var(--text-faint)]">
            {task.minutes} min
            {task.priority === 1 && " · do this one first"}
            {task.questionIds.length > 0 && ` · ${task.questionIds.length} bank questions`}
          </span>
        </span>
        <StatusIcon status={task.status} />
      </button>

      {open && (
        <div className="border-t border-[color:var(--hairline)] px-3 py-3">
          <div className="text-sm text-[color:var(--text-muted)]">
            <Markdown>{task.detail}</Markdown>
          </div>

          {task.questionIds.length > 0 && (
            <Link
              href={`/bank?ids=${task.questionIds.join(",")}`}
              className="mt-3 inline-block text-xs text-[color:var(--text)] underline underline-offset-4"
            >
              Open these {task.questionIds.length} questions in the bank
            </Link>
          )}

          <label className="mt-4 block">
            <span className="signage text-[0.64rem] font-bold text-[color:var(--text-faint)]">
              What happened
            </span>
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              rows={2}
              placeholder="Got it / stuck on..."
              className="mt-1 w-full rounded-md border border-[color:var(--hairline)] bg-[color:var(--surface-raised)] p-2 text-xs"
            />
          </label>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <MarkButton
              onClick={() => mark("done")}
              disabled={pending}
              active={task.status === "done"}
            >
              Done
            </MarkButton>
            <MarkButton
              onClick={() => mark("partial")}
              disabled={pending}
              active={task.status === "partial"}
            >
              Half done
            </MarkButton>
            <MarkButton
              onClick={() => mark("skipped")}
              disabled={pending}
              active={task.status === "skipped"}
            >
              Skipped
            </MarkButton>
            {settled && (
              <MarkButton onClick={() => mark("pending")} disabled={pending} active={false}>
                Reopen
              </MarkButton>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function MarkButton({
  onClick,
  disabled,
  active,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
        active
          ? "border-[color:var(--text-faint)] bg-[color:var(--surface-raised)] text-[color:var(--text)]"
          : "border-[color:var(--hairline)] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}

function StatusIcon({ status }: { status: MentorTask["status"] }) {
  const cls = "h-4 w-4 shrink-0";
  if (status === "done") return <Check className={cls} aria-label="done" />;
  if (status === "partial") return <Minus className={cls} aria-label="half done" />;
  if (status === "skipped") return <SkipForward className={cls} aria-label="skipped" />;
  return (
    <CircleDashed className={`${cls} text-[color:var(--text-faint)]`} aria-label="not started" />
  );
}
