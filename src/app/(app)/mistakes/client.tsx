"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CATEGORY_BY_ID,
  MISTAKE_CATEGORIES,
  STATUSES,
  type MistakeCategory,
  type MistakeStatus,
} from "@/config/mistakes";
import { deleteMistake, recordMistake, reviewMistake } from "./actions";

export type MistakeRow = {
  id: string;
  subject: string;
  topic: string | null;
  cardFront: string | null;
  category: string;
  status: string;
  whatWentWrong: string;
  whyItHappened: string | null;
  fixAction: string | null;
  source: string | null;
  marksLost: number | null;
  timesRepeated: number;
  nextReviewAt: string | null;
  lastSeenAt: string;
};

type Subject = { id: string; shortCode: string; name: string };

export function MistakesClient({
  subjects,
  mistakes,
}: {
  subjects: Subject[];
  mistakes: MistakeRow[];
}) {
  const [filter, setFilter] = useState<"all" | MistakeStatus>("all");
  const [recording, setRecording] = useState(false);
  const [pending, start] = useTransition();

  const shown = useMemo(
    () => (filter === "all" ? mistakes : mistakes.filter((m) => m.status === filter)),
    [filter, mistakes],
  );

  const active = mistakes.filter((m) => m.status !== "mastered");
  const repeated = active.filter((m) => m.timesRepeated > 1);
  const improving = mistakes.filter((m) => m.status === "improving");
  const dueToday = active.filter(
    (m) => m.nextReviewAt !== null && new Date(m.nextReviewAt) <= new Date(),
  );
  const subjectsHit = new Set(active.map((m) => m.subject)).size;

  // Which family is actually costing marks. This is the read Beschy asked for:
  // whether the problem is not knowing enough, or knowing it and losing marks
  // anyway. Averaged over every active record, weighted by how often each
  // repeated, so one four-time misread outweighs three one-off slips.
  const familySplit = useMemo(() => {
    let content = 0;
    let execution = 0;
    for (const m of active) {
      const meta = CATEGORY_BY_ID.get(m.category as MistakeCategory);
      if (!meta) continue;
      if (meta.family === "content") content += m.timesRepeated;
      else execution += m.timesRepeated;
    }
    return { content, execution, total: content + execution };
  }, [active]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="signage text-[0.64rem] font-semibold text-[color:var(--text-faint)]">
        Retain every lost mark
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[color:var(--text)]">
            Mistake Folder
          </h1>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            Every record keeps its reason, its source and what fixes it.
          </p>
        </div>
        <button
          onClick={() => setRecording((v) => !v)}
          className="rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: "var(--line)", color: "#0f1420" }}
        >
          {recording ? "Close" : "Record mistake"}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile n={active.length} label="Active" hint={`Across ${subjectsHit} subject${subjectsHit === 1 ? "" : "s"}`} />
        <Tile n={repeated.length} label="Repeated" hint="Needs targeted repair" danger={repeated.length > 0} />
        <Tile n={improving.length} label="Improving" hint="Evidence is strengthening" />
        <Tile n={dueToday.length} label="Due today" hint="Start with repeated errors" />
      </div>

      {familySplit.total > 0 && (
        <div className="mt-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-4">
          <p className="signage text-[0.64rem] font-semibold text-[color:var(--text-faint)]">
            Where the marks are going
          </p>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[color:var(--ink)]">
            <div
              style={{ width: `${(familySplit.content / familySplit.total) * 100}%`, background: "var(--state-danger)" }}
            />
            <div
              style={{ width: `${(familySplit.execution / familySplit.total) * 100}%`, background: "var(--line)" }}
            />
          </div>
          <p className="mt-2 text-xs text-[color:var(--text-muted)]">
            <b className="text-[color:var(--text)]">{familySplit.content}</b> content
            {" "}(you didn&apos;t know it) ·{" "}
            <b className="text-[color:var(--text)]">{familySplit.execution}</b> execution
            {" "}(you knew it and lost the marks anyway).{" "}
            {familySplit.content > familySplit.execution
              ? "Learning content is the higher-value fix right now."
              : "More content study won't fix this — the leak is in how you're answering."}
          </p>
        </div>
      )}

      {recording && (
        <RecordForm
          subjects={subjects}
          pending={pending}
          onSave={(input) =>
            start(async () => {
              const r = await recordMistake(input);
              if (r.ok) setRecording(false);
            })
          }
        />
      )}

      <div className="mt-6 flex flex-wrap gap-1.5">
        {(["all", ...STATUSES.map((s) => s.id)] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === s
                ? "bg-[color:var(--surface-raised)] text-[color:var(--text)]"
                : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
            }`}
          >
            {s === "all" ? "All" : STATUSES.find((x) => x.id === s)!.label}
            <span className="tabular ml-1.5 text-[color:var(--text-faint)]">
              {s === "all" ? mistakes.length : mistakes.filter((m) => m.status === s).length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {shown.length === 0 ? (
          <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-8 text-center">
            <p className="text-sm text-[color:var(--text)]">
              {mistakes.length === 0 ? "No mistakes recorded yet" : "Nothing in this state"}
            </p>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              {mistakes.length === 0
                ? "Press Again on a card in the reviewer and you'll be offered this, or record one by hand."
                : "Try another filter."}
            </p>
          </div>
        ) : (
          shown.map((m) => (
            <Record
              key={m.id}
              m={m}
              pending={pending}
              onReview={(ok) => start(async () => { await reviewMistake(m.id, ok); })}
              onDelete={() => start(async () => { await deleteMistake(m.id); })}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Tile({ n, label, hint, danger }: { n: number; label: string; hint: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-3">
      <p className="signage text-[0.6rem] font-semibold text-[color:var(--text-faint)]">{label}</p>
      <p
        className="tabular mt-0.5 text-2xl font-bold"
        style={{ color: danger ? "var(--state-danger)" : "var(--text)" }}
      >
        {n}
      </p>
      <p className="text-[0.64rem] text-[color:var(--text-muted)]">{hint}</p>
    </div>
  );
}

function RecordForm({
  subjects,
  pending,
  onSave,
}: {
  subjects: Subject[];
  pending: boolean;
  onSave: (i: {
    subjectId: string;
    category: MistakeCategory;
    whatWentWrong: string;
    whyItHappened: string;
    source: string;
    marksLost: number | null;
  }) => void;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [category, setCategory] = useState<MistakeCategory>("knowledge_gap");
  const [what, setWhat] = useState("");
  const [why, setWhy] = useState("");
  const [source, setSource] = useState("");
  const [marks, setMarks] = useState("");

  const meta = CATEGORY_BY_ID.get(category)!;
  const field =
    "w-full rounded-lg border border-[color:var(--hairline)] bg-[color:var(--ink)] px-3 py-2 text-xs text-[color:var(--text)]";

  return (
    <div className="mt-4 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[0.64rem] font-semibold text-[color:var(--text-faint)]">Subject</span>
          <select className={field} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[0.64rem] font-semibold text-[color:var(--text-faint)]">Category</span>
          <select
            className={field}
            value={category}
            onChange={(e) => setCategory(e.target.value as MistakeCategory)}
          >
            {MISTAKE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* The chosen category explains itself and states its own repair, so the
          reason isn't just a label you pick and forget. */}
      <div className="mt-2 rounded-lg bg-[color:var(--ink)] p-3">
        <p className="text-xs text-[color:var(--text-muted)]">{meta.hint}</p>
        <p className="mt-1 text-xs text-[color:var(--text)]">
          <b>Fix:</b> {meta.fix}
        </p>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[0.64rem] font-semibold text-[color:var(--text-faint)]">What went wrong?</span>
        <textarea
          className={field}
          rows={2}
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder="Couldn't differentiate an implicit function"
        />
      </label>

      <label className="mt-2 block">
        <span className="mb-1 block text-[0.64rem] font-semibold text-[color:var(--text-faint)]">Why did it happen?</span>
        <textarea
          className={field}
          rows={2}
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="Never practised it — only ever did explicit ones"
        />
      </label>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[0.64rem] font-semibold text-[color:var(--text-faint)]">Source</span>
          <input
            className={field}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="2023 Paper 1 Q7"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[0.64rem] font-semibold text-[color:var(--text-faint)]">Marks lost</span>
          <input
            className={field}
            inputMode="numeric"
            value={marks}
            onChange={(e) => setMarks(e.target.value.replace(/\D/g, ""))}
            placeholder="3"
          />
        </label>
      </div>

      <button
        disabled={pending || !what.trim() || !subjectId}
        onClick={() =>
          onSave({
            subjectId,
            category,
            whatWentWrong: what,
            whyItHappened: why,
            source,
            marksLost: marks ? Number(marks) : null,
          })
        }
        className="mt-3 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-40"
        style={{ background: "var(--line)", color: "#0f1420" }}
      >
        {pending ? "Saving…" : "Save mistake"}
      </button>
    </div>
  );
}

function Record({
  m,
  pending,
  onReview,
  onDelete,
}: {
  m: MistakeRow;
  pending: boolean;
  onReview: (ok: boolean) => void;
  onDelete: () => void;
}) {
  const meta = CATEGORY_BY_ID.get(m.category as MistakeCategory);
  const due = m.nextReviewAt !== null && new Date(m.nextReviewAt) <= new Date();

  return (
    <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-[color:var(--ink)] px-2 py-0.5 text-[0.64rem] font-semibold text-[color:var(--text-muted)]">
          {m.subject}
        </span>
        <span
          className="rounded-md px-2 py-0.5 text-[0.64rem] font-semibold"
          style={
            meta?.family === "content"
              ? { background: "var(--state-danger)", color: "#0f1420" }
              : { background: "var(--surface-raised)", color: "var(--text-muted)" }
          }
        >
          {meta?.label ?? m.category}
        </span>
        {m.timesRepeated > 1 && (
          <span className="rounded-md bg-[color:var(--state-danger)] px-2 py-0.5 text-[0.64rem] font-semibold" style={{ color: "#0f1420" }}>
            ×{m.timesRepeated}
          </span>
        )}
        {m.marksLost !== null && (
          <span className="tabular text-[0.64rem] text-[color:var(--text-faint)]">
            −{m.marksLost} mark{m.marksLost === 1 ? "" : "s"}
          </span>
        )}
        {due && (
          <span className="ml-auto text-[0.64rem] font-semibold text-[color:var(--line-bright)]">due</span>
        )}
      </div>

      <p className="mt-2 text-sm text-[color:var(--text)]">{m.whatWentWrong}</p>
      {m.whyItHappened && (
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          <b>Why:</b> {m.whyItHappened}
        </p>
      )}
      {m.fixAction && (
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          <b>Fix:</b> {m.fixAction}
        </p>
      )}
      {(m.topic || m.source || m.cardFront) && (
        <p className="mt-1.5 text-[0.64rem] text-[color:var(--text-faint)]">
          {[m.topic, m.source, m.cardFront ? `card: ${m.cardFront.slice(0, 60)}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[0.64rem] text-[color:var(--text-faint)]">
          {STATUSES.find((s) => s.id === m.status)?.label}
        </span>
        <button
          disabled={pending}
          onClick={() => onReview(true)}
          className="ml-auto rounded-lg bg-[color:var(--surface-raised)] px-3 py-1.5 text-[0.64rem] font-semibold text-[color:var(--text)] disabled:opacity-40"
        >
          Got it now
        </button>
        <button
          disabled={pending}
          onClick={() => onReview(false)}
          className="rounded-lg bg-[color:var(--surface-raised)] px-3 py-1.5 text-[0.64rem] font-semibold text-[color:var(--text-muted)] disabled:opacity-40"
        >
          Still wrong
        </button>
        <button
          disabled={pending}
          onClick={onDelete}
          className="rounded-lg px-2 py-1.5 text-[0.64rem] text-[color:var(--text-faint)] hover:text-[color:var(--state-danger)] disabled:opacity-40"
          aria-label="Delete this record"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
