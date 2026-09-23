/**
 * LINEAGE — Milestone 2: the frozen M1 engine on the designed canvas.
 *
 * One engine generation happens every GENERATION_SECONDS; between generations
 * the animals only wander. Births, deaths, mutation flashes and every count on
 * screen come from the engine's records. The group you follow is a family, a
 * mother line (families.js).
 */

import { Bridge } from "./bridge.js";
import { FIXTURE_URL } from "./engine.js";
import { World, clamp, TAU } from "./world.js";
import { Herd } from "./herd.js";
import {
  START_LINE, followLine, branchLine, familyLines, otherLabel, memberLabel,
} from "./narration.js";

/** Real seconds per engine generation. */
export const GENERATION_SECONDS = 8;

const LOG_MS = 3800;
const LABEL_MS = 8000;
/** In the defining world, seed 6 lets the webbed canopy family's decline play out over a few generations. */
const DEFAULT_SEED = 6;

export class Game {
  /**
   * @param {Document} doc
   * @param {Bridge} bridge the engine world to show
   */
  constructor(doc, bridge) {
    const $ = (id) => /** @type {HTMLElement} */ (doc.getElementById(id));
    this.stage = $("stage");
    this.cv = /** @type {HTMLCanvasElement} */ ($("world"));
    this.ctx = /** @type {CanvasRenderingContext2D} */ (this.cv.getContext("2d"));
    this.hintEl = $("hint");
    this.homeEl = $("home");
    this.logEl = $("log");
    this.genEl = $("gen");
    this.barEl = $("genbar");
    this.countsEl = $("counts");
    this.zonesEl = $("zones");
    this.labelEl = $("label");
    this.labelWhoEl = $("label-who");
    this.labelAboutEl = $("label-about");
    this.branchEl = $("branch");

    this.world = new World();
    this.bridge = bridge;
    this.herd = new Herd(this.world, 7919);
    this.herd.placeFounders(this.bridge);

    this.cam = { x: 0, y: 0 };
    this.camTween = null;
    this.logQueue = [];
    this.logTimer = 0;
    this.clock = 0;
    this.label = null;
    this.last = performance.now();

    this.setupCanvas();
    this.bindInput();

    // No family yet: the first follow is the player's choice. The camera
    // opens on the first founding family, high in the leaves.
    const first = this.herd.centroidOf(this.bridge.families.founding[0].ids);
    this.cam.x = first.x - this.vw / 2; this.cam.y = first.y - this.vh / 2; this.clampCam();
    this.say([START_LINE]);
    this.updateHud();
    this.world.paint();

    this.step = (t) => {
      try { this.frame(t); } catch (err) { console.error("lineage frame failed", err); return; }
      this.raf = requestAnimationFrame(this.step);
    };
    this.raf = requestAnimationFrame(this.step);
  }

  /* ================= engine generations ================= */
  generation(now) {
    const ev = this.bridge.step();
    if (!ev) return;
    this.herd.applyGeneration(ev, this.bridge, now);
    const f = ev.family;
    if (f && f.count === 0) {
      // Your group has ended. The world keeps running; any animal can start a new story.
      this.bridge.stopFollowing();
      this.herd.following = false;
      this.herd.resetFlashes();
    }
    this.herd.followed = new Set(this.bridge.followedIds());
    if (this.bridge.extinct) this.say(["No animals are left anywhere in the world."]);
    else if (f) this.say(familyLines(f));
    this.updateHud();
    if (this.label) this.showLabel(this.label.id, this.label.until); // counts change each generation
    console.info(
      `[lineage] generation ${ev.generation}: ${ev.births.length} births, ${ev.deaths.length} deaths, ` +
      `${ev.mutations.length} mutations at birth` +
      (f ? ` · your group ${f.count} (was ${f.before}: +${f.born.length} −${f.gone.length}, ${f.mutated.length} new traits)` : "")
    );
    if (ev.observerErrors.length) console.warn("[lineage] observer errors", ev.observerErrors);
  }

  /* ================= following ================= */
  /** Follow the family of the tapped animal's ancestor a few generations back. */
  followFamily(animal) {
    const f = this.bridge.followFamilyOf(animal.id);
    this.startGroup(followLine(this.bridge.zoneOf(animal.id), f.members.size));
  }

  /** Narrow to one member's own line. */
  followBranch(id) {
    const f = this.bridge.followBranchOf(id);
    this.startGroup(branchLine(f.members.size));
  }

  startGroup(line) {
    this.herd.followed = new Set(this.bridge.followedIds());
    this.herd.following = true;
    this.herd.resetFlashes();
    this.closeLabel();
    this.hideHint();
    this.say([line]);
    this.centerOnFollowed(false);
    this.updateHud();
  }

  updateHud() {
    const zones = this.bridge.zoneCounts();
    this.genEl.textContent = String(this.bridge.generation);
    this.countsEl.textContent = `${this.bridge.living.length} animals alive · ` +
      (this.bridge.follow ? `your group ${this.herd.followed.size}` : "no group");
    this.zonesEl.textContent = `leaves ${zones[0]} · ground ${zones[1]} · water's edge ${zones[2]}`;
  }

