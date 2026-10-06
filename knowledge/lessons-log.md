# Lessons log

Every lesson, dated, with evidence. Append only: entries are never deleted, only marked `merged`, `superseded`, `withdrawn` or `blocked` (Build Plan v5, Part 2, section 13).

```
L-0001 | 2026-10-03 | run: 2026-10-03-look-test (Checkpoint 1)
Area: faces | Scope: style ink-stick | Source: Biku
Lesson: Faces must carry the detail and curves of the references: bigger eyes that just overlap,
  eyelids shaded in the head's shadow tone with a thick curved edge, separate tapered brows with
  curls, wide frowns with curled corners, gritted teeth as two rows with dark corners, and thin
  worry, bag and chin lines where the emotion calls for them.
Evidence: Biku compared the look test with both references and said the angry face in the
  references is more realistic with its curves, and the frightened face has teeth we should match.
Applied: guide v4 (eyes 30% of head width, pupils 30% of the eye) and new face parts; face match
  sheet at runs/2026-10-03-look-test/out/face-match.png.
Status: active
```

```
L-0002 | 2026-10-03 | run: 2026-10-03-look-test (Checkpoint 1, round 2)
Area: faces | Scope: style ink-stick | Source: Biku
Lesson: A gritted mouth is never a plain oval. Draw it like Reference B: the upper lip arches
  high and rises toward one side, the lower lip is flatter, the mouth tilts; two rows of
  separate teeth, bigger at the front, meet on a wavy bite line with slanted gaps; deep black
  gaps at both corners; two short slanted chin strokes below.
Evidence: Biku compared our frightened mouth with Reference B and said ours was a simple oval
  while the reference mouth is drawn more realistically.
Applied: new grimace drawing in engine/src/face/Face.tsx; eyes moved up a little so the wide
  mouth fits; hairlines raised so brows stay visible.
Status: active
```

```
L-0003 | 2026-10-03 | run: 2026-10-03-look-test (Checkpoint 1, round 3)
Area: faces | Scope: style ink-stick | Source: Biku
Lesson: Strong faces are composed, not just assembled. Fear tips the whole face down toward
  where the character looks; eyes are big and overlapping with pupils resting on the bottom rim;
  bag lines hug the eye bottoms and wrap up the sides; brows are lighter arcs; the mouth sits low
  with a clear gap under the eyes. Angry uses big lidded eyes, thin hooked brows and a wide curled
  frown. Stern almond eyes keep heavy brows sitting right on them.
Evidence: Biku said our frightened face still was not like the reference and asked us to observe
  its curves closely.
Applied: face frame (tilt, scale, offset) per expression, brow weight, eyes moved up, bag lines
  that wrap, worry lines high on the forehead, cheek fold and wavy upper lip on the grimace.
Status: active

L-0004 | 2026-10-03 | run: 2026-10-03-look-test (Checkpoint 1, round 3)
Area: faces | Scope: style ink-stick | Source: Biku
Lesson: Lines inside the face are thinner and softer than the head outline: about 2.2% of head
  width in a soft dark gray, for eye outlines, lids, mouth, teeth and detail lines. Pupils, brows
  and the mouth interior stay dark so expressions still read on a phone.
Evidence: Biku said the head circle and the facial feature lines had the same thickness, while the
  references use thin lines for subtle features; then asked for them thinner and less dark still.
Applied: guide v5 then v6 (tokens face.featureLinePctOfHead 0.022, face.featureLineColor #3A3A40).
Status: active
```

```
L-0005 | 2026-10-04 | run: 2026-10-04-moon-tax
Area: faces | Scope: style ink-stick | Source: Biku
Lesson: A pupil must always be fully visible. In a three-quarter view the two eyes overlap, and a
  character looking toward the near side pushed the far eye's pupil under the near eye.
Evidence: Biku could not see the pupil in the king's right eye on the angry face in shot 3.
Applied: engine/src/face/Face.tsx stops the pupil at the edge of the overlapping eye;
  video re-rendered as moon-tax-v2.mp4.
Status: active
```

