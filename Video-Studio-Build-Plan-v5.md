# Video Studio: Complete Build Plan v5

**Owner:** Biku
**Builder and operator:** Claude Code
**Replaces:** Build Plan v4 and Ink Stick Style Guide v1 (both kept for reference). This one file contains everything: the plan and the full art style.
**Purpose:** One self-contained application on Biku's computer that Claude operates to turn a script or an idea into a finished, engaging narrated video in the Ink Stick 2D cartoon style, where Claude draws every picture itself, and that gets better with every video.

**What changed from v4:**
1. The style guide is now inside this file (Part 3), so there is only one file to give Claude Code.
2. New section on how Claude draws the pictures: the draw, look and fix loop (Part 2, section 6).
3. Engineering standards, tests and acceptance checks for every phase (Part 2, sections 3 and 18).
4. A build status file so the build can stop and continue across sessions without losing work (Part 2, section 1).
5. Exact setup steps for Claude Code in VS Code (Part 4).

---

## Part 1. The idea in plain language

### 1. Who does what

Biku talks to Claude. Claude runs the application. Biku never touches the application directly.

```
   BIKU                    CLAUDE                    THE APPLICATION
   gives a script   -->    writes or refines   -->   makes the voice,
   or an idea              the script, plans         animates the scenes,
                           every shot, runs          makes music and
                           the application,          sound effects,
                           checks the result         renders the video
        ^                         |
        |                         v
        +---- finished video and a short summary
```

### 2. Who draws the pictures: Claude

There is no image generator. Claude draws every character, costume, prop and background as code: circles, lines, curves and colored shapes, following the exact rules in Part 3.

**Worked example: drawing a king for the first time.**

1. Claude writes the shapes: a round off-white head, two thick black stick arms, a gold crown made of five points, a crimson cape, gray armor plates with small gold buttons, a white glove.
2. The application turns those shapes into a picture.
3. Claude looks at the picture and compares it with your two reference pictures and the style rules. Is the outline thick enough? Is the head a quarter of the body? Are the brows heavy enough to look stern?
4. Claude fixes what is off and looks again, until it passes.
5. The king is saved into the library.

The next time any video needs a king, the saved one is reused instantly: new pose, new expression, same character. Drawing happens once. After that, the library grows with every video, and videos get faster to make.

Because everything is shapes, the characters can move. An arm is a line with a joint at the elbow, so the application can bend it, wave it, or put the hand on a ship's wheel.

### 3. Three ways to start a video

| You say | What Claude does |
| --- | --- |
| **"Use my script as it is"** | Uses every word exactly as you wrote it. Claude only plans the pictures, pauses, music and sound. |
| **"Refine my script"** | Keeps your story and facts, makes the opening grab harder, smooths it for the ear, tightens slow parts. Your original is saved, and the summary lists what changed. |
| **"Make a story about X"** | Researches the subject, writes a complete engaging script from scratch, then makes the video. |

**Worked example.** You paste a 300-word script about a forgotten soldier and say "refine it". Claude moves the most dramatic moment to the first sentence, cuts two slow lines, splits long sentences so they sound natural spoken aloud, and keeps every fact. The summary says: "Opening moved, 2 lines cut, 6 sentences split. Original saved."

### 4. The look: Ink Stick

The look combines Biku's two reference pictures. The full rules are in Part 3. In short:

- **Characters** come from the robbery picture: big round heads, thick black stick limbs, black mitten hands, big eyes and heavy eyebrows that show every feeling, flying sweat drops when someone is scared.
- **Costumes** come from the king picture: when a character needs one, a full outfit is drawn over the stick body, like the crown, red cape and armor.
- **Backgrounds** come from both: a soft stormy sky with light rays for dramatic moments, and a simple flat night scene with a moon for everyday and comedy moments.
- **The key rule:** characters and props have thick black outlines, backgrounds have none.
- **Who is who:** when it matters to the story, characters get real skin tones from light to very dark, and hair such as afros, braids, locs and fades.

### 5. How one sentence becomes the picture

Each sentence is split into short shots of 2 to 4 seconds, and the characters act out the words.

**Worked example.** The narration says:

> "He waited until the officers went ashore, then took the wheel."

| Shot | Seconds | What you see | Sound |
| --- | --- | --- | --- |
| 1 | 0.0 to 1.8 | Two stick-figure officers in caps walk off the ship under a crescent moon, in front of a flat violet night sky | Footsteps |
| 2 | 1.8 to 3.0 | Close-up: the main character peeks from behind a black silhouette barrel, brows low, eyes narrowing | Soft wind |
| 3 | 3.0 to 4.6 | He grips the ship's wheel, pale light rays break through the clouds behind him, the camera pushes in | Wooden creak, music rises |

### 6. The four building blocks

The engine is built once and never changes during a video run. Each video picks plug-ins:

- **Format:** the type of video. Story, explainer, top-list, quote, news short, promo.
- **Style:** the look. Ink Stick is the house style. Other styles can be added later.
- **Brand:** which page it is for: colors, fonts, captions, watermark, closing card.
- **Voice:** which Kokoro voice, at what pace.

### 7. It gets better with every video

