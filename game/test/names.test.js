// Part 4's names (scope decision 61): typed names are letters only, at most 12, and pass a small filter;
// "Use my name" joins the child's name to a trait word; a fresh seed gives fresh names.
import { test } from "node:test";
import assert from "node:assert/strict";

test("typed names: letters only, up to 12, capitalised, and filtered", async () => {
  const { typedName, myNameFamily, NAME_MAX } = await import("../src/names.js");
  assert.equal(NAME_MAX, 12);
  assert.equal(typedName("mia"), "Mia");
  assert.equal(typedName("Zoë"), "Zoë");
  assert.equal(typedName("Cassie"), "Cassie");
  for (const bad of ["", "Bob Smith", "R2D2", "abcdefghijklm", "ass", "Hell"]) assert.equal(typedName(bad), null, bad);
  assert.equal(myNameFamily("Mia", "paddle"), "Miapaddle");
  assert.equal(myNameFamily("x y", "paddle"), null);
});

test("every made name joins its halves readably, and a new seed usually offers new names", async () => {
  const { familyNames, HABITAT_WORDS, TRAIT_NAME_WORDS, joins, NEVER } = await import("../src/names.js");
  for (const starts of HABITAT_WORDS) for (const s of starts) for (const words of Object.values(TRAIT_NAME_WORDS)) for (const e of words) {
    if (joins(s, e)) assert.ok(!NEVER.includes(s + e) && s.at(-1).toLowerCase() !== e[0]);
  }
  const animals = [{ genome: [0.9, 0.2, 0.5, 0.5, 0.1, 0.5, 0.8, 0.5, 0.5, 0.5], zone: 2 }];
  const world = Array(10).fill(0.5);
  const seen = new Set();
  for (let seed = 1; seed <= 20; seed++) seen.add(familyNames(animals, world, seed).join());
  assert.ok(seen.size >= 15, `${seen.size} different sets of names in 20 stories`);
});