```
L-0006 | 2026-10-04 | run: 2026-10-03-look-test (face match sheet)
Area: faces | Scope: style ink-stick | Source: Biku
Lesson: Wrinkles and creases must look hand-drawn, like Reference B's frightened face, not like
  identical tally marks: thin strokes that are thicker in the middle and fine at both ends, each
  with its own length and angle, following the curve of the eye or cheek they sit on.
Evidence: Biku sent the frightened face from Reference B again and said the fixes so far are not
  satisfactory to the core, and our wrinkles are still not realistic.
Claude's reading of the gap (to confirm with Biku when it is built): our forehead, eye-corner and
  chin lines are equal parallel ticks of one thickness. The reference has two arcs under the eye,
  creases wrapping the outer eye, a cheek crease beside the mouth and fanned chin strokes. The
  reference shades the lower lids (pushed up, pupils sitting on the lid line) where ours shades
  the upper lids. Its features fill more of the head and its mouth is taller with bigger, uneven
  teeth.
Applied: 2026-10-04, after Biku said go and approved the rule change. Guide v7 and token
  face.creasePctOfHead 0.012; creases are tapered filled strokes (engine/src/face/crease.tsx);
  the frightened face is rebuilt from measurements of Reference B (lesson L-0007).
Status: active
```

```
L-0007 | 2026-10-04 | run: 2026-10-03-look-test (face match sheet, round 4)
Area: faces | Scope: style ink-stick | Source: self-check
Lesson: Measure the reference, do not eyeball it. Enlarge the face 8 times, lay a grid on it, and
  read sizes, positions, tilt and line thickness off the picture in head units. Then compare ours
  beside it at the same head size.
Evidence: Three rounds of eyeballing left the frightened face tipping the opposite way to
  Reference B, with the shading on the upper lids instead of the lower ones, a mouth a quarter too
  narrow, and wrinkles twice too thick. Measuring found all four in one pass.
Applied: afraid expression rebuilt from the measurements (tilt +11 degrees toward the look side,
  lower lids shaded, grimace 0.6 of the head wide, near eye over far eye); the face match sheet
  now draws our head at the reference's head size.
Status: active
```

```
L-0008 | 2026-10-05 | run: 2026-10-04-moon-tax (shot 1, moon-tax-v3)
Area: poses | Scope: style ink-stick | Source: Biku
Lesson: The body must agree with the way the head is turned. On a costumed body in three-quarter
  view the arm on the side the character faces is the far arm: it comes out from behind the
  chest. The other arm is the near one and hangs in front of the chest. No arm folds back or
  bends backward at the elbow, and a hand that holds something is a closed fist around it.
Evidence: Biku said the king looked weird: he faces forward but his arms are backward. The far
  arm was drawn over the chest with its elbow tucked back, the near arm was hidden behind the
  chest, the resting arm bent backward at the elbow, and the gripping fingers stuck out past the
  scepter like an open hand.
Applied: engine/src/rig/layers.ts (which arm passes in front of a wide chest, by view),
  naturalArm in skeleton.ts (a hanging arm bends forward once the body is turned), hold-object
  and point poses (arm reaches out, resting arm relaxed), Hand.tsx (the grip is a fist that hides
  the handle). Video re-rendered as moon-tax-v4.mp4.
Status: active
```

```
L-0009 | 2026-10-05 | run: Phase 2B sheets (clothes, costumes-b, ages, people)
Area: wardrobe | Scope: style ink-stick | Source: self-check
Lesson: Check headgear and hair on the figure, small, in three views. A hat's crown comes down
  over the top of the head with the brim just above the brows. A piece must read as what it is
  at phone size. Hair that falls down the back is drawn behind the whole body.
Evidence: On the first 2B sheets the soldier's round helmet with a brim read as a bowler hat,
  hats floated above the head, and long hair fell in front of one arm and behind the other.
Applied: the soldier wears a pointed helmet with a gold band over a mail coif; the brimmed hat
  sits on the head; HAIR_BEHIND_BODY in hair.tsx draws long hair before the body.
Status: active
```

```
L-0010 | 2026-10-06 | run: Phase 2C clips (polish, moods, motion) and the mouths sheet
Area: motion | Scope: style ink-stick | Source: self-check
Lesson: Judge motion on frame strips and test new motion on more than the calm face. Lay every
  second or fourth frame side by side; try a new mouth or body move on a happy, a sad and an
  angry face, in front, three-quarter and profile.
Evidence: The first cape never swung past the body, which the strip showed at once and the
  numbers alone did not. The new talking shapes looked right on the calm face but were thin
  slits on the sad and angry faces, and the wide shape would have run off a wide mouth.
Applied: CLOTH spring in engine/src/rig/follow.ts retuned; a talking mouth opens more on a frown
  and widens by a share of a calm mouth (Face.tsx); the mouths sheet shows all five shapes on
  four faces and three views.
Status: active
```

