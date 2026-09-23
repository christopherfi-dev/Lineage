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
 * What the log says about your family after a generation, from real counts.
 * Only for a family that is still alive.
 * @param {import("./bridge.js").FamilyEvents} f
 */
export function familyLines(f) {
  const zones = f.byZone.map((n, z) => (n ? z : -1)).filter((z) => z >= 0);
  const where = zones.length === 1 ? ` ${ZONE_AT[zones[0]]}` : "";
  const lines = [];
  if (f.lastCouldNotMate) {
    lines.push("The last one couldn't find a mate.");
  } else if (f.count <= f.before && f.count <= 5) {
    lines.push(`Only ${number(f.count)} of your animals ${f.count === 1 ? "is" : "are"} left${where}.`);
  } else if (f.count < f.before) {
    lines.push(`Your family is smaller than last generation: ${f.count} animals now.`);
  } else if (f.count > f.before) {
    lines.push(`Your family is bigger than last generation: ${f.count} animals now.`);
  } else {
    lines.push(`Your family is the same size as last generation: ${plural(f.count, "animal", "animals")}.`);
  }
  if (f.mutated.length === 1) {
    lines.push(`One of your babies was born with ${traitChange(f.mutated[0])}.`);
  } else if (f.mutated.length > 1) {
    lines.push(`${capital(number(f.mutated.length))} of your babies were born with something new. One has ${traitChange(f.mutated[0])}.`);
  }
  return lines;
}

/* ================= the story (scope decision 6) ================= */

export const NOTHING_SPREAD = "Nothing new has spread through your family yet. Keep watching.";
export const TIMES_UP = "Time's up! This one was picked at random.";
export const optionLine = (words) => `This one has ${words}.`;

/** Right after a choice. */
export function chosenLines(words, n, skip) {
  return [
    `Now you follow the ones with ${words}: ${plural(n, "animal", "animals")}.`,
    `Fast-forward: ${skip} generations!`,
  ];
}

/**
 * After a fast-forward: how big the family is, and what most of it has now
 * that it didn't before.
 * @param {Array<{trait:string, level:number}>} changed traits whose usual word changed
 */
export function skipDoneLines(skip, n, changed) {
  const lines = [`${skip} generations later, your family has ${plural(n, "animal", "animals")}.`];
  if (changed.length) lines.push(`Most of your family now has ${hasWords(changed[0].trait, changed[0].level)}.`);
  return lines;
}

export const LAST_PASSED = "The last of your family has passed.";
export const MADE_IT = "Your family made it to the end of the story.";

export function endingTitle(outcome, n) {
  return outcome === "died" ?
    `Their story lasted ${plural(n, "generation", "generations")}.` :
    `Your family survived ${plural(n, "generation", "generations")}.`;
}

export const QUESTION = {
  died: "Why do you think your family didn't survive?",
  survived: "Why do you think your family survived?",
};

/** @param {{words:string, byChance:boolean}} c */
export function choiceRecap(c) {
  return c.byChance ?
    `Time ran out, and the one with ${c.words} was picked at random.` :
    `You followed the one with ${c.words}.`;
}

export const NO_CHOICES = "Their story ended before the first choice.";

/* ================= labels on tapped animals ================= */

/** A few words about an animal's body, for its label. */
export function notable(genome) {
  const found = NOTABLE.filter(([trait, at]) => genome[TRAIT_INDEX[trait]] >= at).map(([, , words]) => words);
  return found.length ? `${capital(found.slice(0, 2).join(" and "))}.` : "";
}

/** Label text for an animal in another family. */
export function otherLabel(zone, familySize, genome) {
  return `${capital(ZONE_AT[zone])}. Its family has ${plural(familySize, "animal", "animals")}. ${notable(genome)}`.trim();
}
