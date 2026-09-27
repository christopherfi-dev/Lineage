/**
 * Design shortcuts (prep for Step 4): `?moment=NAME` jumps straight into one of
 * the moments the look design is about, in a real game state. The links are on
 * `/game/moments.html`; `design/current/README.md` lists what draws each one.
 *
 * Nothing here changes the biology or the game. The world is the engine's own
 * for the seed. A story that reaches the moment is found by observer runs on
 * throwaway copies of that world (as the curated-seed check does), with a
 * herd laid out the same way as the game's, so the same animals are nearest
 * each other. Then the game itself is played forward to it the way a child
 * would: tap a family, watch, follow, watch. Only the waiting is skipped.
 *
 * Glowing babies light up through the watched day (story.js), so the search
 * and the replay both pass each day in the same steps of DAY_STEP seconds, and
 * the child acts at the same second of the same day.
 */

import { Story, GENERATION_SECONDS } from "./story.js";
import { World } from "./world.js";
import { Herd } from "./herd.js";
import { isNeutral } from "./variations.js";
import { FIRST_MAMMALS } from "./reveal.js";
import { TRAIT_INDEX } from "./engine.js";
import { netEffect, PREDICT_AFTER } from "./journal.js";
import { movedLine, movingLine } from "./narration.js";

/** Every moment, in the order of the moments page. */
export const MOMENTS = [
  "arrival", "naming", "generation", "variation", "follow", "joining", "edge-arrow", "spreading", "fizzled", "danger", "blocked",
  "fairtest", "other-card", "grow", "shrink", "choice", "prediction", "prediction-result", "habitat", "ground", "ending", "extinct", "card",
  "no-test", "away", "back", "go-back", "moving", "so-far", "another-family", "in-trouble",
  "reason", "why", "why-answer", "why-drop", "type-name", "my-name", "average",
];

/**
 * Founding families to try, in order; a world tries those it has (the
 * common-ancestor world has three). In the ?demo=webbed world, family 0 is
 * the webbed family in the high leaves, which dies out fast.
 */
const FROM_WEBBED = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const FROM_OTHERS = [4, 1, 2, 3, 5, 6, 7, 8, 0];

/** A watched day passes in steps this long (seconds), in the search and in the replay alike. */
const DAY_STEP = 0.5;
const DAY_STEPS = Math.round(GENERATION_SECONDS / DAY_STEP);

/**
 * The child can follow now: watched at least 40 s, the group not very small, and a glowing variation that
 * helps or hurts there (scope decision 58) can start a fair test.
 */
function followable(s) {
  if (!s.followOpen || s.quiet < 40 || s.inDanger) return null;
  return s.glowing.find((x) => s.followable(x) && s.canStartFor(x)) ?? null;
}

/**
 * How the child plays while a story is looked for (the measurement's simulated
 * child is "active"). On the backup choice panel every child takes the first
 * option. While the child's group is very small, nothing can be followed
 * (scope decision 44 and the playtest's "no jumping ship").
 */
const POLICIES = {
  /** Follows the first glowing variation that can be followed and can start a fair test, after at least 40 s of watching. */
  active: (s) => { const g = followable(s); return g ? { kind: "follow", id: g.id } : null; },
  /** Like "active", but only a variation that helps in its habitat (the engine's own trait effects). */
  wise: (s) => {
    if (!s.followOpen || s.quiet < 40 || s.inDanger) return null;
    const g = s.glowing.find((x) => s.followable(x) && x.v.dir * netEffect(x.v.t, s.testZone(x)) > 0 && s.canStartFor(x));
    return g ? { kind: "follow", id: g.id } : null;
  },
  /** Like "active", but only a variation that hurts in its habitat: its fair test soon shows it. */
  unwise: (s) => {
    if (!s.followOpen || s.quiet < 40 || s.inDanger) return null;
    const g = s.glowing.find((x) => s.followable(x) && x.v.dir * netEffect(x.v.t, s.testZone(x)) < 0 && s.canStartFor(x));
    return g ? { kind: "follow", id: g.id } : null;
  },
  /** Follows nothing by itself. */
  passive: () => null,
  /**
   * The measurement's simulated child (scope decision 42): taps the first glowing variation that can be followed after at
   * least 40 s of watching, whether or not it can start a fair test right away. If not, the world fast-forwards to
   * see if it spreads.
   */
  tapper: (s) => {
    if (!s.followOpen || s.quiet < 40 || s.inDanger) return null;
    const g = s.glowing.find((x) => s.followable(x));
    return g ? { kind: s.canStartFor(g) ? "follow" : "spread", id: g.id } : null;
  },
};

