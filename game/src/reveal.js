/**
 * The real-animal reveal (scope decisions 10 and 72). DOM-free. The table, the
 * matching rule and the checks live in docs/LINEAGE_REAL_ANIMAL_REVEAL.md;
 * this file must match it.
 *
 * The collection (scope decision 72): twelve real animals, four in each
 * place, and every one of them a line can really become. In each place some
 * traits are required (they help or hurt there, so every line that lasts
 * gets them) and the rest are free (they don't decide who lives there). The
 * free traits, which the child's follows decide, decide which animal the line
 * becomes: each animal has one or two signature traits among them.
 *
 * Every ending shows the animal the line is most like, from its actual
 * traits in the place where most of it lived when the story ended (scope
 * decision 40), and the free traits the child chose: a chosen free trait
 * decides first. A line that died out gets the same match in the past tense
 * ("Your animals were becoming a lot like a sloth."). There is no correct
 * answer: every line becomes something.
 *
 * The reveal reflects what changed (scope decision 13): trait levels are
 * relative to the generation-0 world, and a line names an animal only once it
 * has changed toward its place, at least one required trait at its helpful
 * level; the starting body alone never matches one.
 */

import { TRAIT_INDEX, PLACE_EFFECTS } from "./engine.js";

const LEAVES = 0, GROUND = 1, WATER = 2;

/**
 * Trait levels, relative to the generation-0 world average for each trait: an
 * animal's trait is high at GAP or more above it, low at GAP or more below it.
 * GAP is the game's APART, the smallest difference it treats as visible.
 */
export const GAP = 0.12;
/** A signature trait counts when at least this share of the line has it (high or low, as the signature says). */
export const SIGNATURE_SHARE = 0.75;
/** At most this many "looks like" lines on a reveal, the signature's first. */
export const LIKE_LINES = 2;

/** Every water's-edge animal adds this "Did you know?" line after its own (scope decision 46). */
export const WHALES = "Did you know? Whales' ancestors were land animals that started swimming.";

/** The "why" line for each trait a place requires, at its helpful level: true for every line that fits there. */
const NEEDS = {
  claws: { text: "Curved claws grip the branches.", past: "Curved claws gripped the branches.", credits: { curved_claws: "high" } },
  bigClaws: { text: "Big curved claws hold on to branches.", past: "Big curved claws held on to branches.", credits: { curved_claws: "high" } },
  noWebs: { text: "Toes without webbing hold on tight.", past: "Toes without webbing held on tight.", credits: { toe_webbing: "low" } },
  round: { text: "A round body helps them hold on.", past: "A round body helped them hold on.", credits: { streamlined_body: "low" } },
  legs: { text: "Long back legs help them run fast.", past: "Long back legs helped them run fast.", credits: { long_hindlimbs: "high" } },
  eyes: { text: "Big eyes spot things across open ground.", past: "Big eyes spotted things across open ground.", credits: { large_eyes: "high" } },
  webs: { text: "Webbed feet push through water.", past: "Webbed feet pushed them through water.", credits: { toe_webbing: "high" } },
  flippers: { text: "Webbed flippers push them through water.", past: "Webbed flippers pushed them through water.", credits: { toe_webbing: "high" } },
  tail: { text: "A strong tail helps them swim.", past: "A strong tail helped them swim.", credits: { strong_tail: "high" } },
  steer: { text: "A strong tail helps them steer.", past: "A strong tail helped them steer.", credits: { strong_tail: "high" } },
  sleek: { text: "A sleek body slides through the water easily.", past: "A sleek body slid through the water easily.", credits: { streamlined_body: "high" } },
  shortLegs: { text: "Short legs don't drag in the water.", past: "Short legs didn't drag in the water.", credits: { long_hindlimbs: "low" } },
};

/** A "looks like" line: a free or neutral trait the real animal has, with no claim that it helps. */
const like = (text, trait, level) => ({ text, credits: { [trait]: level } });

