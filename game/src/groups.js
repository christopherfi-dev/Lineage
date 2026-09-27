/**
 * Other groups and other places, as a child sees them (playtest round). DOM-free.
 *
 * A card for an animal outside the child's group sums up its group: the fair
 * test's others, or otherwise its family, a mother line as in families.js. Its
 * count then (at the latest follow, or when the story began) and now sits
 * beside the child's group's, and the traits where it differs most from the
 * child's group are named. A place's summary counts the animals living there.
 * Every number is read from the engine state.
 */

import { TRAITS, MEANINGFUL_TRAIT_INDICES } from "./engine.js";
import { levelOf } from "./variations.js";
import { GAP } from "./reveal.js";
import { netEffect } from "./journal.js";

/** A trait fits a habitat when it helps there at least this much of what it helps in the habitat where it helps most. */
const FITS = 0.25;
/** An animal spends "some" of its time in a habitat from this share (a fifth). */
export const SOMETIMES = 0.2;

/**
 * Where an animal spends its time (the engine's time allocation): its habitat,
 * and the other one it spends SOMETIMES or more in, if any.
 * @param {ArrayLike<number>} time [leaves, ground, water] @param {number} zone the engine's habitat for it
 * @returns {{zone:number, sometimes:null|number}}
 */
export function timeSplit(time, zone) {
  const other = [0, 1, 2].filter((z) => z !== zone).sort((a, b) => time[b] - time[a])[0];
  return { zone, sometimes: time[other] >= SOMETIMES ? other : null };
}

/**
 * A meaningful trait that doesn't fit where an animal (or a group, by its
 * average) lives: it has the trait at its high end, and there it helps less
 * than FITS of what it helps in the habitat where it helps most, by the
 * engine's own trait effects. The worst fit, or null.
 * @param {ArrayLike<number>} values trait values (a genome, or a group's averages)
 * @param {number} zone where it lives
 * @returns {null|{trait:string, best:number}}
 */
export function misfit(values, zone) {
  let worst = null;
  for (const t of MEANINGFUL_TRAIT_INDICES) {
    if (levelOf(values[t]) !== 2) continue;
    const net = [0, 1, 2].map((z) => netEffect(t, z)), best = net.indexOf(Math.max(...net));
    if (net[best] <= 0 || net[zone] >= FITS * net[best]) continue;
    const gap = net[best] - net[zone];
    if (!worst || gap > worst.gap) worst = { trait: TRAITS[t], best, gap };
  }
  return worst && { trait: worst.trait, best: worst.best };
}

/** At most this many differences on a card. */
export const MAX_DIFFERENCES = 3;
/** One group is doing better than another when it grew by this much more (as a ratio of now to then). */
const BETTER = 1.1;

/**
 * The family an animal belongs to since the latest follow: the family a tap on
 * its forebear who was born by then would follow (families.js top). So "then"
 * counts the same line when the follow happened.
 * @param {import("./bridge.js").Bridge} bridge
 * @param {{generation:number, living:number[]}} mark who was alive at the latest follow (story.js)
 * @param {number} id
 * @returns {{then:number, now:number, ids:number[]}}
 */
export function familySince(bridge, mark, id) {
  const fam = bridge.families;
  let a = id;
  for (;;) {
    const born = fam.born.get(a), m = fam.mother.get(a);
    if (born === undefined || born <= mark.generation || m === undefined) break;
    a = m;
  }
  const root = fam.top(a, fam.lineCounts(bridge.livingIds()));
  const ids = [...fam.members(root, bridge.livingIds())];
  return { then: fam.members(root, mark.living).size, now: ids.length, ids };
}

/**
 * Which of two groups did better since then: +1 the first, -1 the second, 0
 * about the same. By how much each grew, so groups of different sizes compare.
 * @param {{then:number, now:number}} a @param {{then:number, now:number}} b
 */
export function better(a, b) {
  const ra = (a.now + 0.5) / (a.then + 0.5), rb = (b.now + 0.5) / (b.then + 0.5);
  return ra >= rb * BETTER ? 1 : rb >= ra * BETTER ? -1 : 0;
}

/**
 * The meaningful traits where one group's average differs most from another's,
 * by GAP or more (the reveal's gap), largest first. A fair test's others were
 * picked for not having its variation, so that trait comes first whenever
 * they do have less of it than yours, by any amount.
 * @param {Array<{genome:ArrayLike<number>}>} theirs @param {Array<{genome:ArrayLike<number>}>} yours
 * @param {number} [max] @param {null|{t:number, dir:number}} [test] the fair test's variation, for its others
 * @returns {Array<{trait:string, dir:number}>}
 */
export function differences(theirs, yours, max = MAX_DIFFERENCES, test = null) {
  if (!theirs.length || !yours.length) return [];
  const mean = (list, t) => list.reduce((s, a) => s + a.genome[t], 0) / list.length;
  const all = MEANINGFUL_TRAIT_INDICES.map((t) => ({ t, trait: TRAITS[t], d: mean(theirs, t) - mean(yours, t) }));
  const first = test ? all.find((x) => x.t === test.t && x.d * test.dir < 0) : null;
  return [...(first ? [first] : []), ...all.filter((x) => x !== first && Math.abs(x.d) >= GAP).sort((x, y) => Math.abs(y.d) - Math.abs(x.d))]
    .slice(0, max).map((x) => ({ trait: x.trait, dir: Math.sign(x.d) }));
}

/**
 * A place now: how many live there, which way that went since the generation
 * before, and the meaningful trait at its high end that the most of them have.
 * @param {Array<{genome:ArrayLike<number>, zone:number}>} living every animal alive now
 * @param {number} zone @param {null|number} before how many lived there a generation ago
 * @returns {{n:number, trend:"up"|"down"|"same", common:null|{trait:string, share:number}}}
 */
export function placeNow(living, zone, before) {
  const here = living.filter((a) => a.zone === zone), n = here.length;
  const trend = before === null || before === n ? "same" : n > before ? "up" : "down";
  let common = null;
  for (const t of MEANINGFUL_TRAIT_INDICES) {
    const share = n ? here.filter((a) => levelOf(a.genome[t]) === 2).length / n : 0;
    if (!common || share > common.share) common = { trait: TRAITS[t], share };
  }
  return { n, trend, common };
}
