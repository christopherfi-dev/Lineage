/**
 * Variations within a group, in plain words. DOM-free.
 *
 * Every engine body trait is a number from 0 to 1, and siblings differ a
 * little in each. A group's usual form is its median for each trait. A
 * variation is one way of being different from that, in one trait and one
 * direction ("more webbing between the toes"). A member carries it when her
 * value is at least APART from the group's median that way, which is enough
 * for the difference to show. Once chosen, a variation is fixed as that
 * threshold, so any animal anywhere can be checked against it.
 */

import { TRAITS, NEUTRAL_TRAIT_INDICES } from "./engine.js";

/** How far from the group's median a member's trait must be to carry a variation. */
export const APART = 0.12;

/** A group has spread a variation once this many of its members carry it. */
export const MIN_CARRIERS = 3;

/**
 * True for the engine's three neutral traits (coat shade, ear tips, tail tip):
 * they have no effect on survival and cost nothing. They are offered like any
 * other variation, and the choice card never says so (scope decision 8).
 */
export const isNeutral = (t) => NEUTRAL_TRAIT_INDICES.includes(t);

/** Three levels for words: low, middle, high. */
export const levelOf = (v) => (v < 1 / 3 ? 0 : v < 2 / 3 ? 1 : 2);

/** [less, more] than the rest of the group, for each trait in engine order. */
export const TRAIT_WORDS = {
  toe_webbing: ["less webbing between the toes", "more webbing between the toes"],
  curved_claws: ["straighter claws", "more curved claws"],
  dense_fur: ["thinner fur", "thicker fur"],
  long_hindlimbs: ["shorter back legs", "longer back legs"],
  strong_tail: ["a weaker tail", "a stronger tail"],
  large_eyes: ["smaller eyes", "bigger eyes"],
  streamlined_body: ["a chunkier body", "a sleeker body"],
  coat_shade: ["a darker coat", "a lighter coat"],
  ear_tip_shape: ["rounder ear tips", "pointier ear tips"],
  tail_tip_marking: ["a plainer tail tip", "a brighter tail tip"],
};

/** What an animal has at each level: [low, middle, high]. */
const HAS = {
  toe_webbing: ["no webbing between the toes", "some webbing between the toes", "webbed feet"],
  curved_claws: ["straight claws", "slightly curved claws", "curved claws"],
  dense_fur: ["thin fur", "medium fur", "thick fur"],
  long_hindlimbs: ["short back legs", "medium back legs", "long back legs"],
  strong_tail: ["a weak tail", "a medium tail", "a strong tail"],
  large_eyes: ["small eyes", "medium eyes", "big eyes"],
  streamlined_body: ["a chunky body", "a medium body", "a sleek body"],
  coat_shade: ["a dark coat", "a medium coat", "a light coat"],
  ear_tip_shape: ["round ear tips", "slightly pointy ear tips", "pointy ear tips"],
  tail_tip_marking: ["a plain tail tip", "a faint mark on the tail tip", "a bright tail tip"],
};

/** "webbed feet": what an animal with this trait at this level has. */
export const hasWords = (trait, level) => HAS[trait][level];

/** A neutral trait's label and plain words: [label, [low, middle, high]]. */
const ROWS = {
  coat_shade: ["Coat", ["dark", "medium", "light"]],
  ear_tip_shape: ["Ear tips", ["round", "a bit pointy", "pointy"]],
  tail_tip_marking: ["Tail tip", ["plain", "a faint mark", "a bright mark"]],
};