```
L-0011 | 2026-10-06 | run: Phase 2D action test clip (engine/out/sandbox/action.mp4)
Area: action | Scope: style ink-stick | Source: self-check
Lesson: Make a short clip that uses new moves together before calling them done. Moves that
  look right one at a time on a sheet still fail in a scene: at the changes between them, at
  the edges of the frame and against a moving background.
Evidence: Every move passed its strip sheet. The first clip then showed the background running
  out two screens into the chase, the guard off screen for most of it, characters too small to
  read, and stars cut off by the frame edge. A knee also sank into the ground in the trip, which
  a test for "nothing below the ground" caught before the sheet did.
Applied: endless backgrounds (Background.tsx); chainAt for moves in a row (chain.ts); the trip
  rebuilt as a tip over the feet (moves.ts); tests that no foot, knee or head goes under the
  ground in any move; the clip reframed with bigger characters.
Status: active
```

```
L-0012 | 2026-10-06 | run: Phase 2D action test clip, first cut (shot 2, the stand-off)
Area: faces | Scope: style ink-stick | Source: Biku
Lesson: A face must look right at every head turn, not only at front, three-quarter and
  profile. Turning from three-quarter to profile, the far eye narrows and is gone by three
  quarters of the way; the near eye slides to the front of the face and is the one eye of the
  profile. The two eyes never sit on top of each other.
Evidence: Biku: "the eyes look weird like two eyes". Both characters were held at a turn of
  0.8, between three-quarter and profile, where the old layout squashed the near eye onto the
  far one. A sheet of the faces at every step of the turn showed it from 0.6 to 0.9 on every
  expression.
Applied: eyeSlots in engine/src/face/layout.ts (tears read the same eyes); the turn-steps
  sheet; tests that the eyes never overlap by more than a sliver at any turn. Side effect: in
  profile the brow now slopes the right way round (an angry brow is low at the front).
Status: active
```

```
L-0013 | 2026-10-06 | run: Phase 2D action test clip, first cut
Area: story and staging | Scope: general | Source: Biku
Lesson: (1) What happens must make sense. Each action follows from the one before for a reason
  the viewer can see. After a punch a character may shrug it off, stagger or go down: all of
  these are fine, people can take punches. What reads as weird is a string of moves with
  nothing linking them. (2) One continuous story stays in one place at one time of day. The
  setting changes only when the story moves, and then a quick fade marks it. (3) Inside a
  scene, cut plainly and on movement, so the action carries over the cut. A clip made to test
  things must still make sense as a story.
Evidence: Biku: "when the soldier punches the thief he doesn't fall immediately he runs and
  falls that's weird" and "why did the surrounding changed from light to dark and the
  transition is weird too". The punched thief staggered, turned, ran off and tripped for no
  reason; the chase was in daylight and the fight at night, only to show two palettes
  (Claude's own choice, and the wrong one); the cut went from a guard in mid-jump to two people
  standing.
Corrected: Claude first wrote point 1 as "someone hit hard goes down on the blow". Biku
  corrected it the same day: "the fall doesn't always have to come with the blow since one can
  take punches. It looked weird because it made no sense, that's why I said it." The rule is
  about sense, not about falling.
Applied: the clip re-cut in engine/src/sandbox/part-h.tsx: one place and one afternoon; the
  fight shot opens on both still running; the punch knocks the thief down, which is one sensible
  outcome and not the only one; a quick fade (Fade in Camera.tsx) before the last shot, where
  time has passed.
Status: active
```

```
L-0014 | 2026-10-06 | run: Phase 2D action test clip, second cut (shot 3, the push)
Area: poses | Scope: style ink-stick | Source: Biku
Lesson: A character must really touch what it pushes, holds or leans on, and its feet must be
  where the effort comes from. Place the thing from the hands, so it meets them. In a push the
  palms are flat on the thing and the legs drive from behind the hips; in a pull the feet brace
  out in front. Check contact and feet in a close-up, not on a small strip.
Evidence: Biku: "the hand isn't touching the objects and the shoes also look weirdly
  positioned". The block was shorter than the height of the hands, so the fists hung in the air
  above its corner, and the feet took small steps bunched under the hips, so the body leaned
  hard with nothing driving it.
Applied: footOffset in engine/src/rig/walk.ts (push drives from behind, pull braces in front,
  a longer pushing step); both palms at the same distance, one above the other; the block
  stand-in is placed from the hands and reaches above them (sandbox/fixtures.tsx); tests for
  where the feet work.
Status: active
```

