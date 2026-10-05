# The collection's pictures

One picture per animal of the collection (scope decision 74), named by its id in `game/src/reveal.js`: `squirrel`, `sloth`, `koala`, `slow-loris`, `hare`, `arctic-fox`, `cheetah`, `jerboa`, `river-otter`, `seal`, `beaver`, `platypus`. Each is a JPEG, 400 × 300 (4:3), the animal centred, under 60 KB. The game shows the name and the place's mark itself, in its own style.

They are made from Marc's originals in `design/animals/` (made with Google Gemini; see `design/animals/CREDITS.txt`), which the game never loads: each original, 1024 × 1024, is cropped to 4:3 above the name written into it, then resized and saved at JPEG quality 80.

| id | original | crop (x0, y0, x1, y1) |
|---|---|---|
| squirrel | squirrel.jpeg | 0, 70, 1024, 838 |
| sloth | sloth.jpeg | 0, 56, 1024, 824 |
| koala | koala.jpeg | 0, 70, 1024, 838 |
| slow-loris | slow_loris.jpeg | 0, 82, 1024, 850 |
| hare | hare.jpeg | 0, 44, 1024, 812 |
| arctic-fox | arctic_fox.jpeg | 2, 0, 957, 716 |
| cheetah | cheetah.jpeg | 0, 30, 1024, 798 |
| jerboa | jerboa.jpeg | 0, 30, 1024, 798 |
| river-otter | river_otter.jpeg | 0, 70, 1024, 838 |
| seal | seal.jpeg | 0, 56, 1024, 824 |
| beaver | beaver.jpeg | 0, 56, 1024, 824 |
| platypus | platypus.jpeg | 0, 56, 1024, 824 |

To replace a picture, drop a new file in with the same name: no code changes. A missing one shows a clean card with the name and the mark.