/** How many of a fair test's animals with the variation are the family's, and how many fill in from nearby, if the child followed this glow now. */
function joinCounts(s, g) {
  const t = s.testFor(g);
  return { stay: t.fromFamily, come: t.fromNearby };
}

/** A glowing baby the card explains instead of offering a follow, for this reason (story.js whyNot), just lit up. */
const explained = (reason) => (s, ev, b, what) => {
  if (what !== "day" || !s.followOpen || s.inDanger) return null;
  const g = s.glowing.find((x) => s.whyNot(x) === reason && x.since === s.watchT);
  return g ? { id: g.id } : null;
};

/** Mid-story, with a group big enough to see: the plain generation's test, and the places' too. */
const midStory = (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length > 0 && ev.generation >= 20 && ev.group.count >= 10;

/**
 * What each moment is, as a test on the story. It returns something truthy
 * (with the animal to show, when there is one) at the moment. `what` is the
 * story's own answer to a generation (null is a plain one), or "day" at each
 * step of a watched day, when babies light up.
 */
const MOMENT = {
  /** Mid-story, just before a generation passes, with a group big enough to see. */
  generation: { families: FROM_OTHERS, policies: ["active", "passive"], at: midStory },
  /** A newborn with a new variation lights up: the only one glowing. */
  variation: { families: FROM_OTHERS, policies: ["passive", "active"], at: (s, ev, b, what) => what === "day" && s.phase === "watch" && s.glowing.length === 1 && s.glowing[0].since === s.watchT && { id: s.glowing[0].id } },
  /** A glowing newborn whose variation can start a fair test: its card is opened. */
  follow: { families: FROM_OTHERS, policies: ["passive", "active"], at: (s, ev, b, what) => { if (what !== "day" || s.inDanger) return null; const g = s.followOpen && s.glowing.find((x) => s.followable(x) && s.canStartFor(x)); return g ? { id: g.id } : null; } },
  /**
   * A follow's gather-in (playtest, scope decision 59): the family's animals with the trait light up and a few from
   * nearby walk in, and no prediction comes first. "12 of your family and 2 nearby have bigger eyes." A world with no
   * such follow falls back to one with the family's animals only.
   */
  joining: {
    families: FROM_OTHERS,
    policies: ["active"],
    at: (s, ev, b, what) => {
      if (what !== "day" || PREDICT_AFTER.includes(s.choices.length + 1)) return null;
      const g = followable(s);
      if (!g) return null;
      const n = joinCounts(s, g);
      return n.stay >= 5 && n.come >= 2 && { id: g.id, ...n };
    },
    relaxed: (s, ev, b, what) => {
      if (what !== "day" || PREDICT_AFTER.includes(s.choices.length + 1)) return null;
      const g = followable(s);
      return g ? { id: g.id, ...joinCounts(s, g) } : null;
    },
  },
  /** A glowing baby, and the camera turned away from it: an arrow at the screen's edge points to it (playtest). */
  "edge-arrow": { families: FROM_OTHERS, policies: ["passive"], at: (s, ev, b, what) => what === "day" && s.followOpen && s.choices.length === 0 && ev.generation >= 3 && s.glowing.length >= 1 && s.glowing[0].since === s.watchT && { id: s.glowing[0].id } },
  /** A variation too rare to start a fair test, fast-forwarded to see if it spreads: three generations in, the counter rising. */
  spreading: {
    families: FROM_OTHERS,
    policies: ["tapper"],
    at: (s, ev, b, what) => {
      const c = what === "spreading" ? s.spread.counts : [];
      return c.length >= 4 && c.at(-3) < c.at(-2) && c.at(-2) < c.at(-1) && { id: s.spread.id, trait: s.spread.v.trait, counts: c.slice() };
    },
  },
  /**
   * The spread stopped, a few generations in, because none carry the variation any more: "It disappeared. Most new
   * traits do." A world with no such spread falls back to one that disappeared after a single generation.
   */
  fizzled: {
    families: FROM_OTHERS,
    policies: ["tapper"],
    at: (s, ev, b, what) => what === "spread-failed" && s.lastSpread.outcome === "gone" && s.lastSpread.counts.length >= 3 &&
      { id: s.lastSpread.id, trait: s.lastSpread.v.trait, counts: s.lastSpread.counts.slice() },
    relaxed: (s, ev, b, what) => what === "spread-failed" && s.lastSpread.outcome === "gone" &&
      { id: s.lastSpread.id, trait: s.lastSpread.v.trait, counts: s.lastSpread.counts.slice() },
  },
  /** A spread stopped because the child's group fell to DANGER_SIZE or fewer: "Wait! Your group is getting very small." */
  danger: {
    families: FROM_OTHERS,
    policies: ["tapper"],
    at: (s, ev, b, what) => what === "spread-danger" &&
      { id: s.lastSpread.id, trait: s.lastSpread.v.trait, counts: s.lastSpread.counts.slice(), size: s.family.now },
  },
  /**
   * The child's group is at DANGER_SIZE or fewer and a baby glows: its card says "Your group needs you. Stay with
   * them?" with only "Keep looking", whatever its trait (a meaningful one when there is one).
   */
  blocked: {
    families: FROM_WEBBED,
    policies: ["passive", "tapper"],
    at: (s, ev, b, what) => {
      if (what !== "day" || !s.followOpen || !s.inDanger) return null;
      const g = s.glowing.find((x) => s.followable(x)) ?? s.glowing[0];
      return g ? { id: g.id, size: s.family.now } : null;
    },
  },
  /** Both groups of a fair test, five generations after the follow (the fast-forward and three more), both still 10 or more. */
  fairtest: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => what === null && s.phase === "watch" && !!s.fair && ev.generation - s.fair.generation === 5 && s.mine.now >= 10 && s.theirs.now >= 10 },
  /** An animal of another family in your family's place, three generations or more after a follow: its card sums up its family beside yours (playtest). */
  "other-card": {
    families: FROM_OTHERS,
    policies: ["active", "passive"],
    at: (s, ev, b, what) => {
      if (what !== null || s.phase !== "watch" || !s.fair || ev.generation - s.fair.generation < 3) return null;
      const near = b.livingIds().filter((id) => !b.isFollowed(id) && b.zoneOf(id) === s.place);
      return near.length ? { id: Math.max(...near) } : null;
    },
  },
  /** The family clearly bigger than last generation, after a follow (so it is not the families' first burst). */
  grow: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length > 0 && ev.group.count - ev.group.before >= 4 && ev.group.count >= 1.2 * ev.group.before },
  /** The family clearly smaller than last generation, but not gone. */
  shrink: { families: FROM_WEBBED, policies: ["passive"], at: (s, ev, b, what) => what === null && s.phase === "watch" && ev.group.before - ev.group.count >= 3 && ev.group.count <= 0.75 * ev.group.before && ev.group.count >= 2 },
  /** The backup choice panel, with two or three options. */
  choice: { families: FROM_OTHERS, policies: ["passive"], at: (s, ev, b, what) => what === "choice" && s.options.length >= 2 },
  /** The first follow: once the child follows, the prediction journal asks its first question. */
  prediction: { families: FROM_OTHERS, policies: ["active"], at: (s, ev, b, what) => { if (what !== "day" || s.choices.length !== 0) return null; const g = followable(s); return g ? { id: g.id } : null; } },
  /** The second follow: "Since your last choice" shows the first prediction beside what happened. */
  "prediction-result": { families: FROM_OTHERS, policies: ["active"], at: (s, ev, b, what) => { if (what !== "day" || s.choices.length !== 1) return null; const g = followable(s); return g ? { id: g.id } : null; } },
  /** A visit to the water's edge, mid-story: the camera flies there and the narration sums it up (playtest). */
  habitat: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => midStory(s, ev, b, what) && { zone: 2 } },
  /** A visit to the open ground, the same way. */
  ground: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => midStory(s, ev, b, what) && { zone: 1 } },
  /** A surviving ending whose reveal names a real animal (not the first mammals). */
  ending: { families: FROM_OTHERS, policies: ["wise", "active", "passive"], at: (s, ev, b, what) => what === "ended" && s.outcome === "survived" && !!s.reveal && s.reveal.animal !== FIRST_MAMMALS },
  /**
   * An ending where the family died out after a follow: it leads with the fair test (scope decision 37). A family's
   * fate doesn't depend on what the child follows, and no founding family of seed 13 dies out: the moments page
   * opens this one and "another-family" in seed 6, whose third family dies out at generation 29, and "in-trouble" in
   * seed 72, where four families have no future when its third family dies out at generation 34.
   */
  extinct: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => what === "ended" && s.outcome === "died" && s.choices.length > 0 },
  /**
   * A glowing baby whose new trait doesn't help or hurt where the test would be (scope decision 58): its card
   * explains, "Pointier ear tips don't help or hurt. Nothing to test here.", with only "Keep looking".
   */
  "no-test": {
    families: FROM_OTHERS,
    policies: ["passive", "active"],
    at: (s, ev, b, what) => {
      if (what !== "day" || !s.followOpen || s.inDanger) return null;
      const g = s.glowing.find((x) => !s.followable(x) && x.since === s.watchT);
      return g ? { id: g.id } : null;
    },
  },
  /**
   * A glowing baby living away from the family's place (scope decision 59): its card says so, "This baby lives in
   * the high leaves, away from your family.", with only "Keep looking".
   */
  away: { families: FROM_OTHERS, policies: ["passive", "active"], at: explained("away") },
  /** A glowing baby with the way back from a direction the family took (scope decision 59): "Your family already chose sleeker bodies." */
  back: { families: FROM_OTHERS, policies: ["wise", "active"], at: explained("back") },
  /**
   * A fair test showed the way the family went hurting, and a baby with the way back glows: its card offers it with
   * the reason (scope decision 59), "Chunkier bodies are doing better up here. Go back?"
   */
  "go-back": {
    families: FROM_OTHERS,
    policies: ["unwise"],
    at: (s, ev, b, what) => {
      if (what !== "day" || !s.followOpen || s.inDanger) return null;
      const g = s.glowing.find((x) => s.followable(x) && s.goesBack(x) && x.since === s.watchT);
      return g ? { id: g.id } : null;
    },
  },
  /** A real move of the family, told as it happens (scope decision 59): "Some of your animals are moving to the water's edge." */
  moving: { families: FROM_OTHERS, policies: ["passive", "active"], at: (s, ev, b, what) => what === null && s.phase === "watch" && !!s.moved && { zone: s.moved.zone, main: s.moved.main } },
  /** "Your family so far" with two or more chosen traits, one of them faded (scope decision 59). */
  "so-far": {
    families: FROM_OTHERS,
    policies: ["active", "unwise"],
    at: (s, ev, b, what) => what === null && s.phase === "watch" && s.chips.length >= 2 && s.chips.some((c) => c.faded) && { chips: s.chips.map((c) => `${c.v.group}${c.faded ? ` (${c.faded})` : ""}`) },
  },
  /**
   * The family died out before the story's last generation, and the child taps "Try another family": the same
   * world as it is now, the camera on a family with a future (scope decision 59).
   */
  "another-family": { families: FROM_OTHERS, policies: ["unwise", "active"], at: (s, ev, b, what) => what === "ended" && s.outcome === "died" && ev.generation < 60 },
  /** Then a tap on a family that an observer run shows dying out soon: "This family is in trouble already. Try another!" */
  "in-trouble": { families: FROM_OTHERS, policies: ["unwise", "active"], at: (s, ev, b, what) => what === "ended" && s.outcome === "died" && ev.generation < 60 },
  /**
   * A change with its reason from the table (scope decision 60): the family grew or shrank, and the log says why,
   * "Webbed feet push through water." then "But long legs drag in the water.", with "Helping here / Hurting here" shown.
   */
  reason: {
    families: FROM_OTHERS,
    policies: ["active", "passive"],
    at: (s, ev, b, what) => { if (what !== null || s.phase !== "watch" || ev.generation < 8) return null; const r = s.changeReasons(ev); return r.length >= 2 && { lines: r }; },
    relaxed: (s, ev, b, what) => { if (what !== null || s.phase !== "watch" || ev.generation < 8) return null; const r = s.changeReasons(ev); return r.length >= 1 && s.reasons.helping.length + s.reasons.hurting.length > 0 && { lines: r }; },
  },
  /** A fair test's result, and the world waits for a guess (scope decision 60): "Why are the ones with bigger eyes doing better?" */
  why: { families: FROM_OTHERS, policies: ["active", "unwise"], at: (s, ev, b, what) => what === "guess" && /^Why are/.test(s.lastGuess.text) && { text: s.lastGuess.text } },
  /** The same, after the child's guess: why, from the table. */
  "why-answer": { families: FROM_OTHERS, policies: ["active", "unwise"], at: (s, ev, b, what) => what === "guess" && /^Why are/.test(s.lastGuess.text) && { text: s.lastGuess.text } },
  /**
   * A sudden drop of the family, mostly crowded out, that one trait explains: "Why is your family shrinking?" Most
   * sudden drops have no such trait, so the moments page opens this one in seed 1 (its first family, generation 3).
   */
  "why-drop": { families: FROM_OTHERS, policies: ["passive", "active", "unwise"], at: (s, ev, b, what) => what === "guess" && /^Why is/.test(s.lastGuess.text) && { text: s.lastGuess.text } },
  /** "Your animals, on average", opened from the living portrait, with the family tree strip (scope decision 61). */
  average: { families: FROM_OTHERS, policies: ["active"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length >= 2 && s.familyTree().line.length >= 4 },
  /** A member of your family with a new trait, for its creature card. */
  card: {
    families: FROM_OTHERS,
    policies: ["passive"],
    at: (s, ev, b, what) => {
      if (what !== null || s.phase !== "watch") return null;
      const ids = b.followedIds().filter((id) => b.newTraitOf(id)).sort((x, y) => y - x);
      const meaningful = ids.find((id) => !isNeutral(TRAIT_INDEX[b.newTraitOf(id).trait]));
      return ids.length ? { id: meaningful ?? ids[0] } : null;
    },
  },
};