```
L-0015 | 2026-10-06 | run: Phase 2D action test clip, third cut (shot 3, the push)
Area: wardrobe | Scope: style ink-stick | Source: Biku
Lesson: A shoe is part of the leg, not a stamp at the end of it. Its upper part follows the
  shin, so the leg goes down into it. A foot on the ground stays flat only as far as an ankle
  bends; past that the heel or the toe lifts; a foot in the air is square to its shin; a shin
  lying forward on the ground points the foot straight back. Check shoes close up on every
  kind of leg pose, not only on a standing figure.
Evidence: Biku: "the shoes still look weird like they are not properly attached to the leg".
  Boots were always drawn standing upright and flat. On the slanted legs of the push the leg
  entered the boot at the toe and the upper stuck up empty behind it. The same fault was in
  every bent, lifted or lying leg since Phase 1; nobody had looked at shoes closer than a
  whole figure.
Applied: shoeFit and trouserEnd in engine/src/wardrobe/Footwear.tsx (the trouser leg ends
  inside the shoe wherever it sits; no part of a shoe goes under the ground); the shoes sheet,
  which shows the lower body close up in 24 leg poses; tests.
Status: active
```

```
L-0016 | 2026-10-06 | run: Phase 2E test scene (engine/out/sandbox/story.mp4)
Area: staging | Scope: style ink-stick | Source: self-check
Lesson: Build a scene once as a wide layout and get every closer shot from it with the camera.
  Then check each shot for the one thing it is there to show: if a head, a hand or a prop that
  matters is covered or cut off, move the camera or the near figure, not the story.
Evidence: The first over-the-shoulder shot of the girl showing her coin had the grandmother's
  head covering the coin, which was the whole point of the shot. The houses on the day street
  were also the green of the grass until they were looked at beside the road.
Applied: shoulderPlacement puts the near head low in a bottom corner (camera/Framing.tsx);
  street buildings take their tone from the paving (Background.tsx); the framing sheet shows
  one scene in all four shot sizes.
Status: active
```

```
L-0017 | 2026-10-06 | run: Phase 2E test scene (engine/out/sandbox/story.mp4), the home shot
Area: clothes | Scope: style ink-stick | Source: Biku
Lesson: Cloth lies on the body where the body is. A skirt, dress, robe or gown covers the legs
  wherever the legs go: over the lap and down from the knees of someone sitting, open with a
  stride, round a bent knee.
Evidence: Biku: "the dress doesnt cover the legs the grandma is sitting but the clothes is
  straight". Every skirt was one fixed shape hung from the hips, so on a seated figure it hung
  straight down through the chair while the bare legs stuck out in front. It had only ever
  been looked at on standing and walking figures.
Applied: drapeOverLegs and the three lengths in DRAPES (engine/src/wardrobe/cloth.tsx), used
  by the skirt, the dress, the robe and the queen's gown; the skirts sheet (four garments in
  eight leg poses); tests in engine/src/wardrobe/drape.test.ts.
Note (Claude's reading, not Biku's words): a new garment should be looked at on a sitting and a
  kneeling figure before it is called done, not only standing.
Status: active
```

```
L-0018 | 2026-10-06 | run: Phase 2 picture refreshes (sheets, library stills, catalog, clips)
Area: engine | Scope: all runs | Source: Biku
Lesson: The studio keeps its scratch files inside the project and deletes them when a command
  ends. Nothing it makes while working may pile up on another drive.
Evidence: Biku: "why is my local disk C memory rising up even though my project is in F, it is
  taking too much space". The renderer started a new hidden browser for every picture and left
  each one's profile folder, plus a built copy of the engine per command, in the Windows
  temporary folder on drive C: about 5,500 folders and 16 GB in four days, 3,300 of them on
  the day every picture was redrawn twice. Drive C was 95% full.
Applied: cli/src/scratch.ts (the temporary folder is .cache/tmp/<process id> in the project,
  deleted on exit; leftovers of a crashed command are deleted by the next one);
  cli/src/render.ts (one shared browser per command, used by sheets, library, look-test and
  short); tests in cli/src/scratch.test.ts.
Status: active
```

