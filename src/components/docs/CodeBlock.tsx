"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

// Plain styled code block. Shiki skipped for build velocity (Next 16 + Railway
// adds friction); the docs page has 1-2 short snippets where syntax highlighting
// isn't load-bearing. A single accent color for keywords + filename header read fine.
export function CodeBlock({
  code,
  filename,
  language,
}: {
  code: string;
  filename?: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable; silent
    }
  };

  return (
    <div className="my-5 overflow-hidden rounded-[16px] border border-[var(--glass-border)] bg-[rgba(8,8,12,0.6)]">
      {(filename || language) && (
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-2">
          <span className="font-mono text-caption-1 text-ink-3 tracking-[0.12em]">
            {filename ?? language}
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1.5 text-caption-1 text-ink-3 hover:text-ink-1"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="size-3" /> copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> copy
              </>
            )}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-3 text-footnote leading-relaxed">
        <code className="font-mono text-ink-1">{code}</code>
      </pre>
    </div>
  );
}
