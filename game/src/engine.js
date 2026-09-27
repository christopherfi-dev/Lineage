/**
 * The only file in the game that reaches into the engine.
 *
 * The game runs the engine's Classroom mode (lineage-classroom, scope decision
 * 55): M1's biology with ranked survival, the common-ancestor world, and the
 * old defining fixture as a teacher demo. M1 itself is imported, never copied
 * or changed. The debug probe (lineage-m1/src/debug) is a leaf by M1's own
 * dependency rule, so the game imports only config, core, fixtures and observer.
 */

export { isExtinct } from "../../lineage-m1/src/core/simulation.js";
export { TRAITS, TRAIT_INDEX, MEANINGFUL_TRAIT_INDICES, NEUTRAL_TRAIT_INDICES } from "../../lineage-m1/src/config/traits.js";
export { currentZoneBinIndex, zoneBinCounts } from "../../lineage-m1/src/observer/currentZoneBins.js";
export { assertFixtureConsistency } from "../../lineage-m1/src/fixtures/definingFixtureV1.js";
export { classroomConfig, PLACE_EFFECTS } from "../../lineage-classroom/src/config.js";
export {
  advanceClassroomGeneration,
  createAncestorWorld,
  createWebbedDemoWorld,
} from "../../lineage-classroom/src/classroom.js";

/** Where the defining fixture lives, relative to game/index.html: the ?demo=webbed world. */
export const FIXTURE_URL = "../lineage-m1/fixtures/defining_fixture_v1.json";
