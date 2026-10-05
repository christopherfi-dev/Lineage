// @ts-check
/**
 * Classroom mode (scope decision 55): M1's biology with no luck in who survives.
 *
 * A generation runs exactly as M1's advanceGeneration()
 * (lineage-m1/src/core/simulation.js) and with M1's own building blocks for
 * mating, inheritance, mutation, birth and death records and genealogy. Only
 * the survival step and how a baby gets its body traits differ. Survival:
 *
 *  - an animal dies of old age at M1's maximum age, as now;
 *  - every other animal lives in the place where it spends most of its time;
 *  - when more animals live in a place than it has room for, the ones least
 *    suited to it (the lowest fitness there, from PLACE_EFFECTS) don't make it,
 *    until the place is full; between equals, the older makes room;
 *  - nobody else dies, and survival makes no random draw.
 *
 * A baby gets each body trait whole from one parent or the other, never the
 * average (scope decision 67), then M1's usual chance of a new variation. Mates
 * are still found by M1's draw, and time is inherited as in M1. Two births differ
 * too (scope decision 70): a baby with a parent that leans toward a place next
 * door may be born living there (leanMove), and a pair has more babies while its
 * place has plenty of room. M1 itself is untouched: lineage-m1 hashes every file
 * it ships, so this mode lives beside it.
 *
 * One parent (inheritance "one-parent", scope decision 100: built and measured,
 * not shipped): no mates at all. Every adult has its babies on its own, as many
 * as half a pair has, and each baby is a copy of it, in all ten body traits and
 * in where it lives, then M1's usual chance of one new difference on one trait.
 * Only the lean move takes a leaning parent's baby next door.
 */

import { formMatingPairs } from "../../lineage-m1/src/core/mating.js";
import { createChild, makeDeathEvent } from "../../lineage-m1/src/core/events.js";
import { pruneGenealogy } from "../../lineage-m1/src/core/genealogy.js";
import { makeEmptyState, makeIndividual } from "../../lineage-m1/src/core/individual.js";
import { createSimRng } from "../../lineage-m1/src/core/rng.js";
import { argmax } from "../../lineage-m1/src/core/math.js";
import { ZONES } from "../../lineage-m1/src/config/zones.js";
import { founderAgeForId } from "../../lineage-m1/src/config/modelConfig.js";
import {
  hydrateDefiningFixtureV1,
  applyWebbingOverride,
} from "../../lineage-m1/src/fixtures/definingFixtureV1.js";
import { classroomConfig, classroomIdentityFor, maximumAgeOf, FOUNDING_GROUP } from "./config.js";
import { ZONE_NEIGHBORS } from "../../lineage-m1/src/config/zones.js";

/** The config handed to M1's createChild once the traits are picked: no body drift, so its parents' average is exact. */
const exact = new WeakMap();
const noDrift = (config) => {
  if (!exact.has(config)) exact.set(config, Object.freeze({ ...config, bodyDriftScale: 0 }));
  return exact.get(config);
};

/**
 * One baby (scope decision 67): each body trait comes whole from one parent or
 * the other, a coin flip per trait in M1's trait order, never the average, so
 * a new trait isn't halved away before it can be passed on. The rest is M1's own
 * createChild, unchanged: both parents are handed to it carrying the picked
 * traits, with no drift, so its average of them is exactly those traits; then
 * M1's body-mutation opportunity, time inherited from both parents, the
 * time-mutation opportunity, and the birth and mutation records.
 * @param {Object} state @param {Object} A @param {Object} B parent A and parent B
 * @param {number} targetGeneration @param {import("../../lineage-m1/src/core/rng.js").Rng} rng @param {Object} config
 */
export function classroomChild(state, A, B, targetGeneration, rng, config = classroomConfig) {
  if (config.inheritance !== "whole-trait") return createChild(state, A, B, targetGeneration, rng, config);
  const picked = new Float64Array(A.bodyGenome.length);
  for (let t = 0; t < picked.length; t++) picked[t] = rng.nextFloat() < 0.5 ? A.bodyGenome[t] : B.bodyGenome[t];
  return createChild(state, { ...A, bodyGenome: picked }, { ...B, bodyGenome: picked }, targetGeneration, rng, noDrift(config));
}

