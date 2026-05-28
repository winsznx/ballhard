export type TurnEagerness = "patient" | "normal" | "eager";
export type ScenarioRank = "hero" | "tier2";

export type Scenario = {
  id: string;
  rank: ScenarioRank;
  title: string;
  chyron: {
    archetype: string;
    location: string;
    date: string;
  };
  voiceId: string;
  voiceHumanName: string;
  turn: {
    eagerness: TurnEagerness;
    turnTimeoutSec: number;
  };
  firstMessage: string;
  systemPrompt: string;
};

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function buildMessages(
  scenario: Pick<Scenario, "systemPrompt">,
  history: { role: "user" | "agent"; content: string }[],
): LlmMessage[] {
  return [
    { role: "system", content: scenario.systemPrompt },
    ...history.map<LlmMessage>((m) => ({
      role: m.role === "agent" ? "assistant" : "user",
      content: m.content,
    })),
  ];
}
