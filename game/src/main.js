/**
 * LINEAGE — Milestone 2: the engine's Classroom mode on the designed canvas,
 * played as a story (scope decisions 6, 32–34, 42, 58–60 and 64–70, rules in story.js).
 *
 * Time waits for the child: the animals wander from the start, but no
 * generation runs until an animal is tapped and its family followed. The
 * child names the family, then makes its first choice: where it will live,
 * from a real baby of the family on each place's card (scope decision 70).
 * The line fills that place in a fast-forward with a live counter; from then
 * on one engine generation happens every GENERATION_SECONDS. Newborns in the line
 * with a new variation glow; tapping one follows the animals with it, and the
 * world fast-forwards while their count rises, with a live counter and the
 * whole line in view, then slows back to real time. The child watches the line
 * grow or die off, with the table's reason; each death fades gently with a
 * little light rising, the camera on it. A line that dies out gets its "Why?"
 * right there, then goes back to the line before. Births, deaths, glows and
 * every count on screen come from the engine's records.
 */

import { Bridge } from "./bridge.js";
import { FIXTURE_URL } from "./engine.js";
import { World, clamp } from "./world.js";
import { Sky, skyAt } from "./light.js";
import { Herd, KIN_COLOR, LINE_FADE_MS } from "./herd.js";
import { paintCreature, paintPlace } from "./creature.js";
import {
  Story, GENERATION_SECONDS, FAST_SECONDS, CHOICE_SECONDS, STORY_CHOICES, STORY_GENERATIONS, storyLength, nearlyOver,
  APPEAR_SPAN, appearFraction,
} from "./story.js";
import { familySince, better, differences, placeNow, timeSplit, misfit } from "./groups.js";
import { isGoodSeed, goodSeed, familiesWithAFuture } from "./seeds.js";
import { TRAIT_WORDS, averageOf, comparedRows, plainRows } from "./variations.js";
import { GAP } from "./reveal.js";
import {
  START_LINE, bornLine, followLine, groupLines, TIMES_UP, optionLine, lastPassed, madeIt, endingTitle, question, choicesHeading,
  choiceRecap, noChoices, evidenceLine, countLine, SINCE_TITLE, ONE_OF_RELATIVES, RELATIVES_HERE, fairHeading, fairLater,
  inYour, notInYour, PASSED_AWAY, livesLine, newAtBirthLine, lookLine, yoursLabel, traitsTitle, namedReveal, homeLabel,
  GLOW_HINT, followButton, KEEP_LOOKING, needsYou, carriersLine, riseLine, SLOW_DOWN, watchThem, growingLine, dyingOffLine, goneLine, backToLine,
  lineWithLabel, helpingLine, hurtingLine, SAME_TRAIT, sameTraitLabel, averageTitle, TREE_TITLE, LINE_TREE_TITLE, treeSpoken, lineTreeSpoken,
  startLine, familyLabel, YOU_CHOSE, ZONE_AT,
  placeLine, ITS_FAMILY, doingLine, DIFFERENT_TITLE, MUCH_LIKE_YOURS, thanYours, misfitLine,
  awayLine, backLine, goBackLine, movingLine, movedLine, IN_TROUBLE, NEARLY_OVER_LINE, soFarTitle, chipWords, fadedLine,
  placeQuestion, PLACE_CARDS, WAIT_GENERATION, PLACE_LABELS, homeLine, homeCounter, WATCH_LINE, homeGoneLine, LOTS_OF_ROOM, fillingLine,
  firstHereLine,
} from "./narration.js";
import { speakerButton, isSpeaking } from "./speech.js";
import { explainGuess } from "./why.js";
import {
  IDEA_TRAITS, IDEA_OR, IDEA_DONE, CHECK_TITLE, REVEAL_TITLE, HAPPENED_TITLE, IDEA_TITLE, MY_IDEA, ideaSentence, cleanIdea, truthOf, checkIdea,
  FIELD_GUIDE, FIELD_GUIDE_TITLE, NOT_YET, discoveryLine, discoveredLine, guideEntry, discoveries, discover, keepInJournal,
} from "./reflection.js";
import { storyCard, shareCard } from "./storycard.js";
import { placeOf } from "./cohorts.js";
import {
  familyNames, nameButton, NAME_QUESTION, NAME_PICKED, NAMING_SECONDS, TYPE_OWN, USE_MY_NAME, TYPE_PROMPT, MY_NAME_PROMPT,
  TRY_ANOTHER_NAME, NAME_MAX, typedName, myNameFamily, standoutWord, hasBlockedWord,
} from "./names.js";
import { Sound, habitatWeights, SOUND_ON_SVG, SOUND_OFF_SVG, IDLE_MS } from "./sound.js";
import {
  PREDICT_AFTER, JOURNAL_SECONDS, JOURNAL_NOTE, PREDICTION_TITLE, SIMULATION_STORY, questionFor, resultOf,
} from "./journal.js";

const LOG_MS = 3800;
/** A line the log has just shown stays at least this long before a new one takes its place (a generation's, or a baby lighting up). */
const LOG_MIN_MS = 2600;
/** Edge arrows are placed again this often (ms). */
const ARROW_MS = 90;
/** How long the creature card takes to close (its CSS transition). */
const CARD_CLOSE_MS = 150;
/** During a choice, the gap kept between the card and the choice panel. */
const CARD_GAP = 12;
/** Where "sound off" is remembered on this device. */
const SOUND_KEY = "lineage.sound";
/** How often the sound follows the camera over the habitats, in ms. */
const SOUND_MS = 250;
/** The narration's room at the foot of the screen: a card at the side that reaches into it has the line wrap beside it. */
const LOG_ROOM = 120;
/** How long a chosen animal stays highlighted before the fast-forward. */
const PICKED_MS = 1200;
/** How long an answered prediction stays up, to read "Let's see…", before the fast-forward. */
const ANSWERED_MS = 2000;
/** Seconds to tap a guess (scope decision 60); like the other panels, the countdown waits while a line is read aloud. */
const GUESS_SECONDS = 20;
/** After a guess, why stays up this long (or until Next); it waits while a line is read aloud. */
const EXPLAIN_SECONDS = 9;
/** How long "Since your last choice" stays up, at most, before the new follow goes ahead. */
const SINCE_SECONDS = 15;
/** Seconds to choose where the family will live, once every place's card has its baby (scope decision 70). */
const PLACE_SECONDS = 30;
/**
 * The world runs on, fast, behind "Where will your family live?" while a card still waits for its baby, for at most
 * this many generations of the story; a card still waiting then is left out (in seeds 1-60 every card has its baby
 * by generation 3).
 */
const PLACE_WAIT_MAX = 6;
/** How long "Time's up!" shows before the fast-forward. */
const TIMES_UP_MS = 2800;
/** How long the story's last moment shows before the reflection screen. */
const ENDING_DELAY_MS = 2600;
/** The animals move this much faster during a fast-forward. */
const FAST_PACE = 2.5;
/** How often the camera target (your group's largest cluster) is worked out again. */
const HOME_MS = 400;
/**
 * The world a child meets first, when the page has no ?seed=: a seed of the
 * common-ancestor world where every moment shortcut finds its moment.
 */
const DEFAULT_SEED = 13;
/** Your family's colour, as on the map. */
const MINE_COLOR = "#14657F";
/**
 * The line's deaths on a watched day, one by one (scope decision 67): the
 * first starts this far into the day, the next ones at most DEATH_GAP_MS
 * apart, all within DEATH_SPAN_MS. Each fades over LINE_FADE_MS (herd.js).
 */
const DEATH_FIRST_MS = 1200, DEATH_GAP_MS = 1800, DEATH_SPAN_MS = 11000;
/** The slow-down after a fast-forward: the animals and the light ease back to real time over this long (scope decision 67). */
const SLOW_MS = 1800;
/** The clue's two sides: the animals with the trait, and the rest. */
const CLUE_WITH_COLOR = "#D9892B", CLUE_WITHOUT_COLOR = "#9A917C";
/** On a creature card, an animal in no group on the map. */
const PLAIN_COLOR = "#B3AA92";
/**
 * The choice timer stands still while a line is read aloud. This caps how long
 * it can stand still at one choice point, in case a browser's speech gets stuck.
 */
const MAX_READING_PAUSE_MS = 60000;
/** The arrival (Step 4 look): mist lifts and the camera drifts down into the leaves. */
const ARRIVAL_MS = 7200;
/** "Try another family" and "New world": a shorter mist. */
const RETURN_MS = 3000;
/** How quickly the light follows the group's mood (growing warmer, shrinking cooler). */
const MOOD_MS = 1800;
/** Two fingers (or + and −) zoom the map between these; never so far out that the world stops filling the screen. */
const ZOOM_MIN = 0.6, ZOOM_MAX = 2.5;
/** One tap on + or − zooms this much. */
const ZOOM_STEP = 1.25;
/** On a phone the story is told a little closer, so an animal is about as big under a finger as on an iPad. */
const PHONE_ZOOM = 1.25;
/** When the arrival settles it may come up to this much closer than the story's zoom, to show a family clearly. */
const ARRIVAL_CLOSER = 1.5;
/** A short or narrow screen (a phone): the generation panel is a slim bar (the same sizes as styles.css). */
const COMPACT = "(max-height: 599px), (max-width: 599px)";
/** On a short screen the narration keeps to about a fifth of the height. */
const SHORT_PX = 600;
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => k * k * (3 - 2 * k);

export class Game {
  /**
   * @param {Document} doc
   * @param {Bridge} bridge the engine world to show, at generation 0
   * @param {{seed:number, makeWorld:(seed:number)=>Bridge, demo?:boolean, length?:number}} world how to make this world
   *   again, or another; the teacher demo (?demo=webbed) lets any family be picked; the story's length (?length=)
   */
  constructor(doc, bridge, { seed, makeWorld, demo = false, length = STORY_GENERATIONS }) {
    const $ = (id) => /** @type {HTMLElement} */ (doc.getElementById(id));
    this.doc = doc;
    this.stage = $("stage");
    this.cv = /** @type {HTMLCanvasElement} */ ($("world"));
    this.ctx = /** @type {CanvasRenderingContext2D} */ (this.cv.getContext("2d"));
    this.hintEl = $("hint");
    this.homeEl = $("home");
    this.logEl = $("log");
    this.logbarEl = $("logbar");
    /** @type {Map<string, string>} visual moods for spread lines, by text */
    this.logMoods = new Map();
    this.genEl = $("gen");
    this.barEl = $("genbar");
    this.fastEl = $("fast");
    this.countsEl = $("counts");
    this.zonesEl = $("zones");
    this.othersEl = $("others");
    this.soFarEl = $("so-far");
    this.cardEl = $("card");
    this.cardAnimalEl = /** @type {HTMLCanvasElement} */ ($("card-animal"));
    this.cardNewEl = $("card-new");
    this.cardTraitsEl = $("card-traits");
    this.choiceEl = $("choice");
    this.choiceCountEl = $("choice-count");
    this.choiceSinceEl = $("choice-since");
    this.optionsEl = $("options");
    this.choiceBarEl = $("choice-bar");
    this.choiceNoteEl = $("choice-note");
    this.cardFollowEl = $("card-follow");
    this.cardGroupEl = $("card-group");
    this.sinceEl = $("since");
    this.sinceCountEl = $("since-count");
    this.sinceBodyEl = $("since-body");
    this.sinceBarEl = $("since-bar");
    this.endingFairEl = $("ending-fair");
    this.endingFairRowsEl = $("ending-fair-rows");
    // The ending's four steps (scope decision 62).
    this.stepEls = ["step-happened", "step-idea", "step-check", "step-reveal"].map($);
    this.stepNameEl = $("ending-step-name");
    this.stepCountEl = $("ending-step-count");
    this.endingNextEl = /** @type {HTMLButtonElement} */ ($("ending-next"));
    this.endingStartEl = /** @type {HTMLCanvasElement} */ ($("ending-start"));
    this.endingTreeEl = $("ending-tree");
    this.endingResultEl = $("ending-result");
    this.ideaBuilderEl = $("idea-builder");
    this.ideaOwnEl = /** @type {HTMLTextAreaElement} */ ($("idea-own"));
    this.ideaNoteEl = $("idea-note");
    this.ideaDoneEl = /** @type {HTMLButtonElement} */ ($("idea-done"));
    this.ideaCheckEl = $("idea-check");
    this.guideButtonEl = /** @type {HTMLButtonElement} */ ($("guide-button"));
    this.guideEl = $("guide");
    this.guideGridEl = $("guide-grid");
    this.journalEl = $("journal");
    this.journalOptionsEl = $("journal-options");
    this.journalBarEl = $("journal-bar");
    this.journalNoteEl = $("journal-note");
    this.placeEl = $("place");
    this.placeCardsEl = $("place-cards");
    this.placeBarEl = $("place-bar");
    this.placeNoteEl = $("place-note");
    this.placeQuestionLine = this.speakable($("place-question"));
    /** @type {Array<HTMLElement & {zone:number, button:HTMLButtonElement, words:HTMLElement, baby:null|number}>} the place cards, each with its baby */
    this.placeCardEls = [];
    this.guessEl = $("guess");
    this.guessOptionsEl = $("guess-options");
    this.guessNoteEl = $("guess-note");
    this.guessNextEl = /** @type {HTMLButtonElement} */ ($("guess-next"));
    this.guessBarEl = $("guess-bar");
    this.whyHereEl = $("why-here");
    this.namingEl = $("naming");
    this.namingOptionsEl = $("naming-options");
    this.namingBarEl = $("naming-bar");
    this.namingNoteEl = $("naming-note");
    this.namingMoreEl = $("naming-more");
    this.namingTypingEl = $("naming-typing");
    this.namingInputEl = /** @type {HTMLInputElement} */ ($("naming-input"));
    this.portraitEl = /** @type {HTMLButtonElement} */ ($("portrait"));
    this.portraitCanvas = /** @type {HTMLCanvasElement} */ (this.portraitEl.querySelector("canvas"));
    this.averageEl = $("average");
    this.averageAnimalEl = /** @type {HTMLCanvasElement} */ ($("average-animal"));
    this.averageTraitsEl = $("average-traits");
    this.treeEl = $("tree");
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
    this.revealFactsEl = $("reveal-facts");
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
    this.cardFitEl = $("card-fit");
    this.cardFit = this.speakable(this.cardFitEl);
    this.cardNew = this.speakable(this.cardNewEl);
    this.journalQuestion = this.speakable($("journal-question"));
    this.namingQuestion = this.speakable($("naming-question"));
    this.guessQuestion = this.speakable($("guess-question"));
    this.namingPrompt = this.speakable($("naming-prompt"));
    this.averageTitle = this.speakable($("average-title"));
    this.treeTitle = this.speakable($("tree-title"), () => this.treeSaid ?? TREE_TITLE);
    this.endingPredictionsLabel = this.speakable($("ending-predictions-label"));
    this.endingStart = this.speakable($("ending-start-line"));
    this.endingTreeTitle = this.speakable($("ending-tree-title"), () => this.endingTreeSaid ?? TREE_TITLE);
    this.ideaSaidEl = $("idea-said");
    this.ideaSaid = this.speakable(this.ideaSaidEl);
    this.ideaOr = this.speakable($("idea-or"));
    this.ideaMine = this.speakable($("idea-mine"));
    this.guideTitle = this.speakable($("guide-title"));
    this.guideCount = this.speakable($("guide-count"));
    this.bloomEl = $("bloom");
    // Sound (Step 5, sound.js): off until the first tap, and muted by ?sound=off or as it was last left here.
    let stored = null;
    try { stored = globalThis.localStorage?.getItem(SOUND_KEY) ?? null; } catch { /* storage blocked: sound on */ }
    const asked = new URLSearchParams(globalThis.location?.search ?? "").get("sound");
    this.sound = new Sound({ muted: asked === "off" || stored === "off" });
    this.soundT = 0;
    /** when the iPad was last touched: after IDLE_MS the sound is idle, quieter and rarer (scope decision 70) */
    this.lastTouch = performance.now();
    this.idleShown = false;
    this.muteEl = $("mute");
    this.showMute();
    /** @type {Map<string, () => void>} a sound for a log line, played when the line shows */
    this.logCues = new Map([[IN_TROUBLE, () => this.sound.waitTone()]]);
    this.hudEl = $("hud");
    this.miniEl = $("mini");
    this.miniCountEl = $("mini-count");
    this.zoomEl = $("zoom");
    /** 0 in real time, 1 fast-forwarding: the animals' pace and the light ease between the two (the slow-down, scope decision 67) */
    this.fastK = 0;
    this.zoomInEl = /** @type {HTMLButtonElement} */ ($("zoom-in"));
    this.zoomOutEl = /** @type {HTMLButtonElement} */ ($("zoom-out"));
    this.compact = globalThis.matchMedia?.(COMPACT) ?? { matches: false };
    this.placesEl = $("places");
    this.arrowsEl = $("arrows");
    /** @type {HTMLButtonElement[]} edge arrows, made as they are needed (at most GLOW_MAX) */
    this.arrowEls = [];
    this.arrowT = 0;
    /** @type {Map<string, number>} a log line that names a baby, and that baby: a tap on the line flies to it */
    this.logLinks = new Map();
    /** @type {null|number} the baby the log's line names now */
    this.logLink = null;
    this.logShownAt = 0;
    this.bloomLine = this.speakable($("bloom-line"));
    this.againEl = /** @type {HTMLButtonElement} */ ($("again"));
    this.newWorldEl = /** @type {HTMLButtonElement} */ ($("new-world"));
    // "This world is nearly over. Start a new world?" (scope decision 64)
    this.nearlyEl = $("nearly-over");
    this.nearlyNewEl = /** @type {HTMLButtonElement} */ ($("nearly-new"));
    this.nearlyKeepEl = /** @type {HTMLButtonElement} */ ($("nearly-keep"));
    this.speakable($("nearly-over-line")).set(NEARLY_OVER_LINE);

    this.world = new World();
    this.sky = new Sky(this.world, $("air"));
    // The zoom on screen is the settled zoom (pinch, + and −, the arrival's framing) times the arrival's own drift in.
    this.zoom = 1; this.zoomBase = 1; this.zoomK = 1; this.zoomTween = null;
    this.camOff = 0; this.mist = 1; this.mood = 0; this.moodTarget = 0; this.dayPhase = 0.12;
    this.painted = false;
    this.seed = seed;
    this.makeWorld = makeWorld;
    this.demo = demo;
    /** the generation every story in this page ends at, if its family lasts (?length=, scope decision 64) */
    this.storyLength = length;
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
    /** @type {null|GuessState} a tap-to-guess question on screen (scope decision 60) */
    this.guess = null;
    this.last = performance.now();

    this.setupCanvas();
    this.bindInput();
    this.start(bridge);
    // The world is painted behind the mist; the arrival starts when it is ready (or the mist would never lift).
    const painted = () => {
      this.painted = true;
      if (this.arrival && this.arrival.t0 === null) this.arrival.t0 = performance.now();
    };
    this.world.paint().then(painted, (err) => { console.error("lineage terrain paint failed", err); painted(); });

    this.step = (t) => {
      try { this.frame(t); } catch (err) { console.error("lineage frame failed", err); return; }
      this.raf = requestAnimationFrame(this.step);
    };
    this.raf = requestAnimationFrame(this.step);
  }

