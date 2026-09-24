/**
 * The real-animal reveal (scope decision 10). DOM-free. The table, the
 * matching rule and the checks live in docs/LINEAGE_REAL_ANIMAL_REVEAL.md;
 * this file must match it.
 *
 * Every ending shows the real animal the group is most like, from its actual
 * average traits and the habitat where most of it lived when the story ended
 * (scope decision 40). A group that died out gets the same match in the past
 * tense ("Your animals were becoming a lot like a sloth."). The choices the
 * child made play no part. There is no correct answer: every group becomes
 * something.
 *
 * The reveal reflects what changed (scope decision 13): trait levels are
 * relative to the generation-0 world, and each animal needs its signature
 * trait, so the starting body alone never matches an animal.
 */

import { TRAIT_INDEX } from "./engine.js";

const LEAVES = 0, GROUND = 1, WATER = 2;

/**
 * Trait levels, relative to the generation-0 world average for each trait: a
 * group's average is high at GAP or more above it, low at GAP or more below it.
 * GAP is the game's APART, the smallest difference it treats as visible.
 * Only the seven meaningful traits are ever checked.
 */
export const GAP = 0.12;

/** Every water's-edge animal adds this "Did you know?" line after its own (scope decision 46). */
export const WHALES = "Did you know? Whales' ancestors were land animals that started swimming.";

/**
 * Seventeen animals, five to six per habitat (scope decision 45). Each profile uses only the seven
 * meaningful traits, and the real animal has every one of them in the direction given. Every "why"
 * line credits only traits the engine rewards in that habitat (docs/LINEAGE_REAL_ANIMAL_REVEAL.md).
 * Each animal has one true "Did you know?" fact (scope decision 46), for Marc to check.
 * Within a habitat, the order breaks ties: the animal listed first wins.
 * @type {RevealAnimal[]}
 */
