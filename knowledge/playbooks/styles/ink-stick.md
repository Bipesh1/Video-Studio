# Ink Stick style playbook

Current best practice for the Ink Stick look, learned from real videos and Biku's feedback. The guide (`styles/ink-stick/guide.md`) is the binding rule set; this playbook says how to use it well. Read it before every video in this style. Keep it under 120 lines.

## Faces

- **Match the references' detail, not just their parts.** Every face uses the guide v4 sizes: eyes about 30% of head width and just overlapping, pupils small. Upper lids are shaded in the head's shadow tone with a thick curved edge. (L-0001, Biku)
- **Brows are two separate tapered strokes,** heavy at the inner end, fine at the tip. Angry brows curl at the tip; worried brows rise at the inner end. Never let them join into one V. (L-0001)
- **Frowns are wide with curled corners** (Reference B's threatening figure, the king). (L-0001)
- **Fear, as measured on Reference B:** the lower lids push up, shaded, with the pupils resting on them, and the upper lids stay wide open. The whole face tips about 11 degrees so the eye on the side the character looks toward sits lower. A wide gritted grimace fills the lower head. Add a sweat drop. (L-0001, L-0006, L-0007)
- **A gritted mouth is never an oval:** it is a wide bean, about 0.6 of the head, arching like a frown: a round bulb at the front corner, a waist, a taller back half. Two rows of big uneven teeth run right up to the lips, so the dark shows only at the corners. (L-0002, L-0006, Biku)
- **Brows must stay visible under hair.** If a new hair style or a raised brow hides them, raise the hairline. (L-0002, self-check)
- **Lines inside the face are thin and soft:** about 2.2% of head width in the soft feature gray (guide v6), the lid edge a little heavier. Only the head outline is bold. Pupils, brows and the mouth interior stay dark. (L-0004, Biku)
- **Compose the face for the feeling:** fear tips the face down toward the look direction, pupils rest on the raised lower lids, a crease hugs the lower outer side of each eye, the mouth sits low with a gap under the eyes. Angry gets big lidded eyes, thin hooked brows and a wide curled frown. (L-0003, Biku)
- **Stern eyes keep heavy brows sitting right on them** (the king). (L-0003)
- **In big close-ups, drop small forehead marks that could read as stray hair.** (look test, self-check)
- **Check faces side by side with the references** when a new expression is drawn: render a face match sheet, not just a contact sheet. (L-0001)
- **Both pupils are always fully visible.** Where the eyes overlap in a three-quarter view, the far pupil stops at the edge of the near eye. (L-0005, Biku)
- **Wrinkles are hand-drawn creases, never tally marks.** Each is a thin pen stroke (about 1.2% of the head at its fullest, guide v7), fine at both ends, with its own length and angle, following the curve of the eye or cheek it sits on. Use the `Crease` piece in `engine/src/face/crease.tsx`; never a plain even stroke. (L-0006, Biku)
- **In a three-quarter view the near eye overlaps the far eye,** and the brow over the far eye is short and sits right over it, so it never touches the head outline. (L-0006, measured)
- **Raised brows stay inside the head.** Surprised and horrified brows are lighter arcs; if a brow reaches the outline, lower it or lighten it. (self-check)
- **Measure, do not eyeball.** Before matching a face to a reference, enlarge the reference 8 times with a grid and read sizes, positions, tilt and line thickness in head units. Compare at the same head size (`npm run look-test -- --faces`). (L-0007, self-check)
