# LINEAGE — Round 5: every animal reachable, the win, the collection

The architect's brief for Round 5, after Marc merged PR #29. One pull request, one commit per part, a short report per part, then a five-line summary. Do not merge anything. Do not edit `lineage-m1/src`. Record every decision in the scope doc.

## Rules throughout

- No percentages a child can see.
- A speaker on every child-facing line.
- Lines under about 13 words.
- Tap targets 44 px or more.
- No network calls.
- Smooth on an iPad.
- All tests passing.

## PART 0 — Decisions on PR #29's six questions

1. No following into another place; Choice 1 is the only move; blue stays in one place.
2. "Stays" as built is right.
3. Accept the water's edge at 90%.
4. Keep the early endings as they are.
5. Choosing the open ground gets its own moment instead of "Lots of room here!": "Your family stays on the open ground." then "It's crowded here already. The fastest runners will win."
6. Keep the line taking in its place.

## PART 1 — THE GATE: every animal in the collection must be reachable

**Problem:** Classroom biology drives every line in a place to the same body, so every water story ended as a river otter, every tree story as a koala. The animals in `docs/LINEAGE_REAL_ANIMAL_REVEAL.md` are the children's goal; they discover which animal their line becomes, so different lines must be able to become different animals.

**Idea:** in each place some traits are required (they help there, so every line gets them) and some are free (they don't decide survival there, so the child's follows decide them). The free traits decide which animal the line becomes.

1. **More realistic rules.** Change the Classroom table only where real animals support it, so each place has free traits. Water's edge: thick fur becomes free (otters and beavers have very thick fur that keeps them warm in water); big eyes become free (seals have big eyes for seeing underwater). Check the high leaves and the open ground and propose any other realistic change, with the real-animal reason. Keep required traits' directions. Update `docs/LINEAGE_WHY.md` for any changed row, in kid words.
2. **Target 20 animals (a 5 × 4 grid).** Keep the existing 17 where they can be made honest; add realistic ones to reach 20 (candidates with images ready: mink, muskrat, red panda, lemur, jerboa, cheetah). If 20 can't all be reachable, use 16 (4 × 4); if fewer, 12 (4 × 3). The grid holds exactly the animals a child can really reach. For each animal: its place, its required traits, and the free and neutral traits that set it apart (e.g. coat colour for the arctic fox). You may adjust profiles or move an animal to the place that fits it best; swap one only if it can't be made honest. New animals get a true kid-level "Did you know?" fact under 12 words, listed for Marc to check.
3. **Targets** (simulated child, seeds 1–30): each animal reached in at least 80% of tries by a child who chooses its place and follows its free traits when they glow, within about 8 minutes; a child following random glows ends as at least 8 different animals, none above about 25%; earlier promises still hold (helpful follows grow the line, harmful shrink it, no luck in survival, all places alive at the end).

If fewer than 12 animals are reachable, stop after Part 1 and report the recipes and numbers. Otherwise report the grid size and its animals.

## PART 2 — The win: when the line fits its home

1. The line fits its home when it is at the helpful end of every required trait in its place and no helpful variation is left to find. That is the win.
2. Celebration: "You did it!" / "Your [name] line became swimmers, like a river otter." (the animal from the line's actual traits) / what they followed and why it helped ("You followed webbed feet and a sleek body. They push through water.") / "The water chose a strong tail too." (Part 4) / the "Did you know?" fact / "Your line fits the water's edge now. Almost any new change would make things worse." Then the reflection steps, the start/end drawings, Field Guide and story card as now.
3. No more forced bad choices: the backup panel never opens when every option is harmful. When nothing helpful is left, go to the win instead of pushing choices.
4. Fallback at the last generation: "Your line is still changing. Keep going next time?", with the reflection steps and the animal it most resembles.
5. A harmful follow stays a detour ("Back to your line"); the line can still reach the win.

## PART 3 — The collection

The grid's animals as cards: found ones show their image, the rest are mystery cards (a "?" with the place mark). "You've evolved 5 of 20." (real grid size). Shown after the reveal and from a button on the start screen. Kept on the iPad like the Field Guide; cleared by the teacher's "Start fresh"; listed on the teacher journal page. Children discover; there is no target to pick.

## PART 4 — "Chosen by the place"

When a helpful trait rises in the line without the child following it, add a chip in a different style: "Strong tail: chosen by the water" (the trees and the ground likewise). Narrate once when it first appears: "The water is choosing too. Strong tails are winning here."

## PART 5 — "Try another place"

After the reveal, offer "Try another place": a new story in the same world from the same family, with Choice 1 again, so a child can compare places. Keep "New world".

## PART 6 — The opening: "How many can you discover?"

1. After the arrival mist and before the first tap: the grid of cards appears face down; "These are the animals you can become." then "How many can you discover?" (read aloud). The cards flip one after another quickly, each showing the animal, its name and a small place mark (leaves, ground, water), with a quiet card sound. Then the cards puff away (soft dust or leaf puff) and the game starts with "Tap an animal to follow its family."
2. Cards already found on this iPad stay showing their image; the rest flip to show the animal and settle as mystery cards, so the child sees what's left to find.
3. About 5–6 seconds; a tap skips to the end; shorter (about 2 s) on later stories in a session; from the collection button it doesn't puff away.
4. Images: Marc uploaded about 23 images made with Google Gemini to `design/animals/`, named by animal (e.g. `river-otter.jpg`), with `CREDITS.txt`. Use them for the opening, the collection and the reveal, only for the grid's animals. Crop each to the same card shape with the animal centred, resize to about 400 px wide, compress (WebP or JPEG, under about 60 KB each), and keep the originals out of the game's load. Add the name and place mark in the game's style. One file per animal id, so a replaced image drops in without code changes. Keep `CREDITS.txt` and add a small "Image credits" line on the collection screen. If an image is missing or clearly wrong (wrong number of legs, wrong animal), use a clean placeholder and list it in the report so Marc can remake it.

## PART 7 — Measure the whole thing

Simulated child, seeds 1–30, each place, one line each: story minutes to the win (target about 5–8); how often the win comes before the time limit; which animals are reached and how often, per place; follows per story by kind; how often a child is offered only harmful options (target: never forced); "chosen by the place" chips per story.

## For every part

Add moments (win, collection, chosen-by-place, try-another-place, intro-flip, intro-puff, intro-found); reshoot `design/after/` at iPad sizes plus 844×390; update `design/compare.html`; measure frame times as before.
