"use client";

import { useEffect, useRef, useState } from "react";

import { GlassSurface } from "@/components/primitives/GlassSurface";
import { squareCardUrl, type SharePayload, type VerdictInsertResponse } from "@/lib/share";

export type { SharePayload };

type ToastKind = "none" | "ok" | "err" | "rate";

const TOAST_TEXT: Record<Exclude<ToastKind, "none">, string> = {
  ok: "shared",
  err: "share failed — try again",
  rate: "rate limited — try later",
};

const CARD_FILENAME = "ballhard-verdict.png";

function buildShareText(p: SharePayload, archetype: string): string {
  const total = p.dodgesBroken + p.dodgesLanded;
  return `Just broke ${p.dodgesBroken}/${total} dodges on ${archetype}. ${p.medianLatencyMs}ms median interrupt. Built on @elevenlabsio Speech Engine #ElevenHacks`;
}

async function insertAndFetchCard(payload: SharePayload): Promise<{
  url: string;
  file: File | null;
}> {
  const res = await fetch("/api/verdict", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = new Error(`verdict POST ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  const { id, url } = (await res.json()) as VerdictInsertResponse;

  // Same-origin fetch; no CORS.
  let file: File | null = null;
  try {
    const cardRes = await fetch(squareCardUrl(id));
    if (cardRes.ok) {
      const blob = await cardRes.blob();
      file = new File([blob], CARD_FILENAME, { type: "image/png" });
    }
  } catch {
    // Card fetch failure is non-fatal — we'll fall back to link-only share.
  }
  return { url, file };
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
  const [prewarmed, setPrewarmed] = useState<{ url: string; file: File | null } | null>(null);

  // Capture payload via ref so the mount-only effect can read latest values
  // without re-running on every render. Adding payload/archetype to deps would
  // re-fire the pre-warm and burn rate-limit budget.
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  // Pre-warm on mount: POST verdict + fetch card blob so the tap handler can call
  // navigator.share() synchronously within the user gesture. iOS Safari throws
  // NotAllowedError if any await sits between the gesture and the share call.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await insertAndFetchCard(payloadRef.current);
        if (!cancelled) setPrewarmed(result);
      } catch (err) {
        console.warn("[share] pre-warm failed, will fall back at tap time", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flashToast = (k: Exclude<ToastKind, "none">, ms = 1500) => {
    setToast(k);
    setTimeout(() => setToast("none"), ms);
  };

  async function executeShare(url: string, file: File | null): Promise<void> {
    const text = buildShareText(payloadRef.current, archetype);
    const nav = typeof navigator !== "undefined" ? navigator : undefined;

    if (nav && "share" in nav) {
      const data: ShareData = { title: "BALLHARD", text, url };
      const canFiles = file != null && nav.canShare?.({ files: [file] }) === true;
      if (canFiles) data.files = [file];

      try {
        await nav.share(data);
        flashToast("ok");
        return;
      } catch (err) {
        const name = (err as { name?: string } | null)?.name;
        if (name === "AbortError") return; // user dismissed
        // Fall through to X intent on other share errors.
      }
    }

    const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${url}`)}`;
    window.open(x, "_blank", "noopener");
    flashToast("ok");
  }

  const onShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (prewarmed) {
        await executeShare(prewarmed.url, prewarmed.file);
        return;
      }
      // Cold path: pre-warm failed or still in flight. iOS may block file-share
      // here because of the inline await, but link-only share still works.
      const fresh = await insertAndFetchCard(payloadRef.current);
      setPrewarmed(fresh);
      await executeShare(fresh.url, fresh.file);
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      if (status === 429) {
        flashToast("rate", 2000);
      } else {
        console.error("[share]", err);
        flashToast("err", 2000);
      }
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let file = prewarmed?.file ?? null;
      if (!file) {
        const fresh = await insertAndFetchCard(payloadRef.current);
        setPrewarmed(fresh);
        file = fresh.file;
      }
      if (!file) {
        flashToast("err", 2000);
        return;
      }
      const blobUrl = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = CARD_FILENAME;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      flashToast("ok");
    } catch (err) {
      console.error("[share:download]", err);
      flashToast("err", 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        className="w-full disabled:opacity-60"
      >
        <GlassSurface className="rounded-full px-5 py-4 active:bg-[var(--glass-fill-2)] bg-[var(--glass-fill-2)]">
          <span className="relative z-10 block text-headline font-semibold text-ink-1 tracking-[0.15em] text-center">
            {busy ? "SHARING…" : "SHARE VERDICT"}
          </span>
        </GlassSurface>
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={busy}
        className="mt-2 w-full text-caption-1 text-ink-3 tracking-[0.18em] uppercase disabled:opacity-60"
      >
        download card
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
