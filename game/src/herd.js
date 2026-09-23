/**
 * The animals on the canvas: exactly one visual animal per living engine
 * individual, keyed by the engine id.
 *
 * What is real (engine): who exists, which habitat each animal uses, every
 * birth and which parents it came from, every death, every mutation at birth,
 * and the body each animal is drawn with.
 *
 * What is visual only (this file's own seeded generator): where on the map an
 * animal stands and how it wanders between generations.
 */

import { TAU, clamp, mulberry, BANDS } from "./world.js";
import { TRAIT_INDEX } from "./engine.js";

const T = TRAIT_INDEX;
const GROW_MS = 900;   // a newborn grows in
const FADE_MS = 700;   // a death shrinks away
const FAMILY = 10;     // founders per starting cluster

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
    /** @type {Map<number, Animal>} */
    this.animals = new Map();
    /** @type {Animal[]} dead animals shrinking away */
    this.fading = [];
    /** @type {Set<number>} */
    this.followed = new Set();
  }

  make(id, zone, genome, x, y, home, bornAt) {
    return {
      id, zone, band: BANDS[zone], looks: looksFrom(genome),
      x, y, vx: this.rr(-.2, .2), vy: this.rr(-.2, .2),
      home, inZone: this.world.zoneAt(x, y) === BANDS[zone],
      ph: this.rr(0, TAU), face: this.rnd() < .5 ? -1 : 1,
      mode: "walk", modeT: this.rr(600, 4200),
      flash: 0, flashT: 0,
      bornAt, diedAt: null,
    };
  }

  /**
   * Lay out the generation-0 founders: a few loose family clusters in each
   * founder's own habitat band.
   * @param {import("./bridge.js").Bridge} bridge
   */
  placeFounders(bridge) {
    const byZone = [[], [], []];
    for (const ind of bridge.living) byZone[bridge.zoneOf(ind.id)].push(ind);
    const centers = [];
    for (let zone = 0; zone < 3; zone++) {
      const list = byZone[zone].sort((a, b) => a.id - b.id);
      for (let k = 0; k < list.length; k += FAMILY) {
        let best = null, bestGap = -1;
        for (let t = 0; t < 40; t++) {
          const p = this.world.pointIn(zone, this.rnd);
          const gap = centers.reduce((m, c) => Math.min(m, Math.hypot(c.x - p.x, c.y - p.y)), 1e9);
          if (gap > bestGap) { best = p; bestGap = gap; }
          if (gap > 480) break;
        }
        centers.push(best);
        for (const ind of list.slice(k, k + FAMILY)) {
          const p = this.world.pointIn(zone, this.rnd, { x: best.x, y: best.y, radius: 170 });
          this.animals.set(ind.id, this.make(ind.id, zone, ind.bodyGenome, p.x, p.y, { x: p.x, y: p.y }, -1e9));
        }
      }
    }
  }

  /**
   * Apply one generation's engine events to the canvas.
   * @param {import("./bridge.js").GenerationEvents} ev
   * @param {import("./bridge.js").Bridge} bridge
   * @param {number} now ms clock
   */
  applyGeneration(ev, bridge, now) {
    // Real deaths: the animal leaves the canvas.
    for (const d of ev.deaths) {
      const a = this.animals.get(d.id);
      if (!a) continue;
      this.animals.delete(d.id);
      a.diedAt = now;
      a.wasFollowed = this.followed.has(a.id); // it leaves in the colour it lived in
      this.fading.push(a);
    }
    // Flash ages by one generation: newest -> dim, dim -> gone.
    for (const a of this.animals.values()) {
      if (a.flash === 2) a.flash = 0; else if (a.flash === 1) a.flash = 2;
    }
    // Real births: each newborn appears beside one of its two real parents.
    for (const b of ev.births) {
      const child = bridge.get(b.childId);
      if (!child) continue;
      const zone = bridge.zoneOf(b.childId);
      const parent = this.pickParent(b, zone, bridge.isFollowed(b.childId));
      const at = parent ?? this.world.pointIn(zone, this.rnd);
      const home = this.world.pointIn(zone, this.rnd, { x: at.x, y: at.y, radius: 46 });
      const a = this.make(b.childId, zone, child.bodyGenome, at.x + this.rr(-4, 4), at.y + this.rr(-3, 3), home, now);
      if (parent) a.face = parent.face;
      this.animals.set(b.childId, a);
    }
    // Real mutations at birth: that newborn flashes.
    for (const m of ev.mutations) {
      const a = this.animals.get(m.childId);
      if (!a) continue;
      a.flash = 1; a.flashT = 0;
    }
  }

  /**
   * Prefer the parent whose habitat is nearest the child's (the bands lie in
   * engine zone order); then one in your group.
   */
  pickParent(birth, zone, childFollowed) {
    const ps = [this.animals.get(birth.parentAId), this.animals.get(birth.parentBId)].filter(Boolean);
    if (ps.length === 0) return null;
    const gap = (p) => Math.abs(p.zone - zone);
    const nearest = Math.min(...ps.map(gap));
    const pool = ps.filter((p) => gap(p) === nearest);
    if (childFollowed) {
      const mine = pool.find((p) => this.followed.has(p.id));
      if (mine) return mine;
    }
    return pool[0];
  }

  /** Centre of your group on the map, or null when none are alive. */
  followedCentroid() {
    let sx = 0, sy = 0, n = 0;
    for (const a of this.animals.values()) if (this.followed.has(a.id)) { sx += a.x; sy += a.y; n++; }
    return n ? { x: sx / n, y: sy / n, n } : null;
  }

  /** Nearest living animal to a world point, within reach of a fingertip. */
  hit(wx, wy) {
    let best = null, bd = 1e9;
    for (const a of this.animals.values()) {
      const d = Math.hypot(a.x - wx, (a.y - 11) - wy) - (this.followed.has(a.id) ? 6 : 0);
      if (d < bd) { bd = d; best = a; }
    }
    return best && bd < 34 ? best : null;
  }

  /* ================= wandering (visual only) ================= */
  tick(dt, now) {
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
        const sp = Math.hypot(c.vx, c.vy), max = 2.4;
        if (sp > max) { c.vx = c.vx / sp * max; c.vy = c.vy / sp * max; }
        c.x += c.vx * s; c.y += c.vy * s;
        if (this.world.zoneAt(c.x, c.y) === c.band || d < 6) c.inZone = true;
        if (Math.abs(c.vx) > 0.05) c.face = c.vx > 0 ? 1 : -1;
        continue;
      }
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
      if (Math.abs(c.vx) > 0.05) c.face = c.vx > 0 ? 1 : -1;
    }
    for (const c of this.animals.values()) if (c.flash) c.flashT += dt;
    this.fading = this.fading.filter((a) => now - a.diedAt < FADE_MS);
  }

  /* ================= drawing ================= */
  /**
   * @param {CanvasRenderingContext2D} x
   * @param {{x:number,y:number,w:number,h:number}} view visible world rect
   * @param {number} now
   */
  draw(x, view, now) {
    const m = 70, vis = [];
    const inView = (c) => !(c.x < view.x - m || c.x > view.x + view.w + m || c.y < view.y - m || c.y > view.y + view.h + m);
    for (const c of this.animals.values()) if (inView(c)) vis.push(c);
    for (const c of this.fading) if (inView(c)) vis.push(c);
    const mine = (c) => (c.diedAt !== null ? c.wasFollowed : this.followed.has(c.id));
    vis.sort((a, b) => (mine(a) ? 1 : 0) - (mine(b) ? 1 : 0) || a.y - b.y);
    for (const c of vis) {
      let life = 1;
      if (c.diedAt !== null) life = clamp(1 - (now - c.diedAt) / FADE_MS, 0, 1);
      else if (now - c.bornAt < GROW_MS) life = 0.35 + 0.65 * clamp((now - c.bornAt) / GROW_MS, 0, 1);
      if (life > 0) drawCreature(x, c, mine(c), life);
    }
  }
}

