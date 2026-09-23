/**
 * The painted world: zone bands, terrain field and the gouache terrain paint,
 * ported from design/Lineage World.dc.html with its drawing logic unchanged.
 *
 * Visual only. Its random numbers come from its own seeded generator and never
 * reach the engine.
 */

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** mulberry32 — the mockup's seeded generator for visual randomness. */
export function mulberry(s) {
  let a = s | 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Engine zone index (canopy, forest_floor, shoreline) -> painted band. */
export const BANDS = ["canopy", "floor", "shore"];

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

export class World {
  constructor(seed = 20260802) {
    this.W = 2900;
    this.H = 2050;
    this._r = mulberry(seed);
    this.rr = (a, b) => a + this._r() * (b - a);
    this.ri = (a, b) => Math.floor(a + this._r() * (b - a + 1));
    /** @type {HTMLCanvasElement|null} */
    this.terrain = null;
    this.cancelled = false;
  }

  /* ================= noise & terrain field ================= */
  hash2(x, y, s) { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); }
  vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = this.hash2(xi, yi, s), b = this.hash2(xi + 1, yi, s), c = this.hash2(xi, yi + 1, s), d = this.hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  fbm(x, y, s) { let v = 0, amp = .55, f = 1; for (let i = 0; i < 3; i++) { v += amp * this.vnoise(x * f, y * f, s + i * 17); amp *= .5; f *= 2.05; } return v; }

  /* Bands run roughly across the world and never fold back on themselves:
     the vertical term always dominates, so every zone edge is one clean,
     wandering coastline instead of closed islands. */
  zoneT(x, y) {
    const W = this.W, H = this.H;
    return 0.24 * (x / W) + 1.20 * (y / H)
      + 0.070 * Math.sin(x / 380 + 0.6)
      + 0.055 * Math.sin(y / 330 + 2.2)
      + 0.045 * Math.sin((x * 0.8 + y * 0.9) / 520)
      + 0.030 * Math.sin(x / 150 + y / 190);
  }
  zoneAt(x, y) { const t = this.zoneT(x, y); return t < 0.42 ? "canopy" : t < 0.80 ? "floor" : t < 1.12 ? "shore" : "water"; }
  /* direction along a zone boundary (used for beach & water banding) */
  isoAngle(x, y) {
    const W = this.W, H = this.H;
    const q = Math.cos((x * 0.8 + y * 0.9) / 520) / 520, p = Math.cos(x / 150 + y / 190);
    const dx = 0.24 / W + 0.070 * Math.cos(x / 380 + 0.6) / 380 + 0.045 * 0.8 * q + 0.030 * p / 150;
    const dy = 1.20 / H + 0.055 * Math.cos(y / 330 + 2.2) / 330 + 0.045 * 0.9 * q + 0.030 * p / 190;
    return Math.atan2(dx, -dy);
  }

  /**
   * A point well inside the painted band for an engine zone, so animals are
   * not born on a coastline. `near` keeps the search close to a spot.
   * @param {number} zone engine zone index
   * @param {() => number} rnd uniform [0,1) generator
   * @param {{x:number,y:number,radius:number}} [near]
   */
  pointIn(zone, rnd, near) {
    const band = BANDS[zone];
    const [lo, hi] = [[-9, 0.42], [0.42, 0.80], [0.80, 1.12]][zone];
    const inner = (x, y) => { const t = this.zoneT(x, y); return t > lo + 0.03 && t < hi - 0.03; };
    for (let tries = 0; tries < 400; tries++) {
      let x, y;
      if (near) {
        // Widen slowly, so the first hit is close to the nearest point in the band.
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * near.radius * (1 + tries / 12);
        x = near.x + Math.cos(a) * d; y = near.y + Math.sin(a) * d * (tries < 40 ? 0.82 : 1);
      } else {
        x = 60 + rnd() * (this.W - 120); y = 60 + rnd() * (this.H - 120);
      }
      if (x < 30 || x > this.W - 30 || y < 30 || y > this.H - 30) continue;
      if (this.zoneAt(x, y) === band && inner(x, y)) return { x, y };
    }
    // Fall back to any point in the band.
    for (;;) {
      const x = 30 + rnd() * (this.W - 60), y = 30 + rnd() * (this.H - 60);
      if (this.zoneAt(x, y) === band) return { x, y };
    }
  }

  RAMP() {
    return [
      [-0.25, [38, 70, 48]], [0.10, [47, 84, 52]], [0.26, [60, 99, 57]],
      [0.38, [82, 116, 62]], [0.46, [122, 127, 72]], [0.54, [152, 131, 79]],
      [0.66, [169, 145, 92]], [0.78, [186, 161, 108]], [0.86, [205, 183, 133]],
      [0.94, [228, 212, 174]], [1.02, [240, 228, 197]], [1.078, [226, 211, 178]],
      [1.126, [196, 188, 162]], [1.16, [145, 193, 199]], [1.30, [96, 158, 180]],
      [1.72, [62, 116, 148]],
    ];
  }
  ramp(t) {
    const S = this._ramp || (this._ramp = this.RAMP());
    if (t <= S[0][0]) return S[0][1];
    for (let i = 1; i < S.length; i++) {
      if (t <= S[i][0]) {
        const a = S[i - 1], b = S[i], k = (t - a[0]) / (b[0] - a[0]), e = k * k * (3 - 2 * k);
        return [a[1][0] + (b[1][0] - a[1][0]) * e, a[1][1] + (b[1][1] - a[1][1]) * e, a[1][2] + (b[1][2] - a[1][2]) * e];
      }
    }
    return S[S.length - 1][1];
  }
  rgba(c, dl, a) {
    const k = (v) => Math.max(0, Math.min(255, Math.round(v + dl)));
    return "rgba(" + k(c[0]) + "," + k(c[1]) + "," + k(c[2]) + "," + a.toFixed(3) + ")";
  }

  /* ================= terrain paint ================= */
  async paint() {
    const t = document.createElement("canvas");
    t.width = this.W; t.height = this.H;
    const g = t.getContext("2d");
    this.terrain = t;
    this.paintBase(g); await nextFrame(); if (this.cancelled) return;
    this.paintStrokes(g); await nextFrame(); if (this.cancelled) return;
    this.paintCanopy(g); await nextFrame(); if (this.cancelled) return;
    this.paintFloor(g); await nextFrame(); if (this.cancelled) return;
    this.paintShore(g); await nextFrame(); if (this.cancelled) return;
    this.paintGlaze(g);
  }

  paintBase(g) {
    const SC = 10, W = this.W, H = this.H;
    const lw = Math.ceil(W / SC), lh = Math.ceil(H / SC);
    const lc = document.createElement("canvas"); lc.width = lw; lc.height = lh;
    const lg = lc.getContext("2d");
    const img = lg.createImageData(lw, lh), d = img.data;
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const wx = x * SC, wy = y * SC;
      const t = this.zoneT(wx, wy)
        + (this.fbm(wx / 240, wy / 240, 7) - 0.5) * 0.135
        + (this.fbm(wx / 64, wy / 64, 3) - 0.5) * 0.05;
      const c = this.ramp(t);
      const L = 0.93 + this.fbm(wx / 620, wy / 620, 23) * 0.17;
      const i = (y * lw + x) * 4;
      d[i] = Math.min(255, c[0] * L);
      d[i + 1] = Math.min(255, c[1] * L);
      d[i + 2] = Math.min(255, c[2] * L);
      d[i + 3] = 255;
    }
    lg.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.drawImage(lc, 0, 0, lw, lh, 0, 0, lw * SC, lh * SC);
  }

  strokeAngle(x, y, t) {
    if (t > 1.02) return this.isoAngle(x, y);
    return (this.fbm(x / 330, y / 330, 41) - 0.5) * Math.PI * 3.2;
  }
  paintStrokes(g) {
    const W = this.W, H = this.H, rr = this.rr;
    g.lineCap = "round";
    for (let i = 0; i < 6000; i++) {
      const x = rr(0, W), y = rr(0, H);
      const t = this.zoneT(x, y);
      const c = this.ramp(t);
      const a = this.strokeAngle(x, y, t);
      const beach = t > 0.82;
      const len = beach ? rr(46, 190) : rr(16, 64);
      const lwd = beach ? rr(2.2, 8) : rr(3, 13);
      const dl = rr(-28, 30);
      g.strokeStyle = this.rgba(c, dl, rr(.05, beach ? .13 : .17));
      g.lineWidth = lwd;
      const nx = Math.cos(a), ny = Math.sin(a), off = rr(-11, 11);
      g.beginPath();
      g.moveTo(x - nx * len / 2, y - ny * len / 2);
      g.quadraticCurveTo(x - ny * off, y + nx * off, x + nx * len / 2, y + ny * len / 2);
      g.stroke();
    }
  }

  organic(g, x, y, rx, ry, rot, wob, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, k = 1 + (this._r() - 0.5) * 2 * wob;
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      pts.push([px * Math.cos(rot) - py * Math.sin(rot) + x, px * Math.sin(rot) + py * Math.cos(rot) + y]);
    }
    g.beginPath();
    g.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    g.closePath();
  }

  paintCanopy(g) {
    const rr = this.rr, W = this.W, H = this.H;
    const GREENS = [[36, 63, 41], [48, 80, 48], [60, 97, 55], [76, 116, 63], [95, 137, 73], [118, 159, 88], [141, 178, 104]];
    const trees = [];
    for (let i = 0; i < 2400; i++) {
      const x = rr(-90, W + 90), y = rr(-90, H + 90);
      const t = this.zoneT(x, y);
      if (t > 0.60) continue;
      /* thinning out into the open ground gives a ragged, real tree line */
      if (this._r() > clamp((0.60 - t) / 0.18, 0, 1)) continue;
      const u = this._r();
      const r = u < 0.10 ? rr(62, 110) : u < 0.46 ? rr(34, 58) : rr(16, 32);
      trees.push({ x, y, r, lv: this.ri(0, 2) });
    }
    trees.sort((a, b) => a.y - b.y);
    for (const T of trees) {
      const r = T.r;
      g.globalAlpha = 0.42;
      g.fillStyle = "rgb(26,45,30)";
      this.organic(g, T.x + r * 0.26, T.y + r * 0.34, r * 1.02, r * 0.9, 0, .16, 10); g.fill();
      g.globalAlpha = 1;
      const n = r > 60 ? 9 : r > 34 ? 6 : 4;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + this.rr(-0.4, 0.4);
        const d = k === 0 ? 0 : r * this.rr(0.26, 0.54);
        const cx2 = T.x + Math.cos(a) * d, cy2 = T.y + Math.sin(a) * d * 0.86;
        const lit = clamp(0.5 - (Math.cos(a) * 0.5 + Math.sin(a) * 0.55), 0, 1);
        const idx = clamp(Math.round(T.lv + lit * 3.2 - 0.4), 0, 6);
        g.globalAlpha = 0.88 + this._r() * 0.12;
        g.fillStyle = this.rgba(GREENS[idx], this.rr(-9, 9), 1);
        const rc = r * this.rr(0.42, 0.62);
        this.organic(g, cx2, cy2, rc, rc * this.rr(0.78, 0.98), this.rr(0, 3), .26, 9); g.fill();
      }
      g.globalAlpha = 0.40;
      g.strokeStyle = this.rgba(GREENS[clamp(T.lv + 1, 0, 6)], 0, 1);
      g.lineWidth = this.rr(2, 4.4); g.lineCap = "round";
      for (let k = 0; k < 5; k++) {
        const a = this.rr(0, TAU), d = r * this.rr(0.72, 0.94);
        g.beginPath();
        g.moveTo(T.x + Math.cos(a) * d, T.y + Math.sin(a) * d * 0.86);
        g.lineTo(T.x + Math.cos(a) * d * 1.16, T.y + Math.sin(a) * d * 1.08);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    for (let i = 0; i < 320; i++) {
      const x = rr(0, W), y = rr(0, H);
      if (this.zoneT(x, y) > 0.50) continue;
      const r = rr(12, 54);
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "rgba(255,244,196,0.30)");
      grd.addColorStop(0.5, "rgba(255,240,188,0.10)");
      grd.addColorStop(1, "rgba(255,238,184,0)");
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
  }

  paintFloor(g) {
    const rr = this.rr, W = this.W, H = this.H;
    g.lineCap = "round";
    /* broad tonal patches so the ground is never one flat colour */
    for (let i = 0; i < 1100; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 0.40 || t > 0.94) continue;
      const c = this.ramp(t);
      g.globalAlpha = rr(.06, .20);
      g.fillStyle = this.rgba(c, rr(-44, 30), 1);
      this.organic(g, x, y, rr(40, 160), rr(28, 105), rr(0, 3), .3, 10); g.fill();
    }
    g.globalAlpha = 1;
    /* grass and moss, thicker up near the trees */
    for (let i = 0; i < 3200; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 0.40 || t > 0.88) continue;
      if (this._r() > clamp((0.92 - t) / 0.36, 0.06, 1)) continue;
      const green = [[74, 104, 56], [92, 122, 64], [112, 140, 76], [136, 158, 92]][this.ri(0, 3)];
      g.strokeStyle = this.rgba(green, rr(-12, 12), rr(.35, .78));
      g.lineWidth = rr(1.5, 3);
      const n = this.ri(3, 6), s2 = rr(8, 24);
      for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + rr(-1.2, 1.2);
        g.beginPath(); g.moveTo(x, y);
        g.quadraticCurveTo(x + Math.cos(a) * s2 * 0.5, y + Math.sin(a) * s2 * 0.8, x + Math.cos(a) * s2 * 1.05, y + Math.sin(a) * s2 * 1.15);
        g.stroke();
      }
    }
    /* leaf litter */
    const LEAF = [[150, 104, 52], [170, 128, 64], [132, 92, 46], [188, 152, 82], [118, 116, 58]];
    for (let i = 0; i < 11000; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 0.36 || t > 0.92) continue;
      if (this._r() > clamp((0.96 - t) / 0.42, 0.08, 1)) continue;
      g.fillStyle = this.rgba(LEAF[this.ri(0, 4)], rr(-22, 26), rr(.24, .62));
      const a = rr(0, TAU), l = rr(6, 15);
      g.save(); g.translate(x, y); g.rotate(a);
      g.beginPath();
      g.moveTo(-l, 0);
      g.quadraticCurveTo(0, -l * 0.52, l, 0);
      g.quadraticCurveTo(0, l * 0.52, -l, 0);
      g.fill();
      g.restore();
    }
    /* stones */
    for (let i = 0; i < 300; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 0.44 || t > 0.94) continue;
      const r = rr(3, 9), a = rr(0, TAU), v = rr(-16, 16);
      g.globalAlpha = .2; g.fillStyle = "rgb(74,64,48)";
      g.beginPath(); g.ellipse(x + r * 0.35, y + r * 0.42, r, r * 0.74, a, 0, TAU); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = "rgb(" + ((146 + v) | 0) + "," + ((132 + v) | 0) + "," + ((108 + v) | 0) + ")";
      this.organic(g, x, y, r, r * 0.76, a, .2, 9); g.fill();
      g.globalAlpha = .3; g.fillStyle = "rgb(208,198,174)";
      this.organic(g, x - r * 0.22, y - r * 0.26, r * 0.5, r * 0.34, a, .25, 8); g.fill();
      g.globalAlpha = 1;
    }
    /* fallen logs, mostly near the forest */
    for (let i = 0; i < 90; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 0.42 || t > 0.86) continue;
      if (this._r() > clamp((0.86 - t) / 0.30, 0.04, 1)) continue;
      const a = rr(0, TAU), l = rr(60, 160), w = rr(7, 12), v = rr(-14, 14);
      g.save(); g.translate(x, y); g.rotate(a);
      g.globalAlpha = .22; g.fillStyle = "rgb(54,44,30)";
      g.beginPath(); g.ellipse(5, w, l / 2, w * 0.8, 0, 0, TAU); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = "rgb(" + ((96 + v) | 0) + "," + ((78 + v) | 0) + "," + ((55 + v) | 0) + ")";
      g.beginPath(); g.ellipse(0, 0, l / 2, w, 0, 0, TAU); g.fill();
      g.globalAlpha = .6;
      g.fillStyle = "rgb(" + ((142 + v) | 0) + "," + ((120 + v) | 0) + "," + ((85 + v) | 0) + ")";
      g.beginPath(); g.ellipse(-l * 0.03, -w * 0.36, l / 2.3, w * 0.3, 0, 0, TAU); g.fill();
      g.globalAlpha = .24; g.strokeStyle = "rgb(64,52,36)"; g.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) {
        const yy = -w * 0.6 + k * w * 0.4;
        g.beginPath(); g.moveTo(-l * 0.44, yy); g.lineTo(l * 0.44, yy + rr(-2, 2)); g.stroke();
      }
      g.globalAlpha = 1;
      g.fillStyle = "rgb(" + ((160 + v) | 0) + "," + ((134 + v) | 0) + "," + ((97 + v) | 0) + ")";
      g.beginPath(); g.ellipse(l / 2, 0, w * 0.34, w * 0.94, 0, 0, TAU); g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
  }

  paintShore(g) {
    const rr = this.rr, W = this.W, H = this.H;
    g.lineCap = "round";
    /* raked tide lines running parallel to the water */
    for (let i = 0; i < 5200; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 0.80 || t > 1.17) continue;
      const c = this.ramp(t);
      const a = this.isoAngle(x, y), l = rr(80, 340);
      g.strokeStyle = this.rgba(c, rr(-20, 24), rr(.04, .14));
      g.lineWidth = rr(2, 9);
      g.beginPath();
      g.moveTo(x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2);
      g.quadraticCurveTo(x + Math.sin(a) * rr(-8, 8), y - Math.cos(a) * rr(-8, 8), x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2);
      g.stroke();
    }
    /* damp sand — broad soft washes */
    for (let i = 0; i < 1500; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 1.03 || t > 1.128) continue;
      g.globalAlpha = rr(.04, .13);
      g.fillStyle = "rgb(150,146,126)";
      this.organic(g, x, y, rr(60, 200), rr(10, 28), this.isoAngle(x, y), .32, 11); g.fill();
    }
    g.globalAlpha = 1;
    /* foam at the waterline */
    for (let i = 0; i < 4600; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (Math.abs(t - 1.126) > 0.012) continue;
      const a = this.isoAngle(x, y), l = rr(14, 70);
      g.strokeStyle = "rgba(255,253,246," + rr(.18, .66).toFixed(3) + ")";
      g.lineWidth = rr(1.4, 6);
      g.beginPath();
      g.moveTo(x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2);
      g.quadraticCurveTo(x + Math.sin(a) * rr(-10, 10), y - Math.cos(a) * rr(-10, 10), x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2);
      g.stroke();
    }
    /* shells and pebbles, gathered along the tide line */
    for (let i = 0; i < 3000; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 0.90 || t > 1.13) continue;
      if (this._r() > 1 - Math.abs(t - 1.10) / 0.23) continue;
      const r = rr(1.8, 7), a = rr(0, TAU), c = this.ramp(t);
      g.globalAlpha = .2; g.fillStyle = "rgb(118,108,86)";
      g.beginPath(); g.ellipse(x + r * 0.4, y + r * 0.5, r, r * 0.72, a, 0, TAU); g.fill();
      g.globalAlpha = rr(.5, .95);
      g.fillStyle = this.rgba(c, rr(-62, -14), 1);
      g.beginPath(); g.ellipse(x, y, r, r * 0.72, a, 0, TAU); g.fill();
      g.globalAlpha = rr(.3, .75); g.fillStyle = "rgb(255,250,236)";
      g.beginPath(); g.ellipse(x - r * 0.24, y - r * 0.28, r * 0.42, r * 0.28, a, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    /* driftwood along the strand line */
    for (let i = 0; i < 70; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 0.98 || t > 1.12) continue;
      const a = this.isoAngle(x, y) + rr(-0.8, 0.8), l = rr(40, 130), w = rr(4, 9), v = rr(-12, 12);
      g.save(); g.translate(x, y); g.rotate(a);
      g.globalAlpha = .18; g.fillStyle = "rgb(90,80,62)";
      g.beginPath(); g.ellipse(3, w * 0.9, l / 2, w * 0.8, 0, 0, TAU); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = "rgb(" + ((158 + v) | 0) + "," + ((142 + v) | 0) + "," + ((116 + v) | 0) + ")";
      g.beginPath(); g.ellipse(0, 0, l / 2, w, 0, 0, TAU); g.fill();
      g.globalAlpha = .55; g.fillStyle = "rgb(206,194,168)";
      g.beginPath(); g.ellipse(0, -w * 0.34, l / 2.3, w * 0.3, 0, 0, TAU); g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
    /* water */
    for (let i = 0; i < 3600; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 1.12) continue;
      const a = this.isoAngle(x, y), l = rr(50, 280), c = this.ramp(t);
      g.strokeStyle = this.rgba(c, rr(-26, 46), rr(.06, .2));
      g.lineWidth = rr(2, 10);
      g.beginPath();
      g.moveTo(x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2);
      g.quadraticCurveTo(x + Math.sin(a) * rr(-12, 12), y - Math.cos(a) * rr(-12, 12), x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2);
      g.stroke();
    }
    /* small crests where the water meets the sand */
    for (let i = 0; i < 1600; i++) {
      const x = rr(0, W), y = rr(0, H), t = this.zoneT(x, y);
      if (t < 1.13 || t > 1.24) continue;
      const a = this.isoAngle(x, y), l = rr(20, 90);
      g.strokeStyle = "rgba(240,252,255," + rr(.06, .26).toFixed(3) + ")";
      g.lineWidth = rr(1.6, 4.5);
      g.beginPath();
      g.moveTo(x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2);
      g.quadraticCurveTo(x + Math.sin(a) * rr(-8, 8), y - Math.cos(a) * rr(-8, 8), x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2);
      g.stroke();
    }
  }

  grainPattern(g) {
    const n = document.createElement("canvas"); n.width = n.height = 180;
    const ng = n.getContext("2d"), im = ng.createImageData(180, 180), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 118 + (this._r() - 0.5) * 90;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    ng.putImageData(im, 0, 0);
    return g.createPattern(n, "repeat");
  }
  paintGlaze(g) {
    const W = this.W, H = this.H;
    /* warm unifying wash — one light, one painting */
    g.globalAlpha = .07; g.fillStyle = "#FFF1D2"; g.fillRect(0, 0, W, H);
    /* broad soft light & shade across the whole world */
    const SC = 18, lw = Math.ceil(W / SC), lh = Math.ceil(H / SC);
    const lc = document.createElement("canvas"); lc.width = lw; lc.height = lh;
    const lg = lc.getContext("2d"), img = lg.createImageData(lw, lh), d = img.data;
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const v = 96 + this.fbm(x / 9.5, y / 9.5, 61) * 116;
      const i = (y * lw + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    lg.putImageData(img, 0, 0);
    g.globalAlpha = .17; g.globalCompositeOperation = "overlay";
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.drawImage(lc, 0, 0, lw, lh, 0, 0, lw * SC, lh * SC);
    /* paper tooth */
    g.globalAlpha = .05;
    g.fillStyle = this.grainPattern(g);
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
  }
}
