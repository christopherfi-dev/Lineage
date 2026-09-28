// The story's rules (scope decisions 59 and 64-69): a follow narrows the line to its carriers in its place, the world
// fast-forwards while their count rises (not for a follow of fewer than 3), a line that dies out goes back to the line
// before; a "Why?" is a guess only at a new Field Guide discovery; the glow balance; a family with a future can be picked.
import { test } from "node:test";
import assert from "node:assert/strict";

test("a follow narrows the line to its carriers in its place, the rest there become relatives, and only babies that inherit it join", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story, RISE_TO, FAST_FROM } = await import("../src/story.js");
  const { carries } = await import("../src/variations.js");
  let checked = 0, born = 0, kinBorn = 0;
  const follow = (story, bridge, g) => {
    assert.ok(bridge.isFollowed(g.id), "only babies in the line are followed");
    const was = new Set(bridge.followedIds()), relatives = bridge.relativeIds(), zone = story.testZone();
    story.follow(g, false);
    checked++;
    assert.equal(story.noun, "line");
    // The world fast-forwards while the count rises; not at all when it is RISE_TO already, or under FAST_FROM.
    assert.equal(story.phase, story.lineStart >= RISE_TO || story.lineStart < FAST_FROM ? "watch" : "rise");
    // The line is now the old line's animals with the variation, in its place.
    const now = bridge.followedIds();
    assert.equal(story.family.then, now.length);
    for (const id of now) {
      assert.ok(was.has(id));
      assert.equal(bridge.zoneOf(id), zone);
      assert.ok(carries(bridge.animal(id).genome, g.v));
    }
    // The rest of the old line in its place are relatives, beside the relatives from before. The old line's
    // animals in other places are no one's now (scope decision 67).
    for (const id of was) assert.equal(bridge.isRelative(id), !bridge.isFollowed(id) && bridge.zoneOf(id) === zone);
    for (const id of relatives) assert.ok(bridge.isRelative(id) || bridge.isFollowed(id));
  };
  for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(13), story = new Story(bridge);
    story.begin(bridge.families.founding[f].ids[0]);
    assert.equal(story.noun, "family");
    while (story.phase !== "ended" && bridge.generation < 40) {
      if (story.phase === "choice") { follow(story, bridge, story.options[0]); continue; }
      const line = new Set(bridge.followedIds()), kin = new Set(bridge.relativeIds()), v = bridge.follow.v;
      const ev = bridge.step();
      for (const b of ev.births) {
        const kid = bridge.get(b.childId);
        if (!kid) continue;
        if (!v) {
          // A family grows through its mothers, and its relatives through theirs.
          assert.equal(bridge.isFollowed(b.childId), line.has(b.motherId));
          if (kin.has(b.motherId)) { assert.ok(bridge.isRelative(b.childId)); kinBorn++; }
          continue;
        }
        // A line grows by a baby with a parent in it that inherited the latest followed trait (scope decisions 67 and 68).
        const fromLine = line.has(b.parentAId) || line.has(b.parentBId);
        assert.equal(bridge.isFollowed(b.childId), fromLine && carries(kid.bodyGenome, v));
        if (fromLine && !bridge.isFollowed(b.childId)) { assert.ok(bridge.isRelative(b.childId), "a line baby without it is a relative"); born++; }
        if (kin.has(b.parentAId) || kin.has(b.parentBId)) { assert.ok(bridge.isFollowed(b.childId) || bridge.isRelative(b.childId)); kinBorn++; }
      }
      story.afterGeneration(ev);
      for (let k = 0; k < 40 && story.phase === "watch"; k++) {
        story.advance(0.5);
        assert.ok(story.glowing.every((x) => bridge.isFollowed(x.id)), "only babies in the line glow");
        const g = story.glowing.find((x) => story.followable(x));
        if (g && !story.inDanger && story.quiet >= 40) follow(story, bridge, g);
      }
    }
  }
  assert.ok(checked >= 3, "follows");
  assert.ok(born > 0, "line babies without the trait became relatives");
  assert.ok(kinBorn > 0, "relatives had babies");
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
  // A line that lasts ends its story at the story's length. One that dies out goes back to the line before, so the
  // story ends early only when the child's whole line is gone (scope decision 68).
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
      assert.equal(bridge.relatives.size, 0);
      assert.ok(bridge.generation <= length && story.endGeneration === bridge.generation);
    }
  }
  assert.ok(lasted > 0, "a line lasted the whole story");
});

