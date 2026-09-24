/**
 * The prediction journal (Step 6; scope decisions 25 and 28–31). After every
 * third choice, one question about what happens next, made from the story's
 * real state through the written table in docs/LINEAGE_PREDICTION_QUESTIONS.md
 * (this file must match it). Each question has one reasonable answer and two
 * or three common Grade 3 misconceptions. The child's answer is shown later
 * beside what really happened. Nothing is ever marked wrong, and there are no
 * scores. DOM-free.
 */

import { TRAITS, EFFECT, UPKEEP, currentModelConfig } from "./engine.js";
import { TRAIT_WORDS, hasWords, isNeutral, levelOf } from "./variations.js";
import { mainZoneOf } from "./evidence.js";
import { ZONE_AT, theOnesWith } from "./narration.js";

/** A prediction comes right after these choices: the child's 1st, 4th, 7th, 10th and 13th. */
export const PREDICT_AFTER = [1, 4, 7, 10, 13];
/** Seconds to answer before the story goes on without a prediction (no random pick). */
export const JOURNAL_SECONDS = 15;

/** The question types, cycled through by prediction: your group, the ones not chosen, where. */
const CYCLE = ["mine", "others", "where"];

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
/** "the water's edge", for "You thought the water's edge." */
const ZONE_NAME = ["the high leaves", "the open ground", "the water's edge"];

/** After an answer, while it stays on screen. */
export const JOURNAL_NOTE = "Let's see what happens after the fast-forward.";
/** Heading of the result in the next "Since your last choice" panel. */
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
 * @param {boolean} mine your group (else the ones not chosen)
 */
function growOptions(trait, dir, zone, animals, mine) {
  const t = TRAITS.indexOf(trait), words = TRAIT_WORDS[trait][dir > 0 ? 1 : 0];
  const options = [];
  if (isNeutral(t)) {
    options.push({ text: `${cap(words)} won't matter. Other traits will decide.`, outcome: "nomatter", reasonable: true, words });
    options.push({ text: `Grow. ${cap(words)} will help them.`, outcome: "grow", tag: "matters" });
  } else {
    const helps = dir * netEffect(t, zone) > 0;
    options.push({ text: helps ? helpLine(words, trait, zone) : hurtLine(words, trait, zone), outcome: helps ? "grow" : "shrink", reasonable: true });
  }
  options.push(mine ?
    { text: "Grow, because I picked them.", outcome: "grow", tag: "chose" } :
    { text: "They'll disappear, because I didn't pick them.", outcome: "disappear", tag: "chose" });
  const need = needTrait(zone, animals);
  if (need) options.push({ text: needGrow(need), outcome: "grow", tag: "need", need });
  if (options.length < 4) options.push({ text: "Stay the same. Animals don't change.", outcome: "same", tag: "same" });
  return options;
}

/* ================= the question ================= */

/**
 * The question right after a choice, from the story's real state.
 * @param {import("./story.js").Story} story just after the child's choice
 * @param {import("./bridge.js").Bridge} bridge
 * @param {import("./variations.js").Option} chosen the option the child chose
 * @param {number} slot which prediction of the story this is: 0 for the first
 * @returns {Question}
 */
export function questionFor(story, bridge, chosen, slot) {
  const last = chosen, t = last.t, dir = last.dir;
  const group = bridge.followedAnimals(), zone = mainZoneOf(group);
  const shown = story.others.filter((o) => o.members.size > 0);
  const fits = { mine: true, others: shown.length > 0, where: !isNeutral(t) };
  const start = CYCLE[slot % CYCLE.length];
  const type = [start, ...CYCLE.filter((x) => x !== start)].find((x) => fits[x]);
  const words = TRAIT_WORDS[last.trait][dir > 0 ? 1 : 0];

  if (type === "mine") {
    return {
      type, text: "Will your new group grow or shrink?",
      options: growOptions(last.trait, dir, zone, group, true),
      subject: { then: story.sizeAtChoice },
    };
  }
  if (type === "others") {
    // The biggest group not chosen.
    const o = shown.reduce((a, b) => (b.sizeAtChoice > a.sizeAtChoice ? b : a));
    const theirs = [...o.members].map((id) => bridge.animal(id));
    return {
      type, text: `Will ${theOnesWith(o.option.group).toLowerCase()} grow or shrink?`,
      options: growOptions(o.option.trait, o.option.dir, mainZoneOf(theirs), theirs, false),
      subject: { option: o.option, then: o.sizeAtChoice },
    };
  }
  // Where: every habitat for the chosen trait, best first; the misconceptions after.
  const byZone = [0, 1, 2].map((z) => dir * netEffect(t, z));
  const best = byZone.indexOf(Math.max(...byZone));
  const options = [{ text: `${cap(ZONE_AT[best])}.`, outcome: "zone", zone: best, reasonable: true }];
  if (zone !== best) options.push({ text: "Where they live now.", outcome: "zone", zone, tag: "home" });
  options.push({ text: "The same everywhere. It's all luck.", outcome: "luck", tag: "luck" });
  options.push({ text: "Anywhere. They'll grow what they need.", outcome: "anywhere", tag: "need" });
  return {
    type, text: `Where will animals with ${words} do best?`,
    options,
    subject: { then: countByZone(group) },
  };
}

