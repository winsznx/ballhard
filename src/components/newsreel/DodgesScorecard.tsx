import { GlassSurface } from "@/components/primitives/GlassSurface";
import { Mono } from "@/components/primitives/Mono";

export function DodgesScorecard({ broken, landed }: { broken: number; landed: number }) {
  return (
    <GlassSurface className="rounded-[16px] px-3 py-2.5">
      <div className="relative z-10 flex flex-col gap-2">
        <Row label="DODGES BROKEN" value={broken} accent />
        <Row label="LANDED" value={landed} />
      </div>
    </GlassSurface>
  );
}

function Row({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <Mono size="caption" className="text-ink-3 uppercase">
        {label}
      </Mono>
      <Mono size="badge" className={accent ? "text-ink-1 font-semibold" : "text-ink-2"}>
        {value}
      </Mono>
    </div>
  );
}