const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/** A throwaway copy of the game's world, with a herd laid out like the game's (the spots fair tests measure from). */
function copyOf(game) {
  const bridge = game.makeWorld(game.seed), herd = new Herd(new World(), 7919);
  herd.placeFounders(bridge);
  const story = new Story(bridge, { homeOf: (id) => herd.animals.get(id)?.spot ?? null });
  const step = () => { const ev = bridge.step(); if (ev) herd.applyGeneration(ev, bridge, 0); return ev; };
  return { bridge, story, step };
}

/**
 * A story in this world that reaches the moment: which family, what the child
 * did and when (the generation, and the second of its watched day), and where
 * the moment is. Observer runs on throwaway copies. `relaxed` uses the
 * moment's looser test, when it has one.
 * @returns {Promise<null|{family:number, actions:Action[], generation:number, day:null|number, follows:number, hit:any}>}
 */
async function findStory(game, moment, relaxed = false) {
  const { families, policies } = MOMENT[moment], at = relaxed ? MOMENT[moment].relaxed : MOMENT[moment].at;
  const founding = game.bridge.families.founding.length;
  for (const family of families.filter((f) => f < founding)) {
    for (const name of policies) {
      const { bridge, story, step } = copyOf(game), policy = POLICIES[name], actions = [];
      story.begin(bridge.families.founding[family].ids[0]);
      for (let n = 1; story.phase !== "ended"; n++) {
        if (story.phase === "choice") {
          const o = story.options[0];
          actions.push({ generation: bridge.generation, day: null, kind: "push", trait: o.v.trait, dir: o.v.dir });
          story.follow(o, false);
          continue;
        }
        const ev = step();
        if (!ev) break;
        const what = story.afterGeneration(ev), found = (hit, day) => ({ family, actions, generation: ev.generation, day, follows: story.choices.length, hit });
        const hit = at(story, ev, bridge, what);
        if (hit) return found(hit, null);
        if (what === "choice") continue;
        // A spread that reached a fair test's size starts the test by itself, as in the game.
        if (what === "spread-ready") { story.follow(story.lastSpread, false); continue; }
        // A tap-to-guess question, as the game asks it after a generation (the child answers it; nothing changes).
        const q = story.phase === "watch" ? story.guessNow(ev) : null;
        if (q) {
          story.lastGuess = q;
          const guess = at(story, ev, bridge, "guess");
          if (guess) return found(guess, null);
        }
        // The watched day: babies light up as it goes on, and the child may act.
        for (let k = 1; k <= DAY_STEPS && story.phase === "watch"; k++) {
          story.advance(DAY_STEP);
          const day = k * DAY_STEP, now = at(story, ev, bridge, "day");
          if (now) return found(now, day);
          const act = policy(story);
          if (act) {
            actions.push({ generation: ev.generation, day, ...act });
            const g = story.glowFor(act.id);
            if (act.kind === "follow") story.follow(g, false); else story.trySpread(g);
          }
        }
        if (n % 4 === 0) await frame(); // keep the page alive
      }
    }
  }
  return null;
}