function countByZone(animals) {
  const n = [0, 0, 0];
  for (const a of animals) n[a.zone]++;
  return n;
}

/* ================= what really happened ================= */

const went = (then, now) => (now === 0 ? "died" : now > then ? "grow" : now < then ? "shrink" : "same");
const THOUGHT = { grow: "would grow", shrink: "would shrink", same: "would stay the same", disappear: "would disappear" };
const HAPPENED = { grow: "grew", shrink: "shrank", same: "stayed the same", died: "died out" };

/**
 * What really happened since the prediction, as count rows and short lines.
 * Called at the next "Since your last choice" panel, or at the ending.
 * @param {Prediction} p
 * @param {import("./story.js").Story} story
 * @param {import("./bridge.js").Bridge} bridge
 * @returns {Result}
 */
export function resultOf(p, story, bridge) {
  const q = p.question, a = p.answer, lines = [];
  let rows, came;
  if (q.type === "mine" || q.type === "others") {
    const mine = q.type === "mine";
    const now = mine ? story.mine.now : (story.others.find((o) => o.option === q.subject.option)?.members.size ?? 0);
    const actual = went(q.subject.then, now);
    rows = [{ label: mine ? "Yours" : theOnesWith(q.subject.option.group), then: q.subject.then, now, mine }];
    const who = mine ? "It" : "They", pronoun = mine ? "it" : "they";
    lines.push(a.outcome === "nomatter" ?
      `You thought ${a.words} wouldn't matter. It didn't.` :
      `You thought ${pronoun} ${THOUGHT[a.outcome]}. ${who} ${HAPPENED[actual]}.`);
    const reasonable = q.options.find((o) => o.reasonable);
    came = reasonable.outcome === "nomatter" || reasonable.outcome === actual;
  } else {
    const now = countByZone(bridge.followedAnimals());
    rows = [0, 1, 2].map((z) => ({ label: cap(ZONE_AT[z]), then: q.subject.then[z], now: now[z], mine: true }));
    const best = bestZone(q.subject.then, now);
    const thought = a.outcome === "zone" ? ZONE_NAME[a.zone] : a.outcome === "luck" ? "it wouldn't matter" : "anywhere";
    lines.push(`You thought ${thought}. ${best === null ? "They died out." : `They did best ${ZONE_AT[best]}.`}`);
    came = best === q.options.find((o) => o.reasonable).zone;
  }
  if (a.tag === "need") lines.push(NEED_LINE);
  if (a.tag === "chose") lines.push(CHOSE_LINE);
  return { rows, lines, came };
}

/** The habitat where these animals did best: the biggest growth, as a ratio. Null if none is left. */
function bestZone(then, now) {
  if (now.every((n) => n === 0)) return null;
  const score = (z) => (then[z] + now[z] < 3 ? -Infinity : (now[z] + 1) / (then[z] + 1));
  return [0, 1, 2].reduce((b, z) => (score(z) > score(b) || (score(z) === score(b) && now[z] > now[b]) ? z : b), 0);
}

/**
 * @typedef {Object} Answer
 * @property {string} text what the option says
 * @property {"grow"|"shrink"|"same"|"disappear"|"nomatter"|"zone"|"luck"|"anywhere"} outcome what it predicts
 * @property {boolean} [reasonable] the one reasonable answer
 * @property {"chose"|"need"|"same"|"matters"|"home"|"luck"} [tag] which misconception it is
 * @property {number} [zone] for a habitat answer
 * @property {string} [words] the trait, for "won't matter"
 *
 * @typedef {Object} Question
 * @property {"mine"|"others"|"where"} type
 * @property {string} text
 * @property {Answer[]} options the reasonable answer first (shown in a random order)
 * @property {Object} subject what to measure later
 *
 * @typedef {Object} Prediction
 * @property {Question} question
 * @property {Answer} answer the child's answer
 * @property {number} choice the choice it followed (1, 4, 7, 10 or 13)
 * @property {null|Result} result filled in at the next choice point, or at the ending
 *
 * @typedef {Object} Result
 * @property {Array<{label:string, then:number, now:number, mine:boolean}>} rows
 * @property {string[]} lines "You thought it would grow. It grew." and, after a misconception, one more
 * @property {boolean} came whether the reasonable answer is what happened
 */
