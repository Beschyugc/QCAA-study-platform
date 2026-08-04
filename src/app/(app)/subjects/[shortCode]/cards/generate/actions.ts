"use server";

import { revalidatePath } from "next/cache";
import { PDFParse } from "pdf-parse";
import { requireUser } from "@/lib/auth";
import { generateText, AiUnavailableError } from "@/lib/ai/provider";
import { saveCards, stripJsonFences, type DraftCard } from "@/lib/cards";

const MAX_CARDS = 25;

export type { DraftCard };

// §11.1 "Card generation from content": draft cards from notes, show them
// in a review queue, nothing auto-saves. This accepts pasted text OR an
// uploaded file directly, rather than requiring notes to already exist as
// a Document row first — there's no separate notes-management UI built
// yet, and gating card generation behind one would just add friction for
// no benefit right now.
export async function generateCardsFromText(topicTitle: string, notesText: string) {
  try {
    const trimmed = notesText.slice(0, 20000); // keep the prompt reasonable
    const response = await generateText([
      {
        role: "system",
        content: `You draft flashcards from study notes for a Year 12 QCAA General student on the topic "${topicTitle}". Generate at most ${MAX_CARDS} cards. Prefer "basic" cards (front/back) for most content; use "cloze" (front contains {{c1::the answer}} inline, back can repeat the front) only where a fill-in-the-blank genuinely tests the concept better. Keep cards atomic — one fact/concept per card, not paragraphs. Respond with ONLY a valid JSON array: [{"front": "...", "back": "...", "cardType": "basic"}, ...]`,
      },
      { role: "user", content: trimmed },
    ], { jsonMode: true });

    const parsed: DraftCard[] = JSON.parse(stripJsonFences(response));
    return { cards: parsed.slice(0, MAX_CARDS), error: null };
  } catch (error) {
    return {
      cards: null,
      error: error instanceof AiUnavailableError ? error.message : "Card generation failed.",
    };
  }
}

export async function extractTextFromFile(formData: FormData): Promise<{ text: string | null; error: string | null }> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { text: null, error: "No file provided" };
  try {
    if (file.type === "application/pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: buffer });
      const { text } = await parser.getText();
      return { text, error: null };
    }
    // Plain text fallback for .txt or similar.
    return { text: await file.text(), error: null };
  } catch {
    return { text: null, error: "Could not read that file — try pasting the text instead." };
  }
}

export async function saveGeneratedCards(
  shortCode: string,
  subjectId: string,
  topicId: string,
  accepted: DraftCard[],
) {
  const user = await requireUser();
  // Bulk insert via lib/cards — the old per-card loop overran Prisma's 5s
  // transaction ceiling on a full 25-card batch and silently rolled back.
  await saveCards(user.id, subjectId, topicId, accepted, ["ai-generated"]);
  revalidatePath(`/subjects/${shortCode}/cards`);
  revalidatePath(`/subjects/${shortCode}`);
}