/** A little over a second of the animals wandering, as between two generations. */
function wander(game) {
  for (let i = 0; i < 25; i++) game.herd.tick(48, performance.now());
}

/**
 * While playing forward, each prediction gets an answer, so the results show:
 * the first one the "need" misconception when it is offered (to show its
 * line), the others the reasonable answer.
 */
function answer(game) {
  const q = game.journal.question;
  const a = (!game.predictions.length && q.options.find((o) => o.tag === "need")) || q.options.find((o) => o.reasonable);
  game.answerJournal(a, performance.now());
  game.closeJournal();
}

/** Do what the child did in the search, the way a child does it on the page. */
function act(game, a) {
  const G = game, s = G.story;
  if (a.kind === "push") {
    const o = s.options?.find((x) => x.v.trait === a.trait && x.v.dir === a.dir) ?? s.options?.[0];
    if (!o) return;
    G.pick(o, false, performance.now());
    G.followChoice(o, false);
  } else {
    // "Follow" on the glowing newborn's card: a fair test right away, or a fast-forward to see if it spreads.
    const g = s.glowFor(a.id);
    if (!g) return;
    G.followFromMap(g);
    if (G.since) G.closeSince();
  }
  if (G.journal) answer(G);
}

/**
 * Play the game forward to the found moment: tap the family, let each
 * generation pass and each watched day go on in the search's steps, and do
 * what the child did when the child did it. Earlier births and deaths are
 * dated a minute back, so they have settled; the last day happens now.
 */