/**
 * The collection: twelve animals, four per place (scope decision 72). Each has
 * an `id` (its picture is game/animals/<id>.jpg), its place, its signature
 * traits `signs` (any one of them qualifies it), and its `profile`: every
 * free or neutral trait that sets it apart, true of the real animal, which
 * settles a tie between animals that qualify. The animal marked `home` is
 * its place's own: a line there that matches no signature becomes it. Its
 * "why" lines credit only the traits its place requires, at their helpful
 * level, and only ones the real animal has; its "looks like" lines (`like`)
 * name free traits it has, and never say they help. Each has one true "Did
 * you know?" fact (scope decision 46), for Marc to check. Within a place, the
 * order breaks ties: the animal listed first wins.
 * @type {RevealAnimal[]}
 */
export const ANIMALS = [
  // ---- High leaves: curved claws, no webbing and a round body help there; the rest is free ----
  {
    id: "squirrel", name: "Squirrel", zone: LEAVES, home: true,
    signs: [["strong_tail", "high"], ["ear_tip_shape", "high"]],
    profile: { strong_tail: "high", ear_tip_shape: "high", long_hindlimbs: "high" },
    became: "climbers",
    reveal: "Your animals became climbers, a lot like a squirrel.",
    revealPast: "Your animals were becoming a lot like a squirrel.",
    why: [NEEDS.claws, NEEDS.noWebs],
    like: [like("Squirrels have big bushy tails too.", "strong_tail", "high"), like("Squirrels have pointy ears too.", "ear_tip_shape", "high"),
      like("Squirrels have long back legs too.", "long_hindlimbs", "high")],
    facts: ["Did you know? Squirrels plant trees by forgetting buried nuts."],
  },
  {
    id: "sloth", name: "Sloth", zone: LEAVES,
    signs: [["strong_tail", "low"], ["long_hindlimbs", "low"]],
    profile: { strong_tail: "low", long_hindlimbs: "low", dense_fur: "high", large_eyes: "low" },
    became: "slow, careful climbers",
    reveal: "Your animals became slow, careful climbers, a lot like a sloth.",
    revealPast: "Your animals were becoming a lot like a sloth.",
    why: [NEEDS.bigClaws, NEEDS.noWebs, NEEDS.round],
    like: [like("Sloths have tiny tails too.", "strong_tail", "low"), like("Sloths have short back legs too.", "long_hindlimbs", "low"),
      like("Sloths have thick, shaggy fur too.", "dense_fur", "high"), like("Sloths have small eyes too.", "large_eyes", "low")],
    facts: ["Did you know? Sloths are surprisingly good swimmers."],
  },
  {
    id: "koala", name: "Koala", zone: LEAVES,
    signs: [["ear_tip_shape", "low"], ["large_eyes", "low"]],
    profile: { ear_tip_shape: "low", large_eyes: "low", dense_fur: "high", strong_tail: "low", coat_shade: "high" },
    became: "sleepy climbers",
    reveal: "Your animals became sleepy climbers, a lot like a koala.",
    revealPast: "Your animals were becoming a lot like a koala.",
    why: [NEEDS.claws, NEEDS.noWebs, NEEDS.round],
    like: [like("Koalas have round, fluffy ears too.", "ear_tip_shape", "low"), like("Koalas have small eyes too.", "large_eyes", "low"),
      like("Koalas have thick fur too.", "dense_fur", "high"), like("Koalas have tiny tails too.", "strong_tail", "low"),
      like("Koalas have light grey coats too.", "coat_shade", "high")],
    facts: ["Did you know? Koalas sleep up to 20 hours a day."],
  },
  {
    // Slow lorises grip with strong hands and nails, not curved claws: no claws line.
    id: "slow-loris", name: "Slow loris", zone: LEAVES,
    signs: [["dense_fur", "high"], ["large_eyes", "high"]],
    profile: { dense_fur: "high", large_eyes: "high", strong_tail: "low", long_hindlimbs: "low" },
    became: "night climbers",
    reveal: "Your animals became night climbers, a lot like a slow loris.",
    revealPast: "Your animals were becoming a lot like a slow loris.",
    why: [NEEDS.noWebs, NEEDS.round],
    like: [like("Slow lorises have thick, woolly fur too.", "dense_fur", "high"), like("Slow lorises have huge eyes too.", "large_eyes", "high"),
      like("Slow lorises have tiny tails too.", "strong_tail", "low")],
    facts: ["Did you know? A slow loris has a venomous bite."],
  },
  // ---- Open ground: long back legs and big eyes help there; the rest is free ----
  {
    id: "hare", name: "Hare", zone: GROUND, home: true,
    signs: [["strong_tail", "low"], ["dense_fur", "high"]],
    profile: { strong_tail: "low", dense_fur: "high" },
    became: "runners",
    reveal: "Your animals became runners, a lot like a hare.",
    revealPast: "Your animals were becoming a lot like a hare.",
    why: [NEEDS.legs, NEEDS.eyes],
    like: [like("Hares have short tails too.", "strong_tail", "low"), like("Hares have thick fur too.", "dense_fur", "high")],
    facts: ["Did you know? Baby hares are born furry, with open eyes."],
  },
  {
    // In place of the arctic fox (scope decision 80): every line that wins on open ground has long back legs, and real
    // arctic foxes have short ones. A lynx has long legs and sharp eyes, so both of the ground's "why" lines are true.
    id: "lynx", name: "Lynx", zone: GROUND,
    signs: [["ear_tip_shape", "high"], ["curved_claws", "high"]],
    profile: { ear_tip_shape: "high", curved_claws: "high", dense_fur: "high", strong_tail: "low", tail_tip_marking: "high" },
    became: "pouncers",
    reveal: "Your animals became pouncers, a lot like a lynx.",
    revealPast: "Your animals were becoming a lot like a lynx.",
    why: [NEEDS.legs, NEEDS.eyes],
    like: [like("Lynx have pointy ears with tufts too.", "ear_tip_shape", "high"), like("Lynx have sharp, curved claws too.", "curved_claws", "high"),
      like("Lynx have very thick fur too.", "dense_fur", "high"), like("Lynx have short tails too.", "strong_tail", "low"),
      like("Lynx have a black tip on their tails too.", "tail_tip_marking", "high")],
    facts: ["Did you know? A lynx's big furry paws work like snowshoes."],
  },
  {
    id: "cheetah", name: "Cheetah", zone: GROUND,
    signs: [["dense_fur", "low"], ["streamlined_body", "high"]],
    profile: { dense_fur: "low", streamlined_body: "high", strong_tail: "high", tail_tip_marking: "high", curved_claws: "low" },
    became: "sprinters",
    reveal: "Your animals became sprinters, a lot like a cheetah.",
    revealPast: "Your animals were becoming a lot like a cheetah.",
    why: [NEEDS.legs, NEEDS.eyes],
    like: [like("Cheetahs have short fur too.", "dense_fur", "low"), like("Cheetahs have sleek bodies too.", "streamlined_body", "high"),
      like("Cheetahs have long, strong tails too.", "strong_tail", "high"), like("Cheetahs have a white tip on their tails too.", "tail_tip_marking", "high"),
      like("Cheetahs have straighter claws too.", "curved_claws", "low")],
    facts: ["Did you know? Cheetahs are the fastest runners on land."],
  },
  {
    id: "jerboa", name: "Jerboa", zone: GROUND,
    signs: [["strong_tail", "high"], ["tail_tip_marking", "high"]],
    profile: { strong_tail: "high", tail_tip_marking: "high", coat_shade: "high" },
    became: "hoppers",
    reveal: "Your animals became hoppers, a lot like a jerboa.",
    revealPast: "Your animals were becoming a lot like a jerboa.",
    why: [NEEDS.legs, NEEDS.eyes],
    like: [like("Jerboas have very long tails too.", "strong_tail", "high"), like("Jerboas have a bright tuft on their tail tip too.", "tail_tip_marking", "high"),
      like("Jerboas have light, sandy coats too.", "coat_shade", "high")],
    facts: ["Did you know? Jerboas hop on two legs, like tiny kangaroos."],
  },
  // ---- Water's edge: webbed feet, a strong tail and a sleek body help there, claws and long legs hurt; the rest is free ----
  {
    id: "river-otter", name: "River otter", zone: WATER, home: true,
    signs: [["dense_fur", "high"]],
    profile: { dense_fur: "high", large_eyes: "low", ear_tip_shape: "low", coat_shade: "low" },
    became: "swimmers",
    reveal: "Your animals became swimmers, a lot like a river otter.",
    revealPast: "Your animals were becoming a lot like a river otter.",
    why: [NEEDS.webs, NEEDS.tail, NEEDS.sleek, NEEDS.shortLegs],
    like: [like("River otters have very thick fur too.", "dense_fur", "high"), like("River otters have small eyes too.", "large_eyes", "low"),
      like("River otters have small, round ears too.", "ear_tip_shape", "low"), like("River otters have dark brown coats too.", "coat_shade", "low")],
    facts: ["Did you know? River otters slide down snowy and muddy banks."],
  },
  {
    // Seals have only a tiny tail: they swim with their back flippers. No tail line.
    id: "seal", name: "Seal", zone: WATER,
    signs: [["dense_fur", "low"], ["large_eyes", "high"]],
    profile: { dense_fur: "low", large_eyes: "high", ear_tip_shape: "low" },
    became: "sleek swimmers",
    reveal: "Your animals became sleek swimmers, a lot like a seal.",
    revealPast: "Your animals were becoming a lot like a seal.",
    why: [NEEDS.flippers, NEEDS.sleek, NEEDS.shortLegs],
    like: [like("Seals have short fur too.", "dense_fur", "low"), like("Seals have big eyes too.", "large_eyes", "high"),
      like("Seals have no pointy ears at all.", "ear_tip_shape", "low")],
    facts: ["Did you know? A seal's nose shuts tight when it dives."],
  },
  {
    // Beavers have a chunky body, not a sleek one: no sleek-body line.
    id: "beaver", name: "Beaver", zone: WATER,
    signs: [["coat_shade", "low"], ["tail_tip_marking", "low"]],
    profile: { coat_shade: "low", tail_tip_marking: "low", dense_fur: "high", large_eyes: "low", ear_tip_shape: "low" },
    became: "paddlers",
    reveal: "Your animals became paddlers, a lot like a beaver.",
    revealPast: "Your animals were becoming a lot like a beaver.",
    why: [NEEDS.webs, NEEDS.tail, NEEDS.shortLegs],
    like: [like("Beavers have dark brown coats too.", "coat_shade", "low"), like("Beavers have plain tail tips too.", "tail_tip_marking", "low"),
      like("Beavers have thick fur too.", "dense_fur", "high"), like("Beavers have small eyes too.", "large_eyes", "low"),
      like("Beavers have small, round ears too.", "ear_tip_shape", "low")],
    facts: ["Did you know? Beaver teeth are orange and never stop growing."],
  },
  {
    id: "platypus", name: "Platypus", zone: WATER,
    signs: [["ear_tip_shape", "low"], ["large_eyes", "low"]],
    profile: { ear_tip_shape: "low", large_eyes: "low", dense_fur: "high", coat_shade: "low" },
    became: "river divers",
    reveal: "Your animals became river divers, a lot like a platypus.",
    revealPast: "Your animals were becoming a lot like a platypus.",
    why: [NEEDS.webs, NEEDS.steer, NEEDS.sleek, NEEDS.shortLegs],
    like: [like("Platypuses have no pointy ears at all.", "ear_tip_shape", "low"), like("Platypuses have tiny eyes too.", "large_eyes", "low"),
      like("Platypuses have thick fur too.", "dense_fur", "high"), like("Platypuses have dark brown fur too.", "coat_shade", "low")],
    facts: ["Did you know? Platypuses are mammals that lay eggs."],
  },
];
for (const a of ANIMALS) if (a.zone === WATER) a.facts.push(WHALES);

