# The style of What's the Catch? (`fine-print`)

**Style id:** `fine-print`
**Version:** 3 (2026-10-22: no outlines, shapes in tones; Biku picked look 2 of the drawing test, "2 looks good", `runs/2026-10-21-fat-breath/out/drawing-looks-side.png` and `drawing-people-side.png`; section 3 below). 2 (2026-10-16: the bold pages and the travelling camera). 1 (2026-10-15). Picked by Biku from a look test: look 4, "4 looks good" (`runs/2026-10-15-fine-print-looks/looks-v2-1-4-3.png`).
**For:** What's the Catch? only (the hidden money in everyday things). The Ink Stick style is not used in this niche, and this style is not used in any other.
**Tokens:** `styles/fine-print/tokens.json`. Every colour, line and timing comes from there.

## 1. The look in one paragraph

Flat, warm, modern explainer illustration, in the spirit of a Vox explainer and copying nobody. Simple shapes in a few strong colours, each picture on a bold page colour of its own (v2, 2026-10-16: Biku asked for the videos to be "very immersive and attractive", and of a first try with small changes, "i dont see major changes"), with the camera always travelling. Things and people have a fine navy line round them, so they stand off the page; charts and diagrams have no line, so they stay clean. Everything is explained one step at a time: each piece arrives as the narrator names it.

## 2. Colours

| Name                 | Use                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------- |
| background `#F4EFE6` | the page behind everything                                                                    |
| floor `#E3D9C9`      | the ground in a scene, a quiet band at the bottom                                             |
| dark `#1E2A38`       | words, the line, signs, dark boxes                                                            |
| red `#E4572E`        | the one thing that matters: the price, the share that answers the question, the stressed word |
| yellow `#F3B61F`     | money and coins, prices on dark signs, popcorn                                                |
| teal `#2A9D8F`       | "you", counters, the ordinary side of a comparison                                            |
| green `#7BB662`      | banknotes, small shares                                                                       |
| mid `#CFC6B8`        | faces and hands of people, crossed-out prices                                                 |
| light `#FFFFFF`      | words on dark or coloured boxes, paper                                                        |

At most three colours besides dark and the page in one picture. Red is used for one thing at a time.

## 3. Shapes and line

**From v3 (2026-10-22), the toned look, for every new video** (after a frame-by-frame study of Kurzgesagt, `knowledge/playbooks/kurzgesagt-study.md`; their craft, never their designs):

- No outline round filled shapes: things, heads, hair and clothes are separated by colour alone.
- Every shape in two or three tones of its own colour: its colour, a darker tone on the side away from the light, a lighter edge on the side toward it. Shadows are darker colour, never grey or black.
- One light per scene (usually from the upper left); lights and lit things glow softly; far things paler and simpler, near things big and strong.
- Limbs stay soft dark lines: a stick figure is made of them. Faces keep their eyes and mouths.
- In code: `TonedContext` (`engine/src/rig/tone.ts`) turns it on for the puppet (head, clothes, sleeves, hair, hands); the drawing test is `engine/src/sandbox/part-w.tsx`. Not yet switched on in the worlds: the next video turns it on and redraws its props in tones.

The rules of v2 below stand where v3 does not replace them.

- Flat fills, no gradients, no textures, no shading.
- Things and people: a navy line 3.5 wide (on a 1080 by 1920 page) all round, rounded joins.
- Charts and diagrams (bars, splits, flow boxes): no line.
- Corners rounded. Few details: a bucket is a shape and three stripes.
- No real logos, brands or real people's faces. No photographs.

## 4. People

Faceless and simple: a round head in `mid`, a rounded body in one colour, two dark legs. They are there for scale and to stand for "you" and "everyone", not as characters. Hands are a rounded shape with a thumb.

## 5. Words

- Fredoka, bold, in capitals for titles and labels.
- A title is one or two short lines at the top, the important word in red.
- Numbers are big. Money is written the way it is said: $9, 55¢, $7.65.
- Nothing to read in the caption area: the bottom of a tall picture from 1250 down is left to the captions (two lines of caption reach up to about 1280). The builder draws every graphic's body a fifth smaller under its title for this.

## 6. Motion: one step at a time

- Every piece of an explanation arrives when the narrator names it, never all at once: a box pops in, an arrow draws itself, a coin travels down the arrow, a bar grows, a receipt prints a line, a price tag drops and swings.
- A pop overshoots a little and settles (about a third of a second). A line draws in under half a second. A bar grows in about half a second while its number counts up.
- Coins keep flowing along an arrow once it is drawn, so the picture never freezes.
- **The camera never stops.** It pushes slowly in through a shot (6%), sways and tilts a little, and kicks in a touch as each piece after the first lands (a number as it finishes counting).
- **Every picture has its own page colour:** sun, mint, coral, sky or cream (`pages` in the tokens), never the colour of either of the two pictures before, and chosen so the picture's own things stay clear (a yellow tag never on sun, a red number never on coral). A scene's ground is a deeper shade of its page. A soft light sits in the middle of the page, so it is a space and not a sheet.
- **The title is big and bold inside the picture:** the line that matters light on a dark box, tipped a little, as on the thumbnails.
- **The camera travels from picture to picture, never a plain cut** (`transition` on a shot; `arrivalOf` chooses one by itself between two pictures when a shot asks for none): it slides right, up, left or down to the next as if they were places side by side; it **dives** into a thing of the last picture and the next grows out of it (`diveAt`); or it **matches**, the strongest: a thing of the last picture becomes a thing of the next (the bucket on the counter becomes the $10 bucket, the price tag becomes the ticket; `matchFrom` and `matchTo`, where each is and how big as shares of the frame), the colour changing round it. Use a match wherever the same thing, or a thing that stands for it, is in both pictures.
- **Every arrival has its sound,** quiet under the voice: a pop for a box, a click for a receipt line, a coin's ding for a number landing and for a total, a thud for a tag, a whoosh for an arrow drawing and for the camera travelling (`graphicSoundCues`, made by itself from the words). Never two within a fifth of a second.
- **Small life in every held picture:** steam off popcorn, a kernel jumping in the machine, a landed number breathing, people in a queue shifting their weight, a tag still swaying.
- **The page is never empty** (L-0048). The first piece of a picture is there as the shot begins. Everything still to come stands from the first frame as a pale outline of itself, in the line colour, and fills in with colour on its word; its words and numbers are not in the outline, so nothing is given away early. A big number has a picture of what it counts above it (a ticket, a coin, a bucket) whenever one fits.

## 7. What a video is made of

The pieces are in `engine/src/explainer/Graphic.tsx`; a shot asks for one with `graphic` in the storyboard (`shared/src/graphic.schema.ts`):

| Kind      | Shows                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------- |
| `scene`   | an illustrated place, its things arriving one by one (first: `cinema-counter`)                      |
| `flow`    | follow the money: boxes top to bottom, arrows between with coins flowing, a label beside each arrow |
| `split`   | where the money goes: one bar split into labelled shares, filling share by share                    |
| `bars`    | a comparison: bars growing with their numbers counting up, one in red                               |
| `tag`     | a price tag dropping in and swinging, an old price crossed out                                      |
| `receipt` | a receipt printing line by line, the total in red                                                   |
| `number`  | one big number counting up, with a few words under it                                               |
| `queue`   | faceless people walking into a queue at a counter                                                   |

## 8. Style check for every still

1. Are things and people outlined in fine navy, and charts not?
2. Is red used for one thing only?
3. Is the caption area clear?
4. Can every word be read at phone size?
5. Does the picture show what the narrator is saying at that moment, and nothing he has not said yet?
