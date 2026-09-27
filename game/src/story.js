/**
 * The story loop (scope decisions 6, 32–34, 42 and 44). DOM-free: the page, the
 * moment shortcuts and the measurement scripts drive the same rules.
 *
 * waiting ─tap─▶ watch ─follow─▶ skip ─▶ watch ─▶ … ─▶ ended
 *                  ├─ too rare yet ─▶ spread ─▶ follow, or back to watch
 *                  └─ push ─▶ choice ─choose─▶ skip
 *
 * Time waits for the child: no generation runs until an animal is tapped, and
 * the story starts by following its family. Between follows the child is
 * active: a newborn in the group with a new variation glows (a few at a time,
 * the ones that can be followed first), and tapping it offers to follow that
 * variation. Only a trait that helps or hurts where the test would be can be
 * followed (scope decision 58); a neutral one, or a "~" there, still glows,
 * and its card explains instead.
 *
 * Following is a fair test. The group becomes animals in the newborn's
 * habitat that carry the variation, the newborn and the ones nearest it, and
 * the same number there that don't, a twin beside each, are tracked as "the
 * others here" (cohorts.js). The size is the smaller side, at most MAX_SIZE,
 * and a test needs at least MIN_SIZE. Both change only by babies of their own mothers
 * and by deaths, so their counts compare fairly. A variation too rare to start
 * a test right away is fast-forwarded to see if it spreads (scope decision 42):
 * at MAX_SIZE carriers the test starts; after SPREAD_MAX generations it starts
 * with what there is, if that is at least MIN_SIZE; otherwise the child keeps
 * the group they have, and the try is not one of their follows. A variation
 * most of the habitat already has (too few without it) is not fast-forwarded.
 * If the child's own group falls to DANGER_SIZE or fewer during that
 * fast-forward, it stops at once and the world goes back to its usual pace, so
 * the child sees what happens to their group (scope decision 44). A group that
 * small can't follow anything at all, and the backup panel waits (the
 * playtest's "no jumping ship").
 *
 * Glowing babies light up one at a time through the watched day: each
 * generation's babies appear across the day (appearFraction), a new glow
 * starts at most every GLOW_GAP_SECONDS, and a glow is never replaced before
 * GLOW_MIN_SECONDS. The calm rule still allows GLOW_MAX at once, and a glow
 * still ends after GLOW_GENERATIONS.
 *
 * If the child follows nothing for PUSH_SECONDS, a choice panel offers
 * variations that can start a test, as a backup. At most STORY_CHOICES
 * follows. The story ends at STORY_GENERATIONS, or when the group dies out.
 *
 * Nothing here touches the biology. Following is observer state only.
 */

