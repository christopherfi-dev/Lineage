/**
 * The creature renderer (Step 3): one animal drawn large from its real body
 * genome, as layered 2D parts with a soft painted finish, like a field-guide
 * illustration. Used on the creature card, the choice options and the ending.
 *
 * Every one of the ten traits changes something you can see:
 *   toe webbing       webbing between the toes, on bigger, wider feet
 *   curved claws      claw length and curve
 *   dense fur         a fluffier outline
 *   long back legs    back-leg length (the body tips forward)
 *   strong tail       tail thickness
 *   large eyes        eye size
 *   sleek body        body shape, round to streamlined
 *   coat shade        coat colour, dark to light
 *   ear tips          rounded to pointed ears
 *   tail tip          a coloured band on the tail tip
 *
 * Values are continuous, so siblings (who share most genes) look related but
 * not identical. Small touches (tufts, brush wobble) are seeded by the animal,
 * so the same animal is always drawn the same way.
 */

import { TRAIT_INDEX as T } from "./engine.js";
import { mulberry } from "./world.js";

/** The design is drawn in a 300 × 210 frame and scaled to the canvas. */
const FRAME_W = 300, FRAME_H = 210, GROUND = 188, CENTER_X = 142;

const TAU = Math.PI * 2;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (e0, e1, v) => { const k = clamp01((v - e0) / (e1 - e0)); return k * k * (3 - 2 * k); };

/* ================= colour ================= */
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const css = (c, alpha = 1) => `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
/** Coat colour from dark to light (coat shade). */
function coatColour(v) {
  const dark = rgb("#43301f"), mid = rgb("#8d6a47"), light = rgb("#dcc49a");
  return v < 0.5 ? mix(dark, mid, v / 0.5) : mix(mid, light, (v - 0.5) / 0.5);
}
const CREAM = rgb("#f4e7cc"), INK = rgb("#20150d"), BAND = rgb("#e1782f"), SKIN = rgb("#e2ae98");
/** The ring and close-up around the part a choice is about. */
const FOCUS = "#c9822e";
/** The golden-hour light on the creature's back and edges. */
const RIM = rgb("#ffdca0");
/** The wash behind an animal: high leaves, open ground, water's edge. */
const WASH = [rgb("#7fa36a"), rgb("#c9a86a"), rgb("#6f9fb8")];

/* ================= paper and grain, made once ================= */
let grains = null;
function grain() {
  if (grains) return grains;
  const make = (size, seed, alpha) => {
    const c = Object.assign(document.createElement("canvas"), { width: size, height: size });
    const x = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d")), img = x.createImageData(size, size), r = mulberry(seed);
    for (let i = 0; i < img.data.length; i += 4) {
      const light = r() < 0.5, a = r() * alpha;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = light ? 255 : 30;
      img.data[i + 3] = Math.round(a * 255);
    }
    x.putImageData(img, 0, 0);
    return c;
  };
  grains = { paper: make(160, 11, 0.09), coat: make(96, 23, 0.16) };
  return grains;
}

/** A second canvas, the creature's own layer, reused between drawings of the same size. */
let layer = null;
function layerFor(w, h) {
  if (!layer || layer.width !== w || layer.height !== h) layer = Object.assign(document.createElement("canvas"), { width: w, height: h });
  return layer;
}

let rimLayer = null;
function rimFor(w, h) {
  if (!rimLayer || rimLayer.width !== w || rimLayer.height !== h) rimLayer = Object.assign(document.createElement("canvas"), { width: w, height: h });
  return rimLayer;
}

/* ================= shapes ================= */
/** A closed polygon path. */
function polygon(pts) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

/** Points along a cubic Bézier. */
function bezier(p0, p1, p2, p3, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

/** A tapered ribbon along a line of points, widths from w0 to w1, with a round end. */
function ribbon(line, w0, w1) {
  const left = [], right = [];
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
    const w = lerp(w0, w1, i / (line.length - 1)) / 2;
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
  });
  // The round end: half a circle around the tip, from one side to the other.
  const e = line[line.length - 1], d = line[line.length - 2];
  const along = Math.atan2(e[1] - d[1], e[0] - d[0]), cap = [];
  for (let j = 1; j < 8; j++) {
    const ang = along + Math.PI / 2 - (Math.PI * j) / 8;
    cap.push([e[0] + (Math.cos(ang) * w1) / 2, e[1] + (Math.sin(ang) * w1) / 2]);
  }
  return [...left, ...cap, ...right.reverse()];
}

/**
 * Fill a shape with a painted look: a soft offset wash, the colour, a light
 * from above, and an uneven ink line.
 */
function paint(x, path, colour, { r, shade = 0.18, outline = true, lineW = 1.5 } = {}) {
  x.save();
  x.fillStyle = css(colour, 0.35);
  x.translate(0.7 + r() * 0.5, 0.6 + r() * 0.5);
  x.fill(path);
  x.restore();
  x.fillStyle = css(colour, 0.97);
  x.fill(path);
  if (shade) {
    x.save();
    x.clip(path);
    const g = x.createLinearGradient(0, -120, 0, 10);
    g.addColorStop(0, `rgba(255,248,230,${shade * 0.55})`);
    g.addColorStop(0.55, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(20,10,0,${shade})`);
    x.fillStyle = g;
    x.fillRect(-200, -220, 400, 260);
    x.restore();
  }
  if (outline) {
    const ink = mix(colour, INK, 0.62);
    x.lineJoin = "round"; x.lineCap = "round";
    x.strokeStyle = css(ink, 0.78); x.lineWidth = lineW; x.stroke(path);
    x.save(); x.translate(0.5, 0.35); x.strokeStyle = css(ink, 0.22); x.lineWidth = lineW * 0.8; x.stroke(path); x.restore();
  }
}

