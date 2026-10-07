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

| Need                                                       | Look in                                                                                                        |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| The character puppet (put a whole person on screen)        | `engine/src/rig/Character.tsx`                                                                                 |
| Poses                                                      | `engine/src/rig/poses.ts`                                                                                      |
| Actions by name (every one is in `ACTIONS`)                | `engine/src/rig/actions.ts`                                                                                    |
| Walks, mood walks, run, carry, push, pull                  | `engine/src/rig/walk.ts` (`WALKS`, `GAITS`)                                                                    |
| Jump, falls, punch, swing, recoil                          | `engine/src/rig/moves.ts`                                                                                      |
| Moves one after another (sneak, then run, then jump)       | `chainAt` in `engine/src/rig/chain.ts`                                                                         |
| Moving between poses (wind-up, settle)                     | `poseAt` in `engine/src/rig/pose.ts`                                                                           |
| A change inside a shot (walk in and stop, stand up)        | `then` on a person in the storyboard (`actorMoments`)                                                          |
| Life in a hold: blinks, breathing, weight, eye darts       | `engine/src/rig/life.ts`                                                                                       |
| Head turns; swinging capes, hair and held things           | `engine/src/rig/turn.ts`, `engine/src/rig/follow.ts`                                                           |
| Expressions and talking mouths                             | `engine/src/face/expressions.ts`, `engine/src/face/talk.ts`                                                    |
| Skin tones and hair                                        | `engine/src/wardrobe/identity.ts`, `engine/src/wardrobe/hair.tsx`                                              |
| Everyday clothes, mixed with `outfitFrom`                  | `engine/src/wardrobe/garments.tsx` (cloth names, never colors)                                                 |
| Costumes                                                   | `engine/src/wardrobe/costumes/`, by name in `wardrobe/cast.ts`                                                 |
| Ages (child, adult, elder)                                 | `age` on the Character in `engine/src/rig/Character.tsx`                                                       |
| Saved characters (only for a series)                       | `characters/<id>.json`, drawn with `castFromCard` in `cast.ts`                                                 |
| Props, and putting them in a hand or a scene               | `engine/src/props/` (`InHand` and `Placed` in `Hold.tsx`)                                                      |
| Sun, Moon, Earth, planets, asteroid, black hole, rocket    | `engine/src/props/Sky.tsx`, `Rocket.tsx`; a shot hangs them with `y` and `size`, and `tall` for a tall picture |
| Effects (tears, anger, stars, symbols, flash)              | `engine/src/effects/`                                                                                          |
| Explosion, fire, smoke (stood in a scene like a prop)      | `engine/src/effects/Blast.tsx`                                                                                 |
| Places by name (street, forest, castle, home)              | `PLACES` in `engine/src/backgrounds/places.ts`                                                                 |
| Backgrounds and their palettes (`endless` for chases)      | `engine/src/backgrounds/`                                                                                      |
| Shot sizes: wide, medium, close-up, over-shoulder          | `engine/src/camera/Framing.tsx`                                                                                |
| Camera moves (push-in, shake, pan, fade), captions         | `engine/src/camera/Camera.tsx`, `engine/src/overlays/`                                                         |
| Title cards and labels                                     | `engine/src/overlays/Titles.tsx`                                                                               |
| Big number, arrow with a label, orbit diagram              | `engine/src/overlays/Explain.tsx`; a shot's `overlay` of kind number, pointer or orbit                         |
| A page's mark and closing card                             | `engine/src/overlays/Brand.tsx`, set in `brands/<brand>.json`                                                  |
| The cover picture (four title styles)                      | `engine/src/stage/Cover.tsx`; the shot is the storyboard's `cover`                                             |
| Music moods (nine), written as notes                       | `MOODS` in `audio/src/studio_audio/music.py`                                                                   |
| Sound effects (eleven), made from scratch                  | `EFFECTS` in `audio/src/studio_audio/sfx.py`                                                                   |
| The mix: voice, music and effects into one track           | `audio/src/studio_audio/mix.py`, plan in `shared/src/sound.schema.ts`                                          |
| The script: words, speakers, beats, chapters; its rules    | `shared/src/script.schema.ts`, run tools in `cli/src/script-stage.ts`                                          |
| Two worked script runs (refined, and used as it is)        | `runs/2026-10-06-honest-farmer/`, `runs/2026-10-06-honest-farmer-as-is/`                                       |
| The shot planner: draft, staging rules, shot list page     | `shared/src/plan.ts`, command in `cli/src/plan.ts`                                                             |
| A worked shot plan (30 shots, 2 parts, 6 people)           | `runs/2026-10-06-honest-farmer/storyboard.json` and `storyboard.md`                                            |
| The storyboard builder: any shot as a picture              | `engine/src/stage/` (`ShotPicture.tsx`, `layout.ts`, `props.tsx`, `StoryboardVideo.tsx`)                       |
| A shot worked out for one frame, before it is drawn        | `stageShot` in `engine/src/stage/staging.ts` (the picture and the self-check share it)                         |
| The self-check: checks, questions, the report page         | `shared/src/qa.ts`, `shared/src/qa.schema.ts`; the pictures measured in `engine/src/stage/measure.ts`          |
| The output: shapes, one sound for the whole, same-pictures | `shared/src/output.ts`, `cli/src/output.ts`, `cli/src/media.ts`                                                |
| Part, voice script, shot times, sound plan                 | `shared/src/assembly.ts`, command in `cli/src/make.ts`                                                         |
| The storyboard: a video's master file, and its rules       | `shared/src/storyboard.schema.ts`, checked by `storyboard.check.ts`                                            |
| A worked example storyboard                                | `shared/src/fixtures/moon-tax.storyboard.json`                                                                 |
| Formats, brands and voices (one JSON file each)            | `formats/`, `brands/`, `voices/`, rules in `shared/src/plugins.schema.ts`                                      |
| Worked examples of whole videos                            | `engine/src/compositions/LookTest.tsx`, `MoonTax.tsx`                                                          |
| A worked action scene (chase, fight, camera)               | `engine/src/sandbox/part-h.tsx`                                                                                |
| A worked story scene (places, props, shots, titles)        | `engine/src/sandbox/part-l.tsx`                                                                                |
| Pictures of every piece                                    | `library/catalog/`, `knowledge/golden/assets/`, `npm run sheets`                                               |

