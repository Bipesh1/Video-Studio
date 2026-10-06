## Part 3. The Ink Stick art style

**Style id:** `ink-stick`
**Guide version:** 13 (2026-10-06). See the version history at the end.
**Built from:** two reference images supplied by Biku
- **Reference A:** a stern king in a crown, red cape and armor, under a stormy night sky with light rays
- **Reference B:** two stick figures in a night scene under a crescent moon, one threatening and one frightened

**For Claude Code:** look at both reference images before drawing any new character, set or prop. This style is binding. When it and the references disagree, this style wins.

### Style 1. The style in one paragraph

Bold, black-outlined cartoon stick figures with big round heads and very expressive faces, drawn in flat colors with at most one hard-edged shadow tone, placed in front of soft, darker, outline-free backgrounds. The characters are crisp, bright and loud. The world behind them is quiet, muted and atmospheric. That contrast is the whole look.

### Style 2. What comes from each reference

| Taken from Reference A (the king) | Taken from Reference B (the night scene) |
| --- | --- |
| Atmospheric backgrounds: soft painted sky, soft clouds, light rays, stars | Character build: big round heads, thick stick limbs, mitten hands |
| Full costumes drawn over the body: armor, cape, crown | The face system: large white eyes, heavy brows, open mouths with teeth |
| One hard shadow tone on heads and costumes | Comedy and stress effects: flying sweat drops |
| Light from one clear direction | Flat clean shapes, black silhouettes with white line detail |
| Gloved hands on costumed characters | Small white glints on props |

**The rule both references share, and the most important rule in this style:**
**Characters and props have clean black outlines, fine as a pen line. Backgrounds have none.** (The outlines were thick until guide version 12; Biku chose the fine line on 2026-10-06. Stick limbs stay bold.)

### Style 3. Characters

#### Style 3.1 Proportions

| Part | Rule |
| --- | --- |
| **Head** | A circle. It may be up to 10% taller than wide. Diameter is a little over **1/4 of standing height** (0.29 with the bone lengths below), so heads are big. |
| **Neck** | None. The head sits directly on top of the torso. |
| **Torso** | One thick straight line, about 1.1 head diameters long, or a clothing shape built around that line. |
| **Arms** | Thick lines, upper and lower arm each about 0.6 head diameter, bending at the elbow. Smooth gentle curves allowed, never wobbly. |
| **Legs** | Thick lines, about 1.4 head diameters in total, bending at the knee. |
| **Hands** | About 0.3 head diameter. **Resting hands** (hanging, on hips, waving) are rounded mitten shapes with a small thumb bump, filled black. **Hands that hold or point** show fingers, like the king's glove around the handle in Reference A: four fingers wrapped around the object and a thumb on the near side, or one extended finger when pointing. On costumed characters with sleeves, hands are white gloves with black outlined fingers. On pure stick and partial characters, gripping hands stay filled black, with the fingers separated by thin white detail lines. |
| **Feet** | Pure stick legs end in rounded line caps. With shoes: chunky outlined sneakers or boots. |

#### Style 3.2 Line work

| Line | Color | Weight (relative to head diameter) |
| --- | --- | --- |
| Outline of heads, costumes, props | `#16161A` | 1.1 to 1.3%, a fine pen line |
| Stick limbs and torso line | `#16161A` | 5.4 to 6.2%. Much bolder than the outline, so a plain stick figure still reads on a phone |
| Inner details: folds, seams, buttons, teeth lines | `#16161A` | 0.8 to 1% |
| Face features: eye outlines, eyelid edges, mouth, lips | `#3A3A40`, a softer dark gray | about 1.2%, the eyelid edge a little heavier. As fine as the head outline, and softer. Pupils, brows and the mouth interior stay dark |
| Creases inside the face: worry ticks, under-eye creases, cheek, chin and mouth-corner creases, teeth lines | `#3A3A40` | about 0.7% at the fullest point. Creases taper to a fine point at both ends, like pen strokes |
| Eyebrows | `#16161A` filled shape | about 8%, tapered ends |

- Round line caps and round joins everywhere.
- Even, confident weight. No sketchy, broken or hairy lines.
- **The one exception is inside the face.** Brows and creases taper, and a closed mouth line is a little finer toward its corners, so faces look drawn by hand. No two creases on a face have the same length and angle.
- Every character shape and every prop is fully closed and outlined.
- Line weight stays the same for all characters at the same size in a shot.