/* ================= where it lives (Step 4 look) ================= */
/**
 * A little of the animal's habitat behind it, painted softly so the animal stays
 * the brightest thing: a mossy branch under leaves, the open ground with grass,
 * or the water's edge with reeds. In frame units, (0, 0) on the ground.
 */
function habitatScene(x, habitat, seed) {
  const r = mulberry(seed * 53 + 11 + habitat);
  const blob = (cx, cy, rx, ry, rot, col, a) => {
    x.save(); x.translate(cx, cy); x.rotate(rot);
    x.fillStyle = css(col, a); x.beginPath();
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * TAU, k = 1 + (r() - 0.5) * 0.28;
      const px = Math.cos(t) * rx * k, py = Math.sin(t) * ry * k;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath(); x.fill(); x.restore();
  };
  const leaf = (cx, cy, l, rot, col, a) => {
    x.save(); x.translate(cx, cy); x.rotate(rot);
    x.fillStyle = css(col, a);
    x.beginPath(); x.moveTo(-l, 0); x.quadraticCurveTo(0, -l * 0.46, l, 0); x.quadraticCurveTo(0, l * 0.46, -l, 0); x.fill();
    x.strokeStyle = css(mix(col, INK, 0.3), a * 0.5); x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(-l * 0.9, 0); x.lineTo(l * 0.85, 0); x.stroke();
    x.restore();
  };
  const tuft = (cx, cy, h, col, a) => {
    x.strokeStyle = css(col, a); x.lineCap = "round";
    for (let k = 0; k < 5; k++) {
      const ang = -Math.PI / 2 + (k - 2) * 0.28 + (r() - 0.5) * 0.2, len = h * (0.6 + r() * 0.5);
      x.lineWidth = 1.4 + r();
      x.beginPath(); x.moveTo(cx + (k - 2) * 1.5, cy);
      x.quadraticCurveTo(cx + Math.cos(ang) * len * 0.4, cy + Math.sin(ang) * len * 0.6, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
      x.stroke();
    }
  };
  if (habitat === 0) {
    // High leaves: leaves hang in from the top corners, sun through them, a mossy branch underfoot.
    const G = [rgb("#4d7446"), rgb("#6a8f55"), rgb("#8cab6c"), rgb("#3f6340")];
    for (let i = 0; i < 16; i++) {
      const left = i % 2 === 0, cx = left ? -142 + r() * 70 : 158 - r() * 70, cy = -188 + r() * 64;
      leaf(cx, cy, 14 + r() * 12, (left ? 0.5 : 2.6) + (r() - 0.5) * 1.4, G[i % 4], 0.34 + r() * 0.24);
    }
    for (let i = 0; i < 5; i++) {
      const gx = -110 + r() * 240, gy = -150 + r() * 90, rad = 14 + r() * 22;
      const g = x.createRadialGradient(gx, gy, 0, gx, gy, rad);
      g.addColorStop(0, "rgba(255,246,206,0.5)"); g.addColorStop(1, "rgba(255,246,206,0)");
      x.fillStyle = g; x.beginPath(); x.arc(gx, gy, rad, 0, TAU); x.fill();
    }
    const bark = rgb("#7a5a3c");
    x.save(); x.rotate(-0.035);
    x.fillStyle = css(bark, 0.55); x.beginPath(); x.moveTo(-150, 2); x.quadraticCurveTo(0, -4, 162, 3); x.lineTo(162, 13); x.quadraticCurveTo(0, 8, -150, 14); x.closePath(); x.fill();
    x.fillStyle = css(rgb("#a78462"), 0.45); x.beginPath(); x.moveTo(-150, 2); x.quadraticCurveTo(0, -4, 162, 3); x.lineTo(162, 6); x.quadraticCurveTo(0, -1, -150, 5); x.closePath(); x.fill();
    for (let i = 0; i < 7; i++) blob(-130 + r() * 280, 1 + r() * 2, 7 + r() * 9, 2.4 + r() * 1.6, 0, rgb("#7f9b52"), 0.5);
    x.restore();
    leaf(-104, 8, 11, 2.2, G[1], 0.5); leaf(120, 10, 9, 0.6, G[2], 0.45);
  } else if (habitat === 1) {
    // Open ground: warm earth, grass tufts, a pebble and a fallen leaf.
    const earth = x.createLinearGradient(0, -24, 0, 22);
    earth.addColorStop(0, "rgba(196,160,104,0)"); earth.addColorStop(0.5, "rgba(190,152,98,0.32)"); earth.addColorStop(1, "rgba(170,132,84,0.45)");
    x.fillStyle = earth; x.fillRect(-142, -24, 300, 46);
    for (let i = 0; i < 9; i++) blob(-130 + r() * 280, 6 + r() * 12, 10 + r() * 22, 3 + r() * 3, (r() - 0.5) * 0.3, rgb("#b38b5c"), 0.18);
    const greens = [rgb("#7c9358"), rgb("#94a863"), rgb("#6c8450")];
    [-122, -88, 96, 132, -40, 60].forEach((tx, i) => tuft(tx + (r() - 0.5) * 10, 6 + r() * 8, i < 4 ? 20 + r() * 12 : 11 + r() * 5, greens[i % 3], 0.6));
    blob(78, 12, 7, 4.6, 0.2, rgb("#9c8e76"), 0.7); blob(76, 10, 3.4, 2, 0.2, rgb("#d8ccb0"), 0.6);
    leaf(-66, 14, 8, 0.4, rgb("#b27a3e"), 0.55);
  } else if (habitat === 2) {
    // The water's edge: damp sand, a band of water with pale ripples, reeds.
    const sand = x.createLinearGradient(0, -18, 0, 8);
    sand.addColorStop(0, "rgba(222,204,164,0)"); sand.addColorStop(1, "rgba(214,196,156,0.5)");
    x.fillStyle = sand; x.fillRect(-142, -18, 300, 26);
    const water = x.createLinearGradient(0, 6, 0, 22);
    water.addColorStop(0, "rgba(120,176,196,0.55)"); water.addColorStop(1, "rgba(86,146,172,0.7)");
    x.fillStyle = water; x.beginPath(); x.moveTo(-142, 10); x.quadraticCurveTo(0, 5, 158, 9); x.lineTo(158, 22); x.lineTo(-142, 22); x.closePath(); x.fill();
    x.strokeStyle = "rgba(255,252,244,0.7)"; x.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const wx = -130 + r() * 270, wy = 11 + r() * 9, l = 8 + r() * 18;
      x.lineWidth = 1 + r(); x.beginPath(); x.moveTo(wx - l, wy); x.quadraticCurveTo(wx, wy - 1.6, wx + l, wy); x.stroke();
    }
    const reed = rgb("#6f8a5a");
    for (let i = 0; i < 7; i++) {
      const bx = -138 + i * 7 + r() * 5, h = 60 + r() * 60, bend = 6 + r() * 10;
      x.strokeStyle = css(reed, 0.5 + r() * 0.2); x.lineWidth = 1.6 + r() * 1.2;
      x.beginPath(); x.moveTo(bx, 8); x.quadraticCurveTo(bx + bend * 0.3, 8 - h * 0.5, bx + bend, 8 - h); x.stroke();
      if (i % 3 === 1) { x.fillStyle = css(rgb("#8a6440"), 0.6); x.beginPath(); x.ellipse(bx + bend * 0.9, 8 - h * 0.86, 2.2, 7, 0.15, 0, TAU); x.fill(); }
    }
  }
}

