/**
 * Sound (Step 5, part two), made in the browser with Web Audio: no sound
 * files, no network. A soft bed for the habitat the camera is over, crossfading
 * as it moves: leaves rustling and now and then a bird in the high leaves, a
 * breezy hum on the open ground, gentle waves at the water's edge. And a few
 * small cues: a chime when a newborn glows, a rising note for each count of a
 * spread, a low tone for "Wait!", a falling tone for "It disappeared", a warm
 * chord for the reveal.
 *
 * Everything is quiet: the beds sit far below the cues, nothing starts
 * suddenly, and a compressor keeps the whole mix under a gentle ceiling.
 * Sound starts on the first tap (iPads allow it only then). Visual only in the
 * sense that matters here: it reads the game, and never changes it.
 */

/** How loud the whole mix is (0..1) before the compressor. */
const MASTER = 0.8;
/** Each habitat's bed at full weight. */
const BED = { leaves: 0.07, ground: 0.06, water: 0.09 };
/** How quickly the beds crossfade as the camera moves, in seconds (time constant). */
const CROSSFADE = 0.9;

/** The major pentatonic from C5: the spread's counts climb it. */
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

/** Connects audio nodes one after another (older Safari's connect() returns nothing to chain on). */
function link(...nodes) {
  for (let i = 1; i < nodes.length; i++) nodes[i - 1].connect(nodes[i]);
}

/** How much of each habitat is under a point of the map, from its zone value (world.js zoneT). */
export function habitatWeights(t) {
  const smooth = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
  const leaves = 1 - smooth(0.34, 0.5, t), water = smooth(0.72, 0.88, t);
  return [leaves, Math.max(0, 1 - leaves - water), water];
}

/**
 * The whole sound graph on one audio context (an OfflineAudioContext too, for
 * measuring how loud it is).
 */
export class SoundGraph {
  /** @param {BaseAudioContext} ctx */
  constructor(ctx, random = Math.random) {
    this.ctx = ctx;
    this.random = random;
    const out = ctx.createDynamicsCompressor();
    out.threshold.value = -24; out.knee.value = 18; out.ratio.value = 4; out.attack.value = 0.02; out.release.value = 0.4;
    out.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = MASTER;
    this.master.connect(out);
    this.noise = this.makeNoise(2.5);
    this.beds = { leaves: this.leavesBed(), ground: this.groundBed(), water: this.waterBed() };
    this.birdAt = ctx.currentTime + 2 + 4 * random();
    this.waveAt = ctx.currentTime + 0.5;
  }

  /** A few seconds of soft noise, made once and looped by every bed. */
  makeNoise(seconds) {
    const ctx = this.ctx, n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    // Pinkish noise (Paul Kellet's filter): softer than white.
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < n; i++) {
      const w = this.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    return buf;
  }

