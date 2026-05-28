import type { ReactNode } from "react";

type MonoSize = "badge" | "stat" | "caption";

const SIZE_CLASS: Record<MonoSize, string> = {
  badge: "text-caption-mono tracking-tight",
  stat: "text-[3rem] leading-none tracking-tight",
  caption: "text-caption-1 tracking-wide",
};

export function Mono({
  size = "caption",
  className = "",
  children,
}: {
  size?: MonoSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`font-mono ${SIZE_CLASS[size]} ${className}`}>{children}</span>
  );
}
