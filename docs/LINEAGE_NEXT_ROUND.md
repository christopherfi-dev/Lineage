# LINEAGE — Next round: decisions on Part 1, then Parts 2–6

Marc's full playtest feedback, continued. The previous message was cut off in the Part 3 table; this file is the complete version.

## Rules for every part

- No percentages anywhere a child can see.
- A speaker on every child-facing line.
- Lines under about 12 words (13 at most).
- Tap targets 44 px or more.
- No network calls.
- Smooth on an iPad.
- Keep all 17 animals, facts, names and moments working.
- Record every decision in the scope doc.
- Do not merge anything. One pull request, one commit per part, a short report per part.

---

## Decisions on Part 1 (PR #25)

1. **Confirmed:**
   - the inferred Big eyes and Sleek body rows;
   - "~" is exactly 0;
   - the tie order (older makes room first);
   - Classroom mode living beside M1 in `lineage-classroom/`;
   - default seed 13.
2. **Families:** each parent's family gets one of a pair's two babies (95% / 96% at generation 5). This changes decision 5's mother lines; record it.
3. **Only traits that matter in that place can be followed.**
   - A neutral trait, or a "~" trait in the place where the family lives, still glows and can be tapped.
   - Its card explains instead of offering a follow: "Pointier ear tips don't help or hurt. Nothing to test here." / "Webbed feet don't matter much on open ground." Only "Keep looking" is offered.
   - Only ✓ and ✗ traits in that place can be followed, so every fair test gives a clear result.
   - The push panel offers only ✓ and ✗ traits.
   - This replaces the neutral and "~" fair-test promise.
4. **Promise wording:** helpful/harmful are measured "at generation 5". The "at some point within 5" figure is reported alongside.
5. **Glows:** re-measure after Part 2.
6. **Go ahead with Parts 2–6.**

---

## PART 2 — Choosing

1. **A family with a future.** The arrival opens on a family with a future. At the start, a family that an observer run shows dying within about 8 generations can't be picked: "This family is in trouble already. Try another!"
2. **Visible glows.** Glowing babies are much easier to see: bigger, brighter, gently pulsing, with a small sparkle above.
3. **Fair tests inside the family.** The test is your animals with the trait against your animals without, twins matched on age and on fitness from their other traits (as measured in Part 1). Only if there are too few, animals from nearby fill in, preferring those that share the family's earlier chosen traits. Keep the join line with real numbers.
4. **A follow never moves the family.** Groups form in the place where most of the family lives. A baby living elsewhere says so on its card: "This baby lives in the high leaves, away from your family." Any real move over generations is narrated: "Some of your animals are moving to the water's edge."
5. **No reversing.** Once the family has gone one way on a trait, the opposite direction isn't offered. The exception: a fair test clearly showed the chosen direction hurting. Then offer it with the reason, e.g. "Chunkier bodies are doing better up here. Go back?"
6. **"Passed on" replaces "spread" everywhere:**
   - "Will it be passed on?"
   - "Webbed feet are being passed on. 3… 7… 12 have it now."
   - "It wasn't passed on. Most new traits aren't."
7. **The two buttons.** "Try another family" keeps this world as it is now and lets the child tap a living family; it restarts only if the story reached generation 76. "New world" starts fresh.
8. **"Your family so far."** Each chosen trait appears as a chip, added at each follow. A trait that fades greys out with a reason.
9. **Performance with big families.** A persistent family can mean 100+ of the child's animals on screen, and last round showed 132 ms per frame when each draws a glow and a lit outline. Draw the child's animals cheaply when there are many (for example, a shared outline style without per-animal glows) and keep glows for glowing babies only. Report frame times for a family of 100+ in view.
10. **Measure** story length, glows available, and fair-test results with the family-first groups, as in Part 1.

---

## PART 3 — Understanding why

Use this table everywhere. Put it in `docs/LINEAGE_WHY.md` for Marc to check, and keep each direction matched to the Classroom table.