#### Style 3.3 Fill and shading

- **Default head fill:** off-white `#F7F7F5`.
- **One shadow tone per fill,** hard-edged, about 15 to 20% darker, on the side away from the light.
- **Head shadow:** a subtle light-gray crescent `#D9DCE1` on the shadow side.
- **Light direction:** from the upper left unless the scene sets another source.
- **No gradients, airbrushing or textures on characters or props.**
- **Glints:** one small white shape on shiny things: metal, glass, jewels, orbs, buttons.

#### Style 3.4 Identity: skin tone and hair

Both references use white heads, which reads as "anyone". Many stories need the audience to see who a person is, so the style has an identity mode.

- **Default mode:** white heads, black limbs and black hands (mittens when resting, fingers when holding or pointing).
- **Identity mode:** switched on automatically when who a person is matters to the story (history, biography, real communities), and always on for brands that set it in their brand file.
  - Head and hands are filled with a skin tone. Limbs stay black lines.
  - The shadow tone is 15% darker than the skin tone.
  - **Darkest three tones:** add a thin lighter rim on the lit side of the head so the face separates from dark backgrounds. Eyes, teeth and highlights keep the face readable.
  - Hair is added as flat outlined shapes with one shadow tone.

**Skin tones, light to dark:**

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `#F6E1CF` | `#EBC6A6` | `#D9A47E` | `#C08258` | `#9C6440` | `#7A4A2E` | `#5C3620` | `#3F2416` |

**Hair library:** afro, coils, twists, braids, locs, cornrows, short crop, fade, waves, straight, curly, buns, ponytail, bald, head wraps, plus moustaches and beards. Fills in black, dark brown, brown, auburn, blond, gray and white.

**Real named people** appear as characters drawn in this style, recognizable by costume, hair, props and setting. Never attempt a likeness.

#### Style 3.5 Clothing tiers

Use the **lowest tier** that makes the character instantly recognizable.

| Tier | What is drawn | Example from references | Typical use |
| --- | --- | --- | --- |
| **0. Pure stick** | Head, torso line, limbs, hands | The threatening figure in Reference B | Extras, quick comedy, simple explainers |
| **1. Partial** | One or two clothing shapes: shirt or tank top over the torso, trousers over the legs, a hat, shoes | The frightened figure in Reference B: white tank top, navy jeans, white sneakers | Most main characters |
| **2. Full costume** | Complete outfit: armor, cape, uniform, gown, robe, crown | The king in Reference A | Rulers, soldiers, period figures, uniformed roles |

**Costume rules:**
- Bold simplified shapes, at most 3 to 4 colors, one shadow tone each.
- Few details: rivets and buttons as small outlined circles, a few fold lines.
- Arms stay stick lines unless the costume has sleeves. With sleeves, arms become outlined tubes in the sleeve color.
- Capes and coats may have a darker inside color, like the king's cape.

#### Style 3.6 Faces

**Placement.** Features sit on the front of the head, eyes around the vertical middle, close together. Turning the head toward three-quarter view shifts all features toward one side. Profile puts them on one edge.

**Parts:**
- **Eyes:** large white ovals with black outlines, each about 30% of head width, just overlapping. Black filled pupils about 30% of the eye. Pupils move to show where a character looks.
- **Eyelids:** filled with the head's shadow tone, edged with a thick curved line, like both references. Anger and tiredness lower the upper lids. Fear pushes the **lower** lids up instead, with the pupils resting on them and the upper lids wide open.
- **Overlap:** in a three-quarter view the near eye is drawn over the far eye, and the brow over the far eye is short.
- **Creases** (tapered pen strokes, see Style 3.2) add feeling where the references use them: two small worry ticks between the brows, one crease hugging the lower outer side of each eye, a cheek crease beside a grimace, two short strokes fanned out on the chin, small creases at the corners of a frown, a lower-lip line, stress creases at the eye corners. Never draw them as a row of identical marks.
- **Stern eyes (from the king):** for cold, menacing or commanding characters, the eyes become black almond shapes under heavy brows.
- **Brows:** thick black tapered wedges, heavy at the inner end and fine at the tip, with a curl where the emotion needs it. Kept apart, never joined. They carry most of the emotion.
- **Mouth:** a single line when calm. When open: dark interior `#3A1E22`. When gritted: a wide bean that arches like a frown, with two rows of big uneven teeth right up to the lips, so the dark shows only at the two corners. A wide mouth is pushed back until it fits inside the head.
- **No nose and no ears** by default.