```
L-0019 | 2026-10-06 | run: Phase 3 sound test (runs/2026-10-06-sound-test)
Area: sfx | Scope: all runs | Source: self-check
Lesson: A low sound needs a part in the middle of the range, or a phone will not play it.
  A thud, a footstep or a blow is built from a low body plus a knock or slap between about
  200 and 4000 Hz.
Evidence: The first thud, footsteps and hit had almost all their energy below 200 Hz, which a
  phone speaker hardly reproduces. They measured on target and would have been silent for
  most viewers.
Applied: the knock, sole and slap parts in audio/src/studio_audio/sfx.py; a test that each of
  these effects keeps more than a fifth of its energy above 200 Hz.
Status: active
```

```
L-0020 | 2026-10-06 | run: Phase 3 sound test (runs/2026-10-06-sound-test)
Area: mix | Scope: all runs | Source: self-check
Lesson: Claude cannot hear. Sound is checked by measuring it (loudness, true peak, where the
  energy sits, how loud each instrument is against the others, how far the music is under the
  voice), and every sound report says plainly that it was measured and not listened to, so
  Biku knows the listening is his.
Evidence: The first music had the tune of one instrument 10 dB over everything else in four
  moods, and one tune rocked between two notes; both were found only by measuring each
  instrument alone and printing the notes. Two measuring mistakes also had to be caught: a
  picture of the sound with a stretched scale put every low sound in the wrong place, and a
  measurement that faded the start of each clip hid the very knock it was looking for.
Applied: runs/2026-10-06-sound-test/sound-test.md opens with the statement; npm run sound --
  check; the mix report (audio/mix.json) and mixProblems in shared/src/sound.schema.ts.
Status: active
```

```
L-0021 | 2026-10-06 | run: Moon Tax stills (the king, and Mira as a plain stick figure)
Area: style | Scope: style ink-stick | Source: Biku
Lesson: Biku prefers fine outlines to heavy ones. The outline of heads, clothes and props is a
  fine pen line, while stick limbs stay bold so plain figures read on a phone. When he asks
  for a change of look, show the choices side by side, on a costumed figure and a plain one,
  large and at phone size, and let him pick.
Evidence: Biku: "for the outer edges and line can we make it thinner", "a little bit thinner",
  "a little bit more thinner", then "can you make it pencil sketch thin so i can compare all
  the thickness". On the five-way comparison: "it looks better on number 5 for the king but
  for the plain its too thin". On the three mixes: "B is good".
Applied: styles/ink-stick/guide.md and tokens.json version 12 (the guide is the authority; this
  entry records why); props and motion lines that carried their own thickness now follow the
  tokens.
Note (Claude's reading): two small steps did not reach what he wanted; the side-by-side
  picture found it in one go. Thickness that is typed into a drawing instead of read from the
  tokens (four props had it) hides until the style changes.
Status: active
```

```
L-0022 | 2026-10-06 | run: 2026-10-06-honest-farmer (sample refine, step 4B)
Area: script | Scope: all runs | Source: Biku
Lesson: Alongside the narration, the stick figures speak for themselves, with words that come
  from the script provided. When a script reports what someone said, give that line to the
  character, in their own voice, with their mouth moving.
Evidence: Asked whether turning "his wife told him to keep the gold" into the wife saying it
  was all right, Biku answered: "yes like with narration the stick figures need to speak
  themselves based on the script provided".
Applied: knowledge/playbooks/general.md (script modes). The script and storyboard already
  carry a speaker and a voice for every line, and the speaker's mouth moves.
Note (Claude's reading, not Biku's words): in refine mode reported speech becomes a spoken
  line and the change is listed. In as-is mode no word may change, so only speech the script
  already quotes is given to the character, word for word. A character says only what the
  script says or reports they said; nothing is invented for them. He did not answer how much
  may be cut in a refine; the sample cut about a third.
Status: active
```

```
L-0023 | 2026-10-06 | run: 2026-10-06-honest-farmer, part 1 and part 2 stills (step 4D)
Area: shots | Scope: all runs | Source: self-check
Lesson: A closer shot shows only part of a person, so plan for what it cuts off. A thing
  standing on the ground is seen only in a wide shot; a thing in a hand is lost in a close-up;
  someone lying down and someone standing fit together only in a wide shot.
Evidence: The first stills built from the plan had the bag on the road cut off by a medium
  shot twice, the coin in Tomas's hand out of a close-up, and his wife cut off at the chest
  when a medium shot framed him lying down. The plan had passed every staging rule.
Applied: two new staging notes in checkPlan (shared/src/plan.ts); the builder keeps a thing
  someone looks at inside the frame when the shot is wide enough to hold it
  (engine/src/stage/layout.ts, shotFocus); the planning rules in the general playbook; four
  shots of the sample plan changed.
Status: active
```

