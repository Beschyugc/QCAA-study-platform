import { prisma } from "@/lib/prisma";

// Assembles only what's relevant to the current topic — not all 200
// objectives across five subjects (§11.2). Token budget is approximated
// by characters (~4 chars/token is a reasonable rule of thumb for English
// text) rather than an actual tokenizer — good enough to avoid blowing a
// context window, not precise enough to bill against. If this needs to
// get more accurate later, swap in a real tokenizer here — nowhere else
// should need to change.
const CONTEXT_CHAR_BUDGET = 8000; // ~2000 tokens

export async function buildTopicContext(
  userId: string,
  topicId: string,
): Promise<string> {
  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: topicId, userId },
    include: {
      unit: { include: { subject: true } },
      subtopics: {
        include: { learningObjectives: true },
      },
    },
  });

  const lines: string[] = [
    `Subject: ${topic.unit.subject.name}`,
    `Topic: ${topic.number} — ${topic.title}`,
    "",
    "Learning objectives and current confidence (red = don't understand, amber = shaky, green = confident):",
  ];

  for (const subtopic of topic.subtopics) {
    for (const objective of subtopic.learningObjectives) {
      lines.push(`- [${objective.ragStatus}] ${objective.text}`);
    }
  }

  let context = lines.join("\n");

  if (context.length < CONTEXT_CHAR_BUDGET) {
    const documents = await prisma.document.findMany({
      where: { userId, subjectId: topic.unit.subjectId, extractedText: { not: null } },
      select: { filename: true, extractedText: true },
      take: 3,
    });
    const remaining = CONTEXT_CHAR_BUDGET - context.length;
    if (documents.length > 0 && remaining > 200) {
      const perDocBudget = Math.floor(remaining / documents.length);
      const notesSection = documents
        .map(
          (d) =>
            `--- ${d.filename} ---\n${(d.extractedText ?? "").slice(0, perDocBudget)}`,
        )
        .join("\n\n");
      context += `\n\nRelevant notes:\n${notesSection}`;
    }
  }

  return context.length > CONTEXT_CHAR_BUDGET
    ? context.slice(0, CONTEXT_CHAR_BUDGET) + "\n[truncated]"
    : context;
}
