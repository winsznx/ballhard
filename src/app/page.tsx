import { ScenarioCard } from "@/components/lobby/ScenarioCard";
import { Mono } from "@/components/primitives/Mono";
import { SCENARIOS } from "@scenarios";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col px-5 pt-safe pb-safe">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, rgba(60,40,90,0.45) 0%, rgba(8,8,12,1) 65%)",
        }}
      />
      <header className="flex flex-col gap-2 pt-10 pb-6">
        <h1
          className="font-bold tracking-tight text-ink-1"
          style={{ fontSize: "3.25rem", lineHeight: 0.95 }}
        >
          BALLHARD
        </h1>
        <p className="text-subhead text-ink-3 uppercase tracking-[0.18em]">
          Six scandals. One Margot.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        {SCENARIOS.map((s) => (
          <ScenarioCard key={s.id} scenario={s} />
        ))}
      </section>

      <footer className="mt-auto pt-8 pb-2">
        <Mono size="caption" className="text-ink-3">
          built on elevenlabs speech engine · #ElevenHacks
        </Mono>
      </footer>
    </main>
  );
}