  /* ================= the label on a tapped animal ================= */
  /** Other families can be looked at but not chosen; a member of yours offers her branch. */
  showLabel(id, until = performance.now() + LABEL_MS) {
    const ind = this.bridge.get(id);
    if (!ind) { this.closeLabel(); return; }
    const follow = this.bridge.follow;
    this.branchEl.hidden = true;
    if (!this.herd.followed.has(id)) {
      this.labelWhoEl.textContent = "Another family";
      this.labelAboutEl.textContent = otherLabel(this.bridge.zoneOf(id), this.bridge.familySizeOf(id), ind.bodyGenome);
    } else if (follow.root === id) {
      this.labelWhoEl.textContent = "She started this branch";
      this.labelAboutEl.textContent = memberLabel(ind.bodyGenome);
    } else {
      const size = this.bridge.branchSizeOf(id);
      const narrower = size < follow.members.size;
      this.labelWhoEl.textContent = "In your family";
      this.labelAboutEl.textContent = memberLabel(ind.bodyGenome, narrower ? size : undefined);
      this.branchEl.hidden = !narrower;
    }
    this.label = { id, until };
    this.labelEl.hidden = false;
  }
  closeLabel() {
    this.label = null;
    this.labelEl.hidden = true;
  }
  placeLabel(now) {
    if (!this.label) return;
    const a = this.herd.animals.get(this.label.id);
    if (!a || now > this.label.until) { this.closeLabel(); return; }
    const sx = clamp(a.x - this.cam.x, 130, this.vw - 130), sy = Math.max(90, a.y - this.cam.y - 30);
    this.labelEl.style.transform = `translate(${sx.toFixed(0)}px, ${sy.toFixed(0)}px) translate(-50%, -100%)`;
  }

  /* ================= narration ================= */
  /** Replace whatever is queued: the log only ever speaks about now. */
  say(lines) { this.logQueue = lines.slice(); this.logTimer = 0; }
  pumpLog(dt) {
    this.logTimer -= dt;
    if (this.logTimer <= 0 && this.logQueue.length) {
      this.logEl.textContent = this.logQueue.shift();
      this.logEl.style.animation = "none"; void this.logEl.offsetWidth;
      this.logEl.style.animation = "lgIn .55s ease both";
      this.logTimer = LOG_MS;
    }
  }

  /* ================= canvas & camera ================= */
  setupCanvas() {
    this.onResize = () => {
      this.DPR = Math.min(devicePixelRatio || 1, 2);
      this.vw = this.stage.clientWidth; this.vh = this.stage.clientHeight;
      this.cv.width = Math.floor(this.vw * this.DPR); this.cv.height = Math.floor(this.vh * this.DPR);
      this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
      this.clampCam();
    };
    addEventListener("resize", this.onResize);
    this.onResize();
  }
  clampCam() {
    this.cam.x = clamp(this.cam.x, 0, Math.max(0, this.world.W - this.vw));
    this.cam.y = clamp(this.cam.y, 0, Math.max(0, this.world.H - this.vh));
  }
  /** The camera centres on your family. */
  centerOnFollowed(instant) {
    const p = this.herd.followedCentroid(); if (!p) return;
    const tx = p.x - this.vw / 2, ty = p.y - this.vh / 2;
    if (instant) { this.cam.x = tx; this.cam.y = ty; this.clampCam(); }
    else this.camTween = { x: tx, y: ty, t: 0 };
  }

  /* ================= frame ================= */
  frame(now) {
    const raw = Math.max(0, now - this.last); this.last = now;
    const dt = Math.min(48, raw);

    // The generation clock follows real time, but a hidden tab or a long
    // stall never releases a burst of generations.
    this.clock += Math.min(250, raw);
    const GEN_MS = GENERATION_SECONDS * 1000;
    if (this.clock >= GEN_MS) {
      this.clock = Math.min(this.clock - GEN_MS, GEN_MS - 1);
      if (!this.bridge.extinct) this.generation(now);
    }
    this.barEl.style.width = `${(100 * this.clock / GEN_MS).toFixed(1)}%`;

    this.herd.tick(dt, now);
    this.pumpLog(dt);
    if (this.camTween) {
      const tw = this.camTween;
      tw.t = Math.min(1, tw.t + dt / 620);
      const e = 1 - Math.pow(1 - tw.t, 3);
      this.cam.x += (tw.x - this.cam.x) * e * 0.3;
      this.cam.y += (tw.y - this.cam.y) * e * 0.3;
      if (tw.t >= 1) { this.cam.x = tw.x; this.cam.y = tw.y; this.camTween = null; }
      this.clampCam();
    }
    this.render(now);
    this.placeLabel(performance.now());
  }