```
   MAKE VIDEO  -->  SELF-CHECK  -->  YOUR FEEDBACK
                                          |
                                          v
   NEXT VIDEO  <--  UPDATE NOTES  <--  WRITE LESSONS
```

After each video you give a rating out of 10 and one line on what to change. That becomes a lesson the next video reads. Lessons that hold up across three videos become permanent rules in CLAUDE.md. CLAUDE.md stays short: proven rules only, with the detail in playbooks and a full history in a lessons log.

### 8. How the build happens

The build is split into 7 phases. Claude Code stops at three checkpoints so you can judge the result before it continues. After every phase it writes a short status file, so if a session ends, a fresh session continues exactly where it stopped. The build is never one long run.

### 9. Honest limits

- **Kokoro voice** is clear and natural but cannot act out emotion on command. Feeling comes from the writing, pauses, pace, music and the characters' faces.
- **Code-made music** is simple mood music, not a film score.
- **Cartoon, not lifelike.** Real people appear as Ink Stick characters, recognizable by costume, hair and setting, never as attempted likenesses.
- **The first drawings will be the roughest.** The look test at Checkpoint 1 and your feedback after each video are how it reaches the quality of your reference pictures.

---

## Part 2. Instructions for Claude Code

Read this whole file before writing anything. Build in the phases in section 18 and stop at each checkpoint. After the build, you are also the **operator** of this application (section 4).

### 1. Ground rules

1. **Everything runs locally.** No paid service and no API key is required for a complete video.
2. **Claude draws everything.** All visuals are vector shapes written in code following Part 3. No image-generation service, no traced or downloaded artwork.
3. **Engine and content are separate.** A video run writes data files only. It never edits engine code. Engine changes happen only through `/improve`.
4. **The storyboard file is the single source of truth** for a video.
5. **The style is binding.** Every visual value comes from `styles/ink-stick/tokens.json`. Never hard-code a color, line weight or proportion in a component.
6. **Never overwrite a delivered output.** New renders get a new version number.
7. **Every stage can be re-run alone** and skips work whose inputs have not changed.
8. **Plain-language reporting.** End every run and every phase with a short summary: what was made, where it is, what Biku needs to decide.
9. **Build status.** Keep `BUILD-STATUS.md` at the project root: current phase, what is done, what is next, open problems. Update it at the end of every phase and before any session is likely to end. A new session starts by reading it.
10. **Run budget.** A normal video run should finish in about 30 minutes. If it is heading past 45 minutes, stop and report why. During the build, finish each phase in as few sessions as possible and stop at checkpoints.
11. **Verify before you build.** Versions and commands were checked in October 2026. Confirm current install commands and Claude Code features in the official docs first.
12. **Read only what the run needs:** CLAUDE.md, the general playbook, the format playbook, the style playbook, tokens and the brand file.
13. **Original designs only.** The reference images define a style, not characters to copy. Do not copy any specific channel's characters, mascots, logos or branding.
14. **No em dashes** in any text the application writes for viewers.

### 2. Tech stack

| Job | Tool | Notes |
| --- | --- | --- |
| Video engine | **Remotion** (React, TypeScript) | Official starter. Install agent skills with `npx skills add remotion-dev/skills`. Use `remotion-best-practices` and `remotion-captions`. |
| Drawing | **SVG inside React components** | Characters, props and backgrounds are all SVG. Use Remotion's shape and path helper packages where useful. |
| Stills | Remotion still rendering | Used for the draw, look and fix loop, golden checks and the cover image. |
| Voice | **Kokoro TTS** (Python `kokoro` 0.9.4 or newer, `soundfile`) | Needs `espeak-ng` (on Windows, the official installer from the espeak-ng releases page). American English pipeline `lang_code='a'`. Has a `speed` setting. Apache 2.0. |
| Music writing | **music21** | Notes to MIDI. |
| Music sound | **FluidSynth** with one free-licensed SoundFont, plus **scipy/numpy** | Record the SoundFont license in `LICENSES.md`. |
| Sound effects | **scipy/numpy** synthesis | Whoosh, pop, thud, click, footsteps, wind, crowd murmur, creak, sweat-drop blip. Optional `sfx/` folder overrides. |
| Mixing | **pydub** plus **FFmpeg** | Ducking, fades, loudness. |
| Charts and maps | Remotion components with **D3** scales and free map data | Drawn in Ink Stick style. |
| Fonts | One heavy rounded open-licensed font | Bundle the font files locally. Record the license in `LICENSES.md`. |
| Python environment | **uv** | One locked environment under `audio/`. |
| Orchestrator | **Node/TypeScript CLI** | Calls Python workers and the Remotion renderer. |
| Data checking | **Zod** | Validates every plug-in file, character card and storyboard. |
| Tests | **Vitest** for TypeScript, **pytest** for Python, a pixel-diff library for golden stills | See section 3. |
| History and undo | **git** (local only) | Commit at the end of every phase and before and after every learning update. |

**Licenses:** Remotion is free for individuals and for-profit organizations of up to 3 employees; above that a company license is needed.

### 3. Engineering standards

Build to production standard, not a prototype.

