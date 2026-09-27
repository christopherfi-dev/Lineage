/**
 * Curated worlds (scope decision 6). The game only shows a world whose three
 * habitats all still have living animals at the story's length (STORY_GENERATIONS,
 * or the teacher's ?length=), the generation every story that lasts ends at.
 *
 * A seed is checked by running the engine ahead, in a copy of the world that
 * is then thrown away. That is an observer run: it only reads the engine, and
 * the world the child sees starts again from generation 0 with the same seed,
 * so it goes exactly the way the check saw it. In the defining world, 95 of
 * seeds 1–100 pass (12, 40, 56, 68 and 96 do not).
 */

import { STORY_GENERATIONS } from "./story.js";

/** A family has a future when an observer run shows it still alive this many generations on (scope decision 59). */
export const FUTURE_GENERATIONS = 8;

/** "New world" picks from seeds 1 to this. */
export const MAX_SEED = 999;

/**
 * True when all three habitats still have living animals at the story's
 * final generation.
 * @param {(seed:number)=>import("./bridge.js").Bridge} makeWorld
 * @param {number} seed
 * @param {number} [length] the story's length (story.js storyLength)
 */
export function isGoodSeed(makeWorld, seed, length = STORY_GENERATIONS) {
  const ahead = makeWorld(seed);
  for (let g = 0; g < length; g++) if (!ahead.step()) return false;
  return ahead.zoneCounts().every((n) => n > 0);
}

/**
 * A random good seed other than `not`, or null if none turns up (almost
 * every seed is good, so that should never happen).
 * @param {(seed:number)=>import("./bridge.js").Bridge} makeWorld
 * @param {number|null} [not]
 * @param {()=>number} [rnd] never the engine's generator
 * @param {number} [length] the story's length
 */
export function goodSeed(makeWorld, not = null, rnd = Math.random, length = STORY_GENERATIONS) {
  for (let tries = 0; tries < 50; tries++) {
    const seed = 1 + Math.floor(rnd() * MAX_SEED);
    if (seed !== not && isGoodSeed(makeWorld, seed, length)) return seed;
  }
  return null;
}

/**
 * The families a tap could follow now that have a future (scope decision 59):
 * an observer run on a throwaway copy of the world, played to this generation
 * and FUTURE_GENERATIONS on, shows at least one of each family still alive. The
 * same seed makes the same world, so the copy goes exactly the way the child's
 * world will. Null when the copy doesn't match the child's world (it always should).
 * @param {(seed:number)=>import("./bridge.js").Bridge} makeWorld
 * @param {number} seed
 * @param {import("./bridge.js").Bridge} bridge the child's world, now
 * @returns {null|Set<number|string>} the tops of the families with a future (families.js top)
 */
export function familiesWithAFuture(makeWorld, seed, bridge, ahead = FUTURE_GENERATIONS) {
  const copy = makeWorld(seed);
  while (copy.generation < bridge.generation) if (!copy.step()) return null;
  if (copy.livingIds().join() !== bridge.livingIds().join()) return null;
  const counts = copy.families.lineCounts(copy.livingIds());
  const roots = new Set(copy.livingIds().map((id) => copy.families.top(id, counts)));
  for (let g = 0; g < ahead; g++) if (!copy.step()) break;
  // Everyone alive then, and every mother line above them.
  const alive = new Set(), mother = copy.families.mother;
  for (const id of copy.livingIds()) for (let a = id; a !== undefined && !alive.has(a); a = mother.get(a)) alive.add(a);
  return new Set([...roots].filter((r) => alive.has(r)));
}
