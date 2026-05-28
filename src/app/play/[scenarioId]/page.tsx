import { notFound } from "next/navigation";

import { PressConferenceSession } from "@/components/PressConferenceSession";
import { type PressConferenceFrameProps } from "@/components/PressConferenceFrame";
import { SCENARIOS_BY_ID, type Scenario } from "@scenarios";

function framePropsFor(scenario: Scenario): PressConferenceFrameProps {
  return {
    chyron: scenario.chyron,
    margotName: "MARGOT",
    captionRole: "you",
    captionText: `${scenario.chyron.archetype} — tap CONNECT to enter the press room.`,
    latencyMs: null,
    scorecard: { broken: 0, landed: 0 },
  };
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = SCENARIOS_BY_ID[scenarioId];
  if (!scenario) notFound();
  return <PressConferenceSession scenarioId={scenarioId} frameProps={framePropsFor(scenario)} />;
}
