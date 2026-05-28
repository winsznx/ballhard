"use client";

/**
 * Verified @elevenlabs/react / @elevenlabs/client surface (from dist .d.ts):
 *
 *   useConversation({...HookCallbacks}) returns:
 *     status: 'disconnected' | 'connecting' | 'connected' | 'disconnecting'
 *     mode:   'speaking' | 'listening'
 *     startSession({conversationToken, connectionType: 'webrtc'})
 *     endSession()
 *
 *   HookCallbacks of interest:
 *     onModeChange({mode})           // agent-stop-speaking when wasSpeaking && mode==='listening'
 *     onMessage({message, source})   // completed transcript; source==='user' = player turn done
 *     onInterruption(event)          // SDK-confirmed barge-in (gates sting + pulse)
 *     onVadScore({vadScore})         // raw VAD — used for T0 rising-edge (CLAUDE.md §12)
 *
 * Scoring rule (CLAUDE.md §5 — LOCKED, do not relitigate):
 *   - First onMessage({source:"ai"}) after Connect → monologueComplete (no score change)
 *   - Subsequent onMessage({source:"ai"}):
 *       wasInterruptedThisTurn (onInterruption fired before this message) → dodgesBroken++
 *       otherwise                                                          → dodgesLanded++
 *     Reset wasInterruptedThisTurn each agent turn.
 *   - turnCount++ on onMessage({source:"user"}); auto-endRound at >= 8 (guarded).
 *
 * Why onMessage and not onModeChange: mode flips multiple times within a single
 * logical agent response (TTS chunking, micro-pauses), turning a single turn into
 * many false "landed" increments. onMessage fires once per finalized transcript.
 *
 * Why onInterruption and not VAD-rising-edge for the broken flag: VAD fires on
 * any user speech, including normal turn-taking after the agent finishes. The
 * SDK's onInterruption only fires when it judges the user cut the agent off
 * mid-TTS — which is the actual cinematic moment we're scoring.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useConversation } from "@elevenlabs/react";

import { playRandomSting, primeStings, stopAllStings } from "@/lib/audio/margot-stings";
import type { VerdictText } from "@/lib/share";

export type SessionStatus = "idle" | "requesting-mic" | "connecting" | "connected" | "error";
export type { VerdictText };

const PULSE_MS = 600;
const VAD_SPEECH_THRESHOLD = 0.5;
const TURN_LIMIT = 8;

function verdictFor(broken: number, landed: number): VerdictText {
  if (broken === 0 && landed === 0) return "NO QUESTIONS ASKED.";
  if (broken > landed) return "YOU DREW BLOOD.";
  if (broken < landed) return "THEY GOT AWAY.";
  return "EVEN.";
}

export function useSession() {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [interruptPulsing, setInterruptPulsing] = useState(false);
  const [latencyVersion, setLatencyVersion] = useState(0);

  const [dodgesBroken, setDodgesBroken] = useState(0);
  const [dodgesLanded, setDodgesLanded] = useState(0);
  const [monologueComplete, setMonologueComplete] = useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [scenarioIdState, setScenarioIdState] = useState<string | null>(null);

  const interruptT0Ref = useRef<number | null>(null);
  const latenciesRef = useRef<number[]>([]);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentSpeakingRef = useRef(false);
  const prevVadRef = useRef(0);
  const monologueCompleteRef = useRef(false);
  const roundEndedRef = useRef(false);
  const turnCountRef = useRef(0);
  const wasInterruptedThisTurnRef = useRef(false);
  // Tracks the most recent VAD rising-edge regardless of agent state, so
  // onInterruption can adopt it as T0 even if agentSpeakingRef had already
  // flipped to false by the time our VAD handler ran.
  const lastVadRiseRef = useRef<number | null>(null);

  const conversation = useConversation({
    onModeChange: ({ mode }) => {
      const wasSpeaking = agentSpeakingRef.current;
      agentSpeakingRef.current = mode === "speaking";

      if (wasSpeaking && mode === "listening") {
        // Latency close (Phase 4) — audio actually halted.
        if (interruptT0Ref.current != null) {
          const ms = Math.round(performance.now() - interruptT0Ref.current);
          interruptT0Ref.current = null;
          latenciesRef.current.push(ms);
          setLatencyMs(ms);
          setLatencyVersion((v) => v + 1);
        }
        // Monologue-end detector: the firstMessage TTS does NOT fire client-side
        // onMessage (per cookbook), so we mark monologueComplete on the first
        // audio-halt instead. Subsequent listening flips are no-ops for scoring;
        // that's onMessage(ai)'s job.
        if (!monologueCompleteRef.current) {
          monologueCompleteRef.current = true;
          setMonologueComplete(true);
        }
      }
    },
    onMessage: ({ source }) => {
      if (source === "user") {
        const next = turnCountRef.current + 1;
        turnCountRef.current = next;
        setTurnCount(next);
        if (next >= TURN_LIMIT && !roundEndedRef.current) {
          endRoundRef.current?.();
        }
        return;
      }
      // source === "ai" — one event per finalized agent turn.
      if (!monologueCompleteRef.current) {
        monologueCompleteRef.current = true;
        setMonologueComplete(true);
        wasInterruptedThisTurnRef.current = false;
        return;
      }
      if (wasInterruptedThisTurnRef.current) {
        setDodgesBroken((b) => b + 1);
      } else {
        setDodgesLanded((l) => l + 1);
      }
      wasInterruptedThisTurnRef.current = false;
    },
    onVadScore: ({ vadScore }) => {
      const prev = prevVadRef.current;
      prevVadRef.current = vadScore;
      // Track every silence→speech edge, unconditionally. onInterruption picks
      // it up if it confirms the speech as a real barge-in. Recording without
      // the agentSpeaking guard avoids the race where the SDK flips
      // agentSpeaking to false before our VAD handler sees the rising edge.
      // NOTE: vad_score must be in the seng_'s clientEvents list — see
      // scripts/provision-engine.ts.
      if (prev < VAD_SPEECH_THRESHOLD && vadScore >= VAD_SPEECH_THRESHOLD) {
        lastVadRiseRef.current = performance.now();
      }
    },
    onInterruption: () => {
      if (!agentSpeakingRef.current) return;
      // Flag this agent turn as broken. Cleared when the next agent message finalizes.
      wasInterruptedThisTurnRef.current = true;
      // T0 priority: most recent VAD rising-edge (within 1.5s — actual mic detect
      // time) > now (SDK-confirm time, ~2ms before mode flips, gives bogus 2ms).
      if (interruptT0Ref.current == null) {
        const now = performance.now();
        const vadT = lastVadRiseRef.current;
        interruptT0Ref.current = vadT != null && now - vadT < 1500 ? vadT : now;
      }
      playRandomSting();
      setInterruptPulsing(true);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => setInterruptPulsing(false), PULSE_MS);
    },
    onError: (message: string) => {
      setErrorMessage(message);
    },
  });

  const medianLatency = useMemo<number | null>(() => {
    void latencyVersion;
    const arr = [...latenciesRef.current].sort((a, b) => a - b);
    if (arr.length === 0) return null;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 === 0
      ? Math.round(((arr[mid - 1] ?? 0) + (arr[mid] ?? 0)) / 2)
      : (arr[mid] ?? null);
  }, [latencyVersion]);

  const verdictText = useMemo<VerdictText>(
    () => verdictFor(dodgesBroken, dodgesLanded),
    [dodgesBroken, dodgesLanded],
  );

  // Tear down audio session but PRESERVE scoring/latency state (verdict needs it).
  const closeAudioSession = useCallback(() => {
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
    stopAllStings();
    interruptT0Ref.current = null;
    agentSpeakingRef.current = false;
    prevVadRef.current = 0;
    setInterruptPulsing(false);
    conversation.endSession();
  }, [conversation]);

  // Public disconnect — same as closeAudioSession but also clears scoring (used by user-driven exits, not endRound).
  const disconnect = useCallback(() => {
    closeAudioSession();
    latenciesRef.current = [];
    turnCountRef.current = 0;
    monologueCompleteRef.current = false;
    roundEndedRef.current = false;
    wasInterruptedThisTurnRef.current = false;
    lastVadRiseRef.current = null;
    setLatencyMs(null);
    setLatencyVersion(0);
    setDodgesBroken(0);
    setDodgesLanded(0);
    setMonologueComplete(false);
    setRoundEnded(false);
    setTurnCount(0);
    setStatus("idle");
  }, [closeAudioSession]);

  const endRound = useCallback(() => {
    if (roundEndedRef.current) return;
    roundEndedRef.current = true;
    setRoundEnded(true);
    closeAudioSession();
    setStatus("idle");
  }, [closeAudioSession]);

  // Stable handle for the onMessage closure to call endRound without stale deps.
  const endRoundRef = useRef<typeof endRound>(endRound);
  endRoundRef.current = endRound;

  const connect = useCallback(
    async (scenarioId: string) => {
      setErrorMessage(null);
      setScenarioIdState(scenarioId);
      try {
        setStatus("requesting-mic");
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await primeStings();

        setStatus("connecting");
        const res = await fetch(
          `/api/session?scenarioId=${encodeURIComponent(scenarioId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `session HTTP ${res.status}`);
        }
        const { token } = (await res.json()) as { token: string };

        await conversation.startSession({
          conversationToken: token,
          connectionType: "webrtc",
        });
        setStatus("connected");
      } catch (e) {
        const err = e as Error;
        setErrorMessage(err.message);
        setStatus("error");
      }
    },
    [conversation],
  );

  const playAgain = useCallback(async () => {
    const id = scenarioIdState;
    if (!id) return;
    disconnect();
    await connect(id);
  }, [scenarioIdState, disconnect, connect]);

  // Unmount cleanup
  useEffect(
    () => () => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      stopAllStings();
    },
    [],
  );

  return {
    status,
    errorMessage,
    isSpeaking: conversation.isSpeaking,
    mode: conversation.mode,
    connect,
    disconnect,
    endRound,
    playAgain,
    latencyMs,
    medianLatency,
    interruptPulsing,
    dodgesBroken,
    dodgesLanded,
    monologueComplete,
    roundEnded,
    turnCount,
    turnLimit: TURN_LIMIT,
    verdictText,
    currentCaption: "",
  };
}
