import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Full provider abstraction per §11.1 of the build brief. Swapping to a
// different primary provider later means changing this file, not every
// call site — every call site should only ever import generateText() /
// generateJson() from here.

export type AiMessage = { role: "user" | "assistant" | "system"; content: string };

type GenerateOptions = {
  jsonMode?: boolean;
};

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

// ---------- response cache ----------
// In-memory, per-process — resets on cold start. Good enough for "the same
// question asked twice in one session doesn't burn two requests"; a real
// cross-instance cache (Redis/KV) would be a Phase 14+ upgrade, not
// something to build speculatively now.
const CACHE_TTL_MS = 10 * 60_000;
const responseCache = new Map<string, { value: string; expiresAt: number }>();

function cacheKey(messages: AiMessage[], options?: GenerateOptions): string {
  return JSON.stringify({ messages, options });
}

// ---------- Gemini call with backoff ----------

async function callGemini(
  messages: AiMessage[],
  options: GenerateOptions | undefined,
  apiKey: string,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const systemMessages = messages.filter((m) => m.role === "system");
  const conversation = messages.filter((m) => m.role !== "system");

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
    systemInstruction: systemMessages.map((m) => m.content).join("\n\n") || undefined,
    generationConfig: options?.jsonMode
      ? { responseMimeType: "application/json" }
      : undefined,
  });

  const history = conversation.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastMessage = conversation[conversation.length - 1];

  const maxAttempts = 3;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      return result.response.text();
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number })?.status;
      if (status === 429 && attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// ---------- OpenAI-compatible fallback (Groq / OpenRouter) ----------

async function callFallback(
  messages: AiMessage[],
  options: GenerateOptions | undefined,
): Promise<string> {
  const provider = process.env.FALLBACK_AI_PROVIDER;
  const apiKey = process.env.FALLBACK_AI_KEY;
  if (!provider || provider === "none" || !apiKey) {
    throw new AiUnavailableError("No fallback AI provider configured.");
  }

  const baseURL =
    provider === "groq"
      ? "https://api.groq.com/openai/v1"
      : "https://openrouter.ai/api/v1";
  const model = provider === "groq" ? "llama-3.3-70b-versatile" : "openai/gpt-4o-mini";

  const client = new OpenAI({ apiKey, baseURL });
  const response = await client.chat.completions.create({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    ...(options?.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
  });
  return response.choices[0]?.message?.content ?? "";
}

// ---------- public API ----------

export async function generateText(
  messages: AiMessage[],
  options?: GenerateOptions,
): Promise<string> {
  const key = cacheKey(messages, options);
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const apiKey = process.env.GEMINI_API_KEY;
  let result: string;

  if (apiKey) {
    try {
      result = await callGemini(messages, options, apiKey);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 429) {
        try {
          result = await callFallback(messages, options);
        } catch {
          throw new AiUnavailableError(
            "Gemini is rate-limited and no fallback provider is configured. Try again later.",
          );
        }
      } else {
        throw new AiUnavailableError(
          `AI request failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  } else {
    try {
      result = await callFallback(messages, options);
    } catch {
      throw new AiUnavailableError(
        "GEMINI_API_KEY is not set and no fallback provider is configured — add a real key to .env.local (and Vercel) to use AI features.",
      );
    }
  }

  responseCache.set(key, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export async function generateJson(prompt: string): Promise<string> {
  return generateText([{ role: "user", content: prompt }], { jsonMode: true });
}
