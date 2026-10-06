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
- **A head can be held at any turn.** Front and three-quarter show two eyes; from three quarters of the way to profile there is one. If a face ever shows one eye squashed onto the other, the layout is wrong, not the scene. Check new faces on the turn-steps sheet. (L-0012, Biku)
- **Measure, do not eyeball.** Before matching a face to a reference, enlarge the reference 8 times with a grid and read sizes, positions, tilt and line thickness in head units. Compare at the same head size (`npm run look-test -- --faces`). (L-0007, self-check)

## Bodies and arms

- **The body agrees with the head.** When a costumed character is turned three-quarter, the arm on the side they face is the far arm and comes out from behind the chest; the other arm is the near one and hangs in front of the chest. Seen from the front, both arms hang beside the chest. The engine does this by view (`engine/src/rig/layers.ts`); check it on every new costume. (L-0008, Biku)
- **No arm bends backward.** A resting arm hangs a little behind the body and bends forward at the elbow. An arm that holds something out reaches forward with the elbow ahead of the shoulder, like the king's sword arm in Reference A, never folded back against the body. (L-0008, Biku)
- **A holding hand is a closed fist.** The fingers are fat bands that cover the handle; it shows only above and below the fist, with the thumb across the top. (L-0008, Biku)
- **Hands touch what they push, hold or lean on.** Place the thing from the hand positions so it meets them, and make it big enough to reach them: a pushed block must stand taller than the upper hand. Look at the contact in a close-up before calling it done. (L-0014, Biku)
- **Shoes follow the leg.** The upper part of a shoe leans with the shin and the leg goes down into it; a heel lifts when the leg leans far forward. The engine does this (`Footwear.tsx`); after any new leg pose, look at the feet close up on the `shoes` sheet. (L-0015, Biku)
- **Feet show where the effort comes from.** Pushing drives from behind the hips with the back leg stretched out; pulling braces the feet out in front. Feet bunched under a leaning body look wrong. (L-0014, Biku)
- **Keep hands out of the caption area,** above all white gloves behind white caption text. Move the character sideways if a hand lands there. (moon tax, self-check)

## Clothes and people

- **Cloth lies on the body where the body is.** A skirt, dress, robe or gown covers the legs wherever they go: over the lap and down from the knees of someone sitting, open with a stride. The engine does this (`drapeOverLegs` in `wardrobe/cloth.tsx`); after a new garment or a new leg pose, look at the `skirts` sheet. (L-0017, Biku)
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

## Action

- **A hit is never shown landing on a body.** Stage it in four beats: the attacker's wind-up, the swing, an `Impact` flash over the point of contact with a `Shake` and a head squash on the same frame, then the other person's `recoilAt`. No blood, wounds or gore, ever. (Style 4, Phase 2D)
- **Every action needs a reason the viewer can see.** After a hit a character may shrug it off, stagger or go down; people can take punches, so all of these are fine. What reads as weird is a string of moves with nothing linking them, such as being punched, then running off, then falling over. Ask of each beat: why does this happen now? (L-0013, Biku)
- **One story, one place, one light.** A chase and the fight that ends it happen in the same place at the same time of day. Change the setting only when the story moves, and mark it with the quick `Fade`. Inside a scene, cut plainly and on movement so the action carries across. (L-0013, Biku)
- **Line the moments up from the exported times.** The flash, the shake and the recoil all start at `PUNCH.hit` or `SWING.hit`; a landing flash at `FALL.ground`. Never guess a frame number. (Phase 2D)
- **Put moves together with `chainAt`,** not by hand: each move then starts where the last one ended and the change is blended. Read how far the character has gone from `pose.rootX`. (Phase 2D)
- **A camera that follows someone needs an endless background** (`endless` on `Background`), or the scenery runs out after two screens. (L-0011, self-check)
- **Keep action characters big.** A head of about a sixth of the frame width still fits two fighters; smaller and the faces are lost on a phone. (action clip, self-check)
- **Motion lines are black,** so put them over sky or a light ground, and keep them clear of a second character. Symbols and dizzy stars need empty space above the head. (Style 3.7, action clip)
- **Faces carry the action.** Change the face on the beat: determined, surprised with `!`, afraid while running, eyes squeezed shut on the hit, exhausted with stars after a fall. (action clip, self-check)

## Places, props and shots

- **Name the place, do not build it.** Start from `placeSpec('home-interior', seed)` and change only what the story needs. A new kind of place is drawn once and added to `PLACES`. (Phase 2E)
- **Lay a scene out once, wide, then move the camera.** Everyone stands where they stand; medium, close-up and over-the-shoulder are the same layout through `Framed`. Never rebuild the scene for a closer shot, or the place will not match. (Phase 2E, L-0013)
- **Pick the shot for what the viewer must see:** wide to show where we are, medium for talk and action, close-up for a feeling, over-the-shoulder when one person shows or says something to another. (Style 7)
- **What is being shown must be seen.** In an over-the-shoulder shot the near head stays low in its corner; check that it does not cover the far person's face or hands. (story clip, self-check)
- **Props come from the library and go in with `InHand` or `Placed`.** A thing held or pushed is placed from the hand, so they meet. Furniture is drawn before the person who uses it and tables after anyone sitting behind them. (Phase 2E, L-0014)
- **A change of place or time gets a quick `Fade` and, if it helps, a `Label`** ("That evening"). Titles and labels sit at the top, never in the caption area, and never contain an em dash. (Style 9, ground rule 14)
