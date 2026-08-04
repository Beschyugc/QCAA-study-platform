import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lineFor } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";
import { SubjectTabs } from "@/components/subject/tabs";

/**
 * Every subject route renders inside this: the same header, the same tabs,
 * themed entirely in that subject's line colour. When you're in Methods, the
 * app is vermilion.
 *
 * The theming works by setting --line and --line-bright on the wrapper, so
 * child components can use one pair of variables instead of each knowing which
 * subject they're inside.
 */
export default async function SubjectLayout({
  children,
  params,
}: LayoutProps<"/subjects/[shortCode]">) {
  const { shortCode } = await params;
  const user = await requireUser();
  const code = shortCode.toUpperCase();
  const line = lineFor(code);
  if (!line) notFound();

  const subject = await prisma.subject.findFirst({
    where: { userId: user.id, shortCode: code },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: { topics: { orderBy: { order: "asc" }, select: { id: true, unlockState: true } } },
      },
    },
  });
  if (!subject) notFound();

  const topics = subject.units.flatMap((u) => u.topics);
  const mastered = topics.filter((t) => t.unlockState === "mastered").length;
  const active = subject.units
    .flatMap((u) => u.topics.map((t) => ({ unit: u, topic: t })))
    .find((x) => x.topic.unlockState === "active");

  const dueCount = await prisma.card.count({
    where: {
      userId: user.id,
      subjectId: subject.id,
      isSuspended: false,
      topic: { unlockState: { in: ["active", "mastered"] } },
      scheduling: { dueDate: { lte: new Date() } },
    },
  });

  return (
    <div
      style={
        {
          "--line": `var(--line-${line.slug})`,
          "--line-bright": `var(--line-${line.slug}-bright)`,
          "--line-dim": `var(--line-${line.slug}-dim)`,
          "--line-glow": `var(--line-${line.slug}-glow)`,
        } as React.CSSProperties
      }
    >
      <header className="border-b border-[color:var(--hairline)] px-4 pt-6 sm:px-7">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1
              className="signage flex items-center gap-2.5 font-display text-3xl font-bold"
              style={{ color: "var(--line-bright)" }}
            >
              <LineIcon name={line.icon} className="h-6 w-6 shrink-0" />
              {line.label}
            </h1>
            <p className="text-xs text-[color:var(--text-muted)]">
              {active ? (
                <>
                  Currently on{" "}
                  <span className="tabular text-[color:var(--text)]">
                    U{active.unit.number} T{active.topic.id ? topicNumber(subject, active.topic.id) : ""}
                  </span>
                </>
              ) : mastered === topics.length && topics.length > 0 ? (
                "Every topic mastered"
              ) : (
                "No active topic"
              )}
            </p>
            <p className="tabular ml-auto text-xs text-[color:var(--text-muted)]">
              {mastered}/{topics.length} topics · {dueCount} cards due
            </p>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color:var(--surface-raised)]">
            <div
              className="h-full rounded-full transition-[width] duration-[600ms]"
              style={{
                width: `${topics.length === 0 ? 0 : Math.round((mastered / topics.length) * 100)}%`,
                background: "var(--line)",
              }}
            />
          </div>

          <SubjectTabs shortCode={code} dueCount={dueCount} />
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-7">{children}</div>
    </div>
  );
}

function topicNumber(
  subject: { units: { number: number; topics: { id: string }[] }[] },
  topicId: string,
): number | string {
  for (const unit of subject.units) {
    const index = unit.topics.findIndex((t) => t.id === topicId);
    if (index >= 0) return index + 1;
  }
  return "";
}
