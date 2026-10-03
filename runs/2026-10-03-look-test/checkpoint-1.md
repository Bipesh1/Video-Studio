# Checkpoint 1: the look test

Phase 1 is complete. The build is stopped here until Biku answers the questions at the end.

## What to watch and look at

| File | What it is |
| --- | --- |
| `out/look-test.mp4` | The 15-second test video (14.6 s, 1080x1920, voice and captions, no music yet) |
| `out/face-match.png` | Biku's faces from the references beside ours, after the first round of feedback |
| `out/style-match-n1.png` | Shot 1 (ruler, atmospheric) next to both reference pictures, with the Style Check answered |
| `out/style-match-d1.png` | Shot 2 (night, two characters, Tom speaks) |
| `out/style-match-n2.png` | Shot 3 (close-up, horrified, flying sweat) |
| `out/style-match-n3.png` | Shot 4 (walking home) |
| `../2026-10-03-voice-audition/out/all-voices.mp3` | All 20 American English voices saying the same two lines (index in `../2026-10-03-voice-audition/README.md`) |
| `out/look-test.srt` | The captions as a subtitle file |
| `script.md` | The test script and shot list |

## The four shots

1. **Atmospheric, costumed ruler.** Stormy slate sky, soft lit clouds, pale light rays. An original crowned ruler in crimson and steel, stern eyes, gloved hand on a scepter. Slow push-in.
2. **Simple night, two characters.** Flat violet night, crescent moon, black bush with white curls. A guard points, smug; Tom pleads with his hands up. Tom's mouth moves in time with his words, and the two look at each other.
3. **Close-up with a strong emotion and an effect.** Tom horrified, head filling about 39% of the frame, sweat drops flying out and fading. Slow push-in.
4. **Walking shot.** Tom walks home in profile, exhausted, a sweat drop on his head. The camera follows; buildings, a tree and a bush slide past at different depths.

Narration and dialogue are Kokoro voices (narrator am_michael, Tom am_puck, both placeholders). Captions are white Fredoka with a black outline; the emphasized word in each line turns gold.

## Measured

| Check | Result |
| --- | --- |
| Video | 14.57 s, 1080x1920, 30 fps, H.264 with AAC audio |
| Loudness | -14.2 LUFS, peak -1.4 dB |
| Word timings | From Kokoro itself, every word, no estimation |
| Render speed | 4.2 s of render per second of video (the atmospheric shot is the slowest) |
| Style Check | Every answer yes or not applicable, except question 5 on every shot (head size, below) |

## Feedback round 1 (2026-10-03): applied

Biku asked for faces with the curves and detail of the references (the angry faces and the gritted teeth). Applied as guide v4 and lesson L-0001: eyes 30% of head width and overlapping, shaded curved eyelids, separate tapered brows with curls, wide frowns with curled corners, two-row gritted teeth with dark corners, and thin worry, bag and chin lines. The video, stills and sheets above are re-rendered with the new faces.

## Where it differs from the references (my honest read)

- **Eyes are now close to Reference B's size** (30% of the head). Reference B's lids and pupils are still a little looser and more hand-drawn.
- **Heads are slightly bigger than a quarter of body height** (0.29), because the token bone lengths and the "quarter" rule disagree. Reference B has longer legs.
- **Tom's pleading face in shot 2 is milder than Reference B's frightened figure,** because his mouth is busy talking instead of gritting its teeth.
- **Shot 2 uses tier 0 figures.** Reference B's frightened figure wears a tank top, jeans and sneakers (tier 1), which is built in Phase 2.
- **No music or sound effects yet.** Those come in Phase 3.

## Questions for Biku

1. **The look.** Are the faces close enough now (see `out/face-match.png`)? What should change next?
2. **Voices.** Which voice for the narrator, and which for male and female characters? The audition file lists all 20.
3. **Head size.** Keep heads at 0.29 of body height, or lengthen legs to about 1.8 head-widths so heads are exactly a quarter, like Reference B?
4. **Hair colors.** Are the seven hair colors I picked (guide version 3) fine?
5. **Covering hands.** Should hands that cover the face show spread fingers, like in your wailing and horrified picture?
