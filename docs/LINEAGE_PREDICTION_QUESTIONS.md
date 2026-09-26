# LINEAGE — Prediction Journal Questions

Purpose: after some follows, the child predicts what will happen next. The game then shows the prediction beside what really happened. This table is how the game writes each question and its options from the story's real state. `game/src/journal.js` follows it and must match it.

Principle: nothing is ever called wrong, and there are no scores or points. Each question has one reasonable answer and two or three common Grade 3 misconceptions. The result only says what the child thought and what happened. After two of the misconceptions, one short line says why. Everything happens inside the game. There are no network calls, and no student data leaves the device (scope decision 25).

*Updated 2026-09-26 for family names (Step 5, `docs/LINEAGE_FAMILY_NAMES.md`): once the family has a name, the lines below name it. "Yours" reads "Your Mossfoot animals" (in the answers, the rows and the results), "yours" reads "your Mossfoot animals", and "your new group" reads "your new Mossfoot group". The lines below are shown without a name.*

*Updated 2026-09-24 for active choosing (scope decisions 32–35). A choice is now a follow, which starts a fair test: your group and "the others here", the same number of animals from the same habitat (10 to 20; scope decision 36). The question types changed to match.*

## When

- One question comes after the child's 1st, 4th, 7th, 10th and 13th follow. It comes right after the follow and before the fast-forward. The world waits while it is up.
- A follow from a glowing newborn's card, from the gentle "Follow them?" line, or from the backup choice panel all count. So does a random pick at "Time's up!" on the panel.
- There is one question with three or four tappable options, shown in a random order. Every line has a speaker. There is no typing.
- The child has 15 seconds to answer. The countdown stands still while a line is read aloud, for at most 60 seconds, as for choices (scope decision 15). It also stands still while a creature card is open.
- If the child does not answer, the story goes on without a prediction. Nothing is picked at random, because a random prediction means nothing.
- After a tap, the other options fade. "Let's see what happens after the fast-forward." shows for 2 seconds, then the fast-forward starts.

## The question types

The two types take turns: the 1st, 3rd and 5th prediction are about your group, the 2nd and 4th about the fair test. If the fair test has no other group (it never happens: a fair test starts with at least 10 on each side), the question is about your group.

| Type | Question | What is measured |
|---|---|---|
| Your group | "Will your new group grow or shrink?" | your group's size at the follow (the fair test's size) and at the next follow |
| The fair test | "Which will do better: yours or the others here?" | both groups' sizes at the next follow; both started at the same size, so the bigger one did better |

The variation words are the game's own ("more webbing between the toes", "a stronger tail"). The habitat is the fair test's. The ending resolves a prediction whose story ends before the next follow.

The earlier "ones not chosen" and "where" types (scope decision 30) went with the groups they were about. No group is made from an option not chosen, and a fair test's groups start in one habitat.

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

- **Grow or shrink, meaningful trait.** It is "grow" if the variation's direction helps in the fair test's habitat, and "shrink" if not.
  - "Grow. More webbing between the toes helps at the water's edge."
  - "Shrink. Less webbing between the toes doesn't help at the water's edge."
- **Grow or shrink, neutral trait.** "A lighter coat won't matter. Other traits will decide." Neutral traits never change who survives (scope decision 8).
- **The fair test, meaningful trait.** "Yours" if the variation's direction helps there, "the others" if not.
  - "Yours. A sleeker body helps at the water's edge."
  - "The others. More webbing between the toes doesn't help in the high leaves."
- **The fair test, neutral trait.** "About the same. A darker coat won't matter."

## The misconceptions

| Kind | Option | Offered | The idea behind it |
|---|---|---|---|
| need | "Grow. They'll grow webbed feet because they need them." | grow or shrink, when it fits (below) | Animals grow what they need. |
| need | "Yours. They'll grow webbed feet because they need them." | the fair test, when it fits | The same idea. |
| chose | "Grow, because I picked them." | grow or shrink, always | My choice changes the animals. |
| chose | "Yours, because I picked them." | the fair test, always | The same idea. |
| matters | "Grow. A lighter coat will help them." | grow or shrink, neutral trait | Every difference helps or hurts. |
| matters | "Yours. A darker coat will help them." | the fair test, neutral trait | The same idea. |
| same | "Stay the same. Animals don't change." | grow or shrink, if there are fewer than 4 options | Groups and bodies stay fixed. |
| luck | "About the same. It's all luck." | the fair test, meaningful trait, if there are fewer than 4 options | Survival is only luck. |

