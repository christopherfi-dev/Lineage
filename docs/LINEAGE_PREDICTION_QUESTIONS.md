# LINEAGE — Prediction Journal Questions

Purpose: after some choices, the child predicts what will happen next. After the fast-forward, the game shows the prediction beside what really happened. This table is how the game writes each question and its options from the story's real state. `game/src/journal.js` follows it and must match it.

Principle: nothing is ever called wrong, and there are no scores or points. Each question has one reasonable answer and two or three common Grade 3 misconceptions. The result only says what the child thought and what happened. After two of the misconceptions, one short line says why. Everything happens inside the game. There are no network calls, and no student data leaves the device (scope decision 25).

## When

- One question comes after the child's 1st, 4th, 7th, 10th and 13th choice. It comes right after the choice and before the fast-forward. The world waits while it is up.
- A random pick at "Time's up!" counts as a choice. A choice point that passes (fewer than two options) does not.
- There is one question with three or four tappable options, shown in a random order. Every line has a speaker. There is no typing.
- The child has 15 seconds to answer. The countdown stands still while a line is read aloud, for at most 60 seconds, as for choices (scope decision 15). It also stands still while a creature card is open.
- If the child does not answer, the story goes on without a prediction. Nothing is picked at random, because a random prediction means nothing.
- After a tap, the other options fade. "Let's see what happens after the fast-forward." shows for 2 seconds, then the fast-forward starts.

## The question types

The types take turns: the 1st prediction is about your group, the 2nd about the ones not chosen, and the 3rd about where. Then the turns start again. If a type does not fit, the next one in turn is used.

| Type | Question | Fits when | What is measured |
|---|---|---|---|
| Your group | "Will your new group grow or shrink?" | always | your group's size at the choice and at the next choice point |
| The ones not chosen | "Will the ones with more webbing between the toes grow or shrink?" | a group not chosen is shown (it started with 3 or more animals; scope decision 16) | the biggest such group's size, the same way |
| Where | "Where will animals with more webbing between the toes do best?" | the chosen variation is a meaningful trait (not coat, ear tips or tail tip) | your group's count in each habitat |

The variation words are the game's own ("more webbing between the toes", "a stronger tail"). The ending resolves a prediction whose story ends before the next choice point.

## The reasonable answer

It comes from the engine's own numbers. A trait's **net effect** in a habitat is what one unit of it does for survival there: its benefits in that habitat minus its upkeep. In the engine's terms, that is the zone weights times the trait's effects, minus the zone's scarcity times its upkeep.

| Trait | High leaves | Open ground | Water's edge |
|---|---|---|---|
| Webbing | −2.53 | −0.37 | 2.88 |
| Claws | 2.31 | 0.17 | −1.15 |
| Fur | 0.30 | 0.90 | −0.70 |
| Back legs | 0.93 | 1.89 | −1.07 |
| Tail | −0.63 | −0.80 | 1.42 |
| Eyes | 0.35 | 1.25 | −0.55 |
| Body (sleek) | −1.38 | −0.34 | 1.82 |

The neutral traits (coat, ear tips, tail tip) have no effect.

The reasonable answer for each type:

- **Grow or shrink, meaningful trait.** It is "grow" if the variation's direction helps in the group's main habitat, and "shrink" if not.
  - "Grow. More webbing between the toes helps at the water's edge."
  - "Shrink. Less webbing between the toes doesn't help at the water's edge."
- **Grow or shrink, neutral trait.** "A lighter coat won't matter. Other traits will decide." Neutral traits never change who survives (scope decision 8).
- **Where.** The habitat where the variation's direction helps most, e.g. "At the water's edge."

## The misconceptions

| Kind | Option | Offered | The idea behind it |
|---|---|---|---|
| need | "Grow. They'll grow webbed feet because they need them." | grow or shrink, when it fits (below) | Animals grow what they need. |
| need | "Anywhere. They'll grow what they need." | where, always | The same idea. |
| chose | "Grow, because I picked them." | your group | My choice changes the animals. |
| chose | "They'll disappear, because I didn't pick them." | the ones not chosen | The same idea. |
| matters | "Grow. A lighter coat will help them." | grow or shrink, neutral trait | Every difference helps or hurts. |
| same | "Stay the same. Animals don't change." | grow or shrink, if there are fewer than 4 options | Groups and bodies stay fixed. |
| home | "Where they live now." | where, if they live mostly somewhere else | Animals do best wherever they are. |
| luck | "The same everywhere. It's all luck." | where, always | Survival is only luck. |

