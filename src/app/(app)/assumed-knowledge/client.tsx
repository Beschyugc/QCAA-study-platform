"use client";

import { useMemo, useState } from "react";
import { Latex } from "@/components/latex";
import { LINES } from "@/config/tokens";
import type { SubjectCode } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";
import { DrillMode, type DrillEntry } from "@/components/assumed-knowledge/drill-mode";

export type SubjectGroup = {
  code: SubjectCode;
  name: string;
  entries: DrillEntry[];
};

/**
 * Scope selector + browse list + drill launcher for the cross-subject
 * assumed-knowledge page. Drill mode itself is shared with the per-subject
 * manager (@/components/assumed-knowledge/drill-mode) — one implementation,
 * two entry points.
 */
export function AssumedKnowledgeClient({ subjects }: { subjects: SubjectGroup[] }) {
  const [subjectFilter, setSubjectFilter] = useState<SubjectCode | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [drilling, setDrilling] = useState(false);

  const scopedSubjects = useMemo(
    () => (subjectFilter === "all" ? subjects : subjects.filter((s) => s.code === subjectFilter)),
    [subjects, subjectFilter],
  );

  const categories = useMemo(
    () => ["all", ...new Set(scopedSubjects.flatMap((s) => s.entries.map((e) => e.category)))],
    [scopedSubjects],
  );

  const drillPool = useMemo(
    () =>
      scopedSubjects.flatMap((s) =>
        s.entries.filter((e) => categoryFilter === "all" || e.category === categoryFilter),
      ),
    [scopedSubjects, categoryFilter],
  );

  const totalEntries = subjects.reduce((sum, s) => sum + s.entries.length, 0);

  if (drilling) {
    const title =
      subjectFilter === "all"
        ? categoryFilter === "all"
          ? "Everything"
          : categoryFilter
        : `${LINES[subjectFilter].label}${categoryFilter === "all" ? "" : " · " + categoryFilter}`;
    return (
      <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-6">
        <DrillMode entries={drillPool} title={title} onExit={() => setDrilling(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-4">
        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value as SubjectCode | "all");
            setCategoryFilter("all");
          }}
          className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--surface-raised)] px-3 py-1.5 text-xs text-[color:var(--text)]"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--surface-raised)] px-3 py-1.5 text-xs text-[color:var(--text)]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>
        <span className="text-[0.64rem] text-[color:var(--text-faint)]">
          {drillPool.length} of {totalEntries} entries in scope
        </span>
        <button
          onClick={() => setDrilling(true)}
          disabled={drillPool.length === 0}
          className="ml-auto rounded-lg bg-[color:var(--state-good)] px-4 py-2 text-xs font-semibold text-[#06231a] disabled:opacity-40"
        >
          Drill this selection →
        </button>
      </div>

      {scopedSubjects.map((subject) => (
        <SubjectSection key={subject.code} subject={subject} categoryFilter={categoryFilter} />
      ))}

      {scopedSubjects.every((s) => s.entries.length === 0) && (
        <p className="py-10 text-center text-sm text-[color:var(--text-muted)]">
          Nothing here yet. Run the seed script, or add entries from a subject&apos;s own assumed
          knowledge page.
        </p>
      )}
    </div>
  );
}

function SubjectSection({
  subject,
  categoryFilter,
}: {
  subject: SubjectGroup;
  categoryFilter: string;
}) {
  const line = LINES[subject.code];
  const visible =
    categoryFilter === "all"
      ? subject.entries
      : subject.entries.filter((e) => e.category === categoryFilter);
  if (visible.length === 0) return null;

  const byCategory = new Map<string, DrillEntry[]>();
  for (const entry of visible) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }

  return (
    <section className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: `var(--line-${line.slug})`, boxShadow: `0 0 0 4px var(--line-${line.slug}-glow)` }}
        />
        <h2
          className="signage flex items-center gap-2 font-display text-xs font-bold"
          style={{ color: `var(--line-${line.slug}-bright)` }}
        >
          <LineIcon name={line.icon} className="h-4 w-4" />
          {line.label}
        </h2>
        <span className="tabular text-[0.64rem] text-[color:var(--text-faint)]">
          {visible.length} entries
        </span>
      </div>

      <div className="space-y-5">
        {[...byCategory.entries()].map(([category, categoryEntries]) => (
          <div key={category}>
            <h3 className="mb-2 text-[0.64rem] font-semibold uppercase tracking-[0.06em] text-[color:var(--text-faint)]">
              {category}
            </h3>
            <ul className="space-y-1.5">
              {categoryEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-0.5 rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--surface-raised)] sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]"
                >
                  <span className="text-[color:var(--text)]">{entry.prompt}</span>
                  <span className="text-[color:var(--text-muted)]">
                    {entry.latex ? <Latex>{entry.latex}</Latex> : entry.answer}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