/**
 * World-scale creature, ported from the mockup's drawCreature with the
 * design's defaults (halo ring, gray presence 1, creature scale 1).
 * @param {CanvasRenderingContext2D} x
 */
function drawCreature(x, c, mine, scale) {
  const g = c.looks;
  /* side-on figures, flipped by travel direction: at 25px a rotating
     top-down silhouette reads as an insect, a standing animal doesn't. */
  const u = (mine ? 9.6 : 7.5) * (0.84 + g.bodySize * 0.20) * scale;
  const dir = c.face || 1;
  const gp = 1;
  const walk = c.mode === "walk" || !c.inZone;
  const ph = c.ph * 2.0;
  const bob = walk ? Math.abs(Math.sin(ph)) * u * 0.09 : 0;
  const legL = u * (0.34 + g.legLength * 0.30);
  const bRX = u * 0.80, bRY = u * 0.50, hR = u * 0.47;
  const bodyY = -(legL + bRY) - bob;
  const headX = bRX * 0.74, headY = bodyY - bRY * 0.52 - hR * 0.42;
  const nose = hR * (0.78 + g.snout * 0.20);

  x.globalAlpha = mine ? 0.26 : 0.14 * gp;
  x.fillStyle = "#332F1E";
  x.beginPath(); x.ellipse(c.x + u * 0.10, c.y + u * 0.06, u * 1.05, u * 0.30, 0, 0, TAU); x.fill();
  x.globalAlpha = 1;

  x.save();
  x.translate(c.x, c.y);
  x.scale(dir, 1);

  const body = mine ? "#1A657E" : "#8E8574";
  const dark = mine ? "#0C3B4D" : "#7C7463";
  const far = mine ? "#124F65" : "#807867";
  const rim = mine ? "#8FD2E6" : "#BAB29C";

  const fw = u * (0.15 + 0.095 * g.feet);
  const legW = mine ? u * 0.15 : u * 0.12;
  const leg = (px, phase, col) => {
    const sw = walk ? Math.sin(ph + phase) * legL * 0.40 : 0;
    const lift = walk ? Math.max(0, Math.sin(ph + phase)) * u * 0.11 : 0;
    x.strokeStyle = col; x.lineWidth = legW; x.lineCap = "round";
    x.beginPath(); x.moveTo(px, bodyY + bRY * 0.55); x.lineTo(px + sw, -lift); x.stroke();
    x.beginPath(); x.moveTo(px + sw - fw * 0.30, -lift); x.lineTo(px + sw + fw * 0.70, -lift); x.stroke();
  };
  /* far pair */
  leg(bRX * 0.50 - u * 0.16, Math.PI, far);
  leg(-bRX * 0.52 - u * 0.16, 0, far);

  /* tail */
  const tl = u * (0.22 + g.tail * 0.36);
  const sway = Math.sin(c.ph * 1.7) * u * 0.16;
  x.strokeStyle = dark; x.lineCap = "round"; x.lineWidth = mine ? u * 0.13 : u * 0.11;
  x.beginPath();
  x.moveTo(-bRX * 0.84, bodyY + bRY * 0.10);
  x.quadraticCurveTo(-bRX * 0.84 - tl * 0.95, bodyY + tl * 0.10 + sway, -bRX * 0.70 - tl * 1.00, bodyY - tl * 0.72 + sway);
  x.stroke();

  /* one silhouette: body, head, muzzle, ears */
  const P = new Path2D();
  P.ellipse(0, bodyY, bRX, bRY, 0, 0, TAU);
  P.ellipse(headX, headY, hR, hR * 0.94, 0, 0, TAU);
  P.moveTo(headX + hR * 0.30, headY - hR * 0.34);
  P.quadraticCurveTo(headX + nose * 1.18, headY - hR * 0.10, headX + nose * 1.10, headY + hR * 0.30);
  P.quadraticCurveTo(headX + hR * 0.50, headY + hR * 0.62, headX + hR * 0.20, headY + hR * 0.50);
  P.closePath();
  if (g.ears > 0.15) {
    const er = u * (0.09 + g.ears * 0.085);
    P.ellipse(headX - hR * 0.30, headY - hR * 0.86, er * 0.78, er, -0.25, 0, TAU);
    P.ellipse(headX + hR * 0.34, headY - hR * 0.80, er * 0.72, er * 0.9, 0.18, 0, TAU);
  }
  /* haunch */
  P.ellipse(-bRX * 0.46, bodyY + bRY * 0.16, bRX * 0.50, bRY * 0.86, 0, 0, TAU);

  /* shaggy coat grows in with dense fur */
  const shag = clamp(g.coat - 1, 0, 1);
  if (shag > 0.05) {
    x.strokeStyle = mine ? "#1E7086" : "#A69E8C";
    x.lineWidth = u * 0.12; x.globalAlpha = (mine ? 0.85 : 0.5) * shag; x.lineCap = "round";
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * TAU;
      const px = Math.cos(a) * bRX, py = bodyY + Math.sin(a) * bRY;
      x.beginPath(); x.moveTo(px * 0.82, bodyY + (py - bodyY) * 0.82); x.lineTo(px * 1.22, bodyY + (py - bodyY) * 1.34); x.stroke();
    }
    x.globalAlpha = 1;
  }

  /* sunlit rim holds its world direction through the flip */
  x.save();
  x.translate(-0.9 * dir, -1.0);
  x.fillStyle = rim; x.globalAlpha = mine ? 0.95 : 0.5 * gp;
  x.fill(P);
  x.restore();
  x.globalAlpha = mine ? 1 : Math.min(1, 0.82 * gp);
  x.fillStyle = body; x.fill(P);
  x.globalAlpha = 1;
  if (mine) { x.strokeStyle = "#08333F"; x.globalAlpha = 0.42; x.lineWidth = u * 0.075; x.stroke(P); x.globalAlpha = 1; }

  /* near pair, on top of the body */
  leg(bRX * 0.52, 0, dark);
  leg(-bRX * 0.46, Math.PI, dark);

  if (mine) {
    const eR = u * (0.085 + g.eyes * 0.036);
    x.fillStyle = "#F0FAFC";
    x.beginPath(); x.arc(headX + hR * 0.30, headY - hR * 0.10, eR, 0, TAU); x.fill();
    x.fillStyle = "#08333F";
    x.beginPath(); x.arc(headX + hR * 0.36, headY - hR * 0.08, eR * 0.55, 0, TAU); x.fill();
  }
  x.restore();

  const midY = c.y + bodyY;
  if (mine) {
    /* halo ring — the non-colour lineage indicator */
    x.strokeStyle = "#1E7E9C"; x.globalAlpha = 0.44; x.lineWidth = 1.7;
    x.beginPath(); x.ellipse(c.x, midY, u * 1.58, u * 1.46, 0, 0, TAU); x.stroke();
    x.globalAlpha = 1;
  }

  /* mutation flash: this generation's bright, last generation's dim */
  if (c.flash) {
    const puls = (Math.sin((c.flashT || 0) * 0.0042) + 1) / 2;
    const newest = c.flash === 1;
    const a = newest ? 0.36 + puls * 0.44 : 0.12 + puls * 0.08;
    const rad = newest ? u * (2.0 + puls * 1.2) : u * 1.95;
    if (newest) {
      const grd = x.createRadialGradient(c.x, midY, 0, c.x, midY, rad * 1.7);
      grd.addColorStop(0, "rgba(255,214,138," + (0.24 * a).toFixed(3) + ")");
      grd.addColorStop(1, "rgba(255,214,138,0)");
      x.fillStyle = grd;
      x.beginPath(); x.arc(c.x, midY, rad * 1.7, 0, TAU); x.fill();
    }
    x.strokeStyle = "#FFCE70"; x.globalAlpha = a; x.lineWidth = newest ? 2.8 : 1.4;
    x.beginPath(); x.ellipse(c.x, midY, rad, rad * 0.92, 0, 0, TAU); x.stroke();
    x.globalAlpha = 1;
  }
}

/**
 * @typedef {Object} Animal
 * @property {number} id engine individual id
 * @property {number} zone engine zone index
 */
