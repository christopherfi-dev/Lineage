/**
 * The animals on the canvas: exactly one visual animal per living engine
 * individual, keyed by the engine id.
 *
 * What is real (engine): who exists, which habitat each animal uses, every
 * birth and which mother it came from, every death, every mutation at birth,
 * and the body each animal is drawn with.
 *
 * What is visual only (this file's own seeded generator): where on the map an
 * animal stands and how it wanders between generations.
 */

import { TAU, clamp, mulberry, BANDS } from "./world.js";
import { TRAIT_INDEX } from "./engine.js";

const T = TRAIT_INDEX;
const GROW_MS = 900;   // a newborn grows in
const BABY_MS = 7000;  // and stays a little smaller for a while, beside its mother
const FADE_MS = 1500;  // a death fades softly, a little light rising from it

/** A glowing newborn (the calm rule is story.js): its ring of light opens over BLOOM_MS, with sparkles, then breathes. */
const BLOOM_MS = 3400;

/** Colours for groups on the map beside yours: "the others here" in a fair test is the first. */
export const GROUP_COLORS = ["#C8643A", "#7A5AB8", "#B84C80"];


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
    /** Idle motion (tail flicks, looking around) from a generator of its own, so wandering stays as it was. */
    this.moveRnd = mulberry(seed ^ 0x2c1b3c6d);
    this.mr = (a, b) => a + this.moveRnd() * (b - a);
    /** @type {Map<number, Animal>} */
    this.animals = new Map();
    /** @type {Animal[]} dead animals shrinking away */
    this.fading = [];
    /** @type {Set<number>} your group */
    this.followed = new Set();
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
  }

  make(id, zone, genome, x, y, home, bornAt) {
    return {
      id, zone, band: BANDS[zone], looks: looksFrom(genome),
      x, y, vx: this.rr(-.2, .2), vy: this.rr(-.2, .2),
      home, inZone: this.world.zoneAt(x, y) === BANDS[zone],
      ph: this.rr(0, TAU), face: this.rnd() < .5 ? -1 : 1,
      mode: "walk", modeT: this.rr(600, 4200),
      bornAt, diedAt: null, growMs: GROW_MS / this.pace, fadeMs: FADE_MS,
    };
  }

  /**
   * Lay out the generation-0 founders: each founding family is one loose
   * cluster in its own habitat band.
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
      for (const id of fam.ids) {
        const ind = bridge.get(id);
        const p = this.world.pointIn(fam.zone, this.rnd, { x: best.x, y: best.y, radius: 170 });
        this.animals.set(id, this.make(id, fam.zone, ind.bodyGenome, p.x, p.y, { x: p.x, y: p.y }, -1e9));
      }
    }
    return centers;
  }

  /**
   * Apply one generation's engine events to the canvas. Call before
   * `followed` is updated to the new generation.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @param {import("./bridge.js").Bridge} bridge
   * @param {number} now ms clock
   */
  applyGeneration(ev, bridge, now) {
    // Real deaths: the animal leaves the canvas, in the colour it lived in.
    for (const d of ev.deaths) {
      const a = this.animals.get(d.id);
      if (!a) continue;
      this.animals.delete(d.id);
      a.diedAt = now;
      a.fadeMs = FADE_MS / this.pace;
      a.wasFollowed = this.followed.has(a.id);
      a.wasFollowing = this.following;
      a.wasMarked = this.marks.get(a.id) ?? null;
      this.fading.push(a);
    }
    // Real births: each newborn appears beside its mother (the first parent in its birth record),
    // and makes its home near hers.
    for (const b of ev.births) {
      const child = bridge.get(b.childId);
      if (!child) continue;
      const zone = bridge.zoneOf(b.childId);
      const mother = this.animals.get(b.parentAId) ?? null;
      const near = mother ? mother.home : this.world.pointIn(zone, this.placeRnd);
      const home = this.world.pointIn(zone, this.placeRnd, { x: near.x, y: near.y, radius: 46 });
      const at = mother ?? home;
      const a = this.make(b.childId, zone, child.bodyGenome, at.x + this.rr(-4, 4), at.y + this.rr(-3, 3), home, now);
      if (mother) a.face = mother.face;
      this.animals.set(b.childId, a);
    }
    // Which newborns glow is the story's calm rule (story.js); the page sets `glowing`.
  }

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
    for (const id of ids) { const a = this.animals.get(id); if (a) { sx += a.x; sy += a.y; n++; } }
    return n ? { x: sx / n, y: sy / n, n } : null;
  }

  /**
   * Where most of a group stands: the centre of the members within `radius`
   * of the member with the most members around her. Null when none are alive.
   */
  largestCluster(ids, radius = 240) {
    const pts = [];
    for (const id of ids) { const a = this.animals.get(id); if (a) pts.push(a); }
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

  /** Nearest living animal to a world point, within reach of a fingertip. */
  hit(wx, wy) {
    let best = null, bd = 1e9;
    for (const a of this.animals.values()) {
      const d = Math.hypot(a.x - wx, (a.y - 11) - wy) - (this.glowing.has(a.id) ? 12 : this.followed.has(a.id) ? 6 : 0);
      if (d < bd) { bd = d; best = a; }
    }
    return best && bd < 34 ? best : null;
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
      c.ph += dt * (c.mode === "walk" ? 0.0062 : 0.0021);
      c.modeT -= dt;
      if (c.modeT <= 0) {
        const r = this.rnd();
        c.mode = r < 0.58 ? "walk" : r < 0.85 ? "pause" : "graze";
        c.modeT = c.mode === "walk" ? this.rr(2200, 7000) : this.rr(900, 3200);
      }
      if (!c.inZone) {
        // A newborn whose habitat differs from where it was born walks there.
        const dx = c.home.x - c.x, dy = c.home.y - c.y, d = Math.hypot(dx, dy) || 1;
        c.vx += dx / d * 0.12 * s; c.vy += dy / d * 0.12 * s;
        const sp = Math.hypot(c.vx, c.vy), max = clamp(d / 200, 2.4, 5); // long walks hurry
        if (sp > max) { c.vx = c.vx / sp * max; c.vy = c.vy / sp * max; }
        c.x += c.vx * s; c.y += c.vy * s;
        if (this.world.zoneAt(c.x, c.y) === c.band || d < 6) c.inZone = true;
        if (Math.abs(c.vx) > 0.05) c.face = c.vx > 0 ? 1 : -1;
        continue;
      }
      this.idle(c, dt, now);
      const drive = c.mode === "walk" ? 1 : 0.12;
      c.vx += this.rr(-1, 1) * 0.013 * drive * s + (c.home.x - c.x) * 0.000048 * s;
      c.vy += this.rr(-1, 1) * 0.013 * drive * s + (c.home.y - c.y) * 0.000048 * s;
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
      // Each animal stays in the habitat its inherited time allocation gives it.
      if (this.world.zoneAt(c.x, c.y) !== c.band) { c.x = px; c.y = py; c.vx *= -0.6; c.vy *= -0.6; }
      c.x = clamp(c.x, 20, W - 20); c.y = clamp(c.y, 20, H - 20);
      if (c.mode !== "pause" && Math.abs(c.vx) > 0.05) c.face = c.vx > 0 ? 1 : -1;
    }
    this.fading = this.fading.filter((a) => now - a.diedAt < a.fadeMs);
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
    for (const c of this.animals.values()) if (inView(c)) vis.push(c);
    for (const c of this.fading) if (inView(c)) vis.push(c);
    const marksOf = (c) => (c.diedAt !== null ? c.wasMarked : this.marks.get(c.id)) ?? null;
    const style = (c) => {
      const following = c.diedAt !== null ? c.wasFollowing : this.following;
      const mine = c.diedAt !== null ? c.wasFollowed : this.followed.has(c.id);
      return mine ? "mine" : marksOf(c) ? "other" : following ? "gray" : "plain";
    };
    const lifeOf = (c) => {
      if (c.diedAt !== null) return clamp(1 - (now - c.diedAt) / c.fadeMs, 0, 1);
      const age = now - c.bornAt, baby = BABY_MS / this.pace;
      if (age < c.growMs) return 0.35 + 0.35 * clamp(age / c.growMs, 0, 1);
      if (age < baby) return 0.7 + 0.3 * (age - c.growMs) / (baby - c.growMs);
      return 1;
    };
    // Under your animals: a soft warm glow, a little stronger at night and when the group grows.
    if (minePass && this.following) {
      const sprite = glowSprite(), r = sprite.width / 2;
      const k = (0.8 + 0.9 * L.night) * (1 + 0.35 * Math.max(0, this.mood) - 0.3 * Math.max(0, -this.mood));
      for (const c of vis) {
        if (c.diedAt !== null || !this.followed.has(c.id)) continue;
        x.globalAlpha = clamp(lifeOf(c) * k, 0, 1);
        x.drawImage(sprite, c.x - r, c.y - 12 - r);
      }
      x.globalAlpha = 1;
    }
    if (worldPass) for (const c of vis) {
      const colors = marksOf(c);
      if (!colors) continue;
      const life = c.diedAt !== null ? lifeOf(c) : 1, rx = 13;
      colors.forEach((col, k) => {
        x.beginPath(); x.ellipse(c.x, c.y + 1, rx + 5 * k, (rx + 5 * k) * 0.38, 0, 0, TAU);
        x.globalAlpha = 0.24 * life; x.fillStyle = col; if (k === 0) x.fill();
        x.globalAlpha = 0.8 * life; x.strokeStyle = col; x.lineWidth = 1.8; x.stroke();
      });
      x.globalAlpha = 1;
    }
    // The others here live among your animals (a fair test), so the two are drawn together by depth.
    const rank = { gray: 0, plain: 1, other: 2, mine: 2 };
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
      drawCreature(x, c, st, dying ? 0.9 + 0.1 * life : life, marksOf(c)?.[0], now, L, dying ? life : 1, glowAt);
    }
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
 * a few sparkles drifting up, then settles into a slow breathing ring for the
 * rest of the day. A quiet mark: a small speck of light above the back.
 */
