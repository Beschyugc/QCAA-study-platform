import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const user = await requireUser();
  const sessions = await prisma.studySession.findMany({
    where: { userId: user.id },
    include: { subject: { select: { name: true } }, topic: { select: { title: true } } },
    orderBy: { startedAt: "desc" },
  });

  const headers = ["date", "subject", "topic", "focus_minutes", "break_minutes", "session_type", "completed_naturally"];
  const lines = [headers.join(",")];
  for (const s of sessions) {
    lines.push(
      [
        s.startedAt.toISOString(),
        csvEscape(s.subject.name),
        csvEscape(s.topic?.title ?? ""),
        s.focusMinutes,
        s.breakMinutes,
        s.sessionType,
        s.completedNaturally,
      ].join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="study-sessions.csv"',
    },
  });
}
