# LINEAGE — Classroom Edition (Milestone 2 Scope)

**Date:** 2026-09-06
**Audience:** one Grade 3 class, 1:1 iPads, not public.

## The one sentence that defines done

> A third grader follows their animals through a series of adaptations, notices when a choice helped or hurt compared with the others here, and can say why at the end.

Every step below either moves toward that sentence or it is out of scope.

## The feel

LINEAGE should feel like a quiet nature documentary. It is set at golden hour and painted in soft gouache like a field-guide illustration. The world is alive, calm and a little mysterious. Something small is always happening, so the screen is never frozen, but nothing ever shouts. The child's animals are the brightest, most detailed thing on screen; everything else is the world they live in.

---

## Decisions that are closed

1. **Milestone 1 is frozen.** The Rev8.1 engine (`lineage-m1/src/core`, `src/observer`, `src/config`) is the biology. No further audits, repair records, provenance tooling, or test-suite expansion. Existing tests must keep passing; that is the only M1 obligation.
   *2026-09-27: the game now runs the engine's Classroom mode (decision 55), which is built beside M1 from M1's own parts. M1 itself is still untouched, and its 412 tests pass.*
2. **No Blender, no 3D.** The game is a 2D top-down painted world on HTML Canvas. Creatures are layered 2D parts.
3. **The design direction is settled.** `Lineage World.dc.html` (Claude Design, 2026-09-05) plus the eight corrections in `lineage-m2-design-feedback.md` are the visual and interaction authority.
4. **"Done" is judged by a child, not an auditor.** No step is closed by a test report alone.
5. **A followed group is a family, and a family is a mother line** (2026-09-23). Every baby belongs to exactly one family, its mother's, and is placed beside her. The engine has no sexes, so the "mother" is always the first parent in the engine's birth record. Tapping an animal follows the family of its ancestor **K = 3** generations back through that same line, so lines branch but never merge. Tapping a member of your current family offers "Follow just her branch," which narrows to her own line. Generation-0 founders have no mothers, so each habitat's founders start as founding families of about a dozen (the defining fixture's two webbing groups are two of them). All of this is computed in the game layer from the engine's birth records; `lineage-m1/src` is untouched. This replaces Step 1's tracer-channel group.
   *In the common-ancestor world (decision 56) every founder is on the open ground, so its 40 founders make three founding families of 13 or 14.*
   *Changed by decision 58 (2026-09-27): each parent's family gets one of a pair's two babies. The first baby's "mother" is the first parent in the birth record, the second baby's the second.*
   *Changed by decision 59 (2026-09-27): a tap follows the line K = 3 generations up, or further up until it has 13 living animals. The child follows that family for the whole story.*
   *K was measured on 2,520 followed families per value (30 seeds, taps at generations 0–110). At K = 3 a new family starts at a median of 12 animals (middle half 7–15) and lasts a median of 23 generations (middle half 8–72); 30% last more than 60 generations. K = 4 started at 14 but lasted a median of 31.*
   *Now only the starting group (2026-09-23): a story follows the tapped animal's K = 3 family until the first choice, then follows adaptations (decision 6). "Follow just her branch" was removed with the story loop.*
