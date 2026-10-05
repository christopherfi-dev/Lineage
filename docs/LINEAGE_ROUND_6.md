# LINEAGE — Round 6: decisions on PR #30, the lynx, the mink, one button, no countdowns

The architect's brief for Round 6, after PR #30 (Round 5). Start a new branch from main. Do not merge anything. Do not edit `lineage-m1/src`. Record every decision in the scope doc. Same rules as Round 5: no percentages a child can see, a speaker on every child-facing line, lines under about 13 words, tap targets 44 px or more, no network calls, smooth on an iPad, all tests passing.

## Decisions on PR #30's seven questions, plus three more

1. Keep the four extra free cells (legs and tail in the high leaves; fur and tail on the open ground).
2. Swap the arctic fox for the lynx. Long legs are required on open ground, so every winning ground line has long legs, and real arctic foxes have short legs. Use `design/animals/lynx` for its picture, and check its "Did you know?" fact is true and under 12 words (list it for Marc).
3. No minimum line size for the win; keep "any line that fits".
4. One button after the ending: replace "Try another place" and "New world" with a single "Find another animal!", shown with the collection count ("You've found 3 of 12. Find another!"). It starts a fresh game in a new world, with the quick card flip showing which animals are still to find. The teacher demo keeps "Try another family".
5. Keep the places' different win times (high leaves quicker, water's edge slower).
6. When a move to a place dies out for the second time in a story: "That place is hard for your family. Try another?" and offer the place choice again.
7. Both new facts are confirmed true (cheetah, jerboa).
8. Test the mink. Marc has uploaded `design/animals/mink` (a water's edge animal; thick fur is now free at the water). Run the Round 5 gate for it (reached in at least 80% by a child who chooses the water and follows its signature; distinct from river otter, seal, beaver and platypus). If it passes, report whether it should replace one of the four water animals (keep the one that best spreads the random child's wins) or whether three more animals could now pass to make a 4 × 4 grid of 16. Don't change the grid without saying why.
9. Housekeeping: write "All animal images generated with Google Gemini." into `design/animals/CREDITS.txt`, and rename `design/animals/bush_bsby.jpeg` to `bushbaby.jpeg`.
10. No countdowns on questions. Marc saw children rushing: a timer bar runs across the screen while they read, so they tap without thinking. The prediction question, the "Why?" tap-to-guess, and every ending reflection step get no timer bar and never pick an answer or move on by themselves. The world waits until the child answers. Remove the bars from those screens, update the measurements' minutes to allow for reading time, and list which screens still have a countdown in the report.

## Then

Re-measure with the random child: animals reached at the win and how often each, per place. Reshoot affected moments (the ending, the collection, the opening, the prediction and "Why?" screens), update `design/compare.html`, measure frame times as before, and open a new pull request into main (do not merge it) with a five-line summary.
