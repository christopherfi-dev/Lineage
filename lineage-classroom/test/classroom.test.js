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
import { EFFECT, UPKEEP, TRAITS, TRAIT_INDEX, NEUTRAL_TRAIT_INDICES } from "../../lineage-m1/src/config/traits.js";
import { classroomConfig, classroomIdentityFor, PLACE_EFFECTS, LITTLE_EFFECT, FREE_BY_ANIMALS } from "../src/config.js";
import {
  advanceClassroomGeneration, createAncestorWorld, createWebbedDemoWorld, placeFitness, placeOf, whoDoesNotMakeIt, babiesPerPair, fewerBabies,
  babiesPerAnimal,
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
  assert.notEqual(classroomIdentityFor(classroomConfig), classroomIdentityFor({ ...classroomConfig, inheritance: "average" }));
});

/** A world of these animals under this config (its identity must match the config it is advanced with). */
function worldUnder(config, animals, seed = 1) {
  const state = createAncestorWorld(seed, config);
  state.currentIndividuals = animals.map((a, i) => makeIndividual({
    id: i + 1, parentIds: null, birthGeneration: 0, ageGenerations: 1, bodyGenome: a.genome, timeAllocation: [0, 1, 0], birthEventId: i + 1,
  }));
  state.nextIndividualId = animals.length + 1;
  state.nextBirthEventId = animals.length + 1;
  return state;
}

test("a baby gets each trait whole from one parent or the other, never the average", () => {
  assert.equal(classroomConfig.inheritance, "whole-trait");
  const still = { ...classroomConfig, bodyMutationProbabilityPerChild: 0 };
  // Every animal has its own value in every trait, so each baby's trait shows exactly whose it is.
  const animals = [];
  for (let i = 0; i < 40; i++) animals.push({ genome: Array.from({ length: 10 }, (_, t) => (i * 10 + t + 1) / 1000) });
  const state = worldUnder(still, animals, 4);
  advanceClassroomGeneration(state, still);
  const byId = new Map(animals.map((a, i) => [i + 1, a.genome]));
  const births = state.lastGenerationResult.births;
  assert.ok(births.length >= 30);
  let fromA = 0, all = 0;
  for (const b of births) {
    const baby = state.currentIndividuals.find((i) => i.id === b.childId).bodyGenome, A = byId.get(b.parentAId), B = byId.get(b.parentBId);
    for (let t = 0; t < 10; t++) {
      assert.ok(baby[t] === A[t] || baby[t] === B[t], `trait ${t}: ${baby[t]} is neither parent's (${A[t]}, ${B[t]})`);
      fromA += baby[t] === A[t]; all++;
    }
  }
  // About half from each parent.
  assert.ok(fromA / all > 0.4 && fromA / all < 0.6, `${fromA} of ${all} from parent A`);
  // M1's rule, for comparison, averages them.
  const average = { ...still, inheritance: "average", bodyDriftScale: 0 };
  const m1 = worldUnder(average, animals, 4);
  advanceClassroomGeneration(m1, average);
  const b = m1.lastGenerationResult.births[0], baby = m1.currentIndividuals.find((i) => i.id === b.childId).bodyGenome;
  assert.equal(baby[3], (byId.get(b.parentAId)[3] + byId.get(b.parentBId)[3]) / 2);
});

