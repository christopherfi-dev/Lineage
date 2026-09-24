/**
 * The story loop (scope decisions 6 and 32–34). DOM-free: the page, the
 * moment shortcuts and the measurement scripts drive the same rules.
 *
 * waiting ─tap─▶ watch ─follow─▶ skip ─▶ watch ─▶ … ─▶ ended
 *                  └─ push ─▶ choice ─choose─▶ skip
 *
 * Time waits for the child: no generation runs until an animal is tapped, and
 * the story starts by following its family. Between follows the child is
 * active: a newborn in the group with a new variation glows (a few at a time,
 * meaningful traits first), and tapping it offers to follow that variation.
 *
 * Following is a fair test. The group becomes START_SIZE animals in the
 * newborn's habitat that carry the variation, the newborn and the ones nearest
 * it, and START_SIZE animals there that don't are tracked beside it as "the
 * others here" (cohorts.js). Both change only by babies of their own mothers
 * and by deaths, so their counts compare fairly. A variation too rare to start
 * a test can be watched until it is common enough.
 *
 * If the child follows nothing for PUSH_SECONDS, a choice panel offers
 * variations that can start a test, as a backup. At most STORY_CHOICES
 * follows. The story ends at STORY_GENERATIONS, or when the group dies out.
 *
 * Nothing here touches the biology. Following is observer state only.
 */

import { averageOf, formOf } from "./variations.js";
import { census, comparisonFor, evidenceFor, mainZoneOf } from "./evidence.js";
import { revealFor } from "./reveal.js";
import {
  GLOW_GENERATIONS, GLOW_MAX, PUSH_OPTIONS, START_SIZE, WATCH_MAX,
  canStart, formCohorts, newbornVariation, sameVariation, sidesIn, spreadVariations,
} from "./cohorts.js";

/** Real seconds per generation while watching. */
export const GENERATION_SECONDS = 20;
/** Real seconds per generation while fast-forwarding. */
export const FAST_SECONDS = 2;
/** Generations fast-forwarded after each follow. */
export const SKIP_GENERATIONS = 2;
/** Seconds the child has to choose on the backup choice panel before one option is picked at random. */
export const CHOICE_SECONDS = 20;
/** At most this many follows in a story. */
export const STORY_CHOICES = 15;
/** Every story that lasts ends at this generation. */
export const STORY_GENERATIONS = 76;
/** With no follow for this many seconds of story, the backup choice panel opens. */
export const PUSH_SECONDS = 120;

export class Story {
  /**
   * @param {import("./bridge.js").Bridge} bridge
   * @param {{homeOf?:(id:number)=>null|{x:number,y:number}, size?:number}} [opts] where each animal's home
   *   spot is (herd.js); `size` only for measuring other values of START_SIZE
   */
  constructor(bridge, { homeOf = () => null, size = START_SIZE } = {}) {
    this.bridge = bridge;
    this.homeOf = homeOf;
    this.size = size;
    /** @type {"waiting"|"watch"|"skip"|"choice"|"ended"} */
    this.phase = "waiting";
    /** @type {null|Offer[]} the backup choice panel's options, while it is open */
    this.options = null;
    /** @type {Choice[]} every follow, in order */
    this.choices = [];
    /** @type {null|FairTest} the latest follow's two groups */
    this.fair = null;
    /** @type {Glow[]} the newborns glowing now */
    this.glowing = [];
    /** @type {Glow[]} recent newborns with a new variation, glowing or not */
    this.fresh = [];
    /** @type {Set<number>} newborns the child said "Not this one" to */
    this.dismissed = new Set();
    /** @type {Watch[]} variations the child is watching */
    this.watching = [];
    /** @type {Watch[]} watched variations that just became common enough to follow */
    this.readyNow = [];
    /** seconds of story since the latest follow (or the start) */
    this.idle = 0;
    /** seconds watched since the latest fast-forward ended (or the start) */
    this.quiet = 0;
    this.skipped = 0;
    /** your group's size when it last formed */
    this.sizeAtChoice = 0;
    this.startGeneration = 0;
    this.endGeneration = null;
    /** @type {null|"died"|"survived"} */
    this.outcome = null;
    /** @type {Array<{id:number, genome:ArrayLike<number>, zone:number}>} the group's members at the start, for the ending */
    this.startAnimals = [];
    /** @type {Array<{id:number, genome:ArrayLike<number>, zone:number}>} the members the group last had alive */
    this.lastAnimals = [];
    this.lastForm = null;
    /** the group's usual form right after the latest follow */
    this.formAtPoint = null;
    /** how many animals had each trait word in each habitat when the story began (evidence.js) */
    this.startCensus = null;
    /** @type {null|import("./evidence.js").Comparison} the ending's clue, both sides */
    this.comparison = null;
    /** @type {null|import("./evidence.js").Evidence} the ending's one-line clue, when no comparison qualifies */
    this.evidence = null;
    /** the habitat most of the group lived in at the end */
    this.mainZone = null;
    /** the whole world's mean for each trait at the start (generation 0): the base for relative reveal levels */
    this.startWorld = null;
    /** @type {null|{animal: import("./reveal.js").RevealAnimal, why:string[], matched:number, checked:number, strength:number}} a surviving group's real animal */
    this.reveal = null;
    /** @type {Map<number, {id:number, genome:ArrayLike<number>, zone:number}>} everyone in the group since it last formed */
    this.segment = new Map();
  }

