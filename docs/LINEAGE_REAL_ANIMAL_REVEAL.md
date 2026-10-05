# LINEAGE — Real-Animal Reveal Table

Purpose: on every ending (scope decision 40), the game shows which real animal the child's line has become most like, why, and one true fact about that animal. The animals are also the children's goal: the collection (scope decision 72), the animals they can discover. Which animal a line becomes comes from its actual traits at the end in the place where it lives, and from the free traits the child chose for it. There is no correct answer: every line becomes something.

Principle: each "why" line only credits what the engine actually rewards in that place (`docs/LINEAGE_WHY.md`), and only what the real animal has. A "looks like" line names a trait that doesn't matter there, and never says it helps.

*2026-10-02, Round 5, Part 1 (scope decision 72): the collection. Classroom biology drives every line in a place to the same body, so every water story ended as a river otter and every tree story as a koala. Now each place has required traits (they help or hurt there, so every line that lasts gets them) and free ones (they don't decide who lives there). The free traits, which the child's follows decide, decide which animal the line becomes. Twelve animals, four per place, each reached in at least 80% of tries by a child who follows its signature. This replaces the 17-animal table of scope decisions 45 and 46, kept below for the record.*

*2026-10-05, Round 6 (scope decisions 80, 81 and 85): the lynx takes the arctic fox's place. Long back legs are required on the open ground, so every line that wins there has them, and real arctic foxes have short legs. The mink was tested and is not added: in the game's traits it looks exactly like the beaver. Each animal is still reached in at least 80% of tries, now measured with reading time.*

## The collection: 12 animals (a 4 × 3 grid)

What every line in a place gets (the required traits) and what tells its animals apart (the free and neutral traits). An animal's **signature** is one or two free traits: a line with either becomes it. Its **profile** is every free or neutral trait that sets it apart, true of the real animal; it settles a tie. Each animal's picture is `game/animals/<id>.jpg` (scope decision 74), cropped from Marc's originals in `design/animals/`.

| Place | Required (every line there) | Free (the child's follows decide) |
|---|---|---|
| High leaves | curved claws; toes without webbing; a round body | thick fur, long back legs, a strong tail, big eyes; coat, ear tips, tail tip |
| Open ground | long back legs; big eyes | webbed feet, claws, thick fur, a strong tail, body shape; coat, ear tips, tail tip |
| Water's edge | webbed feet; a strong tail; a sleek body; straighter claws; short back legs | thick fur, big eyes; coat, ear tips, tail tip |

| Place | Animal (id) | Signature (either) | Profile (free and neutral traits that set it apart) | Required traits the real animal lacks |
|---|---|---|---|---|
| High leaves | **Squirrel** (`squirrel`), the leaves' own | a strong tail; pointy ear tips | strong tail, pointy ear tips, long back legs | — |
| | **Sloth** (`sloth`) | a weak tail; short back legs | weak tail, short back legs, thick fur, small eyes | — |
| | **Koala** (`koala`) | round ear tips; small eyes | round ear tips, small eyes, thick fur, weak tail, light coat | — |
| | **Slow loris** (`slow-loris`) | thick fur; big eyes | thick fur, big eyes, weak tail, short back legs | curved claws: it grips with strong hands and nails |
| Open ground | **Hare** (`hare`), the ground's own | a weak tail; thick fur | weak tail, thick fur | — |
| | **Lynx** (`lynx`), new in Round 6 | pointy ear tips; curved claws | pointy ear tips, curved claws, thick fur, weak tail, bright tail tip | — |
| | **Cheetah** (`cheetah`), new | thin fur; a sleek body | thin fur, sleek body, strong tail, bright tail tip, straighter claws | — |
| | **Jerboa** (`jerboa`), new | a strong tail; a bright tail tip | strong tail, bright tail tip, light coat | — |
| Water's edge | **River otter** (`river-otter`), the water's own | thick fur | thick fur, small eyes, round ear tips, dark coat | — |
| | **Seal** (`seal`) | thin fur; big eyes | thin fur, big eyes, round ear tips | a strong tail: it has a tiny tail and swims with its back flippers |
| | **Beaver** (`beaver`) | a dark coat; a plain tail tip | dark coat, plain tail tip, thick fur, small eyes, round ear tips | a sleek body: it has a chunky one |
| | **Platypus** (`platypus`) | round ear tips; small eyes | round ear tips (it has no outer ears), small eyes, thick fur, dark coat | — |

"Strong tail" is the engine's trait, drawn as a bigger tail: a squirrel's bushy tail, a jerboa's long one, a beaver's flat paddle. "Round ear tips" is the opposite of pointy ones, so it also stands for no outer ears (seal, platypus). A line that matches no signature in its place becomes the place's own animal. The four required traits a real animal lacks are why each of these four has no "why" line for that trait.

## Matching rule (scope decision 72)

1. Only the animals of the line's place count. The line is its animals living there at the end (all of them, once the child chose a place).
2. **A chosen free trait decides first.** The line keeps every trait the child chose (scope decision 72), so each of its animals has each one. An animal qualifies when one of its signatures is a chosen trait that doesn't matter in that place, the way it was chosen.
3. **Else, what the line has.** An animal qualifies when three quarters or more of the line has one of its signatures (high: at least GAP above the generation-0 world's average; low: at least GAP below it).
4. **Among those that qualify**, the best fits its profile best: for each profile trait, the share of the line that has it less the share that has the opposite, and 2 more for a chosen trait that way (2 less for one chosen the other way). A tie goes to the animal listed first in its place.
5. **If none qualifies,** the place's own animal: the squirrel, the hare, the river otter.
6. **A line names an animal only once it has changed toward its place:** at least one required trait past its helpful level on average. A line that lasted but didn't change stays like the first mammals; one that died out first had no time to change (scope decision 41). Neither is in the collection.
7. The reveal shows only the "why" lines whose credited trait the line has at that level, then up to two "looks like" lines the same way, the signature's first; then the animal's "Did you know?" lines. Every water's-edge animal adds "Did you know? Whales' ancestors were land animals that started swimming."

GAP = 0.12 (the game's APART). The generation-0 world's averages, the same in every seed: webbing 0.15, claws 0.45, fur 0.39, back legs 0.45, tail 0.39, eyes 0.40, body 0.35; coat, ear tips and tail tip 0.49. Each founding family's founders differ in fur, tail, coat, ear tips and tail tip by 0.15 either way (scope decision 72), so each family can become any animal of its place.

## Each animal as a child sees it (for Marc to check)

The reveal line, the "why" lines (the first ones that the line has), up to two "looks like" lines, and the facts, each with a speaker. A line that died out sees "Your animals were becoming a lot like a sloth." and the "why" lines in the past tense; the "looks like" lines and the facts are about the real animal and stay in the present. **New, for Marc to check:** the cheetah and the jerboa (every line), and every "looks like" line. The "why" lines and facts of the other ten are the ones Marc checked on 2026-09-24, except that a "why" line now only credits a required trait (so the sloth's, koala's and slow loris's "Thick fur keeps them warm." and the beaver's "Thick fur keeps them warm, but it slows their swimming." are now "looks like" lines: thick fur doesn't matter in those places any more).

**Squirrel** · high leaves
- Your animals became climbers, a lot like a squirrel.
- Curved claws grip the branches. Toes without webbing hold on tight.
- Looks like: Squirrels have big bushy tails too. Squirrels have pointy ears too. Squirrels have long back legs too.
- Did you know? Squirrels plant trees by forgetting buried nuts.

**Sloth** · high leaves
- Your animals became slow, careful climbers, a lot like a sloth.
- Big curved claws hold on to branches. Toes without webbing hold on tight. A round body helps them hold on.
- Looks like: Sloths have tiny tails too. Sloths have short back legs too. Sloths have thick, shaggy fur too. Sloths have small eyes too.
- Did you know? Sloths are surprisingly good swimmers.

**Koala** · high leaves
- Your animals became sleepy climbers, a lot like a koala.
- Curved claws grip the branches. Toes without webbing hold on tight. A round body helps them hold on.
- Looks like: Koalas have round, fluffy ears too. Koalas have small eyes too. Koalas have thick fur too. Koalas have tiny tails too. Koalas have light grey coats too.
- Did you know? Koalas sleep up to 20 hours a day.

**Slow loris** · high leaves
- Your animals became night climbers, a lot like a slow loris.
- Toes without webbing hold on tight. A round body helps them hold on. (No claws line: slow lorises grip with nails.)
- Looks like: Slow lorises have thick, woolly fur too. Slow lorises have huge eyes too. Slow lorises have tiny tails too.
- Did you know? A slow loris has a venomous bite.

**Hare** · open ground
- Your animals became runners, a lot like a hare.
- Long back legs help them run fast. Big eyes spot things across open ground.
- Looks like: Hares have short tails too. Hares have thick fur too.
- Did you know? Baby hares are born furry, with open eyes.

**Lynx** · open ground · new in Round 6, in place of the arctic fox
- Your animals became pouncers, a lot like a lynx.
- Long back legs help them run fast. Big eyes spot things across open ground.
- Looks like: Lynx have pointy ears with tufts too. Lynx have sharp, curved claws too. Lynx have very thick fur too. Lynx have short tails too. Lynx have a black tip on their tails too.
- Did you know? A lynx's big furry paws work like snowshoes. **For Marc to check** (11 words).

**Cheetah** · open ground · new
- Your animals became sprinters, a lot like a cheetah.
- Long back legs help them run fast. Big eyes spot things across open ground.
- Looks like: Cheetahs have short fur too. Cheetahs have sleek bodies too. Cheetahs have long, strong tails too. Cheetahs have a white tip on their tails too. Cheetahs have straighter claws too.
- Did you know? Cheetahs are the fastest runners on land.

**Jerboa** · open ground · new
- Your animals became hoppers, a lot like a jerboa.
- Long back legs help them run fast. Big eyes spot things across open ground.
- Looks like: Jerboas have very long tails too. Jerboas have a bright tuft on their tail tip too. Jerboas have light, sandy coats too.
- Did you know? Jerboas hop on two legs, like tiny kangaroos.

**River otter** · water's edge
- Your animals became swimmers, a lot like a river otter.
- Webbed feet push through water. A strong tail helps them swim. A sleek body slides through the water easily. Short legs don't drag in the water.
- Looks like: River otters have very thick fur too. River otters have small eyes too. River otters have small, round ears too. River otters have dark brown coats too.
- Did you know? River otters slide down snowy and muddy banks. (And the whales line.)

**Seal** · water's edge
- Your animals became sleek swimmers, a lot like a seal.
- Webbed flippers push them through water. A sleek body slides through the water easily. Short legs don't drag in the water. (No tail line: seals have a tiny tail.)
- Looks like: Seals have short fur too. Seals have big eyes too. Seals have no pointy ears at all.
- Did you know? A seal's nose shuts tight when it dives. (And the whales line.)

**Beaver** · water's edge
- Your animals became paddlers, a lot like a beaver.
- Webbed feet push through water. A strong tail helps them swim. Short legs don't drag in the water. (No sleek-body line: beavers are chunky.)
- Looks like: Beavers have dark brown coats too. Beavers have plain tail tips too. Beavers have thick fur too. Beavers have small eyes too. Beavers have small, round ears too.
- Did you know? Beaver teeth are orange and never stop growing. (And the whales line.)

**Platypus** · water's edge
- Your animals became river divers, a lot like a platypus.
- Webbed feet push through water. A strong tail helps them steer. A sleek body slides through the water easily. Short legs don't drag in the water.
- Looks like: Platypuses have no pointy ears at all. Platypuses have tiny eyes too. Platypuses have thick fur too. Platypuses have dark brown fur too.
- Did you know? Platypuses are mammals that lay eggs. (And the whales line.)

**Not in the collection:** the first mammals (tree shrew), for a line that lasted but didn't change ("Your animals stayed like the very first mammals, like a tree shrew."), and "Your animals didn't have time to change." for one that died out first. Both as before.

Every line is 13 words or fewer (the longest, 11 words: "Your animals became slow, careful climbers, a lot like a sloth.").

## The seventeen before, the six candidates, and why each is in or out

| Animal | Now | Why |
|---|---|---|
| Squirrel, sloth, koala, slow loris | in, high leaves | Each has a free-trait look of its own: a big tail or pointy ears; a tiny tail or short legs; round ears or small eyes; thick fur or big eyes. |
| Hare | in, open ground | A short tail or thick fur. |
| Arctic fox | **out** (Round 6) | Long back legs are required on the open ground, so every line that wins there has them, and real arctic foxes have short legs. |
| River otter, seal, beaver, platypus | in, water's edge | Thick fur; thin fur or big eyes; a dark coat or a plain tail tip; round ears or small eyes. |
| Cheetah | **added**, open ground | Long legs and big eyes, as the ground requires; short fur and a sleek body set it apart. 84% reached. |
| Jerboa | **added**, open ground | Long back legs and big eyes; a long tail with a bright tuft sets it apart. 94% reached. |
| Lynx | **in** (Round 6), open ground | Long back legs and big eyes, as the ground requires; pointy, tufted ears or curved claws set it apart. 84 of 90 reached (with pointy ears alone, 68). |
| Meerkat | out | 79% in the experiment (curved claws or a light coat, free on the ground): under 80%. Round 6, beside the lynx: 64 of 90 (71%). |
| Bushbaby, tarsier | out | Their look in the leaves is big eyes and long back legs, which are the slow loris's signature and the squirrel's profile: a line can't be told apart as one. |
| Bear | out | On open ground long back legs and big eyes are required; a bear has neither. |
| Capybara | out | At the water's edge long legs hurt and a strong tail helps; a capybara has long legs and almost no tail. |
| Fishing cat | out | At the water's edge claws hurt; a fishing cat has curved claws. |
| Lemur, red panda | out | 77% and 73% in the experiment: under 80%. Round 6: 68 and 37 of 90 (76% and 41%), and they pull the squirrel down to 61. |
| Muskrat | out | The beaver's look (thick, dark fur, a plain flat tail): a line can't be told apart as one. |
| Mink | out (tested in Round 6) | In the game's traits, the beaver's look exactly: thick fur, small eyes, a dark coat, round ears, a plain tail tip. Listed after the beaver it is reached in 0 of 90; listed first, in 58 of 90, and the beaver falls to 36. Not distinct, so it fails the gate. |

*"In the experiment": the scratch copy of the game with a 16-animal grid (the 12 above with the lynx, meerkat, lemur and red panda), 30 seeds, a 10-minute limit. The 12-animal numbers are from the game's own code (below).*

## Check results (Claude Code, 2026-10-05, Round 6, scope decision 85)

*The game's own code, seeds 1–30, every founding family, 90 stories per animal, each on a new iPad. The child taps the family, chooses the animal's place as soon as a baby of its family lives there, then follows a glowing baby whose variation is one of the animal's signatures, once; on the backup panel a signature option, else a helpful one. Each story runs to the win. Minutes include reading time (100 words a minute, 5 s to choose), since the questions no longer count down (scope decision 84).*

| Animal | Reached at the win (of 90) | Within 8 minutes of the first tap | Otherwise |
|---|---|---|---|
| Squirrel | 88 (98%) | 85 | sloth 2 |
| Sloth | 79 (88%) | 72 | squirrel 9, slow loris 2 |
| Koala | 73 (81%) | 71 | squirrel 17 |
| Slow loris | 74 (82%) | 70 | squirrel 14, koala 2 |
| Hare | 90 (100%) | 60 | — |
| Lynx | 84 (93%) | 54 | hare 6 |
| Cheetah | 79 (88%) | 57 | hare 10, jerboa 1 |
| Jerboa | 85 (94%) | 61 | hare 5 |
| River otter | 74 (82%) | 1 | seal 6, platypus 5, beaver 4, koala 1 |
| Seal | 78 (87%) | 5 | platypus 6, river otter 5, squirrel 1 |
| Beaver | 75 (83%) | 5 | river otter 10, platypus 2, seal 2, koala 1 |
| Platypus | 81 (90%) | 2 | beaver 4, river otter 3, seal 1, koala 1 |

(The one water story ending in the leaves is seed 1's, where the water is hard for the family: the child chose the high leaves.)

- **A child following random glows**, 90 stories in each place: **all 12 animals**, the most common 15% of wins. By place: high leaves squirrel 40, koala 21, sloth 17, slow loris 12; open ground hare 35, cheetah 21, jerboa 18, lynx 16; water's edge seal 30, platypus 25, river otter 18, beaver 16 (and one sloth, seed 1's story above).

## Check results (Claude Code, 2026-10-02, scope decision 72)

*The simulated child on the game's own code (seeds 1–30, every founding family, 90 stories per animal, each on a new iPad): it taps the family, chooses the animal's place as soon as a baby of its family lives there, then follows a glowing baby whose variation is one of the animal's signatures, once (until the line keeps one); on the backup panel a signature option, else a helpful one, else none. The story stops at the win (the line fits its home: every required trait's median within APART of its helpful end, so no helpful variation is left) or 8 minutes after the place choice, and the animal is matched from the line then. Minutes as in Round 4: 20 s a watched generation, 2 s a fast one, 1.8 s a follow.*

| Animal | Reached (of 90) | Otherwise |
|---|---|---|
| Squirrel | 88 (98%) | sloth 2 |
| Sloth | 81 (90%) | squirrel 7, slow loris 2 |
| Koala | 78 (87%) | squirrel 12 |
| Slow loris | 73 (81%) | squirrel 15, koala 2 |
| Hare | 90 (100%) | — |
| Arctic fox | 80 (89%) | hare 10 |
| Cheetah | 76 (84%) | hare 14 |
| Jerboa | 85 (94%) | hare 5 |
| River otter | 75 (83%) | seal 8, beaver 4, platypus 3 |
| Seal | 80 (89%) | beaver 4, river otter 3, platypus 3 |
| Beaver | 76 (84%) | river otter 9, seal 3, platypus 2 |
| Platypus | 83 (92%) | river otter 6, seal 1 |

- **A child following random glows** (after 40 s of watching, a random glowing baby it may follow; on the backup panel a random option when one helps), 90 stories in each place, 270 in all: **all 12 animals**, none above 16%: squirrel 16%, hare 12%, seal 10%, platypus 10%, cheetah 9%, koala 8%, river otter 8%, arctic fox 8%, sloth 6%, beaver 6%, jerboa 5%, slow loris 4%. By place: leaves squirrel 42, koala 22, sloth 15, slow loris 11; ground hare 32, cheetah 24, arctic fox 21, jerboa 13; water seal 27, platypus 26, river otter 22, beaver 15.
- **Every line is checked against the engine:** each "why" line credits only a required trait of its place at its helpful level (✓ high, ✗ low), and only one the real animal has; each "looks like" line names a free or neutral trait of its place.

## Before Round 5 (kept for the record)

The 17-animal table of scope decisions 45 and 46, matched on the line's average with the old M1 net effects. Its animals, lines and numbers below are history.

### Trait levels
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

### Habitat
The zone where the largest share of the group lives at the end: high leaves (canopy), open ground (forest_floor), or water's edge (shoreline).

### What the engine rewards in each habitat

For one unit of each trait, the change in zone fitness is the sum over performance dimensions of zone weight × trait effect, minus zone scarcity × upkeep (`lineage-m1/src/config/modelConfig.js`, `traits.js`, `core/performance.js`). A trait at "high" is rewarded where this is positive; a trait at "low" is rewarded where it is negative.

| Trait | High leaves | Open ground | Water's edge |
|---|---|---|---|
| Toe webbing | −2.53 (grip −2.40) | −0.37 (grip −0.45) | **+2.88** (propulsion +3.00) |
| Curved claws | **+2.31** (grip +2.56) | +0.17 (grip +0.48) | −1.15 (propulsion −0.90) |
| Dense fur | +0.30 (warmth +0.60) | +0.90 (warmth +1.20) | −0.70 (warmth +0.80, drag −1.20) |
| Long back legs | +0.93 (movement +1.28) | **+1.89** (movement +2.24) | −1.07 (movement +0.48, drag −1.20) |
| Strong tail | −0.63 (movement −0.40) | −0.80 (movement −0.70) | **+1.42** (propulsion +1.80) |
| Large eyes | +0.35 (sight +0.90) | **+1.25** (sight +1.80) | −0.55 (energy only: no sight weight there) |
| Streamlined body | −1.38 (grip −1.28) | −0.34 (grip −0.24) | **+1.82** (drag reduction +1.92) |

So, for example, at the water's edge short back legs, thin fur, small eyes and short claws are all rewarded, and in the high leaves a small tail and a round body are. Every "why" line below credits only a trait at a level its habitat rewards, with two trade-off lines kept from the balance round (see the check results).

### Water's edge

River otter
- Profile: toe webbing high, strong tail high, streamlined body high, curved claws low.
- Signature: toe webbing high and streamlined body high.
- Reveal: "Your animals became swimmers, a lot like a river otter." Died out: "Your animals were becoming a lot like a river otter."
- Why: "Webbed feet push through water." "A strong tail helps them swim." "A sleek body slides through the water easily."
- Why, died out: "Webbed feet pushed them through water." "A strong tail helped them swim." "A sleek body slid through the water easily."
- Did you know: "Did you know? River otters slide down snowy and muddy banks." "Did you know? Whales' ancestors were land animals that started swimming."

Beaver
- Profile: toe webbing high, strong tail high, dense fur high, streamlined body low.
- Signature: toe webbing high and strong tail high.
- Reveal: "Your animals became paddlers, a lot like a beaver." Died out: "Your animals were becoming a lot like a beaver."
- Why: "Webbed feet and a strong tail push them through water." "Thick fur keeps them warm, but it slows their swimming."
- Why, died out: "Webbed feet and a strong tail pushed them through water." "Thick fur kept them warm, but it slowed their swimming."
- Did you know: "Did you know? Beaver teeth are orange and never stop growing." "Did you know? Whales' ancestors were land animals that started swimming."

Capybara
- Profile: toe webbing high, strong tail low, long back legs high, dense fur low.
- Signature: toe webbing high and long back legs high.
- Reveal: "Your animals live between land and water, a lot like a capybara." Died out: "Your animals were becoming a lot like a capybara."
- Why: "Webbed toes help them swim." "Long back legs help on land, but slow them in water." "Thin fur doesn't slow them in water."
- Why, died out: "Webbed toes helped them swim." "Long back legs helped on land, but slowed them in water." "Thin fur didn't slow them in water."
- Did you know: "Did you know? Capybaras are the world's biggest rodents." "Did you know? Whales' ancestors were land animals that started swimming."

Platypus
- Profile: toe webbing high, strong tail high, long back legs low, large eyes low, dense fur high.
- Signature: toe webbing high.
- Reveal: "Your animals became river divers, a lot like a platypus." Died out: "Your animals were becoming a lot like a platypus."
- Why: "Webbed feet push them through water." "A strong tail helps them steer." "Short legs don't drag in the water." "Small eyes use less energy to grow."
- Why, died out: "Webbed feet pushed them through water." "A strong tail helped them steer." "Short legs didn't drag in the water." "Small eyes used less energy to grow."
- Did you know: "Did you know? Platypuses are mammals that lay eggs." "Did you know? Whales' ancestors were land animals that started swimming."

Seal
- Profile: toe webbing high, large eyes high, streamlined body high, long back legs low, dense fur low.
- Signature: toe webbing high and large eyes high.
- Reveal: "Your animals became sleek swimmers, a lot like a seal." Died out: "Your animals were becoming a lot like a seal."
- Why: "Webbed flippers push them through water." "A sleek body slides through the water easily." "Short back legs don't drag in the water." "Thin fur doesn't slow their swimming."
- Why, died out: "Webbed flippers pushed them through water." "A sleek body slid through the water easily." "Short back legs didn't drag in the water." "Thin fur didn't slow their swimming."
- Did you know: "Did you know? A seal's nose shuts tight when it dives." "Did you know? Whales' ancestors were land animals that started swimming."

Fishing cat
- Profile: toe webbing high, curved claws high, long back legs low.
- Signature: toe webbing high and curved claws high.
- Reveal: "Your animals became waders, a lot like a fishing cat." Died out: "Your animals were becoming a lot like a fishing cat."
- Why: "Webbed feet help them swim." "Short legs don't drag in the water."
- Why, died out: "Webbed feet helped them swim." "Short legs didn't drag in the water."
- Did you know: "Did you know? Fishing cats dive into water to catch fish." "Did you know? Whales' ancestors were land animals that started swimming."

### High leaves

Squirrel
- Profile: curved claws high, toe webbing low, streamlined body low.
- Signature: curved claws high.
- Reveal: "Your animals became climbers, a lot like a squirrel." Died out: "Your animals were becoming a lot like a squirrel."
- Why: "Curved claws grip the branches." "Toes without webbing hold on tight."
- Why, died out: "Curved claws gripped the branches." "Toes without webbing held on tight."
- Did you know: "Did you know? Squirrels plant trees by forgetting buried nuts."

Sloth
- Profile: curved claws high, dense fur high, long back legs low, large eyes low.
- Signature: curved claws high and dense fur high.
- Reveal: "Your animals became slow, careful climbers, a lot like a sloth." Died out: "Your animals were becoming a lot like a sloth."
- Why: "Big curved claws hold on to branches." "Thick fur keeps them warm."
- Why, died out: "Big curved claws held on to branches." "Thick fur kept them warm."
- Did you know: "Did you know? Sloths are surprisingly good swimmers."

Bushbaby
- Profile: large eyes high, long back legs high.
- Signature: large eyes high.
- Reveal: "Your animals became night leapers, a lot like a bushbaby." Died out: "Your animals were becoming a lot like a bushbaby."
- Why: "Big eyes help them see well." "Long back legs help them move fast."
- Why, died out: "Big eyes helped them see well." "Long back legs helped them move fast."
- Did you know: "Did you know? A bushbaby's call sounds like a crying baby."

Koala
- Profile: curved claws high, dense fur high, strong tail low, streamlined body low.
- Signature: curved claws high and strong tail low.
- Reveal: "Your animals became sleepy climbers, a lot like a koala." Died out: "Your animals were becoming a lot like a koala."
- Why: "Curved claws grip the branches." "Thick fur keeps them warm." "A tiny tail doesn't get in their way." "A round body helps them hold on."
- Why, died out: "Curved claws gripped the branches." "Thick fur kept them warm." "A tiny tail didn't get in their way." "A round body helped them hold on."
- Did you know: "Did you know? Koalas sleep up to 20 hours a day."

Tarsier
- Profile: large eyes high, long back legs high, strong tail low.
- Signature: large eyes high and long back legs high.
- Reveal: "Your animals became big-eyed leapers, a lot like a tarsier." Died out: "Your animals were becoming a lot like a tarsier."
- Why: "Huge eyes help them see well." "Long back legs help them move fast." "A thin tail doesn't slow them down."
- Why, died out: "Huge eyes helped them see well." "Long back legs helped them move fast." "A thin tail didn't slow them down."
- Did you know: "Did you know? Tarsiers have eyes as big as their brains."

Slow loris
- Profile: large eyes high, dense fur high, strong tail low, streamlined body low.
- Signature: large eyes high and dense fur high.
- Reveal: "Your animals became night climbers, a lot like a slow loris." Died out: "Your animals were becoming a lot like a slow loris."
- Why: "Big eyes help them see well." "Thick fur keeps them warm." "A tiny tail doesn't get in their way." "A round body helps them hold on."
- Why, died out: "Big eyes helped them see well." "Thick fur kept them warm." "A tiny tail didn't get in their way." "A round body helped them hold on."
- Did you know: "Did you know? A slow loris has a venomous bite."

### Open ground

Hare
- Profile: long back legs high, strong tail low, large eyes high.
- Signature: long back legs high.
- Reveal: "Your animals became runners, a lot like a hare." Died out: "Your animals were becoming a lot like a hare."
- Why: "Long back legs help them run fast." "Big eyes help them see well." "A small tail doesn't slow them down."
- Why, died out: "Long back legs helped them run fast." "Big eyes helped them see well." "A small tail didn't slow them down."
- Did you know: "Did you know? Baby hares are born furry, with open eyes."

Meerkat
- Profile: large eyes high, long back legs low, strong tail low.
- Signature: large eyes high and long back legs not high.
- Reveal: "Your animals became lookouts, a lot like a meerkat." Died out: "Your animals were becoming a lot like a meerkat."
- Why: "Big eyes help them see well across open ground."
- Why, died out: "Big eyes helped them see well across open ground."
- Did you know: "Did you know? Meerkats take turns standing guard for their group."

Lynx
- Profile: long back legs high, dense fur high, strong tail low.
- Signature: long back legs high and dense fur high.
- Reveal: "Your animals became snow walkers, a lot like a lynx." Died out: "Your animals were becoming a lot like a lynx."
- Why: "Long back legs help them run fast." "Thick fur keeps them warm." "A short tail doesn't slow them down."
- Why, died out: "Long back legs helped them run fast." "Thick fur kept them warm." "A short tail didn't slow them down."
- Did you know: "Did you know? A lynx's big furry paws work like snowshoes."

Bear
- Profile: curved claws high, dense fur high, strong tail low, streamlined body low.
- Signature: curved claws high.
- Reveal: "Your animals became big wanderers, a lot like a bear." Died out: "Your animals were becoming a lot like a bear."
- Why: "Curved claws give them a good grip." "Thick fur keeps them warm." "A short tail doesn't slow them down."
- Why, died out: "Curved claws gave them a good grip." "Thick fur kept them warm." "A short tail didn't slow them down."
- Did you know: "Did you know? Many bears sleep all winter without eating."

Arctic fox
- Profile: dense fur high, long back legs low, strong tail high.
- Signature: dense fur high.
- Reveal: "Your animals became cold-weather experts, a lot like an arctic fox." Died out: "Your animals were becoming a lot like an arctic fox."
- Why: "Thick fur keeps them warm."
- Why, died out: "Thick fur kept them warm."
- Did you know: "Did you know? Most arctic foxes turn white in winter."

### Any habitat — fallbacks

The first mammals (tree shrew), for a surviving group only
- Profile: no animal above qualifies.
- Reveal: "Your animals stayed like the very first mammals, like a tree shrew."
- Why: "Their bodies didn't change much, and that worked. Some animals today still look a lot like their ancient relatives."
- Did you know: "Did you know? Tree shrews are cousins of monkeys and apes."

No time to change, for a group that died out (scope decision 41)
- Profile: no animal above qualifies. A group that died out never gets the first mammals.
- Reveal: "Your animals didn't have time to change."
- Why: "Their story ended before new traits could be passed on."
- No fact: it names no animal.

### Died-out endings (scope decisions 40 and 41)

Every ending gets a reveal. It uses the group's actual average traits and main habitat when the story ended (its last living members), with the same table, the same matching rule and the same "why" filter. A group that died out gets its reveal and "why" lines in the past tense (above, "Died out" and "Why, died out"). The "Did you know?" facts are about the real animal, so they stay in the present tense.

### Matching rule
1. Only animals from the group's end habitat are considered, plus the fallback.
2. An animal qualifies only if the group has its signature trait(s).
3. Among qualifying animals, the best match is the one whose checked traits the group meets most strongly: the sum of how far each met checked trait is past its level. A tie goes to the animal listed first in its habitat above.
4. If none qualifies, use the fallback.

5. The reveal shows only the "why" sentences whose credited trait the group has, at the same levels. The sentence about the signature always qualifies. For example, a beaver-like group without thick fur is not told "Thick fur keeps them warm".
6. Then the animal's "Did you know?" lines, each with a speaker. Every water's-edge animal adds a second one: "Did you know? Whales' ancestors were land animals that started swimming."

*Balance round, 2026-09-23. Rules 2 and 3 replace "the best match needs at least all but one of its checked traits" and "ties go to the animal with more checked traits". With "all but one" kept alongside the signature rule, the targets (fallback at most 35%, no animal above 35%) were met only at GAP 0.04 or less, where a barely changed trait counts as high, and Meerkat never appeared.*

### Rejected animals (2026-09-24, scope decision 45)

Each was considered and left out, with the reason. "Tried" means it was added to the final table and measured on the 540 stories.

| Animal | Why it is not in the table |
|---|---|
| Kangaroo | Its strong tail is punished on land (open ground −0.80). |
| Mole | Its digging isn't modeled. |
| Red panda | Its ringed, bushy tail is a strong tail, which the high leaves punish (−0.63), and its red coat is a neutral trait. What is left, curved claws and thick fur, is the sloth's and the koala's. |
| Lemur | It grips with nails, not claws, and its long tail is punished in the high leaves. Big eyes and long legs alone are the bushbaby's. |
| Mink | Its famous thick fur is punished at the water's edge (drag −1.20 against warmth +0.80). Tried: 5 of 540 endings (0.9%). |
| Muskrat | Webbed feet, a flat tail, thick fur and a round body: the beaver's profile. Tried: 0 of 540. |
| Jerboa | Long back legs, big eyes and a thin tail: the hare's profile. Tried: 0 of 540. |
| Cheetah | Its sleek body and short fur are both punished on open ground; only its long legs help. Tried: 2 of 540 (0.4%). |
| Deer | Long legs, big eyes and a short tail: the hare's profile. |
| Red fox | Its bushy tail is punished on open ground, and its pointed ears and red coat are neutral traits. (The arctic fox is in, for its thick fur.) |
| Mongoose | Its long, slender body and long tail are both punished on open ground. |
| Manatee | It has flippers, not webbed toes, and almost every group at the water's edge grows webbed feet. Tried: 1 of 540 (0.2%). |
| Hippopotamus | Its size can't be shown, and its barrel body is punished at the water's edge (streamlined body +1.82 there). |
| Flying squirrel, sugar glider | Gliding isn't modeled. |
| Spider monkey | Its gripping tail is a strong tail, which the high leaves punish. |
| Hedgehog, armadillo | Spines and armour can't be shown. |

### Facts for Marc to check (2026-09-24, scope decision 46)

Every animal as a child sees it on the ending: its reveal line, its "why" sentences (shown together as one paragraph), and its "Did you know?" fact or facts, each with a speaker. The first "why" sentence always shows; the others show only when the group has that trait. A group that died out sees the past-tense lines instead; the facts stay the same. Each fact is one true, kid-level fact, 11 words or fewer.

**River otter** · water's edge
- Your animals became swimmers, a lot like a river otter.
- Webbed feet push through water. A strong tail helps them swim. A sleek body slides through the water easily.
- Did you know? River otters slide down snowy and muddy banks.
- Did you know? Whales' ancestors were land animals that started swimming.
- *If the group died out:* Your animals were becoming a lot like a river otter. Webbed feet pushed them through water. A strong tail helped them swim. A sleek body slid through the water easily.

**Beaver** · water's edge
- Your animals became paddlers, a lot like a beaver.
- Webbed feet and a strong tail push them through water. Thick fur keeps them warm, but it slows their swimming.
- Did you know? Beaver teeth are orange and never stop growing.
- Did you know? Whales' ancestors were land animals that started swimming.
- *If the group died out:* Your animals were becoming a lot like a beaver. Webbed feet and a strong tail pushed them through water. Thick fur kept them warm, but it slowed their swimming.

**Capybara** · water's edge
- Your animals live between land and water, a lot like a capybara.
- Webbed toes help them swim. Long back legs help on land, but slow them in water. Thin fur doesn't slow them in water.
- Did you know? Capybaras are the world's biggest rodents.
- Did you know? Whales' ancestors were land animals that started swimming.
- *If the group died out:* Your animals were becoming a lot like a capybara. Webbed toes helped them swim. Long back legs helped on land, but slowed them in water. Thin fur didn't slow them in water.

**Platypus** · water's edge
- Your animals became river divers, a lot like a platypus.
- Webbed feet push them through water. A strong tail helps them steer. Short legs don't drag in the water. Small eyes use less energy to grow.
- Did you know? Platypuses are mammals that lay eggs.
- Did you know? Whales' ancestors were land animals that started swimming.
- *If the group died out:* Your animals were becoming a lot like a platypus. Webbed feet pushed them through water. A strong tail helped them steer. Short legs didn't drag in the water. Small eyes used less energy to grow.

**Seal** · water's edge
- Your animals became sleek swimmers, a lot like a seal.
- Webbed flippers push them through water. A sleek body slides through the water easily. Short back legs don't drag in the water. Thin fur doesn't slow their swimming.
- Did you know? A seal's nose shuts tight when it dives.
- Did you know? Whales' ancestors were land animals that started swimming.
- *If the group died out:* Your animals were becoming a lot like a seal. Webbed flippers pushed them through water. A sleek body slid through the water easily. Short back legs didn't drag in the water. Thin fur didn't slow their swimming.

**Fishing cat** · water's edge
- Your animals became waders, a lot like a fishing cat.
- Webbed feet help them swim. Short legs don't drag in the water.
- Did you know? Fishing cats dive into water to catch fish.
- Did you know? Whales' ancestors were land animals that started swimming.
- *If the group died out:* Your animals were becoming a lot like a fishing cat. Webbed feet helped them swim. Short legs didn't drag in the water.

**Squirrel** · high leaves
- Your animals became climbers, a lot like a squirrel.
- Curved claws grip the branches. Toes without webbing hold on tight.
- Did you know? Squirrels plant trees by forgetting buried nuts.
- *If the group died out:* Your animals were becoming a lot like a squirrel. Curved claws gripped the branches. Toes without webbing held on tight.

**Sloth** · high leaves
- Your animals became slow, careful climbers, a lot like a sloth.
- Big curved claws hold on to branches. Thick fur keeps them warm.
- Did you know? Sloths are surprisingly good swimmers.
- *If the group died out:* Your animals were becoming a lot like a sloth. Big curved claws held on to branches. Thick fur kept them warm.

**Bushbaby** · high leaves
- Your animals became night leapers, a lot like a bushbaby.
- Big eyes help them see well. Long back legs help them move fast.
- Did you know? A bushbaby's call sounds like a crying baby.
- *If the group died out:* Your animals were becoming a lot like a bushbaby. Big eyes helped them see well. Long back legs helped them move fast.

**Koala** · high leaves
- Your animals became sleepy climbers, a lot like a koala.
- Curved claws grip the branches. Thick fur keeps them warm. A tiny tail doesn't get in their way. A round body helps them hold on.
- Did you know? Koalas sleep up to 20 hours a day.
- *If the group died out:* Your animals were becoming a lot like a koala. Curved claws gripped the branches. Thick fur kept them warm. A tiny tail didn't get in their way. A round body helped them hold on.

**Tarsier** · high leaves
- Your animals became big-eyed leapers, a lot like a tarsier.
- Huge eyes help them see well. Long back legs help them move fast. A thin tail doesn't slow them down.
- Did you know? Tarsiers have eyes as big as their brains.
- *If the group died out:* Your animals were becoming a lot like a tarsier. Huge eyes helped them see well. Long back legs helped them move fast. A thin tail didn't slow them down.

**Slow loris** · high leaves
- Your animals became night climbers, a lot like a slow loris.
- Big eyes help them see well. Thick fur keeps them warm. A tiny tail doesn't get in their way. A round body helps them hold on.
- Did you know? A slow loris has a venomous bite.
- *If the group died out:* Your animals were becoming a lot like a slow loris. Big eyes helped them see well. Thick fur kept them warm. A tiny tail didn't get in their way. A round body helped them hold on.

**Hare** · open ground
- Your animals became runners, a lot like a hare.
- Long back legs help them run fast. Big eyes help them see well. A small tail doesn't slow them down.
- Did you know? Baby hares are born furry, with open eyes.
- *If the group died out:* Your animals were becoming a lot like a hare. Long back legs helped them run fast. Big eyes helped them see well. A small tail didn't slow them down.

**Meerkat** · open ground
- Your animals became lookouts, a lot like a meerkat.
- Big eyes help them see well across open ground.
- Did you know? Meerkats take turns standing guard for their group.
- *If the group died out:* Your animals were becoming a lot like a meerkat. Big eyes helped them see well across open ground.

**Lynx** · open ground
- Your animals became snow walkers, a lot like a lynx.
- Long back legs help them run fast. Thick fur keeps them warm. A short tail doesn't slow them down.
- Did you know? A lynx's big furry paws work like snowshoes.
- *If the group died out:* Your animals were becoming a lot like a lynx. Long back legs helped them run fast. Thick fur kept them warm. A short tail didn't slow them down.

**Bear** · open ground
- Your animals became big wanderers, a lot like a bear.
- Curved claws give them a good grip. Thick fur keeps them warm. A short tail doesn't slow them down.
- Did you know? Many bears sleep all winter without eating.
- *If the group died out:* Your animals were becoming a lot like a bear. Curved claws gave them a good grip. Thick fur kept them warm. A short tail didn't slow them down.

**Arctic fox** · open ground
- Your animals became cold-weather experts, a lot like an arctic fox.
- Thick fur keeps them warm.
- Did you know? Most arctic foxes turn white in winter.
- *If the group died out:* Your animals were becoming a lot like an arctic fox. Thick fur kept them warm.

**The first mammals (tree shrew)** · any habitat, a surviving group that barely changed
- Your animals stayed like the very first mammals, like a tree shrew.
- Their bodies didn't change much, and that worked. Some animals today still look a lot like their ancient relatives.
- Did you know? Tree shrews are cousins of monkeys and apes.

**No time to change** · any habitat, a group that died out and matches no animal
- Your animals didn't have time to change.
- Their story ended before new traits could be passed on.
- (No fact: it names no animal.)

### Check results (Claude Code, 2026-09-24, scope decisions 45 and 46)

The game implements this table in `game/src/reveal.js`, which must match this file.

### "Why" lines against the engine's rewards

- **All 17 animals:** every "why" line credits a trait at a level its habitat rewards (the table above), except two trade-off lines kept from the balance round. Each names the part that helps and says the whole costs more:
  - Beaver: "Thick fur keeps them warm, but it slows their swimming." (net −0.70: warmth +0.80, drag −1.20).
  - Capybara: "Long back legs help on land, but slow them in water." (net −1.07: movement +0.48, drag −1.20).
- **The new animals:** the trait-level credits are these.
  - Water's edge: short legs "don't drag in the water" (drag); thin fur "doesn't slow their swimming" (drag); small eyes "use less energy to grow" (they cost energy and give no sight there); the platypus's strong tail "helps them steer" (propulsion).
  - High leaves: a tiny tail "doesn't get in their way" (movement); a round body "helps them hold on" (grip).
  - Open ground: curved claws "give them a good grip" (grip +0.48, net +0.17, a small reward).
- **The signature's line** always shows: every animal has a "why" line whose credits are part of its signature.
- **Profiles** differ within each habitat. Nested ones (the bushbaby's is part of the tarsier's) are told apart by the extra trait, since the strongest match adds it.
- **Line lengths:** 121 different child-facing lines (reveal lines, "why" lines in both tenses, facts). The longest is 12 words: "Your animals live between land and water, a lot like a capybara." and "Your animals stayed like the very first mammals, like a tree shrew.", both unchanged from earlier rounds. Every fact is 11 words or fewer.

### How often each reveal appears (540 stories, 2026-09-24)

60 good seeds × 9 founding families, with the simulated child of scope decisions 42 and 44 (after at least 40 s it taps the first meaningful glowing trait, whether or not it can start a fair test; the first option on the backup panel). 110 stories survive and 430 die out. Survived and died-out endings together:

| Habitat | Reveal | Endings | Share | Survived / died out |
|---|---|---|---|---|
| Water's edge | Platypus | 67 | 12.4% | 1 / 66 |
| | River otter | 31 | 5.7% | 2 / 29 |
| | Capybara | 19 | 3.5% | 6 / 13 |
| | Seal | 19 | 3.5% | 4 / 15 |
| | Beaver | 15 | 2.8% | 2 / 13 |
| | Fishing cat | 6 | 1.1% | 0 / 6 |
| High leaves | Squirrel | 60 | 11.1% | 12 / 48 |
| | Bushbaby | 42 | 7.8% | 22 / 20 |
| | Koala | 35 | 6.5% | 15 / 20 |
| | Tarsier | 18 | 3.3% | 10 / 8 |
| | Sloth | 11 | 2.0% | 4 / 7 |
| | Slow loris | 6 | 1.1% | 0 / 6 |
| Open ground | Hare | 48 | 8.9% | 15 / 33 |
| | Bear | 15 | 2.8% | 2 / 13 |
| | Meerkat | 14 | 2.6% | 0 / 14 |
| | Lynx | 14 | 2.6% | 4 / 10 |
| | Arctic fox | 6 | 1.1% | 0 / 6 |
| Any | No time to change | 103 | 19.1% | — / 103 |
| | The first mammals (tree shrew) | 11 | 2.0% | 11 / — |

- **Targets met:**
  - every animal is at least 1.1% (about 1% asked);
  - none is above 12.4% (at most 20%);
  - the two fallbacks together are 21.1% (under 30%).
- **Before (the eight animals, the same 540 stories):** "No time to change" 184 and the first mammals 13 (36.5% together), Squirrel 87 (16.1%).
- **Why the fallbacks were high:** only 14 of the 540 endings (3%) have no trait past GAP. The rest had changed, but in ways no animal matched, such as webbed feet alone at the water's edge (now the platypus) or big eyes and webbed feet (now the seal).
- **What still falls back:** mostly groups that ended in the high leaves with webbed feet (no real tree animal has them), groups whose webbing or claws never moved, and bodies from one habitat that ended in another.

### Earlier results

### Checks for Claude Code (2026-09-23)
- Confirm each "why" line against the zone weights. If an animal's habitat does not reward a trait its "why" line credits, rewrite that line or drop the animal, and report it.
- Across the 270 measurement stories, report how often each reveal appears. An animal that never appears is fine to keep, but say so.

### Check results (Claude Code, 2026-09-23)

The game implements this table in `game/src/reveal.js`, which must match this file.

#### "Why" lines against the zone weights

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

#### How often each reveal appears on every ending (2026-09-24)

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

#### How often each reveal appears (balance round: relative levels, GAP 0.12, signatures)

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

#### How often each reveal appeared before the balance round (absolute levels 0.6 / 0.4, "all but one", tie to more checked traits)

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
