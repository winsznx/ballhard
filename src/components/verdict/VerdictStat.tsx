import { Mono } from "@/components/primitives/Mono";

export function VerdictStat({
  value,
  label,
  size = "normal",
}: {
  value: string;
  label: string;
  size?: "hero" | "normal";
}) {
  const valueClass =
    size === "hero"
      ? "text-[4rem] leading-none font-bold tracking-tight"
      : "text-[2.5rem] leading-none font-semibold tracking-tight";

  return (
    <div className="flex flex-col gap-2">
      <span className={`font-mono text-ink-1 ${valueClass}`}>{value}</span>
      <Mono size="caption" className="text-ink-3 uppercase tracking-[0.18em]">
        {label}
      </Mono>
    </div>
  );
}
