# LINEAGE — Project Handoff

*Everything a new collaborator needs. Read all of it before proposing anything.*

---

## 0. Read this first

This document exists because two AI collaborators spent a long time auditing each other into finer and finer engineering detail until the actual game stopped being the subject. The specification got very good. The vision receded.

**The order of authority is: vision → pedagogy → design → engineering.** Not the reverse. If a proposal makes the engineering more correct and the game less like the thing described in §2, the proposal is wrong.

---

## 1. Who this is for

I teach **Grade 3** (ages 8–9), IB PYP. This is for my unit of inquiry on animal adaptations, which I run every year and am rebuilding for the coming year.

**Central idea:** *Survival depends on adapting to environmental changes.*

**Summative assessment:** Students research a real animal and write a nonfiction book about its adaptations and how those adaptations help it survive in its biome.

This year the unit also sits inside a 16-week science-of-reading-and-writing rebuild, so the reading materials are being redone from scratch.

I have 1:1 devices. I already build and deploy my own web tools — I have a working room-based API and several deployed educational engines. This is not a hypothetical.

---

## 2. The game

### What it is

A child watches a population of small animals living in a world. Time runs. Generations pass. Every ten or twelve seconds a new variation appears somewhere in the population — wider toes, thicker fur, a different coat shade — and it flashes. The child can tap it to look, and choose whether to follow the animals that have it.

Then they watch what happens to them.

**It is not a survival game. It is an exploration game.** The question the child is asking is not *will my animals live?* It's:

> *What happens if I give this animal webbed feet?*
> *What if a water animal gets echolocation — that sounds stupid, but does it work?*
> *What happens to the ones I didn't follow?*

The closest reference is **Little Alchemy 2** — the pleasure of "what happens if I combine these two things," a collection that fills in, and the constant small hope that you'll find something nobody else in the class found. The second reference is **Spore**, but only for the feeling of watching your creature change across generations. Spore's actual mechanic — assembling a better creature on purpose — is precisely what this game must not be.

### What it feels like to play

The world is alive before you touch anything. Animals move, feed, pair, have young, die. Snow drifts, water shimmers, dust blows. It should look like a nature documentary, not a school portal. Sound on: ambient, underwater hum, wind.

You watch. Things flash. You tap some and miss others, and missing them costs nothing — the variation is still out there and may come back.

You can wander off and look at the other groups. Tap one, see what traits it's carrying, see whether it's growing. Sometimes a group you *aren't* following is doing much better than yours and you have no idea why, and you have to go and find out.

At the end of a round the world pauses. What you flagged lays out. You pick one group to keep following, or you pick none. Nobody rushes you. This is where the arguing happens.

Then time runs again.

### The core loop

1. The world runs in real time.
2. Variations surface every ~12 seconds and flash. Tap to flag. Free, no cost, no commitment.
3. You can also explore — tap animals, tap other groups, compare.
4. The round ends. The world pauses.
5. Your flagged variations lay out. Choose a group to follow, or choose nothing.
6. Time runs. Many generations.
7. Your group thrives, stalls, or dies out. So does everyone else's, for their own reasons.
8. Go again.

### The lesson

**Most variations do not lead to success.**

That's the whole thing. Not "adaptations are good." Not "animals evolve to fit their environment." Most of what appears in a population goes nowhere, and whether something helps depends entirely on where the animal already lives.

### What the child ends up with

After several rounds their animals look different from the ancestor. If they followed water-leaning animals for long enough, something dolphin-like. Trees, something primate-like or gliding. Underground, something mole-like.

Nobody tells them what they're building. The moment they recognise it — *"wait, we made a dolphin"* — is the payoff, and the whole design is arranged around protecting it.

### The collection

Every form they reach fills in on a collection screen. Undiscovered ones are silhouettes.

Mixed into that list are **real animals that sound invented** — the star-nosed mole, the naked mole rat, the platypus. And, much later and much rarer, **mythical recombinations** built entirely out of real mammal parts: bats fly, pangolins are armoured, platypuses are venomous, elephants are large. A dragon is those four things at once.

