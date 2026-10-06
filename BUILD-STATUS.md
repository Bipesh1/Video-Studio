# Build Status

**Current phase:** Phase 2, steps 2A (library foundation), 2B (people), 2C (poses and motion polish) and 2D (action) done. Next step is 2E (world: places, props, framing), started only when Biku asks. Checkpoint 1 questions 2, 4 and 5 are still open.
**Next:** Biku watches the action test clip `engine/out/sandbox/action.mp4` and looks at the 2D sheets (below) and says what to change. Then 2E. The steps are listed under "Phase 2 steps" below.
**Last updated:** 2026-10-06

## Checkpoint 1: waiting for Biku

Review file: `runs/2026-10-03-look-test/checkpoint-1.md`. Questions: (1) how close the look is and what to change, (2) narrator and character voices, (3) head size (answered 2026-10-06: fine as it is), (4) hair colors (guide v3), (5) fingers on hands that cover the face.

**Question 1 (2026-10-04): Biku said not close enough yet, then said go.** Faces round 4 is built (section below, guide v7). Question 1 is open again: Biku needs to look at `runs/2026-10-03-look-test/out/face-match.png` and say whether the frightened face and the wrinkles are close enough now.

## Phase 2D. Action: done (2026-10-06)

Asked by Biku ("start 2D"). Characters can run, jump, fall and fight, with the effects and camera moves that go with it.

### Made

- **Ways of moving on foot** (`GAITS` in `engine/src/rig/walk.ts`): run (both feet off the ground between steps), carry, push, pull. They use the same planted-foot cycle as the walk, so no foot slides. Sneak was already there as the sneaky walk.
- **One-shot moves** (`engine/src/rig/moves.ts`): jump, fall forward (a trip), fall backward (a knock-down), punch, swing with something held, recoil from a hit. Each is a pose for the seconds since it began, starts from a stand, and holds its last pose. Each body part is on its own track of timed values. The moments that matter are exported (`PUNCH.hit`, `JUMP.takeoff`, `FALL.ground` and so on).
- **Moves one after another** (`chainAt` in `engine/src/rig/chain.ts`): sneak, then run, then jump. Each move starts where the last one left the body, with a short blend at each change.
- **Effects** (`engine/src/effects/`): tear streams and single tear drops, the red anger mark, dizzy stars, the symbols `!`, `?` and `...`, the impact flash and motion lines. Symbols never read backward on a character facing left.
- **Camera** (`engine/src/camera/Camera.tsx`): shake on an impact, fast push-in, pan. `shakeAt` gives the same jolt on every render.
- **Following camera:** `endless` on the `Background` makes hills, silhouettes and grass repeat for ever, so a camera can follow a chase. Found while making the clip: the scenery ran out after two screens.
- **Violence by implication only:** a hit is the swing, an impact flash over the point of contact, a shake and the other person's recoil. Nothing is wounded. Written into `moves.ts` and the playbook.
- **Library:** 150 assets (24 new: 10 actions, 9 effects, 4 camera moves, the chain), all with previews and golden stills where they can be pictured.
- **Sheets:** `moves-a`, `moves-b` (every move as a strip of moments) and `effects` (`npm run sheets -- --only=moves-a,moves-b,effects`), golden copies in `knowledge/golden/`.
- **Action test clip:** `engine/out/sandbox/action.mp4` (13.5 seconds, no sound; `npm run sheets -- --only=action --video`). A hooded thief is spotted, chased and caught by a guard. Shot 1: sneak, `!`, run, motion lines, a jump over a crate, following camera. Shot 2: stand-off with anger mark and sweat, punch, impact flash, shake, head squash, recoil, turn, run, trip, landing flash, dizzy stars, cheer. Shot 3: pushing a block in tears while the guard strolls behind, a pan and a fast push-in.

### Draw, look and fix loop

1. Moves: the trip pushed its knees into the ground (now the body tips over its feet like a felled tree, legs straight); falls slowed down before hitting the ground (they now speed up all the way and bounce); the swing's arm crossed the face on the wind-up (it now cocks back behind the head); the run sat too low.
2. Effects: symbols were cut off above the head and the dots read as rings (bigger, finer outline); stars and tear drops were too small.
3. Clip: the background ran out during the chase (endless backgrounds); characters were too small in the frame (head size 150 to 180); the guard was off screen for most of the chase; the dizzy stars were off the right edge.

### Acceptance (the part of Phase 2 that 2D covers)

| Check                                                 | Result                                                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Golden still for every new asset that can be pictured | Yes, 20 of 20 (camera moves have no still)                                                |
| Library search finds the new assets by tag            | Yes: "sprint", "knocked down", "dazed", "bawling", "starburst", "rumble", "chase"; tested |
| Planted feet never slide or sink in any move          | Yes, tested for every gait and move                                                       |
| No blood, wounds or gore                              | Yes: hits are shown by flash, shake and recoil only                                       |
| Tests, typecheck, lint, format                        | Pass (225 tests)                                                                          |

### Open after 2D

- **The crate, the boulder and the club are plain stand-ins.** Real props come in 2E.
- **Motion lines are black** (Style 3.7), so they are faint on night backgrounds. Changing that is a guide change.
- **Symbols are white with a black outline.** The guide gives them no color; say if `!` should be red or gold.
- **Clothes do not follow every move well.** The cloak covers a lying body like a blanket, and tabards and skirts do not flare in a jump.
- **Dizzy stars on someone lying down** are partly hidden by an outstretched arm.
- **Only the fighter's front arm punches or swings.** A two-handed swing, a kick and a block are not drawn yet.
- **Endless backgrounds repeat every 1.2 screens,** so one tree comes round again and again in a long chase. More varied scenery comes with the places in 2E.

## Biku's answers after 2C (2026-10-06): applied

Biku said: use the brown, tan and cream clothes, and the head size is fine.

- **Three cloth colors added** (guide and tokens version 9): brown `#7A4B2A`, tan `#C8A66E`, cream `#EEDFB8`, each with one shadow tone. They are in the accent list, so every garment, cloak, hat and head wrap can use them by name (`cloth: 'brown'`).
- **The farmer wears them:** green shirt, tan trousers, brown leather boots, straw hat (was navy trousers and steel boots). `costume/farmer` is version 2.
- **Head size is settled:** it stays as drawn, 0.29 of standing height. The guide said "about a quarter" while its own bone lengths gave 0.29; Style 3.1, Style Check question 5 and the `headToHeight` token now say 0.29. Nothing on screen changed except the speed-test scene, which read that token.
- **Library:** 126 assets (three new colors). Search finds them by "leather", "khaki" and "linen".
- **Sheet:** `villagers` (`npm run sheets -- --only=villagers`), golden copy `knowledge/golden/rig-villagers.png`. Checked on light and dark backgrounds and on skin tones 1, 2, 3, 4, 5, 7 and 8.
- **Found while looking:** tan cloth on a mid skin tone and brown on a dark one are close in color; the outline keeps them apart, but cream or a brighter color reads better there. In the playbook.

