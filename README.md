# BALLHARD

> A voice game where you interrupt evading politicians and CEOs at press conferences.

![BALLHARD verdict card](https://ballhard-web-production.up.railway.app/api/og/cover)

## Why it matters

Every news cycle now opens with the same scene — a CEO or politician steps to a lectern and runs a deflection routine. Acknowledge, pivot, redirect, close. The cameras roll, the questions get asked, the dodges land. The whole choreography depends on one thing: nobody interrupts.

**BALLHARD makes the interrupt the gameplay.** You're Margot Renard, senior political correspondent. The principal is dodging. You cut in at the perfect moment with the cutting follow-up — or you let them get away with it. Six scandals from this week's news, seven AI principals with character-keeping under pressure, one Margot.

This was only possible because [ElevenLabs Speech Engine](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/speech-engine) ships a real-time barge-in primitive — when the player's voice hits the mic, an `AbortSignal` fires across the LLM stream and TTS playback halts within the same RTT. That's the cinematic moment competitors won't reproduce in a hackathon timeline.

## Live

- **Play:** [`ballhard-web-production.up.railway.app`](https://ballhard-web-production.up.railway.app)
- **Submission:** ElevenHacks #10 — Speech Engine track

## What's built

- Real-time WebRTC voice loop with a **sub-300ms barge-in latency** measured from VAD-rising-edge to audio-halt (see CLAUDE.md §12 spec; verified at ~250ms median over 5+ interrupts per session)
- **Seven distinct AI principals** — Scottish First Minister, American Tech CEO, Australian Chaebol Chair, etc. — each on its own provisioned Speech Engine `seng_` with character-specific turn eagerness, voice, and deflection system prompt
- **Margot interruption stings** pre-rendered via TTS, weighted-random played on every confirmed barge-in
- **Persistent verdict-card share loop** — every round produces a shareable URL with a server-rendered Open Graph image that unfurls in Discord / X / iMessage

## ElevenLabs surfaces stacked

| Surface | Where it's used |
|---|---|
| **Speech Engine** | The core. Per-scenario `seng_` provisioning with custom `clientEvents` (including `vad_score` for accurate T0 timing), per-path `engine.attach()` for routing one sidecar across 7 scenarios |
| **TTS (Multilingual v2)** | Margot's 6 interruption stings (pre-rendered), each principal's opening monologue (live, via Speech Engine `firstMessage` override) |
| **Voice Library** | All 7 principal voices + Margot — picked across accents, ages, and genders for distinctness |
| **Music** | Submission video bed (`cinematic news thriller, low strings, urgent percussion, 90 bpm`) |
| **Voices REST API** | Verifying voice IDs resolve before provisioning |

## Architecture

```mermaid
%%{init: {'theme':'dark','themeVariables':{'background':'#0a0a14','primaryColor':'#1a1a28','primaryTextColor':'#e5e5ea','primaryBorderColor':'#3a3a4a','lineColor':'#5a5a6a','actorBkg':'#1a1a28','actorBorder':'#3a3a4a','actorTextColor':'#e5e5ea','signalColor':'#5a5a6a','signalTextColor':'#e5e5ea','labelBoxBkgColor':'#1a1a28','labelTextColor':'#e5e5ea','noteBkgColor':'#1a1a28','noteTextColor':'#e5e5ea','noteBorderColor':'#3a3a4a'}}}%%
sequenceDiagram
  autonumber
  participant Browser as Browser (Next.js)
  participant Web as Web API (Node)
  participant ElevenLabs as ElevenLabs Cloud
  participant Sidecar as Sidecar (Railway)
  participant LLM as Groq Llama 3.3 70B
  participant Supabase as Supabase

  Browser->>Web: GET /api/session?scenarioId=embezzler
  Web->>ElevenLabs: conversationalAi.conversations.getWebrtcToken({agentId: seng_})
  ElevenLabs-->>Web: { token }
  Web-->>Browser: { token, sengId }
  Browser->>ElevenLabs: useConversation.startSession({conversationToken, webrtc})
  ElevenLabs->>Sidecar: WS dial → /ws/embezzler
  Sidecar-->>ElevenLabs: ack
  ElevenLabs-->>Browser: TTS principal monologue (firstMessage override)
  Browser->>ElevenLabs: mic audio (LiveKit WebRTC)
  Note over Browser,ElevenLabs: VAD rising-edge → T0 client-side
  ElevenLabs->>Sidecar: onTranscript(history, signal)
  Sidecar->>LLM: chat.completions.create({signal, messages})
  LLM-->>Sidecar: streamed tokens
  Sidecar->>ElevenLabs: session.sendResponse(stream)
  ElevenLabs-->>Browser: TTS deflection
  Note over Browser: player interrupts → signal.abort()
  Browser-->>ElevenLabs: VAD speech
  ElevenLabs-->>Sidecar: new onTranscript (auto-aborts previous signal)
  Note over Browser: T1 = audio halts · pulse + sting
  Browser->>Web: POST /api/verdict (at round end)
  Web->>Supabase: insert verdict_cards
  Supabase-->>Web: { id }
  Web-->>Browser: { id, url }
  Browser->>Browser: navigator.share() | X intent
```

## Stack

Next.js (App Router), React 19, Tailwind 4, ElevenLabs JS SDK, Groq Llama 3.3 70B, Supabase (RLS-gated public verdicts), Railway (web + sidecar), Vaul (verdict sheet), LiveKit WebRTC (via ElevenLabs).

## Run locally

```bash
git clone https://github.com/winsznx/ballhard.git
cd ballhard
cp .env.example .env.local
# fill in: ELEVENLABS_API_KEY, GROQ_API_KEY, NEXT_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY
pnpm install
pnpm provision:engine --all --ws-url=wss://your-sidecar/ws   # one-time per environment
pnpm dev:engine    # sidecar on :8787
pnpm dev           # web on :3000
```

The sidecar must be reachable from ElevenLabs cloud (publicly resolvable WS) — Railway provides this. For local dev against a hosted sidecar, set the seng_s' `wsUrl` to your sidecar's public Railway URL.

## Credits

Built for ElevenLabs Hack #10 (Speech Engine), May 2026.

## License

[MIT](./LICENSE)