test("any trait in the line's place can be followed, and a neutral trait's guess is the table's", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const { effectIn, guessFor, explainGuess } = await import("../src/why.js");
  const bridge = Bridge.fromAncestor(13), story = new Story(bridge);
  story.begin(bridge.families.founding[1].ids[0]);
  const kinds = new Set();
  while (story.phase !== "ended" && bridge.generation < 30) {
    if (story.phase === "choice") { story.follow(story.options[0], false); continue; }
    story.afterGeneration(bridge.step());
    for (let k = 0; k < 40 && story.phase === "watch"; k++) {
      story.advance(0.5);
      // A glowing baby whose trait doesn't matter there is offered like any other: no note on its card.
      for (const x of story.glowing) {
        if (story.followable(x) && !story.whyNot(x) && (x.v.neutral || effectIn(x.v.t, story.testZone()) === 0)) kinds.add(x.v.neutral ? "neutral" : "~");
      }
      const g = story.glowing.find((x) => story.followable(x));
      if (!g || story.inDanger || story.quiet < 40) continue;
      story.follow(g, false);
    }
  }
  assert.ok(kinds.has("neutral") || kinds.has("~"), "a trait that doesn't matter there could be followed");
  // A neutral trait's guess: "helps", "hurts" and the table's "doesn't help or hurt anywhere".
  const g = guessFor("Why is your line doing about as well as your relatives?", 8, 1);
  assert.deepEqual(g.options.map((o) => o.right), [false, false, true]);
  assert.equal(explainGuess(g, g.options[2]), "Yes! Ear tip shape doesn't help or hurt anywhere.");
});

