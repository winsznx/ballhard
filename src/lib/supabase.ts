import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type VerdictRow = {
  id: string;
  scenario_id: string;
  dodges_broken: number;
  dodges_landed: number;
  median_latency_ms: number;
  verdict_text: string;
  created_at: string;
};

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is required`);
  return v;
}

let _admin: SupabaseClient | null = null;

/** Server-side admin client. NEVER import in a client component. */
export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  _admin = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return _admin;
}

/** Browser-side anon client. Safe in client components. */
export function supabaseBrowser(): SupabaseClient {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