- **TypeScript strict mode.** No `any` in engine code. Lint and format on every phase.
- **One repository, three parts:** `engine/` (Remotion), `audio/` (Python), `cli/` (orchestrator), sharing schemas from `shared/`.
- **Clear contracts.** Every hand-off between stages is a validated file: script, storyboard, timings, audio stems, stills, video. A stage fails fast with a plain-language error if its input is invalid.
- **Deterministic output.** The same storyboard always renders the same frames. Any randomness (idle motion, star twinkle) uses a seed from the storyboard.
- **Tests:**
  - Schemas: valid and invalid examples for every file type.
  - Rig: IK reaches targets; feet stay on the ground line during walk cycles.
  - Tokens: no component uses a color or weight outside `tokens.json`.
  - Audio: timings cover every word; loudness on target.
  - Golden stills: pixel-diff against saved stills within a small tolerance.
- **Logs.** Each run writes `runs/<run>/log.txt` with stage timings and any warnings.
- **Cross-platform.** Must work on Windows and macOS. Use Node path utilities, never hard-coded slashes. Phase 0 detects the operating system and installs accordingly.
- **Commits.** Small commits with clear messages. Commit at the end of every phase.

### 4. Operating the application (Claude's job after the build)

Claude is the operator. Biku gives a request in plain words. Claude decides the format, writes or prepares the script, plans every shot, draws anything new the library lacks, runs every stage, inspects the result and reports.

#### 4.1 Script modes

| Mode | Trigger | Rules |
| --- | --- | --- |
| `as-is` | "use my script", or `--mode as-is` | Narration and captions use Biku's words exactly. Do not change a single word. Pronunciation fixes go only into the pronunciation file. |
| `refine` | "refine my script", or `--mode refine` | Keep the story, the facts and the voice. Improve the hook, rhythm for the ear, sentence length and slow passages. Save the original as `script-original.md`. List every change in the summary. Do not stop for approval unless Biku asked for it. |
| `original` | "make a story about X", or `--mode original` | Research the subject, write from the format recipe and playbooks, save sources. |

If Biku supplies his own master prompt in `prompts/`, it overrides the default writing rules.

#### 4.2 Writing for attention

Apply these in `refine` and `original` modes, and to shot planning in all modes:

1. **First 3 seconds:** the most striking image or line. No greetings, no logo intro.
2. **Stakes early:** make clear within 10 seconds what someone could lose or gain.
3. **Specific details** beat general statements: a name, a number, an object.
4. **Re-hook every 20 to 30 seconds:** a question, a turn, or a new danger.
5. **One idea per sentence.** Short sentences. Written to be heard.
6. **The picture changes every 2 to 4 seconds.**
7. **Faces carry the feeling.** Every shot with a character names the expression it needs.
8. **Pay off what the opening promised,** and end on a line worth remembering.
9. **Factual formats stay accurate.** Every claim traceable to a saved source.

### 5. Folder layout

```
video-studio/
  CLAUDE.md
  BUILD-STATUS.md
  LICENSES.md
  Video-Studio-Build-Plan-v5.md
  prompts/                      Biku's own master prompts (optional)
  .claude/commands/             video, review, improve, tidy, new-format,
                                new-style, new-brand, new-character, draw,
                                undo-lesson, scorecard
  formats/  brands/  voices/  characters/
  styles/
    ink-stick/
      guide.md                  Part 3 of this plan
      tokens.json               from Part 3, Style 12
      reference/                Biku's two reference images
  library/
    index.json                  every drawn asset with tags and version
  knowledge/
    playbooks/general.md
    playbooks/formats/<name>.md
    playbooks/styles/ink-stick.md
    lessons-log.md   scorecard.csv   engine-backlog.md
    golden/                     reference stills for regression checks
  shared/                       schemas used by every part
  engine/
    src/compositions/           one per aspect ratio
    src/rig/                    skeleton, poses, actions, IK
    src/face/                   eyes, brows, mouths, expressions
    src/wardrobe/               skin, hair, clothing tiers, costumes
    src/effects/                sweat, tears, anger mark, symbols, impacts
    src/backgrounds/            layers, skies, set kits, silhouettes
    src/props/
    src/camera/
    src/overlays/               captions, labels, charts, maps, cards
    src/sandbox/                one composition for drawing and checking a single asset
  audio/                        Python workers: voice, music, sfx, mix
  cli/
  runs/<date>-<slug>/
    request.txt  script.md  script-original.md  storyboard.json
    audio/  stills/  preview/  qa-report.md  review.md  log.txt
    out/   final videos, cover image, captions file
```

### 6. How Claude draws: the draw, look and fix loop

Every new character, costume, hair style, prop, set and effect is drawn this way, during the build and later during video runs.

1. **Read** the relevant parts of Part 3 and look at the reference images.
2. **Draw** the asset as an SVG React component that takes its colors, weights and proportions from `tokens.json`, and exposes options (pose, expression, colors, size).
3. **Render** it in the sandbox composition as stills: front, three-quarter and profile where it applies, on both a light and a dark background, and at phone size.
4. **Look** at every still and run the Style Check (Part 3, Style 11).
5. **Fix** what fails and repeat from step 3. Stop after 4 rounds and report what still looks wrong rather than looping.
6. **Save** the asset: add it to `library/index.json` with tags (for example `costume, royalty, medieval, crown`), and save one still as a golden reference.
7. **Reuse** it. Before drawing anything, search `library/index.json`. Only draw what is truly missing.

