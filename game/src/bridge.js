/**
 * The bridge: real biology in, game events out.
 *
 * Biology only ever moves through the engine's own generation step, in its
 * Classroom mode (scope decision 55). The game never touches simRng, never
 * edits an individual, and never decides who is born or dies. After each
 * generation commits, this module reads the engine's records (birth records,
 * death events, mating events, body-mutation events) and hands them to the
 * canvas as plain events.
 *
 * The child follows a family (families.js) for the whole story: a follow
 * never moves it (scope decision 59). A follow starts a fair test inside it:
 * two groups tracked beside the family, the animals with the chosen
 * variation and their twins without it (cohorts.js). The family and both
 * groups grow by babies whose mother is in them and shrink by deaths. A
 * pair's two babies have one mother each: the first joins parent A's family,
 * the second parent B's (scope decision 58). Following is observer state only
 * and cannot change the biology.
 */

import {
  advanceClassroomGeneration,
  createAncestorWorld,
  createWebbedDemoWorld,
  classroomConfig,
  isExtinct,
  TRAITS,
  currentZoneBinIndex,
  zoneBinCounts,
  assertFixtureConsistency,
} from "./engine.js";
import { Families } from "./families.js";
import { APART } from "./variations.js";

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
    /** @type {null|{roots?:Array<number|string>, members:Set<number>}} the child's family, for the whole story */
    this.follow = null;
    /** @type {null|{mine:Set<number>, theirs:Set<number>}} the latest fair test: yours with the variation, and the twins without */
    this.test = null;
    /** @type {Map<number, {trait:string, up:boolean}>} each living animal's trait that is new at birth */
    this.newAtBirth = new Map();
  }

  /**
   * The teacher demo (?demo=webbed): M1's defining fixture with its webbing
   * override, so the same webbed feet start in a canopy group and in a
   * shoreline group. Each of those two groups is a founding family.
   */
  static fromFixture(envelope, seed) {
    assertFixtureConsistency(envelope);
    const state = createWebbedDemoWorld(envelope, seed, classroomConfig);
    return new Bridge(state, [envelope.canopyFocalIds, envelope.shorelineFocalIds]);
  }

  /** The common-ancestor world: every founder on the open ground with one body; the leaves and the water start empty. */
  static fromAncestor(seed) {
    return new Bridge(createAncestorWorld(seed, classroomConfig));
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

  /** The top of the family a tap on this animal follows (families.js): FAMILY_DEPTH generations back, or up to FAMILY_MIN living. */
  familyTopOf(id) { return this.families.top(id, this.families.lineCounts(this.livingIds())); }

  /** Follow the family a tap on this animal follows. */
  followFamilyOf(id) { return this.followLinesOf([this.familyTopOf(id)]); }

  /** Follow these animals' mother lines: each of them and her descendants through the mother line. */
  followLinesOf(roots) {
    const living = this.livingIds(), members = new Set();
    for (const root of roots) for (const id of this.families.members(root, living)) members.add(id);
    this.follow = { roots: [...roots], members };
    return this.follow;
  }

  /**
   * A fair test inside the family: two groups tracked beside it. Both keep
   * their babies (by mother) and lose their dead, like a family. The family
   * itself stays as it is.
   * @param {number[]} mine yours with the variation @param {number[]} theirs their twins without it
   */
  startTest(mine, theirs) {
    this.test = { mine: new Set(mine), theirs: new Set(theirs) };
    return this.test;
  }

  /** In the child's family. */
  isFollowed(id) { return !!this.follow && this.follow.members.has(id); }
  followedIds() { return this.follow ? [...this.follow.members] : []; }
  /** In the fair test's group with the variation ("yours with …"). */
  isMine(id) { return !!this.test && this.test.mine.has(id); }
  mineIds() { return this.test ? [...this.test.mine] : []; }
  /** In the fair test's group without it. */
  isOther(id) { return !!this.test && this.test.theirs.has(id); }
  otherIds() { return this.test ? [...this.test.theirs] : []; }

  /** The family's living members with their body genomes and habitats. */
  followedAnimals() {
    return this.followedIds().map((id) => this.animal(id));
  }

  /** Every living animal with its body genome and habitat. */
  livingAnimals() { return this.livingIds().map((id) => this.animal(id)); }

  animal(id) {
    const ind = this.byId.get(id);
    return { id, genome: ind.bodyGenome, zone: currentZoneBinIndex(ind) };
  }

  /**
   * The trait that is new in this animal compared with its parents: a body
   * mutation at birth (engine record), or null. Founders have none.
   * @returns {null|{trait:string, up:boolean}}
   */
  newTraitOf(id) { return this.newAtBirth.get(id) ?? null; }

  /* ================= one generation ================= */

  /**
   * Run exactly one engine generation and report what the engine recorded.
   * @returns {null|GenerationEvents} null when the whole world is extinct
   */
  step() {
    if (isExtinct(this.state)) return null;
    advanceClassroomGeneration(this.state, classroomConfig);
    this.index();

    const result = this.state.lastGenerationResult;
    const g = result.generation;
    // A pair's babies come one after another; the first joins parent A's family, the second parent B's.
    const nth = new Map();
    const births = result.births.map((b) => {
      const pair = `${b.parentAId}:${b.parentBId}`, k = nth.get(pair) ?? 0;
      nth.set(pair, k + 1);
      return { childId: b.childId, parentAId: b.parentAId, parentBId: b.parentBId, motherId: k % 2 ? b.parentBId : b.parentAId };
    });
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

    // Every baby joins its mother's family.
    for (const b of births) this.families.addBirth(b.childId, b.motherId, g);
    if (g % 50 === 0) this.families.prune(result.livingIds, g);
    // What a baby did not get from its parents: a body mutation at birth, when it
    // changed the trait by at least APART (the smallest difference the game shows).
    for (const m of mutations) {
      if (Math.abs(m.after - m.before) >= APART) this.newAtBirth.set(m.childId, { trait: m.trait, up: m.after > m.before });
    }
    if (g % 10 === 0) for (const id of this.newAtBirth.keys()) if (!this.byId.has(id)) this.newAtBirth.delete(id);

    // The fair test's two groups change the same way as the family.
    let test = null;
    if (this.test) {
      const grow = (set) => {
        const before = set.size;
        for (const b of births) if (set.has(b.motherId)) set.add(b.childId);
        for (const d of deaths) set.delete(d.id);
        return { count: set.size, before };
      };
      test = { mine: grow(this.test.mine), theirs: grow(this.test.theirs) };
    }
    return {
      generation: g,
      births,
      deaths,
      mutations,
      group: this.updateGroup(births, deaths, mutations, g),
      test,
      observerErrors: result.observerErrors,
    };
  }

  updateGroup(births, deaths, mutations, g) {
    const f = this.follow;
    if (!f) return null;
    const before = f.members.size;
    // A family or a cohort grows through its mothers: a mother is always a
    // survivor of this generation, so she is still a member here.
    const born = births.filter((b) => f.members.has(b.motherId)).map((b) => b.childId);
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
 * @property {Array<{childId:number, parentAId:number, parentBId:number, motherId:number}>} births engine birth
 *   records, with the parent whose family each baby joins
 * @property {Array<{id:number, cause:string}>} deaths engine death events
 * @property {Array<{childId:number, trait:string, before:number, after:number, delta:number}>} mutations engine body-mutation events
 * @property {null|GroupEvents} group what happened to the child's family (null when there is none)
 * @property {null|{mine:{count:number, before:number}, theirs:{count:number, before:number}}} test the fair test's
 *   two groups (null before a follow)
 * @property {ReadonlyArray<Object>} observerErrors
 *
 * @typedef {Object} GroupEvents
 * @property {number} count members alive now
 * @property {number} before members alive last generation
 * @property {number[]} born @property {number[]} gone
 * @property {Array<Object>} mutated this generation's mutations in your group
 * @property {number[]} byZone members by engine zone
 * @property {boolean} lastCouldNotMate one member left, and she found no mate this generation
 */
