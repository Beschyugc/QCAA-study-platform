import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CoachClient } from "./coach-client";

export default async function CoachPage() {
  const user = await requireUser();
  const past = await prisma.aiConversation.findMany({
    where: { userId: user.id, mode: "study_coach" },
    orderBy: { startedAt: "desc" },
    take: 5,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-muted-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Study Coach</h1>
      <CoachClient
        pastCheckIns={past.map((c) => ({
          date: c.startedAt.toISOString(),
          content: c.messages[0]?.content ?? "",
        }))}
      />
    </div>
  );
}
