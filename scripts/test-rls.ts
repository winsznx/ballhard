/**
 * Phase 7 RLS sanity check against verdict_cards.
 *
 * Uses the ANON key, not service role, so we're exercising the same policies
 * the browser will face. Per CLAUDE.md §8: public read by id, public insert,
 * no update, no delete.
 *
 * Exits 0 if all four checks behave as specced, non-zero otherwise.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY required");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

type Result = { id: number; name: string; pass: boolean; detail: string };

async function run() {
  const results: Result[] = [];

  // 1. Anon SELECT — should succeed (public read).
  {
    const { data, error } = await sb.from("verdict_cards").select("*").limit(5);
    results.push({
      id: 1,
      name: "anon SELECT (public read)",
      pass: !error,
      detail: error ? error.message : `returned ${data?.length ?? 0} rows`,
    });
  }

  // 2. Anon INSERT — should succeed.
  let insertedId: string | null = null;
  {
    const id = `rlstest_${Date.now().toString(36)}`;
    const { error } = await sb.from("verdict_cards").insert({
      id,
      scenario_id: "embezzler",
      dodges_broken: 0,
      dodges_landed: 0,
      median_latency_ms: 1,
      verdict_text: "RLS TEST — DELETE ME",
    });
    if (!error) insertedId = id;
    results.push({
      id: 2,
      name: "anon INSERT (public insert)",
      pass: !error,
      detail: error ? error.message : `inserted ${id}`,
    });
  }

  // 3. Anon UPDATE — should fail (no update policy → RLS denies).
  if (insertedId) {
    const { error } = await sb
      .from("verdict_cards")
      .update({ verdict_text: "TAMPERED" })
      .eq("id", insertedId);
    results.push({
      id: 3,
      name: "anon UPDATE (should fail)",
      pass: !!error || (await rowUnchanged(insertedId)),
      detail: error ? `denied: ${error.message}` : "update silently no-op (RLS hides row)",
    });
  } else {
    results.push({ id: 3, name: "anon UPDATE", pass: false, detail: "skipped — insert failed" });
  }

  // 4. Anon DELETE — should fail.
  if (insertedId) {
    const { error } = await sb.from("verdict_cards").delete().eq("id", insertedId);
    const stillThere = await rowExists(insertedId);
    results.push({
      id: 4,
      name: "anon DELETE (should fail)",
      pass: !!error || stillThere,
      detail: error
        ? `denied: ${error.message}`
        : stillThere
          ? "delete silently no-op (row still there)"
          : "ROW WAS DELETED — RLS broken",
    });
  } else {
    results.push({ id: 4, name: "anon DELETE", pass: false, detail: "skipped — insert failed" });
  }

  for (const r of results) {
    console.log(`${r.pass ? "✓" : "✗"} ${r.id}. ${r.name.padEnd(34)} ${r.detail}`);
  }
  const fails = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - fails}/${results.length} checks passed`);
  process.exit(fails === 0 ? 0 : 1);
}

async function rowExists(id: string): Promise<boolean> {
  const { data } = await sb.from("verdict_cards").select("id").eq("id", id).maybeSingle();
  return data !== null;
}

async function rowUnchanged(id: string): Promise<boolean> {
  const { data } = await sb
    .from("verdict_cards")
    .select("verdict_text")
    .eq("id", id)
    .maybeSingle();
  return data?.verdict_text === "RLS TEST — DELETE ME";
}

run().catch((e) => {
  console.error("test-rls crashed:", e);
  process.exit(2);
});
