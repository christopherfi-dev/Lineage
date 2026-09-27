// Part 2's rules (scope decision 59): a follow never moves the family, and its fair test is twins inside the
// family's place, counted by who made it (scope decision 65); a family with a future can be picked.
import { test } from "node:test";
import assert from "node:assert/strict";

test("a follow narrows the line to its carriers in its place, and the rest of the line there become relatives", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const { effectIn } = await import("../src/why.js");
  const { carries } = await import("../src/variations.js");
  let checked = 0, born = 0;
  // Every follow, from a glowing baby, a fast-forward or the backup panel.
  const follow = (story, bridge, g) => {
    assert.ok(bridge.isFollowed(g.id), "only babies in the line are followed");
    const was = new Set(bridge.followedIds()), relatives = bridge.relativeIds(), zone = story.testZone();
    story.follow(g, false);
    checked++;
    assert.equal(story.noun, "line");
    // The line is now the followed side: the old line's animals with the variation, in its place.
    const now = bridge.followedIds(), mine = bridge.mineIds(), theirs = bridge.otherIds();
    assert.equal(story.family.then, now.length);
    for (const id of now) {
      assert.ok(was.has(id));
      assert.equal(bridge.zoneOf(id), zone);
      assert.ok(carries(bridge.animal(id).genome, g.v));
    }
    // The rest of the old line in its place are relatives, beside the relatives from before; the twins without are
    // among them. The old line's animals in other places are no one's now (scope decision 67).
    for (const id of was) assert.equal(bridge.isRelative(id), !bridge.isFollowed(id) && bridge.zoneOf(id) === zone);
    for (const id of relatives) assert.ok(bridge.isRelative(id));
    for (const id of mine) assert.ok(bridge.isFollowed(id));
    for (const id of theirs) assert.ok(bridge.isRelative(id));
    assert.equal(mine.length, theirs.length);
    assert.equal(story.minFor(g), effectIn(g.v.t, zone) * g.v.dir < 0 ? 5 : 10, "a trait that hurts there may start with 5 pairs");
    assert.ok(mine.length <= 20);
    assert.equal(story.fair.fromNearby, 0, "strictly inside the line");
    mine.forEach((id, i) => {
      assert.equal(bridge.zoneOf(theirs[i]), zone);
      assert.equal(bridge.get(id).ageGenerations, bridge.get(theirs[i]).ageGenerations, "twins are the same age");
    });
  };
  for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(13), story = new Story(bridge);
    story.begin(bridge.families.founding[f].ids[0]);
    assert.equal(story.noun, "family");
    while (story.phase !== "ended") {
      if (story.phase === "choice") { follow(story, bridge, story.options[0]); continue; }
      const line = new Set(bridge.followedIds()), kin = new Set(bridge.relativeIds());
      const ev = bridge.step();
      // A baby joins the line through its mother in the line, and the relatives through its mother among them.
      for (const b of ev.births) {
        if (!bridge.get(b.childId)) continue;
        assert.equal(bridge.isFollowed(b.childId), line.has(b.motherId));
        assert.equal(bridge.isRelative(b.childId), kin.has(b.motherId));
        if (kin.has(b.motherId)) born++;
      }
      const what = story.afterGeneration(ev);
      if (what === "spread-ready") follow(story, bridge, story.lastSpread);
      for (let k = 0; k < 40 && story.phase === "watch"; k++) {
        story.advance(0.5);
        assert.ok(story.glowing.every((x) => bridge.isFollowed(x.id)), "only babies in the line glow");
        const g = story.glowing.find((x) => story.followable(x) && story.canStartFor(x));
        if (g && !story.inDanger && story.quiet >= 40) follow(story, bridge, g);
      }
    }
  }
  assert.ok(checked >= 3, "fair tests started");
  assert.ok(born > 0, "relatives had babies");
});

