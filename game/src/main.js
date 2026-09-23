/**
 * LINEAGE — Milestone 2: the frozen M1 engine on the designed canvas, played
 * as a story (scope decision 6, rules in story.js).
 *
 * Time waits for the child: the animals wander from the start, but no
 * generation runs until an animal is tapped and its family followed. Then one
 * engine generation happens every GENERATION_SECONDS. At each choice point the
 * world pauses; after a choice it fast-forwards. Births, deaths, mutation
 * flashes and every count on screen come from the engine's records.
 */

import { Bridge } from "./bridge.js";
import { FIXTURE_URL } from "./engine.js";
import { World, clamp, TAU } from "./world.js";
import { Herd, drawPortrait } from "./herd.js";
import {
  Story, GENERATION_SECONDS, FAST_SECONDS, CHOICE_SECONDS, SKIP_GENERATIONS, STORY_CHOICES,
} from "./story.js";
import { changedTraits, traitRows, typicalOf } from "./variations.js";
import {
  START_LINE, followLine, familyLines, otherLabel, notable, NOTHING_SPREAD, TIMES_UP, optionLine,
  chosenLines, skipDoneLines, LAST_PASSED, MADE_IT, endingTitle, QUESTION, choiceRecap, NO_CHOICES,
} from "./narration.js";

const LOG_MS = 3800;
const LABEL_MS = 8000;
/** How long a chosen animal stays highlighted before the fast-forward. */
const PICKED_MS = 1200;
/** How long "Time's up!" shows before the fast-forward. */
const TIMES_UP_MS = 2800;
/** How long the story's last moment shows before the reflection screen. */
const ENDING_DELAY_MS = 2600;
/** The animals move this much faster during a fast-forward. */
const FAST_PACE = 2.5;
/** In the defining world, seed 6 lets the webbed canopy family's decline play out over a few generations. */
const DEFAULT_SEED = 6;

export class Game {
  /**
   * @param {Document} doc
   * @param {Bridge} bridge the engine world to show, at generation 0
   * @param {{seed:number, loadWorld:(seed:number)=>Promise<Bridge>}} world how to make this world again, or another
   */
  constructor(doc, bridge, { seed, loadWorld }) {
    const $ = (id) => /** @type {HTMLElement} */ (doc.getElementById(id));
    this.doc = doc;
    this.stage = $("stage");
    this.cv = /** @type {HTMLCanvasElement} */ ($("world"));
    this.ctx = /** @type {CanvasRenderingContext2D} */ (this.cv.getContext("2d"));
    this.hintEl = $("hint");
    this.homeEl = $("home");
    this.logEl = $("log");
    this.genEl = $("gen");
    this.barEl = $("genbar");
    this.fastEl = $("fast");
    this.countsEl = $("counts");
    this.zonesEl = $("zones");
    this.labelEl = $("label");
    this.labelWhoEl = $("label-who");
    this.labelAboutEl = $("label-about");
    this.choiceEl = $("choice");
    this.choiceCountEl = $("choice-count");
    this.optionsEl = $("options");
    this.choiceBarEl = $("choice-bar");
    this.choiceNoteEl = $("choice-note");
    this.endingEl = $("ending");
    this.endingTitleEl = $("ending-title");
    this.endingAnimalEl = /** @type {HTMLCanvasElement} */ ($("ending-animal"));
    this.endingTraitsEl = $("ending-traits");
    this.endingChoicesEl = $("ending-choices");
    this.endingQuestionEl = $("ending-question");
    this.revealEl = $("reveal");

    this.world = new World();
    this.seed = seed;
    this.loadWorld = loadWorld;
    this.cam = { x: 0, y: 0 };
    this.camTween = null;
    this.logQueue = [];
    this.logTimer = 0;
    this.label = null;
    this.last = performance.now();

    this.setupCanvas();
    this.bindInput();
    this.start(bridge);
    this.world.paint();

    this.step = (t) => {
      try { this.frame(t); } catch (err) { console.error("lineage frame failed", err); return; }
      this.raf = requestAnimationFrame(this.step);
    };
    this.raf = requestAnimationFrame(this.step);
  }

