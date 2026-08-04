"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The five things you can do inside a subject. Ordered the way the work
 * actually goes: learn it, drill it, rate it, test it, ask about it.
 */
const TABS = [
  { slug: "", label: "Overview" },
  { slug: "learn", label: "Learn" },
  { slug: "reviewer", label: "Cards" },
  { slug: "rate", label: "Syllabus" },
  { slug: "tutor", label: "Ask AI" },
] as const;

export function SubjectTabs({ shortCode, dueCount }: { shortCode: string; dueCount: number }) {
  const pathname = usePathname();
  const base = `/subjects/${shortCode}`;

  return (
    <nav className="-mb-px mt-4 flex gap-1 overflow-x-auto" aria-label="Subject sections">
      {TABS.map((tab) => {
        const href = tab.slug ? `${base}/${tab.slug}` : base;
        // Overview must match exactly or every sub-route would light it up too.
        const active = tab.slug ? pathname.startsWith(href) : pathname === base;
        return (
          <Link
            key={tab.slug}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold transition-colors duration-[180ms] ${
              active
                ? "text-[color:var(--line-bright)]"
                : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
            }`}
          >
            {tab.label}
            {tab.slug === "reviewer" && dueCount > 0 && (
              <span className="tabular ml-1.5 rounded-full bg-[color:var(--line-dim)] px-1.5 py-0.5 text-[0.64rem] text-[color:var(--line-bright)]">
                {dueCount}
              </span>
            )}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-2 bottom-0 h-[2px] rounded-t"
                style={{ background: "var(--line)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
