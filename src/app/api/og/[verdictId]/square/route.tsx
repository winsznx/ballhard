import { SCENARIOS_BY_ID } from "@scenarios";
import { renderSquareOg } from "@/lib/og";
import { supabaseAdmin, type VerdictRow } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ verdictId: string }> },
) {
  const { verdictId } = await params;

  const { data } = await supabaseAdmin()
    .from("verdict_cards")
    .select("*")
    .eq("id", verdictId)
    .maybeSingle();

  if (!data) return new Response("not found", { status: 404 });
  const verdict = data as VerdictRow;
  const scenario = SCENARIOS_BY_ID[verdict.scenario_id];

  return renderSquareOg({
    verdictText: verdict.verdict_text,
    archetype: scenario?.chyron.archetype ?? "PRESS CONFERENCE",
    dodgesBroken: verdict.dodges_broken,
    dodgesLanded: verdict.dodges_landed,
    medianLatencyMs: verdict.median_latency_ms,
  });
}
