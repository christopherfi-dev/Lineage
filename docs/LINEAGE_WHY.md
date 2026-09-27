# LINEAGE — Why a trait helps or hurts

Purpose: every change the child sees gets a reason in a child's words (scope decision 60). This is the table the game reads its reasons from. Marc wrote the lines; the directions are the engine's own Classroom table (`lineage-classroom/src/config.js`, `PLACE_EFFECTS`, scope decision 55). `game/src/why.js` holds the same lines, and `game/test/why.test.js` checks that every "doesn't matter much" line is exactly where the engine's effect is 0, and that the three neutral traits never matter anywhere.

✓ the trait helps there, ✗ it hurts there, ~ it doesn't matter much there (the engine counts it as 0).

| Trait | High leaves | Open ground | Water's edge |
|---|---|---|---|
| Webbed feet | ✗ "Webbing makes it hard to grip branches." | ~ "Webbed feet don't matter much on open ground." | ✓ "Webbed feet push through water." |
| Curved claws | ✓ "Curved claws grip the branches." | ~ "Claws don't matter much on open ground." | ✗ "Claws get in the way when swimming." |
| Thick fur | ~ "Thick fur doesn't matter much in the trees." | ✓ "Thick fur keeps them warm on open ground." | ✗ "Thick, wet fur slows swimming." |
| Long back legs | ✓ "Long back legs help them leap between branches." | ✓ "Long back legs help them run fast." | ✗ "Long legs drag in the water." |
| Strong tail | ✗ "A heavy tail makes climbing harder." | ✗ "A heavy tail slows them down on land." | ✓ "A strong tail helps them swim." |
| Big eyes | ~ "Big eyes don't matter much in the trees." | ✓ "Big eyes spot things across open ground." | ✗ "Big eyes don't help underwater, and cost energy." |
| Sleek body | ✗ "A sleek body is hard to climb with." | ~ "Body shape doesn't matter much on open ground." | ✓ "A sleek body slides through water." |

The neutral traits don't help or hurt anywhere:

- Coat: "Coat colour doesn't help or hurt anywhere."
- Ear tips: "Ear tip shape doesn't help or hurt anywhere."
- Tail tip: "The mark on the tail tip doesn't help or hurt anywhere."

A line always talks about the trait's far end ("webbed feet", "long legs"). The same line explains both ways of a variation: "Webbed feet push through water." is why more webbing does better at the water's edge, and why less webbing does worse there.

## Where the game uses the lines

- **A glowing baby's card** (scope decision 58): a trait that doesn't matter where the family lives can't be followed. The card gives its "~" line ("Webbed feet don't matter much on open ground."), or for a neutral trait "Pointier ear tips don't help or hurt. Nothing to test here."
- **Every change of the family's size** (the narration): what helps and what hurts the family in its place. The family "has" a trait when its animals there average at least halfway to the far end (`HAS_AT`, 0.5).
  - Growing: its biggest helper's line, then "But …" its biggest hurter's: "Webbed feet push through water." "But long legs drag in the water."
  - Shrinking, most of it crowded out: the helper's line, then "But …" the hurter's. With no hurter, the trait that most set the family's animals that died apart from the survivors where they lived (by 0.1 or more of its average): "Long back legs help them run fast." "Others here have longer back legs." (or, for a trait that hurts, "The ones that died had longer back legs."). Often no one trait did: the ones that died were a little less suited in many small ways.
  - Lines that are not from the table, when the table has no reason: "Lots of babies were born." (growing with no helper), "Some were old and died." (most of the family's deaths were of old age), "The place is full, so some made room." (crowded out, and no trait sets the family apart).
- **See, guess, explain:** at a fair test's result, and at a sudden drop of the family, the world waits and the child taps a guess. The three answers are one trait's lines for the three places, so the child has to think about where the animals live. Then why: "Yes! Big eyes spot things across open ground." or "Good thinking. But here, big eyes spot things across open ground."
- **Passed on:** "More webbing is being passed on. Webbed feet push through water." A trait that hurts there and wasn't passed on: "It wasn't passed on. Long legs drag in the water."
- **Predictions:** the reasonable answer gives the line for the fair test's place: "Grow. Long back legs help them leap between branches." (`docs/LINEAGE_PREDICTION_QUESTIONS.md`).
- **Helping here / Hurting here:** under the generation panel, what the family has that helps or hurts where it lives: "Helping here: webbed feet, a sleek body." "Hurting here: long legs." "Hurting here" shows only when it names a trait (scope decision 64): families soon lose what hurts where they live, so it is hidden almost all the time.
