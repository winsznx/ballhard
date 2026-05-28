export const VERDICT_TEXTS = [
  "YOU DREW BLOOD.",
  "THEY GOT AWAY.",
  "EVEN.",
  "NO QUESTIONS ASKED.",
] as const;

export type VerdictText = (typeof VERDICT_TEXTS)[number];

export type SharePayload = {
  scenarioId: string;
  dodgesBroken: number;
  dodgesLanded: number;
  medianLatencyMs: number;
  verdictText: VerdictText;
};

export type VerdictInsertResponse = {
  id: string;
  url: string;
};

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function verdictUrl(id: string): string {
  return `${appUrl().replace(/\/$/, "")}/v/${id}`;
}

export function ogImageUrl(id: string): string {
  return `${appUrl().replace(/\/$/, "")}/api/og/${id}`;
}

// 1080x1080 attachable share card — different endpoint than the landscape
// link-unfurl OG. Used by Web Share API Level 2 file-sharing.
export function squareCardUrl(id: string): string {
  return `${appUrl().replace(/\/$/, "")}/api/og/${id}/square`;
}
