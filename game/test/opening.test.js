// The opening (scope decisions 77 and 93): "How many can you discover?" After the arrival mist, the twelve cards face
// down, then flipping about half a second apart, each showing its animal; then they wait, the ones already found marked.
// Nothing goes until "Let's go!", which puffs them away and starts the game. Later stories flip quicker and still wait;
// a tap beside the cards while they flip turns the rest at once; from the collection's button the cards settle and stay.
import { test } from "node:test";
import assert from "node:assert/strict";

test("the cards flip about half a second apart, then wait; later stories flip quicker; the lines are short", async () => {
  const { timeline, OPENING_LINES, LETS_GO, FOUND_MARK } = await import("../src/opening.js");
  const { GRID } = await import("../src/collection.js");
  const full = timeline(false), quick = timeline(true), stay = timeline(true, true);
  for (const p of [full, quick, stay]) {
    assert.equal(p.flips.length, GRID.length);
    assert.ok(p.flips.every((at, i) => i === 0 || at > p.flips[i - 1]), "one after another");
    assert.ok(p.ready >= p.flips[p.flips.length - 1] + p.flip, "ready once every card is up");
  }
  // About half a second apart the first time (scope decision 93), quicker after.
  const gaps = full.flips.slice(1).map((at, i) => at - full.flips[i]);
  assert.ok(gaps.every((g) => g >= 0.4 && g <= 0.6), JSON.stringify(gaps));
  assert.ok(quick.ready < full.ready / 2);
  // The first time: "These are the animals you can become." at once, "How many can you discover?" once all are up.
  assert.equal(full.line1, 0);
  assert.ok(full.line2 >= full.flips[full.flips.length - 1] + full.flip);
  // After that, only the question; from the collection's button the mystery cards settle.
  assert.equal(quick.line1, null);
  assert.equal(quick.line2, 0);
  assert.equal(full.settle, null);
  assert.ok(stay.settle > stay.flips[stay.flips.length - 1] + stay.flip);
  for (const line of [...OPENING_LINES, LETS_GO, FOUND_MARK]) {
    assert.ok(line.split(/\s+/).length <= 13, line);
    assert.doesNotMatch(line, /%|percent/i);
  }
  assert.deepEqual(OPENING_LINES, ["These are the animals you can become.", "How many can you discover?"]);
  assert.equal(LETS_GO, "Let's go!");
});

test("the cards turn in order and wait, every animal showing and the found ones marked; only Let's go! puffs them away", async () => {
  const { Opening, timeline } = await import("../src/opening.js");
  const { collect, clearCollection, GRID } = await import("../src/collection.js");
  clearCollection();
  collect(GRID.find((a) => a.id === "seal"), "Reedfur");
  const doc = fakeDocument(), grid = doc.createElement("div"), said = [];
  let flips = 0, ready = 0, puffs = 0, done = 0;
  const o = new Opening(doc, grid, { onLine: (i) => said.push(i), onFlip: () => flips++, onReady: () => ready++, onPuff: () => puffs++, onDone: () => done++ });
  const p = timeline(false), cards = grid.children, is = (c, k) => c.classList.contains(k);
  assert.equal(cards.length, 12);
  assert.ok(cards.every((c) => is(c, "down")), "face down at first");
  o.show(0.01);
  assert.deepEqual(said, [0]);
  o.show(p.flips[5] + 0.001);
  assert.equal(cards.filter((c) => !is(c, "down")).length, 6, "six up, in order");
  assert.ok(!is(cards[5], "down") && is(cards[6], "down"));
  assert.equal(ready, 0);
  o.show(p.ready);
  assert.equal(flips, 12);
  assert.deepEqual(said, [0, 1]);
  assert.equal(ready, 1, "every card up: they wait for Let's go!");
  // While they wait, every card shows its animal; the seal, found on this iPad, is marked.
  assert.ok(cards.every((c) => is(c, "found") || is(c, "showing")));
  const marked = cards.filter((c) => c.find("got")).map((c) => c.dataset.id);
  assert.deepEqual(marked, ["seal"]);
  // Nothing goes by itself, however long they wait.
  o.show(p.ready + 600);
  assert.equal(puffs, 0);
  assert.equal(done, 0);
  assert.ok(cards.every((c) => is(c, "found") || is(c, "showing")), "still showing");
  // "Let's go!": the puff, then the game starts, once.
  o.go();
  o.go();
  assert.equal(puffs, 1);
  assert.ok(is(grid, "puffing"));
  o.finish();
  o.finish();
  assert.equal(done, 1, "the game starts once the cards are gone");

  // A tap beside the cards while they flip: every card up at once, and they wait; nothing puffs.
  let ready2 = 0, flips2 = 0, done2 = 0;
  const grid2 = doc.createElement("div"), said2 = [];
  const o2 = new Opening(doc, grid2, { onLine: (i) => said2.push(i), onFlip: () => flips2++, onReady: () => ready2++, onDone: () => done2++ });
  o2.show(0.2);
  o2.skip();
  o2.skip();
  assert.equal(ready2, 1);
  assert.equal(flips2, 12);
  assert.deepEqual(said2, [0, 1]);
  assert.equal(done2, 0);
  assert.ok(is(grid2, "instant") && !is(grid2, "puffing"));
  // A later story: the quick flip, and it still waits.
  let ready4 = 0, done4 = 0;
  const grid4 = doc.createElement("div"), o4 = new Opening(doc, grid4, { quick: true, onReady: () => ready4++, onDone: () => done4++ });
  o4.show(timeline(true).ready + 60);
  assert.equal(ready4, 1);
  assert.equal(done4, 0);
  // From the collection's button: the quick flip, the mystery cards settle, and the cards stay; no Let's go!
  let puffs3 = 0, ready3 = 0;
  const grid3 = doc.createElement("div"), o3 = new Opening(doc, grid3, { quick: true, stay: true, onPuff: () => puffs3++, onReady: () => ready3++ });
  o3.show(timeline(true, true).settle);
  o3.go();
  assert.equal(puffs3, 0);
  assert.equal(ready3, 0);
  assert.ok(o3.done);
  assert.ok(!is(grid3, "puffing"));
  assert.ok(grid3.children.every((c) => !is(c, "down")), "the cards stay, face up");
  assert.deepEqual(grid3.children.filter((c) => is(c, "found") || is(c, "showing")).map((c) => c.dataset.id), ["seal"]);
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
    /** The first descendant with this class. */
    find(cls) { for (const c of this.children) { if (c.classes?.has(cls)) return c; const d = c.find?.(cls); if (d) return d; } return null; }
    querySelector(sel) { return this.find(sel.replace(/^\./, "")); }
  }
  return { createElement: (tag) => new El(tag), createElementNS: (_, tag) => new El(tag) };
}