**Expressions:**

| Emotion | Brows | Eyes | Mouth | Extras |
| --- | --- | --- | --- | --- |
| Neutral | Level, slightly raised | Open, pupils centered | Short flat line | |
| Happy | Arched up | Curved lower lids, or closed arcs when laughing | Wide upward curve, open when laughing | |
| Sad | Inner ends raised | Drooping lids, pupils low | Downward curve | Tear drops |
| Angry | Sharp V, inner ends low | Half-closed, small pupils, or stern eyes | Tight frown, or shouting with teeth | Red anger mark |
| Afraid | Light, inner ends raised, sagging in the middle | Wide, small pupils resting on raised, shaded lower lids | Wide gritted-teeth grimace filling the lower head | Flying sweat drops. The whole face tips down toward where the character looks |
| Surprised | High arcs | Very wide, small pupils | Small round O | Exclamation mark |
| Determined | Low and straight, slight V | Narrowed | Firm line, corners down | |
| Thinking | One brow raised | Pupils up and to the side | Small sideways mouth | Question mark |
| Smug | One brow raised | Half-lidded | One-sided smirk | |
| Exhausted | Drooping | Heavy lids | Slack and open | Single sweat drop |

#### Style 3.7 Effects

| Effect | How it looks |
| --- | --- |
| **Sweat drops** | Light blue `#8CC9F2` teardrops, outlined, small white highlight, flying outward from the head in arcs |
| **Tears** | Light blue streams or drops from the eyes |
| **Anger mark** | Red `#D9342B` cross-shaped vein mark near the top of the head |
| **Motion lines** | Short black lines trailing moving limbs or objects |
| **Impact** | Brief white starburst with black outline |
| **Symbols** | Bold outlined `!`, `?` or `...` above the head |
| **Dizzy** | Small stars circling the head |

### Style 4. Props

- Fully outlined, flat fill, one shadow tone, one small white glint.
- **Bright, saturated colors** so they read instantly against muted backgrounds: the gold crown, the blue orb, the orange prop in Reference B.
- Slightly oversized relative to hands so they read on a phone.
- Simplified: no more than about six inner detail lines.
- **Violence by implication only.** Weapons may appear as story props. Show threat, cut away, or use an impact flash. No blood, wounds or gore.

### Style 5. Backgrounds

#### Style 5.1 Core rules

1. **No outlines** anywhere in the background.
2. **Quieter than the characters.** Backgrounds are darker or more muted. The brightest values and strongest colors belong to characters and key props.
3. **Depth by value.** The far distance is lightest and most muted, the near foreground darkest.

#### Style 5.2 Two treatments, chosen automatically by mood

| Treatment | From | Looks like | Used for |
| --- | --- | --- | --- |
| **Simple** | Reference B | Flat color fields, flat shapes, black silhouettes | Comedy, everyday and modern scenes, fast explainers |
| **Atmospheric** | Reference A | Soft painted sky, soft clouds, light rays, stars, haze | Drama, history, danger, emotional peaks |

#### Style 5.3 How to build each element

- **Sky:** a vertical gradient of two values of one hue.
- **Clouds (atmospheric):** soft-edged layered blobs in two or three values, lighter on the edge facing the light.
- **Light rays:** two to four pale translucent beams from the light source, 10 to 20% opacity, soft edges.
- **Stars:** a few tiny white dots of varied size, some faint.
- **Moon:** a flat pale yellow crescent `#F2D27A`, no outline.
- **Ground:** a flat band, with a simple horizon edge. Small grass tufts as tiny dark shapes.
- **Silhouettes:** foreground bushes, trees and buildings as near-black shapes with a few white curling or straight detail lines, like the bush in Reference B.
- **Interiors:** walls and floors as flat planes with a soft vignette and one window or lamp as the light source.

#### Style 5.4 Palettes

| Palette | Colors | Source |
| --- | --- | --- |
| **Storm slate** (night, drama) | `#1F2B3B` `#2E3E52` `#4B5E75` `#7E91A8` `#B9C8D8` | Reference A |
| **Dusk violet** (night, comedy, tension) | `#3F3858` `#564E74` `#6A6290`, ground `#4A4366`, moon `#F2D27A` | Reference B |
| **Clear day** | sky `#8FC3E8` to `#CFE8F7`, ground `#7DB36A`, shadow `#5E8F50` | |
| **Warm interior** | `#E8C9A0` `#C99B6B` `#8E6440` | |
| **Danger** | `#4A1A1E` `#6E2328` `#8A2A2E` | |
| **Cold dawn** | `#AFC3D6` `#D7E1EA` `#F1E3C8` | |

