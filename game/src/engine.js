/**
 * The only file in the game that reaches into the frozen Milestone 1 engine.
 *
 * Everything is imported, nothing is copied or changed. The debug probe
 * (lineage-m1/src/debug) is a leaf by M1's own dependency rule, so the game
 * imports only config, core, fixtures and observer.
 */

export { createInitialState } from "../../lineage-m1/src/core/individual.js";
export { advanceGeneration, isExtinct } from "../../lineage-m1/src/core/simulation.js";
export { currentModelConfig } from "../../lineage-m1/src/config/modelConfig.js";
export { TRAITS, TRAIT_INDEX, MEANINGFUL_TRAIT_INDICES, NEUTRAL_TRAIT_INDICES, EFFECT, UPKEEP } from "../../lineage-m1/src/config/traits.js";
export { currentZoneBinIndex, zoneBinCounts } from "../../lineage-m1/src/observer/currentZoneBins.js";
export {
  assertFixtureConsistency,
  hydrateDefiningFixtureV1,
  applyWebbingOverride,
} from "../../lineage-m1/src/fixtures/definingFixtureV1.js";

/** Where the defining fixture lives, relative to game/index.html. */
export const FIXTURE_URL = "../lineage-m1/fixtures/defining_fixture_v1.json";
