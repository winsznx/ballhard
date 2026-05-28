"use client";

import { useEffect, useId, useRef, useState } from "react";

// Dark-themed Mermaid render. Theme override avoids the default yellow palette
// (per the brand-palette rule established in the README). Renders client-side
// on mount; SSR renders the source as a fallback inside <pre>.
export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "_");
  const ref = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            background: "transparent",
            primaryColor: "#1a1a28",
            primaryTextColor: "#e5e5ea",
            primaryBorderColor: "#3a3a4a",
            lineColor: "#5a5a6a",
            secondaryColor: "#16161e",
            tertiaryColor: "#10101a",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
          },
          securityLevel: "strict",
        });
        const { svg } = await mermaid.render(`m_${id}`, chart);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, chart]);

  return (
    <div className="my-5 overflow-x-auto rounded-[16px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-5">
      <div ref={ref} className="min-h-[120px] flex justify-center" aria-hidden={!err} />
      {err && (
        <pre className="text-caption-1 text-ink-3 whitespace-pre-wrap">{err}</pre>
      )}
    </div>
  );
}
