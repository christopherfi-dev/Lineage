# LINEAGE — the live build, moment by moment (after Step 5)

**Round 3, Part B (scope decision 65):** `same` (a "~" or neutral trait followed, "About the same.", and the "Why?" guess) replaces `no-test`, whose card is gone; `fairtest` is now shot at the test's result, the scoreboard counting who made it. The other pictures are shot again with Part C.

**The PR #26 decisions (2026-09-27, scope decision 64): every moment after the first tap is shot again** at all three sizes, since a story is now 50 generations (the endings come at generation 50), "Hurting here" shows only when it names a trait, and a trait that hurts where the family lives starts its fair test with 5 pairs (so the moments' stories take other turns). `arrival` and `arrival-mist`, before the first tap, are unchanged. New: `nearly-over` (seed 6: "This world is nearly over. Start a new world?"). `another-family` is now in seed 138, whose first family dies out at generation 20 with 30 of the 50 generations left; `in-trouble` (seed 72, 16 left) shows the world after "Keep going anyway". Families rarely get very small now: `blocked` is in seed 26 (generation 33), and `danger`, which no founding family of seeds 1–100 reaches within 50 generations, is in seed 13's full-length story (`?length=76`, generation 69).

**The next round (2026-09-27, Parts 1–6, scope decisions 58–63): every picture here is new.** Every moment is shot again at all three sizes (iPad landscape 1180 × 820, portrait 820 × 1180, and a phone held sideways, 844 × 390, at 2×), in the default common-ancestor world, seed 13 (decision 56). A family's fate doesn't depend on what the child follows, and no founding family of seed 13 dies out, so `extinct` and `another-family` are in seed 6, `in-trouble` in seed 72 and `why-drop` in seed 1. Family names are fresh every story, so they differ from picture to picture. The "before" pictures (`design/current/`) are of the old world, so they show the same moment, not the same animals. Made with `game/moments.html`'s links; side by side in `design/compare.html`.

- **Part 2, choosing inside one family:** `follow`, `joining`, `fairtest` (gold rings with the trait, purple without, both in the family), `spreading` and `fizzled` ("passed on"), `away`, `back`, `go-back`, `moving`, `so-far` ("Your family so far"), `another-family`, `in-trouble`; glows are bigger and pulse, with a sparkle above.
- **Part 3, understanding why:** `reason`, `why`, `why-answer`, `why-drop`, `discovery`; "Helping here / Hurting here" under the generation panel in every moment of a story; the ending's clue is the same trait in two places.
- **Part 4, connection:** `type-name`, `my-name`, `average` (the living portrait, opened, with the family tree strip); the portrait itself sits under the zoom buttons.
- **Part 5, the ending:** `ending` (step 1, what happened), `ending-idea`, `ending-check`, `ending-reveal`, `story-card`, `guide` (the Field Guide; the book button is on the map).
- **Part 6, the look:** the places' names and dashed borders on the map (`map`, and in every view of the map), animals on branches among the leaves (`leaves`), and animals swimming at the water's edge (`habitat`, shot 20 s after arriving, once some have swum out).

*The text below is from the rounds before.*

The same moments as `design/current/` (the before), shot again after Step 5: part one, the beauty pass that brings the game up to `design/v2/`, and part two, family names, sound and animals that move like animals. Same links, same seed (6), same iPad sizes: landscape 1180 × 820 and portrait 820 × 1180, at 2× pixels, saved as JPEG. Since the small-screen round, also a phone held sideways: 844 × 390 at 2× pixels.

**Part two on these pictures:** the family's name is in every line that names the child's animals ("Your Sunpaddle group is bigger than last generation: 31 animals now."), the sound button is in the top-right corner (an open card or the ending covers it), and the animals pause, look around, graze and flick their tails. Sound can't be seen here: its cues and levels are in the pull request.

**Small screens and touch:** the + and − buttons sit under the sound button, and the arrival settles closer on the first family (1.5× on an iPad). At iPad sizes, the shots taken again are the ten moments where the + and − buttons show (arrival, generation, generation-dawn, variation, spreading, fizzled, danger, fairtest, grow and shrink) and the arrival in the mist. In the others a card, a panel or the ending covers the buttons, so they look as they did. Every moment is also shot on a phone held sideways (`*-phone.jpg`): the slim generation bar, the smaller narration and the story told at 1.25×. The same moments on that phone before this round, from main, are in `design/phone-before/`.

