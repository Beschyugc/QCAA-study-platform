import { GoogleGenerativeAI } from "@google/generative-ai";

// Minimal provider for the one AI call Phase 2 needs (syllabus extraction).
// Phase 7 replaces this with the full provider abstraction — caching,
// 429 backoff, request counter, Groq/OpenRouter fallback — per the build
// brief's §11.1. Don't grow this file ad hoc before that slice.
export async function generateJson(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set — add a real key to .env.local (and Vercel) to use AI features.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