Grow-or-shrink questions list their options in this order: the reasonable answer, "matters" (neutral traits only), "chose", then "need" if it fits. "Same" is added if there are still fewer than 4. The screen shuffles them.

**When "need" fits a grow-or-shrink question.** The group's main habitat must clearly reward a trait: a net effect of 0.8 or more. The option names the most rewarded trait that the animals don't already have (their average is not in the top third). If they already have all of them, "need" is not offered.

| Habitat | Traits "need" can name, most rewarded first |
|---|---|
| High leaves | curved claws, long back legs |
| Open ground | long back legs, big eyes, thick fur |
| Water's edge | webbed feet, a sleek body, a strong tail |

## What the child sees afterwards

At the next choice point, the "Since your last choice…" panel shows the prediction under "Your prediction:". It uses the panel's own count rows and bars ("Yours: 29 → 52"), then one short line.

| The child thought | Line |
|---|---|
| grow, shrink or stay the same | "You thought it would grow. It grew." |
| | "You thought it would shrink. It grew." |
| | "You thought it would stay the same. It shrank." |
| (the ones not chosen) | "You thought they would grow. They shrank." |
| (the ones not chosen) | "You thought they would disappear. They grew." |
| (either, if the group is gone) | "… It died out." |
| won't matter (neutral trait) | "You thought a lighter coat wouldn't matter. It didn't." |
| a habitat | "You thought the water's edge. They did best at the water's edge." |
| all luck | "You thought it wouldn't matter. They did best in the high leaves." |
| anywhere | "You thought anywhere. They did best on the open ground." |
| (where, if the group is gone) | "… They died out." |

For "where", the rows are the three habitats, with your group's count in each, then and now. "Did best" means the biggest growth, measured as (now + 1) ÷ (then + 1). Only habitats with at least 3 of the group, then and now together, are compared.

After two of the misconceptions, one more line follows:

- **need:** "Animals can't grow a trait because they need it. Babies are just born different."
- **chose:** "Your choice doesn't change the animals. It picks who you follow."

The other misconceptions get no extra line, because the rows and the result show what happened. When the child has followed a neutral trait, the panel already says "A lighter coat didn't change who survived." (scope decision 8).

## The ending

The ending lists the story's predictions under a small heading, "Your predictions". Under it is the line "A story from the simulation." Each prediction shows its question, its count rows and bars, and its lines, as above.

## Measurements

Measured on 270 stories (30 good seeds × 9 founding families) with random choices and the game's own code, on 2026-09-24.

- **Predictions per story:** median 5 (mean 3.9).
  - 203 of 270 stories get 5, 11 get 4 and 1 gets 2.
  - 55 get none: their group ends before the first choice.
- **Questions:** 1,061 in all.
  - About your group: 472.
  - About the ones not chosen: 418.
  - Where: 171.
- **"Need" offered:** in 986 of 1,061 questions (93%).
  - Your group: 437 of 472.
  - The ones not chosen: 378 of 418.
  - Where: 171 of 171.
- **Options:** four in 855 questions, three in 206.
- **The reasonable answer came true:**
  - Your group: 301 of 472 (64%).
  - The ones not chosen: 235 of 418 (56%).
  - Where: 64 of 171 (37%).
  - "Where" is about chance: with two or three habitats compared, chance is 33–50%. In 145 of 171 cases the group already lives mostly in the habitat that answer names.
  - Other ways of measuring "did best" did not help (42–52%):
    - comparing only habitats with at least 3 or 5 of the group at the prediction: 44% and 52%;
    - asking only when that habitat and another each hold at least 3, 5 or 8 of the group: 44%, 46% and 49%;
    - growth against the other animals living there: 45%;
    - the biggest gain in animals: 42%.
  - Over one fast-forward and one watch (5 generations), one variation barely shows in where a group grows.
- **Line length:** every sentence in the journal is 12 words or fewer (151 lines checked). The longest is "Will the ones with less webbing between the toes grow or shrink?" The "need" line has two sentences, of 8 and 6 words.
