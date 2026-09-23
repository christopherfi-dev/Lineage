# LINEAGE — the game

Built step by step from `LINEAGE_M2_CLASSROOM_SCOPE.md` (Steps 1 and 2 so far): the frozen
M1 engine runs the biology on the canvas from `design/Lineage World.dc.html`. The engine is
imported from `../lineage-m1/src`, never copied or edited. `src/engine.js` is the only
file that imports it.

## Run it

Serve the **repo root** as a static site, then open `/game/`:

```bash
python3 -m http.server 8000      # from the repo root
# open http://localhost:8000/game/
```

Plain ES modules, no build step. The world is M1's defining experiment: the fixture with its
webbing override, so the same webbed feet start in one canopy family and one shoreline
family. `?seed=N` picks another trajectory (default 6).

## What is real

- One engine generation (`advanceGeneration`) every `GENERATION_SECONDS` (8, in `src/main.js`).
  Between generations the animals only wander, inside the habitat their inherited time
  allocation gives them.
- Each engine birth adds a baby beside its mother. Each engine death removes an animal. Each
  body mutation at birth flashes: in your family the newest flash is bright and the one before
  it dim; any other newborn with a mutation glows faintly for one generation.
- Every count on screen and in the log is read from the engine state.

## Families (scope decision 5)

A family is a mother line, computed in `src/families.js` from the engine's birth records. The
engine has no sexes, so the "mother" is the first parent in each birth record. With no family,
tapping an animal follows the family of its ancestor 3 generations back through that line.
While you follow a family, tapping another animal only shows a label; tapping one of yours
offers "Follow just her branch." When your family ends, the world keeps running and any
animal can start a new group.

`lineageGame` in the browser console is the live game. Each generation is also logged there.

## Smoke test

```bash
cd game && npm test
```
