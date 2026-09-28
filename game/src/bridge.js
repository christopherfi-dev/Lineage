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
 * The child follows a family (families.js), then a line (scope decisions 66
 * to 68): each follow narrows the line to its animals with the chosen
 * variation in its place, and from then on a baby joins the line when a
 * parent is in it and it inherited that variation (the latest one only). The
 * rest of the old line in its place, and the line's babies that didn't
 * inherit it, are the child's relatives, each marked with the follow that made
 * them relatives, so a line that dies out can give the previous line back.
 * The family grows by babies whose mother is in it (a pair's two babies have
 * one mother each: the first joins parent A's family, the second parent B's,
 * scope decision 58). Following is observer state only and cannot change the
 * biology.
 */

import {
  advanceClassroomGeneration,
  babiesPerPair,
  createAncestorWorld,
  createWebbedDemoWorld,
  classroomConfig,
  isExtinct,
  whoDoesNotMakeIt,
  TRAITS,
  currentZoneBinIndex,
  zoneBinCounts,
  assertFixtureConsistency,
} from "./engine.js";
import { Families } from "./families.js";
import { APART, carries } from "./variations.js";

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
    /**
     * @type {null|{roots?:Array<number|string>, members:Set<number>, v?:null|import("./cohorts.js").Variation, place?:null|number,
     *   mark?:number}} the child's family, then line (scope decisions 66, 67 and 70); v: the variation a baby of the line must
     *   inherit to join it (none for a family); place: where it must live to join it, once the child chose where the family lives
     */
    this.follow = null;
    /**
     * @type {Map<number, number>} the child's relatives: the rest of each line the child narrowed from, in its place, the
     * line's babies that didn't inherit its variation, and their babies; each with the follow that made it a relative
     */
    this.relatives = new Map();
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

  /**
   * This place has plenty of room: a pair living there would have more babies, since there is more food (the engine's
   * own rule, scope decision 70).
   */
  roomyIn(zone) { return babiesPerPair(this.zoneCounts()[zone], zone, classroomConfig) > classroomConfig.offspringPerPair; }

  /* ================= following (observer state only) ================= */

  /** The top of the family a tap on this animal follows (families.js): FAMILY_DEPTH generations back, or up to FAMILY_MIN living. */
  familyTopOf(id) { return this.families.top(id, this.families.lineCounts(this.livingIds())); }

  /** Follow the family a tap on this animal follows. */
  followFamilyOf(id) { return this.followLinesOf([this.familyTopOf(id)]); }

  /** Follow these animals' mother lines: each of them and her descendants through the mother line. */
  followLinesOf(roots) {
    const living = this.livingIds(), members = new Set();
    for (const root of roots) for (const id of this.families.members(root, living)) members.add(id);
    this.follow = { roots: [...roots], members, v: null };
    this.relatives = new Map();
    return this.follow;
  }

  /**
   * A follow narrows the child's line (scope decisions 66 and 67): these
   * animals, the line's animals with the variation in its place, are the line,
   * and from now on a baby joins it when a parent is in it and it inherited the
   * variation (and, once the child chose where the family lives, lives there
   * too: scope decision 70). The rest of the old line in the same place become
   * relatives, marked with this follow; the old line's animals in other places
   * are no one's now.
   * @param {number[]} ids the carriers followed, in the line's place
   * @param {number} zone the line's place
   * @param {import("./cohorts.js").Variation} v the variation followed
   * @param {number} mark this follow's number
   */
  narrowTo(ids, zone, v, mark) {
    const keep = new Set(ids);
    for (const id of this.follow.members) if (!keep.has(id) && this.zoneOf(id) === zone) this.relatives.set(id, mark);
    for (const id of keep) this.relatives.delete(id);
    this.follow = { roots: [...keep], members: keep, v, mark, place: this.follow.place ?? null };
    return this.follow;
  }

  /**
   * The first choice: where the family will live (scope decision 70). The line
   * becomes the family's animals living in this place, and from now on a baby
   * joins it when a parent is in it and it lives there too: it inherited the
   * preference. The rest of the family, wherever they live, become relatives,
   * marked with this choice, so "Back to your line" can give the family back.
   * @param {number[]} ids the family's animals living there @param {number} zone @param {number} mark
   */
  narrowToPlace(ids, zone, mark) {
    const keep = new Set(ids);
    for (const id of this.follow.members) if (!keep.has(id)) this.relatives.set(id, mark);
    for (const id of keep) this.relatives.delete(id);
    this.follow = { roots: [...keep], members: keep, v: null, mark, place: zone };
    return this.follow;
  }

  /** A baby of the line joins it (scope decisions 67 and 70): it inherited the line's variation, and lives in its place. */
  joins(kid, f = this.follow) {
    return (!f.v || carries(kid.bodyGenome, f.v)) && (f.place === null || f.place === undefined || currentZoneBinIndex(kid) === f.place);
  }

  /**
   * A followed line died out ("Back to your line", scope decision 68): the
   * relatives its follow made, the rest of the previous line and its babies
   * since, are the line again, with the previous line's variation (none for a
   * family) and place (none before the child chose one, scope decision 70).
   * @param {number} mark the follow whose line died out
   * @param {null|import("./cohorts.js").Variation} v the previous line's variation
   * @param {null|number} [place] the previous line's place
   * @returns {Set<number>} the line now (empty when none of them is alive)
   */
  restore(mark, v, place = null) {
    const members = new Set();
    for (const [id, m] of this.relatives) {
      if (m !== mark) continue;
      // A line in a chosen place takes back only its relatives there; the rest stay relatives, of the line before.
      if (place === null || this.zoneOf(id) === place) members.add(id);
      else this.relatives.set(id, mark - 1);
    }
    for (const id of members) this.relatives.delete(id);
    this.follow = { roots: [...members], members, v, mark: mark - 1, place };
    return members;
  }

  /** A new story in this world: no line or relatives until the child taps a family. */
  unfollow() {
    this.follow = null;
    this.relatives = new Map();
  }

  /**
   * Who won't make it next generation, and why: "maximum_age" (old age) or
   * "least_suited" (crowded out). Classroom survival draws nothing (scope
   * decision 55), so this is exactly who the next step will take; reading it
   * changes nothing.
   * @returns {Map<number, string>}
   */
  dyingNext() {
    const snapshot = this.state.currentIndividuals.slice().sort((a, b) => a.id - b.id);
    return whoDoesNotMakeIt(snapshot, classroomConfig);
  }

  /** One of the child's relatives: the rest of a line the child narrowed from, or a baby of one. */
  isRelative(id) { return this.relatives.has(id); }
  relativeIds() { return [...this.relatives.keys()]; }
  /** The child's relatives living in this place. */
  relativesIn(zone) { let n = 0; for (const id of this.relatives.keys()) if (this.zoneOf(id) === zone) n++; return n; }
  /** The line's animals living in this place. */
  followedIn(zone) { let n = 0; if (this.follow) for (const id of this.follow.members) if (this.zoneOf(id) === zone) n++; return n; }

  /** In the child's family, or line. */
  isFollowed(id) { return !!this.follow && this.follow.members.has(id); }
  followedIds() { return this.follow ? [...this.follow.members] : []; }

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
    // Where each animal lived before this generation, so each death says where it happened (scope decision 70).
    const zoneBefore = new Map(this.state.currentIndividuals.map((i) => [i.id, currentZoneBinIndex(i)]));
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
      .map((e) => ({ id: e.individualId, cause: e.cause, zone: zoneBefore.get(e.individualId) ?? -1 }));
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

    // Relatives (scope decision 67): a baby of the line that didn't inherit its variation, marked with the latest
    // follow, and a baby of a relative, marked like the parent nearest the line. They lose their dead.
    const f = this.follow;
    if (!f?.v && (f?.place ?? null) === null) {
      // Back with the family (scope decision 68): a relative's baby joins the relatives through its mother.
      for (const b of births) if (this.relatives.has(b.motherId)) this.relatives.set(b.childId, this.relatives.get(b.motherId));
    } else {
      for (const b of births) {
        const kid = this.byId.get(b.childId);
        const fromLine = f.members.has(b.parentAId) || f.members.has(b.parentBId);
        if (fromLine && kid && this.joins(kid, f)) continue; // it joins the line (updateGroup)
        const marks = [this.relatives.get(b.parentAId), this.relatives.get(b.parentBId)].filter((m) => m !== undefined);
        if (fromLine) marks.push(f.mark);
        if (marks.length) this.relatives.set(b.childId, Math.max(...marks));
      }
    }
    for (const d of deaths) this.relatives.delete(d.id);
    return {
      generation: g,
      births,
      deaths,
      mutations,
      group: this.updateGroup(births, deaths, mutations, g),
      observerErrors: result.observerErrors,
    };
  }

  updateGroup(births, deaths, mutations, g) {
    const f = this.follow;
    if (!f) return null;
    const before = f.members.size;
    // A family grows through its mothers (a mother is always a survivor of this generation, so she is still a
    // member here); a line through a parent in it, by a baby that inherited its variation (scope decision 67) and
    // lives in its place, once the child chose one (scope decision 70).
    const born = births.filter((b) => {
      if (!f.v && (f.place ?? null) === null) return f.members.has(b.motherId);
      const kid = this.byId.get(b.childId);
      return (f.members.has(b.parentAId) || f.members.has(b.parentBId)) && !!kid && this.joins(kid, f);
    }).map((b) => b.childId);
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
 * @property {Array<{id:number, cause:string, zone:number}>} deaths engine death events, with the place each lived in
 * @property {Array<{childId:number, trait:string, before:number, after:number, delta:number}>} mutations engine body-mutation events
 * @property {null|GroupEvents} group what happened to the child's family or line (null when there is none)
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