`/draw <description>` runs this loop on its own, so Biku can ask for a new character or prop outside a video run.

### 7. The Ink Stick system

This decides whether the videos look premium. Build it with the most care. Part 3 sets every rule; this section says how to build it.

#### 7.1 The rig

- SVG React components driven by a skeleton: head, torso, shoulders, elbows, hands, hips, knees, feet.
- A pose is data: root position, facing (left or right), head turn (front, three-quarter, profile), and joint angles.
- Limbs are thick round-capped strokes using the token weights. With sleeves or trousers they become outlined tubes that follow the bones.
- **Two-joint IK** for arms and legs so hands reach props (a wheel, a sword, a door handle) and feet stay planted on the ground line.
- Line weights scale with head size, so every character at the same size has the same line weight.
- Draw order: back arm, back leg, body and costume, front leg, head, front arm, held prop, effects.

#### 7.2 Faces

- Build the face parts and every expression in Style 3.6 as data presets.
- Expressions blend over 3 to 4 frames, never pop.
- Pupils aim at a `lookAt` target so characters look at each other or at a prop.
- Blinks every 2 to 4 seconds. Stern eyes as a variant for commanding or menacing characters.
- **Talking:** the speaking character's mouth cycles closed, half and open in time with the word timings.
- Features shift correctly for front, three-quarter and profile views.

#### 7.3 Identity and wardrobe

- Identity mode, the eight skin tones, the rim light on the darkest tones and the hair library exactly as in Style 3.4.
- Clothing tiers 0, 1 and 2 from Style 3.5. Costume pieces are layered SVG attached to bones, so they move with the body.
- **Character cards:** each recurring character is saved as `characters/<name>.json` (skin, hair, tier, costume pieces, colors, default expression, voice) so the same person looks the same in every shot and every video.

#### 7.4 Movement

- **Pose to pose:** snap into strong poses in 3 to 6 frames with a small overshoot, then hold with life (blinks, breathing, slight head bob).
- **Pose library:** stand, sit, kneel, lie, point, wave, shrug, cross arms, hands on head, hands up, hold object, lean, look up, look down, cower.
- **Action library:** walk, run, sneak, jump, fall, climb, push, pull, carry, fight, hug, cry, cheer, write, read, steer, row, salute, march, turn out pockets.
- Procedural walk and run cycles with feet locked to the ground.
- Anticipation before big moves. Squash and stretch on heads only, within the token limit.
- Effects animate as Style 8 says: sweat drops fly out and fade, symbols pop in with a small bounce.

#### 7.5 Backgrounds

- Two treatments from Style 5.2, chosen from the shot's mood: **simple** and **atmospheric**.
- Built in layers: sky, far, mid, near silhouettes, ground. Layers shift at different speeds when the camera moves.
- Soft gradients and blur are allowed **only** in backgrounds, never on characters or props.
- No outlines anywhere in a background.
- **Set kits:** night street, day street, field, forest, harbor and ship deck, castle and throne room, battlefield, office, classroom, laboratory, courtroom, church, home interior, city skyline, space.
- Ambient motion: drifting clouds, twinkling stars, gently pulsing light rays, swaying grass.

#### 7.6 Camera

- 2D camera on the whole scene: wide, medium, close-up, over-the-shoulder by framing and cropping.
- Moves: slow push in on emotional lines, pan, small shake on impacts. Plain cuts between shots.
- Framing and the caption-safe area exactly as Style 7.

#### 7.7 Props and overlays

- Props follow Style 4: outlined, bright, one glint, slightly oversized. Violence by implication only.
- Captions, labels, dates, counters, charts, maps and title cards follow Style 9.

#### 7.8 Interface for later

Build the visuals behind an `ArtProvider` interface so an image-generation service could later supply backgrounds without changes elsewhere. Anything it supplies must still pass the Style Check.

### 8. Formats

Each `formats/<name>.json` holds: `structure` (ordered beats), `lengthRange`, `shotLength` range, `hookRules`, `pacing`, `preferredShots` per beat, `backgroundTreatment` per beat, `musicArc`, `sfxDensity`, `captionMode`, `factRules`.

Starter formats: `story`, `explainer`, `top-list`, `quote`, `news-short`, `promo`. `/new-format` creates more by asking Biku plain questions.

### 9. Brands, voices and characters

- `brands/<name>.json`: page name, colors, fonts, caption look, watermark, closing card, default format, voice and sizes, and whether identity mode is always on.
- `voices/<name>.json`: Kokoro voice id, speed, pause scale, pronunciation file. Characters who speak in dialogue can each have their own voice.
- `characters/<name>.json`: as in 7.3.

### 10. The storyboard file

Design the full schema in Zod in `shared/`. A video is a list of scenes, and each scene is a list of shots:

