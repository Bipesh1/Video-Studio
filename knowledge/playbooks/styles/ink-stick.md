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

## Bodies and arms

- **The body agrees with the head.** When a costumed character is turned three-quarter, the arm on the side they face is the far arm and comes out from behind the chest; the other arm is the near one and hangs in front of the chest. Seen from the front, both arms hang beside the chest. The engine does this by view (`engine/src/rig/layers.ts`); check it on every new costume. (L-0008, Biku)
- **No arm bends backward.** A resting arm hangs a little behind the body and bends forward at the elbow. An arm that holds something out reaches forward with the elbow ahead of the shoulder, like the king's sword arm in Reference A, never folded back against the body. (L-0008, Biku)
- **A holding hand is a closed fist.** The fingers are fat bands that cover the handle; it shows only above and below the fist, with the thumb across the top. (L-0008, Biku)
- **Keep hands out of the caption area,** above all white gloves behind white caption text. Move the character sideways if a hand lands there. (moon tax, self-check)

## Clothes and people

- **Dress people from the library.** Everyday clothes are mixed with `outfitFrom`; search `npm run library -- search <words> --kind=clothing` first. A new everyday outfit is a combination, not a new drawing. (Phase 2B)
- **Headgear sits on the head and must read at phone size.** The crown of a hat comes down over the top of the head and the brim crosses just above the brows. Check it small: a round steel helmet with a brim read as a bowler hat, so the soldier wears a pointed helmet over a mail coif. (L-0009, self-check)
- **Long hair goes behind the body,** not over the shoulders, so no arm crosses it. (L-0009, self-check)
- **Age is more than size.** A child is a smaller body under a full-size head, drawn smaller than the adults beside them. An elder stoops, has face creases, and needs gray or white hair to finish the read. (Phase 2B)
- **At most four colors per outfit,** all from the cloth colors. Ordinary people wear brown, tan and cream (guide v9); keep the bright colors for the people the story is about. (Style 3.5, Biku)
- **Cloth must stand apart from the skin under it.** Tan on a mid skin tone and brown on a dark one nearly match; pick cream or another color there. (villagers sheet, self-check)

## Motion

- **Move people with the library's motion pieces, not by hand.** Pose changes go through `poseAt` (wind-up, snap, settle); holds through `withLife`, `blinkAt` and `gazeAt`; turns through `turnAt`; walks through `walkAt` with a mood from `WALKS`. Search `npm run library -- search <words> --kind=motion`. (Phase 2C)
- **Anything loose needs `sway`.** A character with a cape, cloak, long hair or a held staff gets `sway={swayOf(...)}` from the same function that gives its pose, or the loose parts stay stiff. (Phase 2C)
- **Pick the walk for the feeling:** proud for rulers and show-offs, tired for the defeated or the old, sneaky for thieves and spies, happy for children and good news. The face should say the same thing as the walk. (Phase 2C)
- **Talking uses the word, not just the timing.** Give `talkAt` the voice track's words for that line (they carry the text), so the lips meet on m, b and p and round on "oo". Only the speaker's mouth moves. (Phase 2C, guide v8)
- **Check motion as frame strips,** not only as a video: every fourth frame side by side shows a stiff cape, a sliding foot or a flickering mouth at once. (L-0010, self-check)
