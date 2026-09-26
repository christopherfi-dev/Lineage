/**
 * The family's name (Step 5, part two). Right after the first tap, before
 * generation 1 starts, the child picks one of three names for the family:
 * "the Mossfoot family". Each name joins a word for the family's habitat to a
 * word for a trait that stands out in the family. The word lists and the rule
 * are in docs/LINEAGE_FAMILY_NAMES.md, for checking.
 *
 * Made in the page from these lists: no network. The engine's random numbers
 * are never used; the names come from a small seeded generator of their own.
 */

import { TRAITS } from "./engine.js";
import { mulberry } from "./world.js";

/** The question, and the line when the time runs out and a name is picked. */
export const NAME_QUESTION = "What will you call your family?";
export const NAME_PICKED = "We picked a name for you.";
/** Time to pick a name; like the other panels, it waits while a line is read aloud. */
export const NAMING_SECONDS = 20;

/** A name on its button: "The Mossfoot family". */
export const nameButton = (name) => `The ${name} family`;

/**
 * List 1: the first half of a name, from the family's habitat
 * (engine zone order: the high leaves, the open ground, the water's edge).
 */
export const HABITAT_WORDS = [
  ["Moss", "Leaf", "Fern", "Twig", "Vine", "Oak"],
  ["Sand", "Stone", "Grass", "Clover", "Meadow", "Sun"],
  ["Reed", "Brook", "Pebble", "River", "Ripple", "Pond"],
];

/** List 2: the second half, from a trait that stands out in the family. */
export const TRAIT_NAME_WORDS = {
  toe_webbing: ["foot", "paddle"],
  curved_claws: ["claw", "grip"],
  dense_fur: ["fur", "fluff"],
  long_hindlimbs: ["runner", "hopper"],
  strong_tail: ["tail", "swish"],
  large_eyes: ["blink", "wink"],
  streamlined_body: ["glide", "dash"],
  coat_shade: ["coat", "cloak"],
  ear_tip_shape: ["tuft"],
  tail_tip_marking: ["tip", "stripe"],
};

/**
 * List 3: names the game never makes. Besides these, no name joins two of the
 * same letter where the halves meet ("Leaffoot"), because that is hard to read.
 */
export const NEVER = ["Grasshopper", "Leafhopper", "Sandhopper", "Stonerunner"]; // real small animals, and one Marc left out

/** A first half and a second half that may be joined. */
export const joins = (start, end) => start[start.length - 1].toLowerCase() !== end[0] && !NEVER.includes(start + end);

function shuffled(list, r) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** The habitat most of the family lives in. */
function mainZone(animals) {
  const n = [0, 0, 0];
  for (const a of animals) n[a.zone]++;
  return n.indexOf(Math.max(...n));
}

/**
 * Three names for a family: its habitat's words joined to the words of the
 * three traits that stand out most in it (furthest from the whole world's
 * average), one trait each, with three different first halves.
 * @param {Array<{genome:ArrayLike<number>, zone:number}>} animals the family when it is tapped
 * @param {ArrayLike<number>} world the whole world's average for each trait
 * @param {number} seed picks among the words: the same family in the same world always gets the same names
 * @returns {string[]} like ["Mossfoot", "Fernclaw", "Twigtail"]
 */
export function familyNames(animals, world, seed) {
  const r = mulberry(seed >>> 0);
  const starts = shuffled(HABITAT_WORDS[mainZone(animals)], r);
  const gap = (t) => Math.abs(animals.reduce((s, a) => s + a.genome[t], 0) / animals.length - world[t]);
  const ranked = TRAITS.map((trait, t) => ({ trait, gap: gap(t) })).sort((a, b) => b.gap - a.gap);
  const names = [], used = new Set();
  for (const { trait } of ranked) {
    const ends = shuffled(TRAIT_NAME_WORDS[trait], r);
    const start = starts.find((s) => !used.has(s) && ends.some((e) => joins(s, e)));
    if (!start) continue;
    used.add(start);
    names.push(start + ends.find((e) => joins(start, e)));
    if (names.length === 3) break;
  }
  return names;
}