/* ================= the animal ================= */
/**
 * Everything about one animal's drawing, from its genome, in frame units with
 * (0, 0) on the ground under the body.
 */
function build(g, r) {
  const v = (name) => clamp01(g[T[name]]);
  const web = v("toe_webbing"), claw = v("curved_claws"), fur = v("dense_fur"), legs = v("long_hindlimbs");
  const tail = v("strong_tail"), eyes = v("large_eyes"), sleek = v("streamlined_body");
  const coat = v("coat_shade"), ears = v("ear_tip_shape"), tip = v("tail_tip_marking");

  // Body: round and tall, to long, low and tapered at the front.
  const L = lerp(92, 134, sleek), Hh = lerp(66, 42, sleek), taper = lerp(0.02, 0.4, sleek);
  const frontLen = 30, backLen = lerp(22, 60, legs);
  const sin = Math.max(-0.25, Math.min(0.5, (backLen - frontLen) / (0.58 * L)));
  const cos = Math.sqrt(1 - sin * sin);
  const shoulderL = [0.28 * L, 0.3 * Hh];
  const cy = -frontLen - (shoulderL[0] * sin + shoulderL[1] * cos);
  const world = ([lx, ly]) => [lx * cos - ly * sin, cy + lx * sin + ly * cos];

  // The outline, with tufts that grow with dense fur.
  const tufts = 34, phase = r() * TAU;
  const body = [];
  for (let i = 0; i < 96; i++) {
    const t = (i / 96) * TAU, c = Math.cos(t), s = Math.sin(t);
    let lx = (L / 2) * c, ly = (Hh / 2) * s * (1 - taper * Math.max(0, c)) + (s > 0 ? Hh * 0.04 : 0);
    const tuft = Math.pow(Math.abs(Math.sin(t * tufts / 2 + phase)), 0.55);
    const out = fur * (1.2 + 4.6 * tuft) * (0.8 + 0.4 * r());
    const nx = c / (L / 2), ny = s / (Hh / 2), nl = Math.hypot(nx, ny) || 1;
    lx += (nx / nl) * out; ly += (ny / nl) * out;
    body.push(world([lx, ly]));
  }

  const hip = world([-0.28 * L, 0.26 * Hh]), shoulder = world(shoulderL);
  const rump = world([-0.47 * L, -0.06 * Hh]), neck = world([0.4 * L, -0.22 * Hh]);
  const head = [neck[0] + 15, neck[1] - 14];
  return {
    web, claw, fur, legs, tail, eyes, sleek, coat, ears, tip, L, Hh, sin,
    body, hip, shoulder, rump, neck, head, headR: 20,
    colour: coatColour(coat),
  };
}

