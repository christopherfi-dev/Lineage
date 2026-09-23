/**
 * Narrative-log and label text in kid language. Every number in it is read
 * from the engine's records for the generation that just ran.
 */

import { TRAIT_INDEX } from "./engine.js";

/** Where each engine zone is, in words. */
export const ZONE_AT = ["in the high leaves", "on the open ground", "at the water's edge"];

/** [less, more] words for each engine trait. */
const TRAIT_WORDS = {
  toe_webbing: ["less webbing between its toes", "more webbing between its toes"],
  curved_claws: ["straighter claws", "more curved claws"],
  dense_fur: ["thinner fur", "thicker fur"],
  long_hindlimbs: ["shorter back legs", "longer back legs"],
  strong_tail: ["a weaker tail", "a stronger tail"],
  large_eyes: ["smaller eyes", "bigger eyes"],
  streamlined_body: ["a chunkier body", "a sleeker body"],
  coat_shade: ["a darker coat", "a lighter coat"],
  ear_tip_shape: ["rounder ear tips", "pointier ear tips"],
  tail_tip_marking: ["a plainer tail tip", "a brighter tail tip"],
};

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
export const PROMPT_LINE = "Tap any animal to follow a new group.";

export function followLine(zone, n) {
  return `You're following a family of ${plural(n, "animal", "animals")} ${ZONE_AT[zone]}.`;
}

export function branchLine(n) {
  return n === 1 ? "You're following just her branch now. So far it is only her." :
    `You're following just her branch now: ${plural(n, "animal", "animals")}.`;
}

export const BRANCH_ENDED_LINE = "Her line ended. Most new variations are lost by chance before they can spread.";

export function extinctionLines(lasted) {
  return [
    `The last of your group has passed. Their story lasted ${plural(lasted, "generation", "generations")}.`,
    PROMPT_LINE,
  ];
}

/**
 * What the log says when your group has just ended.
 * @param {import("./bridge.js").FamilyEvents} f the group that ended
 * @param {null|{members:Set<number>}} home the family a branch went back to, if any is alive
 */
export function endingLines(f, home) {
  if (!f.branch) return extinctionLines(f.lasted);
  if (!home) return [BRANCH_ENDED_LINE, PROMPT_LINE];
  return [BRANCH_ENDED_LINE, `You're back with the family she came from: ${plural(home.members.size, "animal", "animals")}.`];
}

/**
 * What the log says about your family after a generation, from real counts.
 * Only for a group that is still alive; `endingLines` covers one that just ended.
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
    lines.push(`Your group is smaller than last generation: ${f.count} animals now.`);
  } else if (f.count > f.before) {
    lines.push(`Your group is bigger than last generation: ${f.count} animals now.`);
  } else {
    lines.push(`Your group is the same size as last generation: ${plural(f.count, "animal", "animals")}.`);
  }
  if (f.mutated.length === 1) {
    lines.push(`One of your babies was born with ${traitChange(f.mutated[0])}.`);
  } else if (f.mutated.length > 1) {
    lines.push(`${capital(number(f.mutated.length))} of your babies were born with something new. One has ${traitChange(f.mutated[0])}.`);
  }
  return lines;
}

/** A few words about an animal's body, for its label. */
export function notable(genome) {
  const found = NOTABLE.filter(([trait, at]) => genome[TRAIT_INDEX[trait]] >= at).map(([, , words]) => words);
  return found.length ? `${capital(found.slice(0, 2).join(" and "))}.` : "";
}

/** Label text for an animal in another family. */
export function otherLabel(zone, familySize, genome) {
  return `${capital(ZONE_AT[zone])}. Its family has ${plural(familySize, "animal", "animals")}. ${notable(genome)}`.trim();
}

/** Label text for one of yours; `branchSize` is given when she can be followed on her own. */
export function memberLabel(genome, branchSize) {
  const branch = branchSize === undefined ? "" :
    branchSize === 1 ? "Her branch is only her so far." : `Her branch has ${branchSize} animals.`;
  return `${notable(genome)} ${branch}`.trim();
}
