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

test("a guess offers the trait's line for each place, and the place's own is right", async () => {
  const { guessFor, explainGuess, whyLine, reasonsIn, HAS_AT } = await import("../src/why.js");
  const { TRAIT_INDEX } = await import("../src/engine.js");
  const t = TRAIT_INDEX.toe_webbing, g = guessFor("Why?", t, 2);
  assert.deepEqual(g.options.map((o) => o.text), [0, 1, 2].map((z) => whyLine(t, z)));
  assert.deepEqual(g.options.map((o) => o.right), [false, false, true]);
  assert.equal(explainGuess(g, g.options[2]), "Yes! Webbed feet push through water.");
  assert.equal(explainGuess(g, g.options[0]), "Good thinking. But here, webbed feet push through water.");
  // A group has a trait from halfway to its far end: webbing helps at the water's edge, long back legs hurt there.
  const genome = Array(10).fill(0.2);
  genome[t] = HAS_AT; genome[TRAIT_INDEX.long_hindlimbs] = 0.9;
  const r = reasonsIn([{ genome }], 2);
  assert.deepEqual(r.helping.map((x) => x.words), ["webbed feet"]);
  assert.deepEqual(r.hurting.map((x) => x.words), ["long back legs"]);
});

test("the ending's clue shows a trait where it helps against where it hurts", async () => {
  const { sameTraitClue, census } = await import("../src/evidence.js");
  const { PLACE_EFFECTS, TRAIT_INDEX } = await import("../src/engine.js");
  const at = (zone, webbing) => { const genome = Array(10).fill(0.5); genome[TRAIT_INDEX.toe_webbing] = webbing; return { genome, zone }; };
  const then = census([at(2, 0.9), at(0, 0.9), at(0, 0.9)]);
  const now = census([...Array(9)].map(() => at(2, 0.9)).concat([at(0, 0.1)]));
  const clue = sameTraitClue(then, now, [TRAIT_INDEX.toe_webbing]);
  assert.equal(clue.trait, "toe_webbing");
  assert.ok(PLACE_EFFECTS[TRAIT_INDEX.toe_webbing][clue.helps.zone] > 0 && PLACE_EFFECTS[TRAIT_INDEX.toe_webbing][clue.hurts.zone] < 0);
  assert.deepEqual([clue.helps.then, clue.helps.now, clue.hurts.then, clue.hurts.now], [1, 9, 2, 0]);
});
