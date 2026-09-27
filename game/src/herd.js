/**
 * The animals on the canvas: exactly one visual animal per living engine
 * individual, keyed by the engine id.
 *
 * What is real (engine): who exists, which habitat each animal uses and how it
 * splits its time between them, every birth and which mother it came from,
 * every death, every mutation at birth, and the body each animal is drawn with.
 *
 * What is visual only (this file's own seeded generator): where on the map an
 * animal stands and how it wanders between generations.
 *
 * Each animal has two places. Its `spot` is where fair tests measure "nearest"
 * from (cohorts.js): it is placed exactly as it always was, from its own
 * generator, so no fair test changes. Its `home` is where it is shown living:
 * a place that follows how it splits its time between the habitats (homeBand),
 * near its mother when it is a baby; a follow's gather-in can move it, within
 * that. Wandering keeps near it.
 */

import { TAU, clamp, mulberry, BANDS } from "./world.js";
import { TRAIT_INDEX } from "./engine.js";

const lerp = (a, b, k) => a + (b - a) * k;

/**
 * Where on the map an animal lives, from its inherited habitat use (the
 * engine's time allocation: leaves, ground, water): the stretch of the terrain
 * field (world.zoneT, which grows from the treetops down to the water) its home
 * keeps to. All its time in one habitat: well inside it, and on open ground
 * well away from the water. Time split between two: toward the border between
 * them, step by step, the nearer the more even the split, so animals that
 * split their time spread out rather than crowd one line. Most of it at the
 * water's edge: by the waterline, and the ones with the most water time of
 * all sometimes wade into the shallows. Always inside the engine's habitat for it.
 * @param {ArrayLike<number>} a time in [leaves, ground, water], summing to 1
 * @param {number} zone the engine's habitat for the animal (its largest share)
 * @returns {{lo:number, hi:number, wader:boolean}}
 */
export function homeBand(a, zone) {
  const [leaves, ground, water] = a, k = (v, from, span) => clamp((v - from) / span, 0, 1);
  // Its middle and half its width, inside [min, max]: from all its time here (f 0) to half of it elsewhere (f 1).
  const band = (f, from, to, min, max) => {
    const c = lerp(from, to, f), half = lerp(0.08, 0.025, f);
    return { lo: Math.max(min, c - half), hi: Math.min(max, c + half), wader: false };
  };
  if (zone === 0) return band(k(ground + water, 0.05, 0.45), 0.2, 0.385, 0.06, 0.41); // down the map, past the tree line
  if (zone === 1) {
    if (leaves < 0.05 && water < 0.05) return { lo: 0.48, hi: 0.64, wader: false }; // well away from the water
    return leaves >= water ? band(k(leaves, 0.05, 0.45), 0.56, 0.445, 0.43, 0.79) : band(k(water, 0.05, 0.45), 0.56, 0.775, 0.43, 0.79);
  }
  if (water >= 0.9) return { lo: 1.02, hi: 1.1, wader: water >= WADER }; // by the waterline
  return band(k(0.9 - water, 0, 0.45), 1.06, 0.835, 0.81, 1.1); // its other time lies up the map, on the ground or in the leaves
}
/** Animals with at least this much of their time at the water's edge go swimming (scope decision 63). */
export const WADER = 0.9;
/** How far into the water a swimmer goes (world.zoneT; the waterline is at 1.12), and from where it is drawn swimming. */
const SHALLOWS = [1.15, 1.24], WADE_MAX = 1.27, SWIM_T = 1.135;

const T = TRAIT_INDEX;
const GROW_MS = 900;   // a newborn grows in
const BABY_MS = 7000;  // and stays a little smaller for a while, beside its mother
const FADE_MS = 1500;  // a death fades softly, a little light rising from it

/** A glowing newborn (the calm rule is story.js): its ring of light opens over BLOOM_MS, with sparkles, then pulses gently. */
const BLOOM_MS = 3400;
/** A glow's gentle pulse, once every this many ms, with a small sparkle above the baby (scope decision 59). */
const PULSE_MS = 2400;
/**
 * With more of your animals than this in view, they are drawn cheaply (scope
 * decision 59): one shared outline for all of them, and no glow under each;
 * glowing babies keep theirs.
 */
export const CHEAP_ABOVE = 36;

/** Zoomed out, an animal this small on screen (its body unit, in pixels) skips details too fine to see there. */
const FINE_PX = 5.5;
/** A follow's gather-in: the animals already in your group light up this long before the newcomers start walking in. */
export const JOIN_GLOW_MS = 1400;
/** How far from the gathering point the newcomers settle, at most (world px), grown a little with their number. */
const GATHER_RADIUS = 110;

/** Colours for groups on the map beside yours: "the others here" in a fair test is the first. */
export const GROUP_COLORS = ["#C8643A", "#7A5AB8", "#B84C80"];
/** Your relatives' quiet colour (scope decisions 66 and 67): a soft clay, so blue is your line's alone and grey everyone else's. */
export const KIN_COLOR = "#B3876F";


/**
 * The mockup's drawing reads traits on a 0..2 scale. The engine's traits are
 * continuous in [0,1], so they are scaled rather than rounded: siblings look
 * related but not identical.
 * @param {ArrayLike<number>} g engine body genome
 */
function looksFrom(g) {
  return {
    bodySize: 1,
    feet: 2 * g[T.toe_webbing],
    legLength: 2 * g[T.long_hindlimbs],
    tail: 2 * g[T.strong_tail],
    coat: 2 * g[T.dense_fur],
    eyes: 2 * g[T.large_eyes],
    snout: 2 * g[T.streamlined_body],
    ears: 2 * g[T.ear_tip_shape],
    claws: 2 * g[T.curved_claws],
    tailTip: 2 * g[T.tail_tip_marking],
    shade: g[T.coat_shade],
  };
}

