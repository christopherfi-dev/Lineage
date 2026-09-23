# LINEAGE — Milestone 1 World-Model Contract v3.3
## Fresh Claude Code Implementation Authority

This is the binding implementation contract for **Milestone 1 only**.

Milestone 1 proves the biological and observer architecture required by the product. It does not build the complete student game.

The defining experiment is:

> **The same inherited toe-webbing variation exists in a canopy-heavy group and a shoreline-heavy group. The canopy carriers and shoreline carriers experience different consequences because of where they already spend their time. The observer may follow either group, but the observer action cannot change the biological world.**

Do not broaden this milestone.

---

# 1. Inputs and authority

Read these files before implementation:

1. `LINEAGE_M1_WORLD_MODEL_CONTRACT_v3_3.md`
2. `LINEAGE_PRODUCT_NORTH_STAR.md`
3. `reference/biology.py`
4. `reference/engine.py`
5. `reference/analyze.py`

Authority order:

1. **This contract** for Milestone 1 implementation.
2. **The Product North Star** for product purpose and non-negotiable design intent.
3. **The Python files** only as evidence of earlier numerical lessons and known failure modes.

Do not read or reconcile `LINEAGE Implementation Brief v2.2` during this implementation session. It is superseded as an implementation authority.

The Python reference files are not product code and are not biologically validated. Copy them unchanged into `reference/`. Do not port their known defects:

- observer/tracker state affecting mate selection;
- observer selection consuming simulation RNG;
- silent lineage reseeding;
- mutations applied to already-living organisms;
- one global environment rather than simultaneous zones;
- incorrect midpoint approximation for survival effects;
- statistics from the old kernel treated as product targets.

No percentage or outcome measured from the Python kernel is an acceptance target for this milestone.

---

# 2. Milestone boundary

## Implement

- deterministic biological simulation in plain JavaScript;
- three simultaneous zones;
- an explicit overlapping-generation lifecycle;
- immutable-at-birth body genomes;
- immutable-at-birth heritable time allocation;
- birth-only inheritance drift and mutation;
- ten body traits exactly;
- explicit trait-to-performance mapping;
- zone-specific fitness, logistic survival, and density consequences;
- mating derived only from time-allocation overlap;
- parentage, birth, mutation, death, and mating records;
- compact rolling genealogy retained for at least 360 generations;
- independent observer lineage-tracer channels;
- current debug-only zone bins;
- exact canonical biological serialization;
- matched fixture tests;
- observer-invariance tests;
- separate body/allocation mutation-event counters and exact allocation-mutation opportunity tests;
- mutation-provenance and spatial-integrity tests;
- predeclared batch characterization;
- a crude static Canvas 2D probe;
- documentation and a final implementation report.

## Do not implement

- the watch/flag/decide game loop;
- twelve-second surfaced variation cards;
- final inspection UI;
- prediction or journal screens;
- polished procedural animal art;
- sound;
- forms or collection;
- explanations;
- myths;
- teacher dashboard;
- room/server persistence;
- service worker or offline packaging;
- React or another UI framework;
- persistent display-cluster identities;
- cluster split/merge history;
- divergence-panel claims;
- final cohort-ending rules;
- inferred reproductive isolation;
- all eventual zones or the full trait pool.

Persistent group identity is deliberately deferred. The biological records created here must make it possible later without rewriting the biological kernel.

---

# 3. Technical stack

Freeze the Milestone 1 stack:

| Area | Requirement |
|---|---|
| Language | JavaScript ES2023 modules with JSDoc types |
| Runtime dependencies | None |
| Tests | Node built-in `node:test` and `node:assert` |
| Browser probe | Static HTML, plain CSS, Canvas 2D, native ES modules |
| Dev server | Minimal local Node static server in `tools/serve.mjs` |
| Randomness | Explicit serializable seeded PRNG; never `Math.random()` |
| Build | No framework build required; source runs as native modules |
| Primary product target | Safari on A14-class or newer school iPad |
| Development target | Current desktop Chrome or Safari |

Do not introduce React, Vite, Tailwind, TypeScript compilation, a component library, a physics engine, or a simulation package.

Milestone 2 may choose a broader application stack. The simulation core built here must remain framework-independent and importable into that later application.

---

# 4. Two truths that must coexist

1. **Same seed + same starting biological state + different observer actions = byte-identical biological state after every generation.**
2. **Different existing groups can have different fates because they occupy different zones and carry different traits.**

Observer actions may create or update observer-side tracer channels. They may not:

- consume `simRng`;
- change an individual genome;
- change time allocation;
- change survival probability or draw;
- change mate eligibility or weighting;
- change parent choice;
- change offspring count;
- change mutation probability, trait choice, direction, or magnitude;
- change density;
- change a biological event record;
- change the order of biological arrays or IDs;
- advance or rewind biological time.

Any violation is a Milestone 1 failure.

---

# 5. Terminology and state boundaries

Do not use `lineage`, `branch`, `cohort`, `cluster`, `population`, and `zone` interchangeably.

## 5.1 Biological individual

A living organism in the simulation.

Required fields:

```js
{
  id,
  parentIds: null | [parentAId, parentBId],
  birthGeneration,
  ageGenerations,
  bodyGenome,       // Float64Array length 10
  timeAllocation,   // Float64Array length 3; sums to 1
  birthEventId
}
```

Body genome and time allocation are immutable after birth.

Age changes. Alive/dead membership changes. The inherited values do not.

No observer field is stored on a biological individual.

## 5.2 Biological state

Canonical state includes:

```js
{
  schemaVersion,
  configVersion,
  generation,
  nextIndividualId,
  nextBirthEventId,
  nextMatingEventId,
  nextMutationEventId,             // body-mutation event namespace only
  nextAllocationMutationEventId,   // allocation-mutation event namespace only
  currentIndividuals,
  retainedGenealogy,
  birthEvents,
  deathEvents,
  biologicalMatingEvents,
  bodyMutationEvents,
  allocationMutationEvents,
  prunedAncestorBoundaries,
  simRngState
}
```

## 5.3 Observer state

Observer state is a separate root object and is excluded from canonical biological serialization.

It may contain:

- tracer channels;
- selected founder IDs;
- provisional active-tracer choice;
- current debug selections;
- inspected individual IDs;
- Canvas camera state;
- UI random state.

## 5.4 Current zone bin

A debug-only grouping derived independently each frame or generation from `argmax(timeAllocation)`.

Use deterministic tie-breaking in zone order:

```text
canopy, forest_floor, shoreline
```

A current zone bin:

- has no persistent identity;
- is not a biological group;
- is not evidence of a split;
- is not used for mating, survival, reproduction, or mutation;
- is not used to declare that a followed cohort ended;
- is not stored in canonical biological state.

## 5.5 Genealogy

Actual parentage and birth records.

Genealogy answers who descended from whom. It does not create one exact “split point” while mating continues.

## 5.6 Observer lineage tracer

An independent founder-contribution channel created when an observer selects an existing set of animals.

A tracer records observer history. It is not a deme, species, biological lineage variable, or mating category.

---

# 6. World and zones

Milestone 1 contains exactly three simultaneous zones:

```text
canopy <-> forest_floor <-> shoreline
```

There is no canopy-to-shoreline edge.

Zone order is canonical:

```js
const ZONES = ["canopy", "forest_floor", "shoreline"];
```

Each zone has:

- a performance-weight vector;
- a carrying capacity;
- a simple Canvas region;
- a stable identifier.

Provisional capacities, fixed before characterization:

```js
{
  canopy: 90,
  forest_floor: 90,
  shoreline: 90
}
```

These are model controls, not ecological claims.

The environment does not inspect observer state.

---

# 7. Initial biological state

Default starting population: **120 animals**.

Create three equal starting allocation bands:

- 40 canopy-heavy;
- 40 forest-floor-heavy;
- 40 shoreline-heavy.

Use these exact centroids:

```js
canopyHeavy      = [0.985, 0.014, 0.001]
forestFloorHeavy = [0.010, 0.980, 0.010]
shorelineHeavy   = [0.001, 0.014, 0.985]
```

