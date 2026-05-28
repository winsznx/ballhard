import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SCENARIOS_BY_ID } from "@scenarios";
import { GlassSurface } from "@/components/primitives/GlassSurface";
import { Mono } from "@/components/primitives/Mono";
import { VerdictStat } from "@/components/verdict/VerdictStat";
import { ogImageUrl, verdictUrl } from "@/lib/share";
import { supabaseAdmin, type VerdictRow } from "@/lib/supabase";

async function getVerdict(id: string): Promise<VerdictRow | null> {
  const { data } = await supabaseAdmin()
    .from("verdict_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as VerdictRow | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ verdictId: string }>;
}): Promise<Metadata> {
  const { verdictId } = await params;
  const verdict = await getVerdict(verdictId);
  if (!verdict) return { title: "BALLHARD" };

  const scenario = SCENARIOS_BY_ID[verdict.scenario_id];
  const archetype = scenario?.chyron.archetype ?? "press conference";
  const title = `${verdict.verdict_text} — BALLHARD`;
  const description = `vs ${archetype} · ${verdict.dodges_broken} broken / ${verdict.dodges_landed} landed · ${verdict.median_latency_ms}ms median interrupt`;
  const og = ogImageUrl(verdictId);
  const url = verdictUrl(verdictId);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og],
    },
  };
}

export default async function VerdictPage({
  params,
}: {
  params: Promise<{ verdictId: string }>;
}) {
  const { verdictId } = await params;
  const verdict = await getVerdict(verdictId);
  if (!verdict) notFound();

  const scenario = SCENARIOS_BY_ID[verdict.scenario_id];
  const archetype = scenario?.chyron.archetype ?? "PRESS CONFERENCE";

  return (
    <main className="relative flex min-h-dvh flex-col px-5 pt-safe pb-safe">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, rgba(60,40,90,0.45) 0%, rgba(8,8,12,1) 65%)",
        }}
      />

      <header className="pt-10">
        <Mono size="caption" className="text-ink-3 uppercase tracking-[0.18em]">
          BALLHARD · VS {archetype}
        </Mono>
      </header>

      <section className="mt-6 flex flex-col gap-8">
        <h1 className="text-large-title font-bold tracking-tight text-ink-1 leading-tight">
          {verdict.verdict_text}
        </h1>

        <GlassSurface className="rounded-[24px] px-5 py-6">
          <div className="relative z-10 flex flex-col gap-7">
            <VerdictStat
              value={`${verdict.median_latency_ms}MS`}
              label="MEDIAN INTERRUPT"
              size="hero"
            />
            <VerdictStat
              value={`${verdict.dodges_broken} / ${verdict.dodges_landed}`}
              label="DODGES — BROKEN / LANDED"
            />
          </div>
        </GlassSurface>
      </section>

      <div className="mt-8">
        <Link href="/" className="block">
          <GlassSurface className="rounded-full px-5 py-4 active:bg-[var(--glass-fill-2)] bg-[var(--glass-fill-2)]">
            <span className="relative z-10 block text-headline font-semibold text-ink-1 tracking-[0.15em] text-center">
              PLAY YOUR OWN
            </span>
          </GlassSurface>
        </Link>
      </div>

      <footer className="mt-auto pt-8 pb-2">
        <Mono size="caption" className="text-ink-3">
          built on elevenlabs speech engine · #ElevenHacks
        </Mono>
      </footer>
    </main>
  );
}
