/**
 * The ending's reflection, the Field Guide and the teacher's journal (scope
 * decision 62). DOM-free, except for the small storage helpers, which only
 * ever use this iPad's own localStorage: nothing leaves the iPad.
 *
 * Your idea: the child builds one sentence, "My animals did survive because
 * their big eyes helped on the open ground.", or types their own. Check my
 * idea: the sentence against the table (docs/LINEAGE_WHY.md) and what the
 * family really had and where it lived. Nothing is ever marked wrong.
 */

import { TRAITS, MEANINGFUL_TRAIT_INDICES, NEUTRAL_TRAIT_INDICES } from "./engine.js";
import { effectIn, whyLine, HAS_AT, NEUTRAL_NOUN, NEUTRAL_WHY } from "./why.js";
import { ZONE_AT } from "./narration.js";

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** "their [trait]": every trait at its far end, in the words of the sentence builder. */
export const IDEA_TRAITS = [
  ["toe_webbing", "webbed feet"], ["curved_claws", "curved claws"], ["dense_fur", "thick fur"],
  ["long_hindlimbs", "long back legs"], ["strong_tail", "strong tails"], ["large_eyes", "big eyes"],
  ["streamlined_body", "sleek bodies"], ["coat_shade", "coat colour"], ["ear_tip_shape", "ear tips"],
  ["tail_tip_marking", "tail tips"],
].map(([trait, words]) => ({ t: TRAITS.indexOf(trait), trait, words }));
/** Words that take "helps" in a line of their own: "Thick fur helps on the open ground." */
const SINGULAR = new Set(["dense_fur", "coat_shade"]);

/** The builder's parts and its lines. */
export const IDEA_TITLE = "Your idea";
export const IDEA_OR = "Or type your own:";
export const IDEA_DONE = "That's my idea";
export const CHECK_TITLE = "Check my idea";
export const REVEAL_TITLE = "The reveal";
export const HAPPENED_TITLE = "What happened";
export const NEXT = "Next";
export const MY_IDEA = "My idea:";
/** A typed idea: letters, spaces and a little punctuation, at most this many characters. */
export const IDEA_MAX = 140;

/**
 * The sentence as the child built it: "My animals did survive because their
 * big eyes helped on the open ground."
 * @param {{did:boolean, t:number, helped:boolean, zone:number}} idea
 */
export function ideaSentence(idea) {
  const words = IDEA_TRAITS.find((x) => x.t === idea.t)?.words ?? "traits";
  return `My animals ${idea.did ? "did" : "didn't"} survive because their ${words} ${idea.helped ? "helped" : "didn't help"} ${ZONE_AT[idea.zone]}.`;
}

