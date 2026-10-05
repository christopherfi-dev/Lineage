/**
 * The win (scope decision 73): the line fits its home. DOM-free.
 *
 * The line fits its home when, in its place, it is at the helpful end of
 * every trait the place requires: its median within APART of the end, so no
 * helpful variation is left to find there (a variation is APART past the
 * line's usual). The story ends there, with a celebration: the animal the
 * line became, from its actual traits (reveal.js), what the child followed and
 * why it helped, what the place chose too (scope decision 75), the animal's
 * "Did you know?", and that almost any new change would make things worse now. A story that reaches its last generation short
 * of the win says the line is still changing, and which animal it looks most
 * like so far. A line that fits its home though the child followed nothing in
 * the story is no win (scope decision 96): the place did all the choosing.
 */

import { TRAITS } from "./engine.js";
import { variationEffect, whyLine } from "./why.js";
import { WIN_TITLE, becameLine, followedLine, fitsNow, ANY_CHANGE_WORSE, stillChanging, KEEP_GOING, resembleLine, placeChoseLine, looksLikeLine, didAllChoosing,
  CHOOSE_YOURSELF } from "./narration.js";

/** At most this many of the chosen traits are named in "You followed …". */
export const FOLLOWED_NAMED = 3;

/**
 * The ending's first step, after the win or at the story's last generation short of it.
 * @param {import("./story.js").Story} story ended, with its reveal
 * @returns {null|{won: boolean, title: string, lines: string[], aloud?: boolean}} null for a line that died out, or with no
 *   place chosen; `aloud`: its lines are read aloud as the step opens
 */
export function resultFor(story) {
  const home = story.home, animal = story.reveal?.animal;
  if (story.outcome !== "survived" || !home || !animal || animal.zone === null) return null;
  // No win without choosing (scope decision 96): the line fits its home, but the child followed nothing. No celebration;
  // the animal it looks like, "The water did all the choosing." and "Can you choose yourself next time?", read aloud.
  if (story.placeChose) return { won: false, title: looksLikeLine(animal, story.name), lines: [didAllChoosing(home.zone), CHOOSE_YOURSELF], aloud: true };
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
  // What the place chose that the child didn't follow (scope decision 75): "The water chose a strong tail too."
  const chosen = story.placeChips.filter((p) => p.zone === zone).map((p) => ({ trait: TRAITS[p.t], dir: p.dir }));
  if (chosen.length) lines.push(placeChoseLine(zone, chosen, followed.length > 0));
  lines.push(...animal.facts.slice(0, 1), fitsNow(zone, story.name), ANY_CHANGE_WORSE);
  return { won: true, title: WIN_TITLE, lines };
}
