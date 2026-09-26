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

## The story (scope decisions 6, 32–35 and 42)

The rules are in `src/story.js` and `src/cohorts.js`, with every number at the top of the files:

| constant | value | what it does |
| --- | --- | --- |
| `GENERATION_SECONDS` | 20 | real seconds per generation while watching |
| `SKIP_GENERATIONS` | 2 | generations fast-forwarded after each follow |
| `FAST_SECONDS` | 2 | real seconds per generation in a fast-forward |
| `MAX_SIZE` | 20 | animals in each group of a fair test, at most |
| `MIN_SIZE` | 10 | a fair test needs at least this many on each side |
| `GLOW_MAX` | 3 | newborns glowing at once, at most |
| `GLOW_GENERATIONS` | 2 | a newborn glows in the generation it is born and the next |
| `SPREAD_MAX` | 10 | generations a variation too rare to start a fair test is fast-forwarded, at most, to see if it spreads |
| `DANGER_SIZE` | 5 | your group this small or smaller stops a spread's fast-forward, and keeps one from starting |
| `PUSH_SECONDS` | 120 | story time with no follow before the backup choice panel opens |
| `CHOICE_SECONDS` | 20 | time to choose on that panel before one option is picked at random |
| `STORY_CHOICES` | 15 | follows in a story, at most |
| `STORY_GENERATIONS` | 76 | where every story that lasts ends |

A story that lasts takes about 19 minutes at most, less for each fast-forward.

1. **Time waits for the child.** The animals wander from the start, but generation 1 begins
   only when the child taps an animal and follows its family (the tapped animal's ancestor 3
   generations back through the mother line, `src/families.js`).
2. **Glowing newborns** (scope decision 32). When a baby in your group is born with a new
   variation, it glows: the trait new in it at birth takes it past the group's usual (the
   group's median for that trait, plus or minus 0.12). At most three glow at once, meaningful
   traits first, then the newest, one per variation; nothing else flashes. The first glow of a
   story says "Tap a glowing baby to see what's new." Tapping one opens its card with "Follow
   animals with smaller eyes" and "Keep looking" (scope decision 43). "Keep looking" closes the
   card and leaves the glow on, so a child can look at several babies and come back to one; the
   glow still ends on its own after `GLOW_GENERATIONS`.
3. **The fair test** (scope decisions 33, 36 and 37). Following makes two groups of the same
   size in the newborn's habitat: the animals there that carry the variation, the newborn and
   the ones nearest it, and for each of them the nearest one there that doesn't, its twin: "the
   others here", in orange. The size is the smaller side, at most `MAX_SIZE`, and the card says
   it: "Follow 14 animals with smaller eyes". Both grow only by
   babies of their own mothers and shrink by deaths, so their counts compare fairly: "Yours
   (smaller eyes): 20 → 27", "The others here: 20 → 19", in the corner panel. "Nearest" is
   between the animals' home spots on the map; newborns get theirs from a generator of their
   own (`src/herd.js`), so a measurement run and the game pick the same animals. After a
   follow the world fast-forwards 2 generations.
4. **Will it spread?** (scope decision 42). If either side has fewer than `MIN_SIZE` in that
   habitat, the card says "Follow animals with smaller eyes", without a number. Following it
   fast-forwards the world (2 s a generation, with the Fast-forward badge), and one line in the
   log counts the animals there that have it, the latest three counts: "Will it spread? Animals
   with smaller eyes: 3… 7… 12…". The count changes in place each generation, and its speaker
   reads "3, 7, 12.".
   - At `MAX_SIZE` the fair test starts, with the adaptive size. After `SPREAD_MAX` generations
     it starts with what there is, if both sides have `MIN_SIZE`.
   - Otherwise: "It disappeared. Most new traits do." (none have it any more) or "It didn't spread
     far enough." The child keeps their group, and the try is not one of their follows.
   - When too few there are without it (most already have it), no spread can help: "Most here
     have it. Too few others for a fair test." With `MAX_SIZE` or more carrying it, this comes at
     once, with no fast-forward.
   - The child's group lives on meanwhile; if it dies out, the story ends as usual. The skipped
     generations count toward the story's 76.
   - **Danger** (scope decision 44): if the child's group falls to `DANGER_SIZE` or fewer during
     the spread, it stops at once, "Wait! Your group is getting very small." is said (read-aloud
     as usual), the camera goes to the group, and the world goes back to its usual pace. It is
     not a follow. While the group is that small, a glowing baby whose trait would need a spread
     has a card that says "Your group needs you. Stay with them?" with only "Keep looking".
     ("family" instead of "group" before the first follow.)

   **The push** (scope decisions 34 and 42). After `PUSH_SECONDS` with no follow, the world
   pauses and the choice panel offers up to three variations that can start a fair test right
   away. Each is drawn from its real genome with a ring (and a close-up) on the part it is
   about. After `CHOICE_SECONDS`, one is picked at random. Options not picked make no group.
   **"Since your last choice"** shows the last fair test at the next follow (a spread that
   starts one included), in that panel or in its own sheet, with the prediction made then beside
   what happened.
