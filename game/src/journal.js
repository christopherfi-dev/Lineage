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
import { TRAIT_WORDS, isNeutral } from "./variations.js";
import { ZONE_AT, OTHERS_HERE, your, yoursLabel, yoursWith } from "./narration.js";

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
/**
 * The "need" misconception about the trait the child just chose: [less, more] than now.
 * All are plural ("because they need them") except webbing and fur ("it").
 */
const NEED_WORDS = {
  toe_webbing: ["even less webbing", "even more webbing"],
  curved_claws: ["even straighter claws", "even more curved claws"],
  dense_fur: ["even thinner fur", "even thicker fur"],
  long_hindlimbs: ["even shorter back legs", "even longer back legs"],
  strong_tail: ["even weaker tails", "even stronger tails"],
  large_eyes: ["even smaller eyes", "even bigger eyes"],
  streamlined_body: ["even chunkier bodies", "even sleeker bodies"],
  coat_shade: ["even darker coats", "even lighter coats"],
  ear_tip_shape: ["even rounder ear tips", "even pointier ear tips"],
  tail_tip_marking: ["even plainer tail tips", "even brighter tail tips"],
};
const NEED_IT = new Set(["toe_webbing", "dense_fur"]);

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
/**
 * The "need" misconception, always about the trait the child just chose:
 * "They'll grow even bigger eyes because they need them." ("get" for less of a trait).
 */
export const needLine = (trait, dir) =>
  `They'll ${dir > 0 ? "grow" : "get"} ${NEED_WORDS[trait][dir > 0 ? 1 : 0]} because they need ${NEED_IT.has(trait) ? "it" : "them"}.`;

/**
 * Grow-or-shrink options for a group with a variation, in a habitat: the
 * reasonable answer first, then three misconceptions, all about that variation.
 * @param {string} trait @param {number} dir @param {number} zone the group's main habitat
 */
function growOptions(trait, dir, zone) {
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
  options.push({ text: `Grow. ${needLine(trait, dir)}`, outcome: "grow", tag: "need" });
  if (options.length < 4) options.push({ text: "Stay the same. Animals don't change.", outcome: "same", tag: "same" });
  return options;
}

/* ================= the question ================= */

/**
 * The fair-test question's options (scope decision 35): which group will do
 * better, yours or the others here, with the reasonable answer first.
 * @param {import("./cohorts.js").Variation} v the variation followed
 * @param {number} zone the habitat of the test
 * @param {null|string} [name] the family's name: "Yours" becomes "Your Mossfoot animals"
 */
function fairOptions(v, zone, name = null) {
  const words = v.group, options = [], yours = yoursLabel(name);
  if (v.neutral) {
    options.push({ text: `About the same. ${cap(words)} won't matter.`, outcome: "same", reasonable: true });
    options.push({ text: `${yours}. ${cap(words)} will help them.`, outcome: "mine", tag: "matters" });
  } else {
    const helps = v.dir * netEffect(v.t, zone) > 0;
    options.push(helps ?
      { text: `${yours}. ${cap(words)} ${PLURAL.has(v.trait) ? "help" : "helps"} ${ZONE_AT[zone]}.`, outcome: "mine", reasonable: true } :
      { text: `The others. ${cap(words)} ${PLURAL.has(v.trait) ? "don't" : "doesn't"} help ${ZONE_AT[zone]}.`, outcome: "theirs", reasonable: true });
  }
  options.push({ text: `${yours}, because I picked them.`, outcome: "mine", tag: "chose" });
  options.push({ text: `${yours}. ${needLine(v.trait, v.dir)}`, outcome: "mine", tag: "need" });
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
  const v = chosen.v, zone = story.fair.zone;
  const fits = { mine: true, fair: bridge.otherIds().length > 0 };
  const start = CYCLE[slot % CYCLE.length];
  const type = [start, ...CYCLE.filter((x) => x !== start)].find((x) => fits[x]);
  const name = story.name ?? null;
  if (type === "mine") {
    return {
      type, text: `Will your new ${name ? `${name} ` : ""}group grow or shrink?`,
      options: growOptions(v.trait, v.dir, zone),
      subject: { v, then: story.mine.then },
    };
  }
  return {
    type, text: `Which will do better: ${name ? your("animals", name) : "yours"} or the others here?`,
    options: fairOptions(v, zone, name),
    subject: { v, mine: story.mine.then, theirs: story.theirs.then },
  };
}

/* ================= what really happened ================= */

const went = (then, now) => (now === 0 ? "died" : now > then ? "grow" : now < then ? "shrink" : "same");
const THOUGHT = { grow: "would grow", shrink: "would shrink", same: "would stay the same" };
const HAPPENED = { grow: "grew", shrink: "shrank", same: "stayed the same", died: "died out" };
const THOUGHT_FAIR = { mine: "You thought yours would do better.", theirs: "You thought the others would do better.", same: "You thought they'd do about the same." };
const HAPPENED_FAIR = { mine: "Yours did.", theirs: "The others did.", same: "They did the same." };
/** Once the family has a name, "yours" in the fair-test result reads "your Mossfoot animals". */
const thoughtFair = (outcome, name) => (name && outcome === "mine" ? `You thought ${your("animals", name)} would do better.` : THOUGHT_FAIR[outcome]);
const happenedFair = (actual, name) => (name && actual === "mine" ? `${yoursLabel(name)} did.` : HAPPENED_FAIR[actual]);

/**
 * What really happened since the prediction, as count rows and short lines.
 * Called at the next "Since your last choice" panel, or at the ending, while
 * the groups it is about are still the ones followed.
 * @param {Prediction} p
 * @param {import("./story.js").Story} story
 * @returns {Result}
 */
export function resultOf(p, story) {
  const q = p.question, a = p.answer, lines = [], name = story.name ?? null;
  const mine = story.mine.now, reasonable = q.options.find((o) => o.reasonable);
  let rows, came;
  if (q.type === "mine") {
    const actual = went(q.subject.then, mine);
    rows = [{ label: yoursLabel(name), then: q.subject.then, now: mine, mine: true }];
    lines.push(a.outcome === "nomatter" ?
      `You thought ${a.words} wouldn't matter. It didn't.` :
      `You thought it ${THOUGHT[a.outcome]}. It ${HAPPENED[actual]}.`);
    came = reasonable.outcome === "nomatter" || reasonable.outcome === actual;
  } else {
    const theirs = story.theirs.now;
    const actual = mine > theirs ? "mine" : theirs > mine ? "theirs" : "same";
    rows = [
      { label: yoursWith(q.subject.v.group, name), then: q.subject.mine, now: mine, mine: true },
      { label: OTHERS_HERE, then: q.subject.theirs, now: theirs, mine: false },
    ];
    lines.push(`${thoughtFair(a.outcome, name)} ${mine + theirs === 0 ? "Both died out." : happenedFair(actual, name)}`);
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
