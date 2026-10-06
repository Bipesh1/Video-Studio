# Phase 2 report: characters and world

Phase 2 is finished (2026-10-06). The studio now has a library of people, moves, things and places to make stories from. Nothing in it needs a paid service or the internet.

## What to look at

| File                                                                                | What it is                                                                                                         |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `library/catalog/page-1.png` to `page-8.png`                                        | One picture of every piece in the library, with its name                                                           |
| `knowledge/golden/rig-*.png`                                                        | 31 check sheets: expressions, poses, clothes, costumes, hair, skin tones, ages, props, places, shot sizes and more |
| `engine/out/sandbox/story.mp4`                                                      | "The Golden Coin", 14 seconds: places, props, shot sizes, a title card (no sound yet)                              |
| `engine/out/sandbox/action.mp4`                                                     | The chase and fight, 14 seconds (no sound yet)                                                                     |
| `engine/out/sandbox/polish.mp4`, `moods.mp4`, `motion.mp4`, `walk.mp4`, `atmos.mp4` | Short clips of talking, mood walks, moves and backgrounds                                                          |
| `engine/out/sandbox/skirts-light.png`                                               | New: skirts, dresses, robes and the gown in eight leg positions                                                    |

## What the library holds: 184 pieces

- **People.** 8 skin tones, 11 hair styles, 7 hair colors, beard and moustache, 3 ages (child, adult, elder).
- **Clothes.** 11 everyday pieces that mix freely (tank top, shirt, trousers, skirt, dress, robe, cloak, hood, brimmed hat, sneakers, boots) in 10 cloth colors, and 4 costumes (ruler, soldier, queen, farmer).
- **Faces.** 14 expressions, a mouth that moves with the words, blinks, eye darts, smooth head turns.
- **Poses.** 15: stand, wave, point, shrug, hands up, hold, hands over mouth, sit, kneel, lie down, cross arms, look up, look down, cower, hug.
- **Actions.** 17: walk and four mood walks (proud, tired, sneaky, happy), run, carry, push, pull, jump, fall forward, fall backward, punch, swing, recoil, cheer, cry.
- **Effects.** 11: sweat (flying and resting), tears (streams and drops), anger mark, dizzy stars, exclamation mark, question mark, three dots, impact flash, motion lines.
- **Props.** 14 things to hold or stand in a scene: scepter, sword, shield, coin, bag, book (closed and open), lantern, cup, goblet, door, chair, throne, table.
- **Places.** 7: night street, day street, field, forest, castle, throne room, home interior. 6 color moods and 15 background shapes to build more.
- **Camera.** Wide, medium, close-up and over-the-shoulder shots; slow push-in, fast push-in, shake, pan, follow, fade.
- **Text on screen.** Captions, title card, labels.
- **Saved characters.** Three sample cards (a child, a farmer, a queen) that show how a character is kept the same across a series.

## Checks

| Check                                                      | Result                                                                                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every piece that can be pictured has its own saved picture | 171 of 171                                                                                                                                                       |
| Pieces with no picture of their own                        | 13: camera moves, shot sizes and on-screen text. They only make sense inside a shot, so they are shown on the `framing` and `titles` sheets and in the two clips |
| Nothing drawn is missing from the library list             | Passed                                                                                                                                                           |
| Searching the library by plain words finds the right piece | Passed                                                                                                                                                           |
| Automatic tests                                            | 265 of 265 passed                                                                                                                                                |
| Code checks (types, style, formatting)                     | All passed                                                                                                                                                       |
| Sound tools                                                | 16 of 16 voice checks passed, all sound tools present                                                                                                            |

## What changed because of your feedback

1. Brown, tan and cream cloth added; head size kept.
2. Eyes no longer double up when a head is partly turned.
3. The fight was re-cut so every action has a reason you can see, in one place, with a fade when time passes.
4. Hands now touch what they push; feet push from behind.
5. Shoes follow the leg in every position.
6. Skirts, dresses, robes and the gown now cover the legs wherever they are, so a sitting person's dress lies over the lap and hangs from the knees.

Each of these is written down as a lesson (L-0012 to L-0017) so later videos start from it.

## Known gaps

- Dress and robe hems, sleeves and most props do not flutter yet. Capes, cloaks and long hair do.
- Only the front arm punches or swings. There is no kick, block or two-handed swing yet.
- The mouth follows spelling, not sound, so oddly spelled words get an approximate shape.
- Rooms are seen straight on with one back wall.
- The crate and boulder in the action clip are plain blocks.
- Nine places from the plan are not drawn yet (harbor, battlefield, office, classroom, laboratory, courtroom, church, city skyline, space), along with a few moves (climb, write, read, row, salute, march) and extras (charts, maps, animals). They are drawn when a story first needs them and then stay in the library.
- No sound in the Phase 2 clips. Sound is Phase 3.

## Questions for you

1. Does the sitting dress look right now (`story.mp4`, the home scene, and the `skirts` sheet)?
2. Motion lines are black, so they are faint at night. Should they turn white on dark backgrounds? This would be a change to the style guide.
3. The `!`, `?` and `...` symbols are white with a black outline. Should `!` be red or gold?
4. Is any place or prop missing that your first videos will need?
5. Still open from Checkpoint 1: narrator and character voices, hair colors, fingers on hands that cover the face, and whether the frightened face is close enough.

## What comes next

Phase 3 is sound: music moods, sound effects, the mix and loudness. It starts when you ask.
