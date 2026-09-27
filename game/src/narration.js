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

/**
 * Right after a follow (scope decision 59): where the fair test's animals with
 * the variation come from, with real counts, then the ones without it beside
 * them, in the family's place, and the fast-forward.
 * @param {string} group the variation's words @param {number} fromFamily @param {number} fromNearby
 * @param {number} others the twins without it @param {number} zone @param {number} skip
 */
export function chosenLines(group, fromFamily, fromNearby, others, zone, skip, name = null, noun = "family") {
  return [joinLine(fromFamily, fromNearby, group, name, noun), `And ${others} without, ${ZONE_AT[zone]}, for a fair test.`, fastForward(skip)];
}

/**
 * After a fast-forward: both sides of the fair test, who made it (scope
 * decision 65), and what most of the family has now that it didn't before.
 * @param {Array<{trait:string, level:number}>} changed traits whose usual word changed
 */
export function skipDoneLines(skip, n, others, group, changed, name = null, noun = "family") {
  const lines = [`${skip} generations later: ${n} with ${shortGroup(group)} made it, and ${others} without.`];
  if (changed.length) lines.push(`Most of ${your(noun, name)} has ${hasWords(changed[0].trait, changed[0].level)}.`);
  return lines;
}

/* ================= following a new variation (scope decisions 32–34 and 42) ================= */

/** The first time a newborn glows in a story. */
export const GLOW_HINT = "Tap a glowing baby to see what's new.";
/** "Follow 14 animals with smaller eyes": the fair test's real size, when it can start right away (scope decision 36). */
export const followButton = (n, group) => `Follow ${n} animals with ${group}`;
/** Too few have it to start a fair test right away: the world first fast-forwards to see if it is passed on (scope decisions 42 and 59). */
export const PASS_ON_BUTTON = "Will it be passed on?";
/** Closes the card and leaves the glow on, so the child can look at other babies and come back (scope decision 43). */
export const KEEP_LOOKING = "Keep looking";
/** How many of the latest counts the passed-on line shows. */
const PASSED_COUNTS = 3;

/** A variation's words, short enough for one line: "more webbing between the toes" becomes "more webbing", "a stronger tail" "stronger tails". */
const PLURALS = { "tail tip": "tail tips", tail: "tails", body: "bodies", coat: "coats" };
export const shortGroup = (group) => group.replace(" between the toes", "")
  .replace(/^a (\w+) (tail tip|tail|body|coat)$/, (_, adj, noun) => `${adj} ${PLURALS[noun]}`);
/** "is" for "more webbing", "are" for "bigger eyes". */
const isAre = (words) => (/s$/.test(words) ? "are" : "is");

/**
 * The fast-forward's live counter, updated each generation (scope decision 59):
 * "Webbed feet are being passed on. 3… 7… 12 have it now." The family's
 * animals in its place that have it.
 */
export function passedOnLine(group, counts) {
  const words = shortGroup(group), shown = counts.slice(-PASSED_COUNTS), n = shown[shown.length - 1];
  return `${capital(words)} ${isAre(words)} being passed on. ${shown.map((k, i) => (i < shown.length - 1 ? `${k}…` : k)).join(" ")} ${n === 1 ? "has" : "have"} it now.`;
}
/**
 * The fast-forward's first line, with the table's reason there (scope decision 60):
 * "More webbing is being passed on. Webbed feet push through water."
 */
export function passingOnLine(group, reason) {
  const words = shortGroup(group);
  return `${capital(words)} ${isAre(words)} being passed on. ${reason}`;
}
/** None of the family's animals have it any more. */
export const PASSED_GONE = "It wasn't passed on. Most new traits aren't.";
/** None have it any more, and it hurts in the family's place: the table's reason. "It wasn't passed on. Long legs drag in the water." */
export const passedGoneLine = (reason) => `It wasn't passed on. ${reason}`;
/** Its last generation came with too few having it to start a fair test. */
export const PASSED_SHORT = "Only a few have it so far. Too few to test.";
/** Many have it, but too few without it are twins for them. */
export const PASSED_COMMON = "Many have it now. Too few without it to test.";
/** Most of the family (or line, scope decision 66) moved to another place meanwhile, where the test would be. */
export const passedMoved = (noun = "family") => `Most of your ${noun} moved. Let's keep looking.`;
export const PASSED_MOVED = passedMoved();
/** The child's family fell to DANGER_SIZE or fewer during the fast-forward: back to the usual pace (scope decision 44). */
export const dangerLine = (noun, name = null) => `Wait! ${capital(your(noun, name))} is getting very small.`;
/** On every glowing baby's card while the child's family is that small: no follow starts (playtest, "no jumping ship"). */
export const needsYou = (noun, name = null) => `${capital(your(noun, name))} needs you. Stay with them?`;

