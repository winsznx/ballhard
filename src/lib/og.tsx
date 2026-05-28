import { ImageResponse } from "next/og";

export type OgInput = {
  verdictText: string;
  archetype: string;
  dodgesBroken: number;
  dodgesLanded: number;
  medianLatencyMs: number;
};

export function renderOg(input: OgInput): Response {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "rgb(8,8,12)",
          backgroundImage:
            "radial-gradient(120% 80% at 50% 0%, rgba(60,40,90,0.55) 0%, rgba(8,8,12,1) 60%)",
          padding: "72px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "rgba(255,255,255,0.96)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.42)",
          }}
        >
          <span style={{ display: "flex" }}>BALLHARD</span>
          <span style={{ display: "flex" }}>·</span>
          <span style={{ display: "flex" }}>VS {input.archetype}</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 124,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          {input.verdictText}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            gap: 60,
            paddingTop: 40,
            borderTop: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 96,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              {input.medianLatencyMs}MS
            </span>
            <span
              style={{
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.42)",
              }}
            >
              MEDIAN INTERRUPT
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 64,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: -1,
              }}
            >
              {input.dodgesBroken} / {input.dodgesLanded}
            </span>
            <span
              style={{
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.42)",
              }}
            >
              DODGES — BROKEN / LANDED
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              alignItems: "flex-end",
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 16,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.42)",
            }}
          >
            built on elevenlabs speech engine · #ElevenHacks
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "cache-control": "public, max-age=3600, immutable",
      },
    },
  );
}
