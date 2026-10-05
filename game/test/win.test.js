// The win (scope decision 73): a story with a place chosen ends the first generation its line fits its home, with a
// celebration; the backup panel opens only with an option that helps there; at the story's last generation short of the
// win, the line is still changing, and looks most like an animal of its place.
import { test } from "node:test";
import assert from "node:assert/strict";

/** Every story of seed 13 in each place, with a child who follows the first glowing baby it may after 40 s of watching. */
async function stories({ length = 50, follow = true } = {}) {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  const { formOf, APART } = await import("../src/variations.js");
  const { effectIn, variationEffect } = await import("../src/why.js");
  const out = [];
  for (const zone of [0, 1, 2]) for (const f of [0, 1, 2]) {
    const bridge = Bridge.fromAncestor(13), story = new Story(bridge, { places: true, length });
    story.begin(bridge.families.founding[f].ids[0]);
    let panels = 0, fitsBefore = 0;
    // The line fits its home: every required trait's median within APART of its helpful end, in its place.
    const fits = () => {
      const here = bridge.followedAnimals().filter((a) => a.zone === story.home.zone);
      return here.length > 0 && formOf(here.map((a) => a.genome)).every((x, t) => {
        const e = effectIn(t, story.home.zone);
        return e > 0 ? x.median > 1 - APART : e < 0 ? x.median < APART : true;
      });
    };
    while (story.phase !== "ended") {
      if (story.phase === "place") {
        if (story.placeCards()[zone]) { story.choosePlace(zone); continue; }
      } else if (story.phase === "choice") {
        panels++;
        // No more forced bad choices: the panel is open only with an option that helps there.
        assert.ok(story.options.some((o) => variationEffect(o.v.t, o.v.dir, story.testZone()) > 0));
        story.follow(story.options.find((o) => story.helps(o.v)), false);
        continue;
      }
      const what = story.afterGeneration(bridge.step());
      // Not won yet: the line doesn't fit. Except just back from a line that died out: "Back to your line" is told,
      // and the win comes the next generation.
      if (what !== "ended" && what !== "back" && story.home && (story.phase === "watch" || story.phase === "rise") && fits()) fitsBefore++;
      for (let k = 0; k < 40 && story.phase === "watch" && follow; k++) {
        story.advance(0.5);
        const g = story.glowing.find((x) => story.followable(x));
        if (g && !story.inDanger && story.quiet >= 40) story.follow(g, false);
      }
    }
    out.push({ story, bridge, zone, panels, fitsBefore, fitsAtEnd: story.home ? fits() : false });
  }
  return out;
}

test("a story ends with the win the first generation its line fits its home, and the celebration says so in short lines", async () => {
  const { resultFor } = await import("../src/win.js");
  const N = await import("../src/narration.js");
  const all = await stories();
  const won = all.filter((x) => x.story.won);
  assert.ok(won.length >= 7, `${won.length} of ${all.length} won`);
  for (const { story, zone, fitsBefore, fitsAtEnd } of all) {
    assert.equal(fitsBefore, 0, "the win comes the first generation the line fits");
    if (!story.won) continue;
    assert.equal(story.outcome, "survived");
    assert.ok(fitsAtEnd);
    assert.ok(story.endGeneration < story.length);
    // The animal is one of its place's, from the line's actual traits; the celebration names it, and ends with the fit.
    assert.equal(story.reveal.animal.zone, zone);
    const r = resultFor(story);
    assert.equal(r.won, true);
    assert.equal(r.title, N.WIN_TITLE);
    assert.equal(r.lines[0], N.becameLine(story.reveal.animal, story.name));
    assert.ok(r.lines.includes(story.reveal.animal.facts[0]));
    assert.deepEqual(r.lines.slice(-2), [N.fitsNow(zone, story.name), N.ANY_CHANGE_WORSE]);
    for (const line of [r.title, ...r.lines]) {
      const words = line.split(/\s+/).filter((w) => /\p{L}|\d/u.test(w)).length;
      assert.ok(words <= 13, `"${line}" has ${words} words`);
      assert.doesNotMatch(line, /%|percent/i);
    }
  }
});