test("the family tree strip is the chain of followed babies, the ancestors in between smaller", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story, TREE_BETWEEN } = await import("../src/story.js");
  const { babyLabel } = await import("../src/narration.js");
  const bridge = Bridge.fromAncestor(13), story = new Story(bridge);
  story.begin(bridge.families.founding[2].ids[0]);
  // Before any follow: the first one tapped after her own mothers.
  const before = story.familyTree();
  assert.equal(before.line, false);
  assert.equal(before.nodes[before.nodes.length - 1].id, story.firstId);
  while (story.phase !== "ended" && story.choices.length < 2) {
    if (story.phase === "choice") { story.follow(story.options[0], false); continue; }
    story.afterGeneration(bridge.step());
  }
  assert.equal(story.choices.length, 2);
  const tree = story.familyTree();
  assert.equal(tree.line, true);
  assert.deepEqual(tree.nodes.filter((a) => a.kind !== "between").map((a) => a.id), [story.firstId, ...story.choices.map((c) => c.anchor)]);
  assert.deepEqual(tree.nodes.filter((a) => a.kind === "baby").map((a) => a.label), story.choices.map((c) => babyLabel(c.v.group)));
  // Each followed baby comes after at most TREE_BETWEEN of its own mothers; "→" only where the mother line joins.
  const mother = (id) => bridge.families.mother.get(id);
  let run = 0;
  tree.nodes.forEach((a, i) => {
    if (a.kind === "between") run++; else run = 0;
    assert.ok(run <= TREE_BETWEEN);
    if (i && (a.kind === "baby" || a.kind === "between") && tree.nodes[i - 1].kind === "between") assert.equal(mother(a.id), tree.nodes[i - 1].id);
    if (i && a.joined && tree.nodes[i - 1].kind !== "between") assert.equal(mother(a.id), tree.nodes[i - 1].id);
  });
  assert.equal(babyLabel("more webbing between the toes"), "More webbing");
  assert.equal(babyLabel("a sleeker body"), "Sleeker body");
});

test("at generation 0 every founding family has a future, and a tap follows a family of at least 13", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { familiesWithAFuture } = await import("../src/seeds.js");
  const { FAMILY_MIN } = await import("../src/families.js");
  const make = (seed) => Bridge.fromAncestor(seed);
  const bridge = make(13);
  const future = familiesWithAFuture(make, 13, bridge);
  for (const f of bridge.families.founding) assert.ok(future.has(f.key));
  for (let g = 0; g < 30; g++) bridge.step();
  const counts = bridge.families.lineCounts(bridge.livingIds());
  for (const id of bridge.livingIds().slice(0, 40)) {
    const top = bridge.familyTopOf(id);
    assert.equal(counts.get(top), bridge.families.members(top, bridge.livingIds()).size);
    assert.ok(counts.get(top) >= FAMILY_MIN || bridge.families.mother.get(top) === undefined);
  }
});

test("a story is 50 generations, or the teacher's ?length= up to 76; with fewer than 25 left, the world is nearly over", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story, storyLength, nearlyOver, STORY_GENERATIONS, FULL_STORY_GENERATIONS } = await import("../src/story.js");
  assert.equal(STORY_GENERATIONS, 50);
  assert.equal(FULL_STORY_GENERATIONS, 76);
  for (const [text, n] of [[null, 50], ["", 50], ["76", 76], ["60", 60], ["25", 25], ["24", 50], ["77", 50], ["7a", 50], ["-76", 50]]) assert.equal(storyLength(text), n, String(text));
  assert.equal(nearlyOver(25, 50), false);
  assert.equal(nearlyOver(26, 50), true);
  assert.equal(nearlyOver(29, 76), false);
  assert.equal(nearlyOver(52, 76), true);
  // A line that lasts ends its story at the story's length; a line that dies out ends it then (scope decision 66).
  // Seed 13's lines all die out now; seed 1's first one lasts (scope decision 67).
  let lasted = 0;
  for (const seed of [13, 1]) for (const length of [30, 50]) for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(seed), story = new Story(bridge, { length });
    story.begin(bridge.families.founding[f].ids[0]);
    while (story.phase !== "ended") {
      if (story.phase === "choice") { story.follow(story.options[0], false); continue; }
      story.afterGeneration(bridge.step());
    }
    if (story.outcome === "survived") { lasted++; assert.equal(bridge.generation, length); } else {
      assert.equal(story.outcome, "died");
      assert.equal(bridge.followedIds().length, 0);
      assert.ok(bridge.generation <= length && story.endGeneration === bridge.generation);
    }
  }
  assert.ok(lasted > 0, "a line lasted the whole story");
});

