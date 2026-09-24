/**
 * LINEAGE — Milestone 2: the frozen M1 engine on the designed canvas, played
 * as a story (scope decisions 6, 32–34 and 42, rules in story.js).
 *
 * Time waits for the child: the animals wander from the start, but no
 * generation runs until an animal is tapped and its family followed. Then one
 * engine generation happens every GENERATION_SECONDS. Newborns with a new
 * variation glow; tapping one starts a fair test, after which the world
 * fast-forwards. When too few have the variation yet, the world first
 * fast-forwards to see if it spreads. Births, deaths, glows and every count on
 * screen come from the engine's records.
 */

import { Bridge } from "./bridge.js";
import { FIXTURE_URL } from "./engine.js";
import { World, clamp } from "./world.js";
import { Herd, GROUP_COLORS } from "./herd.js";
import { paintCreature } from "./creature.js";
import {
  Story, GENERATION_SECONDS, FAST_SECONDS, CHOICE_SECONDS, SKIP_GENERATIONS, STORY_CHOICES, STORY_GENERATIONS,
} from "./story.js";
import { isGoodSeed, goodSeed } from "./seeds.js";
import { averageOf, changedTraits, comparedRows, plainRows } from "./variations.js";
import { GAP } from "./reveal.js";
import {
  START_LINE, followLine, groupLines, TIMES_UP, optionLine, chosenLines,
  skipDoneLines, lastPassed, madeIt, endingTitle, question, choicesHeading, choiceRecap, noChoices, neutralLines,
  evidenceLine, countLine, YOURS, SINCE_TITLE, comparisonLines, OTHERS_HERE, yoursWith, fairHeading, OTHERS_DIED_TOO, OTHERS_ALIVE,
  inYour, notInYour, PASSED_AWAY, livesLine, newAtBirthLine, lookLine,
  GLOW_HINT, followButton, followSpread, NOT_THIS, spreadLine, SPREAD_GONE, SPREAD_SHORT, SPREAD_COMMON,
} from "./narration.js";
import { speakerButton, isSpeaking } from "./speech.js";
import {
  PREDICT_AFTER, JOURNAL_SECONDS, JOURNAL_NOTE, PREDICTION_TITLE, SIMULATION_STORY, questionFor, resultOf,
} from "./journal.js";

const LOG_MS = 3800;
/** How long the creature card takes to close (its CSS transition). */
const CARD_CLOSE_MS = 150;
/** During a choice, the gap kept between the card and the choice panel. */
const CARD_GAP = 12;
/** How long a chosen animal stays highlighted before the fast-forward. */
const PICKED_MS = 1200;
/** How long an answered prediction stays up, to read "Let's see…", before the fast-forward. */
const ANSWERED_MS = 2000;
/** How long "Since your last choice" stays up, at most, before the new follow goes ahead. */
const SINCE_SECONDS = 15;
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
/** Your group's colour, as on the map. */
const MINE_COLOR = "#14657F";
/** The fair test's other group, "the others here", on the map and in the counts. */
const OTHERS_COLOR = GROUP_COLORS[0];
/** The clue's two sides: the animals with the trait, and the rest. */
const CLUE_WITH_COLOR = "#D9892B", CLUE_WITHOUT_COLOR = "#9A917C";
/** On a creature card, an animal in no group on the map. */
const PLAIN_COLOR = "#B3AA92";
/**
 * The choice timer stands still while a line is read aloud. This caps how long
 * it can stand still at one choice point, in case a browser's speech gets stuck.
 */