Milestone 1 applies **no initialization noise to founder time allocation**. Every founder in a starting band receives that band’s exact centroid. Allocation variation begins only through child inheritance and child-only allocation mutation.

With `parentalUseEpsilon = 0.02`:

- canopy-heavy founders use only `canopy`; their children may gain `forest_floor`, never `shoreline` directly;
- shoreline-heavy founders use only `shoreline`; their children may gain `forest_floor`, never `canopy` directly;
- forest-floor-heavy founders use only `forest_floor`; their children may gain either adjacent edge zone.

The exact centroids and threshold must be tested together. Do not add founder-allocation noise unless a later contract changes both the initialization law and its adjacency tests.

Initialize body genomes from one shared ancestor vector plus small seeded variation. The ancestor vector and initialization spread live in versioned configuration.

Initial differences are standing variation, not recorded as mutation events.

All founders:

- have `parentIds = null`;
- have `birthGeneration = 0`;
- have `ageGenerations` sampled deterministically from `[0, 1, 2]` with a documented distribution;
- receive birth events marked `founder: true`.

The initial state must already contain all three zones. Milestone 1 does not depend on evolving from canopy to shoreline before the defining experiment can occur.

Allocation mutation must nevertheless make gradual travel across the adjacency graph possible in later generations.

---

# 8. Body traits: exactly ten

Canonical trait order:

## Meaningful

1. `toe_webbing`
2. `curved_claws`
3. `dense_fur`
4. `long_hindlimbs`
5. `strong_tail`
6. `large_eyes`
7. `streamlined_body`

## Inconsequential

8. `coat_shade`
9. `ear_tip_shape`
10. `tail_tip_marking`

Each value is a continuous number in `[0,1]`.

The three inconsequential traits:

- are inherited;
- receive drift and mutation through the same birth mechanisms;
- may become visually detectable in the Canvas probe;
- contribute exactly zero to all performance dimensions;
- contribute exactly zero to upkeep;
- do not affect survival, mating, reproduction, mutation, time allocation, or Canvas location;
- must not receive hidden costs.

Do not add an eleventh trait.

Do not describe this as the final product trait pool.

---

# 9. Functional performance layer

Do not implement a primary `trait × zone = outcome` table.

Use an explicit body-trait-to-performance layer followed by zone weighting.

Canonical performance dimensions:

```js
[
  "canopy_grip",
  "land_mobility",
  "aquatic_propulsion",
  "aquatic_drag_reduction",
  "thermal_retention",
  "visual_sensing",
  "energy_efficiency"
]
```

Trait effects live in versioned configuration.

The model must preserve these authored relations:

- `toe_webbing` increases aquatic propulsion and reduces precise canopy grip;
- `curved_claws` increase canopy grip and carry an energy or non-canopy locomotor cost;
- `dense_fur` increases thermal retention and increases aquatic drag or warm-zone cost;
- `long_hindlimbs` increase land movement or leaping and increase aquatic drag;
- `strong_tail` may improve aquatic propulsion or control but carries upkeep or land-control cost;
- `large_eyes` improve useful visual sensing where visibility exists and carry upkeep;
- `streamlined_body` reduces aquatic drag and reduces some climbing or tight-turning performance;
- neutral traits contribute all zeros.

These relations are model assumptions. Do not label the model biologically validated.

The deterministic meaningful-trait gate uses one frozen probe context. Claude Code must not choose or substitute a more favorable genome, allocation, load, or age.

```js
standardTraitTestGenome = [
  0.15, // toe_webbing
  0.45, // curved_claws
  0.40, // dense_fur
  0.45, // long_hindlimbs
  0.40, // strong_tail
  0.40, // large_eyes
  0.35, // streamlined_body
  0.50, // coat_shade
  0.50, // ear_tip_shape
  0.50  // tail_tip_marking
]

standardTraitTestZoneLoads = [39.84, 40.32, 39.84]
standardTraitTestAllocations = {
  canopy:      [1.0, 0.0, 0.0],
  forestFloor: [0.0, 1.0, 0.0],
  shoreline:   [0.0, 0.0, 1.0]
}
standardTraitTestAgeGenerations = 1
standardTraitTestAgeMultiplier = 1.0
traitTestLowValue = 0.2
traitTestHighValue = 0.8
meaningfulBenefitFloor = 0.01
meaningfulCostFloor = 0.01
neutralEquivalenceMargin = 0.001
traitGateArithmeticTolerance = 1e-12
```

The standard genome and loads above must exactly equal `baselineBodyGenome` and `standardZoneLoads` in `fixtures/defining_fixture_v1.json`; the fixture loader must assert that equality.

For each meaningful trait independently:

1. clone `standardTraitTestGenome` into a low genome and a high genome;
2. set only the tested trait to `0.2` in the low genome and `0.8` in the high genome;
3. for each zone, run the production survival pipeline with that zone's exact one-hot allocation, the fixed standard loads, age `1`, and the versioned Milestone 1 configuration;
4. calculate `delta[z] = pSurvivalHigh[z] - pSurvivalLow[z]`.

The trait passes only when both are true in **different zones**:

1. **Positive context:** `delta[z] >= 0.01 - 1e-12` in at least one zone.
2. **Limited or adverse context:** in at least one different zone, either `delta[z] <= -0.01 + 1e-12` or `abs(delta[z]) <= 0.001 + 1e-12`.

A trait that is harmful in all three zones fails. A trait that improves survival in all three zones fails. Toe webbing must additionally satisfy the stronger defining-fixture floor in §19.

Implement this as the build-blocking automated test `test/meaningful-trait-context.test.js`. The test must emit the three exact deltas for every meaningful trait. These floors are authored product gates, not biological estimates, and may not be weakened after results are seen.

---

# 10. Zone-specific survival

Do not average fitness and capacity first and then apply one nonlinear function.

For each generation, calculate zone loads from the current living population before survival:

```js
zoneLoad[z] = sum(individual.timeAllocation[z])
```

For each individual and each zone:

1. calculate performance dimensions from the body genome;
2. apply zone weights and zone-specific function switches;
3. subtract upkeep/energy cost;
4. calculate zone fitness;
5. convert zone fitness to logistic survival fitness;
6. apply that zone’s density factor.

Use:

```js
pFitZone[z] = 1 / (1 + exp(-selectionSlope * (fitnessZone[z] - fitnessZero[z])))

densityFactor[z] =
  2 * zoneCapacity[z] / (zoneCapacity[z] + zoneLoad[z])

pZone[z] = clamp(
  pFitZone[z] * densityFactor[z],
  minZoneSurvival,
  maxZoneSurvival
)
```

Then combine consequences by inherited time allocation:

```js
pEcological = sum_z(timeAllocation[z] * pZone[z])
```

Apply the age multiplier after ecological weighting:

```js
pSurvival = clamp(
  pEcological * ageSurvivalMultiplier[ageGenerations],
  minIndividualSurvival,
  maxIndividualSurvival
)
```

Provisional lifecycle values:

```js
minZoneSurvival = 0.01
maxZoneSurvival = 0.95
minIndividualSurvival = 0.0
maxIndividualSurvival = 0.95
ageSurvivalMultiplier = [1.0, 1.0, 1.0, 0.95, 0.80, 0.50, 0.0]
```

An animal at age 6 cannot survive the next generation.

Do not pre-clamp fitness before the logistic function.

The exact selection coefficients and fitness-zero values are provisional tuning constants. Record every change in `DECISIONS.md` before rerunning characterization.

---

# 11. Frozen lifecycle

Milestone 1 uses discrete biological generations with overlapping ages.

The order is binding.

## Generation-field semantics

A call that advances a state from generation `g` performs the transition **into generation `g + 1`**. Define:

```js
sourceGeneration = g
targetGeneration = g + 1
```

Every biological event created during that transition uses `generation = targetGeneration`:

- every `DeathEvent.generation`;
- every `BiologicalMatingEvent.generation`;
- every non-founder `BirthEvent.generation`;
- every newborn child's `birthGeneration`;
- every body-mutation event generation;
- every allocation-mutation event generation.

