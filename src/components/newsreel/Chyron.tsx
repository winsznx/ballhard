import { GlassSurface } from "@/components/primitives/GlassSurface";
import { Mono } from "@/components/primitives/Mono";

export function Chyron({
  archetype,
  location,
  date,
}: {
  archetype: string;
  location: string;
  date: string;
}) {
  return (
    <GlassSurface className="absolute inset-x-3 bottom-0 mb-3 pb-safe px-4 pt-3 rounded-[20px]">
      <div className="relative z-10">
        <div className="text-title-2 font-semibold tracking-tight text-ink-1 uppercase">
          {archetype}
        </div>
        <Mono size="caption" className="mt-1 text-ink-3 uppercase">
          {location} · {date}
        </Mono>
      </div>
    </GlassSurface>
  );
}
