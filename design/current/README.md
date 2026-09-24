# LINEAGE — the live build, moment by moment (before Step 4)

Screenshots of the game as it is now, for Step 4 (look design). Each moment opens straight from a link, in a real game state (seed 6), and each is shot at iPad landscape (1180 × 820) and portrait (820 × 1180). The shots are at 2× pixels (2360 × 1640 and 1640 × 2360), as a class iPad shows them, and saved as JPEG.

- **All the links, to tap on a phone:** `game/moments.html`. Live, once merged: https://christopherfi-dev.github.io/Lineage/game/moments.html
- **One moment:** `game/?moment=NAME`. Add `&seed=N` for another world.
- **Locally:** serve the repo root (`python3 -m http.server 8000`) and open http://localhost:8000/game/moments.html

## How a moment is reached

`game/src/moments.js` looks for a story that reaches the moment, using observer runs on throwaway copies of the world, as the curated-seed check does. It then plays the game forward to it the way a child would: tap the family, watch, make the same choices. Only the waiting is skipped. The biology, the text and the game rules are the ordinary ones.

The moments deep in a story take a few seconds to reach. A small "getting there" label shows while they do.

## Every screen uses these

- **`game/src/world.js`:** the painted terrain, with its three habitat bands (high leaves, open ground, water's edge).
- **`game/src/herd.js`:** the animals on the map.
  - Your group in blue with a soft glow and a halo.
  - The groups not chosen in their colours, with a ring on the ground.
  - Everyone else small and grey.
  - Mutation flashes, and the ring on the animal whose card is open.
- **`game/src/main.js`:** the game itself: the camera, the generation clock, the story's flow and the narration log.
- **`game/src/narration.js`:** every line of text a child reads or hears.
- **`game/index.html`, `game/styles.css`:** the panels on top of the map.
  - The generation panel (`#hud`).
  - The hint (`#hint`).
  - The narration bar (`#logbar`).
  - "Back to my group" (`#home`).
  - The choice panel (`#choice`), the creature card (`#card`) and the ending (`#ending`).
- **`game/src/speech.js`:** the small speaker beside every line.

## The moments

| Moment | Link | What is on screen (seed 6) | Files |
|---|---|---|---|
| **Arrival** | `?moment=arrival` | The opening, before the first tap. Generation 0; the camera is on the webbed family in the high leaves. The hint reads "Drag to look around · tap an animal to follow its family" and the log "Tap an animal to follow its family." | `arrival-landscape.jpg`, `arrival-portrait.jpg` · world.js, herd.js (the founders), main.js (`start`), narration.js (`START_LINE`), index.html (`#hint`) |
| **A generation** | `?moment=generation` | Mid-story, just before a generation passes. Generation 22 on the open ground: your group of 120, the two groups not chosen, and the generation bar almost full (the next generation arrives 3 s after the moment opens). | `generation-*.jpg` · main.js (`frame`, `generation`, `updateHud`), herd.js, narration.js (`groupLines`) |
| **A variation** | `?moment=variation` | A newborn with a new trait, its flash showing. Generation 38: one baby in your group, in a bright ring, and after about 4 s the log's second line: "One of your babies was born with thicker fur." | `variation-*.jpg` · herd.js (the flash: newest bright, the one before dim), bridge.js (the engine's mutation records), narration.js (`groupLines`, `traitChange`) |
| **Growing** | `?moment=grow` | Your group clearly bigger than last generation. Generation 23: "Your group is bigger than last generation: 149 animals now." | `grow-*.jpg` · herd.js (each baby appears beside its mother), narration.js (`groupLines`), main.js (`updateHud`) |
| **Shrinking** | `?moment=shrink` | Your family clearly smaller. The webbed family in the high leaves at generation 1, down from 12 to 7: "Your family is smaller than last generation: 7 animals now." | `shrink-*.jpg` · herd.js (deaths fade out), narration.js (`groupLines`) |
| **A choice** | `?moment=choice` | A choice point with three options (generation 4). Each option is drawn from its real genome, with a ring on the part the choice is about and a close-up for small parts. The 20-second timer bar sits under the options. | `choice-*.jpg` · main.js (`openChoice`), creature.js (the option drawings), variations.js (`choiceOptions`), narration.js (`optionLine`), styles.css (`#choice`) |
| **A prediction** | `?moment=prediction` | The journal's question, right after the first choice and before the fast-forward (generation 4). "Will your new group grow or shrink?" has four answers in a random order, each with a speaker, and a 15-second bar. The world waits behind it. | `prediction-*.jpg` · main.js (`openJournal`, `tickJournal`), journal.js (`questionFor`, with `docs/LINEAGE_PREDICTION_QUESTIONS.md`), index.html and styles.css (`#journal`) |
| **A prediction's result** | `?moment=prediction-result` | The next choice point (generation 9). Under "Since your last choice:" it shows "Your prediction:", then "Yours: 29 → 52" and "You thought it would grow. It grew." The shortcut picks the "need" answer, so the need line follows. | `prediction-result-*.jpg` · main.js (`openChoice`, `predictionBlock`), journal.js (`resultOf`), styles.css (`.prediction`) |
| **The ending** | `?moment=ending` | A surviving ending: "Your group survived 76 generations." It shows "Here's what your animals look like now." with the group's average body drawn, the reveal ("a lot like a beaver"), the traits against the start, the question, the clue, "Your predictions" ("A story from the simulation."), the choices and the two buttons. | `ending-*.jpg` · main.js (`showEnding`), creature.js, reveal.js (with `docs/LINEAGE_REAL_ANIMAL_REVEAL.md`), evidence.js (the clue), journal.js (the predictions), variations.js (`comparedRows`), narration.js, styles.css (`#ending`) |
| **Died out** | `?moment=extinct` | An ending where the group died out: the webbed family in the high leaves, "Their story lasted 5 generations." It shows the drawing ("looked like"), the traits, the question and the clue, and no reveal. | `extinct-*.jpg` · as the ending, without reveal.js |
| **A creature card** | `?moment=card` | A card open on an animal with a new trait. Generation 1: "New at birth: more webbing between the toes, not from its parents." That line glows, the paw glows on the drawing, and a ring marks the animal on the map. | `card-*.jpg` · main.js (`showCard`, `placeCard`), creature.js (the drawing), variations.js (`plainRows`), bridge.js (`newTraitOf`), narration.js (card lines), herd.js (the ring), styles.css (`#card`) |

The Step 4 moments map onto these as follows:

1. Arrival: **arrival**
2. A generation as one day: **generation**
3. A variation appearing: **variation**
4. A group growing or shrinking: **grow**, **shrink**
5. The last one and the ending, with the reveal: **extinct**, **ending**
6. The creature card: **card**

**choice** is extra: it is the screen a child sees most often. **prediction** and **prediction-result** are the prediction journal (Step 6).

*Screenshots made on 2026-09-23 with headless Chromium from the links above (seed 6). The build is `main` plus the moment shortcuts. The prediction, prediction-result and ending shots were made on 2026-09-24, with the prediction journal (Step 6).*