function drawMark(x, c, u, midY, now, night, glowAt) {
  {
    const t = (now - glowAt) / BLOOM_MS;
    const open = 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const breathe = (Math.sin(now * 0.0024 + c.id) + 1) / 2;
    const rad = u * (0.9 + 1.2 * open) + (t >= 1 ? breathe * u * 0.1 : 0);
    const g = bloomSprite(), R = rad * 2.2;
    x.globalAlpha = t < 1 ? 0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.2)) * 0.8 + 0.2 * open : 0.32 + 0.14 * breathe;
    x.drawImage(g, c.x - R, midY - R, 2 * R, 2 * R);
    x.strokeStyle = night > 0.5 ? "#FFF0C8" : "#FFE2A2";
    x.lineWidth = 2.2;
    x.globalAlpha = t < 1 ? 0.95 - 0.4 * open : 0.42 + 0.14 * breathe;
    x.beginPath(); x.ellipse(c.x, midY, rad, rad * 0.92, 0, 0, TAU); x.stroke();
    if (t < 1) {
      x.lineWidth = 1.2; x.globalAlpha = 0.5 * (1 - open);
      x.beginPath(); x.ellipse(c.x, midY, rad * 1.3, rad * 1.2, 0, 0, TAU); x.stroke();
    }
    // A few sparkles drift up and fade.
    if (t < 1.9) {
      x.fillStyle = "#FFF4D6";
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
    x.globalAlpha = 1;
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
 * the ground; "other" — a group you did not choose, in its colour; "gray" —
 * everyone else while you follow a group, smaller and faded; "plain" — everyone
 * while you have no group. One animal drawn large is creature.js.
 * @param {CanvasRenderingContext2D} x
 * @param {string} [color] an "other" animal's group colour
 * @param {{sun:number, low:number, night:number}} L the light now
 * @param {number} alpha 1, or less while a death fades
 * @param {null|number} [glowAt] when this newborn began to glow (a new variation you can follow), else null
 */
function drawCreature(x, c, style, scale, color, now, L, alpha, glowAt = null) {
  const g = c.looks;
  const mine = style === "mine", gray = style === "gray";
  const other = style === "other" && !!color;
  const fade = (gray ? 0.9 : 1) * alpha;
  const A = (a) => a * fade;
  const u = (mine ? 11.6 : gray ? 7.4 : 8.4) * (0.84 + g.bodySize * 0.20) * scale;
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
  const web = gray ? 0 : clamp((g.feet / 2 - 0.2) / 0.45, 0, 1);

  /* the shadow leans away from the sun, long when the sun is low */
  const lean = -L.sun * (0.25 + 0.75 * L.low), stretch = 1 + 0.55 * L.low * Math.abs(L.sun);
  x.globalAlpha = A((mine ? 0.28 : 0.15) * (1 - 0.6 * L.night));
  x.fillStyle = "#2E2616";
  x.beginPath(); x.ellipse(c.x + u * (0.1 + 0.75 * lean), c.y + u * 0.06, u * 1.05 * stretch, u * 0.28, 0, 0, TAU); x.fill();
  /* your animals: a light ring on the ground, the non-colour sign of your group */
  if (mine) {
    x.globalAlpha = A(0.6 * Math.min(1, scale + 0.2));
    x.strokeStyle = L.night > 0.5 ? "#D6F0F6" : "#FFF3D6"; x.lineWidth = 1.5;
    x.beginPath(); x.ellipse(c.x, c.y + 1, u * 1.3, u * 0.42, 0, 0, TAU); x.stroke();
  }

  x.save();
  x.translate(c.x, c.y);
  x.scale(dir, 1);

  const body = shade(mine ? "#237089" : other ? color : "#8E8574", (g.shade - 0.5) * (mine ? 0.6 : 0.4));
  const dark = mine ? "#0E4051" : other ? shade(color, -0.45) : "#7C7463";
  const far = mine ? "#15546A" : other ? shade(color, -0.25) : "#807867";
  const rim = mine ? (L.night > 0.5 ? "#BDE8F2" : "#FFDDA4") : other ? shade(color, 0.5) : "#C4B9A0";
  const webCol = mine ? "#F2C7B8" : other ? shade(color, 0.65) : "#D9D2BE";

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
  if (shag > 0.05) {
    x.strokeStyle = mine ? "#2A7C93" : other ? shade(color, -0.15) : "#A69E8C";
    x.lineWidth = u * 0.12; x.globalAlpha = A((mine ? 0.85 : 0.5) * shag); x.lineCap = "round";
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * TAU;
      const px = Math.cos(a) * bRX, py = bodyY + Math.sin(a) * bRY;
      x.beginPath(); x.moveTo(px * 0.82, bodyY + (py - bodyY) * 0.82); x.lineTo(px * 1.22, bodyY + (py - bodyY) * 1.34); x.stroke();
    }
  }

  /* the rim of light is on the sun's side, whichever way the animal faces */
  x.save();
  x.translate(-(L.sun || -0.8) * (mine ? 1.3 : 0.9) * dir, -1.0);
  x.fillStyle = rim; x.globalAlpha = A(mine ? 1 : 0.5);
  x.fill(P);
  x.restore();
  x.globalAlpha = A(mine || other ? 1 : 0.82);
  x.fillStyle = body; x.fill(P);
  if (mine) {
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

  if (!gray) {
    const eR = u * (0.07 + g.eyes * 0.055);
    x.globalAlpha = A(1);
    x.fillStyle = mine ? "#F6F4EA" : "#EFEAD9";
    x.beginPath(); x.arc(headX + hR * 0.30, headY - hR * 0.10, eR, 0, TAU); x.fill();
    x.fillStyle = mine ? "#08333F" : "#3B372B";
    x.beginPath(); x.arc(headX + hR * 0.36, headY - hR * 0.08, eR * 0.55, 0, TAU); x.fill();
  }
  x.restore();

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
