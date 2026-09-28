/**
 * The story loop (scope decisions 6, 32–34, 42, 44, 58–60, 64–70). DOM-free:
 * the page, the moment shortcuts and the measurement scripts drive the same rules.
 *
 * waiting ─tap─▶ place ─choose a place─▶ moving ─▶ watch ─follow─▶ rise ─▶ watch ─▶ … ─▶ ended
 *                                                    │                       └─ the line dies out ─▶ back to the line before ─▶ watch
 *                                                    └─ push ─▶ choice ─choose─▶ rise
 *
 * The first choice is where the family will live (scope decision 70, with
 * `places`): the world runs on to the family's first babies, a card for each
 * place shows a baby of the family living there, and choosing one makes the
 * family's animals there the line; the world fast-forwards while the line
 * fills the place, and from then on a baby joins the line only when it lives
 * there too. Without `places`, the tap goes straight to watch.
 *
 * Time waits for the child: no generation runs until an animal is tapped, and
 * the story follows its family from then on. Following a glowing baby's
 * variation (scope decisions 67 and 68) narrows the line to its animals with
 * that variation in its place, and from then on a baby joins the line when a
 * parent is in it and it inherited the latest followed variation. The rest of
 * the old line there are the child's relatives (bridge.js). There are no
 * twins and no gate.
 *
 * After a follow the world fast-forwards while the variation's count in the
 * line rises, and stops once it reaches RISE_TO, as soon as it stops rising
 * or falls, or after RISE_MAX generations; the page holds the whole line in
 * view meanwhile, so no one dies off screen (scope decision 68: stopping it
 * before anyone of the line would be crowded out, the look-ahead, stopped
 * nearly every fast-forward at once). A follow of fewer than FAST_FROM has no
 * fast-forward: its line is watched in real time from the start, so every
 * harmful decline is seen (scope decision 69). Then the child watches in real
 * time, with the table's reason: the line growing on a trait that helps
 * there, dying off on one that hurts, about as well as the relatives on one
 * that doesn't matter.
 *
 * A line that dies out goes back to the line before it (scope decision 68):
 * its "Why?" right there, then "They didn't make it. Back to your line.", and
 * the follow doesn't count. If the line before is gone too, back again. The
 * story ends only when the child's whole line is gone, or at its last
 * generation.
 *
 * A "Why?" is a tap-to-guess question only the first time a trait's result
 * appears in a place, when it becomes a Field Guide discovery on this iPad;
 * after that, and for a "Why?" that is no discovery, the table's reason is
 * told as a line, with no guess (scope decision 69).
 *
 * Between follows the child is active: a newborn in the line with a new
 * variation glows (a few at a time, the ones that can be followed first, and
 * of those, traits that help or hurt in the line's place; while one of those
 * glows or can, at most one glowing baby has a trait that doesn't matter
 * there, scope decision 69), and tapping it offers to follow that variation.
 * Any trait in the line's place
 * can be followed, a neutral trait or a "~" there too, with no hint that it
 * doesn't matter (scope decision 65); never the way back from a direction the
 * line already took, unless the line clearly dying off showed that direction
 * hurting. While the line is at DANGER_SIZE or fewer, no follow starts (scope
 * decision 44).
 *
 * Glowing babies light up one at a time through the watched day: each
 * generation's babies appear across the day (appearFraction), a new glow
 * starts at most every GLOW_GAP_SECONDS, and a glow is never replaced before
 * GLOW_MIN_SECONDS. The calm rule still allows GLOW_MAX at once, and a glow
 * still ends after GLOW_GENERATIONS.
 *
 * If the child follows nothing for PUSH_SECONDS, a choice panel offers
 * variations that can be followed, as a backup. At most STORY_CHOICES
 * follows. The story ends at its length, STORY_GENERATIONS unless the
 * teacher's ?length= asks for more (scope decision 64).
 *
 * Nothing here touches the biology. Following is observer state only.
 */

import { averageOf, carries, formOf } from "./variations.js";
import { variationEffect, reasonsIn, guessFor, but, whyLine, shortfall } from "./why.js";
import { CLUE_FROM, census, evidenceFor, sameTraitClue } from "./evidence.js";
import { babyLabel, diedQuestion, growingQuestion, dyingQuestion, sameQuestion, OTHER_TRAITS, growingLine, dyingOffLine, sameLine, PLACE_LABELS } from "./narration.js";
import { revealFor } from "./reveal.js";
import { guideEntry } from "./reflection.js";
import { GLOW_GENERATIONS, GLOW_MAX, PUSH_OPTIONS, familyVariations, newbornVariation, placeOf, sameVariation } from "./cohorts.js";

/** Real seconds per generation while watching. */
export const GENERATION_SECONDS = 20;
/** Real seconds per generation while fast-forwarding. */
export const FAST_SECONDS = 2;
/** Seconds the child has to choose on the backup choice panel before one option is picked at random. */
export const CHOICE_SECONDS = 20;
/** At most this many follows in a story. */
export const STORY_CHOICES = 15;
/** Every story that lasts ends at this generation of its world, by default (scope decision 64; it was 76). */
export const STORY_GENERATIONS = 50;
/** The full-length story, for the teacher: ?length=76 (scope decision 64). The longest a story can be. */
export const FULL_STORY_GENERATIONS = 76;
/**
 * With fewer generations of the story's length than this left in the world,
 * "Try another family" first asks "This world is nearly over. Start a new
 * world?" (scope decision 64). Also the shortest a story can be asked to be.
 */
export const NEARLY_OVER = 25;

/**
 * The story's length from the page's ?length=: a whole number of generations
 * from NEARLY_OVER to FULL_STORY_GENERATIONS, else STORY_GENERATIONS.
 * @param {null|string|undefined} text
 */
export function storyLength(text) {
  const n = /^\d+$/.test(String(text ?? "").trim()) ? Number(text) : NaN;
  return n >= NEARLY_OVER && n <= FULL_STORY_GENERATIONS ? n : STORY_GENERATIONS;
}

/** Few generations of the story's length are left in the world now (scope decision 64). */
export const nearlyOver = (generation, length) => length - generation < NEARLY_OVER;
/** With no follow for this many seconds of story, the backup choice panel opens. */
export const PUSH_SECONDS = 120;
/**
 * After a follow the world fast-forwards while the followed trait's count in
 * the line is still rising (scope decision 67): it stops once the count
 * reaches RISE_TO, as soon as it stops rising or falls, or after RISE_MAX
 * generations, and the child watches in real time.
 */
export const RISE_TO = 20;
export const RISE_MAX = 15;
/** A follow whose line has fewer than this many with the trait has no fast-forward: it is watched in real time from the start (scope decision 69). */
export const FAST_FROM = 3;
/**
 * The first choice, "Where will your family live?" (scope decision 70): the
 * world then fast-forwards until PLACE_TO of the line live in the chosen
 * place, or for at most PLACE_MAX generations (the Part 1 target: 20 within 4
 * generations), or until the line dies out. A line already at PLACE_TO there
 * has none.
 */
