/**
 * The story loop (scope decisions 6, 32–34, 42, 44, 58 and 59). DOM-free: the
 * page, the moment shortcuts and the measurement scripts drive the same rules.
 *
 * waiting ─tap─▶ watch ─follow─▶ skip ─▶ watch ─▶ … ─▶ ended
 *                  ├─ too rare yet ─▶ passed on? ─▶ follow, or back to watch
 *                  └─ push ─▶ choice ─choose─▶ skip
 *
 * Time waits for the child: no generation runs until an animal is tapped, and
 * the story follows its family from then on. A follow never moves the family
 * (scope decision 59): it starts a fair test inside it, in the place where
 * most of the family lives, the family's animals there with the variation
 * against its animals there without it, twins matched on age and on how well
 * suited they are in every other trait (cohorts.js). Only when the family has
 * too few, animals from nearby fill in. Both groups change only by babies of
 * their own mothers and by deaths, so their counts compare fairly.
 *
 * Between follows the child is active: a newborn in the family with a new
 * variation glows (a few at a time, the ones that can be followed first), and
 * tapping it offers to follow that variation. Only a trait that helps or hurts
 * in the family's place can be followed (scope decision 58), and never the
 * way back from a direction the family already took, unless a fair test
 * clearly showed that direction hurting. A neutral trait, a "~" there or a way
 * back still glows; its card explains instead.
 *
 * A variation too rare to start a test is fast-forwarded to see if it is
 * passed on (scope decision 42): once a full test can start, it does; after
 * SPREAD_MAX generations it starts with what there is, if that is at least
 * MIN_SIZE; otherwise the family goes on as it was, and the try is not one of
 * the child's follows. If the family falls to DANGER_SIZE or fewer, that
 * fast-forward stops at once (scope decision 44), and nothing can be followed
 * until it is bigger again.
 *
 * Glowing babies light up one at a time through the watched day: each
 * generation's babies appear across the day (appearFraction), a new glow
 * starts at most every GLOW_GAP_SECONDS, and a glow is never replaced before
 * GLOW_MIN_SECONDS. The calm rule still allows GLOW_MAX at once, and a glow
 * still ends after GLOW_GENERATIONS.
 *
 * If the child follows nothing for PUSH_SECONDS, a choice panel offers
 * variations that can start a test, as a backup. At most STORY_CHOICES
 * follows. The story ends at STORY_GENERATIONS, or when the family dies out.
 *
 * Nothing here touches the biology. Following is observer state only.
 */