export const ANIMALS = [
  // ---- Water's edge ----
  {
    name: "River otter", zone: WATER,
    profile: { toe_webbing: "high", strong_tail: "high", streamlined_body: "high", curved_claws: "low" },
    signature: { toe_webbing: "high", streamlined_body: "high" },
    reveal: "Your animals became swimmers, a lot like a river otter.",
    revealPast: "Your animals were becoming a lot like a river otter.",
    why: [
      { text: "Webbed feet push through water.", past: "Webbed feet pushed them through water.", credits: { toe_webbing: "high" } },
      { text: "A strong tail helps them swim.", past: "A strong tail helped them swim.", credits: { strong_tail: "high" } },
      { text: "A sleek body slides through the water easily.", past: "A sleek body slid through the water easily.", credits: { streamlined_body: "high" } },
    ],
    facts: ["Did you know? River otters slide down snowy and muddy banks."],
  },
  {
    name: "Beaver", zone: WATER,
    profile: { toe_webbing: "high", strong_tail: "high", dense_fur: "high", streamlined_body: "low" },
    signature: { toe_webbing: "high", strong_tail: "high" },
    reveal: "Your animals became paddlers, a lot like a beaver.",
    revealPast: "Your animals were becoming a lot like a beaver.",
    why: [
      { text: "Webbed feet and a strong tail push them through water.", past: "Webbed feet and a strong tail pushed them through water.", credits: { toe_webbing: "high", strong_tail: "high" } },
      { text: "Thick fur keeps them warm, but it slows their swimming.", past: "Thick fur kept them warm, but it slowed their swimming.", credits: { dense_fur: "high" } },
    ],
    facts: ["Did you know? Beaver teeth are orange and never stop growing."],
  },
  {
    name: "Capybara", zone: WATER,
    profile: { toe_webbing: "high", strong_tail: "low", long_hindlimbs: "high", dense_fur: "low" },
    signature: { toe_webbing: "high", long_hindlimbs: "high" },
    reveal: "Your animals live between land and water, a lot like a capybara.",
    revealPast: "Your animals were becoming a lot like a capybara.",
    why: [
      { text: "Webbed toes help them swim.", past: "Webbed toes helped them swim.", credits: { toe_webbing: "high" } },
      { text: "Long back legs help on land, but slow them in water.", past: "Long back legs helped on land, but slowed them in water.", credits: { long_hindlimbs: "high" } },
      { text: "Thin fur doesn't slow them in water.", past: "Thin fur didn't slow them in water.", credits: { dense_fur: "low" } },
    ],
    facts: ["Did you know? Capybaras are the world's biggest rodents."],
  },
  {
    name: "Platypus", zone: WATER,
    profile: { toe_webbing: "high", strong_tail: "high", long_hindlimbs: "low", large_eyes: "low", dense_fur: "high" },
    signature: { toe_webbing: "high" },
    reveal: "Your animals became river divers, a lot like a platypus.",
    revealPast: "Your animals were becoming a lot like a platypus.",
    why: [
      { text: "Webbed feet push them through water.", past: "Webbed feet pushed them through water.", credits: { toe_webbing: "high" } },
      { text: "A strong tail helps them swim.", past: "A strong tail helped them swim.", credits: { strong_tail: "high" } },
      { text: "Short legs don't drag in the water.", past: "Short legs didn't drag in the water.", credits: { long_hindlimbs: "low" } },
      { text: "Small eyes save them energy.", past: "Small eyes saved them energy.", credits: { large_eyes: "low" } },
    ],
    facts: ["Did you know? Platypuses are mammals that lay eggs."],
  },
  {
    name: "Seal", zone: WATER,
    profile: { toe_webbing: "high", large_eyes: "high", streamlined_body: "high", long_hindlimbs: "low", dense_fur: "low" },
    signature: { toe_webbing: "high", large_eyes: "high" },
    reveal: "Your animals became sleek swimmers, a lot like a seal.",
    revealPast: "Your animals were becoming a lot like a seal.",
    why: [
      { text: "Webbed flippers push them through water.", past: "Webbed flippers pushed them through water.", credits: { toe_webbing: "high" } },
      { text: "A sleek body slides through the water easily.", past: "A sleek body slid through the water easily.", credits: { streamlined_body: "high" } },
      { text: "Short back legs don't drag in the water.", past: "Short back legs didn't drag in the water.", credits: { long_hindlimbs: "low" } },
      { text: "Thin fur doesn't slow their swimming.", past: "Thin fur didn't slow their swimming.", credits: { dense_fur: "low" } },
    ],
    facts: ["Did you know? A seal's nose shuts tight when it dives."],
  },
  {
    name: "Fishing cat", zone: WATER,
    profile: { toe_webbing: "high", curved_claws: "high", long_hindlimbs: "low" },
    signature: { toe_webbing: "high", curved_claws: "high" },
    reveal: "Your animals became waders, a lot like a fishing cat.",
    revealPast: "Your animals were becoming a lot like a fishing cat.",
    why: [
      { text: "Webbed feet help them swim.", past: "Webbed feet helped them swim.", credits: { toe_webbing: "high" } },
      { text: "Short legs don't drag in the water.", past: "Short legs didn't drag in the water.", credits: { long_hindlimbs: "low" } },
    ],
    facts: ["Did you know? Fishing cats dive into water to catch fish."],
  },
  // ---- High leaves ----
  {
    name: "Squirrel", zone: LEAVES,
    profile: { curved_claws: "high", toe_webbing: "low", streamlined_body: "low" },
    signature: { curved_claws: "high" },
    reveal: "Your animals became climbers, a lot like a squirrel.",
    revealPast: "Your animals were becoming a lot like a squirrel.",
    why: [
      { text: "Curved claws grip the branches.", past: "Curved claws gripped the branches.", credits: { curved_claws: "high" } },
      { text: "Toes without webbing hold on tight.", past: "Toes without webbing held on tight.", credits: { toe_webbing: "low" } },
    ],
    facts: ["Did you know? Squirrels plant trees by forgetting buried nuts."],
  },
  {
    name: "Sloth", zone: LEAVES,
    profile: { curved_claws: "high", dense_fur: "high", long_hindlimbs: "low", large_eyes: "low" },
    signature: { curved_claws: "high", dense_fur: "high" },
    reveal: "Your animals became slow, careful climbers, a lot like a sloth.",
    revealPast: "Your animals were becoming a lot like a sloth.",
    why: [
      { text: "Big curved claws hold on to branches.", past: "Big curved claws held on to branches.", credits: { curved_claws: "high" } },
      { text: "Thick fur keeps them warm.", past: "Thick fur kept them warm.", credits: { dense_fur: "high" } },
    ],
    facts: ["Did you know? Sloths are surprisingly good swimmers."],
  },
  {
    // "curved claws high or any": claws are not checked, so high claws never count against it.
    name: "Bushbaby", zone: LEAVES,
    profile: { large_eyes: "high", long_hindlimbs: "high" },
    signature: { large_eyes: "high" },
    reveal: "Your animals became night leapers, a lot like a bushbaby.",
    revealPast: "Your animals were becoming a lot like a bushbaby.",
    why: [
      { text: "Big eyes help them see well.", past: "Big eyes helped them see well.", credits: { large_eyes: "high" } },
      { text: "Long back legs help them move fast.", past: "Long back legs helped them move fast.", credits: { long_hindlimbs: "high" } },
    ],
    facts: ["Did you know? A bushbaby's call sounds like a crying baby."],
  },
  {
    name: "Koala", zone: LEAVES,
    profile: { curved_claws: "high", dense_fur: "high", strong_tail: "low", streamlined_body: "low" },
    signature: { curved_claws: "high", strong_tail: "low" },
    reveal: "Your animals became sleepy climbers, a lot like a koala.",
    revealPast: "Your animals were becoming a lot like a koala.",
    why: [
      { text: "Curved claws grip the branches.", past: "Curved claws gripped the branches.", credits: { curved_claws: "high" } },
      { text: "Thick fur keeps them warm.", past: "Thick fur kept them warm.", credits: { dense_fur: "high" } },
      { text: "A tiny tail doesn't get in their way.", past: "A tiny tail didn't get in their way.", credits: { strong_tail: "low" } },
      { text: "A round body helps them hold on.", past: "A round body helped them hold on.", credits: { streamlined_body: "low" } },
    ],
    facts: ["Did you know? Koalas sleep up to 20 hours a day."],
  },
  {
    name: "Tarsier", zone: LEAVES,
    profile: { large_eyes: "high", long_hindlimbs: "high", strong_tail: "low" },
    signature: { large_eyes: "high", long_hindlimbs: "high" },
    reveal: "Your animals became big-eyed leapers, a lot like a tarsier.",
    revealPast: "Your animals were becoming a lot like a tarsier.",
    why: [
      { text: "Huge eyes help them see well.", past: "Huge eyes helped them see well.", credits: { large_eyes: "high" } },
      { text: "Long back legs help them move fast.", past: "Long back legs helped them move fast.", credits: { long_hindlimbs: "high" } },
      { text: "A thin tail doesn't slow them down.", past: "A thin tail didn't slow them down.", credits: { strong_tail: "low" } },
    ],
    facts: ["Did you know? Tarsiers have eyes as big as their brains."],
  },
  {
    name: "Slow loris", zone: LEAVES,
    profile: { large_eyes: "high", dense_fur: "high", strong_tail: "low", streamlined_body: "low" },
    signature: { large_eyes: "high", dense_fur: "high" },
    reveal: "Your animals became night climbers, a lot like a slow loris.",
    revealPast: "Your animals were becoming a lot like a slow loris.",
    why: [
      { text: "Big eyes help them see well.", past: "Big eyes helped them see well.", credits: { large_eyes: "high" } },
      { text: "Thick fur keeps them warm.", past: "Thick fur kept them warm.", credits: { dense_fur: "high" } },
      { text: "A tiny tail doesn't get in their way.", past: "A tiny tail didn't get in their way.", credits: { strong_tail: "low" } },
      { text: "A round body helps them hold on.", past: "A round body helped them hold on.", credits: { streamlined_body: "low" } },
    ],
    facts: ["Did you know? A slow loris has a venomous bite."],
  },
  // ---- Open ground ----
  {
    name: "Hare", zone: GROUND,
    profile: { long_hindlimbs: "high", strong_tail: "low", large_eyes: "high" },
    signature: { long_hindlimbs: "high" },
    reveal: "Your animals became runners, a lot like a hare.",
    revealPast: "Your animals were becoming a lot like a hare.",
    why: [
      { text: "Long back legs help them run fast.", past: "Long back legs helped them run fast.", credits: { long_hindlimbs: "high" } },
      { text: "Big eyes help them see well.", past: "Big eyes helped them see well.", credits: { large_eyes: "high" } },
      { text: "A small tail doesn't slow them down.", past: "A small tail didn't slow them down.", credits: { strong_tail: "low" } },
    ],
    facts: ["Did you know? Baby hares are born furry, with open eyes."],
  },
  {
    name: "Meerkat", zone: GROUND,
    profile: { large_eyes: "high", long_hindlimbs: "low", strong_tail: "low" },
    signature: { large_eyes: "high", long_hindlimbs: "not high" },
    reveal: "Your animals became lookouts, a lot like a meerkat.",
    revealPast: "Your animals were becoming a lot like a meerkat.",
    why: [{ text: "Big eyes help them see well across open ground.", past: "Big eyes helped them see well across open ground.", credits: { large_eyes: "high" } }],
    facts: ["Did you know? Meerkats take turns standing guard for their group."],
  },
  {
    name: "Lynx", zone: GROUND,
    profile: { long_hindlimbs: "high", dense_fur: "high", strong_tail: "low" },
    signature: { long_hindlimbs: "high", dense_fur: "high" },
    reveal: "Your animals became snow walkers, a lot like a lynx.",
    revealPast: "Your animals were becoming a lot like a lynx.",
    why: [
      { text: "Long back legs help them run fast.", past: "Long back legs helped them run fast.", credits: { long_hindlimbs: "high" } },
      { text: "Thick fur keeps them warm.", past: "Thick fur kept them warm.", credits: { dense_fur: "high" } },
      { text: "A short tail doesn't slow them down.", past: "A short tail didn't slow them down.", credits: { strong_tail: "low" } },
    ],
    facts: ["Did you know? A lynx's big furry paws work like snowshoes."],
  },
  {
    name: "Bear", zone: GROUND,
    profile: { curved_claws: "high", dense_fur: "high", strong_tail: "low", streamlined_body: "low" },
    signature: { curved_claws: "high" },
    reveal: "Your animals became forest wanderers, a lot like a bear.",
    revealPast: "Your animals were becoming a lot like a bear.",
    why: [
      { text: "Curved claws give them a good grip.", past: "Curved claws gave them a good grip.", credits: { curved_claws: "high" } },
      { text: "Thick fur keeps them warm.", past: "Thick fur kept them warm.", credits: { dense_fur: "high" } },
      { text: "A short tail doesn't slow them down.", past: "A short tail didn't slow them down.", credits: { strong_tail: "low" } },
    ],
    facts: ["Did you know? Bears can go all winter without eating."],
  },
  {
    name: "Arctic fox", zone: GROUND,
    profile: { dense_fur: "high", long_hindlimbs: "low", strong_tail: "high" },
    signature: { dense_fur: "high" },
    reveal: "Your animals became cold-weather experts, a lot like an arctic fox.",
    revealPast: "Your animals were becoming a lot like an arctic fox.",
    why: [{ text: "Thick fur keeps them warm.", past: "Thick fur kept them warm.", credits: { dense_fur: "high" } }],
    facts: ["Did you know? Most arctic foxes turn white in winter."],
  },
];
for (const a of ANIMALS) if (a.zone === WATER) a.facts.push(WHALES);