test("the fast-forward runs while the count rises, not for a follow of fewer than 3, and every line that dies out goes back to the line before, with its Why?", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story, RISE_TO, RISE_MAX, FAST_FROM } = await import("../src/story.js");
  const { variationEffect, whyLine } = await import("../src/why.js");
  const { guideEntry } = await import("../src/reflection.js");
  let follows = 0, small = 0, rises = 0, backs = 0, whys = 0, told = 0, found = 0;
  for (const seed of [1, 2]) for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(seed), story = new Story(bridge), asked = new Set();
    // A "Why?" is a guess only at a new Field Guide discovery: each entry at most once a story (scope decision 69).
    const key = (t, zone) => guideEntry(t, zone).key;
    const ask = (q) => { const k = key(q.discovery.t, q.discovery.zone); assert.ok(!asked.has(k), k); asked.add(k); };
    story.begin(bridge.families.founding[f].ids[0]);
    while (story.phase !== "ended") {
      if (story.phase === "choice") { story.follow(story.options[0], false); continue; }
      const made = story.choices.length, tried = story.tries.length, kin = new Map(bridge.relatives);
      const ev = bridge.step();
      const what = story.afterGeneration(ev);
      if (what === "rise-done") {
        // Every step of the fast-forward rose; it stopped at RISE_TO, when the count stopped rising or fell, or at RISE_MAX.
        const c = story.lastRise.counts, n = c.length - 1;
        rises++;
        for (let k = 1; k < n; k++) assert.ok(c[k] > c[k - 1], JSON.stringify(c));
        assert.ok(c[n] >= RISE_TO || c[n] <= c[n - 1] || n >= RISE_MAX, JSON.stringify(c));
      }
      if (what === "back") {
        // "They didn't make it. Back to your line.": whatever its peak, not counted as a follow (scope decision 68).
        backs++;
        const gone = story.tries.length - tried;
        assert.ok(gone >= 1 && story.tries.includes(story.backFrom));
        assert.equal(story.choices.length, made - gone);
        assert.equal(story.backFrom.sizeAtEnd, 0);
        assert.ok(bridge.followedIds().length > 0);
        // The line now is the relatives the follow made: the rest of the line before, and their babies.
        for (const id of bridge.followedIds()) assert.ok(kin.has(id) || ev.births.some((b) => b.childId === id));
        assert.equal(bridge.follow.v, story.choices.length ? story.choices[story.choices.length - 1].v : null);
        assert.equal(story.phase, "watch");
        assert.equal(story.chips.length, new Set(story.choices.map((c) => c.v.t)).size);
        // Its Why? right away: a guess only when the followed trait hurts there and that is a new discovery; else the
        // table's reason told as lines (scope decision 69); nothing when most of them were old.
        const q = story.guessNow(ev), c = story.backFrom, e = variationEffect(c.v.t, c.v.dir, c.zone);
        if (story.oldAgeMostly(ev.group, ev.deaths)) { assert.equal(q, null); assert.deepEqual(story.diedSay, []); }
        else if (q) { assert.ok(e < 0 && q.died && q.discovery && q.t === c.v.t); ask(q); whys++; }
        else {
          if (e < 0) assert.ok(asked.has(key(c.v.t, c.zone)), "a hurting trait found before is told");
          if (e <= 0) assert.equal(story.diedSay[0], whyLine(c.v.t, c.zone));
          if (story.diedSay.length) told++;
        }
        continue;
      }
      // The story ends only when the whole line is gone, or at its last generation.
      if (what === "ended") assert.ok(story.outcome === "survived" ? ev.generation === story.length : bridge.followedIds().length === 0 && !bridge.relatives.size);
      if (story.phase === "watch") {
        const q = story.guessNow(ev), c = story.choices[story.choices.length - 1];
        if (q) {
          // A result that goes the table's way, its entry new: growing on a trait that helps, dying off on one that
          // hurts, about as well as the relatives on one that doesn't matter. Never a sudden drop (scope decision 69).
          assert.ok(q.discovery);
          ask(q);
          found++;
          const e = variationEffect(c.v.t, c.v.dir, c.zone);
          assert.equal(q.t, c.v.t);
          assert.ok(e > 0 ? story.growing(c) : e < 0 ? story.dyingOff(c) : story.aboutSame(c));
        } else if (story.told) {
          // Its entry was asked about before: what happened, then the table's reason, with no guess.
          assert.ok(asked.has(key(c.v.t, c.zone)));
          assert.equal(story.told[1], whyLine(c.v.t, c.zone));
          told++;
        }
      }
      for (let k = 0; k < 40 && story.phase === "watch"; k++) {
        story.advance(0.5);
        const g = story.glowing.find((x) => story.followable(x));
        if (!g || story.inDanger || story.quiet < 40) continue;
        story.follow(g, false);
        follows++;
        // No fast-forward at RISE_TO or more, nor under FAST_FROM: that line is watched from the start (scope decision 69).
        assert.equal(story.phase, story.lineStart >= RISE_TO || story.lineStart < FAST_FROM ? "watch" : "rise");
        if (story.lineStart < FAST_FROM) { small++; assert.equal(story.lastRise.outcome, "small"); }
      }
    }
  }
  assert.ok(follows > 10 && small > 0 && rises > 3 && backs > 3 && whys > 0 && told > 0 && found > 0,
    `${follows} follows (${small} small), ${rises} fast-forwards, ${backs} back, ${whys} died whys, ${told} told, ${found} found`);
});

test("on an iPad whose Field Guide has every entry, no Why? is a guess: each is told, with the table's reason", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  let told = 0;
  for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(1), story = new Story(bridge, { known: () => true });
    story.begin(bridge.families.founding[f].ids[0]);
    while (story.phase !== "ended") {
      if (story.phase === "choice") { story.follow(story.options[0], false); continue; }
      const ev = bridge.step(), what = story.afterGeneration(ev);
      if (story.phase === "watch") {
        assert.equal(story.guessNow(ev), null);
        if (story.told || (what === "back" && story.diedSay.length)) told++;
      }
      for (let k = 0; k < 40 && story.phase === "watch"; k++) {
        story.advance(0.5);
        const g = story.glowing.find((x) => story.followable(x));
        if (g && !story.inDanger && story.quiet >= 40) story.follow(g, false);
      }
    }
  }
  assert.ok(told > 3, `${told} told`);
});

