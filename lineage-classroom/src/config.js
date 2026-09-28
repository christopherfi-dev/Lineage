// @ts-check
/**
 * Classroom mode's configuration (scope decision 55).
 *
 * Built from M1's `currentModelConfig`, which stays exactly as it is. Only the
 * values below differ, and the Classroom-only ones (PLACE_EFFECTS, the founders'
 * home, the inheritance rule) are named at the bottom. M1's survival constants
 * (selection slope, fitness zero, zone weights, scarcity, survival bounds, the
 * age multipliers other than the zero at the maximum age) stay in the object but
 * Classroom mode never reads them: its survival is ranked, not drawn
 * (classroom.js). Nor does it use M1's body drift (`bodyDriftScale`): a baby
 * gets each trait whole from one parent (scope decision 67).
 */

import { currentModelConfig, deepFreeze } from "../../lineage-m1/src/config/modelConfig.js";
import { buildModelDefinition } from "../../lineage-m1/src/config/modelDefinition.js";
import { canonicalModelDefinitionText, modelIdentityDigest } from "../../lineage-m1/src/config/modelIdentity.js";

const HELPS = 1;
const HURTS = -1;
/**
 * A "~" counts for nothing. Ranked survival ignores how big a difference is,
 * only which animal is ahead, so even a tiny effect would decide between
 * otherwise equal animals and be selected like a "✓" in the long run.
 */
const NONE = 0;

/**
 * Each trait's effect in each place, [high leaves, open ground, water's edge],
 * in M1's trait order. Every "✓" and "✗" has the direction of M1's own net
 * effect (zone weights times trait effects, less upkeep), and every "~" is
 * where that net effect is under LITTLE_EFFECT. This is the table in
 * docs/LINEAGE_WHY.md; lineage-classroom/test/classroom.test.js checks it
 * against the engine.
 */
export const PLACE_EFFECTS = deepFreeze([
  [HURTS, NONE, HELPS], //  toe_webbing        M1: -2.53 -0.37  2.88
  [HELPS, NONE, HURTS], //  curved_claws       M1:  2.31  0.17 -1.15
  [NONE, HELPS, HURTS], //  dense_fur          M1:  0.30  0.90 -0.70
  [HELPS, HELPS, HURTS], // long_hindlimbs     M1:  0.93  1.89 -1.07
  [HURTS, HURTS, HELPS], // strong_tail        M1: -0.63 -0.80  1.42
  [NONE, HELPS, HURTS], //  large_eyes         M1:  0.35  1.25 -0.55
  [HURTS, NONE, HELPS], //  streamlined_body   M1: -1.38 -0.34  1.82
  [NONE, NONE, NONE], //    coat_shade         neutral
  [NONE, NONE, NONE], //    ear_tip_shape      neutral
  [NONE, NONE, NONE], //    tail_tip_marking   neutral
]);

/** An M1 net effect smaller than this is a "~" in PLACE_EFFECTS. */
export const LITTLE_EFFECT = 0.4;

export const classroomConfig = deepFreeze({
  ...currentModelConfig,
  version: "lineage-classroom-config-2",

  // The common-ancestor world: every founder on the open ground, one body.
  startingPopulation: 40,

  // More, and more visible, variation: a third of babies are born with one
  // trait changed by 0.15-0.35 (M1: a fifth, 0.12-0.35).
  bodyMutationProbabilityPerChild: 0.3,
  bodyMutationMagnitudeMin: 0.15,
  bodyMutationMagnitudeMax: 0.35,

  // Less mixing between places. Mates share at least half their time
  // (M1: 0.02). Time is inherited only in the parents' own places (where
  // they spend at least half their time) and the places next door, with
  // little drift (M1: 0.05). One baby in twenty moves next door, taking
  // 0.8-1.0 of its time there (M1: one in twelve shifts 0.03-0.12), so a
  // mover keeps at most a little time where it was born.
  minimumMatingOverlap: 0.5,
  parentalUseEpsilon: 0.5,
  allocationDriftScale: 0.02,
  allocationMutationProbabilityPerChild: 0.05,
  allocationMutationTransferMin: 0.8,
  allocationMutationTransferMax: 1.0,

  // Classroom only.
  placeEffects: PLACE_EFFECTS,
  founderAllocation: [0, 1, 0],
  // Each body trait comes whole from one parent or the other, never the average
  // (scope decision 67), so a new trait isn't halved away before it can be
  // passed on. "average" is M1's rule, for comparison.
  inheritance: "whole-trait",
});

/** M1's maximum age: the first age whose survival multiplier is zero. */
export function maximumAgeOf(config) {
  const zero = config.ageSurvivalMultiplier.indexOf(0);
  return zero >= 0 ? zero : config.ageSurvivalMultiplier.length - 1;
}

/**
 * The identity of a Classroom model: M1's complete model definition plus the
 * Classroom-only rules, through M1's own canonical text and digest. A state
 * made in Classroom mode carries it, so M1's advanceGeneration() rejects that
 * state, and Classroom mode rejects an M1 state.
 * @param {Object} config
 * @returns {string}
 */
export function classroomIdentityFor(config) {
  return modelIdentityDigest(canonicalModelDefinitionText({
    ...buildModelDefinition(config),
    classroom: {
      survival: "ranked-in-place",
      maximumAge: maximumAgeOf(config),
      placeEffects: config.placeEffects.map((row) => Array.from(row)),
      founderAllocation: Array.from(config.founderAllocation),
      inheritance: config.inheritance,
    },
  }));
}
