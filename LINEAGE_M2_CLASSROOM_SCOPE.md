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
2. **No Blender, no 3D.** The game is a 2D top-down painted world on HTML Canvas. Creatures are layered 2D parts.
3. **The design direction is settled.** `Lineage World.dc.html` (Claude Design, 2026-09-05) plus the eight corrections in `lineage-m2-design-feedback.md` are the visual and interaction authority.
4. **"Done" is judged by a child, not an auditor.** No step is closed by a test report alone.
5. **A followed group is a family, and a family is a mother line** (2026-09-23). Every baby belongs to exactly one family, its mother's, and is placed beside her. The engine has no sexes, so the "mother" is always the first parent in the engine's birth record. Tapping an animal follows the family of its ancestor **K = 3** generations back through that same line, so lines branch but never merge. Tapping a member of your current family offers "Follow just her branch," which narrows to her own line. Generation-0 founders have no mothers, so each habitat's founders start as founding families of about a dozen (the defining fixture's two webbing groups are two of them). All of this is computed in the game layer from the engine's birth records; `lineage-m1/src` is untouched. This replaces Step 1's tracer-channel group.
   *K was measured on 2,520 followed families per value (30 seeds, taps at generations 0–110). At K = 3 a new family starts at a median of 12 animals (middle half 7–15) and lasts a median of 23 generations (middle half 8–72); 30% last more than 60 generations. K = 4 started at 14 but lasted a median of 31.*
   *Now only the starting group (2026-09-23): a story follows the tapped animal's K = 3 family until the first choice, then follows adaptations (decision 6). "Follow just her branch" was removed with the story loop.*
6. **The story loop** (2026-09-23, replaces the first version). A story follows the child's animals through a series of adaptations.
   - **Start:** generation 0 waits for the first tap; the child follows the tapped animal's K = 3 family (decision 5).
   - **Choice points:** two or three options under the title "Which one will you follow?", each a variation carried by at least 3 of the current group. The child chooses whom to follow, never what mutates; observer choices never affect the biology. If the child does not choose within CHOICE_SECONDS (20), one option is picked at random and the screen says "Time's up! This one was picked at random." A choice point without two such variations passes, and the story carries on.
   - **Adaptation rule: replacement.** After a choice, the group is every living animal, anywhere, that carries the latest chosen variation, fixed when it is chosen (the group's median for that trait, plus or minus 0.12). Earlier choices no longer count. The alternative, "the latest variation and at least half of the earlier ones", was measured and failed: 33% of stories reached 10 choices and the median group fell to 12.
   - **Unchosen options** stay on the map as their own marked groups: animals with that variation but not the child's (decision 9). Tapping one shows its size since the choice compared with yours, as counts with small bars ("Theirs: 18 → 12. Yours: 20 → 31."; decision 12).
   - **Pace:** watch 4 generations before the first choice. After each choice point, fast-forward 2 generations (2 s each, visibly faster), then watch 3 (20 s each). That is about 80 s per choice, with STORY_CHOICES = 15 choice points, so every story ends at generation 76, about 19 minutes in.
   - **Curated worlds:** the game uses only seeds where all three habitats still have living animals at generation 76, checked by running the engine ahead before the world is shown (an observer run; the biology is unchanged). "New world" picks only such seeds. 95 of the first 100 seeds qualify.
   - **Camera:** the group may spread across habitats. "Back to my group" goes to its largest cluster, and the home glow marks every member.
   - **Endings:** the story ends when no living animal fits the group, or after the last choice point. Every ending is a reflection screen, not a game-over screen: the group's actual average traits at the end, one line of evidence from the world (not the answer), the choices made, one question, and "Try another family in this world" / "New world". A surviving group is revealed as the real animal it most resembles (decision 10); there is no single correct line.
   - **The clue** shows both sides when it can (decision 14). Otherwise it is **the evidence line** (confirmed 2026-09-23). The evidence line looks only at the seven meaningful traits, over everyone in the group since it last formed. It counts the trait's far-end word in the group's direction ("webbed feet"), in the other habitat where that count changed most. "Then" is the story's start, and a count of zero is "none". If the count changed by fewer than 3 animals, the next most distinctive trait that changed by 3 or more is used; if none did, the one that changed most.
   *Measured on 30 good seeds × 9 starting families with random choices, and checked again with the game's own story code: median story 19.3 minutes, 79% of stories reach 10 choices, and the median group after each choice is 27–123. A group's webbed members are gone from the high leaves 2 generations after the choice but still at the water's edge at the next choice in every seed.*
   *Replaced in part (2026-09-24) by decisions 32–34: the choice points, the replacement rule for the group, the unchosen options and the fixed pace. The start, the curated worlds, the camera, the endings and the clue stand.*

7. **The opening family stays** (2026-09-23). The camera keeps opening on the webbed family in the high leaves. Its quick ending (before any choice in 93% of seeds, at a median of generation 3) is the first lesson.
8. **Neutral traits stay as choice options** (2026-09-23). Coat shade, ear tips and tail tip can be offered like any other variation, and the choice card never marks them as neutral. The lesson is "not every difference is an adaptation": after the child follows one, the next "Since your last choice…" line and the ending add "[Trait] didn't change who survived. Your group grew/shrank because of its other traits."
9. **Unchosen groups are separate sets** (2026-09-23). An unchosen group is the animals with its variation but not the child's current variation. The map (rings and colours), the corner panel and the growth readout ("Theirs: 18 → 12. Yours: 20 → 31.") all use these sets.
   *Measured with the game's own story code (270 stories, 6,215 unchosen groups): right after a choice an unchosen group has a median of 38 animals (middle half 24–69), against 93 when it overlapped the child's group. 2 start empty, 10 under 3 and 208 under 10.*
   *Replaced (2026-09-24) by decision 33: the fair test's "others here". No group is made from an option not chosen.*
10. **Real-animal reveal** (2026-09-23). A surviving story ends with a real-animal reveal based on the group's actual average traits and main habitat, using the table and matching rule in `docs/LINEAGE_REAL_ANIMAL_REVEAL.md`. Text for now; art comes later. The file's "why" lines were checked against the zone weights; the changes and the reasons are listed at its bottom.
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
   - **The card:** tapping a glowing newborn opens its card with "Follow animals with [trait]" and "Not this one". The buttons show only while the world is watched (not during a fast-forward or a panel) and follows are left. "Not this one" stops the glow and makes no group.
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
34. **The push, and "Since your last choice"** (2026-09-24).
   - **The push:** with no follow for PUSH_SECONDS (120) of story time, the choice panel opens as a backup. It offers up to 3 variations that can start a fair test: watched ones first, then glowing ones, then others the group has spread (at least 3 members carry them).
     - It keeps the 20-second timer, the random pick and "Time's up!". The options not picked make no group.
     - If nothing can start a fair test, the push waits and checks again each generation.
   - **"Since your last choice"** shows the last fair test at the next follow: in the backup panel, or as its own sheet after a follow from a card or the gentle line. It holds the neutral note (decision 8) and the prediction beside what happened (decision 30).
     - The sheet waits while a line is read aloud or a card is open. "Next", or 15 seconds, goes on to the new follow.
   - **Moments:** `?moment=follow` (a glowing newborn's card), `?moment=watching` (a watched variation ready to follow) and `?moment=fairtest` (both groups five generations after a follow) join the moment shortcuts (decision 27). All moments were shot again in `design/current/`.
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
   - **Below MIN_SIZE** the card keeps "Only N here have this. Watch it?". The gentle line for a watched variation appears when both sides reach MIN_SIZE.
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