const MAX_READING_PAUSE_MS = 60000;

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
    this.cardEl = $("card");
    this.cardAnimalEl = /** @type {HTMLCanvasElement} */ ($("card-animal"));
    this.cardNewEl = $("card-new");
    this.cardCountsEl = $("card-counts");
    this.cardTraitsEl = $("card-traits");
    this.choiceEl = $("choice");
    this.choiceCountEl = $("choice-count");
    this.choiceSinceEl = $("choice-since");
    this.optionsEl = $("options");
    this.choiceBarEl = $("choice-bar");
    this.choiceNoteEl = $("choice-note");
    this.cardFollowEl = $("card-follow");
    this.sinceEl = $("since");
    this.sinceCountEl = $("since-count");
    this.sinceBodyEl = $("since-body");
    this.sinceBarEl = $("since-bar");
    this.endingFairEl = $("ending-fair");
    this.endingFairRowsEl = $("ending-fair-rows");
    this.endingFairLineEl = $("ending-fair-line");
    this.endingLeadEl = $("ending-lead");
    this.journalEl = $("journal");
    this.journalOptionsEl = $("journal-options");
    this.journalBarEl = $("journal-bar");
    this.journalNoteEl = $("journal-note");
    this.endingPredictionsEl = $("ending-predictions");
    this.endingPredictionsListEl = $("ending-predictions-list");
    this.endingEl = $("ending");
    this.endingTitleEl = $("ending-title");
    this.endingAnimalEl = /** @type {HTMLCanvasElement} */ ($("ending-animal"));
    this.endingTraitsTitleEl = $("ending-traits-title");
    this.endingTraitsEl = $("ending-traits");
    this.endingChoicesTitleEl = $("ending-choices-title");
    this.endingChoicesEl = $("ending-choices");
    this.endingEvidenceEl = $("ending-evidence");
    this.endingEvidenceLineEl = $("ending-evidence-line");
    this.endingCompareEl = $("ending-compare");
    this.endingQuestionEl = $("ending-question");
    this.revealEl = $("reveal");
    // Read-aloud: a small speaker beside every child-facing line (speech.js).
    this.log = this.speakable(this.logEl);
    this.speakable(/** @type {HTMLElement} */ (this.choiceEl.querySelector("h2")));
    this.endingTitle = this.speakable(this.endingTitleEl);
    this.endingTraitsTitle = this.speakable(this.endingTraitsTitleEl, () => this.traitsSpoken);
    this.endingQuestion = this.speakable(this.endingQuestionEl);
    this.endingEvidence = this.speakable(this.endingEvidenceLineEl);
    this.revealLine = this.speakable($("reveal-line"));
    this.revealWhy = this.speakable($("reveal-why"));
    this.endingLook = this.speakable($("ending-look-line"));
    this.cardWho = this.speakable($("card-who"));
    this.cardSwatchEl = Object.assign(doc.createElement("i"), { className: "swatch" });
    $("card-who").prepend(this.cardSwatchEl);
    this.cardWhere = this.speakable($("card-where"));
    this.cardNew = this.speakable(this.cardNewEl);
    this.journalQuestion = this.speakable($("journal-question"));
    this.endingFairLine = this.speakable(this.endingFairLineEl);
    this.endingPredictionsLabel = this.speakable($("ending-predictions-label"));
    this.againEl = /** @type {HTMLButtonElement} */ ($("again"));
    this.newWorldEl = /** @type {HTMLButtonElement} */ ($("new-world"));

    this.world = new World();
    this.seed = seed;
    this.makeWorld = makeWorld;
    this.cam = { x: 0, y: 0 };
    this.camTween = null;
    this.logQueue = [];
    this.logTimer = 0;
    /** @type {null|CardState} the animal whose creature card is open */
    this.card = null;
    /** @type {null|JournalState} the prediction question on screen */
    this.journal = null;
    /** @type {null|SinceState} "Since your last choice", on screen before a new follow */
    this.since = null;
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
    this.herd = new Herd(this.world, 7919);
    this.herd.placeFounders(bridge);
    this.story = new Story(bridge, { homeOf: (id) => this.herd.animals.get(id)?.home ?? null });
    this.clock = 0;
    this.choice = null;
    this.endingAt = null;
    this.home = null;
    this.homeT = 0;
    this.fastShown = null;
    this.closeCard(true);
    this.choiceEl.classList.remove("open");
    this.choiceEl.hidden = true;
    this.journal = null;
    /** @type {import("./journal.js").Prediction[]} this story's predictions */
    this.predictions = [];
    this.journalEl.classList.remove("open");
    this.journalEl.hidden = true;
    this.since = null;
    this.sinceEl.classList.remove("open");
    this.sinceEl.hidden = true;
    /** the spread's line is on screen, so each generation only changes its counter */
    this.spreadShown = false;
    this.toldGlow = false;
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
    const s = this.story, fast = s.fast;
    this.herd.applyGeneration(ev, this.bridge, now);
    const what = s.afterGeneration(ev);
    this.syncGroups();
    this.updateHud();
    this.updateCard(); // counts change each generation, and the animal may pass away
    if (what === "ended") this.storyEnded();
    else if (what === "choice") this.openChoice(now);
    else if (what === "skip-done") this.fastForwardDone();
    else if (what === "spreading") this.spreadCounter();
    else if (what === "spread-ready") this.spreadReady();
    else if (what === "spread-failed") this.spreadFailed();
    else if (!fast) {
      // During a fast-forward, only its end is narrated. The first glow of a story says what it is for.
      // The log names only the babies that glow this generation (the calm rule), never more.
      const lines = groupLines(ev.group, s.noun, s.glowing.filter((x) => x.generation === ev.generation).map((x) => x.v));
      if (s.glowing.length && s.followOpen && !this.toldGlow) { this.toldGlow = true; lines.push(GLOW_HINT); }
      this.say(lines);
    }
    const g = ev.group, sp = s.spread ?? (what === "spread-ready" || what === "spread-failed" ? s.lastSpread : null);
    console.info(
      `[lineage] generation ${ev.generation}: ${ev.births.length} births, ${ev.deaths.length} deaths, ` +
      `${ev.mutations.length} mutations at birth` +
      (g ? ` · your ${s.noun} ${g.count} (was ${g.before}: +${g.born.length} −${g.gone.length}, ${g.mutated.length} new traits)` : "") +
      (ev.others ? ` · the others here ${ev.others.count}` : "") +
      ` · glowing ${s.glowing.length}` + (sp ? ` · spread of ${sp.v.group}: ${sp.counts.join(", ")}${sp.outcome ? ` (${sp.outcome})` : ""}` : "") +
      ` · story: ${s.phase}, ${s.choices.length} follows`
    );
    if (ev.observerErrors.length) console.warn("[lineage] observer errors", ev.observerErrors);
  }

  /** The map shows whom you follow now, the others here in their colour, and which newborns glow. */
  syncGroups() {
    this.herd.followed = new Set(this.bridge.followedIds());
    this.herd.marks = new Map(this.bridge.otherIds().map((id) => [id, [OTHERS_COLOR]]));
    this.herd.glowing = new Set(this.story.glowing.map((g) => g.id));
    this.homeT = 0; // work the camera target out again on the next frame
  }

  /* ================= the story ================= */
  /** The first tap: follow the family of the tapped animal's ancestor a few generations back. Time starts. */
  begin(animal) {
    const f = this.story.begin(animal.id);
    this.syncGroups();
    this.herd.following = true;
    this.clock = 0;
    this.hideHint();
    this.say([followLine(this.bridge.zoneOf(animal.id), f.members.size)]);
    this.centerOnGroup();
    this.updateHud();
  }

  /**
   * The backup choice panel (scope decisions 34 and 42): nothing was followed
   * for PUSH_SECONDS, so the world pauses and up to three variations that can
   * start a fair test right away are offered. An open creature card stays open,
   * and the countdown waits for it.
   */
  openChoice(now) {
    const s = this.story;
    this.choiceCountEl.textContent = `Choice ${s.choices.length + 1} of ${STORY_CHOICES}`;
    this.fillSince(this.choiceSinceEl);
    this.choiceNoteEl.replaceChildren();
    this.choiceBarEl.style.width = "100%";
    this.optionEls = s.options.map((o) => {
      const el = this.doc.createElement("div");
      el.className = "option";
      el.style.setProperty("--mark", MINE_COLOR);
      const button = Object.assign(this.doc.createElement("button"), { type: "button", className: "pick" });
      const words = Object.assign(this.doc.createElement("span"), { className: "words", textContent: optionLine(o.v.words) });
      button.append(this.doc.createElement("canvas"), words);
      button.addEventListener("click", () => this.pick(o, false, performance.now()));
      el.append(button, speakerButton(this.doc, () => optionLine(o.v.words)));
      return Object.assign(el, { option: o, button });
    });
    this.optionsEl.replaceChildren(...this.optionEls);
    clearTimeout(this.choiceHideT);
    this.choiceEl.hidden = false;
    // Each option drawn like its creature card, with a ring on the part the choice is about
    // (and a close-up of it when it is small), so the difference being chosen shows.
    for (const el of this.optionEls) {
      const a = this.bridge.animal(el.option.id);
      paintCreature(el.querySelector("canvas"), a.genome, { seed: a.id, focus: el.option.v.trait, closeUp: true, habitat: a.zone });
    }
    requestAnimationFrame(() => this.choiceEl.classList.add("open"));
    this.choice = { left: CHOICE_SECONDS * 1000, paused: 0, picked: null };
    this.updateCard(); // no follow buttons while the panel is up
    this.placeCard(); // an open card moves above the choice panel
    this.centerOnGroup(0.3);
  }

  pick(option, byChance, now) {
    const c = this.choice;
    if (!c || c.picked) return;
    Object.assign(c, { picked: option, byChance, goAt: now + (byChance ? TIMES_UP_MS : PICKED_MS) });
    for (const el of this.optionEls) {
      el.button.disabled = true;
      el.classList.add(el.option === option ? "picked" : "not-picked");
    }
    if (byChance) this.choiceNoteEl.replaceChildren(TIMES_UP, speakerButton(this.doc, () => TIMES_UP));
  }

  /** While the world is paused: the countdown, then the random pick if time runs out. */
  tickChoice(now, dt) {
    const c = this.choice;
    if (!c) return;
    if (c.picked) {
      if (now >= c.goAt) this.followChoice(c.picked, c.byChance);
      return;
    }
    // The countdown waits while a creature card is open, and while any line is being read aloud.
    if (!this.card) {
      if (isSpeaking() && c.paused < MAX_READING_PAUSE_MS) c.paused += dt;
      else c.left = Math.max(0, c.left - dt);
    }
    const left = c.left;
    this.choiceBarEl.style.width = `${(100 * left / (CHOICE_SECONDS * 1000)).toFixed(1)}%`;
    if (left === 0) {
      const options = this.story.options;
      this.pick(options[Math.floor(Math.random() * options.length)], true, now);
    }
  }

  /** The option picked on the backup panel is followed. The ones not picked make no group. */
  followChoice(option, byChance) {
    this.choice = null;
    this.choiceEl.classList.remove("open");
    this.choiceHideT = setTimeout(() => { if (!this.choice) this.choiceEl.hidden = true; }, 450);
    this.doFollow(option, byChance);
  }

  /**
   * The child follows a glowing newborn's variation. When too few have it here
   * to start a fair test right away, the world first fast-forwards to see if it
   * spreads (scope decision 42). When there is a fair test to look back on,
   * "Since your last choice" comes before the new one.
   * @param {import("./story.js").Glow} x
   */
  followFromMap(x) {
    const s = this.story;
    if (!s.followOpen || this.since || this.journal || this.choice) return;
    this.closeCard();
    if (!s.canStartFor(x)) this.startSpread(x);
    else if (s.choices.length) this.openSince(x);
    else this.doFollow(x, false);
  }

  /**
   * Follow as a fair test (story.js): two groups of the same size from the
   * habitat, yours and the others here. Every third follow, a prediction
   * first; then the world fast-forwards.
   */
  doFollow(x, byChance) {
    this.story.follow(x, byChance);
    this.syncGroups();
    this.updateCard();
    this.centerOnGroup();
    this.updateHud();
    // After every third follow, one prediction first (Step 6, scope decision 28).
    const n = this.story.choices.length;
    if (PREDICT_AFTER.includes(n)) this.openJournal(questionFor(this.story, this.bridge, x, PREDICT_AFTER.indexOf(n)), x);
    else this.fastForward(x);
    this.placeCard(); // an open card goes back to the side, or above the prediction
  }

  /** The new groups are announced, and after a moment to read it the world fast-forwards. */
  fastForward(x) {
    const s = this.story;
    this.preRoll();
    this.say(chosenLines(x.v.group, s.mine.now, s.theirs.now, s.fair.zone, SKIP_GENERATIONS));
  }

  /* ================= since your last choice (scope decision 34) ================= */
  /**
   * How the last fair test went: both groups' counts with bars, the neutral
   * note after a neutral trait, and the prediction made at that follow beside
   * what happened. In the backup panel, or in its own sheet before a new follow.
   */
  fillSince(el) {
    const s = this.story, last = s.choices[s.choices.length - 1];
    if (!last) { el.replaceChildren(); return; }
    const rows = this.fairRows();
    const note = last.neutral ? neutralLines(last.group, s.mine).join(" ") : "";
    const title = Object.assign(this.doc.createElement("div"), { className: "since-title", textContent: SINCE_TITLE });
    title.append(speakerButton(this.doc, () => [SINCE_TITLE, ...rows.map((r) => `${countLine(r.label, r)}.`), note].join(" ")));
    el.replaceChildren(title, ...this.countRows(rows),
      ...(note ? [Object.assign(this.doc.createElement("p"), { className: "note", textContent: note })] : []));
    // The prediction made at the last follow, beside what really happened (Step 6).
    const p = this.predictions.find((x) => !x.result);
    if (p) {
      p.result = resultOf(p, s);
      el.append(this.predictionBlock(p, PREDICTION_TITLE));
    }
  }

  /** The world waits while the last fair test is shown; "Next" or SINCE_SECONDS goes on to the new follow. */
  openSince(x) {
    const s = this.story;
    this.sinceCountEl.textContent = `Choice ${s.choices.length + 1} of ${STORY_CHOICES}`;
    this.fillSince(this.sinceBodyEl);
    this.sinceBarEl.style.width = "100%";
    clearTimeout(this.sinceHideT);
    this.sinceEl.hidden = false;
    requestAnimationFrame(() => this.sinceEl.classList.add("open"));
    this.since = { x, left: SINCE_SECONDS * 1000, paused: 0 };
    this.centerOnGroup(0.3);
  }

  /** Like the other panels' countdowns: it waits while a line is read aloud or a card is open. */
  tickSince(now, dt) {
    const w = this.since;
    if (!this.card) {
      if (isSpeaking() && w.paused < MAX_READING_PAUSE_MS) w.paused += dt;
      else w.left = Math.max(0, w.left - dt);
    }
    this.sinceBarEl.style.width = `${(100 * w.left / (SINCE_SECONDS * 1000)).toFixed(1)}%`;
    if (w.left === 0) this.closeSince();
  }

  closeSince() {
    const w = this.since;
    if (!w) return;
    this.since = null;
    this.sinceEl.classList.remove("open");
    this.sinceHideT = setTimeout(() => { if (!this.since) this.sinceEl.hidden = true; }, 450);
    this.doFollow(w.x, false);
  }

  /* ================= will it spread? (scope decision 42) ================= */
  /**
   * Too few have the variation here to start a fair test right away, so the
   * world fast-forwards to see if it spreads, with a live counter. Your group
   * lives on meanwhile, as usual.
   * @param {import("./story.js").Glow} x
   */
  startSpread(x) {
    const what = this.story.trySpread(x);
    this.syncGroups(); // the tapped newborn stops glowing
    this.updateHud();
    // Most here have it already: too few others for a fair test, and no spread can change that.
    if (what === "spread-failed") { this.say([SPREAD_COMMON]); this.updateCard(); return; }
    this.preRoll();
    this.spreadShown = false;
    this.spreadCounter();
  }

  /**
   * "Will it spread? Animals with smaller eyes: 3… 7… 12…": one line, whose
   * counter changes in place each generation. Returns the line.
   */
  spreadCounter() {
    const s = this.story, sp = s.spread ?? s.lastSpread, line = spreadLine(sp.v.group, sp.counts);
    if (!this.spreadShown) { this.spreadShown = true; this.say([line]); return line; }
    this.log.set(line);
    this.logQueue = [];
    this.logTimer = LOG_MS;
    return line;
  }

  /** It spread: the fair test starts, with "Since your last choice" first when there is a last test. */
  spreadReady() {
    const s = this.story, sp = s.lastSpread;
    this.spreadCounter();
    if (!s.choices.length) { this.doFollow(sp, false); return; }
    this.openSince(sp);
    this.updateCard(); // an open card loses its follow buttons, and moves above the sheet
    this.placeCard();
  }

  /** It didn't spread: the last count stays a moment, then why. Your group stays as it is; this was not a follow. */
  spreadFailed() {
    const outcome = this.story.lastSpread.outcome;
    this.spreadCounter();
    this.logQueue = [outcome === "gone" ? SPREAD_GONE : outcome === "common" ? SPREAD_COMMON : SPREAD_SHORT];
    this.updateCard(); // follow buttons again
  }

  /** "Not this one": it stops glowing. No group is made. */
  notThis(g) {
    this.story.dismiss(g.id);
    this.syncGroups();
    this.closeCard();
  }

  /* ================= the prediction journal (Step 6, scope decisions 28-31, 35) ================= */
  /**
   * One question with three or four answers, right after the follow and before
   * the fast-forward. The world waits. With no answer within JOURNAL_SECONDS the
   * story goes on without a prediction; nothing is picked at random.
   * @param {import("./journal.js").Question} q
   * @param {{v:import("./cohorts.js").Variation}} option the follow it comes after
   */
  openJournal(q, option) {
    const doc = this.doc;
    this.journalQuestion.set(q.text);
    this.journalNoteEl.replaceChildren();
    this.journalBarEl.style.width = "100%";
    // Shown in a random order, so the reasonable answer isn't always in the same place.
    const shown = q.options.map((a) => ({ a, k: Math.random() })).sort((x, y) => x.k - y.k).map(({ a }) => a);
    this.journalAnswerEls = shown.map((a) => {
      const el = Object.assign(doc.createElement("div"), { className: "answer" });
      const button = Object.assign(doc.createElement("button"), { type: "button", className: "pick", textContent: a.text });
      button.addEventListener("click", () => this.answerJournal(a, performance.now()));
      el.append(button, speakerButton(doc, () => a.text));
      return Object.assign(el, { answer: a, button });
    });
    this.journalOptionsEl.replaceChildren(...this.journalAnswerEls);
    clearTimeout(this.journalHideT);
    this.journalEl.hidden = false;
    requestAnimationFrame(() => this.journalEl.classList.add("open"));
    this.journal = { question: q, option, left: JOURNAL_SECONDS * 1000, paused: 0, answer: null, goAt: 0 };
  }

  /** The child's prediction is kept, to be shown beside what happens. */
  answerJournal(a, now) {
    const j = this.journal;
    if (!j || j.answer) return;
    Object.assign(j, { answer: a, goAt: now + ANSWERED_MS });
    for (const el of this.journalAnswerEls) {
      el.button.disabled = true;
      el.classList.add(el.answer === a ? "picked" : "not-picked");
    }
    this.predictions.push({ question: j.question, answer: a, choice: this.story.choices.length, result: null });
    this.journalNoteEl.replaceChildren(JOURNAL_NOTE, speakerButton(this.doc, () => JOURNAL_NOTE));
  }

  /** The countdown waits while a line is read aloud or a card is open, as the choice's does. */
  tickJournal(now, dt) {
    const j = this.journal;
    if (j.answer) {
      if (now >= j.goAt) this.closeJournal();
      return;
    }
    if (!this.card) {
      if (isSpeaking() && j.paused < MAX_READING_PAUSE_MS) j.paused += dt;
      else j.left = Math.max(0, j.left - dt);
    }
    this.journalBarEl.style.width = `${(100 * j.left / (JOURNAL_SECONDS * 1000)).toFixed(1)}%`;
    if (j.left === 0) this.closeJournal(); // no answer: no prediction this time
  }

  closeJournal() {
    const j = this.journal;
    if (!j) return;
    this.journal = null;
    this.journalEl.classList.remove("open");
    this.journalHideT = setTimeout(() => { if (!this.journal) this.journalEl.hidden = true; }, 450);
    this.placeCard();
    this.fastForward(j.option);
  }

  /**
   * A prediction beside what really happened: the count rows it is about and
   * its short lines, with one speaker for all of it.
   * @param {import("./journal.js").Prediction} p resolved
   * @param {string} title what the block starts with
   */
  predictionBlock(p, title) {
    const doc = this.doc, r = p.result;
    const rows = r.rows.map((x) => ({ ...x, color: x.mine ? MINE_COLOR : OTHERS_COLOR }));
    const el = Object.assign(doc.createElement("div"), { className: "prediction" });
    const head = Object.assign(doc.createElement("div"), { className: "since-title", textContent: title });
    head.append(speakerButton(doc, () => [title, ...rows.map((x) => `${countLine(x.label, x)}.`), ...r.lines].join(" ")));
    el.append(head, ...this.countRows(rows), ...r.lines.map((line) => Object.assign(doc.createElement("p"), { className: "line", textContent: line })));
    return el;
  }

  /** A moment to read the log before the fast-forward starts. */
  preRoll() { this.clock = FAST_SECONDS * 1000 - LOG_MS; }

  fastForwardDone() {
    const s = this.story;
    this.say(skipDoneLines(SKIP_GENERATIONS, s.mine.now, s.theirs.now, changedTraits(s.formAtPoint, s.lastForm), s.noun));
    this.updateCard(); // follow buttons again
  }

  /** The group died out, or the story reached its last generation. A moment, then the reflection screen. */
  storyEnded() {
    const s = this.story;
    this.say([s.outcome === "died" ? lastPassed(s.noun) : madeIt(s.noun)]);
    this.endingAt = performance.now() + ENDING_DELAY_MS;
    this.updateHud();
  }

  /** Every ending is a reflection screen, not a game-over screen. */
  showEnding() {
    const s = this.story, doc = this.doc;
    this.closeCard(true);
    this.endingTitle.set(endingTitle(s.outcome, s.lasted, s.noun));
    // The group's actual average body at the end (the last members alive), drawn and in words, not a
    // list of the choices. Each meaningful trait is compared with the whole world at the start (scope decision 20).
    const average = averageOf(s.lastAnimals.map((a) => a.genome)).map((a) => a.mean);
    this.endingLook.set(lookLine(s.outcome));
    this.endingTraitsTitle.set(`Your ${s.noun}'s traits`);
    const rows = comparedRows(average, s.startWorld, GAP);
    this.traitsSpoken = rows.map((r) => `${r.label}: ${r.value}.`).join(" ");
    this.endingTraitsEl.replaceChildren(...rows.map((r) => {
      const row = doc.createElement("div");
      row.className = r.changed ? "row changed" : "row";
      row.append(Object.assign(doc.createElement("span"), { className: "k", textContent: r.label }),
        Object.assign(doc.createElement("span"), { className: "v", textContent: r.value }));
      return row;
    }));
    this.endingChoicesTitleEl.textContent = choicesHeading(s.choices.length);
    const items = s.choices.length ? s.choices.map((c) => {
      const li = Object.assign(doc.createElement("li"), { textContent: choiceRecap(c) });
      let spoken = choiceRecap(c);
      li.append(speakerButton(doc, () => spoken));
      // A neutral trait the child followed made no difference to who survived (scope
      // decision 8): said in words, with the group's size as counts and bars.
      if (c.neutral) {
        const size = { then: c.sizeAtChoice, now: c.sizeAtEnd };
        const note = neutralLines(c.group, size).join(" ");
        const row = { label: YOURS, ...size, color: MINE_COLOR };
        li.append(Object.assign(doc.createElement("span"), { className: "note", textContent: note }), ...this.countRows([row]));
        spoken = `${spoken}. ${note} ${countLine(row.label, row)}.`;
      }
      return li;
    }) : [Object.assign(doc.createElement("li"), { textContent: noChoices(s.outcome) })];
    if (!s.choices.length) items[0].append(speakerButton(doc, () => noChoices(s.outcome)));
    this.endingChoicesEl.replaceChildren(...items);
    this.endingChoicesEl.classList.toggle("none", !s.choices.length);
    this.endingChoicesEl.classList.toggle("many", s.choices.length > 5);
    // One line of real evidence from the world, not the answer (evidence.js).
    // The clue shows both sides when it can (scope decision 14), else one line.
    this.endingEvidenceEl.hidden = !s.comparison && !s.evidence;
    this.endingEvidenceLineEl.hidden = !!s.comparison;
    this.endingCompareEl.hidden = !s.comparison;
    if (s.comparison) {
      const c = comparisonLines(s.comparison);
      const rows = [
        { label: c.withLabel, ...s.comparison.with, color: CLUE_WITH_COLOR },
        { label: c.withoutLabel, ...s.comparison.without, color: CLUE_WITHOUT_COLOR },
      ];
      const heading = Object.assign(doc.createElement("div"), { className: "heading", textContent: c.heading });
      heading.append(speakerButton(doc, () => [c.heading, ...rows.map((r) => `${countLine(r.label, r)}.`)].join(" ")));
      this.endingCompareEl.replaceChildren(heading, ...this.countRows(rows));
    } else if (s.evidence) this.endingEvidence.set(evidenceLine(s.evidence));
    this.endingQuestion.set(question(s.outcome, s.noun));
    // The last fair test: your group beside the others here, from the follow to the end (scope decision 33).
    // When your group died out, the ending leads with it, then the question (scope decision 37).
    const last = s.choices[s.choices.length - 1];
    const lead = s.outcome === "died" && !!last;
    if (lead) this.endingLeadEl.append(this.endingFairEl, this.endingQuestionEl);
    else {
      this.endingEvidenceEl.parentElement.prepend(this.endingQuestionEl);
      this.endingPredictionsEl.before(this.endingFairEl);
    }
    this.endingLeadEl.hidden = !lead;
    this.endingFairEl.hidden = !last;
    this.endingFairLineEl.hidden = !lead;
    if (lead) this.endingFairLine.set(last.othersAtEnd === 0 ? OTHERS_DIED_TOO : OTHERS_ALIVE);
    if (last) {
      const rows = [
        { label: yoursWith(last.group), then: last.sizeAtChoice, now: last.sizeAtEnd, color: MINE_COLOR },
        { label: OTHERS_HERE, then: last.othersAtChoice, now: last.othersAtEnd, color: OTHERS_COLOR },
      ];
      const heading = Object.assign(doc.createElement("div"), { className: "heading", textContent: fairHeading(last.zone) });
      heading.append(speakerButton(doc, () => [fairHeading(last.zone), ...rows.map((r) => `${countLine(r.label, r)}.`)].join(" ")));
      this.endingFairRowsEl.replaceChildren(heading, ...this.countRows(rows));
    }
    // The story's predictions beside what happened, labelled as a story from the simulation (Step 6).
    for (const p of this.predictions) if (!p.result) p.result = resultOf(p, s);
    this.endingPredictionsEl.hidden = !this.predictions.length;
    this.endingPredictionsLabel.set(SIMULATION_STORY);
    this.endingPredictionsListEl.replaceChildren(...this.predictions.map((p) => {
      const li = doc.createElement("li");
      li.append(this.predictionBlock(p, p.question.text));
      return li;
    }));
    // The real-animal reveal on every ending (scope decisions 10 and 40, docs/LINEAGE_REAL_ANIMAL_REVEAL.md):
    // the group's actual average traits and main habitat when the story ended, never its choices.
    // A group that died out gets it in the past tense. Text for now; art comes later.
    this.revealEl.hidden = !s.reveal;
    if (s.reveal) {
      const died = s.outcome === "died";
      this.revealLine.set(died ? s.reveal.animal.revealPast : s.reveal.animal.reveal);
      this.revealWhy.set((died ? s.reveal.whyPast : s.reveal.why).join(" ")); // only the sentences whose traits the group has
    }
    this.endingEl.hidden = false;
    paintCreature(this.endingAnimalEl, average, { seed: s.startGeneration + 1, habitat: s.mainZone });
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
    const s = this.story;
    const zones = this.bridge.zoneCounts();
    const following = s.phase !== "waiting" && s.phase !== "ended";
    this.genEl.textContent = String(this.bridge.generation);
    this.countsEl.textContent = `${this.bridge.living.length} animals alive · ` +
      (following ? `your ${s.noun} ${this.herd.followed.size}` : s.phase === "ended" ? "story over" : "no family yet");
    this.zonesEl.textContent = `leaves ${zones[0]} · ground ${zones[1]} · water's edge ${zones[2]}`;
    // The fair test since the last follow, as counts with bars: yours and the others here.
    const rows = following ? this.fairRows() : [];
    this.othersEl.replaceChildren(...this.countRows(rows));
    this.othersEl.hidden = !rows.length;
    if (!s.running) this.barEl.style.width = "0%";
  }

  /* ================= the creature card (Step 3, scope decisions 21-23) ================= */
  /**
   * Any animal can be looked at up close: its drawing from its real genome, its
   * habitat, its traits in plain words, and the trait that is new in it. Only
   * choice points change whom you follow. The world keeps running behind it.
   */
  showCard(id) {
    const ind = this.bridge.get(id);
    if (!ind) return;
    const t0 = performance.now(), doc = this.doc;
    const fresh = this.card?.id !== id;
    if (fresh) {
      const zone = this.bridge.zoneOf(id), newTrait = this.bridge.newTraitOf(id);
      this.followKey = "";
      /** @type {CardState} */
      this.card = { id, gone: false, genome: ind.bodyGenome, zone, glow: newTrait ? [newTrait.trait] : [], size: "" };
      this.cardEl.classList.remove("gone");
      this.cardWhere.set(livesLine(zone));
      this.cardNewEl.hidden = !newTrait;
      if (newTrait) this.cardNew.set(newAtBirthLine(newTrait.trait, newTrait.up));
      // What the animal has, in plain words (scope decision 22); the trait new at birth glows.
      this.cardTraitsEl.replaceChildren(...plainRows(ind.bodyGenome).map((r) => {
        const row = Object.assign(doc.createElement("div"), { className: r.trait === newTrait?.trait ? "row new" : "row" });
        row.append(Object.assign(doc.createElement("span"), { className: "v", textContent: r.value }),
          speakerButton(doc, () => `${r.value}.`));
        return row;
      }));
    }
    this.herd.selected = id;
    this.updateCard();
    clearTimeout(this.cardHideT);
    this.cardEl.hidden = false;
    this.placeCard(); // lays the card out, then draws the animal at the size its box has
    void this.cardEl.offsetWidth; // the opening transition starts from the closed look
    this.cardEl.classList.add("open");
    this.cardMs = performance.now() - t0;
    console.info(`[lineage] card for animal ${id}: ${this.cardMs.toFixed(1)} ms` +
      (fresh ? ` (drawing ${this.cardDrawMs.toFixed(1)} ms)` : ""));
  }

  /**
   * Where the card sits. Outside a choice, at the side of the map. While the
   * choice panel is up, in the room above it, wide, so it never covers an option
   * (scope decision 23). The animal is drawn again whenever its box changes size.
   */
  placeCard() {
    const c = this.card;
    if (!c) return;
    const above = !!this.choice || !!this.journal || !!this.since;
    this.cardEl.classList.toggle("above", above);
    if (above) {
      const panel = this.journal ? this.journalEl : this.since ? this.sinceEl : this.choiceEl;
      const panelTop = this.stage.clientHeight - panel.offsetHeight;
      const room = Math.max(160, panelTop - parseFloat(getComputedStyle(this.cardEl).top) - CARD_GAP);
      this.cardEl.style.setProperty("--room", `${Math.round(room)}px`);
    }
    const cv = this.cardAnimalEl, size = `${cv.clientWidth}x${cv.clientHeight}`;
    if (size !== c.size) {
      c.size = size;
      this.cardDrawMs = paintCreature(cv, c.genome, { seed: c.id, habitat: c.zone, glow: c.glow }).ms;
    }
  }

  /** The card's first line and counts follow the story; if the animal passes away, the card says so. */
  updateCard() {
    const c = this.card;
    if (!c || c.gone) return;
    const s = this.story, mine = this.herd.followed.has(c.id);
    if (!this.bridge.get(c.id)) {
      c.gone = true;
      this.herd.selected = null;
      this.cardWho.set(PASSED_AWAY);
      this.cardSwatchEl.style.setProperty("--mark", PLAIN_COLOR);
      this.cardCountsEl.hidden = true;
      this.cardEl.classList.add("gone");
      return;
    }
    const theirs = !mine && this.bridge.isOther(c.id);
    this.cardWho.set(mine ? inYour(s.noun) : theirs ? OTHERS_HERE : notInYour(s.noun));
    this.cardSwatchEl.style.setProperty("--mark", mine ? MINE_COLOR : theirs ? OTHERS_COLOR : PLAIN_COLOR);
    // One of the others here: how they did since the follow, against yours, as counts with bars.
    this.cardCountsEl.hidden = !theirs;
    if (theirs) {
      const rows = this.fairRows().reverse();
      const say = speakerButton(this.doc, () => rows.map((r) => `${countLine(r.label, r)}.`).join(" "));
      this.cardCountsEl.replaceChildren(...this.countRows(rows), say);
    }
    this.renderFollow();
  }

  /**
   * A glowing newborn's card always offers to follow its new variation (scope
   * decisions 32, 36 and 42), and "Not this one". When both sides have at least
   * MIN_SIZE animals in its habitat, the button says the fair test's real size:
   * "Follow 14 animals with smaller eyes". Otherwise "Follow animals with
   * smaller eyes", and the world first fast-forwards to see if it spreads. Only
   * while the world is watched and follows are left.
   */
  renderFollow() {
    const c = this.card, s = this.story;
    const g = c && !c.gone ? s.glowFor(c.id) : null;
    const open = !!g && s.followOpen && !this.since && !this.journal && !this.choice;
    this.cardFollowEl.hidden = !open;
    if (!open) { this.followKey = ""; return; }
    const text = s.canStartFor(g) ? followButton(s.sizeFor(g), g.v.group) : followSpread(g.v.group);
    const key = `${g.id}:${text}`;
    if (key === this.followKey) return;
    this.followKey = key;
    const doc = this.doc;
    const button = (text, cls, go) => {
      const row = Object.assign(doc.createElement("div"), { className: `follow-row ${cls}` });
      const b = Object.assign(doc.createElement("button"), { type: "button", textContent: text });
      b.addEventListener("click", go);
      row.append(b, speakerButton(doc, () => text));
      return row;
    };
    this.cardFollowEl.replaceChildren(button(text, "go", () => this.followFromMap(g)), button(NOT_THIS, "no", () => this.notThis(g)));
  }

  /** Closes quickly; `now` skips the transition. */
  closeCard(now = false) {
    this.card = null;
    this.herd.selected = null;
    this.cardEl.classList.remove("open");
    clearTimeout(this.cardHideT);
    if (now) this.cardEl.hidden = true;
    else this.cardHideT = setTimeout(() => { if (!this.card) this.cardEl.hidden = true; }, CARD_CLOSE_MS);
  }

  /* ================= counts, never percentages ================= */
  /** The fair test since the last follow: "Yours (smaller eyes): 20 → 27", "The others here: 20 → 19". */
  fairRows() {
    const s = this.story;
    if (!s.fair) return [];
    return [
      { label: yoursWith(s.fair.v.group), ...s.mine, color: MINE_COLOR },
      { label: OTHERS_HERE, ...s.theirs, color: OTHERS_COLOR },
    ];
  }

  /**
   * Group sizes as counts beside two small bars, then and now, in each
   * group's colour, on one scale for the rows shown together.
   * @param {Array<{label:string, then:number, now:number, color:string}>} rows
   */
  countRows(rows) {
    const doc = this.doc, top = Math.max(1, ...rows.flatMap((r) => [r.then, r.now]));
    return rows.map((r) => {
      const row = Object.assign(doc.createElement("div"), { className: "count" });
      row.style.setProperty("--mark", r.color);
      const bars = Object.assign(doc.createElement("span"), { className: "bars" });
      for (const [v, when] of [[r.then, "then"], [r.now, "now"]]) {
        const bar = Object.assign(doc.createElement("i"), { className: when });
        bar.style.height = `${v ? Math.max(10, Math.round((100 * v) / top)) : 0}%`;
        bars.append(bar);
      }
      row.append(bars, Object.assign(doc.createElement("span"), { textContent: countLine(r.label, r) }));
      return row;
    });
  }

  /**
   * A line of child-facing text with a speaker beside it. Returns a handle
   * whose set() changes the text and keeps the speaker.
   * @param {HTMLElement} el
   * @param {() => string} [read] what to read, when it is not the text itself
   */
  speakable(el, read) {
    const text = Object.assign(this.doc.createElement("span"), { className: "text" });
    text.append(...el.childNodes);
    el.append(text, speakerButton(this.doc, read ?? (() => text.textContent)));
    return { set: (t) => { text.textContent = t; } };
  }
  /* ================= narration ================= */
  /** Replace whatever is queued: the log only ever speaks about now. */
  say(lines) { this.logQueue = lines.slice(); this.logTimer = 0; }
  pumpLog(dt) {
    this.logTimer -= dt;
    if (this.logTimer <= 0 && this.logQueue.length) {
      this.log.set(this.logQueue.shift());
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
      this.placeCard();
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
    if (s.running && !this.journal && !this.since) { // a panel on screen holds the world
      const genMs = (s.fast ? FAST_SECONDS : GENERATION_SECONDS) * 1000;
      this.clock += Math.min(250, raw);
      if (this.clock >= genMs) {
        this.clock = Math.min(this.clock - genMs, genMs - 1);
        if (!this.bridge.extinct) this.generation(now);
      }
      if (s.running) this.barEl.style.width = `${(100 * Math.max(0, this.clock) / genMs).toFixed(1)}%`;
    }
    // A fast-forward shows: the badge is up and the animals hurry.
    const fastNow = s.fast && this.clock >= 0 && !this.journal;
    if (fastNow !== this.fastShown) {
      this.fastShown = fastNow;
      this.fastEl.hidden = !fastNow;
      this.herd.pace = fastNow ? FAST_PACE : 1;
    }
    // On the backup choice panel, and while a prediction or "Since your last choice" is up, the world pauses.
    if (this.journal) this.tickJournal(now, Math.min(250, raw));
    else if (this.since) this.tickSince(now, Math.min(250, raw));
    else if (s.phase === "choice") this.tickChoice(now, Math.min(250, raw));
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
    const want = !!home && !onScreen && this.story.phase !== "choice" && !this.since;
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
      if (/** @type {HTMLElement} */ (e.target).closest("button, #card, #choice, #since, #journal, #ending")) return;
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
    this.doc.getElementById("card-close").addEventListener("click", () => this.closeCard());
    this.doc.getElementById("since-next").addEventListener("click", () => this.closeSince());
    this.doc.addEventListener("keydown", (e) => { if (e.key === "Escape") this.closeCard(); });
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
    if (!a) { this.closeCard(); return; }
    // Before the story starts, a tap chooses the family to follow. After that, a tap opens the animal's card.
    if (this.story.phase === "waiting") this.begin(a);
    else this.showCard(a.id);
  }
}

