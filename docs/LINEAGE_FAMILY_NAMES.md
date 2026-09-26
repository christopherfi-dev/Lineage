# LINEAGE — family names

*Step 5, part two (2026-09-26). The word lists and the naming rule, for Marc to check. The game builds every name from `game/src/names.js`; this page is written from that file, so the two always agree.*

## When a family is named

- **Right after the child's first tap**, before generation 1 starts. Time waits: the animals wander, the generation clock doesn't run.
- **The question:** "What will you call your family?" It has three tappable names, like "The Mossfoot family", each with a speaker.
- **If no name is tapped within 20 seconds,** one of the three is picked at random, and the sheet says "We picked a name for you." with a speaker. It stays up for about 3 seconds, then the story starts.
- **The countdown waits** while a line is being read aloud or a creature card is open, as on the other panels.
- **Every new story asks again:** "Try another family in this world" and "New world".

## The naming rule

A name is one word made of two halves: a word for the family's **habitat** (list 1), then a word for a **trait** that stands out in the family (list 2). Examples: Moss + foot = "Mossfoot", Reed + tail = "Reedtail", Sand + runner = "Sandrunner".

1. **Habitat:** the habitat most of the family lives in when it is tapped.
2. **Traits:** for each of the ten traits, how far the family's average is from the whole world's average at that moment. The three traits furthest from average give the three names, one trait each.
3. **Words:** each name takes a different first half from the habitat's list, and one of its trait's words. Which ones depends on the world (its seed) and the family, so the same family in the same world always gets the same three names.
4. **Two checks:** no name joins two of the same letter where the halves meet ("Leaffoot" is hard to read), and no name is on list 3.
5. **The random pick** at 20 seconds uses the browser's own random numbers, never the engine's.

## List 1 — habitat words (the first half)

| Habitat | Words |
|---|---|
| The high leaves | Moss, Leaf, Fern, Twig, Vine, Oak |
| The open ground | Sand, Stone, Grass, Clover, Meadow, Sun |
| The water's edge | Reed, Brook, Pebble, River, Ripple, Pond |

## List 2 — trait words (the second half)

| Trait | Words |
|---|---|
| Webbing between the toes | foot, paddle |
| Claws | claw, grip |
| Fur | fur, fluff |
| Back legs | runner, hopper |
| Tail | tail, swish |
| Eyes | blink, wink |
| Body shape | glide, dash |
| Coat colour | coat, cloak |
| Ear tips | tuft |
| Tail tip | tip, stripe |

## List 3 — names never made

- **Real small animals, not a family's name:** Grasshopper, Leafhopper, Sandhopper.
- **Same letter where the halves meet** (hard to read): Mossswish, Mossstripe, Leaffoot, Leaffur, Leaffluff, Twiggrip, Twigglide, Sanddash, Grassswish, Grassstripe, Cloverrunner, Meadowwink, Reeddash, Riverrunner, Ponddash.

## Every name the game can make (324)

**The high leaves (106):** Mossfoot, Mosspaddle, Mossclaw, Mossgrip, Mossfur, Mossfluff, Mossrunner, Mosshopper, Mosstail, Mossblink, Mosswink, Mossglide, Mossdash, Mosscoat, Mosscloak, Mosstuft, Mosstip, Leafpaddle, Leafclaw, Leafgrip, Leafrunner, Leaftail, Leafswish, Leafblink, Leafwink, Leafglide, Leafdash, Leafcoat, Leafcloak, Leaftuft, Leaftip, Leafstripe, Fernfoot, Fernpaddle, Fernclaw, Ferngrip, Fernfur, Fernfluff, Fernrunner, Fernhopper, Ferntail, Fernswish, Fernblink, Fernwink, Fernglide, Ferndash, Ferncoat, Ferncloak, Ferntuft, Ferntip, Fernstripe, Twigfoot, Twigpaddle, Twigclaw, Twigfur, Twigfluff, Twigrunner, Twighopper, Twigtail, Twigswish, Twigblink, Twigwink, Twigdash, Twigcoat, Twigcloak, Twigtuft, Twigtip, Twigstripe, Vinefoot, Vinepaddle, Vineclaw, Vinegrip, Vinefur, Vinefluff, Vinerunner, Vinehopper, Vinetail, Vineswish, Vineblink, Vinewink, Vineglide, Vinedash, Vinecoat, Vinecloak, Vinetuft, Vinetip, Vinestripe, Oakfoot, Oakpaddle, Oakclaw, Oakgrip, Oakfur, Oakfluff, Oakrunner, Oakhopper, Oaktail, Oakswish, Oakblink, Oakwink, Oakglide, Oakdash, Oakcoat, Oakcloak, Oaktuft, Oaktip, Oakstripe.

