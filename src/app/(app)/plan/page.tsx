import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTopicRecommendations } from "@/lib/recommendation-data";
import { localDateKey } from "@/lib/date";
import { PlanClient } from "./plan-client";
import type { PlanItem } from "./actions";

export default async function PlanPage() {
  const user = await requireUser();
  const [recommendations, existingPlan] = await Promise.all([
    getTopicRecommendations(user.id),
    prisma.dailyPlan.findUnique({
      where: { userId_date: { userId: user.id, date: new Date(localDateKey(new Date())) } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Today's Plan</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every active topic ranked by priority, ignoring how much time you
        actually have. For what fits tonight around your timetable, use This
        Afternoon on the dashboard. Click a topic to see exactly why it&apos;s
        recommended.
      </p>
      <PlanClient
        recommendations={recommendations}
        existingItems={(existingPlan?.planJson as unknown as PlanItem[]) ?? null}
      />
    </div>
  );
}