/** The config handed to M1's createChild for a baby of one parent: no body or time drift, and none of M1's movers. */
const copying = new WeakMap();
const copyOf = (config) => {
  if (!copying.has(config)) copying.set(config, Object.freeze({ ...config, bodyDriftScale: 0, allocationDriftScale: 0, allocationMutationProbabilityPerChild: 0 }));
  return copying.get(config);
};

/**
 * One baby of one parent (inheritance "one-parent", scope decision 100): a copy of its parent in all ten body traits
 * and in where it spends its time, then M1's usual chance of one new difference on one trait (bodyMutationOpportunity:
 * bodyMutationProbabilityPerChild, a step of bodyMutationMagnitudeMin to Max). It is M1's own createChild, with the
 * parent handed in as both parents and no drift, so its average of them is exactly the parent; nothing comes from a
 * second animal. Time is passed on exactly: none of M1's movers (allocationMutationProbabilityPerChild), so only the
 * lean move (leanMove, after this) takes a baby of a leaning parent next door.
 * @param {Object} state @param {Object} P the parent @param {number} targetGeneration
 * @param {import("../../lineage-m1/src/core/rng.js").Rng} rng @param {Object} [config]
 */
export function oneParentChild(state, P, targetGeneration, rng, config = classroomConfig) {
  const child = createChild(state, P, P, targetGeneration, rng, copyOf(config));
  // Exactly the parent's time, with no rounding from M1's renormalizing (its mutation record, if any, keeps it too).
  child.timeAllocation = Float64Array.from(P.timeAllocation);
  const last = state.bodyMutationEvents[state.bodyMutationEvents.length - 1];
  if (last && last.childId === child.id) last.childTimeAllocationAtBirth = Array.from(child.timeAllocation);
  return child;
}

/**
 * How many babies an adult has on its own (inheritance "one-parent", scope decision 100): half a pair's, so the
 * babies per animal are as before: 1, and 2 while its place has plenty of room (babiesPerPair).
 * @param {number} living how many live in its place now @param {number} place @param {Object} [config]
 */
export function babiesPerAnimal(living, place, config = classroomConfig) {
  return babiesPerPair(living, place, config) / 2;
}

/** Where an animal lives: the place it spends most of its time in (ties go to the first, as M1's zone bins). */
export const placeOf = (individual) => argmax(individual.timeAllocation);

/**
 * A baby with a parent that leans toward a place next door to where that
 * parent lives (config.leanAt of its time there or more) is born living there
 * config.leanMoveChance of the time (scope decision 70): it takes 0.8-1.0 of
 * the rest of its time there, as M1's movers do, and so lives there. With both
 * parents leaning, one of their leans, picked evenly (one parent is passed as
 * both: one of its own). Draws only when a parent leans, so a world without
 * leaners draws as before. Changes the baby in place.
 * @param {Object} child just made by classroomChild or oneParentChild @param {Object} A @param {Object} B its parents
 * @param {import("../../lineage-m1/src/core/rng.js").Rng} rng @param {Object} [config]
 * @returns {number} the place it moved to, or -1
 */
export function leanMove(child, A, B, rng, config = classroomConfig) {
  if (!(config.leanMoveChance > 0)) return -1;
  const leans = [];
  for (const P of [A, B]) for (const z of ZONE_NEIGHBORS[placeOf(P)]) if (P.timeAllocation[z] >= config.leanAt) leans.push(z);
  if (!leans.length || !(rng.nextFloat() < config.leanMoveChance)) return -1;
  const z = leans[Math.min(leans.length - 1, Math.floor(rng.nextFloat() * leans.length))];
  const u = config.allocationMutationTransferMin + (config.allocationMutationTransferMax - config.allocationMutationTransferMin) * rng.nextFloat();
  const a = child.timeAllocation, rest = 1 - a[z], out = new Float64Array(a.length);
  for (let k = 0; k < a.length; k++) out[k] = k === z ? a[z] + u * rest : a[k] * (1 - u);
  child.timeAllocation = out;
  return z;
}

