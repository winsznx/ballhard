import { GlassSurface } from "@/components/primitives/GlassSurface";
import { GlowPulse } from "@/components/primitives/GlowPulse";
import { Mono } from "@/components/primitives/Mono";

export function LatencyBadge({
  latencyMs,
  pulsing = false,
}: {
  latencyMs: number | null;
  pulsing?: boolean;
}) {
  return (
    <GlowPulse pulsing={pulsing} className="rounded-full">
      <GlassSurface className="rounded-full px-3 py-1.5">
        <Mono
          size="badge"
          className={`relative z-10 ${pulsing ? "text-interrupt-red" : "text-ink-2"}`}
        >
          {latencyMs === null ? "— ms" : `${latencyMs}ms`}
        </Mono>
      </GlassSurface>
    </GlowPulse>
  );
}
