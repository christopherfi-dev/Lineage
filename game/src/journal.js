/**
 * The prediction journal (Step 6; scope decisions 25, 28–31 and 35). After
 * every third follow, one question about what happens next, made from the story's
 * real state through the written table in docs/LINEAGE_PREDICTION_QUESTIONS.md
 * (this file must match it). Each question has one reasonable answer and two
 * or three common Grade 3 misconceptions. The child's answer is shown later
 * beside what really happened. Nothing is ever marked wrong, and there are no
 * scores. DOM-free.
 */

import { TRAITS, PLACE_EFFECTS } from "./engine.js";
import { TRAIT_WORDS, isNeutral } from "./variations.js";
import { ZONE_AT, shortGroup, lineWithLabel, RELATIVES_HERE } from "./narration.js";
import { whyLine } from "./why.js";
import { better } from "./groups.js";

/** A prediction comes right after these follows: the child's 1st, 4th, 7th, 10th and 13th. */
export const PREDICT_AFTER = [1, 4, 7, 10, 13];
/** Seconds to answer before the story goes on without a prediction (no random pick). */
export const JOURNAL_SECONDS = 15;

/**
 * The question types, taking turns by prediction (scope decisions 35 and
 * 68): your line with the variation, then your line against your relatives
 * there. The old "ones not chosen", "where" and fair-test types went with the
 * groups they were about.
 */
const CYCLE = ["line", "relatives"];

/**
 * What a trait does for survival in a habitat, from the engine's Classroom
 * mode (scope decision 55): 1 it helps, -1 it hurts, 0 it doesn't matter
 * there (a "~", or a neutral trait).
 */
export function netEffect(t, zone) {
  return PLACE_EFFECTS[t][zone];
}

/** A trait that doesn't matter in this habitat: a neutral one anywhere, or a "~" there. */
const noMatter = (t, zone) => isNeutral(t) || netEffect(t, zone) === 0;

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

/** The reasonable answer gives the table's reason there (docs/LINEAGE_WHY.md, scope decision 60). */
const helpLine = (t, zone) => `Grow. ${whyLine(t, zone)}`;
const hurtLine = (t, zone) => `Shrink. ${whyLine(t, zone)}`;
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
  if (noMatter(t, zone)) {
    options.push({ text: `${cap(words)} won't matter. Other traits will decide.`, outcome: "nomatter", reasonable: true, words });
    options.push({ text: `Grow. ${cap(words)} will help them.`, outcome: "grow", tag: "matters" });
  } else {
    const helps = dir * netEffect(t, zone) > 0;
    options.push({ text: helps ? helpLine(t, zone) : hurtLine(t, zone), outcome: helps ? "grow" : "shrink", reasonable: true });
  }
  options.push({ text: "Grow, because I picked them.", outcome: "grow", tag: "chose" });
  options.push({ text: `Grow. ${needLine(trait, dir)}`, outcome: "grow", tag: "need" });
  if (options.length < 4) options.push({ text: "Stay the same. Animals don't change.", outcome: "same", tag: "same" });
  return options;
}

/**
 * The line-against-relatives question's options (scope decision 68): which
 * will do better, the child's line with the variation or their relatives
 * there, with the reasonable answer first.
 * @param {import("./cohorts.js").Variation} v the variation followed
 * @param {number} zone the line's place
 */
function relativesOptions(v, zone) {
  const words = v.group, options = [];
  if (noMatter(v.t, zone)) {
    options.push({ text: `About the same. ${cap(words)} won't matter.`, outcome: "same", reasonable: true });
    options.push({ text: `Your line. ${cap(words)} will help them.`, outcome: "line", tag: "matters" });
  } else {
    const helps = v.dir * netEffect(v.t, zone) > 0;
    options.push(helps ?
      { text: `Your line. ${whyLine(v.t, zone)}`, outcome: "line", reasonable: true } :
      { text: `Your relatives. ${whyLine(v.t, zone)}`, outcome: "relatives", reasonable: true });
  }
  options.push({ text: "Your line, because I picked them.", outcome: "line", tag: "chose" });
  options.push({ text: `Your line. ${needLine(v.trait, v.dir)}`, outcome: "line", tag: "need" });
  if (options.length < 4 && !noMatter(v.t, zone)) options.push({ text: "About the same. It's all luck.", outcome: "same", tag: "luck" });
  return options;
}

/* ================= the question ================= */

/**
 * The question right after a follow, from the story's real state.
 * @param {import("./story.js").Story} story just after the child's follow
 * @param {{v:import("./cohorts.js").Variation}} chosen what the child followed
 * @param {number} slot which prediction of the story this is: 0 for the first
 * @returns {Question}
 */
