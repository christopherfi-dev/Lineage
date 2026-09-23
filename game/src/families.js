/**
 * Families are mother lines, computed here from the engine's birth records.
 *
 * Every baby belongs to exactly one family: its mother's. The engine has no
 * sexes, so the "mother" is always the first parent in the engine's birth
 * record. Each animal has one mother, so lines branch but never merge.
 *
 * Generation-0 founders have no mothers. Each habitat's founders start as
 * founding families of about a dozen, and a founding family is the top of its
 * members' lines.
 */

/** How many generations back through the line a tap reaches (measured; see the scope doc). */
export const FAMILY_DEPTH = 3;

const FOUNDING_SIZE = 13;
const KEEP_GENERATIONS = 200;

export class Families {
  /**
   * @param {Array<{id:number, zone:number}>} founders the generation-0 animals
   * @param {number[][]} [keepTogether] founder groups that are founding families as-is
   */
  constructor(founders, keepTogether = []) {
    /** id -> mother's id, or a founding-family key for a founder */
    this.mother = new Map();
    /** id -> generation born (founding-family keys: -1) */
    this.born = new Map();
    /** @type {Array<{key:string, zone:number, ids:number[]}>} */
    this.founding = [];

    const zoneOf = new Map(founders.map((f) => [f.id, f.zone]));
    const groups = keepTogether.map((ids) => ids.filter((id) => zoneOf.has(id)));
    const placed = new Set(groups.flat());
    for (let zone = 0; zone < 3; zone++) {
      const rest = founders.filter((f) => f.zone === zone && !placed.has(f.id)).map((f) => f.id).sort((a, b) => a - b);
      const n = Math.max(1, Math.round(rest.length / FOUNDING_SIZE));
      for (let k = 0; k < n; k++) {
        const ids = rest.slice(Math.floor(k * rest.length / n), Math.floor((k + 1) * rest.length / n));
        if (ids.length) groups.push(ids);
      }
    }
    groups.forEach((ids, i) => {
      const key = `founding-${i}`;
      this.founding.push({ key, zone: zoneOf.get(ids[0]), ids });
      this.born.set(key, -1);
      for (const id of ids) { this.mother.set(id, key); this.born.set(id, 0); }
    });
  }

  /** Record one engine birth. */
  addBirth(childId, motherId, generation) {
    this.mother.set(childId, motherId);
    this.born.set(childId, generation);
  }

  /** The ancestor `depth` generations back through the mother line, or the top of the line. */
  ancestor(id, depth = FAMILY_DEPTH) {
    let a = id;
    for (let k = 0; k < depth; k++) {
      const m = this.mother.get(a);
      if (m === undefined) break;
      a = m;
    }
    return a;
  }

  /** True when `id`'s mother line passes through `root` (an animal is in its own line). */
  descendsFrom(id, root) {
    const rootBorn = this.born.get(root) ?? -Infinity;
    for (let a = id; a !== undefined; a = this.mother.get(a)) {
      if (a === root) return true;
      if ((this.born.get(a) ?? Infinity) < rootBorn) return false;
    }
    return false;
  }

  /** Living members of the family whose top is `root`. */
  members(root, livingIds) {
    return new Set(livingIds.filter((id) => this.descendsFrom(id, root)));
  }

  /** Forget long-dead animals; lines of the living only ever look a few generations up. */
  prune(livingIds, generation) {
    const living = new Set(livingIds);
    for (const [id, g] of this.born) {
      if (typeof id === "number" && g < generation - KEEP_GENERATIONS && !living.has(id)) {
        this.born.delete(id);
        this.mother.delete(id);
      }
    }
  }
}
