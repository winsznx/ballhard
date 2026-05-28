import { GlassSurface } from "@/components/primitives/GlassSurface";
import { Mono } from "@/components/primitives/Mono";

export type CaptionRole = "margot" | "you" | "principal";

const ROLE_LABEL: Record<CaptionRole, string> = {
  margot: "MARGOT",
  you: "YOU",
  principal: "PRINCIPAL",
};

const ROLE_TONE: Record<CaptionRole, string> = {
  margot: "text-ink-2",
  you: "text-interrupt-red",
  principal: "text-ink-3",
};

export function LiveCaption({ role, text }: { role: CaptionRole; text: string }) {
  return (
    <GlassSurface className="px-5 py-4 rounded-[24px] w-full">
      <div className="relative z-10 flex flex-col gap-3">
        <span
          className={`inline-flex w-fit items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill-2)] px-2.5 py-1 ${ROLE_TONE[role]}`}
        >
          <Mono size="badge">[{ROLE_LABEL[role]}]</Mono>
        </span>
        <p className="text-body leading-snug text-ink-1">{text}</p>
      </div>
    </GlassSurface>
  );
}
