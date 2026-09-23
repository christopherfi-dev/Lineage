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

## The story (scope decision 6)

The rules are in `src/story.js`, with every number at the top of the file:

| constant | value | what it does |
| --- | --- | --- |
| `GENERATION_SECONDS` | 8 | real seconds per generation while watching |
| `WATCH_GENERATIONS` | 3 | generations watched before each choice point |
| `CHOICE_SECONDS` | 20 | time to choose before one option is picked at random |
| `SKIP_GENERATIONS` | 10 | generations fast-forwarded after each choice |
| `FAST_SECONDS` | 0.8 | real seconds per generation in a fast-forward |
| `STORY_CHOICES` | 5 | the story ends after this many choices |

1. **Time waits for the child.** The animals wander from the start, but generation 1 begins
   only when the child taps an animal and follows its family.
2. **Choice points.** After the watch, the world pauses: "Which one will you follow?" Two or
   three family members are offered, each drawn from its real genome with one line naming its
   variation ("This one has webbed feet."). Each carries a different variation that at least
   3 family members carry. With fewer than two such variations, there is no choice yet and the
   story keeps watching.
3. **Following a choice** narrows the story to the mother lines of every family member carrying
   that variation, then fast-forwards `SKIP_GENERATIONS` at `FAST_SECONDS` each.
4. **Endings.** The story ends when the followed line dies out ("Their story lasted N
   generations.") or after `STORY_CHOICES` choices ("Your family survived N generations."). The
   reflection screen lists the family's traits in plain words, the choices made and one question,
   with "Try another family in this world" (same seed, generation 0) and "New world" (new seed).
   A marked placeholder holds the place of the real-animal reveal for surviving families.

The child chooses whom to follow, never what mutates: following is observer state only, and the
random pick uses the browser's `Math.random`, never the engine's generator.

**Variations** (`src/variations.js`). Every engine trait is a number from 0 to 1. A family's
usual form is its median for each trait. A member carries a variation when one trait is at
least `APART` (0.12) from that median, in one direction. Words come in three levels for each
trait (for example feet: no webbing, some webbing, webbed).

## What is real

- Each engine birth adds a baby beside its mother. Each engine death removes an animal. Each
  body mutation at birth flashes: in your family the newest flash is bright and the one before
  it dim; any other newborn with a mutation glows faintly for one generation.
- Between generations the animals only wander, inside the habitat their inherited time
  allocation gives them.
- Every count on screen and in the log is read from the engine state.

## Families (scope decision 5)

A family is a mother line, computed in `src/families.js` from the engine's birth records. The
engine has no sexes, so the "mother" is the first parent in each birth record. The first tap
follows the family of the tapped animal's ancestor 3 generations back through that line. After
that, tapping any animal only shows a label; only choice points change whom you follow.

`lineageGame` in the browser console is the live game. Each generation is also logged there.

## Smoke test

```bash
cd game && npm test
```
