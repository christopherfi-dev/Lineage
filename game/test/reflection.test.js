// Part 5's reflection (scope decision 62): the idea checked against the table and what the family had, the
// Field Guide's 21 discoveries, and storage that only ever stays on this device.
import { test } from "node:test";
import assert from "node:assert/strict";

test("Check my idea: yes for the table's reason where the family lived; otherwise a gentle why", async () => {
  const { checkIdea, ideaSentence } = await import("../src/reflection.js");
  const { TRAIT_INDEX } = await import("../src/engine.js");
  const has = Array(10).fill(false);
  has[TRAIT_INDEX.large_eyes] = true; has[TRAIT_INDEX.toe_webbing] = true;
  const truth = { survived: false, zone: 2, has, helper: TRAIT_INDEX.toe_webbing, hurter: TRAIT_INDEX.large_eyes };
  const eyes = TRAIT_INDEX.large_eyes, web = TRAIT_INDEX.toe_webbing;
  assert.deepEqual(checkIdea({ did: false, t: eyes, helped: false, zone: 2 }, truth).lines, ["Yes! Big eyes don't help underwater, and cost energy."]);
  assert.deepEqual(checkIdea({ did: false, t: web, helped: false, zone: 2 }, truth).lines,
    ["Good thinking. But webbed feet helped here.", "What else did they have?"]);
  assert.equal(checkIdea({ did: false, t: eyes, helped: false, zone: 1 }, truth).right, false);
  assert.equal(checkIdea(null, truth).lines[0], "Thanks for your idea!");
  assert.equal(ideaSentence({ did: true, t: eyes, helped: true, zone: 1 }), "My animals did survive because their big eyes helped on the open ground.");
});

test("the Field Guide has each meaningful trait in each place, with the table's mark", async () => {
  const { FIELD_GUIDE, discoveryLine, discoveredLine, discover, discoveries, keepInJournal, journalEntries } = await import("../src/reflection.js");
  assert.equal(FIELD_GUIDE.length, 21);
  assert.deepEqual(["✓", "✗", "~"].map((m) => FIELD_GUIDE.filter((e) => e.mark === m).length), [8, 8, 5]);
  const web = FIELD_GUIDE.find((e) => e.key === "toe_webbing:2");
  assert.equal(discoveryLine(web), "You discovered: webbed feet help at the water's edge.");
  assert.equal(discoveryLine(FIELD_GUIDE.find((e) => e.key === "dense_fur:0")), "You discovered: thick fur doesn't matter much in the high leaves.");
  assert.equal(discoveredLine(9), "You've discovered 9 of 21.");
  // Without storage (as here), a discovery lasts the page's life, is said once, and nothing breaks.
  assert.equal(discover(web), true);
  assert.equal(discover(web), false);
  assert.equal(discoveries().size, 1);
  assert.equal(keepInJournal({ id: 1 }), false);
  assert.deepEqual(journalEntries(), []);
});
