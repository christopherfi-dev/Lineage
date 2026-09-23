/**
 * The bridge: real biology in, game events out.
 *
 * Biology only ever moves through the engine's own advanceGeneration(). The
 * game never touches simRng, never edits an individual, and never decides who
 * is born or dies. After each generation commits, this module reads the
 * engine's records (birth records, death events, body-mutation events) and
 * hands them to the canvas as plain events.
 *
 * "Follow this group" is observer state only: a tracer channel (contract §16)
 * founded from the animals of the tapped animal's group, propagated through
 * every later birth by the engine's own tracer hooks.
 */

import {
  createInitialState,
  advanceGeneration,
  isExtinct,
  currentModelConfig,
  TRAITS,
  currentZoneBinIndex,
  zoneBinCounts,
  createObserverState,
  createTracerChannel,
  clearUserChannels,
  tracerBirthHook,
  observerAfterGenerationHook,
} from "./engine.js";

/**
 * The engine's own focal-marker rule (contract §16): an animal with at least
 * half its ancestry from the followed founders is drawn as part of your group.
 * Animals with a smaller share are mixed relatives and are drawn like everyone
 * else for now.
 */
export const FOCAL_THRESHOLD = 0.5;

export class Bridge {
  /** @param {number} seed trajectory seed for the random M1 world */
  constructor(seed) {
    this.seed = seed;
    this.state = createInitialState(seed, currentModelConfig);
    this.observer = createObserverState();
    /** @type {null|{channelId:string, zone:number, founderCount:number, generation:number}} */
    this.follow = null;
    this.followSerial = 0;
    this.index();
  }

  index() {
    this.byId = new Map(this.state.currentIndividuals.map((i) => [i.id, i]));
  }

  get generation() { return this.state.generation; }
  get living() { return this.state.currentIndividuals; }
  get extinct() { return isExtinct(this.state); }

  /** @param {number} id */
  get(id) { return this.byId.get(id) ?? null; }

  /** Engine zone index (0 canopy, 1 forest floor, 2 shoreline) from habitat use. */
  zoneOf(id) {
    const ind = this.byId.get(id);
    return ind ? currentZoneBinIndex(ind) : -1;
  }

  zoneCounts() { return zoneBinCounts(this.state.currentIndividuals); }

  /**
   * Follow the tapped animal's group. Its founders are every animal living in
   * the tapped animal's habitat right now; they become the founders of a new
   * tracer channel, and from here on the group is their living descendants.
   * Observer-only: consumes no simRng and cannot change the biology.
   * @param {number} id tapped animal
   */
  followGroupOf(id) {
    const tapped = this.byId.get(id);
    if (!tapped) return null;
    const zone = currentZoneBinIndex(tapped);
    const livingIds = this.state.currentIndividuals.map((i) => i.id);
    const founders = this.state.currentIndividuals
      .filter((i) => currentZoneBinIndex(i) === zone)
      .map((i) => i.id);
    // One followed group at a time; older channels are dropped so tracer work
    // stays proportional to the living world.
    clearUserChannels(this.observer);
    const channelId = `follow-${++this.followSerial}`;
    createTracerChannel(this.observer, channelId, founders, livingIds);
    this.observer.activeChannel = channelId;
    this.follow = { channelId, zone, founderCount: founders.length, generation: this.state.generation };
    return this.follow;
  }

  /** Share of this animal's ancestry that comes from the followed founders. */
  contribution(id) {
    if (!this.follow) return 0;
    const channel = this.observer.channels.get(this.follow.channelId);
    return channel ? channel.values.get(id) ?? 0 : 0;
  }

  isFollowed(id) { return this.contribution(id) >= FOCAL_THRESHOLD; }

  followedIds() {
    return this.state.currentIndividuals.filter((i) => this.isFollowed(i.id)).map((i) => i.id);
  }

  /**
   * Run exactly one engine generation and report what the engine recorded.
   * @returns {null|GenerationEvents} null when the whole world is extinct
   */
  step() {
    if (isExtinct(this.state)) return null;
    const followedBefore = new Set(this.followedIds());

    advanceGeneration(this.state, currentModelConfig, {
      onBirth: tracerBirthHook(this.observer),
      afterGeneration: observerAfterGenerationHook(this.observer),
    });
    this.index();

    const result = this.state.lastGenerationResult;
    const g = result.generation;
    const births = result.births.map((b) => ({ childId: b.childId, parentAId: b.parentAId, parentBId: b.parentBId }));
    const deaths = this.state.deathEvents
      .filter((e) => e.generation === g)
      .map((e) => ({ id: e.individualId, cause: e.cause }));
    const mutations = this.state.bodyMutationEvents
      .filter((e) => e.generation === g)
      .map((e) => ({
        childId: e.childId,
        trait: TRAITS[e.traitId],
        before: e.preMutationValue,
        after: e.postMutationValue,
        delta: e.requestedDelta,
      }));

    const followedNow = this.followedIds();
    return {
      generation: g,
      births,
      deaths,
      mutations,
      followed: {
        count: followedNow.length,
        born: births.filter((b) => this.isFollowed(b.childId)).map((b) => b.childId),
        gone: deaths.filter((d) => followedBefore.has(d.id)).map((d) => d.id),
        mutated: mutations.filter((m) => this.isFollowed(m.childId)),
      },
      observerErrors: result.observerErrors,
    };
  }
}

/**
 * @typedef {Object} GenerationEvents
 * @property {number} generation
 * @property {Array<{childId:number, parentAId:number, parentBId:number}>} births engine birth records
 * @property {Array<{id:number, cause:string}>} deaths engine death events
 * @property {Array<{childId:number, trait:string, before:number, after:number, delta:number}>} mutations engine body-mutation events
 * @property {{count:number, born:number[], gone:number[], mutated:Array<Object>}} followed
 * @property {ReadonlyArray<Object>} observerErrors
 */
