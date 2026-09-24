/**
 * The prediction journal (Step 6; scope decisions 25, 28–31 and 35). After
 * every third follow, one question about what happens next, made from the story's
 * real state through the written table in docs/LINEAGE_PREDICTION_QUESTIONS.md
 * (this file must match it). Each question has one reasonable answer and two
 * or three common Grade 3 misconceptions. The child's answer is shown later
 * beside what really happened. Nothing is ever marked wrong, and there are no
 * scores. DOM-free.
 */

import { TRAITS, EFFECT, UPKEEP, currentModelConfig } from "./engine.js";
import { TRAIT_WORDS, hasWords, isNeutral, levelOf } from "./variations.js";
import { ZONE_AT, YOURS, OTHERS_HERE } from "./narration.js";

/** A prediction comes right after these follows: the child's 1st, 4th, 7th, 10th and 13th. */
export const PREDICT_AFTER = [1, 4, 7, 10, 13];
/** Seconds to answer before the story goes on without a prediction (no random pick). */
export const JOURNAL_SECONDS = 15;

/**
 * The question types, taking turns by prediction: your group, then the fair test
 * (scope decision 35). The old "ones not chosen" and "where" types went with the
 * groups they were about: no group is made from an option not chosen, and a
 * fair test's groups start in one habitat.
 */
const CYCLE = ["mine", "fair"];

/** "Need" only fits a trait the habitat clearly rewards: at least this much, per unit of the trait. */
const NEED_MIN = 0.8;

const { zoneWeights, zoneScarcity } = currentModelConfig;

/**
 * What one unit of a trait does for survival in a habitat: its benefits there
 * minus its upkeep, from the engine's own numbers.
 */
export function netEffect(t, zone) {
  return zoneWeights[zone].reduce((sum, w, d) => sum + w * EFFECT[t][d], 0) - zoneScarcity[zone] * UPKEEP[t];
}

/* ================= words (every line under about 12 words) ================= */

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Variation words that take a plural verb: "more curved claws help". */
const PLURAL = new Set(["curved_claws", "long_hindlimbs", "large_eyes", "ear_tip_shape"]);
/** "Webbed feet", "curved claws"…: the high-end words that are plural ("because they need them"). */
const PLURAL_HAS = new Set(["toe_webbing", "curved_claws", "long_hindlimbs", "large_eyes"]);

/** After an answer, while it stays on screen. */
export const JOURNAL_NOTE = "Let's see what happens after the fast-forward.";
/** Heading of the result in the next "Since your last choice" panel (at the next follow). */
export const PREDICTION_TITLE = "Your prediction:";
/** Under the ending's "Your predictions": this is simulation history, not real animals. */
export const SIMULATION_STORY = "A story from the simulation.";

/** The line added when the child picked the "need" misconception (scope decision 30). */
export const NEED_LINE = "Animals can't grow a trait because they need it. Babies are just born different.";
/** The line added when the child thought choosing changes the animals. */
export const CHOSE_LINE = "Your choice doesn't change the animals. It picks who you follow.";

const helpLine = (words, trait, zone) => `Grow. ${cap(words)} ${PLURAL.has(trait) ? "help" : "helps"} ${ZONE_AT[zone]}.`;
const hurtLine = (words, trait, zone) => `Shrink. ${cap(words)} ${PLURAL.has(trait) ? "don't" : "doesn't"} help ${ZONE_AT[zone]}.`;
const needGrow = (trait) => `Grow. They'll grow ${hasWords(trait, 2)} because they need ${PLURAL_HAS.has(trait) ? "them" : "it"}.`;

/**
 * The trait "need" would be about: the one the habitat rewards most that these
 * animals don't already have. Null when there is none, so "need" doesn't fit.
 */
