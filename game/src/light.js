/**
 * Light and air (Step 4 look): the day that one generation lasts, the morning
 * mist of the arrival, and the small things that are always moving (pollen,
 * fireflies, glints on the water, sun through the leaves, a bird's shadow).
 *
 * Visual only. Its random numbers come from its own seeded generator and never
 * reach the engine. Everything is drawn from a few sprites made once, so a
 * frame costs a handful of fills and a few hundred tiny drawImage calls. The
 * warm light from the sun's side and the vignette go on a small canvas that the
 * page stretches over the map (index.html #air): painted over the whole map each
 * frame, each cost about as much as drawing the map itself.
 */

import { TAU, clamp, mulberry } from "./world.js";

const lerp = (a, b, k) => a + (b - a) * k;
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const ease = (k) => k * k * (3 - 2 * k);

/**
 * One generation is one day. Phase 0 is dawn (a generation arrives at dawn),
 * then a long golden morning and afternoon, a rosy dusk, a soft blue night,
 * and dawn again.
 *   tint  multiplied over the world (colour, strength)
 *   lift  added softly (warm light)
 *   night 0..1, how much the night creatures and the animals' own glow show
 *   sun   -1 (morning, from the east) .. 1 (evening, from the west); shadows lean away
 *   low   0..1, how low the sun is: long shadows at both ends of the day
 */
const DAY = [
  { p: 0.00, tint: [228, 206, 214], tA: 0.30, lift: [255, 196, 156], lA: 0.10, night: 0.35, sun: -1.0, low: 1.0 },
  { p: 0.10, tint: [255, 232, 204], tA: 0.16, lift: [255, 214, 160], lA: 0.12, night: 0.00, sun: -0.8, low: 0.8 },
  { p: 0.36, tint: [255, 246, 228], tA: 0.07, lift: [255, 238, 196], lA: 0.06, night: 0.00, sun: -0.1, low: 0.25 },
  { p: 0.58, tint: [255, 222, 172], tA: 0.18, lift: [255, 196, 120], lA: 0.14, night: 0.00, sun: 0.6, low: 0.75 },
  { p: 0.70, tint: [214, 170, 176], tA: 0.36, lift: [240, 146, 104], lA: 0.10, night: 0.30, sun: 1.0, low: 1.0 },
  { p: 0.79, tint: [118, 134, 180], tA: 0.50, lift: [130, 156, 210], lA: 0.04, night: 1.00, sun: 1.0, low: 0.0 },
  { p: 0.92, tint: [122, 138, 184], tA: 0.48, lift: [140, 160, 214], lA: 0.04, night: 1.00, sun: -1.0, low: 0.0 },
  { p: 1.00, tint: [228, 206, 214], tA: 0.30, lift: [255, 196, 156], lA: 0.10, night: 0.35, sun: -1.0, low: 1.0 },
];

/** The light at a phase of the day, 0..1. */
export function skyAt(phase) {
  const p = ((phase % 1) + 1) % 1;
  let i = 1;
  while (i < DAY.length - 1 && DAY[i].p < p) i++;
  const a = DAY[i - 1], b = DAY[i], k = ease(clamp((p - a.p) / (b.p - a.p || 1), 0, 1));
  return {
    tint: mix3(a.tint, b.tint, k), tA: lerp(a.tA, b.tA, k),
    lift: mix3(a.lift, b.lift, k), lA: lerp(a.lA, b.lA, k),
    night: lerp(a.night, b.night, k), sun: lerp(a.sun, b.sun, k), low: lerp(a.low, b.low, k),
  };
}

/* ================= sprites, made once ================= */
function sprite(size, paint) {
  const c = Object.assign(document.createElement("canvas"), { width: size, height: size });
  paint(/** @type {CanvasRenderingContext2D} */ (c.getContext("2d")), size);
  return c;
}
function radial(size, stops) {
  return sprite(size, (x, s) => {
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    for (const [o, c] of stops) g.addColorStop(o, c);
    x.fillStyle = g; x.fillRect(0, 0, s, s);
  });
}

