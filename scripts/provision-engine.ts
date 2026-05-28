/**
 * Multi-scenario seng_ provisioning.
 *
 * Usage:
 *   pnpm provision:engine --scenario=embezzler --ws-url=wss://host
 *   pnpm provision:engine --all --ws-url=wss://host
 *
 * --ws-url is the BASE (no trailing slash, no path). Each scenario is
 * provisioned to wss://host/ws/<scenarioId> so the sidecar can attach each
 * engine to its own path (engine/server.ts).
 *
 * Idempotent: PATCHes existing seng_ if SENG_ID_<UPPER> is in .env.local,
 * else POSTs and writes the new id back.
 *
 * vad_score is REQUIRED in clientEvents for latency T0 to work (Phase 5).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { ClientEvent } from "@elevenlabs/elevenlabs-js/api/types";

import { SCENARIOS, SCENARIOS_BY_ID, type Scenario } from "../scenarios";

const ENV_PATH = resolve(process.cwd(), ".env.local");

function readEnvFile(): Map<string, string> {
  if (!existsSync(ENV_PATH)) return new Map();
  const out = new Map<string, string>();
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    out.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return out;
}

function writeEnvVar(key: string, value: string) {
  const env = readEnvFile();
  env.set(key, value);
  const body = Array.from(env.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  writeFileSync(ENV_PATH, body + "\n");
}

function envKeyFor(scenarioId: string): string {
  return `SENG_ID_${scenarioId.toUpperCase()}`;
}

type Args = { wsBaseUrl: string; targets: Scenario[] };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const wsArg = argv.find((a) => a.startsWith("--ws-url="));
  if (!wsArg) {
    console.error("usage: pnpm provision:engine (--scenario=<id> | --all) --ws-url=wss://<host>");
    process.exit(1);
  }
  const wsBaseUrl = wsArg.slice("--ws-url=".length).replace(/\/+$/, "").replace(/\/ws(\/.*)?$/, "");
  if (!wsBaseUrl.startsWith("wss://") && !wsBaseUrl.startsWith("ws://")) {
    console.error(`invalid --ws-url: ${wsBaseUrl} (must be ws:// or wss://)`);
    process.exit(1);
  }

  if (argv.includes("--all")) {
    return { wsBaseUrl, targets: SCENARIOS };
  }
  const scenarioArg = argv.find((a) => a.startsWith("--scenario="));
  if (!scenarioArg) {
    console.error("provide --scenario=<id> or --all");
    process.exit(1);
  }
  const id = scenarioArg.slice("--scenario=".length);
  const scenario = SCENARIOS_BY_ID[id];
  if (!scenario) {
    console.error(`unknown scenario: ${id}. known: ${Object.keys(SCENARIOS_BY_ID).join(", ")}`);
    process.exit(1);
  }
  return { wsBaseUrl, targets: [scenario] };
}

const CLIENT_EVENTS = [
  ClientEvent.ConversationInitiationMetadata,
  ClientEvent.Ping,
  ClientEvent.Audio,
  ClientEvent.Interruption,
  ClientEvent.UserTranscript,
  ClientEvent.AgentResponse,
  ClientEvent.VadScore, // REQUIRED — Phase 5 latency T0 depends on it.
];

async function provisionOne(
  client: ElevenLabsClient,
  scenario: Scenario,
  wsBaseUrl: string,
): Promise<void> {
  const wsUrl = `${wsBaseUrl}/ws/${scenario.id}`;
  const config = {
    speechEngine: { wsUrl },
    tts: { voiceId: scenario.voiceId },
    turn: {
      turnEagerness: scenario.turn.eagerness,
      turnTimeout: scenario.turn.turnTimeoutSec,
    },
    conversation: { clientEvents: CLIENT_EVENTS },
    overrides: { firstMessage: true },
  };

  const env = readEnvFile();
  const existing = env.get(envKeyFor(scenario.id));

  if (existing) {
    const res = await client.speechEngine.update(existing, config);
    console.log(`  · ${scenario.id.padEnd(20)} ${res.engineId} (updated → ${wsUrl})`);
    return;
  }

  const res = await client.speechEngine.create({
    name: `ballhard-${scenario.id}`,
    ...config,
  });
  writeEnvVar(envKeyFor(scenario.id), res.engineId);
  console.log(`  ✓ ${scenario.id.padEnd(20)} ${res.engineId} (created → ${wsUrl})`);
}

async function main() {
  const { wsBaseUrl, targets } = parseArgs();
  const apiKey = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVELLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY required");
  const client = new ElevenLabsClient({ apiKey });

  console.log(`provisioning ${targets.length} scenario(s) → wsBase=${wsBaseUrl}`);
  for (const scenario of targets) {
    try {
      await provisionOne(client, scenario, wsBaseUrl);
    } catch (err) {
      console.error(`  ✗ ${scenario.id.padEnd(20)} FAILED:`, (err as Error).message);
    }
  }
  console.log("\nNext: push SENG_ID_* env vars to Railway and redeploy the sidecar.");
}

main().catch((e) => {
  console.error("provision failed:", e);
  process.exit(1);
});
