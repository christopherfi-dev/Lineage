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
 * are still found by M1's draw, and time is inherited as in M1. M1 itself is
 * untouched: lineage-m1 hashes every file it ships, so this mode lives beside it.
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
import { classroomConfig, classroomIdentityFor, maximumAgeOf } from "./config.js";

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

/** Where an animal lives: the place it spends most of its time in (ties go to the first, as M1's zone bins). */
export const placeOf = (individual) => argmax(individual.timeAllocation);

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

  // From here on, M1's steps 5-10, a baby's body traits each whole from one parent (classroomChild).
  const pairs = formMatingPairs(survivors, config, rng);
  const survivorById = new Map(survivors.map((s) => [s.id, s]));
  const newborns = [];
  const birthRecords = [];
  for (const pair of pairs) {
    const A = survivorById.get(pair.parentAId);
    const B = survivorById.get(pair.parentBId);
    const childIds = [];
    for (let k = 0; k < config.offspringPerPair; k++) {
      const child = classroomChild(state, A, B, targetGeneration, rng, config);
      newborns.push(child);
      childIds.push(child.id);
    }
    state.biologicalMatingEvents.push({
      id: state.nextMatingEventId++,
      generation: targetGeneration,
      parentAId: pair.parentAId,
      parentBId: pair.parentBId,
      overlap: pair.overlap,
      childIds,
    });
    for (const id of childIds) {
      birthRecords.push({ childId: id, parentAId: pair.parentAId, parentBId: pair.parentBId, generation: targetGeneration });
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
 * The common-ancestor world: every founder on the open ground with the same
 * ancestral body (M1's ancestor genome, no spread), M1's founder ages; the
 * high leaves and the water's edge start empty. Making it draws nothing, so
 * the seed decides only what happens next.
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
      bodyGenome: config.ancestorBodyGenome,
      timeAllocation: config.founderAllocation,
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