  /**
   * A world at generation 0, or this world as it is now with its herd ("Try
   * another family", scope decision 59): the animals wander, and time waits for
   * the child's tap on a family with a future.
   * @param {Bridge} bridge @param {null|Herd} [herd] the herd of a world kept as it is
   */
  start(bridge, herd = null) {
    this.bridge = bridge;
    if (herd) {
      this.herd = herd;
      Object.assign(herd, { followed: new Set(), relatives: new Set(), marks: new Map(), glowing: new Set(), following: false, selected: null, pace: 1 });
      bridge.unfollow(); // the last story's line and relatives are no one's now
    } else {
      this.herd = new Herd(this.world, 7919);
      this.herd.placeFounders(bridge);
    }
    // The families a tap may start with: an observer run shows each still alive a few generations on (seeds.js).
    // The teacher demo keeps every family, so the webbed family in the high leaves can still be followed.
    const future = this.demo ? null : familiesWithAFuture(this.makeWorld, this.seed, bridge);
    this.future = future && future.size ? future : null;
    // A "Why?" is a guess only at a new Field Guide discovery on this iPad (scope decision 69).
    // Every story's first choice is where the family will live (scope decision 70); the teacher demo keeps M1's fixture as it was.
    this.story = new Story(bridge, { homeOf: (id) => this.herd.animals.get(id)?.spot ?? null, length: this.storyLength, known: (key) => this.guideHas(key),
      places: !this.demo });
    this.clock = 0;
    this.choice = null;
    /**
     * @type {null|{left:number, paused:number, picked:null|number, goAt:number, byChance:boolean, framed:boolean}} "Where will
     * your family live?" on screen (scope decision 70)
     */
    this.placing = null;
    this.placeEl.classList.remove("open");
    this.placeEl.hidden = true;
    this.endingAt = null;
    this.home = null;
    this.homeT = 0;
    this.fastShown = null;
    /** the child is looking around on their own: the camera stays until "Back to my family" (playtest) */
    this.exploring = false;
    /** @type {null|number} the place the camera is flying to: its summary is said on arrival */
    this.visiting = null;
    /** @type {Array<{id:number, at:number}>} this watched day's babies still to appear, and when (story.watchT) */
    this.appearing = [];
    /** @type {Array<null|number>} how many lived in each place a generation ago, for "growing" or "shrinking" */
    this.zonesBefore = [null, null, null];
    this.glowKey = "";
    this.logLinks.clear();
    /** @type {null|{stay:number[], at:{x:number,y:number}}} a follow's gather-in, shown as the fast-forward begins */
    this.joining = null;
    /** @type {null|{zone:number, main:boolean}} a move of the line during a fast-forward, told when it ends */
    this.moveToTell = null;
    /** @type {null|number} the line's place filled up, still to be told (scope decision 70) */
    this.fillToTell = null;
    /** @type {Array<{id:number, at:number}>} the line's animals dying now or soon, one by one: the camera stays on each (scope decision 67) */
    this.deathCam = [];
    this.deathCamOn = null;
    /**
     * @type {null|{at:number, q:null|import("./why.js").Guess, old:boolean, say:string[]}} a line that just died out
     * (scope decision 68): once its last animals have faded (at), its "Why?" as a guess (q) or told (say, scope
     * decision 69), then "They didn't make it. Back to your line."
     */
    this.backing = null;
    /** the zoom the story was at before a fast-forward held the whole line in view, to go back to afterwards */
    this.zoomBeforeFast = null;
    this.fastK = 0;
    this.soFarKey = "";
    this.closeCard(true);
    this.choiceEl.classList.remove("open");
    this.choiceEl.hidden = true;
    this.journal = null;
    /** @type {import("./journal.js").Prediction[]} this story's predictions */
    this.predictions = [];
    this.journalEl.classList.remove("open");
    this.journalEl.hidden = true;
    this.guess = null;
    this.guessEl.classList.remove("open");
    this.guessEl.hidden = true;
    this.whyKey = "";
    this.averageOpen = false;
    this.averageEl.classList.remove("open");
    this.averageEl.hidden = true;
    this.portraitEl.hidden = true;
    this.guideOpen = false;
    this.guideEl.classList.remove("open");
    this.guideEl.hidden = true;
    this.guideButtonEl.hidden = false;
    /** @type {Array<{question:string, answer:null|string, right:boolean}>} this story's tap-to-guess answers, for the journal */
    this.guesses = [];
    this.storyId = null;
    /** @type {null|NamingState} naming the family, right after the first tap */
    this.naming = null;
    this.namingEl.classList.remove("open");
    this.namingEl.hidden = true;
    this.setHomeLabel();
    this.since = null;
    this.sinceEl.classList.remove("open");
    this.sinceEl.hidden = true;
    this.toldGlow = false;
    /** @type {Set<number>} glowing babies the log named: only those get a caption on the map */
    this.namedBirths = new Set();
    this.endingEl.hidden = true;
    this.mood = this.moodTarget = 0;
    this.dayPhase = 0;
    this.arrival = { t0: this.painted ? performance.now() : null, dur: this.painted ? RETURN_MS : ARRIVAL_MS };
    this.stage.classList.add("arriving");
    this.setHud(false); // a new story starts with the slim bar on a phone
    this.showHint();
    this.say([START_LINE]);
    this.updateHud();
    // The camera opens on a family with a future, close enough to tap one of them: the first founding family
    // that has one, or in a world kept as it is, the biggest.
    this.frameArrival(this.arrivalFamily());
  }

  /** Whether a tap on this animal may start a story: its family has a future (or no check applies). */
  hasFuture(id) { return !this.future || this.future.has(this.bridge.familyTopOf(id)); }

  /** The animals of the family the arrival shows (scope decision 59). */
  arrivalFamily() {
    const b = this.bridge;
    if (b.generation === 0) return (b.families.founding.find((f) => !this.future || this.future.has(f.key)) ?? b.families.founding[0]).ids;
    const counts = b.families.lineCounts(b.livingIds()), by = new Map();
    for (const id of b.livingIds()) {
      const top = b.families.top(id, counts);
      if (this.future && !this.future.has(top)) continue;
      if (!by.has(top)) by.set(top, []);
      by.get(top).push(id);
    }
    return [...by.values()].sort((a, c) => c.length - a.length)[0] ?? b.livingIds();
  }

  /* ================= engine generations ================= */
  generation(now) {
    const before = this.bridge.zoneCounts();
    const ev = this.bridge.step();
    if (!ev) return;
    const s = this.story, fast = s.fast, watched = s.phase === "watch";
    this.zonesBefore = before;
    // The engine made this generation's babies now. On a watched day they appear on the map one by one across it
    // (story.js appearFraction), the same times the story lets them glow; otherwise at once. The line's animals that
    // died fade one by one across a watched day too, each with a little light rising (scope decision 67).
    this.revealAll(now);
    const dying = this.deathTimes(ev, now, watched);
    this.herd.applyGeneration(ev, this.bridge, now, watched ? () => Infinity : () => now, (id) => dying.get(id) ?? now);
    if (watched) {
      this.appearing = ev.births.map((b) => ({ id: b.childId, at: s.watchT + APPEAR_SPAN * s.generationSeconds * appearFraction(b.childId) }));
    }
    this.deathCam = [...this.deathCam, ...[...dying].map(([id, at]) => ({ id, at }))].sort((a, b) => a.at - b.at);
    // The mood of the light: a little warmer when your group grows, cooler when it shrinks.
    if (ev.group && !fast) {
      const d = ev.group.count - ev.group.before, k = ev.group.before ? d / ev.group.before : 0;
      this.moodTarget = Math.abs(d) >= 2 && Math.abs(k) >= 0.08 ? clamp(k * 3, -1, 1) : 0;
    }
    const what = s.afterGeneration(ev);
    if (s.moved) this.moveToTell = s.moved; // told on the next watched generation, or when the fast-forward ends
    if (s.fillingNow) this.fillToTell = s.home.zone; // the line's place filled up: told on arriving, or the next watched generation
    // See, guess, explain: at a follow's result the world waits for a guess (scope decision 60). A line that died out
    // gets its own right there, once its last animals have faded (scope decision 68). Only a new Field Guide discovery
    // is a guess; any other "Why?" is told as a line, with no guess (scope decision 69).
    const q = s.phase === "watch" && !this.since && !this.journal && !this.naming && !this.guess ? s.guessNow(ev) : null;
    // A line that died out keeps its look on the map until the child is back with the line before (backNow).
    if (what === "back") { this.herd.followed = new Set(); this.syncGlow(); } else this.syncGroups();
    this.updatePortrait();
    this.updateCard(); // counts change each generation, and the animal may pass away
    if (what === "ended") this.storyEnded();
    else if (what === "place") this.fillPlaces(); // a card may fill in: a baby of the family was born there
    else if (what === "moving") this.homeCounterNow();
    else if (what === "arrived") this.arrived();
    else if (what === "choice") this.openChoice(now);
    else if (what === "rising") this.riseCounter();
    else if (what === "rise-done") this.riseDone();
    else if (what === "back") this.lineDied(ev, dying, now);
    else if (!fast) {
      // During a fast-forward, only its counter is narrated. The babies are named as each one lights up
      // (glowLines), never more than glow; the line just shown stays a moment first. Every change gets a reason from
      // the table (scope decision 60): after a follow, the line growing or dying off with its trait's (scope decision 67).
      // With a question now, the reasons wait: why comes after the guess. A follow's result whose entry is in the Field
      // Guide already is told instead: what happened, then the table's reason (scope decision 69).
      const v = s.verdict(ev);
      const lines = s.told ? s.told : v ? [v.kind === "growing" ? growingLine(v.c.v.group, s.name) : dyingOffLine(v.c.v.group, s.name), ...(q ? [] : [v.reason])] :
        [...groupLines(ev.group, s.noun, [], s.name), ...(q ? [] : s.changeReasons(ev))];
      // The line's place has just filled up: said first, since it is why some die now (scope decision 70).
      this.say([...this.fillingLines(), ...lines, ...this.moveLines(), ...this.glowLines()], true);
    }
    this.updateHud();
    if (what === "back") this.backing.q = q;
    else if (q) this.openGuess(q);
    if (s.phase !== "watch") this.revealAll(now); // a panel, a fast-forward or the end: the day's babies show at once
    const g = ev.group, r = s.rising ?? (what === "rise-done" ? s.lastRise : null);
    console.info(
      `[lineage] generation ${ev.generation}: ${ev.births.length} births, ${ev.deaths.length} deaths, ` +
      `${ev.mutations.length} mutations at birth` +
      (g ? ` · your ${s.noun} ${g.count} (was ${g.before}: +${g.born.length} −${g.gone.length}, ${g.mutated.length} new traits)` : "") +
      (this.bridge.relatives.size ? ` · relatives ${this.bridge.relatives.size} (${this.bridge.relativesIn(s.place)} here)` : "") +
      (s.moved ? ` · moved to ${s.moved.zone}${s.moved.main ? " (most of the line)" : ""}` : "") +
      ` · glowing ${s.glowing.length}` + (r ? ` · ${r.v.group} in the line: ${r.counts.join(", ")}${r.outcome ? ` (${r.outcome})` : ""}` : "") +
      (what === "back" ? ` · back to the line before (${s.backFrom?.group ?? "the line in its place"} died out)` : "") +
      (s.home && (s.phase === "moving" || what === "arrived") ? ` · the line in its new home: ${s.home.counts.join(", ")}` : "") +
      ` · story: ${s.phase}, ${s.choices.length} follows, ${s.tries.length} back`
    );
    if (ev.observerErrors.length) console.warn("[lineage] observer errors", ev.observerErrors);
  }

  /**
   * When each of the line's animals that died this generation starts to fade
   * (scope decision 67): on a watched day one by one, left to right, the first
   * DEATH_FIRST_MS into it. During a fast-forward they all fade at once, with
   * the whole line in view (holdLine).
   * @returns {Map<number, number>} by animal, when its fade starts (ms clock)
   */
  deathTimes(ev, now, watched) {
    const out = new Map();
    if (!watched || !ev.group) return out;
    const x = (id) => this.herd.animals.get(id).x;
    const gone = ev.group.gone.filter((id) => this.herd.shown(id)).sort((a, b) => x(a) - x(b));
    const gap = Math.min(DEATH_GAP_MS, DEATH_SPAN_MS / Math.max(1, gone.length));
    gone.forEach((id, i) => out.set(id, now + DEATH_FIRST_MS + i * gap));
    return out;
  }

  /** The map shows your family, then your line, and your relatives in a quiet colour (scope decisions 66 and 67), and which newborns glow. */
  syncGroups() {
    this.herd.followed = new Set(this.bridge.followedIds());
    this.herd.relatives = new Set(this.bridge.relativeIds());
    this.syncGlow();
    this.homeT = 0; // work the camera target out again on the next frame
  }

  /** The map's glowing babies are the story's, which start and end through the day. True when they changed. */
  syncGlow() {
    // While "Where will your family live?" is up, the babies on its cards glow (scope decision 70).
    const ids = this.placing ? this.placeCardEls.filter((el) => el.baby !== null && !el.hidden).map((el) => el.baby) : this.story.glowing.map((g) => g.id);
    const key = ids.join(",");
    if (key === this.glowKey) return false;
    this.glowKey = key;
    this.herd.glowing = new Set(ids);
    return true;
  }

  /** The line's place filled up (scope decision 70), once: "It's getting full. The best swimmers are winning." */
  fillingLines() {
    const z = this.fillToTell;
    this.fillToTell = null;
    return z === null || z === undefined ? [] : [fillingLine(z)];
  }

  /** A real move of the family (scope decision 59), once: "Some of your animals are moving to the water's edge." */
  moveLines() {
    const m = this.moveToTell, s = this.story;
    this.moveToTell = null;
    return m ? [m.main ? movedLine(m.zone, s.name) : movingLine(m.zone, s.name)] : [];
  }

  /** Every baby of the day still to appear shows now. */
  revealAll(now) {
    this.appearing = [];
    this.herd.showAll(now);
  }

  /**
   * The watched day goes on (story.js): its babies appear one by one at their
   * times, and a glow may start; the log names each baby as it lights up.
   * @param {number} seconds watched since the last frame
   */
  dayGoesOn(seconds, now) {
    const s = this.story;
    s.advance(seconds);
    if (this.appearing.length) {
      const t = s.watchT + 1e-9;
      this.appearing = this.appearing.filter((x) => {
        if (x.at > t) return true;
        const a = this.herd.animals.get(x.id);
        if (a?.hidden) this.herd.reveal(a, now);
        return false;
      });
    }
    const lines = this.glowLines();
    if (lines.length) this.sayNext(lines);
    if (this.syncGlow()) this.updateCard(); // a card's follow buttons come and go with the glow
  }

  /**
   * The babies that just began to glow, each named in the log as it lights up,
   * with a chime; a tap on the line flies to the baby. The first glow of a
   * story says what it is for. Only while the world is watched.
   */
  glowLines() {
    const s = this.story, started = s.takeStarted(), lines = [];
    if (s.phase !== "watch") return lines;
    for (const g of started) {
      if (!s.glowFor(g.id)) continue;
      const line = bornLine(g.v.group, s.name);
      this.namedBirths.add(g.id);
      this.logLinks.set(line, g.id);
      lines.push(line);
    }
    if (!lines.length) return lines;
    this.sound.chime();
    if (!this.toldGlow && s.followOpen) { this.toldGlow = true; lines.push(GLOW_HINT); }
    return lines;
  }

  /* ================= the story ================= */
  /**
   * The first tap: follow the family of the tapped animal's ancestor a few
   * generations back. The child names it first; then time starts.
   */
  begin(animal) {
    const f = this.story.begin(animal.id);
    this.syncGroups();
    this.herd.following = true;
    this.clock = 0;
    this.hideHint();
    this.say([followLine(this.story.place, f.members.size)]);
    // The arrival came close on one family; the story goes on at its own zoom, unless the child chose one.
    if (this.framed) this.zoomTo(this.comfortZoom());
    this.framed = false;
    this.exploring = false; this.visiting = null; // the child chose this family: the camera goes to it
    this.centerOnGroup();
    this.updateHud();
    this.openNaming();
  }

  /* ================= naming the family (Step 5, names.js) ================= */
  /**
   * Right after the first tap, before generation 1: three names for the family,
   * from its habitat and the traits that stand out in it, each with a speaker.
   * Time waits and the animals wander on. As on the other panels, the countdown
   * waits while a line is read aloud or a card is open.
   */
  openNaming() {
    const s = this.story, doc = this.doc;
    // Fresh names every story (scope decision 61), from the browser's own random numbers, never the engine's.
    const names = familyNames(s.lastAnimals, s.startWorld, Math.floor(Math.random() * 2 ** 31));
    this.namingQuestion.set(NAME_QUESTION);
    this.namingNoteEl.replaceChildren();
    this.namingBarEl.style.width = "100%";
    this.namingEl.classList.remove("typing");
    this.namingTypingEl.hidden = true;
    // Or type a name, or use your own: "Mia" makes "the Miapaddle family".
    this.namingMoreEl.replaceChildren(...[[TYPE_OWN, "own"], [USE_MY_NAME, "mine"]].map(([text, kind]) => {
      const el = Object.assign(doc.createElement("div"), { className: "more" });
      const button = Object.assign(doc.createElement("button"), { type: "button", textContent: text });
      button.addEventListener("click", () => this.startTyping(kind));
      el.append(button, speakerButton(doc, () => `${text}.`));
      return el;
    }));
    this.nameEls = names.map((name) => {
      const el = Object.assign(doc.createElement("div"), { className: "answer" });
      const button = Object.assign(doc.createElement("button"), { type: "button", className: "pick", textContent: nameButton(name) });
      button.addEventListener("click", () => this.pickName(name, false, performance.now()));
      el.append(button, speakerButton(doc, () => `${nameButton(name)}.`));
      return Object.assign(el, { name, button });
    });
    this.namingOptionsEl.replaceChildren(...this.nameEls);
    clearTimeout(this.namingHideT);
    this.namingEl.hidden = false;
    requestAnimationFrame(() => this.namingEl.classList.add("open"));
    this.naming = { names, left: NAMING_SECONDS * 1000, paused: 0, picked: null, goAt: 0, typing: null, word: standoutWord(s.lastAnimals, s.startWorld) };
    this.centerOnGroup(0.3);
  }

