"use client";

import { useEffect, useRef } from "react";

import { ConversationProvider } from "@elevenlabs/react";

import {
  PressConferenceFrame,
  type PressConferenceFrameProps,
} from "@/components/PressConferenceFrame";
import { GlassSurface } from "@/components/primitives/GlassSurface";
import { Mono } from "@/components/primitives/Mono";
import { VerdictSheet } from "@/components/verdict/VerdictSheet";
import { useSession } from "@/lib/hooks/useSession";

export function PressConferenceSession({
  scenarioId,
  frameProps,
}: {
  scenarioId: string;
  frameProps: PressConferenceFrameProps;
}) {
  return (
    <ConversationProvider>
      <Inner scenarioId={scenarioId} frameProps={frameProps} />
    </ConversationProvider>
  );
}

function Inner({
  scenarioId,
  frameProps,
}: {
  scenarioId: string;
  frameProps: PressConferenceFrameProps;
}) {
  const {
    status,
    errorMessage,
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
    turnLimit,
    verdictText,
  } = useSession();

  const sessionActive = status === "connected" || roundEnded;

  const liveFrameProps: PressConferenceFrameProps = {
    ...frameProps,
    latencyMs: sessionActive ? latencyMs : frameProps.latencyMs,
    latencyPulsing: interruptPulsing,
    scorecard: sessionActive
      ? { broken: dodgesBroken, landed: dodgesLanded }
      : frameProps.scorecard,
    endRound:
      status === "connected"
        ? {
            turnCount,
            turnLimit,
            disabled: !monologueComplete,
            onEnd: endRound,
          }
        : undefined,
  };

  // Only tear down on unmount — `disconnect` reference changes per render
  // (useConversation state updates trigger new useCallback identity), and a
  // [disconnect]-deps effect would cleanup-and-rebuild on every status flip,
  // killing the LiveKit room the moment it opens.
  const disconnectRef = useRef(disconnect);
  disconnectRef.current = disconnect;
  useEffect(() => () => disconnectRef.current(), []);

  const showConnect = status !== "connected" && !roundEnded;

  return (
    <div className="relative min-h-dvh">
      <PressConferenceFrame {...liveFrameProps} />
      {showConnect && (
        <ConnectOverlay
          status={status}
          errorMessage={errorMessage}
          onConnect={() => connect(scenarioId)}
        />
      )}
      <VerdictSheet
        open={roundEnded}
        scenarioId={scenarioId}
        archetype={frameProps.chyron.archetype}
        verdictText={verdictText}
        dodgesBroken={dodgesBroken}
        dodgesLanded={dodgesLanded}
        medianLatency={medianLatency}
        onPlayAgain={() => {
          void playAgain();
        }}
      />
    </div>
  );
}

function ConnectOverlay({
  status,
  errorMessage,
  onConnect,
}: {
  status: ReturnType<typeof useSession>["status"];
  errorMessage: string | null;
  onConnect: () => void;
}) {
  const busy = status === "requesting-mic" || status === "connecting";
  const label =
    status === "requesting-mic"
      ? "REQUESTING MIC…"
      : status === "connecting"
        ? "CONNECTING…"
        : status === "error"
          ? "RETRY"
          : "CONNECT";

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[rgba(8,8,12,0.72)] backdrop-blur-md px-6">
      <button
        type="button"
        onClick={onConnect}
        disabled={busy}
        className="w-full max-w-[280px] disabled:opacity-60"
      >
        <GlassSurface className="rounded-full px-6 py-5 active:bg-[var(--glass-fill-2)]">
          <span className="relative z-10 block text-headline font-semibold text-ink-1 tracking-[0.15em]">
            {label}
          </span>
        </GlassSurface>
      </button>
      <p className="mt-4 max-w-[280px] text-center text-footnote text-ink-3">
        Tap to grant mic and enter the press room. The First Minister speaks first.
      </p>
      {errorMessage && (
        <div className="mt-4 max-w-[280px] text-center">
          <Mono size="caption" className="text-interrupt-red">
            {errorMessage}
          </Mono>
        </div>
      )}
    </div>
  );
}
