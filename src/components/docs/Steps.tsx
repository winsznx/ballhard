import type { ReactNode } from "react";

export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="my-5 flex flex-col">
      {Array.isArray(children)
        ? children.map((child, i) => (
            <StepWrapper key={i} index={i + 1} last={i === children.length - 1}>
              {child}
            </StepWrapper>
          ))
        : children}
    </ol>
  );
}

function StepWrapper({
  index,
  last,
  children,
}: {
  index: number;
  last: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className="absolute left-[15px] top-9 bottom-0 w-px bg-[var(--glass-border)]"
        />
      )}
      <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill-2)] font-mono text-caption-1 text-ink-1">
        {index}
      </span>
      <div className="flex-1 pt-1 text-body text-ink-1 leading-relaxed">{children}</div>
    </li>
  );
}

export function Step({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
