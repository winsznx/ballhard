import { AlertTriangle, Info, Lightbulb, NotebookPen } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "note" | "tip" | "warning" | "info";

const VARIANT: Record<
  Variant,
  { Icon: typeof Info; border: string; iconText: string; label: string }
> = {
  note: {
    Icon: NotebookPen,
    border: "rgba(255,255,255,0.42)",
    iconText: "text-ink-2",
    label: "NOTE",
  },
  tip: {
    Icon: Lightbulb,
    border: "rgb(48, 209, 88)",
    iconText: "text-success",
    label: "TIP",
  },
  warning: {
    Icon: AlertTriangle,
    border: "rgb(255, 159, 10)",
    iconText: "text-warn",
    label: "WARNING",
  },
  info: {
    Icon: Info,
    border: "rgb(120, 160, 255)",
    iconText: "text-[rgb(140,180,255)]",
    label: "INFO",
  },
};

export function Callout({
  type = "note",
  children,
}: {
  type?: Variant;
  children: ReactNode;
}) {
  const v = VARIANT[type];
  return (
    <div
      className="my-5 flex gap-3 rounded-[16px] border border-[var(--glass-border)] bg-[var(--glass-fill)] px-4 py-3.5"
      style={{ borderLeftColor: v.border, borderLeftWidth: 3 }}
    >
      <v.Icon className={`mt-0.5 size-4 shrink-0 ${v.iconText}`} strokeWidth={2} />
      <div className="flex flex-col gap-1 text-subhead text-ink-1 leading-relaxed">
        <span className="font-mono text-caption-1 tracking-[0.18em] text-ink-3">
          {v.label}
        </span>
        <div>{children}</div>
      </div>
    </div>
  );
}