**The silhouettes must not indicate which are real and which are myths.** You can't tell whether the strange one is a legend or a beetle until you find it. That ambiguity is the hook, and it pushes children toward looking things up — which is the exact research skill the unit's summative needs.

Mythical forms should be rare enough that one group in a class of thirty finds one and tells everyone about it for the rest of the year.

### The journal

The game records the facts automatically: what round, what zone, what you flagged, what you followed, the population counts, what the other groups did. No child is ever staring at a blank box.

The child supplies the meaning: *why did you pick that one? what do you think happened? were you right?*

Before each round it asks one prediction. It saves it. It shows it to them again later, next to what actually happened. Nothing punishes them — their own handwriting from three rounds ago does the work.

The journal is downloadable and shareable. **It is fictional simulation history and must be labelled as such** — it feeds the summative as a source of questions and curiosity, never as a source of facts about real animals.

---

## 3. The unit this lives in

**This matters more than anything else in this document.** Every AI I've worked with has assumed this game is the only exposure my students get to adaptation, and then tried to make the game carry the entire conceptual load. It isn't and it doesn't.

By the time a child opens this game they have already spent weeks on the following.

### Reading basket (being rebuilt this year)

Daily nonfiction and narrative texts across biomes — arctic, desert, ocean, rainforest, grassland, cave. Building vocabulary: adaptation, habitat, camouflage, predator, prey, survival, biome. Building the core idea that different environments present different challenges and animals have body features that meet them.