  get running() { return this.phase === "watch" || this.phase === "skip"; }
  get fast() { return this.phase === "skip"; }
  get lasted() { return (this.endGeneration ?? this.bridge.generation) - this.startGeneration; }
  /** "family" until the first follow, then "group". */
  get noun() { return this.choices.length ? "group" : "family"; }
  /** Follows are left, so newborns can glow and be followed. */
  get canFollow() { return this.choices.length < STORY_CHOICES; }
  /** The child can follow right now: while watching, never during a fast-forward or a panel. */
  get followOpen() { return this.phase === "watch" && this.canFollow; }

  /** Your group's size now against when it last formed. */
  get mine() { return { now: this.bridge.followedIds().length, then: this.sizeAtChoice }; }
  /** The others here, the same way. */
  get theirs() { return { now: this.bridge.otherIds().length, then: this.fair ? this.fair.theirsThen : 0 }; }

  /** The child taps an animal and follows its family. Time starts now. */
  begin(id) {
    const follow = this.bridge.followFamilyOf(id);
    this.startGeneration = this.bridge.generation;
    this.phase = "watch";
    this.remember();
    this.sizeAtChoice = this.lastAnimals.length;
    this.startAnimals = this.lastAnimals;
    const world = this.bridge.livingAnimals();
    this.startCensus = census(world);
    this.startWorld = averageOf(world.map((a) => a.genome)).map((a) => a.mean);
    return follow;
  }

  remember() {
    this.lastAnimals = this.bridge.followedAnimals();
    this.lastForm = formOf(this.lastAnimals.map((a) => a.genome));
    for (const a of this.lastAnimals) this.segment.set(a.id, a);
  }

  /**
   * After each engine generation.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @returns {"ended"|"skip-done"|"choice"|null} what the story did; `readyNow` lists watched variations just ready
   */
  afterGeneration(ev) {
    const g = ev.group;
    this.readyNow = [];
    if (!g || !this.running) return null;
    const seconds = this.fast ? FAST_SECONDS : GENERATION_SECONDS;
    this.idle += seconds;
    if (!this.fast) this.quiet += seconds;
    if (g.count === 0) return this.end("died", ev.generation);
    this.remember();
    if (ev.generation >= STORY_GENERATIONS) return this.end("survived", ev.generation);
    this.updateGlow(ev);
    this.updateWatching();
    if (this.phase === "skip") {
      if (++this.skipped < SKIP_GENERATIONS) return null;
      this.phase = "watch";
      this.quiet = 0;
      return "skip-done";
    }
    // The push: nothing followed for a while, so a choice panel opens as a backup.
    if (this.canFollow && this.idle >= PUSH_SECONDS) {
      const options = this.pushOptions();
      if (options.length) {
        this.options = options;
        this.phase = "choice";
        return "choice";
      }
    }
    return null;
  }

