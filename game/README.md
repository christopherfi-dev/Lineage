# LINEAGE — the game

Built step by step from `LINEAGE_M2_CLASSROOM_SCOPE.md`: the engine runs the biology on the
canvas from `design/Lineage World.dc.html`, played as a story (scope decision 6). The game runs
the engine's Classroom mode (`../lineage-classroom`, scope decision 55), which is built from the
frozen M1 engine's own parts (`../lineage-m1/src`, never copied or edited). `src/engine.js` is
the only file that imports either.

## Run it

Serve the **repo root** as a static site, then open `/game/`:

```bash
python3 -m http.server 8000      # from the repo root
# open http://localhost:8000/game/
```

Plain ES modules, no build step. The world is the common-ancestor world: every founder starts
on the open ground with the same ancestral body, and the high leaves and the water's edge start
empty. In every founding family, 3 founders lean toward the water's edge and 3 toward the high
leaves, so each place is a baby away (scope decision 70). `?seed=N` picks another trajectory (default 13). `?length=76` is the teacher's full-length
story (a story is 50 generations by default; scope decision 64). `?demo=webbed` is the teacher demo, M1's
defining experiment: the fixture with its webbing override, so the same webbed feet start in one
canopy family and one shoreline family.

**Curated worlds** (`src/seeds.js`). The game only shows a seed whose three habitats all still
have living animals at the story's length (generation 50, or `?length=`), where every story that lasts ends. Before a world is
shown, the engine runs ahead in a throwaway copy of it (an observer run: the biology is
unchanged, and the world you see starts again from generation 0 with the same seed). All of
seeds 1–100 pass in the common-ancestor world (and 30 of 1–30 in the demo). A `?seed=` that fails is swapped for a good one, and "New world" only picks
good seeds.

## The story (scope decisions 6, 32–35, 42, 44 and 58–70)

The rules are in `src/story.js`, with every number at the top of the file:

| constant | value | what it does |
| --- | --- | --- |
| `GENERATION_SECONDS` | 12 | real seconds per generation while watching (scope decision 88; it was 20) |
| `FAST_SECONDS` | 2 | real seconds per generation in a fast-forward |
| `RISE_TO` | 20 | a fast-forward after a follow stops once the trait's count in the line reaches this (scope decision 67) |
| `RISE_MAX` | 15 | and after this many generations, at most |
| `FAST_FROM` | 3 | a follow of fewer than this has no fast-forward: its line is watched from the start (scope decision 69) |
| `PLACE_TO` | 20 | after the first choice, where the family will live, the fast-forward runs until this many of the line live there (scope decision 70) |
| `PLACE_MAX` | 4 | or for this many generations, at most (Part 1's limit) |
| `GLOW_MAX` | 3 | newborns glowing at once, at most (`src/cohorts.js`) |
| `GLOW_GENERATIONS` | 2 | a newborn glows in the generation it is born and the next |
| `GLOW_GAP_SECONDS` | 4 | new glows start at least this far apart (seconds of watching) |
| `GLOW_MIN_SECONDS` | 10 | a glow lasts at least this long before a newer one may take its place |
| `GLOW_LEFT_SECONDS` | 6 | a glow starts only with this long left of its day, so a baby that doesn't make it through the night still glowed long enough to tap (scope decision 88) |
| `APPEAR_SPAN` | 0.5 | a watched day's babies appear over this much of the day (it was 0.8) |
| `STALL_SIZE`, `STALL_AFTER` | 5, 2 | a line of this many or fewer for 3 generations, no bigger than 2 generations ago, with no baby to follow glowing or about to, fast-forwards until something happens (scope decision 91) |
| `STALLS_BACK` | 3 | the third stall in a row isn't skipped through: "Your … line isn't growing." and back to the line before |
| `FADED_BELOW` | 3 | an earlier chosen trait greys out on "Your line so far" when fewer of the line have it (and fewer than half) |
| `SAME_BY`, `SAME_FROM` | 1.25, 5 | a line on a trait that doesn't matter there is doing "about as well as your relatives" when each grew within a quarter of the other, at 5 animals or more |
| `GUESS_GAP` | 4 | a "Why?" guess comes at most once in this many generations, except when a line dies out; only a new Field Guide discovery is a guess (scope decision 69) |
| `STORY_CHOICES` | 15 | follows in a story, at most |
| `STORY_GENERATIONS` | 50 | where every story that lasts ends (scope decision 64; it was 76) |
| `FULL_STORY_GENERATIONS` | 76 | the teacher's full-length story, `?length=76`; the longest `?length=` taken |
| `NEARLY_OVER` | 25 | with fewer generations of the story left, "Try another family" first asks "This world is nearly over. Start a new world?"; the shortest `?length=` taken |

A story ends with the win, when the line fits its home: a median 4.9 minutes after the first tap in the high leaves, 5.6 on the open ground and 8.0 at the water's edge, reading time included (a Grade 3 pace), with a median of 2, 3 and 4 follows; 270 of 270 stories win before the story's last generation, measured with a simulated child following random glows (scope decision 94). A child who follows nothing gets no win: the place did all the choosing (scope decision 96). The line takes in every baby born to it in its place, as before: the rule that it never gets an adaptation the child didn't choose is built in `src/bridge.js` (`LIKE_RULE`), now with a chosen way improving by itself, and switched off, since an active child still won too few stories with it at the water's edge (scope decisions 87 and 97).

1. **Time waits for the child.** After the arrival mist, the opening (scope decision 77,
   `src/opening.js`, scope decision 93): the collection's twelve cards face down, "These are the
   animals you can become.", the cards flipping one after another about half a second apart with
   a quiet card sound, "How many can you discover?", and the cards wait, every animal showing, the
   ones found on this iPad marked "Found". A tap on a card shows it big, its name read aloud.
   Nothing goes until the child taps "Let's go!": a soft puff, and "Tap an animal to follow its
   family." (The flip takes 6.5 s the first time, about 2 s for later stories in the session; a
   tap beside the cards turns the rest at once.) The animals wander from the start, but generation 1 begins
   only when the child taps an animal and follows its family (the tapped animal's ancestor 3
   generations back through the mother line, `src/families.js`), and names it.
   **"Where will your family live?"** (scope decision 70) is then the first choice: a card for
   each place, each with a real baby of the family that lives there, drawn in that place, and
   Marc's line ("This baby seems to prefer living near the water."). A place with no such baby
   yet says "Wait a generation.": the world runs on, fast, behind the sheet until each card has
   its baby, which also glows on the map; then the world waits for the child's choice, with no
   countdown, and nothing is picked for the child (scope decision 89). Choosing moves the line: it becomes the family's animals living there, and from then
   on a baby joins it only when it lives there too; the rest of the family are relatives. The
   world fast-forwards with a live counter, "Your Mossfoot line near the water: 2… 9… 40!", the
   camera holding the line in its new home, until about 20 live there (`PLACE_TO`, or
   `PLACE_MAX` generations); then back to real time, the camera on the new home. A place with
   plenty of room (under half of what it has room for, when its pairs have more babies) first says
   "Lots of room here!". Once some living there are crowded out, the first watched generation says
   "It's getting full. The best swimmers are winning." (climbers in the trees, runners on the
   ground), and another group's card there says, when that group lived there before the line came,
   "They got here first. Now webbed feet are starting to matter." The open ground
   usually has 20 of the family already: the line stays, with no fast-forward ("… 23!", "Watch
   your line."). The trait choices then happen in that place. If the line in the chosen place
   dies out, the sheet comes again; from the second time for the same place, "That place is hard
   for your Mossfoot family. Try another?", that place's card marked (scope decision 83). The
   teacher demo has no place choice.
2. **Glowing newborns** (scope decision 32). When a baby in your line is born with a new
   variation, it glows: the trait new in it at birth takes it past the line's usual (its median
   for that trait, plus or minus 0.12). At most three glow at once, the ones that can be followed
   first, then those whose trait helps or hurts in the line's place, then the newest, one per
   variation; nothing else flashes. The glow balance (scope decision 69): while a baby whose trait
   helps or hurts there glows or can, at most one glowing baby has a trait that doesn't matter
   there, and none of those starts to glow while such a baby still waits to light up. The engine makes a
   generation's babies at its tick, but on a watched day they appear on the map one by one over
   the first half of the day, and the glows start one at a time as they appear (scope decision
   50), each only with 6 s of its day left (scope decision 88). The log names each baby as it lights up; the line is underlined, and a tap on it (or on
   the caption beside the baby) flies there and opens its card. An arrow at the screen's edge
   points to a glowing baby off the screen (scope decision 49). Tapping one opens its card with
   "Follow animals with smaller eyes" (no number and no gate) and "Keep looking", which closes the
   card and leaves the glow on. Any trait in the line's place can be followed, one that doesn't
   matter there too, with no hint (scope decision 65); the card explains instead for the way back from a trait the line already chose
   (unless the line clearly died off that way: "Chunkier bodies are doing better up here. Go
   back?"). As long as the line is alive, its glowing babies can be followed, however small it is
   (scope decision 91).
3. **Following a line** (scope decisions 66–68). The first tap follows a family. A follow
   narrows it to a line: its animals with the trait in its place ("3 of your Mossfoot line have
   bigger eyes."). From then on a baby joins the line when a parent is in it and it inherited
   every trait the line keeps, the latest way on each one chosen (scope decision 72); after a
   follow on a trait that doesn't matter in the place, a relative's baby with them all joins too.
   The rest of the old line in its place, the line's babies that didn't inherit them, and their
   babies are "your relatives", drawn full size in a soft clay (`KIN_COLOR`); everyone else is
   small and grey. Only the line's babies glow, and the traits add up on "Your Mossfoot line so
   far", after the place chosen ("Near the water"); each animal of the line has each one, so none
   fades. A glowing trait that doesn't matter there also stands out from the whole world at the
   start: those traits decide which animal the line becomes. A trait that helps in the line's
   place and rose in it without a follow gets its own outlined chip, "Strong tail: chosen by the
   water", said once: "The water is choosing too." "Strong tails are winning here." (scope decision
   75). A trait the child chose that keeps going its way, one that helps there, says so on its own
   chip once the line is a whole variation further: "↑ More webbing: still improving", said once:
   "Your line keeps getting more webbing." "You chose it, so it keeps going." (scope decision 97).
   "Your line" replaces "your family" from the
   place choice on, and the tree strip becomes "Your line, baby by baby" (`TREE_BETWEEN`), the
   baby on the chosen place's card its first step. Once a place is chosen, a baby of the line born
   in another place is a relative: the line always lives in one place (scope decision 70).
4. **The rising counter** (scope decisions 67 and 68). After a follow the world fast-forwards
   (2 s a generation, the Fast-forward badge, the world's edges warm) while the trait's count in
   the line rises, with one line that changes in place and a rising note: "Bigger eyes in your
   Mossfoot line: 2… 5… 7… 16… 29!". It stops at `RISE_TO` ("!"), as soon as the count stops
   rising or falls ("."), or after `RISE_MAX` generations; with 20 or more already, there is none
   ("Watch what happens to them."), nor with fewer than 3, nor after a follow on a trait that hurts
   there: that line is watched from the start, so a harmful decline is seen ("Watch what happens to
   it.", scope decisions 69 and 91). Meanwhile the camera holds the whole line in view, zooming out
   as far as needed, so no one of it dies off screen. Then "Back to real time. Watch your line.":
   the animals and the light ease back to their own pace over 1.8 s, and the camera goes back to
   the story's zoom.
5. **Watching, with the table's reason** (scope decisions 60 and 67). Each watched generation
   after a follow, the line bigger on a trait that helps there: "Your Mossfoot line with bigger
   eyes is growing." "Big eyes spot things across open ground."; smaller on one that hurts
   there: "Your Mossfoot animals with smaller eyes are dying off." and its reason. Otherwise the
   usual lines, with decision 60's reasons. The line's animals that died fade one by one across
   the day, each over 2.6 s with a soft light rising from it, and the camera goes to each unless
   it is well inside the view already (`herd.js` `LINE_FADE_MS`).
6. **Your line and your relatives here** (scope decision 67). The only comparison: two count
   rows with bars, since the latest follow (or since the child came back to the line): "Your
   Mossfoot line: 2 → 46", "Your relatives here: 38 → 63". In the generation panel (one speaker
   for both), in "Since your last choice" before each new follow (Next only, no countdown), on a
   relative's card, and at the ending. No twins, no rings and no scoreboard.
7. **See, guess, explain** (scope decisions 60, 62, 68 and 69). Once a follow's result goes the
   table's way, after at least a generation watched since its fast-forward, the world waits for a
   guess, when the result is a new Field Guide discovery on this iPad: "Why is your Mossfoot line
   with bigger eyes growing?" (clearly growing on a ✓), "Why are your Mossfoot animals with smaller
   eyes dying off?" (clearly dying off on a ✗), or "Why is your Mossfoot line doing about as well
   as your relatives?" (a "~" or a neutral trait). Three answers, the trait's line from the table in
   each place; then why, and the discovery. No countdown: the world waits for the guess, and the
   explanation waits for Next (scope decision 84). The narration never gives the reason first: it
   comes after the guess. A result the Field Guide already has is told instead, with no guess: "Your
   Mossfoot line is doing about as well as your relatives." and the trait's line. A sudden drop
   asks nothing: the generation's lines give its reason.
8. **Back to your line** (scope decision 68). When a followed line dies out, its last animals
   fade, the camera on them ("The last of your Mossfoot animals with smaller eyes are dying."),
   and the world waits; then its "Why?" right there: a guess ("Why did your Mossfoot animals with
   smaller eyes die out?") when a trait that hurts there is a new discovery, else why is told (the
   trait's line from the table; with "Other traits decided who made it." when it doesn't matter
   there; what else set them apart when it helps there; "Some were old and died."). Then "They
   didn't make it. Back to your Mossfoot line.": the line before is blue again, the camera on
   it. The follow doesn't count; if the line before is gone too, back again, to the line in the
   chosen place; if that is gone too, to the family, which chooses where to live again (scope
   decision 70). The story ends early only when the whole family is gone, with the died-out
   ending (kept, scope decision 69); with a place chosen that didn't happen in 540 measured
   stories, so its moments open in the teacher demo.

   **Nothing chooses for the child** (scope decision 89): there is no backup choice panel any
   more; glowing babies keep appearing for the child to choose from. **A stalled line** (scope
   decision 91): a tiny line that isn't growing, with no baby to follow glowing, says "Your
   Mossfoot line is very small." "Let's skip ahead until something happens." and fast-forwards,
   the whole line in view, until a baby glows, the line grows, or it dies out ("Your Mossfoot
   line: 1… 1… 3!", "Back to real time."). The third stall in a row isn't skipped through: "Your
   Mossfoot line isn't growing.", "Thicker fur doesn't matter much here." when the trait it
   followed doesn't matter there, and back to the line before, as when a line dies out. It is
   rare: lines that stall almost always grow or die out on their own.
9. **The camera.** Your line may spread across habitats. Every member stands in a soft glow,
   and "Back to my Mossfoot line" ("family" before the first follow) goes to its largest cluster.
   While the child watches, the camera gently keeps the whole line in the clear part of the screen,
   off the panels, the buttons and the narration, zooming out a little when it spreads, and it may
   go a little past the world's edge to do so (scope decision 92).
   **Leaves · Ground · Water** fly to a place, and on arrival the log sums it up: "Water's edge:
   113 animals, growing. Many have webbed feet." (scope decision 53). After a visit, a flight to
   a baby or a drag, the camera stays where the child put it until "Back to my …"; a follow
   still takes it to the line.
10. **Endings** (scope decisions 62 and 73). The story ends with the win, when the line fits its
    home (in its place, every trait the place requires at its helpful end, so no helpful variation
    is left: "Your Mossfoot line fits its home!"), at the story's length ("Your Mossfoot line
    survived 50 generations."), or when the whole line is gone. After the win, the first step
    celebrates: "You did it!", "Your Mossfoot line became swimmers, like a river otter.", what the
    child followed and why it helped, the animal's "Did you know?", and "Your Mossfoot line fits the
    water's edge now." "Almost any new change would make things worse." At the story's length short
    of it: "Your Mossfoot line is still changing." "Keep going next time?" and the animal it looks
    most like so far. A line that fits its home though the child followed nothing in the story is
    no win (scope decision 96): no celebration and no collection card, but "Your Mossfoot line
    looks like a river otter.", "The water did all the choosing." and "Can you choose yourself next
    time?", read aloud. Then four steps with Next: what happened
    (the start and the end drawn, the line baby by baby, the line and its relatives here, the
    traits chosen); your idea (a sentence to build, or your own words); check my idea (against the
    table, with a clue, the same trait in two places, and "Your last choice": its line beside its
    relatives here); and the reveal (the real animal the line became like, one of the
    collection's twelve, `docs/LINEAGE_REAL_ANIMAL_REVEAL.md`: the free traits the child chose
    decide it first; then its traits, the predictions and choices, the Field Guide and the story
    card); and the collection. On that last step, one way on (scope decision 82): "You've found 3
    of 12. Find another!" and "Find another animal!", a fresh game in a new world whose quick card
    flip shows which animals are still to find. The teacher demo keeps "Try another family" (the
    world as it is now; at the story's end, the same seed from generation 0) and "New world".
11. **The collection** (scope decision 74, `src/collection.js`). The twelve animals a line can
    become, four to a row and a row for each place: one becomes "evolved" on this iPad when a line
    becomes it at the win, and its card shows its picture (`animals/<id>.jpg`), name and place mark;
    the rest are mystery cards. "You've evolved 5 of 12." It is the ending's last step, with the new
    one marked "New!", and opens from a button on the start screen. It stays on this iPad; the
    teacher's "Start fresh" on the journal page clears it with the journal and the Field Guide.
12. **Read-aloud.** Every child-facing line has a small speaker (`speechSynthesis`,
    `src/speech.js`, a calm voice at rate 0.85). "20 → 31" is read as "from 20 to 31". Lines stay
    under about 12 words. No panel has a timer (scope decision 89).
13. **The creature card** (Step 3, scope decisions 21–23). Once the story has begun, tapping
    any animal opens its card; the world keeps running behind it. It shows whose the animal is
    ("In your Mossfoot line", "One of your relatives", "Not in your line"), its drawing, where it
    spends its time, a gentle line when a trait doesn't fit there, its ten traits in plain words,
    and the trait new in it at birth, glowing. For an animal that isn't yours, the card first sums
    up its family (for a relative: your relatives here) beside your line, how it is doing against
    yours, and up to three differences (scope decision 51). If the animal passes away while its
    card is open, the card stays and says so.
14. **The prediction journal** (Step 6, scope decisions 25, 28–31, 68 and 88, `src/journal.js`).
    After the child's first follow, once a story, before the fast-forward, one question: "What
    will happen?" (your line with the trait). Three or four answers, from `docs/LINEAGE_PREDICTION_QUESTIONS.md`: one
    reasonable answer from the table and common Grade 3 misconceptions. No countdown: the world
    waits until the child answers (scope decision 84). The next "Since your last choice" shows it beside what happened to
    that follow's line ("You thought it would grow. It died out."), and the ending lists it.
15. **The idle pause** (scope decision 90). After a minute with nobody touching the iPad while the
    world runs, it freezes, the animals, the generation, the narration and the camera, under
    "Still watching? Tap to keep going."; a tap goes on where it stopped.
    Nothing is ever called wrong, and there are no scores.

The child chooses whom to follow, never what mutates: following is observer state only.

**The drawings** (`src/creature.js`). One animal is drawn large from its real body genome as
layered 2D parts, and each of the ten traits changes something you can see: webbing between the
toes (pink skin, and wider, bigger feet), claw length and curve, a fluffier outline, back-leg
length, tail thickness, eye size, body shape from round to streamlined, coat colour from dark to
light, ears from rounded to pointed, and a coloured band on the tail tip. Values are continuous,
so siblings look related but not identical; the animal's id seeds small touches, so the same
animal always looks the same. A paper grain, a grain on the creature, soft edges and a wash in
the habitat's colour give it a painted, field-guide look.

**Variations** (`src/variations.js`). Every engine trait is a number from 0 to 1. A group's
usual form is its median for each trait. A member carries a variation when one trait is at
least `APART` (0.12) from that median, in one direction. Words come in three levels for each
trait (for example feet: no webbing, some webbing, webbed).

## The look (Step 5, part one)

"Golden hour, in gouache", from the Claude Design handoff in `design/v2/` (its README lists the
changes moment by moment). Visuals and motion only: every line of text, every rule and every
number is as it was.

- **A generation is one day** (`src/light.js`): dawn when it arrives, a golden afternoon, dusk,
  a soft night with fireflies, then dawn again. The day stands still at a choice point, is a
  morning before the story starts, and turns golden behind the ending (a blue dusk when the
  group died out). Pollen, glints on the water and now and then a bird's shadow.
- **The arrival:** morning mist lifts as the camera drifts down into the leaves and settles close
  on a family (see "Small screens and touch"). A tap on an animal still follows its family at
  once; a tap anywhere else lets the mist go.
- **The mood:** the light turns a little warmer as your group grows, a little cooler as it shrinks.
- **Your animals** are drawn last and brightest, lit from the sun's side (`src/herd.js`). Babies
  stay a little smaller beside their mothers for 7 s, and a death in your line fades gently with a
  soft light rising (scope decision 67).
- **A glowing newborn:** a ring of light opens with sparkles, then breathes. Beside it is the
  log's own line ("One of your babies was born with thicker fur."), with a speaker, but only
  for babies the log has named.
- **Panels** (`styles.css`): field-guide paper, and the Petrona and Karla fonts, served from
  `fonts/` (SIL Open Font License) so no font service is called. Speakers keep a 44 px hit area.
- **Smooth on an iPad:** the warm light and the vignette are drawn on a small canvas that the
  page stretches over the map (`#air`), not painted over the whole map each frame.

## Names, sound and motion (Step 5, part two)

- **The family's name** (`src/names.js`, word lists and rule in `docs/LINEAGE_FAMILY_NAMES.md`).
  Right after the first tap, before generation 1, time waits for "What will you call your
  family?": three names made from the family's habitat and the traits that stand out in it
  ("The Mossfoot family"), each with a speaker. It waits for the child's name: no countdown,
  and nothing is picked for the child (scope decision 89). The name then appears everywhere the child's animals are named:
  "Your Mossfoot family is smaller than last generation.", "Your Mossfoot animals with smaller
  eyes: 20 → 27", the ending title. Every new story asks again.
- **Sound** (`src/sound.js`): Web Audio, made in the browser, no sound files. A soft bed for the
  habitat on screen, crossfading as the camera moves: leaves and now and then a bird in the high
  leaves, a breeze over a low hum on open ground, waves at the water's edge. Quiet cues: a chime
  when a newborn glows, a note that rises with each count of the rising counter, a low tone for "In
  trouble", a falling tone as a followed line's last animals die, a warm chord for the reveal. Sound starts on the first tap;
  the button in the top-right corner turns it off and on, remembered on the device;
  `?sound=off` starts muted. **The idle sound** (scope decision 70): with nobody touching the
  iPad for 45 s (`IDLE_MS`), the newborn chime, which had come as often as every 4 s while babies
  lit up, comes at most once in 45 s; every cue and bed is at 0.4 of its level, and the birds
  sing a third as often. A touch brings it back.
- **Animals that move like animals** (`src/herd.js`): a small bob and nod with each step, now
  and then a flick of the tail, a pause to look one way and then the other, the head down while
  grazing. Babies still stay near their mothers. The motion has its own random numbers, so the
  animals' wandering and home spots are as they were.

## Small screens and touch

- **A phone** (a screen under 600 px high or wide, `styles.css`): the generation panel is a slim
  bar with the generation number, the sun on its bar and your group's count beside its dot. A
  tap opens the whole panel and another tap closes it. On an iPad the panel starts whole, and a
  tap folds it to the same slim bar (scope decision 92). On a
  short screen (a phone held sideways) the narration is smaller, so the line and its speaker
  take about a fifth of the screen at most; the hint sits beside the bar, or under it on a phone
  held upright.
- **Zoom** (`src/main.js`): two fingers pinch the map from 0.6× to 2.5×, around the spot between
  them. Panels, buttons and text never zoom, and neither does the page. One finger still drags
  and a tap still taps; a pinch never counts as a tap. Zoomed out, a tap reaches an animal from
  as far on the screen as at 1× (34 px from its middle, 46 px for a glowing newborn); zoomed in,
  a little farther (`Herd.hit`). The + and − buttons under the sound button zoom by a quarter;
  a card or a panel covers them. A trackpad pinch (ctrl and the wheel) zooms the map too.
- **The story's zoom** is 1× on an iPad and 1.25× on a phone, so an animal is about as big
  under a finger. "Back to my family" / "Back to my group" goes back to it.
- **The arrival** settles on the first family up to 1.5× closer than that, where the panels,
  the hint and the narration leave most of the family clear (`bestFrame`). The first tap goes
  back to the story's zoom, unless the child has zoomed.

## What is real

- Each engine birth adds a baby beside its mother (on a watched day, at its moment of the day).
  Each engine death removes an animal (on a watched day, your line's one by one across it: the
  engine took them all at the generation's tick). Each body mutation at birth big enough to see (0.12) can
  make a newborn in your group glow, under the calm rule (story.js); nothing else flashes.
- Each animal lives where its inherited time allocation puts it (`homeBand`, scope decision
  54): well inside one habitat, toward a border when it splits its time, by the waterline when
  it is nearly always at the water, and the most water-loving wade into the shallows now and
  then. Between generations the animals only wander, inside the habitat their time allocation
  gives them. The open ground is painted as grass and earth, with sand only where the water's
  edge meets the water.
- Every count on screen and in the log is read from the engine state.

`lineageGame` in the browser console is the live game. Each generation is also logged there.

## Design shortcuts (preparing Step 4)

`?moment=NAME` opens the game straight into one moment, in a real game state (scope decisions 27, 31, 34, 42, 44, 68 and 69). The moments are listed on `moments.html` (which the game does not link to), among them `rising`, `slowdown`, `growing`, `dying`, `line-dies`, `died-why`, `back-line` and `compare` for scope decision 68, and `watch-small`, `died-told` and `told` for scope decision 69. Each works with `?seed=` (and `?sound=off`) too. All are found in the default world, seed 13, but `same`, `back` and `told` in seed 2 and `go-back` in seed 16 (since Round 7's 12-second days) and the early endings in the teacher demo (`?demo=webbed`): `extinct` and `another-family` in its seed 13, `nearly-over` in its seed 13 too, with a 30-generation story. Round 4 added `choose-place`, `moving`, `arrived` and `filling` (scope decision 70), and Round 5 `stay` (choosing the open ground, scope decision 71), `win` and `still-changing` (decision 73; `still-changing` with `&length=25`), `collection` (74), `chosen-by-place` (75), the opening's `intro-flip`, `intro-found` and `intro-puff` (77; `intro-found` on an iPad that has evolved three animals), Round 6 `find-another` (decision 82) and `hard-place` (83, in seed 1), Round 7 `opening-waiting` and `opening-card` (93), `idle-pause` (90), `stall` (91, in seed 1), `branch-leaving` (91, in seed 104) and `folded-panel` (92), and Round 8 `did-all-choosing` (96) and `still-improving` (97, in seed 2); `try-another-place`, `choice` and `blocked` are retired. The moments turn the idle pause off while they reach their moment. A moment is played on a new iPad, with an empty Field Guide, unless it asks for a full one (`told`).

`src/moments.js` finds a story that reaches the moment, using observer runs on throwaway copies of the world. It then plays the game forward to it: tap, watch, the same choices, each watched day passed in half-second steps so the child acts at the same second. It changes nothing in the game or the biology. Screenshots of every moment are in `design/current/` (before Step 5) and `design/after/` (after it, with a phone held sideways too); `design/compare.html` shows them side by side.

## Smoke test

```bash
cd game && npm test
```
