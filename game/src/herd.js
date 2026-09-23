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
const FADE_MS = 700;   // a death shrinks away

/** Flash states. Your family keeps two: its newest flash bright, the one before dim. */
const FLASH_NEWEST = 1, FLASH_PREVIOUS = 2, FLASH_OTHER = 3;

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
    /** @type {Map<number, Animal>} */
    this.animals = new Map();
    /** @type {Animal[]} dead animals shrinking away */
    this.fading = [];
    /** @type {Set<number>} your family */
    this.followed = new Set();
    /** false while you have no family: everyone is drawn plainly */
    this.following = false;
    /** how fast the world moves: 1 while watching, faster in a fast-forward */
    this.pace = 1;
  }

  make(id, zone, genome, x, y, home, bornAt) {
    return {
      id, zone, band: BANDS[zone], looks: looksFrom(genome),
      x, y, vx: this.rr(-.2, .2), vy: this.rr(-.2, .2),
      home, inZone: this.world.zoneAt(x, y) === BANDS[zone],
      ph: this.rr(0, TAU), face: this.rnd() < .5 ? -1 : 1,
      mode: "walk", modeT: this.rr(600, 4200),
      flash: 0, flashT: 0,
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
      this.fading.push(a);
    }
    // Real births: each newborn appears beside its mother (the first parent in its birth record).
    for (const b of ev.births) {
      const child = bridge.get(b.childId);
      if (!child) continue;
      const zone = bridge.zoneOf(b.childId);
      const mother = this.animals.get(b.parentAId) ?? null;
      const at = mother ?? this.world.pointIn(zone, this.rnd);
      const home = this.world.pointIn(zone, this.rnd, { x: at.x, y: at.y, radius: 46 });
      const a = this.make(b.childId, zone, child.bodyGenome, at.x + this.rr(-4, 4), at.y + this.rr(-3, 3), home, now);
      if (mother) a.face = mother.face;
      this.animals.set(b.childId, a);
    }
    // Real mutations at birth. In your family: newest bright, the one before dim, older gone.
    // Elsewhere a newborn with a mutation glows faintly for its first generation.
    for (const a of this.animals.values()) if (a.flash === FLASH_OTHER) a.flash = 0;
    const mine = ev.mutations.filter((m) => bridge.isFollowed(m.childId));
    if (mine.length) {
      for (const a of this.animals.values()) {
        if (a.flash === FLASH_PREVIOUS) a.flash = 0;
        else if (a.flash === FLASH_NEWEST) a.flash = FLASH_PREVIOUS;
      }
    }
    for (const m of ev.mutations) {
      const a = this.animals.get(m.childId);
      if (!a) continue;
      a.flash = bridge.isFollowed(m.childId) ? FLASH_NEWEST : FLASH_OTHER;
      a.flashT = 0;
    }
  }

  /** A newly followed group starts with no flash history of its own. */
  resetFlashes() {
    for (const a of this.animals.values()) if (a.flash === FLASH_NEWEST || a.flash === FLASH_PREVIOUS) a.flash = 0;
  }

  /** Centre of a set of animals on the map, or null when none are alive. */
  centroidOf(ids) {
    let sx = 0, sy = 0, n = 0;
    for (const id of ids) { const a = this.animals.get(id); if (a) { sx += a.x; sy += a.y; n++; } }
    return n ? { x: sx / n, y: sy / n, n } : null;
  }

  followedCentroid() { return this.centroidOf(this.followed); }

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
    this.fading = this.fading.filter((a) => now - a.diedAt < a.fadeMs);
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
    const style = (c) => {
      const following = c.diedAt !== null ? c.wasFollowing : this.following;
      const mine = c.diedAt !== null ? c.wasFollowed : this.followed.has(c.id);
      return mine ? "mine" : following ? "gray" : "plain";
    };
    const rank = { gray: 0, plain: 1, mine: 2 };
    vis.sort((a, b) => rank[style(a)] - rank[style(b)] || a.y - b.y);
    for (const c of vis) {
      let life = 1;
      if (c.diedAt !== null) life = clamp(1 - (now - c.diedAt) / c.fadeMs, 0, 1);
      else if (now - c.bornAt < c.growMs) life = 0.35 + 0.65 * clamp((now - c.bornAt) / c.growMs, 0, 1);
      if (life > 0) drawCreature(x, c, style(c), life);
    }
  }
}