/** The small canvas for the warm light and the vignette: soft gradients look the same drawn small and stretched. */
const AIR = 256;

export class Sky {
  /**
   * @param {import("./world.js").World} world
   * @param {HTMLCanvasElement|null} [air] the small canvas stretched over the map, for the warm light and the vignette (#air)
   */
  constructor(world, air = null) {
    this.world = world;
    if (air) { air.width = AIR; air.height = AIR; }
    this.air = air && { x: /** @type {CanvasRenderingContext2D} */ (air.getContext("2d")), key: "" };
    const r = mulberry(4471);
    this.r = r;
    this.mote = radial(24, [[0, "rgba(255,244,210,1)"], [0.35, "rgba(255,236,190,.55)"], [1, "rgba(255,230,180,0)"]]);
    this.fly = radial(40, [[0, "rgba(246,255,190,1)"], [0.25, "rgba(222,244,150,.6)"], [1, "rgba(200,236,130,0)"]]);
    this.dapple = radial(128, [[0, "rgba(255,240,196,.55)"], [0.5, "rgba(255,236,186,.18)"], [1, "rgba(255,232,180,0)"]]);
    this.vignette = radial(256, [[0, "rgba(40,30,16,0)"], [0.62, "rgba(40,30,16,0)"], [1, "rgba(40,30,16,.55)"]]);
    this.mistBlob = sprite(256, (x, s) => {
      for (let i = 0; i < 9; i++) {
        const cx = s * (0.3 + r() * 0.4), cy = s * (0.3 + r() * 0.4), rad = s * (0.22 + r() * 0.22);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, "rgba(250,244,230,.34)"); g.addColorStop(1, "rgba(250,244,230,0)");
        x.fillStyle = g; x.fillRect(0, 0, s, s);
      }
    });
    this.leaves = [0, 1, 2, 3, 4, 5].map((k) => this.leafSprite(k));