```json
{
  "request": "refine my script about the harbor escape",
  "mode": "refine",
  "format": "story",
  "style": "ink-stick",
  "brand": "my-page",
  "voice": "deep-slow",
  "seed": 4182,
  "sources": ["..."],
  "appliedLessons": ["L-0007"],
  "cast": ["captain-main", "officer-1", "officer-2"],
  "scenes": [
    {
      "id": "s03",
      "beat": "turning-point",
      "narration": "He waited until the officers went ashore, then took the wheel.",
      "mood": "tense",
      "set": "harbor-night",
      "treatment": "atmospheric",
      "palette": "storm-slate",
      "shots": [
        {
          "id": "s03a",
          "words": "He waited until the officers went ashore,",
          "camera": { "framing": "wide", "move": "pan", "strength": 0.2 },
          "actors": [
            { "character": "officer-1", "action": "walk", "facing": "left", "expression": "neutral" },
            { "character": "officer-2", "action": "walk", "facing": "left", "expression": "smug" }
          ],
          "sfx": ["footsteps"]
        },
        {
          "id": "s03b",
          "words": "then took the wheel.",
          "camera": { "framing": "close", "move": "push-in", "strength": 0.4 },
          "actors": [
            {
              "character": "captain-main",
              "action": "grip-wheel",
              "headTurn": "three-quarter",
              "expression": "determined",
              "lookAt": "horizon"
            }
          ],
          "props": ["ship-wheel"],
          "effects": [],
          "sfx": ["wood-creak"]
        }
      ]
    }
  ]
}
```

After the voice stage, each shot carries its exact start and end time from the word timings. Shot length is always driven by the audio.

### 11. The production stages

1. **Understand:** pick mode, format, brand and voice. Use what Biku names, otherwise brand defaults, otherwise the best fit, and say which in the summary.
2. **Script:** apply the mode rules in 4.1 and the writing rules in 4.2.
3. **Shot plan:** split narration into shots of 2 to 4 seconds. Each shot acts out its words. Assign cast, set, treatment, palette, camera, poses or actions, expressions, props, effects and sound effects.
4. **Library check:** list every character, costume, prop and set the shots need. Draw anything missing with the loop in section 6.
5. **Voice:** generate per scene with Kokoro. Shape pacing with pauses, punctuation and per-scene speed. Keep pronunciation files; Kokoro accepts inline overrides in the form `[word](/phonemes/)`. Get word timings from Kokoro if the installed version provides them, otherwise align with a local Whisper model as the Remotion captions skill describes. Normalize loudness. Build behind a `VoiceProvider` interface.
6. **Music:** moods tense, sorrow, hope, triumph, reflective, curious, upbeat, calm, comic. music21 writes, FluidSynth plays, scipy adds held tones. Follow the format's `musicArc`, crossfade between moods. If `music/` holds tracks, use those instead.
7. **Sound effects:** synthesize and place per shot, at modest levels, never covering words.
8. **Mix:** pydub. Music dips under the voice and rises in pauses. Master to about -14 LUFS with true peak at or below -1 dB; confirm the current recommended level for Facebook video first.
9. **Stills and preview:** render one still per shot, then a preview video at reduced resolution. Inspect them (section 12).
10. **Final render:** sizes **1080x1920** (9:16), **1080x1350** (4:5), **1920x1080** (16:9), 30 fps, H.264, AAC. Captions from word timings, two lines maximum, readable on a phone, using `@remotion/captions`. Also export a cover image and an `.srt` file.
11. **Review:** the learning step (section 13).

### 12. Self-check

1. **Automatic checks:** length in range, no caption overflow, shots match audio, no silent gaps, loudness on target, files play.
2. **Style Check:** answer the ten questions in Style 11 for every still. Any "no" is fixed before rendering.
3. **Story check of every still:** characters inside frame, faces visible when they matter, the expression fits the line, hands on props, feet on the ground, the action matches the words, the setting fits the story.
4. **Preview check:** stiff or jerky motion, a picture held too long, sound effects drowning words.
5. **Playbook check:** every rule in the loaded playbooks was followed.
6. Fix what you find, then write `qa-report.md` in plain language.

Render final quality only after the preview passes.

### 13. The learning system

#### 13.1 Where knowledge lives

| File | Job | Read when | Size rule |
| --- | --- | --- | --- |
| `CLAUDE.md` | Permanent proven rules and pointers | Every session | Under 200 lines |
| `playbooks/general.md` | Current best practice for all videos | Every video | Under 150 lines |
| `playbooks/formats/<name>.md` | Best practice per format | Videos of that format | Under 120 lines each |
| `playbooks/styles/ink-stick.md` | Best practice for the Ink Stick style, learned from real videos | Every video in that style | Under 120 lines |
| `lessons-log.md` | Every lesson, dated, with evidence | Reviews and tidies only | Append only |
| `scorecard.csv` | One row per video | Reviews only | No cap |
| `engine-backlog.md` | Abilities the engine still needs | `/improve` only | Cleared as built |

Point CLAUDE.md at the playbooks using Claude Code's import syntax if the current version supports it.

The style guide changes only when Biku asks. Lessons about the look go into the style playbook first. A style lesson that holds up across 3 videos is offered to Biku as a guide update, saved as a new numbered guide version.

#### 13.2 Review after every video: `/review`

