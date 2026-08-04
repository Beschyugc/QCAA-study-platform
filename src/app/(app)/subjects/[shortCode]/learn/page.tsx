import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lineFor } from "@/config/tokens";

/**
 * The Learn tab has no index of its own — it drops you straight into the topic
 * you're actually on, which is the whole point of "go topic by topic". The
 * full list already exists on the subject overview.
 */
export default async function LearnIndex({
  params,
}: PageProps<"/subjects/[shortCode]/learn">) {
  const { shortCode } = await params;
  const user = await requireUser();
  const code = shortCode.toUpperCase();
  if (!lineFor(code)) notFound();

  const active = await prisma.topic.findFirst({
    where: {
      userId: user.id,
      unlockState: "active",
      unit: { subject: { shortCode: code, userId: user.id } },
    },
    orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
  });

  if (active) redirect(`/subjects/${code}/learn/${active.id}`);

  // No active topic — everything is either mastered or the curriculum is
  // empty. Either way the overview is the honest place to land.
  redirect(`/subjects/${code}`);
}