/**
 * How many babies a pair has (scope decision 70): M1's offspringPerPair, and
 * config.roomyBirths more while the place the pair lives in (parent A's) holds
 * fewer than config.roomyBelow of the animals it has room for: there is more
 * food. Counted after this generation's deaths, before its births.
 * @param {number} living how many live in the pair's place now @param {number} place
 * @param {Object} [config]
 */
export function babiesPerPair(living, place, config = classroomConfig) {
  const roomy = (config.roomyBirths ?? 0) > 0 && living < (config.roomyBelow ?? 0) * config.zoneCapacity[place];
  return config.offspringPerPair + (roomy ? config.roomyBirths : 0);
}

/**
 * Fewer crowded out (measured for scope decision 97, not used): with config.fewerEvery set to k, every k-th pair (or,
 * with one parent, every k-th parent) in a place without plenty of room, in the order they have babies, has a baby
 * fewer, so a little fewer are crowded out each generation. No draw. Unset, as shipped, nobody has fewer.
 * @param {number} n the brood's babies @param {number} nth this is the nth such brood in its place (from 1)
 * @param {Object} [config] @param {boolean} [full] its place doesn't have plenty of room
 */
export function fewerBabies(n, nth, config = classroomConfig, full = n === config.offspringPerPair) {
  return config.fewerEvery > 0 && full && nth % config.fewerEvery === 0 ? n - 1 : n;
}

/** An adult of M1's breeding ages (its formMatingPairs: 1 to 5 generations old), which has babies this generation. */
export const breeds = (ind) => ind.ageGenerations >= 1 && ind.ageGenerations <= 5;

/**
 * An animal's fitness in each place: each trait times its effect there.
 * @param {ArrayLike<number>} genome
 * @param {Object} [config]
 * @returns {number[]} one value per place
 */
export function placeFitness(genome, config = classroomConfig) {
  const out = ZONES.map(() => 0);
  for (let t = 0; t < genome.length; t++) {
    const row = config.placeEffects[t];
    for (let z = 0; z < out.length; z++) out[z] += genome[t] * row[z];
  }
  return out;
}

/**
 * Who doesn't make it this generation, and why. No random draw.
 *
 * In a full place the least suited go first. Well-suited animals are often
 * exactly equal (traits pile up at 0 and 1), so between equals the older one
 * makes room, then the one that spends less of its time there, and last the
 * one born later.
 * @param {Array<Object>} snapshot the living animals, in ascending id order
 * @param {Object} [config]
 * @returns {Map<number, "maximum_age"|"least_suited">}
 */
export function whoDoesNotMakeIt(snapshot, config = classroomConfig) {
  const maxAge = maximumAgeOf(config);
  const gone = new Map();
  const living = ZONES.map(() => /** @type {Array<Object>} */ ([]));
  for (const ind of snapshot) {
    if (ind.ageGenerations >= maxAge) gone.set(ind.id, "maximum_age");
    else living[placeOf(ind)].push(ind);
  }
  living.forEach((here, z) => {
    const over = here.length - config.zoneCapacity[z];
    if (over <= 0) return;
    const fit = new Map(here.map((ind) => [ind.id, placeFitness(ind.bodyGenome, config)[z]]));
    here.sort((a, b) => fit.get(a.id) - fit.get(b.id) ||
      b.ageGenerations - a.ageGenerations ||
      a.timeAllocation[z] - b.timeAllocation[z] ||
      b.id - a.id);
    for (let k = 0; k < over; k++) gone.set(here[k].id, "least_suited");
  });
  return gone;
}

/**
 * Advance a Classroom world one generation in place, like M1's
 * advanceGeneration() with ranked survival. Returns the same state.
 * @param {Object} state
 * @param {Object} [config]
 */