1. Ask Biku: rating out of 10, what worked, what to change. One line is enough. If Biku is not there, review from the self-check and mark `awaiting feedback`.
2. Gather self-check findings and measurements.
3. Check whether the `appliedLessons` helped.
4. Write 1 to 7 lessons into `lessons-log.md`:

```
L-0013 | 2026-10-08 | run: 2026-10-08-harbor-escape
Area: faces | Scope: style ink-stick | Source: Biku
Lesson: Angry brows are too thin to read on a phone. Use the top of the brow weight range.
Evidence: Biku said the officer did not look angry enough.
Status: active
```

Areas: script, hook, pacing, voice, shots, poses, motion, faces, wardrobe, backgrounds, camera, music, sfx, mix, captions, length, engine. Sources: Biku, self-check, retrospective, metrics.

5. Save `review.md` and add a row to `scorecard.csv`.

#### 13.3 Applying lessons

- **From Biku:** active at once, written into the matching playbook immediately.
- **From self-check** fixing a clear fault: active at once.
- **From Claude's own retrospective:** start as `trial`. Become `active` if the next video using them rates the same or better and Biku does not object; otherwise `rejected` and removed.
- Lessons needing new engine ability also go into `engine-backlog.md`.

#### 13.4 Promotion to CLAUDE.md

A lesson moves into CLAUDE.md's permanent rules when it has held up across 3 videos or 2 formats, or when Biku says it applies to everything.

#### 13.5 Tidying: `/tidy`

Every 5 videos, or when a file passes its size rule: merge repeats, remove replaced rules (newer Biku feedback always wins), resolve conflicts using the scorecard, rewrite each playbook as a clean guide, bring files under their size rules. Never delete from `lessons-log.md`; mark entries `merged` or `superseded`. Report the changes in plain language.

#### 13.6 Engine improvements: `/improve`

Build backlog items on a git branch. Re-render the golden stills and compare; nothing that worked before may break. Bump the engine version in CLAUDE.md. Add a golden still for every new pose, action, expression, costume, set or prop.

#### 13.7 Undo and safety

- Commit before and after every review, tidy and improve.
- `/undo-lesson <id>` removes a lesson and marks it `withdrawn`.
- **Lessons can never weaken:** factual accuracy and sources, the `as-is` word-for-word rule, the style guide (changed only by Biku), asset licenses, platform policies, no likeness of real people, original designs only, violence by implication only, loudness limits, the run budget, the never-overwrite rule. A conflicting lesson is recorded as `blocked` and Biku is told why.

#### 13.8 Measuring improvement

`scorecard.csv`: date, run, mode, format, brand, length, Biku rating, style-check failures found, issues fixed, new assets drawn, render minutes, lessons applied, lessons added, and later views, average watch time and 3-second hold if Biku enters them. `/scorecard` shows the trend in plain language with a simple chart.

### 14. Starting CLAUDE.md

```markdown
# Video Studio

## What this is
A local application that Claude operates to turn a script or idea into a
finished narrated video in the Ink Stick 2D cartoon style. Claude draws
every picture as code. Owner: Biku.
Plan: Video-Studio-Build-Plan-v5.md. Style: styles/ink-stick/guide.md.
Build progress: BUILD-STATUS.md (read it first in every session).

## Ground rules
(copy Part 2, section 1 of the build plan)

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

## Permanent rules (proven)
(empty at start; filled only by promotion)

## Engine version
v0.1
```

### 15. Commands

| Command | Does |
| --- | --- |
| `/video <request>` | Full run ending with `/review`. Options: `--mode as-is/refine/original`, `--script <file>`, `--format`, `--brand`, `--voice`, `--sizes`, `--preview-only`, `--redo-shot s03b` |
| `/draw <description>` | Draw a new asset with the loop in section 6 |
| `/review [run]` | Learning review |
| `/tidy` | Tidy the knowledge files |
| `/improve` | Build engine backlog items with golden checks |
| `/new-format`, `/new-style`, `/new-brand`, `/new-character` | Create a plug-in by asking Biku plain questions |
| `/undo-lesson <id>` | Withdraw a lesson |
| `/scorecard` | Show the improvement trend |

Biku does not need to remember these. Plain requests work, and Claude maps them to commands.

### 16. Speed and cost

- Cache every stage by a hash of its inputs. Re-rendering one shot must not re-render the whole video.
- Reuse characters, costumes, sets and props from the library.
- Set render concurrency from the machine. In Phase 0, measure seconds of render time per second of video for preview and final, and report it.
- Keep background blur light and reuse rendered background layers where possible; blur is the slowest part of a 2D render.
- During a run, do not read engine source or the lessons log unless something fails.

### 17. Future slots (design the interfaces now, do not build yet)

- **Local tool server (MCP)** exposing the studio's actions, so Claude can operate it from the Claude desktop app as well as Claude Code.
- **API script mode:** Claude API or ChatGPT writing scripts, so batch runs can happen without a chat open.
- Paid voice and image services behind `VoiceProvider` and `ArtProvider`.
- A simple local web page for starting runs, giving feedback with buttons and viewing the scorecard.
- Batch mode from a list of requests.
- Publishing presets for Facebook, YouTube Shorts, TikTok and Instagram.
- Importing real performance numbers into the scorecard.
- A link to Biku's content management system.