/**
 * The shape of a paw on the ground, seen a little from above: four toes fanned
 * forward from the heel. Webbed feet are bigger and spread their toes wide.
 */
function pawShape(cx, a, near) {
  const near1 = near ? 1 : 0.8, size = near1 * lerp(1, 1.55, smooth(0.15, 0.9, a.web));
  const spread = lerp(0.16, 0.5, a.web), len = 10 * size, heel = [cx, -4 * size];
  const toes = [-1.5, -0.5, 0.5, 1.5].map((k) => {
    const ang = -0.12 + k * spread;
    return { ang, tip: [heel[0] + Math.cos(ang) * len, heel[1] + Math.sin(ang) * len * 0.9] };
  });
  // Webbed toes are drawn thinner, so the skin between them shows.
  return { size, len, heel, toes, near1, toeW: lerp(3.2, 1.5, smooth(0.1, 0.8, a.web)) * near1 };
}

/** A paw: webbing between the toes (drawn first, so the toes lie on it), the toes, then the claws. */
function paw(x, cx, a, colour, r, near) {
  const { len, heel, toes, near1, toeW } = pawShape(cx, a, near);
  // Webbing: skin between the toes, reaching further toward the tips as it grows.
  if (a.web > 0.12) {
    // At full webbing the skin's edge bulges a little past the toe tips, like a paddle.
    const f = lerp(0.45, 1, smooth(0.05, 0.7, a.web)), dip = lerp(0.3, -0.1, a.web) * len;
    const at = (t) => [lerp(heel[0], t.tip[0], f), lerp(heel[1], t.tip[1], f)];
    const m = new Path2D();
    m.moveTo(...heel); m.lineTo(...at(toes[0]));
    for (let i = 0; i < toes.length - 1; i++) {
      const p = at(toes[i]), q = at(toes[i + 1]), mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      m.quadraticCurveTo(lerp(mid[0], heel[0], dip / len), lerp(mid[1], heel[1], dip / len), ...q);
    }
    m.closePath();
    paint(x, m, mix(SKIN, colour, 0.1), { r, shade: 0, lineW: 0.8 });
  }
  // The toes, from the heel out (thin, so webbing shows between them), and the pad.
  const toeColour = mix(colour, INK, 0.08);
  for (const t of toes) {
    const line = [heel, [lerp(heel[0], t.tip[0], 0.5), lerp(heel[1], t.tip[1], 0.5)], t.tip];
    paint(x, polygon(ribbon(line, toeW, toeW * 0.7)), toeColour, { r, shade: 0, lineW: 0.7 });
  }
  const pad = new Path2D(); pad.ellipse(heel[0] + 1.5, heel[1] + 0.5, 5 * near1, 3.4 * near1, 0, 0, TAU);
  paint(x, pad, colour, { r, shade: 0.1, lineW: 1 });
  // Claws: ivory hooks at the toe tips, longer and more curved as curved claws grow.
  const clawLen = lerp(1, 10, Math.pow(a.claw, 1.4)) * near1, bend = lerp(0.05, 1, a.claw);
  x.lineCap = "round";
  for (const t of toes) {
    const [tx, ty] = t.tip, dx = Math.cos(t.ang), dy = Math.sin(t.ang) * 0.7;
    const c = new Path2D();
    c.moveTo(tx, ty);
    c.quadraticCurveTo(tx + dx * clawLen * 0.8, ty + dy * clawLen * 0.8 - clawLen * 0.4 * bend, tx + dx * clawLen, ty + dy * clawLen + clawLen * 0.45 * bend);
    x.strokeStyle = css(INK, 0.85); x.lineWidth = lerp(1.7, 3, a.claw) * near1; x.stroke(c);
    x.strokeStyle = css(rgb("#f1e6cc")); x.lineWidth = lerp(0.7, 1.7, a.claw) * near1; x.stroke(c);
  }
}

/**
 * A leg from a joint down to its paw, tapered and rounded. Legs are drawn
 * before the body, so their tops tuck under it.
 */
