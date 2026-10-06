# Video Studio

## What this is

A local application that Claude operates to turn a script or idea into a
finished narrated video in the Ink Stick 2D cartoon style. Claude draws
every picture as code. Owner: Biku.
Plan: Video-Studio-Build-Plan-v5.md. Style: styles/ink-stick/guide.md.
Build progress: BUILD-STATUS.md (read it first in every session).

## Ground rules

1. Everything runs locally. No paid service and no API key is required for a complete video.
2. Claude draws everything. All visuals are vector shapes written in code following the style guide. No image-generation service, no traced or downloaded artwork.
3. Engine and content are separate. A video run writes data files only. It never edits engine code. Engine changes happen only through `/improve`.
4. The storyboard file is the single source of truth for a video.
5. The style is binding. Every visual value comes from `styles/ink-stick/tokens.json`. Never hard-code a color, line weight or proportion in a component.
6. Never overwrite a delivered output. New renders get a new version number.
7. Every stage can be re-run alone and skips work whose inputs have not changed.
8. Plain-language reporting. End every run and every phase with a short summary: what was made, where it is, what Biku needs to decide.
9. Build status. Keep `BUILD-STATUS.md` at the project root: current phase, what is done, what is next, open problems. Update it at the end of every phase and before any session is likely to end. A new session starts by reading it.
10. Run budget. A normal video run should finish in about 30 minutes. If it is heading past 45 minutes, stop and report why. During the build, finish each phase in as few sessions as possible and stop at checkpoints.
11. Verify before you build. Confirm current install commands and Claude Code features in the official docs first.
12. Read only what the run needs: CLAUDE.md, the general playbook, the format playbook, the style playbook, tokens and the brand file.
13. Original designs only. The reference images define a style, not characters to copy. Do not copy any specific channel's characters, mascots, logos or branding.
14. No em dashes in any text the application writes for viewers.

## Operating the studio

Script modes: as-is (never change a word), refine (keep story and facts,
list changes), original (research and write).
Run: understand -> script -> shot plan -> library check -> voice -> music ->
sfx -> mix -> stills -> style check -> preview -> final render -> review
New assets: search library/index.json first, then draw, look, fix, save.

## Files to load for a video

- knowledge/playbooks/general.md
- knowledge/playbooks/formats/<format>.md
- knowledge/playbooks/styles/ink-stick.md
- styles/ink-stick/tokens.json
- brands/<brand>.json

## Art style rules: when to read them

| File                                      | Holds                                                                     | Read it                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `styles/ink-stick/guide.md`               | The full written style: proportions, faces, costumes, backgrounds, colors | All of it before drawing anything new                                                     |
| `styles/ink-stick/guide.md`, Style 11     | The 11-question Style Check                                               | At every style check, for every still                                                     |
| `styles/ink-stick/reference/`             | Biku's two reference pictures                                             | Look at both before drawing anything new, and compare the new stills against them         |
| `styles/ink-stick/tokens.json`            | Every color, line weight and proportion                                   | Every video. Components read it automatically; never type these values by hand            |
| `knowledge/playbooks/styles/ink-stick.md` | Lessons about the look from Biku's feedback                               | Every video. Where it and the guide disagree, the guide wins until Biku updates the guide |
| `library/index.json` and `characters/`    | Everything already drawn                                                  | Every video, before drawing, so existing assets are reused                                |

Reusing a library asset in a new pose or expression needs no full guide read, but its stills still go through the Style Check.

## Where the drawing code lives

Everything already drawn is reusable code under `engine/src/`, and every piece is listed in `library/index.json` with tags, a picture and where its code is. **Search the library before drawing anything:** `npm run library -- search <plain words>` (for example `search king night`). A video asks for these pieces by name and never redraws them. The table below is the map of the folders behind the index.

