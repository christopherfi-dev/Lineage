# LINEAGE — Real-Animal Reveal Table

Purpose: at the end of a story that survives, the game shows which real animal the child's group has become most like, and why. The reveal is based on the group's actual average traits at the end and the habitat where most of it lives. The list of choices the child made plays no part.

Principle: there is no correct answer. Every surviving group becomes something. Each "why" line only credits what the engine actually rewards in that habitat, so the reveal never claims a trait helped for a reason the simulation did not model.

## Trait levels
Uses the seven meaningful traits only; the three neutral traits are never used for matching.
- High: group average 0.6 or more
- Low: group average 0.4 or less
- Any: not checked

## Habitat
The zone where the largest share of the group lives at the end: high leaves (canopy), open ground (forest_floor), or water's edge (shoreline).

## Water's edge

River otter
- Profile: toe webbing high, strong tail high, streamlined body high, curved claws low.
- Reveal: "Your animals became swimmers, a lot like a river otter."
- Why: "Webbed feet push through water. A strong tail helps them swim. A sleek body slides through the water easily."

Beaver
- Profile: toe webbing high, strong tail high, dense fur high, streamlined body low.
- Reveal: "Your animals became paddlers, a lot like a beaver."
- Why: "Webbed feet and a strong tail push them through water. Thick fur keeps them warm, even though it makes swimming a little slower."

Capybara
- Profile: toe webbing high, strong tail low, long back legs high.
- Reveal: "Your animals live between land and water, a lot like a capybara."
- Why: "Webbed toes help them swim. Long back legs help them move on land too."

## High leaves

Squirrel
- Profile: curved claws high, toe webbing low, streamlined body low.
- Reveal: "Your animals became climbers, a lot like a squirrel."
- Why: "Curved claws grip the branches. Toes without webbing hold on tight."

Sloth
- Profile: curved claws high, dense fur high, long back legs low, large eyes low.
- Reveal: "Your animals became slow, careful climbers, a lot like a sloth."
- Why: "Big curved claws hold on to branches. Thick fur keeps them warm. They save energy by not growing things they don't need."

Bushbaby
- Profile: large eyes high, long back legs high, curved claws high or any.
- Reveal: "Your animals became night leapers, a lot like a bushbaby."
- Why: "Big eyes help them see in the dark. Long back legs help them move fast."

## Open ground

Hare
- Profile: long back legs high, strong tail low, large eyes high.
- Reveal: "Your animals became runners, a lot like a hare."
- Why: "Long back legs help them run fast. Big eyes help them spot danger. A small tail doesn't slow them down."

Meerkat
- Profile: large eyes high, long back legs low, strong tail low.
- Reveal: "Your animals became lookouts, a lot like a meerkat."
- Why: "Big eyes help them spot danger across open ground."

## Any habitat — fallback

The first mammals (tree shrew)
- Profile: no meaningful trait is high or low, or no animal above scores well enough.
- Reveal: "Your animals stayed a lot like the very first mammals, like a tree shrew."
- Why: "Their bodies didn't change much, and that worked. Some animals today still look a lot like their ancient relatives."

## Matching rule
1. Only animals from the group's end habitat are considered, plus the fallback.
2. For each animal, count how many of its checked traits the group matches.
3. The best match needs at least all but one of its checked traits to match. If none qualifies, use the fallback.
4. Ties go to the animal with more checked traits.

## Checks for Claude Code
- Confirm each "why" line against the zone weights. If an animal's habitat does not reward a trait its "why" line credits, rewrite that line or drop the animal, and report it.
- Across the 270 measurement stories, report how often each reveal appears. An animal that never appears is fine to keep, but say so.