function leg(x, top, footX, a, colour, r, { back, near }) {
  const w0 = back ? lerp(9, 11, a.legs) : 11, w1 = back ? 5.8 : 6;
  const knee = back ? [top[0] - 6 - 4 * a.legs, top[1] * 0.45] : [top[0] + 1, top[1] * 0.5];
  const start = [top[0], top[1] - 8];
  const line = bezier(start, [knee[0], knee[1] - 4], [footX - 3, knee[1] * 0.5], [footX, -5], 10);
  // The paw first, so the leg comes down onto it.
  paw(x, footX - 2, a, colour, r, near);
  paint(x, polygon(ribbon(line, w0, w1)), colour, { r, shade: 0.16, lineW: 1.2 });
}

/** The thigh of a back leg, over the side of the body: bigger with long back legs. */
function haunch(x, hip, a, colour, r) {
  const p = new Path2D();
  p.ellipse(hip[0] + 1, hip[1] + 4, lerp(12, 17, a.legs), lerp(14, 22, a.legs), -0.3, 0, TAU);
  paint(x, p, colour, { r, shade: 0.2 });
}

/** The tail, thicker as it grows stronger, with a coloured band at the tip. */
function tailShape(x, a, r) {
  const b = a.rump;
  const line = bezier(b, [b[0] - 26, b[1] - 4], [b[0] - 56, b[1] - 26], [b[0] - 50, b[1] - 60], 22);
  const w0 = lerp(4, 17, a.tail), w1 = lerp(2, 7.5, a.tail);
  const path = polygon(ribbon(line, w0, w1));
  const end = line[line.length - 1];
  paint(x, path, a.colour, { r, shade: 0.2 });
  // The band on the tail tip: none, faint, or bright.
  const band = smooth(0.18, 0.85, a.tip);
  if (band > 0.02) {
    const from = Math.floor(line.length * 0.74), part = line.slice(from);
    const bp = polygon(ribbon(part, lerp(w0, w1, from / line.length) + 1, w1 + 1));
    x.save(); x.clip(path);
    x.fillStyle = css(BAND, 0.25 + 0.7 * band); x.fill(bp);
    x.restore();
  }
  return { mid: line[11], end, w0, w1 };
}

/**
 * An ear, morphing from a broad round dome (low ear-tip shape) to a tall
 * pointed ear (high): the same outline points, moved between the two shapes.
 */
function earOutline(base, p, lean, scale = 1) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, ang = Math.PI * (1 - t);
    // Round: half an ellipse, wide and low.
    const rx = base[0] + Math.cos(ang) * 9 * scale, ry = base[1] - Math.sin(ang) * 14 * scale;
    // Pointed: two slightly hollow sides meeting in a sharp tip, narrow and tall.
    const side = t < 0.5 ? t * 2 : (1 - t) * 2, hollow = Math.sin(side * Math.PI) * 1.4;
    const px = base[0] + (t < 0.5 ? -6.5 * (1 - side) + lean * side - hollow : 6.5 * (1 - side) + lean * side + hollow) * scale;
    const py = base[1] - side * 25 * scale;
    pts.push([lerp(rx, px, p), lerp(ry, py, p)]);
  }
  return pts;
}
function ear(x, base, a, colour, r, lean) {
  paint(x, polygon(earOutline(base, a.ears, lean)), colour, { r, shade: 0.12 });
  x.fillStyle = css(SKIN, 0.78);
  x.fill(polygon(earOutline([base[0] + lean * 0.12, base[1] - 1.5], a.ears, lean * 0.7, 0.55)));
}

/** The head: skull, snout, ears, eye and nose. */
function headShape(x, a, r) {
  const [hx, hy] = a.head, R = a.headR, col = a.colour;
  ear(x, [hx - R * 0.5, hy - R * 0.62], a, mix(col, INK, 0.15), r, -3);
  // Skull, with a fuzzier edge for dense fur.
  const skull = [];
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * TAU, tuft = Math.pow(Math.abs(Math.sin(t * 9 + 1.3)), 0.6);
    const rad = R + a.fur * (0.6 + 2.6 * tuft);
    skull.push([hx + Math.cos(t) * rad, hy + Math.sin(t) * rad * 0.94]);
  }
  paint(x, polygon(skull), col, { r, shade: 0.16 });
  // Snout: longer and finer for a sleek body.
  const snout = new Path2D();
  const sx = hx + R * 0.95, sy = hy + R * 0.28, srx = lerp(11, 17, a.sleek), sry = lerp(9, 7, a.sleek);
  snout.ellipse(sx, sy, srx, sry, 0.12, 0, TAU);
  paint(x, snout, mix(col, CREAM, 0.25), { r, shade: 0.1, lineW: 1.2 });
  ear(x, [hx - R * 0.05, hy - R * 0.84], a, col, r, 2);
  // Nose and mouth.
  const nose = new Path2D(); nose.ellipse(sx + srx - 2, sy - 2.5, 3, 2.4, 0, 0, TAU);
  x.fillStyle = css(rgb("#2a1b13")); x.fill(nose);
  x.strokeStyle = css(mix(col, INK, 0.7), 0.7); x.lineWidth = 1; x.beginPath();
  x.moveTo(sx + srx - 4, sy + 3); x.quadraticCurveTo(sx + srx * 0.4, sy + 6, sx, sy + 4); x.stroke();
  // The eye: bigger with large eyes, with a pale ring and a catch-light.
  const ex = hx + R * 0.34, ey = hy - R * 0.14, er = lerp(2.8, 8.8, a.eyes);
  const ring = new Path2D(); ring.arc(ex, ey, er + 1.6, 0, TAU);
  x.fillStyle = css(mix(col, CREAM, 0.55), 0.9); x.fill(ring);
  const eye = new Path2D(); eye.arc(ex, ey, er, 0, TAU);
  x.fillStyle = css(rgb("#1f140c")); x.fill(eye);
  x.fillStyle = "rgba(255,252,240,0.95)";
  x.beginPath(); x.arc(ex + er * 0.32, ey - er * 0.34, Math.max(0.9, er * 0.3), 0, TAU); x.fill();
  return { eye: [ex, ey, er], ears: [hx - R * 0.25, hy - R * 1.45], snout: [sx, sy] };
}

