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

/* ================= following a new variation (scope decisions 32–34, 42, 67 and 68) ================= */

/** The first time a newborn glows in a story. */
export const GLOW_HINT = "Tap a glowing baby to see what's new.";
/** Closes the card and leaves the glow on, so the child can look at other babies and come back (scope decision 43). */
export const KEEP_LOOKING = "Keep looking";

/** A variation's words, short enough for one line: "more webbing between the toes" becomes "more webbing", "a stronger tail" "stronger tails". */
const PLURALS = { "tail tip": "tail tips", tail: "tails", body: "bodies", coat: "coats" };
export const shortGroup = (group) => group.replace(" between the toes", "")
  .replace(/^a (\w+) (tail tip|tail|body|coat)$/, (_, adj, noun) => `${adj} ${PLURALS[noun]}`);
/** "is" for "more webbing", "are" for "bigger eyes". */
const isAre = (words) => (/s$/.test(words) ? "are" : "is");

/** A glowing baby's card (scope decision 67): "Follow animals with bigger eyes", with no number and no gate. */
export const followButton = (group) => `Follow animals with ${shortGroup(group)}`;
/** Right after a follow: "3 of your line have bigger eyes." */
export const carriersLine = (n, group, name = null, noun = "family") => `${n} of ${your(noun, name)} ${n === 1 ? "has" : "have"} ${shortGroup(group)}.`;
/** How many of the latest counts the rising counter shows. */
const RISE_COUNTS = 5;
/**
 * The fast-forward's live counter (scope decision 67), changed in place each
 * generation: "More webbing in your line: 1… 4… 9…", and when it stops, "…
 * 17… 23!" at 20 or more, else a full stop.
 * @param {string} group @param {number[]} counts the line at the follow and after each generation
 * @param {null|string} stopped why it stopped (story.js Rise), or null while it rises
 */
export function riseLine(group, counts, stopped = null, name = null) {
  const shown = counts.slice(-RISE_COUNTS), last = shown.length - 1;
  const end = !stopped ? "…" : stopped === "reached" ? "!" : ".";
  return `${capital(shortGroup(group))} in ${your("line", name)}: ${shown.map((k, i) => (i < last ? `${k}…` : `${k}${end}`)).join(" ")}`;
}
/** The fast-forward is over (scope decision 67). */
export const SLOW_DOWN = "Back to real time. Watch your line.";
/**
 * A follow with no fast-forward at all: the line has RISE_TO or more with the trait already (scope decision 67), or
 * fewer than FAST_FROM, watched from the start (scope decision 69; "it" for one).
 */
export const WATCH_THEM = "Watch what happens to them.";
export const watchThem = (n) => (n === 1 ? "Watch what happens to it." : WATCH_THEM);
/** Real time after a follow, before the table's reason (scope decision 67): "Your line with bigger eyes is growing." */
export const growingLine = (group, name = null) => `${capital(your("line", name))} with ${shortGroup(group)} is growing.`;
/** "Your animals with a stronger tail are dying off." */
export const dyingOffLine = (group, name = null) => `${capital(your("animals", name))} with ${shortGroup(group)} are dying off.`;
/** A "~" or neutral trait's result told as a line, with no guess (scope decision 69). */
export const sameLine = (name = null) => `${capital(your("line", name))} is doing about as well as your relatives.`;
/** The tap-to-guess questions about a follow (scope decision 68), asked only at a new Field Guide discovery (69). */
export const growingQuestion = (group, name = null) => `Why is ${your("line", name)} with ${shortGroup(group)} growing?`;
export const dyingQuestion = (group, name = null) => `Why are ${your("animals", name)} with ${shortGroup(group)} dying off?`;
export const sameQuestion = (name = null) => `Why is ${your("line", name)} doing about as well as your relatives?`;
export const diedQuestion = (group, name = null) => `Why did ${your("animals", name)} with ${shortGroup(group)} die out?`;
/** A followed line's last animals, fading (scope decision 68): "The last of your animals with bigger eyes are dying." */
export const goneLine = (group, n, name = null) => `The last of ${your("animals", name)} with ${shortGroup(group)} ${n === 1 ? "is" : "are"} dying.`;
/** A follow's line on a count row: "Your line with bigger eyes". */
export const lineWithLabel = (group, name = null) => `${capital(your("line", name))} with ${shortGroup(group)}`;
/** After why, when a line died out on a trait that doesn't matter there. */
export const OTHER_TRAITS = "Other traits decided who made it.";
/** The in-the-moment reflection's last line (scope decision 68): "They didn't make it. Back to your line." */
export const backToLine = (noun = "line", name = null) => `They didn't make it. Back to ${your(noun, name)}.`;
/** The comparison beside the line (scope decisions 67 and 68): its relatives in the line's place. */
export const RELATIVES_HERE = "Your relatives here";

