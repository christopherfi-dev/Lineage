/**
 * One line of real evidence for the ending, not the answer: the group's most
 * distinctive trait when the story ended, counted in another habitat when the
 * story began and now. "Animals with webbed feet at the water's edge: 14 then,
 * 22 now." Every number is read from the engine state. DOM-free.
 */

import { TRAITS, MEANINGFUL_TRAIT_INDICES } from "./engine.js";
import { levelOf } from "./variations.js";

/**
 * How many animals have each word level of each trait, in each habitat.
 * @param {Array<{genome:ArrayLike<number>, zone:number}>} animals
 * @returns {number[][][]} counts by [trait][level][zone]
 */
export function census(animals) {
  const counts = TRAITS.map(() => [0, 1, 2].map(() => [0, 0, 0]));
  for (const a of animals) for (let t = 0; t < TRAITS.length; t++) counts[t][levelOf(a.genome[t])][a.zone]++;
  return counts;
}

/** The habitat most of these animals live in (engine zone index). */
export function mainZoneOf(animals) {
  const n = [0, 0, 0];
  for (const a of animals) n[a.zone]++;
  return n.indexOf(Math.max(...n));
}

const mean = (animals, t) => animals.reduce((sum, a) => sum + a.genome[t], 0) / animals.length;

/**
 * The evidence for an ending. Only the seven traits that affect survival are
 * looked at, so the clue is always about an adaptation.
 *
 * The group is everyone who belonged to it since it last formed (the last
 * choice, or the start of the story for a family), not just its last few
 * survivors, so a family that dies at generation 3 is still described by what
 * made it that family. Its most distinctive trait is the one where its average
 * is furthest from the rest of the world's, and it is counted at that trait's
 * far end in the group's direction ("webbed feet" for a group with more
 * webbing than the rest), in the other habitat where that count changed most
 * since the story began.
 * @param {Array<{id:number, genome:ArrayLike<number>, zone:number}>} group
 * @param {Array<{id:number, genome:ArrayLike<number>, zone:number}>} living every animal alive now
 * @param {number[][][]} then census(...) when the story began
 * @returns {null|Evidence}
 */
export function evidenceFor(group, living, then) {
  if (!group.length) return null;
  const inGroup = new Set(group.map((a) => a.id));
  const rest = living.filter((a) => !inGroup.has(a.id));
  const now = census(living);
  const home = mainZoneOf(group);
  const ranked = MEANINGFUL_TRAIT_INDICES.map((t) => {
    const mine = mean(group, t), theirs = rest.length ? mean(rest, t) : mine;
    return { t, level: mine > theirs ? 2 : 0, gap: Math.abs(mine - theirs) };
  }).sort((a, b) => b.gap - a.gap);
  for (const { t, level } of ranked) {
    let best = null;
    for (const zone of [0, 1, 2]) {
      if (zone === home) continue;
      const a = then[t][level][zone], b = now[t][level][zone];
      if (a + b === 0) continue;
      if (!best || Math.abs(b - a) > Math.abs(best.now - best.then) ||
        (Math.abs(b - a) === Math.abs(best.now - best.then) && a + b > best.then + best.now)) {
        best = { trait: TRAITS[t], level, zone, home, then: a, now: b };
      }
    }
    if (best) return best;
  }
  return null;
}

/**
 * @typedef {Object} Evidence
 * @property {string} trait engine trait name
 * @property {number} level word level counted: 0 the low end, 2 the high end
 * @property {number} zone the other habitat counted
 * @property {number} home the group's main habitat
 * @property {number} then how many had it there when the story began
 * @property {number} now how many have it there now
 */
