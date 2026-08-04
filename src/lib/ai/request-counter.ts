import { prisma } from "@/lib/prisma";
import { startOfLocalDay } from "@/lib/date";

// Approximates today's AI request count by counting assistant AiMessage
// rows created today. Undercounts failed/rate-limited attempts (those
// never produce a message row) — a real request-log table would be more
// accurate, but this needs no schema change and is close enough for the
// brief's "so I can see how close to the daily cap I am" indicator.
export async function getTodayRequestCount(userId: string): Promise<number> {
  return prisma.aiMessage.count({
    where: {
      userId,
      role: "assistant",
      createdAt: { gte: startOfLocalDay(new Date()) },
    },
  });
}
