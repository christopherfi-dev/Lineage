# LINEAGE — Round 7: Marc's playtesting

The architect's brief for Round 7, after PRs #30 and #31 (both merged). Start a new branch from main. Do not merge anything. Do not edit `lineage-m1/src`. Record every decision in the scope doc. Same rules as before: no percentages, speakers, short lines, 44 px targets, no network, smooth on an iPad, all tests passing.

## Answers to PR #31

The lynx fact is true; keep four animals per place; keep "Find another animal!" on the last step only. The water's length and the countdowns are handled below.

## Items

1. **The gate: your line never gets an adaptation the child didn't choose.** Marc: "My line never gets any adaptation that I do not choose." Today the line takes in every baby born to it in its place, so it improves on its own and a child who never chooses still wins (the passive child won every story).
   - A baby joins the line only if it is like the line: its meaningful traits match the line's current chosen profile (within the rule-B threshold). A baby born with a new variation, better or worse, starts a new branch and becomes a relative unless the child follows it.
   - So a line where the child doesn't choose stays as it is, while better branches among the relatives crowd it out in a full place. One good choice isn't enough; the line has to keep adapting.
   - Retire or rethink the "chosen by the place" chips (the place can no longer change the line); say what you did.

   Measure first, at 12-second generations (item 2), seeds 1–30, each place. Targets:
   - a child who never chooses: the line dies out before the win in at least 70% of stories;
   - a child who follows each helpful glow it sees: wins in at least 85%, within about 8 minutes;
   - a child who makes one helpful choice and then stops: the line dies out in at least 60%;
   - a child following random glows: report wins and losses;
   - helpful glows are available often enough for an active child (report how often).

   If these targets can't be met, don't ship this rule: report the numbers, and still build items 2–9.
2. **Faster generations.** A watched generation goes from 20 to 12 seconds. Tune glows to fit the shorter day (each available long enough to tap). At most one prediction per story. Report story minutes per place, with reading time.
3. **Nothing counts down or chooses for the child.** Remove the backup choice panel entirely. Remove the timers on naming, "Where will your family live?" (no random pick) and "Since your last choice" (Next only). Glowing babies keep appearing for the child to choose from.
4. **Idle pause.** After about a minute with no touch, the world freezes: "Still watching? Tap to keep going." A tap resumes.
5. **Small and stalled lines.**
   - Remove the small-line block (`DANGER_SIZE`): as long as the line is alive, glowing babies can be followed.
   - A harmful choice's first two generations are still watched in real time.
   - If a line stays tiny and isn't growing for about 2 generations with no glowing baby, fast-forward until something happens (a glowing baby appears, the line grows, or it dies out).
   - After about 3 stalls in a row: "Your line isn't growing. [Trait] doesn't matter much here." then back to the line before.
6. **Camera and panels** (Marc saw animals hidden under the panels and walking off the right edge).
   - When the child isn't exploring, the camera gently keeps the whole line inside the clear part of the screen (not under any panel), zooming out a little when the line spreads. Dragging the map still leaves the child alone until "Back to my line".
   - The camera may go a little past the world's edge, so a line at the edge can still be shown in the clear area.
   - The generation panel can fold to a slim bar with a tap on iPad too.
7. **The opening cards** (too fast to see).
   - The cards flip about half a second apart, then wait.
   - Tapping a card shows it big, with its name read aloud.
   - "Let's go!" makes them all puff away and starts the game. Nothing disappears until the child taps.
   - On later stories in a session the flip can be quicker, but it still waits for "Let's go!".
8. Report the passive, active, one-choice and random children's results; story minutes per place; how often a line stalls; and which screens, if any, still count down or choose for the child (target: none).
9. Add moments for the new screens (idle pause, stall, branch leaving, folded panel, opening waiting), reshoot `design/after/` at iPad sizes plus 844×390, update `design/compare.html`, measure frame times as before, and open a new pull request into main (do not merge it) with a five-line summary.