export const PLACE_TO = 20;
export const PLACE_MAX = 4;
/** The relatives the place choice makes carry this mark; a follow after it counts from the next one (bridge.js). */
export const HOME_MARK = 1;
/** The child's line this small or smaller keeps any follow from starting (scope decision 44). */
export const DANGER_SIZE = 5;
/** A glowing baby is never replaced by a newer one before it has glowed this long (seconds of watching). */
export const GLOW_MIN_SECONDS = 10;
/** New glows start at least this far apart (seconds of watching), so babies light up one at a time. */
export const GLOW_GAP_SECONDS = 4;
/** Before any follow, the family tree strip shows at most this many of the first one's mother line, her included (scope decision 61). */
export const TREE_DEPTH = 4;
/** Once the line is followed, at most this many in-between ancestors before each followed baby (scope decision 66). */
export const TREE_BETWEEN = 2;
/** A watched generation's babies appear over this much of its day; the rest of the day is quiet. */
export const APPEAR_SPAN = 0.8;
/**
 * An earlier chosen trait has faded from the line ("Your line so far", scope
 * decisions 59 and 68) when fewer than this many of the line have it, and
 * fewer than half of it.
 */
export const FADED_BELOW = 3;
/**
 * Some of the line is moving to a place when this many of its animals live there,
 * and at least a tenth of the line, after fewer did (scope decision 59). Told once a story for each place.
 */
export const MOVING_AT = 5;
/**
 * The line's place changes only when another place has clearly more of it:
 * this many more animals, and a quarter more (scope decision 59).
 */
export const PLACE_MARGIN = 3;
/**
 * A tap-to-guess question comes at most once in this many generations (scope decision 60), except when a line dies
 * out. A sudden drop no longer asks one (scope decision 69): it is no Field Guide discovery.
 */
export const GUESS_GAP = 4;
/**
 * A line on a trait that doesn't matter in its place (a "~" or a neutral
 * trait) is doing about as well as its relatives here (scope decisions 65 and
 * 68) when, since the follow, one grew (now over then) at most this many
 * times as much as the other.
 */
