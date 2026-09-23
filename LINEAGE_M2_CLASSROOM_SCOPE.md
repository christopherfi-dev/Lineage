# LINEAGE — Classroom Edition (Milestone 2 Scope)

**Date:** 2026-09-06
**Audience:** one Grade 3 class, 1:1 iPads, not public.

## The one sentence that defines done

> A third grader follows their animals through a series of adaptations, notices when a choice helped or hurt compared with the groups they did not choose, and can say why at the end.

Every step below either moves toward that sentence or it is out of scope.

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
   - **Unchosen options** stay on the map as their own marked groups, defined the same way. Tapping one shows its growth since the choice compared with yours ("Their group grew 50%. Yours shrank 25%.").
   - **Pace:** watch 4 generations before the first choice. After each choice point, fast-forward 2 generations (2 s each, visibly faster), then watch 3 (20 s each). That is about 80 s per choice, with STORY_CHOICES = 15 choice points, so every story ends at generation 76, about 19 minutes in.
   - **Curated worlds:** the game uses only seeds where all three habitats still have living animals at generation 76, checked by running the engine ahead before the world is shown (an observer run; the biology is unchanged). "New world" picks only such seeds. 95 of the first 100 seeds qualify.
   - **Camera:** the group may spread across habitats. "Back to my group" goes to its largest cluster, and the home glow marks every member.
   - **Endings:** the story ends when no living animal fits the group, or after the last choice point. Every ending is a reflection screen, not a game-over screen: the group's actual average traits at the end, the choices made, one question, and "Try another family in this world" / "New world". Surviving groups will later be revealed as the real animal they most resemble, using the group's actual traits; there is no single correct line.
   *Measured on 30 good seeds × 9 starting families with random choices, and checked again with the game's own story code: median story 19.3 minutes, 79% of stories reach 10 choices, and the median group after each choice is 27–123. A group's webbed members are gone from the high leaves 2 generations after the choice but still at the water's edge at the next choice in every seed.*

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

### Step 4 — The prediction journal (tappable, no typing)

**Goal:** One prediction before a time-skip, one reflection after.

- Frontend: a clean field-guide panel that shows a question and 3–4 tappable options, records the tap, and later shows the prediction next to what happened. No text field.
- Backend: a small endpoint on the existing room-based API that receives lineage state (zone, traits, population trend) and returns a question plus options generated by Claude, one plausible-correct and two or three common kid misconceptions.
- Journal entries are labelled as fictional simulation history.

**Done when:** a prediction made before a 10-generation skip is shown back beside the real outcome, and the options were specific to that lineage, not generic.

**Do not:** add download/export, teacher view, or persistence beyond the session.

### Step 5 — Three kids, ten minutes (not a Claude Code step)

Put it on an iPad in front of three students. Watch. Do not explain anything. Note where they tap, what they ignore, and whether they want to keep going. Their behavior decides what Step 6 is.

---

## Explicitly NOT in this scope

Collection screen and silhouettes · mythical recombinations · teacher view · persistence / offline · journal export · sound · additional zones or traits · accessibility pass · performance hardening beyond "runs smoothly on the class iPads" · any further M1 audit, provenance, or acceptance tooling · Blender or any 3D pipeline.

These belong to later milestones. Do not pull one in because it looks easy.

---

## Rules for Claude Code on every step

- Read this file first. Do exactly one step. Stop when its "done when" is met and report back in plain language what to look at.
- Never edit files under `lineage-m1/src/core`, `src/observer`, or `src/config`. If the engine seems to need a change, stop and say so.
- Do not add tests for the game layer beyond a smoke test that it loads. The acceptance test is a human looking at it.
- Do not write repair records, audit manifests, or status derivations. Write a five-line summary.
- If a step is taking more than a day of work, stop and report what is blocking rather than expanding scope.
- Never merge a pull request. Start each step on a new branch from main, and end it by opening a new pull request into main. Marc merges.
- End every report with a brief for the architect, who works in a separate thread. Give it twice: as a markdown code box to copy and paste, and as a downloadable .md file with the same text. It must stand on its own: where the build stands (pull request, branch, what is merged), the decisions taken, every measurement, what changed in this doc, what was built, new findings, the decisions needed from the architect, and how it was measured. It comes in addition to the five-line summary, and it goes in the report, not in the repository.
