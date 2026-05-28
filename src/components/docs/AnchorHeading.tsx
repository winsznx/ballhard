import type { ReactNode } from "react";

type Level = "h2" | "h3";

export function AnchorHeading({
  level = "h2",
  id,
  children,
}: {
  level?: Level;
  id: string;
  children: ReactNode;
}) {
  const sizeClass =
    level === "h2"
      ? "text-title-1 font-bold tracking-tight mt-12 first:mt-0"
      : "text-title-2 font-semibold tracking-tight mt-8";
  const Tag = level;
  return (
    <Tag id={id} className={`group relative scroll-mt-24 text-ink-1 ${sizeClass}`}>
      <a
        href={`#${id}`}
        aria-label="Anchor link"
        className="absolute -left-6 top-1/2 -translate-y-1/2 hidden text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 md:inline"
      >
        #
      </a>
      {children}
    </Tag>
  );
}