export function questionFor(story, chosen, slot) {
  const c = story.choices[story.choices.length - 1], v = chosen.v, zone = c.zone, words = shortGroup(v.group);
  const fits = { line: true, relatives: c.relativesAtChoice > 0 };
  const start = CYCLE[slot % CYCLE.length];
  const type = [start, ...CYCLE.filter((x) => x !== start)].find((x) => fits[x]);
  // The question names the trait and the place (scope decision 60): "Some of your animals now have longer back
  // legs. They live in the high leaves. What will happen?"
  const has = `Some of your animals now have ${words}. They live ${ZONE_AT[zone]}.`;
  if (type === "line") return { type, text: `${has} What will happen?`, options: growOptions(v.trait, v.dir, zone), subject: { c, name: story.name } };
  return {
    type, text: `${has} Which will do better, your line or your relatives?`,
    options: relativesOptions(v, zone),
    subject: { c, name: story.name },
  };
}

/* ================= what really happened ================= */

const went = (then, now) => (now === 0 ? "died" : now > then ? "grow" : now < then ? "shrink" : "same");
const THOUGHT = { grow: "would grow", shrink: "would shrink", same: "would stay the same" };
const HAPPENED = { grow: "grew", shrink: "shrank", same: "stayed the same", died: "died out" };
const THOUGHT_KIN = { line: "You thought your line would do better.", relatives: "You thought your relatives would do better.", same: "You thought they'd do about the same." };
const HAPPENED_KIN = { line: "Your line did better.", relatives: "Your relatives did better.", same: "They did about the same." };

/**
 * What really happened since the prediction's follow, as count rows and short
 * lines: its line, and for the second type its relatives there, when the
 * line was replaced by the next follow, died out, or the story ended; else
 * now. Called at the next "Since your last choice" panel, or at the ending.
 * @param {Prediction} p
 * @param {import("./story.js").Story} story
 * @returns {Result}
 */
export function resultOf(p, story) {
  const q = p.question, a = p.answer, c = q.subject.c, lines = [], reasonable = q.options.find((o) => o.reasonable);
  const line = { then: c.sizeAtChoice, now: c.sizeAtEnd ?? story.family.now };
  const kin = { then: c.relativesAtChoice, now: c.relativesAtEnd ?? story.bridge.relativesIn(c.zone) };
  const label = lineWithLabel(c.group, q.subject.name);
  let rows, came;
  if (q.type === "line") {
    const actual = went(line.then, line.now);
    rows = [{ label, ...line, kin: false }];
    lines.push(a.outcome === "nomatter" ?
      `You thought ${a.words} wouldn't matter. It didn't.` :
      `You thought it ${THOUGHT[a.outcome]}. It ${HAPPENED[actual]}.`);
    came = reasonable.outcome === "nomatter" || reasonable.outcome === actual;
  } else {
    // Which did better: by how much each grew (groups.js), so a small line and many relatives compare.
    const b = better(line, kin), actual = b > 0 ? "line" : b < 0 ? "relatives" : "same";
    rows = [{ label, ...line, kin: false }, { label: RELATIVES_HERE, ...kin, kin: true }];
    lines.push(THOUGHT_KIN[a.outcome], line.now + kin.now === 0 ? "Both died out." : HAPPENED_KIN[actual]);
    came = reasonable.outcome === actual;
  }
  if (a.tag === "need") lines.push(NEED_LINE);
  if (a.tag === "chose") lines.push(CHOSE_LINE);
  return { rows, lines, came };
}

/**
 * @typedef {Object} Answer
 * @property {string} text what the option says
 * @property {"grow"|"shrink"|"same"|"nomatter"|"line"|"relatives"} outcome what it predicts
 * @property {boolean} [reasonable] the one reasonable answer
 * @property {"chose"|"need"|"same"|"matters"|"luck"} [tag] which misconception it is
 * @property {string} [words] the trait, for "won't matter"
 *
 * @typedef {Object} Question
 * @property {"line"|"relatives"} type
 * @property {string} text
 * @property {Answer[]} options the reasonable answer first (shown in a random order)
 * @property {{c:import("./story.js").Choice, name:null|string}} subject the follow it is about, and the family's name
 *
 * @typedef {Object} Prediction
 * @property {Question} question
 * @property {Answer} answer the child's answer
 * @property {number} choice the follow it came after (1, 4, 7, 10 or 13)
 * @property {null|Result} result filled in at the next follow, or at the ending
 *
 * @typedef {Object} Result
 * @property {Array<{label:string, then:number, now:number, kin:boolean}>} rows the line, and its relatives there
 * @property {string[]} lines "You thought it would grow. It grew." and, after a misconception, one more
 * @property {boolean} came whether the reasonable answer is what happened
 */
