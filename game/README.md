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
   three animals are offered, each drawn from its real genome with one line naming its
   variation ("This one has webbed feet."). Each carries a different variation that at least 3
   of the group carry. From the second choice on, the panel also shows how the last choice
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
   Tapping one shows how it did since the choice against yours: "Theirs: 26 → 32. Yours: 29 →
   52.", each beside its bars. A child never sees a percentage (scope decision 12).
5. **The camera.** Your group may spread across habitats. Every member stands in a soft glow,
   and "Back to my group" goes to the group's largest cluster.
6. **Endings.** The story ends when no living animal fits the group ("Their story lasted N
   generations.") or after the last choice point ("Your group survived 76 generations."). The
   reflection screen shows:
   - the group's actual average traits at the end (a dot marks each trait whose word changed
     since the start);
   - one question, then **a clue**: one line of real evidence, not the answer, about the group's
     most distinctive meaningful trait, counted in another habitat when the story began and now
     ("Animals with webbed feet at the water's edge: 12 then, 25 now."; zero is "none"). A clue
     that changed by fewer than 3 animals gives way to the next trait. See `src/evidence.js`;
   - for a surviving group, **the real-animal reveal**: the animal it is most like, from its
     actual average traits and main habitat, with its "why" lines (`src/reveal.js`, following
     `docs/LINEAGE_REAL_ANIMAL_REVEAL.md`);
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
   20 to 31". Child-facing lines stay under about 12 words.

The child chooses whom to follow, never what mutates: following is observer state only, and the
random pick uses the browser's `Math.random`, never the engine's generator.

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

## Smoke test

```bash
cd game && npm test
```