test("glow balance: helpful and harmful traits glow first, and while one glows or can, at most one glowing baby's trait doesn't matter", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story, GLOW_MIN_SECONDS } = await import("../src/story.js");
  const { variationEffect } = await import("../src/why.js");
  const { sameVariation } = await import("../src/cohorts.js");
  let balanced = 0, starts = 0;
  for (const seed of [1, 2, 13]) for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(seed), story = new Story(bridge);
    story.begin(bridge.families.founding[f].ids[0]);
    while (story.phase !== "ended") {
      if (story.phase === "choice") { story.follow(story.options[0], false); continue; }
      story.afterGeneration(bridge.step());
      for (let k = 0; k < 40 && story.phase === "watch"; k++) {
        const started = story.advance(0.5), t = story.watchT, zone = story.testZone();
        const matters = (x) => variationEffect(x.v.t, x.v.dir, zone) !== 0;
        const open = (x) => story.glowing.includes(x) || x.bornT + story.glowGenerations * story.generationSeconds - t >= GLOW_MIN_SECONDS;
        if (story.fresh.some((x) => matters(x) && story.followable(x) && open(x))) {
          balanced++;
          assert.ok(story.glowing.filter((x) => !matters(x)).length <= 1, "at most one glow whose trait doesn't matter here");
        }
        for (const x of started) {
          starts++;
          if (matters(x)) continue;
          // A trait that doesn't matter here lit up: no baby of the line with one that helps or hurts was still waiting
          // to, even one yet to appear in its day.
          const waiting = story.fresh.filter((y) => matters(y) && story.followable(y) && open(y) &&
            !story.glowing.includes(y) && !story.glowing.some((z) => sameVariation(z.v, y.v)));
          assert.equal(waiting.length, 0);
        }
        const g = story.glowing.find((x) => story.followable(x));
        if (g && !story.inDanger && story.quiet >= 40) story.follow(g, false);
      }
    }
  }
  assert.ok(balanced > 50 && starts > 50, `${balanced} balanced steps, ${starts} glows started`);
});

test("an earlier trait on 'Your line so far' greys out when the line loses it; the latest one doesn't, until the child comes back to that line", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story, FADED_BELOW } = await import("../src/story.js");
  const { carries } = await import("../src/variations.js");
  let faded = 0, checked = 0;
  for (const seed of [1, 2, 3]) for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(seed), story = new Story(bridge);
    story.begin(bridge.families.founding[f].ids[0]);
    while (story.phase !== "ended") {
      if (story.phase === "choice") { story.follow(story.options[0], false); continue; }
      story.afterGeneration(bridge.step());
      if (story.phase === "ended") break;
      const line = bridge.followedAnimals(), latest = story.choices[story.choices.length - 1];
      for (const chip of story.chips) {
        const have = line.filter((a) => carries(a.genome, chip.v)).length;
        assert.equal(!!chip.faded, have < FADED_BELOW && 2 * have < line.length);
        // Each animal of a line has its latest trait, until a later line dies out and the child comes back to it
        // with the rest of it and their babies (scope decision 68).
        const back = latest && story.tries.some((t) => t.generation >= latest.generation);
        if (latest && chip.v === latest.v && !back) assert.equal(chip.faded, null);
        if (chip.faded) faded++;
        checked++;
      }
      for (let k = 0; k < 40 && story.phase === "watch"; k++) {
        story.advance(0.5);
        const g = story.glowing.find((x) => story.followable(x));
        if (g && !story.inDanger && story.quiet >= 40) story.follow(g, false);
      }
    }
  }
  assert.ok(checked > 100 && faded > 0, `${faded} of ${checked}`);
});

