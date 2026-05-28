/**
 * Idempotent Margot sting generator.
 *
 * Usage:  pnpm gen:stings           # generates missing only
 *         pnpm gen:stings --force   # regenerates all
 *
 * Writes to public/audio/stings/margot/*.mp3. Half-laugh tries multiple
 * approaches until one yields a usable sub-1s clip (logged at end).
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import type { VoiceSettings } from "@elevenlabs/elevenlabs-js/api/types/VoiceSettings";

const VOICE_ID = process.env.MARGOT_VOICE_ID;
if (!VOICE_ID) throw new Error("MARGOT_VOICE_ID required");
const API_KEY = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVELLABS_API_KEY;
if (!API_KEY) throw new Error("ELEVENLABS_API_KEY required");

const FORCE = process.argv.includes("--force");
const OUT_DIR = resolve(process.cwd(), "public/audio/stings/margot");
mkdirSync(OUT_DIR, { recursive: true });

const elevenlabs = new ElevenLabsClient({ apiKey: API_KEY });

type Sting = {
  file: string;
  text: string;
  voiceSettings?: VoiceSettings;
};

// Crisp, journalist-controlled settings: high stability, moderate style for
// the dry sardonic edge. Half-laugh gets its own settings below.
const STINGS: Sting[] = [
  { file: "01-stop.mp3", text: "Stop —" },
  { file: "02-no.mp3", text: "With respect, no —" },
  { file: "03-try-again.mp3", text: "Try again." },
  { file: "04-forgive.mp3", text: "Forgive me, but —" },
  { file: "05-different-q.mp3", text: "You're answering a different question." },
];

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const c of stream as unknown as AsyncIterable<Uint8Array>) chunks.push(c);
  return Buffer.concat(chunks);
}

async function tts(text: string, voiceSettings?: VoiceSettings): Promise<Buffer> {
  const stream = await elevenlabs.textToSpeech.convert(VOICE_ID!, {
    text,
    modelId: "eleven_turbo_v2_5",
    outputFormat: "mp3_44100_128",
    ...(voiceSettings ? { voiceSettings } : {}),
  });
  return readStream(stream);
}

async function generateOne(s: Sting): Promise<{ status: "wrote" | "skip"; ms: number }> {
  const path = resolve(OUT_DIR, s.file);
  if (existsSync(path) && !FORCE) {
    console.log(`·  skip ${s.file}`);
    return { status: "skip", ms: 0 };
  }
  const t0 = performance.now();
  const buf = await tts(s.text, s.voiceSettings);
  writeFileSync(path, buf);
  const ms = Math.round(performance.now() - t0);
  console.log(`✓  wrote ${s.file} (${buf.length} bytes, ${ms}ms)`);
  return { status: "wrote", ms };
}

// Half-laugh: three approaches in priority order. First non-trivial output wins.
async function generateHalfLaugh(): Promise<string> {
  const path = resolve(OUT_DIR, "06-halflaugh.mp3");
  if (existsSync(path) && !FORCE) {
    console.log(`·  skip 06-halflaugh.mp3`);
    return "skipped (existing)";
  }

  type Attempt = { label: string; text: string; voiceSettings?: VoiceSettings };
  const attempts: Attempt[] = [
    {
      label: "audio-tag",
      text: "[half-laugh]",
      voiceSettings: { stability: 0.35, similarityBoost: 0.75, style: 0.6, useSpeakerBoost: true },
    },
    {
      label: "tag-then-stop",
      text: "[short laugh] Stop.",
      voiceSettings: { stability: 0.4, similarityBoost: 0.75, style: 0.7, useSpeakerBoost: true },
    },
    {
      label: "phonetic-ha",
      text: "Ha. Right.",
      voiceSettings: { stability: 0.25, similarityBoost: 0.8, style: 0.85, useSpeakerBoost: true },
    },
  ];

  let best: { label: string; buf: Buffer } | null = null;
  for (const a of attempts) {
    try {
      const buf = await tts(a.text, a.voiceSettings);
      console.log(`   half-laugh attempt "${a.label}": ${buf.length} bytes`);
      // Pick first attempt that returns reasonable bytes (>3KB, <50KB ≈ <~1.5s mp3 at 128kbps)
      if (buf.length > 3000 && buf.length < 50000) {
        best = { label: a.label, buf };
        break;
      }
      if (!best) best = { label: a.label, buf }; // fallback to first
    } catch (e) {
      console.log(`   half-laugh "${a.label}" failed: ${(e as Error).message}`);
    }
  }
  if (!best) throw new Error("all half-laugh attempts failed");
  writeFileSync(path, best.buf);
  console.log(`✓  wrote 06-halflaugh.mp3 via "${best.label}" (${best.buf.length} bytes)`);
  return best.label;
}

async function main() {
  console.log(`\nMargot sting generator · voice=${VOICE_ID}\n`);
  let wrote = 0;
  let skipped = 0;
  for (const s of STINGS) {
    const r = await generateOne(s);
    if (r.status === "wrote") wrote += 1;
    else skipped += 1;
  }
  const halfLaughWinner = await generateHalfLaugh();
  console.log(
    `\n6 stings · ${wrote + (halfLaughWinner === "skipped (existing)" ? 0 : 1)} generated · ${skipped + (halfLaughWinner === "skipped (existing)" ? 1 : 0)} skipped`,
  );
  console.log(`half-laugh approach: ${halfLaughWinner}`);
}

main().catch((e) => {
  console.error("gen-stings failed:", e);
  process.exit(1);
});
