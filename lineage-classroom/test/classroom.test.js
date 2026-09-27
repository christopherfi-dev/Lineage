// Classroom mode (scope decision 55): the promises the engine itself makes.
// M1's own suite (lineage-m1/test, 412 tests) is unchanged and still covers M1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { advanceGeneration } from "../../lineage-m1/src/core/simulation.js";
import { createInitialState, makeIndividual } from "../../lineage-m1/src/core/individual.js";
import { currentModelConfig } from "../../lineage-m1/src/config/modelConfig.js";
import { EFFECT, UPKEEP, TRAIT_INDEX, NEUTRAL_TRAIT_INDICES } from "../../lineage-m1/src/config/traits.js";
import { classroomConfig, classroomIdentityFor, PLACE_EFFECTS, LITTLE_EFFECT } from "../src/config.js";
import {
  advanceClassroomGeneration, createAncestorWorld, createWebbedDemoWorld, placeFitness, placeOf, whoDoesNotMakeIt,
} from "../src/classroom.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const LEAVES = 0, GROUND = 1, WATER = 2;

/** A world holding exactly these animals, made in Classroom mode. */
function worldOf(animals, seed = 1) {
  const state = createAncestorWorld(seed);
  state.currentIndividuals = animals.map((a, i) => makeIndividual({
    id: i + 1, parentIds: null, birthGeneration: 0, ageGenerations: a.age ?? 1,
    bodyGenome: a.genome ?? classroomConfig.ancestorBodyGenome, timeAllocation: a.time ?? [0, 1, 0], birthEventId: i + 1,
  }));
  state.nextIndividualId = animals.length + 1;
  state.nextBirthEventId = animals.length + 1;
  return state;
}
const withTrait = (t, v) => { const g = Array.from(classroomConfig.ancestorBodyGenome); g[t] = v; return g; };
const deathsAt = (state, g) => state.deathEvents.filter((e) => e.generation === g);

test("M1 stays as it is: its config is untouched, and neither mode advances the other's world", () => {
  assert.equal(currentModelConfig.version, "lineage-m1-config-2");
  assert.deepEqual(currentModelConfig.zoneCapacity, [55, 55, 55]);
  assert.equal(currentModelConfig.bodyMutationProbabilityPerChild, 0.2);
  const classroom = createAncestorWorld(3);
  assert.throws(() => advanceGeneration(classroom, classroomConfig), /model mismatch/);
  assert.throws(() => advanceGeneration(classroom, currentModelConfig), /configuration mismatch/);
  assert.throws(() => advanceClassroomGeneration(createInitialState(3), classroomConfig), /not a Classroom world/);
  assert.notEqual(classroomIdentityFor(classroomConfig), classroomIdentityFor({ ...classroomConfig, placeEffects: PLACE_EFFECTS.map((r) => r.map((x) => -x)) }));
});

test("no luck in who survives: the same animals meet the same fate whatever the random state", () => {
  const animals = [];
  for (let i = 0; i < 70; i++) animals.push({ genome: withTrait(TRAIT_INDEX.dense_fur, (i * 37) % 100 / 100), age: i % 6 });
  const fates = [11, 12, 13].map((seed) => {
    const state = worldOf(animals, seed);
    advanceClassroomGeneration(state);
    return deathsAt(state, 1).map((e) => `${e.individualId}:${e.cause}`).join(" ");
  });
  assert.equal(fates[0], fates[1]);
  assert.equal(fates[1], fates[2]);
  const state = worldOf(animals, 11);
  advanceClassroomGeneration(state);
  for (const e of deathsAt(state, 1)) assert.equal(e.survivalDraw, null, "survival makes no random draw");
});