test("the first choice is where the family will live: a card fills in once a baby of the family lives there, the line fills the place, and only babies born there join", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story, PLACE_TO, PLACE_MAX, HOME_MARK } = await import("../src/story.js");
  const { carries } = await import("../src/variations.js");
  const sorted = (ids) => [...ids].sort((a, b) => a - b);
  let arrived = 0, bornElsewhere = 0, follows = 0, backs = 0;
  for (const zone of [0, 1, 2]) for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(13), story = new Story(bridge, { places: true });
    story.begin(bridge.families.founding[f].ids[0]);
    assert.equal(story.phase, "place");
    assert.ok(story.running && story.fast, "the world runs on to the family's first babies");
    // No baby yet, so every card waits a generation, and nothing can be chosen.
    assert.deepEqual(story.placeCards(), [null, null, null]);
    assert.equal(story.choosePlace(zone), null);
    let card = null;
    while (!card && bridge.generation < 6) {
      assert.equal(story.afterGeneration(bridge.step()), "place");
      assert.equal(story.glowing.length + story.fresh.length, 0, "nothing glows before the place choice");
      const cards = story.placeCards();
      cards.forEach((c, z) => {
        if (!c) return;
        // A card is a real baby of the family, born since the story began, living in that place.
        assert.equal(c.zone, z);
        assert.ok(bridge.isFollowed(c.id) && bridge.get(c.id).birthGeneration > story.startGeneration && bridge.zoneOf(c.id) === z);
        assert.equal(c.living, bridge.followedIn(z));
      });
      card = cards[zone];
    }
    assert.ok(card, "a baby preferring each place turns up in the family within a few generations");
    const family = bridge.followedAnimals(), home = story.choosePlace(zone);
    assert.equal(story.noun, "line");
    assert.equal(story.place, zone);
    // The line is the family's animals living there; the rest of the family are relatives, marked with this choice.
    const there = family.filter((a) => a.zone === zone).map((a) => a.id);
    assert.deepEqual(sorted(bridge.followedIds()), sorted(there));
    for (const a of family) assert.equal(bridge.relatives.get(a.id), a.zone === zone ? undefined : HOME_MARK);
    assert.equal(story.family.then, there.length);
    assert.equal(story.phase, there.length >= PLACE_TO ? "watch" : "moving");
    while (story.phase !== "ended" && bridge.generation < 14) {
      const line = new Set(bridge.followedIds()), v = bridge.follow.v, was = story.phase;
      const ev = bridge.step();
      for (const b of ev.births) {
        const kid = bridge.get(b.childId);
        if (!kid || !(line.has(b.parentAId) || line.has(b.parentBId))) continue;
        // A baby of the line joins it only when it lives there too (and inherited the latest followed trait); one born
        // in another place is a relative: blue is only ever the child's line, in one place.
        assert.equal(bridge.isFollowed(b.childId), bridge.zoneOf(b.childId) === zone && (!v || carries(kid.bodyGenome, v)));
        if (bridge.zoneOf(b.childId) !== zone) { assert.ok(bridge.isRelative(b.childId)); bornElsewhere++; }
      }
      const what = story.afterGeneration(ev);
      if (what === "ended") break;
      assert.ok(bridge.followedAnimals().every((a) => a.zone === zone), "the whole line lives in the chosen place");
      if (was === "moving" && what !== "back") {
        // The fast-forward runs until PLACE_TO live there, for at most PLACE_MAX generations.
        const n = bridge.followedIds().length, done = n >= PLACE_TO || bridge.generation - home.generation >= PLACE_MAX;
        assert.equal(what, done ? "arrived" : "moving");
        if (done) { assert.equal(home.outcome, n >= PLACE_TO ? "reached" : "cap"); arrived++; }
      }
      if (what === "back") {
        backs++;
        // Back from a follow's line to the line before it, still in the chosen place.
        assert.equal(bridge.follow.place, zone);
        if (!story.choices.length) assert.equal(bridge.follow.v, null);
      }
      for (let k = 0; k < 40 && story.phase === "watch"; k++) {
        story.advance(0.5);
        const g = story.glowing.find((x) => story.followable(x));
        if (g && story.quiet >= 40 && !story.inDanger) {
          story.follow(g, false);
          follows++;
          // A follow is in the chosen place, and its mark counts on from the place choice's.
          const c = story.choices[story.choices.length - 1];
          assert.equal(c.zone, zone);
          assert.equal(c.mark, story.choices.length + HOME_MARK);
          assert.equal(bridge.follow.place, zone);
        }
      }
    }
  }
  assert.ok(arrived >= 6 && bornElsewhere > 0 && follows > 0 && backs > 0, `arrived ${arrived}, born elsewhere ${bornElsewhere}, follows ${follows}, backs ${backs}`);
});

