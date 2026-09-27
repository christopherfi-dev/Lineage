/**
 * Narrative-log, creature-card and story text in kid language. Every number in
 * it is read from the engine's records.
 */

import { TRAIT_WORDS, hasWords } from "./variations.js";

/** Where each engine zone is, in words. */
export const ZONE_AT = ["in the high leaves", "on the open ground", "at the water's edge"];

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const number = (n) => (n < WORDS.length ? WORDS[n] : String(n));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const START_LINE = "Tap an animal to follow its family.";

/**
 * The child's animals, with the family's name once it has one (Step 5,
 * names.js): "your Mossfoot family", "your Mossfoot animals". Without a name,
 * every line is as it was: "your family", "your animals".
 * @param {string} what "family", "group", "animals", "babies"
 * @param {null|string} [name] "Mossfoot"
 */
export const your = (what, name = null) => `your ${name ? `${name} ` : ""}${what}`;

/** One glowing baby's new variation: in the log, and beside the baby on the map. */
export const bornLine = (group, name = null) => `One of ${your("babies", name)} was born with ${group}.`;

export function followLine(zone, n) {
  return `You're following a family of ${plural(n, "animal", "animals")} ${ZONE_AT[zone]}.`;
}

/**
 * What the log says about your group after a generation, from real counts.
 * Only for a group that is still alive. New variations are named only for
 * the babies that glow (scope decision 38), so the log never counts more
 * babies than the map shows.
 * @param {import("./bridge.js").GroupEvents} f
 * @param {"family"|"group"} noun
 * @param {Array<{group:string}>} glowing the variations of this generation's glowing babies
 * @param {null|string} [name] the family's name
 */
export function groupLines(f, noun, glowing = [], name = null) {
  const zones = f.byZone.map((n, z) => (n ? z : -1)).filter((z) => z >= 0);
  const where = zones.length === 1 ? ` ${ZONE_AT[zones[0]]}` : "";
  const lines = [];
  if (f.lastCouldNotMate) {
    lines.push("The last one couldn't find a mate.");
  } else if (f.count <= f.before && f.count <= 5) {
    lines.push(`Only ${number(f.count)} of ${your("animals", name)} ${f.count === 1 ? "is" : "are"} left${where}.`);
  } else if (f.count < f.before) {
    lines.push(`${capital(your(noun, name))} is smaller than last generation: ${f.count} animals now.`);
  } else if (f.count > f.before) {
    lines.push(`${capital(your(noun, name))} is bigger than last generation: ${f.count} animals now.`);
  } else {
    lines.push(`${capital(your(noun, name))} is the same size as last generation: ${plural(f.count, "animal", "animals")}.`);
  }
  if (glowing.length === 1) {
    lines.push(bornLine(glowing[0].group, name));
  } else if (glowing.length > 1) {
    lines.push(`${capital(number(glowing.length))} of ${your("babies", name)} were born with something new.`);
    lines.push(`One has ${glowing[0].group}.`);
  }
  return lines;
}

/* ================= the story (scope decision 6) ================= */

export const TIMES_UP = "Time's up! This one was picked at random.";
export const optionLine = (words) => `This one has ${words}.`;
const fastForward = (skip) => `Fast-forward: ${skip} generations!`;

/** Right after a follow: two groups of the same size, for a fair test (scope decision 33). */
export function chosenLines(group, n, others, zone, skip) {
  return [
    `You now follow ${plural(n, "animal", "animals")} with ${group}.`,
    `And ${others} others ${ZONE_AT[zone]}, for a fair test.`,
    fastForward(skip),
  ];
}

/**
 * After a fast-forward: both groups' sizes, and what most of yours has now
 * that it didn't before.
 * @param {Array<{trait:string, level:number}>} changed traits whose usual word changed
 */
export function skipDoneLines(skip, n, others, changed, noun, name = null) {
  const lines = [`${skip} generations later: ${name ? your("animals", name) : "yours"} ${n}, the others here ${others}.`];
  if (changed.length) lines.push(`Most of ${your(noun, name)} has ${hasWords(changed[0].trait, changed[0].level)}.`);
  return lines;
}

/* ================= following a new variation (scope decisions 32–34 and 42) ================= */