/**
 * @typedef {Object} SinceState
 * @property {{v:import("./cohorts.js").Variation, id:number, zone:number}} x the follow waiting behind it
 * @property {number} left ms left before it goes on by itself
 * @property {number} paused ms stood still for read-aloud
 *
 * @typedef {Object} JournalState
 * @property {import("./journal.js").Question} question
 * @property {{v:import("./cohorts.js").Variation, id:number, zone:number}} option the follow it comes after
 * @property {number} left ms left to answer
 * @property {number} paused ms stood still for read-aloud
 * @property {null|import("./journal.js").Answer} answer the child's answer, once given
 * @property {number} goAt when an answered question closes
 *
 * @typedef {Object} CardState
 * @property {number} id the animal on the card
 * @property {boolean} gone it has passed away since the card opened
 * @property {ArrayLike<number>} genome its body genome
 * @property {number} zone its habitat (engine zone index)
 * @property {string[]} glow the trait that is new in it, if any
 * @property {string} size the drawing's box when it was last drawn, "WxH"
 */

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
    // Design shortcuts (design/current/README.md): ?moment=ending jumps to that moment in a real game state.
    const moment = q.get("moment");
    if (moment) import("./moments.js").then((m) => m.goToMoment(globalThis.lineageGame, moment));
  });
}