export function advanceClassroomGeneration(state, config = classroomConfig) {
  assertClassroomState(state, config);
  const targetGeneration = state.generation + 1;
  const rng = state.simRng;

  const snapshot = state.currentIndividuals.slice().sort((a, b) => a.id - b.id);
  const gone = whoDoesNotMakeIt(snapshot, config);
  const survivors = [];
  for (const ind of snapshot) {
    const cause = gone.get(ind.id);
    if (!cause) survivors.push(ind);
    else state.deathEvents.push(makeDeathEvent(targetGeneration, ind, 0, null, cause));
  }
  for (const s of survivors) s.ageGenerations += 1;
  // How many live in each place now: a pair in a place with plenty of room has more babies (scope decision 70).
  const living = ZONES.map(() => 0);
  for (const s of survivors) living[placeOf(s)]++;

  // Who has babies, and how many. Two parents ("whole-trait", "average"): M1's steps 5-10, its mates, babiesPerPair a
  // pair, each body trait whole from one parent or the other (classroomChild). One parent ("one-parent", scope decision
  // 100): every adult of M1's breeding ages has its babies on its own, in id order, half a pair's (babiesPerAnimal):
  // no mate, so no draw for one, and each baby a copy of it (oneParentChild). Then the lean move (scope decision 70).
  const one = config.inheritance === "one-parent";
  const survivorById = new Map(survivors.map((s) => [s.id, s]));
  const broods = one
    ? survivors.filter(breeds).map((P) => ({ A: P, B: P, overlap: 1, n: babiesPerAnimal(living[placeOf(P)], placeOf(P), config) }))
    : formMatingPairs(survivors, config, rng).map((pair) => {
      const A = survivorById.get(pair.parentAId);
      return { A, B: survivorById.get(pair.parentBId), overlap: pair.overlap, n: babiesPerPair(living[placeOf(A)], placeOf(A), config) };
    });
  const newborns = [];
  const birthRecords = [];
  const crowdedPairs = ZONES.map(() => 0);
  for (const brood of broods) {
    const { A, B } = brood;
    const childIds = [];
    let n = brood.n;
    if (n === (one ? config.offspringPerPair / 2 : config.offspringPerPair)) n = fewerBabies(n, ++crowdedPairs[placeOf(A)], config, true);
    for (let k = 0; k < n; k++) {
      const recorded = state.bodyMutationEvents.length;
      const child = one ? oneParentChild(state, A, targetGeneration, rng, config) : classroomChild(state, A, B, targetGeneration, rng, config);
      if (leanMove(child, A, B, rng, config) >= 0) {
        // Its body-mutation record, if any, keeps the time it was born with.
        for (let e = recorded; e < state.bodyMutationEvents.length; e++) {
          if (state.bodyMutationEvents[e].childId === child.id) state.bodyMutationEvents[e].childTimeAllocationAtBirth = Array.from(child.timeAllocation);
        }
      }
      newborns.push(child);
      childIds.push(child.id);
    }
    // A brood of one parent is recorded as M1's mating record is, with that parent on both sides.
    state.biologicalMatingEvents.push({
      id: state.nextMatingEventId++,
      generation: targetGeneration,
      parentAId: A.id,
      parentBId: B.id,
      overlap: brood.overlap,
      childIds,
    });
    for (const id of childIds) {
      birthRecords.push({ childId: id, parentAId: A.id, parentBId: B.id, generation: targetGeneration });
    }
  }
  const next = survivors.concat(newborns);
  next.sort((a, b) => a.id - b.id);
  state.currentIndividuals = next;
  state.generation = targetGeneration;
  pruneGenealogy(state, config);

  state.lastGenerationResult = Object.freeze({
    generation: targetGeneration,
    births: Object.freeze(birthRecords.map((r) => Object.freeze(r))),
    livingIds: Object.freeze(next.map((i) => i.id)),
    observerErrors: Object.freeze([]),
  });
  return state;
}

/**
 * Only a state made in Classroom mode, under this very configuration, may be
 * advanced in Classroom mode. Throws before anything changes.
 */
export function assertClassroomState(state, config = classroomConfig) {
  if (state.configVersion !== config.version || state.modelIdentityHash !== classroomIdentityFor(config)) {
    throw new Error(
      `not a Classroom world for this model: state "${state.configVersion}" ${state.modelIdentityHash}, ` +
      `model "${config.version}" ${classroomIdentityFor(config)}`
    );
  }
}

/**
 * A founder's time (scope decisions 56 and 70): the open ground
 * (config.founderAllocation), except for the leaners. In every FOUNDING_GROUP
 * founders by id (the game's founding families), the 2nd, 4th and 6th lean
 * toward the water's edge and the 3rd, 5th and 7th toward the high leaves
 * (config.founderLeaners of each), spending config.founderLean of their time
 * there and the rest on the ground, where they live.
 * @param {number} id @param {Object} [config]
 * @returns {number[]}
 */
