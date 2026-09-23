# LINEAGE — Real-Animal Reveal Table

Purpose: at the end of a story that survives, the game shows which real animal the child's group has become most like, and why. The reveal is based on the group's actual average traits at the end and the habitat where most of it lives. The list of choices the child made plays no part.

Principle: there is no correct answer. Every surviving group becomes something. Each "why" line only credits what the engine actually rewards in that habitat, so the reveal never claims a trait helped for a reason the simulation did not model.

## Trait levels
Uses the seven meaningful traits only; the three neutral traits are never used for matching.
- High: group average 0.6 or more
- Low: group average 0.4 or less
- Any: not checked

Checked 2026-09-23: these absolute levels stay. With them the fallback is 29% of reveals across the 270 measurement stories, under the 40% at which relative levels (against the generation-0 world average) were allowed.

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
- Why: "Webbed feet and a strong tail push them through water. Thick fur keeps them warm, but it slows their swimming."

Capybara
- Profile: toe webbing high, strong tail low, long back legs high.
- Reveal: "Your animals live between land and water, a lot like a capybara."
- Why: "Webbed toes help them swim. Long back legs help on land, but slow them in water."

## High leaves

Squirrel
- Profile: curved claws high, toe webbing low, streamlined body low.
- Reveal: "Your animals became climbers, a lot like a squirrel."
- Why: "Curved claws grip the branches. Toes without webbing hold on tight."

Sloth
- Profile: curved claws high, dense fur high, long back legs low, large eyes low.
- Reveal: "Your animals became slow, careful climbers, a lot like a sloth."
- Why: "Big curved claws hold on to branches. Thick fur keeps them warm."

Bushbaby
- Profile: large eyes high, long back legs high, curved claws high or any. (Claws are not checked, so high claws never count against it.)
- Reveal: "Your animals became night leapers, a lot like a bushbaby."
- Why: "Big eyes help them see well. Long back legs help them move fast."

## Open ground

Hare
- Profile: long back legs high, strong tail low, large eyes high.
- Reveal: "Your animals became runners, a lot like a hare."
- Why: "Long back legs help them run fast. Big eyes help them see well. A small tail doesn't slow them down."

Meerkat
- Profile: large eyes high, long back legs low, strong tail low.
- Reveal: "Your animals became lookouts, a lot like a meerkat."
- Why: "Big eyes help them see well across open ground."

## Any habitat — fallback

The first mammals (tree shrew)
- Profile: no meaningful trait is high or low, or no animal above scores well enough.
- Reveal: "Your animals stayed like the very first mammals, like a tree shrew."
- Why: "Their bodies didn't change much, and that worked. Some animals today still look a lot like their ancient relatives."

## Matching rule
1. Only animals from the group's end habitat are considered, plus the fallback.
2. For each animal, count how many of its checked traits the group matches.
3. The best match needs at least all but one of its checked traits to match. If none qualifies, use the fallback.
4. Ties go to the animal with more checked traits.
5. Any tie left goes to the animal listed first in this file. (Added by Claude Code so the result is always the same.)

## Checks for Claude Code
- Confirm each "why" line against the zone weights. If an animal's habitat does not reward a trait its "why" line credits, rewrite that line or drop the animal, and report it.
- Across the 270 measurement stories, report how often each reveal appears. An animal that never appears is fine to keep, but say so.

## Check results (Claude Code, 2026-09-23)

The game implements this table in `game/src/reveal.js`, which must match this file.

### "Why" lines against the zone weights

For one unit of each trait, the change in zone fitness is the sum over performance dimensions of zone weight × trait effect, minus zone scarcity × upkeep (`lineage-m1/src/config/modelConfig.js`, `traits.js`, `core/performance.js`). A trait "helps" in a habitat when that net change is positive.

| Trait | High leaves | Open ground | Water's edge |
|---|---|---|---|
| Toe webbing | −2.53 (grip −2.40) | −0.37 | **+2.88** (propulsion +3.00) |
| Curved claws | **+2.31** (grip +2.56) | +0.17 | −1.15 |
| Dense fur | +0.30 (warmth +0.60) | +0.90 (warmth +1.20) | −0.70 (warmth +0.80, drag −1.20) |
| Long back legs | +0.93 (land movement +1.28) | **+1.89** (land movement +2.24) | −1.07 (land movement +0.48, drag −1.20) |
| Strong tail | −0.63 | −0.80 (land movement −0.70) | **+1.42** (propulsion +1.80) |
| Large eyes | +0.35 (sight +0.90) | **+1.25** (sight +1.80) | −0.55 (sight weight 0) |
| Streamlined body | −1.38 (grip −1.28) | −0.34 | **+1.82** (drag reduction +1.92) |

Results:
- **River otter, Squirrel:** every credited trait helps in their habitat. Unchanged.
- **Beaver:** thick fur does not help at the water's edge overall (−0.70). The warmth is real (+0.80), but the drag costs more (−1.20). "Even though it makes swimming a little slower" understated that, so the line now says "Thick fur keeps them warm, but it slows their swimming."
- **Capybara:** long back legs do not help at the water's edge overall (−1.07). The land movement is real (+0.48), but the drag costs more. The line now says "Long back legs help on land, but slow them in water."
- **Sloth:** "They save energy by not growing things they don't need" was dropped. The high leaves reward long back legs (+0.93) and large eyes (+0.35), so small ones are not "things they don't need". The energy they save is smaller than what they lose.
- **Bushbaby, Hare, Meerkat:** big eyes help in their habitats (+0.35 in the leaves, +1.25 on the ground). But the engine models sight only ("useful visual sensing where visibility exists"), not darkness or danger. "See in the dark" and "spot danger" became "see well". The bushbaby's reveal line still calls them night leapers, because that describes the real animal, not a reason.
- **The first mammals:** no trait is credited. Unchanged, except that the reveal line was shortened from 14 words to 12 for read-aloud.

No animal was added, removed or renamed.

### How often each reveal appears

Across the 270 measurement stories (30 good seeds × 9 starting families, random choices), 213 survive to the end and get a reveal. By end habitat: high leaves 103, open ground 34, water's edge 76.

| Reveal | Stories | Share of reveals |
|---|---|---|
| Squirrel | 100 | 47% |
| The first mammals (tree shrew) | 61 | 29% |
| Hare | 30 | 14% |
| Capybara | 17 | 8% |
| River otter | 2 | 1% |
| Bushbaby | 2 | 1% |
| Beaver | 1 | 0.5% |
| Sloth | 0 | never |
| Meerkat | 0 | never |

- **Sloth and Meerkat never appear.** They are kept.
- **Squirrel is common** because two of its three checked traits, toe webbing low and streamlined body low, are the starting world's usual body (0.15 and 0.35). So almost any group in the leaves matches two of three without curved claws.
