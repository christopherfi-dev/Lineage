# Handoff: LINEAGE visual redesign ("golden hour, in gouache")

## Overview
This bundle restyles the classroom game in `game/` for Grade 3 children on iPads. It is a quiet nature documentary at golden hour, painted like a field guide. The child's animals are the brightest, most detailed thing on screen.

**Only visuals and motion change.** Game text, biology, story logic and timings stay exactly as they are in `main`.

## Hard rules
- **Do not touch `lineage-m1/src`.** Not one file.
- In `game/`, change only the files listed under "Files". These must stay byte-for-byte as they are on `main`: `bridge.js`, `cohorts.js`, `engine.js`, `evidence.js`, `families.js`, `journal.js`, `narration.js`, `reveal.js`, `seeds.js`, `speech.js`, `story.js`, `variations.js`, `world.js`, `moments.html`, `README.md` and `test/`.
- Don't add, remove or reword any child-facing string. No percentages anywhere.
- Use 2D canvas and CSS only, with no new libraries. It must stay smooth on a school iPad.
- Keep a speaker button beside every line. Tap targets are at least 44 px.
- `npm test` in `game/` must still pass.

## About the files
`game/` in this bundle is a working, finished restyle of the real game. It was built on `main` at tree `02f741353fad`. These are **high-fidelity** design files: copy the colours, sizes and motion exactly.
- **Quickest way in:** copy the six files over `game/`, then review `patches/*.diff`. They are unified diffs against `main`.
- **If `main` has moved on:** apply the changes below by hand, using the diffs as the reference.

## Files
| File | Change |
|---|---|
| `game/src/light.js` | **New.** `skyAt(phase)` and `class Sky`: day colours, mist, dust in the air, glints on the water, bird shadows. It uses its own seeded random numbers and never touches the game's random numbers. |
| `game/src/main.js` | Arrival, light and mood, newborn caption placement, and CSS class switches for moods. |
| `game/src/herd.js` | How animals are drawn: two passes, light from the sun's side, the newborn glow (ring and sparkles), and fading. |
| `game/src/creature.js` | The creature drawing: a painted habitat behind it, warm light along its edges, and light under the new part. |
| `game/styles.css` | Every panel, card, board, ending and speaker button. Fonts: Petrona (serif) and Karla (sans), loaded from Google Fonts. |
| `game/index.html` | One `theme-color` meta tag and one `#bloom` caption element. |
| `game/src/moments.js` | Test tool only: moment links skip past or restart the arrival. |

Line numbers below refer to the new files.

## Changes by moment

### 1. Arrival
- **`main.js`** (the arrival block around line 69):
  - Morning mist lifts over about 5 s.
  - The camera starts high and eases down into the leaves.
  - Then the existing line "Tap an animal to follow its family." fades in.
  - The arrival starts only once the world has been painted (around line 184).
  - A tap during the arrival clears the mist at once (around line 1243). `endArrival()` finishes it.
- **`light.js`:** the mist layer in `Sky`.
- **`styles.css`:** the `#hint` line: paper pill, Petrona serif, speaker on the right.
- **`moments.js`** lines 297 and 310: open moments with the arrival skipped.

### 2. A generation is one day
- **`light.js` `skyAt(phase)`:** one generation is one day. Phase 0 is dawn, then warm afternoon gold, amber dusk, and a soft blue night with fireflies before dawn comes again. `Sky` draws the tinted light, dust, water glints and bird shadows over the world.
- **`main.js`:**
  - Import at line 14.
  - `updateLight(now, dt)` is called every frame (around line 1066). Its body is around line 1079.
  - The light is worked out from the generation clock. The mood is set around lines 224 and 243.
- **`herd.js`:**
  - Shadows lean away from the sun and grow long when it is low (around line 447).
  - The rim of light sits on the sun's side (around line 533).
  - At night your animals keep a soft glow.

### 3. The glowing newborn
- The **rule** is already in `story.js` (at most 3 glow). `herd.js` only **paints** it.
- **`herd.js`:**
  - `BLOOM_MS = 3400` (line 15).
  - `glowSince` map (line 74) records when each baby started glowing.
  - `bloomNow(now)` (line 162) returns the most recent one, for its caption.
  - `drawMark`:
    - The ring opens over 3.4 s with a few sparkles drifting up.
    - Then it breathes slowly (about a 3 s cycle).
    - It is a warm gold ring with a soft outer glow.
- **`index.html` `#bloom` and `main.js` `placeBloom()`** (around line 1168):
  - One short caption beside the newborn, with a speaker.
  - It uses the existing string (born with …, or `GLOW_HINT`).
  - It is hidden while a card, choice panel, prediction panel or ending is open.

### 4. The follow card (hero)
- **`main.js`** line 903: `#card.glowing` switches on while the Follow buttons show.
- **`styles.css`:**
  - `#card.glowing`: a gold rim and a warm glow around the card and the animal drawing.
  - `#card-follow .go`: "Follow animals with [trait]". Deep teal pill, 60 px tall, 18 px Karla bold, with a gentle glow pulse (`followGlow`, 2.8 s).
  - `#card-follow .keep`: "Keep looking". The **same size and weight** as Follow, on warm paper with a 2 px gold ring. Friendly, not second best.
  - The × close button and tapping empty ground work as before.
- **`creature.js`:**
  - A painted habitat behind the animal (around line 154).
  - Golden light along its upper edges (around line 482).
  - A soft ring and sparkles under the new part (around lines 562 and 578).