Founder individuals and founder birth events are generation `0`. The state generation remains `g` while snapshot, survival, mating, child creation, and event assembly execute; after the next population and all target-generation events are complete, set `state.generation = targetGeneration` exactly once.

Therefore, advancing the generation-zero lifecycle fixture once must create deaths, mating, births, and mutations at generation `1`, and newborn children must have `birthGeneration = 1`.

## Step 1 — snapshot

At generation `g`, freeze the ordered list of current living IDs and compute zone loads.

## Step 2 — survival probabilities

Calculate each current individual’s survival probability from the pre-survival snapshot.

## Step 3 — survival draws

Consume exactly one `simRng` uniform draw per current individual in ascending ID order.

Individuals with successful draws survive. Age-6 animals have survival probability zero.

Create a `DeathEvent` for every individual removed.

## Step 4 — age survivors

Increment each survivor’s `ageGenerations` by one.

## Step 5 — mate eligibility

Eligible parents are survivors with:

```text
1 <= ageGenerations <= 5
```

No self-mating.

No biological sex model is used in Milestone 1. Any two distinct eligible individuals may pair.

## Step 6 — deterministic candidate order

Create one seeded Fisher–Yates shuffle of eligible parent IDs using `simRng`.

Each individual may belong to at most one mating pair in one generation.

## Step 7 — mate selection

Iterate through the shuffled unpaired list.

For parent A, candidate parent B must:

- be distinct;
- remain unpaired;
- have strictly positive time-allocation overlap.

Weight candidates only by:

```js
overlap = dot(A.timeAllocation, B.timeAllocation)
weight = overlap ** matingOverlapExponent
```

Provisional:

```js
matingOverlapExponent = 2
minimumMatingOverlap = 0.02
```

Candidates below `minimumMatingOverlap` are ineligible.

Normalize positive weights and consume one `simRng` draw to select B.

If no valid B exists, A remains unpaired for that generation.

No observer state, trait value, zone-bin label, or display state may enter mate selection.

## Step 8 — offspring count

Each formed pair produces exactly **two children** in Milestone 1.

This value is provisional but the algorithm is fixed. Changing it requires a recorded decision before characterization.

## Step 9 — child creation

For each pair, create children in pair order and child index order.

For each child, the order is binding:

1. create the inherited body genome from both parents;
2. execute exactly one body-mutation opportunity and apply any resulting child-only body mutation;
3. create inherited time allocation from both parents;
4. execute exactly one allocation-mutation opportunity and apply any resulting child-only allocation mutation;
5. attach the final immutable birth allocation to any body-mutation audit record;
6. create biological event records without suppressing or discarding a mutation because of allocation, zone, or observer state;
7. assign IDs monotonically;
8. set `ageGenerations = 0`.

Body inheritance and the body-mutation opportunity occur before any allocation-related random draw. Therefore identical parental body genomes and identical starting `simRng` state must produce identical child body genomes and body-mutation decisions even when parental allocations differ.

## Step 10 — next population

The next population is:

```text
aged survivors + newborn children
```

Sort by ascending individual ID for canonical storage.

Increment the generation.

## Extinction

If no living individuals remain, the biological world is extinct.

Do not reseed or silently create unrelated animals.

The debug probe may show the historical state and an extinction diagnostic. It does not restart automatically.

---

# 12. Body-genome inheritance and mutation

## 12.1 Mutation-event ID namespaces

Milestone 1 uses **two separate biological event-ID namespaces**:

```js
nextMutationEventId            // bodyMutationEvents only
nextAllocationMutationEventId  // allocationMutationEvents only
```

Rules:

- every recorded body-mutation event consumes the current `nextMutationEventId`, then increments that counter by exactly one;
- every recorded allocation-mutation event consumes the current `nextAllocationMutationEventId`, then increments that counter by exactly one;
- a failed mutation opportunity creates no event and does not increment its event counter;
- IDs must be unique and strictly increasing within their own event array;
- body-mutation IDs and allocation-mutation IDs may have the same numeric value because they are different typed namespaces;
- no global uniqueness across the two mutation-event arrays is required or implied;
- both counters are canonical biological state, are hydrated from the frozen fixture, and are included in canonical serialization.

The fixture fields `nextMutationEventId` and `nextAllocationMutationEventId` are both active biological counters. Neither is deprecated or envelope-only metadata.

An individual’s body genome is immutable after birth.

For each trait `t`:

```js
parentMean = (parentA[t] + parentB[t]) / 2

drift = normal(0, 1)
  * bodyDriftScale
  * 2
  * sqrt(parentMean * (1 - parentMean))

preMutation = clamp(parentMean + drift, 0, 1)
```

Provisional:

```js
bodyDriftScale = 0.08
bodyMutationProbabilityPerChild = 0.20
bodyMutationMagnitudeMin = 0.12
bodyMutationMagnitudeMax = 0.35
```

After inheritance drift, perform at most one conspicuous body mutation per child:

1. draw whether a mutation occurs;
2. choose one of the ten traits uniformly;
3. choose direction `-1` or `+1` with equal probability;
4. draw magnitude uniformly within the configured range;
5. clamp to `[0,1]`;
6. record the event even if clamping reduces the realized magnitude.

The mutation function must not receive zone, environment, observer, current zone bin, fitness, or usefulness as an argument.

Required record. When this event is recorded, `id` is assigned from `nextMutationEventId` under §12.1:

```js
{
  id: mutationEventId,
  generation,
  childId,
  birthEventId,
  parentIds,
  traitId,
  preMutationValue,
  requestedDelta,
  postMutationValue,
  childTimeAllocationAtBirth
}
```

`childTimeAllocationAtBirth` is the child's final immutable allocation after allocation inheritance and any allocation mutation have completed. The body-mutation function returns a draft event without receiving allocation; the event assembler attaches this final allocation afterward for auditing. It must not influence whether the body mutation occurs or which trait, direction, or magnitude is chosen.

No mutation is ever applied to a survivor or other already-existing individual.

No environment-triggered mutation exists.

---

# 13. Time-allocation inheritance and mutation

Time allocation is immutable after birth.

For a child:

```js
parentMean[z] = (parentAAllocation[z] + parentBAllocation[z]) / 2
```

Define the parental-use set as zones where either parent has share greater than or equal to:

```js
parentalUseEpsilon = 0.02
```

Eligible zones are:

- every parental-use zone;
- every graph neighbour of a parental-use zone.

Apply continuous drift only within the eligible mask:

```js
drift[z] = normal(0, 1)
  * allocationDriftScale
  * 2
  * sqrt(parentMean[z] * (1 - parentMean[z]))
```

Provisional:

```js
allocationDriftScale = 0.05
allocationMutationProbabilityPerChild = 0.08
allocationMutationTransferMin = 0.03
allocationMutationTransferMax = 0.12
```

After drift:

1. set non-eligible zones to zero;
2. clamp eligible shares to `[0,1]`;
3. renormalize.

Then execute exactly one allocation-mutation **opportunity** per non-founder child using the following complete algorithm. Zone iteration and candidate-array order are always canonical:

```text
canopy, forest_floor, shoreline
```

### 13.1 Frozen allocation-mutation opportunity

Let `allocation` be the normalized post-drift child allocation and let `eligibleMask` be the already-computed parental-use-plus-neighbours mask. All uniform draws are from `[0,1)`.

1. **Occurrence draw — always consumed.** Consume exactly one uniform draw `uOccurrence`. A mutation proceeds only when:

   ```js
   uOccurrence < allocationMutationProbabilityPerChild
   ```

   Equality with the probability is a failure. If the opportunity fails, return the allocation unchanged, create no event, do not increment `nextAllocationMutationEventId`, and consume no additional allocation-mutation draws.

2. **Target candidates.** After a successful occurrence, build `lowShareTargets` from eligible zones whose current share is strictly less than `parentalUseEpsilon`, in canonical zone order. If that array is nonempty, it is the target-candidate array. Otherwise, the target-candidate array is every eligible zone in canonical zone order. An empty target-candidate array is a contract violation.

