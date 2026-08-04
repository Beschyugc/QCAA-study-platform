import Anthropic from "@anthropic-ai/sdk";
import { stripJsonFences } from "./provider";

// Separate from provider.ts's generateText() because image content blocks
// are a distinct message shape from plain text — no other part of the app
// needs vision yet, so this isn't generalized into the main provider
// abstraction prematurely. If a second vision use case shows up, that's
// the signal to fold this in properly.
export async function extractFromImage(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  prompt: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set — image extraction needs Claude specifically (Gemini fallback not wired for vision yet).");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
    max_tokens: 8192,
    // This model does extended thinking by default even when not asked,
    // and it can silently eat most of max_tokens (confirmed: 6488 of 8192
    // tokens went to thinking on a real image, truncating the actual
    // answer). Structured extraction doesn't need visible reasoning —
    // disable it so the full budget goes to the answer.
    thinking: { type: "disabled" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
          { type: "text", text: prompt },
        ],
      },
    ],
  });
  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock && "text" in textBlock ? textBlock.text : "";
  return stripJsonFences(text);
}