/** Any place: a surviving line that hasn't changed toward its place yet. */
export const FIRST_MAMMALS = {
  id: null, name: "The first mammals (tree shrew)", zone: null, signs: [], profile: {},
  reveal: "Your animals stayed like the very first mammals, like a tree shrew.",
  why: [
    { text: "Their bodies didn't change much, and that worked.", credits: {} },
    { text: "Some animals today still look a lot like their ancient relatives.", credits: {} },
  ],
  like: [],
  facts: ["Did you know? Tree shrews are cousins of monkeys and apes."],
};

/** Any place: a line that died out before it changed toward its place (scope decision 41). It never gets the first mammals. */
export const NO_TIME = {
  id: null, name: "No time to change", zone: null, signs: [], profile: {},
  reveal: "Your animals didn't have time to change.",
  revealPast: "Your animals didn't have time to change.",
  why: [{ text: "Their story ended before new traits could be passed on.", credits: {} }],
  like: [],
  facts: [],
};

/** What each place requires (lineage-classroom's table): each trait that helps or hurts there, with its helpful level. */
export const REQUIRED = [LEAVES, GROUND, WATER].map((zone) => Object.entries(TRAIT_INDEX)
  .filter(([, t]) => PLACE_EFFECTS[t][zone] !== 0).map(([trait, t]) => [trait, PLACE_EFFECTS[t][zone] > 0 ? "high" : "low"]));

