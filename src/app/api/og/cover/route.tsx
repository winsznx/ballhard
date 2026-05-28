import { renderOg } from "@/lib/og";

// Deterministic site-wide OG image — no DB hit, hardcoded canonical hero card.
// Used as the default og:image for /, /play/*, and submission cover image.

export const runtime = "nodejs";

export function GET() {
  return renderOg({
    verdictText: "YOU DREW BLOOD.",
    archetype: "FIRST MINISTER",
    dodgesBroken: 3,
    dodgesLanded: 1,
    medianLatencyMs: 184,
  });
}
