# LINEAGE — Real-Animal Reveal Table

Purpose: at the end of a story that survives, the game shows which real animal the child's group has become most like, and why. The reveal is based on the group's actual average traits at the end and the habitat where most of it lives. The list of choices the child made plays no part.

Principle: there is no correct answer. Every surviving group becomes something. Each "why" line only credits what the engine actually rewards in that habitat, so the reveal never claims a trait helped for a reason the simulation did not model.

## Trait levels
Uses the seven meaningful traits only; the three neutral traits are never used for matching.

Levels are relative to the generation-0 world average for each trait, so that a reveal reflects what changed. The starting world's usual body is neither high nor low.
- High: group average at least GAP above the generation-0 world average
- Low: group average at least GAP below it
- Any: not checked

GAP = 0.12. That is the game's APART, the smallest difference it treats as visible. In the defining world, the generation-0 averages are:

| Trait | Webbing | Claws | Fur | Back legs | Tail | Eyes | Body |
|---|---|---|---|---|---|---|---|
| Average | 0.27 | 0.45 | 0.40 | 0.45 | 0.40 | 0.40 | 0.35 |

*Balance round, 2026-09-23. This replaces the absolute levels (high 0.6 or more, low 0.4 or less), under which the starting body alone matched Squirrel and 47% of reveals were Squirrel.*

## Habitat
The zone where the largest share of the group lives at the end: high leaves (canopy), open ground (forest_floor), or water's edge (shoreline).

## Water's edge

River otter
- Profile: toe webbing high, strong tail high, streamlined body high, curved claws low.
- Signature: toe webbing high and streamlined body high.
- Reveal: "Your animals became swimmers, a lot like a river otter."
- Why: "Webbed feet push through water. A strong tail helps them swim. A sleek body slides through the water easily."

Beaver
- Profile: toe webbing high, strong tail high, dense fur high, streamlined body low.
- Signature: toe webbing high and strong tail high.
- Reveal: "Your animals became paddlers, a lot like a beaver."
- Why: "Webbed feet and a strong tail push them through water. Thick fur keeps them warm, but it slows their swimming."

Capybara
- Profile: toe webbing high, strong tail low, long back legs high.
- Signature: toe webbing high and long back legs high.
- Reveal: "Your animals live between land and water, a lot like a capybara."
- Why: "Webbed toes help them swim. Long back legs help on land, but slow them in water."

## High leaves

Squirrel
- Profile: curved claws high, toe webbing low, streamlined body low.
- Signature: curved claws high.
- Reveal: "Your animals became climbers, a lot like a squirrel."
- Why: "Curved claws grip the branches. Toes without webbing hold on tight."

Sloth
- Profile: curved claws high, dense fur high, long back legs low, large eyes low.
- Signature: curved claws high and dense fur high.
- Reveal: "Your animals became slow, careful climbers, a lot like a sloth."
- Why: "Big curved claws hold on to branches. Thick fur keeps them warm."

Bushbaby
- Profile: large eyes high, long back legs high, curved claws high or any. (Claws are not checked, so high claws never count against it.)
- Signature: large eyes high.
- Reveal: "Your animals became night leapers, a lot like a bushbaby."
- Why: "Big eyes help them see well. Long back legs help them move fast."

## Open ground

Hare
- Profile: long back legs high, strong tail low, large eyes high.
- Signature: long back legs high.
- Reveal: "Your animals became runners, a lot like a hare."
- Why: "Long back legs help them run fast. Big eyes help them see well. A small tail doesn't slow them down."

Meerkat
- Profile: large eyes high, long back legs low, strong tail low.
- Signature: large eyes high, and long back legs not high.
- Reveal: "Your animals became lookouts, a lot like a meerkat."
- Why: "Big eyes help them see well across open ground."

## Any habitat — fallback

The first mammals (tree shrew), for a surviving group only
- Profile: no animal above qualifies.
- Reveal: "Your animals stayed like the very first mammals, like a tree shrew."
- Why: "Their bodies didn't change much, and that worked. Some animals today still look a lot like their ancient relatives."

## Died-out endings (2026-09-24, scope decision 40)

Every ending gets a reveal, not only a surviving one. It uses the group's actual average traits and main habitat when the story ended (its last living members), with the same table, the same matching rule and the same "why" filter. A group that died out gets the reveal in the past tense:

| Animal | Reveal when the group died out |
|---|---|
| River otter | "Your animals were becoming a lot like a river otter." |
| Beaver | "Your animals were becoming a lot like a beaver." |
| Capybara | "Your animals were becoming a lot like a capybara." |
| Squirrel | "Your animals were becoming a lot like a squirrel." |
| Sloth | "Your animals were becoming a lot like a sloth." |
| Bushbaby | "Your animals were becoming a lot like a bushbaby." |
| Hare | "Your animals were becoming a lot like a hare." |
| Meerkat | "Your animals were becoming a lot like a meerkat." |
| No animal matches | "Your animals didn't have time to change." (never the first mammals; see below) |

