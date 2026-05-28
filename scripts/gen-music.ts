/**
 * Generate the submission-video music bed via ElevenLabs Music API.
 *
 * Usage: pnpm gen:music [--force]
 *
 * Idempotent: skips if /public/audio/music-bed.mp3 already exists unless --force.
 * Music API verified: client.music.compose({prompt, musicLengthMs, forceInstrumental}).
 * Length is in MS, range 3000-600000.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const OUT_DIR = resolve(process.cwd(), "public", "audio");
const OUT_PATH = resolve(OUT_DIR, "music-bed.mp3");

const PROMPT =
  "cinematic news thriller, low strings, urgent percussion, sparse single piano tones, " +
  "90 bpm, building tension that drops to silence on staccato moments. instrumental only.";

const LENGTH_MS = 90_000; // 90 seconds — submission video length.

async function main() {
  const force = process.argv.includes("--force");
  if (existsSync(OUT_PATH) && !force) {
    console.log(`· skip — ${OUT_PATH} exists (use --force to regenerate)`);
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const apiKey = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVELLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY required");

  console.log(`composing music (${LENGTH_MS}ms)...`);
  const t0 = performance.now();
  const client = new ElevenLabsClient({ apiKey });
  const stream = await client.music.compose({
    prompt: PROMPT,
    musicLengthMs: LENGTH_MS,
    forceInstrumental: true,
  });

  const chunks: Buffer[] = [];
  const reader = (stream as ReadableStream<Uint8Array>).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
  }
  const audio = Buffer.concat(chunks);
  writeFileSync(OUT_PATH, audio);
  const ms = Math.round(performance.now() - t0);
  console.log(`✓ wrote ${OUT_PATH} (${audio.length} bytes, ${ms}ms)`);
}

main().catch((e) => {
  console.error("music gen failed:", e);
  process.exit(1);
});