| Need                                                  | Look in                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| The character puppet (put a whole person on screen)   | `engine/src/rig/Character.tsx`                                            |
| Poses                                                 | `engine/src/rig/poses.ts`                                                 |
| Actions by name (every one is in `ACTIONS`)           | `engine/src/rig/actions.ts`                                               |
| Walks, mood walks, run, carry, push, pull             | `engine/src/rig/walk.ts` (`WALKS`, `GAITS`)                               |
| Jump, falls, punch, swing, recoil                     | `engine/src/rig/moves.ts`                                                 |
| Moves one after another (sneak, then run, then jump)  | `chainAt` in `engine/src/rig/chain.ts`                                    |
| Moving between poses (wind-up, settle)                | `poseAt` in `engine/src/rig/pose.ts`                                      |
| Life in a hold: blinks, breathing, weight, eye darts  | `engine/src/rig/life.ts`                                                  |
| Head turns; swinging capes, hair and held things      | `engine/src/rig/turn.ts`, `engine/src/rig/follow.ts`                      |
| Expressions and talking mouths                        | `engine/src/face/expressions.ts`, `engine/src/face/talk.ts`               |
| Skin tones and hair                                   | `engine/src/wardrobe/identity.ts`, `engine/src/wardrobe/hair.tsx`         |
| Everyday clothes, mixed with `outfitFrom`             | `engine/src/wardrobe/garments.tsx` (cloth names, never colors)            |
| Costumes                                              | `engine/src/wardrobe/costumes/`, by name in `wardrobe/cast.ts`            |
| Ages (child, adult, elder)                            | `age` on the Character in `engine/src/rig/Character.tsx`                  |
| Saved characters (only for a series)                  | `characters/<id>.json`, drawn with `castFromCard` in `cast.ts`            |
| Props, and putting them in a hand or a scene          | `engine/src/props/` (`InHand` and `Placed` in `Hold.tsx`)                 |
| Effects (tears, anger, stars, symbols, flash)         | `engine/src/effects/`                                                     |
| Places by name (street, forest, castle, home)         | `PLACES` in `engine/src/backgrounds/places.ts`                            |
| Backgrounds and their palettes (`endless` for chases) | `engine/src/backgrounds/`                                                 |
| Shot sizes: wide, medium, close-up, over-shoulder     | `engine/src/camera/Framing.tsx`                                           |
| Camera moves (push-in, shake, pan, fade), captions    | `engine/src/camera/Camera.tsx`, `engine/src/overlays/`                    |
| Title cards and labels                                | `engine/src/overlays/Titles.tsx`                                          |
| Music moods (nine), written as notes                  | `MOODS` in `audio/src/studio_audio/music.py`                              |
| Sound effects (eleven), made from scratch             | `EFFECTS` in `audio/src/studio_audio/sfx.py`                              |
| The mix: voice, music and effects into one track      | `audio/src/studio_audio/mix.py`, plan in `shared/src/sound.schema.ts`     |
| The storyboard: a video's master file, and its rules  | `shared/src/storyboard.schema.ts`, checked by `storyboard.check.ts`       |
| A worked example storyboard                           | `shared/src/fixtures/moon-tax.storyboard.json`                            |
| Formats, brands and voices (one JSON file each)       | `formats/`, `brands/`, `voices/`, rules in `shared/src/plugins.schema.ts` |
| Worked examples of whole videos                       | `engine/src/compositions/LookTest.tsx`, `MoonTax.tsx`                     |
| A worked action scene (chase, fight, camera)          | `engine/src/sandbox/part-h.tsx`                                           |
| A worked story scene (places, props, shots, titles)   | `engine/src/sandbox/part-l.tsx`                                           |
| Pictures of every piece                               | `library/catalog/`, `knowledge/golden/assets/`, `npm run sheets`          |

## Repository layout and commands

- `shared/` Zod schemas shared by every part. `engine/` Remotion (React, TypeScript). `cli/` orchestrator. `audio/` Python workers managed by uv.
- `npm run doctor` reports every tool version. `npm run bench` renders the test scene and measures speed.
- `npm run look-test -- --all` builds the Phase 1 look test (voice, stills, video, style match sheets); `--audition` speaks the audition lines in every American English Kokoro voice. Each stage runs alone too.
- Voice: `cd audio && uv run python -m studio_audio.voice synth --script <voice-script.json> --out <dir>` writes `voice.wav` and `timings.json` (contract in `shared/src/voice.schema.ts`). Kokoro 0.9.4 gives word timestamps itself.
- Storyboard: `npm run storyboard -- plugins` lists and checks every format, brand, voice and saved character. `npm run storyboard -- check --run=<run>` (or `check <file>`) checks a storyboard: its shape, that every name in it exists in the library and the plug-ins, that its scenes follow the format's beats, and the length of each chapter. A video is built in chapters of at most 60 seconds; each chapter is shown to Biku in the phone size and the next one starts only when he says so.
- Sound: `npm run sound -- list` names every mood and effect; `samples` and `reel` write the listening files to `runs/2026-10-06-sound-test/out/`; `mix --run=<run>` mixes a run's voice with its `sound-plan.json` (which mood starts when, which effect happens when) into `audio/mix.wav` and `audio/mix.json`; `check` fails unless everything is at -14 LUFS with the true peak at or below -1 dB. `npm run short -- --run=<run> --sound --video` mixes and renders. A file in `music/` or `sfx/` named after a mood or effect replaces the studio's own. Claude cannot hear: judge sound by the measured report and tell Biku it needs his ears.
- The instrument set for the music is not in git. Get it once with `cd audio && uv run python -m studio_audio.soundfont fetch` (32 MB, into `audio/soundfonts/`).
- Library: `npm run library -- search <words>` finds assets by tag, music moods and sound effects included (`--kind=costume` narrows it), `list` and `show <id>` print the index, `characters` lists the saved character cards, `look <id>` renders one asset in three views on light and dark for the draw, look and fix loop, `stills` writes the golden stills in `knowledge/golden/assets/`, `catalog` renders the picture catalog in `library/catalog/`, and `check` fails if anything drawn is missing from the index. `/draw <description>` runs the whole loop for a new asset.
- `npm run sheets` renders the sandbox contact sheets for the draw, look and fix loop (`--only=poses`, `--video`, `--golden`). Look at them before calling any drawing done.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run format` must pass at the end of every phase.
- Python: `cd audio && uv run pytest` and `uv run python -m studio_audio.doctor`.
- Every command that draws goes through `cli/src/render.ts` (one shared browser) and keeps its scratch files in `.cache/tmp/` inside the project, deleted when it ends. Never call the renderer directly from a new command, or its leftovers pile up in the system temporary folder on drive C.
- Node is a loose binary at `F:\node.exe`. ffmpeg, espeak-ng, uv and fluidsynth are Scoop installs under `~/scoop`. espeak-ng needs `ESPEAK_DATA_PATH`, which Scoop set as a user variable.

## Permanent rules (proven)

(empty at start; filled only by promotion)

## Engine version

v0.1