  /** A world at generation 0: the animals wander, and time waits for the child's first tap. */
  start(bridge) {
    this.bridge = bridge;
    this.story = new Story(bridge);
    this.herd = new Herd(this.world, 7919);
    this.herd.placeFounders(bridge);
    this.clock = 0;
    this.choice = null;
    this.endingAt = null;
    this.saidNothingSpread = false;
    this.closeLabel();
    this.choiceEl.classList.remove("open");
    this.choiceEl.hidden = true;
    this.endingEl.hidden = true;
    // The camera opens on the first founding family, high in the leaves.
    const first = this.herd.centroidOf(bridge.families.founding[0].ids);
    this.camTween = null;
    this.cam.x = first.x - this.vw / 2; this.cam.y = first.y - this.vh / 2; this.clampCam();
    this.showHint();
    this.say([START_LINE]);
    this.updateHud();
  }

  /* ================= engine generations ================= */
  generation(now) {
    const ev = this.bridge.step();
    if (!ev) return;
    const fast = this.story.fast;
    this.herd.applyGeneration(ev, this.bridge, now);
    const what = this.story.afterGeneration(ev);
    this.herd.followed = new Set(this.bridge.followedIds());
    this.herd.pace = this.story.fast ? FAST_PACE : 1;
    this.updateHud();
    if (this.label) this.showLabel(this.label.id, this.label.until); // counts change each generation
    if (what === "ended") this.storyEnded();
    else if (what === "choice") this.openChoice(now);
    else if (what === "skip-done") this.fastForwardDone();
    else if (!fast) {
      // Watching: narrate each generation. During a fast-forward, only its end is narrated.
      const lines = familyLines(ev.family);
      if (what === "no-choice" && !this.saidNothingSpread) { lines.push(NOTHING_SPREAD); this.saidNothingSpread = true; }
      this.say(lines);
    }
    const f = ev.family;
    console.info(
      `[lineage] generation ${ev.generation}: ${ev.births.length} births, ${ev.deaths.length} deaths, ` +
      `${ev.mutations.length} mutations at birth` +
      (f ? ` · your family ${f.count} (was ${f.before}: +${f.born.length} −${f.gone.length}, ${f.mutated.length} new traits)` : "") +
      ` · story: ${this.story.phase}`
    );
    if (ev.observerErrors.length) console.warn("[lineage] observer errors", ev.observerErrors);
  }

  /* ================= the story ================= */
  /** The first tap: follow the family of the tapped animal's ancestor a few generations back. Time starts. */
  begin(animal) {
    const f = this.story.begin(animal.id);
    this.herd.followed = new Set(f.members);
    this.herd.following = true;
    this.herd.resetFlashes();
    this.clock = 0;
    this.closeLabel();
    this.hideHint();
    this.say([followLine(this.bridge.zoneOf(animal.id), f.members.size)]);
    this.centerOnFollowed(false);
    this.updateHud();
  }

  /** A choice point: the world pauses, and two or three family members are offered. */
  openChoice(now) {
    const s = this.story;
    this.closeLabel();
    this.choiceCountEl.textContent = `Choice ${s.choices.length + 1} of ${STORY_CHOICES}`;
    this.choiceNoteEl.textContent = "";
    this.choiceBarEl.style.width = "100%";
    // Shown in a random order, so the most common variation isn't always first.
    const shown = s.options.map((o) => ({ o, k: Math.random() })).sort((a, b) => a.k - b.k).map(({ o }) => o);
    this.optionEls = shown.map((o) => {
      const el = this.doc.createElement("button");
      el.type = "button";
      el.className = "option";
      el.append(this.doc.createElement("canvas"), Object.assign(this.doc.createElement("span"), { textContent: optionLine(o.words) }));
      el.addEventListener("click", () => this.pick(o, false, performance.now()));
      return Object.assign(el, { option: o });
    });
    this.optionsEl.replaceChildren(...this.optionEls);
    clearTimeout(this.choiceHideT);
    this.choiceEl.hidden = false;
    for (const el of this.optionEls) drawPortrait(el.querySelector("canvas"), this.bridge.get(el.option.id).bodyGenome, el.option.trait);
    requestAnimationFrame(() => this.choiceEl.classList.add("open"));
    this.choice = { until: now + CHOICE_SECONDS * 1000, picked: null };
    this.centerOnFollowed(false, 0.3);
  }