export class Herd {
  /**
   * @param {import("./world.js").World} world
   * @param {number} seed visual-only seed
   */
  constructor(world, seed = 7) {
    this.world = world;
    this.rnd = mulberry(seed);
    this.rr = (a, b) => a + this.rnd() * (b - a);
    /**
     * Where each newborn makes its home, from its own generator: wandering never
     * draws from it, so every animal's home spot is the same in the game and in
     * a measurement run (fair-test cohorts are the animals nearest a home spot).
     */
    this.placeRnd = mulberry(seed ^ 0x5bd1e995);
    /** Where animals are shown living (`home`), from a generator of its own, so `spot`s stay as they were. */
    this.homeRnd = mulberry(seed ^ 0x68e31da4);
    /** Idle motion (tail flicks, looking around) from a generator of its own, so wandering stays as it was. */
    this.moveRnd = mulberry(seed ^ 0x2c1b3c6d);
    this.mr = (a, b) => a + this.moveRnd() * (b - a);
    /** @type {Map<number, Animal>} */
    this.animals = new Map();
    /** @type {Animal[]} dead animals shrinking away */
    this.fading = [];
    /** @type {Set<number>} your group */
    this.followed = new Set();
    /** @type {Set<number>} your relatives: the rest of each line you narrowed from, in a quiet colour (scope decision 66) */
    this.relatives = new Set();
    /** false while you have no group: everyone is drawn plainly */
    this.following = false;
    /** @type {Map<number, string[]>} members of "the others here", and their colour */
    this.marks = new Map();
    /** @type {Set<number>} newborns with a new variation that glow now (the calm rule, story.js) */
    this.glowing = new Set();
    /** @type {Map<number, number>} when each glowing newborn began to glow (visual only) */
    this.glowSince = new Map();
    /** how fast the world moves: 1 while watching, faster in a fast-forward */
    this.pace = 1;
    /** @type {null|number} the animal whose creature card is open: ringed on the map */
    this.selected = null;
    /** the light now (light.js skyAt): shadows lean away from the sun, glows grow at night */
    this.light = { sun: -0.6, low: 0.6, night: 0 };
    /** -1 shrinking .. 1 growing */
    this.mood = 0;
    /** how big the map is drawn (main.js): zoomed out, small animals skip details too fine to see */
    this.zoom = 1;
    /** how many of your animals were in view at the last frame, and whether they were drawn cheaply */
    this.drawn = { mine: 0, cheap: false };
    /** more of your animals in view than this are drawn cheaply (CHEAP_ABOVE; a measurement may turn it off) */
    this.cheapAbove = CHEAP_ABOVE;
  }

  /** @param {{lo:number, hi:number, wader:boolean}} hb where it lives (homeBand) */
  make(id, zone, genome, x, y, home, bornAt, spot, hb) {
    return {
      id, zone, band: BANDS[zone], hb, looks: looksFrom(genome),
      x, y, vx: this.rr(-.2, .2), vy: this.rr(-.2, .2),
      home, spot, inZone: this.world.zoneAt(x, y) === BANDS[zone],
      ph: this.rr(0, TAU), face: this.rnd() < .5 ? -1 : 1,
      mode: "walk", modeT: this.rr(600, 4200),
      bornAt, diedAt: null, growMs: GROW_MS / this.pace, fadeMs: FADE_MS,
    };
  }

  /**
   * The home nearest (x, y) where an animal of this band lives: straight up or
   * down the map from it (the field grows downwards), a little inside the band.
   * @param {{lo:number, hi:number}} hb
   */
  homeAt(hb, x, y) {
    const w = this.world;
    x = clamp(x, 40, w.W - 40);
    const top = clamp(w.yAt(x, hb.lo), 30, w.H - 30), bottom = clamp(w.yAt(x, hb.hi), 30, w.H - 30);
    const inset = Math.min(36, (bottom - top) / 2) * this.homeRnd();
    return { x, y: y < top ? top + inset : y > bottom ? bottom - inset : y };
  }

  /**
   * Lay out the generation-0 founders: each founding family is one loose
   * cluster in its own habitat band, where their habitat use has them live.
   * @param {import("./bridge.js").Bridge} bridge
   * @returns {Map<string, {x:number, y:number}>} each founding family's centre
   */
  placeFounders(bridge) {
    const centers = new Map();
    for (const fam of bridge.families.founding) {
      let best = null, bestGap = -1;
      for (let t = 0; t < 40; t++) {
        const p = this.world.pointIn(fam.zone, this.rnd);
        let gap = 1e9;
        for (const c of centers.values()) gap = Math.min(gap, Math.hypot(c.x - p.x, c.y - p.y));
        if (gap > bestGap) { best = p; bestGap = gap; }
        if (gap > 480) break;
      }
      centers.set(fam.key, best);
      // The family keeps its shape, moved up or down the map to where its habitat use has it live.
      const bands = fam.ids.map((id) => homeBand(bridge.get(id).timeAllocation, fam.zone));
      const dy = this.homeAt(bands[0], best.x, best.y).y - best.y;
      fam.ids.forEach((id, i) => {
        const ind = bridge.get(id);
        const p = this.world.pointIn(fam.zone, this.rnd, { x: best.x, y: best.y, radius: 170 });
        const home = this.homeAt(bands[i], p.x, p.y + dy);
        this.animals.set(id, this.make(id, fam.zone, ind.bodyGenome, home.x, home.y, home, -1e9, { x: p.x, y: p.y }, bands[i]));
      });
    }
    return centers;
  }

  /**
   * Apply one generation's engine events to the canvas. Call before
   * `followed` is updated to the new generation.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @param {import("./bridge.js").Bridge} bridge
   * @param {number} now ms clock
   * @param {(id:number) => number} [appearAt] when each newborn shows on the map (ms clock): through a
   *   watched day, so babies appear one by one; now by default. The engine made them all now.
   */
  applyGeneration(ev, bridge, now, appearAt = () => now) {
    // Real deaths: the animal leaves the canvas, in the colour it lived in.
    for (const d of ev.deaths) {
      const a = this.animals.get(d.id);
      if (!a) continue;
      this.animals.delete(d.id);
      if (a.hidden) continue; // never shown: it simply isn't there
      a.diedAt = now;
      a.fadeMs = FADE_MS / this.pace;
      a.wasFollowed = this.followed.has(a.id);
      a.wasRelative = this.relatives.has(a.id);
      a.wasFollowing = this.following;
      a.wasMarked = this.marks.get(a.id) ?? null;
      this.fading.push(a);
    }
    // Real births: each newborn appears beside its mother (the parent whose family it joins, bridge.js),
    // and makes its home near hers, as near as its own habitat use lets it. Its spot is placed
    // exactly as before, for the fair tests.
    for (const b of ev.births) {
      const child = bridge.get(b.childId);
      if (!child) continue;
      const zone = bridge.zoneOf(b.childId);
      const mother = this.animals.get(b.motherId ?? b.parentAId) ?? null;
      const near = mother ? mother.spot : this.world.pointIn(zone, this.placeRnd);
      const spot = this.world.pointIn(zone, this.placeRnd, { x: near.x, y: near.y, radius: 46 });
      const hb = homeBand(child.timeAllocation, zone), by = mother ? mother.home : spot;
      const home = this.homeAt(hb, by.x + (this.homeRnd() - 0.5) * 70, by.y + (this.homeRnd() - 0.5) * 50);
      const at = mother ?? home;
      const a = this.make(b.childId, zone, child.bodyGenome, at.x + this.rr(-4, 4), at.y + this.rr(-3, 3), home, now, spot, hb);
      if (mother) a.face = mother.face;
      const t = appearAt(b.childId);
      if (t > now) { a.hidden = true; a.appearAt = t; a.mother = b.motherId ?? b.parentAId; }
      this.animals.set(b.childId, a);
    }
    // Which newborns glow is the story's calm rule (story.js); the page sets `glowing`.
  }

