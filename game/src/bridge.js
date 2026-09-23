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
    /** @type {null|Group} */
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
  followFamilyOf(id) { return this.startFollowing(this.families.ancestor(id), false); }

  /** Narrow to her own line: her and her descendants through the mother line. */
  followBranchOf(id) { return this.startFollowing(id, true); }

  startFollowing(root, branch) {
    this.follow = {
      root,
      members: this.families.members(root, this.livingIds()),
      since: this.state.generation,
      branch,
      parent: branch ? this.follow : null,
    };
    return this.follow;
  }

  stopFollowing() { this.follow = null; }

  /**
   * After your branch has ended, go back to the nearest group it narrowed
   * from that is still alive. Returns it, or null when the whole original
   * family is gone too.
   */
  returnFromBranch() {
    let group = this.follow ? this.follow.parent : null;
    while (group && group.members.size === 0) group = group.parent;
    this.follow = group;
    return group;
  }

  isFollowed(id) { return !!this.follow && this.follow.members.has(id); }
  followedIds() { return this.follow ? [...this.follow.members] : []; }

  /** Size of the family a tap on this animal would follow. */
  familySizeOf(id) { return this.families.members(this.families.ancestor(id), this.livingIds()).size; }

  /** Size of her own line. */
  branchSizeOf(id) { return this.families.members(id, this.livingIds()).size; }

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
    // Your group and every family it narrowed from keep their own members,
    // so a branch that ends can hand the child back to where it came from.
    for (let group = f; group; group = group.parent) {
      for (const b of births) if (group.members.has(b.parentAId)) group.members.add(b.childId);
      for (const d of deaths) group.members.delete(d.id);
    }
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
      lasted: g - f.since,
      branch: f.branch,
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
 * @property {number} lasted generations since you started following this group
 * @property {boolean} branch this group came from "Follow just her branch"
 *
 * @typedef {Object} Group the group you follow
 * @property {number|string} root the ancestor (or founding family) at the top of its line
 * @property {Set<number>} members its living members
 * @property {number} since generation you started following it
 * @property {boolean} branch started with "Follow just her branch"
 * @property {null|Group} parent the group a branch narrowed from
 */
