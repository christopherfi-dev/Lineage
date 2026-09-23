/**
 * The only file in the game that reaches into the frozen Milestone 1 engine.
 *
 * Everything is imported, nothing is copied or changed. The debug probe
 * (lineage-m1/src/debug) is a leaf by M1's own dependency rule, so the game
 * imports only config, core and observer.
 */

export { createInitialState } from "../../lineage-m1/src/core/individual.js";
export { advanceGeneration, isExtinct } from "../../lineage-m1/src/core/simulation.js";
export { currentModelConfig } from "../../lineage-m1/src/config/modelConfig.js";
export { TRAITS, TRAIT_INDEX } from "../../lineage-m1/src/config/traits.js";
export { currentZoneBinIndex, zoneBinCounts } from "../../lineage-m1/src/observer/currentZoneBins.js";
export {
  createObserverState,
  createTracerChannel,
  clearUserChannels,
  tracerBirthHook,
  observerAfterGenerationHook,
} from "../../lineage-m1/src/observer/tracerChannels.js";