### Style 6. Color rules

- **Per shot:** one background palette, plus up to three accent colors on characters and props.
- **Outline:** `#16161A`. **White:** `#F7F7F5`.
- **Accent colors with their shadow tones:**

| Accent | Fill | Shadow |
| --- | --- | --- |
| Gold | `#E9C23B` | `#B58E22` |
| Crimson | `#8E1E2E` | `#5F1220` |
| Orange | `#F28A26` | `#C4661A` |
| Steel | `#3B3F47` | `#2A2D33` (plate highlight `#565B64`) |
| Denim navy | `#2F3754` | `#232A41` |
| Glint blue | `#A8DDF7` | `#7FBFE0` |
| Forest green | `#3E7D4A` | `#2C5B35` |
| Brown | `#7A4B2A` | `#623C22` |
| Tan | `#C8A66E` | `#A4885A` |
| Cream | `#EEDFB8` | `#C8BB9B` |

Brown, tan and cream are the plain cloth colors of ordinary people: leather, wool, sacking and undyed linen for villagers, farmers, workers and monks. Pick the one that stands apart from the wearer's skin tone.

### Style 7. Composition and camera

- **Characters are big.** In medium shots, head and torso fill 50 to 70% of the frame height. In emotional close-ups the head fills about 40% of the frame.
- **One or two characters per shot** by default. Crowds are tier 0 figures in the midground, smaller, still outlined.
- Characters face each other or turn slightly toward the camera. Eye direction should be clear.
- Put the key face in the upper third of the frame.
- Use background elements to frame the action: the moon in a top corner, a bush cropped by the frame edge.
- **Keep caption space clear:** the bottom quarter of a 9:16 frame stays free of faces and key action.

### Style 8. Motion

- **Pose to pose.** Characters snap between strong poses with quick transitions of 3 to 6 frames at 30 fps, then hold.
- **A move of the whole body is seen to happen.** Kneeling, sitting down, getting up, lying down and picking something up are not snaps: the body takes 10 to 16 frames to get there, starting and stopping smoothly, with its feet on the ground all the way. Arms, heads and faces still snap.
- **Life during holds:** blinks every 2 to 4 seconds, a slight head bob, brow twitches, breathing.
- **Talking:** five mouth shapes in time with the voice: closed (lips together, as on m, b and p), half, open (as on "ah"), wide with the top teeth showing (as on "ee") and round (as on "oo"). The mouth forms each word, and every shape holds for at least two frames.
- **Squash and stretch** on heads during impacts or surprise, no more than 8%.
- **Effects animate:** sweat drops fly out and fade, symbols pop in with a small bounce.
- **Backgrounds move slowly:** clouds drift, stars twinkle, light rays pulse gently, layers shift for depth when the camera moves.
- **Camera:** slow push-ins on emotional lines, a small shake on impacts, plain cuts between shots. A whip pan or quick fade only between scenes.

### Style 9. Text on screen

- **Captions:** a heavy rounded sans-serif font, white with a black outline in the same weight family as the line art. The spoken word being emphasized turns gold `#E9C23B`. Use free, openly licensed fonts only and record the license in `LICENSES.md`.
- **Titles, dates and labels:** outlined boxes or banners with flat fills, matching the prop rules.

### Style 10. Do and don't

**Do**
- Thick, even black outlines on every character and prop
- Big round heads with big readable expressions
- Flat fills with one hard shadow tone
- Muted, outline-free backgrounds behind bright characters
- Clear light direction
- Simple shapes that read on a small phone screen

**Don't**
- Thin, sketchy or tapered outlines. Tapering is only for brows and the creases inside a face
- Wrinkles drawn as a row of identical marks
- Outlines on backgrounds
- Gradients, textures or soft shading on characters
- More than one shadow tone per color
- Noses, ears, fingers on resting hands, or realistic anatomy
- Muddy, low-contrast character colors
- Blood, wounds or gore
- Copying any existing channel's characters, mascots, logos or branding
- Mixing in other art styles in the same video

### Style 11. Style Check for every still

Any "no" is fixed before rendering.