## Repository layout and commands

- `shared/` Zod schemas shared by every part. `engine/` Remotion (React, TypeScript). `cli/` orchestrator. `audio/` Python workers managed by uv.
- `npm run doctor` reports every tool version. `npm run bench` renders the test scene and measures speed.
- `npm run look-test -- --all` builds the Phase 1 look test (voice, stills, video, style match sheets); `--audition` speaks the audition lines in every American English Kokoro voice. Each stage runs alone too.
- Voice: `cd audio && uv run python -m studio_audio.voice synth --script <voice-script.json> --out <dir>` writes `voice.wav` and `timings.json` (contract in `shared/src/voice.schema.ts`). Kokoro 0.9.4 gives word timestamps itself.
- Script: `npm run script -- new --run=<name> --mode=<as-is|refine|original> [--format=] [--from=<Biku's script>] --request="..."` makes `runs/<today>-<name>/` with his request and his script untouched. Claude then writes `script.json` (the words, who says them, each line on a beat of the format; contract in `shared/src/script.schema.ts`). `chapters --run=` splits it into parts of at most a minute, `check --run=` holds it to its mode's rules (as-is: word for word; refine: every change listed, every number kept, none invented; original: sources for factual formats), and `page --run=` writes `script.md` for Biku. The writing rules are in `knowledge/playbooks/general.md`; a file in `prompts/` replaces them.
- Shot plan: `npm run plan -- menu` lists everything a shot can use by name. `draft --run=` lays the checked script out as `storyboard.json` (scenes, lines, words cut into shots of 2 to 4 seconds) with every decision marked "todo"; Claude then decides each scene's place and each shot's people, poses, faces, camera and sound. `check --run=` runs every check (names against the library, staging rules, word for word against the script), `needs --run=` is the library check (what the video uses and what must be drawn first), and `page --run=` writes `storyboard.md`, the shot list Biku reads. The planning rules are in `knowledge/playbooks/general.md`.
- Build a part: `npm run make -- --run=<run> --part=<n> [--size=16:9|9:16|4:5] <stages>` builds one part of a video from the storyboard into `runs/<run>/part-<n>/`. Stages: `--voice` (Kokoro speaks the part's lines), `--time` (the voice's times go into the shots), `--sound` (music and effects from the storyboard, mixed under the voice), `--stills` (one still per shot and sheets of them all), `--preview` (a half-size video to check first, numbered like the finals, in `part-<n>/preview/`), `--video` (the part as a video; each render gets the next version number), or `--all` (everything but the preview). It refuses a plan with a problem in it or something the builder cannot put on screen. Look at the sheet of stills before rendering the video. Left out, the size is the brand's first.
- Self-check: `npm run qa -- --run=<run> --part=<n> [--size=]` checks the newest video of a part (Part 2, section 12). It measures the file, the sound and every frame of the pictures, runs the plan's own checks again, and cuts a strip of frames across every move and every change of shot into `part-<n>/qa/<video>/`. Claude then looks at every still (Style Check and story check) and every strip, and writes what it saw in `part-<n>/qa-look-<shape>.json`; a look at an older render does not count. It writes `part-<n>/qa-report-<shape>.md`, the page Biku reads, and ends with an error while anything is left to fix. Run it after `--video` and before showing a part. With `--preview` it checks the preview. A look taken at another render of the part (its preview, or an earlier final) stands for this one when every frame is measured to show the same picture, so: preview, check and look, then `--video` and check again.
- Output: `npm run output -- --run=<run> [--sizes=16:9,9:16] [--vertical=full|teaser] [--cover=side|words|ribbon|band]` makes the finished files of a video in `runs/<run>/out/` and writes `runs/<run>/delivery.md`, the page that says what to upload where. The shapes are the page's usual ones (the brand file), or the ones given here, which are then kept in the run's `run.json`; the vertical shape is the whole video or a teaser (part 1 alone). For each file it takes the newest video of every part in that shape (each must have passed `npm run qa` as that very video), mixes the sound once for the whole video (`runs/<run>/cuts/<kind>/`), joins the pictures (dark before a part that opens on a fade), adds the brand's closing card when there is one, writes one captions file, draws the cover (the storyboard's `cover` names the shot) and checks the finished file. Claude then looks at the strip across each join and at the cover (`out/look/<name>/`) and writes `out/<name>.look.json`. Nothing is written over: each file takes the next version number.
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