## Phase 2C. Poses and motion polish: done (2026-10-06)

Asked by Biku ("start 2c"). Characters have more ways to stand and sit, and they move less like cut-outs.

### Made

- **Eight poses** (`MORE_POSES` in `engine/src/rig/poses.ts`): sit, kneel, lie, cross arms, look up, look down, cower, hug. Their heights come from the bone lengths, so a later head-size change carries over.
- **Two actions** (`engine/src/rig/actions.ts`): cheer (bouncing, arms up in a V) and cry (hunched, shaking with sobs). Every action is listed by name in `ACTIONS`.
- **Four mood walks** (`WALKS` in `engine/src/rig/walk.ts`): proud, tired, sneaky, happy. Each is the same planted-foot walk with different numbers for speed, step height, bounce, lean, head and arms.
- **Wind-up and settle** (`poseAt` in `engine/src/rig/pose.ts`): a big move starts with a short wind-up the other way, snaps, overshoots a little while the hips dip, then holds. Small moves skip the wind-up. Hands and heads travel on arcs because joints turn.
- **Weight and breathing** (`withLife` in `engine/src/rig/life.ts`): during a hold the weight shifts slowly from leg to leg (planted feet stay put) and the arms move with the breath.
- **Eye darts** (`gazeAt` in `life.ts`) and **smooth head turns** (`turnAt` in `engine/src/rig/turn.ts`): turning to face the other way swings through the front view instead of flipping.
- **Follow-through** (`engine/src/rig/follow.ts`): loose things lag the body. The king's cape, the cloak and long hair trail a walk and swing on past when the body stops; the top of the held scepter tips back as the arm moves. A scene passes `sway={swayOf(...)}`.
- **Talking with five mouth shapes** (`engine/src/face/talk.ts`): closed, half, open, wide ("ee", top teeth showing) and round ("oo"). The mouth forms each word from its spelling, holds every shape at least two frames, and stays a little open in the short gaps inside a phrase. A scene passes `talk={talkAt(frame, fps, words)}`. This is **guide version 8** (Style 8 said three shapes).
- **Library:** 123 assets now (18 new: 8 poses, 6 actions, 4 motion pieces), all with previews and golden stills. The check covers every action.
- **Sheets and clips:** stills `poses-b` and `mouths` (`npm run sheets -- --only=poses-b,mouths`); clips `polish` (cape, hair and scepter follow-through), `moods` (the four walks) and `motion` (wind-up, turns, talking) with `npm run sheets -- --only=polish,moods,motion --video`. They land in `engine/out/sandbox/`.

### Draw, look and fix loop

1. Poses: the two hugging figures stood too far apart, the cheering arms met over the head instead of making a V, the cowering hands hid the face, and the lying figure ran off its cell. All fixed.
2. Follow-through: the first cape was too stiff and never swung past the body. Retuned so it trails a walk by about a seventh of a head and swings about half that far past when the body stops.
3. Mood walks: all four read on the first pass (frame strips of each).
4. Mouths: the open shape was a pointed drop on a small mouth (now a rounded U); the shapes were thin slits on frowning faces (a talking mouth now opens more on a frown); the "ee" shape ran off the face on wide mouths (it now widens by a share of a calm mouth, not of its own width).

### Acceptance (the part of Phase 2 that 2C covers)

| Check                                                    | Result                                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Golden still for every new asset                         | Yes, 18 of 18                                                                                            |
| Library search finds the new assets by tag               | Yes: "sneak" finds the sneaky walk, "cape swing" the follow-through, "turn around" the head turn; tested |
| Feet stay planted through weight shifts and pose changes | Yes, tested                                                                                              |
| Loose parts come to rest when the body stops             | Yes, tested                                                                                              |
| Tests, typecheck, lint, format                           | Pass (152 tests)                                                                                         |

### Open after 2C

- **Head size:** answered on 2026-10-06, it stays (see the section above).
- **Guide version 8** changed "three mouth shapes" to five. It was built under the agreed motion polish scope ("more mouth shapes for talking"); Biku should say if the talking looks wrong.
- **The mouth reads spelling, not sound.** Lips meet on m, b and p, round on o and u, open on a. Words spelled oddly ("one", "though") get an approximate shape. Kokoro could give real sounds later if this is not good enough.
- **Wide frowning mouths** (the angry face) open only a little on the half and "ee" shapes.
- **Only capes, cloaks, long hair, ponytails and the scepter swing.** Dress and robe hems, sleeves and other props do not yet.
- **The sneaking figure's cloak** lies along the bent back instead of hanging straight down.
- **The example videos** (`LookTest.tsx`, `MoonTax.tsx`) now use the new talking shapes. The delivered files are untouched; a new render would get a new version number.

## Phase 2B. People: done (2026-10-05)

Asked by Biku ("start 2B"). Ordinary people can now be dressed, aged and saved.

### Made

- **Tier 1 clothes** (`engine/src/wardrobe/garments.tsx`): tank top, shirt (long or short sleeves), trousers, skirt, dress, robe, cloak, hood, brimmed hat, sneakers, boots. Mixed freely with `outfitFrom({ top, bottom, onePiece, shoes, hat, cloak })`. Shapes measured from the clothed figure in Reference B.
- **Cloth colors** (`engine/src/wardrobe/cloth.tsx`): white plus the seven token accents, by name. In clothes data the field is called `cloth`, never `color`, so the guard against hand-typed colors stays strict.
- **Three costumes** (`engine/src/wardrobe/costumes/`): `SOLDIER` (pointed helmet with gold band over a mail coif, crimson tabard, steel plates), `QUEEN` (navy gown to the ground, gold belt and hem, low crown of three arches with pearls, white gloves), `FARMER` (green shirt, navy trousers, boots, straw hat, built from the tier 1 garments).
- **Long hair** (`hair/long`), drawn behind the whole body.
- **Ages** (`age` on the Character): `child` shrinks the body to 0.78 under a full-size head; `elder` stoops (less from the front, fully in profile) and gets permanent face creases; `adult` is the default.
- **Rig support:** `hipSpread` (trouser legs hang from hips set apart, planted feet stay put), short sleeves, a sneaker style in `Footwear.tsx`.
- **Character cards:** schema in `shared/src/character.schema.ts`, `castFromCard` in `engine/src/wardrobe/cast.ts`, three sample cards in `characters/` (a child, an adult, an elder), `npm run library -- characters`, and saved characters show up in `search`.
- **Library:** 105 assets now (18 new: 11 clothing, 3 costumes, long hair, 3 ages), all with previews and golden stills; the check covers garments, costumes and ages. Catalog is 5 pages.
- **Sheets:** `clothes`, `costumes-b`, `ages`, `people` (`npm run sheets -- --only=clothes,costumes-b,ages,people`), golden copies in `knowledge/golden/rig-*.png`.

