# LINEAGE — Round 8: no win without choosing, and the gate's second try

The architect's brief for Round 8, after PR #32 (merged). Start a new branch from main. Do not merge anything. Do not edit `lineage-m1/src`. Record every decision in the scope doc. Same rules as before: no percentages, speakers, short lines, 44 px targets, no network, smooth on an iPad, all tests passing.

## Answers to PR #32

- Stalls: keep "three in a row with the line never above 5".
- Camera: keep the 0.7 zoom-out until Marc's real-iPad check.

## Part A — Safety net, shipped now: no win without choosing

While the gate is off, a child who never followed anything must not get the win. If the line fits its home and the child made no follows in the story: no celebration and no collection card. Show the animal it resembles and: "The [water / trees / open ground] did all the choosing." then "Can you choose yourself next time?" (read aloud), then the reflection steps and "Find another animal!" as usual. Measure that the never-choosing child gets this ending and that every other child's wins are unchanged.

## Part B — The gate, second try: chosen directions keep improving

Marc's rule stays: the line never gets an adaptation the child didn't choose. The new reading: once the child has chosen a direction for a trait (e.g. more webbing), babies with even more of it in that direction stay in the line automatically, because the child already chose it. Only a new kind of difference needs a choice.

- A baby joins the line if, for every trait that matters in the line's place, it is either inside the line's band, or beyond it in a direction the child has already chosen for that trait.
- A baby with a difference in a trait the child hasn't chosen (either direction), or in the opposite direction of a chosen one, is a branch: a relative that glows and joins only if followed.
- Keep the "best reading" pieces from PR #32 (only the place's traits checked; inherited differences glow).
- Rethink the "chosen by the place" chips for this rule (e.g. show a chosen trait still improving), and say what you did.

Measure (seeds 1–30, all founding families, each place, 12 s generations, reading time included), with the same four children. Targets:

- never chooses: the line dies out before the win in at least 70%;
- one helpful choice, then stops: dies out in at least 60%;
- follows every helpful glow: wins in at least 85% in each place, within about 8 minutes;
- random glows: report wins and losses, and the animals reached.

If the targets are met, switch the rule on. If not, also measure each of these on top, and report every combination's table:

- (i) following a baby takes in all of its helpful differences at once, not just the glowing one;
- (ii) slightly fewer animals crowded out each generation in Classroom mode (report the smallest change that helps).

Switch the rule on only if a combination meets every target; otherwise leave it off (Part A keeps the safety net) and report.

## Moments, pictures, pull request

Add moments for the new screens ("did all the choosing", a chosen trait still improving), reshoot affected moments into `design/after/` at iPad sizes plus 844×390, update `design/compare.html`, measure frame times as before, and open a new pull request into main (do not merge it) with a five-line summary.
