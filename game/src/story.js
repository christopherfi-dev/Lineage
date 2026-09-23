/**
 * The story loop (scope decision 6). DOM-free: the page and the measurement
 * scripts drive the same rules.
 *
 * waiting ─tap─▶ watch ─▶ choice ─choose─▶ skip ─▶ watch ─▶ … ─▶ ended
 *
 * Time waits for the child: no generation runs until an animal is tapped, and
 * the story starts by following its family. After a watch the world pauses at
 * a choice point: two or three options, each a variation that at least three
 * of the group carry. The child chooses whom to follow, never what mutates.
 *
 * The adaptation rule is replacement: after a choice, the group is every
 * living animal, anywhere, that carries the chosen variation, and earlier
 * choices no longer count. The options not chosen stay on the map as groups of
 * their own, so the child can compare how each group did since the choice:
 * each is the animals with its variation but not the child's (scope decision 9).
 *
 * Choice points come on a fixed schedule. A point without two options passes,
 * and the world fast-forwards anyway, so every story that lasts ends at
 * STORY_GENERATIONS. The story ends early when no living animal fits the group.
 *
 * Nothing here touches the biology. Following is observer state only.
 */

import { APART, choiceOptions, formOf, isNeutral } from "./variations.js";
import { census, evidenceFor, mainZoneOf } from "./evidence.js";

/** Real seconds per generation while watching. */
export const GENERATION_SECONDS = 20;
/** Real seconds per generation while fast-forwarding. */
export const FAST_SECONDS = 2;
/** Generations watched before the first choice point. */
export const FIRST_WATCH_GENERATIONS = 4;
/** Generations watched before each later choice point. */
export const WATCH_GENERATIONS = 3;
/** Generations fast-forwarded after each choice point. */
export const SKIP_GENERATIONS = 2;
/** Seconds the child has to choose before one option is picked at random. */
export const CHOICE_SECONDS = 20;
/** Choice points in a story. */
export const STORY_CHOICES = 15;
/** The generation every story that lasts ends at: 4 + 14 × (2 + 3) + 2 = 76. */
export const STORY_GENERATIONS =
  FIRST_WATCH_GENERATIONS + (STORY_CHOICES - 1) * (SKIP_GENERATIONS + WATCH_GENERATIONS) + SKIP_GENERATIONS;

const RULES = {
  firstWatch: FIRST_WATCH_GENERATIONS, watch: WATCH_GENERATIONS, skip: SKIP_GENERATIONS,
  choices: STORY_CHOICES, apart: APART,
};

export class Story {
  /**
   * @param {import("./bridge.js").Bridge} bridge
   * @param {typeof RULES} [rules] for measuring other values
   */
  constructor(bridge, rules = RULES) {
    this.bridge = bridge;
    this.rules = rules;
    /** @type {"waiting"|"watch"|"choice"|"skip"|"ended"} */
    this.phase = "waiting";
    /** choice points reached, passed ones included */
    this.points = 0;
    /** @type {null|import("./variations.js").Option[]} the choice on offer */
    this.options = null;
    /** @type {Choice[]} */
    this.choices = [];
    /** @type {OtherGroup[]} the options not chosen at the latest choice, each a group of its own */
    this.others = [];
    /** your group's size right after the latest choice */
    this.sizeAtChoice = 0;
    this.watched = 0;
    this.skipped = 0;
    this.startGeneration = 0;
    this.endGeneration = null;
    /** @type {null|"died"|"survived"} */
    this.outcome = null;
    /** @type {Array<{id:number, genome:ArrayLike<number>, zone:number}>} the group's members at the start, for the ending */
    this.startAnimals = [];
    /** @type {Array<{id:number, genome:ArrayLike<number>, zone:number}>} the members the group last had alive */
    this.lastAnimals = [];
    this.lastForm = null;
    /** the group's usual form right after the latest choice point */
    this.formAtPoint = null;
    /** how many animals had each trait word in each habitat when the story began (evidence.js) */
    this.startCensus = null;
    /** @type {null|import("./evidence.js").Evidence} the ending's line of evidence */
    this.evidence = null;
    /** the habitat most of the group lived in at the end */
    this.mainZone = null;
    /** @type {Map<number, {id:number, genome:ArrayLike<number>, zone:number}>} everyone in the group since it last formed */
    this.segment = new Map();
  }

