import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Full provider abstraction per §11.1 of the build brief. Swapping to a
// different primary provider later means changing this file, not every
// call site — every call site should only ever import generateText() /
// generateJson() from here.
//
// Provider order: Anthropic (Claude Sonnet 5) primary -> Gemini secondary
// -> Groq/OpenRouter tertiary fallback. Anthropic is primary because
// that's what's actually configured; the brief originally specced Gemini
// for its free tier, but a real Anthropic key beats a hypothetical Gemini
// one. Gemini/fallback stay wired in case Anthropic rate-limits or a
// Gemini key gets added later.

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

function statusOf(error: unknown): number | undefined {
  return (error as { status?: number })?.status;
}

async function withBackoff<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (statusOf(error) === 429 && attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// ---------- Anthropic (primary) ----------

async function callAnthropic(
  messages: AiMessage[],
  options: GenerateOptions | undefined,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const systemMessages = messages.filter((m) => m.role === "system");
  const conversation = messages.filter((m) => m.role !== "system");

  let system = systemMessages.map((m) => m.content).join("\n\n");
  if (options?.jsonMode) {
    system += "\n\nRespond with ONLY valid JSON — no markdown code fences, no commentary before or after.";
  }

  return withBackoff(async () => {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
      max_tokens: 4096,
      system: system || undefined,
      messages: conversation.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
    });
    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : "";
  });
}

// ---------- Gemini (secondary) ----------

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

  return withBackoff(async () => {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  });
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

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  let result: string | undefined;
  let lastError: unknown;

  if (anthropicKey) {
    try {
      result = await callAnthropic(messages, options, anthropicKey);
    } catch (error) {
      lastError = error;
    }
  }

  if (result === undefined && geminiKey) {
    try {
      result = await callGemini(messages, options, geminiKey);
    } catch (error) {
      lastError = error;
    }
  }

  if (result === undefined) {
    try {
      result = await callFallback(messages, options);
    } catch {
      throw new AiUnavailableError(
        lastError
          ? `AI request failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`
          : "No AI provider is configured — add ANTHROPIC_API_KEY (or GEMINI_API_KEY) to .env.local (and Vercel) to use AI features.",
      );
    }
  }

  if (options?.jsonMode) {
    result = stripJsonFences(result);
  }

  responseCache.set(key, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

// Anthropic doesn't have a hard JSON-mode guarantee like Gemini's
// responseMimeType — it sometimes wraps output in ```json fences despite
// being told not to (confirmed against a real response, not a hypothetical).
// Strip defensively rather than trusting every provider to follow the
// instruction every time.
export function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

export async function generateJson(prompt: string): Promise<string> {
  return generateText([{ role: "user", content: prompt }], { jsonMode: true });
}