const sign = (level) => (level === "high" ? 1 : -1);

/**
 * How far a line's average is past a level for one trait: at least 0 when
 * the line meets it, below 0 when it does not.
 * @param {string} trait engine trait name
 * @param {"high"|"low"} level
 * @param {ArrayLike<number>} average the line's mean for each trait, engine order
 * @param {ArrayLike<number>} base the generation-0 world mean for each trait
 */
export function margin(trait, level, average, base, gap = GAP) {
  const t = TRAIT_INDEX[trait];
  return level === "high" ? average[t] - (base[t] + gap) : (base[t] - gap) - average[t];
}

/**
 * Which animal of its place a line is most like (docs/LINEAGE_REAL_ANIMAL_REVEAL.md):
 * 1. only the animals of the line's place are considered;
 * 2. a free trait the child chose decides first ("chip"): an animal qualifies
 *    when one of its signatures is a chosen trait that doesn't matter there,
 *    the way it was chosen (every animal of the line has it);
 * 3. else an animal qualifies when SIGNATURE_SHARE of the line has one of its
 *    signatures, high or low ("signature");
 * 4. among those that qualify, the best fits its profile best: each profile
 *    trait counts the share of the line that has it less the share that has
 *    the opposite, and a chosen trait 2 more for or against (a tie goes to the
 *    animal listed first);
 * 5. if none qualifies, the place's own animal ("place").
 * @param {ArrayLike<number>[]} genomes the line's animals in its place (body genomes)
 * @param {number} zone
 * @param {ArrayLike<number>} base the generation-0 world mean for each trait
 * @param {Array<{t:number, dir:number}>} [kept] the variations the line keeps (its chips)
 * @param {number} [gap]
 * @returns {{animal: RevealAnimal, by: "chip"|"signature"|"place", score: number}}
 */
