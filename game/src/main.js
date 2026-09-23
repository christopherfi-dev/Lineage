/**
 * LINEAGE — Milestone 2: the frozen M1 engine on the designed canvas, played
 * as a story (scope decision 6, rules in story.js).
 *
 * Time waits for the child: the animals wander from the start, but no
 * generation runs until an animal is tapped and its family followed. Then one
 * engine generation happens every GENERATION_SECONDS. At each choice point the
 * world pauses; after it the world fast-forwards. Births, deaths, mutation
 * flashes and every count on screen come from the engine's records.
 */

import { Bridge } from "./bridge.js";
import { FIXTURE_URL } from "./engine.js";
import { World, clamp } from "./world.js";
import { Herd, drawPortrait, GROUP_COLORS } from "./herd.js";
import {
  Story, GENERATION_SECONDS, FAST_SECONDS, CHOICE_SECONDS, SKIP_GENERATIONS, STORY_CHOICES, STORY_GENERATIONS,
} from "./story.js";
import { isGoodSeed, goodSeed } from "./seeds.js";
import { averageOf, changedTraits, traitRows, typicalOf } from "./variations.js";
import {
  START_LINE, followLine, groupLines, otherLabel, notable, TIMES_UP, optionLine, passedLines, chosenLines,
  skipDoneLines, compareLine, sinceLines, lastPassed, madeIt, endingTitle, question, choicesHeading, choiceRecap,
  noChoices, neutralLines, evidenceLine,
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
/** How often the camera target (your group's largest cluster) is worked out again. */
const HOME_MS = 400;
/** In the defining world, seed 6 lets the webbed canopy family's decline play out over a few generations. */
const DEFAULT_SEED = 6;

export class Game {
  /**
   * @param {Document} doc
   * @param {Bridge} bridge the engine world to show, at generation 0
   * @param {{seed:number, makeWorld:(seed:number)=>Bridge}} world how to make this world again, or another
   */
  constructor(doc, bridge, { seed, makeWorld }) {
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
    this.othersEl = $("others");
    this.labelEl = $("label");
    this.labelWhoEl = $("label-who");
    this.labelAboutEl = $("label-about");
    this.choiceEl = $("choice");
    this.choiceCountEl = $("choice-count");
    this.choiceSinceEl = $("choice-since");
    this.optionsEl = $("options");
    this.choiceBarEl = $("choice-bar");
    this.choiceNoteEl = $("choice-note");
    this.endingEl = $("ending");
    this.endingTitleEl = $("ending-title");
    this.endingAnimalEl = /** @type {HTMLCanvasElement} */ ($("ending-animal"));
    this.endingTraitsTitleEl = $("ending-traits-title");
    this.endingTraitsEl = $("ending-traits");
    this.endingChoicesTitleEl = $("ending-choices-title");
    this.endingChoicesEl = $("ending-choices");
    this.endingEvidenceEl = $("ending-evidence");
    this.endingEvidenceLineEl = $("ending-evidence-line");
    this.endingQuestionEl = $("ending-question");
    this.revealEl = $("reveal");
    this.againEl = /** @type {HTMLButtonElement} */ ($("again"));
    this.newWorldEl = /** @type {HTMLButtonElement} */ ($("new-world"));

    this.world = new World();
    this.seed = seed;
    this.makeWorld = makeWorld;
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
    this.home = null;
    this.homeT = 0;
    this.fastShown = null;
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
    this.syncGroups();
    this.updateHud();
    if (this.label) this.showLabel(this.label.id, this.label.until); // counts change each generation
    if (what === "ended") this.storyEnded();
    else if (what === "choice") this.openChoice(now);
    else if (what === "passed") this.pointPassed();
    else if (what === "skip-done") this.fastForwardDone();
    else if (!fast) this.say(groupLines(ev.group, this.story.noun)); // during a fast-forward, only its end is narrated
    const g = ev.group;
    console.info(
      `[lineage] generation ${ev.generation}: ${ev.births.length} births, ${ev.deaths.length} deaths, ` +
      `${ev.mutations.length} mutations at birth` +
      (g ? ` · your ${this.story.noun} ${g.count} (was ${g.before}: +${g.born.length} −${g.gone.length}, ${g.mutated.length} new traits)` : "") +
      this.story.others.map((o) => ` · ${o.option.group} ${o.members.size}`).join("") +
      ` · story: ${this.story.phase}, choice point ${this.story.points}`
    );
    if (ev.observerErrors.length) console.warn("[lineage] observer errors", ev.observerErrors);
  }

  /** The map shows whom you follow now, and the groups you did not choose in their colours. */
  syncGroups() {
    this.herd.followed = new Set(this.bridge.followedIds());
    const marks = new Map();
    for (const o of this.story.others) {
      for (const id of o.members) {
        const colors = marks.get(id);
        if (colors) colors.push(o.option.color); else marks.set(id, [o.option.color]);
      }
    }
    this.herd.marks = marks;
    this.homeT = 0; // work the camera target out again on the next frame
  }

  /* ================= the story ================= */
  /** The first tap: follow the family of the tapped animal's ancestor a few generations back. Time starts. */
  begin(animal) {
    const f = this.story.begin(animal.id);
    this.syncGroups();
    this.herd.following = true;
    this.herd.resetFlashes();
    this.clock = 0;
    this.closeLabel();
    this.hideHint();
    this.say([followLine(this.bridge.zoneOf(animal.id), f.members.size)]);
    this.centerOnGroup();
    this.updateHud();
  }

  /** A choice point: the world pauses, and two or three animals are offered. */
  openChoice(now) {
    const s = this.story;
    this.closeLabel();
    this.choiceCountEl.textContent = `Choice ${s.points} of ${STORY_CHOICES}`;
    // How the last choice turned out, against the ones not chosen. After a neutral
    // trait, it also says that trait made no difference (scope decision 8).
    const last = s.choices[s.choices.length - 1];
    const since = last ?
      sinceLines(s.mine, s.others.map((o) => ({ group: o.option.group, now: o.members.size, then: o.sizeAtChoice })),
        last.neutral ? last.group : null) : [];
    this.choiceSinceEl.textContent = since.join(" ");
    this.choiceNoteEl.textContent = "";
    this.choiceBarEl.style.width = "100%";
    // Shown in a random order, so the most common variation isn't always first. Each
    // keeps its colour on the map if it is not chosen.
    const shown = s.options.map((o) => ({ o, k: Math.random() })).sort((a, b) => a.k - b.k).map(({ o }) => o);
    this.optionEls = shown.map((o, k) => {
      o.color = GROUP_COLORS[k];
      const el = this.doc.createElement("button");
      el.type = "button";
      el.className = "option";
      el.style.setProperty("--mark", o.color);
      const words = this.doc.createElement("span");
      words.append(Object.assign(this.doc.createElement("i"), { className: "swatch" }), optionLine(o.words));
      el.append(this.doc.createElement("canvas"), words);
      el.addEventListener("click", () => this.pick(o, false, performance.now()));
      return Object.assign(el, { option: o });
    });
    this.optionsEl.replaceChildren(...this.optionEls);
    clearTimeout(this.choiceHideT);
    this.choiceEl.hidden = false;
    for (const el of this.optionEls) drawPortrait(el.querySelector("canvas"), this.bridge.get(el.option.id).bodyGenome, el.option.trait);
    requestAnimationFrame(() => this.choiceEl.classList.add("open"));
    this.choice = { until: now + CHOICE_SECONDS * 1000, picked: null };
    this.centerOnGroup(0.3);
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

  /** Your group becomes every animal with the chosen variation; then the world fast-forwards. */
  followChoice(option, byChance) {
    this.choice = null;
    this.choiceEl.classList.remove("open");
    this.choiceHideT = setTimeout(() => { if (!this.choice) this.choiceEl.hidden = true; }, 450);
    this.story.choose(option, byChance);
    this.syncGroups();
    this.herd.resetFlashes();
    this.preRoll();
    this.say(chosenLines(option.group, this.herd.followed.size, SKIP_GENERATIONS));
    this.centerOnGroup();
    this.updateHud();
  }

  /** Nothing to choose from at this point: say so, then fast-forward anyway. */
  pointPassed() {
    this.preRoll();
    this.say(passedLines(this.story.noun, SKIP_GENERATIONS));
  }

  /** A moment to read the log before the fast-forward starts. */
  preRoll() { this.clock = FAST_SECONDS * 1000 - LOG_MS; }

  fastForwardDone() {
    const s = this.story;
    this.say(skipDoneLines(SKIP_GENERATIONS, this.herd.followed.size, changedTraits(s.formAtPoint, s.lastForm), s.noun));
  }

  /** The group died out, or the last choice point's fast-forward finished. A moment, then the reflection screen. */
  storyEnded() {
    const s = this.story;
    this.say([s.outcome === "died" ? lastPassed(s.noun) : madeIt(s.noun)]);
    this.endingAt = performance.now() + ENDING_DELAY_MS;
    this.updateHud();
  }

  /** Every ending is a reflection screen, not a game-over screen. */
  showEnding() {
    const s = this.story, doc = this.doc;
    this.endingTitleEl.textContent = endingTitle(s.outcome, s.lasted, s.noun);
    // The group's actual average body at the end (the last members alive), not a list of the choices.
    this.endingTraitsTitleEl.textContent = `Your ${s.noun}'s traits`;
    const genomes = (animals) => animals.map((a) => a.genome);
    this.endingTraitsEl.replaceChildren(...traitRows(averageOf(genomes(s.lastAnimals)), averageOf(genomes(s.startAnimals))).map((r) => {
      const row = doc.createElement("div");
      row.className = r.changed ? "row changed" : "row";
      row.append(Object.assign(doc.createElement("span"), { className: "k", textContent: r.label }),
        Object.assign(doc.createElement("span"), { className: "v", textContent: r.value }));
      return row;
    }));
    this.endingChoicesTitleEl.textContent = choicesHeading(s.choices.length);
    const items = s.choices.length ? s.choices.map((c) => {
      const li = Object.assign(doc.createElement("li"), { textContent: choiceRecap(c) });
      // A neutral trait the child followed made no difference to who survived (scope decision 8).
      if (c.neutral) {
        const note = neutralLines(c.group, { now: c.sizeAtEnd, then: c.sizeAtChoice }).join(" ");
        li.append(Object.assign(doc.createElement("span"), { className: "note", textContent: note }));
      }
      return li;
    }) : [Object.assign(doc.createElement("li"), { textContent: noChoices(s.outcome) })];
    this.endingChoicesEl.replaceChildren(...items);
    this.endingChoicesEl.classList.toggle("none", !s.choices.length);
    this.endingChoicesEl.classList.toggle("many", s.choices.length > 5);
    // One line of real evidence from the world, not the answer (evidence.js).
    this.endingEvidenceEl.hidden = !s.evidence;
    if (s.evidence) this.endingEvidenceLineEl.textContent = evidenceLine(s.evidence);
    this.endingQuestionEl.textContent = question(s.outcome, s.noun);
    // REAL-ANIMAL REVEAL (placeholder): a surviving group will be revealed as the real
    // animal it most resembles, matched on the group's actual average traits (the same
    // averageOf(lastAnimals) shown above), not on the choices made.
    this.revealEl.hidden = s.outcome !== "survived";
    this.endingEl.hidden = false;
    drawPortrait(this.endingAnimalEl, typicalOf(s.lastAnimals).genome);
  }

  /** Same seed: the same world again from generation 0. */
  restart(seed) {
    this.endingEl.hidden = true;
    this.seed = seed;
    history.replaceState(null, "", `?seed=${seed}`);
    this.start(this.makeWorld(seed));
  }

  /** A new world: only a seed whose three habitats all last the whole story (seeds.js). */
  newWorld() {
    const label = this.newWorldEl.textContent;
    this.newWorldEl.textContent = "Finding a new world…";
    this.newWorldEl.disabled = this.againEl.disabled = true;
    // Let the button repaint before the engine runs ahead.
    setTimeout(() => {
      const seed = goodSeed(this.makeWorld, this.seed) ?? this.seed;
      this.newWorldEl.textContent = label;
      this.newWorldEl.disabled = this.againEl.disabled = false;
      this.restart(seed);
    }, 40);
  }

  updateHud() {
    const s = this.story, doc = this.doc;
    const zones = this.bridge.zoneCounts();
    const following = s.phase !== "waiting" && s.phase !== "ended";
    this.genEl.textContent = String(this.bridge.generation);
    this.countsEl.textContent = `${this.bridge.living.length} animals alive · ` +
      (following ? `your ${s.noun} ${this.herd.followed.size}` : s.phase === "ended" ? "story over" : "no family yet");
    this.zonesEl.textContent = `leaves ${zones[0]} · ground ${zones[1]} · water's edge ${zones[2]}`;
    this.othersEl.replaceChildren(...s.others.map((o) => {
      const el = doc.createElement("span");
      el.append(Object.assign(doc.createElement("i"), { className: "swatch" }), `${o.option.group} ${o.members.size}`);
      el.style.setProperty("--mark", o.option.color);
      return el;
    }));
    this.othersEl.hidden = !s.others.length;
    if (!s.running) this.barEl.style.width = "0%";
  }

  /* ================= the label on a tapped animal ================= */
  /** Any animal can be looked at; only choice points change whom you follow. */
  showLabel(id, until = performance.now() + LABEL_MS) {
    const ind = this.bridge.get(id);
    if (!ind) { this.closeLabel(); return; }
    const s = this.story;
    const theirs = s.others.find((o) => o.members.has(id));
    if (this.herd.followed.has(id)) {
      this.labelWhoEl.textContent = `In your ${s.noun}`;
      this.labelAboutEl.textContent = notable(ind.bodyGenome);
    } else if (theirs) {
      // A group not chosen: how it did since the choice, against yours.
      this.labelWhoEl.textContent = `The ones with ${theirs.option.group}`;
      this.labelAboutEl.textContent = compareLine({ now: theirs.members.size, then: theirs.sizeAtChoice }, s.mine);
    } else {
      this.labelWhoEl.textContent = `Not in your ${s.noun}`;
      this.labelAboutEl.textContent = otherLabel(this.bridge.zoneOf(id), ind.bodyGenome);
    }
    this.labelEl.classList.toggle("marked", !!theirs && !this.herd.followed.has(id));
    if (theirs) this.labelEl.style.setProperty("--mark", theirs.option.color);
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
  /**
   * The camera goes to your group's largest cluster: the group may be spread
   * across habitats. `high` of the screen above the middle, to clear a panel.
   */
  centerOnGroup(high = 0) {
    const p = this.herd.largestCluster(this.herd.followed); if (!p) return;
    this.camTween = { x: p.x - this.vw / 2, y: p.y - this.vh * (0.5 - high), t: 0 };
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
    // A fast-forward shows: the badge is up and the animals hurry.
    const fastNow = s.fast && this.clock >= 0;
    if (fastNow !== this.fastShown) {
      this.fastShown = fastNow;
      this.fastEl.hidden = !fastNow;
      this.herd.pace = fastNow ? FAST_PACE : 1;
    }
    // At a choice point the world pauses.
    if (s.phase === "choice") this.tickChoice(now);
    else this.herd.tick(dt, now);
    if (this.endingAt !== null && now >= this.endingAt) { this.endingAt = null; this.showEnding(); }

    // Where "Back to my group" goes: the group's largest cluster.
    if ((this.homeT -= dt) <= 0) { this.homeT = HOME_MS; this.home = this.herd.largestCluster(this.herd.followed); }

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

    /* the animals; every member of your group stands in a soft glow (herd.js) */
    this.herd.draw(x, { x: vx, y: vy, w: vw, h: vh }, now);
    x.restore();

    const home = this.home;
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
    this.homeEl.addEventListener("click", () => { this.centerOnGroup(); this.hideHint(); });
    this.againEl.addEventListener("click", () => this.restart(this.seed));
    this.newWorldEl.addEventListener("click", () => this.newWorld());
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

/** The defining fixture, fetched once; null if it can't be read. */
let fixture = null;

async function loadFixture() {
  try {
    const res = await fetch(FIXTURE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fixture = await res.json();
  } catch (err) {
    console.warn("[lineage] defining fixture unavailable; using a random world", err);
  }
}

/** The defining-experiment world for a seed, or the engine's random world without the fixture. */
const makeWorld = (seed) => (fixture ? Bridge.fromFixture(fixture, seed) : Bridge.fromRandom(seed));

// ---- bootstrap ----
if (typeof document !== "undefined") {
  const q = new URLSearchParams(location.search);
  const asked = Number.parseInt(q.get("seed") ?? "", 10);
  loadFixture().then(() => {
    let seed = Number.isFinite(asked) && asked > 0 ? asked : DEFAULT_SEED;
    // Only curated worlds: a seed that loses a habitat before the story's end is swapped for one that doesn't.
    if (!isGoodSeed(makeWorld, seed)) {
      const good = goodSeed(makeWorld, seed) ?? seed;
      console.info(`[lineage] seed ${seed} loses a habitat by generation ${STORY_GENERATIONS}; showing seed ${good} instead`);
      seed = good;
      history.replaceState(null, "", `?seed=${seed}`);
    }
    globalThis.lineageGame = new Game(document, makeWorld(seed), { seed, makeWorld }); // for poking at the live engine from the console
  });
}