test("at the story's last generation short of the win, the line is still changing and looks most like an animal of its place", async () => {
  const { resultFor } = await import("../src/win.js");
  const N = await import("../src/narration.js");
  // A child who follows only on the backup panel, in a short story: no line fits its home by generation 12.
  const all = await stories({ length: 12, follow: false });
  assert.ok(all.reduce((n, x) => n + x.panels, 0) > 0, "the backup panel opened, each time with an option that helps");
  let checked = 0;
  for (const { story, zone } of all) {
    if (story.outcome !== "survived" || story.won) continue;
    checked++;
    assert.equal(story.reveal.animal.zone, zone, "the animal it looks most like, of its own place");
    const r = resultFor(story);
    assert.equal(r.won, false);
    assert.equal(r.title, N.stillChanging(story.name));
    assert.deepEqual(r.lines, [N.KEEP_GOING, N.resembleLine(story.reveal.animal, story.name)]);
  }
  assert.ok(checked >= 6, `${checked} still changing`);
  // The lines, with the longest family name: short, and no percentages.
  const { ANIMALS } = await import("../src/reveal.js");
  const name = "Thistlepaddle", lines = [N.WIN_TITLE, N.RESULT_STEP, N.fitsHome(name), N.ANY_CHANGE_WORSE, N.stillChanging(name), N.KEEP_GOING,
    N.followedLine(["more webbing between the toes", "a sleeker body", "a darker coat"])];
  for (const a of ANIMALS) lines.push(N.becameLine(a, name), N.resembleLine(a, name), N.fitsNow(a.zone, name));
  for (const line of lines) {
    const words = line.split(/\s+/).filter((w) => /\p{L}|\d/u.test(w)).length;
    assert.ok(words <= 13, `"${line}" has ${words} words`);
    assert.doesNotMatch(line, /%|percent/i);
  }
  assert.equal(N.followedLine(["more webbing between the toes", "a sleeker body"]), "You followed more webbing and sleeker bodies.");
  assert.equal(N.becameLine(ANIMALS.find((a) => a.id === "lynx"), "Mossfoot"), "Your Mossfoot line became pouncers, like a lynx.");
});

test("chosen by the place: a trait that helps there, risen in the line without a follow, gets its own chip once, and the win says so", async () => {
  const N = await import("../src/narration.js");
  const { resultFor } = await import("../src/win.js");
  const { effectIn } = await import("../src/why.js");
  const { TRAITS } = await import("../src/engine.js");
  const all = await stories({ follow: false });
  let chips = 0, said = 0;
  for (const { story } of all) {
    const zone = story.home?.zone;
    if (zone === undefined) continue;
    for (const p of story.placeChips) {
      chips++;
      // A trait that helps there, the way it helps, which the child never followed.
      assert.equal(p.zone, zone);
      assert.equal(Math.sign(effectIn(p.t, zone)), p.dir);
      assert.ok(!story.chips.some((c) => c.v.t === p.t));
      assert.equal(story.placeChips.filter((q) => q.t === p.t).length, 1, "once");
      const words = [N.chosenChip(TRAITS[p.t], p.dir, zone), N.placeChoosing(zone), N.winningHere([{ trait: TRAITS[p.t], dir: p.dir }])];
      for (const line of words) assert.ok(line.split(/\s+/).length <= 13 && !/%|percent/i.test(line), line);
    }
    if (story.won && story.placeChips.length) {
      said++;
      const chosen = story.placeChips.map((p) => ({ trait: TRAITS[p.t], dir: p.dir }));
      assert.ok(resultFor(story).lines.includes(N.placeChoseLine(zone, chosen, story.chips.length > 0)));
    }
  }
  assert.ok(chips >= 9, `${chips} chips`);
  assert.ok(said > 0, "a win says what the place chose");
  assert.equal(N.chosenChip("strong_tail", 1, 2), "Strong tail: chosen by the water");
  assert.equal(N.winningHere([{ trait: "strong_tail", dir: 1 }]), "Strong tails are winning here.");
  assert.equal(N.placeChoseLine(2, [{ trait: "strong_tail", dir: 1 }]), "The water chose a strong tail too.");
  assert.equal(N.placeChoseLine(0, [{ trait: "curved_claws", dir: 1 }, { trait: "toe_webbing", dir: -1 }, { trait: "streamlined_body", dir: -1 }]),
    "The trees chose curved claws, toes without webbing and a round body too.");
});

test("following never touches the biology: the same seed run again, with no one following, is the same world", async () => {
  const { Bridge } = await import("../src/bridge.js");
  const { Story } = await import("../src/story.js");
  // A story played to its end, and the world run again with no one following, to the story's last generation.
  const played = Bridge.fromAncestor(13), story = new Story(played, { places: true });
  story.begin(played.families.founding[1].ids[0]);
  while (story.phase !== "ended") {
    if (story.phase === "place") { if (story.placeCards()[2]) { story.choosePlace(2); continue; } }
    else if (story.phase === "choice") { story.follow(story.options.find((o) => story.helps(o.v)), false); continue; }
    story.afterGeneration(played.step());
  }
  const again = Bridge.fromAncestor(13);
  while (again.generation < played.generation) again.step();
  const body = (b) => b.livingAnimals().map((a) => `${a.id}:${Array.from(a.genome).map((x) => x.toFixed(6)).join(",")}`).sort();
  assert.deepEqual(body(again), body(played));
});
