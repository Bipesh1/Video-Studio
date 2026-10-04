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
