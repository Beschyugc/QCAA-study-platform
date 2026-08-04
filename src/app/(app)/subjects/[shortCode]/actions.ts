"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  flagIfMasteredTopicRegressed,
  computeMasteryEvidence,
  confirmMastery as confirmMasteryLib,
} from "@/lib/unlocking";

async function nextOrder(
  where: { unitId: string } | { topicId: string } | { subjectId: string },
) {
  if ("unitId" in where) {
    const last = await prisma.topic.findFirst({
      where,
      orderBy: { order: "desc" },
    });
    return (last?.order ?? -1) + 1;
  }
  if ("topicId" in where) {
    const last = await prisma.subtopic.findFirst({
      where,
      orderBy: { order: "desc" },
    });
    return (last?.order ?? -1) + 1;
  }
  const last = await prisma.unit.findFirst({
    where,
    orderBy: { order: "desc" },
  });
  return (last?.order ?? -1) + 1;
}

function revalidate(shortCode: string) {
  revalidatePath(`/subjects/${shortCode}`);
}

// ---------- units ----------

export async function createUnit(
  shortCode: string,
  subjectId: string,
  number: number,
  title: string,
) {
  const user = await requireUser();
  const order = await nextOrder({ subjectId });
  await prisma.unit.create({
    data: { userId: user.id, subjectId, number, title, order },
  });
  revalidate(shortCode);
}

export async function updateUnit(
  shortCode: string,
  id: string,
  data: { number?: number; title?: string },
) {
  const user = await requireUser();
  await prisma.unit.update({ where: { id, userId: user.id }, data });
  revalidate(shortCode);
}

export async function deleteUnit(shortCode: string, id: string) {
  const user = await requireUser();
  await prisma.unit.delete({ where: { id, userId: user.id } });
  revalidate(shortCode);
}

// ---------- topics ----------

export async function createTopic(
  shortCode: string,
  unitId: string,
  number: number,
  title: string,
) {
  const user = await requireUser();
  const order = await nextOrder({ unitId });
  await prisma.topic.create({
    data: { userId: user.id, unitId, number, title, order },
  });
  revalidate(shortCode);
}

export async function updateTopic(
  shortCode: string,
  id: string,
  data: { number?: number; title?: string },
) {
  const user = await requireUser();
  await prisma.topic.update({ where: { id, userId: user.id }, data });
  revalidate(shortCode);
}

export async function deleteTopic(shortCode: string, id: string) {
  const user = await requireUser();
  await prisma.topic.delete({ where: { id, userId: user.id } });
  revalidate(shortCode);
}

export async function moveTopic(
  shortCode: string,
  id: string,
  direction: "up" | "down",
) {
  const user = await requireUser();
  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id, userId: user.id },
  });
  const sibling = await prisma.topic.findFirst({
    where: {
      unitId: topic.unitId,
      userId: user.id,
      order: direction === "up" ? { lt: topic.order } : { gt: topic.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!sibling) return;
  await prisma.$transaction([
    prisma.topic.update({
      where: { id: topic.id },
      data: { order: sibling.order },
    }),
    prisma.topic.update({
      where: { id: sibling.id },
      data: { order: topic.order },
    }),
  ]);
  revalidate(shortCode);
}

// ---------- subtopics ----------

export async function createSubtopic(
  shortCode: string,
  topicId: string,
  title: string,
) {
  const user = await requireUser();
  const order = await nextOrder({ topicId });
  await prisma.subtopic.create({
    data: { userId: user.id, topicId, title, order },
  });
  revalidate(shortCode);
}

export async function updateSubtopic(
  shortCode: string,
  id: string,
  title: string,
) {
  const user = await requireUser();
  await prisma.subtopic.update({
    where: { id, userId: user.id },
    data: { title },
  });
  revalidate(shortCode);
}

export async function deleteSubtopic(shortCode: string, id: string) {
  const user = await requireUser();
  await prisma.subtopic.delete({ where: { id, userId: user.id } });
  revalidate(shortCode);
}

// ---------- learning objectives ----------

export async function createObjective(
  shortCode: string,
  subtopicId: string,
  text: string,
  qcaaReference?: string,
) {
  const user = await requireUser();
  await prisma.learningObjective.create({
    data: { userId: user.id, subtopicId, text, qcaaReference },
  });
  revalidate(shortCode);
}

export async function updateObjective(
  shortCode: string,
  id: string,
  data: { text?: string; qcaaReference?: string },
) {
  const user = await requireUser();
  await prisma.learningObjective.update({
    where: { id, userId: user.id },
    data,
  });
  revalidate(shortCode);
}

export async function deleteObjective(shortCode: string, id: string) {
  const user = await requireUser();
  await prisma.learningObjective.delete({ where: { id, userId: user.id } });
  revalidate(shortCode);
}

const RAG_STATUSES = ["red", "amber", "green", "unrated"] as const;
export type RagStatus = (typeof RAG_STATUSES)[number];

// Appends to rag_history rather than overwriting it — the point is being
// able to see an objective go red -> amber -> green -> amber over time.
export async function setRagStatus(
  shortCode: string,
  id: string,
  status: RagStatus,
) {
  const user = await requireUser();
  const objective = await prisma.learningObjective.findUniqueOrThrow({
    where: { id, userId: user.id },
  });
  const now = new Date().toISOString();
  const history = Array.isArray(objective.ragHistory)
    ? objective.ragHistory
    : [];

  await prisma.learningObjective.update({
    where: { id },
    data: {
      ragStatus: status,
      ragUpdatedAt: now,
      ragHistory: [...history, { status, timestamp: now }],
    },
  });
  await flagIfMasteredTopicRegressed(user.id, id);
  revalidate(shortCode);
}

// ---------- unlocking / mastery ----------

export async function getMasteryEvidence(topicId: string) {
  const user = await requireUser();
  return computeMasteryEvidence(user.id, topicId);
}

export async function confirmMastery(
  shortCode: string,
  topicId: string,
  override: boolean,
) {
  const user = await requireUser();
  await confirmMasteryLib(user.id, topicId, override);
  revalidate(shortCode);
}
