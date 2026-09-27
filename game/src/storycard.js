/**
 * The story card (scope decision 62): one picture of a child's story, made in
 * the page, to save or share from the iPad's own share sheet, or to download.
 * The family's name, its family tree strip (drawn from real bodies), the
 * traits the child chose, the result, the real-animal reveal and the child's
 * idea. Nothing is uploaded: no network call is made.
 */

import { paintCreature } from "./creature.js";

const W = 1200, H = 1500, M = 70;
/** An in-between ancestor on the strip, against a full tile. */
const SMALL = 0.6;
const INK = "#2A2B22", SOFT = "#6E6750", TEAL = "#14657F";

/** Lines of `text` that fit `width` in the canvas's current font. */
function wrap(x, text, width) {
  const words = String(text).split(/\s+/), lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && x.measureText(next).width > width) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Write wrapped text from (left, top); returns where the next text can start. */
function write(x, text, left, top, width, font, color, lineHeight) {
  x.font = font; x.fillStyle = color; x.textBaseline = "top";
  let y = top;
  for (const line of wrap(x, text, width)) { x.fillText(line, left, y); y += lineHeight; }
  return y;
}

/**
 * Draw the card.
 * @param {Document} doc
 * @param {{name:null|string, noun?:"family"|"line", title:string, tree:{line:boolean, nodes:import("./story.js").TreeAnimal[]}, chips:Array<{words:string, faded:boolean}>,
 *   reveal:null|string, idea:null|string, died:boolean}} d
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function storyCard(doc, d) {
  try { await doc.fonts?.ready; } catch { /* the fallback fonts will do */ }
  const cv = doc.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = /** @type {CanvasRenderingContext2D} */ (cv.getContext("2d"));
  // Paper, warm light, and a thin frame, like the ending's plate.
  x.fillStyle = d.died ? "#EFECE3" : "#F4EAD3"; x.fillRect(0, 0, W, H);
  const light = x.createRadialGradient(W * 0.4, H * 0.28, 0, W * 0.5, H * 0.45, W * 1.05);
  light.addColorStop(0, "rgba(255,248,226,0.85)"); light.addColorStop(1, "rgba(196,168,120,0.4)");
  x.fillStyle = light; x.fillRect(0, 0, W, H);
  x.strokeStyle = "#D9C9A4"; x.lineWidth = 4; x.strokeRect(28, 28, W - 56, H - 56);
  x.strokeStyle = "#E8DCC0"; x.lineWidth = 2; x.strokeRect(40, 40, W - 80, H - 80);

  let y = M + 10;
  y = write(x, "LINEAGE · A STORY FROM THE SIMULATION", M, y, W - 2 * M, "700 22px Karla, system-ui, sans-serif", "#9A8E70", 30) + 12;
  y = write(x, d.name ? `The ${d.name} ${d.noun ?? "family"}` : `My ${d.noun ?? "family"}`, M, y, W - 2 * M, "600 76px Petrona, Georgia, serif", INK, 84) + 6;
  y = write(x, d.title, M, y, W - 2 * M, "500 36px Petrona, Georgia, serif", SOFT, 46) + 34;

  // The family tree strip, each animal drawn from its real body; the ancestors in between smaller (scope decision 66).
  // Too many to fit: only the first one and the followed babies, "…" between them where an ancestor was left out.
  const gap = 26, room = W - 2 * M, weight = (list) => list.reduce((n, a) => n + (a.kind === "between" ? SMALL : 1), 0);
  let who = d.tree.nodes;
  if ((room - (who.length - 1) * gap) / Math.max(1, weight(who)) < 120) {
    who = who.flatMap((a, i) => (a.kind === "between" ? [] : [{ ...a, joined: a.joined && d.tree.nodes[i - 1]?.kind !== "between" }]));
  }
  const pw = Math.min(200, (room - (who.length - 1) * gap) / Math.max(1, weight(who))), ph = pw * 0.72;
  let px = M;
  who.forEach((a, i) => {
    const small = a.kind === "between", w = small ? pw * SMALL : pw, h = small ? ph * SMALL : ph, top = y + ph - h, c = doc.createElement("canvas");
    if (i) { x.fillStyle = "#B7AA8A"; x.font = "600 30px Karla, system-ui, sans-serif"; x.textBaseline = "middle"; x.textAlign = "center"; x.fillText(a.joined ? "→" : "…", px - gap / 2, y + ph / 2); x.textAlign = "left"; }
    paintCreature(c, a.genome, { seed: a.id, habitat: a.zone });
    x.save();
    x.beginPath(); x.roundRect?.(px, top, w, h, 18); if (!x.roundRect) x.rect(px, top, w, h); x.clip();
    x.drawImage(c, px, top, w, h);
    x.restore();
    x.strokeStyle = a.kind === "baby" ? TEAL : a.kind === "first" ? "#D9892B" : "#E3D6B8"; x.lineWidth = small ? 3 : 5;
    x.beginPath(); x.roundRect?.(px, top, w, h, 18); if (!x.roundRect) x.rect(px, top, w, h); x.stroke();
    x.textAlign = "center";
    write(x, a.label, px + w / 2, y + ph + 12, w + 20, small ? "600 18px Karla, system-ui, sans-serif" : "700 22px Karla, system-ui, sans-serif", SOFT, small ? 22 : 26);
    x.textAlign = "left";
    px += w + gap;
  });
  y += ph + 80;

  // The traits the child chose.
  if (d.chips.length) {
    x.font = "700 22px Karla, system-ui, sans-serif"; x.fillStyle = "#9A8E70"; x.textBaseline = "top";
    x.fillText("YOU CHOSE", M, y); y += 36;
    let cx = M;
    x.font = "700 26px Karla, system-ui, sans-serif";
    for (const c of d.chips) {
      const w = x.measureText(c.words).width + 36;
      if (cx + w > W - M) { cx = M; y += 54; }
      x.fillStyle = c.faded ? "#E4DCCB" : TEAL;
      x.beginPath(); x.roundRect?.(cx, y, w, 44, 22); if (!x.roundRect) x.rect(cx, y, w, 44); x.fill();
      x.fillStyle = c.faded ? "#8F866F" : "#EFFAFD"; x.textBaseline = "middle"; x.fillText(c.words, cx + 18, y + 23);
      cx += w + 12;
    }
    y += 80;
  }

  // The reveal, and the child's idea.
  if (d.reveal) {
    x.fillStyle = d.died ? "#E4E6EE" : "#F2E6C8";
    const top = y, lines = (x.font = "600 40px Petrona, Georgia, serif", wrap(x, d.reveal, W - 2 * M - 60));
    x.beginPath(); x.roundRect?.(M, top, W - 2 * M, lines.length * 52 + 48, 26); if (!x.roundRect) x.rect(M, top, W - 2 * M, lines.length * 52 + 48); x.fill();
    y = write(x, d.reveal, M + 30, top + 24, W - 2 * M - 60, "600 40px Petrona, Georgia, serif", "#3A3120", 52) + 60;
  }
  if (d.idea) {
    y = write(x, "MY IDEA", M, y, W - 2 * M, "700 22px Karla, system-ui, sans-serif", "#9A8E70", 34);
    y = write(x, `“${d.idea}”`, M, y, W - 2 * M, "italic 500 36px Petrona, Georgia, serif", INK, 46);
  }
  // The card is as tall as what is on it, with its frame redrawn at the new foot.
  const h = Math.min(H, Math.max(900, Math.ceil(y + M)));
  const out = doc.createElement("canvas");
  out.width = W; out.height = h;
  const o = /** @type {CanvasRenderingContext2D} */ (out.getContext("2d"));
  o.drawImage(cv, 0, 0, W, h - 60, 0, 0, W, h - 60);
  o.drawImage(cv, 0, H - 60, W, 60, 0, h - 60, W, 60);
  return out;
}

/**
 * Save or share the card: the iPad's share sheet when it can take a picture
 * (save to Photos, AirDrop to the teacher), else a download. Nothing is uploaded.
 * @param {HTMLCanvasElement} canvas @param {null|string} name @param {"family"|"line"} [noun]
 * @returns {Promise<"shared"|"cancelled"|"downloaded">}
 */
export async function shareCard(canvas, name, noun = "family") {
  const blob = await new Promise((done) => canvas.toBlob(done, "image/png"));
  const file = new File([blob], `${(name ?? "lineage").toLowerCase()}-story.png`, { type: "image/png" });
  if (globalThis.navigator?.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name ? `The ${name} ${noun}` : "My LINEAGE story" }); return "shared"; } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob), a = Object.assign(document.createElement("a"), { href: url, download: file.name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