test("a new trait is passed on whole: about half the babies of a mother with it have it all", () => {
  const still = { ...classroomConfig, bodyMutationProbabilityPerChild: 0 };
  const eyes = TRAIT_INDEX.large_eyes, plain = Array.from(classroomConfig.ancestorBodyGenome);
  const big = plain.slice(); big[eyes] = Math.min(1, plain[eyes] + 0.3);
  // Ten animals with bigger eyes among forty without.
  const animals = [];
  for (let i = 0; i < 50; i++) animals.push({ genome: i < 10 ? big : plain });
  const state = worldUnder(still, animals, 9);
  advanceClassroomGeneration(state, still);
  const theirs = state.lastGenerationResult.births.filter((b) => b.parentAId <= 10 || b.parentBId <= 10);
  const babies = theirs.map((b) => state.currentIndividuals.find((i) => i.id === b.childId).bodyGenome[eyes]);
  assert.ok(babies.length >= 10);
  for (const v of babies) assert.ok(v === big[eyes] || v === plain[eyes], "whole, never halved");
  const withIt = babies.filter((v) => v === big[eyes]).length;
  assert.ok(withIt >= babies.length * 0.3 && withIt <= babies.length * 0.8, `${withIt} of ${babies.length} have it`);
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
  const cap = classroomConfig.zoneCapacity[GROUND], legs = TRAIT_INDEX.long_hindlimbs;
  const animals = [];
  // Long back legs help on open ground: the ten shortest-legged don't make it...
  for (let i = 0; i < 10; i++) animals.push({ genome: withTrait(legs, 0.1 + i / 100), age: 1 });
  // ...and of two equal animals at the cut, the older one makes room.
  animals.push({ genome: withTrait(legs, 0.3), age: 4 }, { genome: withTrait(legs, 0.3), age: 2 });
  for (let i = 0; i < cap - 1; i++) animals.push({ genome: withTrait(legs, 0.5 + i / 200), age: 1 });
  const gone = whoDoesNotMakeIt(worldOf(animals).currentIndividuals);
  assert.deepEqual([...gone.keys()].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.ok([...gone.values()].every((cause) => cause === "least_suited"));
  // Other places lose no one: a water animal here is not crowded out of the ground.
  const mixed = worldOf([...animals, { genome: withTrait(legs, 0), time: [0, 0, 1] }]);
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

test("every trait keeps M1's direction in every place; a '~' is where M1's effect is small, or a trait real animals there have both ways", () => {
  const { zoneWeights, zoneScarcity } = currentModelConfig;
  let freed = 0;
  for (let t = 0; t < PLACE_EFFECTS.length; t++) {
    for (let z = 0; z < 3; z++) {
      const net = zoneWeights[z].reduce((s, w, d) => s + w * EFFECT[t][d], 0) - zoneScarcity[z] * UPKEEP[t];
      const e = PLACE_EFFECTS[t][z], reason = FREE_BY_ANIMALS[TRAITS[t]]?.[z];
      if (NEUTRAL_TRAIT_INDICES.includes(t)) { assert.equal(e, 0); continue; }
      if (reason) { assert.equal(e, 0, `trait ${t} place ${z} is free: ${reason}`); assert.ok(Math.abs(net) >= LITTLE_EFFECT); freed++; continue; }
      if (Math.abs(net) < LITTLE_EFFECT) assert.equal(e, 0, `trait ${t} place ${z}: M1 ${net.toFixed(2)} is a "~"`);
      else assert.equal(Math.sign(e), Math.sign(net), `trait ${t} place ${z}: M1 ${net.toFixed(2)}`);
    }
  }
  // Scope decision 72 freed six: fur on the ground and at the water's edge, long back legs in the leaves, a strong tail in
  // the leaves and on the ground, big eyes at the water's edge. Each place keeps traits that every line there needs.
  assert.equal(freed, 6);
  for (let z = 0; z < 3; z++) assert.ok(PLACE_EFFECTS.filter((row) => row[z] !== 0).length >= 2);
  // Webbed feet: worst in the leaves, best in the water.
  const webbed = placeFitness(withTrait(TRAIT_INDEX.toe_webbing, 1)), plain = placeFitness(withTrait(TRAIT_INDEX.toe_webbing, 0));
  assert.ok(webbed[WATER] - plain[WATER] > 0 && webbed[LEAVES] - plain[LEAVES] < 0 && webbed[GROUND] === plain[GROUND]);
});

test("the common-ancestor world: every founder on the open ground with the ancestors' body, its looks varied a little in every family; some lean toward the water and some toward the leaves", () => {
  const state = createAncestorWorld(6);
  assert.equal(state.currentIndividuals.length, classroomConfig.startingPopulation);
  const ancestor = Array.from(currentModelConfig.ancestorBodyGenome), s = classroomConfig.founderSpread, varied = classroomConfig.founderVaried;
  for (const ind of state.currentIndividuals) {
    ind.bodyGenome.forEach((x, t) => {
      if (varied.includes(t)) assert.ok([-s, 0, s].some((d) => Math.abs(x - (ancestor[t] + d)) < 1e-12), `founder ${ind.id} trait ${t}`);
      else assert.equal(x, ancestor[t]);
    });
    assert.equal(placeOf(ind), GROUND);
  }
  // Scope decision 72: fur, tail, coat, ear tips and tail tip vary; in each family a third of the founders are below the
  // ancestors, a third as they are and a third above, so the counts differ by one at most. Making the world draws nothing.
  assert.deepEqual(varied, [TRAIT_INDEX.dense_fur, TRAIT_INDEX.strong_tail, ...NEUTRAL_TRAIT_INDICES]);
  for (const [from, to] of [[1, 13], [14, 26], [27, 40]]) {
    const fam = state.currentIndividuals.filter((i) => i.id >= from && i.id <= to);
    for (const t of varied) {
      const n = [-s, 0, s].map((d) => fam.filter((i) => Math.abs(i.bodyGenome[t] - (ancestor[t] + d)) < 1e-12).length);
      assert.ok(Math.max(...n) - Math.min(...n) <= 1, `family ${from}-${to} trait ${t}: ${n}`);
    }
  }
  assert.deepEqual(Array.from(createAncestorWorld(7).currentIndividuals.map((i) => [...i.bodyGenome])), state.currentIndividuals.map((i) => [...i.bodyGenome]));
  // The game's founding families are 13, 13 and 14 founders by id (scope decision 70): 3 of each lean each way.
  const lean = classroomConfig.founderLean;
  for (const [from, to] of [[1, 13], [14, 26], [27, 40]]) {
    const fam = state.currentIndividuals.filter((i) => i.id >= from && i.id <= to).map((i) => Array.from(i.timeAllocation));
    assert.equal(fam.filter((t) => t[WATER] === lean && t[GROUND] === 1 - lean).length, 3);
    assert.equal(fam.filter((t) => t[LEAVES] === lean && t[GROUND] === 1 - lean).length, 3);
    assert.equal(fam.filter((t) => t[GROUND] === 1).length, fam.length - 6);
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

test("a baby with a parent leaning toward a place next door is born living there about 3 times in 10 (scope decision 70)", () => {
  // Water-leaners and plain ground animals: the ground is full enough for two babies a pair.
  const animals = [];
  for (let i = 0; i < 40; i++) animals.push({ age: 1 + (i % 4), time: i < 20 ? [0, 1 - classroomConfig.founderLean, classroomConfig.founderLean] : [0, 1, 0] });
  let theirs = 0, moved = 0, others = 0, othersMoved = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const state = worldOf(animals, seed);
    advanceClassroomGeneration(state);
    for (const b of state.lastGenerationResult.births) {
      const baby = state.currentIndividuals.find((i) => i.id === b.childId);
      if (b.parentAId <= 20 || b.parentBId <= 20) {
        theirs++;
        if (placeOf(baby) === WATER) { moved++; assert.ok(baby.timeAllocation[WATER] >= classroomConfig.allocationMutationTransferMin); }
        assert.equal(baby.timeAllocation[LEAVES] > 0.5, false, "a water-leaner's baby never moves to the leaves by its lean");
      } else { others++; if (placeOf(baby) !== GROUND) othersMoved++; }
    }
  }
  assert.ok(theirs >= 60);
  assert.ok(moved / theirs > 0.2 && moved / theirs < 0.45, `${moved} of ${theirs} moved to the water`);
  // Babies of two plain ground parents move only as M1's movers do, one in twenty.
  assert.ok(othersMoved / others < 0.12, `${othersMoved} of ${others}`);
});

test("a pair in a place with plenty of room has two more babies: there's more food (scope decision 70)", () => {
  const cap = classroomConfig.zoneCapacity[WATER];
  assert.equal(babiesPerPair(0, WATER), classroomConfig.offspringPerPair + classroomConfig.roomyBirths);
  assert.equal(babiesPerPair(Math.ceil(cap * classroomConfig.roomyBelow), WATER), classroomConfig.offspringPerPair);
  // Ten water animals in an empty place: four babies a pair; fifty on the ground next to them: two.
  const animals = [];
  for (let i = 0; i < 10; i++) animals.push({ age: 2, time: [0, 0, 1] });
  for (let i = 0; i < 50; i++) animals.push({ age: 2, time: [0, 1, 0] });
  const state = worldOf(animals, 7);
  advanceClassroomGeneration(state);
  const perPair = new Map();
  for (const b of state.lastGenerationResult.births) perPair.set(`${b.parentAId}:${b.parentBId}`, (perPair.get(`${b.parentAId}:${b.parentBId}`) ?? 0) + 1);
  for (const [pair, n] of perPair) {
    const water = Number(pair.split(":")[0]) <= 10;
    assert.equal(n, water ? 4 : 2, pair);
  }
  // Without it, as before: two.
  const before = { ...classroomConfig, roomyBirths: 0 };
  assert.equal(babiesPerPair(0, WATER, before), 2);
});

test("fewer crowded out (measured for scope decision 97, not used): unset, every pair as before and the model the same", () => {
  // As shipped: no pair has a baby fewer, and the model's identity is the one it had.
  for (let nth = 1; nth <= 12; nth++) assert.equal(fewerBabies(2, nth), 2);
  assert.equal(classroomConfig.fewerEvery, undefined);
  // Measured: every k-th pair in a full place has a baby fewer, a pair with plenty of room never; another model.
  const fewer = { ...classroomConfig, fewerEvery: 4 };
  assert.deepEqual([1, 2, 3, 4, 5, 8].map((nth) => fewerBabies(2, nth, fewer)), [2, 2, 2, 1, 2, 1]);
  assert.equal(fewerBabies(4, 4, fewer), 4);
  assert.notEqual(classroomIdentityFor(fewer), classroomIdentityFor(classroomConfig));
  // In a full place, a quarter of the pairs have one baby: fewer babies than two a pair.
  const animals = [];
  for (let i = 0; i < 60; i++) animals.push({ age: 2, time: [0, 1, 0] });
  const state = worldOf(animals, 7), crowded = createAncestorWorld(7, fewer);
  crowded.currentIndividuals = state.currentIndividuals.map((i) => ({ ...i, bodyGenome: Float64Array.from(i.bodyGenome), timeAllocation: Float64Array.from(i.timeAllocation) }));
  crowded.nextIndividualId = state.nextIndividualId;
  crowded.nextBirthEventId = state.nextBirthEventId;
  advanceClassroomGeneration(state);
  advanceClassroomGeneration(crowded, fewer);
  const pairs = (s) => new Set(s.lastGenerationResult.births.map((b) => `${b.parentAId}:${b.parentBId}`)).size;
  assert.equal(state.lastGenerationResult.births.length, 2 * pairs(state));
  assert.equal(crowded.lastGenerationResult.births.length, 2 * pairs(crowded) - Math.floor(pairs(crowded) / 4));
});

test("one parent (built for scope decision 100, not shipped): each baby a copy of its parent, but for at most one new difference", () => {
  // As shipped: two parents, each trait whole from one of them. One parent is another model.
  assert.equal(classroomConfig.inheritance, "whole-trait");
  const one = { ...classroomConfig, inheritance: "one-parent" };
  assert.notEqual(classroomIdentityFor(one), classroomIdentityFor(classroomConfig));
  assert.equal(babiesPerAnimal(0, WATER, one), (classroomConfig.offspringPerPair + classroomConfig.roomyBirths) / 2);
  // Forty on the ground (full enough: one baby each), the first twenty leaning toward the water; ten at the water's
  // edge (plenty of room: two each). Every animal looks different.
  const animals = [];
  for (let i = 0; i < 50; i++) {
    animals.push({ age: 1 + (i % 4), time: i < 20 ? [0, 0.6, 0.4] : i < 40 ? [0, 1, 0] : [0, 0, 1],
      genome: TRAITS.map((_, t) => ((i * 7 + t * 3) % 11) / 10) });
  }
  let babies = 0, changed = 0, moved = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const state = createAncestorWorld(seed, one);
    state.currentIndividuals = animals.map((a, i) => makeIndividual({
      id: i + 1, parentIds: null, birthGeneration: 0, ageGenerations: a.age, bodyGenome: a.genome, timeAllocation: a.time, birthEventId: i + 1,
    }));
    state.nextIndividualId = animals.length + 1;
    state.nextBirthEventId = animals.length + 1;
    advanceClassroomGeneration(state, one);
    const count = new Map();
    for (const b of state.lastGenerationResult.births) {
      assert.equal(b.parentAId, b.parentBId, "one parent, no mate");
      count.set(b.parentAId, (count.get(b.parentAId) ?? 0) + 1);
      const baby = state.currentIndividuals.find((i) => i.id === b.childId), P = animals[b.parentAId - 1];
      // Every trait, the neutral ones too, is the parent's, but for at most one new difference of one step.
      const diffs = TRAITS.map((_, t) => Math.abs(baby.bodyGenome[t] - P.genome[t])).filter((d) => d > 0);
      assert.ok(diffs.length <= 1, `baby ${b.childId}: ${diffs.length} differences`);
      if (diffs.length) { changed++; assert.ok(diffs[0] <= one.bodyMutationMagnitudeMax + 1e-12); }
      // Where it lives is its parent's, exactly; only a leaning parent's baby is sometimes born next door.
      if (Array.from(baby.timeAllocation).some((x, z) => x !== P.time[z])) {
        moved++;
        assert.equal(P.time[WATER], 0.4, "only a leaning parent's baby is born next door");
        assert.equal(placeOf(baby), WATER);
      }
      babies++;
    }
    // Every adult has its babies on its own: one each on the full ground, two each at the roomy water's edge.
    for (let id = 1; id <= animals.length; id++) assert.equal(count.get(id), id <= 40 ? 1 : 2, `animal ${id}`);
  }
  assert.equal(babies, 5 * 60);
  // About 3 in 10 are born with one new difference; about 3 in 10 of the leaners' babies are born next door.
  assert.ok(changed / babies > 0.2 && changed / babies < 0.4, `${changed} of ${babies} with a new difference`);
  assert.ok(moved >= 15 && moved <= 45, `${moved} of 100 leaners' babies born at the water's edge`);
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
