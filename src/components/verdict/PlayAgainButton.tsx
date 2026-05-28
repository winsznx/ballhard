"use client";

import { GlassSurface } from "@/components/primitives/GlassSurface";

export function PlayAgainButton({ onPlayAgain }: { onPlayAgain: () => void }) {
  return (
    <button type="button" onClick={onPlayAgain} className="w-full">
      <GlassSurface className="rounded-full px-5 py-4 active:bg-[var(--glass-fill-2)]">
        <span className="relative z-10 block text-headline font-medium text-ink-2 tracking-[0.15em] text-center">
          PLAY AGAIN
        </span>
      </GlassSurface>
    </button>
  );
}
