/**
 * Narrative-log lines in kid language. Every number in them is read from the
 * engine's records for the generation that just ran.
 */

import { ZONE_WORDS } from "./world.js";

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

/** @param {{trait:string, before:number, after:number, delta:number}} m */
export function traitChange(m) {
  const up = m.after !== m.before ? m.after > m.before : m.delta > 0;
  return TRAIT_WORDS[m.trait][up ? 1 : 0];
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function followLine(zone, count) {
  return `You're following the animals of ${ZONE_WORDS[zone]} now — ${plural(count, "animal", "animals")}.`;
}

/** @param {import("./bridge.js").GenerationEvents} ev */
export function generationLines(ev) {
  const f = ev.followed;
  const lines = [];
  if (f.count === 0) {
    lines.push("None of your group are left.");
  } else {
    const changes = [];
    if (f.born.length) changes.push(`${plural(f.born.length, "baby was", "babies were")} born`);
    if (f.gone.length) changes.push(`${plural(f.gone.length, "animal is", "animals are")} gone`);
    const head = `Your group has ${plural(f.count, "animal", "animals")}`;
    lines.push(changes.length ? `${head}. ${capital(changes.join(" and "))}.` : `${head}, the same as before.`);
  }
  if (f.mutated.length === 1) {
    lines.push(`One of your babies was born with ${traitChange(f.mutated[0])}.`);
  } else if (f.mutated.length > 1) {
    lines.push(`${f.mutated.length} of your babies were born with something new. One has ${traitChange(f.mutated[0])}.`);
  }
  return lines;
}

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