3. **Target draw — always consumed after a successful occurrence.** Consume exactly one uniform draw `uTarget`, even when there is only one candidate. Select uniformly:

   ```js
   targetIndex = min(floor(uTarget * targetCandidates.length), targetCandidates.length - 1)
   target = targetCandidates[targetIndex]
   ```

4. **Donor candidates.** Build donor candidates from eligible zones other than `target` whose current share is strictly greater than zero, in canonical zone order. Their weights are their current shares.

5. **Donor draw — always consumed after a successful occurrence.** Consume exactly one uniform draw `uDonor`, even when there is zero or one donor candidate. If donor candidates exist, select by weighted cumulative share in canonical order. Let:

   ```js
   threshold = uDonor * sum(donorWeights)
   ```

   Choose the first candidate whose cumulative weight is strictly greater than `threshold`; because `uDonor < 1`, the final candidate is selected if no earlier cumulative weight exceeds it.

6. **Transfer draw — always consumed after a successful occurrence.** Consume exactly one uniform draw `uTransfer` and calculate:

   ```js
   requestedTransfer = allocationMutationTransferMin
     + uTransfer * (allocationMutationTransferMax - allocationMutationTransferMin)
   ```

7. **No-donor branch.** If no donor candidate exists, leave allocation unchanged, create no event, do not increment `nextAllocationMutationEventId`, and return after the four total draws for this successful occurrence path have been consumed.

8. **Apply transfer.** For the selected donor:

   ```js
   realizedTransfer = min(requestedTransfer, allocation[donor])
   ```

   If `realizedTransfer <= 0`, leave allocation unchanged, create no event, do not increment `nextAllocationMutationEventId`, and return. A zero-realized transfer is never recorded.

9. Subtract `realizedTransfer` from the donor and add it to the target. Clamp numerical residue to `[0,1]`, renormalize, and preserve canonical zone order.

10. **Record and increment.** Create exactly one allocation-mutation event with `id = nextAllocationMutationEventId`, then increment `nextAllocationMutationEventId` by exactly one.

Therefore:

- a failed occurrence consumes exactly **one** allocation-mutation uniform draw;
- a successful occurrence consumes exactly **four** allocation-mutation uniform draws whether or not a donor exists;
- candidate count never changes the number of draws;
- failed and zero-realized opportunities create no event and consume no event ID.

A canopy-only parent pair may create small forest-floor use. It cannot create shoreline use unless forest-floor use already meets the parental-use threshold in at least one parent.

A forest-floor-using pair may create shoreline use.

Morphology never changes this process.

Required allocation-mutation record. When this event is recorded, `id` is assigned from `nextAllocationMutationEventId` under §12.1 and §13.1:

```js
{
  id: allocationMutationEventId,
  generation,
  childId,
  birthEventId,
  parentIds,
  fromZone,
  toZone,
  requestedTransfer,
  realizedTransfer,
  preMutationAllocation,
  postMutationAllocation
}
```

## Zero-vector fallback

If masking, clamping, or mutation yields a zero-sum vector:

1. restore the masked parental mean;
2. renormalize;
3. if that is still zero, use a one-hot allocation at the first parent’s dominant zone;
4. emit a diagnostic counter;
5. fail the spatial-integrity test if this fallback occurs during normal configured runs.

---

# 14. Biological events

## 14.1 Birth event

```js
{
  id,
  generation,
  childId,
  parentIds: null | [parentAId, parentBId],
  founder: boolean
}
```

## 14.2 Death event

```js
{
  generation,
  individualId,
  ageGenerations,
  survivalProbability,
  survivalDraw,
  cause: "stochastic_survival" | "maximum_age"
}
```

The cause is an engine category, not a scientific claim about a specific physical cause of death.

## 14.3 Biological mating event

Included in canonical biological state:

```js
{
  id,
  generation,
  parentAId,
  parentBId,
  overlap,
  childIds
}
```

No display-cluster or observer field may appear in this record.

## 14.4 Derived mating annotation

Optional debug output, excluded from canonical biological state:

```js
{
  biologicalMatingEventId,
  parentACurrentZoneBin,
  parentBCurrentZoneBin,
  annotationModelVersion
}
```

This annotation is produced after the biological event exists.

Milestone 1 does not use it to declare separation or persistent gene flow.

---

# 15. Genealogy and retention

Retain complete parentage and biological event records for **exactly the most recent 360 biological generations**, plus the minimum explicit boundary records required to resolve retained references.

At the end of generation `G`, the retained complete-event window is:

```js
firstRetainedGeneration = Math.max(0, G - 359)
```

Complete records with `generation < firstRetainedGeneration` must be pruned unless the record belongs to a currently living individual. Current living individuals always remain canonical; under the frozen lifecycle their ages do not approach the 360-generation boundary.

Use compact arrays, maps, or ring-buffer indexes. Do not use recursively nested descendant objects or unlimited append-only history.

When records cross the retention boundary:

- current individuals remain fully resolvable;
- retained children whose parent lies outside the window point to an explicit `PrunedAncestorBoundary` record;
- no dangling parent ID is permitted;
- pruning order is deterministic;
- observer choices cannot affect pruning.

Required boundary record:

```js
{
  boundaryId,
  originalIndividualId,
  lastRetainedGeneration,
  reason: "genealogy_retention_boundary"
}
```

Genealogy and mating cores are biological state and must remain byte-identical across observer strategies.

---

# 16. Observer lineage tracers

Tracer channels exist outside biological state.

When the observer creates tracer channel `k` at generation `g` from founder IDs:

```js
tracer[k][founderId] = 1
tracer[k][allOtherCurrentIds] = 0
```

For every later child:

```js
tracer[k][childId] =
  (tracer[k][parentAId] + tracer[k][parentBId]) / 2
```

Survivors keep their existing tracer values.

Rules:

- every channel is independent;
- channels do not sum or normalize against one another;
- channels may overlap;
- values remain in `[0,1]`;
- founder selection may be retroactively applied only to observer state for animals already alive;
- tracer propagation occurs after biological child creation from already-fixed parent IDs;
- tracer creation and propagation consume no `simRng` draws;
- deleting, hiding, or switching observer channels does not affect biology.

For the Canvas probe only, a provisional display may use:

```text
tracer >= 0.5: focal marker
0 < tracer < 0.5: mixed-relative debug value
tracer == 0: no retained contribution from that channel
```

The `0.5` threshold is not a biological truth and is not a final cohort-ending rule.

Do not implement “group ended” logic in Milestone 1.

---

# 17. Random-number architecture

Use two independent RNG roots:

- `simRng` — all and only biological randomness;
- `uiRng` — Canvas jitter or future interface randomness.

Use a serializable PRNG with explicit state, such as `xoshiro128**` with four `uint32` words.

Implement normal draws with Box–Muller or another deterministic method. If a spare normal value is cached, that cached value and flag are part of `simRngState`.

Rules:

- never call `Math.random()`;
- never share RNG objects between simulation and observer code;
- no observer function receives `simRng`;
- no Canvas function receives `simRng`;
- cloning a biological state clones the exact RNG state;
- canonical serialization includes all simulation RNG state needed to reproduce the next draw.

---

# 18. Canonical biological serialization

Implement one function:

```js
serializeCanonicalBiology(state) -> string | Uint8Array
```

It must include:

- schema and config versions;
- generation;
- all next-ID counters;
- current individuals sorted by ID;
- exact body-genome values;
- exact time-allocation values;
- ages and parent IDs;
- retained genealogy and boundary records;
- birth, death, mutation, allocation-mutation, and biological mating events in canonical order;
- complete `simRng` state.

It must exclude:

- observer state;
- tracer channels;
- current zone bins;
- derived mating annotations;
- Canvas state;
- inspected or selected IDs;
- `uiRng` state;
- debug timestamps;
- runtime performance measurements.

Do not compare floating-point state with a tolerance for the observer-invariance test.

Encode floating values canonically using either:

- exact IEEE-754 64-bit bit patterns; or
- stable 17-significant-digit decimal strings.

