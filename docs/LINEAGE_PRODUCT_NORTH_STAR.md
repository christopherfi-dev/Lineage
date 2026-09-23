# LINEAGE — Product North Star
## Stable Product Authority

This document defines what LINEAGE is, why it exists, what it must feel like, and which product laws later engineering must protect.

It is intentionally not a simulation specification. Numerical constants, data schemas, lifecycle algorithms, and rendering implementations belong in milestone contracts. Those contracts may change. This product identity does not.

---

# 1. Authority and decision order

For all LINEAGE work, use this order:

1. **Vision** — the experience described here.
2. **Pedagogy** — what students already know and what this game uniquely lets them do.
3. **Design** — the interaction and presentation that create that experience.
4. **Engineering** — the systems that make the design truthful and reliable.

Engineering exists to protect the first three layers. A proposal that makes the model more sophisticated but makes the product less like this document is wrong.

Milestone contracts may override earlier technical documents. They may not quietly redefine the product.

---

# 2. Audience and classroom context

LINEAGE is for Grade 3 students, usually ages 8–9, in an IB PYP unit with the central idea:

> **Survival depends on adapting to environmental changes.**

The summative assessment asks each student to research a real animal and create a nonfiction book explaining its adaptations and how those adaptations help it survive in its biome.

LINEAGE is one part of a larger unit. It is not responsible for teaching the entire theory of adaptation from nothing.

Before students use LINEAGE, they have already encountered these ideas through reading, data analysis, investigation, and research:

- adaptations are inherited body features that can affect survival;
- different environments present different challenges;
- a trait that helps in one environment may not help in another;
- offspring inherit traits from parents;
- variation appears without animals deciding what they need;
- populations change over generations because some inherited variations leave more descendants;
- the peppered moth provides a real example of environmental conditions changing which variants persist;
- an acquired modification to an individual is not automatically inherited by its offspring.

The game therefore does not need to interrupt play to reteach these concepts. Its job is to let students use them, make predictions, and encounter consequences.

---

# 3. Product definition

A child watches a living population of small mammal-like animals in a world containing different ecological zones.

Time runs. Animals move, feed, mate, have young, and die. Generations pass quickly enough to observe population change.

Every roughly twelve seconds, a noticeable inherited variation appears somewhere in the population: wider toes, thicker fur, a different coat shade, longer hindlimbs, or another plausible variation of the same body plan. The variation flashes briefly. The child can tap it to inspect it and flag that group for the end of the round.

Flagging is free. It does not change the animals. Missing a variation costs nothing. It remains part of the biological world and may appear again in later descendants.

The child can also explore the world freely. They can inspect individuals, compare groups, and notice that animals they are not following may be doing better or worse for reasons they have not yet understood.

At the end of the watch phase, the world pauses. The flagged possibilities are shown. The child may choose one existing group to keep following or choose nothing. There is no decision timer.

Time then runs again. The chosen group thrives, stalls, mixes with other groups, or disappears. The rest of the world continues for its own reasons.

The child repeats this cycle and builds a history of what they expected and what actually happened.

---

# 4. The central experiment

LINEAGE must allow a child to ask:

> **What happens if a tree animal gets webbed feet?**

The game must not prevent the variation because it appears unhelpful. It must not quietly move the carriers toward water. It must not arrange for every choice to work out.

The same webbing variation can appear among animals already living mostly in the canopy and among animals already living mostly near the shoreline.

The canopy carriers may lose grip, fall more often, leave fewer descendants, or disappear. The shoreline carriers may swim more effectively and leave more descendants.

The difference comes from where those animals already spend their time, not from the student’s click and not from the variation directing them toward a useful environment.

This one experiment contains the architecture of the entire product.

---

# 5. The required apparent paradox

Two statements must both remain true:

1. **The biological world is identical no matter what the student observes or follows.**
2. **The group the student follows can have a genuinely different outcome from another available group.**

These statements are compatible because the student chooses among existing groups that already occupy different contexts.

The click changes the history the child attends to. It does not change the world that produces that history.

If a student action changes mutation, movement, mating, survival, reproduction, density, or any biological random draw, the architecture has failed.

If every possible followed group produces effectively the same history, the product has failed even if observer independence remains technically correct.

---

# 6. What the game is and is not

## It is

- an exploration game;
- a living-world observation game;
- a prediction-and-consequence game;
- a discovery collection;
- a generator of questions for later real-animal research;
- a place where being wrong can be informative and memorable.

## It is not

- a survival game;
- a score-maximization game;
- a creature-building optimizer;
- a quiz with animals as decoration;
- a worksheet presented through a browser;
- a genetics laboratory claiming scientific precision;
- a tool in which students command evolution;
- a source of factual claims about the exact evolutionary history of real animals.

The closest experiential references are:

- **Little Alchemy 2** for curiosity, combinations, silhouettes, and the hope of finding something rare;
- **Spore** only for the emotional payoff of seeing a creature change across generations.