**The open ground (107):** Sandfoot, Sandpaddle, Sandclaw, Sandgrip, Sandfur, Sandfluff, Sandrunner, Sandtail, Sandswish, Sandblink, Sandwink, Sandglide, Sandcoat, Sandcloak, Sandtuft, Sandtip, Sandstripe, Stonefoot, Stonepaddle, Stoneclaw, Stonegrip, Stonefur, Stonefluff, Stonerunner, Stonehopper, Stonetail, Stoneswish, Stoneblink, Stonewink, Stoneglide, Stonedash, Stonecoat, Stonecloak, Stonetuft, Stonetip, Stonestripe, Grassfoot, Grasspaddle, Grassclaw, Grassgrip, Grassfur, Grassfluff, Grassrunner, Grasstail, Grassblink, Grasswink, Grassglide, Grassdash, Grasscoat, Grasscloak, Grasstuft, Grasstip, Cloverfoot, Cloverpaddle, Cloverclaw, Clovergrip, Cloverfur, Cloverfluff, Cloverhopper, Clovertail, Cloverswish, Cloverblink, Cloverwink, Cloverglide, Cloverdash, Clovercoat, Clovercloak, Clovertuft, Clovertip, Cloverstripe, Meadowfoot, Meadowpaddle, Meadowclaw, Meadowgrip, Meadowfur, Meadowfluff, Meadowrunner, Meadowhopper, Meadowtail, Meadowswish, Meadowblink, Meadowglide, Meadowdash, Meadowcoat, Meadowcloak, Meadowtuft, Meadowtip, Meadowstripe, Sunfoot, Sunpaddle, Sunclaw, Sungrip, Sunfur, Sunfluff, Sunrunner, Sunhopper, Suntail, Sunswish, Sunblink, Sunwink, Sunglide, Sundash, Suncoat, Suncloak, Suntuft, Suntip, Sunstripe.

**The water's edge (111):** Reedfoot, Reedpaddle, Reedclaw, Reedgrip, Reedfur, Reedfluff, Reedrunner, Reedhopper, Reedtail, Reedswish, Reedblink, Reedwink, Reedglide, Reedcoat, Reedcloak, Reedtuft, Reedtip, Reedstripe, Brookfoot, Brookpaddle, Brookclaw, Brookgrip, Brookfur, Brookfluff, Brookrunner, Brookhopper, Brooktail, Brookswish, Brookblink, Brookwink, Brookglide, Brookdash, Brookcoat, Brookcloak, Brooktuft, Brooktip, Brookstripe, Pebblefoot, Pebblepaddle, Pebbleclaw, Pebblegrip, Pebblefur, Pebblefluff, Pebblerunner, Pebblehopper, Pebbletail, Pebbleswish, Pebbleblink, Pebblewink, Pebbleglide, Pebbledash, Pebblecoat, Pebblecloak, Pebbletuft, Pebbletip, Pebblestripe, Riverfoot, Riverpaddle, Riverclaw, Rivergrip, Riverfur, Riverfluff, Riverhopper, Rivertail, Riverswish, Riverblink, Riverwink, Riverglide, Riverdash, Rivercoat, Rivercloak, Rivertuft, Rivertip, Riverstripe, Ripplefoot, Ripplepaddle, Rippleclaw, Ripplegrip, Ripplefur, Ripplefluff, Ripplerunner, Ripplehopper, Rippletail, Rippleswish, Rippleblink, Ripplewink, Rippleglide, Rippledash, Ripplecoat, Ripplecloak, Rippletuft, Rippletip, Ripplestripe, Pondfoot, Pondpaddle, Pondclaw, Pondgrip, Pondfur, Pondfluff, Pondrunner, Pondhopper, Pondtail, Pondswish, Pondblink, Pondwink, Pondglide, Pondcoat, Pondcloak, Pondtuft, Pondtip, Pondstripe.

## Where the name is used

Everywhere the child's animals are named, once the family has its name. Before that, and in any line that doesn't name them, the text is exactly as it was. "Mossfoot" stands for the family's name.

