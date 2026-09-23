/**
 * Narrative-log, label and story text in kid language. Every number in it is
 * read from the engine's records.
 */

import { TRAIT_INDEX } from "./engine.js";
import { TRAIT_WORDS, hasWords } from "./variations.js";

/** Where each engine zone is, in words. */
export const ZONE_AT = ["in the high leaves", "on the open ground", "at the water's edge"];

/** Body features worth a mention when an animal is inspected: [trait, at least, words]. */
const NOTABLE = [
  ["toe_webbing", 0.5, "webbed feet"],
  ["curved_claws", 0.66, "curved claws"],
  ["dense_fur", 0.66, "thick fur"],
  ["long_hindlimbs", 0.66, "long back legs"],
  ["strong_tail", 0.66, "a strong tail"],
  ["large_eyes", 0.66, "big eyes"],
  ["streamlined_body", 0.66, "a sleek body"],
];

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
    lines.push(`${capital(number(f.mutated.length))} of your babies were born with something new. One has ${traitChange(f.mutated[0])}.`);
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
  return [`Now you follow every animal with ${group}: ${plural(n, "animal", "animals")}.`, fastForward(skip)];
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

/** "grew 50%", "shrank 25%": a group's size now against its size at the choice. */
export function growth({ now, then }) {
  if (now === 0) return "died out";
  const pct = Math.round((100 * (now - then)) / Math.max(1, then));
  return pct > 0 ? `grew ${pct}%` : pct < 0 ? `shrank ${-pct}%` : "stayed the same size";
}

/** On a tapped animal of a group not chosen: "Their group grew 50%. Yours shrank 25%." */
export const compareLine = (theirs, yours) => `Their group ${growth(theirs)}. Yours ${growth(yours)}.`;

/**
 * At the next choice point: how the last choice turned out against the ones not chosen.
 * @param {{now:number, then:number}} yours
 * @param {Array<{group:string, now:number, then:number}>} others
 */
export function sinceLines(yours, others) {
  return [
    `Since your last choice, your group ${growth(yours)}.`,
    ...others.map((o) => `The ones with ${o.group} ${growth(o)}.`),
  ];
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

/* ================= labels on tapped animals ================= */

/** A few words about an animal's body, for its label. */
export function notable(genome) {
  const found = NOTABLE.filter(([trait, at]) => genome[TRAIT_INDEX[trait]] >= at).map(([, , words]) => words);
  return found.length ? `${capital(found.slice(0, 2).join(" and "))}.` : "";
}

/** Label text for an animal outside your group: where it lives and what stands out. */
export function otherLabel(zone, genome) {
  return `${capital(ZONE_AT[zone])}. ${notable(genome)}`.trim();
}
