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
  - The others here (a fair test's other group) in orange, with a ring on the ground.
  - Everyone else small and grey.
  - The glow on newborns you can follow, and the ring on the animal whose card is open.
- **`game/src/main.js`:** the game itself: the camera, the generation clock, the story's flow and the narration log.
- **`game/src/narration.js`:** every line of text a child reads or hears.
- **`game/index.html`, `game/styles.css`:** the panels on top of the map.
  - The generation panel (`#hud`).
  - The hint (`#hint`).
  - The narration bar (`#logbar`).
  - "Back to my group" (`#home`).
  - The backup choice panel (`#choice`), "Since your last choice" (`#since`), the creature card (`#card`) and the ending (`#ending`).
- **`game/src/speech.js`:** the small speaker beside every line.

## The moments

| Moment | Link | What is on screen (seed 6) | Files |
|---|---|---|---|
| **Arrival** | `?moment=arrival` | The opening, before the first tap. Generation 0; the camera is on the webbed family in the high leaves. The hint reads "Drag to look around · tap an animal to follow its family" and the log "Tap an animal to follow its family." | `arrival-landscape.jpg`, `arrival-portrait.jpg` · world.js, herd.js (the founders), main.js (`start`), narration.js (`START_LINE`), index.html (`#hint`) |
| **A generation** | `?moment=generation` | Mid-story, just before a generation passes. Generation 20, after 3 follows: "Yours (thinner fur): 13 → 18", "The others here: 13 → 10", and the generation bar almost full (the next generation arrives 3 s after the moment opens). | `generation-*.jpg` · main.js (`frame`, `generation`, `updateHud`), herd.js, narration.js (`groupLines`) |
| **A variation** | `?moment=variation` | One newborn with a new variation, glowing (the calm rule: at most three glow, only ones a child can follow). Generation 2, family 4. The log names only glowing babies: "One of your babies was born with rounder ear tips." (scope decision 38). | `variation-*.jpg` · herd.js (the glow ring), story.js (`updateGlow`: which newborns glow), cohorts.js (`newbornVariation`), narration.js (`groupLines`, `GLOW_HINT`) |
| **Following a trait** | `?moment=follow` | A glowing newborn's card with the fair test's real size, "Follow 20 animals with a weaker tail", and "Not this one" (generation 11, after 1 follow). | `follow-*.jpg` · main.js (`showCard`, `renderFollow`), cohorts.js (`sidesIn`, `testSize`, `canStart`), narration.js (`followButton`, `NOT_THIS`), styles.css (`#card-follow`) |
| **Will it spread?** | `?moment=spreading` | A variation too rare to start a fair test, fast-forwarded to see if it spreads (scope decision 42). Family 4 tapped a newborn with less webbing at generation 5, when 6 animals there had it. Now it is generation 8: the Fast-forward badge is up, the animals hurry, and the log counts the latest three generations, "Will it spread? Animals with less webbing between the toes: 5… 8… 10…". The count changes in place every 2 s. | `spreading-*.jpg` · story.js (`trySpread`, `spreadGeneration`), main.js (`startSpread`, `spreadCounter`), narration.js (`followSpread`, `spreadLine`), speech.js (`spoken`: "5, 8, 10.") |
| **It disappeared** | `?moment=fizzled` | The spread stopped because none have the variation any more. Family 3, generation 5: "Will it spread? Animals with thicker fur: 1… 1… 0…", then "It disappeared. Most new traits do." The world is back at its usual pace, and the child keeps their family (the try was not a follow). With too few at the cap, the line is "It didn't spread far enough." | `fizzled-*.jpg` · story.js (`stopSpread`), main.js (`spreadFailed`), narration.js (`SPREAD_GONE`, `SPREAD_SHORT`, `SPREAD_COMMON`) |
| **A fair test** | `?moment=fairtest` | Both groups five generations after a follow: yours in blue, the others here in orange beside them (each of yours got a twin), and in the corner "Yours (a weaker tail): 20 → 31", "The others here: 20 → 31". Generation 16. | `fairtest-*.jpg` · cohorts.js (`formCohorts`: the twins), bridge.js (`followCohorts`, the others' births and deaths), herd.js (orange rings), main.js (`fairRows`, `updateHud`) |
| **Growing** | `?moment=grow` | Your group clearly bigger than last generation, after a follow: "Your group is bigger than last generation: 31 animals now." (generation 16; in seed 6 the same state as the fair test). | `grow-*.jpg` · herd.js (each baby appears beside its mother), narration.js (`groupLines`), main.js (`updateHud`) |
| **Shrinking** | `?moment=shrink` | Your family clearly smaller. The webbed family in the high leaves at generation 1, down from 12 to 7: "Your family is smaller than last generation: 7 animals now." | `shrink-*.jpg` · herd.js (deaths fade out), narration.js (`groupLines`) |
| **The backup choice** | `?moment=choice` | Nothing followed for 120 s of story, so the panel opens (generation 6, before any follow): three variations that can start a fair test ("This one has thin fur.", "…a sleeker body.", "…bigger eyes."), each drawn with a ring and a close-up, and the 20-second timer. | `choice-*.jpg` · story.js (`pushOptions`), main.js (`openChoice`, `fillSince`), creature.js (the option drawings), styles.css (`#choice`) |
| **A prediction** | `?moment=prediction` | The journal's question right after the first follow (generation 4, family 1): "Will your new group grow or shrink?" with four answers in a random order, each with a speaker, and a 15-second bar. The world waits behind it. | `prediction-*.jpg` · main.js (`openJournal`, `tickJournal`), journal.js (`questionFor`, with `docs/LINEAGE_PREDICTION_QUESTIONS.md`), index.html and styles.css (`#journal`) |
| **A prediction's result** | `?moment=prediction-result` | The second follow (generation 11): the "Since your last choice" sheet with "Yours (thinner fur): 11 → 5", "The others here: 11 → 10", then "Your prediction:" with "You thought it would grow. It shrank." The shortcut picks the "need" answer, so the need line follows. "Next" (or 15 s) goes on to the new follow. | `prediction-result-*.jpg` · main.js (`openSince`, `fillSince`, `predictionBlock`), journal.js (`resultOf`), styles.css (`#since`, `.prediction`) |
| **The ending** | `?moment=ending` | A surviving ending after 8 follows: "Your group survived 76 generations." It shows the drawing, the reveal ("a lot like a beaver"), the traits against the start, the question, the clue, "Your last fair test", "Your predictions", the follows and the two buttons. | `ending-*.jpg` · main.js (`showEnding`), creature.js, reveal.js (with `docs/LINEAGE_REAL_ANIMAL_REVEAL.md`), evidence.js (the clue), journal.js (the predictions), variations.js (`comparedRows`), narration.js, styles.css (`#ending`, `#ending-fair`) |
| **Died out** | `?moment=extinct` | Your group died out after 10 follows: "Their story lasted 60 generations." The ending leads with the fair test (scope decision 37): "In the high leaves: Yours (more curved claws): 13 → 0, The others here: 13 → 26", "The others here are still alive.", then the question. Under the drawing, the reveal in the past tense (scope decision 40): "Your animals were becoming a lot like a bushbaby." "Big eyes helped them see well. Long back legs helped them move fast." | `extinct-*.jpg` · main.js (`showEnding`: `#ending-lead`, the reveal's tense), reveal.js (`revealPast`, `whyPast`), narration.js (`OTHERS_DIED_TOO`, `OTHERS_ALIVE`), styles.css (`#ending-lead`) |
| **A creature card** | `?moment=card` | A card open on an animal with a new trait (generation 1): "New at birth: more webbing between the toes, not from its parents." It glows, so the card offers it: "Follow animals with more webbing between the toes" (with no number, because too few there have it to start a fair test right away) and "Not this one". A ring marks the animal on the map. | `card-*.jpg` · main.js (`showCard`, `placeCard`, `renderFollow`), creature.js (the drawing), variations.js (`plainRows`), bridge.js (`newTraitOf`), narration.js (card lines), herd.js (the ring), styles.css (`#card`) |

The Step 4 moments map onto these as follows:

1. Arrival: **arrival**
2. A generation as one day: **generation**
3. A variation appearing: **variation**
4. A group growing or shrinking: **grow**, **shrink**
5. The last one and the ending, with the reveal: **extinct**, **ending**
6. The creature card: **card**, **follow**

**follow**, **spreading**, **fizzled**, **fairtest** and **choice** (now the backup panel) are active choosing (scope decisions 32–34 and 42). **prediction** and **prediction-result** are the prediction journal (Step 6).

*All screenshots made again on 2026-09-24 with headless Chromium from the links above (seed 6), with active choosing, the adaptive fair-test size and the spread fast-forward (scope decisions 32–38 and 42).*