/** The first time a newborn glows in a story. */
export const GLOW_HINT = "Tap a glowing baby to see what's new.";
/** "Follow 14 animals with smaller eyes": the fair test's real size, when it can start right away (scope decision 36). */
export const followButton = (n, group) => `Follow ${n} animals with ${group}`;
/** Too few here to start a fair test right away: following it first fast-forwards to see if it spreads (scope decision 42). */
export const followSpread = (group) => `Follow animals with ${group}`;
/** Closes the card and leaves the glow on, so the child can look at other babies and come back (scope decision 43). */
export const KEEP_LOOKING = "Keep looking";
/** How many of the latest counts the spread's line shows. */
const SPREAD_COUNTS = 3;
/** The spread's live counter, updated each generation: "Will it spread? Animals with smaller eyes: 3… 7… 12…" */
export const spreadLine = (group, counts) =>
  `Will it spread? Animals with ${group}: ${counts.slice(-SPREAD_COUNTS).map((n) => `${n}…`).join(" ")}`;
/** The spread stopped: none carry it any more. */
export const SPREAD_GONE = "It disappeared. Most new traits do.";
/** The spread stopped at its last generation with too few to start a fair test. */
export const SPREAD_SHORT = "It didn't spread far enough.";
/** Too few here are without it for a fair test: most of the habitat has it already. */
export const SPREAD_COMMON = "Most here have it. Too few others for a fair test.";
/** The child's group fell to DANGER_SIZE or fewer during a spread: back to the usual pace (scope decision 44). */
export const dangerLine = (noun, name = null) => `Wait! ${capital(your(noun, name))} is getting very small.`;
/** On every glowing baby's card while the child's group is that small: no follow starts (playtest, "no jumping ship"). */
export const needsYou = (noun, name = null) => `${capital(your(noun, name))} needs you. Stay with them?`;

/** A variation's words, short enough for one line: "more webbing between the toes" becomes "more webbing", "a stronger tail" "stronger tails". */
const PLURALS = { "tail tip": "tail tips", tail: "tails", body: "bodies", coat: "coats" };
const shortGroup = (group) => group.replace(" between the toes", "")
  .replace(/^a (\w+) (tail tip|tail|body|coat)$/, (_, adj, noun) => `${adj} ${PLURALS[noun]}`);

/**
 * At a follow, where the new group comes from (playtest): "3 from your family
 * and 17 others with bigger eyes join you." Real counts: the members already in
 * the child's group, and the ones new to it.
 * @param {number} stay @param {number} come @param {string} group the variation's words
 * @param {"family"|"group"} noun
 */
export function joinLine(stay, come, group, noun) {
  const words = shortGroup(group);
  if (!come) return `All ${stay} with ${words} are from your ${noun}.`;
  if (!stay) return `${come} animals with ${words} join you.`;
  return `${stay} from your ${noun} and ${come} others with ${words} join you.`;
}

/* ================= visiting other places (playtest) ================= */

/** The three places the camera can visit, on their buttons, in engine zone order. */
export const PLACE_BUTTONS = ["Leaves", "Ground", "Water"];
/** Each place's name at the start of its summary. */
const PLACE_NAMES = ["High leaves", "Open ground", "Water's edge"];
const TREND = { up: "growing", down: "shrinking", same: "steady" };

/**
 * On arriving at a place: "Water's edge: 119 animals, growing. Most have webbed feet."
 * "Most" is more than half of the animals there, "Many" a quarter or more, "Some" a tenth or more.
 * @param {number} zone @param {number} n animals there now @param {"up"|"down"|"same"} trend since last generation
 * @param {null|{trait:string, share:number}} common the meaningful trait at its high end that the most there have
 */
export function placeLine(zone, n, trend, common) {
  const head = `${PLACE_NAMES[zone]}: ${plural(n, "animal", "animals")}, ${TREND[trend]}.`;
  if (!common || common.share < 0.1) return head;
  return `${head} ${common.share > 0.5 ? "Most" : common.share >= 0.25 ? "Many" : "Some"} have ${hasWords(common.trait, 2)}.`;
}

/* ================= another group's card (playtest) ================= */

