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
 * parent is in it and it inherited every variation the line keeps, the latest
 * way on each chosen trait (scope decision 72). The rest of the old line in
 * its place, and the line's babies that didn't inherit them, are the child's
 * relatives, each marked with the follow that made them relatives, so a line
 * that dies out can give the previous line back. On a trait that doesn't
 * matter in the line's place, a baby of those relatives with every kept
 * variation joins the line too (scope decision 72).
 * The family grows by babies whose mother is in it (a pair's two babies have
 * one mother each: the first joins parent A's family, the second parent B's,
 * scope decision 58). Following is observer state only and cannot change the
 * biology.
 *
 * With LIKE_RULE (scope decision 87: built and measured, but off), your line
 * never gets an adaptation you didn't choose: the family, then the line, has a
 * profile, a band of values for each meaningful trait (profileOf), and a baby
 * joins only if it is like the line, inside every band. A baby born with a new
 * variation, better or worse, starts a branch: a relative, unless the child
 * follows it. The band is the founders' at the tap; in a chosen place only the
 * traits that help or hurt there are checked; a follow moves the followed
 * trait's band to the animals followed. With the rule off, every band is null
 * and nothing here changes what joins the line.
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
import { APART, carries, formOf, isNeutral } from "./variations.js";

/**
 * Your line never gets an adaptation you didn't choose (scope decision 87): a baby joins it only if it is like it.
 * Built and measured, and off: with it, the child who follows every helpful glow won only 72, 84 and 19 of 90 stories
 * (high leaves, open ground, water's edge), short of the target of 85% (scope decision 87).
 */
export const LIKE_RULE = false;

/** The seven meaningful traits: every trait but the three neutral ones (scope decision 20). */
export const MEANINGFUL = TRAITS.map((_, t) => t).filter((t) => !isNeutral(t));

/**
 * A line's profile (scope decision 87): for each meaningful trait, the values a baby may have and still be like the
 * line, [lo, hi]. Every value these animals have is in it, and everything nearer their usual (median) than APART: a
 * baby a whole variation away (rule B's threshold, cohorts.js) is outside. `traits` are worked out again from these
 * animals; the rest are kept from `band`. Neutral traits have no band.
 * @param {ArrayLike<number>[]} genomes @param {number[]} [traits] @param {Array<null|number[]>} [band]
 * @returns {Array<null|number[]>} by trait
 */
export function profileOf(genomes, traits = MEANINGFUL, band = []) {
  const out = TRAITS.map((_, t) => band[t] ?? null);
  if (!genomes.length) return out;
  const form = formOf(genomes);
  for (const t of traits) {
    if (isNeutral(t)) continue;
    let lo = Infinity, hi = -Infinity;
    for (const g of genomes) { lo = Math.min(lo, g[t]); hi = Math.max(hi, g[t]); }
    const m = form[t].median;
    out[t] = [Math.min(lo, m - APART + 1e-9), Math.max(hi, m + APART - 1e-9)];
  }
  return out;
}

