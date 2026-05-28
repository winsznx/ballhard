import { Chyron } from "@/components/newsreel/Chyron";
import { DodgesScorecard } from "@/components/newsreel/DodgesScorecard";
import { EndRoundButton } from "@/components/newsreel/EndRoundButton";
import { LatencyBadge } from "@/components/newsreel/LatencyBadge";
import { LiveCaption, type CaptionRole } from "@/components/newsreel/LiveCaption";
import { MargotAvatar } from "@/components/newsreel/MargotAvatar";

export type PressConferenceFrameProps = {
  chyron: { archetype: string; location: string; date: string };
  margotName?: string;
  captionRole: CaptionRole;
  captionText: string;
  latencyMs: number | null;
  latencyPulsing?: boolean;
  scorecard: { broken: number; landed: number };
  endRound?: {
    turnCount: number;
    turnLimit: number;
    disabled: boolean;
    onEnd: () => void;
  };
};

export function PressConferenceFrame({
  chyron,
  margotName,
  captionRole,
  captionText,
  latencyMs,
  latencyPulsing = false,
  scorecard,
  endRound,
}: PressConferenceFrameProps) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-void-0">
      {/* Backdrop — placeholder gradient until Phase 3 scene imagery */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 10%, rgba(40,30,60,0.7) 0%, rgba(14,14,20,1) 55%, rgba(8,8,12,1) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)",
        }}
      />

      {/* Top row — Margot (left) + Latency (right) */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-3 pt-safe pl-safe pr-safe">
        <MargotAvatar name={margotName} />
        <LatencyBadge latencyMs={latencyMs} pulsing={latencyPulsing} />
      </div>

      {/* Center caption */}
      <div className="absolute inset-x-3 top-1/2 z-20 -translate-y-1/2">
        <LiveCaption role={captionRole} text={captionText} />
      </div>

      {/* Dodges scorecard — bottom-left, above chyron */}
      <div className="absolute left-3 bottom-[7.5rem] z-20 pl-safe">
        <DodgesScorecard broken={scorecard.broken} landed={scorecard.landed} />
      </div>

      {/* END button — bottom-right, above chyron */}
      {endRound && (
        <div className="absolute right-3 bottom-[7.5rem] z-20 pr-safe">
          <EndRoundButton
            turnCount={endRound.turnCount}
            turnLimit={endRound.turnLimit}
            disabled={endRound.disabled}
            onEnd={endRound.onEnd}
          />
        </div>
      )}

      {/* Chyron — bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <Chyron archetype={chyron.archetype} location={chyron.location} date={chyron.date} />
      </div>
    </div>
  );
}