  render(now) {
    const x = this.ctx, vw = this.vw, vh = this.vh, W = this.world.W, H = this.world.H;
    x.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    x.fillStyle = "#A2977C"; x.fillRect(0, 0, vw, vh);
    x.save();
    x.translate(-this.cam.x, -this.cam.y);

    const vx = this.cam.x, vy = this.cam.y;
    const terrain = this.world.terrain;
    if (terrain) {
      const sx = clamp(vx, 0, W), sy = clamp(vy, 0, H);
      const sw = clamp(vw + (vx - sx), 0, W - sx), sh = clamp(vh + (vy - sy), 0, H - sy);
      if (sw > 0 && sh > 0) x.drawImage(terrain, sx, sy, sw, sh, sx, sy, sw, sh);
    }

    /* classroom light: a warm lift so the world survives fluorescent tubes */
    x.fillStyle = "rgba(255,247,227," + (0.05 + 0.17 * 0.35).toFixed(3) + ")";
    x.fillRect(vx, vy, vw, vh);

    /* home ground — a soft pool of light where your group lives */
    const home = this.herd.followedCentroid();
    if (home) {
      const R = 430;
      const grd = x.createRadialGradient(home.x, home.y, 0, home.x, home.y, R);
      grd.addColorStop(0, "rgba(255,246,214,0.20)");
      grd.addColorStop(0.6, "rgba(255,244,208,0.08)");
      grd.addColorStop(1, "rgba(255,244,208,0)");
      x.fillStyle = grd;
      x.beginPath(); x.arc(home.x, home.y, R, 0, TAU); x.fill();
    }

    this.herd.draw(x, { x: vx, y: vy, w: vw, h: vh }, now);
    x.restore();

    const onScreen = home && home.x > vx && home.x < vx + vw && home.y > vy && home.y < vy + vh;
    const want = !!home && !onScreen;
    if (want !== this.homeShown) {
      this.homeShown = want;
      this.homeEl.style.opacity = want ? "1" : "0";
      this.homeEl.style.pointerEvents = want ? "auto" : "none";
    }
  }

  /* ================= input ================= */
  bindInput() {
    const s = this.stage;
    this.ptrs = new Map();
    s.addEventListener("pointerdown", (e) => {
      if (/** @type {HTMLElement} */ (e.target).closest("button, #label")) return;
      s.setPointerCapture(e.pointerId);
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.ptrs.size === 1) { this.dragging = true; this.moved = 0; this.startT = performance.now(); this.camTween = null; }
    });
    s.addEventListener("pointermove", (e) => {
      if (!this.ptrs.has(e.pointerId)) return;
      const prev = this.ptrs.get(e.pointerId);
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.ptrs.size === 1 && this.dragging) {
        const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        this.moved += Math.hypot(dx, dy);
        this.cam.x -= dx; this.cam.y -= dy;
        this.clampCam();
        if (this.moved > 26) this.hideHint();
      }
    });
    const end = (e) => {
      if (!this.ptrs.has(e.pointerId)) return;
      const p = this.ptrs.get(e.pointerId);
      this.ptrs.delete(e.pointerId);
      if (this.ptrs.size === 0) {
        if (this.dragging && this.moved < 12 && performance.now() - this.startT < 460) this.tapAt(p.x, p.y);
        this.dragging = false;
      }
    };
    s.addEventListener("pointerup", end);
    s.addEventListener("pointercancel", end);
    this.homeEl.addEventListener("click", () => { this.centerOnFollowed(false); this.hideHint(); });
    this.branchEl.addEventListener("click", () => { if (this.label) this.followBranch(this.label.id); });
    this.hintT = setTimeout(() => this.hideHint(), 9000);
  }
  hideHint() {
    if (this.hintGone) return;
    this.hintGone = true;
    this.hintEl.style.opacity = "0";
  }
  tapAt(px, py) {
    const rect = this.stage.getBoundingClientRect();
    const a = this.herd.hit(this.cam.x + px - rect.left, this.cam.y + py - rect.top);
    if (!a) { this.closeLabel(); return; }
    // With no family, any animal starts a new one. Otherwise tapping looks.
    if (!this.bridge.follow) this.followFamily(a);
    else this.showLabel(a.id);
  }
}

/** The defining-experiment world, or the engine's random world if the fixture can't be read. */
async function loadWorld(seed) {
  try {
    const res = await fetch(FIXTURE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Bridge.fromFixture(await res.json(), seed);
  } catch (err) {
    console.warn("[lineage] defining fixture unavailable; using a random world", err);
    return Bridge.fromRandom(seed);
  }
}

// ---- bootstrap ----
if (typeof document !== "undefined") {
  const q = new URLSearchParams(location.search);
  const seed = Number.parseInt(q.get("seed") ?? "", 10);
  loadWorld(Number.isFinite(seed) && seed > 0 ? seed : DEFAULT_SEED).then((bridge) => {
    globalThis.lineageGame = new Game(document, bridge); // for poking at the live engine from the console
  });
}
