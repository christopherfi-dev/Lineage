/**
 * Why a trait helps, hurts or doesn't matter in a place, in a child's words
 * (docs/LINEAGE_WHY.md, for Marc to check). Every direction is the engine's own
 * Classroom table (lineage-classroom/src/config.js, PLACE_EFFECTS): ✓ helps,
 * ✗ hurts, ~ doesn't matter much there, and the three neutral traits never
 * matter anywhere. game/test checks the two tables agree. DOM-free.
 */

import { TRAITS, NEUTRAL_TRAIT_INDICES, PLACE_EFFECTS } from "./engine.js";

/** Each meaningful trait's reason in each place [high leaves, open ground, water's edge]. */
export const WHY = {
  toe_webbing: ["Webbing makes it hard to grip branches.", "Webbed feet don't matter much on open ground.", "Webbed feet push through water."],
  curved_claws: ["Curved claws grip the branches.", "Claws don't matter much on open ground.", "Claws get in the way when swimming."],
  dense_fur: ["Thick fur doesn't matter much in the trees.", "Thick fur keeps them warm on open ground.", "Thick, wet fur slows swimming."],
  long_hindlimbs: ["Long back legs help them leap between branches.", "Long back legs help them run fast.", "Long legs drag in the water."],
  strong_tail: ["A heavy tail makes climbing harder.", "A heavy tail slows them down on land.", "A strong tail helps them swim."],
  large_eyes: ["Big eyes don't matter much in the trees.", "Big eyes spot things across open ground.", "Big eyes don't help underwater, and cost energy."],
  streamlined_body: ["A sleek body is hard to climb with.", "Body shape doesn't matter much on open ground.", "A sleek body slides through water."],
};

/** The neutral traits' line in the table: "[Trait] doesn't help or hurt anywhere." */
export const NEUTRAL_WHY = {
  coat_shade: "Coat colour doesn't help or hurt anywhere.",
  ear_tip_shape: "Ear tip shape doesn't help or hurt anywhere.",
  tail_tip_marking: "The mark on the tail tip doesn't help or hurt anywhere.",
};

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

/** Words that take a singular verb: "a darker coat doesn't". */
const singular = (words) => /^a /.test(words);
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * On a glowing baby's card, when its new variation can't be followed here
 * (scope decision 58): a neutral trait, "Pointier ear tips don't help or hurt.
 * Nothing to test here."; a "~" there, the table's line, "Webbed feet don't
 * matter much on open ground."
 * @param {{t:number, group:string, neutral:boolean}} v the variation
 * @param {number} zone where the test would be
 */
export function nothingToTest(v, zone) {
  if (v.neutral) return `${capital(v.group)} ${singular(v.group) ? "doesn't" : "don't"} help or hurt. Nothing to test here.`;
  return WHY[TRAITS[v.t]][zone];
}

