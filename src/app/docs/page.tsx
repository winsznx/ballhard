import type { Metadata } from "next";

import { Accordion, AccordionGroup } from "@/components/docs/Accordion";
import { AnchorHeading } from "@/components/docs/AnchorHeading";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocCard, DocCardGrid } from "@/components/docs/DocCard";
import { DocsLayout, type DocsSection } from "@/components/docs/DocsLayout";
import { Mermaid } from "@/components/docs/Mermaid";
import { Step, Steps } from "@/components/docs/Steps";
import { SCENARIOS } from "@scenarios";

export const metadata: Metadata = {
  title: "Docs · BALLHARD",
  description:
    "How BALLHARD works: the interrupt mechanic, scoring, scenarios, sharing, and the Speech Engine integration under the hood.",
};

const SECTIONS: DocsSection[] = [
  { id: "what", label: "What is BALLHARD" },
  {
    id: "quickstart",
    label: "Quick start",
    subheadings: [{ id: "quickstart-tips", label: "Setup tips" }],
  },
  {
    id: "interrupt",
    label: "The interrupt mechanic",
    subheadings: [
      { id: "interrupt-when", label: "When to interrupt" },
      { id: "interrupt-latency", label: "The latency number" },
    ],
  },
  {
    id: "scoring",
    label: "Scoring & verdicts",
    subheadings: [
      { id: "scoring-rules", label: "The rules" },
      { id: "scoring-verdicts", label: "The four verdicts" },
    ],
  },
  { id: "scenarios", label: "The scenarios" },
  { id: "sharing", label: "Sharing your verdict" },
  { id: "troubleshooting", label: "Troubleshooting" },
  {
    id: "how-it-works",
    label: "How it works",
    subheadings: [
      { id: "how-architecture", label: "Architecture" },
      { id: "how-latency", label: "Measuring latency" },
      { id: "how-surfaces", label: "ElevenLabs surfaces" },
    ],
  },
];

const HEROES = SCENARIOS.filter((s) => s.rank === "hero");
const TIER2 = SCENARIOS.filter((s) => s.rank === "tier2");

const MERMAID_ARCH = `graph LR
  Browser["Browser<br/>(Next.js · WebRTC)"]
  Web["Web API<br/>(Next.js)"]
  EL["ElevenLabs Cloud<br/>Speech Engine"]
  Sidecar["Sidecar<br/>(Railway)"]
  LLM["Language Model<br/>(Groq Llama)"]
  DB["Supabase<br/>verdict_cards"]

  Browser -->|"GET /api/session"| Web
  Web -->|"getWebrtcToken"| EL
  Web -->|"token + sengId"| Browser
  Browser -.->|"mic + audio"| EL
  EL -.->|"WS /ws/scenarioId"| Sidecar
  Sidecar -->|"chat + signal"| LLM
  LLM -.->|"streamed tokens"| Sidecar
  Sidecar -.->|"sendResponse"| EL
  Browser -->|"POST /api/verdict"| Web
  Web -->|"insert"| DB`;

