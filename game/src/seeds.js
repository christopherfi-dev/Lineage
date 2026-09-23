/**
 * Curated worlds (scope decision 6). The game only shows a world whose three
 * habitats all still have living animals at STORY_GENERATIONS, the generation
 * every story that lasts ends at.
 *
 * A seed is checked by running the engine ahead, in a copy of the world that
 * is then thrown away. That is an observer run: it only reads the engine, and
 * the world the child sees starts again from generation 0 with the same seed,
 * so it goes exactly the way the check saw it. In the defining world, 95 of
 * seeds 1–100 pass (12, 40, 56, 68 and 96 do not).
 */

import { STORY_GENERATIONS } from "./story.js";

/** "New world" picks from seeds 1 to this. */
export const MAX_SEED = 999;

/**
 * True when all three habitats still have living animals at the story's
 * final generation.
 * @param {(seed:number)=>import("./bridge.js").Bridge} makeWorld
 * @param {number} seed
 */
export function isGoodSeed(makeWorld, seed) {
  const ahead = makeWorld(seed);
  for (let g = 0; g < STORY_GENERATIONS; g++) if (!ahead.step()) return false;
  return ahead.zoneCounts().every((n) => n > 0);
}

/**
 * A random good seed other than `not`, or null if none turns up (almost
 * every seed is good, so that should never happen).
 * @param {(seed:number)=>import("./bridge.js").Bridge} makeWorld
 * @param {number|null} [not]
 * @param {()=>number} [rnd] never the engine's generator
 */
export function goodSeed(makeWorld, not = null, rnd = Math.random) {
  for (let tries = 0; tries < 50; tries++) {
    const seed = 1 + Math.floor(rnd() * MAX_SEED);
    if (seed !== not && isGoodSeed(makeWorld, seed)) return seed;
  }
  return null;
}
