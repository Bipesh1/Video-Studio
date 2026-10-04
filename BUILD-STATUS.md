# Build Status

**Current phase:** Phase 1 complete. **Stopped at Checkpoint 1**, waiting for Biku to judge the look and pick voices.
**Next:** after Biku answers the questions in `runs/2026-10-03-look-test/checkpoint-1.md`, apply the answers, then start Phase 2 (character and world).
**Last updated:** 2026-10-04

## Checkpoint 1: waiting for Biku

Review file: `runs/2026-10-03-look-test/checkpoint-1.md`. Questions: (1) how close the look is and what to change, (2) narrator and character voices, (3) head size, (4) hair colors (guide v3), (5) fingers on hands that cover the face.

## Extra: first short video, "The King Who Taxed the Moon" (2026-10-04, asked by Biku)

Biku asked for a short folktale of Claude's own. Written, drawn, voiced and rendered by hand, since the pipeline arrives in Phase 4.

- **Video:** `runs/2026-10-04-moon-tax/out/moon-tax-v1.mp4` (26.7 s, 1080x1920, voice and captions, no music or sound effects yet). Script and shot list in `runs/2026-10-04-moon-tax/script.md`.
- **Made:** `engine/src/compositions/MoonTax.tsx` (5 shots), `engine/src/compositions/shotPlan.ts` (shot times from any list of voice lines), `cli/src/short.ts` and `npm run short -- --run=<folder> --voice --stills --video` (reads `shots.json` in the run folder; each render takes the next version number, so nothing delivered is overwritten).
- **Reused:** the ruler costume and scepter, both background treatments, the walk, existing expressions. New for this video, kept inside the composition: a point-up pose for Mira and two king faces whose brows sit below the crown.
- **Look and fix:** raised brows hid under the crown, Mira's pointing arm crossed her face, a foreground bush covered the walker, the belt and glove sat behind the captions. All fixed before the render.
- **Measured:** -14.1 LUFS, peak -1.3 dB, 3.0 s of render per second of video.
- **Feedback (2026-10-04):** Biku could not see the pupil in the king's far eye on the angry face. Fixed in the face code for every character (lesson L-0005) and re-rendered as `moon-tax-v2.mp4`; v1 is kept. Biku also found the story not very immersive: a note for future scripts, no remake asked.
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

- **Guide version 3 (2026-10-03, needs Biku's confirmation):** the guide names seven hair colors but gave no color values, and components may only use token colors. Added a `hair` block to `tokens.json` (black, dark brown, brown, auburn, blond, gray, white, each with one shadow tone). No existing rule changed. If Biku prefers other shades, only `tokens.json` and the Style 12 copy in the guide change.

- **Guide version 2 (2026-10-02, asked by Biku):** hands that hold or point show fingers, like the king's glove on the sword in Reference A. Resting hands stay mittens. Style Check question 11 added. `tokens.json` is now version 2 with a `hands` block. Phase 1 must draw both hand types and a gripping hand on a prop.

## Open problems and notes

1. **Head size conflict in the guide (needs Biku's decision).** Style 3.1 says the head is about a quarter of standing height, but its bone lengths (torso 1.1, legs 1.4 head-widths) make the head 0.29 of height. Reference B measures about 0.25 because its legs are longer, about 1.8 head-widths. The rig follows the bone numbers in `tokens.json`. Changing `legHeads` to about 1.8 would match a quarter exactly; that is a style change, so it waits for Biku.
1. **Face layout constants.** Eye width and pupil size come from tokens. Eye spacing, brow gap, mouth height and the head-turn shifts are named in `engine/src/face/layout.ts`, because tokens do not cover them.
1. **Effects not built yet.** Sweat drops, tears, anger mark and symbols belong to the expression table's extras column. The one the 15-second test needs comes in part C; the full set in Phase 2.
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