The "why" lines about the group's animals are in the past tense too:
- "Webbed feet pushed them through water."
- "A strong tail helped them swim."
- "A sleek body slid through the water easily."
- "Webbed feet and a strong tail pushed them through water."
- "Thick fur kept them warm, but it slowed their swimming."
- "Webbed toes helped them swim."
- "Long back legs helped on land, but slowed them in water."
- "Curved claws gripped the branches."
- "Toes without webbing held on tight."
- "Big curved claws held on to branches."
- "Thick fur kept them warm."
- "Big eyes helped them see well."
- "Long back legs helped them move fast."
- "Long back legs helped them run fast."
- "A small tail didn't slow them down."
- "Big eyes helped them see well across open ground."

**No time to change** (2026-09-24, scope decision 41). A group that died out never gets the first mammals. If it matches no animal, the reveal is "Your animals didn't have time to change.", with one "why" line: "Their story ended before new traits could spread." A surviving group keeps the first mammals as its fallback, unchanged.

## Matching rule
1. Only animals from the group's end habitat are considered, plus the fallback.
2. An animal qualifies only if the group has its signature trait(s).
3. Among qualifying animals, the best match is the one whose checked traits the group meets most strongly: the sum of how far each met checked trait is past its level. A tie goes to the animal listed first.
4. If none qualifies, use the fallback.

5. The reveal shows only the "why" sentences whose credited trait the group has, at the same levels. The sentence about the signature always qualifies. For example, a beaver-like group without thick fur is not told "Thick fur keeps them warm".

*Balance round, 2026-09-23. Rules 2 and 3 replace "the best match needs at least all but one of its checked traits" and "ties go to the animal with more checked traits". With "all but one" kept alongside the signature rule, the targets (fallback at most 35%, no animal above 35%) were met only at GAP 0.04 or less, where a barely changed trait counts as high, and Meerkat never appeared.*

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

### How often each reveal appears on every ending (2026-09-24)

With active choosing and the adaptive fair test (scope decisions 32–40), measured on the 270 stories with the same simulated child: 36 survive and 234 die out, 40 of them before any follow.

| Reveal | Survived | Died out |
|---|---|---|
| River otter | 3 | 19 |
| Beaver | 0 | 19 |
| Capybara | 2 | 10 |
| Squirrel | 4 | 37 |
| Sloth | 5 | 7 |
| Bushbaby | 12 | 18 |
| Hare | 5 | 16 |
| Meerkat | 0 | 9 |
| The first mammals (tree shrew) | 5 | 0 |
| No time to change | — | 99 |

- A died-out ending matches no animal in 99 of 234 (42%). Since scope decision 41 it gets "Your animals didn't have time to change." instead of the first mammals.
- Of the families that die before any follow, 33 of 40 get it (83%): their bodies barely changed.
- Every reveal line and "why" line shown is 12 words or fewer (46 lines).

### How often each reveal appears (balance round: relative levels, GAP 0.12, signatures)

Across the 270 measurement stories (30 good seeds × 9 starting families, random choices), 213 survive to the end and get a reveal. The counts come from the game's own code. By end habitat: high leaves 103, open ground 34, water's edge 76.

| Reveal | Stories | Share of reveals |
|---|---|---|
| Bushbaby | 55 | 26% |
| Hare | 33 | 15% |
| The first mammals (tree shrew) | 31 | 15% |
| Squirrel | 26 | 12% |
| Capybara | 21 | 10% |
| Sloth | 19 | 9% |
| Beaver | 15 | 7% |
| River otter | 12 | 6% |
| Meerkat | 1 | 0.5% |

- **Targets met:** the fallback is 15% (at most 35%), and the most common animal, Bushbaby, is 26% (at most 35%).
- **Every animal appears**, so none was removed. Meerkat appears once: on the open ground, long back legs are the strongest trait and usually rise past their level, and Meerkat needs them not high.
- **"Why" sentences:** with only the signature needed to qualify, 75 of the 182 named reveals would have credited a trait the group does not have. Beaver's thick fur accounted for 14 of 15 beavers, Squirrel's toes without webbing for 24 of 26, Hare's small tail for 26 of 33, and River otter's strong tail for 10 of 12. The ending shows the group's traits on the same screen, so rule 5 hides those sentences. The text of every sentence is unchanged.
- **The GAP sweep:** with signature-only qualifying, the targets hold for every GAP from 0.01 to 0.19. At 0.20 the fallback reaches 35%, and above that it passes it. GAP 0.12 was chosen because it equals APART.

### How often each reveal appeared before the balance round (absolute levels 0.6 / 0.4, "all but one", tie to more checked traits)

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