/** Any habitat: when no animal above matches a surviving group well enough. */
export const FIRST_MAMMALS = {
  name: "The first mammals (tree shrew)", zone: null, profile: {}, signature: {},
  reveal: "Your animals stayed like the very first mammals, like a tree shrew.",
  why: [
    { text: "Their bodies didn't change much, and that worked.", credits: {} },
    { text: "Some animals today still look a lot like their ancient relatives.", credits: {} },
  ],
  facts: ["Did you know? Tree shrews are cousins of monkeys and apes."],
};

/**
 * Any habitat: when no animal above matches a group that died out (scope
 * decision 41). It never gets the first mammals.
 */
export const NO_TIME = {
  name: "No time to change", zone: null, profile: {}, signature: {},
  reveal: "Your animals didn't have time to change.",
  revealPast: "Your animals didn't have time to change.",
  why: [{ text: "Their story ended before new traits could spread.", credits: {} }],
  facts: [],
};

/**
 * How far a group's average is past a level for one trait: at least 0 when
 * the group meets it, below 0 when it does not.
 * @param {string} trait engine trait name
 * @param {"high"|"low"} level
 * @param {ArrayLike<number>} average the group's mean for each trait, engine order
 * @param {ArrayLike<number>} base the generation-0 world mean for each trait
 */
