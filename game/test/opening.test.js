// The opening (scope decision 77): "How many can you discover?" After the arrival mist, the twelve cards face down, two
// short lines, the cards flipping one after another, the ones not found settling as mystery cards, then a puff. About
// 5 s the first time, about 2 s after; a tap goes straight to the end; from the collection's button the cards stay.
import { test } from "node:test";
import assert from "node:assert/strict";

test("the opening takes about 5 s the first time and about 2 s after, its two lines short, every card turned before the second", async () => {
  const { timeline, OPENING_LINES } = await import("../src/opening.js");
  const { GRID } = await import("../src/collection.js");
  const full = timeline(false), quick = timeline(true), stay = timeline(true, false);
  assert.ok(full.end >= 4.5 && full.end <= 6.5, `full ${full.end} s`);
  assert.ok(quick.end >= 1.5 && quick.end <= 2.5, `quick ${quick.end} s`);
  for (const p of [full, quick, stay]) {
    assert.equal(p.flips.length, GRID.length);
    assert.ok(p.flips.every((at, i) => i === 0 || at > p.flips[i - 1]), "one after another");
    assert.ok(p.settle > p.flips[p.flips.length - 1] + p.flip, "the mystery cards settle once every card is up");
  }
  // The first time: "These are the animals you can become." at once, "How many can you discover?" once all are up.
  assert.equal(full.line1, 0);
  assert.ok(full.line2 >= full.flips[full.flips.length - 1] + full.flip);
  assert.ok(full.puffAt > full.settle && full.end > full.puffAt);
  // After that, only the question; from the collection's button no puff: the cards stay.
  assert.equal(quick.line1, null);
  assert.equal(quick.line2, 0);
  assert.equal(stay.puffAt, null);
  for (const line of OPENING_LINES) {
    assert.ok(line.split(/\s+/).length <= 13, line);
    assert.doesNotMatch(line, /%|percent/i);
  }
  assert.deepEqual(OPENING_LINES, ["These are the animals you can become.", "How many can you discover?"]);
});

test("the cards turn in order, the ones found stay showing, the rest settle as mystery cards, then puff; a tap skips to the end", async () => {
  const { Opening, timeline } = await import("../src/opening.js");
  const { collect, clearCollection, GRID } = await import("../src/collection.js");
  clearCollection();
  collect(GRID.find((a) => a.id === "seal"), "Reedfur");
  const doc = fakeDocument(), grid = doc.createElement("div"), said = [];
  let flips = 0, puffs = 0, done = 0;
  const o = new Opening(doc, grid, { onLine: (i) => said.push(i), onFlip: () => flips++, onPuff: () => puffs++, onDone: () => done++ });
  const p = timeline(false), cards = grid.children, is = (c, k) => c.classList.contains(k);
  assert.equal(cards.length, 12);
  assert.ok(cards.every((c) => is(c, "down")), "face down at first");
  o.show(0.01);
  assert.deepEqual(said, [0]);
  o.show(p.flips[5] + 0.001);
  assert.equal(cards.filter((c) => !is(c, "down")).length, 6, "six up, in order");
  assert.ok(!is(cards[5], "down") && is(cards[6], "down"));
  o.show(p.settle - 0.001);
  assert.equal(flips, 12);
  assert.deepEqual(said, [0, 1]);
  // While up, every card shows its animal; at the settle only the seal, found on this iPad, keeps its picture.
  assert.ok(cards.every((c) => is(c, "found") || is(c, "showing")));
  o.show(p.settle);
  const showing = cards.filter((c) => is(c, "found") || is(c, "showing")).map((c) => c.dataset.id);
  assert.deepEqual(showing, ["seal"]);
  assert.equal(puffs, 0);
  o.show(p.puffAt);
  assert.equal(puffs, 1);
  assert.ok(is(grid, "puffing"));
  assert.equal(done, 0);
  o.show(p.end);
  assert.equal(done, 1, "the game starts once the cards are gone");
  o.show(p.end + 1);
  assert.equal(done, 1, "once");

  // A tap: straight to the end, everything said and turned, once.
  let done2 = 0, flips2 = 0;
  const grid2 = doc.createElement("div"), said2 = [];
  const o2 = new Opening(doc, grid2, { onLine: (i) => said2.push(i), onFlip: () => flips2++, onDone: () => done2++ });
  o2.show(0.2);
  o2.skip();
  o2.skip();
  assert.equal(done2, 1);
  assert.equal(flips2, 12);
  assert.deepEqual(said2, [0, 1]);
  assert.ok(is(grid2, "instant") && is(grid2, "puffing"));
  // From the collection's button: the quick flip, and the cards stay.
  let puffs3 = 0;
  const grid3 = doc.createElement("div"), o3 = new Opening(doc, grid3, { quick: true, puff: false, onPuff: () => puffs3++ });
  o3.show(timeline(true, false).end);
  assert.equal(puffs3, 0);
  assert.ok(!is(grid3, "puffing"));
  assert.ok(grid3.children.every((c) => !is(c, "down")), "the cards stay, face up");
  clearCollection();
});

/** Just enough of a document for the cards: elements with classes, children, attributes and styles. */
function fakeDocument() {
  class El {
    constructor(tag) { Object.assign(this, { tag, children: [], attrs: {}, dataset: {}, classes: new Set() }); this.style = { setProperty() {} }; }
    set className(v) { this.classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return [...this.classes].join(" "); }
    get classList() {
      const c = this.classes;
      return { add: (...xs) => xs.forEach((x) => c.add(x)), remove: (...xs) => xs.forEach((x) => c.delete(x)), contains: (x) => c.has(x) };
    }
    append(...xs) { this.children.push(...xs); }
    replaceChildren(...xs) { this.children = xs; }
    setAttribute(k, v) { this.attrs[k] = v; }
    addEventListener() {}
    remove() {}
  }
  return { createElement: (tag) => new El(tag), createElementNS: (_, tag) => new El(tag) };
}
