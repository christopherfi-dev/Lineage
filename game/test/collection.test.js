// The collection (scope decision 74): the twelve animals a line can become, a row of four for each place; an animal
// joins once a line becomes it at the win; one picture per animal, small; the teacher's page lists the same twelve.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

test("the collection is the twelve animals, a row of four for each place, each with its own small picture", async () => {
  const { GRID, pictureOf, evolvedLine, IMAGE_CREDITS, COLLECTION_TITLE, NEW_CARD, mysteryLabel } = await import("../src/collection.js");
  const { ANIMALS } = await import("../src/reveal.js");
  assert.equal(GRID.length, 12);
  assert.deepEqual(GRID.map((a) => a.zone), [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2]);
  assert.deepEqual(new Set(GRID), new Set(ANIMALS));
  for (const a of GRID) {
    // One file per animal id, so a new picture drops in: a JPEG about 400 px wide, under 60 KB.
    const file = new URL(`../${pictureOf(a).slice(2)}`, import.meta.url), bytes = readFileSync(file);
    assert.ok(statSync(file).size < 60 * 1024, `${a.id} is ${statSync(file).size} bytes`);
    assert.equal(bytes[0], 0xff); assert.equal(bytes[1], 0xd8); // a JPEG
    const width = jpegWidth(bytes);
    assert.ok(width >= 380 && width <= 420, `${a.id} is ${width} px wide`);
  }
  for (const line of [evolvedLine(5), IMAGE_CREDITS, COLLECTION_TITLE, NEW_CARD, ...[0, 1, 2].map(mysteryLabel)]) {
    assert.ok(line.split(/\s+/).length <= 13, line);
    assert.doesNotMatch(line, /%|percent/i);
  }
  assert.equal(evolvedLine(5), "You've evolved 5 of 12.");
  // The teacher's journal page lists the same twelve, in the same order.
  const page = readFileSync(new URL("../journal.html", import.meta.url), "utf8");
  const listed = [...page.matchAll(/\["([a-z-]+)", "([^"]+)"\]/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(listed, GRID.map((a) => [a.id, a.name]));
});

test("an animal joins the collection once, when a line becomes it, and the collection lasts the page even with storage blocked", async () => {
  const { collect, collection, clearCollection, GRID } = await import("../src/collection.js");
  const { FIRST_MAMMALS } = await import("../src/reveal.js");
  clearCollection();
  assert.equal(collection().size, 0);
  const otter = GRID.find((a) => a.id === "river-otter");
  assert.equal(collect(otter, "Mossfoot"), true);
  assert.equal(collect(otter, "Reedfur"), false, "only the first time is new");
  assert.equal(collect(FIRST_MAMMALS), false, "the first mammals are no card");
  assert.equal(collection().size, 1);
  assert.equal(collection().get("river-otter").name, "Mossfoot");
  clearCollection();
  assert.equal(collection().size, 0);
});

/** A baseline or progressive JPEG's width, from its frame header. */
function jpegWidth(bytes) {
  for (let i = 2; i < bytes.length;) {
    if (bytes[i] !== 0xff) return NaN;
    const marker = bytes[i + 1], length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker >= 0xc0 && marker <= 0xc3) return (bytes[i + 7] << 8) | bytes[i + 8];
    i += 2 + length;
  }
  return NaN;
}