  get running() { return this.phase === "watch" || this.phase === "skip"; }
  get fast() { return this.phase === "skip"; }
  get lasted() { return (this.endGeneration ?? this.bridge.generation) - this.startGeneration; }
  /** "family" until the first choice, then "group". */
  get noun() { return this.choices.length ? "group" : "family"; }

  /** The child taps an animal and follows its family. Time starts now. */
  begin(id) {
    const follow = this.bridge.followFamilyOf(id);
    this.startGeneration = this.bridge.generation;
    this.phase = "watch";
    this.watched = 0;
    this.remember();
    this.startAnimals = this.lastAnimals;
    this.startCensus = census(this.bridge.livingAnimals());
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
   * @returns {"ended"|"choice"|"passed"|"skip-done"|null} what the story did
   */
  afterGeneration(ev) {
    const g = ev.group;
    if (!g || !this.running) return null;
    for (const o of this.others) o.members = this.othersOf(o.option);
    if (g.count === 0) return this.end("died", ev.generation);
    this.remember();
    if (this.phase === "skip") {
      if (++this.skipped < this.rules.skip) return null;
      if (this.points >= this.rules.choices) return this.end("survived", ev.generation);
      this.phase = "watch";
      this.watched = 0;
      return "skip-done";
    }
    if (++this.watched < (this.points === 0 ? this.rules.firstWatch : this.rules.watch)) return null;
    this.points++;
    const options = choiceOptions(this.lastAnimals, this.rules.apart);
    if (options.length < 2) {
      // Nothing has spread far enough to choose from: this point passes, and the world fast-forwards.
      this.formAtPoint = this.lastForm;
      this.phase = "skip";
      this.skipped = 0;
      return "passed";
    }
    this.options = options;
    this.phase = "choice";
    return "choice";
  }

  /**
   * Follow one option: the group becomes every living animal, anywhere, that
   * carries its variation. The other options become groups of their own. Then
   * the world fast-forwards.
   * @param {import("./variations.js").Option} option
   * @param {boolean} byChance picked at random because time ran out
   */
  choose(option, byChance) {
    this.closeChoice();
    this.sizeAtChoice = this.bridge.followVariation(option).members.size;
    this.choices.push({
      group: option.group, trait: option.trait, neutral: isNeutral(option.t), byChance,
      generation: this.bridge.generation, sizeAtChoice: this.sizeAtChoice, sizeAtEnd: null,
    });
    this.others = this.options.filter((o) => o !== option).map((o) => {
      const members = this.othersOf(o);
      return { option: o, members, sizeAtChoice: members.size };
    });
    this.options = null;
    this.phase = "skip";
    this.skipped = 0;
    this.segment = new Map(); // the group formed again
    this.remember();
    this.formAtPoint = this.lastForm;
  }

  /**
   * An option not chosen, as a group of its own: the animals with its
   * variation but not the child's (scope decision 9). The child's group is
   * exactly the carriers of the child's variation, so its members are left out.
   */
  othersOf(option) {
    const members = this.bridge.carriersOf(option);
    for (const id of this.bridge.followedIds()) members.delete(id);
    return members;
  }

  /** Your group's size now against right after the latest choice. */
  get mine() { return { now: this.bridge.followedIds().length, then: this.sizeAtChoice }; }

  /** The latest choice's group is about to be replaced, or the story ends: note its size. */
  closeChoice() {
    const last = this.choices[this.choices.length - 1];
    if (last && last.sizeAtEnd === null) last.sizeAtEnd = this.bridge.followedIds().length;
  }

  end(outcome, generation) {
    this.closeChoice();
    this.phase = "ended";
    this.outcome = outcome;
    this.endGeneration = generation;
    this.mainZone = mainZoneOf(this.lastAnimals);
    this.evidence = evidenceFor([...this.segment.values()], this.bridge.livingAnimals(), this.startCensus);
    return "ended";
  }
}

/**
 * @typedef {Object} OtherGroup
 * @property {import("./variations.js").Option} option the variation not chosen
 * @property {Set<number>} members every living animal that carries it but not the child's variation
 * @property {number} sizeAtChoice how many that was when it was not chosen
 *
 * @typedef {Object} Choice
 * @property {string} group "a darker coat": what the chosen animals have
 * @property {string} trait engine trait name
 * @property {boolean} neutral an engine neutral trait (coat shade, ear tips, tail tip)
 * @property {boolean} byChance picked at random because time ran out
 * @property {number} generation when it was chosen
 * @property {number} sizeAtChoice the group's size right after the choice
 * @property {null|number} sizeAtEnd its size when the next choice replaced it or the story ended
 */