  /** Every baby still waiting to appear shows now (a moment, or the end of a watched day). */
  showAll(now) {
    for (const a of this.animals.values()) if (a.hidden) this.reveal(a, now);
  }

  /** A baby appears beside its mother, where she is now, and grows in. */
  reveal(a, now) {
    const m = this.animals.get(a.mother);
    if (m && !m.hidden) { a.x = m.x + this.rr(-4, 4); a.y = m.y + this.rr(-3, 3); a.face = m.face; }
    a.hidden = false;
    a.bornAt = now;
  }

  /** On the map: alive and shown (a baby waiting to appear is not). */
  shown(id) { const a = this.animals.get(id); return !!a && !a.hidden; }

  /**
   * A follow's gather-in (playtest): the animals already in your group light
   * up, then the newcomers, and their twins beside them, walk in and settle
   * around them. Visual only: their spots, and so every fair test, stay as they were.
   * @param {number[]} stay members of your group who were already in it
   * @param {number[]} come members new to your group
   * @param {Map<number, number>} twins each member's twin among the others here
   * @param {{x:number, y:number}} at where they gather
   */
  gather(stay, come, twins, at, now) {
    for (const id of stay) { const a = this.animals.get(id); if (a) { a.joinAt = now; a.comeAt = undefined; } }
    const r = GATHER_RADIUS + 6 * Math.sqrt(come.length), walk = now + JOIN_GLOW_MS;
    come.forEach((id, i) => {
      const a = this.animals.get(id);
      if (!a) return;
      a.comeAt = walk; a.joinAt = undefined;
      // Near ones keep their place; far ones come in to the edge of the gathering.
      const d = Math.hypot(a.home.x - at.x, a.home.y - at.y);
      if (d > r) {
        const k = (r * (0.55 + 0.45 * this.homeRnd())) / d;
        this.moveHome(a, at.x + (a.home.x - at.x) * k, at.y + (a.home.y - at.y) * k, walk + 90 * i);
      }
    });
    // Each twin among the others here comes to stand beside its partner, so the two groups live side by side.
    [...stay, ...come].forEach((id, i) => {
      const a = this.animals.get(id), t = this.animals.get(twins.get(id));
      if (!a || !t || Math.hypot(t.home.x - a.home.x, t.home.y - a.home.y) <= 40) return;
      this.moveHome(t, a.home.x + this.rr(-22, 22), a.home.y + this.rr(-14, 14), walk + 90 * i);
    });
  }

  /** A new home near (x, y) where this animal can live, and a walk there from `at` (ms clock). */
  moveHome(a, x, y, at) {
    a.home = this.settle(a, x, y);
    a.walkAt = at;
  }

  /** The nearest home to (x, y) where this animal lives (homeBand). */
  settle(a, x, y) { return this.homeAt(a.hb, x, y); }

  /**
   * The glowing newborn whose ring opened most recently, for its caption; null when none is new.
   * @param {(id:number) => boolean} [named] only newborns the log has named
   */
  bloomNow(now, named = () => true) {
    let best = null;
    for (const id of this.glowing) {
      const a = this.animals.get(id), t0 = this.glowSince.get(id);
      if (!a || t0 === undefined || now - t0 > BLOOM_MS + 3200 || !named(id)) continue;
      if (!best || t0 > this.glowSince.get(best.id)) best = a;
    }
    return best;
  }

  /** Centre of a set of animals on the map, or null when none are alive. */
  centroidOf(ids) {
    let sx = 0, sy = 0, n = 0;
    for (const id of ids) { const a = this.animals.get(id); if (a && !a.hidden) { sx += a.x; sy += a.y; n++; } }
    return n ? { x: sx / n, y: sy / n, n } : null;
  }

  /**
   * Where most of a group stands: the centre of the members within `radius`
   * of the member with the most members around her. Null when none are alive.
   */
  largestCluster(ids, radius = 240) {
    const pts = [];
    for (const id of ids) { const a = this.animals.get(id); if (a && !a.hidden) pts.push(a); }
    if (!pts.length) return null;
    const r2 = radius * radius, near = (p, q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2 <= r2;
    let peak = pts[0], most = 0;
    for (const p of pts) {
      let n = 0;
      for (const q of pts) if (near(p, q)) n++;
      if (n > most) { most = n; peak = p; }
    }
    return this.centroidOf(pts.filter((q) => near(peak, q)).map((q) => q.id));
  }

  /**
   * Nearest living animal to a world point, within reach of a fingertip. Zoomed
   * out, the reach stays as big on the screen as at zoom 1 (a glowing newborn's
   * most of all); zoomed in, it grows with the animals, a little more slowly.
   * @param {number} [zoom] the map's zoom
   */
  hit(wx, wy, zoom = 1) {
    const k = zoom < 1 ? 1 / zoom : 1 / Math.sqrt(zoom);
    let best = null, bd = 1e9;
    for (const a of this.animals.values()) {
      if (a.hidden) continue;
      const d = Math.hypot(a.x - wx, (a.y - 11) - wy) - (this.glowing.has(a.id) ? 12 : this.followed.has(a.id) ? 6 : 0) * k;
      if (d < bd) { bd = d; best = a; }
    }
    return best && bd < 34 * k ? best : null;
  }

  /* ================= wandering (visual only) ================= */
  tick(dt, now) {
    dt *= this.pace;
    const s = dt / 16.7, W = this.world.W, H = this.world.H;
    const cell = 74, grid = new Map();
    for (const c of this.animals.values()) {
      const k = ((c.x / cell) | 0) + "," + ((c.y / cell) | 0);
      let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(c);
    }
    for (const c of this.animals.values()) {
      if (c.hidden) { if (now >= c.appearAt) this.reveal(c, now); else continue; }
      c.ph += dt * (c.mode === "walk" ? 0.0062 : 0.0021);
      c.modeT -= dt;
      if (c.modeT <= 0) {
        const r = this.rnd();
        c.mode = r < 0.58 ? "walk" : r < 0.85 ? "pause" : "graze";
        c.modeT = c.mode === "walk" ? this.rr(2200, 7000) : this.rr(900, 3200);
      }
      const walking = c.walkAt !== undefined && now >= c.walkAt;
      if (!c.inZone || walking) {
        // A newborn whose habitat differs from where it was born walks there; a gather-in walks to its new home.
        const dx = c.home.x - c.x, dy = c.home.y - c.y, d = Math.hypot(dx, dy) || 1;
        c.vx += dx / d * 0.12 * s; c.vy += dy / d * 0.12 * s;
        const sp = Math.hypot(c.vx, c.vy), max = clamp(d / 200, walking ? 1.6 : 2.4, 5); // long walks hurry
        if (sp > max) { c.vx = c.vx / sp * max; c.vy = c.vy / sp * max; }
        c.x += c.vx * s; c.y += c.vy * s;
        c.mode = "walk";
        if (walking ? d < 10 : this.world.zoneAt(c.x, c.y) === c.band || d < 6) { c.inZone = true; c.walkAt = undefined; c.vx *= 0.1; c.vy *= 0.1; }
        if (Math.abs(c.vx) > 0.05) c.face = c.vx > 0 ? 1 : -1;
        continue;
      }
      this.idle(c, dt, now);
      if (c.hb.wader) this.wade(c, now);
      const drive = c.mode === "walk" ? 1 : 0.12, goal = c.wadeTo ?? c.home, pull = c.wadeTo ? 0.00016 : 0.000048;
      c.vx += this.rr(-1, 1) * 0.013 * drive * s + (goal.x - c.x) * pull * s;
      c.vy += this.rr(-1, 1) * 0.013 * drive * s + (goal.y - c.y) * pull * s;
      /* gentle personal space so the group reads as many animals, not one blob */
      const gx = (c.x / cell) | 0, gy = (c.y / cell) | 0;
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        const a = grid.get((gx + ox) + "," + (gy + oy)); if (!a) continue;
        for (const o of a) {
          if (o === c) continue;
          const dx = c.x - o.x, dy = c.y - o.y, d2 = dx * dx + dy * dy;
          if (d2 > 0.01 && d2 < 380) { const d = Math.sqrt(d2); c.vx += dx / d * 0.03 * s; c.vy += dy / d * 0.03 * s; }
        }
      }
      const sp = Math.hypot(c.vx, c.vy), max = (this.followed.has(c.id) ? 0.34 : 0.27) * (c.mode === "walk" ? 1 : 0.35);
      if (sp > max) { c.vx = c.vx / sp * max; c.vy = c.vy / sp * max; }
      c.vx *= 0.995; c.vy *= 0.995;
      const px = c.x, py = c.y;
      c.x += c.vx * s; c.y += c.vy * s;
      // Each animal stays in the habitat its inherited time allocation gives it; a wader may stand in the shallows.
      const band = this.world.zoneAt(c.x, c.y);
      if (band !== c.band && !(c.hb.wader && band === "water" && this.world.zoneT(c.x, c.y) < WADE_MAX)) {
        c.x = px; c.y = py; c.vx *= -0.6; c.vy *= -0.6;
      } else { c.wet = band === "water"; c.swim = c.wet && this.world.zoneT(c.x, c.y) > SWIM_T; }
      c.x = clamp(c.x, 20, W - 20); c.y = clamp(c.y, 20, H - 20);
      if (c.mode !== "pause" && Math.abs(c.vx) > 0.05) c.face = c.vx > 0 ? 1 : -1;
    }
    this.fading = this.fading.filter((a) => now - a.diedAt < a.fadeMs);
  }