/** A typed idea, cleaned: letters, digits, spaces and . , ! ? ' - only, at most IDEA_MAX. */
export const cleanIdea = (text) => String(text ?? "").replace(/[^\p{L}\p{N} .,!?'’-]/gu, "").replace(/\s+/g, " ").slice(0, IDEA_MAX);

/**
 * What really happened, for checking an idea: the outcome, where most of the
 * family lived at the end, which traits it had (its average at least halfway
 * to the far end), and the biggest helper and hurter there.
 * @param {import("./story.js").Story} story ended
 */
export function truthOf(story) {
  const animals = story.lastAnimals, zone = story.mainZone;
  const mean = (t) => animals.reduce((sum, a) => sum + a.genome[t], 0) / Math.max(1, animals.length);
  const has = TRAITS.map((_, t) => animals.length > 0 && mean(t) >= HAS_AT);
  const rank = (sign) => MEANINGFUL_TRAIT_INDICES.filter((t) => has[t] && Math.sign(effectIn(t, zone)) === sign).sort((a, b) => mean(b) - mean(a));
  return { survived: story.outcome === "survived", zone, has, helper: rank(1)[0] ?? null, hurter: rank(-1)[0] ?? null };
}

/**
 * Check my idea (scope decision 62): the child's sentence against the table
 * and what the family really had and where it lived. Nothing is marked wrong:
 * "Yes! Big eyes don't help underwater, and cost energy." or "Good thinking.
 * But webbed feet helped here. What else did they have?"
 * @param {null|{did:boolean, t:number, helped:boolean, zone:number}} idea null for a typed idea
 * @param {ReturnType<typeof truthOf>} truth
 * @returns {{right:boolean, lines:string[]}}
 */
export function checkIdea(idea, truth) {
  const reason = truth.survived ? truth.helper ?? truth.hurter : truth.hurter ?? truth.helper;
  const hint = reason === null ? [] : [whyLine(reason, truth.zone)];
  if (!idea) return { right: false, lines: ["Thanks for your idea!", ...(hint.length ? [`Here's one reason: ${lower(hint[0])}`] : [])] };
  const x = IDEA_TRAITS.find((y) => y.t === idea.t), words = x.words, e = Math.sign(effectIn(idea.t, idea.zone));
  const ELSE = "What else did they have?";
  if (idea.did !== truth.survived) return { right: false, lines: [`Good thinking. But your animals ${truth.survived ? "survived" : "didn't survive"}.`, ...hint] };
  if (idea.zone !== truth.zone) return { right: false, lines: [`Good thinking. But most of them lived ${ZONE_AT[truth.zone]}.`, ...hint] };
  if (!e) return { right: false, lines: [`Good thinking. But ${lower(whyLine(idea.t, idea.zone))}`, ELSE] };
  if (!truth.has[idea.t]) return { right: false, lines: [`Good thinking. But few of your animals had ${words}.`, ELSE] };
  if ((e > 0) !== idea.helped) {
    return { right: false, lines: [e > 0 ? `Good thinking. But ${words} helped here.` : `Good thinking. But ${lower(whyLine(idea.t, idea.zone))}`, ELSE] };
  }
  return { right: true, lines: [`Yes! ${whyLine(idea.t, idea.zone)}`] };
}
const lower = (line) => line.charAt(0).toLowerCase() + line.slice(1);

/* ================= the Field Guide (scope decision 62) ================= */

/**
 * The 24 discoveries: each meaningful trait in each place, with its mark (✓, ✗
 * or ~) and its line from the table, and each neutral trait once, for every
 * place (scope decision 65). Each is found by a fair test that goes the
 * table's way: better, worse, or "About the same." for a "~" or a neutral trait.
 */
export const FIELD_GUIDE = [
  ...MEANINGFUL_TRAIT_INDICES.flatMap((t) => [0, 1, 2].map((zone) => {
    const e = effectIn(t, zone), words = IDEA_TRAITS.find((x) => x.t === t).words;
    return { key: `${TRAITS[t]}:${zone}`, t, zone, mark: e > 0 ? "✓" : e < 0 ? "✗" : "~", words, line: whyLine(t, zone) };
  })),
  ...NEUTRAL_TRAIT_INDICES.map((t) => ({ key: TRAITS[t], t, zone: null, mark: "~", neutral: true, words: NEUTRAL_NOUN[TRAITS[t]], line: NEUTRAL_WHY[TRAITS[t]] })),
];

/** "You discovered: webbed feet help at the water's edge." (or "…don't matter much on open ground."). */
export function discoveryLine(entry) {
  if (entry.neutral) return `You discovered: ${lower(entry.line)}`;
  const s = SINGULAR.has(TRAITS[entry.t]);
  const verb = entry.mark === "✓" ? (s ? "helps" : "help") : entry.mark === "✗" ? (s ? "hurts" : "hurt") : `${s ? "doesn't" : "don't"} matter much`;
  return `You discovered: ${entry.words} ${verb} ${ZONE_AT[entry.zone]}.`;
}
/** "You've discovered 9 of 24." */
export const discoveredLine = (n) => `You've discovered ${n} of ${FIELD_GUIDE.length}.`;
export const FIELD_GUIDE_TITLE = "Field guide";
/** An entry not discovered yet. */
export const NOT_YET = "Not discovered yet.";

/** The entry for a trait in a place (a neutral trait's one entry, wherever). */
export const guideEntry = (t, zone) => FIELD_GUIDE.find((x) => x.t === t && (x.zone === zone || x.neutral)) ?? null;

/* ================= this iPad's own storage (never sent anywhere) ================= */

const GUIDE_KEY = "lineage.fieldGuide", JOURNAL_KEY = "lineage.journal";
/** The journal keeps this many stories, the newest. */
export const JOURNAL_MAX = 200;

/** A value kept in this iPad's own storage, or the fallback when there is none or storage is blocked. */
export function read(key, fallback) {
  try { const v = globalThis.localStorage?.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
/** Keep a value in this iPad's own storage; false when storage is blocked. */
export function write(key, value) {
  try { if (!globalThis.localStorage) return false; globalThis.localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

/** Discoveries made since the page opened: kept here too, so a blocked storage still says each one only once. */
const session = new Set();
/** The Field Guide's discoveries on this iPad, by key. */
export const discoveries = () => new Set([...read(GUIDE_KEY, []), ...session]);
/** Discover an entry; true when it is new. */
export function discover(entry) {
  const found = discoveries();
  if (!entry || found.has(entry.key)) return false;
  found.add(entry.key);
  session.add(entry.key);
  write(GUIDE_KEY, [...found]);
  return true;
}

/** The teacher's journal: every story told on this iPad, newest first. */
export const journalEntries = () => read(JOURNAL_KEY, []);
/** Keep a story in the journal (replacing one with the same id). */
export function keepInJournal(entry) {
  const list = journalEntries().filter((x) => x.id !== entry.id);
  list.unshift(entry);
  return write(JOURNAL_KEY, list.slice(0, JOURNAL_MAX));
}
export function clearJournal() { return write(JOURNAL_KEY, []); }