  /** A looping noise source, started a random way into the loop. */
  noiseSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise; src.loop = true;
    src.start(0, this.random() * this.noise.duration);
    return src;
  }

  /** A slow wobble added to an audio parameter. */
  lfo(param, rate, depth) {
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.frequency.value = rate; g.gain.value = depth;
    link(osc, g, param);
    osc.start();
  }

  /** A bed's own level, which the crossfade moves. */
  bedOut(level = 0) {
    const g = this.ctx.createGain();
    g.gain.value = level;
    g.connect(this.master);
    return g;
  }

  /** The high leaves: leaves rustling in slow gusts. Birds are added now and then (update). */
  leavesBed() {
    const ctx = this.ctx, out = this.bedOut(), rustle = ctx.createGain();
    rustle.gain.value = 0.55;
    const hi = ctx.createBiquadFilter(); hi.type = "bandpass"; hi.frequency.value = 3400; hi.Q.value = 0.7;
    const lo = ctx.createBiquadFilter(); lo.type = "lowpass"; lo.frequency.value = 6500;
    link(this.noiseSource(), hi, lo, rustle, out);
    this.lfo(rustle.gain, 0.19, 0.25);
    this.lfo(rustle.gain, 0.07, 0.18);
    const birds = ctx.createGain(); birds.gain.value = 1; birds.connect(out);
    return { out, birds };
  }

  /** The open ground: a breeze that rises and falls, over a low, soft hum. */
  groundBed() {
    const ctx = this.ctx, out = this.bedOut(), wind = ctx.createGain();
    wind.gain.value = 0.7;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = 0.9;
    link(this.noiseSource(), lp, wind, out);
    this.lfo(wind.gain, 0.06, 0.35);
    this.lfo(lp.frequency, 0.045, 220);
    const hum = ctx.createGain(); hum.gain.value = 0.05;
    const hlp = ctx.createBiquadFilter(); hlp.type = "lowpass"; hlp.frequency.value = 300;
    for (const f of [98, 147.3]) { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(hlp); o.start(); }
    link(hlp, hum, out);
    this.lfo(hum.gain, 0.09, 0.02);
    return { out };
  }

  /** The water's edge: waves that swell and fall back, with a little foam at their top. */
  waterBed() {
    const ctx = this.ctx, out = this.bedOut(), swell = ctx.createGain(), foam = ctx.createGain();
    swell.gain.value = 0.25; foam.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 850; lp.Q.value = 0.5;
    link(this.noiseSource(), lp, swell, out);
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2400;
    link(this.noiseSource(), hp, foam, out);
    return { out, swell, foam };
  }

  /**
   * The beds follow the habitats under the camera, and the birds and waves are
   * scheduled a little ahead. Cheap enough to call a few times a second.
   * @param {number[]} weights [high leaves, open ground, water's edge], summing to 1
   */
  update(weights) {
    const ctx = this.ctx, t = ctx.currentTime;
    const [leaves, ground, water] = weights;
    this.beds.leaves.out.gain.setTargetAtTime(BED.leaves * leaves, t, CROSSFADE);
    this.beds.ground.out.gain.setTargetAtTime(BED.ground * ground, t, CROSSFADE);
    this.beds.water.out.gain.setTargetAtTime(BED.water * water, t, CROSSFADE);
    if (t >= this.birdAt) {
      if (leaves > 0.2) this.bird(t + 0.05);
      this.birdAt = t + 3.5 + 6 * this.random();
    }
    if (t >= this.waveAt) {
      const w = this.beds.water, rise = 2.2 + this.random(), fall = 3.2 + 1.5 * this.random(), peak = 0.75 + 0.25 * this.random();
      w.swell.gain.setTargetAtTime(peak, t, rise / 3);
      w.swell.gain.setTargetAtTime(0.22, t + rise, fall / 3);
      w.foam.gain.setTargetAtTime(0.12 * peak, t + rise * 0.7, 0.35);
      w.foam.gain.setTargetAtTime(0, t + rise + 0.4, 0.6);
      this.waveAt = t + rise + fall;
    }
  }

  /** A small bird: two to four quick, soft chirps. */
  bird(at) {
    const ctx = this.ctx, n = 2 + Math.floor(this.random() * 3), base = 2300 + 900 * this.random();
    for (let i = 0; i < n; i++) {
      const t = at + i * (0.13 + 0.05 * this.random()), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(base, t);
      o.frequency.exponentialRampToValueAtTime(base * 1.35, t + 0.05);
      o.frequency.exponentialRampToValueAtTime(base * 1.05, t + 0.1);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.11);
      link(o, g, this.beds.leaves.birds);
      o.start(t); o.stop(t + 0.13);
    }
  }

  /**
   * One soft note: a quick fade in, a slow fade out, optionally gliding.
   * @param {{freq:number, to?:number, glide?:number, type?:OscillatorType, gain?:number, attack?:number, hold?:number, release?:number, at?:number, lowpass?:number}} o
   */
  note({ freq, to = freq, glide = 0.2, type = "sine", gain = 0.05, attack = 0.02, hold = 0, release = 0.8, at = 0, lowpass = 4000 }) {
    const ctx = this.ctx, t = Math.max(ctx.currentTime, at || ctx.currentTime) + 0.01;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to !== freq) o.frequency.exponentialRampToValueAtTime(to, t + glide);
    f.type = "lowpass"; f.frequency.value = lowpass;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    link(o, f, g, this.master);
    o.start(t); o.stop(t + attack + hold + release + 0.05);
  }

  /** A newborn glows: a soft, high chime. */
  chime() {
    this.note({ freq: 1318.5, gain: 0.05, attack: 0.008, release: 1.6, lowpass: 6000 });
    this.note({ freq: 1975.5, gain: 0.03, attack: 0.008, release: 1.2, lowpass: 6000 });
    this.note({ freq: 2637, gain: 0.012, attack: 0.008, release: 0.8, lowpass: 7000 });
  }

  /** A count of the spread's counter: a short note that glides up, higher the more have the trait. */
  spreadNote(count, max = 20) {
    const f = PENTATONIC[Math.max(0, Math.min(PENTATONIC.length - 1, Math.round((count / max) * (PENTATONIC.length - 1))))];
    this.note({ freq: f, to: f * 1.06, glide: 0.18, type: "triangle", gain: 0.05, attack: 0.012, release: 0.55, lowpass: 3000 });
  }

  /** "Wait!": two low, gentle notes. */
  waitTone() {
    this.note({ freq: 220, type: "sine", gain: 0.07, attack: 0.18, hold: 0.25, release: 1.1, lowpass: 900 });
    this.note({ freq: 196, type: "sine", gain: 0.06, attack: 0.18, hold: 0.3, release: 1.3, lowpass: 900, at: this.ctx.currentTime + 0.45 });
  }

  /** "It disappeared": a soft tone that falls away. */
  goneTone() {
    this.note({ freq: 659.3, to: 392, glide: 0.9, type: "sine", gain: 0.05, attack: 0.05, hold: 0.2, release: 1.1, lowpass: 2000 });
  }

  /** The reveal: a warm chord that swells in and fades slowly. */
  revealChord(delay = 0) {
    const at = this.ctx.currentTime + delay;
    for (const [f, g] of [[174.61, 0.025], [220, 0.021], [261.63, 0.021], [349.23, 0.017], [440, 0.008]]) {
      for (const d of [-4, 4]) {
        this.note({ freq: f * 2 ** (d / 1200), type: "triangle", gain: g, attack: 0.7, hold: 1.2, release: 2.8, lowpass: 1400, at });
      }
    }
  }
}