/** Mix a #rrggbb colour toward white (k > 0) or black (k < 0). */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), to = k > 0 ? 255 : 0, a = Math.abs(k);
  const ch = (v) => Math.round(v + (to - v) * a);
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

/**
 * World-scale creature, ported from the mockup's drawCreature (halo ring,
 * creature scale 1). Styles: "mine" — your family, larger, sharper and with
 * detail; "gray" — everyone else while you follow a family, smaller and faded;
 * "plain" — everyone while you have no family; "portrait" — one animal drawn
 * large on a card, with your family's detail but no halo.
 * @param {CanvasRenderingContext2D} x
 * @param {Object} [parts] filled with where each body part is, for a portrait
 */
function drawCreature(x, c, style, scale, parts) {
  const g = c.looks;
  const portrait = style === "portrait";
  const mine = style === "mine" || portrait, gray = style === "gray";
  const fade = gray ? 0.9 : 1;
  const A = (a) => a * fade;
  /* side-on figures, flipped by travel direction: at 25px a rotating
     top-down silhouette reads as an insect, a standing animal doesn't. */
  const u = (mine ? 11.2 : gray ? 7.4 : 8.4) * (0.84 + g.bodySize * 0.20) * scale;
  const dir = c.face || 1;
  const walk = c.mode === "walk" || !c.inZone;
  const ph = c.ph * 2.0;
  const bob = walk ? Math.abs(Math.sin(ph)) * u * 0.09 : 0;
  const legL = u * (0.34 + g.legLength * 0.30);
  const bRX = u * 0.80, bRY = u * 0.50 * (1.12 - g.snout * 0.12), hR = u * 0.47;
  const bodyY = -(legL + bRY) - bob;
  const headX = bRX * 0.74, headY = bodyY - bRY * 0.52 - hR * 0.42;
  const nose = hR * (0.72 + g.snout * 0.26);
  const web = gray ? 0 : clamp((g.feet / 2 - 0.2) / 0.45, 0, 1);

  x.globalAlpha = A(mine ? 0.26 : 0.14);
  x.fillStyle = "#332F1E";
  x.beginPath(); x.ellipse(c.x + u * 0.10, c.y + u * 0.06, u * 1.05, u * 0.30, 0, 0, TAU); x.fill();

  x.save();
  x.translate(c.x, c.y);
  x.scale(dir, 1);

  /* the coat shade lightens or darkens the body */
  const body = shade(mine ? "#1A657E" : "#8E8574", (g.shade - 0.5) * (mine ? 0.7 : 0.4));
  const dark = mine ? "#0C3B4D" : "#7C7463";
  const far = mine ? "#124F65" : "#807867";
  const rim = mine ? "#8FD2E6" : "#BAB29C";
  const webCol = mine ? "#A6DDEB" : "#D9D2BE";

  const fw = u * (0.15 + 0.14 * g.feet);
  const legW = mine ? u * 0.15 : u * 0.12;
  const leg = (px, phase, col) => {
    const sw = walk ? Math.sin(ph + phase) * legL * 0.40 : 0;
    const lift = walk ? Math.max(0, Math.sin(ph + phase)) * u * 0.11 : 0;
    x.globalAlpha = A(1);
    x.strokeStyle = col; x.lineWidth = legW; x.lineCap = "round";
    x.beginPath(); x.moveTo(px, bodyY + bRY * 0.55); x.lineTo(px + sw, -lift); x.stroke();
    x.beginPath(); x.moveTo(px + sw - fw * 0.30, -lift); x.lineTo(px + sw + fw * 0.70, -lift); x.stroke();
    /* webbed feet show as pale paddles */
    if (web > 0) {
      x.globalAlpha = A(0.9 * web);
      x.fillStyle = webCol;
      x.beginPath(); x.ellipse(px + sw + fw * 0.22, -lift, fw * 0.62, u * 0.085, 0, 0, TAU); x.fill();
    }
  };
  /* far pair */
  leg(bRX * 0.50 - u * 0.16, Math.PI, far);
  leg(-bRX * 0.52 - u * 0.16, 0, far);

  /* tail */
  const tl = u * (0.22 + g.tail * 0.36);
  const sway = Math.sin(c.ph * 1.7) * u * 0.16;
  const tipX = -bRX * 0.70 - tl * 1.00, tipY = bodyY - tl * 0.72 + sway;
  x.globalAlpha = A(1);
  x.strokeStyle = dark; x.lineCap = "round"; x.lineWidth = mine ? u * 0.13 : u * 0.11;
  x.beginPath();
  x.moveTo(-bRX * 0.84, bodyY + bRY * 0.10);
  x.quadraticCurveTo(-bRX * 0.84 - tl * 0.95, bodyY + tl * 0.10 + sway, tipX, tipY);
  x.stroke();
  const mark = clamp((g.tailTip / 2 - 0.3) / 0.4, 0, 1);
  if (mine && mark > 0) {
    x.globalAlpha = mark;
    x.fillStyle = "#D8F0F6";
    x.beginPath(); x.arc(tipX, tipY, u * 0.1, 0, TAU); x.fill();
  }

  /* one silhouette: body, head, muzzle, ears */
  const P = new Path2D();
  P.ellipse(0, bodyY, bRX, bRY, 0, 0, TAU);
  P.ellipse(headX, headY, hR, hR * 0.94, 0, 0, TAU);
  P.moveTo(headX + hR * 0.30, headY - hR * 0.34);
  P.quadraticCurveTo(headX + nose * 1.18, headY - hR * 0.10, headX + nose * 1.10, headY + hR * 0.30);
  P.quadraticCurveTo(headX + hR * 0.50, headY + hR * 0.62, headX + hR * 0.20, headY + hR * 0.50);
  P.closePath();
  /* ears: rounded tips, or pointed ones */
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
  /* haunch */
  P.ellipse(-bRX * 0.46, bodyY + bRY * 0.16, bRX * 0.50, bRY * 0.86, 0, 0, TAU);

  /* shaggy coat grows in with dense fur */
  const shag = clamp((g.coat / 2 - 0.3) / 0.5, 0, 1);
  if (shag > 0.05) {
    x.strokeStyle = mine ? "#1E7086" : "#A69E8C";
    x.lineWidth = u * 0.12; x.globalAlpha = A((mine ? 0.85 : 0.5) * shag); x.lineCap = "round";
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * TAU;
      const px = Math.cos(a) * bRX, py = bodyY + Math.sin(a) * bRY;
      x.beginPath(); x.moveTo(px * 0.82, bodyY + (py - bodyY) * 0.82); x.lineTo(px * 1.22, bodyY + (py - bodyY) * 1.34); x.stroke();
    }
  }

  /* sunlit rim holds its world direction through the flip */
  x.save();
  x.translate(-0.9 * dir, -1.0);
  x.fillStyle = rim; x.globalAlpha = A(mine ? 0.95 : 0.5);
  x.fill(P);
  x.restore();
  x.globalAlpha = A(mine ? 1 : 0.82);
  x.fillStyle = body; x.fill(P);
  if (mine) { x.strokeStyle = "#08333F"; x.globalAlpha = 0.6; x.lineWidth = u * 0.08; x.stroke(P); }

  /* near pair, on top of the body */
  leg(bRX * 0.52, 0, dark);
  leg(-bRX * 0.46, Math.PI, dark);

  /* curved claws hook from the front foot */
  const hook = clamp((g.claws / 2 - 0.35) / 0.35, 0, 1);
  if (mine && hook > 0) {
    x.globalAlpha = hook; x.strokeStyle = "#DDEFF3"; x.lineWidth = u * 0.06; x.lineCap = "round";
    x.beginPath(); x.moveTo(bRX * 0.52 + fw * 0.6, -u * 0.02); x.quadraticCurveTo(bRX * 0.52 + fw * 0.95, -u * 0.02, bRX * 0.52 + fw * 0.9, u * 0.08); x.stroke();
  }

  if (!gray) {
    const eR = u * (0.07 + g.eyes * 0.055);
    x.globalAlpha = 1;
    x.fillStyle = mine ? "#F0FAFC" : "#EFEAD9";
    x.beginPath(); x.arc(headX + hR * 0.30, headY - hR * 0.10, eR, 0, TAU); x.fill();
    x.fillStyle = mine ? "#08333F" : "#3B372B";
    x.beginPath(); x.arc(headX + hR * 0.36, headY - hR * 0.08, eR * 0.55, 0, TAU); x.fill();
  }
  x.restore();

  if (parts) {
    // Where each part is on the canvas: [centre x, centre y, radius x, radius y].
    const at = (lx, ly, rx, ry) => [c.x + dir * lx, c.y + ly, rx, ry];
    Object.assign(parts, {
      toe_webbing: at(bRX * 0.05, -u * 0.02, bRX * 1.15, u * 0.3),
      curved_claws: at(bRX * 0.52 + fw * 0.7, u * 0.02, u * 0.32, u * 0.26),
      dense_fur: at(0, bodyY, bRX * 1.35, bRY * 1.55),
      long_hindlimbs: at(-bRX * 0.46, (bodyY + bRY * 0.55) / 2, u * 0.4, legL * 0.75),
      strong_tail: at(-bRX * 0.84 - tl * 0.5, bodyY - tl * 0.3, tl * 0.75 + u * 0.12, tl * 0.6 + u * 0.12),
      large_eyes: at(headX + hR * 0.3, headY - hR * 0.1, u * 0.3, u * 0.3),
      streamlined_body: at(headX * 0.45, bodyY, bRX * 1.7, bRY * 1.45),
      coat_shade: at(0, bodyY, bRX * 1.3, bRY * 1.45),
      ear_tip_shape: at(headX - hR * 0.03, headY - hR * 0.62 - earH * 0.55, u * 0.42, earH * 0.85),
      tail_tip_marking: at(tipX, tipY, u * 0.3, u * 0.3),
    });
  }

  const midY = c.y + bodyY;
  if (mine && !portrait) {
    /* halo ring — the non-colour lineage indicator */
    x.strokeStyle = "#1E7E9C"; x.globalAlpha = 0.5; x.lineWidth = 1.8;
    x.beginPath(); x.ellipse(c.x, midY, u * 1.58, u * 1.46, 0, 0, TAU); x.stroke();
  }

  /* mutation flash: your family's newest bright, the one before dim; others faint */
  if (c.flash) {
    const puls = (Math.sin((c.flashT || 0) * 0.0042) + 1) / 2;
    const newest = c.flash === FLASH_NEWEST;
    const a = newest ? 0.36 + puls * 0.44 : c.flash === FLASH_PREVIOUS ? 0.12 + puls * 0.08 : 0.16 + puls * 0.1;
    const rad = newest ? u * (2.0 + puls * 1.2) : u * 1.95;
    if (newest) {
      const grd = x.createRadialGradient(c.x, midY, 0, c.x, midY, rad * 1.7);
      grd.addColorStop(0, "rgba(255,214,138," + (0.24 * a).toFixed(3) + ")");
      grd.addColorStop(1, "rgba(255,214,138,0)");
      x.fillStyle = grd; x.globalAlpha = 1;
      x.beginPath(); x.arc(c.x, midY, rad * 1.7, 0, TAU); x.fill();
    }
    x.strokeStyle = "#FFCE70"; x.globalAlpha = a; x.lineWidth = newest ? 2.8 : 1.4;
    x.beginPath(); x.ellipse(c.x, midY, rad, rad * 0.92, 0, 0, TAU); x.stroke();
  }
  x.globalAlpha = 1;
}

