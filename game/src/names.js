/**
 * The family's name (Step 5, part two; scope decision 61). Right after the
 * first tap, before generation 1 starts, the child picks one of three names
 * for the family, "the Mossfoot family", types their own, or uses their own
 * name: "Mia" makes "the Miapaddle family". Each made name joins a word for
 * the family's habitat to a word for a trait that stands out in the family,
 * fresh for every story. The word lists, the rule and the filter for typed
 * names are in docs/LINEAGE_FAMILY_NAMES.md, for checking.
 *
 * Made in the page from these lists: no network, and nothing typed leaves the
 * iPad. The engine's random numbers are never used.
 */

import { TRAITS } from "./engine.js";
import { mulberry } from "./world.js";

/** The question, and the line when the time runs out and a name is picked. */
export const NAME_QUESTION = "What will you call your family?";
export const NAME_PICKED = "We picked a name for you.";
/** The two ways to type a name, their prompts, and the line when a typed name can't be used. */
export const TYPE_OWN = "Type your own";
export const USE_MY_NAME = "Use my name";
export const TYPE_PROMPT = "Type a name for your family.";
export const MY_NAME_PROMPT = "Type your first name.";
export const TRY_ANOTHER_NAME = "Let's try a different name.";
/** A typed name: letters only, at most this many. */
export const NAME_MAX = 12;
/** Time to pick a name; like the other panels, it waits while a line is read aloud. */
export const NAMING_SECONDS = 20;

/** A name on its button: "The Mossfoot family". */
export const nameButton = (name) => `The ${name} family`;

/**
 * List 1: the first half of a name, from the family's habitat
 * (engine zone order: the high leaves, the open ground, the water's edge).
 */
export const HABITAT_WORDS = [
  ["Moss", "Leaf", "Fern", "Twig", "Vine", "Oak", "Pine", "Maple", "Acorn", "Bark", "Birch", "Cedar"],
  ["Sand", "Stone", "Grass", "Clover", "Meadow", "Sun", "Dust", "Rock", "Heath", "Field", "Dune", "Thistle"],
  ["Reed", "Brook", "Pebble", "River", "Ripple", "Pond", "Marsh", "Creek", "Splash", "Lily", "Shore", "Puddle"],
];

/** List 2: the second half, from a trait that stands out in the family. */
export const TRAIT_NAME_WORDS = {
  toe_webbing: ["foot", "paddle", "flipper", "web"],
  curved_claws: ["claw", "grip", "hook", "clutch"],
  dense_fur: ["fur", "fluff", "fuzz", "wool"],
  long_hindlimbs: ["runner", "hopper", "leap", "stride"],
  strong_tail: ["tail", "swish", "flick", "swoosh"],
  large_eyes: ["blink", "wink", "peep", "gaze"],
  streamlined_body: ["glide", "dash", "slip", "swift"],
  coat_shade: ["coat", "cloak", "shade", "pelt"],
  ear_tip_shape: ["tuft", "ear", "perk"],
  tail_tip_marking: ["tip", "stripe", "spot", "dot"],
};

/**
 * List 3: names the game never makes. Besides these, no name joins two of the
 * same letter where the halves meet ("Leaffoot"), because that is hard to read.
 */
export const NEVER = ["Grasshopper", "Leafhopper", "Sandhopper", "Rockhopper", "Stonerunner", "Sunspot"]; // real animals and words, and one Marc left out

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
 * @param {number} seed picks among the words: the page gives a fresh one every story
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

/** The trait word a child's own name takes: the first word of the trait that stands out most in the family. */
export function standoutWord(animals, world) {
  const gap = (t) => Math.abs(animals.reduce((sum, a) => sum + a.genome[t], 0) / animals.length - world[t]);
  const t = TRAITS.map((_, i) => i).sort((a, b) => gap(b) - gap(a))[0];
  return TRAIT_NAME_WORDS[TRAITS[t]][0];
}

/**
 * A small filter for typed names (nothing typed leaves the iPad). These are
 * never a name, whole or inside one...
 */
const BLOCKED_INSIDE = ["fuck", "shit", "cunt", "bitch", "whore", "slut", "nigg", "fagg", "porn", "nazi", "piss", "twat", "wank", "bastard", "bollock"];
/** ...and these only as the whole name, since they hide inside real names (Cassie, Shelly, Grape). */
const BLOCKED_WHOLE = ["ass", "arse", "hell", "damn", "crap", "dick", "cock", "rape", "sex", "poo", "poop", "pee", "butt", "fart",
  "kill", "die", "dead", "hate", "stupid", "dumb", "idiot", "loser", "ugly", "fat"];

/**
 * A typed name as the family's name, or null when it can't be used: letters
 * only (any alphabet), 1 to NAME_MAX, not caught by the filter. Capitalised:
 * "mia" is "Mia".
 * @param {string} text what the child typed
 */
export function typedName(text) {
  const name = String(text ?? "").trim();
  if (!/^\p{L}{1,12}$/u.test(name)) return null;
  const low = name.toLowerCase();
  if (BLOCKED_WHOLE.includes(low) || BLOCKED_INSIDE.some((w) => low.includes(w))) return null;
  return low.charAt(0).toUpperCase() + low.slice(1);
}

/** "Use my name": the child's name joined to the family's standout trait word, "Mia" and "paddle" make "Miapaddle". Null when the name can't be used. */
export function myNameFamily(text, word) {
  const name = typedName(text);
  return name ? name + word : null;
}