/** The creature's parts, back to front, on a context already in frame units. */
function drawAnimal(y, a, r) {
  const far = mix(a.colour, INK, 0.3), limb = mix(a.colour, INK, 0.12);
  const backFoot = a.hip[0] - 4, frontFoot = a.shoulder[0] + 3;
  // Far legs (darker), the tail, then near legs: all tucked under the body.
  leg(y, [a.hip[0] + 7, a.hip[1] + 2], backFoot + 9, a, far, r, { back: true, near: false });
  leg(y, [a.shoulder[0] - 6, a.shoulder[1] + 2], frontFoot - 5, a, far, r, { back: false, near: false });
  const tl = tailShape(y, a, r);
  leg(y, a.hip, backFoot, a, limb, r, { back: true, near: true });
  leg(y, a.shoulder, frontFoot, a, limb, r, { back: false, near: true });
  // Body, belly and fur strokes.
  const bodyPath = polygon(a.body);
  paint(y, bodyPath, a.colour, { r, shade: 0.22, lineW: 1.7 });
  y.save(); y.clip(bodyPath);
  const belly = new Path2D(); belly.ellipse(a.shoulder[0] * 0.35 + a.hip[0] * 0.35, (a.shoulder[1] + a.hip[1]) / 2 + a.Hh * 0.18, a.L * 0.42, a.Hh * 0.34, a.sin, 0, TAU);
  y.fillStyle = css(mix(a.colour, CREAM, 0.55), 0.55); y.fill(belly);
  if (a.fur > 0.15) {
    y.strokeStyle = css(mix(a.colour, INK, 0.35), 0.25 + 0.4 * a.fur); y.lineWidth = 0.9; y.lineCap = "round";
    for (let i = 0; i < 26; i++) {
      const p = a.body[Math.floor(r() * a.body.length)], inX = p[0] * 0.82, inY = p[1] * 0.9 + 0.1 * (a.hip[1] - 30);
      y.beginPath(); y.moveTo(inX, inY); y.lineTo(inX + (r() - 0.5) * 4, inY + 3 + 5 * a.fur); y.stroke();
    }
  }
  y.restore();
  haunch(y, a.hip, a, limb, r);
  const hd = headShape(y, a, r);
  return { tl, hd, frontFoot };
}

/**
 * The creature alone on a transparent layer the size of the canvas, grained as
 * one, drawn with `transform` (frame units to device pixels). Seeded by the
 * animal, so drawing it twice gives the same animal.
 */
function creatureLayer(w, h, genome, seed, transform) {
  const lay = layerFor(w, h), y = /** @type {CanvasRenderingContext2D} */ (lay.getContext("2d"));
  y.setTransform(1, 0, 0, 1, 0, 0); y.clearRect(0, 0, w, h);
  transform(y);
  const r = mulberry(seed * 9301 + 49297), a = build(genome, r);
  const where = drawAnimal(y, a, r);
  y.setTransform(1, 0, 0, 1, 0, 0);
  y.globalCompositeOperation = "source-atop";
  y.fillStyle = y.createPattern(grain().coat, "repeat"); y.fillRect(0, 0, w, h);
  // Golden-hour light from behind and above: a warm rim along the upper edges.
  const rim = rimFor(w, h), rx = /** @type {CanvasRenderingContext2D} */ (rim.getContext("2d")), d = Math.max(2, Math.round(w / 170));
  rx.globalCompositeOperation = "copy"; rx.drawImage(lay, 0, 0);
  rx.globalCompositeOperation = "source-in"; rx.fillStyle = css(RIM); rx.fillRect(0, 0, w, h);
  rx.globalCompositeOperation = "destination-out"; rx.drawImage(lay, d * 1.2, d * 1.6);
  rx.globalCompositeOperation = "source-over";
  y.globalAlpha = 0.75; y.drawImage(rim, 0, 0); y.globalAlpha = 1;
  y.globalCompositeOperation = "source-over";
  return { lay, a, ...where };
}

/** Parts too small to read on a choice option: they also get a close-up. */
const SMALL_PARTS = ["toe_webbing", "curved_claws", "ear_tip_shape", "tail_tip_marking"];