Spore’s directed creature assembly is explicitly not the mechanic.

---

# 7. Product feeling

The world is alive before the child touches anything.

Animals move with purpose. Water shimmers. Leaves move. Snow drifts. Dust blows. Ambient sound gives each zone a distinct atmosphere. The presentation should resemble a stylized nature documentary, not an educational dashboard.

The child should be able to spend time simply watching.

Variations create small moments of attention rather than modal interruptions. Inspection should feel like looking closer, not opening a data-entry form.

The paused decision phase should create conversation. Children should have time to disagree, explain what they noticed, and make a prediction before continuing.

The interface should show evidence and observations rather than verdicts.

Use language such as:

> “Animals with wider feet fell from branches more often.”

Do not use language such as:

> “Wider feet were a bad adaptation.”

The game supplies the consequence. The child interprets it. Explanations come later.

---

# 8. The educational job

Every other major unit experience is retrospective. Existing animals already have their adaptations. Historical data describe changes that already happened.

LINEAGE provides the missing experience:

> **Commitment with consequences.**

The student makes a prediction about an uncertain future and then faces the result.

The educational value does not depend on choosing the successful group. Following a variation that leads nowhere can teach more than choosing an obvious advantage, because the student can trace backward and explain why their expectation failed.

The game’s central lesson is:

> **Most inherited variations do not lead to lasting success. Whether a variation helps depends on the context in which it appears.**

The product must not collapse this into “adaptations are good” or “animals evolve what they need.”

---

# 9. Core play loop

1. The world runs in real time.
2. A noticeable variation surfaces approximately every twelve seconds.
3. The child may inspect and flag it without cost or commitment.
4. The child may inspect other animals and groups at any time.
5. The watch phase ends and the world pauses.
6. Flagged possibilities are shown.
7. The child records one prediction and chooses one existing group to follow, or chooses nothing.
8. Many generations pass.
9. The chosen group and all other groups experience consequences.
10. The child later sees the saved prediction beside the actual result.
11. The next round begins.

The decide phase has no timer.

Following nothing is never punished. The world continues. The only thing the child loses is a focused history to examine.

---

# 10. Variation laws

These laws are non-negotiable.

## 10.1 Variation is not filtered by usefulness

A plausible mammalian variation may appear anywhere it is biologically permitted by the body plan.

Webbing may appear in canopy animals. Dense fur may appear in a hot place. A neutral coat marking may appear in any zone.

The environment affects what happens after a variation appears. It does not decide which variation is allowed to appear.

## 10.2 Most variation remains inconsequential

Neutral inherited traits are load-bearing. Coat shade, ear-tip shape, eye colour, and markings may spread, disappear, or persist without affecting survival, movement, mating, upkeep, or habitat use.

Do not add hidden costs to neutral traits to make every choice meaningful.

If the surfaced pool contains only useful or harmful traits, the game’s central lesson becomes false inside its own world.

## 10.3 Meaningful traits require context or cost

Every meaningful trait must have at least one genuine trade-off or at least one context in which its useful function is absent.

A pure improvement that helps everywhere is an upgrade, not an adaptation.

## 10.4 Animals do not choose what appears

Variations arise in offspring. Existing animals do not transform because a player clicked them or because the environment “needed” a trait.

## 10.5 Morphology does not move animals

A body trait never writes directly to habitat use.

Webbing does not pull an animal toward water. Dense fur does not push it toward snow. Habitat use is its own inherited variation.

---

# 11. Following, extinction, and history

The student follows an existing group. They never create a mutation, move an animal, or order a group to reproduce.

Observer history is stored independently from biology. A child’s later choices may be nested inside earlier choices, so observer histories must remain independent channels rather than proportions forced to sum to one.

Extinction is history, not failure.

There is:

- no game-over screen;
- no score penalty;
- no retry command framed as correction;
- no implication that the child played incorrectly.

A group that disappears remains visible in the lineage history. The child continues by examining living relatives or choosing another current group.

The interface must distinguish:

- a distinct followed group ending;
- some contribution from its founders remaining in mixed descendants;
- the entire biological population becoming extinct.

These are not interchangeable claims.

---

# 12. Evidence before explanation

The order is binding:

1. consequence;
2. the child’s interpretation or revised guess;
3. reviewed explanation.

The game must not reveal the explanation before the student has had a chance to observe and reason.

No runtime language model writes scientific explanations during play. Explanations are authored in advance, reviewed, bounded to what the simulation actually shows, and written for Grade 3 readers.

---

# 13. Procedural animals

Animal appearance must be generated from the biological state rather than swapped between unrelated fixed sprites.

When trait distributions shift, the visible population must shift.

This is the highest-value visual decision because it lets the child see population change without needing a graph first.

The procedural renderer does not need photorealism. It does need:

- coherent body construction;
- visible trait differences at normal play scale;
- continuity between ancestor and later forms;
- no misleading visual changes unrelated to the genome;
- non-colour markers wherever colour alone would exclude or confuse students.

A trait that is biologically important but invisible at play scale has failed as a surfaced game trait, even if the engine models it correctly.

---

# 14. Forms and recognition

After several rounds, a lineage may become recognizably similar in function and silhouette to a real animal form: dolphin-like, otter-like, seal-like, mole-like, glider-like, or primate-like.

The game does not announce the intended destination in advance.

The payoff is the child recognizing it:

> “Wait—we made something like a dolphin.”

Forms are recognized through functional capability and overall body organization, not through one password-like checklist of named traits. Multiple biological routes may reach the same form.

The game must never claim that the simulated lineage is the literal evolutionary history of the real animal.

---

# 15. Collection and research hook

Every discovered form fills a collection entry. Undiscovered forms remain silhouettes.

The collection mixes:

- familiar real animals;
- real animals that sound invented;
- rare mythical recombinations made only from real mammalian capabilities.

Silhouettes do not reveal which entries are real and which are mythical.

Examples of real animals that may produce uncertainty include the star-nosed mole, naked mole rat, and platypus.

Mythical forms must be rare. They should feel like class legends rather than routine achievements.

The ambiguity should push children toward asking:

> “Is that a real animal?”

That question leads into the Curiosity Research Engine and the real-animal summative.

---

# 16. Journal

The journal automatically records simulation facts:

- round and generation;
- zone;
- surfaced and flagged variations;
- chosen group;
- population counts;
- observed events;
- what happened to other groups.

The child supplies meaning:

- why they chose the group;
- what they predicted;
- what they noticed;
- whether the result matched the prediction;
- what they now want to research.

No child should face a blank page without evidence.

The journal is downloadable and shareable.

Every exported journal must clearly state that it records a fictional simulation. It may generate research questions. It is not evidence about the actual evolutionary history or biology of a real species.

---

# 17. Design decisions already settled

Do not reopen these without new empirical evidence that the product cannot work as specified.

- The student may choose which existing group to follow.
- This agency is not removed merely because a simplified mechanic could be described teleologically.
- Precise language protects the concept: “predict which group will do well,” not “choose how the animal evolves.”
- The game is not reduced to passive observation.
- Timescale compression is accepted and described only as “many, many generations.”
- A full genetics research model is not required.
- Variation remains unfiltered by environmental usefulness.
- Most variation remains neutral.
- Following nothing remains valid.
- Extinction remains history.
- The interface presents observations, not verdicts.
- Consequence precedes explanation.
- Forms are capability-based.
- No runtime AI produces explanations.
- The world is rendered procedurally from biological state.
- The primary student-facing quantities are counts such as “4 of 25,” not percentages or averages.
- Teacher view is allowed later.
- Peer-view networking is unnecessary; designed world groups already provide comparison.
- Local storage is primary for student play; the existing room API may later support teacher visibility.
- A lineage or group is never indicated by colour alone.

---

# 18. Product target

Primary target:

- Safari on school iPads;
- touch-first interaction;
- Grade 3 legibility;
- classroom use by small groups or individual students;
- stable local play even when network access is unreliable.

Desktop support is useful for development and teacher inspection but does not replace iPad testing.

The final product should be a static deployable web application unless a later feature genuinely requires a server. Runtime simulation must not depend on an external AI or cloud service.

---

# 19. Milestone discipline

Build in vertical slices.

## Milestone 1 — truthful world model

Prove the non-retrofittable architecture:

- simultaneous zones;
- inherited habitat use independent from body traits;
- birth-only inherited variation;
- different consequences for the same variation in different contexts;
- genealogy and mating records;
- observer history that cannot affect biology;
- visible diagnostic evidence.

Milestone 1 is not the game.

## Milestone 2 — playable three-zone experience

Build the smallest complete version that feels like LINEAGE:

- living procedural world;
- watch phase;
- surfaced variations;
- inspection and flagging;
- paused decision;
- prediction;
- visible multi-generation consequence;
- reflection;
- touch-first iPad interaction.

## Later milestones

Expand only after the playable slice works:

- more zones and traits;
- stable long-term group comparison;
- divergence interface;
- forms and collection;
- journal export;
- explanations;
- rare mythical discoveries;
- teacher view;
- persistence and offline hardening;
- full accessibility and performance refinement.

A later feature must not be pulled into an earlier milestone merely because it appears easy.

---

# 20. Acceptance question

Every major decision must pass this test:

> **Would a Grade 3 student choose to open this a second time, and could they tell a classmate what happened to their animals and why?**

Both halves matter.

A biologically coherent engine that produces no visible, discussable consequence is not enough.

A visually compelling game that teaches a false causal story is not enough.

LINEAGE succeeds only when the world remains truthful, the consequences remain visible, and the child wants to keep exploring.