/**
 * One animal drawn large from its real genome, for the choice cards and the
 * ending. Every portrait on a card row uses the same scale, so differences
 * between animals are real differences. `focus` rings the part a variation is
 * about.
 * @param {HTMLCanvasElement} cv sized by CSS
 * @param {ArrayLike<number>} genome engine body genome
 * @param {string} [focus] engine trait name
 */
export function drawPortrait(cv, genome, focus) {
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 220, h = cv.clientHeight || 150;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const x = /** @type {CanvasRenderingContext2D} */ (cv.getContext("2d"));
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, w, h);
  const u = Math.min(0.8 * w / 2.8, 0.8 * h / 2.7);
  const c = { looks: looksFrom(genome), x: w / 2 + u * 0.15, y: h / 2 + u * 1.25, face: 1, mode: "pause", ph: 0.6, inZone: true, flash: 0 };
  const parts = {};
  drawCreature(x, c, "portrait", u / (11.2 * 1.04), parts);
  const p = focus && parts[focus];
  if (p) {
    x.save();
    x.strokeStyle = "#D9892B"; x.lineWidth = 2.5; x.setLineDash([6, 5]); x.globalAlpha = 0.95;
    x.beginPath(); x.ellipse(p[0], p[1], p[2], p[3], 0, 0, TAU); x.stroke();
    x.restore();
  }
}

/**
 * @typedef {Object} Animal
 * @property {number} id engine individual id
 * @property {number} zone engine zone index
 */