  /**
   * The calm rule: of the newborns in the group with a new variation this
   * generation or the one before, at most GLOW_MAX glow, meaningful traits
   * first, then the newest, one per variation.
   */
  updateGlow(ev) {
    if (!this.canFollow) { this.fresh = []; this.glowing = []; return; }
    for (const id of ev.group.born) {
      const v = newbornVariation(this.bridge, id, this.lastForm);
      if (v) this.fresh.push({ id, v, zone: this.bridge.zoneOf(id), generation: ev.generation });
    }
    this.refreshGlow(ev.generation);
  }

  refreshGlow(generation = this.bridge.generation) {
    this.fresh = this.fresh.filter((x) => generation - x.generation < GLOW_GENERATIONS &&
      this.bridge.isFollowed(x.id) && !this.dismissed.has(x.id) && !this.watchOf(x));
    const ranked = [...this.fresh].sort((a, b) => Number(a.v.neutral) - Number(b.v.neutral) || b.generation - a.generation || a.id - b.id);
    const glowing = [];
    for (const x of ranked) {
      if (glowing.length === GLOW_MAX) break;
      if (!glowing.some((y) => sameVariation(y.v, x.v))) glowing.push(x);
    }
    this.glowing = glowing;
  }

  /** @returns {null|Glow} */
  glowFor(id) { return this.glowing.find((x) => x.id === id) ?? null; }

  /** Both sides of a glowing, watched or offered variation in its habitat, now. */
  sidesFor(x) { return sidesIn(this.bridge, x.v, x.zone); }

  /** Both sides have enough animals here to start a fair test. */
  canStartFor(x) { return canStart(this.sidesFor(x), this.size); }

  /** "Not this one": it stops glowing, and nothing else happens. */
  dismiss(id) {
    this.dismissed.add(id);
    this.refreshGlow();
  }

  /** "Watch it?": too few carry it here yet, so its count is kept an eye on. */
  watch(x) {
    if (this.watchOf(x)) return;
    const sides = this.sidesFor(x);
    this.watching.push({ v: x.v, zone: x.zone, id: x.id, home: this.homeOf(x.id), count: sides.carriers.length, ready: canStart(sides, this.size), told: canStart(sides, this.size) });
    if (this.watching.length > WATCH_MAX) this.watching.shift();
    this.refreshGlow();
  }

  /** @returns {null|Watch} */
  watchOf(x) { return this.watching.find((w) => w.zone === x.zone && sameVariation(w.v, x.v)) ?? null; }

  updateWatching() {
    for (const w of this.watching) {
      const sides = this.sidesFor(w);
      w.count = sides.carriers.length;
      w.ready = canStart(sides, this.size);
      if (w.ready && !w.told) { w.told = true; this.readyNow.push(w); }
    }
    this.watching = this.watching.filter((w) => w.count > 0);
  }

  /**
   * The backup choice panel's options: watched variations that can start a
   * fair test first, then glowing ones that can, then others the group has
   * spread. One per trait.
   * @returns {Offer[]}
   */
  pushOptions() {
    const out = [];
    const add = (x, watched) => {
      if (out.length < PUSH_OPTIONS && !out.some((o) => o.v.trait === x.v.trait)) out.push({ v: x.v, id: this.anchorFor(x), zone: x.zone, watched });
    };
    for (const w of this.watching) if (w.ready) add(w, true);
    for (const g of this.glowing) if (this.canStartFor(g)) add(g, false);
    for (const s of spreadVariations(this.bridge, this.lastAnimals, this.size)) add(s, false);
    return out;
  }

  /** The animal a test starts from: this one if it still carries the variation there, else the carrier nearest its home. */
  anchorFor(x) {
    const sides = this.sidesFor(x);
    if (sides.carriers.includes(x.id)) return x.id;
    const at = x.home ?? this.homeOf(x.id);
    const d = (id) => { const h = at && this.homeOf(id); return h ? Math.hypot(h.x - at.x, h.y - at.y) : Math.abs(id - x.id); };
    return [...sides.carriers].sort((a, b) => d(a) - d(b) || a - b)[0] ?? x.id;
  }