  /** Visual only: a swimmer goes out into the water below its home, swims there a while, and comes back to rest. */
  wade(c, now) {
    if (c.wadeAt === undefined) c.wadeAt = now + this.mr(1500, 14000);
    if (now < c.wadeAt) return;
    if (c.wadeTo) { c.wadeTo = null; c.wadeAt = now + this.mr(10000, 26000); return; }
    const x = clamp(c.home.x + this.mr(-60, 60), 40, this.world.W - 40);
    c.wadeTo = { x, y: this.world.yAt(x, this.mr(SHALLOWS[0], SHALLOWS[1])) };
    c.wadeAt = now + this.mr(22000, 40000);
  }

  /**
   * Visual only: how an animal holds itself. Now and then its tail flicks. On a
   * pause it lifts its head and turns to look one way, then the other; grazing,
   * its head goes down. The head eases between these, never jumps.
   */
  idle(c, dt, now) {
    if (c.flickAt === undefined) { c.flickAt = now + this.mr(1500, 9000); c.head = 0; }
    if (now >= c.flickAt) { c.flick = now; c.flickAt = now + this.mr(3500, 11000); }
    if (c.mode === "pause") {
      if (c.lookAt === undefined) c.lookAt = now + this.mr(250, 900);
      if (now >= c.lookAt) { c.face = -(c.face || 1); c.lookAt = now + this.mr(900, 1900); }
    } else c.lookAt = undefined;
    const want = c.mode === "pause" ? 1 : c.mode === "graze" ? -1 : 0;
    c.head += (want - c.head) * Math.min(1, dt / 260);
  }

