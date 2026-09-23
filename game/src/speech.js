/**
 * Read-aloud: every child-facing line has a small speaker button that reads
 * it with the browser's own speech (speechSynthesis), in a calm voice at a
 * slightly slow rate. Nothing leaves the device.
 */

/** Slightly slower than normal speech (1). */
export const RATE = 0.85;

/** Calm, clear voices on the class iPads and common browsers, in order of preference. */
const CALM = [/^samantha/i, /^karen/i, /^moira/i, /^tessa/i, /^serena/i, /^daniel/i, /google uk english female/i, /google us english/i];

const SPEAKER_SVG =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
  '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>' +
  '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  "</svg>";

const synth = () => globalThis.speechSynthesis ?? null;

function calmVoice() {
  const voices = synth()?.getVoices() ?? [];
  const english = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
  for (const re of CALM) {
    const v = english.find((x) => re.test(x.name));
    if (v) return v;
  }
  return english.find((v) => v.default) ?? english[0] ?? null;
}

/** What the voice should say for a line as shown: "20 → 31" is read "from 20 to 31". */
export function spoken(text) {
  return text.replace(/(\d+)\s*→\s*(\d+)/g, "from $1 to $2").replace(/\s*·\s*/g, ", ").replace(/\s+/g, " ").trim();
}

/** True while the browser is reading (or about to read) a line aloud. */
export function isSpeaking() {
  const s = synth();
  return !!s && (s.speaking || s.pending);
}

let playing = null;

/** Read a line aloud, stopping whatever was being read. */
export function speak(text, button = null) {
  const s = synth();
  if (!s || !text) return;
  s.cancel();
  playing?.classList.remove("speaking");
  const u = new SpeechSynthesisUtterance(spoken(text));
  u.rate = RATE;
  u.pitch = 1;
  const voice = calmVoice();
  if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-US";
  playing = button;
  button?.classList.add("speaking");
  u.onend = u.onerror = () => { if (playing === button) { button?.classList.remove("speaking"); playing = null; } };
  s.speak(u);
}

/**
 * A small speaker button that reads `read()` aloud when tapped.
 * @param {Document} doc
 * @param {() => string} read the text to read, worked out at the moment of the tap
 */
export function speakerButton(doc, read) {
  const b = doc.createElement("button");
  b.type = "button";
  b.className = "say";
  b.setAttribute("aria-label", "Read aloud");
  b.innerHTML = SPEAKER_SVG;
  b.addEventListener("click", (e) => { e.stopPropagation(); speak(read(), b); });
  return b;
}

/** The text of an element without its speaker buttons. */
export function textOf(el) {
  const copy = /** @type {HTMLElement} */ (el.cloneNode(true));
  for (const b of copy.querySelectorAll(".say")) b.remove();
  return copy.textContent ?? "";
}