  /** The family has its name from now on, everywhere its animals are named. */
  pickName(name, byChance, now) {
    const n = this.naming;
    if (!n || n.picked) return;
    Object.assign(n, { picked: name, goAt: now + (byChance ? TIMES_UP_MS : PICKED_MS) });
    for (const el of this.nameEls) {
      el.button.disabled = true;
      el.classList.add(el.name === name ? "picked" : "not-picked");
    }
    // A typed name shows as a picked plate too.
    if (!this.nameEls.some((el) => el.name === name)) {
      const el = Object.assign(this.doc.createElement("div"), { className: "answer picked" });
      el.append(Object.assign(this.doc.createElement("button"), { type: "button", className: "pick", textContent: nameButton(name), disabled: true }),
        speakerButton(this.doc, () => `${nameButton(name)}.`));
      this.namingOptionsEl.prepend(el);
    }
    this.namingMoreEl.replaceChildren();
    this.story.name = name;
    this.updateHud();
    this.updateCard();
    this.setHomeLabel();
    if (byChance) this.namingNoteEl.replaceChildren(NAME_PICKED, speakerButton(this.doc, () => NAME_PICKED));
  }

  /**
   * Typing a name (scope decision 61): "own", a whole name, or "mine", the
   * child's own name joined to the family's standout trait word. The sheet
   * moves to the top, clear of the keyboard, and the countdown waits.
   * Letters only, up to NAME_MAX; nothing typed leaves the iPad.
   * @param {"own"|"mine"} kind
   */
  startTyping(kind) {
    const n = this.naming;
    if (!n || n.picked) return;
    n.typing = kind;
    this.namingPrompt.set(kind === "own" ? TYPE_PROMPT : MY_NAME_PROMPT);
    this.namingNoteEl.replaceChildren();
    this.namingInputEl.value = "";
    this.namingTypingEl.hidden = false;
    this.namingEl.classList.add("typing");
    this.namingInputEl.focus();
  }

  /** OK: the typed name, if it can be used; else "Let's try a different name." */
  submitTyping() {
    const n = this.naming;
    if (!n?.typing || n.picked) return;
    const name = n.typing === "own" ? typedName(this.namingInputEl.value) : myNameFamily(this.namingInputEl.value, n.word);
    if (!name) {
      this.namingNoteEl.replaceChildren(TRY_ANOTHER_NAME, speakerButton(this.doc, () => TRY_ANOTHER_NAME));
      this.namingInputEl.focus();
      return;
    }
    this.namingInputEl.blur();
    this.stopTyping();
    this.pickName(name, false, performance.now());
  }

  /** Back to the three names. */
  stopTyping() {
    const n = this.naming;
    if (n) n.typing = null;
    this.namingTypingEl.hidden = true;
    this.namingEl.classList.remove("typing");
  }

  /** The countdown; when it runs out, one of the names is picked at random. It waits while the child types. */
  tickNaming(now, dt) {
    const n = this.naming;
    if (n.picked) {
      if (now >= n.goAt) this.closeNaming();
      return;
    }
    if (n.typing) return;
    if (!this.card) {
      if (isSpeaking() && n.paused < MAX_READING_PAUSE_MS) n.paused += dt;
      else n.left = Math.max(0, n.left - dt);
    }
    this.namingBarEl.style.width = `${(100 * n.left / (NAMING_SECONDS * 1000)).toFixed(1)}%`;
    if (n.left === 0) this.pickName(n.names[Math.floor(Math.random() * n.names.length)], true, now);
  }

  /** The sheet goes, and generation 1 begins its day; or, first, the child chooses where the family will live. */
  closeNaming() {
    if (!this.naming) return;
    this.naming = null;
    this.updatePortrait();
    this.namingEl.classList.remove("open");
    this.namingHideT = setTimeout(() => { if (!this.naming) this.namingEl.hidden = true; }, 450);
    this.placeCard();
    this.centerOnGroup();
    if (this.story.phase === "place") this.openPlace();
  }

  /* ================= "Where will your family live?" (scope decision 70) ================= */
  /**
   * The first choice: a card for each place, each with a real baby of the
   * family that lives there, drawn in that place, and its line with a speaker.
   * A place with no such baby yet waits a generation: the world runs on, fast,
   * behind the sheet, and the card fills in when one is born (and its baby
   * glows on the map). Once every card has its baby the world waits, and the
   * time to choose runs; as on the other panels it waits while a line is read
   * aloud or a creature card is open, and when it runs out a place is picked
   * at random.
   */
  openPlace() {
    const s = this.story, doc = this.doc;
    this.placeQuestionLine.set(placeQuestion(s.name));
    this.placeNoteEl.replaceChildren();
    this.placeBarEl.style.width = "100%";
    this.placeCardEls = [0, 1, 2].map((zone) => {
      const el = Object.assign(doc.createElement("div"), { className: "option waiting" });
      const button = Object.assign(doc.createElement("button"), { type: "button", className: "pick", disabled: true });
      const words = Object.assign(doc.createElement("span"), { className: "words", textContent: WAIT_GENERATION });
      button.append(doc.createElement("canvas"), words);
      button.addEventListener("click", () => this.pickPlace(zone, false, performance.now()));
      el.append(button, speakerButton(doc, () => words.textContent));
      return Object.assign(el, { zone, button, words, baby: null });
    });
    this.placeCardsEl.replaceChildren(...this.placeCardEls);
    clearTimeout(this.placeHideT);
    this.placeEl.hidden = false;
    for (const el of this.placeCardEls) paintPlace(el.button.querySelector("canvas"), el.zone, s.startGeneration + el.zone + 1);
    requestAnimationFrame(() => this.placeEl.classList.add("open"));
    this.placing = { left: PLACE_SECONDS * 1000, paused: 0, picked: null, goAt: 0, byChance: false, framed: false };
    this.fillPlaces();
    this.updateCard();
    this.placeCard(); // an open card moves above the sheet
    this.centerOnGroup(0.3);
  }

  /**
   * Each card keeps its baby while it lives there; a card with none takes one
   * as soon as the family has one there (story.js placeCards), and one still
   * waiting after PLACE_WAIT_MAX generations is left out.
   */
  fillPlaces() {
    const s = this.story, p = this.placing;
    if (!p) return;
    const cards = s.placeCards(), late = this.bridge.generation - s.startGeneration >= PLACE_WAIT_MAX;
    let filled = false;
    for (const el of this.placeCardEls) {
      if (el.baby !== null && s.isPlaceBaby(el.baby, el.zone)) continue;
      const c = cards[el.zone], cv = el.button.querySelector("canvas");
      el.baby = c ? c.id : null;
      el.classList.toggle("waiting", !c);
      el.hidden = !c && late;
      el.button.disabled = !c || p.picked !== null;
      el.words.textContent = c ? PLACE_CARDS[el.zone] : WAIT_GENERATION;
      if (c) {
        const a = this.bridge.animal(c.id);
        paintCreature(cv, a.genome, { seed: a.id, habitat: el.zone });
        el.classList.remove("filled-in");
        void el.offsetWidth;
        el.classList.add("filled-in");
        filled = true;
      } else paintPlace(cv, el.zone, s.startGeneration + el.zone + 1);
    }
    if (filled) this.sound.chime();
    this.syncGlow();
    // Every card has its baby: the camera shows them glowing on the map, above the sheet, once.
    if (!this.placeRunning() && !p.framed) { p.framed = true; this.framePlaceBabies(); }
  }

  /** The babies on the place cards, where they live on the map, above the sheet (as far out as needed). */
  framePlaceBabies() {
    if (this.exploring) return;
    const pts = this.placeCardEls.filter((el) => el.baby !== null && !el.hidden).map((el) => this.herd.animals.get(el.baby)).filter((a) => a && !a.hidden);
    if (!pts.length) return;
    const floor = Math.max(this.vh * 0.3, this.stage.clientHeight - this.placeEl.offsetHeight - 12);
    const fit = this.bestFrame(pts, this.zoomMin(), this.zoomGoal(), pts.length, floor);
    if (!fit) return;
    this.zoomTween = { to: fit.z, t: 0 };
    this.camTween = { ...fit.cam, t: 0 };
  }

  /** The world runs on behind the sheet: a card still waits for its baby, and nothing is picked yet. */
  placeRunning() {
    const p = this.placing;
    return !!p && p.picked === null && this.placeCardEls.some((el) => el.baby === null && !el.hidden);
  }

  /** The child taps a place's card (or time ran out): it lights up, the others fade, and the move follows. */
  pickPlace(zone, byChance, now) {
    const p = this.placing, el = this.placeCardEls[zone];
    if (!p || p.picked !== null || !el || el.baby === null || el.hidden) return;
    Object.assign(p, { picked: zone, byChance, goAt: now + (byChance ? TIMES_UP_MS : PICKED_MS) });
    for (const x of this.placeCardEls) {
      x.button.disabled = true;
      x.classList.add(x === el ? "picked" : "not-picked");
    }
    if (byChance) this.placeNoteEl.replaceChildren(TIMES_UP, speakerButton(this.doc, () => TIMES_UP));
  }

  /** While the sheet is up: the picked card's moment, or the time to choose once every card has its baby. */
  tickPlace(now, dt) {
    const p = this.placing;
    if (p.picked !== null) {
      if (now >= p.goAt) this.placeChosen(p.picked);
      return;
    }
    if (this.placeRunning()) { this.placeBarEl.style.width = "100%"; return; }
    if (!this.card) {
      if (isSpeaking() && p.paused < MAX_READING_PAUSE_MS) p.paused += dt;
      else p.left = Math.max(0, p.left - dt);
    }
    this.placeBarEl.style.width = `${(100 * p.left / (PLACE_SECONDS * 1000)).toFixed(1)}%`;
    if (p.left === 0) {
      const open = this.placeCardEls.filter((el) => el.baby !== null && !el.hidden);
      if (open.length) this.pickPlace(open[Math.floor(Math.random() * open.length)].zone, true, now);
    }
  }

  /**
   * The move (story.js choosePlace): the line becomes the family's animals
   * living in the chosen place, and from now on their babies born there. The
   * world fast-forwards with the live counter, "Your Mossfoot line near the
   * water: 2… 5… 11… 20!", the camera holding the whole line in its new home,
   * until about 20 live there (or 4 generations); then back to real time. The
   * open ground usually has 20 there already: the line stays, with no
   * fast-forward.
   */
  placeChosen(zone) {
    const s = this.story, el = this.placeCardEls[zone];
    this.placing = null;
    this.placeEl.classList.remove("open");
    this.placeHideT = setTimeout(() => { if (!this.placing) this.placeEl.hidden = true; }, 450);
    this.revealAll(performance.now());
    const h = s.choosePlace(zone, el?.baby ?? undefined);
    this.placeCardEls = [];
    if (!h) return;
    this.setHomeLabel(); // "Back to my line"
    this.syncGroups();
    this.updateCard();
    this.updatePortrait();
    this.exploring = false; this.visiting = null; // the child chose: the camera goes to the line's new home
    this.updateHud();
    const counter = homeCounter(zone, h.counts, s.phase === "moving" ? null : h.outcome, s.name);
    this.logMoods.set(counter, "spread");
    // Afterwards the story's own zoom, whatever the sheet framed the babies at.
    this.zoomBeforeFast = this.comfortZoom();
    // A place with plenty of room (scope decision 70): its pairs have more babies, since there is more food.
    const room = h.roomy ? [LOTS_OF_ROOM] : [];
    if (s.phase === "moving") {
      this.say([homeLine(h.sizeAtChoice, zone, s.name), ...room, counter]);
      // With room, the move waits for "Lots of room here!" to come up, then starts under it.
      if (room.length) this.clock = -LOG_MS;
      this.holdLine();
    } else {
      this.say([homeLine(h.sizeAtChoice, zone, s.name), ...room, counter, WATCH_LINE]);
      this.zoomTo(this.zoomBeforeFast);
      this.zoomBeforeFast = null;
      this.centerOnGroup();
    }
    this.placeCard();
  }

  /** The move's counter, changed in place each generation of its fast-forward, with a rising note; the camera holds the line. */
  homeCounterNow(stopped = null) {
    const s = this.story, h = s.home, line = homeCounter(h.zone, h.counts, stopped, s.name);
    this.logMoods.set(line, "spread");
    this.sound.spreadNote(h.counts[h.counts.length - 1]);
    this.showLine(line);
    this.moodLog("spread");
    this.logQueue = [];
    this.logTimer = LOG_MS;
    if (!stopped) this.holdLine();
    return line;
  }

  /**
   * The line has about 20 in its new home (or the fast-forward's 4
   * generations are up): the counter's last number stays a moment, then "Back
   * to real time. Watch your line." The animals and the light ease back to
   * their own pace, and the camera goes back to the story's zoom on the new home.
   */
  arrived() {
    const s = this.story;
    this.homeCounterNow(s.home.outcome);
    // Full already: "It's getting full. The best swimmers are winning." (scope decision 70).
    this.logQueue = [SLOW_DOWN, ...this.fillingLines()];
    if (!this.exploring) this.zoomTo(this.zoomBeforeFast ?? this.comfortZoom());
    this.zoomBeforeFast = null;
    this.centerOnGroup();
    this.updateCard();
  }

  /** How much of each habitat is on screen: five points of the view, for the sound's crossfade. */
  habitatUnderCamera() {
    const v = this.view ?? { x: this.cam.x, y: this.cam.y, w: this.vw, h: this.vh }, w = [0, 0, 0];
    for (const [fx, fy] of [[0.5, 0.5], [0.25, 0.3], [0.75, 0.3], [0.25, 0.75], [0.75, 0.75]]) {
      const h = habitatWeights(this.world.zoneT(v.x + v.w * fx, v.y + v.h * fy));
      for (let i = 0; i < 3; i++) w[i] += h[i] / 5;
    }
    return w;
  }

  /* ================= your animals, on average (scope decision 61) ================= */
  /** The family's average body now, and where most of it lives. */
  averageNow() {
    const s = this.story, animals = s.lastAnimals.length ? s.lastAnimals : s.startAnimals;
    return { genome: averageOf(animals.map((a) => a.genome)).map((a) => a.mean), zone: s.place };
  }

  /** The living portrait in the corner, redrawn each generation while a family is followed. */
  updatePortrait() {
    const s = this.story, on = s.phase !== "waiting" && s.phase !== "ended" && s.lastAnimals.length > 0;
    this.portraitEl.hidden = !on;
    if (!on) return;
    const a = this.averageNow();
    paintCreature(this.portraitCanvas, a.genome, { seed: s.startGeneration + 1, habitat: a.zone });
  }

  /**
   * "Your animals, on average": the family's average body now, drawn large,
   * each meaningful trait against the world at the start (as on the ending),
   * and the family tree strip. The world waits while it is open.
   */
  openAverage() {
    const s = this.story, doc = this.doc;
    if (this.portraitEl.hidden || this.naming || this.placing || this.journal || this.since || this.guess || this.choice) return;
    const a = this.averageNow();
    this.averageTitle.set(averageTitle(s.name));
    this.averageTraitsEl.replaceChildren(...comparedRows(a.genome, s.startWorld, GAP).map((r) => {
      const row = Object.assign(doc.createElement("div"), { className: r.changed ? "row changed" : "row" });
      row.append(Object.assign(doc.createElement("span"), { className: "k", textContent: r.label }),
        Object.assign(doc.createElement("span"), { className: "v", textContent: r.value }), speakerButton(doc, () => `${r.label}: ${r.value}.`));
      return row;
    }));
    this.closeCard(true);
    this.averageOpen = true;
    this.averageEl.hidden = false;
    requestAnimationFrame(() => this.averageEl.classList.add("open"));
    // Drawn once the sheet has its size.
    requestAnimationFrame(() => {
      paintCreature(this.averageAnimalEl, a.genome, { seed: s.startGeneration + 1, habitat: a.zone });
      this.renderTree(this.treeEl, s.familyTree());
    });
  }

  closeAverage() {
    if (!this.averageOpen) return;
    this.averageOpen = false;
    this.averageEl.classList.remove("open");
    this.averageHideT = setTimeout(() => { if (!this.averageOpen) this.averageEl.hidden = true; }, 450);
  }

  /**
   * The family tree strip (story.js familyTree): before any follow, the first
   * one tapped after her mothers; then the chain of followed babies (scope
   * decision 66), the in-between ancestors smaller, each drawn from its real
   * body, with one speaker for the strip (the first one and the followed babies).
   * @param {HTMLElement} el @param {ReturnType<import("./story.js").Story["familyTree"]>} tree
   */
  renderTree(el, tree) {
    const doc = this.doc, items = [], nodes = [];
    tree.nodes.forEach((a, i) => {
      const w = Object.assign(doc.createElement("div"), { className: `who ${a.kind}${i === tree.nodes.length - 1 ? " last" : ""}` });
      const cv = doc.createElement("canvas");
      w.append(cv, Object.assign(doc.createElement("span"), { textContent: a.label }));
      if (i) nodes.push(Object.assign(doc.createElement("span"), { className: "step", textContent: a.joined ? "→" : "…" }));
      nodes.push(w);
      items.push({ cv, a });
    });
    el.replaceChildren(...nodes);
    this.treeSaid = tree.line ? lineTreeSpoken(tree.nodes.filter((a) => a.kind !== "between").map((a) => a.label)) : treeSpoken(null, tree.nodes.map((a) => a.label));
    this.treeTitle.set(tree.line ? LINE_TREE_TITLE : TREE_TITLE);
    for (const x of items) paintCreature(x.cv, x.a.genome, { seed: x.a.id, habitat: x.a.zone });
  }

  /** The mute button shows what a tap will do, and remembers the choice on this device. */
  showMute() {
    const m = this.sound.muted;
    this.muteEl.innerHTML = m ? SOUND_OFF_SVG : SOUND_ON_SVG;
    this.muteEl.setAttribute("aria-pressed", String(m));
  }
  toggleSound() {
    this.sound.setMuted(!this.sound.muted);
    try { globalThis.localStorage?.setItem(SOUND_KEY, this.sound.muted ? "off" : "on"); } catch { /* storage blocked */ }
    this.showMute();
  }

