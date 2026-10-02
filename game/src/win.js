/**
 * The win (scope decision 73): the line fits its home. DOM-free.
 *
 * The line fits its home when, in its place, it is at the helpful end of
 * every trait the place requires: its median within APART of the end, so no
 * helpful variation is left to find there (a variation is APART past the
 * line's usual). The story ends there, with a celebration: the animal the
 * line became, from its actual traits (reveal.js), what the child followed and
 * why it helped, the animal's "Did you know?", and that almost any new change
 * would make things worse now. A story that reaches its last generation short
 * of the win says the line is still changing, and which animal it looks most
 * like so far.
 */

import { TRAITS } from "./engine.js";
import { variationEffect, whyLine } from "./why.js";
import { WIN_TITLE, becameLine, followedLine, fitsNow, ANY_CHANGE_WORSE, stillChanging, KEEP_GOING, resembleLine } from "./narration.js";

/** At most this many of the chosen traits are named in "You followed …". */
export const FOLLOWED_NAMED = 3;

/**
 * The ending's first step, after the win or at the story's last generation short of it.
 * @param {import("./story.js").Story} story ended, with its reveal
 * @returns {null|{won: boolean, title: string, lines: string[]}} null for a line that died out, or with no place chosen
 */
export function resultFor(story) {
  const home = story.home, animal = story.reveal?.animal;
  if (story.outcome !== "survived" || !home || !animal || animal.zone === null) return null;
  if (!story.won) return { won: false, title: stillChanging(story.name), lines: [KEEP_GOING, resembleLine(animal, story.name)] };
  const zone = home.zone, kind = (c) => variationEffect(c.v.t, c.v.dir, zone);
  // What the child followed: the traits that help there first, then the free ones; a harmful one never fits a home.
  const helped = story.chips.filter((c) => kind(c) > 0), free = story.chips.filter((c) => kind(c) === 0);
  const followed = [...helped, ...free].slice(0, FOLLOWED_NAMED);
  const lines = [becameLine(animal, story.name)];
  if (followed.length) {
    lines.push(followedLine(followed.map((c) => c.v.group)));
    // Why: the table's line for each that helped (at most two); for a free one, what the real animal shares with it.
    for (const c of helped.slice(0, 2)) lines.push(whyLine(c.v.t, zone));
    for (const c of free) {
      const like = animal.like.find((l) => l.credits[TRAITS[c.v.t]] === (c.v.dir > 0 ? "high" : "low"));
      if (like && !lines.includes(like.text)) { lines.push(like.text); break; }
    }
  }
  lines.push(...animal.facts.slice(0, 1), fitsNow(zone, story.name), ANY_CHANGE_WORSE);
  return { won: true, title: WIN_TITLE, lines };
}
