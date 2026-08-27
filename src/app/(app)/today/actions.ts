"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PeriodTaskStatus } from "@/generated/prisma/client";

/**
 * Marking a period done is the only write Beschy makes from Today, and it is
 * deliberately two fields: what happened, and what he wants to say about it.
 *
 * The report is the input to the next batch of tasks — "got stuck on the
 * chain rule when it was inside a log" is worth more than a tick, so the
 * field stays free text rather than a rating out of five.
 */
export async function setPeriodTaskStatus(
  id: string,
  status: PeriodTaskStatus,
  report?: string,
) {
  const user = await requireUser();
  const existing = await prisma.periodTask.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("No such task.");

  await prisma.periodTask.update({
    where: { id },
    data: {
      status,
      report: report?.trim() ? report.trim() : existing.report,
      doneAt: status === "pending" ? null : new Date(),
    },
  });
  revalidatePath("/today");
  revalidatePath("/");
}

export async function savePeriodReport(id: string, report: string) {
  const user = await requireUser();
  const existing = await prisma.periodTask.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("No such task.");
  await prisma.periodTask.update({ where: { id }, data: { report: report.trim() || null } });
  revalidatePath("/today");
}
