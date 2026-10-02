# LINEAGE — Prediction Journal Questions

Purpose: after some follows, the child predicts what will happen next. The game then shows the prediction beside what really happened. This table is how the game writes each question and its options from the story's real state. `game/src/journal.js` follows it and must match it.

Principle: nothing is ever called wrong, and there are no scores or points. Each question has one reasonable answer and two or three common Grade 3 misconceptions. The result only says what the child thought and what happened. After two of the misconceptions, one short line says why. Everything happens inside the game. There are no network calls, and no student data leaves the device (scope decision 25).

*Updated 2026-09-28 for scope decision 68. The fair test is gone from what the child sees: a follow narrows the child's line to its animals with the trait, and the child compares only the line and "Your relatives here". The two question types are now "What will happen?", about the line with the trait (it grows, shrinks or dies out), and "Which will do better, your line or your relatives?". Both are resolved from that follow's line and its relatives there: at the next follow, when the line dies out, or at the ending. "Which did better" is judged by how much each grew, as on the creature cards (a tenth or more). The tables below are updated; the notes after this one are history.*

*Updated 2026-09-27 for Parts 2 and 3 (scope decisions 59 and 60). A follow now starts a fair test inside the child's family: its animals with the variation against its animals without it, in the family's place. The questions name the trait and the place: "Some of your animals now have longer back legs. They live in the high leaves. What will happen?" The reasonable answer gives the reason from `docs/LINEAGE_WHY.md`: "Grow. Long back legs help them leap between branches." Its direction is the engine's Classroom table (✓, ✗ or ~), not the old net effects. The two sides are "With longer back legs" and "Without". Only a trait that helps or hurts in the family's place can be followed (scope decision 58), so the neutral and "~" questions below no longer come up. Family names no longer change these lines. The tables below are the current ones.*

*Updated 2026-09-27 after Marc's first real play: the "need" option now always names the trait the child just chose ("They'll grow even bigger eyes because they need them."), so no option names a trait unrelated to the follow. It is offered in every question.*

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

The two types take turns: the 1st, 3rd and 5th prediction are about your line with the variation, the 2nd and 4th about your line against your relatives there. If the line has no relatives there, the question is about the line.

| Type | Question | What is measured |
|---|---|---|
| Your line | "Some of your animals now have longer back legs. They live in the high leaves. What will happen?" | the line, at the follow (its carriers) and when the next follow replaced it, it died out, or the story ended |
| Your line or your relatives | "Some of your animals now have longer back legs. They live in the high leaves. Which will do better, your line or your relatives?" | the line and your relatives in its place, at the same two times; the one that grew by a tenth or more than the other did better |

The variation words are the game's own ("more webbing between the toes", "a stronger tail"). The habitat is the line's place. The ending resolves a prediction whose line is still followed when the story ends.

The earlier "ones not chosen" and "where" types (scope decision 30) went with the groups they were about. No group is made from an option not chosen, and a fair test's groups start in one habitat.

## The reasonable answer

It comes from the engine's Classroom table (scope decision 55): each trait helps (✓), hurts (✗) or doesn't matter (~) in each place, and `docs/LINEAGE_WHY.md` gives each a reason in a child's words.

| Trait | High leaves | Open ground | Water's edge |
|---|---|---|---|
| Webbed feet | ✗ | ~ | ✓ |
| Curved claws | ✓ | ~ | ✗ |
| Thick fur | ~ | ~ | ~ |
| Long back legs | ~ | ✓ | ✗ |
| Strong tail | ~ | ~ | ✓ |
| Big eyes | ~ | ✓ | ~ |
| Sleek body | ✗ | ~ | ✓ |

The neutral traits (coat, ear tips, tail tip) have no effect anywhere.

*2026-10-02, Round 5 (scope decision 72): six cells are "~" now, where real animals of the place have the trait both ways (`docs/LINEAGE_WHY.md`): thick fur on open ground and at the water's edge, long back legs and a strong tail in the high leaves, a strong tail on open ground, big eyes at the water's edge. The examples below with those cells are from before.*

The reasonable answer for each type, with the reason for the fair test's place:

