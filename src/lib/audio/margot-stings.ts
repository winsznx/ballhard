/**
 * Margot interruption-sting playback.
 *
 * Pre-rendered MP3s at /public/audio/stings/margot/. Six clips, weighted
 * random pick on barge-in. Debounced (no stacking within 600ms).
 *
 * Chrome blocks audio.play() outside a user gesture — call primeStings()
 * inside the Connect-button click handler to unlock the audio context
 * before any programmatic plays land.
 */

type StingDef = { file: string; weight: number };

const STINGS: StingDef[] = [
  { file: "01-stop.mp3", weight: 18 },
  { file: "02-no.mp3", weight: 18 },
  { file: "03-try-again.mp3", weight: 18 },
  { file: "04-forgive.mp3", weight: 18 },
  { file: "05-different-q.mp3", weight: 18 },
  { file: "06-halflaugh.mp3", weight: 10 },
];

const DEBOUNCE_MS = 600;
let elements: HTMLAudioElement[] | null = null;
let lastPlayAt = 0;

function ensureLoaded(): HTMLAudioElement[] {
  if (typeof window === "undefined") return [];
  if (elements) return elements;
  elements = STINGS.map(({ file }) => {
    const el = new Audio(`/audio/stings/margot/${file}`);
    el.preload = "auto";
    el.volume = 0.85;
    return el;
  });
  return elements;
}

/** Call inside the Connect-button click handler to unlock Chrome's audio context. */
export async function primeStings(): Promise<void> {
  const els = ensureLoaded();
  await Promise.all(
    els.map(async (el) => {
      try {
        el.muted = true;
        await el.play();
        el.pause();
        el.currentTime = 0;
        el.muted = false;
      } catch {
        // best-effort unlock; ignore
      }
    }),
  );
}

function weightedPick(): HTMLAudioElement | null {
  const els = ensureLoaded();
  if (els.length === 0) return null;
  const total = STINGS.reduce((sum, s) => sum + s.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < STINGS.length; i++) {
    r -= STINGS[i]!.weight;
    if (r <= 0) return els[i] ?? null;
  }
  return els[els.length - 1] ?? null;
}

export function playRandomSting(): void {
  const now = performance.now();
  if (now - lastPlayAt < DEBOUNCE_MS) return;
  const el = weightedPick();
  if (!el) return;
  lastPlayAt = now;
  try {
    el.currentTime = 0;
    void el.play().catch(() => {});
  } catch {
    // ignore
  }
}

export function stopAllStings(): void {
  if (!elements) return;
  for (const el of elements) {
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      // ignore
    }
  }
  lastPlayAt = 0;
}
