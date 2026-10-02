# Build Status

**Current phase:** Phase 0 complete. Stopped before Phase 1 at Biku's request.
**Next:** Phase 1, the look test. Start only when Biku says so.
**Last updated:** 2026-10-02

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

## Open problems and notes

1. **Render time is near the run budget.** All three sizes of a 2:30 video may exceed 30 minutes on this laptop. Options for Phase 4: render the 9:16 size by default and others on request, cache background layers, keep blur light.
2. **Low free memory.** About 2 GB free with other apps open. Render concurrency is capped by free memory, so closing other apps makes renders faster.
3. **Terminal paths.** Scoop added FluidSynth's folder and `ESPEAK_DATA_PATH` to the user environment. Terminals opened before the install do not see them. The CLI reads the current values from the registry (`cli/src/system.ts`), so studio commands work regardless. A new VS Code window also picks them up.
4. **Path with a space.** The project folder is `F:\Video Studio`. Every process call goes through the quoting helper `run()` in `cli/src/system.ts`. Never call `spawnSync` with `shell: true` and raw arguments.
5. **Imports in bundled code.** Remotion's bundler does not map `.js` suffixes to `.ts` files. Use extensionless relative imports in `engine/` and `shared/`.
6. **zod is pinned to 4.5.4** to match Remotion 4.0.532. Upgrade both together with `npx remotion upgrade`.
7. **Python is capped below 3.13** because Kokoro requires it and pydub uses `audioop`, which 3.13 removed.
8. **Kokoro word timings** are not documented for 0.9.4. Phase 1 must test whether the pipeline returns token timestamps, and fall back to local Whisper alignment if not.
9. **Kokoro model weights** (about 330 MB) download on first use in Phase 1.
10. **Font and SoundFont** are not chosen yet. Font in Phase 1, SoundFont in Phase 3. Record both in `LICENSES.md`.

## How to continue

Open Claude Code in this folder and paste:

> Read BUILD-STATUS.md and continue the build from where it stopped.
