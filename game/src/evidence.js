/**
 * The ending's clue: real evidence, not the answer. Every number is read from
 * the engine state. DOM-free.
 *
 * The clue shows both sides (scope decision 14): in one habitat, the animals
 * with a trait against the ones without it, when the story began and now.
 * "At the water's edge: With webbed feet: 12 → 25. Without: 30 → 18." When no
 * trait and habitat can show both sides, it falls back to one line: "Animals
 * with webbed feet at the water's edge: 14 then, 22 now."
 */

import { TRAITS, MEANINGFUL_TRAIT_INDICES, PLACE_EFFECTS } from "./engine.js";
import { levelOf } from "./variations.js";

/** A clue whose count changed by fewer animals than this is weak: the next trait is tried. */
export const MIN_CHANGE = 3;

/** Both sides of a comparison must have had at least this many animals when the story began. */
export const MIN_SIDE = 3;

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
 * since the story began. If that count changed by fewer than MIN_CHANGE
 * animals, the next most distinctive trait that changed by MIN_CHANGE or more
 * is used instead; if none did, the one that changed most.
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
  const change = (e) => Math.abs(e.now - e.then);
  const lines = [];
  for (const { t, level } of ranked) {
    let best = null;
    for (const zone of [0, 1, 2]) {
      if (zone === home) continue;
      const a = then[t][level][zone], b = now[t][level][zone];
      if (a + b === 0) continue;
      const line = { trait: TRAITS[t], level, zone, home, then: a, now: b };
      if (!best || change(line) > change(best) || (change(line) === change(best) && a + b > best.then + best.now)) best = line;
    }
    if (best) lines.push(best);
  }
  return lines.find((e) => change(e) >= MIN_CHANGE) ??
    lines.reduce((top, e) => (change(e) > change(top) ? e : top), lines[0]) ?? null;
}

/**
 * The clue as both sides. For each of the seven meaningful traits and each
 * habitat the group does not mostly live in, "with" is the animals there at
 * the trait's high end ("webbed feet") and "without" the ones at its low end
 * ("no webbing"). Animals in the middle ("some webbing") are on neither side:
 * a webbed parent's half-webbed babies would otherwise count as "without" and
 * hide what the habitat rewards. Among the pairs where both sides numbered
 * MIN_SIDE or more when the story began, the one whose two sides grew most
 * differently (as a ratio, now against then).
 * @param {Array<{id:number, genome:ArrayLike<number>, zone:number}>} group
 * @param {Array<{id:number, genome:ArrayLike<number>, zone:number}>} living every animal alive now
 * @param {number[][][]} then census(...) when the story began
 * @returns {null|Comparison} null when no trait and habitat qualify
 */
export function comparisonFor(group, living, then) {
  if (!group.length) return null;
  const now = census(living);
  const home = mainZoneOf(group);
  const growth = (side) => Math.log((side.now + 0.5) / (side.then + 0.5));
  let best = null;
  for (const t of MEANINGFUL_TRAIT_INDICES) {
    for (const zone of [0, 1, 2]) {
      if (zone === home) continue;
      const withIt = { then: then[t][2][zone], now: now[t][2][zone] };
      const without = { then: then[t][0][zone], now: now[t][0][zone] };
      if (withIt.then < MIN_SIDE || without.then < MIN_SIDE) continue;
      const differs = Math.abs(growth(withIt) - growth(without));
      if (!best || differs > best.differs) best = { trait: TRAITS[t], zone, home, with: withIt, without, differs };
    }
  }
  return best;
}

/** Animals in all three places, at least this many each: when the clue's "then" is counted. */
export const CLUE_FROM = 10;

/**
 * The ending's clue, the same trait in different places (scope decision 60):
 * one meaningful trait's animals at its far end ("webbed feet") in a place
 * where it helps and in a place where it hurts, then (when all three places
 * first had CLUE_FROM animals in the story) and now. "Webbed feet at the
 * water's edge: 3 → 25. Webbed feet in the high leaves: 2 → 0." The pair whose
 * counts went most differently, where the helping place has more now; a trait
 * the family chose comes first when its pair changed by MIN_CHANGE or more.
 * @param {number[][][]} then census(...) then @param {number[][][]} now census(...) now
 * @param {number[]} [chosen] the traits the family chose
 * @returns {null|SameTrait}
 */
export function sameTraitClue(then, now, chosen = []) {
  let best = null, bestChosen = null;
  for (const t of MEANINGFUL_TRAIT_INDICES) {
    for (const a of [0, 1, 2]) for (const b of [0, 1, 2]) {
      if (PLACE_EFFECTS[t][a] <= 0 || PLACE_EFFECTS[t][b] >= 0) continue;
      const helps = { zone: a, then: then[t][2][a], now: now[t][2][a] }, hurts = { zone: b, then: then[t][2][b], now: now[t][2][b] };
      if (helps.now <= hurts.now) continue;
      const clue = { trait: TRAITS[t], helps, hurts, differs: (helps.now - helps.then) - (hurts.now - hurts.then) };
      if (!best || clue.differs > best.differs) best = clue;
      if (chosen.includes(t) && clue.differs >= MIN_CHANGE && (!bestChosen || clue.differs > bestChosen.differs)) bestChosen = clue;
    }
  }
  return bestChosen ?? (best && best.differs >= MIN_CHANGE ? best : null);
}

/**
 * @typedef {Object} SameTrait
 * @property {string} trait engine trait name
 * @property {{zone:number, then:number, now:number}} helps the animals at its far end where it helps
 * @property {{zone:number, then:number, now:number}} hurts and where it hurts
 * @property {number} differs how differently the two counts changed
 *
 * @typedef {Object} Comparison
 * @property {string} trait engine trait name
 * @property {number} zone the habitat compared
 * @property {number} home the group's main habitat
 * @property {{then:number, now:number}} with the animals there at the trait's high end
 * @property {{then:number, now:number}} without the animals there at its low end
 * @property {number} differs how differently the two sides grew (difference of log ratios)
 *
 * @typedef {Object} Evidence
 * @property {string} trait engine trait name
 * @property {number} level word level counted: 0 the low end, 2 the high end
 * @property {number} zone the other habitat counted
 * @property {number} home the group's main habitat
 * @property {number} then how many had it there when the story began
 * @property {number} now how many have it there now
 */