  /** "Back to my family", with the family's name once it has one. */
  setHomeLabel() {
    const text = [...this.homeEl.childNodes].find((n) => n.nodeType === 3);
    if (text) text.nodeValue = homeLabel(this.story?.noun ?? "family", this.story?.name ?? null);
  }

  /**
   * The backup choice panel (scope decisions 34 and 42): nothing was followed
   * for PUSH_SECONDS, so the world pauses and up to three variations that can
   * be followed are offered. An open creature card stays open,
   * and the countdown waits for it.
   */
  openChoice(now) {
    const s = this.story;
    // With the place choice first (scope decision 70), it is choice 1 and the follows count on from 2.
    const first = s.places ? 1 : 0;
    this.choiceCountEl.textContent = `Choice ${s.choices.length + 1 + first} of ${STORY_CHOICES + first}`;
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
   * The child follows a glowing newborn's variation (scope decisions 67 and
   * 68). While the child's line is very small, nothing can be followed at all
   * (scope decision 44, and the playtest's "no jumping ship"). After the first
   * follow, "Since your last choice" comes before the new one.
   * @param {import("./story.js").Glow} x
   */
  followFromMap(x) {
    const s = this.story;
    if (!s.followOpen || this.since || this.journal || this.choice || this.naming || this.guess || this.backing) return;
    if (s.inDanger || !s.followable(x)) return; // the card offers only "Keep looking"
    this.closeCard();
    if (s.choices.length) this.openSince(x);
    else this.doFollow(x, false);
  }

  /**
   * Follow (story.js, scope decisions 67 and 68): the line narrows to its
   * animals with the variation in its place, and the rest there become
   * relatives. Every third follow, a prediction first; then the world
   * fast-forwards while their count rises.
   */
  doFollow(x, byChance) {
    const s = this.story;
    this.revealAll(performance.now());
    s.follow(x, byChance);
    this.setHomeLabel(); // "Back to my line" from the first follow on
    // The line's animals with the trait light up (playtest).
    const stay = this.bridge.followedIds(), at = this.herd.largestCluster(stay);
    this.joining = at && { stay, at };
    this.syncGroups();
    this.updateCard();
    this.exploring = false; // the child chose: the camera goes to the line
    this.centerOnGroup();
    this.updateHud();
    // After every third follow, one prediction first (Step 6, scope decision 28).
    const n = s.choices.length;
    if (PREDICT_AFTER.includes(n)) this.openJournal(questionFor(s, x, PREDICT_AFTER.indexOf(n)), x);
    else this.fastForward(x);
    this.placeCard(); // an open card goes back to the side, or above the prediction
  }

  /**
   * The followed animals light up (playtest), with a line that counts them,
   * then the counter: after a moment to read them, the world fast-forwards
   * while their count rises, the whole line in view (scope decisions 67 and 68).
   */
  fastForward(x) {
    const s = this.story, j = this.joining, c = s.choices[s.choices.length - 1];
    this.joining = null;
    if (j) this.herd.gather(j.stay, [], new Map(), j.at, performance.now());
    this.preRoll(2);
    // The carriers were the family's at the first follow, then the line's (scope decision 66).
    const carriers = carriersLine(c.sizeAtChoice, x.v.group, s.name, s.choices.length > 1 ? "line" : "family");
    // Already RISE_TO or more, nothing to fast-forward; or fewer than FAST_FROM, watched from the start (scope decision 69).
    if (!s.fast) { this.say([carriers, watchThem(c.sizeAtChoice)]); return; }
    const counter = riseLine(x.v.group, c.counts, null, s.name);
    this.logMoods.set(counter, "spread");
    this.say([carriers, counter]);
    this.zoomBeforeFast = this.zoomGoal();
    this.holdLine();
  }

  /**
   * The fast-forward's counter, changed in place each generation (scope
   * decision 67): "More webbing in your line: 1… 4… 9…", with a rising note.
   * The camera keeps the whole line in view.
   * @param {null|string} [stopped] why it stopped, for its last number
   */
  riseCounter(stopped = null) {
    const s = this.story, r = s.rising ?? s.lastRise, line = riseLine(r.v.group, r.counts, stopped, s.name);
    this.logMoods.set(line, "spread");
    this.sound.spreadNote(r.counts[r.counts.length - 1]);
    this.showLine(line);
    this.moodLog("spread");
    this.logQueue = [];
    this.logTimer = LOG_MS;
    if (!stopped) this.holdLine();
    return line;
  }

  /**
   * The count stopped rising, or reached RISE_TO: its last number stays a
   * moment, then "Back to real time." The animals and the light ease back to
   * their own pace (frame), and the camera goes back to the story's zoom, on
   * the line.
   */
  riseDone() {
    this.riseCounter(this.story.lastRise.outcome);
    this.logQueue = [SLOW_DOWN, ...this.moveLines()];
    if (!this.exploring) this.zoomTo(this.zoomBeforeFast ?? this.comfortZoom());
    this.zoomBeforeFast = null;
    this.centerOnGroup();
    this.updateCard(); // follow buttons again
  }

  /**
   * During a fast-forward the camera holds the whole line in view (scope
   * decision 68), so none of it dies off screen: as close as the story's zoom
   * lets it, further out as far as needed, clear of the panels and the
   * narration. Not while the child is looking around.
   */
  holdLine() {
    if (this.exploring) return;
    const pts = [];
    for (const id of this.herd.followed) { const a = this.herd.animals.get(id); if (a && !a.hidden) pts.push(a); }
    if (!pts.length) return;
    const fit = this.bestFrame(pts, this.zoomMin(), Math.max(this.zoomMin(), this.zoomBeforeFast ?? this.zoomGoal()), pts.length);
    if (!fit) return;
    this.zoomTween = { to: fit.z, t: 0 };
    this.camTween = { ...fit.cam, t: 0 };
  }

  /**
   * The camera stays on each animal of the line as it dies (scope decision
   * 67): as one is about to fade, the camera goes to it unless it is already
   * well inside the view. Not while the child is looking around, nor under a panel.
   */
  followDeaths(now) {
    if (!this.deathCam.length) return;
    this.deathCam = this.deathCam.filter((d) => d.at + LINE_FADE_MS > now);
    const next = this.deathCam.find((d) => d.at - 700 <= now);
    if (!next || next.id === this.deathCamOn || this.exploring || this.panelUp || !this.view) return;
    const a = this.herd.animals.get(next.id) ?? this.herd.fading.find((f) => f.id === next.id);
    if (!a) return;
    this.deathCamOn = next.id;
    const v = this.view, inside = a.x > v.x + v.w * 0.28 && a.x < v.x + v.w * 0.72 && a.y > v.y + v.h * 0.25 && a.y < v.y + v.h * 0.62;
    if (!inside) this.flyTo(a.x, a.y - 11, 0.5, 0.45);
  }

  /**
   * A followed line died out (scope decision 68). Its last animals fade, one
   * by one on a watched day, the camera on them; then its "Why?" (backNow),
   * a guess only at a new Field Guide discovery, else its reason told as lines
   * (scope decision 69); and "They didn't make it. Back to your line."
   * @param {import("./bridge.js").GenerationEvents} ev @param {Map<number, number>} dying when each fade starts
   */
  lineDied(ev, dying, now) {
    const s = this.story, c = s.backFrom, h = s.homeGone;
    const last = Math.max(now, ...dying.values()) + LINE_FADE_MS;
    this.backing = { at: last, q: null, old: s.oldAgeMostly(ev.group, ev.deaths), say: s.diedSay };
    // A follow's line, or the line in the chosen place with no follow left (scope decision 70).
    this.say([c ? goneLine(c.v.group, ev.group.gone.length, s.name) : homeGoneLine(h.zone, ev.group.gone.length, s.name)]);
    this.sound.goneTone();
    this.zoomBeforeFast = null;
    // The camera stays with them as they fade: at once, when they faded during a fast-forward.
    if (!dying.size && !this.exploring) {
      const pts = ev.group.gone.map((id) => this.herd.fading.find((a) => a.id === id)).filter(Boolean);
      const at = pts.length ? { x: pts.reduce((n, a) => n + a.x, 0) / pts.length, y: pts.reduce((n, a) => n + a.y, 0) / pts.length } : null;
      if (at) this.flyTo(at.x, at.y - 11, 0.5, 0.42);
    }
  }

  /** The line's last animals have faded: its "Why?" as a guess, or its reason told, then back to the line before. */
  backNow() {
    const b = this.backing;
    this.backing = null;
    if (b.q) this.openGuess(b.q); // closeGuess comes back to the line
    else this.comeBack(b.old, b.say);
  }

  /**
   * "They didn't make it. Back to your line.": the line before is the child's
   * again, in blue, and the camera goes to it. First, why they died out, when
   * it was told rather than asked (scope decision 69).
   * @param {boolean} [old] most of them were old @param {string[]} [why] the table's reason, as lines
   */
  comeBack(old = false, why = []) {
    const s = this.story;
    this.say([...(old ? ["Some were old and died."] : why), backToLine(s.noun, s.name)]);
    // Back with the family, whose line in the chosen place died out: it chooses where to live again (scope decision 70).
    if (s.phase === "place") this.openPlace();
    this.setHomeLabel(); // "Back to my family" again, when the child is back with the family
    this.syncGroups();
    this.updateHud();
    this.updatePortrait();
    this.updateCard();
    this.exploring = false; this.visiting = null;
    this.zoomTo(this.comfortZoom());
    this.centerOnGroup();
  }

  /* ================= since your last choice (scope decision 34) ================= */
  /**
   * How the line did since the last follow (or since the child came back to
   * it): the line and its relatives here, counts with bars (scope decision
   * 67), and the prediction made at that follow beside what happened. In the
   * backup panel, or in its own sheet before a new follow.
   */
  fillSince(el) {
    const s = this.story;
    if (!s.choices.length) { el.replaceChildren(); return; }
    const rows = this.lineRows();
    const title = Object.assign(this.doc.createElement("div"), { className: "since-title", textContent: SINCE_TITLE });
    title.append(speakerButton(this.doc, () => [SINCE_TITLE, ...rows.map((r) => `${countLine(r.label, r)}.`)].join(" ")));
    el.replaceChildren(title, ...this.countRows(rows));
    // The prediction made at a follow, beside what really happened (Step 6).
    const p = this.predictions.find((x) => !x.result);
    if (p) {
      p.result = resultOf(p, s);
      el.append(this.predictionBlock(p, PREDICTION_TITLE));
    }
  }

  /** The world waits while the line since the last follow is shown; "Next" or SINCE_SECONDS goes on to the new follow. */
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

  /* ================= see, guess, explain (scope decision 60) ================= */
  /**
   * A question with three answers from the table, the same trait in each
   * place: the world waits for a guess, then says why. With no guess within
   * GUESS_SECONDS it says why anyway. Nothing is ever marked wrong.
   * @param {import("./why.js").Guess} q
   */
  openGuess(q) {
    const doc = this.doc;
    this.guessQuestion.set(q.text);
    this.guessNoteEl.replaceChildren();
    this.guessNoteEl.className = "";
    this.guessNextEl.hidden = true;
    this.guessBarEl.style.width = "100%";
    this.guessAnswerEls = q.options.map((o) => {
      const el = Object.assign(doc.createElement("div"), { className: "answer" });
      const button = Object.assign(doc.createElement("button"), { type: "button", className: "pick", textContent: o.text });
      button.addEventListener("click", () => this.answerGuess(o));
      el.append(button, speakerButton(doc, () => o.text));
      return Object.assign(el, { option: o, button });
    });
    this.guessOptionsEl.replaceChildren(...this.guessAnswerEls);
    clearTimeout(this.guessHideT);
    this.guessEl.hidden = false;
    requestAnimationFrame(() => this.guessEl.classList.add("open"));
    this.guess = { question: q, left: GUESS_SECONDS * 1000, paused: 0, answered: false };
    this.updateCard(); // no follow buttons while it is up
    this.placeCard();
    this.centerOnGroup(0.3);
  }

  /** A guess, or none (time ran out): then why, with its speaker, and Next. */
  answerGuess(option) {
    const g = this.guess;
    if (!g || g.answered) return;
    const line = explainGuess(g.question, option);
    Object.assign(g, { answered: true, option, left: EXPLAIN_SECONDS * 1000, paused: 0 });
    this.guesses.push({ question: g.question.text, answer: option?.text ?? null, right: !!option?.right });
    for (const el of this.guessAnswerEls) {
      el.button.disabled = true;
      el.classList.add(el.option === option ? "picked" : el.option.right ? "right-answer" : "not-picked");
    }
    this.guessNoteEl.className = option?.right ? "right" : "";
    const said = [line, ...(g.question.extra ? [g.question.extra] : [])].join(" ");
    this.guessNoteEl.replaceChildren(Object.assign(this.doc.createElement("span"), { className: "text", textContent: said }), speakerButton(this.doc, () => said));
    this.guessNextEl.hidden = false;
    this.guessBarEl.style.width = "100%";
  }

  /** Like the other panels' countdowns: it waits while a line is read aloud or a card is open. */
  tickGuess(now, dt) {
    const g = this.guess;
    if (!this.card) {
      if (isSpeaking() && g.paused < MAX_READING_PAUSE_MS) g.paused += dt;
      else g.left = Math.max(0, g.left - dt);
    }
    this.guessBarEl.style.width = `${(100 * g.left / ((g.answered ? EXPLAIN_SECONDS : GUESS_SECONDS) * 1000)).toFixed(1)}%`;
    if (g.left === 0) { if (g.answered) this.closeGuess(); else this.answerGuess(null); }
  }

  closeGuess() {
    if (!this.guess) return;
    const found = this.guess.question.discovery, died = this.guess.question.died;
    this.guess = null;
    // A line that died out: now "They didn't make it. Back to your line." (scope decision 68).
    if (died) this.comeBack();
    // A follow's result went the table's way: a Field Guide discovery (scope decisions 62 and 68).
    if (found) this.discovered(guideEntry(found.t, found.zone));
    this.guessEl.classList.remove("open");
    this.guessHideT = setTimeout(() => { if (!this.guess) this.guessEl.hidden = true; }, 450);
    this.updateCard();
    this.placeCard();
  }

  /**
   * "Keep looking": the card closes and the baby keeps glowing, so the child can
   * look at others and come back to it (scope decision 43). Its glow still ends
   * on its own after GLOW_GENERATIONS.
   */
  keepLooking() {
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
    const rows = r.rows.map((x) => ({ ...x, color: x.kin ? KIN_COLOR : MINE_COLOR }));
    const el = Object.assign(doc.createElement("div"), { className: "prediction" });
    const head = Object.assign(doc.createElement("div"), { className: "since-title", textContent: title });
    head.append(speakerButton(doc, () => [title, ...rows.map((x) => `${countLine(x.label, x)}.`), ...r.lines].join(" ")));
    el.append(head, ...this.countRows(rows), ...r.lines.map((line) => Object.assign(doc.createElement("p"), { className: "line", textContent: line })));
    return el;
  }

  /** A moment to read the log's first `lines` lines before the fast-forward starts. */
  preRoll(lines = 1) { this.clock = FAST_SECONDS * 1000 - lines * LOG_MS; }

  /** The group died out, or the story reached its last generation. A moment, then the reflection screen. */
  storyEnded() {
    const s = this.story;
    this.say([s.outcome === "died" ? lastPassed(s.noun, s.name) : madeIt(s.noun, s.name)]);
    this.endingAt = performance.now() + ENDING_DELAY_MS;
    this.updateHud();
  }

  /**
   * Every ending is a reflection, not a game-over screen, in four short steps
   * with Next (scope decision 62): what happened (the family at the start and
   * at the end, its family tree, the result); your idea (a sentence to build,
   * or the child's own words, which must be given before the story can be
   * played again); check my idea (against the table, with the clue and the
   * last choice's line beside its relatives here); and the reveal (the real animal, the traits, the story's
   * predictions and choices, the Field Guide and the story card).
   */
  showEnding() {
    const s = this.story, doc = this.doc;
    this.nearlyEl.hidden = true;
    this.closeCard(true);
    this.closeAverage();
    this.ideaAnswered = false;
    this.idea = null;
    // 1. What happened. The family's actual average body at the start and at the end (the last members alive),
    // drawn, never a list of choices (scope decision 20).
    this.endingTitle.set(endingTitle(s.outcome, s.lasted, s.noun, s.name));
    const average = averageOf(s.lastAnimals.map((a) => a.genome)).map((a) => a.mean);
    const began = averageOf(s.startAnimals.map((a) => a.genome)).map((a) => a.mean);
    this.endingStart.set(startLine(s.name));
    this.endingLook.set(lookLine(s.outcome, s.name));
    const tree = s.familyTree();
    this.endingTreeTitle.set(tree.line ? LINE_TREE_TITLE : TREE_TITLE);
    // Once the line is followed (scope decisions 66 and 67): the line since the latest follow, and its relatives here beside it.
    const followed = s.choices.length > 0, kin = s.relativesHere;
    const sizes = [{ label: familyLabel(s.name, s.noun), then: followed ? s.lineStart : s.sizeAtStart, now: s.outcome === "died" ? 0 : s.lastAnimals.length, color: MINE_COLOR },
      ...(followed && (kin.then || kin.now) ? [{ label: RELATIVES_HERE, then: kin.then, now: kin.now, color: KIN_COLOR }] : [])];
    const result = Object.assign(doc.createElement("div"), { className: "group-rows" });
    result.append(...this.countRows(sizes), speakerButton(doc, () => sizes.map((r) => `${countLine(r.label, r)}.`).join(" ")));
    // The place the child chose first (scope decision 70), then each chosen trait.
    const home = s.home ?? s.homeTries[s.homeTries.length - 1] ?? null;
    const picked = [...(home ? [{ words: PLACE_LABELS[home.zone], faded: null }] : []), ...s.chips.map((c) => ({ words: chipWords(c.v.group), faded: c.faded }))];
    const chips = picked.map((c) => c.words);
    const chosen = Object.assign(doc.createElement("div"), { className: "chips" });
    if (chips.length) {
      chosen.append(Object.assign(doc.createElement("span"), { className: "chips-title", textContent: YOU_CHOSE }),
        ...picked.map((c) => Object.assign(doc.createElement("span"), { className: c.faded ? "chip faded" : "chip", textContent: c.words })),
        speakerButton(doc, () => `${YOU_CHOSE} ${chips.join(", ")}.`));
    }
    this.endingResultEl.replaceChildren(result, ...(chips.length ? [chosen] : []));
    // 2. Your idea.
    this.endingQuestion.set(question(s.outcome, s.noun, s.name));
    this.buildIdea(s);
    // 3. Check my idea: filled in when the idea is given. The clue is the same trait in different places (scope decision 60), else one line.
    this.endingEvidenceEl.hidden = !s.clue && !s.evidence;
    this.endingEvidenceLineEl.hidden = !!s.clue;
    this.endingCompareEl.hidden = !s.clue;
    if (s.clue) {
      const rows = [
        { label: sameTraitLabel(s.clue.trait, s.clue.helps.zone), ...s.clue.helps, color: CLUE_WITH_COLOR },
        { label: sameTraitLabel(s.clue.trait, s.clue.hurts.zone), ...s.clue.hurts, color: CLUE_WITHOUT_COLOR },
      ];
      const heading = Object.assign(doc.createElement("div"), { className: "heading", textContent: SAME_TRAIT });
      heading.append(speakerButton(doc, () => [SAME_TRAIT, ...rows.map((r) => `${countLine(r.label, r)}.`)].join(" ")));
      this.endingCompareEl.replaceChildren(heading, ...this.countRows(rows));
    } else if (s.evidence) this.endingEvidence.set(evidenceLine(s.evidence));
    // The last choice: its line beside its relatives here (scope decision 67), when its result went the table's way
    // (story.js guessNow), or else at the end.
    const last = s.choices[s.choices.length - 1];
    this.endingFairEl.hidden = !last;
    if (last) {
      const r = last.result, rows = [
        { label: lineWithLabel(last.group, s.name), then: last.sizeAtChoice, now: r ? r.line : last.sizeAtEnd, color: MINE_COLOR },
        { label: RELATIVES_HERE, then: last.relativesAtChoice, now: r ? r.relatives : last.relativesAtEnd, color: KIN_COLOR },
      ];
      const head = r ? fairLater(last.zone, r.after) : fairHeading(last.zone);
      const heading = Object.assign(doc.createElement("div"), { className: "heading", textContent: head });
      heading.append(speakerButton(doc, () => [head, ...rows.map((x) => `${countLine(x.label, x)}.`)].join(" ")));
      this.endingFairRowsEl.replaceChildren(heading, ...this.countRows(rows));
    }
    // 4. The reveal. Each meaningful trait is compared with the whole world at the start (scope decision 20).
    this.endingTraitsTitle.set(traitsTitle(s.noun, s.name));
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
      li.append(speakerButton(doc, () => choiceRecap(c)));
      return li;
    }) : [Object.assign(doc.createElement("li"), { textContent: noChoices(s.outcome, s.name) })];
    if (!s.choices.length) items[0].append(speakerButton(doc, () => noChoices(s.outcome, s.name)));
    this.endingChoicesEl.replaceChildren(...items);
    this.endingChoicesEl.classList.toggle("none", !s.choices.length);
    this.endingChoicesEl.classList.toggle("many", s.choices.length > 5);
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
    // the family's actual average traits and main habitat when the story ended, never its choices.
    this.revealEl.hidden = !s.reveal;
    if (s.reveal) {
      const died = s.outcome === "died";
      this.revealLine.set(namedReveal(died ? s.reveal.animal.revealPast : s.reveal.animal.reveal, s.name));
      this.revealWhy.set((died ? s.reveal.whyPast : s.reveal.why).join(" "));
      this.revealFactsEl.replaceChildren(...s.reveal.facts.map((fact) => {
        const p = Object.assign(doc.createElement("p"), { className: "fact" });
        p.append(Object.assign(doc.createElement("span"), { className: "text", textContent: fact }), speakerButton(doc, () => fact));
        return p;
      }));
    }
    for (const [id, text] of [["guide-open", FIELD_GUIDE_TITLE], ["card-save", "Save my story card"], ["journal-link", "My journal"]]) doc.getElementById(id).textContent = text;
    this.endingEl.classList.toggle("died", s.outcome === "died");
    this.endingEl.classList.remove("show");
    this.endingEl.hidden = false;
    this.setEndingStep(0);
    void this.endingEl.offsetWidth;
    this.endingEl.classList.add("show");
    paintCreature(this.endingStartEl, began, { seed: s.startGeneration + 1, habitat: placeOf(s.startAnimals) });
    paintCreature(this.endingAnimalEl, average, { seed: s.startGeneration + 1, habitat: s.mainZone });
    this.renderTree(this.endingTreeEl, tree);
    this.endingTreeSaid = this.treeSaid;
  }

  /** Show one step of the ending: Next goes on, but "Your idea" goes on only once it is given (its own button). */
  setEndingStep(k) {
    this.endingStep = k;
    this.stepEls.forEach((el, i) => { el.hidden = i !== k; });
    this.stepNameEl.textContent = [HAPPENED_TITLE, IDEA_TITLE, CHECK_TITLE, REVEAL_TITLE][k];
    this.stepCountEl.textContent = `${k + 1} of 4`;
    this.endingNextEl.hidden = k === 1 || k === 3;
    this.againEl.hidden = this.newWorldEl.hidden = !this.ideaAnswered;
    this.nearlyEl.hidden = true;
    this.endingEl.querySelector(".card").scrollTop = 0;
    if (k === 3 && this.story.reveal) this.sound.revealChord(0.4);
  }

  /**
   * "Your idea": "My animals [did / didn't] survive because their [trait]
   * [helped / didn't help] [in the place]." Each part a large picker; the trait
   * and the place start empty, so the child chooses them. Or the child types
   * their own words. The sentence as built is read aloud by its speaker.
   * @param {import("./story.js").Story} s
   */
  buildIdea(s) {
    const doc = this.doc, survived = s.outcome === "survived";
    const pick = (name, options, value) => {
      const sel = Object.assign(doc.createElement("select"), { name });
      sel.setAttribute("aria-label", name);
      for (const [v, text] of options) sel.append(Object.assign(doc.createElement("option"), { value: String(v), textContent: text }));
      sel.value = String(value);
      sel.addEventListener("change", () => this.ideaChanged());
      return sel;
    };
    this.ideaPicks = {
      did: pick("did", [[1, "did"], [0, "didn't"]], survived ? 1 : 0),
      t: pick("trait", [["", "choose…"], ...IDEA_TRAITS.map((x) => [x.t, x.words])], ""),
      helped: pick("helped", [[1, "helped"], [0, "didn't help"]], survived ? 1 : 0),
      zone: pick("place", [["", "choose…"], ...ZONE_AT.map((z, i) => [i, z])], ""),
    };
    const word = (text) => Object.assign(doc.createElement("span"), { textContent: text });
    const p = this.ideaPicks;
    this.ideaBuilderEl.replaceChildren(word("My animals"), p.did, word("survive because their"), p.t, p.helped, p.zone, word("."));
    this.ideaOr.set(IDEA_OR);
    this.ideaOwnEl.value = "";
    this.ideaNoteEl.replaceChildren();
    this.ideaDoneEl.textContent = IDEA_DONE;
    this.ideaChanged();
  }

  /** The idea as it stands: the built sentence, or null until its trait and place are chosen. */
  builtIdea() {
    const p = this.ideaPicks;
    if (p.t.value === "" || p.zone.value === "") return null;
    return { did: p.did.value === "1", t: Number(p.t.value), helped: p.helped.value === "1", zone: Number(p.zone.value) };
  }

  /** The sentence and the button follow what the child picks or types. */
  ideaChanged() {
    const idea = this.builtIdea(), own = cleanIdea(this.ideaOwnEl.value).trim();
    for (const sel of Object.values(this.ideaPicks)) sel.classList.toggle("empty", sel.value === "");
    this.ideaSaid.set(idea ? ideaSentence(idea) : "");
    this.ideaSaidEl.hidden = !idea;
    this.ideaDoneEl.disabled = !idea && own.replace(/[^\p{L}]/gu, "").length < 3;
  }

  /**
   * The idea is given: check it (reflection.js), keep the story in this iPad's
   * journal for the teacher, and go on to "Check my idea". The play-again
   * buttons come now. A typed idea the filter catches is not taken.
   */
  answerIdea() {
    const s = this.story, own = cleanIdea(this.ideaOwnEl.value).trim(), built = this.builtIdea();
    const typed = own.replace(/[^\p{L}]/gu, "").length >= 3;
    if (!built && !typed) return;
    if (typed && hasBlockedWord(own)) {
      const line = "Let's try different words.";
      this.ideaNoteEl.replaceChildren(line, speakerButton(this.doc, () => line));
      return;
    }
    const idea = typed ? null : built, sentence = typed ? own : ideaSentence(built);
    const check = checkIdea(idea, truthOf(s));
    this.idea = { sentence, typed, check };
    this.ideaAnswered = true;
    this.ideaMine.set(`${MY_IDEA} ${sentence}`);
    this.ideaCheckEl.classList.toggle("right", check.right);
    this.ideaCheckEl.replaceChildren(...check.lines.map((line) => {
      const p = this.doc.createElement("p");
      p.append(Object.assign(this.doc.createElement("span"), { className: "text", textContent: line }), speakerButton(this.doc, () => line));
      return p;
    }));
    this.keepStory(check);
    this.setEndingStep(2);
  }

  /** The story, kept in this iPad's own journal for the teacher (reflection.js; nothing leaves the iPad). */
  keepStory(check) {
    const s = this.story;
    this.storyId = this.storyId ?? Date.now();
    keepInJournal({
      id: this.storyId, when: new Date().toISOString(), name: s.name, seed: this.seed,
      from: s.startGeneration, to: s.endGeneration, outcome: s.outcome, lasted: s.lasted,
      choices: s.choices.map((c) => `${c.group}${c.byChance ? " (picked at random)" : ""}`),
      idea: this.idea.sentence, typed: this.idea.typed, check: check.lines, right: check.right,
      reveal: s.reveal?.animal.name ?? null,
      predictions: this.predictions.map((p) => ({ question: p.question.text, answer: p.answer.text, lines: p.result?.lines ?? [], came: !!p.result?.came })),
      guesses: this.guesses ?? [],
    });
  }

  /**
   * The story card (scope decision 62): one picture of the story, made here
   * (storycard.js), to save or share from the iPad's own share sheet, or to
   * download. Nothing is uploaded.
   */
  /** The story card's chips: the place the child chose (scope decision 70), then each chosen trait. */
  storyChips() {
    const s = this.story, home = s.home ?? s.homeTries[s.homeTries.length - 1] ?? null;
    return [...(home ? [{ words: PLACE_LABELS[home.zone], faded: false }] : []), ...s.chips.map((c) => ({ words: chipWords(c.v.group), faded: !!c.faded }))];
  }

  async saveCard() {
    const s = this.story, button = /** @type {HTMLButtonElement} */ (this.doc.getElementById("card-save"));
    const label = button.textContent;
    button.disabled = true;
    button.textContent = "Making your card…";
    try {
      const canvas = await storyCard(this.doc, {
        name: s.name, noun: s.noun, title: endingTitle(s.outcome, s.lasted, s.noun, s.name), tree: s.familyTree(),
        chips: this.storyChips(),
        reveal: s.reveal ? namedReveal(s.outcome === "died" ? s.reveal.animal.revealPast : s.reveal.animal.reveal, s.name) : null,
        idea: this.idea?.sentence ?? null, died: s.outcome === "died",
      });
      this.cardCanvas = canvas; // for checking from the console and the moments
      await shareCard(canvas, s.name, s.noun);
    } catch (err) {
      console.warn("[lineage] story card", err);
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  }

  /* ================= the Field Guide (scope decision 62) ================= */
  /** Open the Field Guide: the 24 discoveries, each trait in each place and each neutral trait, found on this iPad. The world waits. */
  openGuide() {
    const doc = this.doc, found = discoveries(), n = FIELD_GUIDE.filter((e) => found.has(e.key)).length;
    this.guideTitle.set(FIELD_GUIDE_TITLE);
    this.guideCount.set(discoveredLine(n));
    const cells = [doc.createElement("span"), ...["High leaves", "Open ground", "Water's edge"].map((t) => Object.assign(doc.createElement("span"), { className: "place", textContent: t }))];
    // Each meaningful trait in each place, then each neutral trait once, across the three places (scope decision 65).
    for (const x of IDEA_TRAITS) {
      cells.push(Object.assign(doc.createElement("span"), { className: "trait", textContent: x.words.charAt(0).toUpperCase() + x.words.slice(1) }));
      for (const e of FIELD_GUIDE.filter((y) => y.t === x.t)) {
        const known = found.has(e.key), el = Object.assign(doc.createElement("div"), { className: `entry ${known ? { "✓": "helps", "✗": "hurts", "~": "little" }[e.mark] : "unknown"}${e.neutral ? " wide" : ""}` });
        el.append(Object.assign(doc.createElement("span"), { className: "mark", textContent: known ? e.mark : "?" }),
          Object.assign(doc.createElement("span"), { className: "text", textContent: known ? e.line : NOT_YET }));
        if (known) el.append(speakerButton(doc, () => e.line));
        cells.push(el);
      }
    }
    this.guideGridEl.replaceChildren(...cells);
    this.guideOpen = true;
    this.guideEl.hidden = false;
    requestAnimationFrame(() => this.guideEl.classList.add("open"));
  }

  closeGuide() {
    if (!this.guideOpen) return;
    this.guideOpen = false;
    this.guideEl.classList.remove("open");
    this.guideHideT = setTimeout(() => { if (!this.guideOpen) this.guideEl.hidden = true; }, 450);
  }

  /** A new discovery: said in the narration, with a chime ("You discovered: webbed feet help at the water's edge."). */
  discovered(entry) {
    if (!entry || !discover(entry)) return;
    const line = discoveryLine(entry);
    this.logLinks.delete(line);
    this.sayNext([line]);
    this.sound.chime();
  }

  /**
   * This iPad's Field Guide has the entry already (reflection.js), so its
   * "Why?" is told as a line, with no guess (scope decision 69). A moment
   * pretends a new iPad (false) or a full Field Guide (true), so that its
   * search and its replay agree (moments.js).
   * @param {string} key a Field Guide entry's key
   */
  guideHas(key) { return this.guideAll ?? discoveries().has(key); }

  /**
   * "Try another family" (scope decision 59): this world as it is now, and the
   * child taps a living family with a future. Only a story that reached the
   * last generation starts the world again from generation 0. With fewer than
   * NEARLY_OVER generations of the story left, it asks first (scope decision
   * 64); "Keep going anyway" comes back here with `anyway`.
   * @param {boolean} [anyway] @param {HTMLButtonElement} [btn] the button tapped, which says what is happening
   */
  anotherFamily(anyway = false, btn = this.againEl) {
    if (this.bridge.generation >= this.storyLength || this.bridge.extinct) { this.restart(this.seed); return; }
    if (!anyway && nearlyOver(this.bridge.generation, this.storyLength)) { this.askNearlyOver(); return; }
    // Let the button repaint before the observer run looks ahead.
    this.busy(btn, "Finding a family…", () => {
      this.endingEl.hidden = true;
      this.start(this.bridge, this.herd);
    });
  }

  /** "This world is nearly over. Start a new world?", with "New world" and a small "Keep going anyway", in place of the ending's buttons. */
  askNearlyOver() {
    this.againEl.hidden = this.newWorldEl.hidden = this.endingNextEl.hidden = true;
    this.nearlyEl.hidden = false;
  }

  /** The tapped button says what is happening, and the ending's buttons wait, while the page repaints; then it happens. */
  busy(btn, text, then) {
    const label = btn.textContent, all = [this.againEl, this.newWorldEl, this.nearlyNewEl, this.nearlyKeepEl];
    btn.textContent = text;
    for (const b of all) b.disabled = true;
    setTimeout(() => {
      btn.textContent = label;
      for (const b of all) b.disabled = false;
      then();
    }, 40);
  }

  /** Same seed: the same world again from generation 0. */
  restart(seed) {
    this.endingEl.hidden = true;
    this.seed = seed;
    const q = new URLSearchParams(location.search); // keeps ?demo=webbed
    q.set("seed", String(seed));
    q.delete("moment");
    history.replaceState(null, "", `?${q}`);
    this.start(this.makeWorld(seed));
  }

  /** A new world: only a seed whose three habitats all last the whole story (seeds.js). */
  newWorld(btn = this.newWorldEl) {
    // Let the button repaint before the engine runs ahead.
    this.busy(btn, "Finding a new world…", () => this.restart(goodSeed(this.makeWorld, this.seed, Math.random, this.storyLength) ?? this.seed));
  }

  updateHud() {
    const s = this.story;
    const zones = this.bridge.zoneCounts();
    const following = s.phase !== "waiting" && s.phase !== "ended", dying = !!this.backing || !!this.guess?.question.died;
    this.genEl.textContent = String(this.bridge.generation);
    // While a line that died out fades, and its "Why?" is up, the count is still that line's (scope decision 68).
    this.countsEl.textContent = `${this.bridge.living.length} animals alive · ` +
      (following ? `your ${s.name ? `${s.name} ` : ""}${dying ? "line" : s.noun} ${this.herd.followed.size}` : s.phase === "ended" ? "story over" : "no family yet");
    this.zonesEl.textContent = `leaves ${zones[0]} · ground ${zones[1]} · water's edge ${zones[2]}`;
    // The slim bar on a phone: the same count of your animals, beside your group's dot.
    this.miniEl.hidden = !following;
    this.miniCountEl.textContent = String(this.herd.followed.size);
    // Since the last follow, as counts with bars: the line and its relatives here (scope decision 67). Not while a line
    // that died out is still fading, before the child is back with the line before (scope decision 68).
    const rows = following && !dying ? this.lineRows() : [];
    const rowEls = this.countRows(rows);
    // One speaker reads both rows, at the end of the first (scope decision 67).
    if (rowEls.length) rowEls[0].append(speakerButton(this.doc, () => rows.map((r) => `${countLine(r.label, r)}.`).join(" ")));
    this.othersEl.replaceChildren(...rowEls);
    this.othersEl.hidden = !rows.length;
    this.showSoFar(following && !dying ? s.chips : [], following && !dying ? s.home : null);
    this.showWhyHere(following && !dying ? s.reasons : null);
    if (!s.running) this.barEl.style.width = "0%";
  }

  /**
   * "Helping here" and "Hurting here" (scope decision 60): what the family has
   * that helps or hurts where it lives, under the generation panel while a
   * family is followed. "Hurting here" shows only when it names a trait (scope
   * decision 64). Each line with its speaker.
   * @param {null|{helping:import("./why.js").Reason[], hurting:import("./why.js").Reason[]}} r
   */
  showWhyHere(r) {
    const rows = !r ? [] : [
      { kind: "help", text: helpingLine(r.helping.slice(0, 3).map((x) => x.words)) },
      ...(r.hurting.length ? [{ kind: "hurt", text: hurtingLine(r.hurting.slice(0, 3).map((x) => x.words)) }] : []),
    ];
    const key = rows.map((x) => x.text).join("|");
    if (key !== this.whyKey) {
      this.whyKey = key;
      this.whyHereEl.hidden = !rows.length;
      this.whyHereEl.replaceChildren(...rows.map(({ kind, text }) => {
        const p = Object.assign(this.doc.createElement("p"), { className: kind });
        p.append(Object.assign(this.doc.createElement("span"), { className: "text", textContent: text }), speakerButton(this.doc, () => text));
        return p;
      }));
    }
    if (rows.length) this.placeWhyHere();
  }

  /** The note sits just under the generation panel, whatever its size (a slim bar on a phone, or open). */
  placeWhyHere() {
    if (this.whyHereEl.hidden) return;
    // On a phone the Fast-forward badge hangs under the slim bar: the note goes under it.
    const badge = this.compact.matches && !this.fastEl.hidden && !this.hudEl.classList.contains("open") ? this.fastEl.offsetHeight + 6 : 0;
    const top = this.hudEl.offsetTop + this.hudEl.offsetHeight + 8 + badge;
    this.whyHereEl.style.top = `${top}px`;
    // With the panel open on a short screen, the note waits where it would run into the place buttons.
    const places = this.placesEl.offsetTop;
    this.whyHereEl.classList.toggle("crowded", places > 0 && top + this.whyHereEl.offsetHeight > places - 4);
  }

  /**
   * "Your family so far" (scope decision 59): each chosen trait as a chip, in
   * the order chosen; a faded one greys out, with its reason as a line below.
   * @param {import("./story.js").Chip[]} chips
   */
  showSoFar(chips, home = null) {
    const key = `${this.story?.name}:${this.story?.noun}:${home?.zone}:${chips.map((c) => `${c.v.group}:${c.faded}`).join("|")}`;
    if (key === this.soFarKey) return;
    this.soFarKey = key;
    const doc = this.doc, el = this.soFarEl;
    el.hidden = !chips.length && !home;
    if (!chips.length && !home) { el.replaceChildren(); return; }
    const faded = chips.filter((c) => c.faded).map((c) => fadedLine(c.v.group, c.faded));
    const words = soFarTitle(this.story.name, this.story.noun);
    // The place the child chose comes first (scope decision 70), then each chosen trait.
    const all = [...(home ? [{ words: PLACE_LABELS[home.zone], faded: null }] : []), ...chips.map((c) => ({ words: chipWords(c.v.group), faded: c.faded }))];
    const title = Object.assign(doc.createElement("div"), { className: "so-far-title", textContent: words });
    title.append(speakerButton(doc, () => `${words}: ${all.map((c) => c.words).join(", ")}.`));
    const row = Object.assign(doc.createElement("div"), { className: "chips" });
    row.append(...all.map((c) => Object.assign(doc.createElement("span"), { className: c.faded ? "chip faded" : "chip", textContent: c.words })));
    el.replaceChildren(title, row, ...faded.map((t) => {
      const p = Object.assign(doc.createElement("p"), { className: "faded-line" });
      p.append(Object.assign(doc.createElement("span"), { className: "text", textContent: t }), speakerButton(doc, () => t));
      return p;
    }));
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
      this.followKey = ""; this.groupKey = "";
      /** @type {CardState} */
      this.card = { id, gone: false, genome: ind.bodyGenome, zone, glow: newTrait ? [newTrait.trait] : [], size: "" };
      this.cardEl.classList.remove("gone");
      // Where it spends its time, and a trait that doesn't fit there (playtest).
      this.cardWhere.set(livesLine(timeSplit(ind.timeAllocation, zone)));
      const m = misfit(ind.bodyGenome, zone);
      this.cardFitEl.hidden = !m;
      if (m) this.cardFit.set(misfitLine(m, zone));
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
    const above = !!this.choice || !!this.placing || !!this.journal || !!this.since || !!this.naming || !!this.guess;
    this.cardEl.classList.toggle("above", above);
    if (above) {
      const panel = this.journal ? this.journalEl : this.guess ? this.guessEl : this.since ? this.sinceEl : this.naming ? this.namingEl :
        this.placing ? this.placeEl : this.choiceEl;
      const panelTop = this.stage.clientHeight - panel.offsetHeight;
      const room = Math.max(160, panelTop - parseFloat(getComputedStyle(this.cardEl).top) - CARD_GAP);
      this.cardEl.style.setProperty("--room", `${Math.round(room)}px`);
    }
    this.fitLog();
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
      this.cardGroupEl.hidden = true;
      this.cardEl.classList.add("gone");
      return;
    }
    // A relative is in its quiet colour (scope decisions 66 and 67).
    const kin = !mine && this.bridge.isRelative(c.id);
    this.cardWho.set(mine ? inYour(s.noun, s.name) : kin ? ONE_OF_RELATIVES : notInYour(s.noun, s.name));
    this.cardSwatchEl.style.setProperty("--mark", mine ? MINE_COLOR : kin ? KIN_COLOR : PLAIN_COLOR);
    this.renderGroup(c.id, mine, kin);
    this.renderFollow();
    this.fitLog(); // the card's height may have changed
  }

  /**
   * An animal outside your family (playtest): above its traits, its family
   * beside yours, then and now as counts with bars, and whether it is doing
   * better or worse than yours since the last follow; then up to three
   * meaningful traits where it differs most from yours. A relative (scope
   * decision 66): all your relatives beside your line, the same way.
   * @param {number} id @param {boolean} mine in your family or line @param {boolean} [kin] one of your relatives
   */
  renderGroup(id, mine, kin = false) {
    const s = this.story, doc = this.doc, el = this.cardGroupEl;
    el.hidden = mine || !s.mark || s.phase === "ended";
    if (el.hidden) { this.groupKey = ""; return; }
    const f = kin ? { ...s.relativesHere, ids: this.bridge.relativeIds().filter((i) => this.bridge.zoneOf(i) === s.place) } : familySince(this.bridge, s.mark, id);
    const rows = [{ label: kin ? RELATIVES_HERE : ITS_FAMILY, then: f.then, now: f.now, color: kin ? KIN_COLOR : PLAIN_COLOR },
      { label: kin ? familyLabel(s.name, s.noun) : yoursLabel(s.name), then: s.mark.family, now: s.family.now, color: MINE_COLOR }];
    const doing = doingLine(better(rows[0], rows[1]), s.choices.length > 0);
    // A group living in the line's place since before the child chose it, once the place is full (scope decision 70).
    const first = !kin && s.full && s.gotHereFirst(id) ? firstHereLine(s.home.zone) : null;
    const group = f.ids.map((i) => this.bridge.animal(i));
    const diffs = differences(group, this.bridge.followedAnimals()).map((d) => thanYours(d.trait, d.dir));
    // A trait the group has that doesn't fit where most of it lives.
    const where = [0, 1, 2].map((z) => group.filter((a) => a.zone === z).length), home = where.indexOf(Math.max(...where));
    const m = group.length ? misfit(averageOf(group.map((a) => a.genome)).map((a) => a.mean), home) : null;
    const fit = m ? misfitLine(m, home, true) : null;
    const key = JSON.stringify([id, rows.map((r) => [r.label, r.then, r.now]), doing, first, fit, diffs]);
    if (key === this.groupKey) return;
    this.groupKey = key;
    const line = (text, cls) => {
      const p = Object.assign(doc.createElement("p"), { className: cls });
      p.append(Object.assign(doc.createElement("span"), { className: "text", textContent: text }), speakerButton(doc, () => text));
      return p;
    };
    const counts = Object.assign(doc.createElement("div"), { className: "group-rows" });
    counts.append(...this.countRows(rows), speakerButton(doc, () => rows.map((r) => `${countLine(r.label, r)}.`).join(" ")));
    const title = Object.assign(doc.createElement("div"), { className: "diff-title", textContent: DIFFERENT_TITLE });
    title.append(speakerButton(doc, () => `${DIFFERENT_TITLE}: ${(diffs.length ? diffs : [MUCH_LIKE_YOURS]).join(". ")}.`));
    el.replaceChildren(counts, ...(first ? [line(first, "first")] : []), line(doing, "doing"), ...(fit ? [line(fit, "fit")] : []), title,
      ...(diffs.length ? diffs.map((d) => line(d, "diff")) : [line(MUCH_LIKE_YOURS, "same")]));
  }

  /**
   * A glowing newborn's card (scope decisions 32, 36, 42, 43, 58 and 59). When
   * enough of the family's animals in its place have the variation, with twins
   * without it, the button says the fair test's real size: "Follow 14 animals
   * with smaller eyes". Otherwise "Will it be passed on?", and the world first
   * fast-forwards to see. Always "Keep looking". The card explains instead of
   * offering a follow while the family is at DANGER_SIZE or fewer ("Your family
   * needs you. Stay with them?"), for a baby living away from the family's
   * place, for a trait that doesn't help or hurt there, and for the way back
   * from a direction the family already took. When a fair test showed that
   * direction hurting, the way back is offered with its reason: "Chunkier
   * bodies are doing better up here. Go back?" Only while the world is watched
   * and follows are left.
   */
  renderFollow() {
    const c = this.card, s = this.story;
    const g = c && !c.gone ? s.glowFor(c.id) : null;
    const open = !!g && s.followOpen && !this.since && !this.journal && !this.choice && !this.naming && !this.guess && !this.backing;
    this.cardFollowEl.hidden = !open;
    this.cardEl.classList.toggle("glowing", open);
    if (!open) { this.followKey = ""; return; }
    const why = s.inDanger ? "danger" : s.whyNot(g), went = s.went.get(g.v.t);
    // Any trait can be followed, with no hint whether it matters here (scope decision 65).
    const note = why === "danger" ? needsYou(s.noun, s.name) : why === "away" ? awayLine(this.bridge.zoneOf(g.id), s.name, s.noun) :
      why === "back" ? backLine(TRAIT_WORDS[g.v.trait][went.dir > 0 ? 1 : 0], s.name, s.noun) :
      s.goesBack(g) ? goBackLine(g.v.group, s.testZone()) : null;
    // "Follow animals with bigger eyes": no number and no gate (scope decision 67).
    const text = why ? null : followButton(g.v.group);
    const key = `${g.id}:${note}:${text}`;
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
    const keep = button(KEEP_LOOKING, "keep", () => this.keepLooking());
    const noteEl = note && Object.assign(doc.createElement("p"), { className: "follow-note" });
    if (noteEl) noteEl.append(Object.assign(doc.createElement("span"), { className: "text", textContent: note }), speakerButton(doc, () => note));
    this.cardFollowEl.replaceChildren(...(noteEl ? [noteEl] : []), ...(text ? [button(text, "go", () => this.followFromMap(g))] : []), keep);
  }

  /**
   * Visual only: while a card at the side reaches down to the narration (an iPad
   * held sideways), the line wraps beside it, so the line and its speaker stay in reach.
   */
  fitLog() {
    const el = this.cardEl, side = !!this.card && !el.hidden && !el.classList.contains("above");
    const reach = side && el.offsetTop + el.offsetHeight > this.stage.clientHeight - this.logRoom;
    this.logbarEl.style.paddingRight = reach ? `${this.stage.clientWidth - el.offsetLeft + 16}px` : "";
  }

  /** Closes quickly; `now` skips the transition. */
  closeCard(now = false) {
    this.card = null;
    this.herd.selected = null;
    this.fitLog();
    this.cardEl.classList.remove("open");
    clearTimeout(this.cardHideT);
    if (now) this.cardEl.hidden = true;
    else this.cardHideT = setTimeout(() => { if (!this.card) this.cardEl.hidden = true; }, CARD_CLOSE_MS);
  }

  /* ================= counts, never percentages ================= */
  /**
   * What the child compares after a follow (scope decisions 67 and 68): the line and its relatives here, since the
   * latest follow or since the child came back to the line: "Your Mossfoot line: 3 → 11", "Your relatives here: 40 → 38".
   */
  lineRows() {
    const s = this.story;
    if (!s.choices.length) return [];
    return [
      { label: familyLabel(s.name, s.noun), ...s.family, color: MINE_COLOR },
      { label: RELATIVES_HERE, ...s.relativesHere, color: KIN_COLOR },
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
  /** Visual only: the log's look for a spread's counter, a gentle fizzle, or "Wait!". A tick replays its pop. */
  moodLog(mood) {
    const c = this.logEl.classList;
    c.remove("spread", "gentle", "danger", "tick");
    if (!mood) return;
    c.add(mood);
    void this.logEl.offsetWidth;
    c.add("tick");
  }
  /**
   * Replace whatever is queued: the log only ever speaks about now. With `wait`,
   * the line on screen stays LOG_MIN_MS after it came, so a baby lighting up
   * never cuts a line short before it can be read.
   */
  say(lines, wait = false) {
    this.logQueue = lines.slice();
    this.logTimer = wait ? Math.max(0, LOG_MIN_MS - (performance.now() - this.logShownAt)) : 0;
  }
  /**
   * After whatever is queued: a baby lighting up never pushes aside a line not
   * yet read ("Wait!", "It disappeared."). With nothing queued, the lines come
   * once the line on screen has been up LOG_MIN_MS.
   */
  sayNext(lines) {
    if (!this.logQueue.length) this.logTimer = Math.min(this.logTimer, LOG_MIN_MS - (performance.now() - this.logShownAt));
    this.logQueue.push(...lines);
  }
  /** Say these lines right after the one on screen, before anything else queued. */
  sayFirst(lines) {
    if (!this.logQueue.length) this.logTimer = Math.min(this.logTimer, LOG_MIN_MS - (performance.now() - this.logShownAt));
    this.logQueue.unshift(...lines);
  }
  /** Show a line now. A line that names a baby can be tapped to fly there (showLink). */
  showLine(line) {
    this.log.set(line);
    this.logShownAt = performance.now();
    this.logLink = this.logLinks.get(line) ?? null;
    this.showLink();
  }
  /** The line leads to its baby while the baby is on the map. */
  showLink() {
    const on = this.logLink !== null && this.herd.shown(this.logLink);
    if (on !== this.logEl.classList.contains("link")) this.logEl.classList.toggle("link", on);
  }
  pumpLog(dt) {
    this.logTimer -= dt;
    if (this.logTimer <= 0 && this.logQueue.length) {
      const line = this.logQueue.shift();
      this.showLine(line);
      const mood = this.logMoods.get(line) ?? "";
      this.logEl.style.animation = "none"; void this.logEl.offsetWidth;
      this.logEl.style.animation = mood ? "" : "lgIn .55s ease both";
      this.moodLog(mood);
      this.logCues.get(line)?.();
      this.logTimer = LOG_MS;
    }
  }

  /* ================= looking around (playtest) ================= */
  /**
   * Fly the camera to a baby: from a line or a caption that names it (its card
   * opens too), or from an arrow at the screen's edge. The child is exploring
   * now, so the camera stays there until "Back to my family".
   * @param {number} id @param {boolean} [card] open its card
   */
  flyToBaby(id, card = false) {
    const a = this.herd.animals.get(id);
    if (!a || a.hidden) return;
    this.exploring = true; this.visiting = null;
    this.hideHint();
    if (card && this.story.phase !== "waiting") this.showCard(id);
    // The baby lands in the middle of the map an open card leaves free at the side, a little above the middle.
    const side = !!this.card && !this.cardEl.classList.contains("above"), left = this.cardEl.offsetLeft;
    this.flyTo(a.x, a.y - 11, side && left > this.vw * 0.35 ? left / 2 / this.vw : 0.5, 0.45);
  }

  /** The camera flies to a point of the map, `fx` of the way across the screen and `fy` down it. */
  flyTo(x, y, fx = 0.5, fy = 0.5) {
    this.camTween = { ...this.camAt(x, y, this.vw * fx, this.vh * fy, this.zoomGoal()), t: 0 };
  }

  /**
   * Visit a place: the camera flies to where most of its animals live, and on
   * arrival the narration sums it up (arrive). The child is exploring now.
   * @param {number} zone engine zone index
   */
  visitPlace(zone) {
    const ids = [];
    for (const a of this.herd.animals.values()) if (a.zone === zone && !a.hidden) ids.push(a.id);
    const p = this.herd.largestCluster(ids, 320) ?? { x: this.world.W / 2, y: this.world.yAt(this.world.W / 2, [0.2, 0.6, 0.96][zone]) };
    this.exploring = true;
    this.visiting = zone;
    this.hideHint();
    this.flyTo(p.x, p.y, 0.5, 0.45);
  }

  /** Arrived: "Water's edge: 119 animals, growing. Most have webbed feet." From the engine's counts. */
  arrive() {
    const zone = this.visiting;
    this.visiting = null;
    const p = placeNow(this.bridge.livingAnimals(), zone, this.zonesBefore[zone]);
    this.say([placeLine(zone, p.n, p.trend, p.common)]);
  }

  /**
   * An arrow at the screen's edge for each glowing baby off the screen,
   * pointing to it; a tap flies there. The arrows keep off the panels, the
   * buttons and the narration, and rest while a sheet, the ending or the
   * arrival is up.
   */
  placeArrows() {
    const s = this.story, v = this.view, z = this.zoom, R = 24, M = 8; // an arrow's radius, and the room kept around things
    const on = !!v && s.phase === "watch" && !this.arrival && !this.panelUp;
    const want = [];
    if (on) for (const g of s.glowing) {
      const a = this.herd.animals.get(g.id);
      if (!a || a.hidden) continue;
      const sx = (a.x - v.x) * z, sy = (a.y - 11 - v.y) * z;
      if (sx > 6 && sx < this.vw - 6 && sy > 6 && sy < this.vh - this.logRoom * 0.6) continue; // on the screen
      want.push({ id: g.id, sx, sy });
    }
    if (want.length) {
      // Arrows stand in the room the screen leaves: inside its edges, above the narration, off everything on it.
      const stage = this.stage.getBoundingClientRect();
      const blocks = [this.hudEl, this.muteEl, this.zoomEl, this.placesEl, this.card ? this.cardEl : null, this.homeShown ? this.homeEl : null,
        this.hintGone ? null : this.hintEl, this.bloomEl.hidden ? null : this.bloomEl]
        .filter(Boolean).map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({ l: r.left - stage.left - M, t: r.top - stage.top - M, r: r.right - stage.left + M, b: r.bottom - stage.top + M }));
      const box = { l: M + R, t: M + R, r: this.vw - M - R, b: this.vh - this.logRoom - R };
      const cx = this.vw / 2, cy = (box.t + box.b) / 2, placed = [];
      for (const w of want) {
        const dx = w.sx - cx, dy = w.sy - cy;
        const k = Math.min(dx > 0 ? (box.r - cx) / dx : dx < 0 ? (box.l - cx) / dx : Infinity, dy > 0 ? (box.b - cy) / dy : dy < 0 ? (box.t - cy) / dy : Infinity);
        const p = { x: cx + dx * k, y: cy + dy * k, a: Math.atan2(dy, dx), id: w.id };
        // Slide along its edge, off whatever is there and off the arrows already placed.
        const across = Math.abs(p.x - box.l) < 1 || Math.abs(p.x - box.r) < 1; // on a side: slides up or down
        for (let pass = 0; pass < 4; pass++) {
          const hit = [...blocks, ...placed.map((q) => ({ l: q.x - R - M, t: q.y - R - M, r: q.x + R + M, b: q.y + R + M }))]
            .find((b) => p.x + R > b.l && p.x - R < b.r && p.y + R > b.t && p.y - R < b.b);
          if (!hit) break;
          if (across) {
            const up = hit.t - R, down = hit.b + R;
            p.y = (Math.abs(up - p.y) <= Math.abs(down - p.y) && up >= box.t) || down > box.b ? up : down;
          } else {
            const left = hit.l - R, right = hit.r + R;
            p.x = (Math.abs(left - p.x) <= Math.abs(right - p.x) && left >= box.l) || right > box.r ? left : right;
          }
          p.x = clamp(p.x, box.l, box.r); p.y = clamp(p.y, box.t, box.b);
        }
        placed.push(p);
      }
      placed.forEach((p, i) => {
        const el = this.arrowEl(i);
        el.target = p.id;
        el.hidden = false;
        el.style.transform = `translate(${(p.x - R).toFixed(1)}px, ${(p.y - R).toFixed(1)}px)`;
        el.firstElementChild.style.transform = `rotate(${p.a.toFixed(3)}rad)`;
      });
    }
    for (let i = want.length; i < this.arrowEls.length; i++) this.arrowEls[i].hidden = true;
  }

  /** The i-th edge arrow, made the first time it is needed. */
  arrowEl(i) {
    if (!this.arrowEls[i]) {
      const b = /** @type {HTMLButtonElement & {target:null|number}} */ (Object.assign(this.doc.createElement("button"),
        { type: "button", className: "arrow", hidden: true, target: null }));
      b.setAttribute("aria-label", "Go to a glowing baby");
      b.append(this.doc.createElement("i"));
      b.addEventListener("click", () => { if (b.target !== null) this.flyToBaby(b.target); });
      this.arrowsEl.append(b);
      this.arrowEls[i] = b;
    }
    return this.arrowEls[i];
  }

  /* ================= canvas & camera ================= */
  setupCanvas() {
    this.onResize = () => {
      // The middle of the view stays where it was when the screen turns.
      if (this.vw) { this.cam.x += (this.vw - this.stage.clientWidth) / 2; this.cam.y += (this.vh - this.stage.clientHeight) / 2; }
      this.DPR = Math.min(devicePixelRatio || 1, 2);
      this.vw = this.stage.clientWidth; this.vh = this.stage.clientHeight;
      this.cv.width = Math.floor(this.vw * this.DPR); this.cv.height = Math.floor(this.vh * this.DPR);
      this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
      /** The narration's room at the foot of the screen: about a fifth of a short screen. */
      this.logRoom = this.vh < SHORT_PX ? Math.round(this.vh / 5) : LOG_ROOM;
      this.zoomBase = clamp(this.zoomBase, this.zoomMin(), ZOOM_MAX);
      this.clampCam();
      this.setHud(this.hudEl.classList.contains("open"));
      this.placeCard();
    };
    addEventListener("resize", this.onResize);
    this.onResize();
  }

  /*
   * The camera: `cam` is the view's top-left corner at zoom 1, so the middle of
   * the screen is always cam + half the screen, whatever the zoom. Zooming keeps
   * that middle where it is; a pinch keeps the spot between the fingers.
   */
  /** How far out the map zooms: ZOOM_MIN, or less far on a screen so big that the world would stop filling it. */
  zoomMin() { return Math.max(ZOOM_MIN, this.vw / this.world.W, this.vh / this.world.H); }
  /** The zoom the story is told at, and "Back to my family" goes back to. */
  comfortZoom() { return Math.min(this.vw, this.vh) < SHORT_PX ? PHONE_ZOOM : 1; }
  /** The zoom being gone to: the end of a zoom in progress, or the zoom now. */
  zoomGoal() { return this.zoomTween?.to ?? this.zoomBase; }
  /** Keep the view inside the world, at zoom `z`. */
  clampCam(z = this.zoomBase) {
    const c = this.camAt(this.cam.x + this.vw / 2, this.cam.y + this.vh / 2, this.vw / 2, this.vh / 2, z);
    this.cam.x = c.x; this.cam.y = c.y;
  }
  /** The camera that shows world point (wx, wy) at (sx, sy) on the screen at zoom z, kept inside the world. */
  camAt(wx, wy, sx, sy, z) {
    const ww = this.vw / z, wh = this.vh / z, mx = (this.vw - ww) / 2, my = (this.vh - wh) / 2;
    return {
      x: clamp(wx - sx / z - mx, -mx, Math.max(-mx, this.world.W - ww - mx)),
      y: clamp(wy - sy / z - my, -my, Math.max(-my, this.world.H - wh - my)),
    };
  }
  /** The world point under a point on the screen (client coordinates), in the view drawn last. */
  worldAt(px, py) {
    const rect = this.stage.getBoundingClientRect(), v = this.view ?? this.cam, z = this.zoom;
    return { x: v.x + (px - rect.left) / z, y: v.y + (py - rect.top) / z };
  }
  /** Put the camera on a point of the map at once, `fx` of the way across the screen and `fy` down it. */
  lookAt(x, y, fx = 0.5, fy = 0.5) {
    if (this.zoomTween) { this.zoomBase = this.zoomTween.to; this.zoomTween = null; }
    this.camTween = null;
    Object.assign(this.cam, this.camAt(x, y, this.vw * fx, this.vh * fy, this.zoomBase));
  }
  /** Zoom smoothly to `z`, around the middle of the screen. */
  zoomTo(z) {
    this.zoomTween = { to: clamp(z, this.zoomMin(), ZOOM_MAX), t: 0 };
  }
  /** + and −: the child chose a zoom, which the story keeps. */
  zoomBy(f) {
    this.framed = false;
    this.zoomTo(this.zoomGoal() * f);
    this.hideHint();
  }
  /**
   * The camera goes to your group's largest cluster: the group may be spread
   * across habitats. `high` of the screen above the middle, to clear a panel.
   */
  centerOnGroup(high = 0) {
    if (this.exploring) return; // the child is looking around: only "Back to my family" goes back (playtest)
    const p = this.herd.largestCluster(this.herd.followed); if (!p) return;
    this.camTween = { x: p.x - this.vw / 2, y: p.y - this.vh / 2 + high * this.vh / this.zoomGoal(), t: 0 };
  }

  /**
   * Where the arrival settles: on the first founding family, as close as up to
   * ARRIVAL_CLOSER times the story's zoom, where the panels, the hint and the
   * narration leave the most of the family clear, so its animals are big enough
   * to tap. The family's homes are used, as its animals wander around them.
   * @param {number[]} ids the family
   */
  frameArrival(ids) {
    const homes = ids.map((id) => this.herd.animals.get(id)?.home).filter(Boolean);
    const zc = this.comfortZoom(), fit = homes.length ? this.bestFrame(homes, zc, Math.min(ZOOM_MAX, zc * ARRIVAL_CLOSER)) : null;
    this.framed = true;
    this.camTween = null; this.zoomTween = null;
    this.zoomBase = fit ? fit.z : zc;
    if (fit) Object.assign(this.cam, fit.cam);
    this.clampCam();
    this.arrivalFit = fit; // for checking from the console
  }

  /**
   * The closest zoom from `hi` down to `lo` at which enough of these points are
   * clear on the screen (off the panels, the hint, the buttons and the
   * narration), and the camera for it: the most points clear, then the middle of
   * the screen. When no zoom shows enough, the one that shows the most.
   * @param {{x:number, y:number}[]} pts world points
   * @param {number} lo @param {number} hi the zooms to try, closest first
   * @param {number} [need] how many must be clear: by default most of them (at least 6, or all when fewer)
   * @param {number} [floor] how far down the screen is free (px): above the narration, or a sheet
   */
  bestFrame(pts, lo, hi, need = Math.min(pts.length, Math.max(6, Math.ceil((pts.length * 5) / 6))), floor = this.vh - this.logRoom) {
    const PAD = 18, EDGE = 24, stage = this.stage.getBoundingClientRect();
    const blocks = [this.hudEl, this.hintEl, this.muteEl, this.zoomEl].map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ l: r.left - stage.left - PAD, t: r.top - stage.top - PAD, r: r.right - stage.left + PAD, b: r.bottom - stage.top + PAD }));
    const bottom = floor, top = Math.max(0, ...blocks.map((b) => b.b));
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length, cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    // Places for the family's middle, the middle of the free part of the screen first.
    const steps = [0, -0.08, 0.08, -0.16, 0.16, -0.24, 0.24];
    const spots = steps.flatMap((dy) => steps.map((dx) => ({ dx, dy }))).sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
    let best = null;
    for (let z = hi; z >= lo - 1e-6; z -= 0.05) {
      let here = null;
      for (const { dx, dy } of spots) {
        const cam = this.camAt(cx, cy, this.vw * (0.5 + dx), (top + bottom) / 2 + (bottom - top) * dy, z);
        const vx = cam.x + (this.vw - this.vw / z) / 2, vy = cam.y + (this.vh - this.vh / z) / 2;
        let clear = 0, shown = 0;
        for (const p of pts) {
          const sx = (p.x - vx) * z, sy = (p.y - 11 - vy) * z; // the middle of the animal's body
          if (sx < EDGE || sx > this.vw - EDGE || sy < EDGE || sy > this.vh - EDGE) continue;
          shown++;
          if (sy < bottom - EDGE && !blocks.some((b) => sx > b.l && sx < b.r && sy > b.t && sy < b.b)) clear++;
        }
        if (!here || clear > here.clear || (clear === here.clear && shown > here.shown)) here = { z, cam, clear, shown, of: pts.length };
      }
      if (here.clear >= need) return here;
      if (!best || here.clear > best.clear || (here.clear === best.clear && here.shown > best.shown)) best = here;
    }
    return best;
  }

  /* ================= frame ================= */
  frame(now) {
    const raw = Math.max(0, now - this.last); this.last = now;
    const dt = Math.min(48, raw);
    const s = this.story;

    // The generation clock runs only while a story is watched or fast-forwarded,
    // and a hidden tab or a long stall never releases a burst of generations.
    // A panel on screen holds the world, and so does a line dying out, until its "Why?" is done (scope decision 68).
    // Behind "Where will your family live?" the world runs on only while a card waits for its baby (scope decision 70).
    if (s.running && !this.journal && !this.since && !this.naming && !this.guess && !this.averageOpen && !this.guideOpen && !this.backing &&
      (!this.placing || this.placeRunning())) {
      const genMs = (s.fast ? FAST_SECONDS : GENERATION_SECONDS) * 1000, step = Math.min(250, raw);
      this.clock += step;
      if (s.phase === "watch" && this.clock >= 0) this.dayGoesOn(step / 1000, now); // (a moment being reached holds the clock below 0)
      if (this.clock >= genMs) {
        this.clock = Math.min(this.clock - genMs, genMs - 1);
        if (!this.bridge.extinct) this.generation(now);
      }
      if (s.running) this.barEl.style.width = `${(100 * Math.max(0, this.clock) / genMs).toFixed(1)}%`;
    }
    // Out of a watched day (a fast-forward, a panel, the end), its babies are all shown and no glow is named.
    if (s.phase !== "watch") {
      if (this.appearing.length) this.revealAll(now);
      if (s.started.length) s.takeStarted();
    }
    // A fast-forward shows: the badge is up and the animals hurry. At its end they, and the light, ease back to real
    // time over SLOW_MS: the slow-down (scope decision 67).
    const fastNow = s.fast && this.clock >= 0 && !this.journal && (!this.placing || this.placeRunning());
    if (fastNow !== this.fastShown) {
      this.fastShown = fastNow;
      this.fastEl.hidden = !fastNow;
      this.stage.classList.toggle("rising", fastNow);
      this.placeWhyHere();
    }
    this.fastK = fastNow ? Math.min(1, this.fastK + dt / 300) : Math.max(0, this.fastK - dt / SLOW_MS);
    this.herd.pace = lerp(1, FAST_PACE, ease(this.fastK));
    // On the backup choice panel, and while a prediction or "Since your last choice" is up, the world pauses.
    if (this.journal) this.tickJournal(now, Math.min(250, raw));
    else if (this.guess) this.tickGuess(now, Math.min(250, raw));
    else if (this.since) this.tickSince(now, Math.min(250, raw));
    else if (s.phase === "choice") this.tickChoice(now, Math.min(250, raw));
    else {
      if (this.naming) this.tickNaming(now, Math.min(250, raw)); // time waits; the animals wander on
      else if (this.placing) this.tickPlace(now, Math.min(250, raw));
      this.herd.tick(dt, now);
    }
    if (this.endingAt !== null && now >= this.endingAt) { this.endingAt = null; this.showEnding(); }
    // A line that died out: once its last animals have faded, its "Why?" (scope decision 68).
    if (this.backing && now >= this.backing.at && !this.guess && !this.journal && !this.since && !this.naming && !this.placing && !this.averageOpen && !this.guideOpen &&
      s.phase === "watch") this.backNow();
    this.followDeaths(now);

    // Where "Back to my family" goes: the family's largest cluster.
    if ((this.homeT -= dt) <= 0) { this.homeT = HOME_MS; this.home = this.herd.largestCluster(this.herd.followed); }

    this.pumpLog(dt);
    this.updateLight(now, dt);
    if (!this.idleShown && now - this.lastTouch > IDLE_MS) { this.idleShown = true; this.sound.setIdle(true); } // nobody is playing
    if ((this.soundT -= dt) <= 0) { this.soundT = SOUND_MS; if (this.sound.on) this.sound.update(this.habitatUnderCamera()); }
    if (this.zoomTween) {
      const tw = this.zoomTween;
      tw.t = Math.min(1, tw.t + dt / 620);
      const e = 1 - Math.pow(1 - tw.t, 3);
      this.zoomBase += (tw.to - this.zoomBase) * e * 0.3;
      if (tw.t >= 1) { this.zoomBase = tw.to; this.zoomTween = null; }
      this.clampCam();
    }
    if (this.camTween) {
      const tw = this.camTween;
      tw.t = Math.min(1, tw.t + dt / 620);
      const e = 1 - Math.pow(1 - tw.t, 3);
      this.cam.x += (tw.x - this.cam.x) * e * 0.3;
      this.cam.y += (tw.y - this.cam.y) * e * 0.3;
      if (tw.t >= 1) { this.cam.x = tw.x; this.cam.y = tw.y; this.camTween = null; }
      this.clampCam();
    }
    if (this.visiting !== null && !this.camTween) this.arrive();
    this.zoom = this.zoomBase * this.zoomK;
    this.showZoomButtons();
    this.render(now);
    // Arrows to glowing babies off the screen, and whether the log's line leads to a baby, now and then.
    if ((this.arrowT -= dt) <= 0) { this.arrowT = ARROW_MS; this.placeArrows(); this.showLink(); }
  }

  /** + and − can't go past the ends, and they rest while a panel is up (the panel is what matters then). */
  showZoomButtons() {
    const z = this.zoomGoal(), canIn = z < ZOOM_MAX - 1e-3, canOut = z > this.zoomMin() + 1e-3;
    if (canIn !== this.canZoomIn) { this.canZoomIn = canIn; this.zoomInEl.disabled = !canIn; }
    if (canOut !== this.canZoomOut) { this.canZoomOut = canOut; this.zoomOutEl.disabled = !canOut; }
    const panel = !!(this.choice || this.placing || this.since || this.journal || this.naming || this.guess || this.averageOpen || this.guideOpen) || !this.endingEl.hidden;
    if (panel !== this.panelUp) { this.panelUp = panel; this.stage.classList.toggle("panel-up", panel); }
  }

  /**
   * One generation is one day (light.js): dawn when it arrives, golden hours,
   * dusk, a soft night, dawn again. The day stands still at a choice point, is
   * a gentle morning before the story starts, and golden (or, when the group
   * died out, a blue dusk) behind the ending. A fast-forward's days are quicker
   * and shallower, so they never flicker. Also the arrival and the mood.
   */
  updateLight(now, dt) {
    const s = this.story, a = this.arrival;
    let k = 1;
    if (a) {
      k = a.t0 === null ? 0 : clamp((now - a.t0) / a.dur, 0, 1);
      const long = a.dur >= ARRIVAL_MS, e = ease(k);
      this.zoomK = long ? lerp(0.68, 1, 1 - Math.pow(1 - k, 2.2)) : 1;
      this.camOff = long ? -170 * (1 - e) : 0;
      this.mist = 1 - ease(clamp((k - 0.04) / (long ? 0.72 : 0.8), 0, 1));
      this.arrivalK = k;
      if (k >= 1) this.endArrival();
    }
    const genMs = (s.fast ? FAST_SECONDS : GENERATION_SECONDS) * 1000;
    if (!this.endingEl.hidden || s.phase === "ended") {
      const want = s.outcome === "died" ? 0.735 : 0.6;
      this.dayPhase += (want - this.dayPhase) * Math.min(1, dt / 1400);
    } else if (s.phase === "waiting") this.dayPhase = a ? lerp(0, 0.12, ease(k)) : 0.12;
    else if (s.running) this.dayPhase = clamp(this.clock / genMs, 0, 0.999);
    const L = skyAt(this.dayPhase);
    if (this.fastK > 0) { const k = ease(this.fastK); L.tA *= lerp(1, 0.6, k); L.night *= lerp(1, 0.35, k); }
    this.light = L;
    this.mood += (this.moodTarget - this.mood) * Math.min(1, dt / MOOD_MS);
    this.herd.light = L; this.herd.mood = this.mood;
    const cls = this.stage.classList;
    cls.toggle("mood-grow", this.mood > 0.25);
    cls.toggle("mood-shrink", this.mood < -0.25);
    cls.toggle("night", L.night > 0.6);
  }

  /** The mist has lifted: the panels and the one line come in. */
  endArrival() {
    this.arrival = null;
    this.zoomK = 1; this.zoom = this.zoomBase; this.camOff = 0; this.mist = 0;
    this.stage.classList.remove("arriving");
    if (this.story.phase === "waiting") this.showHint();
    this.logEl.style.animation = "none"; void this.logEl.offsetWidth;
    this.logEl.style.animation = "lgIn .9s ease both";
  }

  render(now) {
    const x = this.ctx, vw = this.vw, vh = this.vh, W = this.world.W, H = this.world.H;
    const z = this.zoom, ww = vw / z, wh = vh / z, L = this.light ?? skyAt(this.dayPhase);
    x.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    x.fillStyle = "#A2977C"; x.fillRect(0, 0, vw, vh);
    // What is visible, kept inside the world while the arrival's camera is higher up.
    const vx = clamp(this.cam.x + (vw - ww) / 2, 0, Math.max(0, W - ww));
    const vy = clamp(this.cam.y + this.camOff + (vh - wh) / 2, 0, Math.max(0, H - wh));
    const view = { x: vx, y: vy, w: ww, h: wh };
    this.view = view;
    x.save();
    x.scale(z, z);
    x.translate(-vx, -vy);

    const terrain = this.world.terrain;
    if (terrain) {
      const sw = Math.min(ww, W - vx), sh = Math.min(wh, H - vy);
      if (sw > 0 && sh > 0) x.drawImage(terrain, vx, vy, sw, sh, vx, vy, sw, sh);
    }

    /* classroom light: a warm lift so the world survives fluorescent tubes */
    x.fillStyle = "rgba(255,247,227," + (0.05 + 0.17 * 0.35).toFixed(3) + ")";
    x.fillRect(vx, vy, ww, wh);

    /* everyone else, then the day's light over the world, then your animals over it (herd.js, light.js) */
    this.herd.zoom = z;
    this.herd.draw(x, view, now, "world");
    this.sky.drawWorld(x, view, L, this.mood, now);
    this.herd.draw(x, view, now, "mine");
    x.restore();
    this.sky.drawAir(x, vw, vh, L, this.mood, now, this.mist, this.cam);
    if (this.arrival && this.arrival.dur >= ARRIVAL_MS) this.sky.drawCanopyPass(x, vw, vh, this.arrivalK ?? 0);
    this.placeBloom(now, view);

    const home = this.home;
    const onScreen = home && home.x > vx && home.x < vx + ww && home.y > vy && home.y < vy + wh;
    const want = !!home && !onScreen && this.story.phase !== "choice" && !this.since;
    if (want !== this.homeShown) {
      this.homeShown = want;
      this.homeEl.style.opacity = want ? "1" : "0";
      this.homeEl.style.pointerEvents = want ? "auto" : "none";
    }
  }

  /**
   * A short caption beside the first of your newborns blooming now: its new
   * trait, in the log's own words ("thicker fur"), with a speaker. Only for
   * newborns the log has named, so the map never says more than the log does
   * (nothing about babies born during a fast-forward). A tap on it opens the
   * baby's card (playtest).
   */
  placeBloom(now, view) {
    const named = (id) => this.namedBirths.has(id);
    const b = !this.choice && !this.placing && !this.journal && !this.since && !this.naming && !this.guess && !this.card && !this.arrival && this.endingEl.hidden ? this.herd.bloomNow(now, named) : null;
    if (!b) {
      if (this.bloomId !== null && this.bloomId !== undefined) { this.bloomId = null; this.bloomEl.hidden = true; }
      return;
    }
    if (this.bloomId !== b.id) {
      this.bloomId = b.id;
      this.bloomLine.set(bornLine(this.story.glowFor(b.id).v.group, this.story.name));
      this.bloomEl.hidden = false;
      // Its size and the generation panel's, measured once, to keep it on the screen and off the panel.
      const hud = this.hudEl;
      this.bloomBox = { w: this.bloomEl.offsetWidth, h: this.bloomEl.offsetHeight, hudRight: hud.offsetLeft + hud.offsetWidth, hudBottom: hud.offsetTop + hud.offsetHeight };
    }
    const age = now - this.herd.glowSince.get(b.id);
    const op = age < 500 ? age / 500 : age > 5600 ? Math.max(0, 1 - (age - 5600) / 1000) : 1;
    // Above the newborn, inside the screen; below it when the top edge or the generation panel is in the way.
    const sx = (b.x - view.x) * this.zoom, sy = (b.y - view.y) * this.zoom, box = this.bloomBox, M = 10;
    const left = clamp(sx - box.w / 2, M, Math.max(M, this.vw - box.w - M)), byHud = left < box.hudRight + M;
    let top = sy - 40 - box.h;
    if (top < M || (byHud && top < box.hudBottom + M)) top = Math.max(sy + 18, byHud ? box.hudBottom + M : M);
    top = Math.min(top, this.vh - this.logRoom - box.h); // and clear of the narration
    this.bloomEl.style.opacity = op.toFixed(3);
    this.bloomEl.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`;
  }

  /* ================= input ================= */
  bindInput() {
    const s = this.stage;
    this.ptrs = new Map();
    s.addEventListener("pointerdown", (e) => {
      if (/** @type {HTMLElement} */ (e.target).closest("button, #hud, #card, #choice, #place, #since, #journal, #naming, #guess, #why-here, #average, #guide, #ending, #bloom, #log.link")) return;
      s.setPointerCapture(e.pointerId);
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.ptrs.size === 1) {
        this.dragging = true; this.pinched = false; this.moved = 0; this.startT = performance.now();
        this.camTween = null; this.zoomTween = null; this.visiting = null;
      } else if (this.ptrs.size === 2) this.startPinch();
    });
    s.addEventListener("pointermove", (e) => {
      if (!this.ptrs.has(e.pointerId)) return;
      const prev = this.ptrs.get(e.pointerId);
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch) this.movePinch();
      else if (this.ptrs.size === 1 && this.dragging) {
        const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        this.moved += Math.hypot(dx, dy);
        this.cam.x -= dx / this.zoom; this.cam.y -= dy / this.zoom;
        this.clampCam();
        if (this.moved > 26) { this.hideHint(); this.exploring = true; } // looking around: the camera stays where it is put
      }
    });
    // One finger lifted from a pinch: the other pans on (or the two still down pinch on). A pinch never ends in a tap.
    const end = (e, cancel = false) => {
      if (!this.ptrs.has(e.pointerId)) return;
      const p = this.ptrs.get(e.pointerId);
      this.ptrs.delete(e.pointerId);
      this.pinch = null;
      if (this.ptrs.size >= 2) this.startPinch();
      else if (this.ptrs.size === 1) this.dragging = true;
      if (this.ptrs.size === 0) {
        if (!cancel && this.dragging && !this.pinched && this.moved < 12 && performance.now() - this.startT < 460) this.tapAt(p.x, p.y);
        this.dragging = false; this.pinched = false;
      }
    };
    s.addEventListener("pointerup", (e) => end(e));
    s.addEventListener("pointercancel", (e) => end(e, true));
    // A trackpad pinch (or ctrl and the wheel) zooms the map around the pointer, never the page.
    s.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (/** @type {HTMLElement} */ (e.target).closest("#hud, #card, #choice, #place, #since, #journal, #naming, #guess, #average, #guide, #ending")) return;
      this.zoomAround(this.zoomBase * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
    }, { passive: false });
    // Safari's own pinch would zoom the whole page, panels and all.
    for (const type of ["gesturestart", "gesturechange", "gestureend"]) this.doc.addEventListener(type, (e) => e.preventDefault());
    this.zoomInEl.addEventListener("click", () => this.zoomBy(ZOOM_STEP));
    this.zoomOutEl.addEventListener("click", () => this.zoomBy(1 / ZOOM_STEP));
    // On a phone the generation panel is a slim bar: a tap opens the whole panel, and another closes it.
    this.hudEl.addEventListener("click", () => { if (this.compact.matches) this.setHud(!this.hudEl.classList.contains("open")); });
    this.hudEl.addEventListener("keydown", (e) => {
      if (!this.compact.matches || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
      this.setHud(!this.hudEl.classList.contains("open"));
    });
    // "Back to my family": the camera goes to the family, at the story's zoom, and stays with it again.
    this.homeEl.addEventListener("click", () => {
      this.exploring = false; this.visiting = null;
      this.zoomTo(this.comfortZoom()); this.centerOnGroup(); this.hideHint();
    });
    // A line or a caption that names a baby, and an arrow to a glowing baby off the screen, fly there (playtest).
    this.logEl.addEventListener("click", (e) => {
      if (/** @type {HTMLElement} */ (e.target).closest("button") || this.logLink === null) return;
      this.flyToBaby(this.logLink, true);
    });
    this.bloomEl.addEventListener("click", (e) => {
      if (/** @type {HTMLElement} */ (e.target).closest("button") || this.bloomId === null || this.bloomId === undefined) return;
      this.flyToBaby(this.bloomId, true);
    });
    // Visit another place: the camera flies there, and the narration sums it up on arrival.
    for (const b of this.placesEl.querySelectorAll("button")) b.addEventListener("click", () => this.visitPlace(Number(b.dataset.zone)));
    this.doc.getElementById("card-close").addEventListener("click", () => this.closeCard());
    this.doc.getElementById("since-next").addEventListener("click", () => this.closeSince());
    this.guessNextEl.addEventListener("click", () => this.closeGuess());
    // Naming: typing a name; letters only, as the child types.
    this.namingInputEl.addEventListener("input", () => {
      const clean = this.namingInputEl.value.replace(/[^\p{L}]/gu, "").slice(0, NAME_MAX);
      if (clean !== this.namingInputEl.value) this.namingInputEl.value = clean;
    });
    this.namingInputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); this.submitTyping(); } });
    this.doc.getElementById("naming-ok").addEventListener("click", () => this.submitTyping());
    this.doc.getElementById("naming-back").addEventListener("click", () => this.stopTyping());
    this.portraitEl.addEventListener("click", () => this.openAverage());
    // The ending's steps, the idea, the Field Guide and the story card (scope decision 62).
    this.endingNextEl.addEventListener("click", () => this.setEndingStep(Math.min(3, this.endingStep + 1)));
    this.ideaDoneEl.addEventListener("click", () => this.answerIdea());
    this.ideaOwnEl.addEventListener("input", () => this.ideaChanged());
    this.guideButtonEl.addEventListener("click", () => this.openGuide());
    this.doc.getElementById("guide-open").addEventListener("click", () => this.openGuide());
    this.doc.getElementById("guide-close").addEventListener("click", () => this.closeGuide());
    this.doc.getElementById("card-save").addEventListener("click", () => this.saveCard());
    this.doc.getElementById("average-close").addEventListener("click", () => this.closeAverage());
    this.doc.addEventListener("keydown", (e) => { if (e.key === "Escape") { this.closeCard(); this.closeAverage(); this.closeGuide(); } });
    this.againEl.addEventListener("click", () => this.anotherFamily());
    // Sound starts with the first tap anywhere (iPads allow it only then), and rests while the page is hidden.
    const unlock = () => this.sound.unlock();
    for (const type of ["pointerdown", "touchend", "click", "keydown"]) this.doc.addEventListener(type, unlock, { capture: true, passive: true });
    // A touch wakes the idle sound (scope decision 70).
    const touched = () => { this.lastTouch = performance.now(); if (this.idleShown) { this.idleShown = false; this.sound.setIdle(false); } };
    for (const type of ["pointerdown", "keydown", "wheel"]) this.doc.addEventListener(type, touched, { capture: true, passive: true });
    this.muteEl.addEventListener("click", () => this.toggleSound());
    this.doc.addEventListener("visibilitychange", () => this.sound.setHidden(this.doc.hidden));
    this.newWorldEl.addEventListener("click", () => this.newWorld());
    this.nearlyNewEl.addEventListener("click", () => this.newWorld(this.nearlyNewEl));
    this.nearlyKeepEl.addEventListener("click", () => this.anotherFamily(true, this.nearlyKeepEl));
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
  /** Two fingers down: the spot between them stays under them while they pinch. */
  startPinch() {
    const [a, b] = [...this.ptrs.values()];
    this.pinched = true;
    this.dragging = false;
    this.framed = false; // the child chose a zoom, which the story keeps
    // During the arrival a pinch lets the mist go, as a tap on the ground does.
    const arr = this.arrival;
    if (arr && arr.t0 !== null) arr.t0 = Math.min(arr.t0, performance.now() - arr.dur * 0.88);
    this.pinch = { d: Math.hypot(b.x - a.x, b.y - a.y) || 1, z: this.zoomBase, at: this.worldAt((a.x + b.x) / 2, (a.y + b.y) / 2) };
    this.hideHint();
  }
  movePinch() {
    const [a, b] = [...this.ptrs.values()], p = this.pinch;
    const z = clamp(p.z * (Math.hypot(b.x - a.x, b.y - a.y) || 1) / p.d, this.zoomMin(), ZOOM_MAX);
    this.keepAt(p.at, (a.x + b.x) / 2, (a.y + b.y) / 2, z);
  }
  /** Zoom to `z` keeping the world point under (px, py) (client coordinates) where it is. */
  zoomAround(z, px, py) {
    this.framed = false;
    this.camTween = null; this.zoomTween = null;
    this.keepAt(this.worldAt(px, py), px, py, clamp(z, this.zoomMin(), ZOOM_MAX));
    this.hideHint();
  }
  /** At zoom z, the camera that puts world point `w` under (px, py) (client coordinates). */
  keepAt(w, px, py, z) {
    const rect = this.stage.getBoundingClientRect();
    this.zoomBase = z;
    this.zoom = z * this.zoomK;
    Object.assign(this.cam, this.camAt(w.x, w.y, px - rect.left, py - rect.top, z));
  }

  /** The slim bar or the whole generation panel, on a phone; on an iPad the panel is always whole. */
  setHud(open) {
    const el = this.hudEl, compact = this.compact.matches;
    el.classList.toggle("open", open);
    this.placeWhyHere();
    if (compact) {
      el.setAttribute("role", "button");
      el.tabIndex = 0;
      el.setAttribute("aria-expanded", String(open));
    } else {
      el.removeAttribute("role");
      el.removeAttribute("tabindex");
      el.removeAttribute("aria-expanded");
    }
  }

  tapAt(px, py) {
    // What is under the finger, in the view on screen (wider while the arrival's camera is higher up).
    const w = this.worldAt(px, py);
    const a = this.herd.hit(w.x, w.y, this.zoom);
    // A tap during the arrival lets the mist go at once. A tap on an animal still follows its family, as before.
    if (this.arrival) {
      if (!a) {
        if (this.arrival.t0 !== null) this.arrival.t0 = Math.min(this.arrival.t0, performance.now() - this.arrival.dur * 0.88);
        return;
      }
      this.endArrival();
    }
    if (!a) { this.closeCard(); return; }
    // Before the story starts, a tap chooses the family to follow, if it has a future (scope decision 59).
    // After that, a tap opens the animal's card.
    if (this.story.phase !== "waiting") this.showCard(a.id);
    else this.tapFamily(a);
  }

  /** Before the story starts: follow this animal's family, or, when it has no future, say so (scope decision 59). */
  tapFamily(a) {
    if (this.hasFuture(a.id)) { this.begin(a); return; }
    this.hideHint();
    this.say([IN_TROUBLE]);
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
 * @typedef {Object} GuessState
 * @property {import("./why.js").Guess} question
 * @property {number} left ms left to guess, or to read why
 * @property {number} paused ms stood still for read-aloud
 * @property {boolean} answered a guess was tapped, or time ran out: why is on screen
 * @property {null|{text:string, right:boolean}} [option] the guess
 *
 * @typedef {Object} NamingState
 * @property {string[]} names the three names offered
 * @property {number} left ms left to pick one
 * @property {number} paused ms stood still for read-aloud
 * @property {null|string} picked the name picked, once there is one
 * @property {number} goAt when the sheet closes after a pick
 *
 * @typedef {Object} CardState
 * @property {number} id the animal on the card
 * @property {boolean} gone it has passed away since the card opened
 * @property {ArrayLike<number>} genome its body genome
 * @property {number} zone its habitat (engine zone index)
 * @property {string[]} glow the trait that is new in it, if any
 * @property {string} size the drawing's box when it was last drawn, "WxH"
 */

/** The teacher demo's fixture (?demo=webbed), fetched once; null otherwise, or if it can't be read. */
let fixture = null;

async function loadFixture() {
  try {
    const res = await fetch(FIXTURE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fixture = await res.json();
  } catch (err) {
    console.warn("[lineage] defining fixture unavailable; using the common-ancestor world", err);
  }
}

/**
 * The common-ancestor world for a seed (scope decision 56): every founder on
 * the open ground with one body. With ?demo=webbed, the old defining world
 * instead: the webbed family in the high leaves.
 */
const makeWorld = (seed) => (fixture ? Bridge.fromFixture(fixture, seed) : Bridge.fromAncestor(seed));

// ---- bootstrap ----
if (typeof document !== "undefined") {
  const q = new URLSearchParams(location.search);
  const asked = Number.parseInt(q.get("seed") ?? "", 10);
  (q.get("demo") === "webbed" ? loadFixture() : Promise.resolve()).then(() => {
    let seed = Number.isFinite(asked) && asked > 0 ? asked : DEFAULT_SEED;
    // The story's length: 50 generations, or the teacher's full-length story, ?length=76 (scope decision 64).
    const length = storyLength(q.get("length"));
    // Only curated worlds: a seed that loses a habitat before the story's end is swapped for one that doesn't.
    if (!isGoodSeed(makeWorld, seed, length)) {
      const good = goodSeed(makeWorld, seed, Math.random, length) ?? seed;
      console.info(`[lineage] seed ${seed} loses a habitat by generation ${length}; showing seed ${good} instead`);
      seed = good;
      q.set("seed", String(seed));
      history.replaceState(null, "", `?${q}`);
    }
    globalThis.lineageGame = new Game(document, makeWorld(seed), { seed, makeWorld, demo: !!fixture, length }); // for poking at the live engine from the console
    // Design shortcuts (design/current/README.md): ?moment=ending jumps to that moment in a real game state.
    const moment = q.get("moment");
    if (moment) import("./moments.js").then((m) => m.goToMoment(globalThis.lineageGame, moment));
  });
}
