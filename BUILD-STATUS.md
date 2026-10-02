# Build Status

**Current phase:** Phase 1 part A complete (rig, IK, faces, expressions, 6 poses, walk cycle). Stopped at Biku's request.
**Next:** Phase 1 part B: one costumed character, identity mode, both background treatments, captions, Kokoro voice with word timings, mouth movement synced to the voice, the 15-second 4-shot test, the style match sheet and the voice audition. Then Checkpoint 1.
**Last updated:** 2026-10-02

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

- **Guide version 2 (2026-10-02, asked by Biku):** hands that hold or point show fingers, like the king's glove on the sword in Reference A. Resting hands stay mittens. Style Check question 11 added. `tokens.json` is now version 2 with a `hands` block. Phase 1 must draw both hand types and a gripping hand on a prop.

## Open problems and notes

1. **Head size conflict in the guide (needs Biku's decision).** Style 3.1 says the head is about a quarter of standing height, but its bone lengths (torso 1.1, legs 1.4 head-widths) make the head 0.29 of height. Reference B measures about 0.25 because its legs are longer, about 1.8 head-widths. The rig follows the bone numbers in `tokens.json`. Changing `legHeads` to about 1.8 would match a quarter exactly; that is a style change, so it waits for Biku.
1. **Face layout constants.** Eye width and pupil size come from tokens. Eye spacing, brow gap, mouth height and the head-turn shifts are named in `engine/src/face/layout.ts`, because tokens do not cover them.
1. **Effects not built yet.** Sweat drops, tears, anger mark and symbols belong to the expression table's extras column. They come with the close-up effect shot in part B and the full effect set in Phase 2.
1. **Clothing.** Only tier 0 (pure stick) exists. Tier 1 clothing and shoes come in part B or Phase 2.

1. **Render time is near the run budget.** All three sizes of a 2:30 video may exceed 30 minutes on this laptop. Options for Phase 4: render the 9:16 size by default and others on request, cache background layers, keep blur light.
1. **Low free memory.** About 2 GB free with other apps open. Render concurrency is capped by free memory, so closing other apps makes renders faster.
1. **Terminal paths.** Scoop added FluidSynth's folder and `ESPEAK_DATA_PATH` to the user environment. Terminals opened before the install do not see them. The CLI reads the current values from the registry (`cli/src/system.ts`), so studio commands work regardless. A new VS Code window also picks them up.
1. **Path with a space.** The project folder is `F:\Video Studio`. Every process call goes through the quoting helper `run()` in `cli/src/system.ts`. Never call `spawnSync` with `shell: true` and raw arguments.
1. **Imports in bundled code.** Remotion's bundler does not map `.js` suffixes to `.ts` files. Use extensionless relative imports in `engine/` and `shared/`.
1. **zod is pinned to 4.5.4** to match Remotion 4.0.532. Upgrade both together with `npx remotion upgrade`.
1. **Python is capped below 3.13** because Kokoro requires it and pydub uses `audioop`, which 3.13 removed.
1. **Kokoro word timings** are not documented for 0.9.4. Phase 1 must test whether the pipeline returns token timestamps, and fall back to local Whisper alignment if not.
1. **Kokoro model weights** (about 330 MB) download on first use in Phase 1.
1. **Font and SoundFont** are not chosen yet. Font in Phase 1, SoundFont in Phase 3. Record both in `LICENSES.md`.

## How to continue

Open Claude Code in this folder and paste:

> Read BUILD-STATUS.md and continue the build from where it stopped.