/**
 * Draw one animal from its genome.
 * @param {HTMLCanvasElement} cv sized by CSS
 * @param {ArrayLike<number>} genome engine body genome (or a group's mean)
 * @param {{seed?:number, focus?:string|null, closeUp?:boolean, glow?:string[], habitat?:number|null}} [opts]
 *   focus: ring the part a trait changes (choice options); closeUp: and, if that part is small, show
 *   it magnified in a corner; glow: traits new in this animal; habitat: a soft wash behind the
 *   animal in its habitat's colour (engine zone index)
 * @returns {{ms:number, parts:Object<string, number[]>}} drawing time, and where each trait's part is (CSS px)
 */
export function paintCreature(cv, genome, { seed = 1, focus = null, closeUp = false, glow = [], habitat = null } = {}) {
  const t0 = performance.now();
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 300, h = cv.clientHeight || 210;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const x = /** @type {CanvasRenderingContext2D} */ (cv.getContext("2d"));
  const k = Math.min(w / FRAME_W, h / FRAME_H), ox = (w - FRAME_W * k) / 2, oy = (h - FRAME_H * k) / 2;
  const toFrame = (c) => { c.setTransform(dpr * k, 0, 0, dpr * k, dpr * (ox + CENTER_X * k), dpr * (oy + GROUND * k)); };
  const { paper } = grain();

  // Paper.
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.fillStyle = "#f4ead3"; x.fillRect(0, 0, w, h);
  // Warm light from the upper left, the paper deepening toward its edges.
  const light = x.createRadialGradient(w * 0.38, h * 0.28, 0, w * 0.45, h * 0.4, Math.max(w, h) * 0.78);
  light.addColorStop(0, "rgba(255,248,226,0.85)"); light.addColorStop(0.6, "rgba(246,230,196,0.2)"); light.addColorStop(1, "rgba(196,168,120,0.45)");
  x.fillStyle = light; x.fillRect(0, 0, w, h);
  x.fillStyle = x.createPattern(paper, "repeat"); x.fillRect(0, 0, w, h);

  // A soft wash in the habitat's colour: leaves, open ground, water's edge.
  toFrame(x);
  if (habitat !== null) habitatScene(x, habitat, seed);
  if (habitat !== null && WASH[habitat]) {
    const wr = mulberry(seed * 31 + 7);
    for (let i = 0; i < 3; i++) {
      const wx = -10 + (wr() - 0.5) * 40, wy = -60 + (wr() - 0.5) * 22, rad = 86 + wr() * 24;
      const wg = x.createRadialGradient(wx, wy, rad * 0.2, wx, wy, rad);
      wg.addColorStop(0, css(WASH[habitat], 0.16)); wg.addColorStop(1, css(WASH[habitat], 0));
      x.fillStyle = wg; x.beginPath(); x.ellipse(wx, wy, rad * 1.35, rad * 0.8, 0, 0, TAU); x.fill();
    }
  }

  // The creature on its own layer, so it can be grained and softened as one.
  const { lay, a, tl, hd, frontFoot } = creatureLayer(cv.width, cv.height, genome, seed, toFrame);
  // Ground shadow.
  const sh = x.createRadialGradient(0, 0, 4, 0, 0, a.L * 0.75);
  sh.addColorStop(0, "rgba(64,44,24,0.34)"); sh.addColorStop(1, "rgba(64,44,24,0)");
  x.save(); x.translate(10, 0); x.scale(1.15, 0.16); x.fillStyle = sh; x.beginPath(); x.arc(0, 0, a.L * 0.75, 0, TAU); x.fill(); x.restore();

  // Where each trait's part is, in frame units, for glows and focus rings.
  const bodyC = [(a.hip[0] + a.shoulder[0]) / 2, (a.hip[1] + a.shoulder[1]) / 2 - a.Hh * 0.2];
  const fr = pawShape(frontFoot - 2, a, true), toeMid = fr.toes[1].tip;
  const fp = {
    toe_webbing: [(fr.heel[0] + toeMid[0]) / 2 + 1, fr.heel[1] - 1, fr.len * 0.8, fr.len * 0.62],
    curved_claws: [toeMid[0] + 4, toeMid[1] + 1, 10, 8],
    dense_fur: [bodyC[0], bodyC[1], a.L * 0.6, a.Hh * 0.7],
    long_hindlimbs: [a.hip[0], a.hip[1] / 2 - 2, 16, -a.hip[1] / 2 + 8],
    strong_tail: [tl.mid[0], tl.mid[1], 22, 26],
    large_eyes: [hd.eye[0], hd.eye[1], hd.eye[2] + 7, hd.eye[2] + 7],
    streamlined_body: [bodyC[0] + 8, bodyC[1], a.L * 0.62, a.Hh * 0.62],
    coat_shade: [bodyC[0], bodyC[1], a.L * 0.55, a.Hh * 0.55],
    ear_tip_shape: [hd.ears[0], hd.ears[1], 17, 14],
    tail_tip_marking: [tl.end[0], tl.end[1] + 4, 12, 14],
  };

  // The part that is new in this animal: warm light under it (a soft ring and a few
  // sparkles are drawn over the creature, below), like a bloom on the map.
  for (const trait of glow) {
    const p = fp[trait]; if (!p) continue;
    const rad = Math.max(24, Math.max(p[2], p[3]) * 1.5);
    const gr = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], rad);
    gr.addColorStop(0, "rgba(255,224,150,0.85)"); gr.addColorStop(0.5, "rgba(255,222,150,0.35)"); gr.addColorStop(1, "rgba(255,222,150,0)");
    x.fillStyle = gr; x.beginPath(); x.arc(p[0], p[1], rad, 0, TAU); x.fill();
  }
  // The creature, softened at the edges like paint on paper.
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.save();
  x.shadowColor = "rgba(58,38,18,0.3)"; x.shadowBlur = 5 * dpr; x.shadowOffsetY = 1 * dpr;
  x.drawImage(lay, 0, 0);
  x.restore();

  if (glow.length) {
    toFrame(x);
    const sr = mulberry(seed * 7 + 3);
    for (const trait of glow) {
      const p = fp[trait]; if (!p) continue;
      const rad = Math.max(16, Math.max(p[2], p[3]) * 1.15);
      x.strokeStyle = "rgba(255,236,190,0.95)"; x.lineWidth = 2.4 / k;
      x.beginPath(); x.ellipse(p[0], p[1], rad, rad * 0.92, 0, 0, TAU); x.stroke();
      x.strokeStyle = "rgba(214,150,60,0.55)"; x.lineWidth = 1 / k;
      x.beginPath(); x.ellipse(p[0], p[1], rad + 2.6, rad * 0.92 + 2.6, 0, 0, TAU); x.stroke();
      x.fillStyle = "rgba(255,246,220,0.95)";
      for (let i = 0; i < 4; i++) {
        const ang = -Math.PI * (0.2 + 0.6 * sr()), d = rad * (1.1 + 0.5 * sr()), s = 2.6 + sr() * 2.4;
        const cx = p[0] + Math.cos(ang) * d, cy = p[1] + Math.sin(ang) * d;
        x.beginPath(); x.moveTo(cx, cy - s);
        x.quadraticCurveTo(cx + s * 0.15, cy - s * 0.15, cx + s, cy); x.quadraticCurveTo(cx + s * 0.15, cy + s * 0.15, cx, cy + s);
        x.quadraticCurveTo(cx - s * 0.15, cy + s * 0.15, cx - s, cy); x.quadraticCurveTo(cx - s * 0.15, cy - s * 0.15, cx, cy - s);
        x.fill();
      }
    }
  }
  // A ring around the part a choice is about.
  const p = focus && fp[focus];
  if (p) {
    toFrame(x);
    x.save(); x.strokeStyle = FOCUS; x.lineWidth = 2.2 / k; x.setLineDash([6 / k, 5 / k]);
    x.beginPath(); x.ellipse(p[0], p[1], p[2], p[3], 0, 0, TAU); x.stroke(); x.restore();
  }
  // A small part also gets a close-up in a corner, drawn again at a bigger scale (crisp, not stretched).
  if (p && closeUp && SMALL_PARTS.includes(focus)) {
    const R = Math.min(w, h) * 0.22, zoom = Math.max(1.8, Math.min(4, (0.8 * R) / (Math.max(p[2], p[3]) * k)));
    const px = ox + (CENTER_X + p[0]) * k, py = oy + (GROUND + p[1]) * k;
    const cx = w - R - 7, cy = focus === "tail_tip_marking" ? R + 7 : h - R - 7, s = k * zoom;
    const near = creatureLayer(cv.width, cv.height, genome, seed,
      (c) => c.setTransform(dpr * s, 0, 0, dpr * s, dpr * (cx - p[0] * s), dpr * (cy - p[1] * s)));
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    // A dashed line from the part to its close-up.
    const d = Math.hypot(cx - px, cy - py) || 1, ux = (cx - px) / d, uy = (cy - py) / d, from = Math.min(p[2], p[3]) * k + 2;
    x.save(); x.strokeStyle = FOCUS; x.lineWidth = 1.6; x.setLineDash([4, 4]);
    x.beginPath(); x.moveTo(px + ux * from, py + uy * from); x.lineTo(cx - ux * (R + 2), cy - uy * (R + 2)); x.stroke(); x.restore();
    x.save();
    x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip();
    x.fillStyle = "#f6eedb"; x.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    x.fillStyle = x.createPattern(paper, "repeat"); x.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.drawImage(near.lay, 0, 0);
    x.restore();
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.strokeStyle = "rgba(255,250,238,0.95)"; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.stroke();
    x.strokeStyle = FOCUS; x.lineWidth = 2.2; x.beginPath(); x.arc(cx, cy, R + 1.5, 0, TAU); x.stroke();
  }
  const parts = {};
  for (const [trait, q] of Object.entries(fp)) parts[trait] = [ox + (CENTER_X + q[0]) * k, oy + (GROUND + q[1]) * k, q[2] * k, q[3] * k];
  return { ms: performance.now() - t0, parts };
}
