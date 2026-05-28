import { Mic } from "lucide-react";

import { GlassSurface } from "@/components/primitives/GlassSurface";
import { Mono } from "@/components/primitives/Mono";

export function MargotAvatar({ name = "MARGOT" }: { name?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <GlassSurface className="rounded-full size-11 flex items-center justify-center">
        <Mic className="relative z-10 size-5 text-ink-1" strokeWidth={1.75} />
      </GlassSurface>
      <Mono size="badge" className="text-ink-2 tracking-[0.18em]">
        {name}
      </Mono>
    </div>
  );
}