/** The row label for an animal's own family, on its card. */
export const ITS_FAMILY = "Its family";
/** How that group is doing against yours since the last follow (or since the story began). */
export function doingLine(better, sinceFollow) {
  const since = sinceFollow ? "since your last choice" : "since you started";
  return better > 0 ? `Doing better than yours ${since}.` : better < 0 ? `Doing worse than yours ${since}.` : `Doing about as well as yours ${since}.`;
}
/** Heading over the traits where that group differs most from yours. */
export const DIFFERENT_TITLE = "How they're different from yours";
/** When no meaningful trait differs by much. */
export const MUCH_LIKE_YOURS = "Much like yours.";
/** [less, more] than the child's group, for each meaningful trait: "Longer back legs than yours". */
const THAN_YOURS = {
  toe_webbing: ["Less webbing than yours", "More webbing than yours"],
  curved_claws: ["Straighter claws than yours", "More curved claws than yours"],
  dense_fur: ["Thinner fur than yours", "Thicker fur than yours"],
  long_hindlimbs: ["Shorter back legs than yours", "Longer back legs than yours"],
  strong_tail: ["Weaker tails than yours", "Stronger tails than yours"],
  large_eyes: ["Smaller eyes than yours", "Bigger eyes than yours"],
  streamlined_body: ["Chunkier bodies than yours", "Sleeker bodies than yours"],
};
export const thanYours = (trait, dir) => THAN_YOURS[trait][dir > 0 ? 1 : 0];

/*
 * Growth is never a percentage (scope decision 12): a child sees counts,
 * "Yours: 20 → 31", beside two small bars for then and now.
 */

/** "Yours: 20 → 31" */
export const countLine = (label, { then, now }) => `${label}: ${then} → ${now}`;

export const YOURS = "Yours";
/** "Yours", or once the family has a name, "Your Mossfoot animals". */
export const yoursLabel = (name = null) => (name ? capital(your("animals", name)) : YOURS);
/** The fair test's other group: the same number of animals from the same habitat, without the variation. */
export const OTHERS_HERE = "The others here";
/** "Yours (smaller eyes)", or "Your Mossfoot animals with smaller eyes" */
export const yoursWith = (group, name = null) => (name ? `${yoursLabel(name)} with ${group}` : `${YOURS} (${group})`);
/** When your group died out, the ending says what became of the others here (scope decision 37). */
export const OTHERS_DIED_TOO = "The others here died out too.";
export const OTHERS_ALIVE = "The others here are still alive.";
/** The ending's last fair test: "On the open ground:" */
export const fairHeading = (zone) => `${capital(ZONE_AT[zone])}:`;
export const SINCE_TITLE = "Since your last choice:";

/** "grew", "shrank": which way a group's size went, without the number. */
function went({ now, then }) {
  if (now === 0) return "died out";
  return now > then ? "grew" : now < then ? "shrank" : "stayed the same size";
}

/**
 * After following a neutral trait (scope decision 8): it made no difference to
 * who survived. The choice card never says so; this comes afterwards.
 * @param {string} group "a darker coat"
 * @param {{now:number, then:number}} size the group's size since that choice
 */
export function neutralLines(group, size, name = null) {
  return [`${capital(group)} didn't change who survived.`, `${capital(your("group", name))} ${went(size)} because of its other traits.`];
}

/**
 * The ending's line of evidence: "Animals with webbed feet at the water's edge: 14 then, 22 now."
 * A count of zero is "none". "No webbing" keeps the longest line near 12 words.
 * @param {import("./evidence.js").Evidence} e
 */
export function evidenceLine(e) {
  const what = e.trait === "toe_webbing" && e.level === 0 ? "no webbing" : hasWords(e.trait, e.level);
  const n = (k) => (k === 0 ? "none" : String(k));
  return `Animals with ${what} ${ZONE_AT[e.zone]}: ${n(e.then)} then, ${n(e.now)} now.`;
}

/**
 * The clue as both sides: a heading and two count rows (the page adds the bars).
 * "At the water's edge:" / "With webbed feet: 12 → 25" / "Without: 30 → 18"
 * @param {import("./evidence.js").Comparison} c
 */