  pick(option, byChance, now) {
    const c = this.choice;
    if (!c || c.picked) return;
    Object.assign(c, { picked: option, byChance, goAt: now + (byChance ? TIMES_UP_MS : PICKED_MS) });
    for (const el of this.optionEls) {
      el.disabled = true;
      el.classList.add(el.option === option ? "picked" : "not-picked");
    }
    if (byChance) this.choiceNoteEl.textContent = TIMES_UP;
  }

  /** While the world is paused: the countdown, then the random pick if time runs out. */
  tickChoice(now) {
    const c = this.choice;
    if (!c) return;
    if (c.picked) {
      if (now >= c.goAt) this.followChoice(c.picked, c.byChance);
      return;
    }
    const left = Math.max(0, c.until - now);
    this.choiceBarEl.style.width = `${(100 * left / (CHOICE_SECONDS * 1000)).toFixed(1)}%`;
    if (left === 0) {
      const options = this.story.options;
      this.pick(options[Math.floor(Math.random() * options.length)], true, now);
    }
  }

  /** Narrow to the mother lines of the variation's carriers, then fast-forward. */
  followChoice(option, byChance) {
    this.choice = null;
    this.choiceEl.classList.remove("open");
    this.choiceHideT = setTimeout(() => { if (!this.choice) this.choiceEl.hidden = true; }, 450);
    this.story.choose(option, byChance);
    this.herd.followed = new Set(this.bridge.followedIds());
    this.herd.resetFlashes();
    // A moment to see whom you follow now, then the fast-forward starts as the log says so.
    this.clock = FAST_SECONDS * 1000 - LOG_MS;
    this.say(chosenLines(option.words, this.herd.followed.size, SKIP_GENERATIONS));
    this.centerOnFollowed(false);
    this.updateHud();
  }

  fastForwardDone() {
    const s = this.story;
    this.saidNothingSpread = false;
    this.say(skipDoneLines(SKIP_GENERATIONS, this.herd.followed.size, changedTraits(s.formBeforeChoice, s.lastForm)));
    this.centerOnFollowed(false);
    this.updateHud();
  }

  /** The line died out, or the last choice's fast-forward finished. A moment, then the reflection screen. */
  storyEnded() {
    this.say([this.story.outcome === "died" ? LAST_PASSED : MADE_IT]);
    this.endingAt = performance.now() + ENDING_DELAY_MS;
    this.updateHud();
  }

  /** Every ending is a reflection screen, not a game-over screen. */
  showEnding() {
    const s = this.story, doc = this.doc;
    this.endingTitleEl.textContent = endingTitle(s.outcome, s.lasted);
    this.endingTraitsEl.replaceChildren(...traitRows(s.lastForm, s.startForm).map((r) => {
      const row = doc.createElement("div");
      row.className = r.changed ? "row changed" : "row";
      row.append(Object.assign(doc.createElement("span"), { className: "k", textContent: r.label }),
        Object.assign(doc.createElement("span"), { className: "v", textContent: r.value }));
      return row;
    }));
    const recaps = s.choices.length ? s.choices.map(choiceRecap) : [NO_CHOICES];
    this.endingChoicesEl.replaceChildren(...recaps.map((t) => Object.assign(doc.createElement("li"), { textContent: t })));
    this.endingChoicesEl.classList.toggle("none", !s.choices.length);
    this.endingQuestionEl.textContent = QUESTION[s.outcome];
    // Surviving families will later be revealed as the real animal they most resemble.
    this.revealEl.hidden = s.outcome !== "survived";
    this.endingEl.hidden = false;
    drawPortrait(this.endingAnimalEl, typicalOf(s.lastAnimals).genome);
  }

  /** Same seed: the same world again from generation 0. A new seed: a new world. */
  async restart(seed) {
    this.endingEl.hidden = true;
    const bridge = await this.loadWorld(seed);
    this.seed = seed;
    history.replaceState(null, "", `?seed=${seed}`);
    this.start(bridge);
  }

  updateHud() {
    const zones = this.bridge.zoneCounts();
    const following = this.story.phase !== "waiting" && this.story.phase !== "ended";
    this.genEl.textContent = String(this.bridge.generation);
    this.countsEl.textContent = `${this.bridge.living.length} animals alive · ` +
      (following ? `your family ${this.herd.followed.size}` : this.story.phase === "ended" ? "story over" : "no family yet");
    this.zonesEl.textContent = `leaves ${zones[0]} · ground ${zones[1]} · water's edge ${zones[2]}`;
    this.fastEl.hidden = !(this.story.fast && this.clock >= 0);
    if (!this.story.running) this.barEl.style.width = "0%";
  }

