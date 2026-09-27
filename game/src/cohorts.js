/**
 * Fair tests inside the family (scope decisions 32–33, 36–37 and 59). DOM-free.
 *
 * A newborn in the child's family with a new variation glows. Following it
 * starts a fair test in the place where most of the family lives: the
 * family's animals there with the variation against the family's animals
 * there without it. Each of yours gets a twin without it of the same age and
 * about as well suited to the place in every other trait (fitness there from
 * its other traits, within TWIN_FIT), then the one spending about as much
 * time there. So the variation is the only real difference between the sides.
 * Only when the family has too few pairs for MIN_SIZE, animals from nearby
 * fill in, those sharing the family's earlier chosen traits first. A test has
 * at most MAX_SIZE pairs. Both groups then change the same way, by babies
 * whose mother is in the group and by deaths, so plain counts compare fairly.
 * Observer state only: nothing here touches the biology.
 */

import { TRAIT_INDEX, PLACE_EFFECTS, placeFitness } from "./engine.js";
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
/** Twins are this close in fitness from their other traits, in the place of the test (as measured in Part 1). */
export const TWIN_FIT = 0.05;

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

/** How well suited an animal is to a place in every trait but this one. */
export const fitnessBut = (genome, t, zone) => placeFitness(genome)[zone] - genome[t] * PLACE_EFFECTS[t][zone];

/** A fixed shuffle of ids, for picking between equals without favouring old or young ones. */
const hashed = (id) => {
  let h = Math.imul(id ^ 0x5bd1e995, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/**
 * The fair test on a variation, as it would start now (scope decision 59).
 * @param {import("./bridge.js").Bridge} bridge
 * @param {Variation} v
 * @param {object} o
 * @param {number} o.zone where most of the family lives
 * @param {Set<number>} o.family the family's living animals
 * @param {number} o.anchor the animal the test starts from (the tapped newborn)
 * @param {Variation[]} [o.chosen] the family's earlier chosen variations: nearby animals sharing them fill in first
 * @param {(id:number)=>null|{x:number,y:number}} [o.homeOf] where each animal's spot is (herd.js)
 * @param {number} [o.min] @param {number} [o.max]
 * @returns {{mine:number[], theirs:number[], fromFamily:number, fromNearby:number, carriers:number}} twins at the same
 *   index; how many of yours are the family's and how many came from nearby; the family's carriers in the place
 */
export function formFamilyTest(bridge, v, { zone, family, anchor, chosen = [], homeOf = () => null, min = MIN_SIZE, max = MAX_SIZE }) {
  const here = [];
  for (const ind of bridge.living) {
    if (bridge.zoneOf(ind.id) !== zone) continue;
    here.push({ id: ind.id, genome: ind.bodyGenome, age: ind.ageGenerations, time: ind.timeAllocation[zone], fam: family.has(ind.id) });
  }
  const fit = new Map(here.map((a) => [a.id, fitnessBut(a.genome, v.t, zone)]));
  const at = homeOf(anchor);
  const far = (a) => { const h = at && homeOf(a.id); return h ? Math.hypot(h.x - at.x, h.y - at.y) : Math.abs(a.id - anchor); };
  const shares = (a) => chosen.filter((c) => carries(a.genome, c)).length;
  const nearest = (list) => list.sort((a, b) => (b.id === anchor) - (a.id === anchor) || far(a) - far(b) || a.id - b.id);
  const likeFamily = (list) => list.sort((a, b) => shares(b) - shares(a) || far(a) - far(b) || a.id - b.id);
  const has = (a) => carries(a.genome, v);
  const famCar = nearest(here.filter((a) => a.fam && has(a))), famNon = here.filter((a) => a.fam && !has(a));
  const mine = [], theirs = [];
  // Each of yours gets a twin: the same age, about as well suited here in every other trait, then about as much time here.
  const pairUp = (carriers, pool, upTo) => {
    const left = [];
    for (const c of carriers) {
      if (mine.length >= upTo) { left.push(c); continue; }
      let best = null, bd = Infinity;
      for (const o of pool) {
        if (o.age !== c.age) continue;
        const df = Math.abs(fit.get(o.id) - fit.get(c.id));
        if (df > TWIN_FIT) continue;
        const d = df + 0.5 * Math.abs(o.time - c.time);
        if (d < bd || (d === bd && hashed(o.id) < hashed(best.id))) { bd = d; best = o; }
      }
      if (!best) { left.push(c); continue; }
      pool.splice(pool.indexOf(best), 1);
      mine.push(c.id); theirs.push(best.id);
    }
    return left;
  };
  const unpaired = pairUp(famCar, famNon, max);
  const fromFamily = mine.length;
  // Too few from the family: nearby animals fill in, up to MIN_SIZE, those sharing the family's earlier choices first.
  if (mine.length < min) {
    const nearCar = likeFamily(here.filter((a) => !a.fam && has(a))), nearNon = likeFamily(here.filter((a) => !a.fam && !has(a)));
    pairUp([...unpaired, ...nearCar], [...famNon, ...nearNon], min);
  }
  const inFamily = mine.filter((id) => family.has(id)).length;
  return { mine, theirs, fromFamily: inFamily, fromNearby: mine.length - inFamily, carriers: famCar.length, paired: fromFamily };
}

/**
 * The variations the family's animals in its place have spread (at least
 * three carry one), each with the carrier that shows it most. For the backup
 * choice panel.
 * @param {Array<{id:number, genome:ArrayLike<number>, zone:number}>} members the family's animals in its place
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