### Draw, look and fix loop

1. First pass: all four sheets rendered; clothes, queen, farmer and child read well at once.
2. Fixed: the soldier's kettle helmet read as a bowler hat (now a pointed helmet over a mail coif); hats floated above the head (crown now comes down over the head, brim just above the brows); the elder leaned sideways in the front view (stoop now grows with the turn); long hair fell over one arm (now behind the body); the queen's crown was too small.
3. Checked every new outfit in front, three-quarter and profile for which arm is in front (lesson L-0008), and the clothes sheet at phone size.

### Acceptance (the part of Phase 2 that 2B covers)

| Check                                                         | Result                                                                                       |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Golden still for every new asset                              | Yes, 103 of 103 that can be pictured                                                         |
| Library search finds the new assets by tag                    | Yes: "guard helmet" finds the soldier, "grandmother" the elder, "jeans" the trousers; tested |
| All eight skin tones and the hair styles checked with clothes | Yes, on the `people` and `identity` sheets                                                   |
| Character cards load and draw                                 | Yes, three samples; a card naming something unknown fails in plain words                     |
| Tests, typecheck, lint, format                                | Pass (119 tests)                                                                             |

### Open after 2B

- **Head size:** closed on 2026-10-06. Biku said it is fine; it stays at 0.29.
- **Cloth colors were few:** closed on 2026-10-06. Biku asked for brown, tan and cream; they are in guide version 9.
- **Black brows on the two darkest skin tones** still have low contrast (known since Phase 1).
- **A child's limbs are thinner** than an adult's at the same head size, because the whole body shrinks. It reads as a child; say so if it looks too thin.
- **Soldier hands** are plain black mittens; steel gauntlets would need a new hand style.
- **Legs** still use the fixed order (back leg behind, front leg in front). It looked right on every 2B outfit.
- **Sample cards** in `characters/` are examples only. Biku decided characters are not saved by default.

## Phase 2A. Library foundation: done (2026-10-05)

Asked by Biku ("start phase 2A"). Everything already drawn is now listed, searchable and pictured.

### Made

- `library/index.json`: 87 assets, each with an id (`<kind>/<name>`), a plain description, tags, the code file and exported name, a `use` hint, a golden still path, a version and a date. Schema and search in `shared/src/library.schema.ts`.
- `npm run library -- search | list | show | look | stills | catalog | check` (`cli/src/library.ts`).
- `engine/src/library/`: one preview drawing per asset (`previews.tsx`), and the pages that render them (`LibraryAsset`, `LibraryLook`, `LibraryCatalog`).
- Golden stills for the 85 assets that can be pictured, in `knowledge/golden/assets/`. The camera move and the captions have none: they are judged in a shot.
- `library/catalog/page-1.png` to `page-4.png`: the picture catalog for Biku.
- `.claude/commands/draw.md`: `/draw <description>` runs the draw, look and fix loop and files the result in the library.
- The check (`engine/src/library/library.test.tsx`, also `npm run library -- check`): fails if an expression, pose, hand shape, hair style, hair color, skin tone, facial hair, palette, accent color, background treatment or silhouette exists without an index entry; if a costume, prop, effect, camera or overlay file has no entry; if an entry points at code or a still that is not there; or if a pictured asset has no preview.

### What is in the library now

rig 1, poses 7, action 1 (walk), motion 2, expressions 14, eye style 1, hands 3, skin tones 8, hair styles 10, hair colors 7, facial hair 2, costume 1, prop 1, effects 2, backgrounds 2, palettes 6, background elements 6, silhouettes 4, accent colors 7, camera 1, overlay 1.

### Acceptance (the part of Phase 2 that 2A covers)

| Check                                               | Result                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Golden still saved for every asset                  | Yes, 85 of 85 that can be pictured                                                                                             |
| Library search finds assets by tag                  | Yes: "king" finds the ruler costume, "scared" the afraid face, "night violet" the dusk palette; tested                         |
| The check fails on an unindexed piece               | Yes, tried with a dummy prop file                                                                                              |
| `/draw` exists and follows current Claude Code docs | Yes; custom commands in `.claude/commands/` still work and are the same as skills (checked in the official docs on 2026-10-05) |
| Tests, typecheck, lint, format                      | Pass (104 tests)                                                                                                               |

### Not done in 2A

- **Head size.** The step was to apply Biku's answer, and there is no answer yet. Heads stay at 0.29 of standing height. Changing it later means re-checking every pose, so it should be settled before 2C.
- **`characters/`** is still empty. Character cards are part of 2B.

## Feedback on the king's arms (2026-10-05): applied

Biku said the king in the moon video looked weird: he faces forward but his arms are backward. Lesson L-0008.

- **What was wrong:** the head was turned three-quarter but the body was layered as if turned the other way. The far arm was drawn over the chest with its elbow tucked back, the near arm was hidden behind the chest, the resting arm bent backward at the elbow, and the gripping fingers stuck out past the scepter.
- **Made:** `engine/src/rig/layers.ts` (`armLayers`: which arm passes behind, in front of the chest, or on top, by view) used by `Character.tsx`; `naturalArm` in `skeleton.ts` (a hanging arm bends forward once the body is turned three-quarter or more; front-view poses keep mirrored arms); `hold-object` reaches out (0.92, 0.46) with a relaxed resting arm, `point` got the same resting arm; the grip in `Hand.tsx` is a closed fist that hides the handle.
- **Reframed for the longer reach:** the king moved a little in three moon video shots and in look test shot 1.
- **Checked on:** costume, hands, poses and turns sheets, and the stills of both videos. Golden stills re-saved. `moon-tax-v4.mp4` is the new version; `look-test-round4.mp4` keeps the previous look test video.
- **For Phase 2:** every new costume and every new pose must be checked in front, three-quarter and profile for which arm is in front. Legs still use the old fixed order (back leg behind the skirt, front leg over it); it has not looked wrong so far, but check it when trousers and skirts arrive in 2B.

## Checkpoint 1 feedback, round 4 (2026-10-04): applied