async function playTo(game, plan) {
  const G = game, hold = -1e9; // the game's own generation clock waits while this runs
  const due = (a) => a.generation === G.bridge.generation;
  G.begin(G.herd.animals.get(G.bridge.families.founding[plan.family].ids[0]));
  // The child names the family (Step 5): the first of the three names, at once.
  if (G.naming) { G.pickName(G.naming.names[0], false, performance.now()); G.closeNaming(); }
  G.clock = hold;
  while (G.bridge.generation < plan.generation && G.story.phase !== "ended") {
    wander(G);
    const last = G.bridge.generation + 1 === plan.generation, t0 = performance.now();
    G.generation(last ? t0 - (plan.day ?? 0) * 1000 : t0 - 60000);
    G.clock = hold;
    if (last && plan.day === null) break;
    if (G.guess) { G.answerGuess(G.guess.question.options.find((o) => o.right)); G.closeGuess(); } // the child guesses, and reads why
    if (G.since || G.journal) {
      // A spread reached a fair test's size and the test starts by itself: the panels go on as the child would.
      await frame();
      if (G.since) G.closeSince();
      if (G.journal) answer(G);
      G.clock = hold;
    }
    if (G.story.phase === "choice") {
      await frame(); // the backup panel opens, then the child takes the option
      for (const a of plan.actions) if (a.kind === "push" && due(a)) act(G, a);
      G.clock = hold;
      continue;
    }
    for (let k = 1; k <= DAY_STEPS && G.story.phase === "watch"; k++) {
      const day = k * DAY_STEP;
      G.dayGoesOn(DAY_STEP, last ? t0 - (plan.day - day) * 1000 : t0 - 60000 + day * 1000);
      G.pumpLog(DAY_STEP * 1000); // the narration keeps the day's time too, so its line is the one a child would see
      if (last && day === plan.day) return;
      const todo = plan.actions.filter((a) => a.kind !== "push" && due(a) && a.day === day);
      if (todo.length) {
        await frame(); // the card and its buttons, as the child sees them, then the tap
        for (const a of todo) act(G, a);
        G.clock = hold;
      }
    }
    if (G.bridge.generation % 4 === 0) await frame();
  }
}