  /* ================= drawing ================= */
  /**
   * Two passes, so your animals are the brightest thing on screen: "world" (every
   * other animal and the groups' rings, drawn under the day's light) and "mine"
   * (your group's glow, your animals, blooms and the card's ring, drawn over it).
   * @param {CanvasRenderingContext2D} x
   * @param {{x:number,y:number,w:number,h:number}} view visible world rect
   * @param {number} now
   * @param {"all"|"world"|"mine"} [pass]
   */
  draw(x, view, now, pass = "all") {
    for (const id of this.glowSince.keys()) if (!this.glowing.has(id)) this.glowSince.delete(id);
    const m = 70, vis = [], L = this.light;
    const worldPass = pass !== "mine", minePass = pass !== "world";
    const inView = (c) => !(c.x < view.x - m || c.x > view.x + view.w + m || c.y < view.y - m || c.y > view.y + view.h + m);
    for (const c of this.animals.values()) if (!c.hidden && inView(c)) vis.push(c);
    for (const c of this.fading) if (inView(c)) vis.push(c);
    const marksOf = (c) => (c.diedAt !== null ? c.wasMarked : this.marks.get(c.id)) ?? null;
    const style = (c) => {
      const following = c.diedAt !== null ? c.wasFollowing : this.following;
      const mine = c.diedAt !== null ? c.wasFollowed : this.followed.has(c.id);
      const kin = c.diedAt !== null ? c.wasRelative : this.relatives.has(c.id);
      return mine ? "mine" : marksOf(c) ? "other" : kin && following ? "kin" : following ? "gray" : "plain";
    };
    const lifeOf = (c) => {
      if (c.diedAt !== null) return clamp(1 - (now - c.diedAt) / c.fadeMs, 0, 1);
      const age = now - c.bornAt, baby = BABY_MS / this.pace;
      if (age < c.growMs) return 0.35 + 0.35 * clamp(age / c.growMs, 0, 1);
      if (age < baby) return 0.7 + 0.3 * (age - c.growMs) / (baby - c.growMs);
      return 1;
    };
    // Many of your animals in view: they are drawn cheaply, with one shared outline and no glow under each.
    let mineInView = 0;
    for (const c of vis) if (c.diedAt === null && this.followed.has(c.id)) mineInView++;
    const cheap = mineInView > this.cheapAbove, outline = cheap && minePass ? new Path2D() : null;
    if (minePass) this.drawn = { mine: mineInView, cheap };
    // Under your animals: a soft warm glow, a little stronger at night and when the group grows.
    if (minePass && this.following && !cheap) {
      const sprite = glowSprite(), r = sprite.width / 2;
      const k = (0.8 + 0.9 * L.night) * (1 + 0.35 * Math.max(0, this.mood) - 0.3 * Math.max(0, -this.mood));
      for (const c of vis) {
        if (c.diedAt !== null || !this.followed.has(c.id)) continue;
        x.globalAlpha = clamp(lifeOf(c) * k, 0, 1);
        x.drawImage(sprite, c.x - r, c.y - 12 - r);
      }
      x.globalAlpha = 1;
    }
    // A fair test's rings (your family's animals get theirs as they are drawn, over the light).
    if (worldPass) for (const c of vis) {
      const colors = marksOf(c);
      if (!colors || style(c) === "mine") continue;
      const life = c.diedAt !== null ? lifeOf(c) : 1, rx = 13;
      colors.forEach((col, k) => {
        x.beginPath(); x.ellipse(c.x, c.y + 1, rx + 5 * k, (rx + 5 * k) * 0.38, 0, 0, TAU);
        x.globalAlpha = 0.24 * life; x.fillStyle = col; if (k === 0) x.fill();
        x.globalAlpha = 0.8 * life; x.strokeStyle = col; x.lineWidth = 1.8; x.stroke();
      });
      x.globalAlpha = 1;
    }
    // The others here live among your animals (a fair test), so the two are drawn together by depth.
    const rank = { gray: 0, plain: 1, kin: 1, other: 2, mine: 2 };
    vis.sort((a, b) => rank[style(a)] - rank[style(b)] || a.y - b.y);
    for (const c of vis) {
      const st = style(c);
      if (st === "mine" ? !minePass : !worldPass) continue;
      const life = lifeOf(c);
      if (life <= 0) continue;
      const dying = c.diedAt !== null;
      let glowAt = null;
      if (!dying && this.glowing.has(c.id)) {
        if (!this.glowSince.has(c.id)) this.glowSince.set(c.id, now);
        glowAt = this.glowSince.get(c.id);
      }
      drawCreature(x, c, st, dying ? 0.9 + 0.1 * life : life, marksOf(c)?.[0], now, L, dying ? life : 1, glowAt, this.zoom, outline);
    }
    if (outline) {
      x.globalAlpha = 0.5; x.strokeStyle = "#08333F"; x.lineWidth = 0.9;
      x.stroke(outline);
      x.globalAlpha = 1;
    }
    // A follow's gather-in: yours light up first, then the newcomers come in with a softer light.
    if (minePass) for (const c of vis) {
      const lit = c.joinAt !== undefined ? now - c.joinAt : c.comeAt !== undefined ? now - c.comeAt : -1;
      const span = c.joinAt !== undefined ? JOIN_GLOW_MS + 700 : 3200;
      if (lit < 0 || lit > span || c.diedAt !== null) continue;
      const k = Math.sin(Math.PI * lit / span), pulse = (Math.sin(now * 0.012) + 1) / 2;
      const rad = (c.joinAt !== undefined ? 19 + 4 * pulse : 16) * (0.8 + 0.2 * k);
      x.globalAlpha = (c.joinAt !== undefined ? 0.9 : 0.55) * k;
      x.lineWidth = 3; x.strokeStyle = "#FFE2A2";
      x.beginPath(); x.ellipse(c.x, c.y - 11, rad, rad * 0.9, 0, 0, TAU); x.stroke();
      x.globalAlpha = 0.35 * k;
      const g = bloomSprite(), R = rad * 1.8;
      x.drawImage(g, c.x - R, c.y - 11 - R, 2 * R, 2 * R);
    }
    x.globalAlpha = 1;
    // The animal whose card is open: a ring that breathes, so you can find it on the map.
    const sel = this.selected !== null ? this.animals.get(this.selected) : null;
    if (minePass && sel && inView(sel)) {
      const k = (Math.sin(now * 0.004) + 1) / 2, rad = 22 + 3 * k;
      x.lineWidth = 5; x.strokeStyle = "rgba(38,32,18,0.28)";
      x.beginPath(); x.ellipse(sel.x, sel.y - 11, rad, rad * 0.92, 0, 0, TAU); x.stroke();
      x.lineWidth = 2.4; x.strokeStyle = "#FFF3D2";
      x.beginPath(); x.ellipse(sel.x, sel.y - 11, rad, rad * 0.92, 0, 0, TAU); x.stroke();
    }
  }
}

/** Sprites drawn once: the glow under your animals, and the warm light of a bloom. */
let glow = null, bloomGlow = null, speck = null;
function glowSprite() {
  if (glow) return glow;
  glow = radialSprite(44, [[0, "rgba(255,238,196,0.5)"], [0.5, "rgba(255,234,190,0.2)"], [1, "rgba(255,232,186,0)"]]);
  return glow;
}
function radialSprite(R, stops) {
  const c = Object.assign(document.createElement("canvas"), { width: 2 * R, height: 2 * R });
  const x = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  const grd = x.createRadialGradient(R, R, 0, R, R, R);
  for (const [o, col] of stops) grd.addColorStop(o, col);
  x.fillStyle = grd; x.fillRect(0, 0, 2 * R, 2 * R);
  return c;
}
const bloomSprite = () => bloomGlow ?? (bloomGlow = radialSprite(64, [[0, "rgba(255,226,160,0.7)"], [0.45, "rgba(255,214,140,0.28)"], [1, "rgba(255,210,130,0)"]]));
const speckSprite = () => speck ?? (speck = radialSprite(12, [[0, "rgba(255,246,214,1)"], [0.3, "rgba(255,228,160,0.8)"], [1, "rgba(255,220,150,0)"]]));

/** A soft four-pointed sparkle. */
function sparkle(x, cx, cy, s) {
  x.beginPath();
  x.moveTo(cx, cy - s);
  x.quadraticCurveTo(cx + s * 0.14, cy - s * 0.14, cx + s, cy);
  x.quadraticCurveTo(cx + s * 0.14, cy + s * 0.14, cx, cy + s);
  x.quadraticCurveTo(cx - s * 0.14, cy + s * 0.14, cx - s, cy);
  x.quadraticCurveTo(cx - s * 0.14, cy - s * 0.14, cx, cy - s);
  x.fill();
}

/**
 * A new trait on the map. A bloom: a ring of light opens around the newborn with
 * a few sparkles drifting up, then settles into a bright ring that pulses
 * gently, with a small sparkle twinkling above the baby, so a glowing baby is
 * easy to spot among many (scope decision 59).
 */
