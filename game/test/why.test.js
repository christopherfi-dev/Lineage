// The "why" lines (game/src/why.js) keep every direction matched to the engine's Classroom table.
import { test } from "node:test";
import assert from "node:assert/strict";

test("a '~' line is exactly where the engine's effect is 0, and neutral traits never matter", async () => {
  const { WHY, NEUTRAL_WHY, effectIn, matters } = await import("../src/why.js");
  const { TRAITS, NEUTRAL_TRAIT_INDICES } = await import("../src/engine.js");
  TRAITS.forEach((trait, t) => {
    for (let z = 0; z < 3; z++) {
      if (NEUTRAL_TRAIT_INDICES.includes(t)) {
        assert.equal(effectIn(t, z), 0, `${trait} is neutral`);
        assert.ok(NEUTRAL_WHY[trait]);
        continue;
      }
      const little = /matter much/.test(WHY[trait][z]);
      assert.equal(little, effectIn(t, z) === 0, `${trait} in place ${z}: "${WHY[trait][z]}"`);
      assert.equal(matters(t, z), !little);
    }
  });
});