| Where | Before | With the name |
|---|---|---|
| The log | "Your family is smaller than last generation: 7 animals now." | "Your Mossfoot family is smaller than last generation: 7 animals now." |
| The log | "Your group is bigger than last generation: 31 animals now." | "Your Mossfoot group is bigger than last generation: 31 animals now." |
| The log | "Your family is the same size as last generation: 12 animals." | "Your Mossfoot family is the same size as last generation: 12 animals." |
| The log | "Only five of your animals are left on the open ground." | "Only five of your Mossfoot animals are left on the open ground." |
| The log, and the caption on the map | "One of your babies was born with thicker fur." | "One of your Mossfoot babies was born with thicker fur." |
| The log | "Two of your babies were born with something new." | "Two of your Mossfoot babies were born with something new." |
| The log | "2 generations later: yours 23, the others here 20." | "2 generations later: your Mossfoot animals 23, the others here 20." |
| The log | "Most of your group now has webbed feet." | "Most of your Mossfoot group now has webbed feet." |
| The log | "Wait! Your family is getting very small." | "Wait! Your Mossfoot family is getting very small." |
| The log | "The last of your group has passed." | "The last of your Mossfoot group has passed." |
| The log | "Your group made it to the end of the story." | "Your Mossfoot group made it to the end of the story." |
| The card | "In your family" / "Not in your family" | "In your Mossfoot family" / "Not in your Mossfoot family" |
| The card | "Your family needs you. Stay with them?" | "Your Mossfoot family needs you. Stay with them?" |
| Count rows (corner panel, since, ending) | "Yours (smaller eyes): 20 → 27" | "Your Mossfoot animals with smaller eyes: 20 → 27" |
| Count rows (predictions, ending) | "Yours: 11 → 5" | "Your Mossfoot animals: 11 → 5" |
| Since, ending | "Your group grew because of its other traits." | "Your Mossfoot group grew because of its other traits." |
| The corner panel | "… · your family 21" | "… · your Mossfoot family 21" |
| The button | "Back to my group" | "Back to my Mossfoot group" |
| A prediction | "Will your new group grow or shrink?" | "Will your new Mossfoot group grow or shrink?" |
| A prediction | "Which will do better: yours or the others here?" | "Which will do better: your Mossfoot animals or the others here?" |
| A prediction's answers | "Yours. A sleeker body helps at the water's edge." | "Your Mossfoot animals. A sleeker body helps at the water's edge." |
| A prediction's answers | "Yours, because I picked them." | "Your Mossfoot animals, because I picked them." |
| A prediction's answers | "Yours. They'll grow webbed feet because they need them." | "Your Mossfoot animals. They'll grow webbed feet because they need them." |
| A prediction's answers | "Yours. A darker coat will help them." | "Your Mossfoot animals. A darker coat will help them." |
| A prediction's result | "You thought yours would do better. Yours did." | "You thought your Mossfoot animals would do better. Your Mossfoot animals did." |
| The ending title | "Your group survived 76 generations." | "Your Mossfoot group survived 76 generations." |
| The ending title, died out | "Their story lasted 60 generations." | "The Mossfoot group's story lasted 60 generations." |
| The ending | "Here's what your animals look like now." | "Here's what your Mossfoot animals look like now." |
| The ending | "Here's what your animals looked like." | "Here's what your Mossfoot animals looked like." |
| The ending | "Your group's traits" | "Your Mossfoot group's traits" |
| The ending | "Why do you think your group survived?" | "Why do you think your Mossfoot group survived?" |
| The ending | "Why do you think your group didn't survive?" | "Why do you think your Mossfoot group didn't survive?" |
| The ending | "You followed your family the whole story." | "You followed your Mossfoot family the whole story." |
| The reveal (every animal) | "Your animals became paddlers, a lot like a beaver." | "Your Mossfoot animals became paddlers, a lot like a beaver." |
| The reveal, died out | "Your animals were becoming a lot like a bushbaby." | "Your Mossfoot animals were becoming a lot like a bushbaby." |

**Unchanged:** "You're following a family of 12 animals in the high leaves." is said before the family has a name. Lines that don't name the child's animals stay as they were ("The others here", "Their story ended before the first choice.", "Your choice doesn't change the animals.").

**Longest lines with a name.** A name is one word, so most lines grow by one word. Four reach 13 or 14 words with the longest trait words:

- "One of your Mossfoot babies was born with less webbing between the toes." (13)
- "Your Mossfoot animals live between land and water, a lot like a capybara." (13)
- "Your Mossfoot animals. Less webbing between the toes helps at the water's edge." (13)
- "Most of your Mossfoot group now has a faint mark on the tail tip." (14; 13 without the name)
