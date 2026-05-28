import Link from "next/link";
import type { ReactNode } from "react";

import { Mono } from "@/components/primitives/Mono";

export function DocCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
  );
}

export function DocCard({
  href,
  title,
  subtitle,
  description,
}: {
  href: string;
  title: string;
  subtitle?: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-2 rounded-[18px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-4 transition-colors hover:bg-[var(--glass-fill-2)]"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-caption-mono uppercase tracking-[0.12em] text-ink-1">
          {title}
        </span>
        <span aria-hidden className="text-ink-3 group-hover:text-ink-1">
          →
        </span>
      </div>
      {subtitle && (
        <Mono size="caption" className="text-ink-3 uppercase tracking-[0.15em]">
          {subtitle}
        </Mono>
      )}
      <p className="text-footnote text-ink-2 leading-relaxed">{description}</p>
    </Link>
  );
}
