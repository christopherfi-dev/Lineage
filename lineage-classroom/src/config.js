// @ts-check
/**
 * Classroom mode's configuration (scope decision 55).
 *
 * Built from M1's `currentModelConfig`, which stays exactly as it is. Only the
 * values below differ, and the Classroom-only ones (PLACE_EFFECTS, the founders'
 * home, the inheritance rule, and what makes the first choice of a place fill it
 * fast) are named at the bottom. M1's survival constants
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
 * effect (zone weights times trait effects, less upkeep). A "~" is where that
 * net effect is under LITTLE_EFFECT, or a trait the real animals of that place
 * have both ways (FREE_BY_ANIMALS, scope decision 72): it is free there, so
 * the child's follows decide it. This is the table in docs/LINEAGE_WHY.md;
 * lineage-classroom/test/classroom.test.js checks it against the engine.
 */
export const PLACE_EFFECTS = deepFreeze([
  [HURTS, NONE, HELPS], //  toe_webbing        M1: -2.53 -0.37  2.88
  [HELPS, NONE, HURTS], //  curved_claws       M1:  2.31  0.17 -1.15
  [NONE, NONE, NONE], //    dense_fur          M1:  0.30  0.90 -0.70  (free on the ground and at the water's edge)
  [NONE, HELPS, HURTS], //  long_hindlimbs     M1:  0.93  1.89 -1.07  (free in the leaves)
  [NONE, NONE, HELPS], //   strong_tail        M1: -0.63 -0.80  1.42  (free in the leaves and on the ground)
  [NONE, HELPS, NONE], //   large_eyes         M1:  0.35  1.25 -0.55  (free at the water's edge)
  [HURTS, NONE, HELPS], //  streamlined_body   M1: -1.38 -0.34  1.82
  [NONE, NONE, NONE], //    coat_shade         neutral
  [NONE, NONE, NONE], //    ear_tip_shape      neutral
  [NONE, NONE, NONE], //    tail_tip_marking   neutral
]);

/** An M1 net effect smaller than this is a "~" in PLACE_EFFECTS. */
export const LITTLE_EFFECT = 0.4;

/**
 * The "~" that M1 counts as a real help or hurt, freed because the real
 * animals of that place have the trait both ways (scope decision 72): by trait,
 * each place [high leaves, open ground, water's edge] and why. A required trait
 * keeps M1's direction; only these became free.
 */
export const FREE_BY_ANIMALS = deepFreeze({
  dense_fur: {
    1: "Arctic foxes and hares have thick fur; cheetahs, in hot places, have short fur.",
    2: "Otters and beavers have very thick fur; seals have short hair.",
  },
  long_hindlimbs: { 0: "Squirrels leap on long back legs; sloths and koalas climb slowly on short ones." },
  strong_tail: {
    0: "Squirrels balance with long, bushy tails; koalas and sloths have tiny tails.",
    1: "Cheetahs and jerboas balance with long tails; hares have short ones.",
  },
  large_eyes: { 2: "Seals have big eyes for seeing underwater; otters and platypuses have small eyes." },
});

export const classroomConfig = deepFreeze({
  ...currentModelConfig,
  version: "lineage-classroom-config-4",

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
  // passed on. "average" is M1's rule, for comparison. "one-parent" (scope
  // decision 100, built and measured, not shipped): every adult has its babies
  // on its own, each a copy of it but for M1's chance of one new difference.
  inheritance: "whole-trait",

  // The first choice, "Where will your family live?", fills a new place fast
  // (scope decision 70). The ancestors: in every FOUNDING_GROUP founders by id
  // (the game's founding families), founderLeaners lean toward the water's edge
  // and as many toward the high leaves, spending founderLean of their time
  // there; they still live on the open ground. A baby with a parent that leans
  // toward a place next door (leanAt of its time there, or more) is born living
  // there leanMoveChance of the time, with most of its time there, as M1's
  // movers. And while the parents' place holds fewer than roomyBelow of the
  // animals it has room for, a pair has roomyBirths more babies: there is more
  // food. Set founderLeaners, leanMoveChance and roomyBirths to 0 for the world
  // before it.
  founderLeaners: 3,
  founderLean: 0.4,
  leanAt: 0.25,
  leanMoveChance: 0.3,
  roomyBirths: 2,
  roomyBelow: 0.5,

  // The ancestors are one kind of animal, but no two look exactly alike (scope
  // decision 72): in every founding family, each trait in founderVaried is
  // founderSpread below the ancestral body in a third of the founders, as it is
  // in a third, and founderSpread above it in a third, dealt out by id with no
  // draw. They are the traits free everywhere or free on the ground, where the
  // founders live: fur, tail, coat, ear tips and tail tip. So a look the child
  // follows is carried by a part of the family, not by one newborn.
  founderSpread: 0.15,
  founderVaried: [2, 4, 7, 8, 9],
});

/** Founders by id make the game's founding families in groups of this many (game/src/families.js: 13, 13 and 14 of 40). */
export const FOUNDING_GROUP = 13;

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
      founders: { leaners: config.founderLeaners ?? 0, lean: config.founderLean ?? 0 },
      leanMove: { at: config.leanAt ?? 1, chance: config.leanMoveChance ?? 0 },
      roomyBirths: { extra: config.roomyBirths ?? 0, below: config.roomyBelow ?? 0 },
      founderLooks: { spread: config.founderSpread ?? 0, traits: Array.from(config.founderVaried ?? []) },
      // Only when set (measured for scope decision 97, not used), so the shipped model's identity is unchanged.
      ...(config.fewerEvery > 0 ? { fewerBirths: { every: config.fewerEvery } } : {}),
    },
  }));
}