export function founderTimeOf(id, config = classroomConfig) {
  const k = (id - 1) % FOUNDING_GROUP, lean = config.founderLean ?? 0;
  if (k < 1 || k > 2 * (config.founderLeaners ?? 0)) return Array.from(config.founderAllocation);
  return k % 2 === 1 ? [0, 1 - lean, lean] : [lean, 1 - lean, 0];
}

/** A fixed shuffle key for (founder, trait): the order its levels are dealt in, with no draw. */
function lookKey(id, t) {
  let h = Math.imul((id * 73856093) ^ (t * 19349663), 0x9e3779b1) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
}

/**
 * A founder's body (scope decision 72): M1's ancestral body, except for the
 * traits in config.founderVaried. Within its founding family (FOUNDING_GROUP
 * founders by id, the last family taking the rest), the founders are put in an
 * order fixed by (id, trait), and each such trait is config.founderSpread
 * below the ancestral value, as it is, and above it, in turn along that order:
 * a third each, so the family's average is about the ancestors'. No draw.
 * @param {number} id @param {Object} [config]
 * @returns {number[]}
 */
export function founderBodyOf(id, config = classroomConfig) {
  const body = Array.from(config.ancestorBodyGenome), spread = config.founderSpread ?? 0;
  if (!(spread > 0)) return body;
  const n = config.startingPopulation, families = Math.max(1, Math.floor(n / FOUNDING_GROUP));
  const fam = Math.min(Math.floor((id - 1) / FOUNDING_GROUP), families - 1);
  const first = fam * FOUNDING_GROUP + 1, last = fam === families - 1 ? n : first + FOUNDING_GROUP - 1;
  for (const t of config.founderVaried ?? []) {
    const order = [];
    for (let i = first; i <= last; i++) order.push(i);
    order.sort((a, b) => lookKey(a, t) - lookKey(b, t) || a - b);
    const level = order.indexOf(id) % 3; // 0, 1, 2: below, as it is, above
    body[t] = Math.min(1, Math.max(0, body[t] + (level - 1) * spread));
  }
  return body;
}

/**
 * The common-ancestor world: every founder on the open ground with the
 * ancestral body (M1's ancestor genome), each family's looks varied a little
 * (founderBodyOf), M1's founder ages; the high leaves and the water's edge
 * start empty. Some founders of every founding family lean toward each of
 * them (founderTimeOf). Making it draws nothing, so the seed decides only what
 * happens next.
 * @param {number} seed
 * @param {Object} [config]
 */
export function createAncestorWorld(seed, config = classroomConfig) {
  const state = makeEmptyState(createSimRng(seed), config);
  state.modelIdentityHash = classroomIdentityFor(config);
  for (let id = 1; id <= config.startingPopulation; id++) {
    const birthEventId = state.nextBirthEventId++;
    state.currentIndividuals.push(makeIndividual({
      id,
      parentIds: null,
      birthGeneration: 0,
      ageGenerations: founderAgeForId(id, config),
      bodyGenome: founderBodyOf(id, config),
      timeAllocation: founderTimeOf(id, config),
      birthEventId,
    }));
    const birth = { id: birthEventId, generation: 0, childId: id, parentIds: null, founder: true };
    state.birthEvents.push(birth);
    state.retainedGenealogy.push({ ...birth });
    state.nextIndividualId = id + 1;
  }
  return state;
}

/**
 * The teacher demo (?demo=webbed): M1's defining fixture with its webbing
 * override, the webbed family in the high leaves, run in Classroom mode.
 * @param {Object} envelope the parsed defining fixture
 * @param {number} seed
 * @param {Object} [config]
 */
export function createWebbedDemoWorld(envelope, seed, config = classroomConfig) {
  const state = hydrateDefiningFixtureV1(envelope, seed, config);
  applyWebbingOverride(state, envelope.canopyFocalIds, envelope.highWebbing);
  applyWebbingOverride(state, envelope.shorelineFocalIds, envelope.highWebbing);
  state.modelIdentityHash = classroomIdentityFor(config);
  return state;
}
