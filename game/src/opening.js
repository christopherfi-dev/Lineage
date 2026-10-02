/**
 * The opening (scope decision 77): "How many can you discover?" After the
 * arrival mist and before the first tap, the collection's twelve cards appear
 * face down; "These are the animals you can become." then "How many can you
 * discover?"; the cards flip one after another, quickly, each showing its
 * animal, name and place mark, with a quiet card sound. Cards already found
 * on this iPad stay showing; the rest settle as mystery cards, so the child
 * sees what is left to find. Then the cards puff away, and the game starts
 * with "Tap an animal to follow its family." About 5 s the first time in a
 * session, about 2 s after; a tap skips to the end. From the collection's
 * button the same flip plays, and the cards stay.
 *
 * The timeline is plain numbers (seconds), and `seek` shows any moment of it
 * at once, for the moments and their pictures. DOM only through `doc`.
 */

import { GRID, cardEl, collection } from "./collection.js";

/** The opening's two lines, each with a speaker, read aloud when the iPad lets sound play. */
export const OPENING_LINES = ["These are the animals you can become.", "How many can you discover?"];

/**
 * When everything happens, in seconds from the start: each card's flip, the two lines, the mystery cards settling,
 * the puff (null when the cards stay), and the end. Quick (later stories in a session): only the second line.
 * @param {boolean} quick @param {boolean} [puff]
 */
export function timeline(quick, puff = true) {
  const first = quick ? 0.15 : 0.6, gap = quick ? 0.04 : 0.12, flip = quick ? 0.4 : 0.55;
  const flips = GRID.map((_, i) => first + i * gap);
  const up = flips[flips.length - 1] + flip;
  const settle = up + (quick ? 0.15 : 1);
  const puffAt = puff ? settle + (quick ? 0.3 : 1) : null;
  return { flip, flips, line1: quick ? null : 0, line2: quick ? 0 : up, settle, puffAt, end: puffAt === null ? settle + 0.5 : puffAt + 0.6 };
}

export class Opening {
  /**
   * @param {Document} doc
   * @param {HTMLElement} grid where the cards go (emptied)
   * @param {{quick?: boolean, puff?: boolean, onLine?: (i:number) => void, onFlip?: () => void, onPuff?: () => void, onDone?: () => void}} [opts]
   */
  constructor(doc, grid, { quick = false, puff = true, onLine = () => {}, onFlip = () => {}, onPuff = () => {}, onDone = () => {} } = {}) {
    Object.assign(this, { doc, grid, quick, puff, onLine, onFlip, onPuff, onDone });
    this.plan = timeline(quick, puff);
    const found = collection();
    this.cards = GRID.map((a) => cardEl(doc, a, { found: found.has(a.id), reveal: !found.has(a.id) }));
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
    this.done = false;
  }

  /** Play it from the start, in real time. */
  start() {
    const t0 = performance.now();
    const tick = (now) => {
      if (this.done) return;
      this.show((now - t0) / 1000);
      if (!this.done) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    return this;
  }

  /** Everything due by `t` happens now (each event once, in order). */
  show(t) {
    const p = this.plan, was = this.t;
    const due = (at) => at !== null && at <= t && at > was;
    if (due(p.line1)) this.onLine(0);
    p.flips.forEach((at, i) => { if (due(at)) { this.cards[i].classList.remove("down"); this.onFlip(); } });
    if (due(p.line2)) this.onLine(1);
    if (due(p.settle)) for (const c of this.cards) c.classList.remove("showing");
    if (due(p.puffAt)) { this.grid.classList.add("puffing"); this.onPuff(); }
    this.t = t;
    if (t >= p.end) this.finish();
  }

  /** A tap: straight to the end (the cards gone, or settled when they stay). */
  skip() {
    if (this.done) return;
    this.grid.classList.add("instant");
    this.show(this.plan.end);
  }

  /** The moments: the opening `t` seconds in, held still (no transitions), for a picture. */
  seek(t) {
    this.stop();
    this.grid.classList.add("instant");
    this.grid.style.setProperty("--seek", String(Math.max(0, t - (this.plan.puffAt ?? t))));
    this.show(t);
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
  }
}