export const SAME_BY = 1.25;
/** And only once the line has at least this many animals, so a line of one or two isn't called "about the same". */
export const SAME_FROM = 5;

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
   * @param {{homeOf?:(id:number)=>null|{x:number,y:number}, length?:number, known?:(key:string)=>boolean, places?:boolean,
   *   generationSeconds?:number, glowGenerations?:number, onePerVariation?:boolean, lookahead?:false|"crowded"}} [opts]
   *   where each animal's home spot is (herd.js); the generation the story ends at (storyLength); whether this
   *   iPad's Field Guide already has an entry (reflection.js; none by default, like a new iPad); whether the
   *   story's first choice is where the family will live (scope decision 70); "crowded" only for
   *   measuring the look-ahead of scope decision 68, which the game doesn't use; the others only for measuring other
   *   values of GENERATION_SECONDS and GLOW_GENERATIONS
   */
  constructor(bridge, { homeOf = () => null, length = STORY_GENERATIONS, known = () => false, places = false, generationSeconds = GENERATION_SECONDS,
    glowGenerations = GLOW_GENERATIONS, onePerVariation = true, lookahead = false } = {}) {
    this.bridge = bridge;
    this.homeOf = homeOf;
    /** the story's first choice is where the family will live (scope decision 70) */
    this.places = places;
    /** @type {null|Home} where the child chose the family will live, once it did (scope decision 70) */
    this.home = null;
    /** @type {Home[]} earlier place choices whose line died out: the child chose again */
    this.homeTries = [];
    /** @type {null|Home} the place choice whose line just died out, for the page to say so */
    this.homeGone = null;
    /** the line's place is full: some living there were crowded out since the child chose it (scope decision 70) */
    this.full = false;
    /** @type {null|number} the generation it first was */
    this.fullAt = null;
    /** the place filling up is told this generation, the first one watched since it filled */
    this.fillingNow = false;
    this.fillTold = false;
    /** @type {Map<string|number, Array<null|number>>} by founding family, the generation it first had animals living in each place */
    this.firstIn = new Map();
    /** @type {null|string|number} the child's own founding family */
    this.ownFounding = null;
    /** the generation of the world the story ends at, if the line lasts */
    this.length = length;
    /** whether this iPad's Field Guide already has an entry, by its key (reflection.js) */
    this.known = known;
    /** @type {Set<string>} the Field Guide entries this story has asked about, so each is a guess only once */
    this.found = new Set();
    /**
     * @type {null|string[]} a follow's result told this generation as a line, with the table's reason and no guess:
     * its entry is in the Field Guide already (scope decision 69)
     */
    this.told = null;
    /** @type {string[]} a line that just died out, told as lines when its "Why?" is no new discovery (scope decision 69) */
    this.diedSay = [];
    /** "crowded": the fast-forward also stops before any of the line would be crowded out (measured in scope decision 68, not used) */
    this.lookahead = lookahead;
    this.generationSeconds = generationSeconds;
    this.glowGenerations = glowGenerations;
    this.onePerVariation = onePerVariation;
    /** @type {"waiting"|"place"|"moving"|"watch"|"rise"|"choice"|"ended"} */
    this.phase = "waiting";
    /** @type {null|Rise} the fast-forward after a follow, while the followed trait's count in the line rises (scope decision 67) */
    this.rising = null;
    /** @type {null|Rise} the latest such fast-forward, once it has stopped */
    this.lastRise = null;
    /** @type {Choice[]} follows whose line died out ("Back to your line"): not counted as follows (scope decision 68) */
    this.tries = [];
    /** @type {null|Choice} the follow whose line just died out, for the page to say so */
    this.backFrom = null;
    /** @type {null|import("./why.js").Guess} the "Why?" asked right away about a line that just died out (scope decision 68) */
    this.diedWhy = null;
    /** @type {null|Offer[]} the backup choice panel's options, while it is open */
    this.options = null;
    /** @type {Choice[]} every follow, in order */
    this.choices = [];
    /** @type {Glow[]} the newborns glowing now */
    this.glowing = [];
    /** @type {Glow[]} recent newborns with a new variation, glowing or not */
    this.fresh = [];
    /** seconds of story since the latest follow (or the start) */
    this.idle = 0;
    /** seconds watched since the latest fast-forward ended (or the start) */
    this.quiet = 0;
    /** the family's size when the story began */
    this.sizeAtStart = 0;
    this.startGeneration = 0;
    this.endGeneration = null;
    /** @type {null|"died"|"survived"} */
    this.outcome = null;
    /** how many carriers the latest follow narrowed the line to, or how many the line was when the child came back to it */
    this.lineStart = 0;
    /** @type {null|number} how many relatives the child had when the story ended */
    this.relativesAtEnd = null;
    /** @type {null|number} and how many of them lived in the line's place */
    this.relativesHereAtEnd = null;
    /** @type {Array<{id:number, genome:ArrayLike<number>, zone:number}>} the family's animals at the start, for the ending */
    this.startAnimals = [];
    /** @type {Array<{id:number, genome:ArrayLike<number>, zone:number}>} the line's animals last alive */
    this.lastAnimals = [];
    this.lastForm = null;
    /** the line's usual form right after the latest follow */
    this.formAtPoint = null;
    /** how many animals had each trait word in each habitat when the story began (evidence.js) */
    this.startCensus = null;
    /** @type {null|import("./evidence.js").Evidence} the ending's one-line clue, when no same-trait clue qualifies */
    this.evidence = null;
    /** the place most of the line lived in at the end */
    this.mainZone = null;
    /** the whole world's mean for each trait at the start: the base for relative reveal levels */
    this.startWorld = null;
    /** @type {null|{animal: import("./reveal.js").RevealAnimal, why:string[], whyPast:string[], matched:number, checked:number, strength:number}} */
    this.reveal = null;
    /** @type {Map<number, {id:number, genome:ArrayLike<number>, zone:number}>} everyone in the line since the story began */
    this.segment = new Map();
    /** @type {null|string} the family's name, picked by the child right after the first tap ("Mossfoot", names.js) */
    this.name = null;
    /** seconds of watching: glows start and last by this clock, which stands still during fast-forwards and panels */
    this.watchT = 0;
    /** when the latest glow started, in watchT */
    this.lastGlowAt = -Infinity;
    /**
     * @type {null|{generation:number, living:number[], family:number, relatives:number, relativesHere:number}} who was
     * alive at the latest follow (or the start, or the way back), and the line's and the relatives' sizes then
     */
    this.mark = null;
    /** @type {Glow[]} glows started since the page last asked (takeStarted), to name each baby as it lights up */
    this.started = [];
    /** @type {Chip[]} "Your line so far": each chosen trait, and whether it has faded (scope decisions 59 and 68) */
    this.chips = [];
    /** @type {Map<number, {dir:number, hurt:boolean}>} by trait: the way the line went, and whether it clearly died off that way */
    this.went = new Map();
    /** how many of the line live in each place, a generation ago */
    this.placesBefore = [0, 0, 0];
    /** @type {null|{zone:number, main:boolean}} a real move this generation, to narrate: some are moving there, or most live there now */
    this.moved = null;
    /** the places some of the line has been told to be moving to, once each */
    this.movedTo = new Set();
    /** the line's place (where most of it lives), worked out once a generation */
    this.place = 0;
    /** @type {{helping:import("./why.js").Reason[], hurting:import("./why.js").Reason[]}} what helps and hurts the line in its place now */
    this.reasons = { helping: [], hurting: [] };
    /** @type {null|number[][][]} how many had each trait word in each place when all three places first had CLUE_FROM animals */
    this.clueCensus = null;
    /** @type {null|import("./evidence.js").SameTrait} the ending's clue: the same trait in different places */
    this.clue = null;
    /** when the latest tap-to-guess question came */
    this.guessedAt = -Infinity;
    /** @type {Map<number, {id:number, genome:ArrayLike<number>, zone:number}>} the line a generation ago */
    this.before = new Map();
  }

  get running() { return this.phase === "watch" || this.phase === "rise" || this.phase === "place" || this.phase === "moving"; }
  /**
   * The world fast-forwards: after a follow, while the followed trait's count in the line rises (scope decision 67);
   * after the place choice, while the line fills the place (scope decision 70); and before it, to the family's next babies.
   */
  get fast() { return this.phase === "rise" || this.phase === "moving" || this.phase === "place"; }
  get lasted() { return (this.endGeneration ?? this.bridge.generation) - this.startGeneration; }
  /**
   * "family" until the child chose where it lives or made a first follow, then "line": each narrows the child's
   * animals to a line (scope decisions 66 and 70).
   */
  get noun() { return this.choices.length || this.home ? "line" : "family"; }
  /** Follows are left, so newborns can glow and be followed. */
  get canFollow() { return this.choices.length < STORY_CHOICES; }
  /** The child can follow right now: while watching, never during a fast-forward or a panel. */
  get followOpen() { return this.phase === "watch" && this.canFollow; }
  /** The child's line is very small: no follow starts, and the backup panel waits (scope decision 44, playtest). */
  get inDanger() { return this.bridge.followedIds().length <= DANGER_SIZE; }

  /** Where a follow narrows the line: the place where most of it lives (scope decision 59). */
  testZone() { return this.place; }

  /**
   * Why a glowing baby's variation can't be followed, or null when it can:
   * "away", the baby lives away from the line's place (scope decision 59);
   * "back", the way back from a direction the line already took (scope
   * decision 59), unless the line clearly dying off showed that direction
   * hurting. A neutral trait and a "~" there can be followed like any other
   * (scope decision 65).
   * @param {{id:number, v:import("./cohorts.js").Variation}} x
   * @returns {null|"away"|"back"}
   */
  whyNot(x) {
    if (this.bridge.zoneOf(x.id) !== this.testZone()) return "away";
    const w = this.went.get(x.v.t);
    if (w && w.dir !== x.v.dir && !w.hurt) return "back";
    return null;
  }

  /** Any trait in the line's place, but never the way back without a reason, can be followed (scope decision 65). */
  followable(x) { return this.whyNot(x) === null; }

  /** A way back the line may take, because the line clearly died off the way it went ("Go back?"). */
  goesBack(x) {
    const w = this.went.get(x.v.t);
    return !!w && w.dir !== x.v.dir && w.hurt;
  }

  /** The child's relatives (the rest of each line narrowed from, and their babies), now against at the latest follow. */
  get relatives() { return { now: this.relativesAtEnd ?? this.bridge.relatives.size, then: this.mark?.relatives ?? 0 }; }
  /** "Your relatives here": the relatives in the line's place, now against at the latest follow (scope decision 67). */
  get relativesHere() { return { now: this.relativesHereAtEnd ?? this.bridge.relativesIn(this.place), then: this.mark?.relativesHere ?? 0 }; }
  /** The whole family, now against when the story began; once a place choice or a follow narrowed it, the line, against when it did. */
  get family() { return { now: this.bridge.followedIds().length, then: this.choices.length || this.home ? this.lineStart : this.sizeAtStart }; }

  /**
   * The child taps an animal and follows its family. Time starts now: with the
   * place choice (scope decision 70), toward the family's first babies, so
   * the child can choose where it will live.
   */
  begin(id) {
    const follow = this.bridge.followFamilyOf(id);
    /** the animal the child tapped first: the family tree's first mother (scope decision 61) */
    this.firstId = id;
    this.startGeneration = this.bridge.generation;
    this.ownFounding = this.bridge.families.founder.get(id) ?? null;
    this.noteFirstIn();
    this.remember();
    this.phase = this.places ? "place" : "watch";
    this.sizeAtStart = this.lastAnimals.length;
    this.startAnimals = this.lastAnimals;
    this.placesBefore = this.countPlaces();
    const world = this.bridge.livingAnimals();
    this.startCensus = census(world);
    this.startWorld = averageOf(world.map((a) => a.genome)).map((a) => a.mean);
    this.markNow();
    return follow;
  }

  /** Who is alive now, and how big the line and its relatives are: the "then" of every count until the next follow. */
  markNow() {
    this.mark = { generation: this.bridge.generation, living: this.bridge.livingIds(), family: this.bridge.followedIds().length,
      relatives: this.bridge.relatives.size, relativesHere: this.bridge.relativesIn(this.place) };
  }

  remember() {
    this.lastAnimals = this.bridge.followedAnimals();
    this.lastForm = formOf(this.lastAnimals.map((a) => a.genome));
    // Once the child chose where the family lives, the line lives there: a baby born elsewhere is a relative (scope decision 70).
    if (this.home) this.place = this.home.zone;
    else if (this.lastAnimals.length) {
      // The place where most of the line lives, kept until another place clearly has more (PLACE_MARGIN).
      const n = this.countPlaces(), most = placeOf(this.lastAnimals), here = n[this.place];
      if (this.phase === "waiting" || !here || (n[most] >= here + PLACE_MARGIN && n[most] >= here * 1.25)) this.place = most;
    }
    for (const a of this.lastAnimals) this.segment.set(a.id, a);
    this.reasons = reasonsIn(this.lastAnimals.filter((a) => a.zone === this.place), this.place);
    if (!this.clueCensus && this.bridge.zoneCounts().every((n) => n >= CLUE_FROM)) this.clueCensus = census(this.bridge.livingAnimals());
  }

  /** How many of the line live in each place now. */
  countPlaces() {
    const n = [0, 0, 0];
    for (const a of this.lastAnimals) n[a.zone]++;
    return n;
  }

  /**
   * After each engine generation.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @returns {"ended"|"rising"|"rise-done"|"back"|"choice"|"place"|"moving"|"arrived"|null} what the story did
   */
  afterGeneration(ev) {
    const what = this.storyGeneration(ev);
    // The line's place filled up (scope decision 70): told once, the first generation it is watched since.
    this.fillingNow = false;
    if (this.full && !this.fillTold && this.phase === "watch") { this.fillTold = true; this.fillingNow = true; }
    return what;
  }

  /**
   * When each founding family first had animals living in each place (scope decision 70): another group that was
   * living in the line's place when the child chose it got there first.
   */
  noteFirstIn() {
    const g = this.bridge.generation, founder = this.bridge.families.founder;
    for (const id of this.bridge.livingIds()) {
      const key = founder.get(id);
      if (key === undefined) continue;
      let at = this.firstIn.get(key);
      if (!at) this.firstIn.set(key, (at = [null, null, null]));
      const z = this.bridge.zoneOf(id);
      if (z >= 0 && at[z] === null) at[z] = g;
    }
  }

  /** Another group at the line's place was living there when the child chose it: it got there first (scope decision 70). */
  gotHereFirst(id) {
    const h = this.home;
    if (!h || this.bridge.isFollowed(id) || this.bridge.isRelative(id) || this.bridge.zoneOf(id) !== h.zone) return false;
    const key = this.bridge.families.founder.get(id);
    const at = key === undefined || key === this.ownFounding ? null : this.firstIn.get(key)?.[h.zone] ?? null;
    return at !== null && at <= h.generation;
  }

  /** One engine generation of the story (afterGeneration). */
  storyGeneration(ev) {
    const g = ev.group;
    if (g && this.running) this.noteFirstIn();
    if (!g || !this.running) return null;
    // Some of the animals living in the line's place were crowded out: it is full, and who survives there depends on
    // who suits it best (scope decision 70).
    if (this.home && !this.full && ev.deaths.some((d) => d.cause === "least_suited" && d.zone === this.home.zone)) {
      this.full = true;
      this.fullAt = ev.generation;
    }
    const seconds = this.fast ? FAST_SECONDS : this.generationSeconds;
    this.idle += seconds;
    if (!this.fast) this.quiet += seconds;
    this.backFrom = null;
    this.homeGone = null;
    this.diedWhy = null;
    this.diedSay = [];
    this.told = null;
    const last = this.choices[this.choices.length - 1];
    if (last) { last.peak = Math.max(last.peak, g.count); last.counts.push(g.count); }
    if (this.home && !last) this.home.counts.push(g.count);
    this.before = new Map(this.lastAnimals.map((a) => [a.id, a])); // the line a generation ago, for why some died
    // The line died out (scope decision 68): back to the line before it, or the end when the whole line is gone.
    if (g.count === 0) return last || this.home ? this.backToLine(ev) : this.end("died", ev.generation);
    const mainBefore = this.place;
    this.remember();
    this.noticeMoves(mainBefore);
    this.checkHurt();
    this.updateChips();
    if (ev.generation >= this.length) return this.end("survived", ev.generation);
    // Before the place choice, the world runs on to the family's babies: nothing glows (scope decision 70).
    if (this.phase === "place") return "place";
    this.updateGlow(ev);
    if (this.phase === "moving") return this.moveGeneration(g.count);
    if (this.phase === "rise") return this.riseGeneration(g.count);
    // The push: nothing followed for a while, so a choice panel opens as a backup (never while the line is very small).
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
   * A real move over generations (scope decision 59): the line's place is
   * another one now, or for the first time this story MOVING_AT or more (and a
   * tenth of the line) live in a place where fewer did a generation ago.
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

  /** The line clearly dying off after its follow shows that direction hurting: the way back may be followed (scope decision 59). */
  checkHurt() {
    const c = this.choices[this.choices.length - 1];
    if (!c) return;
    const w = this.went.get(c.v.t);
    if (w && w.dir === c.v.dir && !w.hurt && this.dyingOff(c)) w.hurt = true;
  }

  /** The line clearly smaller than at its peak since the follow: 3 or more fewer, and under 0.7 of it (scope decision 67). */
  dyingOff(c, now = this.family.now) { return now <= c.peak - 3 && now <= 0.7 * c.peak; }
  /** The line clearly bigger than when it was followed: 3 or more more, and half as many again. */
  growing(c, now = this.family.now) { return now - c.sizeAtChoice >= 3 && now >= 1.5 * c.sizeAtChoice; }
  /**
   * The line doing about as well as its relatives here since the follow
   * (scope decision 68): at least SAME_FROM animals, and each grew (now over
   * then) within SAME_BY times the other.
   */
  aboutSame(c, now = this.family.now, relatives = this.bridge.relativesIn(c.zone)) {
    if (!c.relativesAtChoice || now < SAME_FROM) return false;
    const line = (now + 0.5) / (c.sizeAtChoice + 0.5), kin = (relatives + 0.5) / (c.relativesAtChoice + 0.5);
    return Math.max(line, kin) <= SAME_BY * Math.min(line, kin);
  }

  /**
   * "Your line so far" (scope decisions 59 and 68): an earlier chosen trait
   * has faded when fewer than FADED_BELOW of the line still have it, and fewer
   * than half of it; the reason is whether it hurt in the line's place. The
   * latest trait never fades while its line lives: each of its animals has it.
   */
  updateChips() {
    const n = this.lastAnimals.length;
    for (const chip of this.chips) {
      const have = this.lastAnimals.filter((a) => carries(a.genome, chip.v)).length;
      chip.faded = have >= FADED_BELOW || 2 * have >= n ? null : variationEffect(chip.v.t, chip.v.dir, this.place) < 0 ? "hurt" : "lost";
    }
  }

  /**
   * "Your line so far" again from the follows that count, each trait once, in
   * order; and the way the line went on each, keeping whether it clearly died
   * off that way.
   */
  rebuildChips() {
    const was = this.went;
    this.went = new Map();
    this.chips = [];
    for (const c of this.choices) {
      const w = was.get(c.v.t);
      this.went.set(c.v.t, { dir: c.v.dir, hurt: !!w && w.dir === c.v.dir && w.hurt });
      this.chips = this.chips.filter((x) => x.v.t !== c.v.t);
      this.chips.push({ v: c.v, faded: null });
    }
  }

  /**
   * The calm rule: of the newborns in the line with a new variation this
   * generation or the one before, at most GLOW_MAX glow, the ones that can be
   * followed first, then those whose trait helps or hurts in the line's place
   * (scope decision 69), then the newest, one per variation. A watched
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

  /** Drop the glows that are over (too old, or gone from the line), then start any that may. */
  refreshGlow(generation = this.bridge.generation) {
    this.fresh = this.fresh.filter((x) => generation - x.generation < this.glowGenerations && this.bridge.isFollowed(x.id));
    this.glowing = this.glowing.filter((x) => this.fresh.includes(x));
    return this.startGlows();
  }

  /**
   * Which newborns glow now. A glow younger than GLOW_MIN_SECONDS stays; the
   * other places go to the best of the babies that have appeared (the ones
   * that can be followed first, then those whose trait helps or hurts in the
   * line's place, then the newest), one per variation, at most GLOW_MAX; a new
   * glow waits until GLOW_GAP_SECONDS after the last one started. Glows start
   * only while the world is watched.
   *
   * The glow balance (scope decision 69): while a baby of the line whose trait
   * helps or hurts in its place glows or can (born, followable, with its glow
   * not over), at most one glowing baby has a trait that doesn't matter there
   * (a "~" or a neutral trait). And helpful and harmful traits glow first: no
   * glow with a trait that doesn't matter starts while such a baby still
   * waits to light up (its variation not glowing yet). A generation's babies
   * are all born at its tick, so this holds from the start of the day, before
   * they appear.
   * @returns {Glow[]} the glows that started now
   */
  startGlows() {
    const t = this.watchT, current = this.glowing, started = [], zone = this.testZone();
    const matters = (x) => variationEffect(x.v.t, x.v.dir, zone) !== 0;
    const open = (x) => current.includes(x) || x.bornT + this.glowGenerations * this.generationSeconds - t >= GLOW_MIN_SECONDS;
    const balance = this.fresh.some((x) => matters(x) && this.followable(x) && open(x));
    const ready = this.fresh.filter((x) => x.showAt <= t + 1e-9)
      .sort((a, b) => Number(!this.followable(a)) - Number(!this.followable(b)) || Number(!matters(a)) - Number(!matters(b)) ||
        b.generation - a.generation || b.showAt - a.showAt || a.id - b.id);
    // A young glow stays, but with the balance on, only one of them with a trait that doesn't matter here (the oldest).
    const young = current.filter((x) => t - x.since < GLOW_MIN_SECONDS), plainYoung = young.filter((x) => !matters(x)).sort((a, b) => a.since - b.since);
    const next = balance && plainYoung.length > 1 ? young.filter((x) => matters(x) || x === plainYoung[0]) : young;
    // A baby of the line with a trait that helps or hurts here, still to light up: its variation isn't glowing yet.
    const waiting = () => this.fresh.some((y) => matters(y) && this.followable(y) && open(y) && !next.includes(y) && !next.some((z) => sameVariation(z.v, y.v)));
    for (const x of ready) {
      if (next.length >= GLOW_MAX) break;
      if (next.includes(x) || (this.onePerVariation && next.some((y) => sameVariation(y.v, x.v)))) continue;
      if (balance && !matters(x) && next.some((y) => !matters(y))) continue;
      if (current.includes(x)) { next.push(x); continue; }
      if (!matters(x) && waiting()) continue;
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
   * Why the line changed size this generation, from the table (scope
   * decision 60). Growing: its biggest helper there, and "But …" its biggest
   * hurter. Shrinking, most of it crowded out: the helper, then "But …" the
   * hurter; with no hurter, the trait that most sets the ones that died apart
   * from the survivors where they lived ("Long back legs help them run fast."
   * "Others here have longer back legs."), and with none, that the place is
   * full. A line that shrank because its oldest died says so; one that grew
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

  /**
   * The latest follow's verdict this watched generation, with the table's
   * reason (scope decision 67): the line bigger than last generation on a
   * trait that helps there, "growing"; smaller on one that hurts there, and
   * not mostly of old age, "dying off". Null otherwise: the page tells the
   * change the usual way (changeReasons).
   * @param {import("./bridge.js").GenerationEvents} ev
   * @returns {null|{kind:"growing"|"dying", c:Choice, reason:string}}
   */
  verdict(ev) {
    const g = ev.group, c = this.choices[this.choices.length - 1];
    if (!g || !c || this.phase !== "watch" || !g.count || c.rise === null) return null;
    const e = variationEffect(c.v.t, c.v.dir, c.zone), reason = whyLine(c.v.t, c.zone);
    if (e > 0 && g.count > g.before) return { kind: "growing", c, reason };
    if (e < 0 && g.count < g.before && !this.oldAgeMostly(g, ev.deaths)) return { kind: "dying", c, reason };
    return null;
  }

  /** Most of the line's deaths this generation were of old age. */
  oldAgeMostly(g, deaths) {
    const gone = new Set(g.gone), old = deaths.filter((d) => gone.has(d.id) && d.cause === "maximum_age").length;
    return old * 2 >= g.gone.length;
  }

  /**
   * What most set the line's animals that died this generation apart from
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
   * This trait's result in this place would be a new Field Guide discovery on
   * this iPad: its entry was not found on it before, nor asked about in this
   * story. Only then is its "Why?" a tap-to-guess question (scope decision 69).
   */
  isNew(t, zone) {
    const key = guideEntry(t, zone)?.key;
    return !!key && !this.found.has(key) && !this.known(key);
  }

  /** A discovery is asked about now: its entry counts as found in this story, whatever the guess (the page keeps it). */
  foundNow(discovery) {
    const key = discovery ? guideEntry(discovery.t, discovery.zone)?.key : null;
    if (key) this.found.add(key);
  }

  /**
   * A tap-to-guess question now, or null (scope decisions 60, 68 and 69). A
   * "Why?" is a question only when its answer is a new Field Guide discovery on
   * this iPad (isNew); otherwise the table's reason is told as a line.
   * - A followed line just died out: its "Why?" right away (diedWhyFor), whatever the gap.
   * - The latest follow's result goes the table's way: the line clearly
   *   growing on a trait that helps there ("Why is your line with bigger eyes
   *   growing?"), clearly dying off on one that hurts, or doing about as well
   *   as its relatives here on one that doesn't matter there. Each is a Field
   *   Guide entry. Once a follow, from 2 generations after it and once a
   *   generation has been watched since its fast-forward. A new entry is asked
   *   at most once every GUESS_GAP generations; a known one is told at once, in
   *   `told`: what happened, then the table's reason.
   * A sudden drop of the line is no discovery: the generation's own lines say
   * why (changeReasons), with no guess.
   * The three options are the trait's lines for the three places.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @returns {null|import("./why.js").Guess}
   */
  guessNow(ev) {
    if (this.phase !== "watch") return null;
    if (this.diedWhy) {
      const q = this.diedWhy;
      this.diedWhy = null;
      this.guessedAt = ev.generation;
      this.foundNow(q.discovery);
      return q;
    }
    // The generation a line died out is its own: no other question then, even when its "Why?" is told.
    if (this.backFrom) return null;
    const c = this.choices[this.choices.length - 1];
    // After at least one generation watched since the fast-forward, and 2 since the follow.
    if (!c || c.asked || !c.rise || ev.generation <= c.rise.until || ev.generation - c.generation < 2) return null;
    const e = variationEffect(c.v.t, c.v.dir, c.zone), now = this.family.now, relatives = this.bridge.relativesIn(c.zone);
    const shown = e > 0 ? this.growing(c, now) : e < 0 ? this.dyingOff(c, now) : this.aboutSame(c, now, relatives);
    if (!shown) return null;
    const ask = this.isNew(c.v.t, c.zone);
    if (ask && ev.generation - this.guessedAt < GUESS_GAP) return null;
    c.asked = true;
    // Its result, for the ending: the line and its relatives here, and how long after the follow.
    c.result = { line: now, relatives, after: ev.generation - c.generation };
    if (!ask) {
      const happened = e > 0 ? growingLine(c.v.group, this.name) : e < 0 ? dyingOffLine(c.v.group, this.name) : sameLine(this.name);
      this.told = [happened, whyLine(c.v.t, c.zone)];
      return null;
    }
    this.guessedAt = ev.generation;
    const discovery = { t: c.v.t, zone: c.zone };
    this.foundNow(discovery);
    const text = e > 0 ? growingQuestion(c.v.group, this.name) : e < 0 ? dyingQuestion(c.v.group, this.name) : sameQuestion(this.name);
    return { ...guessFor(text, c.v.t, c.zone), same: e === 0, discovery };
  }

  /**
   * Why the followed line died out, right there (scope decisions 68 and 69).
   * A question, "Why did your animals with smaller eyes die out?", only when
   * its answer is a new Field Guide discovery: the followed trait hurts in the
   * line's place, and this iPad hasn't found that yet. Otherwise the reason as
   * lines: that trait's line from the table; when it doesn't matter there, its
   * line and "Other traits decided who made it."; when it helps there, what
   * else set them apart (the line's biggest hurter there, or the trait the
   * others there had more of). Nothing when most of them were old: the page
   * says "Some were old and died."
   * @param {import("./bridge.js").GenerationEvents} ev the generation it died out
   * @param {Choice} c its follow
   * @returns {{q:null|import("./why.js").Guess, lines:string[]}}
   */
  diedWhyFor(ev, c) {
    if (this.oldAgeMostly(ev.group, ev.deaths)) return { q: null, lines: [] };
    const e = variationEffect(c.v.t, c.v.dir, c.zone);
    if (e < 0 && this.isNew(c.v.t, c.zone)) {
      return { q: { ...guessFor(diedQuestion(c.v.group, this.name), c.v.t, c.zone), died: true, discovery: { t: c.v.t, zone: c.zone } }, lines: [] };
    }
    if (e < 0) return { q: null, lines: [whyLine(c.v.t, c.zone)] };
    if (e === 0) return { q: null, lines: [whyLine(c.v.t, c.zone), OTHER_TRAITS] };
    const hurt = this.reasons.hurting[0], sf = hurt ? null : this.deathShortfall(ev);
    return { q: null, lines: hurt ? [hurt.line] : sf ? [sf.line, sf.who] : [] };
  }

  /** The table's reason for a variation in the line's place (scope decision 60). */
  whyHere(v) { return whyLine(v.t, this.testZone()); }

  /**
   * The family tree strip. Before any follow (scope decision 61), the animal
   * the child tapped first and her own mother line. Once the line is followed
   * (scope decision 66), the chain of followed babies: the first one tapped,
   * then each followed baby in order, each after its in-between ancestors
   * (at most TREE_BETWEEN, drawn smaller), all from their real bodies. Once
   * the child chose where the family lives, the baby on that place's card is
   * the first step (scope decision 70). A step
   * is "→" when the baby's mother line reaches the one before it, "…" when it
   * does not within TREE_BETWEEN mothers. A mother's body is known back to
   * the story's start (every line member since), and for anyone alive.
   * @returns {{line:boolean, nodes:TreeAnimal[]}} line: the chain of chosen babies (after the place choice or the first follow)
   */
  familyTree() {
    const known = (id) => this.segment.get(id) ?? (this.bridge.get(id) ? this.bridge.animal(id) : null);
    const mother = (id) => this.bridge.families.mother.get(id);
    const first = known(this.firstId);
    // Up to `most` of this animal's mothers, the oldest first, and whether the next one up is `stop`.
    const mothers = (id, most, stop) => {
      const up = [];
      let m = mother(id);
      while (typeof m === "number" && m !== stop && up.length < most) {
        const a = known(m);
        if (!a) break;
        up.unshift(a);
        m = mother(m);
      }
      return { up, reached: m === stop };
    };
    const node = (a, kind, label, joined) => ({ id: a.id, genome: a.genome, zone: a.zone, kind, label, joined });
    // The baby on the chosen place's card is the line's first step (scope decision 70), then each followed baby.
    const steps = [...(this.home ? [{ anchor: this.home.id, label: PLACE_LABELS[this.home.zone] }] : []),
      ...this.choices.map((c) => ({ anchor: c.anchor, label: babyLabel(c.v.group) }))];
    if (!steps.length) {
      const { up } = mothers(this.firstId, TREE_DEPTH - 1, null);
      const labels = ["Great-grandmother", "Grandmother", "Mother"].slice(-up.length || 3);
      return { line: false, nodes: [...up.map((a, i) => node(a, "between", labels[i], i > 0)), ...(first ? [node(first, "first", "First mother", up.length > 0)] : [])] };
    }
    const nodes = first ? [node(first, "first", "First mother", false)] : [];
    let before = this.firstId;
    for (const c of steps) {
      const baby = known(c.anchor);
      if (!baby) continue;
      const { up, reached } = mothers(c.anchor, TREE_BETWEEN, before);
      const labels = ["Great-grandmother", "Grandmother", "Mother"].slice(-up.length || 3);
      up.forEach((a, i) => nodes.push(node(a, "between", labels[i], i > 0 || reached)));
      nodes.push(node(baby, "baby", c.label, up.length > 0 || reached));
      before = c.anchor;
    }
    return { line: true, nodes };
  }

  /** The glows started since the last call, oldest first. */
  takeStarted() {
    const started = this.started;
    this.started = [];
    return started;
  }

  /** @returns {null|Glow} */
  glowFor(id) { return this.glowing.find((x) => x.id === id) ?? null; }

  /** The line's animals in its place with the variation: who a follow on it narrows the line to. */
  carrierIds(v) {
    return this.bridge.followedAnimals().filter((a) => a.zone === this.testZone() && carries(a.genome, v)).map((a) => a.id);
  }

  /**
   * The backup choice panel's options: only variations that can be followed
   * (scope decisions 58, 59 and 65), glowing ones first, then others the line
   * has spread in its place. One per trait.
   * @returns {Offer[]}
   */
  pushOptions() {
    const out = [];
    const add = (x) => {
      if (out.length < PUSH_OPTIONS && !out.some((o) => o.v.trait === x.v.trait)) out.push({ v: x.v, id: this.anchorFor(x), zone: x.zone });
    };
    for (const g of this.glowing) if (this.followable(g)) add(g);
    const here = this.lastAnimals.filter((a) => a.zone === this.place);
    for (const x of familyVariations(here, this.place)) if (this.followable(x)) add(x);
    return out;
  }

  /** The animal a follow starts from: this one if it is among the line's carriers, else the first of them. */
  anchorFor(x) {
    const ids = this.carrierIds(x.v);
    return ids.includes(x.id) || !ids.length ? x.id : ids[0];
  }

  /**
   * Follow a variation (scope decisions 67 and 68): the line narrows to its
   * animals with the variation in its place, and from now on a baby joins it
   * when a parent is in it and it inherited the variation. The rest of the old
   * line there are relatives. The world then fast-forwards while the
   * variation's count in the line rises (riseGeneration), unless it has
   * RISE_TO already or fewer than FAST_FROM: then the child watches it in real
   * time from the start (scope decisions 67 and 69).
   * @param {{v:import("./cohorts.js").Variation, id:number, zone:number, home?:any}} x a glow or an offer
   * @param {boolean} byChance picked at random on the backup panel because time ran out
   */
  follow(x, byChance) {
    const zone = this.testZone(), back = this.goesBack(x);
    this.closeChoice();
    // A follow's mark counts on from the place choice's (scope decision 70), so "Back to your line" can give that line back.
    const ids = this.carrierIds(x.v), mark = this.choices.length + 1 + (this.home ? HOME_MARK : 0);
    this.bridge.narrowTo(ids, zone, x.v, mark);
    this.lineStart = ids.length;
    const generation = this.bridge.generation, relativesHere = this.bridge.relativesIn(zone);
    this.choices.push({
      v: x.v, group: x.v.group, trait: x.v.trait, neutral: x.v.neutral, byChance, generation, zone, back, anchor: x.id, mark,
      sizeAtChoice: ids.length, sizeAtEnd: null, relativesAtChoice: relativesHere, relativesAtEnd: null,
      peak: ids.length, counts: [ids.length], rise: null, result: null, asked: false,
    });
    // The way the line went on this trait; "Your line so far" gets its chip (a way back replaces the old one).
    this.went.set(x.v.t, { dir: x.v.dir, hurt: false });
    this.chips = this.chips.filter((c) => c.v.t !== x.v.t);
    this.chips.push({ v: x.v, faded: null });
    this.fresh = [];
    this.glowing = [];
    this.started = [];
    this.options = null;
    this.rising = { v: x.v, zone, id: x.id, generation, counts: [ids.length], outcome: null };
    this.phase = "rise";
    // Already RISE_TO or more: nothing to fast-forward to (scope decision 67). Fewer than FAST_FROM: watched in real
    // time from the start, so a harmful decline is seen (scope decision 69). Measured only (scope decision 68): with
    // the look-ahead, no fast-forward either when some would be crowded out next.
    if (ids.length >= RISE_TO) this.stopRise("reached");
    else if (ids.length < FAST_FROM) this.stopRise("small");
    else if (this.lookahead && this.crowdedNext()) this.stopRise("crowded");
    this.idle = 0;
    this.quiet = 0;
    this.remember();
    this.formAtPoint = this.lastForm;
    this.markNow();
  }

  /**
   * One generation of the fast-forward after a follow (scope decision 67):
   * the followed variation's count in the line. It stops once the count
   * reaches RISE_TO ("reached"), as soon as it stops rising ("flat") or falls
   * ("fell"), or after RISE_MAX generations ("cap"); then the child watches.
   * With the measured look-ahead only, also before a generation in which any
   * of the line would be crowded out ("crowded").
   * @param {number} n the line now
   * @returns {"rising"|"rise-done"}
   */
  riseGeneration(n) {
    const r = this.rising, before = r.counts[r.counts.length - 1];
    r.counts.push(n);
    if (n >= RISE_TO) return this.stopRise("reached");
    if (n < before) return this.stopRise("fell");
    if (n === before) return this.stopRise("flat");
    if (r.counts.length - 1 >= RISE_MAX) return this.stopRise("cap");
    if (this.lookahead && this.crowdedNext()) return this.stopRise("crowded");
    return "rising";
  }

  /**
   * Some of the line would be crowded out next generation, as the least
   * suited in its place (bridge.js dyingNext). Old age doesn't count (scope decision 68).
   */
  crowdedNext() {
    const next = this.bridge.dyingNext();
    return this.bridge.followedIds().some((id) => next.get(id) === "least_suited");
  }

  /**
   * The first choice's cards, "Where will your family live?" (scope decision
   * 70): for each place, a real baby of the family born since the story began
   * that lives there (it prefers that place), or null while there is none yet
   * ("Wait a generation."). Of those there, the one that spends the most of its
   * time there, then the newest, then the first by id. `living` is how many of
   * the family live there now: the line, if the child chooses it.
   * @returns {Array<null|{zone:number, id:number, living:number}>} by place: 0 high leaves, 1 open ground, 2 water's edge
   */
  placeCards() {
    const out = [null, null, null], living = [0, 0, 0], best = [null, null, null];
    for (const id of this.bridge.followedIds()) {
      const ind = this.bridge.get(id), z = this.bridge.zoneOf(id);
      if (!ind || z < 0) continue;
      living[z]++;
      if (ind.birthGeneration <= this.startGeneration) continue;
      const b = best[z], share = ind.timeAllocation[z];
      if (!b || share > b.share + 1e-12 || (Math.abs(share - b.share) <= 1e-12 && (ind.birthGeneration > b.born || (ind.birthGeneration === b.born && id < b.id)))) {
        best[z] = { id, share, born: ind.birthGeneration };
      }
    }
    best.forEach((b, z) => { if (b) out[z] = { zone: z, id: b.id, living: living[z] }; });
    return out;
  }

  /** A baby a place's card may show: of the family, born since the story began, alive and living there. */
  isPlaceBaby(id, zone) {
    const ind = this.bridge.get(id);
    return !!ind && this.bridge.isFollowed(id) && ind.birthGeneration > this.startGeneration && this.bridge.zoneOf(id) === zone;
  }

  /**
   * The child chooses where the family will live (scope decision 70): the
   * line becomes the family's animals living in that place, and from now on a
   * baby joins it when a parent is in it and it lives there too (it inherited
   * the preference); the rest of the family are relatives (bridge.js
   * narrowToPlace). Choosing the open ground is staying: the line becomes the
   * family's animals there. The world then fast-forwards while the line fills
   * the place (moveGeneration), unless PLACE_TO live there already.
   * @param {number} zone
   * @param {number} [shown] the baby on the card the child saw, when it is still one the card may show
   * @returns {null|Home} null when no baby of the family lives there yet
   */
  choosePlace(zone, shown) {
    const card = this.phase === "place" ? this.placeCards()[zone] : null;
    if (!card) return null;
    const ids = this.bridge.followedAnimals().filter((a) => a.zone === zone).map((a) => a.id);
    const baby = shown !== undefined && this.isPlaceBaby(shown, zone) ? shown : card.id;
    this.bridge.narrowToPlace(ids, zone, HOME_MARK);
    const generation = this.bridge.generation;
    this.home = { zone, id: baby, generation, mark: HOME_MARK, sizeAtChoice: ids.length, counts: [ids.length], outcome: null, until: null,
      roomy: this.bridge.roomyIn(zone) };
    this.full = false;
    this.fullAt = null;
    this.fillTold = false;
    this.lineStart = ids.length;
    this.fresh = [];
    this.glowing = [];
    this.started = [];
    this.phase = "moving";
    if (ids.length >= PLACE_TO) this.stopMove("reached");
    this.idle = 0;
    this.quiet = 0;
    this.remember();
    this.placesBefore = this.countPlaces();
    this.formAtPoint = this.lastForm;
    this.markNow();
    return this.home;
  }

  /**
   * One generation of the fast-forward after the place choice (scope decision
   * 70): it stops once PLACE_TO of the line live there ("reached"), or after
   * PLACE_MAX generations ("cap"); then the child watches, and the trait
   * choices begin there.
   * @param {number} n the line now
   * @returns {"moving"|"arrived"}
   */
  moveGeneration(n) {
    if (n >= PLACE_TO) return this.stopMove("reached");
    if (this.bridge.generation - this.home.generation >= PLACE_MAX) return this.stopMove("cap");
    return "moving";
  }

  /** @returns {"arrived"} */
  stopMove(outcome) {
    this.home.outcome = outcome;
    this.home.until = this.bridge.generation;
    this.phase = "watch";
    this.quiet = 0;
    return "arrived";
  }

  /** @returns {"rise-done"} */
  stopRise(outcome) {
    const r = this.rising, c = this.choices[this.choices.length - 1];
    r.outcome = outcome;
    this.lastRise = r;
    this.rising = null;
    if (c) c.rise = { outcome, counts: r.counts.slice(), generations: r.counts.length - 1, until: this.bridge.generation };
    this.phase = "watch";
    this.quiet = 0;
    return "rise-done";
  }

  /**
   * The followed line died out (scope decision 68). Its "Why?" is worked out
   * first, from the line as it was (diedWhyFor), for the page to ask right
   * away or tell as lines (scope decision 69); then "They didn't make it. Back
   * to your line.": the child is back
   * with the line before that follow, as it is now (the rest of it in its
   * place, and their babies since), and the follow doesn't count. If none of
   * them is alive either, back again, to the line before that. With nothing
   * left at all, the story ends.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @returns {"back"|"ended"}
   */
  backToLine(ev) {
    const generation = ev.generation, gone = [], died = this.choices[this.choices.length - 1];
    const why = died ? this.diedWhyFor(ev, died) : { q: null, lines: [] };
    let members = new Set();
    while (this.choices.length && !members.size) {
      const c = this.choices.pop();
      c.sizeAtEnd = 0;
      c.relativesAtEnd = this.bridge.relativesIn(c.zone);
      gone.push(c);
      const prev = this.choices[this.choices.length - 1] ?? null;
      members = this.bridge.restore(c.mark, prev ? prev.v : null, this.home?.zone ?? null);
    }
    // The line in the chosen place is gone too (scope decision 70): back to the family, to choose where it lives again.
    const home = !members.size && this.home ? this.home : null;
    if (home) members = this.bridge.restore(home.mark, null, null);
    if (this.rising) { this.rising.outcome = "gone"; this.lastRise = this.rising; this.rising = null; }
    if (!members.size) {
      // The child's whole line is gone: the story ends, with its follows as they were.
      this.choices.push(...gone.reverse());
      return this.end("died", generation);
    }
    this.tries.push(...gone);
    this.backFrom = gone[0] ?? null;
    this.diedWhy = why.q;
    this.diedSay = why.lines;
    if (home) {
      if (!home.outcome) { home.outcome = "gone"; home.until = generation; }
      home.goneAt = generation;
      this.homeTries.push(home);
      this.homeGone = home;
      this.home = null;
    }
    // The line before is the child's again: it counts from now, and "Your line so far" is its own again.
    const now = this.choices[this.choices.length - 1];
    if (now) { now.sizeAtEnd = null; now.relativesAtEnd = null; }
    this.rebuildChips();
    this.lineStart = members.size;
    this.fresh = [];
    this.glowing = [];
    this.phase = home ? "place" : "watch";
    this.idle = 0;
    this.quiet = 0;
    this.remember();
    this.updateChips();
    this.markNow();
    if (generation >= this.length) return this.end("survived", generation);
    return "back";
  }

  /** The latest follow is about to be replaced, or the story ends: note its line's and its relatives' sizes. */
  closeChoice() {
    const last = this.choices[this.choices.length - 1];
    if (last && last.sizeAtEnd === null) {
      last.sizeAtEnd = this.family.now;
      last.relativesAtEnd = this.bridge.relativesIn(last.zone);
    }
  }

  end(outcome, generation) {
    this.closeChoice();
    this.phase = "ended";
    this.outcome = outcome;
    this.endGeneration = generation;
    this.relativesAtEnd = this.bridge.relatives.size;
    this.relativesHereAtEnd = this.bridge.relativesIn(this.place);
    if (this.rising) { this.rising.outcome = "ended"; this.lastRise = this.rising; this.rising = null; }
    this.glowing = [];
    this.started = [];
    this.options = null;
    this.mainZone = placeOf(this.lastAnimals);
    const segment = [...this.segment.values()], living = this.bridge.livingAnimals();
    // The clue: the same trait in different places (scope decision 60), a trait the line chose first; else one line.
    this.clue = sameTraitClue(this.clueCensus ?? this.startCensus, census(living), this.choices.map((c) => c.v.t));
    this.evidence = this.clue ? null : evidenceFor(segment, living, this.startCensus);
    // Scope decisions 10, 40 and 41: on every ending, from the line's actual average traits and main place
    // when the story ended (its last living animals), never its choices. A line that died out and matches no
    // animal is told it didn't have time to change, never the first mammals.
    this.reveal = revealFor(averageOf(this.lastAnimals.map((a) => a.genome)).map((a) => a.mean), this.mainZone, this.startWorld,
      undefined, outcome === "died");
    return "ended";
  }
}

/**
 * @typedef {Object} Glow a newborn in your line with a new variation
 * @property {number} id @property {import("./cohorts.js").Variation} v
 * @property {number} zone the place it lives in @property {number} generation when it was born
 * @property {number} bornT watchT at its birth @property {number} showAt when it appears on the map, in watchT
 * @property {null|number} since when its glow started, in watchT
 *
 * @typedef {Object} Rise the fast-forward after a follow (scope decisions 67 and 68)
 * @property {import("./cohorts.js").Variation} v @property {number} zone the line's place
 * @property {number} id the baby it started from @property {number} generation when it started
 * @property {number[]} counts the line at the follow and after each generation of it
 * @property {null|"reached"|"flat"|"fell"|"cap"|"small"|"crowded"|"gone"|"ended"} outcome why it stopped: RISE_TO
 *   reached, the count stopped rising or fell, RISE_MAX generations, fewer than FAST_FROM at the follow (none at all),
 *   some of the line would be crowded out next, the line died out during it, or the story ended
 *
 * @typedef {Object} Home where the child chose the family will live (scope decision 70)
 * @property {number} zone @property {number} id the baby on the card chosen @property {number} generation when
 * @property {number} mark its number, which marks the relatives it made (HOME_MARK)
 * @property {number} sizeAtChoice the family's animals living there then: the line it began as
 * @property {number[]} counts the line at the choice and after each generation, until the first follow
 * @property {null|"reached"|"cap"|"gone"} outcome why its fast-forward stopped: PLACE_TO reached, PLACE_MAX generations, or
 *   the line died out during it @property {null|number} until the generation it stopped
 * @property {number} [goneAt] the generation its line died out, when it did
 * @property {boolean} roomy the place had plenty of room when the child chose it: "Lots of room here!"
 *
 * @typedef {Object} Offer an option on the backup choice panel
 * @property {import("./cohorts.js").Variation} v @property {number} id the animal shown
 * @property {number} zone
 *
 * @typedef {Object} Choice a follow
 * @property {import("./cohorts.js").Variation} v
 * @property {string} group "a darker coat": what the followed animals have
 * @property {string} trait engine trait name
 * @property {boolean} neutral an engine neutral trait
 * @property {boolean} byChance picked at random on the backup panel because time ran out
 * @property {boolean} back the way back from a direction the line clearly died off in ("Go back?")
 * @property {number} generation when it was followed
 * @property {number} zone the line's place
 * @property {number} anchor the baby (or animal) the follow started from
 * @property {number} mark its number, which marks the relatives it made (bridge.js)
 * @property {number} sizeAtChoice the line it narrowed to @property {null|number} sizeAtEnd the line when the next follow
 *   replaced it, the story ended, or it died out (0)
 * @property {number} relativesAtChoice the relatives in its place then @property {null|number} relativesAtEnd and at its end
 * @property {number} peak the line's biggest since @property {number[]} counts the line at the follow and after each generation
 * @property {null|{outcome:string, counts:number[], generations:number, until:number}} rise its fast-forward, once it stopped
 * @property {null|{line:number, relatives:number, after:number}} result the line and its relatives here when its result
 *   went the table's way (guessNow), for the ending
 * @property {boolean} asked its result came: asked about (a new discovery), or told as a line (scope decision 69)
 *
 * @typedef {Object} TreeAnimal an animal on the family tree strip
 * @property {number} id @property {ArrayLike<number>} genome its real body @property {number} zone
 * @property {"first"|"baby"|"between"} kind the first one tapped, a followed baby, or an ancestor in between (drawn smaller)
 * @property {string} label "First mother", "Sleeker body" (a followed baby: the trait it was followed for), "Mother"
 * @property {boolean} joined its mother line reaches the animal before it on the strip ("→"), or not ("…")
 *
 * @typedef {Object} Chip a trait on "Your line so far" (scope decisions 59 and 68)
 * @property {import("./cohorts.js").Variation} v
 * @property {null|"hurt"|"lost"} faded null while the line still has it (FADED_BELOW)
 */
