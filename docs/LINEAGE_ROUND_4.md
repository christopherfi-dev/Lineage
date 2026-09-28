# LINEAGE — Round 4: "Where will your family live?" first, then everything else

## Rules for every part

- No percentages anywhere a child can see.
- A speaker on every child-facing line.
- Lines under about 13 words.
- Tap targets 44 px or more.
- No network calls.
- Smooth on an iPad.
- Keep all tests passing.
- Do not edit `lineage-m1/src`.
- Record every decision in the scope doc.
- Do not merge anything. One pull request, one commit per part, a report per part.

---

## PART 1 — THE GATE: the first choice must fill a new place fast

**This is the most important part of the round. Nothing else is built until it passes.**

### Marc's design

Every story's first choice is **where the family will live**. Three real babies from the child's family glow, each with its card:

- "This baby seems to prefer living near the water."
- "This baby seems to prefer the high trees."
- "This baby seems to prefer the open ground."

The child picks one. The game fast-forwards, with a live counter ("Your line near the water: 2… 5… 11… 20!"), until about **20 of the child's line live in that place**. Then it returns to real time. From then on, the trait choices happen in that place.

### Targets (must all be met)

Measure with the simulated child: every founding family, seeds 1–30, each of the three choices.

1. **Available at once:** a baby preferring each place exists in the child's family within the first 2 generations, in at least 95% of stories for each place.
2. **Fills fast:** after the choice, the line reaches **20 living in the chosen place within 4 generations in at least 90% of stories**, for each of the three places, with a median of 3 generations or fewer.
3. **Stays:** once it reaches 20, at least 90% of the line lives in that place for the rest of the story.
4. **Still honest after:** in the chosen place, helpful trait follows still grow the line (90%+ bigger 3 generations later) and harmful ones still shrink it (90%+). The Part 1 promises of earlier rounds still hold: adaptation by generation 40 in each place, all three places alive at the story's end, no luck in who survives.

### What you may adjust to meet the targets

Adjust these, in Classroom mode and the starting world only:

- **The ancestors.** Vary where the ancestors like to be. Most live on the open ground, but every founding family includes some that lean toward the water and some toward the trees, and families sit across the open ground so some are near each border.
- **How the preference is passed on.** For example: the baby takes the preference of the parent that lives in the new place; or a baby inherits the preference if either parent has it; or the preference is inherited at full strength rather than halved.
- **Who pairs up.** Animals that like the same place pair with each other more.
- **Births in an empty place.** More babies survive when there is plenty of room, which is honest: there's more food.

### What you must not change

- No luck in who survives.
- The direction of every trait's effect in every place (the table).
- The M1 engine.

### If the targets can't be met

If no combination of the allowed adjustments meets all four targets, **stop after Part 1** and report the best numbers for each adjustment tried. Do not build Parts 2–4.

### Report

For each place, one line each:
- how often and how soon each preference is available;
- generations to reach 20 (median and 90th percentile);
- how often 20 is reached within 4 generations;
- the share of the line staying in the place;
- the adjustments chosen, and why.

---

## PART 2 — The first choice on screen (only if Part 1 passes)

1. **The flow.** The first tap picks a family (at least 13, with a future) → naming → **Choice 1: "Where will your family live?"** with the three real babies, each drawn in its preferred place, with a speaker. If a preference isn't available yet, its card says "Wait a generation." and fills in when a baby appears.
2. **The move.** Choosing moves the line: the line becomes the chosen babies and their babies who inherit the preference. Fast-forward with the live counter until about 20 live there (or the Part 1 limit), then slow back to real time with the camera on the new home.
3. **Choosing the open ground** means staying: the same flow, and the line becomes those that prefer the open ground.
4. **After Choice 1,** the usual trait choices begin, inside the chosen place.

---

## PART 3 — Everything else from Marc's playtests

1. **Blue means chosen.** Babies of the line that move to another place become relatives, unless the child follows them. Blue is only ever the child's line, in one place.
2. **Narrate places filling up:** "Lots of room here!" when the line arrives in a nearly empty place, and later "It's getting full. The best swimmers are winning." (use the place's key trait from the table).
3. **Other groups explain themselves.** A card for another group at a place it reached first: "They got here first. Now [key trait] is starting to matter."
4. **Glow balance.** When a trait that helps or hurts in the line's place is glowing or available, at most one glowing baby may be a "~" or neutral trait. Helpful and harmful traits glow first.
5. **No fast-forward when a follow starts with fewer than 3.** Those lines are watched in real time, so every harmful decline is seen.
6. **"Why?" only the first time** a trait's result appears in a place (when it becomes a Field Guide discovery). After that, show the table's reason as a line, with no guess.
7. **Keep the early-ending screens** for a whole line dying out.
8. **The repeating chime.** Check what chimes repeatedly while nobody is touching the iPad, and make idle sound quieter and less frequent.

---

## PART 4 — Measure the whole story and report

Use the simulated child, choosing each place in turn, seeds 1–30. One line each:
- Choice 1 to 20 living there (generations and minutes);
- follows per story by kind (helpful, harmful, "~"/neutral);
- traits added up;
- "Why?"s per story;
- seconds a harmful decline is watched;
- story minutes;
- how often the end-of-story reveal is a water animal after choosing water, a tree animal after choosing trees, and an open-ground animal after choosing open ground.

---

## For every part

- Add moments for the new screens: `choose-place`, `moving`, `arrived`, `filling`.
- Reshoot `design/after/` (iPad sizes plus 844×390) and update `design/compare.html`.
- Measure frame times as before.

Then open one pull request into main (do not merge it), with a report per part and a five-line summary.
