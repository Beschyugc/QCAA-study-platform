"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotMessageSquare, FileText, LayoutDashboard, Timer, Sparkles, TriangleAlert } from "lucide-react";
import { LINES, LINE_ORDER } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";

/**
 * Left rail. Dashboard first, then one entry per subject, then the tools that
 * cut across subjects.
 *
 * Each subject row carries its live due-card count, so "what have I got left
 * today" is answerable from anywhere in the app without navigating.
 *
 * The active row is marked by a filled left edge in the line's own colour —
 * the same visual grammar as the network map, where a solid stroke means
 * "this is where you are".
 */

export type SidebarCounts = {
  /** Cards due right now, keyed by subject shortCode. */
  due: Record<string, number>;
  /** Red-rated objectives, keyed by shortCode — drives the attention dot. */
  red: Record<string, number>;
  /** Logged mistakes ready to be re-attempted. */
  mistakesDue: number;
};

export function Sidebar({ counts }: { counts: SidebarCounts }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections"
      className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-[color:var(--hairline)] bg-[color:var(--surface)] p-2 lg:h-dvh lg:w-[232px] lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-3"
    >
      <Link
        href="/"
        className="signage mb-1 hidden items-center gap-2.5 px-2.5 py-2 font-display text-sm font-bold lg:flex"
      >
        <span
          className="h-2.5 w-2.5 rounded-full bg-[color:var(--line-methods)]"
          style={{ boxShadow: "0 0 0 4px var(--line-methods-glow)" }}
        />
        STUDYLINE
      </Link>

      <Row href="/" label="Dashboard" active={pathname === "/"}>
        <LayoutDashboard className="h-4 w-4" aria-hidden />
      </Row>

      <p className="signage mt-3 hidden px-2.5 py-1 text-[0.64rem] font-semibold text-[color:var(--text-faint)] lg:block">
        Subjects
      </p>

      {LINE_ORDER.map((code) => {
        const line = LINES[code];
        const href = `/subjects/${code}`;
        const active = pathname.startsWith(href);
        const due = counts.due[code] ?? 0;
        const red = counts.red[code] ?? 0;
        return (
          <Row
            key={code}
            href={href}
            label={titleCase(line.label)}
            active={active}
            accent={line.slug}
            badge={due > 0 ? due : undefined}
            // A red dot means "this subject has objectives you've rated red".
            // Never a count of failures — just where the attention belongs.
            dot={red > 0}
          >
            <span style={{ color: `var(--line-${line.slug}-bright)` }}>
              <LineIcon name={line.icon} className="h-4 w-4" />
            </span>
          </Row>
        );
      })}

      <p className="signage mt-3 hidden px-2.5 py-1 text-[0.64rem] font-semibold text-[color:var(--text-faint)] lg:block">
        Tools
      </p>

      {/* Exams and assumed knowledge sit at the top level rather than buried in
          a subject, because neither is something you go looking for inside one
          subject — you sit a paper, or you drill the basics across everything. */}
      <Row
        href="/past-papers"
        label="Past papers"
        active={pathname.startsWith("/past-papers")}
      >
        <FileText className="h-4 w-4" aria-hidden />
      </Row>
      <Row
        href="/assumed-knowledge"
        label="Assumed knowledge"
        active={pathname.startsWith("/assumed-knowledge")}
      >
        <Sparkles className="h-4 w-4" aria-hidden />
      </Row>
      <Row
        href="/mistakes"
        label="Mistake folder"
        active={pathname.startsWith("/mistakes")}
        badge={counts.mistakesDue > 0 ? counts.mistakesDue : undefined}
      >
        <TriangleAlert className="h-4 w-4" aria-hidden />
      </Row>
      <Row href="/timer" label="Timer" active={pathname.startsWith("/timer")}>
        <Timer className="h-4 w-4" aria-hidden />
      </Row>
      <Row href="/ai" label="Ask AI" active={pathname.startsWith("/ai")}>
        <BotMessageSquare className="h-4 w-4" aria-hidden />
      </Row>
    </nav>
  );
}

function Row({
  href,
  label,
  active,
  accent,
  badge,
  dot,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  accent?: string;
  badge?: number;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors duration-[180ms] ${
        active
          ? "bg-[color:var(--surface-raised)] text-[color:var(--text)]"
          : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface-raised)] hover:text-[color:var(--text)]"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r"
          style={{ background: accent ? `var(--line-${accent})` : "var(--text)" }}
        />
      )}
      {children}
      <span className="whitespace-nowrap">{label}</span>
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-[color:var(--state-danger)]"
          aria-label="has red-rated objectives"
        />
      )}
      {badge !== undefined && (
        <span className="tabular ml-auto rounded-full bg-[color:var(--ink)] px-1.5 py-0.5 text-[0.64rem] text-[color:var(--text-muted)]">
          {badge}
        </span>
      )}
    </Link>
  );
}

function titleCase(label: string): string {
  // Line labels are signage-uppercase ("METHODS"); the sidebar reads better
  // in sentence case, and PE stays PE.
  if (label.length <= 3) return label;
  return label.charAt(0) + label.slice(1).toLowerCase();
}
