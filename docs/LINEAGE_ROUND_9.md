# LINEAGE — Round 9: one-parent inheritance, then the gate on

The architect's brief for Round 9, after PR #33 (merged). Marc's teaching decision: this is a lesson about adaptation, not genetics. We have been modelling two parents mixing their traits, and that keeps breaking the lesson: a line's babies take traits from mates outside the line, so they become branches, and a good choice doesn't reliably flourish. Simplify inheritance in Classroom mode, then turn the gate on.

Start a new branch from main. Do not merge anything. Do not edit `lineage-m1/src`. Record every decision in the scope doc. Same rules as before: no percentages, speakers, short lines, 44 px targets, no network, smooth on an iPad, all tests passing.

## Answers to PR #33

- The gate goes on (below).
- Part A ("The [place] did all the choosing.") stays as a fallback.
- With the gate on, retire the "chosen by the place" chips and keep "still improving".
- Keep `TAKE_ALL` and `fewerEvery` in the code, switched off.

## 1. New inheritance (Classroom mode only)

A baby is like its parent, sometimes born with one small new difference.

- Each baby comes from one parent and copies that parent in every trait: the 7 meaningful traits, the 3 neutral ones, and where it likes to live (keep Round 4's born-next-door rule for leaning parents).
- No mixing of two parents' traits. The simplest way: every adult has its babies on its own, keeping today's number of babies per animal (and more where there's room). Choose the cleanest way in the engine and explain it.
- About 3 in 10 babies are born with one new difference on one trait, a visible step, as now (tune if needed and say why).
- When the child follows a baby, add a line: "Its babies will have [webbed feet] too." (read aloud).

## 2. The gate, on

The line never gets an adaptation the child didn't choose.

- The line's babies are like their parents, so they stay in the line.
- A line baby born with a new difference glows; it joins the line only if the child follows it, otherwise it is a relative. Exception (Round 8's reading): a difference further the way the child already chose on that trait joins by itself.
- Following narrows the line to the followed animals, whose babies are like them.

## 3. Re-check every earlier promise with the new inheritance, and report each

- The places adapt by generation 40, and all three places are alive at 50 and 76.
- Choice 1: a baby preferring each place within 2 generations, and the chosen place reaches 20 within 4 generations, at least 90%.
- Every founding family has a future at the first tap.
- All 12 animals are still reachable (at least 80% each, for a child choosing its place and following its signature), and a random child reaches all 12.

If a promise breaks, adjust Classroom mode only (variation rate and step size, births with room, the leaners), and say what you changed.

## 4. Targets for the gate

Seeds 1–30, every founding family, each place, 12 s generations, reading included.

- After every helpful follow: the line reaches 20 in the fast-forward in at least 90% of follows, in every place.
- Follows every helpful glow: wins at least 85% in each place, within about 8 minutes.
- Never chooses: the line dies out in at least 70%, quickly (report minutes from the tap).
- One helpful choice then stops: dies out in at least 60% (relatives that keep improving should crowd it out).
- A harmful follow: that line dies out with a median of 3 minutes or less after the follow.
- Random glows: report wins, losses, minutes and animals.

If helpful follows don't reach 20 at least 90% of the time, stop and report exactly why: which line animals die each generation and of what, how many babies they have, and how many leave the line and on which trait.

## 5. Shipping

Ship the new inheritance and the gate on only if every promise and target is met. Otherwise report the tables and leave the shipped game as it is.

## 6. The win

At the win, list what the home needed, all chosen by the child: "You chose everything the water needs:" then the traits (short lines, read aloud). No stars.

## Docs, moments, pictures, pull request

Update `docs/LINEAGE_WHY.md` and the game README for the new inheritance. Add moments (a follow with "Its babies will have … too", a helpful follow climbing past 20, the win list), reshoot affected moments into `design/after/` at iPad sizes plus 844×390, update `design/compare.html`, measure frame times as before, and open a new pull request into main (do not merge it) with a five-line summary.