```
L-0024 | 2026-10-06 | run: 2026-10-06-honest-farmer, part 1 (step 4D)
Area: engine | Scope: all runs | Source: self-check
Lesson: Look at the stills of every shot before rendering a video, and at frames of the video
  after. The builder was wrong in ways no check could see.
Evidence: In the first stills the walking figures floated above the ground with their legs
  out (the travel was taken off the body but not off the planted feet), the title sat on the
  face, and captions sized for a tall frame covered the middle of a wide one. In the first
  video the walker slid backward while the camera travelled. All four were plain at a glance
  on the sheet of stills and invisible to the tests.
Applied: npm run make writes a sheet of all the stills of a part (stills/sheet-<size>-<n>.png);
  the fixes are in engine/src/stage/ and the overlays; tests draw every shot of both worked
  storyboards in a tall and a wide frame.
Status: active
```

```
L-0025 | 2026-10-06 | run: 2026-10-06-honest-farmer, part 1 (the wide shot of Tomas with the bag)
Area: props | Scope: style ink-stick | Source: Biku
Lesson: A held thing must look gripped, not have a hand sitting in front of it. The part the
  hand closes round (a neck, a handle, a stem) is narrower than the fist and runs right through
  it, so the thing shows above the fist and below it.
Evidence: Biku: "its not being caught nicely the hands is in front of the bag". The bag's neck
  was shorter than the fist, so the fist covered it whole and sat on the bag's body. The same
  rule was already written for handles (L-0008: a handle shows only above and below the
  fist); the bag was drawn without it.
Applied: engine/src/props/Bag.tsx, version 2: a longer gathered neck with its origin where
  the hand holds, the cloth fanning out above the fist, the tie and the bag below. Prop
  sheets, the library still and the catalog redrawn.
Note (Claude's reading): every new prop that is held gets looked at in a hand, close up, on
  the props-in-use sheet before it is saved.
Status: active
```

```
L-0026 | 2026-10-06 | run: 2026-10-06-honest-farmer, part 1 (the wife's line "Keep the gold!")
Area: faces | Scope: style ink-stick | Source: Biku
Lesson: Whoever speaks moves their mouth, whatever face they wear. A face whose own mouth is
  open (shouting, laughing, wailing, surprised) closes and opens with the words too.
Evidence: Biku: "when the wife says keep the gold the mouth doesnt move". She wore the
  shouting face, whose mouth is already wide open. The talking shapes only took over when they
  opened the mouth further than the expression did, so on an open-mouthed face they never
  did, and the mouth stayed frozen open through the line. Frames cut from the video showed
  the same mouth in all twelve.
Applied: engine/src/face/talk.ts (talkAt says when a line is being spoken) and Face.tsx (an
  open-mouthed face that is speaking scales its own opening with the talking shape, never
  quite shut); tests in engine/src/face/talking-face.test.tsx. Part 1 rendered again (v4).
Note (Claude's reading): after a part is rendered, cut a run of frames of each speaker's face
  during their line and see that the mouth changes; a single still cannot show this.
Status: active
```

```
L-0027 | 2026-10-06 | run: 2026-10-06-honest-farmer, part 1 (the home scene)
Area: props | Scope: style ink-stick | Source: Biku
Lesson: A seat fits whoever sits on it, and a leg ends inside its shoe. Things a body rests
  on or wears are sized and placed from that body, not from the scene.
Evidence: Biku: "the daughter is not sitting properly on the chair and in the second pic the
  legs go through the shoes". The chair was drawn at an adult's size wherever the plan put it,
  so the child's hips were far below the seat and she sat inside its frame. The wife wears a
  dress, so her legs are bare stick lines; they ran to the sole, and since the outline became
  a fine line (guide version 12) their round ends showed as dots under the boots. While fixing
  it, the bag in the seated farmer's hand turned out to hang through the floor.
Applied: engine/src/stage/ShotPicture.tsx (a chair or throne stands under its sitter, faces
  their way and is the size of their body); engine/src/rig/Character.tsx (a bare leg ends
  inside the shoe, as a trouser leg already did); engine/src/stage/props.tsx (a hanging thing
  is lifted to rest on the ground) and a staging note for it; the home scene of the sample
  plan now stands the bag by the table. Tests for each. Saved library pictures retaken.
Note (Claude's reading): the shoe fault is the kind a change of style lets out. After any
  change to the tokens, look again at joins: hand on thing, foot in shoe, body on seat.
Status: active
```

