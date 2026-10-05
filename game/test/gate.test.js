// The gate's second try (scope decision 97, built and measured, off): a baby joins the line if, on every trait checked
// in the line's place, it is inside the line's band or past it a way the child chose; any other difference makes a
// branch. And a chosen trait still improving, shown on its chip and said once, with the gate off as shipped too.
import { test } from "node:test";
import assert from "node:assert/strict";

const { GENERATION_SECONDS } = await import("../src/story.js");
const DAY = GENERATION_SECONDS / 0.5;

test("like the line: inside the band, or past it only the way the child chose on that trait", async () => {
  const { isLike, waysOf, MEANINGFUL } = await import("../src/bridge.js");
  const band = MEANINGFUL.map(() => null), t = MEANINGFUL[0], u = MEANINGFUL[1];
  band[t] = [0.4, 0.6];
  band[u] = [0.2, 0.5];
  const g = (a, b) => { const x = new Float64Array(10).fill(0.5); x[t] = a; x[u] = b; return x; };
  // No way chosen: the band only (scope decision 87).
  assert.ok(isLike(g(0.5, 0.3), band));
  assert.ok(!isLike(g(0.7, 0.3), band) && !isLike(g(0.3, 0.3), band));
  // More of trait t chosen: past the band upward is like the line; downward is still a branch.
  const up = waysOf([{ t, dir: 1 }]);
  assert.ok(isLike(g(0.9, 0.3), band, -1, up));
  assert.ok(!isLike(g(0.3, 0.3), band, -1, up));
  // A way chosen on t says nothing about u: a difference there is a new kind, so a branch either way.
  assert.ok(!isLike(g(0.9, 0.6), band, -1, up) && !isLike(g(0.9, 0.1), band, -1, up));
  // Less of trait t chosen: the other way round.
  const down = waysOf([{ t, dir: -1 }]);
  assert.ok(isLike(g(0.1, 0.3), band, -1, down) && !isLike(g(0.9, 0.3), band, -1, down));
  // `except` leaves one trait out, as a branch's own new variation.
  assert.ok(isLike(g(0.5, 0.9), band, u, up));
});

test("with the gate on, the line never gets an adaptation the child didn't choose; chosen ways keep improving by themselves", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const { variationEffect } = await import("../src/why.js");
  let joined = 0, past = 0, branched = 0, follows = 0;
  for (const seed of [1, 2, 3]) for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(seed), story = new Story(bridge, { places: true });
    bridge.like = true;
    story.begin(bridge.families.founding[f].ids[0]);
    while (story.phase !== "ended" && bridge.generation < 40) {
      if (story.phase === "place" && story.placeCards()[2]) story.choosePlace(2);
      for (let k = 0; k < DAY && story.phase === "watch"; k++) {
        story.advance(0.5);
        const g = story.glowing.find((x) => story.followable(x) && variationEffect(x.v.t, x.v.dir, story.testZone()) > 0);
        if (g) { story.follow(g); follows++; }
      }
      const fl = bridge.follow, ev = bridge.step();
      if (!ev) break;
      // Every baby that joined is like the line: on each checked trait inside its band, or past it the chosen way.
      if (fl?.band) for (const id of ev.group?.born ?? []) {
        const genome = bridge.get(id)?.bodyGenome;
        if (!genome) continue;
        joined++;
        fl.band.forEach((b, t) => {
          if (!b) return;
          const over = genome[t] > b[1] + 1e-12, under = genome[t] < b[0] - 1e-12;
          if (over || under) {
            past++;
            assert.equal(Math.sign(fl.ways?.[t] ?? 0), over ? 1 : -1, "past the band only the way the child chose");
          }
        });
      }
      for (const id of ev.group?.branched ?? []) if (bridge.get(id)) branched++;
      story.afterGeneration(ev);
    }
  }
  assert.ok(follows > 5 && joined > 100 && past > 0 && branched > 0, `${follows} follows, ${joined} joined, ${past} past the band, ${branched} branched`);
});

test("as shipped the gate is off: no band, no ways, and a baby of the line in its place with its traits joins whatever its others", async () => {
  const { Bridge, LIKE_RULE } = await import("../src/bridge.js");
  const { Story, TAKE_ALL } = await import("../src/story.js");
  const { carries } = await import("../src/variations.js");
  const { variationEffect } = await import("../src/why.js");
  assert.equal(LIKE_RULE, false);
  assert.equal(TAKE_ALL, false);
  let checked = 0;
  for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(1), story = new Story(bridge, { places: true });
    story.begin(bridge.families.founding[f].ids[0]);
    for (let g = 0; g < 20 && story.phase !== "ended"; g++) {
      if (story.phase === "place" && story.placeCards()[2]) story.choosePlace(2);
      for (let k = 0; k < DAY && story.phase === "watch"; k++) {
        story.advance(0.5);
        const x = story.glowing.find((y) => story.followable(y) && variationEffect(y.v.t, y.v.dir, story.testZone()) > 0);
        if (x) story.follow(x);
      }
      const fl = bridge.follow;
      assert.equal(fl.band ?? null, null);
      assert.equal(fl.ways ?? null, null);
      const ev = bridge.step();
      if (!ev) break;
      // A baby of the line that didn't join lives elsewhere, or lacks a trait the line keeps: never for its other traits.
      for (const id of ev.group.branched) {
        const kid = bridge.get(id);
        if (!kid) continue;
        checked++;
        const elsewhere = fl.place !== null && fl.place !== undefined && bridge.zoneOf(id) !== fl.place;
        assert.ok(elsewhere || !(fl.kept ?? []).every((u) => carries(kid.bodyGenome, u)));
      }
      story.afterGeneration(ev);
    }
  }
  assert.ok(checked > 0);
});