function needTrait(zone, animals) {
  if (!animals.length) return null;
  const ranked = TRAITS.map((trait, t) => ({ trait, t, net: netEffect(t, zone) }))
    .filter((x) => !isNeutral(x.t) && x.net >= NEED_MIN).sort((a, b) => b.net - a.net);
  for (const x of ranked) {
    const mean = animals.reduce((sum, a) => sum + a.genome[x.t], 0) / animals.length;
    if (levelOf(mean) < 2) return x.trait;
  }
  return null;
}

/**
 * Grow-or-shrink options for a group with a variation, in a habitat: the
 * reasonable answer first, then up to three misconceptions.
 * @param {string} trait @param {number} dir @param {number} zone the group's main habitat
 * @param {Array<{genome:ArrayLike<number>}>} animals its members
 */
function growOptions(trait, dir, zone, animals) {
  const t = TRAITS.indexOf(trait), words = TRAIT_WORDS[trait][dir > 0 ? 1 : 0];
  const options = [];
  if (isNeutral(t)) {
    options.push({ text: `${cap(words)} won't matter. Other traits will decide.`, outcome: "nomatter", reasonable: true, words });
    options.push({ text: `Grow. ${cap(words)} will help them.`, outcome: "grow", tag: "matters" });
  } else {
    const helps = dir * netEffect(t, zone) > 0;
    options.push({ text: helps ? helpLine(words, trait, zone) : hurtLine(words, trait, zone), outcome: helps ? "grow" : "shrink", reasonable: true });
  }
  options.push({ text: "Grow, because I picked them.", outcome: "grow", tag: "chose" });
  const need = needTrait(zone, animals);
  if (need) options.push({ text: needGrow(need), outcome: "grow", tag: "need", need });
  if (options.length < 4) options.push({ text: "Stay the same. Animals don't change.", outcome: "same", tag: "same" });
  return options;
}

/* ================= the question ================= */

/**
 * The fair-test question's options (scope decision 35): which group will do
 * better, yours or the others here, with the reasonable answer first.
 * @param {import("./cohorts.js").Variation} v the variation followed
 * @param {number} zone the habitat of the test
 * @param {Array<{genome:ArrayLike<number>}>} animals your group
 */
function fairOptions(v, zone, animals) {
  const words = v.group, options = [];
  if (v.neutral) {
    options.push({ text: `About the same. ${cap(words)} won't matter.`, outcome: "same", reasonable: true });
    options.push({ text: `Yours. ${cap(words)} will help them.`, outcome: "mine", tag: "matters" });
  } else {
    const helps = v.dir * netEffect(v.t, zone) > 0;
    options.push(helps ?
      { text: `Yours. ${cap(words)} ${PLURAL.has(v.trait) ? "help" : "helps"} ${ZONE_AT[zone]}.`, outcome: "mine", reasonable: true } :
      { text: `The others. ${cap(words)} ${PLURAL.has(v.trait) ? "don't" : "doesn't"} help ${ZONE_AT[zone]}.`, outcome: "theirs", reasonable: true });
  }
  options.push({ text: "Yours, because I picked them.", outcome: "mine", tag: "chose" });
  const need = needTrait(zone, animals);
  if (need) options.push({ text: `Yours. They'll grow ${hasWords(need, 2)} because they need ${PLURAL_HAS.has(need) ? "them" : "it"}.`, outcome: "mine", tag: "need", need });
  if (options.length < 4 && !v.neutral) options.push({ text: "About the same. It's all luck.", outcome: "same", tag: "luck" });
  return options;
}

/**
 * The question right after a follow, from the story's real state.
 * @param {import("./story.js").Story} story just after the child's follow
 * @param {import("./bridge.js").Bridge} bridge
 * @param {{v:import("./cohorts.js").Variation}} chosen what the child followed
 * @param {number} slot which prediction of the story this is: 0 for the first
 * @returns {Question}
 */
