/**
 * Why a trait helps, hurts or doesn't matter in a place, in a child's words
 * (docs/LINEAGE_WHY.md, for Marc to check). Every direction is the engine's own
 * Classroom table (lineage-classroom/src/config.js, PLACE_EFFECTS): ✓ helps,
 * ✗ hurts, ~ doesn't matter much there, and the three neutral traits never
 * matter anywhere. game/test checks the two tables agree. DOM-free.
 */

import { TRAITS, NEUTRAL_TRAIT_INDICES, MEANINGFUL_TRAIT_INDICES, PLACE_EFFECTS } from "./engine.js";
import { hasWords } from "./variations.js";
import { ZONE_AT } from "./narration.js";

/** Each meaningful trait's reason in each place [high leaves, open ground, water's edge]. */
export const WHY = {
  toe_webbing: ["Webbing makes it hard to grip branches.", "Webbed feet don't matter much on open ground.", "Webbed feet push through water."],
  curved_claws: ["Curved claws grip the branches.", "Claws don't matter much on open ground.", "Claws get in the way when swimming."],
  // Scope decision 72: free where the real animals of a place have it both ways, with one that has it the other way.
  dense_fur: ["Thick fur doesn't matter much in the trees.", "Thick fur doesn't matter much on open ground: cheetahs have short fur.",
    "Thick fur doesn't matter much in the water: seals have short fur."],
  long_hindlimbs: ["Long legs don't matter much in the trees: sloths climb on short ones.", "Long back legs help them run fast.", "Long legs drag in the water."],
  strong_tail: ["A big tail doesn't matter much in the trees: koalas have tiny ones.", "A big tail doesn't matter much on open ground: hares have short ones.",
    "A strong tail helps them swim."],
  large_eyes: ["Big eyes don't matter much in the trees.", "Big eyes spot things across open ground.", "Big eyes don't matter much in the water: otters have small eyes."],
  streamlined_body: ["A sleek body is hard to climb with.", "Body shape doesn't matter much on open ground.", "A sleek body slides through water."],
};

/** What a trait free in every place is called in a guess, like a neutral trait's noun (scope decision 72). */
const FREE_NOUN = { dense_fur: "Thick fur" };

/** The neutral traits' line in the table: "[Trait] doesn't help or hurt anywhere." */
export const NEUTRAL_WHY = {
  coat_shade: "Coat colour doesn't help or hurt anywhere.",
  ear_tip_shape: "Ear tip shape doesn't help or hurt anywhere.",
  tail_tip_marking: "The mark on the tail tip doesn't help or hurt anywhere.",
};
/** What each neutral trait is called in its line: "Coat colour". */
export const NEUTRAL_NOUN = { coat_shade: "Coat colour", ear_tip_shape: "Ear tip shape", tail_tip_marking: "The mark on the tail tip" };

/** What a trait does in a place: 1 helps (✓), -1 hurts (✗), 0 doesn't matter (~, or a neutral trait). */
export const effectIn = (t, zone) => PLACE_EFFECTS[t][zone];

/** ✓, ✗ or ~ for a trait in a place (a neutral trait is "neutral"). */
export function markIn(t, zone) {
  if (NEUTRAL_TRAIT_INDICES.includes(t)) return "neutral";
  const e = effectIn(t, zone);
  return e > 0 ? "✓" : e < 0 ? "✗" : "~";
}

/** One variation (more or less of a trait) helps (1), hurts (-1) or doesn't matter (0) in a place. */
export const variationEffect = (t, dir, zone) => Math.sign(effectIn(t, zone)) * dir;

/** A variation can be followed in a place only where its trait helps or hurts there, so every fair test has a clear result. */
export const matters = (t, zone) => effectIn(t, zone) !== 0;

/** The table's reason for a meaningful trait in a place, or a neutral trait's line. */
export function whyLine(t, zone) {
  const trait = TRAITS[t];
  return WHY[trait] ? WHY[trait][zone] : NEUTRAL_WHY[trait];
}



/** A group has a trait (its far end) when its average is at least this: halfway there. */
export const HAS_AT = 0.5;

/**
 * What helps and what hurts a group in its place (scope decision 60): the
 * meaningful traits it has (average HAS_AT or more) that help (✓) or hurt (✗)
 * there, the most-had first, each with its words ("webbed feet") and its line
 * from the table.
 * @param {Array<{genome:ArrayLike<number>}>} animals the group's animals in the place
 * @param {number} zone the place
 * @returns {{helping:Reason[], hurting:Reason[]}}
 */
export function reasonsIn(animals, zone) {
  const helping = [], hurting = [];
  if (!animals.length) return { helping, hurting };
  for (const t of MEANINGFUL_TRAIT_INDICES) {
    const e = effectIn(t, zone);
    if (!e) continue;
    const v = animals.reduce((sum, a) => sum + a.genome[t], 0) / animals.length;
    if (v < HAS_AT) continue;
    (e > 0 ? helping : hurting).push({ t, v, words: hasWords(TRAITS[t], 2), line: whyLine(t, zone) });
  }
  const most = (a, b) => b.v - a.v || a.t - b.t;
  return { helping: helping.sort(most), hurting: hurting.sort(most) };
}

