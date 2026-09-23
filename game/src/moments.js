/**
 * Design shortcuts (prep for Step 4): `?moment=NAME` jumps straight into one of
 * the moments the look design is about, in a real game state. The links are on
 * `/game/moments.html`; `design/current/README.md` lists what draws each one.
 *
 * Nothing here changes the biology or the game. The world is the engine's own
 * for the seed. A story that reaches the moment is found by observer runs on
 * throwaway copies of that world (as the curated-seed check does), then the
 * game itself is played forward to it the way a child would: tap a family,
 * watch, choose. Only the waiting is skipped.
 */

import { Story } from "./story.js";
import { APART, isNeutral } from "./variations.js";
import { FIRST_MAMMALS } from "./reveal.js";
import { TRAIT_INDEX } from "./engine.js";

/** Every moment, in the order of the moments page. */
export const MOMENTS = ["arrival", "generation", "variation", "grow", "shrink", "choice", "ending", "extinct", "card"];

/** Founding families to try, in order. Family 0 is the webbed family in the high leaves, which dies out fast. */
const FROM_WEBBED = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const FROM_OTHERS = [4, 1, 2, 3, 5, 6, 7, 8, 0];

/** How to choose at each choice point while looking for a story: the most carried option, then the least. */
const POLICIES = [(options) => options[0], (options) => options[options.length - 1]];

/**
 * The one newborn in your group this generation, when it has a new trait (a
 * body mutation at birth) big enough to see: a single ring of light, and the
 * log's "One of your babies was born with …".
 */
function newborn(ev) {
  const m = ev.group.mutated;
  return m.length === 1 && Math.abs(m[0].after - m[0].before) >= APART ? { id: m[0].childId } : null;
}

/**
 * What each moment is, as a test on the story after a generation. It returns
 * something truthy (with the animal to show, when there is one) at the moment.
 * `what` is the story's own answer to that generation; null is a plain watched one.
 */
const MOMENT = {
  /** Mid-story, one generation into a watch, with a group big enough to see. */
  generation: { families: FROM_OTHERS, at: (s, ev, b, what) => what === null && s.phase === "watch" && s.watched === 1 && ev.generation >= 20 && ev.group.count >= 10 },
  /** A newborn with a new trait: its flash shows. */
  variation: { families: FROM_OTHERS, at: (s, ev, b, what) => what === null && s.phase === "watch" && newborn(ev) },
  /** The group clearly bigger than last generation, after the first choice (so it is not the families' first burst). */
  grow: { families: FROM_OTHERS, at: (s, ev, b, what) => what === null && s.phase === "watch" && s.choices.length > 0 && ev.group.count - ev.group.before >= 4 && ev.group.count >= 1.2 * ev.group.before },
  /** The group clearly smaller than last generation, but not gone. */
  shrink: { families: FROM_WEBBED, at: (s, ev, b, what) => what === null && s.phase === "watch" && ev.group.before - ev.group.count >= 3 && ev.group.count <= 0.75 * ev.group.before && ev.group.count >= 2 },
  /** A choice point with three options. */
  choice: { families: FROM_OTHERS, at: (s, ev, b, what) => what === "choice" && s.options.length === 3 },
  /** A surviving ending whose reveal names a real animal (not the first mammals). */
  ending: { families: FROM_OTHERS, at: (s, ev, b, what) => what === "ended" && s.outcome === "survived" && !!s.reveal && s.reveal.animal !== FIRST_MAMMALS },
  /** An ending where the group died out. */
  extinct: { families: FROM_WEBBED, at: (s, ev, b, what) => what === "ended" && s.outcome === "died" },
  /** A member of your group with a new trait, for its creature card. */
  card: {
    families: FROM_OTHERS,
    at: (s, ev, b, what) => {
      if (what !== null || s.phase !== "watch") return null;
      const ids = b.followedIds().filter((id) => b.newTraitOf(id)).sort((x, y) => y - x);
      const meaningful = ids.find((id) => !isNeutral(TRAIT_INDEX[b.newTraitOf(id).trait]));
      return ids.length ? { id: meaningful ?? ids[0] } : null;
    },
  },
};

const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

/**
 * A story in this world that reaches the moment: which family, which choices,
 * and at which generation. Observer runs on throwaway copies of the world.
 * @returns {Promise<null|{family:number, choices:Array<{trait:string, dir:number}>, generation:number, hit:any}>}
 */
async function findStory(game, moment) {
  const { families, at } = MOMENT[moment];
  for (const family of families) {
    for (const policy of POLICIES) {
      const bridge = game.makeWorld(game.seed), story = new Story(bridge);
      story.begin(bridge.families.founding[family].ids[0]);
      const choices = [];
      for (let n = 1; story.running; n++) {
        const ev = bridge.step();
        const what = story.afterGeneration(ev);
        const hit = at(story, ev, bridge, what);
        if (hit) return { family, choices, generation: ev.generation, hit };
        if (what === "choice") {
          const o = policy(story.options);
          choices.push({ trait: o.trait, dir: o.dir });
          story.choose(o, false);
        }
        if (n % 4 === 0) await frame(); // keep the page alive
      }
      if (!choices.length) break; // no choice was made, so another way of choosing changes nothing
    }
  }
  return null;
}

/** A little over a second of the animals wandering, as between two generations. */
function wander(game) {
  for (let i = 0; i < 25; i++) game.herd.tick(48, performance.now());
}

/**
 * Play the game forward to the found generation: tap the family, let each
 * generation pass, and make the same choices. Earlier births and deaths are
 * dated a minute back, so they have settled; the last one happens now.
 */
async function playTo(game, plan) {
  const G = game, hold = -1e9; // the game's own generation clock waits while this runs
  G.begin(G.herd.animals.get(G.bridge.families.founding[plan.family].ids[0]));
  G.clock = hold;
  let k = 0;
  while (G.bridge.generation < plan.generation && G.story.phase !== "ended") {
    wander(G);
    const last = G.bridge.generation + 1 === plan.generation;
    G.generation(last ? performance.now() : performance.now() - 60000);
    G.clock = hold;
    if (G.story.phase === "choice" && !last) {
      await frame(); // the panel opens as it would, then the same option is chosen
      const rec = plan.choices[k++];
      const o = G.story.options.find((x) => x.trait === rec.trait && x.dir === rec.dir) ?? G.story.options[0];
      G.pick(o, false, performance.now());
      G.followChoice(o, false);
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
  if (moment === "generation") {
    G.clock = genMs - 3000; // the next generation passes three seconds from now
    lookAtGroup(G);
  } else if (moment === "variation") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y);
  } else if (moment === "grow" || moment === "shrink") {
    lookAtGroup(G);
  } else if (moment === "choice") {
    lookAtGroup(G, 0.3); // as the choice itself frames it
  } else if (moment === "ending" || moment === "extinct") {
    G.endingAt = null;
    G.showEnding();
  } else if (moment === "card") {
    const a = G.herd.animals.get(plan.hit.id);
    if (a) lookAt(G, a.x, a.y, 0.3, 0.45);
    G.showCard(plan.hit.id);
  }
  note.remove();
  globalThis.lineageMoment = { moment, seed: G.seed, family: plan.family, generation: plan.generation, choices: plan.choices.length, ...plan.hit };
  console.info(`[lineage] moment "${moment}": seed ${G.seed}, founding family ${plan.family}, generation ${plan.generation}, ${plan.choices.length} choices made`);
}