/* ================= "Where will your family live?" (scope decision 70) ================= */

/** Where the line lives, in Marc's words for the three places. */
const PLACE_AT = ["in the high trees", "on the open ground", "near the water"];
/** The first choice's question: "Where will your Mossfoot family live?" */
export const placeQuestion = (name = null) => `Where will ${your("family", name)} live?`;
/** Each place's card, under a real baby of the family living there (Marc's lines). */
export const PLACE_CARDS = [
  "This baby seems to prefer the high trees.",
  "This baby seems to prefer the open ground.",
  "This baby seems to prefer living near the water.",
];
/** A card with no baby living there yet: it fills in when one is born. */
export const WAIT_GENERATION = "Wait a generation.";
/** The first choice on "Your line so far", the family tree strip and the ending. */
export const PLACE_LABELS = ["High trees", "Open ground", "Near the water"];
/** Right after the choice: "2 of your Mossfoot family live near the water." */
export const homeLine = (n, zone, name = null) => `${n} of ${your("family", name)} ${n === 1 ? "lives" : "live"} ${PLACE_AT[zone]}.`;
/**
 * The move's live counter, changed in place each generation of its
 * fast-forward: "Your Mossfoot line near the water: 2… 5… 11… 20!", a full
 * stop when it stopped short of 20. A line with 20 there already: "… 23!".
 * @param {number} zone @param {number[]} counts the line at the choice and after each generation
 * @param {null|string} stopped why the fast-forward stopped (story.js Home), or null while it runs
 */
export function homeCounter(zone, counts, stopped = null, name = null) {
  const shown = counts.slice(-RISE_COUNTS), last = shown.length - 1;
  const end = !stopped ? "…" : stopped === "reached" ? "!" : ".";
  return `${capital(your("line", name))} ${PLACE_AT[zone]}: ${shown.map((k, i) => (i < last ? `${k}…` : `${k}${end}`)).join(" ")}`;
}
/** The line moves into a place with plenty of room: pairs there have more babies, since there is more food. */
export const LOTS_OF_ROOM = "Lots of room here!";
/**
 * Choosing the open ground is staying (scope decision 71): its own lines instead of the move's, "Your Mossfoot family
 * stays on the open ground." then the crowd it stays in.
 */
export const staysLine = (name = null) => `${capital(your("family", name))} stays on the open ground.`;
export const CROWDED_GROUND = "It's crowded here already. The fastest runners will win.";
/** Who does best in each place, by its key traits in the table. */
const WINNERS = ["The best climbers are winning.", "The fastest runners are winning.", "The best swimmers are winning."];
/** The line's place is full: from now on, who survives there depends on who suits it best. */
export const fillingLine = (zone) => `It's getting full. ${WINNERS[zone]}`;
/** Each place's key trait in the table: its biggest help there. */
const KEY_TRAITS = ["curved claws", "long back legs", "webbed feet"];
/** On the card of another group that lived in the line's place before the line came: "…Now webbed feet are starting to matter." */
export const firstHereLine = (zone) => `They got here first. Now ${KEY_TRAITS[zone]} are starting to matter.`;
/** No fast-forward to the new home: the line has 20 or more there already. */
export const WATCH_LINE = "Watch your line.";
/** The last of a line in the chosen place, fading: "The last of your animals near the water are dying." */
export const homeGoneLine = (zone, n, name = null) => `The last of ${your("animals", name)} ${PLACE_AT[zone]} ${n === 1 ? "is" : "are"} dying.`;

/** On every glowing baby's card while the child's line is very small: no follow starts (scope decision 44, playtest's "no jumping ship"). */
export const needsYou = (noun, name = null) => `${capital(your(noun, name))} needs you. Stay with them?`;

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
/** The ending's last choice (scope decision 67): "On the open ground:" */
export const fairHeading = (zone) => `${capital(ZONE_AT[zone])}:`;
/** Its result, when it was clear: "On the open ground, 3 generations later:" */
export const fairLater = (zone, n) => `${capital(ZONE_AT[zone])}, ${plural(n, "generation", "generations")} later:`;
export const SINCE_TITLE = "Since your last choice:";

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