/** Where a group falls short of the others in its place by at least this much (a trait's average), it is crowded out for it. */
export const SHORT_BY = 0.1;
/** "more webbing between the toes" → "more webbing", "a stronger tail" → "stronger tails": a trait's "more" words for a line. */
const MORE = {
  toe_webbing: "more webbing", curved_claws: "more curved claws", dense_fur: "thicker fur", long_hindlimbs: "longer back legs",
  strong_tail: "stronger tails", large_eyes: "bigger eyes", streamlined_body: "sleeker bodies",
};

/**
 * Where a group falls furthest short of other animals in its place (scope
 * decision 60): a trait that helps there that the others have more of, or
 * one that hurts there that the group has more of, by SHORT_BY or more. In
 * ranked survival the least suited make room, so this is why a group with no
 * trait that hurts is crowded out. With the table's line, and who has more.
 * @param {Array<{genome:ArrayLike<number>}>} group the group's animals in the place
 * @param {Array<{genome:ArrayLike<number>}>} others the other animals there
 * @param {number} zone
 * @returns {null|{t:number, line:string, more:string, theirs:boolean}} theirs: the others have more of it (a helper)
 */
export function shortfall(group, others, zone) {
  if (!group.length || !others.length) return null;
  const mean = (list, t) => list.reduce((sum, a) => sum + a.genome[t], 0) / list.length;
  let best = null;
  for (const t of MEANINGFUL_TRAIT_INDICES) {
    const e = effectIn(t, zone);
    if (!e) continue;
    const gap = (mean(others, t) - mean(group, t)) * Math.sign(e);
    if (gap >= SHORT_BY && (!best || gap > best.gap)) best = { t, gap, theirs: e > 0 };
  }
  return best && { t: best.t, line: whyLine(best.t, zone), more: MORE[TRAITS[best.t]], theirs: best.theirs };
}

/** "Webbed feet push through water." as the second half of a line: "But webbed feet push through water." */
export const but = (line) => `But ${line.charAt(0).toLowerCase()}${line.slice(1)}`;

/**
 * A tap-to-guess question (scope decision 60): three lines from the table, the
 * same trait in each of the three places, and the one for this place is right.
 * The child has to think about where the animals live.
 * @param {string} text the question: "Why are the ones with bigger eyes doing better?"
 * @param {number} t the trait @param {number} zone the place
 * @returns {Guess}
 */
export function guessFor(text, t, zone, extra = null) {
  const trait = TRAITS[t];
  if (FREE_NOUN[trait] && [0, 1, 2].every((z) => effectIn(t, z) === 0)) {
    // Free in every place (scope decision 72): its three place lines all say it doesn't matter much, so, like a neutral
    // trait, the answers are "helps here", "hurts here" and the place's own line.
    const noun = FREE_NOUN[trait];
    return {
      text, t, zone, extra,
      options: [`${noun} helps them ${ZONE_AT[zone]}.`, `${noun} hurts them ${ZONE_AT[zone]}.`, whyLine(t, zone)].map((o, i) => ({ text: o, right: i === 2 })),
      right: whyLine(t, zone),
    };
  }
  if (NEUTRAL_WHY[trait]) {
    // A neutral trait has one line in the table (scope decision 65): the three answers are "helps here", "hurts
    // here" and the table's "doesn't help or hurt anywhere".
    const noun = NEUTRAL_NOUN[trait];
    return {
      text, t, zone, extra, neutral: true,
      options: [`${noun} helps them ${ZONE_AT[zone]}.`, `${noun} hurts them ${ZONE_AT[zone]}.`, NEUTRAL_WHY[trait]].map((o, i) => ({ text: o, right: i === 2 })),
      right: NEUTRAL_WHY[trait],
    };
  }
  return {
    text, t, zone, extra,
    options: [0, 1, 2].map((z) => ({ text: whyLine(t, z), right: z === zone })),
    right: whyLine(t, zone),
  };
}

/** After a guess: "Yes! Big eyes spot things across open ground." or "Good thinking. But here, …". Before one: "Here's why: …". */
export function explainGuess(guess, option) {
  const lower = `${guess.right.charAt(0).toLowerCase()}${guess.right.slice(1)}`;
  if (!option) return `Here's why: ${lower}`;
  return option.right ? `Yes! ${guess.right}` : guess.neutral ? `Good thinking. But ${lower}` : `Good thinking. But here, ${lower}`;
}

/**
 * @typedef {Object} Reason
 * @property {number} t trait index @property {number} v the group's average for it
 * @property {string} words "webbed feet" @property {string} line "Webbed feet push through water."
 *
 * @typedef {Object} Guess
 * @property {string} text the question @property {number} t @property {number} zone
 * @property {Array<{text:string, right:boolean}>} options the trait's line in each place, in place order
 * @property {string} right the line for this place
 * @property {null|string} extra one more line after why: "Others here have more webbing."
 */
