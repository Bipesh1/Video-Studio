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
L-0021 | 2026-10-06 | run: Moon Tax still (the king's opening shot)
Area: style | Scope: style ink-stick | Source: Biku
Lesson: Biku finds the outline a little heavy. Lines are a little thinner than the first guide
  said: outline about 3.25% of head width, stick limbs about 5.8% (guide version 11).
Evidence: Biku: "for the outer edges and line can we make it thinner", then "a little bit
  thinner since the thickness now is a little bit high in my opinion", "not too much thin".
  After seeing the first step (version 10, about a sixth thinner): "a little bit more thinner".
Applied: styles/ink-stick/guide.md and tokens.json version 11 (the guide is the authority;
  this entry only records why).
Note (Claude's reading): he asked for small steps, so this is not a move toward a thin-line
  style. The outline is now only a little heavier than the inner detail lines (about 2.75%);
  thinning it further would need the detail lines thinned too. Any further change is his to
  ask for.
Status: active
```
