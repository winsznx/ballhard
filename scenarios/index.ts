import { chair_of_chair } from "./chair_of_chair";
import { contractor } from "./contractor";
import { corporate_bow } from "./corporate_bow";
import { embezzler } from "./embezzler";
import { expediter } from "./expediter";
import { hair_dryer } from "./hair_dryer";
import { tech_ceo } from "./tech_ceo";
import type { Scenario } from "./types";

// Canonical display order: hero first (submission video order), then tier2 in script.md order.
export const SCENARIOS: Scenario[] = [
  corporate_bow,
  tech_ceo,
  embezzler,
  hair_dryer,
  expediter,
  contractor,
  chair_of_chair,
];

export const SCENARIOS_BY_ID: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s] as const),
);

export type { Scenario, ScenarioRank, TurnEagerness, LlmMessage } from "./types";
export { buildMessages } from "./types";