**The playtest fixes (2026-09-27, scope decisions 48–54):** every moment is shot again at all three sizes, since each shows the new ground and the new buttons.
- **The ground:** open ground is painted as grass and earth. The water's edge is a greener meadow with reeds, and sand only where it meets the water.
- **Where the animals live:** each animal lives where its habitat use puts it. The ones that spend most of their time at the water's edge are by the waterline; the ones that split their time are toward the border between habitats.
- **Leaves · Ground · Water** buttons sit at the bottom left, across from "Back to my group".
- **Babies appear through the day**, and each glowing baby is named as it lights up. A line that names a baby is underlined, and a tap flies to it.
- **Five new moments:** `joining`, `edge-arrow`, `other-card`, `habitat` (the water's edge) and `ground`.
- **Moments reached differently:** the search now passes each watched day in steps, as the game does, so some moments come from a different point in the story. The fair test is now at generation 37, at the tree line; the ending has 12 follows.

- **Side by side, on a phone:** `design/compare.html`. Live, once merged: https://christopherfi-dev.github.io/Lineage/design/compare.html
- **The moments in the game:** `game/moments.html`. Live: https://christopherfi-dev.github.io/Lineage/game/moments.html

## What is on screen

Every moment is the same game state as its before shot (the same generation, family and animals). The look and the motion changed, and the text only where it now names the family. Each picture is taken the same time after the moment opens as before, except for these shots:

| File | When | Why |
|---|---|---|
| `arrival-*.jpg` | 9 s after the page opens | The mist lifts over about 7 s; after it, the camera has settled close on the first family. |
| `arrival-mist-*.jpg` | 3.8 s | New: the mist lifting as the camera drifts down into the leaves. |
| `naming-*.jpg` | 1.3 s | New in part two: right after the first tap on the webbed family in the high leaves, "What will you call your family?" with three names. |
| `generation-dawn-*.jpg` | 4.6 s | New: the next generation arrives at dawn (a generation is one day). `generation-*.jpg` is the end of the night before it. |
| `ending-*.jpg`, `extinct-*.jpg` | 4 s | The ending's parts come in one after another; the "Did you know?" notes last, at about 3.5 s. |
| `joining-*.jpg` | 1.8 s | New with the playtest fixes: the ones already yours have lit up, and the newcomers are walking in. |
| `edge-arrow-*.jpg`, `other-card-*.jpg` | 0.9 s | New with the playtest fixes. |
| `habitat-*.jpg`, `ground-*.jpg` | 1.5 s | New with the playtest fixes: the camera has arrived, and the narration sums up the place. |

| Moment | Files | What to look at |
|---|---|---|
| Arrival | `arrival-*`, `arrival-mist-*` | Morning mist, the camera drifting down and settling close on a family, then the hint and the log line. |
| Naming the family | `naming-*` | Three names from the family's habitat and traits, each with a speaker, and the 20-second bar. |
| A generation | `generation-*`, `generation-dawn-*` | The day's light: night with fireflies, then dawn. The sun moves along the generation bar. |
| A variation | `variation-*` | The newborn's ring of light and its caption, the log's own line with a speaker. |
| Following a trait | `follow-*` | The card glowing gold, "Follow" and "Keep looking" the same size, the painted habitat behind the animal. |
| Will it spread? | `spreading-*` | The counter in a gold-ringed pill, warm edges while the fast-forward runs. |
| It disappeared | `fizzled-*` | The gentle, cooler pill. |
| Wait! | `danger-*` | The warm clay pill, no red. |
| Stay with them? | `blocked-*` | The peach note on the card. |
| A fair test | `fairtest-*` | Your group brightest, the others here in orange beside them. |
| Growing, shrinking | `grow-*`, `shrink-*` | The light a little warmer as the group grows, a little cooler as it shrinks. |
| The backup choice | `choice-*` | The paper sheet with three painted plates and the gold timer. |
| A prediction, its result | `prediction-*`, `prediction-result-*` | The journal sheet; the fair-test board as cards with tall bars. |
| The ending, died out | `ending-*`, `extinct-*` | The field-guide page, the gold reveal plate and its margin notes; the died-out page at dusk. |
| A creature card | `card-*` | The card, its habitat scene, light along the animal's back and the ring under the new part; "Lives on the open ground." |
| Joining | `joining-*` | A follow: the two already in your group lit gold, the 18 newcomers with rings walking in. "2 from your group and 18 others with straighter claws join you." |
| An arrow to a baby | `edge-arrow-*` | Two glowing babies off the left edge, two golden arrows pointing to them; the log's line underlined, so it can be tapped. |
| Another group's card | `other-card-*` | One of the others here: "The others here: 11 → 10" beside yours, "Doing worse than yours since your last choice.", then "Smaller eyes than yours" first (the fair test's trait) and "More curved claws than yours". |
| Visiting the water | `habitat-*` | The water's edge: animals on the sand by the water. "Water's edge: 113 animals, growing. Many have webbed feet." |
| Visiting the ground | `ground-*` | Open ground as grass and earth. "Open ground: 69 animals, growing. Some have big eyes." |

*Made on 2026-09-26 with headless Chromium from the links above (seed 6), and made again the same day after part two and after the small-screen round, and on 2026-09-27 after the playtest fixes.*
