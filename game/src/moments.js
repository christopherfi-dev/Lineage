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
import { chipWords, movedLine, movingLine } from "./narration.js";
import { storyCard } from "./storycard.js";
import { truthOf } from "./reflection.js";

/** Every moment, in the order of the moments page. */
export const MOMENTS = [
  "arrival", "naming", "generation", "variation", "follow", "joining", "rising", "slowdown", "edge-arrow", "blocked",
  "growing", "dying", "line-dies", "died-why", "back-line", "compare", "other-card", "relative", "grow", "shrink",
  "choice", "prediction", "prediction-result", "habitat", "ground", "ending", "card",
  "same", "away", "back", "go-back", "moving", "so-far",
  "reason", "why", "why-answer", "why-drop", "type-name", "my-name", "average",
  "ending-idea", "ending-check", "ending-reveal", "story-card", "discovery", "guide", "leaves", "map",
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

/** The child can follow now: watched at least 40 s, the line not very small, and a glowing variation that can be followed. */
function followable(s) {
  if (!s.followOpen || s.quiet < 40 || s.inDanger) return null;
  return s.glowing.find((x) => s.followable(x)) ?? null;
}

/**
 * How the child plays while a story is looked for (the measurement's simulated
 * child is "active"). On the backup choice panel every child takes the first
 * option. While the child's line is very small, nothing can be followed
 * (scope decision 44 and the playtest's "no jumping ship").
 */
const POLICIES = {
  /** Follows the first glowing variation that can be followed, after at least 40 s of watching. */
  active: (s) => { const g = followable(s); return g ? { kind: "follow", id: g.id } : null; },
  /** Like "active", but only a variation that helps in its place. */
  wise: (s) => {
    if (!s.followOpen || s.quiet < 40 || s.inDanger) return null;
    const g = s.glowing.find((x) => s.followable(x) && x.v.dir * netEffect(x.v.t, s.testZone()) > 0);
    return g ? { kind: "follow", id: g.id } : null;
  },
  /** Like "active", but only a variation that hurts in its place: its line soon dies off. */
  unwise: (s) => {
    if (!s.followOpen || s.quiet < 40 || s.inDanger) return null;
    const g = s.glowing.find((x) => s.followable(x) && x.v.dir * netEffect(x.v.t, s.testZone()) < 0);
    return g ? { kind: "follow", id: g.id } : null;
  },
  /** Follows nothing by itself. */
  passive: () => null,
};

/** A glowing baby the card explains instead of offering a follow, for this reason (story.js whyNot), just lit up. */
const explained = (reason) => (s, ev, b, what) => {
  if (what !== "day" || !s.followOpen || s.inDanger) return null;
  const g = s.glowing.find((x) => s.whyNot(x) === reason && x.since === s.watchT);
  return g ? { id: g.id } : null;
};

/** Mid-story, with a group big enough to see: the plain generation's test, and the places' too. */
const midStory = (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length > 0 && ev.generation >= 20 && ev.group.count >= 10;

/** The latest follow, and how many generations ago it was. */
const since = (s, ev) => { const c = s.choices[s.choices.length - 1]; return c ? ev.generation - c.generation : -1; };

/**
 * What each moment is, as a test on the story. It returns something truthy
 * (with the animal to show, when there is one) at the moment. `what` is the
 * story's own answer to a generation (null is a plain one), "guess" when the
 * story asks a tap-to-guess question after it, or "day" at each step of a
 * watched day, when babies light up.
 */
const MOMENT = {
  /** Mid-story, just before a generation passes, with a group big enough to see. */
  generation: { families: FROM_OTHERS, policies: ["active", "passive"], at: midStory },
  /** A newborn with a new variation lights up: the only one glowing. */
  variation: { families: FROM_OTHERS, policies: ["passive", "active"], at: (s, ev, b, what) => what === "day" && s.phase === "watch" && s.glowing.length === 1 && s.glowing[0].since === s.watchT && { id: s.glowing[0].id } },
  /** A glowing newborn whose variation can be followed: its card is opened, "Follow animals with …" (scope decision 67). */
  follow: { families: FROM_OTHERS, policies: ["passive", "active"], at: (s, ev, b, what) => { if (what !== "day" || s.inDanger) return null; const g = s.followOpen && s.glowing.find((x) => s.followable(x)); return g ? { id: g.id } : null; } },
  /**
   * A follow (scope decisions 66 and 67): the line's animals with the trait light up, counted, and the counter
   * starts; no prediction comes first. At least five of them.
   */
  joining: {
    families: FROM_OTHERS,
    policies: ["active"],
    at: (s, ev, b, what) => {
      if (what !== "day" || PREDICT_AFTER.includes(s.choices.length + 1)) return null;
      const g = followable(s), n = g ? s.carrierIds(g.v).length : 0;
      return n >= 5 && { id: g.id, carriers: n };
    },
  },
  /** The fast-forward after a follow, its counter rising generation by generation, the whole line in view (scope decisions 67 and 68). */
  rising: {
    families: FROM_OTHERS,
    policies: ["wise", "active"],
    at: (s, ev, b, what) => {
      const c = what === "rising" ? s.rising.counts : [];
      return c.length >= 4 && c.at(-3) < c.at(-2) && c.at(-2) < c.at(-1) && { trait: s.rising.v.trait, counts: c.slice() };
    },
  },
  /** The count reached 20 or more: the counter's last number, and the slow-down back to real time (scope decision 67). */
  slowdown: { families: FROM_OTHERS, policies: ["wise", "active"], at: (s, ev, b, what) => what === "rise-done" && s.lastRise.outcome === "reached" && { trait: s.lastRise.v.trait, counts: s.lastRise.counts.slice() } },
  /** A glowing baby, and the camera turned away from it: an arrow at the screen's edge points to it (playtest). */
  "edge-arrow": { families: FROM_OTHERS, policies: ["passive"], at: (s, ev, b, what) => what === "day" && s.followOpen && s.choices.length === 0 && ev.generation >= 3 && s.glowing.length >= 1 && s.glowing[0].since === s.watchT && { id: s.glowing[0].id } },
  /**
   * The child's line is at DANGER_SIZE or fewer and a baby glows: its card says "Your line needs you. Stay with
   * them?" with only "Keep looking", whatever its trait (a meaningful one when there is one).
   */
  blocked: {
    families: FROM_WEBBED,
    policies: ["passive", "active"],
    at: (s, ev, b, what) => {
      if (what !== "day" || !s.followOpen || !s.inDanger) return null;
      const g = s.glowing.find((x) => s.followable(x)) ?? s.glowing[0];
      return g ? { id: g.id, size: s.family.now } : null;
    },
  },
  /** Real time after a follow on a trait that helps there: "Your line with … is growing." and the table's reason (scope decision 67). */
  growing: { families: FROM_OTHERS, policies: ["wise", "active"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.verdict(ev)?.kind === "growing" && since(s, ev) >= 2 && { lines: [s.verdict(ev).reason] } },
  /**
   * Real time after a follow on a trait that hurts there: "Your animals with … are dying off." and the table's
   * reason; each death fades gently with a little light rising, one by one, the camera on it (scope decision 67).
   */
  dying: { families: FROM_OTHERS, policies: ["unwise", "active"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.verdict(ev)?.kind === "dying" && ev.group.gone.length >= 2 && { gone: ev.group.gone.length } },
  /** A followed line dies out (scope decision 68): its last animals fade, the camera on them, "The last of … are dying." */
  "line-dies": { families: FROM_OTHERS, policies: ["unwise", "active"], at: (s, ev, b, what) => what === "back" && ev.group.before >= 1 && { trait: s.backFrom.trait, peak: s.backFrom.peak } },
  /** Then its "Why?" right there: "Why did your animals with … die out?" (scope decision 68). */
  "died-why": { families: FROM_OTHERS, policies: ["unwise", "active"], at: (s, ev, b, what) => what === "guess" && !!s.lastGuess.died && { text: s.lastGuess.text } },
  /** Then "They didn't make it. Back to your line.": the line before is blue again, the camera on it (scope decision 68). */
  "back-line": { families: FROM_OTHERS, policies: ["unwise", "active"], at: (s, ev, b, what) => what === "guess" && !!s.lastGuess.died && { text: s.lastGuess.text } },
  /** Three generations or more after a follow: the line and "Your relatives here", counts with bars (scope decision 67). */
  compare: {
    families: FROM_OTHERS,
    policies: ["wise", "active"],
    at: (s, ev, b, what) => what === null && s.phase === "watch" && since(s, ev) >= 3 && s.family.now >= 5 && s.relativesHere.now >= 5 &&
      { line: [s.family.then, s.family.now], relatives: [s.relativesHere.then, s.relativesHere.now] },
  },
  /** An animal of another family in your line's place, three generations or more after a follow: its card sums up its family beside yours (playtest). */
  "other-card": {
    families: FROM_OTHERS,
    policies: ["active", "passive"],
    at: (s, ev, b, what) => {
      if (what !== null || s.phase !== "watch" || since(s, ev) < 3) return null;
      const near = b.livingIds().filter((id) => !b.isFollowed(id) && !b.isRelative(id) && b.zoneOf(id) === s.place);
      return near.length ? { id: Math.max(...near) } : null;
    },
  },
  /**
   * One of your relatives, drawn in their quiet colour, three generations or more after a follow (scope decisions
   * 66 and 67): its card, "One of your relatives", sets your relatives here beside your line.
   */
  relative: {
    families: FROM_OTHERS,
    policies: ["active", "passive"],
    at: (s, ev, b, what) => {
      if (what !== null || s.phase !== "watch" || since(s, ev) < 3) return null;
      const kin = b.relativeIds().filter((id) => b.zoneOf(id) === s.place);
      return kin.length ? { id: Math.max(...kin) } : null;
    },
  },
  /** The line clearly bigger than last generation, after a follow (so it is not the families' first burst). */
  grow: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length > 0 && ev.group.count - ev.group.before >= 4 && ev.group.count >= 1.2 * ev.group.before },
  /** The family clearly smaller than last generation, but not gone. */
  shrink: { families: FROM_WEBBED, policies: ["passive"], at: (s, ev, b, what) => what === null && s.phase === "watch" && ev.group.before - ev.group.count >= 3 && ev.group.count <= 0.75 * ev.group.before && ev.group.count >= 2 },
  /** The backup choice panel, with two or three options. */
  choice: { families: FROM_OTHERS, policies: ["passive"], at: (s, ev, b, what) => what === "choice" && s.options.length >= 2 },
  /** The first follow: once the child follows, the prediction journal asks its first question. */
  prediction: { families: FROM_OTHERS, policies: ["active"], at: (s, ev, b, what) => { if (what !== "day" || s.choices.length !== 0) return null; const g = followable(s); return g ? { id: g.id } : null; } },
  /** The second follow: "Since your last choice" shows the line and its relatives, and the first prediction beside what happened. */
  "prediction-result": { families: FROM_OTHERS, policies: ["active"], at: (s, ev, b, what) => { if (what !== "day" || s.choices.length !== 1) return null; const g = followable(s); return g ? { id: g.id } : null; } },
  /** A visit to the water's edge, mid-story: the camera flies there and the narration sums it up (playtest). */
  habitat: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => midStory(s, ev, b, what) && { zone: 2 } },
  /** A visit to the open ground, the same way. */
  ground: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => midStory(s, ev, b, what) && { zone: 1 } },
  /** A visit to the high leaves: its animals on branches among the leaves (scope decision 63). */
  leaves: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => midStory(s, ev, b, what) && { zone: 0 } },
  /** The whole map, zoomed out: the places' names and the borders between them (scope decision 63). */
  map: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => midStory(s, ev, b, what) },
  /** A surviving ending whose reveal names a real animal (not the first mammals): its first step, what happened. */
  ending: { families: FROM_OTHERS, policies: ["wise", "active", "passive"], at: (s, ev, b, what) => what === "ended" && s.outcome === "survived" && !!s.reveal && s.reveal.animal !== FIRST_MAMMALS },
  /** The same ending's second step (scope decision 62): "Your idea", the sentence half built. */
  "ending-idea": { families: FROM_OTHERS, policies: ["wise", "active", "passive"], at: (s, ev, b, what) => what === "ended" && s.outcome === "survived" && !!s.reveal && s.reveal.animal !== FIRST_MAMMALS },
  /** Its third step: the idea checked against the table, with the clue and the last choice's line beside its relatives. */
  "ending-check": { families: FROM_OTHERS, policies: ["wise", "active", "passive"], at: (s, ev, b, what) => what === "ended" && s.outcome === "survived" && !!s.reveal && s.reveal.animal !== FIRST_MAMMALS },
  /** Its last step: the reveal, the traits, the story's history, the Field Guide and the story card. */
  "ending-reveal": { families: FROM_OTHERS, policies: ["wise", "active", "passive"], at: (s, ev, b, what) => what === "ended" && s.outcome === "survived" && !!s.reveal && s.reveal.animal !== FIRST_MAMMALS },
  /** The story card made from that ending (scope decision 62), shown over the page to look at. */
  "story-card": { families: FROM_OTHERS, policies: ["wise", "active", "passive"], at: (s, ev, b, what) => what === "ended" && s.outcome === "survived" && !!s.reveal && s.reveal.animal !== FIRST_MAMMALS },
  /** A follow's result went the table's way: "You discovered: …" in the narration (scope decisions 62 and 68). */
  discovery: { families: FROM_OTHERS, policies: ["active", "unwise"], at: (s, ev, b, what) => what === "guess" && !!s.lastGuess.discovery && { text: s.lastGuess.text } },
  /** The Field Guide, open mid-story after a few follows (scope decision 62). */
  guide: { families: FROM_OTHERS, policies: ["active"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length >= 2 },
  /**
   * A line on a trait that doesn't matter in its place (a "~" or a neutral trait), followed like any other: it is
   * doing about as well as its relatives, and the world waits for a guess why (scope decisions 65 and 68).
   */
  same: { families: FROM_OTHERS, policies: ["active", "unwise"], at: (s, ev, b, what) => what === "guess" && !!s.lastGuess.same && { text: s.lastGuess.text } },
  /**
   * A glowing baby of the line living away from its place (scope decisions 59 and 66): its card says so, "This baby
   * lives in the high leaves, away from your line.", with only "Keep looking".
   */
  away: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => s.choices.length > 0 && explained("away")(s, ev, b, what) },
  /** A glowing baby with the way back from a direction the line took (scope decision 59): "Your line already chose sleeker bodies." */
  back: { families: FROM_OTHERS, policies: ["wise", "active"], at: explained("back") },
  /**
   * The line clearly died off the way it went, and a baby with the way back glows: its card offers it with the
   * reason (scope decision 59), "Chunkier bodies are doing better up here. Go back?"
   */
  "go-back": {
    families: FROM_OTHERS,
    policies: ["unwise", "active"],
    at: (s, ev, b, what) => {
      if (what !== "day" || !s.followOpen || s.inDanger) return null;
      const g = s.glowing.find((x) => s.followable(x) && s.goesBack(x) && x.since === s.watchT);
      return g ? { id: g.id } : null;
    },
  },
  /** A real move of the line, told as it happens (scope decision 59): "Some of your animals are moving to the water's edge." */
  moving: { families: FROM_OTHERS, policies: ["passive", "active"], at: (s, ev, b, what) => what === null && s.phase === "watch" && !!s.moved && { zone: s.moved.zone, main: s.moved.main } },
  /** "Your line so far" with two or more chosen traits, one of them faded, with why (scope decisions 59 and 68). */
  "so-far": {
    families: FROM_OTHERS,
    policies: ["active", "unwise"],
    at: (s, ev, b, what) => what === null && s.phase === "watch" && s.chips.length >= 2 && s.chips.some((c) => c.faded) && { chips: s.chips.map((c) => `${c.v.group}${c.faded ? ` (${c.faded})` : ""}`) },
  },
  /**
   * A change with its reason from the table (scope decision 60), when no follow's verdict is told instead: the line
   * grew or shrank, and the log says why, "Webbed feet push through water." then "But long legs drag in the water.",
   * with "Helping here / Hurting here" shown.
   */
  reason: {
    families: FROM_OTHERS,
    policies: ["active", "passive"],
    at: (s, ev, b, what) => { if (what !== null || s.phase !== "watch" || ev.generation < 8 || s.verdict(ev)) return null; const r = s.changeReasons(ev); return r.length >= 2 && { lines: r }; },
    relaxed: (s, ev, b, what) => { if (what !== null || s.phase !== "watch" || ev.generation < 8 || s.verdict(ev)) return null; const r = s.changeReasons(ev); return r.length >= 1 && s.reasons.helping.length + s.reasons.hurting.length > 0 && { lines: r }; },
  },
  /** A follow's result goes the table's way, and the world waits for a guess (scope decisions 60 and 68): "Why is your line with bigger eyes growing?" */
  why: { families: FROM_OTHERS, policies: ["wise", "active"], at: (s, ev, b, what) => what === "guess" && !!s.lastGuess.discovery && !s.lastGuess.same && !s.lastGuess.died && { text: s.lastGuess.text } },
  /** The same, after the child's guess: why, from the table. */
  "why-answer": { families: FROM_OTHERS, policies: ["wise", "active"], at: (s, ev, b, what) => what === "guess" && !!s.lastGuess.discovery && !s.lastGuess.same && !s.lastGuess.died && { text: s.lastGuess.text } },
  /** A sudden drop of the family or line, mostly crowded out, that one trait explains: "Why is your line shrinking?" */
  "why-drop": { families: FROM_OTHERS, policies: ["passive", "active", "unwise"], at: (s, ev, b, what) => what === "guess" && /shrinking\?$/.test(s.lastGuess.text) && { text: s.lastGuess.text } },
  /** "Your animals, on average", opened from the living portrait, with the family tree strip (scope decision 61). */
  average: { families: FROM_OTHERS, policies: ["active"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length >= 2 && s.familyTree().nodes.length >= 4 },
  /** A member of your line with a new trait, for its creature card. */
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
  const story = new Story(bridge, { homeOf: (id) => herd.animals.get(id)?.spot ?? null, length: game.storyLength });
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
            story.follow(story.glowFor(act.id), false);
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
    // "Follow animals with …" on the glowing newborn's card.
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
    if (G.backing) G.backNow(); // a line that died out: its last animals have faded long ago, and its "Why?" comes
    if (G.guess) { G.answerGuess(G.guess.question.options.find((o) => o.right)); G.closeGuess(); } // the child guesses, and reads why
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
  // At a generation, its line shows now (playing forward took only a moment); the fast-forward's counter stays up.
  if (plan.day === null && moment !== "rising" && moment !== "slowdown") G.logTimer = 0;
  if (G.arrival) { G.arrival.t0 = performance.now() - G.arrival.dur; G.endArrival(); } // no mist on a moment deep in a story
  const glowOf = (id) => G.story.glowFor(id);
  // A guess the last generation asked belongs to its own moments; the others show what they are about.
  if (G.guess && !moment.startsWith("why") && moment !== "same") G.closeGuess();
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
    // The child follows the glowing newborn: the line's animals with its trait light up, counted, and the counter starts.
    const g = glowOf(plan.hit.id);
    if (g) { G.followFromMap(g); if (G.since) G.closeSince(); }
  } else if (moment === "edge-arrow") {
    // The camera looks away from the baby, toward the middle of the world: an arrow at the edge points back to it.
    const a = G.herd.animals.get(plan.hit.id);
    if (a) {
      const away = (0.5 + 0.34) * G.vw / G.zoomBase;
      lookAt(G, a.x < G.world.W / 2 ? a.x + away : a.x - away, a.y);
      G.exploring = true;
    }
  } else if (moment === "rising" || moment === "slowdown") {
    // The fast-forward holds the whole line in view; at its end, the camera goes back to the story's zoom on the line.
    const tw = G.camTween, zw = G.zoomTween;
    if (zw) { G.zoomBase = zw.to; G.zoomTween = null; }
    if (tw) { G.cam.x = tw.x; G.cam.y = tw.y; G.camTween = null; }
  } else if (moment === "line-dies" || moment === "died-why" || moment === "back-line") {
    // The line's last animals fade, the camera on them; then its "Why?"; then back to the line before.
    const tw = G.camTween;
    if (tw) { G.cam.x = tw.x; G.cam.y = tw.y; G.camTween = null; }
    if (moment !== "line-dies" && G.backing) G.backNow();
    if (moment === "back-line" && G.guess) { G.answerGuess(G.guess.question.options.find((o) => o.right)); G.closeGuess(); G.logTimer = 0; G.pumpLog(0); }
    if (moment === "back-line") lookAtGroup(G);
  } else if (moment === "compare") {
    // The line and "Your relatives here": on a phone the slim bar opens to show them.
    lookAtGroup(G);
    if (G.compact.matches) G.setHud(true);
  } else if (moment === "growing" || moment === "dying") {
    // The line growing, or dying off one by one with the camera on each: its verdict and reason in the narration.
    if (moment === "growing") lookAtGroup(G);
  } else if (moment === "grow" || moment === "shrink" || moment === "moving" || moment === "so-far" || moment === "reason") {
    lookAtGroup(G);
    // The reason's line comes first, so it is the one on screen.
    if (moment === "reason") G.logQueue = [plan.hit.lines[0], ...G.logQueue.filter((l) => l !== plan.hit.lines[0])];
    if (moment === "moving") {
      // The move's line comes first, so it is the one on screen (the family's size follows it).
      const line = (plan.hit.main ? movedLine : movingLine)(plan.hit.zone, G.story.name);
      G.logQueue = [line, ...G.logQueue.filter((l) => l !== line)];
    }
  } else if (moment === "other-card" || moment === "relative") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y, 0.3, 0.45);
    G.showCard(plan.hit.id);
  } else if (moment === "choice") {
    lookAtGroup(G, 0.3); // as the panel itself frames it
  } else if (moment === "prediction" || moment === "prediction-result") {
    // The child follows the glowing newborn: the first question, or the line since the last choice beside the prediction.
    const g = glowOf(plan.hit.id);
    if (g) G.followFromMap(g);
    lookAtGroup(G, 0.3);
  } else if (moment === "map") {
    // Zoomed right out, a little above the middle (and, held upright, a little left, clear of the panel), so all
    // three places' names are in view on an iPad.
    G.exploring = true;
    G.zoomBase = G.zoomMin(); G.zoomTween = null;
    lookAt(G, G.world.W * (G.vw > G.vh ? 0.5 : 0.4), G.world.H * 0.42);
  } else if (moment === "habitat" || moment === "ground" || moment === "leaves") {
    // The child taps a place: the camera flies there and, once it arrives, the narration sums it up.
    G.visitPlace(plan.hit.zone);
    const tw = G.camTween;
    if (tw) { G.cam.x = tw.x; G.cam.y = tw.y; G.camTween = null; }
  } else if (moment === "ending" || moment.startsWith("ending-") || moment === "story-card") {
    G.endingAt = null;
    G.showEnding();
    if (moment !== "ending") {
      // The child builds the idea the table would give: the family's biggest helper (or hurter) where it lived.
      const t = truthOf(G.story), trait = G.story.outcome === "survived" ? t.helper ?? t.hurter : t.hurter ?? t.helper;
      G.setEndingStep(1);
      G.ideaPicks.t.value = String(trait ?? 5);
      if (moment !== "ending-idea") G.ideaPicks.zone.value = String(t.zone);
      G.ideaChanged();
      if (moment !== "ending-idea") G.answerIdea();
      if (moment === "ending-reveal" || moment === "story-card") G.setEndingStep(3);
      if (moment === "story-card") {
        const s = G.story, canvas = await storyCard(doc, {
          name: s.name, noun: s.noun, title: G.endingTitleEl.textContent, tree: s.familyTree(), chips: s.chips.map((c) => ({ words: chipWords(c.v.group), faded: !!c.faded })),
          reveal: G.revealEl.querySelector("#reveal-line .text")?.textContent ?? null, idea: G.idea?.sentence ?? null, died: s.outcome === "died",
        });
        G.cardCanvas = canvas;
        const img = Object.assign(doc.createElement("img"), { src: canvas.toDataURL("image/png") });
        img.style.cssText = "position:fixed;inset:0;margin:auto;max-width:94vw;max-height:94vh;z-index:200;box-shadow:0 20px 60px rgba(0,0,0,.45);border-radius:10px;";
        doc.body.append(img);
      }
    }
  } else if (moment === "discovery") {
    // The child guesses; when the panel closes, the discovery is said.
    lookAtGroup(G);
    if (G.guess) { G.answerGuess(G.guess.question.options.find((o) => o.right)); G.closeGuess(); }
    const line = G.logQueue.find((l) => l.startsWith("You discovered"));
    if (line) G.logQueue = [line, ...G.logQueue.filter((l) => l !== line)];
    G.logTimer = 0;
    G.pumpLog(0);
  } else if (moment === "guide") {
    lookAtGroup(G);
    G.openGuide();
  } else if (moment === "average") {
    lookAtGroup(G);
    G.openAverage();
  } else if (moment === "why" || moment === "why-answer" || moment === "why-drop" || moment === "same") {
    lookAtGroup(G, 0.3);
    if (moment === "why-answer" && G.guess) G.answerGuess(G.guess.question.options.find((o) => !o.right) ?? G.guess.question.options[0]);
  } else if (moment === "card" || moment === "blocked" || moment === "away" || moment === "back" || moment === "go-back") {
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
 * @property {"follow"|"push"} kind "follow" on a glowing newborn's card, or the option taken on the backup panel
 * @property {number} [id] the glowing newborn tapped
 * @property {string} [trait] @property {number} [dir] the option taken on the backup panel
 */