import { averageOf, formOf } from "./variations.js";
import { matters } from "./why.js";
import { census, comparisonFor, evidenceFor, mainZoneOf } from "./evidence.js";
import { revealFor } from "./reveal.js";
import {
  GLOW_GENERATIONS, GLOW_MAX, MAX_SIZE, MIN_SIZE, PUSH_OPTIONS,
  canStart, formCohorts, newbornVariation, sameVariation, sidesIn, spreadVariations, testSize,
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
/** A variation too rare to start a fair test is fast-forwarded at most this many generations to see if it spreads. */
export const SPREAD_MAX = 10;
/** The child's group this small or smaller stops a spread's fast-forward, and keeps any follow from starting (scope decision 44). */
export const DANGER_SIZE = 5;
/** A glowing baby is never replaced by a newer one before it has glowed this long (seconds of watching). */
export const GLOW_MIN_SECONDS = 10;
/** New glows start at least this far apart (seconds of watching), so babies light up one at a time. */
export const GLOW_GAP_SECONDS = 4;
/** A watched generation's babies appear over this much of its day; the rest of the day is quiet. */
export const APPEAR_SPAN = 0.8;

/**
 * When in its day a baby appears on the map, 0..1 of APPEAR_SPAN: fixed by its
 * id, so the page, the moments and the measurements agree. Visual only; the
 * engine made the baby at the generation's tick.
 */
export function appearFraction(id) {
  let h = Math.imul(id ^ 0x5bd1e995, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export class Story {
  /**
   * @param {import("./bridge.js").Bridge} bridge
   * @param {{homeOf?:(id:number)=>null|{x:number,y:number}, minSize?:number, maxSize?:number, spreadMax?:number,
   *   generationSeconds?:number, glowGenerations?:number, onePerVariation?:boolean}} [opts]
   *   where each animal's home spot is (herd.js); the others only for measuring other values of MIN_SIZE,
   *   MAX_SIZE, SPREAD_MAX, GENERATION_SECONDS and GLOW_GENERATIONS
   */
  constructor(bridge, { homeOf = () => null, minSize = MIN_SIZE, maxSize = MAX_SIZE, spreadMax = SPREAD_MAX,
    generationSeconds = GENERATION_SECONDS, glowGenerations = GLOW_GENERATIONS, onePerVariation = true } = {}) {
    this.bridge = bridge;
    this.homeOf = homeOf;
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.spreadMax = spreadMax;
    this.generationSeconds = generationSeconds;
    this.glowGenerations = glowGenerations;
    this.onePerVariation = onePerVariation;
    /** @type {"waiting"|"watch"|"skip"|"spread"|"choice"|"ended"} */
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
    /** @type {Set<number>} newborns the child tried to follow with a spread: they stop glowing */
    this.dismissed = new Set();
    /** @type {null|Spread} a variation being fast-forwarded to see if it spreads */
    this.spread = null;
    /** @type {null|Spread} the latest spread, once it has stopped */
    this.lastSpread = null;
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
    /** @type {null|{animal: import("./reveal.js").RevealAnimal, why:string[], whyPast:string[], matched:number, checked:number, strength:number}} the group's real animal, on every ending */
    this.reveal = null;
    /** @type {Map<number, {id:number, genome:ArrayLike<number>, zone:number}>} everyone in the group since it last formed */
    this.segment = new Map();
    /** @type {null|string} the family's name, picked by the child right after the first tap ("Mossfoot", names.js) */
    this.name = null;
    /** seconds of watching: glows start and last by this clock, which stands still during fast-forwards and panels */
    this.watchT = 0;
    /** when the latest glow started, in watchT */
    this.lastGlowAt = -Infinity;
    /** @type {null|{generation:number, living:number[]}} who was alive at the latest follow (or the start), for "since your last choice" */
    this.mark = null;
    /** @type {Glow[]} glows started since the page last asked (takeStarted), to name each baby as it lights up */
    this.started = [];
  }

  get running() { return this.phase === "watch" || this.phase === "skip" || this.phase === "spread"; }
  /** The world fast-forwards: after a follow, and while a variation is seen spreading. */
  get fast() { return this.phase === "skip" || this.phase === "spread"; }
  get lasted() { return (this.endGeneration ?? this.bridge.generation) - this.startGeneration; }
  /** "family" until the first follow, then "group". */
  get noun() { return this.choices.length ? "group" : "family"; }
  /** Follows are left, so newborns can glow and be followed. */
  get canFollow() { return this.choices.length < STORY_CHOICES; }
  /** The child can follow right now: while watching, never during a fast-forward or a panel. */
  get followOpen() { return this.phase === "watch" && this.canFollow; }
  /** The child's own group is very small: no follow starts, no spread goes on, and the backup panel waits (scope decision 44, playtest). */
  get inDanger() { return this.bridge.followedIds().length <= DANGER_SIZE; }

  /** Where a fair test on this glowing baby's variation would be. */
  testZone(x) { return x.zone; }

  /**
   * Only a trait that helps or hurts where the test would be can be followed
   * (scope decision 58), so every fair test gives a clear result. A neutral
   * trait, or a "~" there, still glows; its card explains instead.
   */
  followable(x) { return !x.v.neutral && matters(x.v.t, this.testZone(x)); }

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
    this.markNow();
    return follow;
  }

  /** Who is alive now: the "then" of every group's count until the next follow. */
  markNow() { this.mark = { generation: this.bridge.generation, living: this.bridge.livingIds() }; }

  remember() {
    this.lastAnimals = this.bridge.followedAnimals();
    this.lastForm = formOf(this.lastAnimals.map((a) => a.genome));
    for (const a of this.lastAnimals) this.segment.set(a.id, a);
  }

  /**
   * After each engine generation.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @returns {"ended"|"skip-done"|"spreading"|"spread-ready"|"spread-failed"|"spread-danger"|"choice"|null} what the story did
   */
  afterGeneration(ev) {
    const g = ev.group;
    if (!g || !this.running) return null;
    const seconds = this.fast ? FAST_SECONDS : this.generationSeconds;
    this.idle += seconds;
    if (!this.fast) this.quiet += seconds;
    if (g.count === 0) return this.end("died", ev.generation);
    this.remember();
    if (ev.generation >= STORY_GENERATIONS) return this.end("survived", ev.generation);
    this.updateGlow(ev);
    if (this.phase === "spread") return this.spreadGeneration();
    if (this.phase === "skip") {
      if (++this.skipped < SKIP_GENERATIONS) return null;
      this.phase = "watch";
      this.quiet = 0;
      return "skip-done";
    }
    // The push: nothing followed for a while, so a choice panel opens as a backup (never while the group is very small).
    if (this.canFollow && this.idle >= PUSH_SECONDS && !this.inDanger) {
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
   * generation or the one before, at most GLOW_MAX glow, the ones that can be
   * followed first, then the newest, one per variation. A watched generation's babies
   * appear across its day (appearFraction), and each can glow once it has
   * appeared; glows start as the day goes on (advance).
   */
  updateGlow(ev) {
    if (!this.canFollow) { this.fresh = []; this.glowing = []; return; }
    const watched = this.phase === "watch";
    for (const id of ev.group.born) {
      const v = newbornVariation(this.bridge, id, this.lastForm);
      const showAt = this.watchT + (watched ? APPEAR_SPAN * this.generationSeconds * appearFraction(id) : 0);
      if (v) this.fresh.push({ id, v, zone: this.bridge.zoneOf(id), generation: ev.generation, bornT: this.watchT, showAt, since: null });
    }
    this.refreshGlow(ev.generation);
  }

  /**
   * The day goes on: `seconds` more of watching. Babies that have appeared can
   * start to glow, one every GLOW_GAP_SECONDS. Returns the glows that started.
   * @returns {Glow[]}
   */
  advance(seconds) {
    if (this.phase !== "watch") return [];
    this.watchT += seconds;
    return this.startGlows();
  }

  /** Drop the glows that are over (too old, gone from the group, or tried), then start any that may. */
  refreshGlow(generation = this.bridge.generation) {
    this.fresh = this.fresh.filter((x) => generation - x.generation < this.glowGenerations &&
      this.bridge.isFollowed(x.id) && !this.dismissed.has(x.id));
    this.glowing = this.glowing.filter((x) => this.fresh.includes(x));
    return this.startGlows();
  }

  /**
   * Which newborns glow now. A glow younger than GLOW_MIN_SECONDS stays; the
   * other places go to the best of the babies that have appeared (meaningful
   * traits first, then the newest), one per variation, at most GLOW_MAX; a
   * new glow waits until GLOW_GAP_SECONDS after the last one started. Glows
   * start only while the world is watched.
   * @returns {Glow[]} the glows that started now
   */
  startGlows() {
    const t = this.watchT, current = this.glowing, started = [];
    const ready = this.fresh.filter((x) => x.showAt <= t + 1e-9)
      .sort((a, b) => Number(!this.followable(a)) - Number(!this.followable(b)) || b.generation - a.generation || b.showAt - a.showAt || a.id - b.id);
    const next = current.filter((x) => t - x.since < GLOW_MIN_SECONDS);
    for (const x of ready) {
      if (next.length >= GLOW_MAX) break;
      if (next.includes(x) || (this.onePerVariation && next.some((y) => sameVariation(y.v, x.v)))) continue;
      if (current.includes(x)) { next.push(x); continue; }
      if (this.phase !== "watch" || t - this.lastGlowAt < GLOW_GAP_SECONDS - 1e-9) continue;
      // Only a glow with GLOW_MIN_SECONDS left before its generations are up starts at all.
      if (x.bornT + this.glowGenerations * this.generationSeconds - t < GLOW_MIN_SECONDS) continue;
      x.since = t;
      this.lastGlowAt = t;
      next.push(x);
      started.push(x);
    }
    this.glowing = next;
    this.started.push(...started);
    return started;
  }

  /** The glows started since the last call, oldest first. */
  takeStarted() {
    const started = this.started;
    this.started = [];
    return started;
  }

  /** @returns {null|Glow} */
  glowFor(id) { return this.glowing.find((x) => x.id === id) ?? null; }

  /** Both sides of a glowing, spreading or offered variation in its habitat, now. */
  sidesFor(x) { return sidesIn(this.bridge, x.v, x.zone); }

  /** Both sides have at least MIN_SIZE animals here, so a fair test can start. */
  canStartFor(x) { return canStart(this.sidesFor(x), this.minSize, this.maxSize); }

  /** How big a fair test on this variation would be now: the smaller side, at most MAX_SIZE. */
  sizeFor(x) { return testSize(this.sidesFor(x), this.maxSize); }

  /**
   * Too few carry the variation here to start a fair test right away, so the
   * world fast-forwards to see if it spreads (scope decision 42). The newborn
   * stops glowing; the child's group lives on meanwhile, as usual. When MAX_SIZE
   * or more carry it already, the test is short of animals without it, which
   * no spread can fix: it stops at once. With the child's group at DANGER_SIZE
   * or fewer, none starts (the card offers only "Keep looking").
   * @param {Glow} x
   * @returns {null|"spreading"|"spread-failed"}
   */
  trySpread(x) {
    if (this.inDanger || !this.followable(x)) return null;
    this.dismissed.add(x.id);
    this.refreshGlow();
    const n = this.sidesFor(x).carriers.length;
    this.spread = { v: x.v, zone: x.zone, id: x.id, home: this.homeOf(x.id), generation: this.bridge.generation,
      counts: [n], outcome: null };
    this.phase = "spread";
    return n >= this.maxSize ? this.stopSpread("common") : "spreading";
  }

  /**
   * One generation of a spread: count the carriers, and stop when they reach
   * MAX_SIZE, when none are left, or after SPREAD_MAX generations. "reached"
   * and "enough" can start the fair test; "gone", "short" and "common" cannot,
   * and the child keeps the group they have (not counted as a follow). Before
   * all that, "danger": the child's own group fell to DANGER_SIZE or fewer.
   */
  spreadGeneration() {
    const sp = this.spread, sides = this.sidesFor(sp), n = sides.carriers.length;
    sp.counts.push(n);
    if (this.inDanger) return this.stopSpread("danger");
    const generations = sp.counts.length - 1, ok = canStart(sides, this.minSize, this.maxSize);
    // Enough carriers but too few without it is "common": most here have it.
    const notOk = n >= this.minSize ? "common" : "short";
    if (n >= this.maxSize) return this.stopSpread(ok ? "reached" : notOk);
    if (n === 0) return this.stopSpread("gone");
    if (generations >= this.spreadMax) return this.stopSpread(ok ? "enough" : notOk);
    return "spreading";
  }

  /** @returns {"spread-ready"|"spread-failed"|"spread-danger"} */
  stopSpread(outcome) {
    const sp = this.spread;
    sp.outcome = outcome;
    this.lastSpread = sp;
    this.spread = null;
    this.phase = "watch";
    if (outcome === "reached" || outcome === "enough") return "spread-ready";
    this.idle = 0; // the child just tried: the backup panel waits again
    this.quiet = 0;
    return outcome === "danger" ? "spread-danger" : "spread-failed";
  }

  /**
   * The backup choice panel's options: only variations that can start a fair
   * test right away (scope decision 42), glowing ones first, then others the
   * group has spread. One per trait.
   * @returns {Offer[]}
   */
  pushOptions() {
    const out = [];
    const add = (x) => {
      if (out.length < PUSH_OPTIONS && !out.some((o) => o.v.trait === x.v.trait)) out.push({ v: x.v, id: this.anchorFor(x), zone: x.zone });
    };
    // Only traits that help or hurt there (scope decision 58).
    for (const g of this.glowing) if (this.followable(g) && this.canStartFor(g)) add(g);
    for (const s of spreadVariations(this.bridge, this.lastAnimals, this.minSize, this.maxSize)) if (this.followable(s)) add(s);
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
   * Follow a variation as a fair test: your group becomes carriers in its
   * habitat, the anchor and the nearest, and a twin without it beside each
   * becomes "the others here", the same number on both sides. Then the world
   * fast-forwards.
   * @param {{v:import("./cohorts.js").Variation, id:number, zone:number, home?:any}} x a glow, a spread that can start, or an offer
   * @param {boolean} byChance picked at random on the backup panel because time ran out
   */
  follow(x, byChance) {
    const sides = this.sidesFor(x), anchor = this.anchorFor(x);
    const { mine, theirs } = formCohorts(sides, anchor, this.homeOf, testSize(sides, this.maxSize));
    this.closeChoice();
    this.bridge.followCohorts(mine, theirs);
    const generation = this.bridge.generation;
    this.fair = { v: x.v, zone: x.zone, anchor, generation, mineThen: mine.length, theirsThen: theirs.length };
    this.choices.push({
      group: x.v.group, trait: x.v.trait, neutral: x.v.neutral, byChance, generation, zone: x.zone,
      sizeAtChoice: mine.length, sizeAtEnd: null, othersAtChoice: theirs.length, othersAtEnd: null,
    });
    this.sizeAtChoice = mine.length;
    this.fresh = [];
    this.glowing = [];
    this.started = [];
    this.options = null;
    this.phase = "skip";
    this.skipped = 0;
    this.idle = 0;
    this.quiet = 0;
    this.segment = new Map(); // the group formed again
    this.remember();
    this.formAtPoint = this.lastForm;
    this.markNow();
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
    this.started = [];
    this.options = null;
    if (this.spread) { this.spread.outcome = "ended"; this.lastSpread = this.spread; this.spread = null; }
    this.mainZone = mainZoneOf(this.lastAnimals);
    const segment = [...this.segment.values()], living = this.bridge.livingAnimals();
    this.comparison = comparisonFor(segment, living, this.startCensus);
    this.evidence = evidenceFor(segment, living, this.startCensus);
    // Scope decisions 10, 40 and 41: on every ending, from the group's actual average traits and main habitat
    // when the story ended (its last living members), never its choices. A group that died out and matches no
    // animal is told it didn't have time to change, never the first mammals.
    this.reveal = revealFor(averageOf(this.lastAnimals.map((a) => a.genome)).map((a) => a.mean), this.mainZone, this.startWorld,
      undefined, outcome === "died");
    return "ended";
  }
}

/**
 * @typedef {Object} Glow a newborn in your group with a new variation
 * @property {number} id @property {import("./cohorts.js").Variation} v
 * @property {number} zone its habitat @property {number} generation when it was born
 * @property {number} bornT watchT at its birth @property {number} showAt when it appears on the map, in watchT
 * @property {null|number} since when its glow started, in watchT
 *
 * @typedef {Object} Spread a variation fast-forwarded to see if it spreads (scope decision 42)
 * @property {import("./cohorts.js").Variation} v @property {number} zone the habitat it is counted in
 * @property {number} id the newborn it was seen in @property {null|{x:number,y:number}} home that newborn's home spot
 * @property {number} generation when it started
 * @property {number[]} counts carriers in the habitat at the start and after each generation
 * @property {null|"reached"|"enough"|"gone"|"short"|"common"|"danger"|"ended"} outcome why it stopped: MAX_SIZE
 *   reached, MIN_SIZE or more at SPREAD_MAX, none left, still too few at SPREAD_MAX, too few without it (most here
 *   have it), the child's group at DANGER_SIZE or fewer, or the story ended meanwhile
 *
 * @typedef {Object} Offer an option on the backup choice panel
 * @property {import("./cohorts.js").Variation} v @property {number} id the animal shown
 * @property {number} zone
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
 * @property {number} sizeAtChoice your group's size when it formed (the fair test's size)
 * @property {null|number} sizeAtEnd its size when the next follow replaced it or the story ended
 * @property {number} othersAtChoice @property {null|number} othersAtEnd the others here, the same way
 */
