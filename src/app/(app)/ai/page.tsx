import Link from "next/link";
import { BotMessageSquare, ClipboardList, GraduationCap, MessagesSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LINES, LINE_ORDER, lineFor } from "@/config/tokens";
import { LineIcon } from "@/components/line-icon";
import { Wrap, Zone } from "@/components/dashboard/shell";

export const dynamic = "force-dynamic";

/**
 * The "I need help" entry point.
 *
 * Rather than a second chat implementation, this routes into the tools that
 * already exist, each pre-pointed at the topic you're actually on — asking
 * about Methods should not start by making you tell it you're doing Methods.
 */
export default async function AiHub() {
  const user = await requireUser();

  const topics = await prisma.topic.findMany({
    where: { userId: user.id, unlockState: "active" },
    include: { unit: { include: { subject: true } } },
    orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
  });

  const activeByCode = new Map(
    topics
      .filter((t) => lineFor(t.unit.subject.shortCode))
      .map((t) => [t.unit.subject.shortCode, t]),
  );

  return (
    <Wrap>
      <Zone eyebrow="Ask AI">
        <h1 className="font-display text-2xl font-medium text-[color:var(--text)]">
          What do you need a hand with?
        </h1>
        <p className="mt-1.5 max-w-xl text-xs text-[color:var(--text-muted)]">
          Every one of these knows your curriculum, where you are in it, and how you&apos;ve rated
          each topic — so you don&apos;t have to explain any of that first.
        </p>
      </Zone>

      <Zone eyebrow="Ask about the topic you're on">
        <ul className="grid gap-2 sm:grid-cols-2">
          {LINE_ORDER.map((code) => {
            const line = LINES[code];
            const topic = activeByCode.get(code);
            return (
              <li key={code}>
                <Link
                  href={
                    topic
                      ? `/subjects/${code}/tutor?topicId=${topic.id}`
                      : `/subjects/${code}`
                  }
                  className="flex h-full items-start gap-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3.5 transition-colors hover:bg-[color:var(--surface-raised)]"
                >
                  <span
                    className="mt-0.5 shrink-0"
                    style={{ color: `var(--line-${line.slug}-bright)` }}
                  >
                    <LineIcon name={line.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="signage block font-display text-xs font-bold"
                      style={{ color: `var(--line-${line.slug}-bright)` }}
                    >
                      {line.label}
                    </span>
                    <span className="mt-0.5 block text-[0.64rem] text-[color:var(--text-muted)]">
                      {topic ? (
                        <>
                          U{topic.unit.number} · {topic.title}
                        </>
                      ) : (
                        "No active topic yet"
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Zone>

      <Zone eyebrow="Bigger picture">
        <ul className="grid gap-2 sm:grid-cols-2">
          <Tool
            href="/placement"
            icon={<ClipboardList className="h-4 w-4" aria-hidden />}
            title="Work out my level"
            body="A diagnostic across a whole subject. Answers get marked, every topic comes back red, amber or green, and the planner uses it straight away."
          />
          <Tool
            href="/coach"
            icon={<GraduationCap className="h-4 w-4" aria-hidden />}
            title="Study coach"
            body="Looks at your last 14 days — hours per subject, card accuracy, paper scores — and says what to change. Cites your actual numbers."
          />
          <Tool
            href="/plan"
            icon={<BotMessageSquare className="h-4 w-4" aria-hidden />}
            title="What should I do right now"
            body="The ranked plan, with the reasoning and the numbers behind every item."
          />
          <Tool
            href="/weekly-review"
            icon={<MessagesSquare className="h-4 w-4" aria-hidden />}
            title="Weekly review"
            body="What the week actually looked like, and the three things worth doing next week."
          />
        </ul>
      </Zone>
    </Wrap>
  );
}

function Tool({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-full items-start gap-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-3.5 transition-colors hover:bg-[color:var(--surface-raised)]"
      >
        <span className="mt-0.5 shrink-0 text-[color:var(--text-muted)]">{icon}</span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-[color:var(--text)]">{title}</span>
          <span className="mt-0.5 block text-[0.64rem] text-[color:var(--text-muted)]">{body}</span>
        </span>
      </Link>
    </li>
  );
}