### 18. Build phases, checkpoints and acceptance

Each phase ends with its acceptance checks passing, a git commit, an updated `BUILD-STATUS.md`, and a three-line summary for Biku.

#### Phase 0. Setup

- Detect the operating system, CPU, memory and free disk.
- Install Node, uv, FFmpeg, espeak-ng and FluidSynth, using the right method for the operating system. Ask Biku before any install that needs administrator rights.
- Create the folder layout, `CLAUDE.md`, `BUILD-STATUS.md`, `LICENSES.md`, git.
- Save Part 3 of this file as `styles/ink-stick/guide.md` and its Style 12 block as `styles/ink-stick/tokens.json`.
- Move Biku's two reference images from the project root into `styles/ink-stick/reference/`.
- Render a simple test scene and measure speed.

**Acceptance:** every tool reports its version; `tokens.json` validates; a 5-second test video plays.
**Ends with:** plain report of what was installed and how long a 2:30 video will take to render.

#### Phase 1. Look test

- Rig with IK, face system with every expression, 6 poses, walk cycle, one costumed character, identity mode, both background treatments, captions, Kokoro voice with word timings, mouth movement.
- Every asset made with the draw, look and fix loop.
- A **15-second, 4-shot test** with original characters:
  1. An atmospheric dramatic shot with a costumed ruler.
  2. A simple night shot with two tier 0 or tier 1 characters.
  3. A close-up with a strong emotion and an effect.
  4. A walking shot.
- A **style match sheet**: each test still placed next to the reference images, with the Style Check answered.
- A **voice audition**: the same lines in every American English Kokoro voice.

**Acceptance:** all rig and token tests pass; every still passes the Style Check.
**Checkpoint 1. Stop.** Biku judges how close the look is to his references and picks voices.

#### Phase 2. Character and world

- Full pose and action libraries, effects, wardrobe and hair libraries, all eight skin tones, character cards, set kits, props, camera moves, overlays, `/draw`, `library/index.json`.

**Acceptance:** golden stills saved for every asset; library search finds assets by tag.
**Ends with:** contact sheet of poses, expressions, costumes, hair, skin tones and sets.

#### Phase 3. Sound

- Music moods, sound effects, mix, loudness.

**Acceptance:** loudness within target on every sample; no clipping.
**Ends with:** one sample per mood and an effects reel.

#### Phase 4. Full pipeline

- Script modes, shot planner, library check, formats, brands, self-check, preview and final quality, three sizes, cover, captions file.
- Make one full video in `refine` mode from a script Biku supplies.

**Acceptance:** the full run finishes within the run budget; the QA report is clean.
**Checkpoint 2. Stop.** Biku judges a complete video.

#### Phase 5. Learning system

- Knowledge files, `/review`, lesson rules, promotion, `/tidy`, `/undo-lesson`, `/scorecard`, golden checks, `/improve`.
- Review the Checkpoint 2 video with Biku's real feedback.

**Acceptance:** lessons written; playbooks updated; undo restores the previous playbook.
**Ends with:** plain report of the lessons and where they were saved.

#### Phase 6. Proof

- One video in `original` mode as an explainer, one in `as-is` mode as a top-list.
- Both must start from the updated playbooks with no engine edits.

**Acceptance:** both runs record the earlier lessons in `appliedLessons`.
**Checkpoint 3. Stop.** Biku confirms earlier feedback shows up in the new videos.

At each checkpoint give Biku the files to watch and a three-line summary. Do not continue until he answers.

---

## Part 3. The Ink Stick art style

**Style id:** `ink-stick`
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
**Characters and props have thick black outlines. Backgrounds have none.**

### Style 3. Characters

#### Style 3.1 Proportions

| Part | Rule |
| --- | --- |
| **Head** | A circle. It may be up to 10% taller than wide. Diameter is about **1/4 of standing height**, so heads are big. |
| **Neck** | None. The head sits directly on top of the torso. |
| **Torso** | One thick straight line, about 1.1 head diameters long, or a clothing shape built around that line. |
| **Arms** | Thick lines, upper and lower arm each about 0.6 head diameter, bending at the elbow. Smooth gentle curves allowed, never wobbly. |
| **Legs** | Thick lines, about 1.4 head diameters in total, bending at the knee. |
| **Hands** | Rounded mitten shapes with a small thumb bump, about 0.3 head diameter, filled black. On costumed characters with sleeves, hands become white glove shapes with outlined fingers. |
| **Feet** | Pure stick legs end in rounded line caps. With shoes: chunky outlined sneakers or boots. |

#### Style 3.2 Line work

| Line | Color | Weight (relative to head diameter) |
| --- | --- | --- |
| Outline of heads, costumes, props | `#16161A` | 4 to 5% |
| Stick limbs and torso line | `#16161A` | 7 to 8% |
| Inner details: folds, seams, buttons, teeth lines | `#16161A` | 2.5 to 3% |
| Eyebrows | `#16161A` filled shape | about 8%, tapered ends |

- Round line caps and round joins everywhere.
- Even, confident weight. No sketchy, broken or hairy lines.
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

