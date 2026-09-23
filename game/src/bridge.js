/**
 * The bridge: real biology in, game events out.
 *
 * Biology only ever moves through the engine's own advanceGeneration(). The
 * game never touches simRng, never edits an individual, and never decides who
 * is born or dies. After each generation commits, this module reads the
 * engine's records (birth records, death events, mating events, body-mutation
 * events) and hands them to the canvas as plain events.
 *
 * "Your group" is a family — a mother line (families.js). Following is
 * observer state only and cannot change the biology.
 */

import {
  createInitialState,
  advanceGeneration,
  isExtinct,
  currentModelConfig,
  TRAITS,
  currentZoneBinIndex,
  zoneBinCounts,
  assertFixtureConsistency,
  hydrateDefiningFixtureV1,
  applyWebbingOverride,
} from "./engine.js";
import { Families } from "./families.js";

export class Bridge {
  /**
   * @param {Object} state engine biological state at generation 0
   * @param {number[][]} [keepTogether] founder groups that are founding families as-is
   */
  constructor(state, keepTogether = []) {
    this.state = state;
    this.index();
    this.families = new Families(
      state.currentIndividuals.map((i) => ({ id: i.id, zone: currentZoneBinIndex(i) })),
      keepTogether,
    );
    /** @type {null|{roots:Array<number|string>, members:Set<number>}} */
    this.follow = null;
  }

  /**
   * The defining-experiment world: M1's fixture with its webbing override, so
   * the same webbed feet start in a canopy group and in a shoreline group.
   * Each of those two groups is a founding family.
   */
  static fromFixture(envelope, seed) {
    assertFixtureConsistency(envelope);
    const state = hydrateDefiningFixtureV1(envelope, seed, currentModelConfig);
    applyWebbingOverride(state, envelope.canopyFocalIds, envelope.highWebbing);
    applyWebbingOverride(state, envelope.shorelineFocalIds, envelope.highWebbing);
    return new Bridge(state, [envelope.canopyFocalIds, envelope.shorelineFocalIds]);
  }

  /** The engine's random starting world. */
  static fromRandom(seed) {
    return new Bridge(createInitialState(seed, currentModelConfig));
  }

  index() {
    this.byId = new Map(this.state.currentIndividuals.map((i) => [i.id, i]));
  }

  get generation() { return this.state.generation; }
  get living() { return this.state.currentIndividuals; }
  get extinct() { return isExtinct(this.state); }
  livingIds() { return this.state.currentIndividuals.map((i) => i.id); }

  /** @param {number} id */
  get(id) { return this.byId.get(id) ?? null; }

  /** Engine zone index (0 canopy, 1 forest floor, 2 shoreline) from habitat use. */
  zoneOf(id) {
    const ind = this.byId.get(id);
    return ind ? currentZoneBinIndex(ind) : -1;
  }

  zoneCounts() { return zoneBinCounts(this.state.currentIndividuals); }

  /* ================= following (observer state only) ================= */

  /** Follow the family of this animal's ancestor FAMILY_DEPTH generations back. */
  followFamilyOf(id) { return this.followLinesOf([this.families.ancestor(id)]); }

  /** Follow these animals' mother lines: each of them and her descendants through the mother line. */
  followLinesOf(roots) {
    const living = this.livingIds(), members = new Set();
    for (const root of roots) for (const id of this.families.members(root, living)) members.add(id);
    this.follow = { roots: [...roots], members };
    return this.follow;
  }

  isFollowed(id) { return !!this.follow && this.follow.members.has(id); }
  followedIds() { return this.follow ? [...this.follow.members] : []; }

  /** Your family's living members with their body genomes. */
  followedAnimals() {
    return this.followedIds().map((id) => ({ id, genome: this.byId.get(id).bodyGenome }));
  }

  /** Size of the family a tap on this animal would follow. */
  familySizeOf(id) { return this.families.members(this.families.ancestor(id), this.livingIds()).size; }

  /* ================= one generation ================= */

  /**
   * Run exactly one engine generation and report what the engine recorded.
   * @returns {null|GenerationEvents} null when the whole world is extinct
   */
  step() {
    if (isExtinct(this.state)) return null;
    advanceGeneration(this.state, currentModelConfig);
    this.index();

    const result = this.state.lastGenerationResult;
    const g = result.generation;
    const births = result.births.map((b) => ({ childId: b.childId, parentAId: b.parentAId, parentBId: b.parentBId }));
    const deaths = this.state.deathEvents
      .filter((e) => e.generation === g)
      .map((e) => ({ id: e.individualId, cause: e.cause }));
    const mutations = this.state.bodyMutationEvents
      .filter((e) => e.generation === g)
      .map((e) => ({
        childId: e.childId,
        trait: TRAITS[e.traitId],
        before: e.preMutationValue,
        after: e.postMutationValue,
        delta: e.requestedDelta,
      }));

    // Every baby joins its mother's family: the first parent in its birth record.
    for (const b of births) this.families.addBirth(b.childId, b.parentAId, g);
    if (g % 50 === 0) this.families.prune(result.livingIds, g);

    return {
      generation: g,
      births,
      deaths,
      mutations,
      family: this.updateFamily(births, deaths, mutations, g),
      observerErrors: result.observerErrors,
    };
  }

  updateFamily(births, deaths, mutations, g) {
    const f = this.follow;
    if (!f) return null;
    const before = f.members.size;
    // A mother is always a survivor of this generation, so she is still a member here.
    const born = births.filter((b) => f.members.has(b.parentAId)).map((b) => b.childId);
    const gone = deaths.filter((d) => f.members.has(d.id)).map((d) => d.id);
    for (const id of born) f.members.add(id);
    for (const id of gone) f.members.delete(id);
    const byZone = [0, 0, 0];
    for (const id of f.members) byZone[this.zoneOf(id)]++;
    const last = f.members.size === 1 ? [...f.members][0] : null;
    return {
      count: f.members.size,
      before,
      born,
      gone,
      mutated: mutations.filter((m) => f.members.has(m.childId)),
      byZone,
      lastCouldNotMate: last !== null && this.foundNoMate(last, g),
    };
  }

  /** True when this animal survived the generation, was old enough to mate, and found no mate. */
  foundNoMate(id, g) {
    const ind = this.byId.get(id);
    if (!ind || ind.birthGeneration === g || ind.ageGenerations < 1 || ind.ageGenerations > 5) return false;
    return !this.state.biologicalMatingEvents.some((e) => e.generation === g && (e.parentAId === id || e.parentBId === id));
  }
}

/**
 * @typedef {Object} GenerationEvents
 * @property {number} generation
 * @property {Array<{childId:number, parentAId:number, parentBId:number}>} births engine birth records
 * @property {Array<{id:number, cause:string}>} deaths engine death events
 * @property {Array<{childId:number, trait:string, before:number, after:number, delta:number}>} mutations engine body-mutation events
 * @property {null|FamilyEvents} family what happened to your family (null when you have none)
 * @property {ReadonlyArray<Object>} observerErrors
 *
 * @typedef {Object} FamilyEvents
 * @property {number} count members alive now
 * @property {number} before members alive last generation
 * @property {number[]} born @property {number[]} gone
 * @property {Array<Object>} mutated this generation's mutations in your family
 * @property {number[]} byZone members by engine zone
 * @property {boolean} lastCouldNotMate one member left, and she found no mate this generation
 */
