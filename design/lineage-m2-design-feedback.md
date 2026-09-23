# LINEAGE M2 — Design Feedback After First Mockup

## What this is

Feedback on the first living mockup from Claude Design, based on actually using it. These are corrections to the brief and to decisions made in the questionnaire phase. Some of my original answers were wrong once I saw them in practice. This document also adds several things that were missing from the original brief entirely.

---

## 1. The world must be scrollable

The single fixed screen doesn't work. Looking at 200 creatures crammed into one frame with no ability to move is boring. There's nothing to do. You can't go see what's happening in the forest. You can't explore the shoreline. The world feels like a poster, not a place.

The fix is not multiple zoom levels. It's one zoom level with free panning. The world is bigger than the screen. You drag to move around. The three zones are regions you scroll through, not three strips jammed into one viewport. This is basic Canvas 2D — pan and pinch are standard operations, not a technical challenge.

The whole reason I cited Civilization in the original design doc was freedom of attention — you choose where to look, and things happen while you're looking elsewhere. The fixed-screen mockup killed that completely.

---

## 2. The followed lineage is spatially clustered — that's the whole experience

This is the most important thing that wasn't clear enough in the brief.

Your followed lineage lives together. They share traits that work in their zone, so they cluster in that zone. When you're watching your lineage, your screen is naturally centered on that cluster. You're watching a family in their neighborhood.

This means the default view is not "200 scattered dots, find the teal ones." It's "here's your group, living together, and the grays are at the edges and in the distance." Your lineage is the foreground. Everything else is the background.

The camera should start centered on your lineage's cluster. The world extends in all directions beyond the screen. Scrolling is exploring — you can go look at what's happening in other zones. Coming back to your group is coming home.

---

## 3. The followed lineage should be visually dominant, not just color-differentiated

Right now the mockup shows same-sized silhouettes with a teal ring vs. gray. That's too subtle. Your lineage should be the clearest, sharpest, most detailed things on the screen. The gray populations should recede — still present, still moving, still tappable, but visually subordinate. When you're following a group, the world should feel like it's about them.

---

## 4. You can only choose adaptations from your own lineage

This interaction rule was implicit but needs to be explicit in the design.

Gray populations mutate too. If you scroll around and explore, you can see those mutations — you can tap gray animals and inspect them. But you cannot select or follow a gray mutation. Your choices come from your lineage only.

This is what makes following meaningful. You're committed to this lineage's story. You're not shopping across the whole world for the best mutation. You're watching your group and deciding which branch of your group to follow next.

The narrative log should reflect this distinction:
- "One of your animals just developed wider feet" → this is from your lineage, you can choose to follow this branch
- "A group near the shoreline is growing" → context about the wider world, interesting but not yours to direct

---

## 5. Adaptation flashes: recent ones bright, older ones fade

When a new adaptation appears in the followed lineage, the flash should be bright and obvious. But they should not all stay lit indefinitely. After five minutes you'd have 25+ glowing markers competing for attention, and the newest one would look identical to one from four minutes ago.

Instead: the most recent flash is bright. The previous one dims to a soft glow. Anything older than two flashes fades completely. The kid's attention is drawn to what just happened, not what they missed earlier.

Missing an adaptation is fine. It's not just a convenience — it's the science lesson. In real biology, most mutations happen and nobody notices. The organism develops wider feet and no scientist documents it. When a kid misses a flash and later notices half their lineage has webbed feet, they've experienced how real scientific discovery works — you see the consequence after the fact, not the moment of change. The game should never make the kid feel like they missed something important.

---

## 6. Lineage death is the lesson, not a failure state

The original brief treated extinction as a transition to manage — "what do we do when the lineage dies, how do we move the kid to a new group." That was wrong. The death is the content.

A kid who follows tree-dwellers with webbed feet is running an experiment. The whole point is watching that population shrink and understanding why. The narrative log should narrate the decline as it happens, not just announce the extinction at the end:
- "Your group is smaller than last generation."
- "Only three of your animals are left in the canopy."
- "The last one couldn't find a mate."

