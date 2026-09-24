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
 */

import { Story } from "./story.js";
import { World } from "./world.js";
import { Herd } from "./herd.js";
import { isNeutral } from "./variations.js";
import { FIRST_MAMMALS } from "./reveal.js";
import { TRAIT_INDEX } from "./engine.js";
import { WATCH_MAX } from "./cohorts.js";
import { netEffect } from "./journal.js";

/** Every moment, in the order of the moments page. */
export const MOMENTS = [
  "arrival", "generation", "variation", "follow", "watching", "fairtest", "grow", "shrink",
  "choice", "prediction", "prediction-result", "ending", "extinct", "card",
];

/** Founding families to try, in order. Family 0 is the webbed family in the high leaves, which dies out fast. */
const FROM_WEBBED = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const FROM_OTHERS = [4, 1, 2, 3, 5, 6, 7, 8, 0];

/** The child can follow now: watched at least 40 s, and a meaningful glowing variation can start a fair test. */
function followable(s) {
  if (!s.followOpen || s.quiet < 40) return null;
  return s.glowing.find((x) => !x.v.neutral && s.canStartFor(x)) ?? null;
}

/**
 * How the child plays while a story is looked for (the measurement's simulated
 * child is "active"). On the backup choice panel every child takes the first option.
 */
const POLICIES = {
  /** Follows the first meaningful glowing variation that can start a fair test, after at least 40 s of watching. */
  active: (s) => { const g = followable(s); return g ? { kind: "follow", id: g.id } : null; },
  /** Like "active", but only a variation that helps in its habitat (the engine's own trait effects). */
  wise: (s) => {
    if (!s.followOpen || s.quiet < 40) return null;
    const g = s.glowing.find((x) => !x.v.neutral && x.v.dir * netEffect(x.v.t, x.zone) > 0 && s.canStartFor(x));
    return g ? { kind: "follow", id: g.id } : null;
  },
  /** Follows nothing by itself. */
  passive: () => null,
  /** Watches each meaningful glowing variation too rare to start a fair test. */
  watcher: (s) => {
    if (!s.followOpen || s.watching.length >= WATCH_MAX) return null;
    const g = s.glowing.find((x) => !x.v.neutral && !s.canStartFor(x));
    return g ? { kind: "watch", id: g.id } : null;
  },
};

/**
 * What each moment is, as a test on the story after a generation. It returns
 * something truthy (with the animal to show, when there is one) at the moment.
 * `what` is the story's own answer to that generation; null is a plain one.
 */
const MOMENT = {
  /** Mid-story, just before a generation passes, with a group big enough to see. */
  generation: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length > 0 && ev.generation >= 20 && ev.group.count >= 10 },
  /** A newborn with a new variation: the only one glowing, born this generation. */
  variation: { families: FROM_OTHERS, policies: ["passive", "active"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.glowing.length === 1 && s.glowing[0].generation === ev.generation && { id: s.glowing[0].id } },
  /** A glowing newborn whose variation can start a fair test: its card is opened. */
  follow: { families: FROM_OTHERS, policies: ["passive", "active"], at: (s, ev, b, what) => { if (what !== null) return null; const g = s.followOpen && s.glowing.find((x) => !x.v.neutral && s.canStartFor(x)); return g ? { id: g.id } : null; } },
  /** A watched variation can start a fair test (MIN_SIZE on each side): the gentle line offers it. */
  watching: { families: FROM_OTHERS, policies: ["watcher"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.readyNow.length > 0 && { trait: s.readyNow[0].v.trait } },
  /** Both groups of a fair test, five generations after the follow (the fast-forward and three more), both still 10 or more. */
  fairtest: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => what === null && s.phase === "watch" && !!s.fair && ev.generation - s.fair.generation === 5 && s.mine.now >= 10 && s.theirs.now >= 10 },
  /** The group clearly bigger than last generation, after a follow (so it is not the families' first burst). */
  grow: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length > 0 && ev.group.count - ev.group.before >= 4 && ev.group.count >= 1.2 * ev.group.before },
  /** The group clearly smaller than last generation, but not gone. */
  shrink: { families: FROM_WEBBED, policies: ["passive"], at: (s, ev, b, what) => what === null && s.phase === "watch" && ev.group.before - ev.group.count >= 3 && ev.group.count <= 0.75 * ev.group.before && ev.group.count >= 2 },
  /** The backup choice panel, with two or three options. */
  choice: { families: FROM_OTHERS, policies: ["passive"], at: (s, ev, b, what) => what === "choice" && s.options.length >= 2 },
  /** The first follow: once the child follows, the prediction journal asks its first question. */
  prediction: { families: FROM_OTHERS, policies: ["active"], at: (s, ev, b, what) => { if (what !== null || s.choices.length !== 0) return null; const g = followable(s); return g ? { id: g.id } : null; } },
  /** The second follow: "Since your last choice" shows the first prediction beside what happened. */
  "prediction-result": { families: FROM_OTHERS, policies: ["active"], at: (s, ev, b, what) => { if (what !== null || s.choices.length !== 1) return null; const g = followable(s); return g ? { id: g.id } : null; } },
  /** A surviving ending whose reveal names a real animal (not the first mammals). */
  ending: { families: FROM_OTHERS, policies: ["wise", "active", "passive"], at: (s, ev, b, what) => what === "ended" && s.outcome === "survived" && !!s.reveal && s.reveal.animal !== FIRST_MAMMALS },
  /** An ending where the group died out after a follow: it leads with the fair test (scope decision 37). */
  extinct: { families: FROM_OTHERS, policies: ["active", "passive"], at: (s, ev, b, what) => what === "ended" && s.outcome === "died" && s.choices.length > 0 },
  /** A member of your group with a new trait, for its creature card. */
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