The same in-memory biological state must always produce exactly the same bytes.

---

# 19. Fixture: the defining experiment

The defining fixture is frozen in the starter artifact:

```text
fixtures/defining_fixture_v1.json
```

Claude Code must not invent, regenerate, or tune the fixture population. Load the checked-in JSON and validate it before use. Implement `src/fixtures/definingFixtureV1.js` as a loader/validator, not as a second competing fixture definition.

The fixture file is a **fixture envelope**, not a canonical biological-state serialization. It contains biological generation-zero data plus experiment metadata. Do not require `serializeCanonicalBiology()` to reproduce this metadata-bearing file.

Four separate requirements are binding:

### A. Raw artifact integrity

Before parsing, calculate SHA-256 over the exact checked-in file bytes. It must equal:

```text
c80aaa523d3b3eec2655502b4eaebdbbb4d12f71f8b3378d9d3be60797342b78
```

Any byte change fails the fixture-integrity test.

### B. Fixture-envelope round trip

Implement a separate function:

```js
serializeCanonicalFixtureEnvelope(envelope) -> string | Uint8Array
```

It includes every fixture-envelope field, including metadata, recursively sorts object keys, preserves array order, and uses the same canonical floating-number rule as §18. Parsing the checked-in file, serializing this canonical envelope, parsing it again, and canonical-serializing it again must produce byte-identical canonical envelope bytes. This is a semantic envelope round trip; it does not claim to reproduce the source file's whitespace.

### C. Deterministic hydration

Implement one named rule:

```js
hydrateDefiningFixtureV1(envelope, trajectorySeed) -> BiologicalState
```

Hydration must:

- set `schemaVersion = "lineage-biological-state-1"`;
- set `configVersion = currentModelConfig.version`; the initial value is `"lineage-m1-config-1"`, and any permitted tuning change must update it under §21.7 before rerunning the fixture;
- copy only the biological state fields and counters from the envelope, including both `nextMutationEventId` and `nextAllocationMutationEventId`;
- initialize complete `simRngState` only through the implementation's frozen `createSimRng(trajectorySeed)` constructor;
- exclude fixture-only metadata such as description, trait and zone labels, focal IDs, seed range, measurement generation, tie treatment, baseline genome, band allocations, and standard-load declarations from canonical biological state;
- produce byte-identical canonical biological state for repeated hydration of the same envelope and seed.

### D. Paired-world construction

For one trajectory seed, hydrate the baseline biological state once and clone its exact canonical biological bytes into the four fixture worlds. Apply only the declared twelve-value `toe_webbing` override to the relevant high-webbing clone before generation `1`. The low worlds remain unmodified clones. Tracer creation occurs afterward in observer state. No RNG state, counter, event array, age, allocation, parent field, or non-webbing value may differ within a paired comparison.

`test/defining-fixture-snapshot.test.js` must separately prove A, B, and C. `test/defining-fixture.test.js` must prove D and the experiment gates.

## 19.1 Frozen fixture state

The JSON contains the complete generation-zero biological population and founder birth records. Its load-bearing values are:

```js
fixtureSchemaVersion = "lineage-defining-fixture-1"
populationSize = 120
canopyIds = 1..40
forestFloorIds = 41..80
shorelineIds = 81..120
canopyFocalIds = 1..12
shorelineFocalIds = 81..92
lowWebbing = 0.15
highWebbing = 0.75
measurementGeneration = 90
trajectorySeeds = 1..200
```

All individuals share the fixture baseline body genome except when the specified focal IDs receive the high-webbing override. All ages, allocations, IDs, non-webbing traits, founder birth-event IDs, and non-focal animals are fixed in the JSON.

The fixed standard zone loads derived from the fixture are:

```js
standardZoneLoads = {
  canopy: 39.84,
  forest_floor: 40.32,
  shoreline: 39.84
}
```

The loader must recompute these loads and fail if any differs by more than `1e-12`.

## 19.2 Four fixture worlds

For each trajectory seed, derive four worlds from the same checked-in generation-zero state:

1. canopy low-webbing control: fixture unchanged;
2. canopy high-webbing: set `toe_webbing = 0.75` only for IDs `1..12`;
3. shoreline low-webbing control: fixture unchanged;
4. shoreline high-webbing: set `toe_webbing = 0.75` only for IDs `81..92`.

The high-webbing override is a fixture construction operation before generation 1. It is not a mutation event. No other byte of the biological starting state may differ within a paired comparison except the twelve specified toe-webbing values.

For observer measurement only, create one tracer at generation 0 from the corresponding twelve focal IDs. The tracer remains outside biological state.

## 19.3 Exact probability gate

Evaluate one standard age-1 individual using the fixture baseline genome, fixed standard zone loads, and these exact allocations:

```js
canopyProbabilityProbe = [0.90, 0.10, 0.00]
shorelineProbabilityProbe = [0.00, 0.10, 0.90]
```

Use `lowWebbing = 0.15` and `highWebbing = 0.75`, with every non-webbing trait fixed to the JSON baseline.

Required:

```text
P(survival | canopy probe, high webbing)
  <= P(survival | canopy probe, low webbing) - 0.03

P(survival | shoreline probe, high webbing)
  >= P(survival | shoreline probe, low webbing) + 0.03
```

The 0.03 absolute difference is a product-visibility floor, not a biological estimate. A strict equality at exactly `0.03` passes.

If both inequalities cannot hold while every meaningful trait satisfies §9 and the random-world population guardrails remain reachable, halt and report contract incompatibility.

## 19.4 Matched trajectory gate

Run seeds exactly `1..200` for exactly 90 completed generations unless the entire world becomes extinct earlier. Paired worlds for one seed begin with identical serialized PRNG state.

At generation 90, or at extinction if earlier, calculate:

```js
livingFounderContribution =
  sum over living individuals of tracerValue[individualId]
```

For each paired seed:

- shoreline success means `highContribution > lowContribution`;
- canopy success means `highContribution < lowContribution`;
- an exact tie is recorded separately and counts as **not successful** for the 65% gate.

Required:

- median shoreline-high contribution is strictly greater than median shoreline-low contribution;
- median canopy-high contribution is strictly less than median canopy-low contribution;
- at least 130 of 200 shoreline seeds are successful;
- at least 130 of 200 canopy seeds are successful.

Use the ordinary median of the 200 values: sort ascending and average positions 100 and 101 under one-based indexing. An equal median fails the directional gate.

Also report:

- tie count;
- focal-contribution extinction count;
- whole-world extinction count;
- total-population distributions;
- full paired difference distributions.

Do not freeze measured medians as future targets in the same implementation session.

## Observer independence within fixture

Run each fixture under these observer strategies:

- follow nothing;
- create a tracer from canopy high-webbing founders;
- create a tracer from shoreline high-webbing founders;
- create a tracer from high `coat_shade` founders;
- create and switch among multiple tracer channels.

Canonical biological serialization must match after every generation.

---

# 20. Required invariant tests

All invariant tests are build-blocking.

## 20.1 Birth immutability

For every individual, body genome and time allocation at every later retained generation must exactly equal its birth values.

Mutation events may reference only newborn child IDs created in the same generation.

## 20.2 Observer-state invariance

From one identical biological serialization and seed, run scheduled observer actions versus no observer actions.

Compare canonical biological bytes after every generation, including RNG state.

Any difference fails.

## 20.3 No observer dependencies in biology

Biological modules must not import observer modules.

Add an automated dependency-boundary test or static import scan.

## 20.4 Neutral-trait integrity

For each neutral trait:

- changing only that value must produce exactly identical performance dimensions;
- exactly identical zone fitness;
- exactly identical survival probabilities;
- exactly identical mating weights;
- exactly identical allocation inheritance;
- exactly identical mutation probabilities.

## 20.5 Meaningful-trait contextual gate

Run the exact deterministic probe defined in §9 for all seven meaningful traits. The mandatory `test/meaningful-trait-context.test.js` must:

- assert the fixture baseline genome and standard loads exactly match the frozen §9 values;
- use only the three exact one-hot zone allocations;
- use age `1` and age multiplier `1.0`;
- compare trait values `0.2` and `0.8` with all other traits fixed;
- calculate final production-path survival probabilities, not an isolated performance score;
- require one positive zone and one different adverse-or-inactive zone under the frozen floors and tolerance;
- emit the exact three-zone delta vector for each trait;
- fail if any meaningful trait is harmful everywhere or beneficial everywhere.

## 20.6 Full-path body-mutation independence

The body-mutation pure function must not accept allocation or zone arguments. The complete child-creation path must also preserve this separation.

Required integration test:

1. use identical parental body genomes and identical starting `simRng` state;
2. create one child from canopy-only parental allocations and one from shoreline-only parental allocations;
3. force or select an RNG state that produces a body mutation;
4. verify that inherited pre-mutation body genome, mutation occurrence, trait, direction, requested magnitude, realized post-mutation body genome, and body-mutation event draft are byte-identical;
5. verify that allocation inheritance may differ only after the body mutation is fixed;
6. verify exactly one body-mutation opportunity was executed for each birth;
7. verify every non-null body-mutation result was recorded and none was suppressed after allocation became known.

Across every normal run:

```js
bodyMutationOpportunityCount === nonFounderBirthCount
allocationMutationOpportunityCount === nonFounderBirthCount
```

The test fails if mutation invocation, acceptance, recording, or discard depends on allocation, zone, observer state, or usefulness.

## 20.7 Mutation provenance and counter ownership

Every mutation event:

- refers to one child born in the same generation;
- records pre- and post-values;
- is reconstructible from the child’s inheritance state plus event delta;
- never targets a survivor.

The mandatory provenance test must also prove the separate typed namespaces from §12.1:

- body-mutation event IDs are unique and strictly increasing within `bodyMutationEvents`;
- allocation-mutation event IDs are unique and strictly increasing within `allocationMutationEvents`;
- recording a body-mutation event increments only `nextMutationEventId`;
- recording an allocation-mutation event increments only `nextAllocationMutationEventId`;
- a failed opportunity increments neither corresponding event counter;
- numeric overlap between a body-mutation ID and an allocation-mutation ID is permitted and must not be reported as a collision;
- fixture hydration preserves both counters exactly;
- canonical biological serialization changes when either counter changes.

## 20.8 Allocation-mutation opportunity contract

Add mandatory `test/allocation-mutation-contract.test.js`. It must exercise the production allocation-mutation path with a scripted serializable RNG and prove the exact §13.1 semantics. At minimum it must cover:

1. **Failed occurrence:** `uOccurrence == allocationMutationProbabilityPerChild` fails; exactly one draw is consumed; no event is recorded; allocation and `nextAllocationMutationEventId` are unchanged.
2. **One low-share target:** the sole low-share eligible zone is selected even though the target draw is still consumed; the donor is selected from positive eligible alternatives; four total draws are consumed.
3. **Multiple low-share targets:** targets are ordered canonically and selected uniformly by the frozen `floor(uTarget * n)` rule.
4. **No low-share target:** all eligible zones become the canonical target-candidate array and are selected uniformly.
5. **Weighted donor selection:** donor candidates use positive current share as weight, canonical cumulative ordering, and the strict `cumulative > threshold` boundary.
6. **No valid donor:** all four successful-path draws are consumed; allocation is unchanged; no event is recorded; the allocation event counter is unchanged.
7. **Transfer application:** requested and realized transfer follow the frozen formula; exactly one event is recorded only for a positive realized transfer; only `nextAllocationMutationEventId` increments.
8. **Replay:** restoring the exact serialized RNG state before the opportunity reproduces target, donor, requested transfer, realized transfer, event bytes, resulting allocation, draw count, and next counter exactly.

The test must assert draw counts directly. It may not infer them only from final RNG inequality.

## 20.9 Spatial integrity and adjacency execution

For every current individual:

- all shares are finite;
- every share lies in `[0,1]`;
- the sum equals one within `1e-12`;
- no child receives allocation in a non-eligible non-neighbour zone;
- no morphology function writes to allocation;
- no observer function writes to allocation;
- the zero-vector fallback counter remains zero in normal configured batches.

Mandatory deterministic adjacency cases:

1. two exact canopy-heavy parents may allocate to `canopy` or `forest_floor`, but a forced mutation targeting `shoreline` must be rejected as ineligible;
2. two exact shoreline-heavy parents may allocate to `shoreline` or `forest_floor`, but a forced mutation targeting `canopy` must be rejected;
3. once at least one parent has `forest_floor >= parentalUseEpsilon`, the next child may target the opposite adjacent edge;
4. the checked-in founder centroids must produce parental-use sets of exactly `{canopy}`, `{forest_floor}`, and `{shoreline}` for their respective bands.

## 20.10 Lifecycle and mating contract

Add a deterministic integration fixture with three snapshot individuals: IDs `1` and `2` at age `0`, and ID `3` at age `6`. Use scripted RNG draws that keep IDs `1` and `2` alive and remove ID `3`. IDs `1` and `2` must age to `1`, form the only valid pair, and produce exactly children `4` and `5`.

The test must verify:

- exactly one survival draw occurs for each snapshot individual in ascending ID order;
- survival uses the pre-survival snapshot loads;
- survivors age before mate eligibility;
- age-6 ID `3` cannot survive or mate;
- no self-mating occurs;
- each parent belongs to at most one pair;
- the pair produces exactly two child IDs;
- next population IDs are exactly `[1, 2, 4, 5]`;
- starting from `state.generation = 0`, ID `3`'s death event, the mating event, both birth events, both children's `birthGeneration`, and any child mutation events all have `generation = 1`;
- the resulting state has `generation = 1` and no transition event has generation `0` or `2`;
- monotonic event and individual IDs match the frozen lifecycle;
- body- and allocation-mutation IDs use their separate counters and neither counter is consumed when its opportunity records no event;
- extinction creates no reseed path.

For every biological mating event in all runs:

- parents are distinct;
- both were alive and eligible;
- each parent appears in no more than one pair that generation;
- overlap meets the configured minimum;
- `childIds.length === 2`;
- child parent IDs match the event;
- no observer or zone-bin field exists in the event.

## 20.11 Genealogy integrity and forced retention boundary

- every retained parent ID resolves to an individual or explicit boundary record;
- IDs are never reused;
- birth generations precede child generations;
- no cycles exist;
- pruning is deterministic.

The required test must cross the boundary. Construct or run a deterministic 400-generation pedigree and prune at generation 400. Verify:

- complete records remain only for generations `41..400`;
- complete records for generations `0..40` are absent unless they represent a currently living individual;
- every retained reference to an older parent resolves through a `PrunedAncestorBoundary`;
- no unresolved original ID remains;
- a second prune produces byte-identical state;
- retained complete-event counts do not grow beyond the 360-generation window when the test advances farther;
- observer actions do not alter boundary creation or pruning bytes.

## 20.12 Exact survival-composition contract

Test the survival combiner independently with these exact inputs:

```js
fitnessZone = [0.0, 1.0, 0.0]
selectionSlope = 2.0
fitnessZero = [0.0, 0.0, 0.0]
zoneCapacity = [100.0, 10.0, 100.0]
zoneLoad = [50.0, 100.0, 0.0]
timeAllocation = [0.5, 0.5, 0.0]
minZoneSurvival = 0.01
maxZoneSurvival = 0.95
ageSurvivalMultiplier = 0.8
minIndividualSurvival = 0.0
maxIndividualSurvival = 0.95
```

The required result is:

```js
pZoneCanopy = 0.6666666666666666
pZoneForestFloor = 0.16014492326870589
pEcological = 0.41340579496768626
pSurvival = 0.33072463597414903
```

Compare within `1e-12`. The test must fail under aggregate-first fitness, load, or capacity composition. Age multiplication must occur after allocation weighting.

## 20.13 RNG integrity

- no production source file contains `Math.random`;
- UI actions do not change `simRngState`;
- cloned states produce identical subsequent draws;
- normal-draw cache state serializes correctly.

---

# 21. Predeclared characterization