- **Your animals with it.** "Grow" if the variation's direction helps there, and "shrink" if not.
  - "Grow. Webbed feet push through water." (more webbing at the water's edge)
  - "Shrink. Webbed feet push through water." (less webbing at the water's edge)
  - "Grow. Big eyes don't help underwater, and cost energy." (smaller eyes at the water's edge)
- **Your line or your relatives.** "Your line" if the variation's direction helps there, "Your relatives" if not, and "About the same" if it doesn't matter there.
  - "Your line. A sleek body slides through water."
  - "Your relatives. Webbing makes it hard to grip branches."
  - "About the same. A darker coat won't matter."
- *Asked again since Round 3 (scope decision 65), when a neutral trait or a "~" there is followed: "A lighter coat won't matter. Other traits will decide." and "About the same. A darker coat won't matter." (Between decisions 58 and 65 such a trait couldn't be followed.) "Which will do better?" is judged by who made it, at the fair test's result.*

## The misconceptions

| Kind | Option | Offered | The idea behind it |
|---|---|---|---|
| need | "Grow. They'll grow even bigger eyes because they need them." | grow or shrink, always | Animals grow what they need. |
| need | "Your line. They'll grow even bigger eyes because they need them." | line or relatives, always | The same idea. |
| chose | "Grow, because I picked them." | grow or shrink, always | My choice changes the animals. |
| chose | "Your line, because I picked them." | line or relatives, always | The same idea. |
| matters | "Grow. A lighter coat will help them." | grow or shrink, neutral trait | Every difference helps or hurts. |
| matters | "Your line. A darker coat will help them." | line or relatives, neutral or "~" trait | The same idea. |
| same | "Stay the same. Animals don't change." | grow or shrink, meaningful trait (the fourth option) | Groups and bodies stay fixed. |
| luck | "About the same. It's all luck." | line or relatives, a trait that helps or hurts there (the fourth option) | Survival is only luck. |

Options are listed in this order, and the screen shuffles them:
- the reasonable answer;
- "matters" (neutral traits only);
- "chose";
- "need";
- "same" or "luck", if there are still fewer than 4.

**What "need" names.** Always the trait the child just chose, in the direction they chose it: "They'll grow even bigger eyes because they need them." For less of a trait it says "get": "They'll get even less webbing because they need it." Every question therefore has four options, and every option is about the follow.

| The child chose | "Need" says |
|---|---|
| more webbing / less webbing | grow even more webbing / get even less webbing |
| more curved claws / straighter claws | grow even more curved claws / get even straighter claws |
| thicker fur / thinner fur | grow even thicker fur / get even thinner fur |
| longer back legs / shorter back legs | grow even longer back legs / get even shorter back legs |
| a stronger tail / a weaker tail | grow even stronger tails / get even weaker tails |
| bigger eyes / smaller eyes | grow even bigger eyes / get even smaller eyes |
| a sleeker body / a chunkier body | grow even sleeker bodies / get even chunkier bodies |
| a lighter coat / a darker coat | grow even lighter coats / get even darker coats |
| pointier ear tips / rounder ear tips | grow even pointier ear tips / get even rounder ear tips |
| a brighter tail tip / a plainer tail tip | grow even brighter tail tips / get even plainer tail tips |

*Before 2026-09-27 the option named the trait the habitat rewarded most that the group didn't already have (a net effect of 0.8 or more), which could be a trait the child hadn't chosen. It was offered only when such a trait existed, and "same" took its place otherwise. Now that "need" is always offered, a neutral trait's grow-or-shrink question no longer offers "same" (its four are the reasonable answer, "matters", "chose" and "need"); every other option is as it was.*

## What the child sees afterwards

At the next follow, "Since your last choice" shows your line and your relatives here since the last follow: in the backup choice panel, or in its own sheet before the new follow goes ahead (scope decisions 34 and 68). Under "Your prediction:" it shows the prediction's count rows and bars, then one short line.

| The child thought | Line |
|---|---|
| grow, shrink or stay the same | "You thought it would grow. It grew." |
| | "You thought it would shrink. It grew." |
| | "You thought it would stay the same. It shrank." |
| (if the group is gone) | "… It died out." |
| won't matter (neutral trait) | "You thought a lighter coat wouldn't matter. It didn't." |
| your line / your relatives / about the same | "You thought your line would do better." "Your line did better." |
| | "You thought your relatives would do better." "Your line did better." |
| | "You thought they'd do about the same." "Your relatives did better." |
| (if both are gone) | "… Both died out." |

For "Which will do better" the rows are the line and your relatives there: "Your Mossfoot line with smaller eyes: 3 → 0" and "Your relatives here: 40 → 44". The one that grew by a tenth or more than the other did better; otherwise "They did about the same." Each sentence is its own line.

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
