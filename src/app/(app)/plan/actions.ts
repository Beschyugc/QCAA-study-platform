"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTopicRecommendations } from "@/lib/recommendation-data";
import {
  DAILY_PLAN_MINUTE_CEILING,
  DAILY_PLAN_SESSION_MINUTES,
  DAILY_PLAN_MAX_ITEMS,
} from "@/config/recommendation";
import { localDateKey } from "@/lib/date";

export type PlanItem = {
  topicId: string;
  topicNumber: number;
  topicTitle: string;
  subjectId: string;
  subjectName: string;
  subjectColour: string;
  minutes: number;
  score: number;
  status: "pending" | "done" | "skipped";
};

export async function generateDailyPlan() {
  const user = await requireUser();
  const recommendations = await getTopicRecommendations(user.id);

  const items: PlanItem[] = [];
  let totalMinutes = 0;
  for (const rec of recommendations) {
    if (items.length >= DAILY_PLAN_MAX_ITEMS) break;
    if (totalMinutes + DAILY_PLAN_SESSION_MINUTES > DAILY_PLAN_MINUTE_CEILING) break;
    items.push({
      topicId: rec.topicId,
      topicNumber: rec.topicNumber,
      topicTitle: rec.topicTitle,
      subjectId: rec.subjectId,
      subjectName: rec.subjectName,
      subjectColour: rec.subjectColour,
      minutes: DAILY_PLAN_SESSION_MINUTES,
      score: rec.result.score,
      status: "pending",
    });
    totalMinutes += DAILY_PLAN_SESSION_MINUTES;
  }

  const dateKey = localDateKey(new Date());
  await prisma.dailyPlan.upsert({
    where: { userId_date: { userId: user.id, date: new Date(dateKey) } },
    create: {
      userId: user.id,
      date: new Date(dateKey),
      planJson: items,
    },
    update: {
      generatedAt: new Date(),
      planJson: items,
    },
  });

  revalidatePath("/plan");
}

export async function updatePlanItemStatus(
  topicId: string,
  status: "done" | "skipped",
) {
  const user = await requireUser();
  const dateKey = localDateKey(new Date());
  const plan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId: user.id, date: new Date(dateKey) } },
  });
  if (!plan) return;

  const items = (plan.planJson as unknown as PlanItem[]).map((item) =>
    item.topicId === topicId ? { ...item, status } : item,
  );
  const wasFollowed = items.every((i) => i.status !== "pending");

  await prisma.dailyPlan.update({
    where: { id: plan.id },
    data: { planJson: items, wasFollowed },
  });
  revalidatePath("/plan");
}