test("a chosen trait still improving: once the line is APART further its way, its chip says so, said once in short lines", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const { APART, formOf } = await import("../src/variations.js");
  const { variationEffect } = await import("../src/why.js");
  const { TRAIT_WORDS } = await import("../src/variations.js");
  const { keepsGetting, CHOSE_IT_GOING, improvingChip } = await import("../src/narration.js");
  let improving = 0;
  for (const seed of [1, 2, 3]) for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(seed), story = new Story(bridge, { places: true });
    story.begin(bridge.families.founding[f].ids[0]);
    const said = new Set();
    while (story.phase !== "ended") {
      if (story.phase === "place" && story.placeCards()[2]) story.choosePlace(2);
      for (let k = 0; k < DAY && story.phase === "watch"; k++) {
        story.advance(0.5);
        const g = story.glowing.find((x) => story.followable(x) && variationEffect(x.v.t, x.v.dir, story.testZone()) > 0);
        if (g && story.quiet >= 20) story.follow(g);
      }
      const ev = bridge.step();
      if (!ev) break;
      story.afterGeneration(ev);
      for (const chip of story.improvingNow) {
        // Said once a chip, for a trait the child chose that helps there, as far again as a new variation.
        assert.ok(!said.has(chip), "said once");
        said.add(chip);
        improving++;
        assert.ok(variationEffect(chip.v.t, chip.v.dir, chip.zone) > 0);
        const here = story.lastAnimals.filter((a) => a.zone === chip.zone);
        assert.ok((formOf(here.map((a) => a.genome))[chip.v.t].median - chip.from) * chip.v.dir >= APART - 1e-12);
        assert.equal(chip.improving, ev.generation);
        assert.ok(story.chips.includes(chip));
      }
    }
  }
  assert.ok(improving > 5, `${improving} chips still improving`);
  // Its lines: short, every one, and no percentages.
  for (const words of Object.values(TRAIT_WORDS)) for (const group of words) {
    for (const line of [keepsGetting(group), CHOSE_IT_GOING, improvingChip(group)]) {
      assert.ok(line.split(/\s+/).length <= 7, line);
      assert.ok(!/%|percent/i.test(line), line);
    }
  }
});

test("one parent, gate on (built for scope decisions 100 and 101, not shipped): a line baby like its parent stays in the line; a new difference joins only if like the line", async () => {
  const { Bridge, isLike } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const { classroomConfig } = await import("../src/engine.js");
  const { variationEffect } = await import("../src/why.js");
  const config = { ...classroomConfig, inheritance: "one-parent" };
  let copies = 0, joinedNew = 0, leftNew = 0, follows = 0;
  for (const seed of [1, 2]) for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(seed, config), story = new Story(bridge, { places: true });
    bridge.like = true;
    bridge.likeTraits = "every";
    assert.ok(bridge.oneParent && story.climbs);
    story.begin(bridge.families.founding[f].ids[0]);
    while (story.phase !== "ended" && bridge.generation < 30) {
      if (story.phase === "place" && story.placeCards()[1]) story.choosePlace(1);
      for (let k = 0; k < DAY && story.phase === "watch"; k++) {
        story.advance(0.5);
        const g = story.glowing.find((x) => story.followable(x) && variationEffect(x.v.t, x.v.dir, story.testZone()) > 0);
        if (g) { story.follow(g); follows++; }
      }
      const fl = bridge.follow, line = new Set(fl?.members ?? []);
      const was = new Map([...line].map((id) => [id, Float64Array.from(bridge.get(id).bodyGenome)]));
      const ev = bridge.step();
      if (!ev) break;
      if (fl?.band && fl.place !== null && fl.place !== undefined) {
        const joined = new Set(ev.group.born);
        for (const b of ev.births) {
          if (!line.has(b.parentAId)) continue;
          assert.equal(b.parentAId, b.parentBId, "one parent, no mate");
          const kid = bridge.get(b.childId);
          if (!kid || bridge.zoneOf(b.childId) !== fl.place) continue;
          const P = was.get(b.parentAId), differs = [...P.keys()].filter((t) => kid.bodyGenome[t] !== P[t]);
          assert.ok(differs.length <= 1);
          if (!differs.length) {
            // Like its parent, so in the line.
            copies++;
            assert.ok(joined.has(b.childId), "a copy of a line animal, living in the line's place, is in the line");
          } else if (joined.has(b.childId)) {
            // A new difference joins by itself only inside every band, on all ten traits, or past it the chosen way.
            joinedNew++;
            assert.ok(isLike(kid.bodyGenome, fl.band, -1, fl.ways));
          } else leftNew++;
        }
      }
      story.afterGeneration(ev);
    }
  }
  assert.ok(follows > 0 && copies > 100 && joinedNew > 0 && leftNew > 10, `${follows} follows, ${copies} copies, ${joinedNew} new and like, ${leftNew} new and not`);
});