test("a trait that hurts in the family's place needs 5 pairs to start its fair test, one that helps 10", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const { variationEffect } = await import("../src/why.js");
  const { MIN_SIZE, HARMFUL_MIN_SIZE } = await import("../src/cohorts.js");
  assert.equal(MIN_SIZE, 10);
  assert.equal(HARMFUL_MIN_SIZE, 5);
  const bridge = Bridge.fromAncestor(13), story = new Story(bridge);
  story.begin(bridge.families.founding[0].ids[0]);
  const zone = story.testZone();
  let harmful = 0, helpful = 0;
  for (let t = 0; t < 10; t++) for (const dir of [1, -1]) {
    const e = variationEffect(t, dir, zone), min = story.minFor({ v: { t, dir } });
    if (e < 0) { harmful++; assert.equal(min, 5); } else { if (e > 0) helpful++; assert.equal(min, 10); }
  }
  assert.ok(harmful > 0 && helpful > 0);
});

test("a fair test's twins are counted by who made it, and any trait in the family's place can be followed", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const { effectIn } = await import("../src/why.js");
  const { guessFor, explainGuess } = await import("../src/why.js");
  const bridge = Bridge.fromAncestor(13), story = new Story(bridge);
  story.begin(bridge.families.founding[1].ids[0]);
  const kinds = new Set();
  let tracked = 0;
  while (story.phase !== "ended" && bridge.generation < 30) {
    if (story.phase === "choice") { story.follow(story.options[0], false); continue; }
    const twins = bridge.test ? { mine: new Set(bridge.mineIds()), theirs: new Set(bridge.otherIds()), line: new Set(bridge.withLineIds()) } : null;
    const ev = bridge.step();
    if (twins) {
      // The twins only ever lose their dead; the side with the variation keeps its babies.
      const dead = new Set(ev.deaths.map((d) => d.id));
      assert.deepEqual(bridge.mineIds().sort(), [...twins.mine].filter((id) => !dead.has(id)).sort());
      assert.deepEqual(bridge.otherIds().sort(), [...twins.theirs].filter((id) => !dead.has(id)).sort());
      const line = new Set(twins.line);
      for (const b of ev.births) if (twins.line.has(b.motherId)) line.add(b.childId);
      assert.deepEqual(bridge.withLineIds().sort(), [...line].filter((id) => !dead.has(id)).sort());
      tracked++;
    }
    const what = story.afterGeneration(ev);
    if (what === "spread-ready") story.follow(story.lastSpread, false);
    for (let k = 0; k < 40 && story.phase === "watch"; k++) {
      story.advance(0.5);
      // A glowing baby whose trait doesn't matter there is offered like any other: no note on its card.
      for (const x of story.glowing) {
        if (story.followable(x) && !story.whyNot(x) && (x.v.neutral || effectIn(x.v.t, story.testZone()) === 0)) kinds.add(x.v.neutral ? "neutral" : "~");
      }
      const g = story.glowing.find((x) => story.followable(x) && story.canStartFor(x));
      if (!g || story.inDanger || story.quiet < 40) continue;
      story.follow(g, false);
    }
  }
  assert.ok(tracked > 0);
  assert.ok(kinds.has("neutral") || kinds.has("~"), "a trait that doesn't matter there could be followed");
  // A neutral trait's guess: "helps", "hurts" and the table's "doesn't help or hurt anywhere".
  const g = guessFor("Why are the ones with pointier ear tips doing about the same?", 8, 1);
  assert.deepEqual(g.options.map((o) => o.right), [false, false, true]);
  assert.equal(explainGuess(g, g.options[2]), "Yes! Ear tip shape doesn't help or hurt anywhere.");
});