export function comparisonLines(c) {
  return { heading: `${capital(ZONE_AT[c.zone])}:`, withLabel: `With ${hasWords(c.trait, 2)}`, withoutLabel: "Without" };
}

export const lastPassed = (noun, name = null) => `The last of ${your(noun, name)} has passed.`;
export const madeIt = (noun, name = null) => `${capital(your(noun, name))} made it to the end of the story.`;

export function endingTitle(outcome, n, noun, name = null) {
  return outcome === "died" ?
    `${capital(your("story", name))} lasted ${plural(n, "generation", "generations")}.` :
    `${capital(your(noun, name))} survived ${plural(n, "generation", "generations")}.`;
}

export function question(outcome, noun, name = null) {
  return outcome === "died" ? `Why do you think ${your(noun, name)} didn't survive?` : `Why do you think ${your(noun, name)} survived?`;
}

/** The ending's heading over the group's traits: "Your Mossfoot group's traits". */
export const traitsTitle = (noun, name = null) => `${capital(your(noun, name))}'s traits`;

/** Heading of the ending's list of choices. */
export const choicesHeading = (n) => (n ? "You followed the ones with" : "Your choices");

/** One item of that list: "a darker coat", or "more curved claws (picked at random)". */
export const choiceRecap = (c) => (c.byChance ? `${c.group} (picked at random)` : c.group);

export const noChoices = (outcome, name = null) =>
  (outcome === "died" ? "Their story ended before the first choice." : `You followed ${your("family", name)} the whole story.`);

/* ================= the creature card (Step 3) ================= */

export const inYour = (noun, name = null) => `In ${your(noun, name)}`;
export const notInYour = (noun, name = null) => `Not in ${your(noun, name)}`;
export const PASSED_AWAY = "This one has passed away.";

/** Where else an animal spends some of its time. */
const SOMETIMES_AT = ["in the leaves", "on the ground", "at the water"];
/**
 * Where an animal spends its time (playtest): "Lives at the water's edge.",
 * "Lives on the open ground, sometimes at the water."
 * @param {{zone:number, sometimes:null|number}} split groups.js timeSplit
 */
export const livesLine = ({ zone, sometimes }) => `Lives ${ZONE_AT[zone]}${sometimes === null ? "" : `, sometimes ${SOMETIMES_AT[sometimes]}`}.`;

/** A trait at its high end, as the start of a sentence. */
const MISFIT = {
  toe_webbing: "Lots of webbing", curved_claws: "Curved claws", dense_fur: "Thick fur", long_hindlimbs: "Long back legs",
  strong_tail: "A strong tail", large_eyes: "Big eyes", streamlined_body: "A sleek body",
};
/**
 * A trait that doesn't fit where the animal lives (playtest), gently: "Lots of
 * webbing, but lives far from water.", "Curved claws, but lives on the open
 * ground." A trait that helps most at the water is "far from water" anywhere else.
 * @param {{trait:string, best:number}} m groups.js misfit @param {number} zone where it lives
 * @param {boolean} [group] about a group: "…, but they live …"
 */
export const misfitLine = (m, zone, group = false) =>
  `${MISFIT[m.trait]}, but ${group ? "they live" : "lives"} ${m.best === 2 ? "far from water" : ZONE_AT[zone]}.`;

/**
 * The trait that is new in this animal: a mutation at birth, which way it went.
 * "New at birth: a stronger tail, not from its parents."
 */
export const newAtBirthLine = (trait, up) => `New at birth: ${TRAIT_WORDS[trait][up ? 1 : 0]}, not from its parents.`;

/** Beside the ending's drawing of the group's average body. */
export const lookLine = (outcome, name = null) =>
  (outcome === "died" ? `Here's what ${your("animals", name)} looked like.` : `Here's what ${your("animals", name)} look like now.`);

/** The real-animal reveal (reveal.js) with the family's name: "Your Mossfoot animals became paddlers, …". */
export const namedReveal = (line, name = null) => (name ? line.replace(/^Your animals\b/, `Your ${name} animals`) : line);

/** "Back to my family" until the first follow, then "Back to my group", with the family's name once it has one. */
export const homeLabel = (noun, name = null) => `Back to my ${name ? `${name} ` : ""}${noun}`;