- **Default mode:** white heads, black limbs and black mitten hands.
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
- **Eyes:** large white ovals with black outlines, each about 22% of head width. Black filled pupils about 40% of the eye. Pupils move to show where a character looks.
- **Stern eyes (from the king):** for cold, menacing or commanding characters, the eyes become black almond shapes under heavy brows.
- **Brows:** thick black tapered wedges. They carry most of the emotion.
- **Mouth:** a single line when calm. When open: dark interior `#3A1E22`, with teeth as a white band divided by thin lines when gritted.
- **No nose and no ears** by default.

**Expressions:**

| Emotion | Brows | Eyes | Mouth | Extras |
| --- | --- | --- | --- | --- |
| Neutral | Level, slightly raised | Open, pupils centered | Short flat line | |
| Happy | Arched up | Curved lower lids, or closed arcs when laughing | Wide upward curve, open when laughing | |
| Sad | Inner ends raised | Drooping lids, pupils low | Downward curve | Tear drops |
| Angry | Sharp V, inner ends low | Half-closed, small pupils, or stern eyes | Tight frown, or shouting with teeth | Red anger mark |
| Afraid | Raised high, slightly wavy | Wide, tiny pupils | Gritted-teeth grimace | Flying sweat drops |
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

### Style 7. Composition and camera

- **Characters are big.** In medium shots, head and torso fill 50 to 70% of the frame height. In emotional close-ups the head fills about 40% of the frame.
- **One or two characters per shot** by default. Crowds are tier 0 figures in the midground, smaller, still outlined.
- Characters face each other or turn slightly toward the camera. Eye direction should be clear.
- Put the key face in the upper third of the frame.
- Use background elements to frame the action: the moon in a top corner, a bush cropped by the frame edge.
- **Keep caption space clear:** the bottom quarter of a 9:16 frame stays free of faces and key action.

### Style 8. Motion

- **Pose to pose.** Characters snap between strong poses with quick transitions of 3 to 6 frames at 30 fps, then hold.
- **Life during holds:** blinks every 2 to 4 seconds, a slight head bob, brow twitches, breathing.
- **Talking:** three mouth shapes (closed, half, open) in time with the voice.
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
- Thin, sketchy or tapered outlines, except brows
- Outlines on backgrounds
- Gradients, textures or soft shading on characters
- More than one shadow tone per color
- Noses, ears, fingers on mitten hands or realistic anatomy
- Muddy, low-contrast character colors
- Blood, wounds or gore
- Copying any existing channel's characters, mascots, logos or branding
- Mixing in other art styles in the same video

### Style 11. Style Check for every still

Any "no" is fixed before rendering.

1. Does every character and prop have a thick black outline?
2. Is the background free of outlines?
3. Are characters brighter and more saturated than the background?
4. Is there at most one shadow tone per color, coming from the scene's light direction?
5. Are the heads round and about a quarter of body height?
6. Does the face clearly show the emotion the narration calls for?
7. Is identity mode on where the story needs it, with skin tone and hair correct?
8. Is the clothing tier the lowest one that still makes the character recognizable?
9. Is the caption area clear?
10. Is there no blood, wound or gore?

### Style 12. Machine-readable tokens

Save this as `styles/ink-stick/tokens.json`. The engine reads these values. The sections above explain them.

```json
{
  "id": "ink-stick",
  "version": 1,
  "line": {
    "color": "#16161A",
    "outlinePctOfHead": [0.04, 0.05],
    "limbPctOfHead": [0.07, 0.08],
    "detailPctOfHead": [0.025, 0.03],
    "browPctOfHead": 0.08,
    "cap": "round",
    "join": "round"
  },
  "proportions": {
    "headToHeight": 0.25,
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
  "face": {
    "eyeWidthPctOfHead": 0.22,
    "pupilPctOfEye": 0.4,
    "mouthInterior": "#3A1E22",
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
    "forest": ["#3E7D4A", "#2C5B35"]
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
    "blinkEverySeconds": [2, 4],
    "maxSquash": 0.08,
    "mouthShapes": ["closed", "half", "open"]
  },
  "captions": {
    "fill": "#F7F7F5",
    "stroke": "#16161A",
    "emphasis": "#E9C23B",
    "safeBottomPct916": 0.25
  },
  "clothingTiers": ["pure-stick", "partial", "full-costume"],
  "violence": "implied-only"
}
```

---

## Part 4. How to start (for Biku)

1. Make an empty folder named `video-studio` on your computer.
2. Put three things inside it: this file, and your two reference pictures.
3. Open the folder in VS Code.
4. Start Claude Code in VS Code with that folder open.
5. Paste this line:

> Read Video-Studio-Build-Plan-v5.md fully. The two images in this folder are the style references. Build Phase 0 and Phase 1, then stop at Checkpoint 1 and show me the look test, the style match sheet and the voice audition.

6. Claude Code will ask your permission before installing tools and running commands. Approve the ones for this build.

**If a session ends before a phase is finished,** open Claude Code in the same folder and paste:

> Read BUILD-STATUS.md and continue the build from where it stopped.

**After the build,** just talk to Claude in that folder, for example: "Refine this script and make the video" followed by your script.
