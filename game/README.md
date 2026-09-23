# LINEAGE — the game

Step 1 of `LINEAGE_M2_CLASSROOM_SCOPE.md` (the bridge): the frozen M1 engine runs the
biology on the canvas from `design/Lineage World.dc.html`. The engine is imported from
`../lineage-m1/src`, never copied or edited. `src/engine.js` is the only file that
imports it.

## Run it

Serve the **repo root** as a static site, then open `/game/`:

```bash
python3 -m http.server 8000      # from the repo root
# open http://localhost:8000/game/
```

Plain ES modules, no build step. `?seed=N` picks a different engine world (default 1).

## What is real

- One engine generation (`advanceGeneration`) every `GENERATION_SECONDS` (8, in `src/main.js`).
  Between generations the animals only wander, inside the habitat their inherited time
  allocation gives them.
- Each engine birth adds an animal beside one of its two real parents. Each engine death
  removes one. Each body mutation at birth makes that newborn flash (bright this
  generation, dim the next, then gone).
- Every count in the corner and in the log is read from the engine state.
- **Tapping an animal follows its group:** a new tracer channel whose founders are the
  animals living in the tapped animal's habitat now. Your group is their living descendants
  that are at least half descended from those founders (the engine's focal-marker rule).
  The camera centres on them. Following is observer state only and cannot change the biology.

`lineageGame` in the browser console is the live game. Each generation is also logged there.

## Smoke test

```bash
cd game && npm test
```