test("a full place loses the animals least suited to it, and between equals the older one", () => {
  const cap = classroomConfig.zoneCapacity[GROUND], fur = TRAIT_INDEX.dense_fur;
  const animals = [];
  // Thick fur helps on open ground: the ten thinnest-furred don't make it...
  for (let i = 0; i < 10; i++) animals.push({ genome: withTrait(fur, 0.1 + i / 100), age: 1 });
  // ...and of two equal animals at the cut, the older one makes room.
  animals.push({ genome: withTrait(fur, 0.3), age: 4 }, { genome: withTrait(fur, 0.3), age: 2 });
  for (let i = 0; i < cap - 1; i++) animals.push({ genome: withTrait(fur, 0.5 + i / 200), age: 1 });
  const gone = whoDoesNotMakeIt(worldOf(animals).currentIndividuals);
  assert.deepEqual([...gone.keys()].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.ok([...gone.values()].every((cause) => cause === "least_suited"));
  // Other places lose no one: a water animal here is not crowded out of the ground.
  const mixed = worldOf([...animals, { genome: withTrait(fur, 0), time: [0, 0, 1] }]);
  assert.equal(whoDoesNotMakeIt(mixed.currentIndividuals).has(animals.length + 1), false);
  // Between equals of the same age, the one that spends less of its time here goes first.
  const two = [];
  for (let i = 0; i < cap; i++) two.push({ age: 1 });
  two.push({ age: 1, time: [0.3, 0.7, 0] });
  assert.deepEqual([...whoDoesNotMakeIt(worldOf(two).currentIndividuals).keys()], [cap + 1]);
});

test("with room, only old age: an animal dies at M1's maximum age and not before", () => {
  const state = worldOf([{ age: 5 }, { age: 6 }, { age: 0 }, { age: 3 }]);
  advanceClassroomGeneration(state);
  const deaths = deathsAt(state, 1);
  assert.deepEqual(deaths.map((e) => [e.individualId, e.cause]), [[2, "maximum_age"]]);
  assert.equal(currentModelConfig.ageSurvivalMultiplier[6], 0, "M1's maximum age");
});

test("every trait keeps M1's direction in every place; a '~' is where M1's effect is small", () => {
  const { zoneWeights, zoneScarcity } = currentModelConfig;
  for (let t = 0; t < PLACE_EFFECTS.length; t++) {
    for (let z = 0; z < 3; z++) {
      const net = zoneWeights[z].reduce((s, w, d) => s + w * EFFECT[t][d], 0) - zoneScarcity[z] * UPKEEP[t];
      const e = PLACE_EFFECTS[t][z];
      if (NEUTRAL_TRAIT_INDICES.includes(t)) { assert.equal(e, 0); continue; }
      if (Math.abs(net) < LITTLE_EFFECT) assert.equal(e, 0, `trait ${t} place ${z}: M1 ${net.toFixed(2)} is a "~"`);
      else assert.equal(Math.sign(e), Math.sign(net), `trait ${t} place ${z}: M1 ${net.toFixed(2)}`);
    }
  }
  // Webbed feet: worst in the leaves, best in the water.
  const webbed = placeFitness(withTrait(TRAIT_INDEX.toe_webbing, 1)), plain = placeFitness(withTrait(TRAIT_INDEX.toe_webbing, 0));
  assert.ok(webbed[WATER] - plain[WATER] > 0 && webbed[LEAVES] - plain[LEAVES] < 0 && webbed[GROUND] === plain[GROUND]);
});

test("the common-ancestor world: every founder on the open ground with the same body; leaves and water empty", () => {
  const state = createAncestorWorld(6);
  assert.equal(state.currentIndividuals.length, classroomConfig.startingPopulation);
  for (const ind of state.currentIndividuals) {
    assert.deepEqual(Array.from(ind.bodyGenome), Array.from(currentModelConfig.ancestorBodyGenome));
    assert.equal(placeOf(ind), GROUND);
    assert.deepEqual(Array.from(ind.timeAllocation), [0, 1, 0]);
  }
  // The same seed makes the same world, generation after generation.
  const a = createAncestorWorld(6), b = createAncestorWorld(6);
  for (let g = 0; g < 10; g++) { advanceClassroomGeneration(a); advanceClassroomGeneration(b); }
  assert.deepEqual(a.currentIndividuals.map((i) => [i.id, ...i.bodyGenome]), b.currentIndividuals.map((i) => [i.id, ...i.bodyGenome]));
});

test("less mixing: tree animals' babies get time only in the leaves and on the ground next door", () => {
  const animals = [];
  for (let i = 0; i < 60; i++) animals.push({ age: 1 + (i % 4), time: [1, 0, 0] });
  const state = worldOf(animals, 5);
  advanceClassroomGeneration(state);
  const babies = state.currentIndividuals.filter((i) => i.birthGeneration === 1);
  assert.ok(babies.length >= 40);
  for (const b of babies) assert.equal(b.timeAllocation[WATER], 0, "the water's edge is not next door to the leaves");
  // Most stay tree animals; the few that move go next door, almost all the way.
  const moved = babies.filter((b) => placeOf(b) !== LEAVES);
  assert.ok(moved.length <= babies.length / 4);
  for (const b of moved) assert.ok(b.timeAllocation[GROUND] >= classroomConfig.allocationMutationTransferMin);
  for (const b of babies.filter((x) => placeOf(x) === LEAVES)) assert.ok(b.timeAllocation[LEAVES] > 0.9);
});

test("the teacher demo (?demo=webbed) is M1's defining fixture, run in Classroom mode", () => {
  const envelope = JSON.parse(readFileSync(join(HERE, "..", "..", "lineage-m1", "fixtures", "defining_fixture_v1.json"), "utf8"));
  const state = createWebbedDemoWorld(envelope, 6);
  assert.equal(state.currentIndividuals.length, 120);
  const w = TRAIT_INDEX.toe_webbing;
  for (const id of envelope.canopyFocalIds) assert.equal(state.currentIndividuals.find((i) => i.id === id).bodyGenome[w], envelope.highWebbing);
  advanceClassroomGeneration(state);
  assert.equal(state.generation, 1);
});