/* ================= the win (scope decision 73) ================= */

/** The places, as a line fits one: "Your Mossfoot line fits the water's edge now." */
export const ZONE_THE = ["the high leaves", "the open ground", "the water's edge"];
/** The ending's first step, once the line fits its home: its title. */
export const WIN_TITLE = "You did it!";
/** Above the ending's first step, won or not. */
export const RESULT_STEP = "Your line's home";
/** Said in the world as the line fits its home, before the celebration. */
export const fitsHome = (name = null) => `${capital(your("line", name))} fits its home!`;
/** The celebration's last two lines: "Your Mossfoot line fits the water's edge now." */
export const fitsNow = (zone, name = null) => `${capital(your("line", name))} fits ${ZONE_THE[zone]} now.`;
export const ANY_CHANGE_WORSE = "Almost any new change would make things worse.";
/** "a river otter", "an arctic fox" (reveal.js animals). */
export const anAnimal = (animal) => { const n = animal.name.toLowerCase(); return `${/^[aeiou]/.test(n) ? "an" : "a"} ${n}`; };
/** "Your Mossfoot line became swimmers, like a river otter." */
export const becameLine = (animal, name = null) => `${capital(your("line", name))} became ${animal.became}, like ${anAnimal(animal)}.`;
const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
/** "You followed more webbing and sleeker bodies." (the chips' words, at most three) */
export const followedLine = (groups) => `You followed ${andList(groups.map(shortGroup))}.`;
/** At the story's last generation, short of the win: the ending's first step. */
export const stillChanging = (name = null) => `${capital(your("line", name))} is still changing.`;
export const KEEP_GOING = "Keep going next time?";
/** "Your Mossfoot line looks most like a river otter so far." */
export const resembleLine = (animal, name = null) => `${capital(your("line", name))} looks most like ${anAnimal(animal)} so far.`;

/* ================= chosen by the place (scope decision 75) ================= */

/** Each place, as the one that chooses: "Strong tail: chosen by the water." */
export const PLACE_BY = ["the trees", "the ground", "the water"];
/** A trait each place requires, the way it helps there: [on its chip, what is winning, with an article]. */
const CHOSEN = {
  toe_webbing: { 1: ["Webbed feet", "webbed feet", "webbed feet"], [-1]: ["No webbing", "toes without webbing", "toes without webbing"] },
  curved_claws: { 1: ["Curved claws", "curved claws", "curved claws"], [-1]: ["Straighter claws", "straighter claws", "straighter claws"] },
  long_hindlimbs: { 1: ["Long back legs", "long back legs", "long back legs"], [-1]: ["Short legs", "short legs", "short legs"] },
  strong_tail: { 1: ["Strong tail", "strong tails", "a strong tail"], [-1]: ["Small tail", "small tails", "a small tail"] },
  large_eyes: { 1: ["Big eyes", "big eyes", "big eyes"], [-1]: ["Small eyes", "small eyes", "small eyes"] },
  streamlined_body: { 1: ["Sleek body", "sleek bodies", "a sleek body"], [-1]: ["Round body", "round bodies", "a round body"] },
  dense_fur: { 1: ["Thick fur", "thick fur", "thick fur"], [-1]: ["Thin fur", "thin fur", "thin fur"] },
};
/** "Strong tail: chosen by the water" (a chip in its own style). */
export const chosenChip = (trait, dir, zone) => `${CHOSEN[trait][dir][0]}: chosen by ${PLACE_BY[zone]}`;
/** Said once, when such a chip first shows: "The water is choosing too." then "Strong tails are winning here." */
export const placeChoosing = (zone) => `${capital(PLACE_BY[zone])} is choosing too.`;
export const winningHere = (chosen) => {
  const words = chosen.map((c) => CHOSEN[c.trait][c.dir][1]);
  return `${capital(andList(words))} ${words.length === 1 && / fur$/.test(words[0]) ? "is" : "are"} winning here.`;
};
/** In the win's celebration: "The water chose a strong tail too." (at most three, "too" after the child's own follows). */
export const placeChoseLine = (zone, chosen, too = true) =>
  `${capital(PLACE_BY[zone])} chose ${andList(chosen.slice(0, 3).map((c) => CHOSEN[c.trait][c.dir][2]))}${too ? " too" : ""}.`;
