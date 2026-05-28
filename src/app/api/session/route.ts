import { NextResponse } from "next/server";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import { SCENARIOS_BY_ID } from "@scenarios";

// Node runtime — the elevenlabs SDK is not edge-compatible.
export const runtime = "nodejs";

function getApiKey(): string | undefined {
  return process.env.ELEVENLABS_API_KEY ?? process.env.ELEVELLABS_API_KEY;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scenarioId = url.searchParams.get("scenarioId");

  if (!scenarioId || !(scenarioId in SCENARIOS_BY_ID)) {
    return NextResponse.json({ error: "unknown scenarioId" }, { status: 400 });
  }
  const envKey = `SENG_ID_${scenarioId.toUpperCase()}`;
  const sengId = process.env[envKey];
  if (!sengId) {
    return NextResponse.json(
      { error: `${envKey} not set — run pnpm provision:engine --scenario=${scenarioId}` },
      { status: 503 },
    );
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY missing" }, { status: 500 });
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    // seng_ IDs are valid agentIds on this surface.
    const res = await elevenlabs.conversationalAi.conversations.getWebrtcToken({
      agentId: sengId,
    });
    return NextResponse.json({ scenarioId, sengId, token: res.token });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