export function questionFor(story, bridge, chosen, slot) {
  const v = chosen.v, zone = story.fair.zone, group = bridge.followedAnimals();
  const fits = { mine: true, fair: bridge.otherIds().length > 0 };
  const start = CYCLE[slot % CYCLE.length];
  const type = [start, ...CYCLE.filter((x) => x !== start)].find((x) => fits[x]);
  if (type === "mine") {
    return {
      type, text: "Will your new group grow or shrink?",
      options: growOptions(v.trait, v.dir, zone, group),
      subject: { v, then: story.mine.then },
    };
  }
  return {
    type, text: "Which will do better: yours or the others here?",
    options: fairOptions(v, zone, group),
    subject: { v, mine: story.mine.then, theirs: story.theirs.then },
  };
}

/* ================= what really happened ================= */

const went = (then, now) => (now === 0 ? "died" : now > then ? "grow" : now < then ? "shrink" : "same");
const THOUGHT = { grow: "would grow", shrink: "would shrink", same: "would stay the same" };
const HAPPENED = { grow: "grew", shrink: "shrank", same: "stayed the same", died: "died out" };
const THOUGHT_FAIR = { mine: "You thought yours would do better.", theirs: "You thought the others would do better.", same: "You thought they'd do about the same." };
const HAPPENED_FAIR = { mine: "Yours did.", theirs: "The others did.", same: "They did the same." };

/**
 * What really happened since the prediction, as count rows and short lines.
 * Called at the next "Since your last choice" panel, or at the ending, while
 * the groups it is about are still the ones followed.
 * @param {Prediction} p
 * @param {import("./story.js").Story} story
 * @returns {Result}
 */
export function resultOf(p, story) {
  const q = p.question, a = p.answer, lines = [];
  const mine = story.mine.now, reasonable = q.options.find((o) => o.reasonable);
  let rows, came;
  if (q.type === "mine") {
    const actual = went(q.subject.then, mine);
    rows = [{ label: YOURS, then: q.subject.then, now: mine, mine: true }];
    lines.push(a.outcome === "nomatter" ?
      `You thought ${a.words} wouldn't matter. It didn't.` :
      `You thought it ${THOUGHT[a.outcome]}. It ${HAPPENED[actual]}.`);
    came = reasonable.outcome === "nomatter" || reasonable.outcome === actual;
  } else {
    const theirs = story.theirs.now;
    const actual = mine > theirs ? "mine" : theirs > mine ? "theirs" : "same";
    rows = [
      { label: `${YOURS} (${q.subject.v.group})`, then: q.subject.mine, now: mine, mine: true },
      { label: OTHERS_HERE, then: q.subject.theirs, now: theirs, mine: false },
    ];
    lines.push(`${THOUGHT_FAIR[a.outcome]} ${mine + theirs === 0 ? "Both died out." : HAPPENED_FAIR[actual]}`);
    came = reasonable.outcome === actual;
  }
  if (a.tag === "need") lines.push(NEED_LINE);
  if (a.tag === "chose") lines.push(CHOSE_LINE);
  return { rows, lines, came };
}

/**
 * @typedef {Object} Answer
 * @property {string} text what the option says
 * @property {"grow"|"shrink"|"same"|"nomatter"|"mine"|"theirs"} outcome what it predicts
 * @property {boolean} [reasonable] the one reasonable answer
 * @property {"chose"|"need"|"same"|"matters"|"luck"} [tag] which misconception it is
 * @property {string} [words] the trait, for "won't matter"
 *
 * @typedef {Object} Question
 * @property {"mine"|"fair"} type
 * @property {string} text
 * @property {Answer[]} options the reasonable answer first (shown in a random order)
 * @property {Object} subject what to measure later
 *
 * @typedef {Object} Prediction
 * @property {Question} question
 * @property {Answer} answer the child's answer
 * @property {number} choice the follow it came after (1, 4, 7, 10 or 13)
 * @property {null|Result} result filled in at the next follow, or at the ending
 *
 * @typedef {Object} Result
 * @property {Array<{label:string, then:number, now:number, mine:boolean}>} rows
 * @property {string[]} lines "You thought it would grow. It grew." and, after a misconception, one more
 * @property {boolean} came whether the reasonable answer is what happened
 */
