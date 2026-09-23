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

/** @param {{trait:string, before:number, after:number, delta:number}} m */
export function traitChange(m) {
  const up = m.after !== m.before ? m.after > m.before : m.delta > 0;
  return TRAIT_WORDS[m.trait][up ? 1 : 0];
}

export const START_LINE = "Tap an animal to follow its family.";

export function followLine(zone, n) {
  return `You're following a family of ${plural(n, "animal", "animals")} ${ZONE_AT[zone]}.`;
}

/**
 * What the log says about your group after a generation, from real counts.
 * Only for a group that is still alive.
 * @param {import("./bridge.js").GroupEvents} f
 * @param {"family"|"group"} noun
 */
export function groupLines(f, noun) {
  const zones = f.byZone.map((n, z) => (n ? z : -1)).filter((z) => z >= 0);
  const where = zones.length === 1 ? ` ${ZONE_AT[zones[0]]}` : "";
  const lines = [];
  if (f.lastCouldNotMate) {
    lines.push("The last one couldn't find a mate.");
  } else if (f.count <= f.before && f.count <= 5) {
    lines.push(`Only ${number(f.count)} of your animals ${f.count === 1 ? "is" : "are"} left${where}.`);
  } else if (f.count < f.before) {
    lines.push(`Your ${noun} is smaller than last generation: ${f.count} animals now.`);
  } else if (f.count > f.before) {
    lines.push(`Your ${noun} is bigger than last generation: ${f.count} animals now.`);
  } else {
    lines.push(`Your ${noun} is the same size as last generation: ${plural(f.count, "animal", "animals")}.`);
  }
  if (f.mutated.length === 1) {
    lines.push(`One of your babies was born with ${traitChange(f.mutated[0])}.`);
  } else if (f.mutated.length > 1) {
    lines.push(`${capital(number(f.mutated.length))} of your babies were born with something new.`);
    lines.push(`One has ${traitChange(f.mutated[0])}.`);
  }
  return lines;
}

/* ================= the story (scope decision 6) ================= */

export const TIMES_UP = "Time's up! This one was picked at random.";
export const optionLine = (words) => `This one has ${words}.`;
const fastForward = (skip) => `Fast-forward: ${skip} generations!`;

/** A choice point with nothing to choose from passes. */
export function passedLines(noun, skip) {
  return [`Nothing new has spread through your ${noun} yet.`, fastForward(skip)];
}

/** Right after a choice: the group is now every animal with the chosen variation. */
export function chosenLines(group, n, skip) {
  return [`You now follow ${plural(n, "animal", "animals")} with ${group}.`, fastForward(skip)];
}

/**
 * After a fast-forward: how big the group is, and what most of it has now
 * that it didn't before.
 * @param {Array<{trait:string, level:number}>} changed traits whose usual word changed
 */
export function skipDoneLines(skip, n, changed, noun) {
  const lines = [`${skip} generations later, your ${noun} has ${plural(n, "animal", "animals")}.`];
  if (changed.length) lines.push(`Most of your ${noun} now has ${hasWords(changed[0].trait, changed[0].level)}.`);
  return lines;
}

/*
 * Growth is never a percentage (scope decision 12): a child sees counts,
 * "Yours: 20 → 31", beside two small bars for then and now.
 */

/** "Yours: 20 → 31" */
export const countLine = (label, { then, now }) => `${label}: ${then} → ${now}`;

export const YOURS = "Yours";
export const THEIRS = "Theirs";
export const SINCE_TITLE = "Since your last choice:";
/** "The ones with a sleeker body" */
export const theOnesWith = (group) => `The ones with ${group}`;

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
export function neutralLines(group, size) {
  return [`${capital(group)} didn't change who survived.`, `Your group ${went(size)} because of its other traits.`];
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

export const lastPassed = (noun) => `The last of your ${noun} has passed.`;
export const madeIt = (noun) => `Your ${noun} made it to the end of the story.`;

export function endingTitle(outcome, n, noun) {
  return outcome === "died" ?
    `Their story lasted ${plural(n, "generation", "generations")}.` :
    `Your ${noun} survived ${plural(n, "generation", "generations")}.`;
}

export function question(outcome, noun) {
  return outcome === "died" ? `Why do you think your ${noun} didn't survive?` : `Why do you think your ${noun} survived?`;
}

/** Heading of the ending's list of choices. */
export const choicesHeading = (n) => (n ? "You followed the ones with" : "Your choices");

/** One item of that list: "a darker coat", or "more curved claws (picked at random)". */
export const choiceRecap = (c) => (c.byChance ? `${c.group} (picked at random)` : c.group);

export const noChoices = (outcome) =>
  (outcome === "died" ? "Their story ended before the first choice." : "Nothing new spread far enough to choose from.");

/* ================= the creature card (Step 3) ================= */

export const inYour = (noun) => `In your ${noun}`;
export const notInYour = (noun) => `Not in your ${noun}`;
export const PASSED_AWAY = "This one has passed away.";

/** "Lives at the water's edge." */
export const livesLine = (zone) => `Lives ${ZONE_AT[zone]}.`;

/**
 * The trait that is new in this animal: a mutation at birth, which way it went.
 * "New at birth: a stronger tail, not from its parents."
 */
export const newAtBirthLine = (trait, up) => `New at birth: ${TRAIT_WORDS[trait][up ? 1 : 0]}, not from its parents.`;

/** Beside the ending's drawing of the group's average body. */
export const lookLine = (outcome) =>
  (outcome === "died" ? "Here's what your animals looked like." : "Here's what your animals look like now.");