export default function DocsPage() {
  return (
    <DocsLayout sections={SECTIONS}>
      <header className="mb-10 flex flex-col gap-3">
        <span className="font-mono text-caption-1 tracking-[0.22em] text-ink-3">
          DOCUMENTATION
        </span>
        <h1 className="text-large-title font-bold tracking-tight text-ink-1">
          How BALLHARD works
        </h1>
        <p className="text-body text-ink-2 leading-relaxed">
          A voice game where you interrupt evading politicians and CEOs at press
          conferences. This page walks you through how to play, how scoring works,
          and how Speech Engine makes the cinematic mid-deflection cut possible.
        </p>
      </header>

      {/* 1 — What is BALLHARD */}
      <section>
        <AnchorHeading id="what">What is BALLHARD</AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          You&apos;re a journalist at a press conference. The principal — First
          Minister, Tech CEO, Chaebol Chairman — is dodging. They deliver a prepared
          deflection. Your job is to interrupt at exactly the right moment with the
          cutting follow-up, or let them get away with it. The whole thing happens
          in real audio: you talk, they talk, and the interrupt fires the moment
          your voice hits the mic.
        </p>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          Every scenario is seeded from a real news cycle. Seven principals, seven
          archetypes of evasion. One Margot — that&apos;s you.
        </p>
        <Callout type="tip">
          BALLHARD is voice-only. You actually speak. Grant microphone permission
          when prompted, and use headphones if you can — speaker audio can feed
          back into the mic and trigger false interrupts.
        </Callout>
      </section>

      {/* 2 — Quick start */}
      <section>
        <AnchorHeading id="quickstart">Quick start</AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          From cold start to first verdict in about 90 seconds.
        </p>
        <Steps>
          <Step>
            <strong className="text-ink-1">Pick a scenario from the lobby.</strong>{" "}
            Seven cards, hero scenarios on top. Each one is a different principal
            with a different deflection pattern.
          </Step>
          <Step>
            <strong className="text-ink-1">Tap CONNECT.</strong> Your browser asks
            for the microphone. Grant permission — the game can&apos;t start
            without it.
          </Step>
          <Step>
            <strong className="text-ink-1">Listen to the opening statement.</strong>{" "}
            The principal speaks first with a ~30-second prepared monologue.
            You can&apos;t interrupt this part — it sets the scene.
          </Step>
          <Step>
            <strong className="text-ink-1">Ask a question.</strong> Speak when the
            monologue ends. The principal will start a deflection.
          </Step>
          <Step>
            <strong className="text-ink-1">Interrupt mid-deflection.</strong> Cut
            them off while they&apos;re pivoting away from your question. Audio
            halts, a Margot sting fires, the latency badge flashes.
          </Step>
          <Step>
            <strong className="text-ink-1">End the round.</strong> Tap END (or play
            through 8 turns). The verdict sheet snaps up with your stats and a
            shareable card.
          </Step>
        </Steps>
        <AnchorHeading level="h3" id="quickstart-tips">
          Setup tips
        </AnchorHeading>
        <Callout type="warning">
          Headphones are strongly recommended. Without them, the principal&apos;s
          audio coming out of your speakers can be picked up by your mic and
          trigger false interrupts. The game will think you&apos;re talking when
          you&apos;re not.
        </Callout>
      </section>

      {/* 3 — Interrupt mechanic */}
      <section>
        <AnchorHeading id="interrupt">The interrupt mechanic</AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          This is the core of the game. When the principal is mid-deflection and
          you speak, three things happen in sequence within a fraction of a
          second: their audio stops, Margot delivers a short interruption sting
          (&ldquo;With respect, no —&rdquo;, &ldquo;Try again&rdquo;,
          &ldquo;Stop —&rdquo;), and the latency badge in the corner flashes red
          with the measured ms.
        </p>
        <AnchorHeading level="h3" id="interrupt-when">
          When to interrupt
        </AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          Not every dodge deserves a cut. Two situations are worth it:
        </p>
        <ul className="mt-3 ml-4 flex flex-col gap-2 text-body text-ink-2 leading-relaxed list-disc">
          <li>
            <strong className="text-ink-1">Mid-pivot.</strong> They&apos;ve
            acknowledged your question and are about to slide off it. Cut
            them before the pivot lands — that&apos;s the cinematic moment, and
            it counts as a broken dodge in your score.
          </li>
          <li>
            <strong className="text-ink-1">When they repeat themselves.</strong>{" "}
            If they&apos;re re-using a deflection from earlier in the round,
            interrupt and force a different answer.
          </li>
        </ul>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          When NOT to interrupt: when a binary follow-up is set up. If you can
          land a yes-or-no question that the principal must visibly dodge, let
          them finish — then ask it.
        </p>
        <AnchorHeading level="h3" id="interrupt-latency">
          The latency number
        </AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          The number in the top-right of the press room is the real measured
          time from your voice hitting the mic to the principal&apos;s audio
          actually halting. It&apos;s captured client-side: voice-activity
          detection picks up the rising edge of your speech (T0), and the audio
          player confirms playback has dropped to zero (T1).
        </p>
        <Callout type="note">
          Typical numbers on a wired desktop with headphones run around 200-300
          ms. Mobile networks add more. The median across the round is what
          shows up on the verdict card — that&apos;s the headline stat.
        </Callout>
      </section>

      {/* 4 — Scoring */}
      <section>
        <AnchorHeading id="scoring">Scoring & verdicts</AnchorHeading>
        <AnchorHeading level="h3" id="scoring-rules">
          The rules
        </AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          The opening monologue does not count toward your score. After that:
        </p>
        <ul className="mt-3 ml-4 flex flex-col gap-2 text-body text-ink-2 leading-relaxed list-disc">
          <li>
            Every principal turn either gets <strong className="text-ink-1">interrupted</strong>{" "}
            (counts as a dodge broken by you) or <strong className="text-ink-1">completes
            cleanly</strong> (counts as a dodge landed by them).
          </li>
          <li>
            Your turn count goes up each time you speak a question, regardless
            of whether they then interrupt or land.
          </li>
          <li>
            The round auto-ends after eight of your turns, or whenever you tap
            END in the bottom corner.
          </li>
        </ul>
        <AnchorHeading level="h3" id="scoring-verdicts">
          The four verdicts
        </AnchorHeading>
        <DocCardGrid>
          <DocCard
            href="#scoring-verdicts"
            title="YOU DREW BLOOD"
            description="You broke more dodges than they landed. The visible cuts add up to genuine damage to their performance."
          />
          <DocCard
            href="#scoring-verdicts"
            title="THEY GOT AWAY"
            description="They landed more deflections than you broke. The pivots survived; the room moved on."
          />
          <DocCard
            href="#scoring-verdicts"
            title="EVEN"
            description="Equal broken and landed (and both above zero). A real fight, no clean winner."
          />
          <DocCard
            href="#scoring-verdicts"
            title="NO QUESTIONS ASKED"
            description="You stayed silent through the round. The principal walked away unchallenged."
          />
        </DocCardGrid>
      </section>

      {/* 5 — Scenarios */}
      <section>
        <AnchorHeading id="scenarios">The scenarios</AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          Seven principals, each on their own provisioned Speech Engine instance
          with a character-specific voice, turn-eagerness setting, and deflection
          system prompt. Hero scenarios open the demo; tier-two scenarios round
          out the cultural surface.
        </p>
        <h3 className="mt-8 font-mono text-caption-1 tracking-[0.22em] text-ink-3">
          HERO
        </h3>
        <DocCardGrid>
          {HEROES.map((s) => (
            <DocCard
              key={s.id}
              href={`/play/${s.id}`}
              title={s.chyron.archetype}
              subtitle={`${s.chyron.location} · ${s.chyron.date}`}
              description={`${s.firstMessage.split(" ").slice(0, 16).join(" ")}…`}
            />
          ))}
        </DocCardGrid>
        <h3 className="mt-8 font-mono text-caption-1 tracking-[0.22em] text-ink-3">
          TIER 2
        </h3>
        <DocCardGrid>
          {TIER2.map((s) => (
            <DocCard
              key={s.id}
              href={`/play/${s.id}`}
              title={s.chyron.archetype}
              subtitle={`${s.chyron.location} · ${s.chyron.date}`}
              description={`${s.firstMessage.split(" ").slice(0, 16).join(" ")}…`}
            />
          ))}
        </DocCardGrid>
      </section>

      {/* 6 — Sharing */}
      <section>
        <AnchorHeading id="sharing">Sharing your verdict</AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          When the verdict sheet appears, the SHARE button drops your card into
          a native share sheet on mobile, or opens an X intent on desktop. The
          card travels as a real 1080×1080 image attached alongside the link
          where the platform supports it (iMessage, WhatsApp, Instagram).
          Download the card directly if you&apos;d rather post manually.
        </p>
        <Callout type="info">
          Verdict pages are public, anonymous, and immutable. The card image is
          generated on demand from the saved row — no personal data is stored,
          and the URL is the same every time it renders.
        </Callout>
      </section>

      {/* 7 — Troubleshooting */}
      <section>
        <AnchorHeading id="troubleshooting">Troubleshooting</AnchorHeading>
        <AccordionGroup>
          <Accordion title="I can't hear anything">
            Check your device volume, then your browser&apos;s site-level audio
            permission for the BALLHARD tab. If you&apos;re on iOS, the silent
            switch on the side of your phone mutes media audio too. Trying
            headphones often surfaces output issues immediately.
          </Accordion>
          <Accordion title="The mic isn't working">
            Grant microphone permission when the browser prompts. If you missed
            the prompt or denied it, open your browser&apos;s site settings for
            the BALLHARD tab and re-enable mic access, then refresh. Mic access
            requires HTTPS — direct IP addresses or insecure origins will be
            blocked.
          </Accordion>
          <Accordion title="Latency looks high">
            The latency badge shows real measured numbers. Wired ethernet with
            headphones on a desktop yields the best results — typically
            200-300 ms. Mobile networks (especially 4G or congested wifi) add
            real round-trip delay, so 400-700 ms isn&apos;t unusual on a phone.
            The cinematic moment still lands; the number just runs higher.
          </Accordion>
          <Accordion title="Which browsers are supported?">
            Anything modern with WebRTC and microphone access. Chrome, Safari,
            and Edge on desktop and mobile all work. Firefox should work too
            but is less tested. The share button uses Web Share API where
            available, otherwise falls back to X intent.
          </Accordion>
          <Accordion title="It interrupted the principal when I wasn't talking">
            Voice-activity detection picked up background noise or speaker
            feedback. Most often this is the principal&apos;s own audio
            bleeding into your mic. Use headphones, or move further from the
            speakers, and the false-trigger rate drops to near zero.
          </Accordion>
        </AccordionGroup>
      </section>

      {/* 8 — How it works */}
      <section>
        <AnchorHeading id="how-it-works">How it works</AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          BALLHARD runs on{" "}
          <a
            href="https://elevenlabs.io/docs/eleven-api/guides/cookbooks/speech-engine"
            target="_blank"
            rel="noreferrer"
            className="text-ink-1 underline decoration-ink-3 underline-offset-4"
          >
            ElevenLabs Speech Engine
          </a>
          . Speech Engine handles the full voice pipeline — speech-to-text, turn
          detection, text-to-speech, and the real-time interrupt primitive —
          while BALLHARD brings its own language model for the principals&apos;
          deflections. The two halves meet over WebSocket.
        </p>
        <AnchorHeading level="h3" id="how-architecture">
          Architecture
        </AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          The browser opens a WebRTC voice session with ElevenLabs using a
          short-lived token minted by the web API. ElevenLabs then dials into
          BALLHARD&apos;s sidecar over WebSocket — one attachment per scenario,
          each on its own path. When the player speaks, ElevenLabs sends the
          transcript to the sidecar, which streams a response from the language
          model and pipes it back to ElevenLabs for synthesis.
        </p>
        <Mermaid chart={MERMAID_ARCH} />
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          The interrupt magic lives in the AbortSignal that Speech Engine fires
          when a new player transcript arrives mid-response. That signal cancels
          the in-flight language model call cleanly, so token generation stops
          where the principal was cut off — not at the end of their thought.
          The TTS pipeline halts in lockstep, which is what produces the
          mid-syllable cut you hear.
        </p>
        <AnchorHeading level="h3" id="how-latency">
          Measuring latency
        </AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          The number on the latency badge is captured client-side. T0 is the
          first frame where Speech Engine&apos;s VAD score crosses the threshold
          for &ldquo;user speaking&rdquo; while the principal is still talking.
          T1 is the moment the principal&apos;s audio actually halts (reported
          by the session as a mode flip from speaking back to listening). The
          difference is what you see; the median across the round is the headline
          stat on the verdict card.
        </p>
        <CodeBlock
          language="ts"
          code={`onVadScore: ({ vadScore }) => {
  if (prevVad < 0.5 && vadScore >= 0.5) {
    lastVadRiseRef.current = performance.now();   // T0
  }
  prevVad = vadScore;
},
onModeChange: ({ mode }) => {
  if (wasSpeaking && mode === "listening" && interruptT0Ref.current) {
    const latency = performance.now() - interruptT0Ref.current;   // T1 - T0
    pushLatency(Math.round(latency));
  }
},`}
        />
        <AnchorHeading level="h3" id="how-surfaces">
          ElevenLabs surfaces
        </AnchorHeading>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          Five surfaces from the ElevenLabs platform are stacked in production:
        </p>
        <ul className="mt-3 ml-4 flex flex-col gap-2 text-body text-ink-2 leading-relaxed list-disc">
          <li>
            <strong className="text-ink-1">Speech Engine</strong> — per-scenario
            provisioning with custom client-events (including VAD scores for
            accurate timing) and per-path engine attachment for routing one
            sidecar across all seven principals.
          </li>
          <li>
            <strong className="text-ink-1">TTS (Multilingual v2)</strong> —
            Margot&apos;s six interruption stings are pre-rendered; the
            principal&apos;s opening monologue is rendered live via Speech
            Engine&apos;s firstMessage override.
          </li>
          <li>
            <strong className="text-ink-1">Voice Library</strong> — all seven
            principal voices plus Margot, picked across accents, ages, and
            genders so each character reads as a different person.
          </li>
          <li>
            <strong className="text-ink-1">Music</strong> — the submission video
            music bed, generated from a single prompt.
          </li>
          <li>
            <strong className="text-ink-1">Voices REST API</strong> — voice
            resolution during provisioning and the Day-0 infrastructure
            validation gate.
          </li>
        </ul>
        <Callout type="tip">
          If you&apos;re building on Speech Engine, the{" "}
          <a
            href="https://elevenlabs.io/docs/eleven-api/guides/cookbooks/speech-engine"
            target="_blank"
            rel="noreferrer"
            className="text-ink-1 underline decoration-ink-3 underline-offset-4"
          >
            cookbook
          </a>{" "}
          covers the patterns BALLHARD uses: engine.attach, the AbortSignal
          contract on onTranscript, and the conversationToken flow for WebRTC
          clients.
        </Callout>
      </section>

      <footer className="mt-16 border-t border-[var(--glass-border)] pt-6">
        <p className="font-mono text-caption-1 tracking-[0.18em] text-ink-3">
          built on elevenlabs speech engine · #ElevenHacks
        </p>
      </footer>
    </DocsLayout>
  );
}