function median(values) {
  const s = [...values].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

/**
 * A group's usual form: its median and word level for each trait.
 * @param {ArrayLike<number>[]} genomes the members' body genomes
 * @returns {Array<{median:number, level:number}>}
 */
export function formOf(genomes) {
  return TRAITS.map((_, t) => {
    const m = median(genomes.map((g) => g[t]));
    return { median: m, level: levelOf(m) };
  });
}

/**
 * Every variation in a group that at least MIN_CARRIERS members carry, most
 * carried first.
 * @param {Array<{id:number, genome:ArrayLike<number>}>} members
 * @param {number} [apart] for measuring other values of APART
 */
export function variationsOf(members, apart = APART) {
  if (members.length < MIN_CARRIERS) return [];
  const form = formOf(members.map((m) => m.genome));
  const found = [];
  TRAITS.forEach((trait, t) => {
    for (const dir of [1, -1]) {
      const carriers = members.filter((m) => (m.genome[t] - form[t].median) * dir >= apart);
      if (carriers.length >= MIN_CARRIERS) found.push({ trait, t, dir, carriers, usual: form[t] });
    }
  });
  return found.sort((a, b) => b.carriers.length - a.carriers.length || a.t - b.t);
}

/** "webbed feet" when she is at the far end the group isn't, else "more webbing between the toes". */
export function variationWords(trait, dir, value, usualLevel) {
  const level = levelOf(value), end = dir > 0 ? 2 : 0;
  if (level === end && usualLevel !== end) return HAS[trait][end];
  return TRAIT_WORDS[trait][dir > 0 ? 1 : 0];
}

/**
 * Traits whose usual word changed from one form to another, where the median
 * also moved at least `minMove` (so a median sitting on a word's edge doesn't count).
 * @returns {Array<{trait:string, level:number}>}
 */
export function changedTraits(from, to, minMove = 0.1) {
  return TRAITS.map((trait, t) => ({ trait, t, level: to[t].level }))
    .filter(({ t }) => to[t].level !== from[t].level && Math.abs(to[t].median - from[t].median) >= minMove);
}

/** True when this body carries the variation: past its threshold, its way. */
export const carries = (genome, v) => (genome[v.t] - v.thr) * v.dir >= 0;

/**
 * A group's actual average body: its mean and word level for each trait.
 * @param {ArrayLike<number>[]} genomes
 * @returns {Array<{mean:number, level:number}>}
 */
export function averageOf(genomes) {
  return TRAITS.map((_, t) => {
    const m = genomes.reduce((sum, g) => sum + g[t], 0) / genomes.length;
    return { mean: m, level: levelOf(m) };
  });
}

/**
 * The seven meaningful traits compared with the generation-0 world (scope
 * decision 20): [label, lower, higher]. The same GAP as the reveal decides
 * "about the same". The three neutral traits keep their plain words.
 */
const COMPARED = {
  toe_webbing: ["Feet", "Less webbing than at the start", "More webbing than at the start"],
  curved_claws: ["Claws", "Straighter than at the start", "More curved than at the start"],
  dense_fur: ["Fur", "Thinner than at the start", "Thicker than at the start"],
  long_hindlimbs: ["Back legs", "Shorter than at the start", "Longer than at the start"],
  strong_tail: ["Tail", "Weaker than at the start", "Stronger than at the start"],
  large_eyes: ["Eyes", "Smaller than at the start", "Bigger than at the start"],
  streamlined_body: ["Body", "Chunkier than at the start", "Sleeker than at the start"],
};
export const ABOUT_THE_SAME = "About the same as at the start";

/**
 * A body's traits in kid language: each meaningful trait against the
 * generation-0 world average (lower, higher or about the same, by `gap`), each
 * neutral trait in its plain words.
 * @param {ArrayLike<number>} values the body's value (or a group's mean) for each trait
 * @param {ArrayLike<number>} base the generation-0 world mean for each trait
 * @param {number} gap how far from it counts as different (the reveal's GAP)
 * @returns {Array<{trait:string, label:string, value:string, changed:boolean}>}
 */
export function comparedRows(values, base, gap) {
  return TRAITS.map((trait, t) => {
    if (!COMPARED[trait]) {
      const [label, words] = ROWS[trait];
      return { trait, label, value: words[levelOf(values[t])], changed: false };
    }
    const [label, lower, higher] = COMPARED[trait], d = values[t] - base[t];
    return { trait, label, value: d >= gap ? higher : d <= -gap ? lower : ABOUT_THE_SAME, changed: Math.abs(d) >= gap };
  });
}

/**
 * What a creature card says an animal has, in plain words (scope decision 22):
 * [low, middle, high], split at thirds like the story's variation words.
 */
const PLAIN = {
  toe_webbing: ["Hardly any webbing between the toes", "Some webbing between the toes", "Lots of webbing between the toes"],
  curved_claws: ["Straight claws", "Slightly curved claws", "Curved claws"],
  dense_fur: ["Thin fur", "Medium fur", "Thick fur"],
  long_hindlimbs: ["Short back legs", "Medium back legs", "Long back legs"],
  strong_tail: ["A weak tail", "A medium tail", "A strong tail"],
  large_eyes: ["Small eyes", "Medium eyes", "Big eyes"],
  streamlined_body: ["A chunky body", "A medium body", "A sleek body"],
  coat_shade: ["A dark coat", "A medium coat", "A light coat"],
  ear_tip_shape: ["Round ear tips", "Slightly pointy ear tips", "Pointy ear tips"],
  tail_tip_marking: ["A plain tail tip", "A faint mark on the tail tip", "A bright mark on the tail tip"],
};

/**
 * One animal's ten traits in plain words, for its creature card.
 * @param {ArrayLike<number>} values its body genome
 * @returns {Array<{trait:string, value:string}>}
 */
export function plainRows(values) {
  return TRAITS.map((trait, t) => ({ trait, value: PLAIN[trait][levelOf(values[t])] }));
}

/**
 * @typedef {Object} Option
 * @property {number} t trait index
 * @property {number} dir +1 more, -1 less than the group's usual
 * @property {number} thr the trait value it takes to carry this variation, fixed when found
 */
