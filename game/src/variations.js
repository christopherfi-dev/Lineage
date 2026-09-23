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

import { TRAITS } from "./engine.js";

/** How far from the group's median a member's trait must be to carry a variation. */
export const APART = 0.12;

/** A variation can be chosen once this many group members carry it (scope decision 6). */
export const MIN_CARRIERS = 3;

/** At most this many animals to choose from. */
export const MAX_OPTIONS = 3;

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
  toe_webbing: ["toes with no webbing", "some webbing between the toes", "webbed feet"],
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

/** A group's traits as a list: [label, [low, middle, high]] for each trait. */
const ROWS = {
  toe_webbing: ["Feet", ["no webbing", "some webbing", "webbed"]],
  curved_claws: ["Claws", ["straight", "a bit curved", "curved"]],
  dense_fur: ["Fur", ["thin", "medium", "thick"]],
  long_hindlimbs: ["Back legs", ["short", "medium", "long"]],
  strong_tail: ["Tail", ["weak", "medium", "strong"]],
  large_eyes: ["Eyes", ["small", "medium", "big"]],
  streamlined_body: ["Body", ["chunky", "medium", "sleek"]],
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
 * The choice at a choice point: up to MAX_OPTIONS group members, each
 * carrying a different variation (different traits) that at least
 * MIN_CARRIERS members carry. Each option's animal is the carrier who shows
 * it most. Fewer than two options means there is no choice at this point.
 * @param {Array<{id:number, genome:ArrayLike<number>}>} members
 * @param {number} [apart] for measuring other values of APART
 * @returns {Option[]}
 */
export function choiceOptions(members, apart = APART) {
  const options = [], usedTraits = new Set(), usedAnimals = new Set();
  for (const v of variationsOf(members, apart)) {
    if (options.length === MAX_OPTIONS) break;
    if (usedTraits.has(v.trait)) continue;
    const shows = (m) => (m.genome[v.t] - v.usual.median) * v.dir;
    const animal = v.carriers.filter((m) => !usedAnimals.has(m.id)).sort((a, b) => shows(b) - shows(a))[0];
    if (!animal) continue;
    usedTraits.add(v.trait);
    usedAnimals.add(animal.id);
    options.push({
      id: animal.id,
      trait: v.trait,
      t: v.t,
      dir: v.dir,
      thr: v.usual.median + v.dir * apart,
      words: variationWords(v.trait, v.dir, animal.genome[v.t], v.usual.level),
      group: TRAIT_WORDS[v.trait][v.dir > 0 ? 1 : 0],
      carriers: v.carriers.map((m) => m.id),
    });
  }
  return options;
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

/** The member closest to the group's average body, to picture the group. */
export function typicalOf(members) {
  const avg = averageOf(members.map((m) => m.genome));
  const off = (m) => avg.reduce((sum, a, t) => sum + Math.abs(m.genome[t] - a.mean), 0);
  return members.reduce((best, m) => (off(m) < off(best) ? m : best), members[0]);
}

/**
 * A group's traits in plain words, marking the ones whose word changed since `from`.
 * @param {Array<{level:number}>} form
 * @param {Array<{level:number}>} [from]
 */
export function traitRows(form, from) {
  return TRAITS.map((trait, t) => {
    const [label, words] = ROWS[trait];
    return { label, value: words[form[t].level], changed: !!from && from[t].level !== form[t].level };
  });
}

/**
 * @typedef {Object} Option
 * @property {number} id the animal to show
 * @property {string} trait engine trait name
 * @property {number} t trait index
 * @property {number} dir +1 more, -1 less than the group's usual
 * @property {number} thr the trait value it takes to carry this variation, fixed when offered
 * @property {string} words "webbed feet", for "This one has webbed feet."
 * @property {string} group "more webbing between the toes": the group of every animal that carries it
 * @property {number[]} carriers every group member who carries this variation
 */