/** A throwaway copy of the game's world, with a herd laid out like the game's (home spots only). */
function copyOf(game) {
  const bridge = game.makeWorld(game.seed), herd = new Herd(new World(), 7919);
  herd.placeFounders(bridge);
  const story = new Story(bridge, { homeOf: (id) => herd.animals.get(id)?.home ?? null });
  const step = () => { const ev = bridge.step(); if (ev) herd.applyGeneration(ev, bridge, 0); return ev; };
  return { bridge, story, step };
}

/**
 * A story in this world that reaches the moment: which family, what the child
 * did and when, and at which generation. Observer runs on throwaway copies.
 * @returns {Promise<null|{family:number, actions:Action[], generation:number, follows:number, hit:any}>}
 */
async function findStory(game, moment) {
  const { families, policies, at } = MOMENT[moment];
  for (const family of families) {
    for (const name of policies) {
      const { bridge, story, step } = copyOf(game), policy = POLICIES[name], actions = [];
      story.begin(bridge.families.founding[family].ids[0]);
      for (let n = 1; story.phase !== "ended"; n++) {
        if (story.phase === "choice") {
          const o = story.options[0];
          actions.push({ generation: bridge.generation, kind: "push", trait: o.v.trait, dir: o.v.dir });
          story.follow(o, false);
          continue;
        }
        const ev = step();
        if (!ev) break;
        const what = story.afterGeneration(ev);
        const hit = at(story, ev, bridge, what);
        if (hit) return { family, actions, generation: ev.generation, follows: story.choices.length, hit };
        if (what === "choice") continue;
        const act = policy(story);
        if (act) {
          actions.push({ generation: ev.generation, ...act });
          const g = story.glowFor(act.id);
          if (act.kind === "follow") story.follow(g, false); else story.watch(g);
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
    const g = s.glowFor(a.id);
    if (!g) return;
    if (a.kind === "watch") G.watchFromCard(g);
    else { G.followFromMap(g); if (G.since) G.closeSince(); }
  }
  if (G.journal) answer(G);
}

/**
 * Play the game forward to the found generation: tap the family, let each
 * generation pass, and do what the child did. Earlier births and deaths are
 * dated a minute back, so they have settled; the last one happens now.
 */
async function playTo(game, plan) {
  const G = game, hold = -1e9; // the game's own generation clock waits while this runs
  const byGeneration = new Map();
  for (const a of plan.actions) byGeneration.set(a.generation, [...(byGeneration.get(a.generation) ?? []), a]);
  G.begin(G.herd.animals.get(G.bridge.families.founding[plan.family].ids[0]));
  G.clock = hold;
  while (G.bridge.generation < plan.generation && G.story.phase !== "ended") {
    wander(G);
    const last = G.bridge.generation + 1 === plan.generation;
    G.generation(last ? performance.now() : performance.now() - 60000);
    G.clock = hold;
    if (last) break;
    const todo = byGeneration.get(G.bridge.generation);
    if (todo) {
      await frame(); // panels open as they would, then the child acts
      for (const a of todo) act(G, a);
      G.clock = hold;
    } else if (G.bridge.generation % 4 === 0) await frame();
  }
}

/** Put the camera on a point of the map at once, `fx` of the way across the screen. */
function lookAt(game, x, y, fx = 0.5, fy = 0.5) {
  game.cam.x = x - game.vw * fx; game.cam.y = y - game.vh * fy;
  game.clampCam(); game.camTween = null;
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
  if (moment === "arrival") { globalThis.lineageMoment = { moment }; return; } // the opening itself
  const note = badge(doc, `Moment: ${moment} · getting there…`);
  await frame();
  const plan = await findStory(game, moment);
  if (!plan) {
    note.set(`No "${moment}" moment in this world (seed ${game.seed}).`);
    setTimeout(() => note.remove(), 4000);
    console.warn(`[lineage] no "${moment}" moment found in seed ${game.seed}`);
    return;
  }
  await playTo(game, plan);
  const G = game, genMs = 20000;
  G.clock = 0;
  const glowOf = (id) => G.story.glowFor(id);
  if (moment === "generation") {
    G.clock = genMs - 3000; // the next generation passes three seconds from now
    lookAtGroup(G);
  } else if (moment === "variation") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y);
  } else if (moment === "follow") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y, 0.3, 0.45);
    G.showCard(plan.hit.id);
  } else if (moment === "grow" || moment === "shrink" || moment === "watching" || moment === "fairtest") {
    lookAtGroup(G);
  } else if (moment === "choice") {
    lookAtGroup(G, 0.3); // as the panel itself frames it
  } else if (moment === "prediction" || moment === "prediction-result") {
    // The child follows the glowing newborn: the first question, or the last fair test beside the prediction.
    const g = glowOf(plan.hit.id);
    if (g) G.followFromMap(g);
    lookAtGroup(G, 0.3);
  } else if (moment === "ending" || moment === "extinct") {
    G.endingAt = null;
    G.showEnding();
  } else if (moment === "card") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y, 0.3, 0.45);
    G.showCard(plan.hit.id);
  }
  note.remove();
  globalThis.lineageMoment = { moment, seed: G.seed, family: plan.family, generation: plan.generation, choices: plan.follows, ...plan.hit };
  console.info(`[lineage] moment "${moment}": seed ${G.seed}, founding family ${plan.family}, generation ${plan.generation}, ${plan.follows} follows`);
}

/**
 * @typedef {Object} Action what the child did after a generation
 * @property {number} generation
 * @property {"follow"|"watch"|"push"} kind
 * @property {number} [id] the glowing newborn tapped
 * @property {string} [trait] @property {number} [dir] the option taken on the backup panel
 */
