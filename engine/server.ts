/**
 * BALLHARD WS sidecar — multi-scenario.
 *
 * Each scenario gets its own engine.attach() at /ws/<scenarioId>. Scenarios are
 * bound to callbacks via closure — no session-side metadata lookup needed for
 * scenarioId routing. The seng_'s wsUrl is provisioned to point at its own
 * /ws/<scenarioId> path (see scripts/provision-engine.ts).
 *
 * Skips any scenario whose SENG_ID_<UPPER> env var is missing (graceful
 * degradation; logs a warning on boot).
 *
 * SDK shapes — verified in node_modules/@elevenlabs/elevenlabs-js/wrapper/speech-engine/:
 *   engine.attach(http, path, callbacks)
 *   onTranscript(TranscriptMessage[], AbortSignal, SpeechEngineSession)
 *   session.sendResponse(string | AsyncIterable) — auto-extracts OpenAI/Anthropic/Gemini chunks
 *   isAbortError from "@elevenlabs/elevenlabs-js/wrapper/speech-engine/types"
 */

import { createServer } from "node:http";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { isAbortError } from "@elevenlabs/elevenlabs-js/wrapper/speech-engine/types";

import { startChatStream } from "./lib/llm";
import { SCENARIOS, buildMessages, type Scenario } from "../scenarios";

const PORT = Number(process.env.ENGINE_PORT ?? process.env.PORT ?? 8787);
const API_KEY = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVELLABS_API_KEY;

if (!API_KEY) throw new Error("ELEVENLABS_API_KEY required");

function log(...args: unknown[]) {
  console.log(new Date().toISOString(), ...args);
}

function sengIdFor(scenarioId: string): string | undefined {
  return process.env[`SENG_ID_${scenarioId.toUpperCase()}`];
}

async function attachScenario(
  client: ElevenLabsClient,
  httpServer: ReturnType<typeof createServer>,
  scenario: Scenario,
  sengId: string,
) {
  const engine = await client.speechEngine.get(sengId);
  const path = `/ws/${scenario.id}`;
  engine.attach(httpServer, path, {
    debug: false,
    onInit(conversationId) {
      log(`[${scenario.id}] init convo=${conversationId}`);
    },
    async onTranscript(transcript, signal, session) {
      const last = transcript[transcript.length - 1];
      log(
        `[${scenario.id}] transcript convo=${session.conversationId} turns=${transcript.length} last="${last?.content?.slice(0, 60)}"`,
      );
      try {
        const stream = await startChatStream(buildMessages(scenario, transcript), signal);
        await session.sendResponse(stream);
        log(`[${scenario.id}] response sent convo=${session.conversationId}`);
      } catch (err) {
        if (isAbortError(err) || signal.aborted) {
          log(`[${scenario.id}] response aborted convo=${session.conversationId}`);
          return;
        }
        log(`[${scenario.id}] response error convo=${session.conversationId}`, err);
      }
    },
    onClose(session) {
      log(`[${scenario.id}] closed convo=${session.conversationId}`);
    },
    onDisconnect(session) {
      log(`[${scenario.id}] disconnected convo=${session.conversationId}`);
    },
    onError(error, session) {
      log(`[${scenario.id}] error convo=${session.conversationId}`, error.message);
    },
  });
  return path;
}

async function main() {
  const client = new ElevenLabsClient({ apiKey: API_KEY });

  const httpServer = createServer((req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, scenarios: attachedScenarios }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const attachedScenarios: Array<{ id: string; sengId: string; path: string }> = [];

  log("scenario routing table:");
  for (const scenario of SCENARIOS) {
    const sengId = sengIdFor(scenario.id);
    if (!sengId) {
      log(`  · ${scenario.id.padEnd(20)} SKIP (SENG_ID_${scenario.id.toUpperCase()} not set)`);
      continue;
    }
    try {
      const path = await attachScenario(client, httpServer, scenario, sengId);
      attachedScenarios.push({ id: scenario.id, sengId, path });
      log(`  ✓ ${scenario.id.padEnd(20)} ${sengId} → ${path}`);
    } catch (err) {
      log(`  ✗ ${scenario.id.padEnd(20)} ${sengId} FAILED:`, (err as Error).message);
    }
  }

  if (attachedScenarios.length === 0) {
    throw new Error("no scenarios attached — set at least one SENG_ID_* env var");
  }

  httpServer.listen(PORT, () => {
    log(`engine listening on :${PORT} — ${attachedScenarios.length}/${SCENARIOS.length} scenarios attached`);
  });

  const shutdown = (sig: string) => {
    log(`${sig} received, closing`);
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((e) => {
  console.error("engine failed to start:", e);
  process.exit(1);
});