/**
 * At a follow, where the fair test's animals with the variation come from
 * (playtest, scope decision 59): "14 of your family have bigger eyes.", or with
 * animals from nearby filling in, "12 of your family and 2 nearby have bigger eyes."
 * @param {number} fromFamily @param {number} fromNearby @param {string} group the variation's words
 */
export function joinLine(fromFamily, fromNearby, group, name = null, noun = "family") {
  const words = shortGroup(group);
  if (!fromNearby) return `${fromFamily} of ${your(noun, name)} have ${words}.`;
  if (!fromFamily) return `${fromNearby} animals nearby have ${words}.`;
  return `${fromFamily} of ${your(noun, name)} and ${fromNearby} nearby have ${words}.`;
}

/* ================= the family's place (scope decision 59) ================= */

/** A glowing baby living away from the family's (or line's) place: its variation can't be tested there. */
export const awayLine = (zone, name = null, noun = "family") => `This baby lives ${ZONE_AT[zone]}, away from ${your(noun, name)}.`;
/** The way back from a direction the family took, with no fair test showing that direction hurting. */
export const backLine = (chosenGroup, name = null, noun = "family") => `${capital(your(noun, name))} already chose ${shortGroup(chosenGroup)}.`;
const HERE = ["up here", "on the open ground", "at the water's edge"];
/** A fair test showed the way the family went hurting: the way back, with its reason. "Chunkier bodies are doing better up here. Go back?" */
export const goBackLine = (group, zone) => { const w = shortGroup(group); return `${capital(w)} ${isAre(w)} doing better ${HERE[zone]}. Go back?`; };
const ZONE_TO = ["up to the high leaves", "to the open ground", "to the water's edge"];
/** A real move, over generations: some of the family now live in another place. */
export const movingLine = (zone, name = null) => `Some of ${your("animals", name)} are moving ${ZONE_TO[zone]}.`;
/** Most of the family lives in another place now: the fair tests happen there from now on. */
export const movedLine = (zone, name = null) => `Most of ${your("animals", name)} live ${ZONE_AT[zone]} now.`;
/** At the start, a tap on a family an observer run shows dying out within a few generations. */
export const IN_TROUBLE = "This family is in trouble already. Try another!";
/** "Try another family" with fewer than 25 generations of the story left in this world (scope decision 64). */
export const NEARLY_OVER_LINE = "This world is nearly over. Start a new world?";

/** "Helping here" and "Hurting here" (scope decision 60): what the family has that helps or hurts where it lives. */
export function helpingLine(words) { return `Helping here: ${words.length ? words.join(", ") : "nothing yet"}.`; }
export function hurtingLine(words) { return `Hurting here: ${words.length ? words.join(", ") : "nothing"}.`; }

/** The ending's clue, the same trait in two places (scope decision 60): "Webbed feet at the water's edge: 3 → 25". */
export const SAME_TRAIT = "Same trait, different place:";
export const sameTraitLabel = (trait, zone) => `${capital(hasWords(trait, 2))} ${ZONE_AT[zone]}`;

/** The ending's first step (scope decision 62): the family's average body when the story began, beside the end. */
export const startLine = (name = null) => `Here's how ${your("animals", name)} began.`;
/** The ending's result row: the family's size when the story began and, as the line once followed, at the end. */
export const familyLabel = (name = null, noun = "family") => capital(your(noun, name));
/** Above the chosen traits on the ending: "You chose:". */
export const YOU_CHOSE = "You chose:";

