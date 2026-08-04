import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WeeklyReviewClient } from "./weekly-review-client";

export default async function WeeklyReviewPage() {
  const user = await requireUser();
  const reviews = await prisma.weeklyReview.findMany({
    where: { userId: user.id },
    orderBy: { weekStart: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-muted-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Weekly Review</h1>
      <WeeklyReviewClient
        reviews={reviews.map((r) => ({
          weekStart: r.weekStart.toISOString(),
          stats: r.statsJson as unknown as Record<string, unknown>,
          aiSummary: r.aiSummary,
          aiRecommendations: r.aiRecommendations,
        }))}
      />
    </div>
  );
}
