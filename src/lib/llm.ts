import Groq from "groq-sdk";
import OpenAI from "openai";

export type Provider = "groq" | "gemini";

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type StreamChunk = { delta: string };

function provider(): Provider {
  const p = (process.env.LLM_PROVIDER ?? "groq").toLowerCase();
  if (p !== "groq" && p !== "gemini") throw new Error(`Unsupported LLM_PROVIDER: ${p}`);
  return p;
}

function model(): string {
  const fallback = provider() === "groq" ? "llama-3.3-70b-versatile" : "gemini-2.0-flash";
  return process.env.LLM_MODEL ?? fallback;
}

function groqClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");
  return new Groq({ apiKey: key });
}

function geminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

export async function* streamChat(
  messages: LlmMessage[],
  signal: AbortSignal,
): AsyncIterable<StreamChunk> {
  if (provider() === "groq") {
    const client = groqClient();
    const stream = await client.chat.completions.create(
      { model: model(), messages, stream: true },
      { signal },
    );
    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content ?? "";
      if (delta) yield { delta };
    }
    return;
  }

  const client = geminiClient();
  const stream = await client.chat.completions.create(
    { model: model(), messages, stream: true },
    { signal },
  );
  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content ?? "";
    if (delta) yield { delta };
  }
}
