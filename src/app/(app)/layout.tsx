import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LINE_ORDER } from "@/config/tokens";
import { Sidebar, type SidebarCounts } from "@/components/nav/sidebar";

/**
 * Shell for everything behind auth. `/login` and `/auth` sit outside this
 * route group so they never render the sidebar.
 *
 * The due/red counts are fetched once here rather than per page, so every
 * screen shows the same numbers and navigating doesn't re-query five times.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  const [dueRows, redRows] = await Promise.all([
    // Only cards on unlocked topics count as due. A locked topic's cards
    // exist but are not yours yet — surfacing them would undercut the whole
    // point of unlocking.
    prisma.card.findMany({
      where: {
        userId: user.id,
        isSuspended: false,
        topic: { unlockState: { in: ["active", "mastered"] } },
        scheduling: { dueDate: { lte: new Date() } },
      },
      select: { subject: { select: { shortCode: true } } },
    }),
    prisma.learningObjective.findMany({
      where: {
        userId: user.id,
        ragStatus: "red",
        subtopic: { topic: { unlockState: { in: ["active", "mastered"] } } },
      },
      select: { subtopic: { select: { topic: { select: { unit: { select: { subject: { select: { shortCode: true } } } } } } } } },
    }),
  ]);

  const counts: SidebarCounts = { due: {}, red: {} };
  for (const code of LINE_ORDER) {
    counts.due[code] = 0;
    counts.red[code] = 0;
  }
  for (const row of dueRows) {
    const code = row.subject.shortCode;
    if (code in counts.due) counts.due[code] += 1;
  }
  for (const row of redRows) {
    const code = row.subtopic.topic.unit.subject.shortCode;
    if (code in counts.red) counts.red[code] += 1;
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="lg:sticky lg:top-0 lg:h-dvh">
        <Sidebar counts={counts} />
      </div>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
