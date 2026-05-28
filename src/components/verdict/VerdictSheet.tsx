"use client";

import { useRouter } from "next/navigation";

import { Drawer } from "vaul";

import { PlayAgainButton } from "@/components/verdict/PlayAgainButton";
import { ShareButton } from "@/components/verdict/ShareButton";
import { VerdictStat } from "@/components/verdict/VerdictStat";
import { VERDICT_TEXTS, type SharePayload, type VerdictText } from "@/lib/share";

export function VerdictSheet({
  open,
  scenarioId,
  archetype,
  verdictText,
  dodgesBroken,
  dodgesLanded,
  medianLatency,
  onPlayAgain,
}: {
  open: boolean;
  scenarioId: string;
  archetype: string;
  verdictText: string;
  dodgesBroken: number;
  dodgesLanded: number;
  medianLatency: number | null;
  onPlayAgain: () => void;
}) {
  const router = useRouter();

  // Share requires a real latency + a typed verdict string. If either is missing
  // we hide the share button (e.g. round ended with no interrupts).
  const canShare =
    medianLatency != null &&
    medianLatency > 0 &&
    (VERDICT_TEXTS as readonly string[]).includes(verdictText);

  const sharePayload: SharePayload | null = canShare
    ? {
        scenarioId,
        dodgesBroken,
        dodgesLanded,
        medianLatencyMs: medianLatency!,
        verdictText: verdictText as VerdictText,
      }
    : null;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) router.push("/");
      }}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.6)]" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex h-auto max-w-[430px] flex-col rounded-t-[28px] bg-[rgba(14,14,20,0.96)] backdrop-blur-2xl border-t border-x border-[var(--glass-border)] outline-none">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[var(--glass-fill-2)]" />
          <Drawer.Title className="sr-only">{verdictText}</Drawer.Title>
          <Drawer.Description className="sr-only">
            Round verdict and stats. Share or play again.
          </Drawer.Description>

          <div className="flex flex-col gap-8 px-6 pt-6 pb-safe">
            <h2 className="text-large-title font-bold tracking-tight text-ink-1 leading-tight">
              {verdictText}
            </h2>

            <div className="flex flex-col gap-7">
              <VerdictStat
                value={medianLatency != null ? `${medianLatency}MS` : "—"}
                label="MEDIAN INTERRUPT"
                size="hero"
              />
              <VerdictStat
                value={`${dodgesBroken} / ${dodgesLanded}`}
                label="DODGES — BROKEN / LANDED"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 pb-6">
              {sharePayload && <ShareButton payload={sharePayload} archetype={archetype} />}
              <PlayAgainButton onPlayAgain={onPlayAgain} />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
