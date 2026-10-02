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

## Repository layout and commands

- `shared/` Zod schemas shared by every part. `engine/` Remotion (React, TypeScript). `cli/` orchestrator. `audio/` Python workers managed by uv.
- `npm run doctor` reports every tool version. `npm run bench` renders the test scene and measures speed.
- `npm run sheets` renders the sandbox contact sheets for the draw, look and fix loop (`--only=poses`, `--video`, `--golden`). Look at them before calling any drawing done.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run format` must pass at the end of every phase.
- Python: `cd audio && uv run pytest` and `uv run python -m studio_audio.doctor`.
- Node is a loose binary at `F:\node.exe`. ffmpeg, espeak-ng, uv and fluidsynth are Scoop installs under `~/scoop`. espeak-ng needs `ESPEAK_DATA_PATH`, which Scoop set as a user variable.

## Permanent rules (proven)

(empty at start; filled only by promotion)

## Engine version

v0.1
