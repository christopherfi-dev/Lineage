// Part 2's rules (scope decision 59): a follow never moves the family, and its fair test is twins inside the
// family's place; only a trait that helps or hurts there can be followed; a family with a future can be picked.
import { test } from "node:test";
import assert from "node:assert/strict";

test("a follow starts a fair test inside the family, in its place, and never moves the family", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const { effectIn } = await import("../src/why.js");
  const bridge = Bridge.fromAncestor(13), story = new Story(bridge);
  story.begin(bridge.families.founding[1].ids[0]);
  let checked = 0;
  while (story.phase !== "ended" && checked < 3) {
    if (story.phase === "choice") { story.follow(story.options[0], false); continue; }
    const ev = bridge.step();
    const what = story.afterGeneration(ev);
    if (what === "spread-ready") story.follow(story.lastSpread, false);
    for (let k = 0; k < 40 && story.phase === "watch"; k++) {
      story.advance(0.5);
      const g = story.glowing.find((x) => story.followable(x) && story.canStartFor(x));
      if (!g || story.inDanger || story.quiet < 40) continue;
      const family = bridge.followedIds().sort(), zone = story.testZone();
      assert.notEqual(effectIn(g.v.t, zone), 0, "only a trait that helps or hurts there");
      story.follow(g, false);
      checked++;
      assert.deepEqual(bridge.followedIds().sort(), family, "the family stays as it is");
      const mine = bridge.mineIds(), theirs = bridge.otherIds();
      assert.equal(mine.length, theirs.length);
      assert.ok(mine.length >= 10 && mine.length <= 20);
      mine.forEach((id, i) => {
        const a = bridge.get(id), b = bridge.get(theirs[i]);
        assert.equal(bridge.zoneOf(id), zone);
        assert.equal(bridge.zoneOf(theirs[i]), zone);
        assert.equal(a.ageGenerations, b.ageGenerations, "twins are the same age");
      });
      assert.equal(story.fair.fromFamily + story.fair.fromNearby, mine.length);
      assert.equal(mine.filter((id) => bridge.isFollowed(id)).length, story.fair.fromFamily);
    }
  }
  assert.ok(checked > 0, "a fair test started");
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