/** Put the camera on a point of the map at once, `fx` of the way across the screen, at the game's zoom. */
function lookAt(game, x, y, fx = 0.5, fy = 0.5) {
  game.lookAt(x, y, fx, fy);
}
function lookAtGroup(game, high = 0) {
  const p = game.herd.largestCluster(game.herd.followed);
  if (p) lookAt(game, p.x, p.y, 0.5, 0.5 - high);
}
/** A small label while the moment is being reached; it also keeps taps out until then. */
function badge(doc, text) {
  const el = doc.createElement("div");
  el.style.cssText = "position:fixed;inset:0;z-index:100;display:flex;align-items:flex-start;justify-content:center;" +
    "padding-top:calc(16px + env(safe-area-inset-top));pointer-events:auto;";
  const pill = doc.createElement("div");
  pill.style.cssText = "padding:9px 16px;border-radius:999px;background:rgba(20,101,127,.92);color:#EFFAFD;" +
    "font:600 14px Karla,system-ui,sans-serif;box-shadow:0 3px 14px rgba(0,0,0,.25);";
  pill.textContent = text;
  el.append(pill);
  doc.body.append(el);
  return { set: (t) => { pill.textContent = t; }, remove: () => el.remove() };
}

/**
 * Jump to a moment. Resolves when it is on screen; `window.lineageMoment` then
 * holds what was found (for screenshots and the console).
 * @param {import("./main.js").Game} game a game just made, at generation 0
 * @param {string} moment one of MOMENTS
 */