Biku sent Reference B's frightened face again: the fixes had helped, but the face was still not like the reference and the wrinkles did not look real. Biku approved loosening the guide's rule against tapered lines. Lessons L-0006 (Biku) and L-0007 (self-check: measure, do not eyeball).

- **Method:** the reference face was enlarged 8 times with a grid and measured in head units; ours was compared at the same head size.
- **What measuring found:** our face tipped the opposite way to the reference; the shading was on the upper lids, the reference has it on raised lower lids; the grimace was a quarter too narrow and lens-shaped; wrinkles were about twice too thick and all alike.
- **Made:** `engine/src/face/crease.tsx` (tapered filled strokes: `Crease`, `TaperedStroke`), token `face.creasePctOfHead` 0.012 (tokens and guide version 7). In `Face.tsx`: worry ticks, under-eye creases, cheek, chin, strain and mouth-corner creases are all tapered and unequal; a closed mouth line thins toward its corners; `lowerShaded` lower lids with the pupil resting on them; the near eye is drawn over the far eye; the far brow is short; a wide mouth is pushed back to fit inside the head; a new grimace shape measured lip by lip.
- **Expressions changed:** `afraid` rebuilt (frame tilt +11, lower lids 0.25 shaded, brows light and sagging, mouth width 0.46). `surprised` and `horrified` got lighter brows that stay inside the head outline. `BROW_LEN` and `BROW_OUT` in `layout.ts` changed, so every brow is a little shorter and further out.
- **Look and fix:** three rounds on the face match sheet, then the expression, turn, identity and costume sheets and the stills of both videos. Golden stills re-saved.
- **Kept for comparison:** `out/face-match-round3.png` and `out/look-test-round3.mp4` in the look test run; the moon video got a new version, `moon-tax-v3.mp4`.
- **Still different from Reference B, by guide rule:** the mouth interior is dark maroon, not black; the sweat drop is one bold outlined drop, not two pale ones; face lines are soft gray, as Biku asked in round 3; heads stay perfect circles (the reference's jaw bulges around the mouth).

## Phase 2 scope addition (2026-10-04, agreed by Biku)

Biku asked for more lifelike motion and agreed to add a **motion polish** step to Phase 2, on top of the plan's list (Part 2, sections 7.3 to 7.7):

- Wind-up before big moves and overshoot-and-settle after them.
- Parts that lag behind: capes, hair and held objects swing and catch up after the body.
- Weight: leg-to-leg shifts, breathing, shoulders, heavier steps when tired.
- Livelier faces: eye darts, smooth head turns toward the speaker, more mouth shapes for talking.
- Walks with mood (proud, tired, sneaky, happy) and hands and heads moving in arcs.

Goal is "alive", not "realistic": it must still read as the snappy reference style. **Decided by Biku (2026-10-04): starter set.** Phase 2 covers every category in the plan (poses, actions, clothes, hair and skin, character cards, effects, places, props, camera, on-screen extras, library index, `/draw`, motion polish) with a small, most-useful selection in each; the rest is drawn on demand during videos and saved to the library. Claude's reading of Biku's words; the exact selection is to be shown to Biku before building.

**Action is a priority (Biku, 2026-10-04).** The Phase 2 starter selection must include the action set, not leave it to on-demand drawing: run, jump, fall, fight (wind-up, swing, hit, recoil), push, pull, carry; impact flash, motion lines, dizzy stars; camera shake and fast push-in. Limits stay as the style sets them: violence by implication only, no blood or gore.

### Phase 2 steps (agreed split, 2026-10-04)

Each step ends with contact sheets for Biku, a commit and an update here. Start a step only when Biku asks.

- **2A. Library foundation: done (2026-10-05)** except the head-size answer, which Biku has not given yet. Was: apply Biku's head-size answer; `library/index.json` with every existing piece registered (tags, picture, code path); golden stills; the check that fails on unindexed pieces; `/draw`.
- **Faces round 4: done (2026-10-04).** Built ahead of 2A at Biku's go-ahead; see the round 4 section above. Waiting for Biku's verdict on the face match sheet.
- **2B. People: done (2026-10-05).** Was: Tier 1 clothes (shirt, tank top, trousers, skirt or dress, shoes, plain hat, hood or cloak, robe); costumes (soldier, queen or noble gown, villager or farmer); long hair; all skin tones and hair checked; age cues (child, adult, elder); character cards.
- **2C. Poses and motion polish: done (2026-10-06).** Was: sit, kneel, lie, cross arms, look up, look down, cower; cry, cheer, hug; wind-up and settle; lagging capes, hair and held objects; weight and breathing; eye darts, smooth head turns, more mouth shapes; mood walks; arcs.
- **2D. Action: done (2026-10-06).** Was: run, jump, fall, fight (wind-up, swing, hit, recoil), push, pull, carry, sneak; tears, anger mark, motion lines, impact flash, dizzy stars, symbols; camera shake, fast push-in, pan; a short action test clip.
- **2E. World.** Places (night street, day street, field, forest, castle and throne room, home interior); about 10 props (sword, shield, coin, bag, book, lantern, door, chair, table, cup); wide, medium, close-up and over-the-shoulder framing; title card and labels.
- **2F. Wrap-up.** Full contact sheets of everything, index complete, all checks passing, Phase 2 report.

Left for on-demand drawing: the other nine places, climb, write, read, steer, row, salute, march, turn out pockets, lean, hands on head, counters, charts, maps, animals.

## Extra: first short video, "The King Who Taxed the Moon" (2026-10-04, asked by Biku)

Biku asked for a short folktale of Claude's own. Written, drawn, voiced and rendered by hand, since the pipeline arrives in Phase 4.

- **Video:** `runs/2026-10-04-moon-tax/out/moon-tax-v1.mp4` (26.7 s, 1080x1920, voice and captions, no music or sound effects yet). Script and shot list in `runs/2026-10-04-moon-tax/script.md`.
- **Made:** `engine/src/compositions/MoonTax.tsx` (5 shots), `engine/src/compositions/shotPlan.ts` (shot times from any list of voice lines), `cli/src/short.ts` and `npm run short -- --run=<folder> --voice --stills --video` (reads `shots.json` in the run folder; each render takes the next version number, so nothing delivered is overwritten).
- **Reused:** the ruler costume and scepter, both background treatments, the walk, existing expressions. New for this video, kept inside the composition: a point-up pose for Mira and two king faces whose brows sit below the crown.
- **Look and fix:** raised brows hid under the crown, Mira's pointing arm crossed her face, a foreground bush covered the walker, the belt and glove sat behind the captions. All fixed before the render.
- **Measured:** -14.1 LUFS, peak -1.3 dB, 3.0 s of render per second of video.
- **Feedback (2026-10-04):** Biku could not see the pupil in the king's far eye on the angry face. Fixed in the face code for every character (lesson L-0005) and re-rendered as `moon-tax-v2.mp4`; v1 is kept. Biku also found the story not very immersive: a note for future scripts, no remake asked.
- **Version 4 (2026-10-05):** re-rendered as `moon-tax-v4.mp4` after the arm fixes above (lesson L-0008). v1 to v3 are kept.
- **Version 3 (2026-10-04):** re-rendered as `moon-tax-v3.mp4` with the round 4 faces (the king's worried close-up shows the new lower lids, grimace and creases). v1 and v2 are kept.
- **Limits Biku should know:** Mira and the villager are plain stick figures (no clothes or hair in default mode yet); voices are placeholders (narrator `am_michael`, Mira `af_heart`).

## Checkpoint 1 feedback, round 1 (2026-10-03): applied

Biku: the angry faces in the references are more realistic with their curves, and the frightened face has teeth; match them. Done:

- **Guide v4** (Biku's request): eyes 30% of head width (was 22%), pupils 30% of the eye (was 40%), eyes just overlapping. Guide text for eyes, eyelids, brows and detail lines updated; `tokens.json` version 4.
- **New face parts:** eyelids filled with the head's shadow tone and edged with a thick curved line; bags under the eyes; forehead worry lines; brows that taper harder and curl at the tip, kept apart; frowns with curled corners and a wobble; lower-lip and chin lines; gritted teeth as a box with two rows of teeth and dark corners; mouths scaled up to the references' width.
- **Expressions retuned:** angry, afraid, sad, determined, exhausted, horrified.
- **Face match sheet** (`npm run look-test -- --faces`): each reference face cropped beside ours. Three look rounds.
- **Lesson L-0001** in `knowledge/lessons-log.md`, and the first rules in `knowledge/playbooks/styles/ink-stick.md`.
- Look test, style match sheets and all golden stills re-rendered.

## Checkpoint 1 feedback, round 3 (2026-10-03): applied

Biku: the frightened face still was not like the reference (observe its curves); the face lines were as thick as the head outline, while the references use thin lines; then thinner and less dark still. Done:

- **Face frame:** an expression can tilt, scale and shift all its features. Afraid tips down toward where the character looks.
- **Afraid:** big overlapping eyes, pupils on the bottom rim, bags that wrap up the eye sides, lighter worried brows, worry lines high on the forehead, a low grimace with a wavy upper lip and a cheek fold.
- **Angry:** big lidded eyes, thin hooked brows, wide curled frown. **Stern eyes** keep heavy brows sitting right on them.
- **Guide v5 and v6:** face feature lines (eye outlines, lids, mouth, teeth, detail lines) now about 2.2% of head width in a soft dark gray (`#3A3A40`), thinner and softer than the head outline. New tokens `face.featureLinePctOfHead` and `face.featureLineColor`.
- Eyes moved up a little more on every face; face blends now return exact faces at their ends.
- **Lessons L-0003 and L-0004**; style playbook updated. Look test, sheets and all golden stills re-rendered. 75 tests pass.

## Checkpoint 1 feedback, round 2 (2026-10-03): applied

Biku: the gritted mouth was a simple oval; the reference mouth is drawn more realistically. Done:

- **New grimace drawing:** upper lip arching high and rising to one side, flatter lower lip, tilted mouth, two rows of separate teeth (bigger at the front) on a wavy bite line with slanted gaps, deep black corner gaps, slanted chin strokes. About twice as wide as tall.
- **Eyes moved up slightly** (face layout) so the wide mouth fits below them; **hairlines raised** on every hair style so brows stay visible; surprised and horrified brows lowered a touch.
- **Lesson L-0002** logged; style playbook updated.
- Look test, style match sheets, face match sheet and all golden stills re-rendered. 75 tests pass.

## Phase 1 part C. Voice, captions, look test: done

### Made

| Area              | Where                                                       | What it does                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Voice worker      | `audio/src/studio_audio/voice.py`                           | Kokoro behind a `VoiceProvider` interface. Speaks a voice script line by line with per-line voice, speed and pauses, trims model silence, aligns Kokoro's word timestamps to the script's words (keeping punctuation and _emphasis_), normalizes to -17 LUFS mono with a peak limiter. Writes `voice.wav` and `timings.json`. Falls back to estimated timings if a provider gives none |
| Voice contracts   | `shared/src/voice.schema.ts`                                | Zod schemas for the voice script and the voice track, with plain-language errors                                                                                                                                                                                                                                                                                                       |
| Captions          | `engine/src/overlays/`                                      | Pages of at most two short lines from word timings, breaking at sentences, pauses and speaker changes. Fredoka, white with a black outline, emphasized words gold, in the bottom quarter, popping in per page. Uses the `@remotion/captions` Caption type; the CLI also writes an `.srt`                                                                                               |
| Mouth movement    | `face/talk.ts`, `LookTest.tsx`                              | The speaking character's mouth cycles closed, half and open on that character's word timings only                                                                                                                                                                                                                                                                                      |
| Effects           | `engine/src/effects/Sweat.tsx`                              | Flying sweat drops (outlined light-blue teardrops with a white highlight, arcing out and fading) and a resting drop                                                                                                                                                                                                                                                                    |
| Camera            | `engine/src/camera/Camera.tsx`                              | Slow push-in toward a focus point                                                                                                                                                                                                                                                                                                                                                      |
| Look test         | `engine/src/compositions/LookTest.tsx`, `npm run look-test` | The 4-shot test with voice, captions and audio; shot lengths from the voice timings. Stages: voice, stills, video, match, audition                                                                                                                                                                                                                                                     |
| Style match sheet | `engine/src/compositions/StyleMatch.tsx`                    | Each test still beside both references with the Style Check answers from `runs/.../style-check.json`                                                                                                                                                                                                                                                                                   |
| Voice audition    | `runs/2026-10-03-voice-audition/`                           | All 20 American English voices saying the same two lines, loudness matched, with an index of start times and Kokoro grades                                                                                                                                                                                                                                                             |
| Font              | `engine/public/fonts/`                                      | Fredoka (SIL OFL 1.1), recorded in `LICENSES.md`                                                                                                                                                                                                                                                                                                                                       |

### Draw, look and fix loop

1. Shot 2 characters were small with faces mid-frame: bigger, horizon raised, faces in the upper third.
2. The close-up's raised arms became huge black hands in the top corners: arms down and the head enlarged to 39% of the frame so the hands fall out of frame; arms angled so they do not merge with the torso.
3. Shot 4 walker was small: enlarged.
4. The voice stem measured -21 LUFS because peak safety scaled the whole track down: replaced with a real peak limiter.
5. The video measured -13.3 LUFS and -0.9 dB peak because mono voice on two channels adds 3 LU: voice target -17 LUFS mono, ceiling -1.5 dB. Now -14.2 LUFS, -1.4 dB.
6. The captions file had a leading space on lines after the first; trimmed.
7. The style match sheet's summary ran off the page and a two-line title pushed the still down: layout fixed.

### Acceptance (Phase 1)

| Check                                | Result                                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| All rig and token tests pass         | Pass: 74 TypeScript tests, 16 Python tests                         |
| Every still passes the Style Check   | Pass except question 5 (head size), which needs Biku's decision    |
| Kokoro voice with word timings       | Pass: Kokoro 0.9.4 returns per-word timestamps; no Whisper needed  |
| Mouth movement                       | Pass: Tom's mouth moves only during his line                       |
| 15-second, 4-shot test               | `runs/2026-10-03-look-test/out/look-test.mp4`, 14.57 s, -14.2 LUFS |
| Style match sheet and voice audition | Done                                                               |

## Extra: wailing and horrified expressions (2026-10-03, asked by Biku)

Biku sent a new picture with two expressions and asked for them. Added:

- **Wailing:** eyes squeezed shut as > and < chevrons, stress lines on the forehead and at the eye corners, strained brows, a wide crying mouth with the upper lip arched up, top teeth and a tongue.
- **Horrified:** very wide eyes, tiny pupils, brows high and worried, small round mouth.
- **Hands-over-mouth pose:** both hands pressed over the mouth, both arms drawn in front of the face.
- New face parts usable by any expression: `squeeze`, `strain`, mouth `arch` and `tongue`. The tongue color is derived from the effects red, because the guide names no tongue color.
- Sheet `new-expressions` restages the picture on a daytime set. Golden still `knowledge/golden/rig-new-expressions.png`. 63 tests pass.

Not done, waiting on Biku: fingers on hands that cover the face (the picture shows spread fingers; guide v2 allows fingers only for holding and pointing, so this needs a guide change). The sweat drops and tears in the picture are effects, planned for part C. The sitting pose and the caveman-style tunic are Phase 2 items (pose library and wardrobe).

## Phase 1 part B. Backgrounds, costume, identity: done

### Made

| Area              | Where                          | What it does                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backgrounds       | `engine/src/backgrounds/`      | Simple (Reference B: flat sky, crescent moon, stars, flat ground, black bush with white curls, grass tufts) and atmospheric (Reference A: sky gradient, soft layered clouds with a lit edge, pulsing light rays, faint stars, far and mid hills, horizon haze, ground gradient, black foreground rock). No outlines. Blur only here |
| Layers and motion | `Background.tsx`               | Sky, stars and moon, rays, clouds, far hills, mid hills, haze, ground and tufts, near silhouettes, each shifting at its own depth when the camera pans. Clouds drift, stars twinkle, rays pulse within the token opacity range, grass sways. Deterministic from a seed                                                              |
| Palette roles     | `backgrounds/roles.ts`         | Maps each of the six token palettes to sky, ground, cloud, ray and depth colors. Far is lighter than mid, mid lighter than the ground. Moon and stars only on night palettes                                                                                                                                                        |
| Costumed ruler    | `wardrobe/costumes/ruler.tsx`  | Tier 2, original design: three-point crown with ball tips and a crimson gem, crimson cape with darker lining and a high flared collar, steel breastplate with gold buttons and belt, armor skirt, pauldrons, steel sleeves and boots with gold trim, white gloves. Four colors                                                      |
| Wardrobe system   | `engine/src/wardrobe/`         | Costume pieces attached to bones and drawn in the plan's order. Sleeves and trousers become outlined tubes. Every shape gets one hard shadow tone on the side away from the light                                                                                                                                                   |
| Scepter           | `engine/src/props/Scepter.tsx` | First real prop: gold shaft, crimson orb, one glint. The gripping glove wraps over it                                                                                                                                                                                                                                               |
| Identity mode     | `wardrobe/identity.ts`         | Eight token skin tones on head and hands; shadow 15% darker; a lighter rim on the lit side for tones 6 to 8. Hands become skin-filled and outlined                                                                                                                                                                                  |
| Hair              | `wardrobe/hair.tsx`            | Starter set of 10 styles: bald, short crop, fade, afro, locs, braids, straight bob, bun, ponytail, head wrap. Plus beard and moustache. Hair stays out of the face, and swings to the back of the head in three-quarter and profile views                                                                                           |
| Sandbox           | `npm run sheets`               | New sheets: simple scene, atmospheric scene, all palettes in both treatments, ruler in six poses, 12 identity portraits, hair at three turns. New video: atmospheric scene with a camera pan                                                                                                                                        |

### Draw, look and fix loop

Three rounds. Fixes made from looking at the stills:

1. Trouser tubes poked out under the boots as round knobs: the legs now end at the ankle inside the boot.
2. The ruler's collar hid behind the head: widened so it flares beside the jaw, like Reference A.
3. Clouds looked flat: taller blobs and a bumpier top.
4. The bush in the simple scene was too big and covered the character: smaller and cropped by the frame edge.
5. Beards covered the face up to the eyes: redrawn as jaw beards below the mouth.
6. In profile, short hair stopped at a level line and the hairline stroke crossed bare skin: hair now swings down at the back as the head turns, and the hairline is drawn only where there is hair, one outline wide.
7. The fade's sides read as a helmet: faded sides lightened toward the skin.
8. Day and interior palettes showed a moon and stars: those now appear only on night palettes.
9. The foreground rock had a flat bottom and a straight cut side during the pan: now a sloped mound running off the frame.

### Acceptance (part B)

| Check                                                                      | Result                                                                                               |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Backgrounds have no outlines (only white detail curls on silhouettes)      | Pass, all 6 palettes in both treatments                                                              |
| Light rays stay within the token opacity range                             | Pass                                                                                                 |
| Depth by value, quieter than characters on night palettes                  | Pass                                                                                                 |
| Parallax: layers shift by depth on a camera pan                            | Pass                                                                                                 |
| Eight skin tones, 15% shadows, rim only on the darkest three               | Pass                                                                                                 |
| Every hair style, with and without facial hair, at every head turn         | Pass (renders without errors)                                                                        |
| Ruler: tier 2, at most four colors, gloves, cape behind and crown in front | Pass                                                                                                 |
| No component uses a color outside `tokens.json`                            | Pass                                                                                                 |
| Typecheck, lint, format                                                    | Pass. 61 tests in total                                                                              |
| Style Check on every new still                                             | Pass, except question 5 (head size, open problem 1). Question 9 (caption area) passes on both scenes |

Golden stills added: `knowledge/golden/rig-bg-simple.png`, `rig-bg-atmospheric.png`, `rig-bg-palettes.png`, `rig-costume.png`, `rig-identity.png`, `rig-hair-turns.png`.
Files to watch: `engine/out/sandbox/atmos.mp4` (not in git; rebuild with `npm run sheets -- --video`).

### Render speed with real scenes

| Scene                                             | Seconds of render per second of video (1080x1920) |
| ------------------------------------------------- | ------------------------------------------------- |
| Phase 0 test scene                                | 1.5                                               |
| Motion sheet (one stick character)                | 1.7                                               |
| Atmospheric scene with the ruler and a camera pan | 4.9 to 5.3                                        |

A 2:30 atmospheric video would take about 13 minutes per size, so about 40 minutes for all three sizes. That is over the 30-minute run budget. The cost is mostly the cloud and ray blur. Plan for Phase 4: render blurred background layers once per shot as images and reuse them, and render the 9:16 size by default.

## Phase 1 part A. Rig and faces: done

### Made

| Area         | Where                                   | What it does                                                                                                                                                                                         |
| ------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rig          | `engine/src/rig/`                       | Skeleton from token bone lengths, poses as data, forward kinematics, draw order from the plan, line weights in head units so they scale with head size                                               |
| IK           | `rig/ik.ts`                             | Analytic two-bone IK for arms and legs. Poses can place a hand at a point or plant a foot on the ground line                                                                                         |
| Pose to pose | `rig/pose.ts`                           | Snaps in 5 frames (token range 3 to 6) with about 5% overshoot; feet stay planted during a snap                                                                                                      |
| Life         | `rig/life.ts`                           | Seeded blinks every 2 to 4 s, head sway, torso drift, breathing bob                                                                                                                                  |
| 6 poses      | `rig/poses.ts`                          | stand, wave, point, shrug, hands-up, hold-object                                                                                                                                                     |
| Walk cycle   | `rig/walk.ts`                           | Procedural, feet locked to the ground during stance, arc swing, hip dip, opposite arm swing                                                                                                          |
| Hands        | `rig/Hand.tsx`                          | Guide v2: resting mittens, gripping fist with four wrapped fingers, pointing finger. Bare (black with white finger lines) and gloved (white, outlined)                                               |
| Faces        | `engine/src/face/`                      | Round eyes with lids and pupils, stern almond eyes, tapered brows, line/open/O mouths with teeth. Front, three-quarter and profile turns. Pupils aim at a lookAt point. Features clipped to the head |
| Expressions  | `face/expressions.ts`                   | All 10 from Style 3.6 plus laughing and shouting, as data. Blend over 4 frames                                                                                                                       |
| Talking      | `face/talk.ts`                          | Closed, half and open mouth shapes from word timings (real timings arrive with the voice in part B)                                                                                                  |
| Character    | `rig/Character.tsx`                     | One component that draws a full character from a pose and a face                                                                                                                                     |
| Sandbox      | `engine/src/sandbox/`, `npm run sheets` | Contact sheets on light and dark backgrounds plus phone-size copies, a walk video and a motion video. Bundles once, about 40 s for everything                                                        |

### Draw, look and fix loop

Four rounds. Fixes made from looking at the stills:

1. Afraid mouth showed almost no teeth: teeth lines were too thick for the mouth size. Mouth made bigger, lines thinner, fewer teeth.
2. Happy lower lids were nearly flat: curved them up like a squint; lowered and narrowed the smile so it no longer touched the eyes.
3. Wave and hands-up arms crossed the face: the upper arm now goes out to the side first. A test guards this.
4. Gripping and pointing thumbs read as white rings, like holes: redrawn as wrapped finger bands and a thumb line, matching the king's glove.
5. A raised brow in profile poked past the head outline: all face features are now clipped to the head.

### Acceptance (part A)

| Check                                                     | Result                                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| IK reaches targets                                        | Pass (500 random targets, both bend directions, exact to 1e-9)                               |
| Feet stay on the ground line during the walk              | Pass (no sliding, no sinking, IK never clamps, always one foot down)                         |
| No component uses a color or weight outside `tokens.json` | Pass (source scan of `engine/src`)                                                           |
| Expressions follow the Style 3.6 table, blends never pop  | Pass                                                                                         |
| Typecheck, lint, format                                   | Pass. 40 tests in total                                                                      |
| Style Check on every sandbox still                        | Pass, except question 5 (see open problem 1). Questions 7 and 9 do not apply to these sheets |

Golden stills: `knowledge/golden/rig-expressions.png`, `rig-turns.png`, `rig-poses.png`, `rig-hands.png`, `rig-walk-strip.png`.
Files to watch: `engine/out/sandbox/walk.mp4` and `engine/out/sandbox/motion.mp4` (not in git; rebuild with `npm run sheets -- --video`).

## Phase 0. Setup: done

### Machine

| Item         | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| OS           | Windows 11 Pro 10.0.26200, 64-bit                             |
| CPU          | Intel Core i7-1065G7, 4 cores, 8 threads                      |
| Memory       | 15.8 GB total, only about 2 GB free while other apps run      |
| Disk         | 422 GB free on F: (project drive)                             |
| GPU          | Intel Iris Plus and NVIDIA MX230 (not used; rendering is CPU) |
| Admin rights | Not needed. Everything installed at user level through Scoop. |

### Tools

| Tool                                                | Version                                    | Source                                                      |
| --------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| Node                                                | 24.12.0                                    | already present at `F:\node.exe`                            |
| npm                                                 | 11.6.2                                     | already present                                             |
| git                                                 | 2.39.1                                     | already present                                             |
| uv                                                  | 0.12.22                                    | installed with Scoop                                        |
| Python (audio env)                                  | 3.11.3                                     | existing install, managed by uv                             |
| FFmpeg and ffprobe                                  | 9.0.2                                      | installed with Scoop                                        |
| espeak-ng                                           | 1.52.0                                     | installed with Scoop                                        |
| FluidSynth                                          | 2.6.1                                      | installed with Scoop (extras bucket)                        |
| Remotion                                            | 4.0.532                                    | npm, pinned exactly                                         |
| Kokoro                                              | 0.9.4 on CPU PyTorch 2.14.1                | uv, locked in `audio/uv.lock`                               |
| music21, scipy, numpy, pydub, soundfile, pyloudnorm | see `audio/uv.lock`                        | uv                                                          |
| Remotion agent skills                               | remotion-best-practices, remotion-captions | `npx skills add remotion-dev/skills` into `.claude/skills/` |

### Made

- Folder layout from Part 2 section 5, with `.gitkeep` placeholders.
- `CLAUDE.md`, `LICENSES.md`, this file, git repository with `.gitignore`.
- `styles/ink-stick/guide.md` (Part 3, verbatim) and `styles/ink-stick/tokens.json` (Style 12, verbatim).
- Reference images moved to `styles/ink-stick/reference/` as `reference-a-king.jpeg` and `reference-b-night-scene.jpeg`.
- npm workspaces `shared/`, `engine/`, `cli/`; Python project `audio/`. TypeScript strict, ESLint, Prettier, Vitest, pytest.
- `shared/src/tokens.schema.ts`: Zod schema for tokens, with valid and invalid tests.
- `engine/`: Remotion project with test compositions in all three sizes (9:16, 4:5, 16:9). The test scene takes every color and weight from tokens.
- `npm run doctor`: machine and tool versions. `npm run bench`: render speed.

### Acceptance

| Check                              | Result                                                           |
| ---------------------------------- | ---------------------------------------------------------------- |
| Every tool reports its version     | Pass (`npm run doctor`, `uv run python -m studio_audio.doctor`)  |
| `tokens.json` validates            | Pass (5 schema tests)                                            |
| A 5-second test video plays        | Pass. `engine/out/test-916.mp4`, 1080x1920, 30 fps, H.264, 5.0 s |
| TypeScript typecheck, lint, format | Pass                                                             |
| Python environment tests           | Pass (10 tests)                                                  |

### Render speed (test scene, concurrency 4)

| Measure                                         | Value                   |
| ----------------------------------------------- | ----------------------- |
| Fixed startup per render (bundle and browser)   | 16 s                    |
| Preview, half size                              | 0.47 s per video second |
| Final, 1080x1920                                | 1.53 s per video second |
| 2:30 video, one size, test-scene complexity     | about 4 minutes         |
| 2:30 video, all three sizes, realistic estimate | about 30 to 45 minutes  |

The realistic estimate assumes real shots cost about three times the test scene (more characters, blurred backgrounds, captions). Re-measure in Phase 1 with the look-test shots.

## Style changes since Phase 0

- **Guide version 9 (2026-10-06, asked by Biku):** brown, tan and cream cloth colors for ordinary people, and the head size wording now matches what is drawn (0.29 of standing height).

- **Guide version 8 (2026-10-06, under the Phase 2 motion polish scope Biku agreed):** talking uses five mouth shapes instead of three. Wide ("ee", top teeth showing) and round ("oo") join closed, half and open, and the mouth forms each word. `tokens.json` is version 8 with five names in `motion.mouthShapes`.

- **Guide version 7 (2026-10-04, asked and approved by Biku):** creases inside the face are fine tapered pen strokes, about 1.2% of the head at their fullest, each a different length and angle; tapering is allowed inside the face (brows, creases, the ends of a closed mouth line). The frightened face follows Reference B as measured. New token `face.creasePctOfHead`. Versions 4 to 6 (faces closer to the references, thinner and softer face lines) are described in the guide's version history.

- **Guide version 3 (2026-10-03, needs Biku's confirmation):** the guide names seven hair colors but gave no color values, and components may only use token colors. Added a `hair` block to `tokens.json` (black, dark brown, brown, auburn, blond, gray, white, each with one shadow tone). No existing rule changed. If Biku prefers other shades, only `tokens.json` and the Style 12 copy in the guide change.

- **Guide version 2 (2026-10-02, asked by Biku):** hands that hold or point show fingers, like the king's glove on the sword in Reference A. Resting hands stay mittens. Style Check question 11 added. `tokens.json` is now version 2 with a `hands` block. Phase 1 must draw both hand types and a gripping hand on a prop.

## Open problems and notes

1. **Head size: resolved (2026-10-06).** Biku said the head size is fine. Heads stay at 0.29 of standing height and the guide now says so (version 9).
1. **Face layout constants.** Eye width and pupil size come from tokens. Eye spacing, brow gap, mouth height and the head-turn shifts are named in `engine/src/face/layout.ts`, because tokens do not cover them.
1. **Effects: built in 2D (2026-10-06).** Sweat, tears, anger mark, dizzy stars, symbols, impact flash and motion lines are in `engine/src/effects/`.
1. **Clothing and hair still to build.** Tier 2 exists (the ruler). Tier 1 (tank top, jeans, sneakers) and the rest of the hair library (coils, twists, cornrows, curly, waves) come in Phase 2.
1. **Dark skin and brows.** On tones 7 and 8 the black brows have low contrast, as the guide accepts (eyes, teeth and the rim carry the face). Worth a look at Checkpoint 1.

1. **Render time is near the run budget.** All three sizes of a 2:30 video may exceed 30 minutes on this laptop. Options for Phase 4: render the 9:16 size by default and others on request, cache background layers, keep blur light.
1. **Low free memory.** About 2 GB free with other apps open. Render concurrency is capped by free memory, so closing other apps makes renders faster.
1. **Terminal paths.** Scoop added FluidSynth's folder and `ESPEAK_DATA_PATH` to the user environment. Terminals opened before the install do not see them. The CLI reads the current values from the registry (`cli/src/system.ts`), so studio commands work regardless. A new VS Code window also picks them up.
1. **Path with a space.** The project folder is `F:\Video Studio`. Every process call goes through the quoting helper `run()` in `cli/src/system.ts`. Never call `spawnSync` with `shell: true` and raw arguments.
1. **Imports in bundled code.** Remotion's bundler does not map `.js` suffixes to `.ts` files. Use extensionless relative imports in `engine/` and `shared/`.
1. **zod is pinned to 4.5.4** to match Remotion 4.0.532. Upgrade both together with `npx remotion upgrade`.
1. **Python is capped below 3.13** because Kokoro requires it and pydub uses `audioop`, which 3.13 removed.
1. **Kokoro word timings:** resolved. Kokoro 0.9.4 returns per-word start and end times. Loading the model takes about 1 to 2 minutes on this laptop; speaking the 15-second test takes about 1.5 minutes in all.
1. **Kokoro model files** are in the Hugging Face cache (about 600 MB with the grammar model). The spaCy English model is pinned in `audio/pyproject.toml` so it is never fetched at run time.
1. **Font chosen** (Fredoka, OFL). The SoundFont is still to choose in Phase 3.

## How to continue

Open Claude Code in this folder and paste:

> Read BUILD-STATUS.md and continue the build from where it stopped.