  /**
   * Follow a variation as a fair test: your group becomes START_SIZE carriers
   * in its habitat, nearest the anchor, and START_SIZE animals there without
   * it become "the others here". Then the world fast-forwards.
   * @param {{v:import("./cohorts.js").Variation, id:number, zone:number, home?:any}} x a glow, a watch or an offer
   * @param {boolean} byChance picked at random on the backup panel because time ran out
   */
  follow(x, byChance) {
    const sides = this.sidesFor(x), anchor = this.anchorFor(x);
    const { mine, theirs } = formCohorts(sides, anchor, this.homeOf, this.size);
    this.closeChoice();
    this.bridge.followCohorts(mine, theirs);
    const generation = this.bridge.generation;
    this.fair = { v: x.v, zone: x.zone, anchor, generation, mineThen: mine.length, theirsThen: theirs.length };
    this.choices.push({
      group: x.v.group, trait: x.v.trait, neutral: x.v.neutral, byChance, generation, zone: x.zone,
      sizeAtChoice: mine.length, sizeAtEnd: null, othersAtChoice: theirs.length, othersAtEnd: null,
    });
    this.sizeAtChoice = mine.length;
    this.watching = this.watching.filter((w) => !(w.zone === x.zone && sameVariation(w.v, x.v)));
    this.fresh = [];
    this.glowing = [];
    this.options = null;
    this.phase = "skip";
    this.skipped = 0;
    this.idle = 0;
    this.quiet = 0;
    this.segment = new Map(); // the group formed again
    this.remember();
    this.formAtPoint = this.lastForm;
  }

  /** The latest follow's groups are about to be replaced, or the story ends: note their sizes. */
  closeChoice() {
    const last = this.choices[this.choices.length - 1];
    if (last && last.sizeAtEnd === null) {
      last.sizeAtEnd = this.bridge.followedIds().length;
      last.othersAtEnd = this.bridge.otherIds().length;
    }
  }

  end(outcome, generation) {
    this.closeChoice();
    this.phase = "ended";
    this.outcome = outcome;
    this.endGeneration = generation;
    this.glowing = [];
    this.options = null;
    this.mainZone = mainZoneOf(this.lastAnimals);
    const segment = [...this.segment.values()], living = this.bridge.livingAnimals();
    this.comparison = comparisonFor(segment, living, this.startCensus);
    this.evidence = evidenceFor(segment, living, this.startCensus);
    // Scope decision 10: from the group's actual average traits and main habitat, never its choices.
    if (outcome === "survived") {
      this.reveal = revealFor(averageOf(this.lastAnimals.map((a) => a.genome)).map((a) => a.mean), this.mainZone, this.startWorld);
    }
    return "ended";
  }
}

/**
 * @typedef {Object} Glow a newborn in your group with a new variation
 * @property {number} id @property {import("./cohorts.js").Variation} v
 * @property {number} zone its habitat @property {number} generation when it was born
 *
 * @typedef {Object} Watch a variation the child is watching
 * @property {import("./cohorts.js").Variation} v @property {number} zone the habitat it is counted in
 * @property {number} id the newborn it was seen in @property {null|{x:number,y:number}} home that newborn's home spot
 * @property {number} count how many carry it there now @property {boolean} ready a fair test can start
 * @property {boolean} told the child has been told it is ready
 *
 * @typedef {Object} Offer an option on the backup choice panel
 * @property {import("./cohorts.js").Variation} v @property {number} id the animal shown
 * @property {number} zone @property {boolean} watched it was on the watching list
 *
 * @typedef {Object} FairTest the latest follow's two groups
 * @property {import("./cohorts.js").Variation} v @property {number} zone @property {number} anchor
 * @property {number} generation @property {number} mineThen @property {number} theirsThen
 *
 * @typedef {Object} Choice
 * @property {string} group "a darker coat": what the followed animals have
 * @property {string} trait engine trait name
 * @property {boolean} neutral an engine neutral trait (coat shade, ear tips, tail tip)
 * @property {boolean} byChance picked at random on the backup panel because time ran out
 * @property {number} generation when it was followed
 * @property {number} zone the habitat of the fair test
 * @property {number} sizeAtChoice your group's size when it formed (START_SIZE)
 * @property {null|number} sizeAtEnd its size when the next follow replaced it or the story ended
 * @property {number} othersAtChoice @property {null|number} othersAtEnd the others here, the same way
 */