Characterization describes the first implementation. It does not automatically define biological truth or future regression targets.

Write all constants and decision rules into `CHARACTERIZATION_PLAN.md` before running the batch.

## 21.1 Seed set

Use integer seeds `1..500` for the primary random-world batch.

Do not replace seeds after observing failures.

## 21.2 Duration

Run each seed for 180 generations unless the world becomes extinct.

## 21.3 Mutation-supply measures

Report separately by birth dominant-zone bin:

1. number of births;
2. body-mutation opportunities;
3. all body-mutation events;
4. positive `toe_webbing` mutation events;
5. positive webbing events crossing from below `0.20` to at least `0.35`;
6. surviving webbing carriers at ages 1, 2, and 3+;
7. final carrier prevalence.

Mutation generation is evaluated using events per birth, not final carriers.

Required minimal functionality:

- at least one positive webbing event occurs among canopy-dominant births across the batch;
- at least one occurs among shoreline-dominant births;
- the exact mutation-context-independence invariant passes.

Do not require equal final carrier prevalence across zones. Differential survival should make that unlikely.

## 21.4 Population guardrails

Across the 500-seed batch:

- whole-world extinction by generation 180 must be below 5%;
- median total living population at generation 180 must lie between 90 and 360;
- median effective load in each zone at generation 180 must be at least 15.

Define the concentration statistic exactly for every non-extinct seed `s` at generation 180:

```js
totalLoad_s = sum_z(zoneLoad_s[z])
concentration_s = max_z(zoneLoad_s[z] / totalLoad_s)
```

Sort all `concentration_s` values from non-extinct seeds and take the ordinary median: the middle value for an odd count, or the arithmetic mean of the two middle values for an even count.

Required:

```text
medianConcentration <= 0.80
```

Extinct seeds are excluded from this ratio because `totalLoad_s = 0`; they remain fully counted by the separate extinction guardrail. Report the number of included seeds, every seed-level concentration value, and the resulting median. Do not substitute per-zone medians, a seed selected by median population, or independently combined median zone shares.

These are broad product-operability guardrails, not ecological estimates.

## 21.5 Trait-effect characterization

For each meaningful trait and each zone:

- sample realistic genomes from the batch;
- calculate exact logistic survival difference at the actual baseline;
- report median and central 90% interval for changing the trait by a fixed delta without changing other traits;
- report where the trait is helpful, harmful, or effectively inactive.

Use exact logistic differences. Do not use the derivative at the midpoint.

For neutral traits, exact causal difference must be zero by invariant; do not infer neutrality from noisy correlations.

## 21.6 Lifecycle characterization

Report:

- births per generation;
- deaths per generation;
- age distribution;
- mating-pair count;
- unmatched eligible adults;
- mean and distribution of mating overlap;
- population by current zone bin;
- allocation-mutation frequency;
- frequency and time of adjacency traversal.

## 21.7 Inconclusive results

If a directional fixture or guardrail fails, report `FAIL`.

If a batch metric is too sparse to characterize, report `INCONCLUSIVE` and identify why.

Do not silently alter the metric after seeing results.

Changes to tuning constants require:

1. one-line rationale in `DECISIONS.md`;
2. updated config version;
3. full rerun of all invariants and characterization;
4. side-by-side results, with no claim that the newer result is automatically correct.

---

# 22. Crude Canvas probe

The Canvas probe exists to answer:

> Can a human see the biological difference the model claims to produce?

It is not the final game.

Implement:

- three clearly separated world regions;
- procedural animal marks derived from genome values;
- visible toe-webbing difference;
- visible curved-claw, fur, hindlimb, tail, eye, streamlining, and neutral-marking differences where practical;
- current living count by zone bin;
- generation counter;
- click-to-inspect debug panel;
- optional creation of observer tracer channels;
- one non-colour marker for focal tracer values above the provisional threshold;
- controls to pause, step one generation, run continuously, reset seed, and load the defining fixture;
- a toggle showing allocations and raw genome values for debugging.

Canvas position is sampled or laid out from time allocation using `uiRng` only. It never feeds back into biology.

Avoid stock data-table presentation in the main world. Debug details may use a compact developer panel.

## Desktop measurement

Record:

- viewport;
- device-pixel ratio;
- population count;
- median frame time;
- 95th-percentile frame time;
- maximum frame time after warm-up;
- memory growth across a 180-generation run.

## Required manual iPad gate

Claude Code cannot self-certify this physical-device gate. It must generate `IPAD_TEST_CHECKLIST.md` and leave final status as `PENDING_HUMAN_DEVICE_TEST` until a human supplies the measurements below.

### Test conditions

Use one representative A14-class or newer iPad in current Safari, in landscape orientation, at the browser's default zoom. Record the exact device model, iPadOS version, Safari version, viewport, and device-pixel ratio.

The Canvas probe must provide two deterministic manual-test modes:

1. **Legibility mode:** the defining fixture with all three zones visible and a randomized ten-pair high-versus-low webbing identification check. The pair order uses `uiRng` with fixed manual-test seed `32001` and must not touch biological state.
2. **Render-stress mode:** exactly 360 simultaneously visible procedural animal glyphs distributed across the three Canvas regions. This is a rendering benchmark only and does not alter the biological acceptance model.

After a 30-second warm-up, collect frame intervals for at least 180 continuous seconds in render-stress mode. Instrument pause, single-step, continuous-run toggle, fixture reset, and mode-switch controls so input-to-next-paint latency can be recorded.

### Required evidence

Record:

- median and 95th-percentile frame time;
- whether any tab reload, crash, blank Canvas, unrecoverable input failure, or Safari-specific rendering failure occurred;
- 95th-percentile input-to-next-paint latency across at least 20 control actions;
- whether each of the three zone regions and its animal occupancy is distinguishable at default zoom without opening the inspector;
- the score on ten randomized high-versus-low webbing pairs without raw trait values.

### Pass law

The human iPad gate passes only when **all** are true:

```text
medianFrameTime <= 16.7 ms
p95FrameTime <= 33.4 ms
p95InputToNextPaint <= 100 ms
reloadCount == 0
crashCount == 0
blankOrUnrecoverableFailureCount == 0
allThreeZonesLegible == true
webbingIdentificationScore >= 8 of 10
```

Any missing measurement leaves the gate `PENDING_HUMAN_DEVICE_TEST`. Any supplied measurement that violates a threshold makes the gate `FAIL` and the overall status `M1_BLOCKED` until repaired and retested.

Milestone 1 may report `M1_AUTOMATED_GATES_PASS — IPAD TEST PENDING` before this physical test. It may report `M1_ACCEPTED` only after every automated gate and every physical-device condition above passes.

---

# 23. Required directory structure

```text
lineage-m1/
├─ README.md
├─ PLAN.md
├─ DECISIONS.md
├─ CHARACTERIZATION_PLAN.md
├─ CHARACTERIZATION.md
├─ IPAD_TEST_CHECKLIST.md
├─ FINAL_REPORT.md
├─ AUDIT_PACKAGE_MANIFEST.md
├─ package.json
├─ fixtures/
│  └─ defining_fixture_v1.json
├─ index.html
├─ styles.css
├─ reference/
│  ├─ biology.py
│  ├─ engine.py
│  └─ analyze.py
├─ src/
│  ├─ config/
│  │  ├─ modelConfig.js
│  │  ├─ traits.js
│  │  └─ zones.js
│  ├─ core/
│  │  ├─ rng.js
│  │  ├─ math.js
│  │  ├─ individual.js
│  │  ├─ performance.js
│  │  ├─ survival.js
│  │  ├─ mating.js
│  │  ├─ inheritance.js
│  │  ├─ mutation.js
│  │  ├─ genealogy.js
│  │  ├─ events.js
│  │  ├─ simulation.js
│  │  └─ canonicalSerialize.js
│  ├─ fixtures/
│  │  └─ definingFixtureV1.js
│  ├─ observer/
│  │  ├─ tracerChannels.js
│  │  ├─ currentZoneBins.js
│  │  └─ matingAnnotations.js
│  ├─ debug/
│  │  ├─ canvasProbe.js
│  │  ├─ animalGlyph.js
│  │  ├─ inspector.js
│  │  └─ controls.js
│  └─ main.js
├─ audit/
│  ├─ test-results.txt
│  ├─ fixture-results.json
│  ├─ characterization-results.json
│  ├─ observer-invariance-hashes.json
│  └─ reference-file-hashes.json
├─ tools/
│  ├─ serve.mjs
│  ├─ runFixture.mjs
│  ├─ runCharacterization.mjs
│  └─ writeCharacterization.mjs
└─ test/
   ├─ observer-invariance.test.js
   ├─ birth-immutability.test.js
   ├─ neutral-traits.test.js
   ├─ meaningful-trait-context.test.js
   ├─ full-path-mutation-independence.test.js
   ├─ mutation-provenance.test.js
   ├─ allocation-mutation-contract.test.js
   ├─ spatial-integrity.test.js
   ├─ lifecycle-contract.test.js
   ├─ mating-integrity.test.js
   ├─ survival-composition.test.js
   ├─ genealogy-integrity.test.js
   ├─ genealogy-retention-boundary.test.js
   ├─ rng-integrity.test.js
   ├─ defining-fixture-snapshot.test.js
   ├─ defining-fixture.test.js
   └─ dependency-boundary.test.js
```

