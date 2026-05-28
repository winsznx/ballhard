import Link from "next/link";

import { GlassSurface } from "@/components/primitives/GlassSurface";
import { Mono } from "@/components/primitives/Mono";
import type { Scenario } from "@scenarios";

function teaserFrom(firstMessage: string, words = 12): string {
  const parts = firstMessage.split(/\s+/).slice(0, words);
  return parts.join(" ") + "…";
}

export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const muted = scenario.rank === "tier2";
  return (
    <Link href={`/play/${scenario.id}`} prefetch className="block">
      <GlassSurface
        className={`rounded-[22px] px-5 py-4 active:bg-[var(--glass-fill-2)] ${muted ? "opacity-85" : ""}`}
      >
        <div className="relative z-10 flex flex-col gap-3">
          <div className="text-headline font-semibold tracking-tight text-ink-1 uppercase">
            {scenario.chyron.archetype}
          </div>
          <p className="text-subhead leading-snug text-ink-2">
            {teaserFrom(scenario.firstMessage)}
          </p>
          <div className="flex items-end justify-between pt-1">
            <Mono size="caption" className="text-ink-3 uppercase tracking-[0.14em]">
              {scenario.chyron.location} · {scenario.chyron.date}
            </Mono>
            <span aria-hidden className="text-headline text-ink-2 leading-none">
              →
            </span>
          </div>
        </div>
      </GlassSurface>
    </Link>
  );
}
