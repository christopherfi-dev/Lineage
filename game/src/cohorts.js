/**
 * The variations a line's newborns show, and the ones its animals have spread
 * (scope decisions 32, 42 and 59). DOM-free. A follow narrows the line to its
 * animals with one of them (story.js, scope decisions 67 and 68); the fair
 * tests this file once made, twins of the same age with and without the
 * variation, left what the child sees in scope decision 67.
 * Observer state only: nothing here touches the biology.
 */

import { TRAIT_INDEX } from "./engine.js";
import { APART, TRAIT_WORDS, carries, isNeutral, variationWords, variationsOf } from "./variations.js";

/** At most this many newborns glow at a time (the calm rule). */
export const GLOW_MAX = 3;
/** A newborn glows for the generation it is born in and the next one. */
export const GLOW_GENERATIONS = 2;
/** At most this many options on the backup choice panel. */
export const PUSH_OPTIONS = 3;

/**
 * A variation fixed as a threshold (the replacement rule's, "rule B"): the
 * group's median for the trait plus or minus APART, in one direction.
 * @param {string} trait @param {number} dir +1 more, -1 less
 * @param {{median:number, level:number}} usual the group's usual form for this trait
 * @param {number} value the value of the animal that shows it
 * @returns {Variation}
 */
export function variationFor(trait, dir, usual, value) {
  const t = TRAIT_INDEX[trait];
  return {
    trait, t, dir,
    thr: usual.median + dir * APART,
    words: variationWords(trait, dir, value, usual.level),
    group: TRAIT_WORDS[trait][dir > 0 ? 1 : 0],
    neutral: isNeutral(t),
  };
}

/**
 * The variation a newborn shows: the trait that is new in it at birth, against
 * its group's usual form. Null when it has none, or when its body is not far
 * enough from the group's usual to carry it.
 * @param {import("./bridge.js").Bridge} bridge
 * @param {number} id
 * @param {Array<{median:number, level:number}>} form the group's usual form
 */
export function newbornVariation(bridge, id, form) {
  const nt = bridge.newTraitOf(id), ind = bridge.get(id);
  if (!nt || !ind) return null;
  const t = TRAIT_INDEX[nt.trait], dir = nt.up ? 1 : -1;
  const v = variationFor(nt.trait, dir, form[t], ind.bodyGenome[t]);
  return carries(ind.bodyGenome, v) ? v : null;
}

/** The place where most of these animals live (engine zone index). */
export function placeOf(animals) {
  const n = [0, 0, 0];
  for (const a of animals) n[a.zone]++;
  return n.indexOf(Math.max(...n));
}

/**
 * The variations the line's animals in its place have spread (at least
 * three carry one), each with the carrier that shows it most. For the backup
 * choice panel.
 * @param {Array<{id:number, genome:ArrayLike<number>, zone:number}>} members the line's animals in its place
 * @param {number} zone
 * @returns {Array<{v:Variation, id:number, zone:number}>}
 */
export function familyVariations(members, zone) {
  return variationsOf(members).map((x) => {
    const v = variationFor(x.trait, x.dir, x.usual, x.usual.median + x.dir * APART);
    const shows = (m) => (m.genome[x.t] - x.usual.median) * x.dir;
    const best = x.carriers.slice().sort((a, b) => shows(b) - shows(a))[0];
    v.words = variationWords(x.trait, x.dir, best.genome[x.t], x.usual.level);
    return { v, id: best.id, zone };
  });
}

/** Same variation: same trait, same way. */
export const sameVariation = (a, b) => a.trait === b.trait && a.dir === b.dir;

/**
 * @typedef {Object} Variation
 * @property {string} trait engine trait name
 * @property {number} t trait index
 * @property {number} dir +1 more, -1 less than the group's usual
 * @property {number} thr the trait value it takes to carry it, fixed when it is found
 * @property {string} words "webbed feet", for "This one has webbed feet."
 * @property {string} group "more webbing between the toes": what every carrier has
 * @property {boolean} neutral an engine neutral trait (coat shade, ear tips, tail tip)
 */
