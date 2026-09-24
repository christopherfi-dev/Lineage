# LINEAGE — the game

Built step by step from `LINEAGE_M2_CLASSROOM_SCOPE.md`: the frozen M1 engine runs the
biology on the canvas from `design/Lineage World.dc.html`, played as a story (scope decision
6). The engine is imported from `../lineage-m1/src`, never copied or edited. `src/engine.js`
is the only file that imports it.

## Run it

Serve the **repo root** as a static site, then open `/game/`:

```bash
python3 -m http.server 8000      # from the repo root
# open http://localhost:8000/game/
```

Plain ES modules, no build step. The world is M1's defining experiment: the fixture with its
webbing override, so the same webbed feet start in one canopy family and one shoreline
family. `?seed=N` picks another trajectory (default 6).

**Curated worlds** (`src/seeds.js`). The game only shows a seed whose three habitats all still
have living animals at generation 76, where every story that lasts ends. Before a world is
shown, the engine runs ahead in a throwaway copy of it (an observer run: the biology is
unchanged, and the world you see starts again from generation 0 with the same seed). 95 of
seeds 1–100 pass. A `?seed=` that fails is swapped for a good one, and "New world" only picks
good seeds.

## The story (scope decision 6)

The rules are in `src/story.js`, with every number at the top of the file:

| constant | value | what it does |
| --- | --- | --- |
| `GENERATION_SECONDS` | 20 | real seconds per generation while watching |
| `FIRST_WATCH_GENERATIONS` | 4 | generations watched before the first choice point |
| `WATCH_GENERATIONS` | 3 | generations watched before each later choice point |
| `CHOICE_SECONDS` | 20 | time to choose before one option is picked at random |
| `SKIP_GENERATIONS` | 2 | generations fast-forwarded after each choice point |
| `FAST_SECONDS` | 2 | real seconds per generation in a fast-forward |
| `STORY_CHOICES` | 15 | choice points in a story |
| `STORY_GENERATIONS` | 76 | where every story that lasts ends: 4 + 14 × (2 + 3) + 2 |

That is about 80 seconds per choice and about 19 minutes per story.

1. **Time waits for the child.** The animals wander from the start, but generation 1 begins
   only when the child taps an animal and follows its family (the tapped animal's ancestor 3
   generations back through the mother line, `src/families.js`).