6. **The story loop** (2026-09-23, replaces the first version). A story follows the child's animals through a series of adaptations.
   - **Start:** generation 0 waits for the first tap; the child follows the tapped animal's K = 3 family (decision 5).
   - **Choice points:** two or three options under the title "Which one will you follow?", each a variation carried by at least 3 of the current group. The child chooses whom to follow, never what mutates; observer choices never affect the biology. If the child does not choose within CHOICE_SECONDS (20), one option is picked at random and the screen says "Time's up! This one was picked at random." A choice point without two such variations passes, and the story carries on.
   - **Adaptation rule: replacement.** After a choice, the group is every living animal, anywhere, that carries the latest chosen variation, fixed when it is chosen (the group's median for that trait, plus or minus 0.12). Earlier choices no longer count. The alternative, "the latest variation and at least half of the earlier ones", was measured and failed: 33% of stories reached 10 choices and the median group fell to 12.
   - **Unchosen options** stay on the map as their own marked groups: animals with that variation but not the child's (decision 9). Tapping one shows its size since the choice compared with yours, as counts with small bars ("Theirs: 18 → 12. Yours: 20 → 31."; decision 12).
   - **Pace:** watch 4 generations before the first choice. After each choice point, fast-forward 2 generations (2 s each, visibly faster), then watch 3 (20 s each). That is about 80 s per choice, with STORY_CHOICES = 15 choice points, so every story ends at generation 76, about 19 minutes in.
   - **Curated worlds:** the game uses only seeds where all three habitats still have living animals at generation 76, checked by running the engine ahead before the world is shown (an observer run; the biology is unchanged). "New world" picks only such seeds. 95 of the first 100 seeds qualify. *(In the common-ancestor world, decision 56: all 100.)*
   - **Camera:** the group may spread across habitats. "Back to my group" goes to its largest cluster, and the home glow marks every member.
   - **Endings:** the story ends when no living animal fits the group, or after the last choice point. Every ending is a reflection screen, not a game-over screen: the group's actual average traits at the end, one line of evidence from the world (not the answer), the choices made, one question, and "Try another family in this world" / "New world". A surviving group is revealed as the real animal it most resembles (decision 10); there is no single correct line.
   - **The clue** shows both sides when it can (decision 14). Otherwise it is **the evidence line** (confirmed 2026-09-23). The evidence line looks only at the seven meaningful traits, over everyone in the group since it last formed. It counts the trait's far-end word in the group's direction ("webbed feet"), in the other habitat where that count changed most. "Then" is the story's start, and a count of zero is "none". If the count changed by fewer than 3 animals, the next most distinctive trait that changed by 3 or more is used; if none did, the one that changed most.
   *Measured on 30 good seeds × 9 starting families with random choices, and checked again with the game's own story code: median story 19.3 minutes, 79% of stories reach 10 choices, and the median group after each choice is 27–123. A group's webbed members are gone from the high leaves 2 generations after the choice but still at the water's edge at the next choice in every seed.*
   *Replaced in part (2026-09-24) by decisions 32–34: the choice points, the replacement rule for the group, the unchosen options and the fixed pace. The start, the curated worlds, the camera, the endings and the clue stand.*

7. **The opening family stays** (2026-09-23). The camera keeps opening on the webbed family in the high leaves. Its quick ending (before any choice in 93% of seeds, at a median of generation 3) is the first lesson.
   *Replaced (2026-09-27) by decision 56: the game opens on the common-ancestor world. The webbed family in the high leaves is the teacher demo, `?demo=webbed`.*
8. **Neutral traits stay as choice options** (2026-09-23). Coat shade, ear tips and tail tip can be offered like any other variation, and the choice card never marks them as neutral. The lesson is "not every difference is an adaptation": after the child follows one, the next "Since your last choice…" line and the ending add "[Trait] didn't change who survived. Your group grew/shrank because of its other traits."
9. **Unchosen groups are separate sets** (2026-09-23). An unchosen group is the animals with its variation but not the child's current variation. The map (rings and colours), the corner panel and the growth readout ("Theirs: 18 → 12. Yours: 20 → 31.") all use these sets.
   *Measured with the game's own story code (270 stories, 6,215 unchosen groups): right after a choice an unchosen group has a median of 38 animals (middle half 24–69), against 93 when it overlapped the child's group. 2 start empty, 10 under 3 and 208 under 10.*
   *Replaced (2026-09-24) by decision 33: the fair test's "others here". No group is made from an option not chosen.*
10. **Real-animal reveal** (2026-09-23). A surviving story ends with a real-animal reveal based on the group's actual average traits and main habitat, using the table and matching rule in `docs/LINEAGE_REAL_ANIMAL_REVEAL.md`. Text for now; art comes later. The file's "why" lines were checked against the zone weights; the changes and the reasons are listed at its bottom. *Extended to every ending by decision 40, and to seventeen animals with "Did you know?" facts by decisions 45 and 46 (2026-09-24).*
11. **Reveal trait levels stay absolute** (2026-09-23; replaced by decision 13 the same day). A meaningful trait is high at a group average of 0.6 or more and low at 0.4 or less. With these levels the fallback ("the first mammals") is 29% of reveals across the 270 measurement stories, under the 40% at which relative levels (against the generation-0 world average) were allowed. So relative levels are not used.
   *Reveals across the 213 surviving measurement stories: Squirrel 100, the first mammals 61, Hare 30, Capybara 17, River otter 2, Bushbaby 2, Beaver 1, Sloth 0, Meerkat 0.*
12. **No percentages; read-aloud on every line** (2026-09-23). A child never sees a percentage. Growth is shown as counts beside two small bars, then and now, in the group's colour ("Yours: 20 → 31. Theirs: 18 → 12."). This applies on the choice panel, the unchosen-group readout, the corner panel, the neutral note and the ending. Every narration line, choice title, choice option, clue, reveal line and ending line has a small speaker. Tapping it reads the text with the browser's own speech (speechSynthesis), in a calm voice at a slightly slow rate (0.85). The reveal's "why" lines are read as one passage. Child-facing lines stay under about 12 words.
13. **The reveal reflects what changed** (balance round, 2026-09-23).
   - **Levels:** trait levels are relative to the generation-0 world average for each trait. High is at least GAP above it, low at least GAP below it, and GAP = 0.12 (the game's APART).
   - **Signatures:** each animal needs its signature to qualify:
     - River otter: webbing high and sleek body high.
     - Beaver: webbing high and strong tail high.
     - Capybara: webbing high and long back legs high.
     - Squirrel: curved claws high.
     - Sloth: curved claws high and thick fur high.
     - Bushbaby: big eyes high.
     - Hare: long back legs high.
     - Meerkat: big eyes high, and long back legs not high.
   - **Best match:** among qualifying animals, the one whose checked traits the group meets most strongly (the sum of how far each met trait is past its level). A tie goes to the animal listed first.
   - **Replaced rules:** these replace "all but one checked trait" and "ties go to more checked traits". With "all but one" kept, the targets were met only at GAP 0.04 or less, and Meerkat never appeared.
   - **"Why" sentences:** the reveal shows only the sentences whose credited trait the group has, at the same levels, so it never credits a trait the group lacks. The sentence about the signature always qualifies, and the sentence text is unchanged. Without this, 75 of 182 named reveals would credit a missing trait (e.g. "Thick fur keeps them warm" for a group whose traits say "Fur: thin").
   - No animal was removed, added or renamed. `docs/LINEAGE_REAL_ANIMAL_REVEAL.md` and `game/src/reveal.js` match.
   *Across the 213 surviving measurement stories: Bushbaby 55 (26%), Hare 33, the first mammals 31 (15%), Squirrel 26, Capybara 21, Sloth 19, Beaver 15, River otter 12, Meerkat 1. So the fallback is at most 35% and no animal is above 35%.*
14. **The clue shows both sides** (2026-09-23). The ending's clue compares, in one habitat, the animals with a trait against the ones without it, from the story's start to now. It is shown as a heading and two count rows with bars, e.g. "At the water's edge:", "With webbed feet: 12 → 25", "Without: 28 → 13".
   - **The two sides:** "with" is the trait's high end ("webbed feet") and "without" its low end ("no webbing"). Animals in the middle ("some webbing") are on neither side: a webbed parent's half-webbed babies would otherwise count as "without" and hide what the habitat rewards.
   - **Which pair:** among the meaningful traits and the habitats other than the group's own, the pair where both sides started with 3 or more animals and grew most differently (as a ratio).
   - **Fallback:** if no pair qualifies, the one-line evidence line (decision 6).
   - **Read-aloud:** the speaker reads the heading and both rows as one passage.
   *Measured on the 270 stories: both sides on 270 of 270 endings. Every clue is about webbing, because in the defining world it is the only meaningful trait that varies at generation 0 (every other trait starts at the middle word for every founder).*
   *The clue points the way the engine rewards (the side the habitat favours grew more) in 215 of 270. That is 28 of 30 for the webbed family in the high leaves, and 160 of 214 for stories that reach generation 76. Counting "without" as everyone else gave 10 of 30 and 178 of 214.*
15. **The choice timer waits for read-aloud** (2026-09-23). The 20-second countdown stands still while any line is being read aloud and resumes when the reading ends. At most 60 seconds of standing still per choice point, in case a browser's speech gets stuck.
16. **Tiny unchosen groups are not shown** (2026-09-23). An option not chosen that starts with fewer than 3 animals (with its variation but not the child's) gets no colour and no panel row. *10 of 6,215 in the measurement stories.* *No longer applies (2026-09-24): there are no unchosen groups (decision 33).*
17. **The default world stays seed 6** (2026-09-23). After the rebalance, seed 6 no longer gives mostly the fallback. Its webbed family in the high leaves still ends before its first choice, at generation 5.
   *Measured on seed 6, 9 families × 5 random-choice runs: 40 runs survive; Bushbaby 14, the first mammals 13 (33%), Beaver 9, River otter 2, Squirrel 2.*
18. **Confirmed by the architect** (2026-09-23): the three interpretations in decisions 13 and 14 stand.
   - The signature replaces "all but one checked trait" as the qualifying test, with GAP 0.12 (decision 13).
   - The "why" filter: a sentence whose credited trait the group lacks is not shown (decision 13).
   - The clue compares the trait's high end with its low end (decision 14).
19. **The clue's "then" stays at the story's start** (2026-09-23; tested and reverted). Measuring "then" from the first choice point (generation 4) for the stories that reach it, and from generation 0 for the rest, lets traits other than webbing appear in the clue. The rule was to keep it only if the clue then pointed the way the engine rewards at least as often as before (215 of 270). It pointed that way in 149 of 270, so it was reverted.
   *With "then" at generation 4, on the 270 stories: both sides on 228, the one-line fallback on 42. By trait: webbing 104, curved claws 47, long back legs 43, strong tail 19, thick fur 9, big eyes 6. Points the rewarded way, by trait: webbing 55 of 104, back legs 33 of 43, claws 36 of 47, tail 14 of 19, fur 6 of 9, eyes 5 of 6; the fallback lines count as not pointing. 24 stories ended before generation 4 and kept generation 0. The webbed family in the high leaves: 26 of 30 (28 of 30 with "then" at the start).*
20. **Traits are described against the start** (2026-09-23; for cards, replaced by decision 22 the same day). The ending's traits panel and the creature card describe each meaningful trait against the generation-0 world average, with the reveal's GAP (0.12): "Tail: Stronger than at the start", "Eyes: About the same as at the start". A trait at least GAP above the average is higher, at least GAP below it lower, and anything between is "About the same as at the start". The three neutral traits keep their plain words ("Coat: medium"). On the ending, a dot marks each trait that is different from the start (the legend says so). The reveal and the panel now use the same levels, so a reveal never names a trait the panel calls the same.
   *On the 270 stories: 0 of the 213 reveals has a signature trait the panel does not call higher. "About the same as at the start" is the most common word for fur (195), tail (192) and body (213). Because the two webbed founding families raise the starting average for webbing (0.27), 31 endings read "Feet: Less webbing than at the start" (17 of 136 in the high leaves, 14 of 48 on the open ground, 0 at the water's edge).*
21. **The creature card** (Step 3, 2026-09-23).
   - **The drawing** (`game/src/creature.js`): one animal drawn large from its real body genome as layered 2D parts. Every trait changes something visible: webbing is pink skin between the toes on bigger, wider feet; curved claws, their length and curve; thick fur, a fluffier outline; long back legs, back-leg length; strong tail, tail thickness; big eyes, eye size; sleek body, round to streamlined; coat shade, dark to light; ear tips, rounded to pointed; tail tip, a coloured band. Values are continuous, so siblings look related but not identical. The animal's id seeds small touches, so the same animal always looks the same. A paper grain, a grain on the creature, soft edges and a wash in the habitat's colour make it read as a field-guide painting. This is a first style; Step 4 (look design) and Step 5 (beauty pass) restyle it.
   - **The card:** once the story has begun, tapping any animal opens its card (the first tap still picks the family). It shows which group the animal is in ("In your family", "The ones with a darker coat" with the Theirs/Yours counts, or "Not in your family"), the drawing, where it lives ("Lives at the water's edge."), its ten traits in kid language (plain words since decision 22; at first the decision-20 words), and, when it has one, the trait that is new in it: "New at birth: a stronger tail, not from its parents." That trait glows on the drawing and in the list. Every line has a speaker. Families have no names in the game, so the first line names the group instead of a family name.
   - **"New":** the engine's body-mutation record at birth for that animal, when it changed the trait by at least APART (0.12). At most one trait per animal, as in the engine. Founders have none.
   - **Behaviour:** it opens and closes in about 0.15 seconds (×, a tap on empty ground, or Escape). The world keeps running behind it. While a card is open during a choice, the 20-second timer waits, with no cap; where the card sits then is decision 23. If the animal passes away while its card is open, the card stays and says "This one has passed away." A ring marks the animal on the map.
   - **Options and ending:** each choice option is drawn the same way, with a ring on the part the choice is about. Small parts (webbing, claws, ear tips, tail tip) also get a close-up in a corner, drawn again at a larger scale. The ending shows "Here's what your animals look like now." (or "looked like" when they died out): the group's average body in its main habitat, with the reveal right under it.
   *Time to draw one card, in headless Chromium at iPad size (1180 × 820 and 820 × 1180, 2× pixels), five taps: median 12–13 ms from tap to card, 11–12 ms of it the drawing. The first card of a session takes about 33 ms (it makes the paper grain once). With the CPU slowed 4×: median 65 ms, first card 148 ms. Map frame times were the same with the card open and closed, because the card is drawn once, when it opens. 97.7% of the 63,103 mutations at birth in 30 worlds change a trait by at least 0.12. About 1 living animal in 5 (19.4%) has a new trait, so five taps usually find one.*
22. **Cards describe the animal in plain words** (2026-09-23; for cards, this replaces decision 20). A creature card says what the animal has, not how it compares with the start: "Lots of webbing between the toes", "Long back legs", "A dark coat". Each trait has three words, split at thirds of the engine's 0–1 range like the story's variation words:
   - webbing: hardly any / some / lots of webbing between the toes;
   - claws: straight / slightly curved / curved;
   - fur: thin / medium / thick;
   - back legs: short / medium / long;
   - tail: weak / medium / strong;
   - eyes: small / medium / big;
   - body: chunky / medium / sleek;
   - coat: dark / medium / light;
   - ear tips: round / slightly pointy / pointy;
   - tail tip: plain / a faint mark / a bright mark.

   "New at birth: …" stays; it is the comparison with the animal's parents. The ending keeps "than at the start", so it matches the reveal (decision 20).
23. **A card never covers a choice option** (2026-09-23). Outside a choice, the card sits at the right-hand side of the map, as before. While the choice panel is up, the card sits in the room above it, the side away from the panel, in a wide layout: the drawing on the left, the words on the right and the traits in two columns. It never reaches the panel, in landscape or portrait. The panel is the bottom sheet in both, so the card cannot be one during a choice. If the room is too small for the card, it scrolls. A card that is open when a choice point arrives moves up the same way, and goes back when the choice ends. The timer still waits while a card is open, with no cap.
24. **The close-ups on choice options stay** (2026-09-23): webbing, claws, ear tips and tail tip, as in decision 21.
25. **The prediction journal has no backend** (2026-09-23). Questions and options are generated inside the game from the story's real state, using a written table of question types. Each type has one reasonable answer and two or three common Grade 3 misconceptions as options. No network calls; no student data leaves the device. This replaces the room-based API endpoint in the old Step 4 (now Step 6).
26. **Confirmed by the architect** (2026-09-23): the wide card above the choice panel stays for now (decision 23), and "Hardly any webbing between the toes" stays (decision 22).
27. **Moment shortcuts for the look design** (2026-09-23, preparing Step 4). `game/?moment=NAME` opens the game straight into one moment, in a real game state, and works with `?seed=` too. The moments are arrival, generation, variation, grow, shrink, choice, ending, extinct and card.
   - A story that reaches the moment is found by observer runs on throwaway copies of the world. The game itself is then played forward to it: tap, watch, the same choices. The biology, the text and the game rules are unchanged.
   - The links are on `game/moments.html`, which the game does not link to.
   - Screenshots of every moment at iPad landscape and portrait are in `design/current/`, with a README listing each moment's link and the files that draw it.
28. **When a prediction comes** (Step 6, 2026-09-24). One prediction comes after the child's 1st, 4th, 7th, 10th and 13th choice. It comes right after the choice and before the fast-forward, and the world waits while it is up. A random pick at "Time's up!" counts as a choice; a choice point that passes does not. There is one question with three or four tappable options, in a random order. Every line has a speaker, and there is no typing. After a tap, "Let's see what happens after the fast-forward." shows for 2 seconds, then the fast-forward starts.
   *Measured on the 270 stories (30 good seeds × 9 founding families, random choices): a median of 5 predictions per story. 203 stories get 5, 11 get 4 and 1 gets 2. 55 get none, because their group ends before the first choice.*
29. **No answer, no prediction** (2026-09-24). The child has 15 seconds to answer. The countdown stands still while a line is read aloud (at most 60 seconds, as in decision 15) and while a creature card is open. Without an answer, the story goes on without a prediction. Nothing is picked at random, because a random prediction means nothing.
30. **The question table** (2026-09-24). Questions come from the story's real state, through the table in `docs/LINEAGE_PREDICTION_QUESTIONS.md`.
   - **Three types, taking turns:** "Will your new group grow or shrink?", "Will the ones with [variation] grow or shrink?" and "Where will animals with [variation] do best?".
   - **One reasonable answer,** from the engine's own trait effects in the habitat. Two or three common Grade 3 misconceptions are the other options.
   - **"Need"** is offered wherever it fits, e.g. "Grow. They'll grow webbed feet because they need them." It fits when the group's habitat clearly rewards a trait the animals don't already have. The where question always offers "Anywhere. They'll grow what they need."
   - **The result:** the next "Since your last choice…" panel shows the prediction beside what happened, with the same count rows and bars and one short line: "You thought it would grow. It grew."
     - After "need", it adds "Animals can't grow a trait because they need it. Babies are just born different."
     - After "Grow, because I picked them." (or "They'll disappear, because I didn't pick them."), it adds "Your choice doesn't change the animals. It picks who you follow."
   - **Nothing is ever called wrong.** There are no scores or points.
   *Measured on the same 270 stories: 1,061 questions. "Need" is offered in 986 of them (93%). 855 have four options and 206 three. The reasonable answer is what happened for 301 of 472 questions about your group and 235 of 418 about the ones not chosen. For where, it is 64 of 171, about chance.*
31. **Your predictions at the ending** (2026-09-24). The ending lists the story's predictions beside what happened, under a small heading, "Your predictions", labelled "A story from the simulation." `?moment=prediction` (the question) and `?moment=prediction-result` (the next choice point, with the result) join the moment shortcuts (decision 27). Screenshots of both are in `design/current/`.
32. **Following a new variation** (2026-09-24, replaces the fixed choice schedule in decision 6). Between follows the child is active. The first tap still follows a family (decision 5).
   - **The glow (calm rule):** a newborn in the child's group glows when the trait new in it at birth (a body mutation of 0.12 or more) takes it past the group's usual. The line is the replacement rule's threshold: the group's median, plus or minus 0.12.
     - At most 3 glow at a time: meaningful traits first, then the newest, one per variation.
     - A newborn glows in the generation it is born and the next one. Nothing else flashes any more.
   - **The card:** tapping a glowing newborn opens its card with "Follow animals with [trait]" and "Not this one". The buttons show only while the world is watched (not during a fast-forward or a panel) and follows are left. "Not this one" stops the glow and makes no group. *"Not this one" was replaced by "Keep looking" in decision 43 (2026-09-24): it closes the card and the glow stays.*
   - **A follow counts as a choice.** "Since your last choice" comes first (decision 34), then a prediction after every third follow (decision 28), then the usual 2-generation fast-forward.
   - **Limits:** at most STORY_CHOICES (15) follows. There are no fixed choice points. A story ends at generation 76, or when the child's group dies out.
33. **The fair test** (2026-09-24, replaces the unchosen groups in decision 9).
   - **Two groups the same size:** following makes the child's group START_SIZE (20) living animals in the tapped newborn's habitat that carry the variation (the same threshold): the newborn, then the carriers nearest it. At the same moment, START_SIZE animals there that don't carry it, again the nearest, become "the others here", in their own colour. *The fixed size and the choice of the others were replaced by decisions 36 and 37 (2026-09-24).*
     - "Nearest" is measured between the animals' home spots on the map, which are placed the same way in the game and in a measurement. It is observer state only.
   - **Tracked the same way:** both groups grow only by babies whose mother is in them, and shrink by deaths.
   - **Shown side by side as counts with bars:** "Yours (smaller eyes): 20 → 27" and "The others here: 20 → 19". They appear in the corner panel, on the card of any of the others, in "Since your last choice" and at the ending ("Your last fair test").
   - **Not enough yet:** when fewer than START_SIZE animals in the habitat carry the variation, the card's button says "Only N here have this. Watch it?". When fewer than START_SIZE don't carry it, it says "Almost all here have this. Watch it?".
     - Watching puts the variation on a small "Watching" list (at most 3) with its count in that habitat.
     - When both sides reach START_SIZE, a gentle line appears once: "Your animals with [trait]: now N. Follow them?", with a "Follow them" button.
     - *The watching path (the button, the list and the gentle line) was replaced by decision 42 (2026-09-24): a variation too rare to start a test right away is fast-forwarded to see if it spreads.*
34. **The push, and "Since your last choice"** (2026-09-24).
   - **The push:** with no follow for PUSH_SECONDS (120) of story time, the choice panel opens as a backup. It offers up to 3 variations that can start a fair test: watched ones first, then glowing ones, then others the group has spread (at least 3 members carry them).
     - It keeps the 20-second timer, the random pick and "Time's up!". The options not picked make no group.
     - If nothing can start a fair test, the push waits and checks again each generation.
     - *Since decision 42 (2026-09-24) it offers only variations that can start right away, glowing ones first; the watched ones went with the watching list.*
   - **"Since your last choice"** shows the last fair test at the next follow: in the backup panel, or as its own sheet after a follow from a card or the gentle line. It holds the neutral note (decision 8) and the prediction beside what happened (decision 30).
     - The sheet waits while a line is read aloud or a card is open. "Next", or 15 seconds, goes on to the new follow.
   - **Moments:** `?moment=follow` (a glowing newborn's card), `?moment=watching` (a watched variation ready to follow) and `?moment=fairtest` (both groups five generations after a follow) join the moment shortcuts (decision 27). All moments were shot again in `design/current/`. *`?moment=watching` was replaced by `?moment=spreading` and `?moment=fizzled` (decision 42).*
   *Measured with a simulated child on 270 stories (30 good seeds × 9 founding families, the game's own code). The child follows the first meaningful glowing variation that can start a fair test, after at least 40 s of watching, and takes the first option on the backup panel.*
   - *Glowing newborns whose variation can already start a group: 4,442 of 13,731 (32%; meaningful ones 32%). The median count of carriers in the habitat is 14 (middle half 7–23).*
   - *Stories:*
     - *Median length 41 generations; 63 of 270 reach generation 76.*
     - *Follows per story: median 6 (mean 6.2). 46 stories have none, because their family ended before a follow.*
     - *The backup panel gave 481 of 1,670 follows (29%) and was needed in 205 of 270 stories (76%).*
   - *The child's group died out before the next follow after 161 of 1,670 follows (10%), which ended 161 stories (60%).*
   - *Other values of START_SIZE, each measured on its own stories:*

     | START_SIZE | 10 | 12 | 15 | 20 |
     |---|---|---|---|---|
     | Glowing variations that can start a group | 49% | 46% | 41% | 32% |
     | Stories reaching generation 76 | 2% | 5% | 9% | 23% |
     | Follows followed by the group dying out | 23% | 18% | 16% | 10% |
     | Follows per story (median) | 3 | 3 | 4 | 6 |

   - *The webbed-feet lesson as a fair test. A group with more webbing than usual there faces the others there, formed at generations 0, 10, 20, 30 and 40 in the 30 seeds:*
     - *In the high leaves, 20 carriers exist in only 6 of 150 tries. The webbed family is under 20, and later "more webbing" there means only 0.20–0.26 (hardly any webbing). After 5 generations the webbed group did better 3 times, worse once and the same twice.*
     - *At the water's edge, a test could start in 63 of 150 tries. After 5 generations the webbed group did better in 40 of 63 (median 22 against 17). After 10, it did better in 38 of 63 (22 against 14).*
     - *At START_SIZE 12, for comparison: in the high leaves 69 tries could start, and the webbed group did worse in 53 of 69 after 5 generations (median 1 against 14). At the water's edge it did better in 83 of 139.*
35. **Predictions with fair tests** (2026-09-24, changes the question types in decision 30).
   - **Two types take turns:** "Will your new group grow or shrink?" and "Which will do better: yours or the others here?". The "ones not chosen" and "where" types went with the groups they were about.
   - **The fair-test question's options:**
     - the reasonable answer from the engine's trait effects ("Yours. A sleeker body helps at the water's edge." / "The others. …doesn't help…"; for a neutral trait, "About the same. A darker coat won't matter.");
     - "Yours, because I picked them.";
     - "need" wherever it fits;
     - "About the same. It's all luck." (or "Yours. A darker coat will help them." for a neutral trait).
   - **Its result:** "You thought yours would do better. Yours did.", with both groups' rows. Everything else in decisions 28–31 stands, with "choice" read as "follow".
   *With the same simulated child: a median of 2 predictions per story (mean 2.4). "Need" is offered in 604 of 636 questions (95%). The reasonable answer came true in 229 of 375 grow-or-shrink questions and 147 of 261 fair-test questions.*

36. **The fair test's size adapts** (2026-09-24, replaces START_SIZE in decision 33).
   - **The size** is the smallest of: the carriers in the habitat, the non-carriers there, and MAX_SIZE (20). Both groups always start at exactly that size.
   - **A follow needs at least MIN_SIZE (10).** The card shows the real number: "Follow 14 animals with smaller eyes".
   - **Below MIN_SIZE** the card keeps "Only N here have this. Watch it?". The gentle line for a watched variation appears when both sides reach MIN_SIZE. *Replaced by decision 42 (2026-09-24): the card always offers to follow, and below MIN_SIZE the world fast-forwards to see if the variation spreads.*
37. **Twins, and an ending that leads with the fair test** (2026-09-24).
   - **Yours:** the child's carriers are chosen as before, the newborn first and then the nearest.
   - **The others here:** for each of yours in turn, the nearest non-carrier not already taken, its twin, so the two groups stand side by side on the map.
   - **When the child's group dies out after a follow,** the story ends as before. The ending leads with the fair test, under the title: yours and the others here as count rows with bars, then the question.
     - If both died out, one line follows: "The others here died out too."
     - If only yours did: "The others here are still alive."
   - **The moment:** `?moment=extinct` now shows a group that died out after a follow, so the new ending can be seen.
38. **The log names only babies that glow** (2026-09-24). "One of your babies was born with …" is only said about a glowing baby. With several, it says how many glow ("Two of your babies were born with something new."), never more than the map shows.
39. **Confirmed** (2026-09-24):
   - the journal's two question types (decision 35);
   - a backup panel with a single option;
   - the done sentence now reads "…compared with the others here…".
   *Measured with the same simulated child on the 270 stories (30 good seeds × 9 founding families; it follows the first meaningful glowing variation that can start a fair test, after at least 40 s of watching, and takes the first option on the backup panel):*
   - *Glowing variations that can start a fair test: 6,064 of 9,780 (62%; meaningful ones 61%).*
   - *Fair-test sizes at the 1,565 follows: median 19. 10–12: 328; 13–15: 253; 16–19: 233; 20: 751.*
   - *Story length: median 30 generations, about 7.4 minutes of generations and pre-rolls (panels add more). 36 of 270 stories (13%) reach generation 76.*
   - *Follows followed by the group dying out: 194 of 1,565 (12%). That ends 194 stories (72%); 40 more end before any follow.*
   - *Follows per story: median 5 (mean 5.8). The push panel gave 215 of 1,565 follows (14%) and was needed in 140 of 270 stories (52%).*
   - *Twins: at the follow, each of yours has one of the others a median of 16 px away (90% within 43 px). Your carriers can still be spread across the habitat (the farthest is a median 1,057 px from the newborn), each with its twin.*
   - *The webbed-feet fair test (more webbing than usual in the habitat against the others there; 30 seeds × start generations 0, 10, 20, 30 and 40):*
     - *In the high leaves, 80 of 150 tries could start (median size 12). After 5 generations the webbed group did worse in 56 of 80 (median 5 against 14). After 10, worse in 48 (median 1 against 17).*
     - *At the water's edge, 146 of 150 could start (median size 18). After 5 generations the webbed group did better in 99 of 146 (median 24 against 14). After 10, better in 96 (27 against 13).*
   - *For comparison (not needed, since under a quarter of follows end in the group dying out):*

     | MIN_SIZE | 10 | 12 | 15 |
     |---|---|---|---|
     | can start | 62% | 55% | 46% |
     | follows then dying out | 12% | 11% | 10% |
     | stories reaching 76 | 13% | 16% | 19% |
     | story length (median generations) | 30 | 36 | 43 |
     | push needed (stories) | 52% | 60% | 70% |
     | webbed tries in the high leaves; webbed worse after 5 | 80; 56 | 69; 53 | 20; 12 |
40. **A reveal on every ending** (2026-09-24, extends decision 10). Every ending shows the real-animal reveal, not only a story that reaches generation 76. It uses the group's actual average traits and main habitat when the story ended (its last living members), with the same table, matching rule and "why" filter (`docs/LINEAGE_REAL_ANIMAL_REVEAL.md`).
   - **Survived:** as before ("Your animals became swimmers, a lot like a river otter.").
   - **Died out:** past tense ("Your animals were becoming a lot like a sloth."), with the "why" lines in the past tense ("Thick fur kept them warm."). It comes after the fair test and the question, so the fair test still leads.
   - **A family that dies before any follow** also gets one.
   - `?moment=extinct` (a group that died out after a follow) shows the new reveal, so no new moment was added.
   *Measured with the same simulated child on the 270 stories (36 survive, 234 die out):*
   - *Survived: Bushbaby 12, Sloth 5, Hare 5, first mammals 5, Squirrel 4, River otter 3, Capybara 2, Beaver 0, Meerkat 0.*
   - *Died out: first mammals 99, Squirrel 37, River otter 19, Beaver 19, Bushbaby 18, Hare 16, Capybara 10, Meerkat 9, Sloth 7.*
   - *A died-out ending gets the fallback in 99 of 234 (42%), and 33 of the 40 families that die before any follow (83%).*
41. **No tree shrew on a died-out ending** (2026-09-24, changes decision 40's fallback). A group that died out never gets the first mammals. If it matches no animal, the reveal is "Your animals didn't have time to change.", with one "why" line: "Their story ended before new traits could spread." A surviving group keeps the first mammals as its fallback, as it is. The reveal stays after the fair test on died-out endings (confirmed).
   *With the same simulated child on the 270 stories: 99 of 234 died-out endings (42%) get the new line, including 33 of the 40 families that die before any follow. No died-out ending gets the first mammals; 5 of 36 surviving endings still do.*
42. **Will it spread? A fast-forward instead of "Watch it?"** (2026-09-24, replaces the watching path in decisions 33 and 36 and the watched options in decision 34). Fast-forwarding never changes the biology.
   - **The card** on a glowing newborn always offers "Follow animals with [trait]" and "Not this one" ("Keep looking" since decision 43). "Watch it?", the Watching list and the gentle line are gone.
     - When both sides have at least MIN_SIZE (10) in the habitat, the fair test starts right away, as before, and the button says its real size: "Follow 14 animals with smaller eyes" (decision 36).
     - Otherwise the button has no number, and the world fast-forwards to see if the variation spreads.
   - **The spread:** the world speeds up (2 s a generation, with the Fast-forward badge), and one line in the log counts the animals with it in that habitat, the latest three counts: "Will it spread? Animals with smaller eyes: 3… 7… 12…". The count changes in place each generation. The line has a speaker ("3, 7, 12.").
     - **It reaches MAX_SIZE (20):** it stops at once, and the fair test starts with the adaptive size.
     - **SPREAD_MAX (10) generations pass:** it stops. If both sides then have MIN_SIZE, the fair test starts with what there is.
     - **It fails:** "It disappeared. Most new traits do." (none have it any more) or "It didn't spread far enough." (still too few at the cap). The child keeps their current group, and the try is not one of their follows. The backup panel's 120 s start again.
     - **When it starts a fair test,** "Since your last choice" and the prediction come first, as for any follow (decisions 28 and 34).
   - **Too few without it** (added here, rare): the variation is already common in that habitat, so no spread can help. The line is "Most here have it. Too few others for a fair test." With MAX_SIZE or more carrying it at the tap, it comes at once, with no fast-forward. The child keeps their group.
   - **Meanwhile** the child's group lives on as usual. If it dies out, the story ends as a normal died-out ending. The skipped generations count toward the story's 76.
   - **The backup panel** after 120 s with no follow stays, but offers only variations that can start a fair test right away.
   - **Moments:** `?moment=spreading` (the counter mid-fast-forward) and `?moment=fizzled` (the variation disappeared) replace `?moment=watching`. All moments were shot again in `design/current/`.
   *Measured on the same 270 stories (30 good seeds × 9 founding families, the game's own code) with a new simulated child: after at least 40 s of watching, it taps the first meaningful glowing variation, whether or not it can start right away. On the backup panel it takes the first option.*
   - *Follows that start right away: 811 of 1,396 taps (58%).*
   - *Skips (585 taps):*
     - *500 finished: 138 reached 20 (28%); 80 started with 10–19 at the cap (16%); 282 fizzled (56%).*
     - *Of the fizzles, 97 disappeared, 170 still had too few, and 15 had too few without it.*
     - *A median of 8 generations skipped: 5 to reach 20, 4 to disappear.*
     - *85 more were cut short when the story ended; in 70 of them the group died out.*
   - *Story length: median 37 generations, about 5.6 minutes of generations and pre-rolls (panels add more). 51 of 270 stories (19%) reach generation 76.*
   - *Fast-forwarding: a median 21 generations per story (skips, and the 2 after each follow), against 14 watched. In 198 of 270 stories most generations are fast.*
   - *Follows: 1,095, a median of 3 per story. 218 started after a skip; 66 came from the backup panel, which was needed in 55 of 270 stories (20%).*
   - *54 stories have no fair test at all (40 in the last round); 33 of them tried a skip.*
   - *The webbed-feet fair test (as in decision 39, with a spread when a test can't start right away):*
     - *In the high leaves, 110 of 150 tries start (80 right away, 30 after a skip). After 10 generations the webbed group did worse in 66 and better in 30 (median 4 against 14).*
     - *At the water's edge, 149 of 150 start (146 right away, 3 after a skip). After 10 generations the webbed group did better in 96 and worse in 50 (median 27 against 13).*
   - *Other caps, because more than half of skips fizzle, each measured on its own stories:*

     | SPREAD_MAX | 10 | 15 | 20 |
     |---|---|---|---|
     | skips that fizzle | 56% | 54% | 52% |
     | fair tests started after a skip | 218 | 212 | 204 |
     | skips cut short by the story's end | 85 | 104 | 113 |
     | median story: generations; minutes | 37; 5.6 | 41; 6.2 | 41; 5.5 |
     | stories reaching 76 | 51 | 53 | 52 |
     | webbed tries starting in the high leaves | 110 | 114 | 123 |

     *SPREAD_MAX stays 10 (for Marc to confirm). A longer cap barely lowers the fizzles, starts no more tests, and lets more stories end in a skip.*
   - *Confirmed by Marc (2026-09-24): SPREAD_MAX stays 10; "Most here have it. Too few others for a fair test." stays; the balance of watching and fast-forward is fine. Spreads that end with the group dying out were changed by decision 44.*
43. **Keep looking** (2026-09-24, replaces "Not this one" in decisions 32 and 42). On a glowing baby's card, "Keep looking" replaces "Not this one".
   - It closes the card and leaves the glow on, so a child can look at several babies and come back to one.
   - The glow still ends on its own after its usual generations (GLOW_GENERATIONS, 2), under the calm rule (decision 32).
   - The card still closes with ×, a tap on empty ground, or Escape.
   - The simulated child never used "Not this one", so no measurement changes. The `follow` and `card` screenshots in `design/current/` were shot again.
44. **A spread stops when the child's group gets very small** (2026-09-24, changes decision 42).
   - **During a spread:** if the child's own group falls to DANGER_SIZE (5) or fewer, the fast-forward stops at once.
     - The line: "Wait! Your group is getting very small." (read-aloud as usual; "family" instead of "group" before the first follow).
     - The spread is cancelled and does not count as a follow. The camera goes to the group, and the world goes back to normal watching, so the child sees what happens to their group in normal time.
   - **Before a spread:** with the group already at DANGER_SIZE or fewer, a glowing baby whose trait would need a spread starts none. Its card says "Your group needs you. Stay with them?" with only "Keep looking". A trait that can start a fair test right away is offered as usual.
   *Measured with the simulated child of decision 42, which now looks at the next glowing baby when a card says "Stay with them?". Before and after, on the same stories:*
   - *540 stories (60 good seeds × 9 founding families):*
     - *the rule stops 257 of 1,133 spreads, and blocks the first glowing baby's card 122 times;*
     - *stories ending during a spread drop from 182 to 33, and only 3 of them end with the group dying out (143 before); the other 30 reach generation 76 mid-spread;*
     - *4 groups still die during a follow's 2-generation fast-forward (5 before);*
     - *median story: 37 generations both times, 5.8 → 6.2 minutes of generations and pre-rolls; stories reaching 76: 104 → 110.*
   - *The last round's 270 stories: 135 of 574 spreads stopped; stories ending during a spread 85 → 14 (the group died out in 70 → 2); median story 37 → 41 generations, 5.6 → 6.5 minutes; 51 → 55 reach generation 76.*
   - **Moments** (2026-09-24): `?moment=danger` (the "Wait!" stop mid-spread) and `?moment=blocked` (a card saying "Stay with them?") join the moment shortcuts (decision 27), with screenshots in `design/current/`.
45. **Seventeen real animals** (2026-09-24, extends decision 10; the table is in `docs/LINEAGE_REAL_ANIMAL_REVEAL.md`).
   - **By habitat:**
     - water's edge: river otter, beaver, capybara, platypus, seal, fishing cat;
     - high leaves: squirrel, sloth, bushbaby, koala, tarsier, slow loris;
     - open ground: hare, meerkat, lynx, bear, arctic fox.
   - **The eight earlier animals stay.** The capybara gains "thin fur", which is true of its sparse, coarse hair.
   - **Same rules as before:**
     - only the seven meaningful traits and the main habitat;
     - relative levels (GAP 0.12), a signature, and the strongest match;
     - each real animal has every profile trait in the direction given, and profiles differ within a habitat.
   - **"Why" lines** credit only traits the engine rewards in that habitat, in both tenses. The two trade-off lines from the balance round stay: the beaver's thick fur and the capybara's long legs, each naming its cost.
   - **The fallbacks stay:** "Your animals didn't have time to change." for a group that died out, and the tree shrew for a survivor that barely changed.
   - **Rejected, with reasons in the reveal doc:** kangaroo, mole, red panda, lemur, mink, muskrat, jerboa, cheetah, deer, red fox, mongoose, manatee, hippopotamus, flying squirrel and sugar glider, spider monkey, hedgehog and armadillo.
   *Measured on 540 stories (60 good seeds × 9 founding families, the simulated child of decisions 42 and 44), survived and died-out endings together:*
   - *Water's edge: platypus 12.4%, river otter 5.7%, capybara 3.5%, seal 3.5%, beaver 2.8%, fishing cat 1.1%.*
   - *High leaves: squirrel 11.1%, bushbaby 7.8%, koala 6.5%, tarsier 3.3%, sloth 2.0%, slow loris 1.1%.*
   - *Open ground: hare 8.9%, bear 2.8%, meerkat 2.6%, lynx 2.6%, arctic fox 1.1%.*
   - *Fallbacks: "No time to change" 19.1% and the tree shrew 2.0%, 21.1% together (36.5% with the eight animals on the same stories).*
   - *Targets met: every animal at least 1.1%, none above 12.4%, fallbacks under 30%.*
   - *Confirmed by Marc (2026-09-24): the two trade-off "why" lines stay (the beaver's thick fur, the capybara's long legs), and so do the fishing cat, the slow loris and the arctic fox.*
46. **"Did you know?"** (2026-09-24).
   - **Every animal gets one** true, kid-level fact, 11 words or fewer, shown after the "why" lines with its own speaker.
   - **Every water's-edge animal adds a second:** "Did you know? Whales' ancestors were land animals that started swimming."
   - **The fallbacks:** the tree shrew has one; "No time to change" names no animal and has none.
   - **Tense:** the facts are about the real animal, so they stay in the present tense on died-out endings.
   - **For checking:** "Facts for Marc to check" in the reveal doc lists every animal as a child sees it: its reveal line, its "why" lines in both tenses, and its facts.
47. **Small screens and touch** (2026-09-26, PR #22). On a screen under 600 px high or wide, the generation panel is a slim bar, and two fingers zoom the map from 0.6× to 2.5×, with + and − for anyone who can't pinch.
   - **The story's zoom:** 1× on an iPad, 1.25× on a phone (a screen whose shorter side is under 600 px). "Back to my family" / "Back to my group" goes back to it. Confirmed by Marc (2026-09-26).
   - **The arrival's close-up:** the arrival settles up to 1.5× closer on the first founding family, and eases back to the story's zoom at the first tap. Confirmed by Marc (2026-09-26).
   - **Phone layouts deferred:** the choice, naming and prediction sheets and the ending keep their iPad layout on a phone. Class iPads are the target; revisit only if the game is used on phones.
   - **Waiting for Marc's real-device check** on a class iPad and in iPhone Safari:
     - pinch and page-zoom blocking;
     - smoothness at 2.5× on a busy fair test;
     - the fair-test smoothness check;
     - the day's tint.

48. **No jumping ship, and where a new group comes from** (2026-09-27, Marc's first real play; changes decision 44).
   - **No follow while the group is very small.** While the child's group has DANGER_SIZE (5) or fewer animals, nothing can be followed, whatever the trait. Babies still glow. Every glowing baby's card says "Your group needs you. Stay with them?" ("family" before the first follow), with only "Keep looking". The backup choice panel waits until the group is bigger.
   - **The new group gathers.** At every follow, the carriers already in the child's group light up first (1.4 s). Then the others with the trait walk in and settle around them, and each twin from the others here settles beside its partner.
     - One line counts both, from the real numbers: "3 from your family and 22 others with bigger eyes join you."
     - With none new: "All 12 with bigger eyes are from your family." With none from the child's group: "20 animals with bigger eyes join you."
     - The usual lines follow. The fast-forward starts one line later (3.8 s), so the gathering can be seen.
   - **Visual only.** Fair tests measure "nearest" from each animal's spot, which never moves (decision 54), so every fair test is as it was.
49. **Tappable notifications** (2026-09-27, Marc's first real play).
   - **A line that names a baby.** A narration line or caption that names a baby ("One of your babies was born with webbed feet.") has a golden underline while the baby is on the map. A tap flies the camera to the baby and opens its card.
   - **Arrows at the edge.** A glowing baby off the screen gets a small golden arrow at the screen's edge, pointing to it (one per glowing baby, so at most 3). A tap flies the camera there.
     - The arrows keep off the panels, the buttons and the narration.
     - They rest while a sheet, the ending or the arrival is up.
50. **Babies through the day** (2026-09-27, Marc's first real play; changes the calm rule in decisions 32 and 38).
   - **Births:** the engine still makes each generation's babies at its tick. On a watched day they appear on the map one by one over the first 80% of the day, each at a fixed moment from its id. In a fast-forward they appear at once.
   - **Glows start one at a time**, as their babies appear:
     - at least GLOW_GAP_SECONDS (4) apart, meaningful traits first, one per variation;
     - never more than GLOW_MAX (3) at once;
     - a glow lasts at least GLOW_MIN_SECONDS (10) of watching before a newer one may take its place, and still ends after GLOW_GENERATIONS (2). A glow starts only if it has 10 s left.
   - **The log names each baby as it lights up.** The line already on screen stays at least 2.6 s first.
   *Measured on 270 stories (30 good seeds × 9 founding families), with the simulated child of decision 42 now tapping during the day:*
   - *glowing babies to pick from while a follow is open: 0.78 on average; 2 or more 22% of the time, 1 or more 47%;*
   - *seconds between new glows: median 5.5 (quartiles 4–18.5); a glow lasts a median 19 s of watching;*
   - *a child who only watches: 1.14 on average, 2 or more 34% of the time.*
   - **Fewer than 2 are usually available.** What-ifs, not changed (for Marc to decide):
     - *15 s watched generations: 0.90 on average, 2 or more 26%, new glows a median 4.5 s apart;*
     - *glows lasting 3 generations: 0.89 on average, 2 or more 25%;*
     - *both together: 1.04 on average, 2 or more 31%;*
     - *the same variation glowing twice: 0.80.*
     - *None reaches 2. The limit is how many babies are born with a new variation, not how they are shown.*
51. **A card for other groups** (2026-09-27, Marc's first real play).
   - **Its group beside yours.** Tapping an animal that isn't the child's shows, above its own traits, a short summary of its group: the fair test's others ("The others here"), or otherwise its family (its mother line, decision 5).
     - Both groups' counts, then (at the latest follow, or when the story began) and now, with bars.
     - One line: "Doing better than yours since your last choice.", "Doing worse …" or "Doing about as well …". A group does better when it grew by a tenth more than the other, comparing now against then.
   - **"How they're different from yours":** up to three meaningful traits, highlighted, where its group's average differs most from yours (by GAP, 0.12, or more): "Longer back legs than yours", "Less webbing than yours". On the card of one of the others here, the fair test's own trait always comes first. When none differ that much: "Much like yours."
52. **The prediction's "need" option** (2026-09-27, Marc's first real play; changes the option list in decision 30).
   - "Need" always names the trait the child just chose, in the direction chosen: "They'll grow even bigger eyes because they need them." ("get" for less of a trait). It is offered in every question.
   - Before, it named the habitat's most rewarded trait that the group didn't have, which could be unrelated to the follow.
   - Every other option was already about the follow. The one other change: a neutral trait's grow-or-shrink question no longer offers "Stay the same. Animals don't change.", because "need" now takes the fourth place. `docs/LINEAGE_PREDICTION_QUESTIONS.md` is updated.
53. **Visiting other places** (2026-09-27, Marc's first real play).
   - **Three buttons:** Leaves · Ground · Water, at the foot of the map across from "Back to my group", above the narration (one above another on a narrow screen), 48 px tall (44 px on a short screen). They are hidden while a sheet, the ending or the arrival is up.
   - **A visit:** the camera flies to where most of that place's animals are. On arrival the narration says, for example, "Water's edge: 113 animals, growing. Many have webbed feet." with a speaker, from the engine's counts:
     - how many live there now, and which way that went since the last generation (growing, shrinking or steady);
     - the meaningful trait at its high end that the most animals there have: "Most" (more than half), "Many" (a quarter or more), "Some" (a tenth or more); below a tenth, no trait is named.
   - **Exploring:** after a visit, a flight to a baby, or dragging the map, the camera never pulls back to the child's group on its own. Only "Back to my family" / "Back to my group" does. A follow, which the child chooses, still takes the camera to the new group.
54. **Honest habitats** (2026-09-27; Marc saw "a group with lots of webbing hanging out on the beach, nowhere near the water").
   - **The paint:** open ground is grass and earth. The water's edge is a greener waterside meadow with reeds, and sand only in a strip where it meets the water. Same gouache brushwork as design/v2.
   - **Where each animal lives** follows its inherited habitat use (the engine's time allocation between leaves, ground and water):
     - all of its time in one habitat: well inside it; on open ground, well away from the water;
     - time split between two: toward the border between them, the nearer the more even the split (about half and half: at the border);
     - 90% or more at the water's edge: by the waterline. With 95% or more, now and then it wades into the shallows below its home (20–32 s, every 25–60 s).
   - **Babies** make their home near their mothers, as near as their own habitat use allows. At a follow, each twin among the others here moves beside its partner, as near as its own habitat use allows.
   - **Visual only.** Fair tests measure "nearest" from each animal's spot, placed exactly as before. *Checked on 20 good seeds, generations 0 to 76: all 424,023 spots are identical to main's.*
   - **Cards:**
     - where the animal spends its time: "Lives at the water's edge." or "Lives on the open ground, sometimes at the water." ("sometimes" from a fifth of its time);
     - when a meaningful trait at its high end doesn't fit where it lives, one gentle line: "Lots of webbing, but lives far from water." or "Curved claws, but lives on the open ground." A trait doesn't fit where it helps less than a quarter of what it helps in its best habitat, by the engine's own trait effects. On another group's card, the same for the group's average: "…, but they live …".
   - **No rule, number or fair test changed.**
   - **Moments** (decision 27): `joining`, `edge-arrow`, `other-card`, `habitat` (the water's edge) and `ground` join the moment shortcuts, with screenshots in `design/after/`.

55. **Classroom mode** (2026-09-27, Marc's full playtest, Part 1). Marc's teaching goal: a helpful trait in the right place clearly wins, a neutral trait stays about the same, a harmful trait clearly loses, and luck doesn't decide who survives. This is the first change to engine code.
   - **Beside M1, not inside it.** M1's own tests hash every file it ships, so any edit inside `lineage-m1/` fails them. Classroom mode is a small module beside it, `lineage-classroom/`, built from M1's own parts: mating, inheritance, mutation, birth and death records, genealogy and model identity. Only the survival step and the configuration are new. The original M1 mode, its config and its 412 tests are unchanged and pass. The game switches Classroom mode on (`game/src/engine.js`). Eight tests of its own are in `lineage-classroom/test` (`npm test` there).
   - **Who survives, with no coin flips:**
     - An animal dies of old age at M1's maximum age (6 generations). M1's gentler old-age odds at ages 3–5 were coin flips, so they are gone.
     - Every other animal lives in the place where it spends most of its time.
     - When more animals live in a place than it has room for (55, M1's capacity), the ones least suited to it don't make it, until it is full. Suited means fitness there, from the table below.
     - Between equally suited animals, the older one makes room, then the one that spends less of its time there, then the one born later. Well-suited animals are often exactly equal, because traits pile up at 0 and 1. *Measured over 10 worlds, 76 generations each: of 113,488 animals that didn't make it, fitness decided 58%, age 35%, time spent there 4.5% and birth order 2.6%.*
     - With room, nobody dies but the old.
   - **Clearer effects.** Each trait helps (+1), hurts (−1) or doesn't matter (0) in each place, in the direction of M1's own net effect (zone weights times trait effects, less upkeep). Where that net effect is under 0.4 it is a "~" and counts for nothing. A small "~" (a twentieth) was tried first: ranked survival ignores how big a difference is, only who is ahead, so the small effects were selected like helpful ones (thick fur in the leaves reached 1.00 by generation 76). The table, from `lineage-classroom/src/config.js` (Big eyes and Sleek body as inferred from the engine; Marc's table was cut off):

     | Trait | High leaves | Open ground | Water's edge |
     |---|---|---|---|
     | Webbed feet | ✗ | ~ | ✓ |
     | Curved claws | ✓ | ~ | ✗ |
     | Thick fur | ~ | ✓ | ✗ |
     | Long back legs | ✓ | ✓ | ✗ |
     | Strong tail | ✗ | ✗ | ✓ |
     | Big eyes | ~ | ✓ | ✗ |
     | Sleek body | ✗ | ~ | ✓ |
     | Coat shade, ear tips, tail tip | neutral | neutral | neutral |
   - **More variation.** 3 babies in 10 are born with one trait changed by 0.15–0.35 (M1: 2 in 10, 0.12–0.35). Every baby is still born a little different from its parents, with M1's drift.
   - **Less mixing.** Mates share at least half their time (M1: 0.02). A baby inherits time only in its parents' own places (where they spend at least half their time) and the places next door, with little drift (0.02; M1: 0.05). One baby in 20 moves next door, with 0.8–1.0 of its time (M1: one in 12 shifts 0.03–0.12), so a mover keeps at most a little time where it was born. *At generation 40 an animal spends a median 0.93 of its time at home, and 70% spend 0.9 or more (in M1's own world: 0.60 and 5%). With M1's small moves, no animal ever reaches the leaves or the water from the common ancestor.*
   - **The game's words follow it.** The predictions, the misfit note on cards and the moments' "wise" child read the Classroom table. In a prediction, a "~" is treated like a neutral trait: "Webbed feet won't matter. Other traits will decide."
56. **The common-ancestor world** (2026-09-27, Part 1; replaces decision 7).
   - Every founder starts on the open ground with the same ancestral body: 40 founders, M1's ancestor genome with no spread, all their time on the ground, M1's founder ages (0, 1, 2 by id). The high leaves and the water's edge start empty. Making it draws nothing, so the seed decides only what happens next.
   - Three founding families of 13 or 14 (decision 5). The arrival settles on the first of them.
   - A visit to a place with nobody in it (decision 53) says so: "High leaves: no animals live here yet."
   - All seeds 1–100 are good (all three places have animals at 76). The default seed is 13, where every moment shortcut finds its moment (seed 6 has no surviving ending in this world).
   - **The teacher demo:** `?demo=webbed` is the old defining world, M1's fixture with its webbing override, run in Classroom mode. "New world" and "Try another family" stay in it. *In seeds 1–30 the webbed family in the high leaves dies out at a median of generation 9 (3 to 58; alive at 76 in 2 seeds), and the webbed family at the water's edge is alive at 76 in 23.*
57. **Part 1 is measured, and some promises are missed** (2026-09-27). Part 2 and Part 3 are not started (the round's own rule). *Measured on seeds 1–30 of the common-ancestor world.*
   - *Fair tests inside a family, as the architect set them: the founding family, one place, started from each newborn with a new variation of 0.12 or more, the family's animals there with it against the same number without it (10 to 20 a side), each twin of the same age and within 0.05 of the same fitness there from its other traits.*
     - *Helpful there (675 tests): yours ahead at generations 1–5 in 98, 98, 96, 93 and 90%; ahead at some point within 5 generations in 100%. Harmful (810): yours behind in 99, 99, 96, 93 and 91%; at some point in 100%.*
     - *"~" (5,112) and neutral (10,835): within 15% of the other side in 39, 20, 15, 13 and 12%. At generation 5, yours ahead 48–49% and behind 47–48%: no lean either way.*
     - *Never shrinks while the place has room: places fill by generation 3–5, so no test of 10 a side meets room. With tests of 1 or more a side, 90 helpful tests met a generation with room, and none shrank then.*
     - *Twins picked without matching: helpful 76% ahead at 5, harmful 73% behind. With one baby of each pair joining each parent's family instead of the mother's: helpful 95%, harmful 96%, "~" and neutral 21%.*
     - *Even fair coin flips, 20 a side, keep two groups within 15% only 45% of the time after 5 generations; 80% needs about 100 a side.*
   - *A new glowing variation starts a median 4 s after the last (quartiles 4–10). 2 or more to pick from: 39% of the time for the simulated child of decision 42, 54% for a child who only watches (mean 1.25 and 1.66). A glow lasts a median 15 s. With 5 or 6 babies in 10 mutating instead of 3: 54% and 57% for the simulated child, and helpful and harmful fall to 86–90% at generation 5.*
   - *Animals live on the open ground from the start, in the leaves and at the water from a median of generation 1 (5 or more by a median of 3, at most 6), and those places are never empty again. All three places have animals at 76 in 30 of 30 seeds (fewest 104).*
   - *At generation 40 (median of 30 seeds; leaves / ground / water): webbing 0.00 / 0.20 / 0.94, sleek body 0.00 / 0.34 / 0.97, strong tail 0.00 / 0.02 / 0.96, curved claws 0.99 / 0.43 / 0.02, big eyes 0.44 / 0.96 / 0.04. Water animals have at least 0.2 more webbing, sleekness and tail strength than ground animals, and tree animals at least 0.2 more curved claws, in 30 of 30 seeds.*
   - *Stories (the simulated child, 90 stories): median 6.4 minutes (10th 2.7, 90th 14.2); none ends before the first follow, which comes at a median of generation 6. 84 end because the followed group died out: a group following a harmful trait now loses fast. A child who follows only helpful traits: 13.1 minutes; one who only watches: 10.0. Whole founding families last: 73 of 90 are alive at 76 and none is gone by generation 8.*
   - *Once all three places are full (by generation 3–5), there are 327 animals after the births and 165 before them, against about 270 on average and at most 370 in M1's world. All 23 moment shortcuts find their moment in seed 13.*
   - *Frame times, iPad landscape 1180×820 at 2×, headless Chromium, this branch (seed 13) against main (seed 6), normal CPU and 4× slower:*
     - *in the moments: a first follow 43 against 51 ms (231 against 248), mid-story 46 against 104 (247 against 513), a fair test 48 against 94 (249 against 447);*
     - *a family at generation 7, the camera on it: 93 against 80 ms (116 against 87 of the child's animals) and 96 against 99 (81 against 30);*
     - *a family followed 24 generations with no follow, which the backup panel prevents: 132 against 37 ms, with 138 of the child's animals in view. Each of the child's animals draws a glow and a lit outline, so a much bigger group costs more.*

58. **Decisions on Part 1** (2026-09-27, the architect; `docs/LINEAGE_NEXT_ROUND.md`).
   - **Confirmed:** the inferred Big eyes and Sleek body rows; "~" is exactly 0; the tie order (the older makes room first); Classroom mode living beside M1 in `lineage-classroom/`; default seed 13.
   - **Families (changes decision 5):** each parent's family gets one of a pair's two babies, the first baby parent A's and the second parent B's. Each animal still has one mother, so lines branch but never merge. *Measured in Part 1: with fair tests matched on age and fitness, helpful ahead at generation 5 in 95% and harmful behind in 96% (both babies to parent A: 90% and 91%).*
   - **Only traits that matter there can be followed.** A variation can be followed only where its trait helps or hurts (✓ or ✗) in the place the test would be, so every fair test has a clear result. This replaces the neutral and "~" fair-test promise.
     - A neutral trait, or a "~" there, still glows and can be tapped. Its card explains instead of offering a follow, with only "Keep looking": "Pointier ear tips don't help or hurt. Nothing to test here." or the table's "~" line, "Webbed feet don't matter much on open ground." (`game/src/why.js`, from the table in Part 3).
     - While the child's group is very small, "Your group needs you. Stay with them?" still comes first (decision 48).
     - Glows that can be followed light up first (the calm rule of decisions 32 and 50).
     - The backup panel offers only ✓ and ✗ traits.
     - Moment: `no-test`, a glowing baby whose trait can't be tested, its card open.
   - **Promise wording:** helpful and harmful are measured "at generation 5"; the "at some point within 5" figure is reported beside it.
   - **Glows** are measured again after Part 2.

59. **Part 2: Choosing** (2026-09-27, `docs/LINEAGE_NEXT_ROUND.md`). Changes decisions 5, 32, 33, 36 and 42.
   - **One family for the whole story.** A follow never moves the child's family. It starts a fair test inside it, in the family's place (where most of it lives): the family's animals there with the variation against its animals there without it. Each twin is the same age and within 0.05 of the same fitness there from its other traits (as measured in Part 1), then the closest in time spent there. Only when the family has fewer than 10 such pairs, animals from nearby fill in, those sharing the family's earlier chosen traits first. At most 20 pairs. Both sides change only by babies of their own mothers and by deaths.
     - The family's place changes only when another place clearly has more of it (3 more, and a quarter more), so tests don't flip between two places.
     - A glowing baby living in another place can't be followed. Its card says "This baby lives in the high leaves, away from your family.", with only "Keep looking".
     - A real move is told as it happens: "Some of your animals are moving to the water's edge." the first time 5 or more (and a tenth of the family) live in a place, once per place; "Most of your animals live at the water's edge now." when the family's place changes. A fast-forward to see if a trait is passed on stops if the family's place changes: "Most of your family moved. Let's keep looking."
     - The join line keeps its real numbers: "14 of your family have bigger eyes." or "12 of your family and 2 nearby have bigger eyes.", then "And 14 without, on the open ground, for a fair test."
     - On the map the family is blue as before. The fair test's sides are ringed, with the trait in gold and without it in purple; animals from nearby that fill in are drawn in their side's colour, and their cards say "From nearby, in your fair test". The counts read "With bigger eyes: 14 → 17" and "Without: 14 → 12".
     - The predictions ask about the two sides: "Will your animals with bigger eyes grow or shrink?" and "Which will do better: the ones with bigger eyes, or without?"
   - **A family with a future.** A tap follows the line of the animal's ancestor 3 generations up, or further up until the line has 13 living animals (a founding family's size). Later in a world, the line 3 generations up often has only 4 left. *Measured on 6 seeds: a tap at generation 10–70 follows a median of 18–26 animals (10th percentile 14).*
     - Before the first tap, an observer run on a throwaway copy of the world (same seed, played to now and 8 generations on) finds the families still alive then. A tap on any other family says "This family is in trouble already. Try another!"
     - The arrival opens on a family with a future: the first founding family that has one, or in a world kept as it is, the biggest.
     - The teacher demo (`?demo=webbed`) keeps every family, so the webbed family in the high leaves can still be followed.
     - *At generation 0 every founding family has a future (seeds 1–100; the check takes 6–27 ms). Mid-world, 89–99% of animals are in a family with a future (6 seeds, generations 10–70; the check takes 30–280 ms in Node). Where a founding family dies out before generation 60 (9 of seeds 1–100), 0 to 4 of 29–47 families have no future then.*
   - **"Try another family"** keeps this world as it is now: the animals stay where they are, and the child taps a living family with a future. The story still ends at generation 76 of the world, so a later story is shorter. Only a story that reached generation 76 starts the world again from generation 0. "New world" starts fresh.
   - **No going back.** Following a trait fixes the way the family went on it. The opposite way still glows, but its card says "Your family already chose sleeker bodies.", with only "Keep looking". When a fair test clearly showed the way it went hurting (the side with it fewer, and doing worse by a tenth or more), the card offers the way back with its reason: "Chunkier bodies are doing better up here. Go back?"
   - **"Passed on" replaces "spread" everywhere:** the card's button "Will it be passed on?"; the counter "Webbed feet are being passed on. 3… 7… 12 have it now."; "It wasn't passed on. Most new traits aren't."; "Only a few have it so far. Too few to test."; "Many have it now. Too few without it to test."; and on a family that didn't have time, "Their story ended before new traits could be passed on."
   - **Your family so far:** under the counts, each chosen trait as a chip, added at each follow (a way back replaces its trait's chip). A chip greys out when fewer than 3 of the family have it, with its reason below: "Bigger eyes faded. They didn't help here." when it hurts in the family's place, else "They weren't passed on."
   - **Visible glows:** a glowing baby's ring is bigger and brighter, pulses gently every 2.4 s with a second faint ring, and a small sparkle twinkles above the baby.
   - **Big families:** with more than 36 of the child's animals in view, they share one outline, stroked once, and lose the glow under each, their rim light and the light on their backs. Glowing babies keep theirs. Every animal's fur is now one stroke instead of ten.
   - **Moments:** `away`, `back`, `go-back`, `moving`, `so-far`, `another-family` and `in-trouble` join. A family's fate doesn't depend on what the child follows, and no founding family of seed 13 dies out, so the moments page opens `extinct` and `another-family` in seed 6 and `in-trouble` in seed 72.
   - *Measured with the simulated child of decision 42 (seeds 1–30, every founding family, 90 stories):*
     - *Stories: median 18.5 minutes (10th 15.3, 90th 21.3). 87 of 90 reach generation 76 (Part 1: a median of 6.4 minutes, and 84 of 90 died out, because a follow moved the child to a new group). The first follow comes at a median generation 8 (1.8 minutes); 3 follows per story (90th 7). Of 1,329 taps, 1,032 fast-forward to see if a trait is passed on. A median 4 move lines per story.*
     - *Glows: 35% of glowing babies can be followed; 22% live away from the family, 24% have a neutral trait, 14% a "~" there and 6% the way back. While follows are open there are 2.24 glowing babies on average (2 or more 76% of the time), 0.67 that can be followed (1 or more 42% of the time, 2 or more 19%).*
     - *Fair tests, each tracked 5 generations: helpful there, 303 tests (a median of 11 pairs; 26% with animals from nearby): the side with it is ahead at generations 1–5 in 100, 98, 97, 95 and 91%, and at some point within 5 in 100%. Harmful there, 16 tests (69% with animals from nearby): behind in 100, 94, 94, 94 and 88%, and at some point in 100%. A harmful trait is rarely passed on far enough to test.*
     - *Frame times with 110 of the child's animals in view (seed 13, a family followed 14 generations with no follow, the camera on it; iPad landscape 1180×820 at 2×, headless Chromium): 62.5 ms (slowest 5%: 83) drawn cheaply, against 83.1 (100) in full; with a 4× slower CPU, 316 against 423 ms.*

60. **Part 3: Understanding why** (2026-09-27, `docs/LINEAGE_NEXT_ROUND.md`). Changes decisions 14, 35 and 59.
   - **The table of reasons** is `docs/LINEAGE_WHY.md`: Marc's line for each trait in each place, with its direction matched to the engine's Classroom table (decision 55). `game/src/why.js` holds the same lines, and the game's tests check that every "doesn't matter much" line is exactly where the engine's effect is 0.
   - **Every change gets a reason.** After a watched generation in which the family grew or shrank, the narration adds why, from what the family has (its animals there average at least halfway to the trait's far end) in its place:
     - growing: its biggest helper, then "But …" its biggest hurter: "Webbed feet push through water." "But long legs drag in the water.";
     - shrinking, mostly crowded out: the helper, then "But …" the hurter. With no hurter, the trait that most set the family's animals that died apart from the survivors where they lived, by 0.1 or more of its average: "Long back legs help them run fast." "Others here have longer back legs." (or "The ones that died had longer back legs.");
     - when the table has no reason: "Lots of babies were born." (growing with no helper), "Some were old and died." (most deaths of old age) and "The place is full, so some made room." (crowded out, with no one trait setting the ones that died apart: they were a little less suited in many small ways).
   - **See, guess, explain.** The world waits, and the child taps one of three answers, then reads why. The answers are one trait's lines for the three places, so the child has to think about where the animals live. Nothing is marked wrong: "Yes! Big eyes spot things across open ground." or "Good thinking. But here, big eyes spot things across open ground." With no tap in 20 s, "Here's why: …". Why stays up 9 s, or until Next; both countdowns wait while a line is read aloud.
     - At a fair test's result: from the end of its fast-forward until 5 generations after the follow, once the two sides clearly differ (by a tenth, groups.js) and the way the table says: "Why are the ones with weaker tails doing better?"
     - At a sudden drop of the family (a quarter of it and 3 or more in one watched generation, mostly crowded out), when a trait explains it: its hurter, or the trait that set the ones that died apart. "Why is your family shrinking?", with "Others here have longer back legs." after why.
     - At most one question every 4 generations.
   - **Passed on uses the table.** The fast-forward starts with "More webbing is being passed on. Webbed feet push through water.", then its counter. A trait that hurts there and wasn't passed on: "It wasn't passed on. Long legs drag in the water." (a helpful one keeps "Most new traits aren't.").
   - **Helping here / Hurting here**, under the generation panel while a family is followed, each line with a speaker: "Helping here: webbed feet, a sleek body." "Hurting here: nothing." Up to three traits each, from the family's animals in its place.
   - **The ending's clue is the same trait in different places** (replaces the with/without comparison of decision 14): one meaningful trait's animals at its far end in a place where it helps and in a place where it hurts, then and now. "Webbed feet at the water's edge: 0 → 107" and "Webbed feet in the high leaves: 0 → 0". "Then" is when all three places first had 10 animals in the story. A trait the family chose comes first when its two counts changed differently by 3 or more; the one-line clue stays as a fallback.
   - **Predictions name the trait and the place, and the reasonable answer gives the table's reason:** "Some of your animals now have longer back legs. They live in the high leaves. What will happen?" "Grow. Long back legs help them leap between branches." (`docs/LINEAGE_PREDICTION_QUESTIONS.md`).
   - A glowing baby whose variation 20 or more of the family there have already, with too few twins without it for a fair test, can't be followed: its card says "Many have it now. Too few without it to test." (before, it offered a fast-forward that could only end that way).
   - **Moments:** `reason`, `why`, `why-answer` and `why-drop` (in seed 1, whose first family has one at generation 3; the moments page opens it there).
   - *Measured with the simulated child of decision 42 (seeds 1–30, every founding family, 90 stories; minutes leave out the time panels are up):*
     - *Guesses: 341 at a fair test's result (of 344 follows) and 3 at a sudden drop; a median of 4 per story (90th percentile 7). Of 29 sudden drops in watched generations, 26 had no one trait setting the ones that died apart (they were a little less suited in many small ways: in 12 drops of 10 seeds, a mean fitness of 2.87 against the survivors' 2.97), so no guess comes then.*
     - *Size changes told: 3,102. A reason from the table for 55%, "The place is full, so some made room." for 38%, "Lots of babies were born." for 7%.*
     - *"Helping here" names a trait in 93% of watched generations; "Hurting here" in 1%: families soon lose what hurts where they live.*
     - *The same-trait clue: 90 of 90 endings.*
     - *Stories: median 19.2 minutes (10th 15.9, 90th 21.6), 4 follows (90th 7); 33% of glowing babies can be followed.*

61. **Part 4: Connection** (2026-09-27, `docs/LINEAGE_NEXT_ROUND.md`). Changes the naming of Step 5.
   - **The family tree strip:** the animal the child tapped first ("First mother"), then the real mother line of the latest followed baby: great-grandmother → grandmother → mother → this baby, each drawn from its real body (up to 4). Followed babies are not each other's mothers, so the strip doesn't chain them: it shows the latest baby's own mothers, as far back as the story knows a body (every family member since the story began, and anyone alive). When the first mother is in that line she is marked there; otherwise she comes first, then "…". Before any follow, the strip is the first mother and her own mothers. One speaker reads the strip.
   - **The living portrait:** the family's average body, in the corner under the zoom buttons, drawn in the family's place and redrawn every generation. A tap opens "Your animals, on average" (with the family's name, "Your Mossfoot animals, on average"): the body drawn large, each trait against the world at the start (as on the ending), and the family tree strip. The world waits while it is open; × closes it.
   - **Names** (`docs/LINEAGE_FAMILY_NAMES.md`):
     - bigger lists: 12 habitat words for each place and up to 4 words for each trait, 1,338 names (before: 323). "shag" was left out for its British meaning; "Rockhopper" (a penguin) and "Sunspot" are never made;
     - fresh names every story, from the browser's own random numbers (before, the same family in the same world always got the same three);
     - "Type your own" ("Type a name for your family.") and "Use my name" ("Type your first name.": "Mia" and the family's standout trait word make "the Miapaddle family"). Letters only, in any alphabet, 1 to 12, capitalised. The sheet moves to the top, clear of the keyboard, and the countdown waits while the child types;
     - a small filter: a few rude or unkind words, whole or inside a name (a few only as the whole name, because they hide inside real names such as "Cassie"), get "Let's try a different name.";
     - nothing typed leaves the iPad: no network call, and the name is kept only for the story.
   - **Moments:** `type-name`, `my-name` and `average`.
   - *Measured (seed 13, iPad landscape 1180×820 at 2×, headless Chromium): redrawing the portrait takes 2.4 ms a generation (12.8 ms with a 4× slower CPU); opening "Your animals, on average" takes 121 ms over two frames (640 ms), 31 ms of it for the tree strip's five drawings (74 ms).*

## What the engine already gives you (do not rebuild these)

- `advanceGeneration(state, config, hooks)` — runs one generation; `hooks` receive birth and death events.
- `isExtinct(state)` — lineage/population extinction check.
- Tracer channels (`createTracerChannel`, `resolveFocalLineage`, `resolveLivingDescendants`) — this **is** "follow this group." Observer actions are proven not to affect biology.
- Zones: `canopy`, `edge`, `floor`, `shoreline`. Habitat use is inherited separately from body traits.
- Ten inherited body traits, each with three levels, mutating at birth only.
- The whole thing runs in a browser as plain ES modules; `index.html` already loads it with no build step.

---

## Steps — run ONE at a time in Claude Code, review, then start the next

### Step 1 — The bridge (real biology on the designed canvas)

**Goal:** Replace the mockup's fake wander-and-random-flash with the real engine.

- Copy the visual layer from `Lineage World.dc.html` (terrain, pan, camera, followed-vs-gray rendering, narrative log, home button) into a new `game/` directory alongside `lineage-m1/src`. Import the engine directly; do not copy or modify engine files.
- Run one generation every **N seconds** (make N a constant; start at 8). Between generations, animals wander within their zone for visual life only.
- Real births place a new animal near a parent. Real deaths remove an animal. A mutation at birth triggers the flash on that animal. Population counts in the log come from the real state.
- "Follow this group" = create a tracer channel from the tapped animal's founders. The camera centers on the living descendants of that channel.
- Keep the M1 test suite passing.

**Done when:** you can open it on a laptop, tap an animal, watch its group for two minutes, and every flash, birth, and disappearance is a real engine event. Print the generation number on screen so you can confirm it advances.

**Do not:** touch the creature card, journal, extinction flow, or visual polish. Ugly is fine here.

### Step 2 — The eight feedback corrections

**Goal:** Apply `lineage-m2-design-feedback.md` items 1–6 to the bridged game.

- Camera starts on the followed cluster; drag to explore; "Back to my group" returns.
- Followed lineage rendered larger, sharper, with detail; grays smaller and faded but still tappable.
- Only animals in the followed lineage can be **followed** into a branch; grays can be inspected but not chosen.
- Flashes: newest bright, previous dimmed, older gone.
- Decline narration from real counts: "Your group is smaller than last generation." "Only three of your animals are left in the canopy."
- Extinction: world keeps running, message "The last of your group has passed. Their story lasted N generations.", prompt to tap any animal to follow a new group. **No game-over screen.**

**Done when:** you can deliberately follow a badly-suited group (webbed feet in the canopy), watch it decline with narration, see it end, and pick a new group — the sentence at the top of this page, minus the child.

**Do not:** start the creature card or journal.

### Step 3 — The creature card

**Goal:** Make tapping worth it.

- A layered 2D creature renderer: body, head, ears, feet, tail, coat as separate drawn parts. Each of the ten traits swaps or scales a part. Siblings share most genes, so they look related but not identical for free.
- A painted-texture overlay (grain, soft edges) so it reads as gouache/field-guide, not clip art.
- Card shows: the creature, its family name, its zone, the traits in kid language, and which traits are new in this animal.
- Render from the **real genome** of the tapped animal.

**Done when:** you tap five animals from one family and want to tap a sixth. If the first card is boring, the step is not done.

**Do not:** build the collection screen, silhouettes, or mythical forms.

### Step 4 — Look design (Claude Design, not Claude Code)

Marc takes screenshots of the live build to Claude Design and gets mockups of six moments at the quality he wants: (1) arrival from morning mist into the canopy; (2) a generation as one day, dawn to night; (3) a variation appearing (a soft ring of light, a short caption); (4) a group growing (warm) or shrinking (quieter, cooler, never scary); (5) the last one and the ending, with the reveal; (6) the creature card at full quality. The result is committed to design/v2/.

Done when: Marc looks at the six moments and thinks "yes, that."

### Step 5 — Beauty pass (Claude Code)

Bring the live game up to design/v2/.

- World: painted terrain with depth, the dawn-to-night generation cycle, moving water, swaying leaves, a few ambient insects and birds that belong to no group.
- Animals: simple walk and idle motion; babies stay near their mother briefly after birth.
- Moments: arrival, variation bloom, grow/shrink mood and the ending as mocked in design/v2/.
- Naming: when a child starts a story, they pick a name for their family from three tappable options generated from its habitat and traits (e.g. "the Mossfoot family"); the name is used everywhere afterwards.
- Sound: a soft ambient bed per habitat and a small chime for a variation. Sound starts on the first tap, with a mute button.
- Performance: smooth on the class iPads; if effects cost smoothness, reduce the effects.

Done when: a colleague says "oh, that's lovely" within ten seconds, and it runs smoothly on a class iPad.

### Step 6 — The prediction journal (no typing, no backend)

Before a fast-forward, one prediction; afterwards, the prediction shown beside what really happened. Questions come from the story's real state via a written table (see closed decisions). Tappable options only, read aloud. Entries are labelled as fictional simulation history.

Done when: a prediction made before a fast-forward is shown beside the real outcome, and the options were specific to that story.

### Step 7 — Three kids, ten minutes

Marc puts it on an iPad in front of three students without explaining anything and watches. Their behaviour decides what comes next.

---

## Explicitly NOT in this scope

Collection screen and silhouettes · mythical recombinations · teacher view · persistence / offline storage · journal export · additional habitats or traits · any further M1 audit, provenance or acceptance tooling · Blender or any 3D pipeline.

---

## Rules for Claude Code on every step

- Read this file first. Do exactly one step. Stop when its "done when" is met and report back in plain language what to look at.
- Never edit files under `lineage-m1/src/core`, `src/observer`, or `src/config`. If the engine seems to need a change, stop and say so.
- Do not add tests for the game layer beyond a smoke test that it loads. The acceptance test is a human looking at it.
- Do not write repair records, audit manifests, or status derivations. Write a five-line summary.
- If a step is taking more than a day of work, stop and report what is blocking rather than expanding scope.
- Never merge a pull request. Start each step on a new branch from main, and end it by opening a new pull request into main. Marc merges.
- End every report with a brief for the architect, who works in a separate thread. Give it twice: as a markdown code box to copy and paste, and as a downloadable .md file with the same text. It must stand on its own: where the build stands (pull request, branch, what is merged), the decisions taken, every measurement, what changed in this doc, what was built, new findings, the decisions needed from the architect, and how it was measured. It comes in addition to the five-line summary, and it goes in the report, not in the repository.