export async function goToMoment(game, moment) {
  const doc = game.doc;
  if (!MOMENTS.includes(moment)) { console.warn(`[lineage] unknown moment "${moment}"; try one of ${MOMENTS.join(", ")}`); return; }
  if (moment === "arrival") { globalThis.lineageMoment = { moment }; return; } // the opening itself, with its mist
  if (moment === "naming" || moment === "type-name" || moment === "my-name") { // right after the first tap on the first founding family: time waits for a name
    const G = game;
    if (G.arrival) { G.arrival.t0 = performance.now() - G.arrival.dur; G.endArrival(); }
    G.begin(G.herd.animals.get(G.bridge.families.founding[0].ids[0]));
    // Typing a name (scope decision 61): the child's own name, "Mia", makes "the Miapaddle family".
    if (moment === "type-name") { G.startTyping("own"); G.namingInputEl.value = "Zoe"; }
    if (moment === "my-name") {
      G.startTyping("mine"); G.namingInputEl.value = "Mia"; G.submitTyping();
      if (G.naming) G.naming.goAt = Infinity; // the picked name stays up to be seen
    }
    globalThis.lineageMoment = { moment, seed: G.seed, family: 0, generation: G.bridge.generation, names: G.naming?.names ?? [], name: G.story.name };
    return;
  }
  const note = badge(doc, `Moment: ${moment} · getting there…`);
  await frame();
  const plan = (await findStory(game, moment)) ?? (MOMENT[moment].relaxed ? await findStory(game, moment, true) : null);
  if (!plan) {
    note.set(`No "${moment}" moment in this world (seed ${game.seed}).`);
    setTimeout(() => note.remove(), 4000);
    console.warn(`[lineage] no "${moment}" moment found in seed ${game.seed}`);
    return;
  }
  await playTo(game, plan);
  const G = game, genMs = 20000;
  // A moment at a generation shows the day's babies at once; one during a day keeps the day's hour.
  if (plan.day === null) G.revealAll(performance.now());
  G.clock = (plan.day ?? 0) * 1000;
  if (plan.day === null) G.logTimer = 0; // at a generation, its line shows now (playing forward took only a moment)
  if (G.arrival) { G.arrival.t0 = performance.now() - G.arrival.dur; G.endArrival(); } // no mist on a moment deep in a story
  const glowOf = (id) => G.story.glowFor(id);
  // A guess the last generation asked belongs to its own moments; the others show what they are about.
  if (G.guess && !moment.startsWith("why")) G.closeGuess();
  if (moment === "generation") {
    G.clock = genMs - 3000; // the next generation passes three seconds from now, at the night's end
    lookAtGroup(G);
  } else if (moment === "variation") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y);
  } else if (moment === "follow") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y, 0.3, 0.45);
    G.showCard(plan.hit.id);
  } else if (moment === "joining") {
    // The child follows the glowing newborn: the ones already theirs light up, then the others walk in.
    const g = glowOf(plan.hit.id);
    if (g) { G.followFromMap(g); if (G.since) G.closeSince(); }
    lookAtGroup(G);
  } else if (moment === "edge-arrow") {
    // The camera looks away from the baby, toward the middle of the world: an arrow at the edge points back to it.
    const a = G.herd.animals.get(plan.hit.id);
    if (a) {
      const away = (0.5 + 0.34) * G.vw / G.zoomBase;
      lookAt(G, a.x < G.world.W / 2 ? a.x + away : a.x - away, a.y);
      G.exploring = true;
    }
  } else if (moment === "spreading") {
    // The world fast-forwards, the counter rising; the camera stays where the child tapped the newborn.
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y); else lookAtGroup(G);
  } else if (moment === "grow" || moment === "shrink" || moment === "fizzled" || moment === "danger" || moment === "fairtest" ||
    moment === "moving" || moment === "so-far" || moment === "reason") {
    lookAtGroup(G);
    // The reason's line comes first, so it is the one on screen.
    if (moment === "reason") G.logQueue = [plan.hit.lines[0], ...G.logQueue.filter((l) => l !== plan.hit.lines[0])];
    if (moment === "moving") {
      // The move's line comes first, so it is the one on screen (the family's size follows it).
      const line = (plan.hit.main ? movedLine : movingLine)(plan.hit.zone, G.story.name);
      G.logQueue = [line, ...G.logQueue.filter((l) => l !== line)];
    }
  } else if (moment === "other-card") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y, 0.3, 0.45);
    G.showCard(plan.hit.id);
  } else if (moment === "choice") {
    lookAtGroup(G, 0.3); // as the panel itself frames it
  } else if (moment === "prediction" || moment === "prediction-result") {
    // The child follows the glowing newborn: the first question, or the last fair test beside the prediction.
    const g = glowOf(plan.hit.id);
    if (g) G.followFromMap(g);
    lookAtGroup(G, 0.3);
  } else if (moment === "habitat" || moment === "ground") {
    // The child taps a place: the camera flies there and, once it arrives, the narration sums it up.
    G.visitPlace(plan.hit.zone);
    const tw = G.camTween;
    if (tw) { G.cam.x = tw.x; G.cam.y = tw.y; G.camTween = null; }
  } else if (moment === "ending" || moment === "extinct") {
    G.endingAt = null;
    G.showEnding();
  } else if (moment === "average") {
    lookAtGroup(G);
    G.openAverage();
  } else if (moment === "why" || moment === "why-answer" || moment === "why-drop") {
    lookAtGroup(G, 0.3);
    if (moment === "why-answer" && G.guess) G.answerGuess(G.guess.question.options.find((o) => !o.right) ?? G.guess.question.options[0]);
  } else if (moment === "another-family" || moment === "in-trouble") {
    // The ending, then "Try another family": the world as it is now, and a family with a future to tap.
    G.endingAt = null;
    G.showEnding();
    await new Promise((resolve) => { G.anotherFamily(); setTimeout(resolve, 120); });
    if (G.arrival) { G.arrival.t0 = performance.now() - G.arrival.dur; G.endArrival(); }
    if (moment === "in-trouble") {
      const doomed = G.bridge.livingIds().find((id) => !G.hasFuture(id));
      const a = doomed === undefined ? null : G.herd.animals.get(doomed);
      if (a) { lookAt(G, a.x, a.y); G.tapFamily(a); plan.hit = { id: a.id }; }
      else plan.hit = { none: "every family has a future" };
    }
  } else if (moment === "card" || moment === "blocked" || moment === "no-test" || moment === "away" || moment === "back" || moment === "go-back") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y, 0.3, 0.45);
    G.showCard(plan.hit.id);
  }
  note.remove();
  globalThis.lineageMoment = { moment, seed: G.seed, family: plan.family, generation: plan.generation, day: plan.day, choices: plan.follows, ...plan.hit };
  console.info(`[lineage] moment "${moment}": seed ${G.seed}, founding family ${plan.family}, generation ${plan.generation}` +
    `${plan.day === null ? "" : `, ${plan.day} s into its day`}, ${plan.follows} follows`);
}

/**
 * @typedef {Object} Action what the child did
 * @property {number} generation the generation whose day it was (or, for a push, the one the panel opened after)
 * @property {null|number} day seconds into that watched day (null for a push)
 * @property {"follow"|"spread"|"push"} kind "follow" on a glowing newborn's card started a fair test right away, or a spread
 * @property {number} [id] the glowing newborn tapped
 * @property {string} [trait] @property {number} [dir] the option taken on the backup panel
 */