    // Points on the map where small things happen, found once from the zone field.
    const W = world.W, H = world.H;
    this.glints = []; this.dapples = [];
    for (let i = 0; i < 9000 && (this.glints.length < 520 || this.dapples.length < 140); i++) {
      const x = r() * W, y = r() * H, t = world.zoneT(x, y);
      if (t > 1.135 && this.glints.length < 520) this.glints.push({ x, y, ph: r() * TAU, sp: 0.6 + r() * 1.4, a: world.isoAngle(x, y), l: 4 + r() * 9 });
      else if (t < 0.36 && this.dapples.length < 140 && r() < 0.3) this.dapples.push({ x, y, ph: r() * TAU, s: 0.5 + r() * 0.9 });
    }
    // Pollen by day, fireflies at night: screen-space, with a little parallax.
    this.motes = Array.from({ length: 46 }, () => ({ x: r(), y: r(), ph: r() * TAU, sp: 0.4 + r() * 0.8, s: 0.5 + r() * 0.9, fly: r() < 0.7 }));
    // A few butterflies on the open ground and the water's edge.
    this.flutters = [];
    for (let i = 0; i < 400 && this.flutters.length < 7; i++) {
      const x = r() * W, y = r() * H, t = world.zoneT(x, y);
      if (t > 0.5 && t < 1.08) this.flutters.push({ x, y, hx: x, hy: y, ph: r() * TAU, hue: r() < 0.5 ? [246, 214, 150] : [240, 238, 222] });
    }
    this.mist = [];
    for (let i = 0; i < 16; i++) this.mist.push({ x: r(), y: r(), s: 0.9 + r() * 1.1, sp: 0.2 + r() * 0.5 });
    this.birdAt = performance.now() + 9000;
    this.bird = null;
  }

  /** A big soft leaf, dark and out of focus, for passing through the canopy on arrival. */
  leafSprite(k) {
    const r = mulberry(900 + k);
    return sprite(360, (x, s) => {
      x.translate(s / 2, s / 2); x.rotate(r() * TAU);
      x.shadowColor = "rgba(24,44,26,1)"; x.shadowBlur = 26;
      for (let i = 0; i < 3; i++) {
        const l = s * (0.22 + r() * 0.12), w = l * (0.42 + r() * 0.2);
        x.save(); x.rotate((i - 1) * 0.7 + r() * 0.3); x.translate(l * 0.45, 0);
        x.fillStyle = `rgb(${34 + r() * 14 | 0},${58 + r() * 18 | 0},${36 + r() * 10 | 0})`;
        x.beginPath(); x.moveTo(-l, 0); x.quadraticCurveTo(0, -w, l, 0); x.quadraticCurveTo(0, w, -l, 0); x.fill();
        x.restore();
      }
    });
  }

  /**
   * Over the world, under your animals: the day's tint, the warm light from the
   * sun's side, dappled sun through the canopy and glints on the water.
   * @param {CanvasRenderingContext2D} x already in world coordinates
   * @param {{x:number,y:number,w:number,h:number}} v the visible world rect
   * @param {ReturnType<typeof skyAt>} L the light now
   * @param {number} mood -1 (shrinking, cooler) .. 1 (growing, warmer)
   */
  drawWorld(x, v, L, mood, now) {
    // Sun through moving leaves, by day.
    const day = 1 - L.night;
    if (day > 0.05) {
      x.globalCompositeOperation = "soft-light";
      for (const d of this.dapples) {
        if (d.x < v.x - 80 || d.x > v.x + v.w + 80 || d.y < v.y - 80 || d.y > v.y + v.h + 80) continue;
        const a = day * (0.55 + 0.45 * Math.sin(now * 0.0007 * d.s + d.ph));
        const sway = Math.sin(now * 0.0005 + d.ph) * 7, size = 90 + 60 * d.s;
        x.globalAlpha = a;
        x.drawImage(this.dapple, d.x - size / 2 + sway, d.y - size / 2, size, size);
      }
    }
    // The day's colour over the whole world, and the mood: a little warmer when
    // the group grows, a little cooler and quieter when it shrinks.
    let tint = L.tint, tA = L.tA;
    if (mood > 0) { tint = mix3(tint, [255, 214, 160], 0.35 * mood); tA += 0.06 * mood; }
    if (mood < 0) { tint = mix3(tint, [176, 190, 206], -0.55 * mood); tA += 0.08 * -mood; }
    x.globalCompositeOperation = "multiply";
    x.globalAlpha = tA; x.fillStyle = rgb(tint); x.fillRect(v.x, v.y, v.w, v.h);
    // The warm light from the sun's side is on the canvas stretched over the map (paintAir).
    // Glints where the light catches the water, brighter at golden hour, silver at night.
    x.globalCompositeOperation = "source-over";
    x.lineCap = "round";
    const gl = L.night > 0.5 ? "rgba(214,228,255,1)" : "rgba(255,248,224,1)";
    x.strokeStyle = gl; x.lineWidth = 1.6;
    for (const p of this.glints) {
      if (p.x < v.x || p.x > v.x + v.w || p.y < v.y || p.y > v.y + v.h) continue;
      const s = Math.sin(now * 0.0016 * p.sp + p.ph);
      if (s < 0.72) continue;
      x.globalAlpha = (s - 0.72) / 0.28 * (0.35 + 0.4 * L.low);
      const dx = Math.cos(p.a) * p.l, dy = Math.sin(p.a) * p.l, drift = Math.sin(now * 0.0004 + p.ph) * 4;
      x.beginPath(); x.moveTo(p.x - dx + drift, p.y - dy); x.lineTo(p.x + dx + drift, p.y + dy); x.stroke();
    }
    // Butterflies over the open ground, by day.
    if (day > 0.2) {
      for (const f of this.flutters) {
        f.x = f.hx + Math.sin(now * 0.00021 + f.ph) * 90 + Math.sin(now * 0.00063 + f.ph * 2) * 24;
        f.y = f.hy + Math.cos(now * 0.00017 + f.ph) * 60 + Math.sin(now * 0.0009 + f.ph) * 10;
        if (f.x < v.x || f.x > v.x + v.w || f.y < v.y || f.y > v.y + v.h) continue;
        const flap = Math.abs(Math.sin(now * 0.018 + f.ph));
        x.globalAlpha = 0.85 * day;
        x.fillStyle = rgb(f.hue);
        x.beginPath(); x.ellipse(f.x - 2.6 * flap, f.y, 3 * flap + 0.4, 2.4, -0.4, 0, TAU); x.fill();
        x.beginPath(); x.ellipse(f.x + 2.6 * flap, f.y, 3 * flap + 0.4, 2.4, 0.4, 0, TAU); x.fill();
      }
    }
    x.globalAlpha = 1;
  }

  /**
   * Over everything on the map (screen space): pollen or fireflies, a bird's
   * shadow now and then, the soft vignette, and the mist.
   * @param {number} mist 0..1
   * @param {{x:number,y:number}} cam for a little parallax
   */
  drawAir(x, vw, vh, L, mood, now, mist, cam) {
    // Pollen by day, fireflies at night; fewer when the group is shrinking.
    const quiet = 1 - 0.45 * Math.max(0, -mood);
    for (let i = 0; i < this.motes.length * quiet; i++) {
      const m = this.motes[i];
      const px = ((m.x * (vw + 80) - cam.x * 0.35 + Math.sin(now * 0.00023 * m.sp + m.ph) * 40 + now * 0.004 * m.sp) % (vw + 80) + vw + 80) % (vw + 80) - 40;
      const py = ((m.y * (vh + 80) - cam.y * 0.35 + Math.cos(now * 0.00019 * m.sp + m.ph) * 30 - now * 0.002 * m.sp) % (vh + 80) + vh + 80) % (vh + 80) - 40;
      const firefly = m.fly && L.night > 0.3;
      if (firefly) {
        const blink = Math.max(0, Math.sin(now * 0.0021 * m.sp + m.ph));
        x.globalAlpha = L.night * blink * 0.9;
        const s = 18 + 14 * m.s;
        x.drawImage(this.fly, px - s / 2, py - s / 2, s, s);
      } else {
        x.globalAlpha = (1 - L.night) * (0.28 + 0.3 * Math.sin(now * 0.001 + m.ph) ** 2);
        const s = 5 + 6 * m.s;
        x.drawImage(this.mote, px - s / 2, py - s / 2, s, s);
      }
    }
    // Now and then a bird's shadow glides across (by day).
    if (!this.bird && now > this.birdAt && L.night < 0.4) {
      const r = this.r, left = r() < 0.5;
      this.bird = { t0: now, dur: 7000 + r() * 3000, y0: vh * (0.15 + r() * 0.6), dy: (r() - 0.5) * vh * 0.5, left, s: 0.8 + r() * 0.5 };
    }
    if (this.bird) {
      const b = this.bird, k = (now - b.t0) / b.dur;
      if (k >= 1) { this.bird = null; this.birdAt = now + 22000 + this.r() * 20000; } else {
        const bx = b.left ? lerp(-80, vw + 80, k) : lerp(vw + 80, -80, k), by = b.y0 + b.dy * k;
        const flap = Math.sin(now * 0.006) * 0.5 + 0.5, s = 26 * b.s, dir = b.left ? 1 : -1;
        x.save(); x.translate(bx, by); x.scale(dir, 1);
        x.globalAlpha = 0.13 * (1 - L.night); x.fillStyle = "#2a2418";
        x.beginPath();
        x.ellipse(0, 0, s * 0.42, s * 0.12, 0, 0, TAU);
        x.moveTo(0, 0); x.quadraticCurveTo(-s * 0.2, -s * (0.5 + 0.4 * flap), -s * 0.1, -s * (0.9 + 0.3 * flap)); x.quadraticCurveTo(s * 0.12, -s * 0.4, s * 0.14, 0);
        x.moveTo(0, 0); x.quadraticCurveTo(-s * 0.2, s * (0.5 + 0.4 * flap), -s * 0.1, s * (0.9 + 0.3 * flap)); x.quadraticCurveTo(s * 0.12, s * 0.4, s * 0.14, 0);
        x.fill(); x.restore();
      }
    }
    // A soft vignette, deeper at night and when the group shrinks: on the canvas stretched
    // over the map, but painted here while the arrival's mist is up, as the mist has to cover it.
    const vA = 0.5 + 0.35 * L.night + 0.15 * Math.max(0, -mood), misty = mist > 0.002;
    this.paintAir(L, mood, misty ? 0 : vA, mist);
    if (misty || !this.air) {
      x.globalAlpha = vA;
      x.drawImage(this.vignette, -vw * 0.08, -vh * 0.08, vw * 1.16, vh * 1.16);
    }
    // Mist: a cream veil and slow drifting banks.
    if (misty) {
      x.globalAlpha = Math.min(1, mist * 1.15) ** 1.6;
      x.fillStyle = "#EFE6D2"; x.fillRect(0, 0, vw, vh);
      const big = Math.max(vw, vh);
      for (const b of this.mist) {
        const s = big * 0.8 * b.s;
        const px = ((b.x * (vw + s) + now * 0.012 * b.sp) % (vw + s)) - s / 2;
        const py = b.y * vh - s / 2;
        x.globalAlpha = Math.min(1, mist * 1.4);
        x.drawImage(this.mistBlob, px - s / 2, py, s, s);
      }
    }
    x.globalAlpha = 1;
  }

  /**
   * The small canvas stretched over the map (#air): warm light from the sun's
   * side, stronger when the group grows and quieter when it shrinks, passing
   * from the right (morning) to the left (evening) around noon; and the vignette.
   * Painted again only when something changed.
   * @param {number} vignette its strength (0 while the mist is up: drawAir paints it on the map then)
   */
  paintAir(L, mood, vignette, mist) {
    const a = this.air;
    if (!a) return;
    const clear = (1 - Math.min(1, mist * 1.15) ** 1.6) ** 2; // the warm light waits under the mist
    const lift = L.lA * (1 + 0.5 * Math.max(0, mood)) * (1 - 0.4 * Math.max(0, -mood)) * clear;
    const pm = clamp(0.5 + L.sun * 2.5, 0, 1), col = L.lift.map((c) => c | 0).join(",");
    const key = `${lift.toFixed(3)} ${pm.toFixed(3)} ${vignette.toFixed(3)} ${col}`;
    if (key === a.key) return;
    a.key = key;
    const x = a.x, S = AIR;
    x.clearRect(0, 0, S, S);
    for (const [fromLeft, k] of [[false, 1 - pm], [true, pm]]) {
      if (lift * k < 0.002) continue;
      const g = x.createLinearGradient(fromLeft ? 0 : S, 0, fromLeft ? S : 0, S);
      g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(1, `rgba(${col},0)`);
      x.globalAlpha = lift * k; x.fillStyle = g; x.fillRect(0, 0, S, S);
    }
    if (vignette > 0.002) {
      x.globalAlpha = vignette;
      x.drawImage(this.vignette, -S * 0.08, -S * 0.08, S * 1.16, S * 1.16);
    }
    x.globalAlpha = 1;
  }

  /**
   * The arrival: big soft leaves at the edges of the screen, passing outward as
   * the camera drifts down through the canopy. k goes 0..1.
   */
  drawCanopyPass(x, vw, vh, k) {
    if (k >= 1) return;
    const e = ease(k), big = Math.max(vw, vh);
    const spots = [[-0.05, 0.1], [1.05, 0.0], [0.1, 1.05], [0.95, 0.95], [0.5, -0.12], [-0.1, 0.6]];
    spots.forEach(([sx, sy], i) => {
      const out = 1 + e * 1.4, cx = vw / 2 + (sx * vw - vw / 2) * out, cy = vh / 2 + (sy * vh - vh / 2) * out;
      const s = big * (0.55 + 0.1 * (i % 3)) * (1 + e * 0.9);
      x.globalAlpha = 0.9 * (1 - e) ** 1.3;
      x.drawImage(this.leaves[i], cx - s / 2, cy - s / 2, s, s);
    });
    x.globalAlpha = 1;
  }
}