import { averageOf, carries, formOf } from "./variations.js";
import { matters, variationEffect, reasonsIn, guessFor, but, whyLine, shortfall } from "./why.js";
import { CLUE_FROM, census, evidenceFor, sameTraitClue } from "./evidence.js";
import { shortGroup, your } from "./narration.js";
import { revealFor } from "./reveal.js";
import { better } from "./groups.js";
import {
  GLOW_GENERATIONS, GLOW_MAX, MAX_SIZE, MIN_SIZE, PUSH_OPTIONS,
  familyVariations, formFamilyTest, newbornVariation, placeOf, sameVariation,
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
/** A variation too rare to start a fair test is fast-forwarded at most this many generations to see if it is passed on. */
export const SPREAD_MAX = 10;
/** The child's family this small or smaller stops a fast-forward, and keeps any follow from starting (scope decision 44). */
export const DANGER_SIZE = 5;
/** A glowing baby is never replaced by a newer one before it has glowed this long (seconds of watching). */
export const GLOW_MIN_SECONDS = 10;
/** New glows start at least this far apart (seconds of watching), so babies light up one at a time. */
export const GLOW_GAP_SECONDS = 4;
/** The family tree strip shows at most this many of a baby's mother line, the baby included (scope decision 61). */
export const TREE_DEPTH = 4;
/** A watched generation's babies appear over this much of its day; the rest of the day is quiet. */
export const APPEAR_SPAN = 0.8;
/** A chosen trait has faded from the family when fewer of its animals than this still have it ("Your family so far"). */
export const FADED_BELOW = 3;
/**
 * Some of the family is moving to a place when this many of its animals live there,
 * and at least a tenth of the family, after fewer did (scope decision 59). Told once a story for each place.
 */
export const MOVING_AT = 5;
/**
 * The family's place changes only when another place has clearly more of it:
 * this many more animals, and a quarter more (scope decision 59). So fair tests
 * don't flip between two places the family shares about evenly.
 */
export const PLACE_MARGIN = 3;
/** A sudden drop: the family loses this share of itself in one watched generation (and at least 3), mostly as the least suited. */
export const DROP_SHARE = 0.25;
/** A tap-to-guess question comes at most once in this many generations (scope decision 60). */
export const GUESS_GAP = 4;
/** A fair test's result is asked about from the end of its fast-forward until this many generations after the follow. */
export const RESULT_BY = 5;

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
    /** @type {Set<number>} newborns the child tried to follow with a fast-forward: they stop glowing */
    this.dismissed = new Set();
    /** @type {null|Spread} a variation being fast-forwarded to see if it is passed on */
    this.spread = null;
    /** @type {null|Spread} the latest such fast-forward, once it has stopped */
    this.lastSpread = null;
    /** seconds of story since the latest follow (or the start) */
    this.idle = 0;
    /** seconds watched since the latest fast-forward ended (or the start) */
    this.quiet = 0;
    this.skipped = 0;
    /** the family's size when the story began */
    this.sizeAtStart = 0;
    this.startGeneration = 0;
    this.endGeneration = null;
    /** @type {null|"died"|"survived"} */
    this.outcome = null;
    /** @type {Array<{id:number, genome:ArrayLike<number>, zone:number}>} the family's animals at the start, for the ending */
    this.startAnimals = [];
    /** @type {Array<{id:number, genome:ArrayLike<number>, zone:number}>} the family's animals last alive */
    this.lastAnimals = [];
    this.lastForm = null;
    /** the family's usual form right after the latest follow */
    this.formAtPoint = null;
    /** how many animals had each trait word in each habitat when the story began (evidence.js) */
    this.startCensus = null;
    /** @type {null|import("./evidence.js").Evidence} the ending's one-line clue, when no same-trait clue qualifies */
    this.evidence = null;
    /** the place most of the family lived in at the end */
    this.mainZone = null;
    /** the whole world's mean for each trait at the start: the base for relative reveal levels */
    this.startWorld = null;
    /** @type {null|{animal: import("./reveal.js").RevealAnimal, why:string[], whyPast:string[], matched:number, checked:number, strength:number}} */
    this.reveal = null;
    /** @type {Map<number, {id:number, genome:ArrayLike<number>, zone:number}>} everyone in the family since the story began */
    this.segment = new Map();
    /** @type {null|string} the family's name, picked by the child right after the first tap ("Mossfoot", names.js) */
    this.name = null;
    /** seconds of watching: glows start and last by this clock, which stands still during fast-forwards and panels */
    this.watchT = 0;
    /** when the latest glow started, in watchT */
    this.lastGlowAt = -Infinity;
    /** @type {null|{generation:number, living:number[], family:number}} who was alive at the latest follow (or the start), and the family's size then */
    this.mark = null;
    /** @type {Glow[]} glows started since the page last asked (takeStarted), to name each baby as it lights up */
    this.started = [];
    /** @type {Chip[]} "Your family so far": each chosen trait, and whether it has faded (scope decision 59) */
    this.chips = [];
    /** @type {Map<number, {dir:number, hurt:boolean}>} by trait: the way the family went, and whether a fair test showed it hurting */
    this.went = new Map();
    /** how many of the family live in each place, a generation ago */
    this.placesBefore = [0, 0, 0];
    /** @type {null|{zone:number, main:boolean}} a real move this generation, to narrate: some are moving there, or most live there now */
    this.moved = null;
    /** the places some of the family has been told to be moving to, once each */
    this.movedTo = new Set();
    /** the family's place (where most of it lives), worked out once a generation */
    this.place = 0;
    /** @type {Map<string, ReturnType<typeof formFamilyTest>>} fair tests as they would start now, this generation */
    this.tests = new Map();
    /** @type {{helping:import("./why.js").Reason[], hurting:import("./why.js").Reason[]}} what helps and hurts the family in its place now */
    this.reasons = { helping: [], hurting: [] };
    /** @type {null|number[][][]} how many had each trait word in each place when all three places first had CLUE_FROM animals */
    this.clueCensus = null;
    /** @type {null|import("./evidence.js").SameTrait} the ending's clue: the same trait in different places */
    this.clue = null;
    /** when the latest tap-to-guess question came */
    this.guessedAt = -Infinity;
    /** @type {Map<number, {id:number, genome:ArrayLike<number>, zone:number}>} the family a generation ago */
    this.before = new Map();
  }

  get running() { return this.phase === "watch" || this.phase === "skip" || this.phase === "spread"; }
  /** The world fast-forwards: after a follow, and while a variation is seen being passed on. */
  get fast() { return this.phase === "skip" || this.phase === "spread"; }
  get lasted() { return (this.endGeneration ?? this.bridge.generation) - this.startGeneration; }
  /** The child's animals are always a family: a follow never moves it (scope decision 59). */
  get noun() { return "family"; }
  /** Follows are left, so newborns can glow and be followed. */
  get canFollow() { return this.choices.length < STORY_CHOICES; }
  /** The child can follow right now: while watching, never during a fast-forward or a panel. */
  get followOpen() { return this.phase === "watch" && this.canFollow; }
  /** The child's family is very small: no follow starts, no fast-forward goes on, and the backup panel waits (scope decision 44, playtest). */
  get inDanger() { return this.bridge.followedIds().length <= DANGER_SIZE; }

  /** Where a fair test would be: the place where most of the family lives (scope decision 59). */
  testZone() { return this.place; }

  /**
   * Why a glowing baby's variation can't be followed, or null when it can:
   * "away", the baby lives away from the family's place, where the test would
   * be (scope decision 59); "neutral" or "little" (a "~" there, scope decision
   * 58); or "back", the way back from a direction the family already took
   * (scope decision 59), unless a fair test clearly showed that direction
   * hurting; or "common": MAX_SIZE or more of the family there have it already,
   * yet too few without it are twins for a fair test, so no fast-forward could help.
   * @param {{id:number, v:import("./cohorts.js").Variation}} x
   * @returns {null|"away"|"neutral"|"little"|"back"|"common"}
   */
  whyNot(x) {
    if (this.bridge.zoneOf(x.id) !== this.testZone()) return "away";
    if (x.v.neutral) return "neutral";
    if (!matters(x.v.t, this.testZone())) return "little";
    const w = this.went.get(x.v.t);
    if (w && w.dir !== x.v.dir && !w.hurt) return "back";
    if (this.carriersOf(x.v) >= this.maxSize && !this.canStartFor(x)) return "common";
    return null;
  }

  /** Only a trait that helps or hurts in the family's place, and never the way back without a reason, can be followed. */
  followable(x) { return this.whyNot(x) === null; }

  /** A way back the family may take, because a fair test clearly showed the way it went hurting ("Go back?"). */
  goesBack(x) {
    const w = this.went.get(x.v.t);
    return !!w && w.dir !== x.v.dir && w.hurt;
  }

  /** The fair test's group with the variation, now against when it formed. */
  get mine() { return { now: this.bridge.mineIds().length, then: this.fair ? this.fair.mineThen : 0 }; }
  /** Their twins without it, the same way. */
  get theirs() { return { now: this.bridge.otherIds().length, then: this.fair ? this.fair.theirsThen : 0 }; }
  /** The whole family, now against when the story began. */
  get family() { return { now: this.bridge.followedIds().length, then: this.sizeAtStart }; }

  /** The child taps an animal and follows its family. Time starts now. */
  begin(id) {
    const follow = this.bridge.followFamilyOf(id);
    /** the animal the child tapped first: the family tree's first mother (scope decision 61) */
    this.firstId = id;
    this.startGeneration = this.bridge.generation;
    this.remember();
    this.phase = "watch";
    this.sizeAtStart = this.lastAnimals.length;
    this.startAnimals = this.lastAnimals;
    this.placesBefore = this.countPlaces();
    const world = this.bridge.livingAnimals();
    this.startCensus = census(world);
    this.startWorld = averageOf(world.map((a) => a.genome)).map((a) => a.mean);
    this.markNow();
    return follow;
  }

  /** Who is alive now, and how big the family is: the "then" of every group's count until the next follow. */
  markNow() { this.mark = { generation: this.bridge.generation, living: this.bridge.livingIds(), family: this.bridge.followedIds().length }; }

  remember() {
    this.lastAnimals = this.bridge.followedAnimals();
    this.lastForm = formOf(this.lastAnimals.map((a) => a.genome));
    if (this.lastAnimals.length) {
      // The place where most of the family lives, kept until another place clearly has more (PLACE_MARGIN).
      const n = this.countPlaces(), most = placeOf(this.lastAnimals), here = n[this.place];
      if (this.phase === "waiting" || !here || (n[most] >= here + PLACE_MARGIN && n[most] >= here * 1.25)) this.place = most;
    }
    for (const a of this.lastAnimals) this.segment.set(a.id, a);
    this.tests.clear();
    this.reasons = reasonsIn(this.lastAnimals.filter((a) => a.zone === this.place), this.place);
    if (!this.clueCensus && this.bridge.zoneCounts().every((n) => n >= CLUE_FROM)) this.clueCensus = census(this.bridge.livingAnimals());
  }

  /** How many of the family live in each place now. */
  countPlaces() {
    const n = [0, 0, 0];
    for (const a of this.lastAnimals) n[a.zone]++;
    return n;
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
    const mainBefore = this.place;
    this.before = new Map(this.lastAnimals.map((a) => [a.id, a])); // the family a generation ago, for why some died
    this.remember();
    this.noticeMoves(mainBefore);
    this.checkTest();
    this.updateChips();
    if (ev.generation >= STORY_GENERATIONS) return this.end("survived", ev.generation);
    this.updateGlow(ev);
    if (this.phase === "spread") return this.spreadGeneration();
    if (this.phase === "skip") {
      if (++this.skipped < SKIP_GENERATIONS) return null;
      this.phase = "watch";
      this.quiet = 0;
      return "skip-done";
    }
    // The push: nothing followed for a while, so a choice panel opens as a backup (never while the family is very small).
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
   * A real move over generations (scope decision 59): the family's place is
   * another one now, or for the first time this story MOVING_AT or more (and a
   * tenth of the family) live in a place where fewer did a generation ago.
   * Kept in `moved` for the page to narrate.
   */
  noticeMoves(mainBefore) {
    const now = this.countPlaces(), total = this.lastAnimals.length, before = this.placesBefore;
    this.placesBefore = now;
    this.moved = null;
    if (this.place !== mainBefore) { this.movedTo.add(this.place); this.moved = { zone: this.place, main: true }; return; }
    const enough = (n) => n >= MOVING_AT && n >= total / 10;
    for (const z of [0, 1, 2]) {
      if (z === this.place || this.movedTo.has(z) || !enough(now[z]) || enough(before[z])) continue;
      this.movedTo.add(z);
      this.moved = { zone: z, main: false };
      return;
    }
  }

  /**
   * The latest fair test clearly shows the direction the family took hurting
   * (the "yours" group doing worse by a tenth or more, and fewer): the way back
   * may now be followed, with its reason (scope decision 59).
   */
  checkTest() {
    const f = this.fair;
    if (!f || !this.bridge.test) return;
    const w = this.went.get(f.v.t);
    if (w && w.dir === f.v.dir && !w.hurt && this.mine.now < this.theirs.now && better(this.mine, this.theirs) < 0) w.hurt = true;
  }

  /**
   * "Your family so far": a chosen trait has faded when fewer than FADED_BELOW
   * of the family still have it; the reason is whether it hurt in the family's place.
   */
  updateChips() {
    for (const chip of this.chips) {
      const have = this.lastAnimals.filter((a) => carries(a.genome, chip.v)).length;
      chip.faded = have >= FADED_BELOW ? null : variationEffect(chip.v.t, chip.v.dir, this.place) < 0 ? "hurt" : "lost";
    }
  }

  /**
   * The calm rule: of the newborns in the family with a new variation this
   * generation or the one before, at most GLOW_MAX glow, the ones that can be
   * followed first, then the newest, one per variation. A watched
   * generation's babies appear across its day (appearFraction), and each can
   * glow once it has appeared; glows start as the day goes on (advance).
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

  /** Drop the glows that are over (too old, gone from the family, or tried), then start any that may. */
  refreshGlow(generation = this.bridge.generation) {
    this.fresh = this.fresh.filter((x) => generation - x.generation < this.glowGenerations &&
      this.bridge.isFollowed(x.id) && !this.dismissed.has(x.id));
    this.glowing = this.glowing.filter((x) => this.fresh.includes(x));
    return this.startGlows();
  }

  /**
   * Which newborns glow now. A glow younger than GLOW_MIN_SECONDS stays; the
   * other places go to the best of the babies that have appeared (the ones
   * that can be followed first, then the newest), one per variation, at most
   * GLOW_MAX; a new glow waits until GLOW_GAP_SECONDS after the last one
   * started. Glows start only while the world is watched.
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

  /**
   * Why the family changed size this generation, from the table (scope
   * decision 60). Growing: its biggest helper there, and "But …" its biggest
   * hurter. Shrinking, most of it crowded out: the helper, then "But …" the
   * hurter; with no hurter, the trait that most sets the ones that died apart
   * from the survivors where they lived ("Long back legs help them run fast."
   * "Others here have longer back legs."), and with none, that the place is
   * full. A family that shrank because its oldest died says so; one that grew
   * with no helper had many babies.
   * @param {import("./bridge.js").GenerationEvents} ev
   */
  changeReasons(ev) {
    const g = ev.group;
    if (!g || g.count === g.before) return [];
    const { helping, hurting } = this.reasons, help = helping[0]?.line, hurt = hurting[0]?.line;
    if (g.count > g.before) return help ? [help, ...(hurt ? [but(hurt)] : [])] : hurt ? [] : ["Lots of babies were born."];
    if (this.oldAgeMostly(g, ev.deaths)) return ["Some were old and died."];
    if (hurt) return [...(help ? [help] : []), but(hurt)];
    const sf = this.deathShortfall(ev);
    return sf ? [sf.line, sf.who] : ["The place is full, so some made room."];
  }

  /** Most of the family's deaths this generation were of old age. */
  oldAgeMostly(g, deaths) {
    const gone = new Set(g.gone), old = deaths.filter((d) => gone.has(d.id) && d.cause === "maximum_age").length;
    return old * 2 >= g.gone.length;
  }

  /**
   * What most set the family's animals that died this generation apart from
   * the survivors in the place where most of them lived (why.js shortfall):
   * the trait, its place, its line, and who had more of it. Null when no one
   * trait did, by SHORT_BY or more: then they were a little less suited in
   * many small ways.
   * @param {import("./bridge.js").GenerationEvents} ev
   */
  deathShortfall(ev) {
    const dead = ev.group.gone.map((id) => this.before.get(id)).filter(Boolean);
    if (!dead.length) return null;
    const n = [0, 0, 0];
    for (const a of dead) n[a.zone]++;
    const zone = n.indexOf(Math.max(...n)), born = new Set(ev.births.map((b) => b.childId));
    const survivors = this.bridge.livingAnimals().filter((a) => a.zone === zone && !born.has(a.id));
    const sf = shortfall(dead.filter((a) => a.zone === zone), survivors, zone);
    return sf && { ...sf, zone, who: sf.theirs ? `Others here have ${sf.more}.` : `The ones that died had ${sf.more}.` };
  }



  /**
   * A tap-to-guess question now, or null (scope decision 60). After a fair
   * test's fast-forward, once its result is clear and goes the table's way:
   * "Why are the ones with bigger eyes doing better?". After a sudden drop of
   * the family, mostly crowded out: "Why is your family shrinking?", about its
   * biggest hurter there, or the trait that most set the ones that died apart.
   * The three options are the trait's lines for the three places. At most one
   * every GUESS_GAP generations.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @returns {null|import("./why.js").Guess}
   */
  guessNow(ev) {
    if (this.phase !== "watch" || ev.generation - this.guessedAt < GUESS_GAP) return null;
    const f = this.fair, g = ev.group;
    if (f && !f.asked) {
      const since = ev.generation - f.generation;
      if (since >= 2) {
        const b = better(this.mine, this.theirs), expected = variationEffect(f.v.t, f.v.dir, f.zone);
        if (b !== 0 || since >= RESULT_BY) f.asked = true;
        if (b !== 0 && b === expected) {
          this.guessedAt = ev.generation;
          return guessFor(`Why are the ones with ${shortGroup(f.v.group)} doing ${b > 0 ? "better" : "worse"}?`, f.v.t, f.zone);
        }
      }
    }
    if (g && g.before - g.count >= 3 && g.count <= (1 - DROP_SHARE) * g.before && !this.oldAgeMostly(g, ev.deaths)) {
      // Crowded out: its biggest hurter there, or else the trait that most set the ones that died apart.
      const hurt = this.reasons.hurting[0], sf = hurt ? null : this.deathShortfall(ev);
      if (hurt || sf) {
        this.guessedAt = ev.generation;
        return guessFor(`Why is ${your("family", this.name)} shrinking?`, hurt ? hurt.t : sf.t, hurt ? this.place : sf.zone, sf ? sf.who : null);
      }
    }
    return null;
  }

  /** The table's reason for a variation in the family's place, for the passed-on lines (scope decision 60). */
  whyHere(v) { return whyLine(v.t, this.testZone()); }

  /**
   * The family tree strip (scope decision 61): the animal the child tapped
   * first, then the real mother line of the latest followed baby, from
   * great-grandmother to mother to this baby, drawn from their real bodies.
   * Followed babies are not each other's mothers, so the line is the baby's
   * own. It goes back as far as the story knows a mother's body (every family
   * member since the story began, and anyone alive). Before any follow, the
   * line is the first one tapped and her own mothers.
   * @returns {{first:TreeAnimal, line:TreeAnimal[], joined:boolean}} joined: the first one is in the line
   */
  familyTree() {
    const last = this.choices[this.choices.length - 1], baby = last ? last.anchor : this.firstId;
    const known = (id) => this.segment.get(id) ?? (this.bridge.get(id) ? this.bridge.animal(id) : null);
    const line = [];
    for (let id = baby; typeof id === "number" && line.length < TREE_DEPTH; id = this.bridge.families.mother.get(id)) {
      const a = known(id);
      if (!a) break;
      line.unshift(a);
    }
    const labels = last ? ["This baby", "Mother", "Grandmother", "Great-grandmother"] : ["First mother", "Mother", "Grandmother", "Great-grandmother"];
    const tree = line.map((a, i) => ({ ...a, label: labels[line.length - 1 - i] }));
    const joined = tree.some((a) => a.id === this.firstId);
    for (const a of tree) if (a.id === this.firstId && last) a.label = `${a.label}, first mother`;
    return { first: { ...(known(this.firstId) ?? tree[0]), label: "First mother" }, line: tree, joined };
  }

  /** The glows started since the last call, oldest first. */
  takeStarted() {
    const started = this.started;
    this.started = [];
    return started;
  }

  /** @returns {null|Glow} */
  glowFor(id) { return this.glowing.find((x) => x.id === id) ?? null; }

  /** The fair test on this variation as it would start now, in the family's place (cohorts.js), worked out once a generation. */
  testFor(x) {
    const key = `${x.v.trait}:${x.v.dir}:${x.v.thr}:${x.id}`;
    if (!this.tests.has(key)) {
      this.tests.set(key, formFamilyTest(this.bridge, x.v, {
        zone: this.testZone(), family: this.bridge.follow?.members ?? new Set(), anchor: x.id,
        chosen: this.choices.map((c) => c.v), homeOf: this.homeOf, min: this.minSize, max: this.maxSize,
      }));
    }
    return this.tests.get(key);
  }

  /** A fair test can start now: MIN_SIZE pairs, the family's first and then from nearby. */
  canStartFor(x) { return this.testFor(x).mine.length >= this.minSize; }

  /** How big a fair test on this variation would be now: its pairs, at most MAX_SIZE. */
  sizeFor(x) { return this.testFor(x).mine.length; }

  /** How many of the family's animals in its place have the variation. */
  carriersOf(v) {
    return this.lastAnimals.filter((a) => a.zone === this.place && carries(a.genome, v)).length;
  }

  /**
   * Too few have the variation to start a fair test right away, so the world
   * fast-forwards to see if it is passed on (scope decision 42). The newborn
   * stops glowing; the family lives on meanwhile, as usual. While the family
   * is at DANGER_SIZE or fewer, none starts (the card offers only "Keep looking").
   * @param {Glow} x
   * @returns {null|"spreading"|"spread-failed"}
   */
  trySpread(x) {
    if (this.inDanger || !this.followable(x)) return null;
    this.dismissed.add(x.id);
    this.refreshGlow();
    const n = this.carriersOf(x.v);
    this.spread = { v: x.v, zone: this.testZone(), id: x.id, home: this.homeOf(x.id), generation: this.bridge.generation,
      counts: [n], outcome: null };
    this.phase = "spread";
    return "spreading";
  }

  /**
   * One generation of a fast-forward: count the family's carriers in its
   * place, and stop when a full fair test can start, when none are left, or
   * after SPREAD_MAX generations. "reached" and "enough" start the fair test;
   * "gone", "short" and "common" don't, and the family goes on as it was (not
   * counted as a follow). Before all that, "moved": the family's place changed,
   * and "danger": the family fell to DANGER_SIZE or fewer.
   */
  spreadGeneration() {
    const sp = this.spread;
    // The family's place changed: the test would be somewhere else, so this one stops.
    if (this.testZone() !== sp.zone) return this.stopSpread("moved");
    const n = this.carriersOf(sp.v);
    sp.counts.push(n);
    if (this.inDanger) return this.stopSpread("danger");
    const size = this.sizeFor(sp), generations = sp.counts.length - 1;
    if (size >= this.maxSize) return this.stopSpread("reached");
    if (n === 0) return this.stopSpread("gone");
    if (generations >= this.spreadMax) return this.stopSpread(size >= this.minSize ? "enough" : n >= this.maxSize ? "common" : "short");
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
   * The backup choice panel's options: only variations that can be followed
   * (scope decisions 58–59) and can start a fair test right away (scope
   * decision 42), glowing ones first, then others the family has spread in its
   * place. One per trait.
   * @returns {Offer[]}
   */
  pushOptions() {
    const out = [];
    const add = (x) => {
      if (out.length < PUSH_OPTIONS && !out.some((o) => o.v.trait === x.v.trait)) out.push({ v: x.v, id: this.anchorFor(x), zone: x.zone });
    };
    for (const g of this.glowing) if (this.followable(g) && this.canStartFor(g)) add(g);
    const here = this.lastAnimals.filter((a) => a.zone === this.place);
    for (const x of familyVariations(here, this.place)) if (this.followable(x) && this.canStartFor(x)) add(x);
    return out;
  }

  /** The animal a test starts from: this one if it is among the test's animals, else the first of them. */
  anchorFor(x) {
    const t = this.testFor(x);
    return t.mine.includes(x.id) || !t.mine.length ? x.id : t.mine[0];
  }

  /**
   * Follow a variation as a fair test inside the family: its animals with the
   * variation in the family's place against their twins without it; nearby
   * animals fill in only when the family has too few. The family stays as it
   * is. Then the world fast-forwards.
   * @param {{v:import("./cohorts.js").Variation, id:number, zone:number, home?:any}} x a glow, a fast-forward that can start, or an offer
   * @param {boolean} byChance picked at random on the backup panel because time ran out
   */
  follow(x, byChance) {
    const zone = this.testZone(), test = this.testFor(x), back = this.goesBack(x);
    this.closeChoice();
    this.bridge.startTest(test.mine, test.theirs);
    const generation = this.bridge.generation;
    this.fair = { v: x.v, zone, anchor: x.id, generation, mineThen: test.mine.length, theirsThen: test.theirs.length,
      fromFamily: test.fromFamily, fromNearby: test.fromNearby };
    this.choices.push({
      v: x.v, group: x.v.group, trait: x.v.trait, neutral: x.v.neutral, byChance, generation, zone, back, anchor: x.id,
      sizeAtChoice: test.mine.length, sizeAtEnd: null, othersAtChoice: test.theirs.length, othersAtEnd: null,
      fromFamily: test.fromFamily, fromNearby: test.fromNearby,
    });
    // The way the family went on this trait; "Your family so far" gets its chip (a way back replaces the old one).
    this.went.set(x.v.t, { dir: x.v.dir, hurt: false });
    this.chips = this.chips.filter((c) => c.v.t !== x.v.t);
    this.chips.push({ v: x.v, faded: null });
    this.fresh = [];
    this.glowing = [];
    this.started = [];
    this.options = null;
    this.phase = "skip";
    this.skipped = 0;
    this.idle = 0;
    this.quiet = 0;
    this.remember();
    this.formAtPoint = this.lastForm;
    this.markNow();
  }

  /** The latest follow's groups are about to be replaced, or the story ends: note their sizes. */
  closeChoice() {
    const last = this.choices[this.choices.length - 1];
    if (last && last.sizeAtEnd === null) {
      last.sizeAtEnd = this.mine.now;
      last.othersAtEnd = this.theirs.now;
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
    this.mainZone = placeOf(this.lastAnimals);
    const segment = [...this.segment.values()], living = this.bridge.livingAnimals();
    // The clue: the same trait in different places (scope decision 60), a trait the family chose first; else one line.
    this.clue = sameTraitClue(this.clueCensus ?? this.startCensus, census(living), this.choices.map((c) => c.v.t));
    this.evidence = this.clue ? null : evidenceFor(segment, living, this.startCensus);
    // Scope decisions 10, 40 and 41: on every ending, from the family's actual average traits and main place
    // when the story ended (its last living animals), never its choices. A family that died out and matches no
    // animal is told it didn't have time to change, never the first mammals.
    this.reveal = revealFor(averageOf(this.lastAnimals.map((a) => a.genome)).map((a) => a.mean), this.mainZone, this.startWorld,
      undefined, outcome === "died");
    return "ended";
  }
}

/**
 * @typedef {Object} Glow a newborn in your family with a new variation
 * @property {number} id @property {import("./cohorts.js").Variation} v
 * @property {number} zone the place it lives in @property {number} generation when it was born
 * @property {number} bornT watchT at its birth @property {number} showAt when it appears on the map, in watchT
 * @property {null|number} since when its glow started, in watchT
 *
 * @typedef {Object} Spread a variation fast-forwarded to see if it is passed on (scope decision 42)
 * @property {import("./cohorts.js").Variation} v @property {number} zone the place it is counted in (the family's)
 * @property {number} id the newborn it was seen in @property {null|{x:number,y:number}} home that newborn's home spot
 * @property {number} generation when it started
 * @property {number[]} counts the family's carriers in its place at the start and after each generation
 * @property {null|"reached"|"enough"|"gone"|"short"|"common"|"moved"|"danger"|"ended"} outcome why it stopped: a full
 *   test can start, MIN_SIZE or more at SPREAD_MAX, none left, still too few at SPREAD_MAX, too few twins without it,
 *   the family's place changed, the family at DANGER_SIZE or fewer, or the story ended meanwhile
 *
 * @typedef {Object} Offer an option on the backup choice panel
 * @property {import("./cohorts.js").Variation} v @property {number} id the animal shown
 * @property {number} zone
 *
 * @typedef {Object} FairTest the latest follow's two groups
 * @property {import("./cohorts.js").Variation} v @property {number} zone the family's place
 * @property {number} anchor the newborn it started from
 * @property {boolean} [asked] its result was asked about (tap-to-guess), or it passed without a clear one
 * @property {number} generation @property {number} mineThen @property {number} theirsThen
 * @property {number} fromFamily of yours, how many are the family's @property {number} fromNearby and how many filled in from nearby
 *
 * @typedef {Object} Choice
 * @property {import("./cohorts.js").Variation} v
 * @property {string} group "a darker coat": what the followed animals have
 * @property {string} trait engine trait name
 * @property {boolean} neutral an engine neutral trait (never followed since scope decision 58)
 * @property {boolean} byChance picked at random on the backup panel because time ran out
 * @property {boolean} back the way back from a direction a fair test showed hurting ("Go back?")
 * @property {number} generation when it was followed
 * @property {number} zone the place of the fair test
 * @property {number} sizeAtChoice yours with it when the test formed
 * @property {null|number} sizeAtEnd yours when the next follow replaced it or the story ended
 * @property {number} othersAtChoice @property {null|number} othersAtEnd the twins without it, the same way
 * @property {number} fromFamily @property {number} fromNearby
 * @property {number} anchor the baby (or animal) the follow started from
 *
 * @typedef {Object} TreeAnimal an animal on the family tree strip
 * @property {number} id @property {ArrayLike<number>} genome its real body @property {number} zone
 * @property {string} label "Great-grandmother", "Mother", "This baby", "First mother"
 *
 * @typedef {Object} Chip a trait on "Your family so far" (scope decision 59)
 * @property {import("./cohorts.js").Variation} v
 * @property {null|"hurt"|"lost"} faded null while at least FADED_BELOW of the family have it
 */