The exact file split may change only when the same dependency boundaries remain explicit. Record deviations in `DECISIONS.md`.

---

# 24. Execution order

## Stage A — preflight

Before simulation code:

1. copy Python references unchanged;
2. write `PLAN.md` mapping every contract section to modules and tests;
3. write initial `DECISIONS.md` with provisional constants;
4. write `CHARACTERIZATION_PLAN.md` before observing results;
5. create dependency boundaries;
6. validate `fixtures/defining_fixture_v1.json` and lock its snapshot test;
7. implement and test the RNG.

Do not begin Canvas work.

## Stage B — deterministic biological core

Implement:

1. configuration;
2. individuals and state;
3. initial population;
4. performance;
5. zone-specific survival;
6. lifecycle;
7. mating;
8. body inheritance and mutation;
9. allocation inheritance and mutation;
10. events and genealogy;
11. canonical serialization.

Run core invariants continuously.

## Stage C — observer layer

Implement tracer channels and current debug zone bins only after the biological core passes.

Prove observer-state invariance before adding debug interactions.

## Stage D — defining fixture

Implement exact probability and matched trajectory gates.

Do not tune against random-world output before this fixture passes.

## Stage E — random characterization

Run the predeclared 500-seed batch and write `CHARACTERIZATION.md`.

Tune only when a declared gate fails or a measured incompatibility is visible. Record every change.

## Stage F — Canvas probe

Only after all automated invariants pass:

- build the crude Canvas probe;
- test desktop rendering;
- generate the iPad checklist.

## Stage G — self-audit

Before final report:

- search for `Math.random`;
- search biological modules for observer imports;
- rerun all tests from a clean install;
- rerun fixture and characterization;
- compare observer strategies after every generation;
- verify reference files are unchanged;
- list every deferred product feature.

---

# 25. Halt conditions

Stop implementation expansion and report the failure when any of these occurs:

- observer actions change canonical biological bytes;
- observer actions change `simRng` state;
- a living individual’s genome or allocation changes after birth;
- mutation targets a survivor;
- morphology changes time allocation;
- a neutral trait changes any biological probability or outcome path;
- canopy and shoreline webbing fail the exact directional probability gate;
- the lifecycle cannot meet broad population guardrails without turning traits into global upgrades;
- all three zones cannot remain meaningfully populated;
- the checked-in fixture fails its raw SHA-256 check, canonical envelope round trip, deterministic hydration, paired-world byte-difference rule, or exact zone-load validation;
- a lifecycle path produces any offspring count other than two;
- full child creation executes other than exactly one body- and one allocation-mutation opportunity per non-founder birth;
- body and allocation mutation events do not use their separate frozen ID counters;
- allocation-mutation occurrence, candidate ordering, target selection, donor selection, draw consumption, transfer, event creation, or counter increment differs from §13.1;
- a meaningful trait lacks a positive context or is beneficial in every zone;
- the 360-generation genealogy boundary is not executed and proven;
- a biological mating event contains observer/display fields;
- genealogy contains unresolved IDs;
- the zero-allocation fallback occurs in normal batches;
- a test is weakened after seeing failing results;
- persistent clustering or later game features are introduced to solve a Milestone 1 problem.

A halt report must state:

1. the failed invariant or gate;
2. the smallest reproducible case;
3. the implicated module;
4. whether the defect is implementation, configuration, or contract incompatibility;
5. the smallest proposed repair;
6. which tests must be rerun.

Do not silently redesign the product.

---

# 26. Required final report

`FINAL_REPORT.md` must include:

- files created;
- tests run and exact results;
- fixture artifact SHA-256 and byte-preserving snapshot result;
- fixture results;
- characterization summary;
- every tuning decision;
- observer-invariance evidence;
- mutation-provenance evidence;
- population guardrail results;
- known limitations;
- deferred features;
- desktop Canvas measurements;
- iPad gate status;
- explicit statement that the model is authored and not biologically validated;
- explicit statement that Milestone 1 is not the playable student game.

Use one of these statuses:

- `M1_AUTOMATED_GATES_PASS — IPAD TEST PENDING`
- `M1_ACCEPTED`
- `M1_BLOCKED`

Do not report `M1_ACCEPTED` unless all automated gates pass and every physical iPad condition in §22 passes.

---

# 27. Post-build audit package

After implementation and self-audit, create:

```text
LINEAGE_M1_IMPLEMENTATION_AUDIT_BUNDLE.zip
```

The archive must contain the complete `lineage-m1/` project directory required by §23, including source, tests, fixture data, reference files, tools, browser probe, documentation, and raw audit evidence.

Exclude only:

- `.git/`;
- `node_modules/`;
- operating-system metadata;
- temporary editor files;
- replaceable cache directories.

Do not exclude a failing test, unused source module, superseded tuning result, or raw output because it appears unhelpful. The breaker must be able to reproduce and inspect the entire implementation history that remains in the submitted project.

`AUDIT_PACKAGE_MANIFEST.md` must list:

- every included path;
- every excluded path category;
- exact clean-run commands;
- Node version;
- operating system used for the final run;
- SHA-256 of the checked-in fixture;
- SHA-256 of each quarantined Python reference;
- final config version;
- final reported status.

Raw evidence requirements:

- `audit/test-results.txt`: unedited stdout/stderr from the final clean test run;
- `audit/fixture-results.json`: seed-level paired fixture results, medians, successes, ties, extinctions, and configuration hash;
- `audit/characterization-results.json`: raw or losslessly aggregated 500-seed metrics sufficient to reproduce every table in `CHARACTERIZATION.md`;
- `audit/observer-invariance-hashes.json`: generation-by-generation canonical biological hashes for every required observer strategy in the defining fixture;
- `audit/reference-file-hashes.json`: hashes proving historical Python references remain unchanged.

If physical iPad testing has occurred, also include its completed checklist and any measurement notes. Do not mark the implementation accepted solely because those optional media files are absent; preserve the contract’s `PENDING_HUMAN_DEVICE_TEST` state.

The next audit is an implementation audit against this repaired contract. Do not include superseded architecture briefs as competing authorities inside the implementation bundle.

---

# 28. Completion law

Milestone 1 is complete only when:

- observer actions provably cannot alter biology;
- body and habitat variation occur only at birth;
- the same webbing change has opposite directional consequences in the two fixture contexts;
- all three zones coexist in random worlds under broad guardrails;
- mutation generation is auditable separately from carrier survival;
- genealogy and mating cores remain coherent;
- neutral traits are exactly neutral;
- the difference is visible in the diagnostic probe;
- every automated result is reproducible from a clean run;
- remaining uncertainty is named rather than hidden.

Do not continue into the playable game inside this milestone.

The next contract will build the watch/flag/decide vertical slice on top of this world model.