| Trait | High leaves | Open ground | Water's edge |
|---|---|---|---|
| Webbed feet | ✗ "Webbing makes it hard to grip branches." | ~ "Webbed feet don't matter much on open ground." | ✓ "Webbed feet push through water." |
| Curved claws | ✓ "Curved claws grip the branches." | ~ "Claws don't matter much on open ground." | ✗ "Claws get in the way when swimming." |
| Thick fur | ~ "Thick fur doesn't matter much in the trees." | ✓ "Thick fur keeps them warm on open ground." | ✗ "Thick, wet fur slows swimming." |
| Long back legs | ✓ "Long back legs help them leap between branches." | ✓ "Long back legs help them run fast." | ✗ "Long legs drag in the water." |
| Strong tail | ✗ "A heavy tail makes climbing harder." | ✗ "A heavy tail slows them down on land." | ✓ "A strong tail helps them swim." |
| Big eyes | ~ "Big eyes don't matter much in the trees." | ✓ "Big eyes spot things across open ground." | ✗ "Big eyes don't help underwater, and cost energy." |
| Sleek body | ✗ "A sleek body is hard to climb with." | ~ "Body shape doesn't matter much on open ground." | ✓ "A sleek body slides through water." |
| Coat, ear tips, tail tip | "[Trait] doesn't help or hurt anywhere." | same | same |

1. **Every change gets a reason.** When the child's group grows or shrinks, or the others do, one line names the biggest helper and the biggest hurter for that group in its place, from the table: "Your group is shrinking. Webbed feet help them swim. But long legs drag in the water."
2. **See, guess, explain** (Marc's original order). At each fair-test result and at a sudden drop, first a quick tap-to-guess ("Why is your group shrinking?", with 3 options from the table), then the explanation.
3. **The "passed on" narration uses the table:** "Webbed feet are being passed on. They push through water."
4. **"Helping here / Hurting here."** A small, always-visible note for the child's group, from its actual traits in its place.
5. **The ending clue becomes "same trait, different place".** It starts from the group's own place and uses the trait that mattered most: "Webbed feet at the water's edge: 12 → 25. Webbed feet in the high leaves: 12 → 1."
6. **Predictions use the same table** and always name the chosen trait and the place: "Your animals now have longer back legs. They live in the high leaves. What will happen?"

---

## PART 4 — Connection

1. **A family tree strip.** The tapped animal is the family's first mother. Each followed baby is added: great-grandmother → grandmother → mother → this baby. Each is a portrait drawn from her real genome, so the child can see the family change along the row.
2. **A living portrait.** The group's average body in the corner, redrawn each generation. Tapping it opens "Your animals, on average".
3. **Names.**
   - Fresh names every story, from bigger word lists.
   - Plus "Type your own": letters only, up to 12, with a small filter so nothing rude appears.
   - Plus "Use my name": builds a family name from the child's first name, e.g. "Mia" → "the Miapaddle family".
   - Nothing typed leaves the iPad.

---

## PART 5 — The ending and reflection

1. **The ending becomes short steps,** one screen each, with Next:
   1. **What happened:** "When you started" and "At the end" drawings, the family tree strip, and the result.
   2. **Your idea:** a required answer. Either the sentence builder, "My animals [did / didn't] survive because their [trait ▾] [helped / didn't help] at [the place ▾].", filled from the family's own traits and places, or "Type my own".
   3. **Check my idea:** compare the answer with the evidence and the table. "Yes! Big eyes don't help underwater, and cost energy." or "Good thinking. But webbed feet helped here. What else did they have?"
   4. **The reveal:** the animal reveal and its fact, as the reward.

   The play-again buttons appear only after step 2 is answered.
2. **My Journal.** Each story's name, drawings, choices, the child's answer and the result, saved on the iPad (localStorage), on a page the teacher can open.
3. **The Field Guide.** The 21 trait-and-place discoveries. One unlocks when the child sees a fair test show that trait's effect in that place: "You discovered: webbed feet help at the water's edge." It shows "You've discovered 9 of 21." The "~" entries unlock from their cards ("doesn't matter much here").
4. **Story card.** At the end, one picture: family name, tree strip, choices, result, reveal, and the child's own answer. The child can save or share it from the iPad (share sheet or download). No upload anywhere.

---

## PART 6 — Look

1. **Labels and borders.** Labels on the map ("High leaves", "Open ground", "Water's edge") with visible borders between the places.
2. **Where animals sit.** Animals in the high leaves sit among branches, not on top of the canopy. Water animals swim, not just wade.

A full art pass on the three places will come later from Claude Design; build only what's needed to make the places readable now.

---

## For every part

- Add moments for the new screens.
- Reshoot `design/after/` (iPad sizes plus 844×390) and update `design/compare.html`.
- Measure fair-test frame times as before.
- Keep the M1 tests, the Classroom tests and the game's load test passing.

Then open one pull request into main (do not merge it), with a report per part and a five-line summary.