export function matchAnimal(genomes, zone, base, kept = [], gap = GAP) {
  const n = genomes.length;
  const share = (t, dir) => (n ? genomes.filter((g) => (dir > 0 ? g[t] >= base[t] + gap : g[t] <= base[t] - gap)).length / n : 0);
  const chosen = new Map(kept.filter((v) => PLACE_EFFECTS[v.t][zone] === 0).map((v) => [v.t, v.dir]));
  const score = (a) => Object.entries(a.profile).reduce((sum, [trait, level]) => {
    const t = TRAIT_INDEX[trait], d = sign(level);
    return sum + (chosen.has(t) ? (chosen.get(t) === d ? 2 : -2) : 0) + share(t, d) - share(t, -d);
  }, 0);
  for (const by of /** @type {const} */ (["chip", "signature"])) {
    let best = null;
    for (const animal of ANIMALS) {
      if (animal.zone !== zone) continue;
      const qualifies = animal.signs.some(([trait, level]) =>
        (by === "chip" ? chosen.get(TRAIT_INDEX[trait]) === sign(level) : share(TRAIT_INDEX[trait], sign(level)) >= SIGNATURE_SHARE));
      if (!qualifies) continue;
      const s = score(animal);
      if (!best || s > best.score + 1e-9) best = { animal, by, score: s };
    }
    if (best) return best;
  }
  return { animal: ANIMALS.find((a) => a.zone === zone && a.home), by: "place", score: 0 };
}