### 5. Will it spread? / It disappeared / Wait! / blocked
- **`main.js`:**
  - `logMoods` (line 93) and `moodLog(mood)` (around line 981) put a class on `#log`.
  - `spread` goes on each counter line (around line 502), `gentle` on the outcome lines (around lines 490 and 538), and `danger` on the danger line (around line 517).
  - `#stage.spreading` is on while time is fast-forwarding (around line 1054).
  - None of the text changes.
- **`styles.css`:**
  - `#stage.spreading::after`: warm edges around the world that breathe in and out (2 s).
  - `#log.spread`: gold-ringed dark pill with even-width numbers. Each new count gives a small pop (`spreadTick`, 0.7 s): scale 1.045 and a brighter ring. It should feel like watching something grow.
  - `#log.gentle` ("It disappeared. Most new traits do."): cooler, and fades in softly from a blur (1.4 s). No alarm.
  - `#log.danger` ("Wait! Your group is getting very small."): warm clay pill that rises gently (`dangerIn`, 0.9 s). No red and no shaking.
  - `#card-follow .follow-note`: the "blocked" note, a calm peach panel with a speaker.

### 6. The fair test (scoreboard and map)
- **`herd.js`:**
  - Your group is drawn last, brightest, with light along its edges.
  - "The others here" use the existing others colour, slightly muted, so the two groups sit side by side on the map and can be told apart.
- **`styles.css`:**
  - `.count` rows sit in a two-column grid that drops to one column on narrow screens.
  - Each row: 21 px Petrona, paper card with a ring in that group's colour.
  - Bars: 16 px wide, 52 px tall, grow over 0.9 s. The current bar glows.
  - The same board is used in `#since`, `#choice-since` and `#ending-fair-rows`.

### 7. Growing / shrinking
- **`main.js`** (mood, around line 243): the light moves slowly (over a few seconds) warmer and fuller as your group grows, and a little cooler and quieter as it shrinks. Never dark.
- **`herd.js`:**
  - Babies stay smaller beside their mothers for 7 s (`BABY_MS`).
  - An animal that dies fades with a little light rising from it (around line 569).

### 8. The backup choice panel
Its timing (two minutes with no follow) is already in the game logic; only the look changes.
- **`styles.css` `#choice`:**
  - A paper sheet that slides up (0.6 s, `cubic-bezier(.2,.9,.28,1)`).
  - Three painted plates, each with a 44 px speaker.
  - The timer is a warm gold band 8 px tall.
  - `#choice-note` is italic Petrona.
- **`creature.js`:** the plate drawings, with habitat and light as in 4.

### 9. The prediction and its result
- **`styles.css`:**
  - `#journal`: the same paper sheet as `#choice`. Answers are 64 px tall with 20 px Petrona text. The picked answer gets a teal ring and glow; the others fade.
  - `.prediction`: what you thought beside what happened, as a small paper note.
  - `#since` ("Since your last choice"): the fair-test board appears first, then its rows rise in one after another (0.25 s, then 0.45 s).

### 10. Endings and the reveal
- **`main.js`** line 752: `#ending.died` is on when the group died out.
- **`styles.css`:**
  - The ending is a field-guide page: "Here's what your animals look like now", the creature drawing, then the reveal.
  - `#reveal`: warm gold plate. Then its "why" lines.
  - `#reveal-facts .fact` ("Did you know?"): little margin notes with a gold dot and their own speaker, rising in at 2.4 s and 2.8 s.
  - `#ending-lead`: in the died-out ending the fair test comes first, then the reveal in the past tense.
  - `#ending.died`: cooler dusk colours (`#E9E6EE` plate, `#33384C` text) and silver fact dots. Soft, never scary.
  - The two buttons are pills at least 56 px tall.

## Design tokens
- **Paper:** `#EFE6D2` page, `#F7F0DF` sheets, `#FBF7EC` cards, `#E6DAC0` and `#DED1B2` lines.
- **Ink:** `#2A2B22` main, `#3E4436`, `#585A4A` secondary, `#9A8E70` small caps.
- **Teal (action / yours):** `#1C7894`, `#14657F`, `#10566C` (gradient at 170°), glow `rgba(20,101,127,.28)`.
- **Gold (light / new):** `#EFC27E`, `#E8C27A`, `#E3B35A`, `#D9A441`, `#E8B64C`, glow `rgba(255,206,110,.45)`.
- **Warm notes:** `#FCEBD8`, `#EDB98A`, `#5B3414`.
- **Dusk (died out):** `#E9E6EE`, `#33384C`, `#B9C3E0`.
- **Type:**
  - Petrona 500/600 for headings (30–32 px) and lines (18–21 px).
  - Karla 400/600/700 for labels and buttons (15–18 px) and small caps (11–12.5 px, letter-spacing 1.4–1.6 px).
- **Radii:** sheets 30 px (top only), cards 20 px, rows 14–18 px, buttons 999 px.
- **Motion:** 0.55–0.9 s ease or `cubic-bezier(.2,.9,.28,1)`; breathing loops 2–3 s. Nothing flashes.

## Performance notes
- Glows and rims are drawn from pre-built sprite images, not from `shadowBlur`.
- `Sky` keeps its dust, fireflies and birds to a few dozen.
- CSS animations only change `transform`, `opacity` and `box-shadow` on small elements.
- Test on an iPad at 1180 × 820 in both orientations, at a steady 60 fps.