That's the nature documentary telling the story of a species that got the wrong trait for their habitat.

When the last animal dies, the world keeps running. The grays are still moving. The game says something like: "The last of your group has passed. Their story lasted 14 generations." Then it gently prompts the student to tap any animal to start following a new group. Now the kid is exploring the gray world with purpose for the first time — looking for a new lineage, bringing everything they learned from watching the last one.

Extinction is not failure. It's the transition between chapters.

---

## 7. The prediction journal uses tappable choices, not typing

Third graders cannot type well on an iPad. The prediction journal should not have a text input field. Instead, it presents multiple-choice options that the student taps.

These choices are generated by a context-aware AI that reads the simulation state — which traits the lineage has, which zone they're in, whether the population is growing or shrinking. The options are specific to this lineage in this run, not generic quiz questions. For example:

"Why did the webbed-foot group get smaller in the canopy?"
- "They didn't try hard enough" (common kid misconception — effort-based evolution)
- "Webbed feet made it harder to grip branches" (correct ecological reasoning)
- "The other animals were mean to them" (anthropomorphic misconception)
- "They got unlucky" (partially true but misses the mechanism)

The AI also generates prediction options before the time-skip: "What do you think will happen to the big-eyed group on the dark forest floor?" with plausible options to choose from. After the time-skip, it generates analysis questions about what actually happened and why.

The frontend does not need to know how these choices are generated. The frontend receives text strings and choice arrays. It displays them. It sends back which option was tapped. The intelligence lives behind the interface. Claude Design should design the journal as a clean field-guide-style interaction where the student taps choices — not a text field, not a chatbot conversation, just clear options presented at the right moments.

---

## 8. The creature card needs much more visual richness

The Pebble family creature in the first mockup is cute but forgettable. The card is the payoff for tapping. If the card creature isn't worth the tap, the whole game loop breaks. A kid taps a tiny silhouette and should be rewarded with a creature that has personality, visible trait differences from its siblings, and enough visual interest to make them want to tap the next one too.

The gouache/painted direction is right in spirit but needs to be pushed much harder. More texture. More character. More visual surprise. The creature should feel like a page from a really good illustrated nature field guide — something a kid would want to flip through even without the game attached.

I don't know how feasible it is to make all the genome-driven variations of these animals look distinct and detailed. That's a real question. Every creature has ten inherited body traits and any combination is possible. But whatever the rendering approach, the creatures need to look cool. They need texture, personality, and enough variation that siblings look related but not identical. The kid should want to collect these by tapping. If the first card they see is flat and generic, they won't tap a second time.

---

## What stays the same

These decisions from the questionnaire still hold:

- Deep teal-blue as the accent color
- Soft halo ring as the non-color lineage indicator
- Simple silhouettes with directional nose at world scale
- Warm, light palette for classroom lighting
- Amphibian-adjacent starting body plan
- Clean field-guide aesthetic for the journal (now with tappable choices, not text)
- No tutorial — the world should be self-evident
- Narrative log in kid-readable language

---

## Summary of changes from the original brief

1. **Scrollable world** — not fixed screen. One zoom level, free panning across a world bigger than the viewport.
2. **Camera starts on your lineage** — the cluster is home, scrolling is exploring, coming back is coming home.
3. **Followed lineage is visually dominant** — bigger, sharper, more detailed than grays. Not just a color ring difference.
4. **Adaptation choices come only from your lineage** — grays are observable but not selectable.
5. **Adaptation flashes fade** — most recent is bright, previous dims, older ones disappear. Missing one is fine and is itself the science lesson.
6. **Lineage death is content** — the narrative log tells the story of decline as it happens. Extinction transitions to exploring for a new group, not a game-over screen.
7. **Journal uses tappable choices** — no text input. The frontend displays choice arrays and sends back selections. Options are specific to what actually happened in this run.
8. **Creature card needs 3x the visual richness** — more texture, more personality, more payoff for tapping. The creatures need to look cool.