/** The living portrait's sheet (scope decision 61): "Your Mossfoot animals, on average". */
export const averageTitle = (name = null) => `${capital(your("animals", name))}, on average`;
/** Above the family tree strip, before a follow. */
export const TREE_TITLE = "Your family tree";
/** Above it once the line is followed (scope decision 66): the first animal tapped, then each followed baby. */
export const LINE_TREE_TITLE = "Your line, baby by baby";
/** A followed baby on the strip, by the trait it was followed for: "Sleeker body", "More webbing" (scope decision 66). */
export const babyLabel = (group) => capital(group.replace(/^an? /, "").replace(" between the toes", ""));
/** The strip read aloud: "Your family tree: great-grandmother, then grandmother, then mother, then first mother." */
export const treeSpoken = (first, labels, title = TREE_TITLE) =>
  `${title}: ${[first, ...labels].filter(Boolean).map((l) => l.toLowerCase()).join(", then ")}.`;
/** The line's strip read aloud, one short sentence a baby: "Your line, baby by baby. First mother. Then sleeker body." */
export const lineTreeSpoken = (labels) => [LINE_TREE_TITLE, ...labels.map((l, i) => (i ? `Then ${l.toLowerCase()}` : l))].map((t) => `${t}.`).join(" ");

/** "Your family so far" (scope decision 59): each chosen trait, and why one faded. "Your Mossfoot line so far" (scope decision 66). */
export const SO_FAR = "Your family so far";
export const soFarTitle = (name = null, noun = "family") => `${capital(your(noun, name))} so far`;
export const chipWords = (group) => capital(shortGroup(group));
/** "Bigger eyes faded. They didn't help here." "More webbing faded. It wasn't passed on." */
export function fadedLine(group, why) {
  const w = shortGroup(group), they = /s$/.test(w);
  return `${capital(w)} faded. ${why === "hurt" ? `${they ? "They" : "It"} didn't help here.` : `${they ? "They weren't" : "It wasn't"} passed on.`}`;
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
  // The common-ancestor world (scope decision 56) starts with nobody in the leaves or at the water.
  if (n === 0) return `${PLACE_NAMES[zone]}: no animals live here yet.`;
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

/** "Yours: 20 → 31", or for a fair test's twins, who made it (scope decision 65): "Your 12 with pointier ear tips: 10 made it" */
export const countLine = (label, { then, now, madeIt = false }) => (madeIt ? `${label}: ${now} made it` : `${label}: ${then} → ${now}`);

export const YOURS = "Yours";
/** "Yours", or once the family has a name, "Your Mossfoot animals". */
export const yoursLabel = (name = null) => (name ? capital(your("animals", name)) : YOURS);
/** The fair test's two sides, both in the family's place (scope decision 59): "With bigger eyes: 14 → 16", "Without: 14 → 12". */
export const withLabel = (group) => `With ${shortGroup(group)}`;
export const WITHOUT = "Without";
/** Its twins, counted by who made it (scope decision 65): "Your 12 with pointier ear tips" and "The 12 without". */
export const twinsLabel = (n, group) => `Your ${n} with ${shortGroup(group)}`;
export const othersLabel = (n) => `The ${n} without`;
/** A fair test on a trait that doesn't matter there, when both sides' animals that made it are within 2 (scope decision 65). */
export const ABOUT_SAME = "About the same.";
/** A card for an animal from nearby that fills in a fair test. */
export const NEARBY_IN_TEST = "From nearby, in your fair test";
/** The ending's last fair test: "On the open ground:" */
export const fairHeading = (zone) => `${capital(ZONE_AT[zone])}:`;
/** Its result, when it was clear: "On the open ground, 3 generations later:" */
export const fairLater = (zone, n) => `${capital(ZONE_AT[zone])}, ${plural(n, "generation", "generations")} later:`;
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
/** The rest of each line the child narrowed from, and their babies (scope decision 66): on a relative's card. */
export const ONE_OF_RELATIVES = "One of your relatives";
/** A relative who is one of the fair test's twins without the chosen trait. */
export const RELATIVE_IN_TEST = "One of your relatives, in your fair test";
/** The row label for the child's relatives, on a relative's card and the ending. */
export const RELATIVES = "Your relatives";
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

/** "Back to my family", with the family's name once it has one: "Back to my Mossfoot family". */
export const homeLabel = (noun, name = null) => `Back to my ${name ? `${name} ` : ""}${noun}`;