Current weaknesses I want fixed: not enough **genre range** (they need to have read the kinds of nonfiction they'll be asked to write), and no text that makes the **cross-biome connection** — why does a desert animal look fundamentally different from a rainforest one?

### Zoo Architects of Atlantis

A multi-session interdisciplinary project I built by hand a couple of years ago.

Students discover 24 fictional species from the lost city of Atlantis, each with a habitat, a diet, and an adaptation. They sort them by category, build data tables, draw bar graphs, and use multiplication to calculate how much space each habitat needs. All of it driven by a problem they care about — they're building a zoo to save these animals.

Then the zoo opens, and the project changes genre. They're handed two years of population and food-consumption data and told to graph it.

**The mystery:** the zoo modified the carnivores so they can't hunt and the herbivores so they can't eat the plants. Carnivore numbers rise. Their supplied food doesn't. Herbivore numbers fall.

The answer is that the modification was done to the *individuals*. It wasn't inherited. **The offspring can hunt.**

Students figure this out from the data. Nobody tells them. That's the bridge between "this animal has adaptations" and "traits pass to the next generation."

### The Peppered Moth deep dive

Two texts. One is moth population data, 1850–1900, white moths declining and dark moths rising. The other is about England's industrialisation — factories, coal smoke, tree bark turning black.

**Neither text mentions the other.** The students graph the moth data, read about the factories, and make the connection themselves.

There are three reading levels of the England text. Differentiated input, identical intellectual task.

### The Curiosity Research Engine

A safe research tool I built. A student picks a topic, gets age-appropriate answers with **working source links on every claim**, and four suggested follow-up questions plus a free-text box. It follows their curiosity rather than a script — one session went Viking ships → the word *Skraeling* → the Beothuk → why Europeans carried more diseases. No worksheet produces that path.

They use it to research their real animal for the summative.

### So what the students already know before the game

- Adaptations are body features that help animals survive in specific places.
- Different environments favour different adaptations.
- Offspring inherit traits from parents.
- Variations appear randomly. Animals don't decide to grow things.
- Populations change over time because some traits help survival more than others.
- The peppered moth is a real case of exactly that.

**The game's job is not to teach any of that. It's to let them use it, with stakes.**

---

## 4. Why this game and not something else

Every other piece of the unit is retrospective. Maya already has white fur. The Coral Reef animals already have their adaptations. The moth data is from a century ago. The Atlantis mystery is about something that already happened. The Research Engine describes animals that already exist.

**Nothing lets them watch it happen and be wrong about it.**

That's what this provides:

**Commitment with consequences.** No text or worksheet makes a child stake a claim and then face the result. "I picked the webbed feet. Let's see." That's the thing that makes it stick.

**The wrong answer.** Following a variation that doesn't help and watching the group dwindle teaches more than any correct answer on a worksheet — because they chose it, and they can trace backward to see why it didn't work.

**Recognition without instruction.** Realising you've made a dolphin is worth more than being told how whales evolved.

**Replay.** The same mechanic works for every biome. Different puzzle, different real animal at the end. And it connects straight back into the summative: a child who watched a lineage go into the water has a *reason* to write their book about dolphins, and notes to write it from.

---

## 5. Arguments already had. Do not reopen them.

Several of these took a long time to settle. They are settled.

### "Letting the student choose is teleological"

**Raised repeatedly. Overcorrected.** The concern is that if a child picks which trait succeeds, they'll think evolution has a director.

In a unit where this game was the only activity, that would be a real risk. In *this* unit, where the peppered moth has already taught them that populations change because dark moths survived better on dark trees — not because anyone chose — the risk evaporates. They already have the correct mental model. The game gives them a place to apply it.

A flight simulator doesn't teach people that humans can fly by flapping. The simplification in the mechanic doesn't corrupt the knowledge when the knowledge was built first.

The **language** should still be precise — *"these variations appeared; you're predicting which group will do well"* rather than *"choose how your animal evolves."* That's copywriting, not architecture.

### "Then just make it an observation tool"

Tried on paper. **It's a spectator role wearing the costume of agency**, and simulation testing later proved it exactly: with no spatial structure, following a lineage produced *no signal at all*. Tapping coat shade for a whole run gave the same outcomes as reasoning carefully. See §6.

### "Timescales, mutation rates, genetic accuracy"

Not the goal. An eight-year-old does not need to imagine twenty million years. They need the intuition that a trait helps *here* and not *there*. Time compression is a game mechanic. The game says "many, many generations" and leaves the number alone.

### "Add a full genetics model / prerequisite graph / thermal optima"

Each defensible in isolation. Together they're a research programme, and the game never ships. **Architectural things that can't be retrofitted go in early. Tuning refinements go in later.**

---

## 6. What simulation testing actually proved

I had a Python simulation of the biology built and run several thousand times before any game code was written. Half the tuning problem needs no children — it's arithmetic. Four findings.

### The lesson was false in the engine

First run: only **9% of variations were neutral**, 52% helped. Because the trait pool contained thirty-two things that all *do something*.

Adding fourteen inconsequential traits — coat shade, ear notch, tail length, eye colour, spotting — moved it to **35% neutral, 35% helpful, 30% harmful.** Roughly two-thirds of what appears leads nowhere.

**The boring traits are load-bearing.** If the pool only contains meaningful traits, "most variations don't matter" isn't discoverable, because in that world it isn't true.

### Seven traits were secretly upgrades

Dense fur, whiskers, strong jaw, fat and three others helped in *all eight* environments. Pokémon stats in a lab coat. Fixed by giving each a real metabolic cost and a place where its function switches off — smell is useless underwater, whiskers are useless in dry open country, thick fur is a heat problem in a warm forest.

**Design law that came out of it:** every meaningful trait must have either a direct trade-off or somewhere it does nothing.

### Three modelling bugs, each of which would have taught something wrong

Drift noise clipped at zero **ratchets rare traits upward** — this put gliding membranes on grassland runners. Density control was **flattening selection** by pushing every animal to the survival ceiling. And armour was harmful everywhere because the model had no dimension for predation.

### The big one: following a lineage produced no signal

| student taps | reached cetacean | branch died |
|---|---|---|
| at random | 15% | 47% |
| water-suited traits | 16% | 40% |
| land-suited traits | 16% | 40% |
| **coat shade and eye colour** | 13% | 38% |

Tapping meaningless traits performed the same as reasoning carefully. Selection acted identically on every animal, so every subset of the population ended in the same place.

**The fix is spatial.** Zones exist all at once. Webbed feet appear in canopy animals *and* shoreline animals. You see where the carriers already live and pick which group to follow — and the group **stays exactly where it was.** Their existing home determines what happens to them.

That's real biology, it needs no teleology, and it makes the question in §2 answerable: follow the canopy webbed animals and watch the absurd experiment fail.

**Same ancestor, four zones, four completely different animals:** coastal → cetacean 29% / otter 26% / seal 21%; arboreal → glider 48% / primate 32%; grassland → armoured grazer 68% / runner 47%; underground → mole 81%.

None of that was authored. It's what the arithmetic produces.

---

## 7. Settled design decisions

**Non-negotiable:**

- Variation is never filtered by usefulness. Only by what a mammal body could plausibly vary. Webbed feet can appear in a canopy animal.
- Most variation is inconsequential and must remain so. No hidden costs added to neutral traits to make choices feel meaningful.
- Every meaningful trait has a trade-off or a place where it does nothing.
- The student never creates a mutation and never moves an animal.
- Following nothing is never punished. The world runs regardless; what they lose is what they *learn*.
- Extinction is history, not failure. No game over, no score, no retry prompt. The group fossilises, stays on the tree, and they pick up a relative.
- The interface shows observations, never verdicts. *"Animals with wider feet fell from branches more often"* — never *"wider feet were a bad adaptation."*
- Consequence, then the child's guess, then the explanation. Never the other way round.
- Forms are recognised by what the body can *do*, never by a checklist of parts. Several routes to each. No password.
- No AI runs during play. Explanations are written ahead of time and reviewed.
- All quantities shown to children are **counts** — "4 of 25." Not percentages, not averages. That's Grade 5 maths.

**Also settled:**

- Two-phase loop: real-time watch, paused decide. No timer in the decide phase.
- 12-second variation interval. Missing one costs nothing.
- Animals drawn **procedurally from the genome**, so when the trait distribution shifts the shapes on screen shift with it. This is the single highest-value visual decision.
- Teacher view: yes. Peer view: no — the other groups in the world already do that job and they're designed.
- Local storage primary; the room API is available for the teacher view.
- Lineage never marked by colour alone.

---

## 8. Where the build is

Nothing shipped. A Python biology kernel exists and has been tuned. A detailed implementation brief exists for the first milestone, which builds the world model — zones, heritable habitat use, genealogy, observer tracking that provably doesn't touch biology — and proves the one experiment: *the same webbing variation can appear in a canopy animal and a shoreline animal, and the two have different fates because they already live in different places.*

**Milestone 1 produces no game.** It ends at a debug canvas and a passing test suite. That's intentional — it's the architecture that can't be retrofitted. The game starts at Milestone 2.

---

## 9. Open questions

- **The reading basket.** Genre range and the cross-biome connection. Genuinely unstarted.
- **Session length.** How many rounds fit in a class period? Unknown until children play it.
- **Whether the canopy experiment is playable.** The fixture proves webbed canopy animals do badly. It doesn't say whether they last long enough for a child to learn something before the group ends.
- **Does it connect to Zoo Architects?** It could. It doesn't have to. Leaning toward not — Atlantis is a different fiction with a different job.
- **Explanation tone.** Needs writing and testing with real kids.

---

## 10. How to work on this

**What caused the drift.** Two AIs auditing each other produced genuinely valuable corrections — the neutral-trait finding, the null result, the spatial fix, three real bugs. But the loop had no stopping condition, and each round added rules. Twelve design laws became twenty. The specification kept improving while the game stopped being discussed.

**So:**

- **Read §2 before proposing anything.** If a proposal makes the engineering more correct and the game less like §2, it's wrong.
- **Don't re-litigate §5.** Those arguments are closed.
- **Distinguish three things and never merge them:** an *acceptance law* is a rule the model must obey; a *measured result* is what an implementation produced; a *regression target* is a measured result that has been independently accepted. Measuring an implementation accurately does not make it correct.
- **Architecture early, tuning late.** Things that can't be retrofitted go first. Everything else waits.
- **Run the numbers instead of arguing.** Most disputes here were settled by running the simulation ten thousand times overnight, not by reasoning. The only question that needs actual children is: *can four eight-year-olds watch this, notice what changed, and say why?*

**The test for any decision:**

> Would a Grade 3 student choose to open this a second time, and would they be able to tell me what happened to their animals and why?

If yes, keep going. If no, it doesn't matter how correct it is.