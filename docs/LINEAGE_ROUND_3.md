# LINEAGE — Round 3: decisions on PR #26, fair tests by survivors, and following a real line

Some of this may already have been sent as separate messages. If any part is already built or in progress on an open branch, build on that work. Don't redo it.

## Rules for every part

- No percentages anywhere a child can see.
- A speaker on every child-facing line.
- Lines under about 13 words (Marc's idea sentence may stay at 14–15).
- Tap targets 44 px or more.
- No network calls.
- Smooth on an iPad.
- Keep all tests passing.
- Do not edit `lineage-m1/src`.
- Record every decision in the scope doc.
- Do not merge anything. One pull request, one commit per part, a short report per part.

---

## PART A — Decisions on PR #26's ten questions

1. **Story length:** default 50 generations. Add `?length=76` for the full story, listed on the moments page as "Teacher: full-length story". (Re-measure after Part C, since Part C changes story length.)
2. **Harmful traits:** a ✗ trait may start its fair test with at least 5 pairs; ✓ stays at 10 (and Part B's rule applies to "~" and neutral). Report how often the ✗ side is behind at generations 1–5; if under about 85% at generation 5, report before keeping it.
3. **Family tree strip:** see Part C (it becomes the chain of followed babies).
4. **Keep the 13-animal minimum** for the first tap.
5. **Sudden drops with no single reason:** keep "The place is full, so some made room."
6. **Keep the idea sentence** at 14–15 words.
7. **Keep seed 13** as the default world.
8. **"Hurting here":** show the row only when it names a trait.
9. **"Try another family" late in a world:** if fewer than 25 generations of the story length are left, show "This world is nearly over. Start a new world?" with "New world" and a small "Keep going anyway".
10. **The story card's share sheet** will be tested by Marc on a class iPad.

---

## PART B — Fair tests counted by who made it; neutral traits followable without spoilers

Marc's rule: a card must never say a trait "doesn't help or hurt" before the child has tested it. See what happens, guess why, then explain.

### 1. Measure first

For every fair test, count the test's own twins still alive each generation, not families with babies: "Of your 12 with webbed feet, 12 made it. Of the 12 without, 7 made it." Twins stay matched on age and on fitness from their other traits; tighten the match if it helps.

Across 30 good seeds, report for helpful, harmful, "~" and neutral tests at generations 1–5:
- helpful: yours ahead or level;
- harmful: yours behind;
- "~" and neutral: both sides within 1 animal (and within 2).

Build step 2 only if helpful and harmful still clearly go the right way AND "~"/neutral stay within 1–2 animals in at least about 85% of tests at generation 3. Otherwise stop after Part A and B's measurements and report.

### 2. If step 1 passes

- Neutral traits, and "~" traits in the line's place, can be followed like any other. The card offers "Follow animals with [trait]" and "Keep looking", with no hint that the trait doesn't matter. Remove the "Nothing to test here" card.
- Every fair test's scoreboard shows who made it, with count rows and bars: "Your 12 with pointier ears: 10 made it." / "The 12 without: 10 made it."
- For "~" and neutral results: "About the same." Then the usual "Why?" guess (three options from the table), then the explanation from the table.
- The Field Guide's "~" and neutral entries unlock from these fair tests.

---

## PART C — Following a real line (the core of this round)

Marc's design: each follow narrows the child's line. "Follow the ones with a sleeker body; then, of those, follow the ones born with webbed feet; follow that lineage down." The child should never be "following" animals in other places that don't share their chosen traits.

This replaces decision 59's "the child follows one family for the whole story; a follow only starts a fair test inside it".

1. **The line.**
   - The first tap follows a family (at least 13, with a future), as now.
   - Each follow makes the child's line **the followed side of the fair test** (the carriers in the line, in the line's place) **plus all their future babies** (a baby joins the line through its line parent, using the each-parent family rule).
   - The rest of the previous line become "your relatives": drawn in a quiet colour, still tappable, still countable. Keep the fair test's "without" twins as the comparison until the next follow.
2. **Follows narrow within the line.** Only babies in the child's line glow as followable. Each follow's fair test is inside the current line. Traits therefore add up: "Your line so far: sleeker body · webbed feet · smaller eyes."
3. **One place.**
   - The line lives where its followed side lives.
   - Babies of the line born elsewhere are labelled ("This baby lives in the high leaves, away from your line.").
   - A real move of most of the line is narrated.
   - Animals in other places are never "yours" unless they are in the line.
4. **Too few to test.** A follow needs enough carriers in the line (5 pairs for ✗; 10 for ✓, "~" and neutral, or whatever Part B's measurements support). Below that, "Will it be passed on?" fast-forwards within the line, as now.
5. **The line dying out ends the story,** with the reflection ending (Marc's rule).
6. **The family tree strip becomes the chain of followed babies:** the first animal tapped, then each followed baby in order, with any in-between ancestors shown smaller, so the child sees their own line of choices from real bodies.
7. **Wording.** "Your line" replaces "your family" once the first follow happens ("Back to my line", "Your Mossfoot line so far"). Keep "family" before the first follow.
8. **Measure** (the simulated child of decision 42, 30 good seeds, at the default 50 generations), and report one line each:
   - story minutes;
   - follows per story (Marc hopes for about 6–12);
   - traits added up per story;
   - how often the line grows in the 5 generations after a helpful follow, and shrinks after a harmful one;
   - how often and when lines die out;
   - followable glows available (1+ and 2+ of the time).

   If lines die out before generation 20 in more than about a third of stories, report before building the rest.

---

## For every part

- Add moments for the new screens.
- Reshoot `design/after/` (iPad sizes plus 844×390) and update `design/compare.html`.
- Measure fair-test frame times as before.

Then open one pull request into main (do not merge it), with a report per part and a five-line summary.