```
L-0028 | 2026-10-06 | run: 2026-10-06-honest-farmer, part 1 (the opening shot, Tomas kneeling)
Area: poses | Scope: style ink-stick | Source: Biku
Lesson: A foot must look like a foot doing something. In a kneel the back foot has its toes
  tucked on the ground and its heel up, not laid out flat behind the leg.
Evidence: Biku: "look at the shoes and legs its weirdly positioned". The kneel pose laid the
  back shin flat along the ground, and a shoe on a flat shin is drawn in line with it, so the
  boot stretched out behind as one long shape. The pose had been drawn and checked on a plain
  stick figure with no shoes, where a flat shin looks fine.
Applied: engine/src/rig/poses.ts (the kneel's back shin slopes up to the ankle, so the shoe
  stands on its toe); the kneel still, the poses, shoes and skirts sheets and the catalog
  redrawn; part 1 rendered again (v6).
Note (Claude's reading): a pose is checked wearing shoes and clothes, not only as a bare
  figure, before it is saved.
Status: active
```

```
L-0029 | 2026-10-06 | run: 2026-10-06-honest-farmer, part 1 (seen in the whole part)
Area: motion | Scope: general | Source: Biku
Lesson: A character can change posture inside a shot, in one continuous motion: walk in and
  stop, stand up, kneel down, lift a thing, raise an arm, change face.
Evidence: Biku: "it cant change th eposture in continuos frames?". The engine could always
  do it, but the builder that turns a plan into a video gave each person one pose or action
  for a whole shot, so every change of posture happened on a cut and each shot was a held
  picture with only breathing and blinking in it.
Applied: shared/src/storyboard.schema.ts (a person in a shot has `then`: steps, each at a
  point of the shot, changing pose or action, face, where they look, what they hold);
  engine/src/stage/ShotPicture.tsx (plays them as one motion; someone who walks in stops on
  their own spot; the camera follows a beat behind so the body is seen to move); the shot
  list says them in plain words ("then kneels"); a staging note for a change of pose inside
  a close-up. Ten shots of the sample plan use it; part 1 rendered again (v8).
Note (Claude's reading): found by looking at the first try. With the camera locked to the
  head, standing up looked like the room dropping behind a still man, and a close-up hid the
  move altogether. Not every shot needs a step: a held picture is still right for a line
  that is about a face or a thing.
Status: active
```

```
L-0030 | 2026-10-06 | run: 2026-10-06-honest-farmer, part 1 (the first seconds: kneeling, picking up the bag)
Area: motion | Scope: general | Source: Biku
Lesson: When someone kneels and picks a thing up, we see it happen as one movement: the body
  goes down, the hand goes to the thing, they come up with it, facing the same way all
  through. It does not happen between two frames or on a cut.
Evidence: Biku on v8: "when it kneels and piks up he bag in first few secodn its direction
  changes and looks like the posture didnt change in continuos frames". Frame by frame he was
  right twice. The kneel took two frames, the style's quick snap. And the next shot cut to him
  standing somewhere else, facing the other way, the bag already in his hand.
Applied: styles/ink-stick/guide.md and tokens.json, version 13 (a move of the whole body takes
  10 to 16 frames; arms, heads and faces still snap); engine/src/rig/pose.ts (the body goes
  down and up smoothly with its feet on the ground and its knees bending forward);
  engine/src/stage/ShotPicture.tsx (a step that takes a thing standing in the shot reaches
  for it, closes the hand on it, and only then does it leave the ground); shared/src/plan.ts
  (the planner points out someone who turns round, gets up or jumps somewhere on a cut). The
  opening of the sample plan is now one action over two shots; two cuts of the same kind in
  part 2 were mended. Part 1 rendered again (v10).
Note (Claude's reading): L-0029 gave people steps, but I planned the opening as two separate
  pictures and looked at each shot, never at the cut between them. A strip of frames across
  every step and every cut that keeps someone on screen is part of looking at a part. How long
  a body move takes is one number; if Biku finds it slow or quick, show him three speeds side
  by side instead of guessing.
Status: active
```