export function margin(trait, level, average, base, gap = GAP) {
  const t = TRAIT_INDEX[trait];
  return level === "high" ? average[t] - (base[t] + gap) : (base[t] - gap) - average[t];
}

/** True when the group has the animal's signature ("not high": anything below high). */
function hasSignature(animal, average, base, gap) {
  return Object.entries(animal.signature).every(([trait, level]) =>
    (level === "not high" ? margin(trait, "high", average, base, gap) < 0 : margin(trait, level, average, base, gap) >= 0));
}

/**
 * The matching rule (docs/LINEAGE_REAL_ANIMAL_REVEAL.md):
 * 1. only animals from the group's end habitat are considered;
 * 2. an animal qualifies only if the group has its signature trait(s);
 * 3. the best is the qualifying animal whose checked traits the group meets
 *    most strongly: the sum of how far each met trait is past its level (a
 *    tie goes to the animal listed first);
 * 4. if none qualifies, the first mammals for a surviving group, and "no time
 *    to change" for a group that died out (scope decision 41).
 * The reveal then shows only the "why" sentences whose credited traits the
 * group has, at the same levels, so it never credits a trait the group lacks.
 * The sentence about the signature always qualifies.
 * @param {ArrayLike<number>} average the group's mean for each trait at the end
 * @param {number} zone the habitat most of the group lives in (engine zone index)
 * @param {ArrayLike<number>} base the generation-0 world mean for each trait
 * @param {number} [gap]
 * @param {boolean} [died] the group died out
 * The animal's "Did you know?" lines come last (scope decision 46); they are facts about the real
 * animal, so they stay in the present tense on every ending.
 * @returns {{animal: RevealAnimal, matched: number, checked: number, strength: number, why: string[], whyPast: string[], facts: string[]}}
 */
