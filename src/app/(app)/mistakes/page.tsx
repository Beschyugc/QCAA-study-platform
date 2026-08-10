import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LINE_ORDER } from "@/config/tokens";
import { MistakesClient } from "./client";

export const dynamic = "force-dynamic";

/**
 * The Mistake Folder — every lost mark, why it was lost, and what fixes it.
 *
 * Modelled on Examora's, with the addition that matters: a mistake can be
 * logged straight from a failed card in the reviewer, not only from a
 * self-marked exam. Most errors happen while drilling, and theirs never sees
 * those.
 */
export default async function MistakesPage() {
  const user = await requireUser();

  const [mistakes, subjects] = await Promise.all([
    prisma.mistake.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { timesRepeated: "desc" }, { lastSeenAt: "desc" }],
      include: {
        subject: { select: { shortCode: true, name: true } },
        topic: { select: { title: true } },
        card: { select: { front: true } },
      },
    }),
    prisma.subject.findMany({
      where: { userId: user.id },
      select: { id: true, shortCode: true, name: true },
    }),
  ]);

  // Subjects in the app's canonical line order, so this page agrees with the
  // sidebar and every other screen rather than falling back to insertion order.
  // indexOf against a widened copy: LINE_ORDER is a tuple of known short codes,
  // and a subject's shortCode is a plain string, so comparing them directly is
  // a type error rather than a runtime one. An unknown code sorts last.
  const order: readonly string[] = LINE_ORDER;
  const rank = (code: string) => {
    const i = order.indexOf(code);
    return i === -1 ? order.length : i;
  };
  const ordered = [...subjects].sort((a, b) => rank(a.shortCode) - rank(b.shortCode));

  return (
    <MistakesClient
      subjects={ordered}
      mistakes={mistakes.map((m) => ({
        id: m.id,
        subject: m.subject.shortCode,
        topic: m.topic?.title ?? null,
        cardFront: m.card?.front ?? null,
        category: m.category,
        status: m.status,
        whatWentWrong: m.whatWentWrong,
        whyItHappened: m.whyItHappened,
        fixAction: m.fixAction,
        source: m.source,
        marksLost: m.marksLost,
        timesRepeated: m.timesRepeated,
        nextReviewAt: m.nextReviewAt ? m.nextReviewAt.toISOString() : null,
        lastSeenAt: m.lastSeenAt.toISOString(),
      }))}
    />
  );
}
