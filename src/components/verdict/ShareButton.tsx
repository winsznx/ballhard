"use client";

import { useState } from "react";

import { GlassSurface } from "@/components/primitives/GlassSurface";
import type { SharePayload, VerdictInsertResponse } from "@/lib/share";

export type { SharePayload };

type ToastKind = "none" | "ok" | "err" | "rate";

const TOAST_TEXT: Record<Exclude<ToastKind, "none">, string> = {
  ok: "shared",
  err: "share failed — try again",
  rate: "rate limited — try later",
};

function buildShareText(p: SharePayload, archetype: string): string {
  const total = p.dodgesBroken + p.dodgesLanded;
  return `Just broke ${p.dodgesBroken}/${total} dodges on ${archetype}. ${p.medianLatencyMs}ms median interrupt. Built on @elevenlabsio Speech Engine #ElevenHacks`;
}

export function ShareButton({
  payload,
  archetype,
}: {
  payload: SharePayload;
  archetype: string;
}) {
  const [toast, setToast] = useState<ToastKind>("none");
  const [busy, setBusy] = useState(false);

  const flashToast = (k: Exclude<ToastKind, "none">, ms = 1500) => {
    setToast(k);
    setTimeout(() => setToast("none"), ms);
  };

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/verdict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        flashToast("rate", 2000);
        return;
      }
      if (!res.ok) {
        flashToast("err", 2000);
        return;
      }
      const { url } = (await res.json()) as VerdictInsertResponse;
      const text = buildShareText(payload, archetype);

      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await navigator.share({ title: "BALLHARD", text, url });
          flashToast("ok");
          return;
        } catch (err) {
          // user dismissed the share sheet OR share unavailable in this context
          if ((err as { name?: string }).name === "AbortError") {
            return;
          }
          // fall through to X intent
        }
      }
      const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${url}`)}`;
      window.open(x, "_blank", "noopener");
      flashToast("ok");
    } catch (err) {
      console.error("[share]", err);
      flashToast("err", 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="w-full disabled:opacity-60"
      >
        <GlassSurface className="rounded-full px-5 py-4 active:bg-[var(--glass-fill-2)] bg-[var(--glass-fill-2)]">
          <span className="relative z-10 block text-headline font-semibold text-ink-1 tracking-[0.15em] text-center">
            {busy ? "SHARING…" : "SHARE VERDICT"}
          </span>
        </GlassSurface>
      </button>
      {toast !== "none" && (
        <div className="pointer-events-none absolute inset-x-0 -top-9 flex justify-center">
          <span className="rounded-full bg-[var(--glass-fill-2)] px-3 py-1 text-caption-1 text-ink-2 backdrop-blur-md border border-[var(--glass-border)]">
            {TOAST_TEXT[toast]}
          </span>
        </div>
      )}
    </div>
  );
}