export function revealFor(average, zone, base, gap = GAP, died = false) {
  let best = null;
  for (const animal of ANIMALS) {
    if (animal.zone !== zone || !hasSignature(animal, average, base, gap)) continue;
    const met = Object.entries(animal.profile).map(([trait, level]) => margin(trait, level, average, base, gap)).filter((m) => m >= 0);
    const strength = met.reduce((sum, m) => sum + m, 0);
    if (!best || strength > best.strength) best = { animal, matched: met.length, checked: Object.keys(animal.profile).length, strength };
  }
  const found = best ?? { animal: died ? NO_TIME : FIRST_MAMMALS, matched: 0, checked: 0, strength: 0 };
  const has = (credits) => Object.entries(credits).every(([trait, level]) => margin(trait, level, average, base, gap) >= 0);
  const shown = found.animal.why.filter((w) => has(w.credits));
  return { ...found, why: shown.map((w) => w.text), whyPast: shown.map((w) => w.past ?? w.text), facts: found.animal.facts };
}

/**
 * @typedef {Object} RevealAnimal
 * @property {string} name
 * @property {null|number} zone the habitat it can be revealed in (engine zone index), null for any
 * @property {Object<string, "high"|"low">} profile the checked traits
 * @property {Object<string, "high"|"low"|"not high">} signature what the group must have to qualify
 * @property {string} reveal the reveal line
 * @property {string} [revealPast] the reveal line when the group died out (not for the first mammals, never shown then)
 * @property {Array<{text:string, past?:string, credits:Object<string, "high"|"low">}>} why its "why" sentences (and their past
 *   tense, when the group died out) and the traits each credits
 * @property {string[]} facts its "Did you know?" lines, true facts about the real animal (scope decision 46)
 */
