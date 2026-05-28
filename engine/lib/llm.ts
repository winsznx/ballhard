import Groq from "groq-sdk";
import OpenAI from "openai";

import type { Stream } from "groq-sdk/lib/streaming";
import type { ChatCompletionChunk } from "groq-sdk/resources/chat/completions";

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

function provider(): "groq" | "gemini" {
  const p = (process.env.LLM_PROVIDER ?? "groq").toLowerCase();
  if (p !== "groq" && p !== "gemini") throw new Error(`Unsupported LLM_PROVIDER: ${p}`);
  return p;
}

function model(): string {
  const fallback = provider() === "groq" ? "llama-3.3-70b-versatile" : "gemini-2.0-flash";
  return process.env.LLM_MODEL ?? fallback;
}

export type LlmStream = Stream<ChatCompletionChunk> | AsyncIterable<unknown>;

/**
 * Returns the raw provider stream — SpeechEngineSession.sendResponse() auto-extracts
 * deltas from OpenAI-compatible stream chunks (verified in SDK source: extractText()
 * handles `choices[0].delta.content`).
 */
export async function startChatStream(
  messages: LlmMessage[],
  signal: AbortSignal,
): Promise<LlmStream> {
  if (provider() === "groq") {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY not set");
    const client = new Groq({ apiKey: key });
    return client.chat.completions.create(
      { model: model(), messages, stream: true },
      { signal },
    );
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const client = new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
  return client.chat.completions.create(
    { model: model(), messages, stream: true },
    { signal },
  );
}