1. Does every character and prop have a clean black outline?
2. Is the background free of outlines?
3. Are characters brighter and more saturated than the background?
4. Is there at most one shadow tone per color, coming from the scene's light direction?
5. Are the heads round and a little over a quarter of body height?
6. Does the face clearly show the emotion the narration calls for?
7. Is identity mode on where the story needs it, with skin tone and hair correct?
8. Is the clothing tier the lowest one that still makes the character recognizable?
9. Is the caption area clear?
10. Is there no blood, wound or gore?
11. Does every hand that holds or points show fingers, while resting hands stay mittens?

### Style 12. Machine-readable tokens

Save this as `styles/ink-stick/tokens.json`. The engine reads these values. The sections above explain them.

```json
{
  "id": "ink-stick",
  "version": 13,
  "line": {
    "color": "#16161A",
    "outlinePctOfHead": [0.011, 0.013],
    "limbPctOfHead": [0.054, 0.062],
    "detailPctOfHead": [0.008, 0.01],
    "browPctOfHead": 0.08,
    "cap": "round",
    "join": "round"
  },
  "proportions": {
    "headToHeight": 0.29,
    "headAspectMax": 1.1,
    "torsoHeads": 1.1,
    "upperArmHeads": 0.6,
    "lowerArmHeads": 0.6,
    "legHeads": 1.4,
    "handHeads": 0.3
  },
  "fill": {
    "head": "#F7F7F5",
    "headShadow": "#D9DCE1",
    "shadowDarken": [0.15, 0.2],
    "shadowEdge": "hard",
    "lightFrom": "upper-left",
    "characterGradients": false
  },
  "skinTones": ["#F6E1CF", "#EBC6A6", "#D9A47E", "#C08258", "#9C6440", "#7A4A2E", "#5C3620", "#3F2416"],
  "darkSkinRimFromIndex": 5,
  "hair": {
    "black": ["#2B2729", "#1D1A1C"],
    "dark-brown": ["#4A3226", "#36241B"],
    "brown": ["#7A5234", "#5E3E27"],
    "auburn": ["#9A4A2A", "#773820"],
    "blond": ["#E2C26A", "#BC9E4E"],
    "gray": ["#9DA0A6", "#7E8187"],
    "white": ["#EDEDEA", "#C9CBCF"]
  },
  "face": {
    "eyeWidthPctOfHead": 0.3,
    "pupilPctOfEye": 0.3,
    "mouthInterior": "#3A1E22",
    "featureLinePctOfHead": 0.012,
    "featureLineColor": "#3A3A40",
    "creasePctOfHead": 0.007,
    "nose": false,
    "ears": false
  },
  "effects": {
    "sweat": "#8CC9F2",
    "anger": "#D9342B"
  },
  "accents": {
    "gold": ["#E9C23B", "#B58E22"],
    "crimson": ["#8E1E2E", "#5F1220"],
    "orange": ["#F28A26", "#C4661A"],
    "steel": ["#3B3F47", "#2A2D33", "#565B64"],
    "denim": ["#2F3754", "#232A41"],
    "glint": ["#A8DDF7", "#7FBFE0"],
    "forest": ["#3E7D4A", "#2C5B35"],
    "brown": ["#7A4B2A", "#623C22"],
    "tan": ["#C8A66E", "#A4885A"],
    "cream": ["#EEDFB8", "#C8BB9B"]
  },
  "palettes": {
    "storm-slate": ["#1F2B3B", "#2E3E52", "#4B5E75", "#7E91A8", "#B9C8D8"],
    "dusk-violet": ["#3F3858", "#564E74", "#6A6290", "#4A4366", "#F2D27A"],
    "clear-day": ["#8FC3E8", "#CFE8F7", "#7DB36A", "#5E8F50"],
    "warm-interior": ["#E8C9A0", "#C99B6B", "#8E6440"],
    "danger": ["#4A1A1E", "#6E2328", "#8A2A2E"],
    "cold-dawn": ["#AFC3D6", "#D7E1EA", "#F1E3C8"]
  },
  "background": {
    "outlines": false,
    "treatments": {
      "simple": ["comedy", "everyday", "modern", "explainer"],
      "atmospheric": ["drama", "history", "danger", "emotional-peak"]
    },
    "lightRayOpacity": [0.1, 0.2],
    "moon": "#F2D27A"
  },
  "motion": {
    "fps": 30,
    "poseTransitionFrames": [3, 6],
    "bodyMoveFrames": [10, 16],
    "blinkEverySeconds": [2, 4],
    "maxSquash": 0.08,
    "mouthShapes": ["closed", "half", "open", "wide", "round"]
  },
  "captions": {
    "fill": "#F7F7F5",
    "stroke": "#16161A",
    "emphasis": "#E9C23B",
    "safeBottomPct916": 0.25
  },
  "hands": {
    "resting": "mitten",
    "holding": "fingers",
    "pointing": "one-finger",
    "gripFingers": 4
  },
  "clothingTiers": ["pure-stick", "partial", "full-costume"],
  "violence": "implied-only"
}
```