Options are listed in this order, and the screen shuffles them:
- the reasonable answer;
- "matters" (neutral traits only);
- "chose";
- "need", if it fits;
- "same" or "luck", if there are still fewer than 4.

**When "need" fits.** The fair test's habitat must clearly reward a trait: a net effect of 0.8 or more. The option names the most rewarded trait that your group doesn't already have (its average is not in the top third). If the group already has all of them, "need" is not offered.

| Habitat | Traits "need" can name, most rewarded first |
|---|---|
| High leaves | curved claws, long back legs |
| Open ground | long back legs, big eyes, thick fur |
| Water's edge | webbed feet, a sleek body, a strong tail |

## What the child sees afterwards

At the next follow, "Since your last choice" shows the last fair test: in the backup choice panel, or in its own sheet before the new follow goes ahead (scope decision 34). Under "Your prediction:" it shows the prediction's count rows and bars, then one short line.

| The child thought | Line |
|---|---|
| grow, shrink or stay the same | "You thought it would grow. It grew." |
| | "You thought it would shrink. It grew." |
| | "You thought it would stay the same. It shrank." |
| (if the group is gone) | "… It died out." |
| won't matter (neutral trait) | "You thought a lighter coat wouldn't matter. It didn't." |
| yours / the others / about the same | "You thought yours would do better. Yours did." |
| | "You thought the others would do better. Yours did." |
| | "You thought they'd do about the same. The others did." |
| (if both are gone) | "… Both died out." |

For the fair test the rows are both groups: "Yours (smaller eyes): 20 → 27" and "The others here: 20 → 19". The bigger one now did better. If they are equal: "They did the same."

After two of the misconceptions, one more line follows:

- **need:** "Animals can't grow a trait because they need it. Babies are just born different."
- **chose:** "Your choice doesn't change the animals. It picks who you follow."

The other misconceptions get no extra line, because the rows and the result show what happened. When the child has followed a neutral trait, the sheet already says "A lighter coat didn't change who survived." (scope decision 8).

## The ending

The ending lists the story's predictions under a small heading, "Your predictions". Under it is the line "A story from the simulation." Each prediction shows its question, its count rows and bars, and its lines, as above.

## Measurements

Measured on 2026-09-24 on 270 stories (30 good seeds × 9 founding families) with a simulated child and the game's own code. The child follows the first meaningful glowing variation that can start a fair test, after at least 40 s of watching. On the backup panel it takes the first option.

- **Predictions per story:** median 2 (mean 2.4).
  - 0: 46 stories, whose family ended before a follow; 1: 50; 2: 58; 3: 29; 4: 52; 5: 35.
  - There are fewer than before (median 5 with the fixed schedule), because stories are shorter (median 41 generations) with a median of 6 follows.
- **Questions:** 636 in all: 375 about your group and 261 fair tests.
- **"Need" offered:** in 604 of 636 questions (95%): your group 357 of 375, the fair test 247 of 261.
- **Options:** four in 604 questions, three in 32.
- **The reasonable answer came true:** your group 229 of 375 (61%); the fair test 147 of 261 (56%).
- **Line length:** 280 lines were checked (the journal's and the new follow, watch and fair-test lines), and every sentence is 12 words or fewer. The longest is "You now follow 20 animals with less webbing between the toes." (11 words). The "need" line has two sentences, of 8 and 6 words.

*Before active choosing, with the fixed choice schedule (2026-09-24, Step 6):*
- *A median of 5 predictions per story. "Need" was offered in 986 of 1,061 questions (93%).*
- *The reasonable "where" answer came true in only 64 of 171 cases, about chance. No other way of measuring "did best" helped (42–52%).*
