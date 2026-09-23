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
import { Herd, GROUP_COLORS } from "./herd.js";
import { paintCreature } from "./creature.js";
import {
  Story, GENERATION_SECONDS, FAST_SECONDS, CHOICE_SECONDS, SKIP_GENERATIONS, STORY_CHOICES, STORY_GENERATIONS,
} from "./story.js";
import { isGoodSeed, goodSeed } from "./seeds.js";
import { averageOf, changedTraits, comparedRows, plainRows } from "./variations.js";
import { GAP } from "./reveal.js";
import {
  START_LINE, followLine, groupLines, TIMES_UP, optionLine, passedLines, chosenLines,
  skipDoneLines, lastPassed, madeIt, endingTitle, question, choicesHeading, choiceRecap, noChoices, neutralLines,
  evidenceLine, countLine, YOURS, THEIRS, SINCE_TITLE, theOnesWith, comparisonLines,
  inYour, notInYour, PASSED_AWAY, livesLine, newAtBirthLine, lookLine,
} from "./narration.js";
import { speakerButton, isSpeaking } from "./speech.js";

const LOG_MS = 3800;
/** How long the creature card takes to close (its CSS transition). */
const CARD_CLOSE_MS = 150;
/** During a choice, the gap kept between the card and the choice panel. */
const CARD_GAP = 12;
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
/** Your group's colour, as on the map. */
const MINE_COLOR = "#14657F";
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
    this.closeCard(true);
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
    this.updateCard(); // counts change each generation, and the animal may pass away
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
    this.hideHint();
    this.say([followLine(this.bridge.zoneOf(animal.id), f.members.size)]);
    this.centerOnGroup();
    this.updateHud();
  }

  /**
   * A choice point: the world pauses, and two or three animals are offered.
   * An open creature card stays open, and the countdown waits for it.
   */
  openChoice(now) {
    const s = this.story;
    this.choiceCountEl.textContent = `Choice ${s.points} of ${STORY_CHOICES}`;
    // How the last choice turned out, against the ones not chosen, as counts (never
    // percentages). After a neutral trait, it also says that trait made no difference.
    const last = s.choices[s.choices.length - 1];
    if (last) {
      const rows = [this.mineRow(), ...s.others.map((o) => this.otherRow(o, theOnesWith(o.option.group)))];
      const note = last.neutral ? neutralLines(last.group, s.mine).join(" ") : "";
      const title = Object.assign(this.doc.createElement("div"), { className: "since-title", textContent: SINCE_TITLE });
      title.append(speakerButton(this.doc, () => [SINCE_TITLE, ...rows.map((r) => `${countLine(r.label, r)}.`), note].join(" ")));
      this.choiceSinceEl.replaceChildren(title, ...this.countRows(rows),
        ...(note ? [Object.assign(this.doc.createElement("p"), { className: "note", textContent: note })] : []));
    } else this.choiceSinceEl.replaceChildren();
    this.choiceNoteEl.replaceChildren();
    this.choiceBarEl.style.width = "100%";
    // Shown in a random order, so the most common variation isn't always first. Each
    // keeps its colour on the map if it is not chosen.
    const shown = s.options.map((o) => ({ o, k: Math.random() })).sort((a, b) => a.k - b.k).map(({ o }) => o);
    this.optionEls = shown.map((o, k) => {
      o.color = GROUP_COLORS[k];
      const el = this.doc.createElement("div");
      el.className = "option";
      el.style.setProperty("--mark", o.color);
      const button = Object.assign(this.doc.createElement("button"), { type: "button", className: "pick" });
      const words = Object.assign(this.doc.createElement("span"), { className: "words" });
      words.append(Object.assign(this.doc.createElement("i"), { className: "swatch" }), optionLine(o.words));
      button.append(this.doc.createElement("canvas"), words);
      button.addEventListener("click", () => this.pick(o, false, performance.now()));
      el.append(button, speakerButton(this.doc, () => optionLine(o.words)));
      return Object.assign(el, { option: o, button });
    });
    this.optionsEl.replaceChildren(...this.optionEls);
    clearTimeout(this.choiceHideT);
    this.choiceEl.hidden = false;
    // Each option drawn like its creature card, with a ring on the part the choice is about
    // (and a close-up of it when it is small), so the difference being chosen shows.
    for (const el of this.optionEls) {
      const a = this.bridge.animal(el.option.id);
      paintCreature(el.querySelector("canvas"), a.genome, { seed: a.id, focus: el.option.trait, closeUp: true, habitat: a.zone });
    }
    requestAnimationFrame(() => this.choiceEl.classList.add("open"));
    this.choice = { left: CHOICE_SECONDS * 1000, paused: 0, picked: null };
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

  /** Your group becomes every animal with the chosen variation; then the world fast-forwards. */
  followChoice(option, byChance) {
    this.choice = null;
    this.placeCard(); // an open card goes back to the side
    this.choiceEl.classList.remove("open");
    this.choiceHideT = setTimeout(() => { if (!this.choice) this.choiceEl.hidden = true; }, 450);
    this.story.choose(option, byChance);
    this.syncGroups();
    this.updateCard();
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
    // The real-animal reveal (scope decision 10, docs/LINEAGE_REAL_ANIMAL_REVEAL.md): a surviving
    // group's actual average traits and main habitat, never its choices. Text for now; art comes later.
    this.revealEl.hidden = !s.reveal;
    if (s.reveal) {
      this.revealLine.set(s.reveal.animal.reveal);
      this.revealWhy.set(s.reveal.why.join(" ")); // only the sentences whose traits the group has
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
    const s = this.story, doc = this.doc;
    const zones = this.bridge.zoneCounts();
    const following = s.phase !== "waiting" && s.phase !== "ended";
    this.genEl.textContent = String(this.bridge.generation);
    this.countsEl.textContent = `${this.bridge.living.length} animals alive · ` +
      (following ? `your ${s.noun} ${this.herd.followed.size}` : s.phase === "ended" ? "story over" : "no family yet");
    this.zonesEl.textContent = `leaves ${zones[0]} · ground ${zones[1]} · water's edge ${zones[2]}`;
    // Since the last choice, as counts with bars: yours and the groups not chosen.
    this.othersEl.replaceChildren(...(s.others.length ?
      this.countRows([this.mineRow(), ...s.others.map((o) => this.otherRow(o, o.option.group))]) : []));
    this.othersEl.hidden = !s.others.length;
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
    const above = !!this.choice;
    this.cardEl.classList.toggle("above", above);
    if (above) {
      const panelTop = this.stage.clientHeight - this.choiceEl.offsetHeight;
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
    const theirs = mine ? null : s.others.find((o) => o.members.has(c.id));
    this.cardWho.set(mine ? inYour(s.noun) : theirs ? theOnesWith(theirs.option.group) : notInYour(s.noun));
    this.cardSwatchEl.style.setProperty("--mark", mine ? MINE_COLOR : theirs ? theirs.option.color : PLAIN_COLOR);
    // A group not chosen: how it did since the choice, against yours, as counts with bars.
    this.cardCountsEl.hidden = !theirs;
    if (theirs) {
      const rows = [this.otherRow(theirs, THEIRS), this.mineRow()];
      const say = speakerButton(this.doc, () => rows.map((r) => `${countLine(r.label, r)}.`).join(" "));
      this.cardCountsEl.replaceChildren(...this.countRows(rows), say);
    }
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
  mineRow() { return { label: YOURS, ...this.story.mine, color: MINE_COLOR }; }
  otherRow(o, label) { return { label, then: o.sizeAtChoice, now: o.members.size, color: o.option.color }; }

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
    if (s.phase === "choice") this.tickChoice(now, Math.min(250, raw));
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
      if (/** @type {HTMLElement} */ (e.target).closest("button, #card, #choice, #ending")) return;
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
  });
}
