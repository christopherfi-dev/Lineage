/**
 * The real-animal reveal (scope decision 10). DOM-free. The table, the
 * matching rule and the checks live in docs/LINEAGE_REAL_ANIMAL_REVEAL.md;
 * this file must match it.
 *
 * A surviving group is shown the real animal it is most like, from its actual
 * average traits at the end and the habitat where most of it lives. The
 * choices the child made play no part. There is no correct answer: every
 * surviving group becomes something.
 */

import { TRAIT_INDEX } from "./engine.js";

const LEAVES = 0, GROUND = 1, WATER = 2;

/**
 * Trait levels. "absolute": high at a group average of 0.6 or more, low at 0.4
 * or less. "relative": high at the generation-0 world average plus `gap` or
 * more, low at that average minus `gap` or less. Only the seven meaningful
 * traits are ever checked.
 */
export const LEVELS = { mode: "absolute", high: 0.6, low: 0.4, gap: null };

/** @type {RevealAnimal[]} */
export const ANIMALS = [
  {
    name: "River otter", zone: WATER,
    profile: { toe_webbing: "high", strong_tail: "high", streamlined_body: "high", curved_claws: "low" },
    reveal: "Your animals became swimmers, a lot like a river otter.",
    why: ["Webbed feet push through water.", "A strong tail helps them swim.", "A sleek body slides through the water easily."],
  },
  {
    name: "Beaver", zone: WATER,
    profile: { toe_webbing: "high", strong_tail: "high", dense_fur: "high", streamlined_body: "low" },
    reveal: "Your animals became paddlers, a lot like a beaver.",
    why: ["Webbed feet and a strong tail push them through water.", "Thick fur keeps them warm, but it slows their swimming."],
  },
  {
    name: "Capybara", zone: WATER,
    profile: { toe_webbing: "high", strong_tail: "low", long_hindlimbs: "high" },
    reveal: "Your animals live between land and water, a lot like a capybara.",
    why: ["Webbed toes help them swim.", "Long back legs help on land, but slow them in water."],
  },
  {
    name: "Squirrel", zone: LEAVES,
    profile: { curved_claws: "high", toe_webbing: "low", streamlined_body: "low" },
    reveal: "Your animals became climbers, a lot like a squirrel.",
    why: ["Curved claws grip the branches.", "Toes without webbing hold on tight."],
  },
  {
    name: "Sloth", zone: LEAVES,
    profile: { curved_claws: "high", dense_fur: "high", long_hindlimbs: "low", large_eyes: "low" },
    reveal: "Your animals became slow, careful climbers, a lot like a sloth.",
    why: ["Big curved claws hold on to branches.", "Thick fur keeps them warm."],
  },
  {
    // "curved claws high or any": claws are not checked, so high claws never count against it.
    name: "Bushbaby", zone: LEAVES,
    profile: { large_eyes: "high", long_hindlimbs: "high" },
    reveal: "Your animals became night leapers, a lot like a bushbaby.",
    why: ["Big eyes help them see well.", "Long back legs help them move fast."],
  },
  {
    name: "Hare", zone: GROUND,
    profile: { long_hindlimbs: "high", strong_tail: "low", large_eyes: "high" },
    reveal: "Your animals became runners, a lot like a hare.",
    why: ["Long back legs help them run fast.", "Big eyes help them see well.", "A small tail doesn't slow them down."],
  },
  {
    name: "Meerkat", zone: GROUND,
    profile: { large_eyes: "high", long_hindlimbs: "low", strong_tail: "low" },
    reveal: "Your animals became lookouts, a lot like a meerkat.",
    why: ["Big eyes help them see well across open ground."],
  },
];

/** Any habitat: when no animal above matches well enough. */
export const FIRST_MAMMALS = {
  name: "The first mammals (tree shrew)", zone: null, profile: {},
  reveal: "Your animals stayed like the very first mammals, like a tree shrew.",
  why: ["Their bodies didn't change much, and that worked.", "Some animals today still look a lot like their ancient relatives."],
};

/**
 * "high", "low" or null for one trait of a group's average body.
 * @param {string} trait engine trait name
 * @param {ArrayLike<number>} average the group's mean for each trait, engine order
 * @param {ArrayLike<number>} [base] the generation-0 world mean for each trait (relative levels only)
 * @param {typeof LEVELS} [levels]
 */
export function levelOf(trait, average, base, levels = LEVELS) {
  const t = TRAIT_INDEX[trait], v = average[t];
  const high = levels.mode === "relative" ? base[t] + levels.gap : levels.high;
  const low = levels.mode === "relative" ? base[t] - levels.gap : levels.low;
  return v >= high ? "high" : v <= low ? "low" : null;
}

/**
 * The matching rule: only animals from the group's end habitat are
 * considered. Each scores the number of its checked traits the group matches,
 * and needs all but one of them to qualify. The best score wins; a tie goes to
 * the animal with more checked traits, then to the one listed first. If none
 * qualifies, the first mammals.
 * @param {ArrayLike<number>} average the group's mean for each trait at the end
 * @param {number} zone the habitat most of the group lives in (engine zone index)
 * @param {ArrayLike<number>} [base] the generation-0 world mean for each trait
 * @param {typeof LEVELS} [levels]
 * @returns {{animal: RevealAnimal, matched: number, checked: number}}
 */
export function revealFor(average, zone, base, levels = LEVELS) {
  let best = null;
  for (const animal of ANIMALS) {
    if (animal.zone !== zone) continue;
    const traits = Object.keys(animal.profile);
    const matched = traits.filter((tr) => levelOf(tr, average, base, levels) === animal.profile[tr]).length;
    if (matched < traits.length - 1) continue;
    if (!best || matched > best.matched || (matched === best.matched && traits.length > best.checked)) {
      best = { animal, matched, checked: traits.length };
    }
  }
  return best ?? { animal: FIRST_MAMMALS, matched: 0, checked: 0 };
}

/**
 * @typedef {Object} RevealAnimal
 * @property {string} name
 * @property {null|number} zone the habitat it can be revealed in (engine zone index), null for any
 * @property {Object<string, "high"|"low">} profile the checked traits
 * @property {string} reveal the reveal line
 * @property {string[]} why its "why" lines, read as one passage
 */