function drawMark(x, c, u, midY, now, night, glowAt) {
  const t = (now - glowAt) / BLOOM_MS;
  const open = 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const pulse = (Math.sin((now / PULSE_MS) * TAU + c.id) + 1) / 2;
  const settled = t >= 1 ? pulse : 0;
  const rad = u * (0.9 + 1.4 * open) + settled * u * 0.28;
  const g = bloomSprite(), R = rad * 2.5;
  x.globalAlpha = t < 1 ? 0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, t * 1.2)) * 0.8 + 0.25 * open : 0.55 + 0.3 * pulse;
  x.drawImage(g, c.x - R, midY - R, 2 * R, 2 * R);
  x.strokeStyle = night > 0.5 ? "#FFF0C8" : "#FFE2A2";
  x.lineWidth = 2.8;
  x.globalAlpha = t < 1 ? 0.95 - 0.25 * open : 0.72 + 0.23 * pulse;
  x.beginPath(); x.ellipse(c.x, midY, rad, rad * 0.92, 0, 0, TAU); x.stroke();
  // A second, fainter ring: while it opens, and as the pulse swells.
  x.lineWidth = 1.4; x.globalAlpha = t < 1 ? 0.5 * (1 - open) : 0.35 * pulse;
  x.beginPath(); x.ellipse(c.x, midY, rad * 1.28, rad * 1.18, 0, 0, TAU); x.stroke();
  x.fillStyle = "#FFF4D6";
  // A few sparkles drift up and fade.
  if (t < 1.9) {
    for (let k = 0; k < 5; k++) {
      const tk = t * 0.75 - k * 0.07;
      if (tk <= 0 || tk >= 1) continue;
      const a = (k / 5) * TAU + c.id * 0.7, r0 = rad * (0.55 + 0.1 * k);
      const sx = c.x + Math.cos(a) * r0 + Math.sin(now * 0.002 + k) * u * 0.15;
      const sy = midY + Math.sin(a) * r0 * 0.6 - tk * u * 2.4;
      x.globalAlpha = Math.sin(Math.PI * tk) * 0.9;
      sparkle(x, sx, sy, u * (0.16 + 0.06 * (k % 2)));
    }
  }
  // A small sparkle above the baby, twinkling with the pulse.
  const sy = midY - u * (2.5 + 0.18 * pulse), ss = u * (0.3 + 0.12 * pulse) * Math.min(1, open * 1.4);
  if (ss > 0) {
    const sp = speckSprite();
    x.globalAlpha = 0.65 + 0.35 * pulse;
    x.drawImage(sp, c.x - ss * 2.2, sy - ss * 2.2, ss * 4.4, ss * 4.4);
    x.globalAlpha = 0.9 + 0.1 * pulse;
    sparkle(x, c.x, sy, ss);
  }
  x.globalAlpha = 1;
}

/** The leaves' greens, from the painted canopy. */
const LEAF_GREENS = ["#3C6130", "#4E7838", "#628F44", "#78A553"];
/** Its own small, fixed numbers (by id), so a branch and its leaves never flicker. */
const rand = (id, k) => { const v = Math.sin(id * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };

/** A branch under a leaves' animal's feet, leaning a little its own way. */
function branch(x, c, u, A) {
  const tilt = (rand(c.id, 1) - 0.5) * 0.5, len = u * (2.3 + rand(c.id, 2));
  x.save();
  x.translate(c.x, c.y + u * 0.08);
  x.rotate(tilt);
  x.globalAlpha = A(0.95);
  x.strokeStyle = "#5E4428"; x.lineCap = "round";
  x.lineWidth = u * 0.36;
  x.beginPath(); x.moveTo(-len, u * 0.1); x.quadraticCurveTo(0, -u * 0.12, len, u * 0.18); x.stroke();
  x.lineWidth = u * 0.16; // a twig
  x.beginPath(); x.moveTo(len * 0.55, u * 0.02); x.quadraticCurveTo(len * 0.8, -u * 0.5, len * 1.05, -u * 0.72); x.stroke();
  x.globalAlpha = A(0.35); x.strokeStyle = "#E8D2A8"; x.lineWidth = u * 0.07;
  x.beginPath(); x.moveTo(-len * 0.9, -u * 0.02); x.quadraticCurveTo(0, -u * 0.22, len * 0.9, u * 0.05); x.stroke();
  x.restore();
}

/** A few leaves in front of a leaves' animal, round its feet and belly, so it sits among them. */
function leavesInFront(x, c, u, A) {
  for (let k = 0; k < 5; k++) {
    const lx = c.x + (rand(c.id, 10 + k) - 0.5) * u * 3.2, ly = c.y - u * (0.1 + rand(c.id, 20 + k) * 0.9);
    const a = rand(c.id, 30 + k) * TAU, r = u * (0.32 + rand(c.id, 40 + k) * 0.22);
    x.globalAlpha = A(0.92);
    x.fillStyle = LEAF_GREENS[k % LEAF_GREENS.length];
    x.beginPath(); x.ellipse(lx, ly, r, r * 0.5, a, 0, TAU); x.fill();
    x.globalAlpha = A(0.4); x.strokeStyle = "#2E4A24"; x.lineWidth = u * 0.04;
    x.beginPath(); x.moveTo(lx - Math.cos(a) * r * 0.8, ly - Math.sin(a) * r * 0.8); x.lineTo(lx + Math.cos(a) * r * 0.8, ly + Math.sin(a) * r * 0.8); x.stroke();
  }
}

/** A swimmer: the water at its body, rings round it, and a small V of wake behind it as it moves. */
function swimming(x, c, u, waterline, dir, now, A) {
  const wy = c.y + waterline, moving = Math.hypot(c.vx, c.vy) > 0.05;
  x.globalAlpha = A(0.55); x.fillStyle = "rgb(128,182,194)";
  x.beginPath(); x.ellipse(c.x, wy + u * 0.08, u * 1.25, u * 0.26, 0, 0, TAU); x.fill();
  x.globalAlpha = A(0.8); x.strokeStyle = "#F2FAFF"; x.lineWidth = 1.4;
  x.beginPath(); x.ellipse(c.x, wy + u * 0.05, u * (1.3 + 0.08 * Math.sin(now * 0.004 + c.id)), u * 0.3, 0, 0, TAU); x.stroke();
  if (moving) {
    const back = -dir, spread = u * (0.55 + 0.1 * Math.sin(now * 0.006 + c.id));
    x.globalAlpha = A(0.6); x.lineWidth = 1.6;
    x.beginPath();
    x.moveTo(c.x + back * u * 0.9, wy); x.lineTo(c.x + back * u * 2.6, wy - spread);
    x.moveTo(c.x + back * u * 0.9, wy + u * 0.1); x.lineTo(c.x + back * u * 2.6, wy + spread + u * 0.1);
    x.stroke();
  }
}

/** Mix a #rrggbb colour toward white (k > 0) or black (k < 0). */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), to = k > 0 ? 255 : 0, a = Math.abs(k);
  const ch = (v) => Math.round(v + (to - v) * a);
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