### Version history

| Version | Date | Change | Asked by |
| --- | --- | --- | --- |
| 1 | 2026-10-02 | First version, Part 3 of Build Plan v5 | Biku |
| 2 | 2026-10-02 | Hands that hold or point show fingers, like the king's glove on the sword in Reference A. Resting hands stay mittens. Style Check question 11 added. | Biku |
| 3 | 2026-10-03 | Added color values for the hair colors Style 3.4 already names (black, dark brown, brown, auburn, blond, gray, white), each with one shadow tone 15 to 25% darker. No existing rule changed. Biku to confirm. | Claude, for identity mode |
| 4 | 2026-10-03 | Faces closer to the references, at Biku's Checkpoint 1 request: eyes 30% of head width (was 22%), pupils 30% of the eye (was 40%), shaded curved eyelids, separate tapered brows with curls, and thin detail lines for worry, bags, frown corners, lip and chin. | Biku |
| 5 | 2026-10-03 | Face feature lines (eye outlines, mouth, lips) use the inner-detail weight, about 3%, thinner than the 4 to 5% head outline, so faces read finer and more attractive, as in the references. | Biku |
| 6 | 2026-10-03 | Face feature lines thinner (about 2.2% of head width) and softer (#3A3A40 instead of the #16161A outline color), so faces look finer and more attractive. Pupils, brows and mouth interior stay dark. | Biku |
| 7 | 2026-10-04 | Wrinkles look hand-drawn: creases inside the face are fine tapered pen strokes (about 1.2% at the fullest point), each a different length and angle, and tapering is now allowed inside the face. The frightened face follows Reference B as measured: lower lids pushed up and shaded with the pupils resting on them, the face tipped down toward where the character looks, a wide arched grimace with big teeth. The near eye overlaps the far eye. | Biku |
| 8 | 2026-10-06 | Talking uses five mouth shapes instead of three: wide ("ee", top teeth showing) and round ("oo") join closed, half and open, and the mouth forms each word instead of only opening and closing. Part of the Phase 2 motion polish. | Biku (Phase 2 scope) |
| 9 | 2026-10-06 | Three plain cloth colors for ordinary people: brown, tan and cream, each with one shadow tone. Head size settled: it stays as drawn, a little over a quarter of standing height (0.29), so Style 3.1, Style Check question 5 and the token now say so. | Biku |
| 10 | 2026-10-06 | Lines a little thinner, at Biku's request ("the thickness now is a little bit high"): the outline of heads, costumes and props is 3.5 to 4.1% of head width (was 4 to 5%), and stick limbs and the torso line are 6.2 to 7% (was 7 to 8%). Inner details and face lines are unchanged. | Biku |
| 11 | 2026-10-06 | Lines a little thinner again, at Biku's request after seeing version 10 ("a little bit more thinner"): the outline is 3 to 3.5% of head width and stick limbs and the torso line are 5.4 to 6.2%. Inner details and face lines are unchanged. | Biku |
| 12 | 2026-10-06 | Fine outlines, bold limbs. Biku compared five thicknesses and three mixes side by side and chose mix B: the outline of heads, costumes and props is a fine pen line (1.1 to 1.3% of head width), inner details 0.8 to 1%, face lines about 1.2% and face creases about 0.7%, while stick limbs and the torso line stay bold (5.4 to 6.2%) so plain stick figures read on a phone. The main rule and Style Check question 1 now say "clean black outline" instead of "thick". This moves away from the heavy outlines of the two reference pictures on purpose. | Biku |
| 13 | 2026-10-06 | A move of the whole body (kneeling, sitting down, getting up, lying down, picking something up) takes 10 to 16 frames and is seen to happen, instead of snapping in 3 to 6 frames like an arm or a head. Biku, on a kneel that took two frames in the first automatic video: "looks like the posture didn't change in continuous frames". | Biku |
