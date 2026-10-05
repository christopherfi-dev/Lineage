/**
 * The collection (scope decision 74): the twelve animals a line can become
 * (reveal.js), as cards, four to a row and a row for each place. An animal is
 * evolved on this iPad once a line here became it at the win (scope decision
 * 73): its card shows its picture (game/animals/<id>.jpg, one file per animal,
 * so a new picture drops in), its name and its place's mark. The rest are
 * mystery cards, a "?" with the place's mark. Children discover: there is no
 * target to pick.
 *
 * Kept in this iPad's own storage like the Field Guide (nothing leaves the
 * iPad, and the page still works with storage blocked: it lasts the page's
 * life then). The teacher's "Start fresh" clears it (journal.html), and the
 * teacher's journal page lists it.
 */

import { ANIMALS } from "./reveal.js";
import { read, write } from "./reflection.js";

/** This iPad's collection, in its own storage: [{id, when, name}], the first time each animal was evolved here. */
export const COLLECTION_KEY = "lineage.collection";
export const COLLECTION_TITLE = "Your collection";
/** "You've evolved 5 of 12." (the grid's real size) */
export const evolvedLine = (n) => `You've evolved ${n} of ${ANIMALS.length}.`;
/** On the card of the animal just evolved. */
export const NEW_CARD = "New!";
/** The ending's one way on (scope decision 82): the button, and the line above it with this iPad's count. */
export const FIND_ANOTHER = "Find another animal!";
/** The button once every animal of the collection is found. */
export const PLAY_AGAIN = "Play again!";
/** "You've found 3 of 12. Find another!" (the grid's real size); none yet, or all of them, said plainly. */
export const foundLine = (n) => (n === 0 ? "No animals found yet. Find one!"
  : n >= ANIMALS.length ? `You've found all ${ANIMALS.length}! Play again?` : `You've found ${n} of ${ANIMALS.length}. Find another!`);
/** design/animals/CREDITS.txt: the pictures' origin, on the collection. */
export const IMAGE_CREDITS = "Image credits: animal pictures made with Google Gemini.";
/** Each place's mark, for its cards, and what it says when read aloud. */
export const PLACE_MARKS = ["High leaves", "Open ground", "Water's edge"];
/** A mystery card, read aloud. */
export const mysteryLabel = (zone) => `A mystery animal of the ${PLACE_MARKS[zone].toLowerCase()}`;

/** The cards in order: the leaves' row, the ground's, the water's. */
export const GRID = [0, 1, 2].flatMap((zone) => ANIMALS.filter((a) => a.zone === zone));

/** The picture of a grid animal. */
export const pictureOf = (animal) => `./animals/${animal.id}.jpg`;

/** Evolved since the page opened: kept here too, so a blocked storage still shows them while the page lasts. */
const session = new Map();

/** This iPad's evolved animals, by id: when, and the family that first became it. */
export function collection() {
  const found = new Map(session);
  for (const x of read(COLLECTION_KEY, [])) if (x && GRID.some((a) => a.id === x.id) && !found.has(x.id)) found.set(x.id, x);
  return found;
}

/**
 * A line became this animal at the win: keep it in the collection. True when it is new on this iPad.
 * @param {import("./reveal.js").RevealAnimal} animal @param {null|string} [name] the family's name
 */
export function collect(animal, name = null) {
  if (!animal?.id || !GRID.includes(animal)) return false;
  const found = collection();
  if (found.has(animal.id)) return false;
  const entry = { id: animal.id, when: new Date().toISOString(), name };
  session.set(animal.id, entry);
  write(COLLECTION_KEY, [...found.values(), entry]);
  return true;
}

/** Forget the collection on this page as well as in storage (the teacher's "Start fresh" clears storage). */
export function clearCollection() {
  session.clear();
  return write(COLLECTION_KEY, []);
}

const SVG = "http://www.w3.org/2000/svg";
/** Each place's mark: a leaf, a tuft of grass, two waves. */
const MARK_PATHS = [
  "M5 19C5 10 11 5 20 4c0 9-5 15-14 15zM5 19l9-9",
  "M3 19h18M7 19c0-4-1-7-3-9M12 19c0-6 1-10 3-12M17 19c0-3 1-5 3-6",
  "M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
];

/** A place's mark, as a small round badge. @param {Document} doc @param {number} zone */
export function placeMark(doc, zone) {
  const i = Object.assign(doc.createElement("i"), { className: `mark z${zone}` });
  i.setAttribute("role", "img");
  i.setAttribute("aria-label", PLACE_MARKS[zone]);
  const svg = doc.createElementNS(SVG, "svg"), path = doc.createElementNS(SVG, "path");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  path.setAttribute("d", MARK_PATHS[zone]);
  svg.append(path);
  i.append(svg);
  return i;
}

/** The twelve pictures, fetched and decoded while the arrival mist clears, so the cards turn without waiting for them. */
const decoded = [];
export function preloadPictures() {
  if (decoded.length || typeof Image === "undefined") return;
  for (const a of GRID) {
    const img = new Image();
    img.decoding = "async";
    img.src = pictureOf(a);
    img.decode?.().catch(() => {}); // a missing picture shows as a clean card
    decoded.push(img);
  }
}

/**
 * One card: an evolved animal's picture, name and place mark, or a mystery card, a "?" with the place mark. The
 * front can be turned face down (`.down`) and flipped by the opening (scope decision 77).
 * @param {Document} doc
 * @param {import("./reveal.js").RevealAnimal} animal
 * @param {{found?: boolean, isNew?: boolean, reveal?: boolean}} [opts] evolved on this iPad; just now; shows the animal
 *   even though it isn't evolved (the opening's flip)
 */
export function cardEl(doc, animal, { found = false, isNew = false, reveal = false } = {}) {
  const card = Object.assign(doc.createElement("div"), { className: `ccard${found ? " found" : " mystery"}${isNew ? " new" : ""}` });
  card.dataset.id = animal.id;
  card.dataset.zone = String(animal.zone);
  const inner = Object.assign(doc.createElement("div"), { className: "inner" });
  const front = Object.assign(doc.createElement("div"), { className: "front" });
  const pic = Object.assign(doc.createElement("div"), { className: "pic" });
  const img = Object.assign(doc.createElement("img"), { alt: "", decoding: "async", draggable: false });
  img.src = pictureOf(animal);
  // A missing picture: the card stays clean, with its name and mark (Marc can drop the file in).
  img.addEventListener("error", () => { pic.classList.add("missing"); img.remove(); });
  const q = Object.assign(doc.createElement("span"), { className: "q", textContent: "?" });
  pic.append(img, q);
  const label = Object.assign(doc.createElement("div"), { className: "label" });
  label.append(placeMark(doc, animal.zone), Object.assign(doc.createElement("span"), { className: "name", textContent: animal.name }));
  front.append(pic, label);
  if (isNew) front.append(Object.assign(doc.createElement("span"), { className: "ribbon", textContent: NEW_CARD }));
  const back = Object.assign(doc.createElement("div"), { className: "back" });
  back.append(placeMark(doc, animal.zone));
  inner.append(front, back);
  card.append(inner);
  card.setAttribute("role", "img");
  card.setAttribute("aria-label", found || reveal ? `${animal.name}, ${PLACE_MARKS[animal.zone].toLowerCase()}` : mysteryLabel(animal.zone));
  if (reveal) card.classList.add("showing");
  return card;
}
