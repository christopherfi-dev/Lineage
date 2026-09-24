/**
 * Fair-test cohorts (scope decisions 32–33 and 36–37). DOM-free.
 *
 * A newborn in the child's group with a new variation glows. Following it
 * makes two groups of the same size in the newborn's habitat: the animals
 * that carry the variation, the newborn first and then the nearest, and a
 * twin for each of them that doesn't carry it, "the others here". The size is
 * the smaller side, at most MAX_SIZE; a test needs at least MIN_SIZE. Both
 * groups then change the same way, by babies whose mother is in the group and
 * by deaths, so plain counts compare fairly. Observer state only: nothing
 * here touches the biology.
 */

import { TRAIT_INDEX } from "./engine.js";
import { APART, TRAIT_WORDS, carries, isNeutral, variationWords, variationsOf } from "./variations.js";

/** A fair test's two groups start with at most this many animals each. */
export const MAX_SIZE = 20;
/** A fair test needs at least this many animals on each side. */
export const MIN_SIZE = 10;
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

/**
 * The two sides of a variation in one habitat: every living animal there that
 * carries it, and every one that doesn't.
 * @returns {{carriers:number[], others:number[]}}
 */
export function sidesIn(bridge, v, zone) {
  const carriers = [], others = [];
  for (const ind of bridge.living) {
    if (bridge.zoneOf(ind.id) !== zone) continue;
    (carries(ind.bodyGenome, v) ? carriers : others).push(ind.id);
  }
  return { carriers, others };
}

/** A fair test's size: the smaller side, at most MAX_SIZE. Both groups start with exactly this many. */
export const testSize = (sides, max = MAX_SIZE) => Math.min(sides.carriers.length, sides.others.length, max);

/** A fair test can start when both sides have at least MIN_SIZE animals. */
export const canStart = (sides, min = MIN_SIZE, max = MAX_SIZE) => testSize(sides, max) >= min;

/**
 * The two groups of a fair test, `size` each. Yours: the anchor, then the
 * carriers nearest it. The others here: for each of yours in turn, the
 * nearest non-carrier not already taken, its twin, so the two groups stand
 * side by side on the map. "Nearest" is measured between the animals' home
 * spots on the map (herd.js), which are placed the same way in the game and
 * in a measurement.
 * @param {{carriers:number[], others:number[]}} sides
 * @param {number} anchor the animal the child tapped (a carrier)
 * @param {(id:number)=>null|{x:number,y:number}} homeOf
 * @param {number} size testSize(sides)
 */
export function formCohorts(sides, anchor, homeOf, size) {
  const far = (from, id) => {
    const a = homeOf(from), b = a && homeOf(id);
    return b ? Math.hypot(b.x - a.x, b.y - a.y) : Math.abs(id - from);
  };
  const nearest = (from, ids) => ids.map((id) => ({ id, d: far(from, id) })).sort((a, b) => a.d - b.d || a.id - b.id).map((x) => x.id);
  const mine = [anchor, ...nearest(anchor, sides.carriers.filter((id) => id !== anchor))].slice(0, size);
  const free = new Set(sides.others), theirs = [];
  for (const m of mine) {
    let twin = null, best = Infinity;
    for (const id of free) {
      const d = far(m, id);
      if (d < best || (d === best && id < twin)) { best = d; twin = id; }
    }
    if (twin === null) break;
    free.delete(twin);
    theirs.push(twin);
  }
  return { mine, theirs };
}

/**
 * The variations a group has spread (at least three members carry one), each
 * with the habitat where it could start a fair test and the member who shows
 * it most there. For the backup choice panel.
 * @param {import("./bridge.js").Bridge} bridge
 * @param {Array<{id:number, genome:ArrayLike<number>, zone:number}>} members
 * @returns {Array<{v:Variation, id:number, zone:number, count:number}>}
 */
export function spreadVariations(bridge, members, min = MIN_SIZE, max = MAX_SIZE) {
  const found = [];
  for (const x of variationsOf(members)) {
    const v = variationFor(x.trait, x.dir, x.usual, x.usual.median + x.dir * APART);
    // The habitat where most of the group's carriers live, if a test can start there.
    const n = [0, 0, 0];
    for (const m of x.carriers) n[m.zone]++;
    const zone = n.indexOf(Math.max(...n));
    const sides = sidesIn(bridge, v, zone);
    if (!canStart(sides, min, max)) continue;
    const shows = (m) => (m.genome[x.t] - x.usual.median) * x.dir;
    const best = x.carriers.filter((m) => m.zone === zone).sort((a, b) => shows(b) - shows(a))[0];
    v.words = variationWords(x.trait, x.dir, best.genome[x.t], x.usual.level);
    found.push({ v, id: best.id, zone, count: testSize(sides, max) });
  }
  return found;
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