/**
 * The game's sound: off until the first tap, and when muted. Muting is
 * remembered on this device; `?sound=off` starts muted without changing that.
 */
export class Sound {
  /** @param {{muted:boolean}} opts */
  constructor({ muted }) {
    this.muted = muted;
    /** @type {null|SoundGraph} */
    this.graph = null;
    this.ctx = null;
  }

  /** On a tap: the first one starts the sound (unless muted). */
  unlock() {
    if (this.muted) return;
    if (!this.ctx) {
      const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.graph = new SoundGraph(this.ctx);
      } catch (err) {
        console.warn("[lineage] no sound", err);
        this.ctx = null; this.graph = null;
        return;
      }
    }
    if (this.ctx.state !== "running") this.ctx.resume().catch(() => {});
  }

  /** Sound on or off, softly. */
  setMuted(muted) {
    this.muted = muted;
    if (muted) {
      if (!this.ctx) return;
      this.graph.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      setTimeout(() => { if (this.muted && this.ctx) this.ctx.suspend().catch(() => {}); }, 400);
    } else {
      this.unlock();
      if (this.graph) this.graph.master.gain.setTargetAtTime(MASTER, this.ctx.currentTime, 0.2);
    }
  }

  /** When the page is hidden (another app, a locked iPad), the sound rests. */
  setHidden(hidden) {
    if (!this.ctx || this.muted) return;
    if (hidden) this.ctx.suspend().catch(() => {}); else this.ctx.resume().catch(() => {});
  }

  get on() { return !this.muted && !!this.graph && this.ctx.state === "running"; }

  update(weights) { if (this.on) this.graph.update(weights); }
  chime() { if (this.on) this.graph.chime(); }
  spreadNote(count) { if (this.on) this.graph.spreadNote(count); }
  waitTone() { if (this.on) this.graph.waitTone(); }
  goneTone() { if (this.on) this.graph.goneTone(); }
  revealChord(delay) { if (this.on) this.graph.revealChord(delay); }
}

/** The mute button's two faces: a speaker with waves, and with a cross. */
export const SOUND_ON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>' +
  '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
export const SOUND_OFF_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>' +
  '<path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
