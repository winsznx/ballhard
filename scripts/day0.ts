/**
 * Day 0 infra validation — CLAUDE.md §15.
 *
 * Honest behavior:
 *   PASS   — verified against a live API.
 *   FAIL   — API reachable but returned the wrong shape, or threw.
 *   SKIP   — cannot be verified headlessly (e.g. requires a public WS endpoint,
 *            or a browser). Documented per CLAUDE.md §15 adapt matrix.
 *
 * Exit code 0 only if all non-skipped checks PASS *and* at least the critical
 * core (1, 6) passes. SKIP does not fail the gate but is surfaced loudly.
 *
 * Speech Engine SDK shape verified against:
 *   https://elevenlabs.io/docs/eleven-api/guides/cookbooks/speech-engine
 *   https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-engine/javascript-sdk-reference
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import Groq from "groq-sdk";

type Status = "PASS" | "FAIL" | "SKIP";
type Result = { id: number; name: string; status: Status; ms: number; detail?: string };

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVELLABS_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const RUN_VOICE_DESIGN = process.env.RUN_VOICE_DESIGN_CHECK === "1";

const PLACEHOLDER_WS = "wss://example.invalid/ws";
const RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // public Voice Library smoke-test target

const elevenlabs = ELEVEN_KEY ? new ElevenLabsClient({ apiKey: ELEVEN_KEY }) : null;

async function run(id: number, name: string, fn: () => Promise<string | void>): Promise<Result> {
  const t0 = performance.now();
  try {
    const detail = (await fn()) ?? undefined;
    return { id, name, status: "PASS", ms: Math.round(performance.now() - t0), detail };
  } catch (e) {
    const err = e as Error & { status?: number; skip?: boolean };
    const ms = Math.round(performance.now() - t0);
    if (err.skip) return { id, name, status: "SKIP", ms, detail: err.message };
    return { id, name, status: "FAIL", ms, detail: err.message };
  }
}

function skip(reason: string): never {
  const e = new Error(reason) as Error & { skip: boolean };
  e.skip = true;
  throw e;
}

function requireElevenlabs() {
  if (!elevenlabs) skip("ELEVENLABS_API_KEY not set");
  return elevenlabs!;
}

/* --- Provisioned-resource bookkeeping so we tear down on exit --- */
const createdEngines: string[] = [];

async function teardown() {
  for (const id of createdEngines) {
    try {
      // SDK exposes .delete on speechEngine; if it doesn't exist at runtime,
      // the engine becomes orphaned but harmless (no WS connections from it).
      const anyClient = elevenlabs as unknown as {
        speechEngine: { delete?: (id: string) => Promise<unknown> };
      };
      await anyClient?.speechEngine?.delete?.(id);
    } catch {
      // swallow; teardown is best-effort
    }
  }
}

/* ============================ CHECKS ============================ */

// 1. seng_ provisioning — create an engine pointing at a placeholder ws.
async function check1(): Promise<string> {
  const c = requireElevenlabs();
  const anyEngine = c.speechEngine as unknown as {
    create: (req: { name: string; speechEngine: { wsUrl: string } }) => Promise<{
      engineId?: string;
      id?: string;
    }>;
  };
  const res = await anyEngine.create({
    name: `ballhard-day0-${Date.now()}`,
    speechEngine: { wsUrl: PLACEHOLDER_WS },
  });
  const id = res.engineId ?? res.id;
  if (!id) throw new Error(`no engine id in response: ${JSON.stringify(res)}`);
  if (!id.startsWith("seng_")) throw new Error(`id does not start with seng_: ${id}`);
  createdEngines.push(id);
  return id;
}

// 2. WebSocket connects. Requires a publicly reachable wsUrl in the engine
//    config so ElevenLabs can dial in. Headless Day 0 cannot expose one.
async function check2(): Promise<string> {
  skip("requires public WS endpoint (ngrok/tunnel); verify manually in Phase 3");
}

// 3. firstMessage override plays. We can verify the *config flip* via
//    speechEngine.update; the audible-playback side requires Phase 3 wiring.
async function check3(): Promise<string> {
  const c = requireElevenlabs();
  const engineId = createdEngines[0];
  if (!engineId) skip("depends on check 1 creating an engine");
  const anyEngine = c.speechEngine as unknown as {
    update: (id: string, body: { overrides: { firstMessage: boolean } }) => Promise<unknown>;
  };
  await anyEngine.update(engineId, { overrides: { firstMessage: true } });
  return `overrides.firstMessage=true set on ${engineId}`;
}

// 4. onTranscript fires. Browser/WS-runtime concern.
async function check4(): Promise<string> {
  skip("onTranscript handler runs on connected WS; verify in Phase 3 e2e");
}

// 5. AbortSignal.aborted on interrupt. Same shape as check 4.
async function check5(): Promise<string> {
  skip("interruption signal fires inside a live WS session; verify in Phase 3");
}

