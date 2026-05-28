import { GlassSurface } from "@/components/primitives/GlassSurface";
import { Mono } from "@/components/primitives/Mono";

export function EndRoundButton({
  turnCount,
  turnLimit,
  disabled,
  onEnd,
}: {
  turnCount: number;
  turnLimit: number;
  disabled: boolean;
  onEnd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEnd}
      disabled={disabled}
      className="disabled:opacity-40 disabled:pointer-events-none"
    >
      <GlassSurface className="rounded-full px-3 py-1.5 active:bg-[var(--glass-fill-2)]">
        <Mono size="badge" className="relative z-10 text-ink-2 tracking-[0.18em]">
          END · {turnCount}/{turnLimit}
        </Mono>
      </GlassSurface>
    </button>
  );
}