5. **The camera.** Your group may spread across habitats. Every member stands in a soft glow,
   and "Back to my group" ("Back to my family" before the first follow) goes to the group's largest cluster.
6. **Endings.** The story ends when no living animal fits the group ("Your story lasted N
   generations.") or at generation 76 ("Your group survived 76 generations."). The
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
   - on every ending, **the real-animal reveal** (under the drawing; scope decision 40), in the past
     tense when the group died out ("Your animals were becoming a lot like a sloth."; with no match,
     "Your animals didn't have time to change.", scope decision 41): the animal it is most like, from its
     actual average traits and main habitat, with its "why" lines (`src/reveal.js`, following
     `docs/LINEAGE_REAL_ANIMAL_REVEAL.md`). Seventeen animals, five or six per habitat (scope
     decision 45). Levels are relative to the generation-0 world (GAP 0.12), and each animal
     needs its signature trait, so the reveal reflects what changed. Only the "why" sentences
     whose trait the group has are shown. Then one "Did you know?" fact about the real animal,
     with its own speaker; every water's-edge animal adds "Did you know? Whales' ancestors were
     land animals that started swimming." (scope decision 46);
   - "Your last fair test": both groups of the last follow, from then to the end;
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
    the child's 1st, 4th, 7th, 10th and 13th follow, before the fast-forward, one question comes
    up and the world waits: "Will your new group grow or shrink?" or, in turn, "Which will do
    better: yours or the others here?" (scope decision 35). It has three or
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

## The look (Step 5, part one)

"Golden hour, in gouache", from the Claude Design handoff in `design/v2/` (its README lists the
changes moment by moment). Visuals and motion only: every line of text, every rule and every
number is as it was.

- **A generation is one day** (`src/light.js`): dawn when it arrives, a golden afternoon, dusk,
  a soft night with fireflies, then dawn again. The day stands still at a choice point, is a
  morning before the story starts, and turns golden behind the ending (a blue dusk when the
  group died out). Pollen, glints on the water and now and then a bird's shadow.
- **The arrival:** morning mist lifts as the camera drifts down into the leaves and settles close
  on a family (see "Small screens and touch"). A tap on an animal still follows its family at
  once; a tap anywhere else lets the mist go.
- **The mood:** the light turns a little warmer as your group grows, a little cooler as it shrinks.
- **Your animals** are drawn last and brightest, lit from the sun's side (`src/herd.js`). Babies
  stay a little smaller beside their mothers for 7 s, and a death fades with a little light.
- **A glowing newborn:** a ring of light opens with sparkles, then breathes. Beside it is the
  log's own line ("One of your babies was born with thicker fur."), with a speaker, but only
  for babies the log has named.
- **Panels** (`styles.css`): field-guide paper, and the Petrona and Karla fonts, served from
  `fonts/` (SIL Open Font License) so no font service is called. Speakers keep a 44 px hit area.
- **Smooth on an iPad:** the warm light and the vignette are drawn on a small canvas that the
  page stretches over the map (`#air`), not painted over the whole map each frame.

## Names, sound and motion (Step 5, part two)

- **The family's name** (`src/names.js`, word lists and rule in `docs/LINEAGE_FAMILY_NAMES.md`).
  Right after the first tap, before generation 1, time waits for "What will you call your
  family?": three names made from the family's habitat and the traits that stand out in it
  ("The Mossfoot family"), each with a speaker. After 20 seconds one is picked for you ("We
  picked a name for you."). The name then appears everywhere the child's animals are named:
  "Your Mossfoot family is smaller than last generation.", "Your Mossfoot animals with smaller
  eyes: 20 → 27", the ending title. Every new story asks again.
- **Sound** (`src/sound.js`): Web Audio, made in the browser, no sound files. A soft bed for the
  habitat on screen, crossfading as the camera moves: leaves and now and then a bird in the high
  leaves, a breeze over a low hum on open ground, waves at the water's edge. Quiet cues: a chime
  when a newborn glows, a note that rises with each count of a spread, a low tone for "Wait!", a
  falling tone for "It disappeared", a warm chord for the reveal. Sound starts on the first tap;
  the button in the top-right corner turns it off and on, remembered on the device;
  `?sound=off` starts muted.
- **Animals that move like animals** (`src/herd.js`): a small bob and nod with each step, now
  and then a flick of the tail, a pause to look one way and then the other, the head down while
  grazing. Babies still stay near their mothers. The motion has its own random numbers, so the
  animals' wandering and home spots are as they were.

## Small screens and touch

- **A phone** (a screen under 600 px high or wide, `styles.css`): the generation panel is a slim
  bar with the generation number, the sun on its bar and your group's count beside its dot. A
  tap opens the whole panel and another tap closes it. On an iPad the panel is as it was. On a
  short screen (a phone held sideways) the narration is smaller, so the line and its speaker
  take about a fifth of the screen at most; the hint sits beside the bar, or under it on a phone
  held upright.
- **Zoom** (`src/main.js`): two fingers pinch the map from 0.6× to 2.5×, around the spot between
  them. Panels, buttons and text never zoom, and neither does the page. One finger still drags
  and a tap still taps; a pinch never counts as a tap. Zoomed out, a tap reaches an animal from
  as far on the screen as at 1× (34 px from its middle, 46 px for a glowing newborn); zoomed in,
  a little farther (`Herd.hit`). The + and − buttons under the sound button zoom by a quarter;
  a card or a panel covers them. A trackpad pinch (ctrl and the wheel) zooms the map too.
- **The story's zoom** is 1× on an iPad and 1.25× on a phone, so an animal is about as big
  under a finger. "Back to my family" / "Back to my group" goes back to it.
- **The arrival** settles on the first family up to 1.5× closer than that, where the panels,
  the hint and the narration leave most of the family clear (`bestFrame`). The first tap goes
  back to the story's zoom, unless the child has zoomed.

## What is real

- Each engine birth adds a baby beside its mother. Each engine death removes an animal. Each
  body mutation at birth big enough to see (0.12) can make a newborn in your group glow, under
  the calm rule (story.js); nothing else flashes.
- Between generations the animals only wander, inside the habitat their inherited time
  allocation gives them.
- Every count on screen and in the log is read from the engine state.

`lineageGame` in the browser console is the live game. Each generation is also logged there.

## Design shortcuts (preparing Step 4)

`?moment=NAME` opens the game straight into one moment, in a real game state (scope decisions 27, 31, 34, 42 and 44). The moments are arrival, naming, generation, variation, follow, spreading, fizzled, danger, blocked, fairtest, grow, shrink, choice, prediction, prediction-result, ending, extinct and card, and each works with `?seed=` (and `?sound=off`) too. The links are on `moments.html`, which the game does not link to.

`src/moments.js` finds a story that reaches the moment, using observer runs on throwaway copies of the world. It then plays the game forward to it: tap, watch, the same choices. It changes nothing in the game or the biology. Screenshots of every moment are in `design/current/` (before Step 5) and `design/after/` (after it, with a phone held sideways too); `design/compare.html` shows them side by side.

## Smoke test

```bash
cd game && npm test
```
