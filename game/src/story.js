/**
 * The story loop (scope decision 6). DOM-free: the page and the measurement
 * scripts drive the same rules.
 *
 * waiting ─tap─▶ watch ─▶ choice ─choose─▶ skip ─▶ watch ─▶ … ─▶ ended
 *
 * Time waits for the child: no generation runs until a family is followed.
 * After a short watch, the world pauses at a choice point: two or three
 * family members, each carrying a different variation that at least three
 * members carry. The child chooses whom to follow, never what mutates.
 * Following a choice narrows the story to the mother lines of that
 * variation's carriers, and the world fast-forwards. The story ends when the
 * followed line dies out, or after STORY_CHOICES choices.
 *
 * Nothing here touches the biology. Following is observer state only.
 */

import { APART, choiceOptions, formOf } from "./variations.js";

/** Real seconds per generation while watching. */
export const GENERATION_SECONDS = 8;
/** Real seconds per generation while fast-forwarding. */
export const FAST_SECONDS = 0.8;
/** Generations watched at normal speed before each choice point. */
export const WATCH_GENERATIONS = 3;
/** Seconds the child has to choose before one option is picked at random. */
export const CHOICE_SECONDS = 20;
/** Generations fast-forwarded after each choice. */
export const SKIP_GENERATIONS = 10;
/** The story ends after this many choices. */
export const STORY_CHOICES = 5;

const RULES = { watch: WATCH_GENERATIONS, skip: SKIP_GENERATIONS, choices: STORY_CHOICES, apart: APART };

export class Story {
  /**
   * @param {import("./bridge.js").Bridge} bridge
   * @param {{watch:number, skip:number, choices:number, apart:number}} [rules] for measuring other values
   */
  constructor(bridge, rules = RULES) {
    this.bridge = bridge;
    this.rules = rules;
    /** @type {"waiting"|"watch"|"choice"|"skip"|"ended"} */
    this.phase = "waiting";
    /** @type {null|import("./variations.js").Option[]} the choice on offer */
    this.options = null;
    /** @type {Array<{words:string, byChance:boolean, generation:number}>} */
    this.choices = [];
    this.watched = 0;
    this.skipped = 0;
    this.startGeneration = 0;
    this.endGeneration = null;
    /** @type {null|"died"|"survived"} */
    this.outcome = null;
    this.startForm = null;
    this.lastForm = null;
    /** the family's form just before the latest choice */
    this.formBeforeChoice = null;
    /** @type {Array<{id:number, genome:ArrayLike<number>}>} the members the family last had alive, for the ending */
    this.lastAnimals = [];
  }

  get running() { return this.phase === "watch" || this.phase === "skip"; }
  get fast() { return this.phase === "skip"; }
  get lasted() { return (this.endGeneration ?? this.bridge.generation) - this.startGeneration; }

  /** The child taps an animal and follows its family. Time starts now. */
  begin(id) {
    const follow = this.bridge.followFamilyOf(id);
    this.startGeneration = this.bridge.generation;
    this.phase = "watch";
    this.watched = 0;
    this.remember();
    this.startForm = this.lastForm;
    return follow;
  }

  remember() {
    this.lastAnimals = this.bridge.followedAnimals();
    this.lastForm = formOf(this.lastAnimals.map((a) => a.genome));
  }

  /**
   * After each engine generation.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @returns {"ended"|"choice"|"no-choice"|"skip-done"|null} what the story did
   */
  afterGeneration(ev) {
    const f = ev.family;
    if (!f || !this.running) return null;
    if (f.count === 0) return this.end("died", ev.generation);
    this.remember();
    if (this.phase === "skip") {
      if (++this.skipped < this.rules.skip) return null;
      if (this.choices.length >= this.rules.choices) return this.end("survived", ev.generation);
      this.phase = "watch";
      this.watched = 0;
      return "skip-done";
    }
    if (++this.watched < this.rules.watch) return null;
    // A choice needs two variations that have spread; until then, keep watching.
    const options = choiceOptions(this.bridge.followedAnimals(), this.rules.apart);
    if (options.length < 2) return "no-choice";
    this.options = options;
    this.phase = "choice";
    return "choice";
  }

  /**
   * Follow one option: the story narrows to the mother lines of every family
   * member carrying its variation, then fast-forwards.
   * @param {import("./variations.js").Option} option
   * @param {boolean} byChance picked at random because time ran out
   */
  choose(option, byChance) {
    this.choices.push({ words: option.words, byChance, generation: this.bridge.generation });
    this.formBeforeChoice = this.lastForm;
    this.bridge.followLinesOf(option.carriers);
    this.options = null;
    this.phase = "skip";
    this.skipped = 0;
    this.remember();
  }

  end(outcome, generation) {
    this.phase = "ended";
    this.outcome = outcome;
    this.endGeneration = generation;
    return "ended";
  }
}