/** This body is like the line (scope decision 87): inside its band on every meaningful trait but `except`. */
export const isLike = (genome, band, except = -1) =>
  !band || band.every((b, t) => !b || t === except || (genome[t] >= b[0] - 1e-12 && genome[t] <= b[1] + 1e-12));

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
     *   mark?:number, kept?:import("./cohorts.js").Variation[], free?:boolean}} the child's family, then line (scope decisions
     *   66, 67, 70 and 72); v: the latest variation followed (none for a family); kept: every variation a baby of the line must
     *   inherit to join it; free: v's trait doesn't matter in the line's place; place: where it must live to join it, once the
     *   child chose where the family lives
     */
    this.follow = null;
    /**
     * @type {Map<number, number>} the child's relatives: the rest of each line the child narrowed from, in its place, the
     * line's babies that didn't inherit its variations or aren't like it, and their babies; each with the follow that
     * made it a relative (0 before the place choice)
     */
    this.relatives = new Map();
    /** @type {Map<number, {trait:string, up:boolean}>} each living animal's trait that is new at birth */
    this.newAtBirth = new Map();
    /** a baby joins the family or line only if it is like it (scope decision 87); false only to measure the old rule */
    this.like = LIKE_RULE;
    /**
     * which traits a line in a chosen place is checked on: "place", the traits that help or hurt there (and any the
     * child followed); "all", the seven meaningful traits (measured for scope decision 87)
     */
    this.likeTraits = "place";
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

  /**
   * Follow these animals' mother lines: each of them and her descendants through the mother line. The family's
   * profile is theirs now (scope decision 87).
   */
  followLinesOf(roots) {
    const living = this.livingIds(), members = new Set();
    for (const root of roots) for (const id of this.families.members(root, living)) members.add(id);
    const band = this.like ? profileOf([...members].map((id) => this.byId.get(id).bodyGenome)) : null;
    this.follow = { roots: [...roots], members, v: null, band };
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
   *
   * The line keeps every trait the child chose (scope decision 72): a baby
   * joins it only with each of them, `kept`, the latest way on each trait. And
   * on a trait that doesn't matter in the line's place (`free`), a baby of a
   * relative this follow made, or made since, joins it too when it has them
   * all: such a trait doesn't decide who lives there, so the line is the
   * family's animals that have it, wherever in the family they were born.
   *
   * The followed trait's band in the line's profile is theirs now (scope decision 87); the rest stay as they were.
   * @param {number[]} ids the carriers followed, in the line's place
   * @param {number} zone the line's place
   * @param {import("./cohorts.js").Variation} v the variation followed
   * @param {number} mark this follow's number
   * @param {import("./cohorts.js").Variation[]} [kept] every variation the line keeps, this one too
   * @param {boolean} [free] this variation's trait doesn't matter in the line's place
   */
  narrowTo(ids, zone, v, mark, kept = [v], free = false) {
    const keep = new Set(ids);
    for (const id of this.follow.members) if (!keep.has(id) && this.zoneOf(id) === zone) this.relatives.set(id, mark);
    for (const id of keep) this.relatives.delete(id);
    const band = this.follow.band && profileOf(ids.map((id) => this.byId.get(id).bodyGenome), [v.t], this.follow.band);
    this.follow = { roots: [...keep], members: keep, v, kept, mark, free, place: this.follow.place ?? null, band };
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
    // In a chosen place, the line is checked on the traits that help or hurt there (scope decision 87).
    const was = this.follow.band ?? null;
    const band = was && this.likeTraits === "place" ? was.map((b, t) => (classroomConfig.placeEffects[t][zone] !== 0 ? b : null)) : was;
    this.follow = { roots: [...keep], members: keep, v: null, kept: [], mark, free: false, place: zone, band };
    return this.follow;
  }

  /**
   * A baby of the line joins it (scope decisions 67, 70, 72 and 87): it inherited every variation the line keeps,
   * lives in its place, and is like the line.
   */
  joins(kid, f = this.follow) {
    const kept = f.kept ?? (f.v ? [f.v] : []);
    return kept.every((u) => carries(kid.bodyGenome, u)) && (f.place === null || f.place === undefined || currentZoneBinIndex(kid) === f.place) &&
      isLike(kid.bodyGenome, f.band);
  }

  /**
   * This baby would be like the line but for one trait, its new variation's (scope decision 87): a branch the child
   * may follow. It lives in the line's place, is inside every band but that trait's, and has every variation the line
   * keeps on the other traits.
   * @param {number} id @param {number} t the trait of its new variation
   */
  branchOf(id, t) {
    const f = this.follow, kid = this.byId.get(id);
    if (!f || !kid || (f.place !== null && f.place !== undefined && currentZoneBinIndex(kid) !== f.place)) return false;
    const kept = f.kept ?? (f.v ? [f.v] : []);
    return kept.every((u) => u.t === t || carries(kid.bodyGenome, u)) && isLike(kid.bodyGenome, f.band, t);
  }

  /** The traits on which this animal is outside the line's profile (scope decision 87). */
  unlikeTraits(id) {
    const band = this.follow?.band, g = this.byId.get(id)?.bodyGenome;
    if (!band || !g) return [];
    const out = [];
    band.forEach((b, t) => { if (b && (g[t] < b[0] - 1e-12 || g[t] > b[1] + 1e-12)) out.push(t); });
    return out;
  }

  /**
   * This birth can join the line: a parent is in it, or, after a follow on a trait that doesn't matter in the line's
   * place, a parent is a relative this follow made or made since (scope decision 72).
   */
  fromLine(b, f = this.follow) {
    if (f.members.has(b.parentAId) || f.members.has(b.parentBId)) return true;
    if (!f.free) return false;
    const a = this.relatives.get(b.parentAId), c = this.relatives.get(b.parentBId);
    return (a !== undefined && a >= f.mark) || (c !== undefined && c >= f.mark);
  }

  /**
   * A followed line died out ("Back to your line", scope decision 68): the
   * relatives its follow made, the rest of the previous line and its babies
   * since, are the line again, with the previous line's variation (none for a
   * family) and place (none before the child chose one, scope decision 70).
   * Only those with every variation the line keeps now come back (scope
   * decision 72), and only those like the line before (scope decision 87): a
   * branch that took a variation the child didn't follow stays a relative, of
   * the line before.
   * @param {number} mark the follow whose line died out
   * @param {null|import("./cohorts.js").Variation} v the previous line's variation
   * @param {null|number} [place] the previous line's place
   * @param {import("./cohorts.js").Variation[]} [kept] every variation the line keeps now
   * @param {boolean} [free] the previous line's variation's trait doesn't matter in its place
   * @param {null|Array<null|number[]>} [band] the previous line's profile
   * @returns {Set<number>} the line now (empty when none of them is alive)
   */
  restore(mark, v, place = null, kept = v ? [v] : [], free = false, band = null) {
    const members = new Set();
    for (const [id, m] of this.relatives) {
      if (m !== mark) continue;
      // A line in a chosen place takes back only its relatives there; the rest stay relatives, of the line before.
      const ind = this.byId.get(id);
      if ((place === null || this.zoneOf(id) === place) && !!ind && kept.every((u) => carries(ind.bodyGenome, u)) && isLike(ind.bodyGenome, band)) members.add(id);
      else this.relatives.set(id, mark - 1);
    }
    for (const id of members) this.relatives.delete(id);
    this.follow = { roots: [...members], members, v, kept, mark: mark - 1, free, place, band };
    return members;
  }

  /**
   * The line isn't growing (scope decision 91): its animals are relatives now, of the follow that made it, so
   * `restore` can give the line before back. The same as when it dies out, with its animals still alive.
   * @param {number} mark the follow whose line is given up
   */
  giveUp(mark) {
    for (const id of this.follow.members) this.relatives.set(id, mark);
    this.follow.members = new Set();
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

    // Relatives (scope decision 67): a baby of the line that didn't inherit its variations, or isn't like it (scope
    // decision 87), marked with the latest follow, and a baby of a relative, marked like the parent nearest the line.
    // They lose their dead.
    const f = this.follow, joined = [], branched = [];
    if (!f?.v && (f?.place ?? null) === null) {
      for (const b of births) {
        // A family grows through its mothers (updateGroup), by a baby like it (scope decision 87); one that isn't
        // starts a branch, a relative.
        if (f?.members.has(b.motherId)) {
          if (this.joins(this.byId.get(b.childId), f)) joined.push(b.childId);
          else { branched.push(b.childId); this.relatives.set(b.childId, f.mark ?? 0); }
        } else if (this.relatives.has(b.motherId)) {
          // Back with the family (scope decision 68): a relative's baby joins the relatives through its mother.
          this.relatives.set(b.childId, this.relatives.get(b.motherId));
        }
      }
    } else {
      for (const b of births) {
        const kid = this.byId.get(b.childId);
        // It joins the line (updateGroup): a parent in it, or a relative's baby on a free follow (scope decision 72).
        if (kid && this.fromLine(b, f) && this.joins(kid, f)) { joined.push(b.childId); continue; }
        const marks = [this.relatives.get(b.parentAId), this.relatives.get(b.parentBId)].filter((m) => m !== undefined);
        if (f.members.has(b.parentAId) || f.members.has(b.parentBId)) { marks.push(f.mark); branched.push(b.childId); }
        if (marks.length) this.relatives.set(b.childId, Math.max(...marks));
      }
    }
    for (const d of deaths) this.relatives.delete(d.id);
    return {
      generation: g,
      births,
      deaths,
      mutations,
      group: this.updateGroup(births, deaths, mutations, g, joined, branched),
      observerErrors: result.observerErrors,
    };
  }

  /**
   * @param {number[]} joined the babies that joined the family or line (step), worked out before the relatives lost their dead
   * @param {number[]} branched the babies of the family or line that didn't (scope decision 87)
   */
  updateGroup(births, deaths, mutations, g, joined, branched = []) {
    const f = this.follow;
    if (!f) return null;
    const before = f.members.size;
    // A family grows through its mothers (a mother is always a survivor of this generation, so she is still a
    // member here); a line through a parent in it, by a baby that inherited its variations (scope decisions 67 and
    // 72) and lives in its place, once the child chose one (scope decision 70); each like it (scope decision 87).
    const born = joined;
    const gone = deaths.filter((d) => f.members.has(d.id)).map((d) => d.id);
    for (const id of born) f.members.add(id);
    for (const id of gone) f.members.delete(id);
    const byZone = [0, 0, 0];
    for (const id of f.members) byZone[this.zoneOf(id)]++;
    const last = f.members.size === 1 ? [...f.members][0] : null;
    const dead = new Set(deaths.map((d) => d.id));
    return {
      count: f.members.size,
      before,
      born,
      branched: branched.filter((id) => !dead.has(id)),
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
 * @property {number[]} branched babies of the family or line that didn't join it: not like it, or without its
 *   variations (scope decision 87)
 * @property {Array<Object>} mutated this generation's mutations in your group
 * @property {number[]} byZone members by engine zone
 * @property {boolean} lastCouldNotMate one member left, and she found no mate this generation
 */