2. **Choice points.** After each watch the world pauses: "Which one will you follow?" Two or
   three animals are offered, each drawn from its real genome like its creature card, with a
   ring on the part the choice is about (and a close-up of it when it is small: webbing, claws,
   ear tips, tail tip), and one line naming its variation ("This one has webbed feet."). Each
   carries a different variation that at least 3 of the group carry. From the second choice on, the panel also shows how the last choice
   turned out, as counts beside two small bars, then and now ("Since your last choice: Yours:
   29 → 52. The ones with pointier ear tips: 26 → 32."). A choice point without two such
   variations passes, and the story carries on.
3. **The adaptation rule: replacement.** After a choice, your group is every living animal,
   anywhere, that carries the chosen variation, fixed when it is chosen (the group's median for
   that trait, plus or minus 0.12). Earlier choices no longer count. Then the world
   fast-forwards.
4. **The groups not chosen** stay on the map in their own colours (coloured bodies and a ring on
   the ground), listed in the corner with their sizes. Each is a separate set: the animals with
   its variation but not yours (scope decision 9), so no animal is in your group and theirs.
   One that starts with fewer than 3 animals is not shown at all.
   The creature card of one of its animals shows how it did since the choice against yours:
   "Theirs: 26 → 32. Yours: 29 → 52.", each beside its bars. A child never sees a percentage
   (scope decision 12).
5. **The camera.** Your group may spread across habitats. Every member stands in a soft glow,
   and "Back to my group" goes to the group's largest cluster.
6. **Endings.** The story ends when no living animal fits the group ("Their story lasted N
   generations.") or after the last choice point ("Your group survived 76 generations."). The
   reflection screen shows:
   - "Here's what your animals look like now." (or "looked like", if they died out): the group's
     actual average body at the end, drawn in its main habitat, with the reveal right under it;
   - the same average in words: each meaningful trait against the whole world at generation 0,
     with the reveal's GAP (0.12): "Tail: Stronger than at the start", "Eyes: About the same as at
     the start" (scope decision 20). A dot marks each one that is different from the start. The
     neutral traits keep their plain words ("Coat: medium");
   - one question, then **a clue**: real evidence, not the answer (`src/evidence.js`). It shows
     both sides in one other habitat, from the story's start to now: "At the water's edge:",
     "With webbed feet: 12 → 25", "Without: 28 → 13" (scope decision 14). "With" is a trait's
     high end and "without" its low end; the middle is on neither side. The pair is the
     meaningful trait and habitat where both sides started with 3 or more animals and grew most
     differently. If none qualifies, it is one line about the group's most distinctive trait
     ("Animals with webbed feet at the water's edge: 12 then, 25 now.");
   - for a surviving group, **the real-animal reveal** (under the drawing): the animal it is most like, from its
     actual average traits and main habitat, with its "why" lines (`src/reveal.js`, following
     `docs/LINEAGE_REAL_ANIMAL_REVEAL.md`). Levels are relative to the generation-0 world (GAP
     0.12), and each animal needs its signature trait, so the reveal reflects what changed. Only
     the "why" sentences whose trait the group has are shown;
   - the choices made;
   - "Try another family in this world" (same seed, generation 0) and "New world" (another good
     seed), which stay pinned to the bottom of the card.
7. **Neutral traits.** Coat shade, ear tips and tail tip have no effect on survival in the
   engine. They are offered like any other variation, and the card never says so (scope decision
   8). After the child follows one, the next "Since your last choice…" line and the ending add
   "A darker coat didn't change who survived. Your group grew because of its other traits."
8. **Read-aloud.** Every narration line, choice title, choice option, clue, reveal line and
   ending line has a small speaker. Tapping it reads the text with the browser's own speech
   (`speechSynthesis`, `src/speech.js`), in a calm voice at rate 0.85. "20 → 31" is read as "from
   20 to 31". Child-facing lines stay under about 12 words. The 20-second choice timer stands
   still while anything is being read aloud.
9. **The creature card** (Step 3, scope decisions 21–23). Once the story has begun, tapping
   any animal opens its card; the world keeps running behind it. It shows which group the animal
   is in, its drawing, where it lives ("Lives at the water's edge."), its ten traits in plain
   words ("Lots of webbing between the toes", "Long back legs"), and, when it has one, the trait
   that is new in it: "New at birth: a stronger tail, not from its parents." That trait glows on
   the drawing and in the list. "New" is the engine's body-mutation record at birth, when it
   changed the trait by at least 0.12. Every line has a speaker. The card closes with ×, a tap on
   empty ground, or Escape. Outside a choice it sits at the side of the map. While the choice
   panel is up it sits in the room above it, wide, so it never covers an option, and the choice
   timer waits for as long as it is open. If the animal passes away while its card is open, the
   card stays and says so. A ring marks the animal on the map.
10. **The prediction journal** (Step 6, scope decisions 25 and 28–31, `src/journal.js`). After
    the child's 1st, 4th, 7th, 10th and 13th choice, before the fast-forward, one question comes
    up and the world waits: "Will your new group grow or shrink?", "Will the ones with pointier
    ear tips grow or shrink?" or "Where will animals with a stronger tail do best?". It has three or
    four tappable answers, each with a speaker. They are made from the story's real state
    through the table in `docs/LINEAGE_PREDICTION_QUESTIONS.md`: one reasonable answer from the
    engine's own trait effects, and common Grade 3 misconceptions ("Grow. They'll grow webbed
    feet because they need them."). The child has 15 seconds; the countdown waits for read-aloud
    and for an open card. Without an answer the story just goes on: nothing is picked at random.
    The next "Since your last choice…" panel shows the prediction beside what happened, with
    the same count rows and one short line ("You thought it would shrink. It grew."). The ending
    lists them all under "Your predictions", "A story from the simulation." Nothing is ever
    called wrong, and there are no scores.

The child chooses whom to follow, never what mutates: following is observer state only, and the
random pick uses the browser's `Math.random`, never the engine's generator.

**The drawings** (`src/creature.js`). One animal is drawn large from its real body genome as
layered 2D parts, and each of the ten traits changes something you can see: webbing between the
toes (pink skin, and wider, bigger feet), claw length and curve, a fluffier outline, back-leg
length, tail thickness, eye size, body shape from round to streamlined, coat colour from dark to
light, ears from rounded to pointed, and a coloured band on the tail tip. Values are continuous,
so siblings look related but not identical; the animal's id seeds small touches, so the same
animal always looks the same. A paper grain, a grain on the creature, soft edges and a wash in
the habitat's colour give it a painted, field-guide look.

**Variations** (`src/variations.js`). Every engine trait is a number from 0 to 1. A group's
usual form is its median for each trait. A member carries a variation when one trait is at
least `APART` (0.12) from that median, in one direction. Words come in three levels for each
trait (for example feet: no webbing, some webbing, webbed).

## What is real

- Each engine birth adds a baby beside its mother. Each engine death removes an animal. Each
  body mutation at birth flashes: in your group the newest flash is bright and the one before
  it dim; any other newborn with a mutation glows faintly for one generation.
- Between generations the animals only wander, inside the habitat their inherited time
  allocation gives them.
- Every count on screen and in the log is read from the engine state.

`lineageGame` in the browser console is the live game. Each generation is also logged there.

## Design shortcuts (preparing Step 4)

`?moment=NAME` opens the game straight into one moment, in a real game state (scope decisions 27 and 31). The moments are arrival, generation, variation, grow, shrink, choice, prediction, prediction-result, ending, extinct and card, and each works with `?seed=` too. The links are on `moments.html`, which the game does not link to.

`src/moments.js` finds a story that reaches the moment, using observer runs on throwaway copies of the world. It then plays the game forward to it: tap, watch, the same choices. It changes nothing in the game or the biology. Screenshots of every moment are in `design/current/`.

## Smoke test

```bash
cd game && npm test
```
