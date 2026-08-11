import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LINE_ORDER } from "@/config/tokens";
import { dailyCardTarget, type RagCounts } from "@/config/daily";
import { NEW_CARDS_PER_DAY, REVIEWS_PER_DAY } from "@/config/srs";
import { Sidebar, type SidebarCounts } from "@/components/nav/sidebar";
import { isAiConfigured } from "@/lib/ai/provider";
import { AiUnavailableBanner } from "@/components/ai-unavailable-banner";

/**
 * Shell for everything behind auth. `/login` and `/auth` sit outside this
 * route group so they never render the sidebar.
 *
 * The due/red counts are fetched once here rather than per page, so every
 * screen shows the same numbers and navigating doesn't re-query five times.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  const [dueRows, objectiveRows, mistakesDue] = await Promise.all([
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
      select: {
        subject: { select: { shortCode: true } },
        scheduling: { select: { state: true } },
      },
    }),
    // Every objective on an unlocked topic, not just the red ones: the same
    // rows answer "how red is this subject" and "what is its daily target",
    // so one query does what previously needed two.
    prisma.learningObjective.findMany({
      where: {
        userId: user.id,
        subtopic: { topic: { unlockState: { in: ["active", "mastered"] } } },
      },
      select: {
        ragStatus: true,
        subtopic: { select: { topic: { select: { unit: { select: { subject: { select: { shortCode: true } } } } } } } },
      },
    }),
    // Mistakes ready to be re-attempted. Mastered ones have a null
    // nextReviewAt, so they drop out of this without needing a status filter.
    prisma.mistake.count({
      where: {
        userId: user.id,
        NOT: { status: "mastered" },
        nextReviewAt: { lte: new Date() },
      },
    }),
  ]);

  const rag: Record<string, RagCounts> = {};
  const dueNew: Record<string, number> = {};
  const dueReview: Record<string, number> = {};
  for (const code of LINE_ORDER) {
    rag[code] = { red: 0, amber: 0, green: 0, unrated: 0 };
    dueNew[code] = 0;
    dueReview[code] = 0;
  }

  for (const row of dueRows) {
    const code = row.subject.shortCode;
    if (!(code in dueNew)) continue;
    if (row.scheduling?.state === "new") dueNew[code] += 1;
    else dueReview[code] += 1;
  }
  for (const row of objectiveRows) {
    const code = row.subtopic.topic.unit.subject.shortCode;
    if (code in rag) rag[code][row.ragStatus] += 1;
  }

  // The badge is answering "what have I got left today", so it has to be the
  // size of the set the reviewer will actually serve — not the raw due pile.
  //
  // These are the same three caps reviewer/page.tsx applies, in the same
  // order. Importing 2,101 Anki cards made every one of them due at once, and
  // a badge reading "282" against a daily set of 14 is both wrong and
  // demoralising. Any change to the queue rules has to be mirrored here or the
  // sidebar and the reviewer start disagreeing about today.
  const counts: SidebarCounts = { due: {}, red: {}, mistakesDue, unratedObjectives: 0 };
  for (const code of LINE_ORDER) {
    const reviews = Math.min(dueReview[code], REVIEWS_PER_DAY);
    const target = dailyCardTarget(rag[code]);
    const fresh = Math.min(dueNew[code], NEW_CARDS_PER_DAY, Math.max(0, target - reviews));
    counts.due[code] = reviews + fresh;
    counts.red[code] = rag[code].red;
    // Counted over unlocked topics only, same as everything else here —
    // those are the objectives the recommendation engine actually scores,
    // so they're the ones whose missing ratings make it guess.
    counts.unratedObjectives += rag[code].unrated;
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="lg:sticky lg:top-0 lg:h-dvh">
        <Sidebar counts={counts} />
      </div>
      <main className="min-w-0 flex-1">
        {/* Checked per request rather than cached: the fix is adding an env
            var and redeploying, and the banner has to disappear the moment
            that happens. */}
        {!isAiConfigured() && <AiUnavailableBanner />}
        {children}
      </main>
    </div>
  );
}