/**
 * The reveal for a line at the end of its story: the animal it is most like
 * (matchAnimal), once it has changed toward its place, at least one required
 * trait at its helpful level on average; else the first mammals for a line
 * that lasted, and "no time to change" for one that died out (scope decision
 * 41). It shows only the "why" lines whose credited traits the line has, at
 * those levels, so it never credits a trait the line lacks, then at most
 * LIKE_LINES "looks like" lines the same way, the signature's first. The
 * animal's "Did you know?" lines come last (scope decision 46); they are
 * facts about the real animal, so they stay in the present tense on every
 * ending.
 * @param {ArrayLike<number>[]} genomes the line's animals in its place at the end (body genomes)
 * @param {number} zone the place most of the line lives in (engine zone index)
 * @param {ArrayLike<number>} base the generation-0 world mean for each trait
 * @param {{kept?: Array<{t:number, dir:number}>, died?: boolean, resemble?: boolean, gap?: number}} [opts] the variations the
 *   line keeps; it died out; the animal it looks most like even if it hasn't changed yet (a line in its chosen place at the
 *   story's last generation, short of the win: scope decision 73)
 * @returns {Reveal}
 */
export function revealFor(genomes, zone, base, { kept = [], died = false, resemble = false, gap = GAP } = {}) {
  const n = genomes.length;
  const average = base.map((b, t) => (n ? genomes.reduce((sum, g) => sum + g[t], 0) / n : b));
  const meets = (credits) => Object.entries(credits).every(([trait, level]) => margin(trait, level, average, base, gap) >= 0);
  const placed = n > 0 && zone >= 0 && zone <= 2;
  const changed = placed && REQUIRED[zone].some(([trait, level]) => margin(trait, level, average, base, gap) >= 0);
  const match = changed || (placed && resemble) ? matchAnimal(genomes, zone, base, kept, gap) : null;
  const animal = match?.animal ?? (died ? NO_TIME : FIRST_MAMMALS);
  const shown = animal.why.filter((w) => meets(w.credits));
  const signed = (l) => animal.signs.some(([trait]) => l.credits[trait] !== undefined);
  const likes = animal.like.filter((l) => meets(l.credits)).sort((a, b) => Number(signed(b)) - Number(signed(a))).slice(0, LIKE_LINES);
  return {
    animal, by: match?.by ?? null, changed,
    why: shown.map((w) => w.text), whyPast: shown.map((w) => w.past ?? w.text), like: likes.map((l) => l.text), facts: animal.facts,
  };
}

/**
 * @typedef {Object} RevealAnimal
 * @property {null|string} id its picture's file name, without the extension (game/animals/), null for a fallback
 * @property {string} name
 * @property {null|number} zone the place it can be revealed in (engine zone index), null for any
 * @property {boolean} [home] its place's own animal: a line there that matches no signature becomes it
 * @property {Array<[string, "high"|"low"]>} signs its signature traits: any one qualifies it
 * @property {Object<string, "high"|"low">} profile the free and neutral traits that set it apart, true of the real animal
 * @property {string} [became] what the line became ("swimmers")
 * @property {string} reveal the reveal line
 * @property {string} [revealPast] the reveal line when the line died out (not for the first mammals, never shown then)
 * @property {Array<{text:string, past?:string, credits:Object<string, "high"|"low">}>} why its "why" sentences (and their past
 *   tense, when the line died out) and the required traits each credits
 * @property {Array<{text:string, credits:Object<string, "high"|"low">}>} like its "looks like" sentences and the free trait each names
 * @property {string[]} facts its "Did you know?" lines, true facts about the real animal (scope decision 46)
 *
 * @typedef {Object} Reveal
 * @property {RevealAnimal} animal @property {null|"chip"|"signature"|"place"} by how it matched (null for a fallback)
 * @property {boolean} changed the line changed toward its place
 * @property {string[]} why @property {string[]} whyPast @property {string[]} like @property {string[]} facts
 */
