/**
 * The opening (scope decisions 77 and 93): "How many can you discover?" After
 * the arrival mist and before the first tap, the collection's twelve cards
 * appear face down; "These are the animals you can become."; the cards flip
 * one after another, about half a second apart, each showing its animal, name
 * and place mark, with a quiet card sound; then "How many can you discover?",
 * and they wait, every animal showing, the ones already found on this iPad
 * marked "Found". A tap on a card shows it big, its name read aloud (main.js).
 * Nothing goes until the child taps "Let's go!": then the cards puff away, and
 * the game starts with "Tap an animal to follow its family." On later stories
 * in a session the flip is quicker, and it still waits. A tap beside the cards
 * while they flip turns the rest at once. From the collection's button the
 * quick flip plays, the ones not found settle as mystery cards, and the cards
 * stay.
 *
 * The timeline is plain numbers (seconds), and `seek` shows any moment of it
 * at once, for the moments and their pictures. DOM only through `doc`.
 */

import { GRID, cardEl, collection } from "./collection.js";

/** The opening's two lines, each with a speaker, read aloud when the iPad lets sound play. */
export const OPENING_LINES = ["These are the animals you can become.", "How many can you discover?"];
/** The one way on from the opening (scope decision 93). */
export const LETS_GO = "Let's go!";
/** On a card in the opening, an animal this iPad has evolved already. */
export const FOUND_MARK = "Found";
/** How long the puff takes, from "Let's go!" to the game. */
export const PUFF_S = 0.6;

/**
 * When everything happens, in seconds from the start: each card's flip (about half a second apart, scope decision 93),
 * the two lines, and when the cards are all up and wait for "Let's go!". Quick (later stories in a session): quicker
 * flips and only the second line. From the collection's button (`stay`): the mystery cards settle once all are up.
 * @param {boolean} quick @param {boolean} [stay]
 */
export function timeline(quick, stay = false) {
  const first = quick ? 0.15 : 0.4, gap = quick ? 0.12 : 0.5, flip = quick ? 0.4 : 0.55;
  const flips = GRID.map((_, i) => first + i * gap);
  const up = flips[flips.length - 1] + flip;
  return { flip, flips, line1: quick ? null : 0, line2: quick ? 0 : up, ready: up, settle: stay ? up + 0.15 : null };
}

export class Opening {
  /**
   * @param {Document} doc
   * @param {HTMLElement} grid where the cards go (emptied)
   * @param {{quick?: boolean, stay?: boolean, onLine?: (i:number) => void, onFlip?: () => void, onReady?: () => void,
   *   onPuff?: () => void, onDone?: () => void}} [opts] stay: from the collection's button, the cards stay and no
   *   "Let's go!"; onReady: every card is up and waits for "Let's go!"
   */
  constructor(doc, grid, { quick = false, stay = false, onLine = () => {}, onFlip = () => {}, onReady = () => {}, onPuff = () => {}, onDone = () => {} } = {}) {
    Object.assign(this, { doc, grid, quick, stay, onLine, onFlip, onReady, onPuff, onDone });
    this.plan = timeline(quick, stay);
    const found = collection();
    this.cards = GRID.map((a) => {
      const c = cardEl(doc, a, { found: found.has(a.id), reveal: !found.has(a.id) });
      if (!stay && found.has(a.id)) c.querySelector(".front")?.append(Object.assign(doc.createElement("span"), { className: "ribbon got", textContent: FOUND_MARK }));
      return c;
    });
    this.cards.forEach((c, i) => {
      c.classList.add("down");
      c.style.setProperty("--flip", `${this.plan.flip}s`);
      c.style.setProperty("--i", String(i));
    });
    grid.replaceChildren(...this.cards);
    grid.classList.remove("puffing", "instant");
    /** seconds into the timeline already shown */
    this.t = -1;
    this.raf = 0;
    /** every card is up, waiting for "Let's go!" */
    this.ready = false;
    /** "Let's go!" was tapped: the cards are puffing away */
    this.going = false;
    this.done = false;
  }

  /** Play it from the start, in real time, up to the cards waiting. */
  start() {
    const t0 = performance.now();
    const tick = (now) => {
      if (this.done) return;
      this.show((now - t0) / 1000);
      if (!this.done && !this.ready) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    return this;
  }

  /** Everything due by `t` happens now (each event once, in order). It stops there: the cards wait for the child. */
  show(t) {
    const p = this.plan, was = this.t;
    const due = (at) => at !== null && at <= t && at > was;
    if (due(p.line1)) this.onLine(0);
    p.flips.forEach((at, i) => { if (due(at)) { this.cards[i].classList.remove("down"); this.onFlip(); } });
    if (due(p.line2)) this.onLine(1);
    if (due(p.settle)) for (const c of this.cards) c.classList.remove("showing");
    this.t = Math.max(this.t, t);
    // Up and waiting for "Let's go!"; from the collection's button, settled, and the cards stay.
    if (!this.ready && t >= (p.settle ?? p.ready)) {
      this.ready = true;
      if (this.stay) this.finish();
      else this.onReady();
    }
  }

  /** A tap beside the cards while they flip: every card up at once, and they wait (or, from the collection, settle). */
  skip() {
    if (this.done || this.ready) return;
    this.grid.classList.add("instant");
    this.show(Math.max(this.plan.ready, this.plan.settle ?? 0));
  }

  /** "Let's go!": the cards puff away, then the game starts (scope decision 93). */
  go() {
    if (this.done || this.going || this.stay) return;
    if (!this.ready) this.skip();
    this.going = true;
    this.grid.classList.remove("instant");
    this.grid.classList.add("puffing");
    this.onPuff();
    this.puffT = setTimeout(() => this.finish(), PUFF_S * 1000);
  }

  /**
   * The moments: the opening `t` seconds in, held still (no transitions), for a picture; with `puff`, that many
   * seconds after "Let's go!".
   * @param {number} t @param {number} [puff]
   */
  seek(t, puff) {
    this.stop();
    this.grid.classList.add("instant");
    this.show(puff === undefined ? t : Math.max(t, this.plan.ready));
    if (puff !== undefined) {
      this.grid.style.setProperty("--seek", String(puff));
      this.grid.classList.add("puffing");
      this.going = true;
    }
    this.hold = true;
    this.done = true;
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.stop();
    this.onDone();
  }

  /** No more frames asked for. */
  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    clearTimeout(this.puffT);
  }
}