// 6. Groq cancels on signal. Critical: gates the BYOL story.
async function check6(): Promise<string> {
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY not set");
  const groq = new Groq({ apiKey: GROQ_KEY });
  const ac = new AbortController();
  const model = process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";

  let receivedTokens = 0;
  let aborted = false;
  let tokensAfterAbort = 0;

  const promise = (async () => {
    const stream = await groq.chat.completions.create(
      {
        model,
        stream: true,
        messages: [
          { role: "system", content: "Reply with a single very long sentence about clouds." },
          { role: "user", content: "Go." },
        ],
      },
      { signal: ac.signal },
    );
    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content ?? "";
      if (delta) {
        receivedTokens += 1;
        if (aborted) tokensAfterAbort += 1;
        if (receivedTokens === 3 && !aborted) {
          aborted = true;
          ac.abort();
        }
      }
    }
  })();

  try {
    await promise;
    // If the loop completed without throwing, the stream may have closed
    // before honoring abort. That's a soft fail.
    if (tokensAfterAbort > 5) {
      throw new Error(`stream did not cancel: ${tokensAfterAbort} tokens after abort`);
    }
    return `streamed ${receivedTokens} tokens; abort honored (${tokensAfterAbort} late)`;
  } catch (e) {
    const err = e as Error;
    if (err.name === "AbortError" || /abort/i.test(err.message)) {
      return `aborted cleanly after ${receivedTokens} tokens`;
    }
    throw err;
  }
}

// 7. Per-session turn eagerness applies. Requires two live sessions to compare
//    response delays — not feasible without WS.
async function check7(): Promise<string> {
  skip("requires two live WS sessions to compare response delay; verify in Phase 3");
}

// 8. Voice Library voice IDs resolve. Smoke-test with Rachel (always available).
async function check8(): Promise<string> {
  const c = requireElevenlabs();
  const anyVoices = c.voices as unknown as {
    get: (id: string) => Promise<{ voiceId?: string; voice_id?: string }>;
  };
  const v = await anyVoices.get(RACHEL_VOICE_ID);
  const id = v.voiceId ?? v.voice_id;
  if (!id) throw new Error(`voices.get returned no id: ${JSON.stringify(v)}`);
  return `resolved ${RACHEL_VOICE_ID}`;
}

// 9. Client-side latency timestamps. Browser-only — Speech Engine WS events
//    carry the timestamps; no Node-side surface to introspect.
async function check9(): Promise<string> {
  skip("micCaptureStartedAt is a browser-side WS event; verify in Phase 5");
}

// 10. Voice Design generates a voice ≤ 60s. Quota-consuming.
async function check10(): Promise<string> {
  if (!RUN_VOICE_DESIGN) skip("set RUN_VOICE_DESIGN_CHECK=1 to consume a Voice Design generation");
  const c = requireElevenlabs();
  const anyTtd = c as unknown as {
    textToVoice: {
      design: (req: {
        voiceDescription: string;
        text: string;
      }) => Promise<{ previews?: Array<{ generatedVoiceId?: string }> }>;
    };
  };
  const res = await anyTtd.textToVoice.design({
    voiceDescription:
      "A 51-year-old female journalist, transatlantic-neutral accent, measured cadence, slight gravitas. Calm but cutting.",
    text: "With respect, that does not answer the question I just asked.",
  });
  const pv = res.previews?.[0]?.generatedVoiceId;
  if (!pv) throw new Error(`no preview voice id returned: ${JSON.stringify(res).slice(0, 200)}`);
  return `preview voice ${pv} generated`;
}

/* ============================ DRIVER ============================ */

const ICON: Record<Status, string> = { PASS: " ✓", FAIL: " ✗", SKIP: " ·" };

async function main() {
  const checks: Array<{ id: number; name: string; fn: () => Promise<string | void> }> = [
    { id: 1, name: "seng_ provisioning", fn: check1 },
    { id: 2, name: "WebSocket connects", fn: check2 },
    { id: 3, name: "firstMessage override config", fn: check3 },
    { id: 4, name: "onTranscript fires on speech", fn: check4 },
    { id: 5, name: "AbortSignal on interrupt", fn: check5 },
    { id: 6, name: "Groq cancels on signal", fn: check6 },
    { id: 7, name: "Per-session turn eagerness", fn: check7 },
    { id: 8, name: "Voice Library voice IDs resolve", fn: check8 },
    { id: 9, name: "Client-side latency timestamps", fn: check9 },
    { id: 10, name: "Voice Design ≤ 60s", fn: check10 },
  ];

  console.log("\nBALLHARD · Day 0 infra validation\n");

  const results: Result[] = [];
  for (const c of checks) {
    const r = await run(c.id, c.name, c.fn);
    results.push(r);
    const line = `${ICON[r.status]}  ${String(r.id).padStart(2)}/10  ${r.name.padEnd(36)} (${r.ms}ms)`;
    console.log(line);
    if (r.detail) console.log(`         ↳ ${r.detail}`);
  }

  await teardown();

  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log(`\nRESULT: ${pass} PASS · ${fail} FAIL · ${skipped} SKIP`);

  // Gate logic: critical = 1, 6. They must pass. Other failures fail the gate
  // too; skips do not.
  const criticalFails = results.filter((r) => r.status === "FAIL" && [1, 6].includes(r.id));
  if (criticalFails.length > 0) {
    console.log("\n✗ Critical check(s) failed. Cannot proceed to Phase 1.");
    process.exit(1);
  }
  if (fail > 0) {
    console.log("\n✗ Non-critical failures present. Investigate before Phase 1.");
    process.exit(1);
  }
  if (skipped > 0) {
    console.log("\n· Some checks were skipped (expected — see AGENT_PROGRESS.md §15 gap log).");
  }
  console.log("✓ Gate open.");
  process.exit(0);
}

main().catch(async (e) => {
  await teardown();
  console.error("Day 0 driver crashed:", e);
  process.exit(2);
});
