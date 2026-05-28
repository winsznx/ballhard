import { NextResponse } from "next/server";

import { customAlphabet } from "nanoid";

import { SCENARIOS_BY_ID } from "@scenarios";
import { supabaseAdmin, type VerdictRow } from "@/lib/supabase";
import { VERDICT_TEXTS, verdictUrl, type SharePayload, type VerdictText } from "@/lib/share";

// Node runtime — supabase-js + nanoid both work here without polyfills.
export const runtime = "nodejs";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

// Simple per-IP rate limit. Module-local Map is acceptable at hackathon scale.
// Resets on cold starts; documented limitation. Phase 8 swap to KV if abuse appears.
// Bumped 10→30: ShareButton pre-warms on sheet open (one POST per round) to keep
// the tap handler synchronous (iOS user-activation), so the POST count tracks
// rounds played, not deliberate shares. Orphan rows are anonymous + cheap.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
type RateRecord = { count: number; resetAt: number };
const rate = new Map<string, RateRecord>();

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function checkRate(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const rec = rate.get(ip);
  if (!rec || rec.resetAt < now) {
    rate.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  if (rec.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((rec.resetAt - now) / 1000) };
  }
  rec.count += 1;
  return { ok: true };
}

function validatePayload(body: unknown): SharePayload | { error: string } {
  if (!body || typeof body !== "object") return { error: "body must be an object" };
  const b = body as Record<string, unknown>;

  if (typeof b.scenarioId !== "string" || !(b.scenarioId in SCENARIOS_BY_ID)) {
    return { error: "unknown scenarioId" };
  }
  if (typeof b.dodgesBroken !== "number" || b.dodgesBroken < 0) {
    return { error: "dodgesBroken must be a non-negative number" };
  }
  if (typeof b.dodgesLanded !== "number" || b.dodgesLanded < 0) {
    return { error: "dodgesLanded must be a non-negative number" };
  }
  if (typeof b.medianLatencyMs !== "number" || b.medianLatencyMs <= 0) {
    return { error: "medianLatencyMs must be a positive number" };
  }
  if (typeof b.verdictText !== "string" || !VERDICT_TEXTS.includes(b.verdictText as VerdictText)) {
    return { error: "verdictText must be one of the locked verdict strings" };
  }
  return b as unknown as SharePayload;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rateCheck = checkRate(ip);
  if (!rateCheck.ok) {
    return NextResponse.json(
      { error: "rate limited" },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const validated = validatePayload(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const id = nanoid();
  const insert: Omit<VerdictRow, "created_at"> = {
    id,
    scenario_id: validated.scenarioId,
    dodges_broken: validated.dodgesBroken,
    dodges_landed: validated.dodgesLanded,
    median_latency_ms: Math.round(validated.medianLatencyMs),
    verdict_text: validated.verdictText,
  };

  const { error } = await supabaseAdmin().from("verdict_cards").insert(insert);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id, url: verdictUrl(id) });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("verdict_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