/**
 * World-scale creature, ported from the mockup's drawCreature. Styles: "mine" —
 * your group, larger, sharper, lit by the sun with a warm rim and a light ring on
 * the ground; "other" — a group you did not choose, in its colour; "kin" — your
 * relatives (scope decisions 66 and 67), full size in a quiet clay; "gray" —
 * everyone else while you follow a group, smaller and faded; "plain" — everyone
 * while you have no group. One animal drawn large is creature.js.
 * @param {CanvasRenderingContext2D} x
 * @param {string} [color] an "other" animal's group colour
 * @param {{sun:number, low:number, night:number}} L the light now
 * @param {number} alpha 1, or less while a death fades
 * @param {null|number} [glowAt] when this newborn began to glow (a new variation you can follow), else null
 * @param {number} [zoom] how big the map is drawn: zoomed out, a small animal skips its fur, rim light, eyes and webbing
 * @param {null|Path2D} [outline] many of your animals in view: each one's outline joins this shared one, stroked once,
 *   and its rim light and the light on its back are left out
 */
function drawCreature(x, c, style, scale, color, now, L, alpha, glowAt = null, zoom = 1, outline = null) {
  const g = c.looks;
  const mine = style === "mine", gray = style === "gray";
  const other = style === "other" && !!color, kin = style === "kin";
  const unit = mine ? 11.6 : gray ? 7.4 : 8.4, fine = unit * zoom >= FINE_PX;
  const fade = (gray ? 0.9 : 1) * alpha;
  const A = (a) => a * fade;
  const u = unit * (0.84 + g.bodySize * 0.20) * scale;
  const dir = c.face || 1;
  const walk = c.mode === "walk" || !c.inZone;
  const ph = c.ph * 2.0;
  const bob = walk ? Math.abs(Math.sin(ph)) * u * 0.09 : 0;
  const legL = u * (0.34 + g.legLength * 0.30);
  const bRX = u * 0.80, bRY = u * 0.50 * (1.12 - g.snout * 0.12), hR = u * 0.47;
  const bodyY = -(legL + bRY) - bob;
  // The head: up and alert on a pause, down while grazing, a small nod with each step (idle, tick).
  const head = c.head ?? 0, up = Math.max(0, head), down = Math.max(0, -head);
  const nod = walk ? Math.sin(ph * 2) * u * 0.03 : 0;
  const headX = bRX * (0.74 + 0.1 * down), headY = bodyY - bRY * 0.52 - hR * 0.42 - u * 0.08 * up + u * 0.2 * down + nod;
  const nose = hR * (0.72 + g.snout * 0.26);
  const web = gray || !fine ? 0 : clamp((g.feet / 2 - 0.2) / 0.45, 0, 1);

  // Where it lives shows (scope decision 63): the leaves' animals stand on a branch among leaves; the water's swim.
  const perched = c.band === "canopy" && fine, swim = !!c.swim;
  const waterline = -(legL + bRY * 0.42);
  /* the shadow leans away from the sun, long when the sun is low */
  const lean = -L.sun * (0.25 + 0.75 * L.low), stretch = 1 + 0.55 * L.low * Math.abs(L.sun);
  if (!swim && !perched) {
    x.globalAlpha = A((mine ? 0.28 : 0.15) * (1 - 0.6 * L.night));
    x.fillStyle = "#2E2616";
    x.beginPath(); x.ellipse(c.x + u * (0.1 + 0.75 * lean), c.y + u * 0.06, u * 1.05 * stretch, u * 0.28, 0, 0, TAU); x.fill();
  }
  if (perched) branch(x, c, u, A);
  /* your animals: a light ring on the ground, the non-colour sign of your family; in a fair test, its side's colour */
  if (mine) {
    x.beginPath(); x.ellipse(c.x, c.y + 1, u * 1.3, u * 0.42, 0, 0, TAU);
    if (color) { x.globalAlpha = A(0.3); x.fillStyle = color; x.fill(); }
    x.globalAlpha = A((color ? 0.95 : 0.6) * Math.min(1, scale + 0.2));
    x.strokeStyle = color ?? (L.night > 0.5 ? "#D6F0F6" : "#FFF3D6"); x.lineWidth = color ? 2.4 : 1.5;
    x.stroke();
  }

  x.save();
  x.translate(c.x, c.y);
  x.scale(dir, 1);
  // A swimmer is drawn above the water only: its legs and belly are under it.
  if (swim) { x.beginPath(); x.rect(-u * 4, -u * 8, u * 8, u * 8 + waterline); x.clip(); }

  const tint = other ? color : kin ? KIN_COLOR : null;
  const body = shade(mine ? "#237089" : tint ?? "#8E8574", (g.shade - 0.5) * (mine ? 0.6 : 0.4));
  const dark = mine ? "#0E4051" : tint ? shade(tint, -0.45) : "#7C7463";
  const far = mine ? "#15546A" : tint ? shade(tint, -0.25) : "#807867";
  const rim = mine ? (L.night > 0.5 ? "#BDE8F2" : "#FFDDA4") : tint ? shade(tint, 0.5) : "#C4B9A0";
  const webCol = mine ? "#F2C7B8" : tint ? shade(tint, 0.65) : "#D9D2BE";

  const fw = u * (0.15 + 0.14 * g.feet);
  const legW = mine ? u * 0.15 : u * 0.12;
  const leg = (px, phase, col) => {
    const sw = walk ? Math.sin(ph + phase) * legL * 0.40 : 0;
    const lift = walk ? Math.max(0, Math.sin(ph + phase)) * u * 0.11 : 0;
    x.globalAlpha = A(1);
    x.strokeStyle = col; x.lineWidth = legW; x.lineCap = "round";
    x.beginPath(); x.moveTo(px, bodyY + bRY * 0.55); x.lineTo(px + sw, -lift); x.stroke();
    x.beginPath(); x.moveTo(px + sw - fw * 0.30, -lift); x.lineTo(px + sw + fw * 0.70, -lift); x.stroke();
    if (web > 0) {
      x.globalAlpha = A(0.9 * web);
      x.fillStyle = webCol;
      x.beginPath(); x.ellipse(px + sw + fw * 0.22, -lift, fw * 0.62, u * 0.085, 0, 0, TAU); x.fill();
    }
  };
  leg(bRX * 0.50 - u * 0.16, Math.PI, far);
  leg(-bRX * 0.52 - u * 0.16, 0, far);

  const tl = u * (0.22 + g.tail * 0.36);
  // Now and then a quick flick of the tail (idle, tick), over its slow sway.
  const fk = c.flick === undefined ? 1 : (now - c.flick) / 420;
  const flick = fk < 1 ? Math.sin(fk * Math.PI) * Math.sin(fk * Math.PI * 3) * u * 0.42 : 0;
  const sway = Math.sin(c.ph * 1.7) * u * 0.16 + flick;
  const tipX = -bRX * 0.70 - tl * 1.00, tipY = bodyY - tl * 0.72 + sway - Math.abs(flick) * 0.4;
  x.globalAlpha = A(1);
  x.strokeStyle = dark; x.lineCap = "round"; x.lineWidth = mine ? u * 0.13 : u * 0.11;
  x.beginPath();
  x.moveTo(-bRX * 0.84, bodyY + bRY * 0.10);
  x.quadraticCurveTo(-bRX * 0.84 - tl * 0.95, bodyY + tl * 0.10 + sway, tipX, tipY);
  x.stroke();
  const mark = clamp((g.tailTip / 2 - 0.3) / 0.4, 0, 1);
  if (mine && mark > 0) {
    x.globalAlpha = A(mark);
    x.fillStyle = "#F0A868";
    x.beginPath(); x.arc(tipX, tipY, u * 0.1, 0, TAU); x.fill();
  }

  const P = new Path2D();
  P.ellipse(0, bodyY, bRX, bRY, 0, 0, TAU);
  P.ellipse(headX, headY, hR, hR * 0.94, 0, 0, TAU);
  P.moveTo(headX + hR * 0.30, headY - hR * 0.34);
  P.quadraticCurveTo(headX + nose * 1.18, headY - hR * 0.10, headX + nose * 1.10, headY + hR * 0.30);
  P.quadraticCurveTo(headX + hR * 0.50, headY + hR * 0.62, headX + hR * 0.20, headY + hR * 0.50);
  P.closePath();
  const point = g.ears / 2, earW = u * 0.13, earH = u * 0.27;
  const ear = (ex, ey, lean) => {
    const k = 1.05 - 0.45 * point;
    P.moveTo(ex - earW, ey);
    P.quadraticCurveTo(ex - earW * k, ey - earH * k, ex + lean, ey - earH * (0.95 + 0.25 * point));
    P.quadraticCurveTo(ex + earW * k, ey - earH * k, ex + earW, ey);
    P.closePath();
  };
  ear(headX - hR * 0.34, headY - hR * 0.62, -u * 0.05);
  ear(headX + hR * 0.28, headY - hR * 0.66, u * 0.03);
  P.ellipse(-bRX * 0.46, bodyY + bRY * 0.16, bRX * 0.50, bRY * 0.86, 0, 0, TAU);

  const shag = clamp((g.coat / 2 - 0.3) / 0.5, 0, 1);
  if (fine && shag > 0.05) {
    x.strokeStyle = mine ? "#2A7C93" : tint ? shade(tint, -0.15) : "#A69E8C";
    x.lineWidth = u * 0.12; x.globalAlpha = A((mine ? 0.85 : 0.5) * shag); x.lineCap = "round";
    x.beginPath(); // ten tufts, one stroke
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * TAU;
      const px = Math.cos(a) * bRX, py = bodyY + Math.sin(a) * bRY;
      x.moveTo(px * 0.82, bodyY + (py - bodyY) * 0.82); x.lineTo(px * 1.22, bodyY + (py - bodyY) * 1.34);
    }
    x.stroke();
  }

  /* the rim of light is on the sun's side, whichever way the animal faces */
  if (fine && !(mine && outline)) {
    x.save();
    x.translate(-(L.sun || -0.8) * (mine ? 1.3 : 0.9) * dir, -1.0);
    x.fillStyle = rim; x.globalAlpha = A(mine ? 1 : 0.5);
    x.fill(P);
    x.restore();
  }
  x.globalAlpha = A(mine || other ? 1 : 0.82);
  x.fillStyle = body; x.fill(P);
  if (mine && outline) outline.addPath(P, new DOMMatrix([dir, 0, 0, 1, c.x, c.y]));
  else if (mine) {
    x.strokeStyle = "#08333F"; x.globalAlpha = A(0.5); x.lineWidth = u * 0.07; x.stroke(P);
    /* a soft light on the back */
    x.globalAlpha = A(0.22 * (1 - L.night));
    x.fillStyle = "#FFE9C0";
    x.beginPath(); x.ellipse(-bRX * 0.1, bodyY - bRY * 0.45, bRX * 0.55, bRY * 0.28, 0, 0, TAU); x.fill();
  }

  leg(bRX * 0.52, 0, dark);
  leg(-bRX * 0.46, Math.PI, dark);

  const hook = clamp((g.claws / 2 - 0.35) / 0.35, 0, 1);
  if (mine && hook > 0) {
    x.globalAlpha = A(hook); x.strokeStyle = "#F4EBD6"; x.lineWidth = u * 0.06; x.lineCap = "round";
    x.beginPath(); x.moveTo(bRX * 0.52 + fw * 0.6, -u * 0.02); x.quadraticCurveTo(bRX * 0.52 + fw * 0.95, -u * 0.02, bRX * 0.52 + fw * 0.9, u * 0.08); x.stroke();
  }

  if (!gray && fine) {
    const eR = u * (0.07 + g.eyes * 0.055);
    x.globalAlpha = A(1);
    x.fillStyle = mine ? "#F6F4EA" : "#EFEAD9";
    x.beginPath(); x.arc(headX + hR * 0.30, headY - hR * 0.10, eR, 0, TAU); x.fill();
    x.fillStyle = mine ? "#08333F" : "#3B372B";
    x.beginPath(); x.arc(headX + hR * 0.36, headY - hR * 0.08, eR * 0.55, 0, TAU); x.fill();
  }
  x.restore();

  if (swim) {
    swimming(x, c, u, waterline, dir, now, A);
  } else if (perched) leavesInFront(x, c, u, A);
  /* wading: the shallows cover its feet, with a ring of ripples */
  else if (c.wet) {
    x.globalAlpha = A(0.72); x.fillStyle = "rgb(150,196,204)";
    x.beginPath(); x.ellipse(c.x, c.y - u * 0.04, u * 1.18, u * 0.3, 0, 0, TAU); x.fill();
    x.globalAlpha = A(0.65); x.strokeStyle = "#F4FBFF"; x.lineWidth = 1.2;
    x.beginPath(); x.ellipse(c.x, c.y, u * (1.3 + 0.08 * Math.sin(now * 0.003 + c.id)), u * 0.36, 0, 0, TAU); x.stroke();
  }

  const midY = c.y + bodyY;
  /* a fading member of your group: a little light rises from it */
  if (mine && alpha < 1) {
    const k = 1 - alpha, sp = speckSprite();
    for (let i = 0; i < 3; i++) {
      x.globalAlpha = Math.sin(Math.PI * clamp(k * 1.2 - i * 0.12, 0, 1)) * 0.8;
      x.drawImage(sp, c.x + (i - 1) * u * 0.5 - 5, midY - k * u * (2.2 + i * 0.5) - 5, 10, 10);
    }
  }
  if (glowAt !== null && alpha === 1) drawMark(x, c, u, midY, now, L.night, glowAt);
  x.globalAlpha = 1;
}

/**
 * @typedef {Object} Animal
 * @property {number} id engine individual id
 * @property {number} zone engine zone index
 */