test("when the line in the chosen place dies out, the family is the child's again, to choose where it lives again", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const bridge = Bridge.fromAncestor(13), story = new Story(bridge, { places: true });
  story.begin(bridge.families.founding[0].ids[0]);
  while (!story.placeCards()[2]) story.afterGeneration(bridge.step());
  const family = new Set(bridge.followedIds()), home = story.choosePlace(2);
  // The whole line in the water is lost at once (its animals no longer in the line): as if it died out.
  const ev = bridge.step();
  for (const id of [...bridge.follow.members]) bridge.follow.members.delete(id);
  const what = story.afterGeneration({ ...ev, group: { ...ev.group, count: 0 } });
  assert.equal(what, "back");
  assert.equal(story.phase, "place");
  assert.equal(story.home, null);
  assert.equal(story.homeGone, home);
  assert.deepEqual(story.homeTries, [home]);
  assert.equal(home.outcome, "gone");
  assert.equal(story.noun, "family");
  // The line is the rest of the family (and their babies since); no one is a relative now.
  assert.ok(bridge.followedIds().length > 0);
  for (const id of bridge.followedIds()) assert.ok(family.has(id) || bridge.get(id).birthGeneration === bridge.generation);
  assert.equal(bridge.relatives.size, 0);
  assert.equal(bridge.follow.place, null);
});

test("next generation's deaths and their causes are known before it runs: Classroom survival draws nothing", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const bridge = Bridge.fromAncestor(3);
  for (let g = 0; g < 12; g++) {
    const next = bridge.dyingNext(), ev = bridge.step();
    assert.deepEqual(new Map(ev.deaths.map((d) => [d.id, d.cause])), next);
  }
});

test("the first choice's lines are short, with no percentages, even with the longest family name", async () => {
  const N = await import("../src/narration.js");
  const { MOMENTS } = await import("../src/moments.js");
  const { readFileSync } = await import("node:fs");
  const name = "Thistlepaddle", lines = [N.placeQuestion(name), ...N.PLACE_CARDS, N.WAIT_GENERATION, N.WATCH_LINE];
  for (const zone of [0, 1, 2]) {
    lines.push(N.homeLine(19, zone, name), N.homeCounter(zone, [2, 5, 11, 20], "reached", name), N.homeCounter(zone, [3, 7, 12, 16, 18, 19], "cap", name),
      N.homeGoneLine(zone, 2, name), N.PLACE_LABELS[zone]);
  }
  for (const line of lines) {
    const words = line.split(/\s+/).filter((w) => /\p{L}|\d/u.test(w)).length;
    assert.ok(words <= 13, `"${line}" has ${words} words`);
    assert.doesNotMatch(line, /%|percent/i);
  }
  assert.equal(N.homeCounter(2, [2, 5, 11, 20], "reached", "Mossfoot"), "Your Mossfoot line near the water: 2… 5… 11… 20!");
  assert.equal(N.homeCounter(0, [2, 5], null), "Your line in the high trees: 2… 5…");
  // Every moment has its link on the moments page, and every link is a moment.
  const page = readFileSync(new URL("../moments.html", import.meta.url), "utf8");
  const linked = [...page.matchAll(/data-moment="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...linked].sort(), [...MOMENTS].sort());
});
