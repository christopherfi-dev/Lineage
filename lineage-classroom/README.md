# LINEAGE — Classroom mode

The engine's Classroom mode (scope decision 55): M1's biology with no luck in who survives.
The game runs it; the original M1 mode in `../lineage-m1` stays exactly as it is.

It lives beside M1 rather than inside it because M1's own tests hash every file M1 ships, so
any edit there fails them. It is built from M1's own parts: mating, inheritance, mutation,
birth and death records, genealogy and model identity are imported, never copied.

What differs from M1:

- **Survival** (`src/classroom.js`). No random draw. An animal dies of old age at M1's maximum
  age. Every other animal lives in the place where it spends most of its time, and when more
  animals live there than it has room for, the ones least suited to it don't make it. Between
  equals, the older one makes room, then the one that spends less of its time there, then the
  one born later.
- **Inheritance** (`src/classroom.js`, scope decision 67). A baby gets each body trait whole from
  one parent or the other, a coin flip per trait, never the average, so a new trait isn't halved
  away before it can be passed on; then M1's usual chance of a new variation. It is M1's own
  `createChild`, handed both parents carrying the picked traits, with no drift. Time is inherited
  as in M1. `inheritance: "average"` in the config gives M1's rule, for comparison.
- **Fitness in a place** (`src/config.js`, `PLACE_EFFECTS`): each trait helps (+1), hurts (−1)
  or doesn't matter (0) there, in the direction of M1's own net effect. The table is in the scope
  doc, decision 55.
- **Variation and mixing** (`src/config.js`): more and slightly bigger body mutations; mates share
  at least half their time; babies inherit time only in their parents' places and next door, and
  now and then one moves next door.
- **The common-ancestor world** (`createAncestorWorld`): every founder on the open ground with
  M1's ancestral body. **The teacher demo** (`createWebbedDemoWorld`): M1's defining fixture.

A Classroom world carries its own model identity, so M1's `advanceGeneration()` rejects it and
Classroom mode rejects an M1 world.

```bash
npm test          # this folder: the Classroom mode's own tests
```