  /* ================= the label on a tapped animal ================= */
  /** Any animal can be looked at; only choice points change whom you follow. */
  showLabel(id, until = performance.now() + LABEL_MS) {
    const ind = this.bridge.get(id);
    if (!ind) { this.closeLabel(); return; }
    if (this.herd.followed.has(id)) {
      this.labelWhoEl.textContent = "In your family";
      this.labelAboutEl.textContent = notable(ind.bodyGenome);
    } else {
      this.labelWhoEl.textContent = "Another family";
      this.labelAboutEl.textContent = otherLabel(this.bridge.zoneOf(id), this.bridge.familySizeOf(id), ind.bodyGenome);
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
  /** The camera centres on your family, `high` of the screen above the middle (to clear a panel). */
  centerOnFollowed(instant, high = 0) {
    const p = this.herd.followedCentroid(); if (!p) return;
    const tx = p.x - this.vw / 2, ty = p.y - this.vh * (0.5 - high);
    if (instant) { this.cam.x = tx; this.cam.y = ty; this.clampCam(); }
    else this.camTween = { x: tx, y: ty, t: 0 };
  }

  /* ================= frame ================= */
  frame(now) {
    const raw = Math.max(0, now - this.last); this.last = now;
    const dt = Math.min(48, raw);
    const s = this.story;

    // The generation clock runs only while a story is watched or fast-forwarded,
    // and a hidden tab or a long stall never releases a burst of generations.
    if (s.running) {
      const genMs = (s.fast ? FAST_SECONDS : GENERATION_SECONDS) * 1000;
      this.clock += Math.min(250, raw);
      if (this.clock >= genMs) {
        this.clock = Math.min(this.clock - genMs, genMs - 1);
        if (!this.bridge.extinct) this.generation(now);
      }
      if (s.running) this.barEl.style.width = `${(100 * Math.max(0, this.clock) / genMs).toFixed(1)}%`;
    }
    // At a choice point the world pauses.
    if (s.phase === "choice") this.tickChoice(now);
    else this.herd.tick(dt, now);
    if (this.endingAt !== null && now >= this.endingAt) { this.endingAt = null; this.showEnding(); }

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

    /* home ground — a soft pool of light where your family lives */
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
    const want = !!home && !onScreen && this.story.phase !== "choice";
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
      if (/** @type {HTMLElement} */ (e.target).closest("button, #label, #choice, #ending")) return;
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
    this.doc.getElementById("again").addEventListener("click", () => this.restart(this.seed));
    this.doc.getElementById("new-world").addEventListener("click", () => {
      let seed;
      do seed = 1 + Math.floor(Math.random() * 9999); while (seed === this.seed);
      this.restart(seed);
    });
  }
  showHint() {
    this.hintGone = false;
    this.hintEl.style.opacity = "1";
    clearTimeout(this.hintT);
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
    // Before the story starts, a tap chooses the family to follow. After that, tapping looks.
    if (this.story.phase === "waiting") this.begin(a);
    else this.showLabel(a.id);
  }
}

/** The defining fixture, fetched once. */
let fixture = null;

/** The defining-experiment world for a seed, or the engine's random world if the fixture can't be read. */
async function loadWorld(seed) {
  try {
    if (!fixture) {
      const res = await fetch(FIXTURE_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fixture = await res.json();
    }
    return Bridge.fromFixture(fixture, seed);
  } catch (err) {
    console.warn("[lineage] defining fixture unavailable; using a random world", err);
    return Bridge.fromRandom(seed);
  }
}

// ---- bootstrap ----
if (typeof document !== "undefined") {
  const q = new URLSearchParams(location.search);
  const asked = Number.parseInt(q.get("seed") ?? "", 10);
  const seed = Number.isFinite(asked) && asked > 0 ? asked : DEFAULT_SEED;
  loadWorld(seed).then((bridge) => {
    globalThis.lineageGame = new Game(document, bridge, { seed, loadWorld }); // for poking at the live engine from the console
  });
}
