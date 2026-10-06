# Build Status

**Current phase:** Phase 4 (the full pipeline), steps 4A (foundation), 4B (script), 4C (shot planner), 4D (assembly) and 4E (self-check) done (2026-10-06). Phases 0 to 3 are complete. Next step is 4F (output), started only when Biku asks. Checkpoint 1 questions 2, 4 and 5 are still open.
**Next:** Biku watches both parts of the sample story, each with its self-check report. Part 1: `runs/2026-10-06-honest-farmer/part-1/out/honest-farmer-part-1-16x9-v13.mp4` and `part-1/qa-report-16x9.md`. Part 2 (rendered after his "continue"): `runs/2026-10-06-honest-farmer/part-2/out/honest-farmer-part-2-16x9-v3.mp4` and `part-2/qa-report-16x9.md`. Both pass. He says what to change, or "start 4F" (output: his choice of shapes, the vertical layout, joining the parts, cover, captions file). Before the test video in 4G he needs to give: a script, a name for his page, and his pick of voices.
**Decided for Phase 4 (Biku, 2026-10-06):** his videos will be about 2 to 3 minutes. Biku proposed making them as parts of at most 1 minute from one script and combining them at the end. Agreed, with the studio doing the joining: one script is split into chapters of up to a minute at natural story breaks, each chapter is built and checked alone (so each fits the run budget and can be redone alone), then the chapters are joined into one final video in every size with one captions file; the chapters are kept too. Phase 4 must make the joins invisible: saved characters reused in every chapter, one voice and one loudness, music planned over the whole script so cuts fall on a pause or a mood change, the title only on the first chapter and the closing card only on the last. (The plan's 30-minute run budget then applies to a chapter, not to the whole video; this is Claude's reading and should be confirmed with Biku when Phase 4 starts.)
**Also decided (Biku, 2026-10-06):** in a video made in parts, the studio stops after each part of about a minute and shows it; it goes on to the next part only when Biku says so ("so that its better than making all the video at once"). So a chapter is a checkpoint: no later chapter, no extra size and no joined video is rendered ahead of his go. Agreed by Biku the same day ("thats fine"): each chapter is shown in the phone size only, and the other two sizes and the joined video are made once every chapter is approved.
**Last updated:** 2026-10-06

## Checkpoint 1: waiting for Biku

Review file: `runs/2026-10-03-look-test/checkpoint-1.md`. Questions: (1) how close the look is and what to change, (2) narrator and character voices, (3) head size (answered 2026-10-06: fine as it is), (4) hair colors (guide v3), (5) fingers on hands that cover the face.

**Question 1 (2026-10-04): Biku said not close enough yet, then said go.** Faces round 4 is built (section below, guide v7). Question 1 is open again: Biku needs to look at `runs/2026-10-03-look-test/out/face-match.png` and say whether the frightened face and the wrinkles are close enough now.

## Phase 4. The full pipeline: steps (split agreed with Biku, 2026-10-06)

Each step ends with something Biku can look at, a commit and an update here. Start a step only when Biku asks.

- **4A. Foundation: done (2026-10-06).** The storyboard (a video's master file), the first brand file, the six format templates, voices.
- **4B. Script: done (2026-10-06).** The three script modes (as-is, refine, original) and splitting a long script into chapters of at most a minute.
- **4C. Shot planner: done (2026-10-06).** A script turned into a full storyboard: who, where, doing what, camera, music, effects.
- **4D. Assembly: done (2026-10-06).** A video built from a storyboard automatically, with voice, sound and captions.
- **4E. Self-check: done (2026-10-06).** The automatic checks and the plain-language QA report.
- **4F. Output.** Preview first, then the three sizes, cover image, captions file, and joining chapters.
- **4G. The test video.** One full 2 to 3 minute video in refine mode from Biku's script, made chapter by chapter, then Checkpoint 2.

## Phase 4E. Self-check: done (2026-10-06)

Asked by Biku ("part 1 seems fine now we will start phase 4E"). A finished part now checks itself before he sees it: `npm run qa -- --run=<run> --part=<n>` (Part 2, section 12).

### Made

- **Fourteen measured checks** of the newest video of a part: the file plays (size, speed, picture and sound, played through); the length; picture and voice in step (no gap between shots, the voice says the plan's words, each line heard over its own pictures); no dead silence; loudness and peak of the finished file; nothing drowning the words; captions fit; everyone inside the picture; no face under the title, a label or the captions; feet on the ground; nothing jumping; no picture held too long; whatever is picked up within reach; the plan's own checks again.
- **The pictures are measured on every frame** from the same working-out they are drawn from (`engine/src/stage/staging.ts`, shared by `ShotPicture.tsx` and `measure.ts`), so what is measured is what is on screen: where each head lands, the title, label and caption boxes, feet against the ground, how far a head travels in one frame.
- **Four checks made by looking:** every still against the 11 questions of the Style Check (held word for word to the style guide by a test) and 7 story questions; a strip of frames across every move inside a shot and every change of shot that keeps someone on screen; the playbook. Claude writes what it saw in `qa-look-<shape>.json`; a look that was not taken, or was taken at an older render, does not count, so the part cannot pass on measurements alone.
- **The report Biku reads** (`qa-report-<shape>.md`): the verdict first, then what is left to fix, what is worth a second look, what was measured, what was looked at, what was found and put right on the way, and what the check cannot judge (how it sounds; whether the story holds him).
- **The planner learned from it:** it points out what is in a hand changing on a cut, a travelling shot cut against a still one of the same size, and holds a new scene in the same place to the same moment unless it fades in. Faces and poses carry across such a cut. The builder says plainly that it cannot show a thing being put down yet.
- **A chain of moves is body-aware:** walking into a kneel takes as long as any body move (`engine/src/rig/chain.ts`).
- **Tests:** 80 new (the checks, the ffmpeg readers, the look, the report, the measurements on every pose and action so nothing drawn on purpose is mistaken for a fault, the planner's new notes). 540 in all.

### What the first self-check found (part 1, v10, which Biku had passed)

Measured: clean. By looking at the frame strips: four faults. The story cut from the opening straight back to "that morning" and Tomas lost the bag between two frames (now a fade). A coin appeared in his hand from nowhere and was the bag in the next shot. The bag was in his hand in one shot and on the ground in the next. Two wide shots in a row, one travelling and one still, made him and the trees jump sideways. Mended in the plan: he walks up to the bag, kneels by it and stays there until he sees whose it is, then springs to his feet; the walk is a closer shot. Two smaller things: a face switched from laughing to sad on a hard cut, and one caption sat over the bag. Rendered again as v11 and v12; v12 passes. Lesson L-0031. Three cuts of the same kind in part 2 were mended in the plan.

### Part 2 built and checked (2026-10-06, after Biku's "continue")

- **A sleeping face** was drawn first (`expression/asleep`, the library's 205th piece): eyes gently closed, brows at rest, the mouth a little open. Looked at in three views on light and dark; reference picture saved. The style guide's header now says version 13, as its history and the tokens already did.
- **A fault in the build, found because part 2's first render failed** (lesson L-0032): the renderer was handed its sound before the engine was bundled, so a video made in the same go as its stills carried the mix of the render before. Part 1's v11 (never shown) had v10's sound; v12 was right only because the sound had not changed since. Fixed in `cli/src/make.ts`, and the self-check has a fifteenth measured check: the video is of this plan and this sound (a record written beside every video, and the sound inside the file compared with the mix second by second).
- **The look at part 2 found seven things**, all mended in the plan: a caption on his fist and bag in the walk to the castle (he now walks up to the gate in the soldiers' own wide shot); the queen's coin gone between two of her shots (the bag stands at her feet instead); the throne in a different place in the next scene; an exclamation mark cut off by the frame; his wife standing on his hat; the bag's top behind a caption in one closer shot; a caption left over a fade.
- **The planner now remembers** what each person held and which way they faced the last time they were seen, a few shots back, and where each thing stood. **A caption leaves with the last picture of its line.** **Walking into or out of the picture** is not counted as being out of it.
- **Both parts rendered a last time** (part 1 v13, part 2 v3) and compared frame by frame with the renders already looked at: part 1 differs only in five caption tails, part 2 only in the one shot the bag was taken out of. Both pass the self-check. 549 tests. The picture catalog has not been redrawn for the new face.

### Open after 4E

- **Biku has not seen part 1 since v10, or part 2 at all.** Part 1 (v13) changes shots he passed in v10: the coin shot is gone, and he no longer holds the bag in the field after the opening.
- **Worth his eye, in the reports:** the title ribbon touches the top of Tomas's hat for the first second; the queen's mark on the bag is spoken of but the bag has no mark drawn on it (a marked bag would have to be drawn); he sleeps on the bare floor, no bed is drawn; the coin the queen gives him appears in his hand, because one person handing a thing to another is not built.
- **For 4F, found by measuring the tall shape** (not built or shown yet): in a tall frame a shot that favours one of two people leaves the other outside the picture (s4b, s5c), and a closer title shot would put the title on the face. The check catches both; the tall layout has to be looked at in 4F.
- **For 4F, the finished file's colour range:** the video is stored as full-range (`yuvj420p`). It plays, and the check accepts it, but the final render should set the standard range; confirm in the Remotion docs first.
- **Not built:** putting a thing down inside a shot (the builder says so and the plan goes round it).
- **Not redone, on purpose:** the practice videos and the Moon Tax video still show the quick kneel from before guide version 13.
- **A real ear is still needed.** The check measures levels; it cannot hear.

## Phase 4D. Assembly: done (2026-10-06)

Asked by Biku ("start 4D"). A storyboard now becomes a video with no hand work: `npm run make` builds one part from the plan. Until now every video was a hand-written program of its own.

### Made

- **The storyboard builder** (`engine/src/stage/`): draws whichever shot is on screen from the storyboard alone: the place in the light the scene asks for, each person in their pose or action with their face, where they look, what they hold, the things standing around them, effects on heads, the camera (shot size, push-in, punch-in, shake, pan, travelling along with a walker), the title or a label, a fade. Faces and poses blend across a cut that keeps someone on screen; the speaker's mouth moves with their words; everyone blinks, breathes and sways.
- **Tall and wide from the same plan.** A scene is laid out once on a stage sized to the frame: in a wide frame people take a bigger share of the height, the shot sizes are closer, captions show one longer line low in the frame, and titles stay on one line. Wide (16:9) is the main shape for Biku's YouTube page and is what was built and looked at; tall draws and is tested, and gets its eyes-on check in 4F.
- **One part at a time** (`shared/src/assembly.ts`, `npm run make`): a part of the storyboard stands alone in `runs/<run>/part-<n>/`. Voice script from its lines (each speaker's own Kokoro voice, speed and pause), the voice, the voice's times written into the shots, the sound plan from the scenes' moods and the shots' effects, the mix, a still per shot with sheets of them all, and the video. A stage is skipped when its inputs have not changed. Renders are never overwritten.
- **What it refuses to build:** a plan with a problem; something the builder cannot put on screen yet (named in plain words); with the real voice, a shot more than 1.2 s over the format's limit or a part over 60 s.
- **Props by name** (`engine/src/stage/props.tsx`): every library prop can be held or stood in a scene. A seat turns to face the way its sitter faces.
- **Smaller changes it needed:** a place can be asked for in other light (`sceneBackground`); a cast member's look is built the same way as a saved card's (`lookFrom`); captions, titles and labels size themselves for any frame shape (`textBasis`); the draw commands wait longer for a slow first start.
- **The first automatic video:** part 1 of the Honest Farmer, 42.2 s, 1920x1080, 16 shots, 3 speakers' voices, 3 music moods, 8 sound effects. Sound: -14.0 LUFS, true peak -1.1 dB in the finished file. Rendered at about 2.3 s per second of video.
- **Tests:** 33 new (every shot of both worked storyboards draws in a tall and a wide frame; the hand-offs; what the builder can and cannot show).

### What was wrong on the way, and found only by looking

Lessons L-0023 and L-0024. Walking figures floated because their travel was taken off the body but not the planted feet. The title sat on the face. Captions sized for a tall frame covered the middle of a wide one. The walker slid backward when the camera travelled. Closer shots cut off the bag on the ground, the coin in the hand, and a standing person beside a lying one. A chair faced the wrong way. An unrelated one-sample slip in the held music tone stopped the mix.

### Feedback on part 1 (2026-10-06)

1. **"It's not being caught nicely, the hand is in front of the bag."** The bag's neck was shorter than the fist, so the fist covered it and sat on the bag. The bag now has a longer gathered neck that runs through the fist: cloth above the hand, the tie and the bag below (`engine/src/props/Bag.tsx`, version 2). Part 1 was rendered again as v3. Lesson L-0025.

2. **"When the wife says keep the gold the mouth doesn't move."** She wore the shouting face, whose mouth is already open, and the talking shapes never took over on an open mouth, so it stayed frozen. Any open-mouthed face (shouting, laughing, wailing, surprised) now closes and opens with the words while its owner speaks (`engine/src/face/talk.ts`, `Face.tsx`). Part 1 rendered again as v4. Lesson L-0026.

3. **"The daughter is not sitting properly on the chair, and the legs go through the shoes."** The chair was an adult's size wherever the plan put it; a seat now stands under its sitter, faces their way and is the size of their body. The wife's bare stick legs ran to the sole and their round ends showed as dots under the boots since the outline became a fine line; a bare leg now ends inside the shoe, as a trouser leg already did. Found on the way: the bag in the seated farmer's hand hung through the floor; a hanging thing is now lifted to rest on the ground, the plan stands the bag by the table, and a staging note warns of it. Part 1 rendered again as v5; the saved library pictures were retaken. Lesson L-0027.

4. **"Look at the shoes and legs, it's weirdly positioned"** (the opening shot, Tomas kneeling). The kneel pose laid the back shin flat on the ground and the boot stretched out behind it as one long shape. The back shin now slopes up to the ankle, so the foot has its toes tucked on the ground and its heel up (`engine/src/rig/poses.ts`). Part 1 rendered again as v6. Lesson L-0028.

5. **"It can't change the posture in continuous frames?"** It could not: the builder gave each person one pose for a whole shot, so every change happened on a cut. A person in a shot now has steps (`then` in the storyboard): partway through they move, in one continuous motion, into a new pose or action, change face, look somewhere else, or take a thing in the hand. Someone who walks in stops on their own spot. The camera follows a beat behind, so the body is seen to move instead of the room sliding. The shot list says each step in plain words, and a staging note points out a change of pose inside a close-up, which would hide it. Ten shots of the sample plan use it (six in part 1: he stands then kneels by the bag, walks up and stops in surprise, lifts the coin, the wife raises her arm to point, he gets up from his chair, his face turns from fear to thought). Part 1 rendered again as v8 (v7 was the first try, with the camera fault). Lesson L-0029. 11 new tests.

6. **"When it kneels and picks up the bag in the first few seconds its direction changes and looks like the posture didn't change in continuous frames."** Right twice. The kneel took two frames, and the next shot cut to him standing somewhere else, facing the other way, with the bag already in his hand. Now: a move of the whole body (kneeling, sitting down, getting up) takes 10 to 16 frames, smoothly, feet on the ground, where an arm or a head still snaps in 3 to 6 (style guide and tokens **version 13**, the one number is `motion.bodyMoveFrames`). A step that takes a thing standing in the shot is a real pick-up: the hand goes to it, closes on it, and only then does it leave the ground. The opening is one action over two shots facing one way: he sees the bag, kneels by it, looks round afraid, takes it, stands up with it, thinks. The planner now points out anyone who turns round, gets up or jumps somewhere on a cut; it found two more in part 2 (the queen leaving her throne, Tomas rising from his knee), both mended in the plan. Part 1 rendered again as v10 (v9 was the try before the bag was given more room). Lesson L-0030. 14 new tests. Not redone, on purpose: the practice videos (`npm run sheets -- --video`) and the earlier Moon Tax video still show the quick kneel; they are redrawn when Biku is happy with the speed.

### Open after 4D

- **Biku has not seen it yet.** Part 1 is the first thing made this way; his eye decides.
- **Part 2 is not rendered as a video** (voice, sound and stills are made). It waits for his word.
- **Missing from the library, found by this story:** a sleeping or eyes-closed calm face (the last shot has Tomas "asleep" with his eyes open).
- **The builder cannot yet show** an impact flash or motion lines (they live in the scene, not on a head), a thing standing on a table, a door opening, someone walking in or out, or a change of pose or face inside one shot.
- **The brand's watermark and closing card** are not drawn yet (4F).
- **A voice file's pronunciations** are not applied yet; all are empty.
- **Shot lengths:** two shots of part 1 ran 4.5 and 4.6 s against the 4 s limit, because the narrator speaks some lines slower than the estimate. They are noted, not refused.
- **Captions in a wide frame** sit over the ground, so they cross feet and things on the ground in wide shots.

## Phase 4C. Shot planner: done (2026-10-06)

Asked by Biku ("start 4C"). A checked script can now be turned into a full shot plan. Claude makes the directing decisions; the tools do the mechanical parts and hold the plan to the staging rules.

### Made

- **The draft** (`npm run plan -- draft`): the script laid out as `storyboard.json` with everything mechanical done: scenes by beat and part, every line copied word for word, the words cut into shots of 2 to 4 seconds at full stops and commas (never inside an emphasized phrase), each speaker on screen for their own line, the title on the first shot, the format's usual music and shot sizes. Every decision left is marked "todo", and the checks refuse a storyboard that still has one. An existing storyboard is never written over.
- **The menu** (`npm run plan -- menu`): every place, pose, action, expression, prop, effect, costume, camera move, music mood and sound effect by name, to plan from.
- **Staging rules** (`checkPlan` in `shared/src/plan.ts`, run by `npm run plan -- check`). Refused: a shot that shows nobody and nothing; two people with no positions, or on the same spot; someone who looks at a person while facing away from them; a speaker whose face is in none of the shots of their line; an over-the-shoulder shot without exactly one back; the title anywhere but the start of part 1; a shot that would stay on screen too long. Pointed out: a shot too quick to take in, the same picture twice in a row, four shots of one size in a row, music that does not suit the beat, a change of light on a plain cut, too few or too many sound effects.
- **Word for word against the script:** the plan must have the script's lines, words, speakers, beats and parts exactly.
- **The library check** (`npm run plan -- needs`, stage 4 of a run): every library piece the video uses, by kind, and what would have to be drawn first.
- **The shot list Biku reads** (`npm run plan -- page`): `storyboard.md`, each shot as a row with when it starts, who speaks, the words, what you see in a plain sentence ("Tomas kneels, surprised, looking at the bag"), and the sound.
- **The planning rules** are written in `knowledge/playbooks/general.md` ("The shot plan").
- **A full worked plan:** `runs/2026-10-06-honest-farmer/storyboard.json`, the refined Honest Farmer story as 30 shots in 9 scenes and 2 parts, with 6 people (Tomas, his wife, their daughter, the queen, two soldiers), 5 places, 15 sound effects and 5 music moods. It uses 83 library pieces and needs nothing drawn. It passes every check with nothing pointed out, and is what step 4D will build.
- **Tests:** 30 new.

### Open after 4C

- **Nobody has seen these shots as pictures yet.** A plan that passes every rule can still look wrong on screen; step 4D shows it.
- **What a shot cannot say yet:** a thing standing on a table, a door opening, someone walking in from off screen or from one spot to another, a change of pose or face inside a shot, two actions one after another. Step 4D will show which of these the storyboard has to learn first.
- **The directing is Claude's judgment.** The rules catch staging faults, not dull pictures. Biku's eye on the shot list and on the first built part is the real check.
- **The closing saying got its own line** in the sample script (n17), so the last picture can be Tomas asleep at home; the script page was rewritten.

## Phase 4B. Script: done (2026-10-06)

Asked by Biku ("start 4B"). The studio can now take a script in any of the three ways and get it ready for planning shots.

### Made

- **The run folder** (`npm run script -- new`): `runs/<date>-<name>/` with Biku's request, his script saved untouched as `script-original.md`, and the run's settings. A run is never overwritten.
- **The script as data** (`script.json`, `shared/src/script.schema.ts`): every line with who says it, its words, the beat of the format it plays and its part. Claude writes it; the tools check it.
- **The three modes, each held to its promise** (`npm run script -- check`):
  - **as-is:** the script must be word for word what Biku wrote, down to a comma. The check names the first word that differs. Marking a word for caption emphasis is allowed, since it changes no word. His words are not judged against the writing rules.
  - **refine:** his original must be saved, every change must be listed, every number he gave must still be there and none may be invented, the opening may not be a greeting, and there is no em dash.
  - **original:** a factual format (explainer, top-list, quote, news-short) is refused without saved sources.
  - Every mode: the format's beats in order with none missing, speakers with voices, the length inside the format's range (for as-is only a note, since no word may be cut).
- **Parts of at most a minute** (`npm run script -- chapters`): as few parts as fit, as even as they can be, cut where the story turns when that costs little. Parts are planned to 88% of the limit because a length guessed from word counts can be an eighth out.
- **Lengths from the real speaking pace:** the Kokoro voices speak about 195 words a minute (measured on the two voice tracks made so far). The first estimate used the formats' overall pace and counted pauses twice; Moon Tax now estimates at 27.3 s against a real 26.6 s.
- **The page Biku reads** (`npm run script -- page`): `script.md`, with the parts, who says what, what changed and where his original is.
- **The writing rules have a home:** `knowledge/playbooks/general.md` (the three modes, the nine writing rules of the plan, chapters, working with Biku) and a short playbook for each format in `knowledge/playbooks/formats/`. A file in `prompts/` (Biku's master prompt) replaces the writing rules, and the check holds a script to it.
- **A fourth placeholder voice,** `woman-calm`, so two women in one story do not share a voice.
- **Two worked examples from one sample script** (a 334-word tale written the way a first draft often is, with a greeting, a 44-word sentence and reported speech):
  - `runs/2026-10-06-honest-farmer/`: refined to 229 words, about 1:25, 2 parts, 10 changes listed, every number kept.
  - `runs/2026-10-06-honest-farmer-as-is/`: every word kept, about 1:57, 3 parts.
- **Tests:** 31 new.

### Open after 4B

- **The refining is Claude's judgment.** The check proves the promises (numbers kept, changes listed), not that the result is better. Biku read the sample on 2026-10-06 and answered the question about speech: "yes like with narration the stick figures need to speak themselves based on the script provided" (lesson L-0022, in the general playbook). How much may be cut in a refine is still not answered; the sample cut about a third.
- **Only numbers written as digits are protected** in refine mode. Names, places and numbers written as words are kept by care, not by the check.
- **Original mode's research** (finding and saving sources) is done by Claude during a run; nothing automates it.
- **Re-hooks every 20 to 30 seconds** and "specific beats general" are writing rules the check cannot test.

## Phase 4A. Foundation: done (2026-10-06)

Asked by Biku ("start phase 4A"). Nothing here makes a picture yet; it is the paperwork every later step stands on.

### Made

- **The storyboard** (`shared/src/storyboard.schema.ts`): the one file that describes a whole video (ground rule 4). A video is a list of scenes; a scene has a beat, a music mood, a place with its treatment and colors, the lines to speak and the shots; every shot acts out some of the words of one line and names the camera, who is in it, their pose or action, their expression, where they look, what they hold, effects, sound effects, and any title or label. The file refuses a storyboard that disagrees with itself: words that do not add up to their line, someone not in the cast, an actor with no expression, a look at someone who is not there, chapters out of order.
- **The storyboard check** (`shared/src/storyboard.check.ts`, `npm run storyboard -- check`): asks whether everything a storyboard names exists (every pose, place, prop, effect, costume, mood, voice, format and brand), whether the scenes follow the format's beats in order, whether a factual format has sources, and how long each chapter runs. Every problem is one plain sentence, and a missing library piece comes with the search command to run.
- **Six formats** (`formats/`): story, explainer, top-list, quote, news-short, promo. Each lists its beats in order with what each beat is for, the music and shot sizes that suit it, how long the video and a shot may be, the hook rules, the pace, how many sound effects suit it, and its fact rules. Story, explainer and top-list go up to 3 minutes. Explainer, top-list, quote and news-short need sources.
- **The first brand** (`brands/my-page.json`): a placeholder called "My Page" until Biku names his page. Gold emphasis in captions, crimson title ribbon, cream labels, no watermark and no closing card yet, all three sizes.
- **Three voices** (`voices/`): narrator, woman, man. Placeholders using the Kokoro voices of the earlier tests until Biku picks.
- **Chapters:** a scene carries its chapter number; a chapter is at most 60 seconds (`CHAPTER_MAX_S`), estimated from the word count before the voice exists and measured from the shot times after.
- **A worked example** (`shared/src/fixtures/moon-tax.storyboard.json`): the Moon Tax tale as a proper storyboard, 6 scenes and 13 shots of 2 to 4 seconds. It passes the check and is the first thing step 4D will try to build.
- **Tests:** 48 new (formats, brands, voices, storyboard shape, and the check against the real library and plug-in files).

### Open after 4A

- **The storyboard will grow.** Steps 4C and 4D will show what the planner and the assembly really need (exact stage positions, props on tables, timing inside a shot). The file has a version number for that.
- **Brand name, watermark and closing card** wait for Biku. He has not picked a niche yet (2026-10-06) and will give the page name later; `brands/my-page.json` stays a placeholder and nothing is blocked by it. On 2026-10-06 he shared niche research he got elsewhere (not a decision yet): for Facebook, "what if" science first and mythology second, as 60 to 90 second vertical videos; for YouTube, tech, finance and business case studies as 8 to 12 minute videos, with historical battles second; possibly one page per niche. Claude's view given to him: mythology fits today's library best, "what if" science is a good fit after a batch of new drawings (space, planets, city, laboratory) and needs sourced facts, and 8 to 12 minute YouTube videos are well beyond what the studio is built and tested for (charts, wide layouts, longer music, hours of rendering). Later the same day Biku said he also needs 3-minute videos on YouTube and that tech and finance explained could be a good part of it, since stick figures with several characters carry an explanation well even where drawings are missing. Still not a final pick. Open question put to him: on YouTube a vertical or square video of up to 3 minutes is treated as a Short (since 2024-10-15), while a wide one is a normal video, so he has to say which shape his YouTube videos should be; a wide-first video means laying scenes out for 16:9, which step 4F must then treat as a first-class size. **Answered the same day:** Biku will start on YouTube, asked what is best, and agreed to Claude's recommendation ("ah thats good"): wide (16:9) normal videos are the main shape for the YouTube page, with a tall cut made from the same script for Shorts and Facebook. So for that page scenes are laid out wide first, each part is shown to him in wide, and the tall version comes at the end. Claude's proposal for the tall cut, not yet confirmed: part 1 of the video (the hook, up to a minute) as the Short, pointing to the full wide video. In a brand file the first size in `defaults.sizes` is the main shape. **Requirement from Biku (2026-10-06):** "i need to be able to choose": which shapes a video is made in must be a choice for every video, with each page setting its own default. His defaults: YouTube page, wide and vertical both; Facebook page, vertical. Step 4F must build this: a page default in the brand file, an override per video when the run is started, and for the vertical cut a choice between a teaser (part 1) and the full video.
- **Voices** wait for Biku's pick (Checkpoint 1 question 2).
- **No general or format playbooks yet** (`knowledge/playbooks/general.md`, `formats/<name>.md`); the writing rules of the plan (section 4.2) get their home in 4B.

## Fine outlines, bold limbs (2026-10-06): guide version 12, confirmed by Biku

Biku first asked for the outer edges a little thinner (versions 10 and 11, two small steps), then asked to see a pencil-thin version to compare. He looked at five thicknesses side by side (`engine/out/sandbox/lines-compare.png`) and said the pencil-thin one looks better on the king but too thin on a plain stick figure. Three mixes followed (`engine/out/sandbox/lines-mix.png`, and `lines-mix-phone.png` at phone size) and he picked **mix B**.

**The style now (guide and tokens version 12):** the outline of heads, costumes and props is a fine pen line, 1.1 to 1.3% of head width (it was 4 to 5% at the start of the day); inner details 0.8 to 1%; face lines about 1.2% and face creases about 0.7%; stick limbs and the torso line stay bold at 5.4 to 6.2%, so a plain stick figure still reads on a phone. The guide's main rule and Style Check question 1 now say "clean black outline" instead of "thick". This is a deliberate move away from the heavy outlines of the two reference pictures.

**Fixed along the way:** the inner parts of four props (book, shield, chair and throne, door) carried their own fixed line thickness and stood out as heavy; they now use the style's detail line. Motion lines took the outline weight and nearly vanished; they now take their weight from the limbs.

**Confirmed:** Biku looked at the wider set (Moon Tax stills, people, props in use, shot sizes, faces) and said "this looks good".

**Still to look at with Biku:** the `!`, `?` and `...` symbols are white with a fine edge and are faint on a light background (fine on dark scenes). A plain figure has a fine ring for a head and bold limbs; Biku accepted that with mix B.

**Saved pictures retaken (2026-10-06):** all 31 check sheets, all 171 library pictures and the 8 catalog pages now show the new look. Videos already delivered (Moon Tax v1 to v5) and the Phase 2 test clips in `engine/out/sandbox/` are untouched and still show the old thick lines; a new render would get a new version number.

## Phase 3. Sound: done (2026-10-06)

Asked by Biku ("start phase 3"). The studio can now make music, sound effects and a finished mix, all on this computer.

### Made

- **Nine music moods** (`audio/src/studio_audio/music.py`): tense, sorrow, hope, triumph, reflective, curious, upbeat, calm, comic. Each is written as notes (a chord loop, a bass line, a tune in four-bar phrases, light drums where they fit), played by FluidSynth through a free instrument set, with a quiet held tone under four of them. Any length, and the same mood, length and seed always give the same music.
- **Eleven sound effects** (`audio/src/studio_audio/sfx.py`): whoosh, pop, thud, click, footsteps, wind, crowd murmur, creak, blip, hit, ding. All made from scratch; wind and crowd murmur run under a whole shot.
- **The mix** (`audio/src/studio_audio/mix.py`): the voice is never changed; music dips under it and rises in the pauses; effects sit under the voice and lower still on a word; the result is mastered to -14 LUFS with the true peak at or below -1 dB. It writes `mix.wav`, the music and effects on their own, and `mix.json` with the measured levels.
- **The sound plan** (`shared/src/sound.schema.ts`): a run's `sound-plan.json` says which mood starts when and which effect happens when. The same file holds the list of moods and effects and the loudness target, and tests on both sides fail if Python and the engine disagree.
- **Commands:** `npm run sound -- list | samples | reel | mix --run=<run> | check`, and a `--sound` stage in `npm run short`. The video uses the mix when the run has a sound plan.
- **Library:** 204 assets (20 new: 9 music moods, 11 effects), so `npm run library -- search danger music` finds the tense mood.
- **Own tracks:** a file in `music/` or `sfx/` named after a mood or effect replaces the studio's own.
- **Instrument set:** GeneralUser GS 2.0.3, 32 MB, in `audio/soundfonts/` on drive F, not in git; `uv run python -m studio_audio.soundfont fetch` gets it again. License and one caution recorded in `LICENSES.md`.

### Where to listen

`runs/2026-10-06-sound-test/sound-test.md` lists everything. In short: `runs/2026-10-06-sound-test/out/music-<mood>.mp3` (nine samples), `out/sfx-reel.mp3`, and `runs/2026-10-04-moon-tax/out/moon-tax-v5.mp4` (the Moon Tax short with sound; v1 to v4 are untouched).

### Measured (plan acceptance: loudness within target on every sample; no clipping)

- All nine mood samples: -14.0 LUFS, true peaks between -1.1 and -3.3 dB, none clipped.
- Effects reel: -14.04 LUFS, true peak -1.1 dB; no effect clipped.
- Moon Tax v5 mix: -14.04 LUFS, true peak -1.1 dB; the finished video file measures -14.0 LUFS and -1.1 dB with FFmpeg. Music 17.1 dB under the voice while someone speaks, 11.5 dB in the pauses.
- `npm run sound -- check` passes.

### Open after Phase 3

- **Listened to by Biku on 2026-10-06:** "everything is fine in my opinion". Claude still cannot hear; every later sound change needs his ears again (lesson L-0020).
- **The music is simple and loops.** A mood change happens at the planned time, not on a beat.
- **No automatic choice of music and effects.** A sound plan is written by hand until the shot planner in Phase 4.
- **The Phase 2 test clips have no sound.**
- **The instrument set's license has one caution** about where some samples first came from (`LICENSES.md`). Biku to say if he wants the larger MIT-licensed set instead.
- **Low sounds on phones:** thud, footsteps and hit were rebuilt to carry in the middle range (lesson L-0019); worth checking on a real phone.

## Drive C filling up (2026-10-06): fixed

Biku asked why drive C was filling up when the project is on F. Every picture the renderer drew left a browser profile folder in the Windows temporary folder on C, and every command left a built copy of the engine there: about 5,500 folders and 16 GB in four days. Biku deleted them by hand. Now every command keeps its scratch files in `.cache/tmp/` inside the project and deletes them when it ends (`cli/src/scratch.ts`), and one hidden browser is shared for a whole command instead of one per picture (`cli/src/render.ts`). Checked: a draw run leaves nothing behind on F or C. Lesson L-0018.

Still on drive C, by design of the tools, and not moved: the Python package cache (uv), the Kokoro voice model (Hugging Face cache, about 330 MB) and the npm cache. They do not grow with use. They can be moved to F if Biku wants.

## Phase 2F. Wrap-up: done (2026-10-06)

Asked by Biku ("start 2F"). Nothing new was drawn; everything was rendered again and checked.

- **Report for Biku:** `PHASE-2-REPORT.md` (what the library holds, where to look, checks, known gaps, questions).
- **Pictures:** all 31 check sheets (`knowledge/golden/rig-*.png`), all 171 library pictures (`knowledge/golden/assets/`), the 8 catalog pages (`library/catalog/`) and all 7 test clips (`engine/out/sandbox/*.mp4`) were rendered again after the dress fix.
- **Plan acceptance:** every piece that can be pictured has a golden still (171 of 171); the 13 without one are camera moves, shot sizes and on-screen text, which are judged in a shot (decided in 2A). `npm run library -- check` passes and library search finds pieces by tag (tested).
- **Checks:** 265 of 265 passed; typecheck, lint and format clean; 16 of 16 voice checks passed, all sound tools present.

## Phase 2E. World: done (2026-10-06)

Asked by Biku ("start 2E"). Stories now have places to happen in, things to hold, shot sizes and titles.

### Made

- **Ten props** (`engine/src/props/`): sword, shield, coin, bag, book (closed and open), lantern (with a flickering pool of light), cup (mug and goblet), door (swings open), chair (and a throne), table. Each is outlined, in bright token colors, with one shadow tone and one glint.
- **Holding and placing** (`engine/src/props/Hold.tsx`): `InHand` puts a prop in a hand so it turns with it, stays upright or hangs and swings; `Placed` stands one in the scene at the size of the characters.
- **Seven places** (`PLACES` in `engine/src/backgrounds/places.ts`): night street, day street, field, forest, castle, throne room, home interior. A place is a recipe for a background, so a scene can still change anything about it.
- **Rooms** (Style 5.3): a flat wall and floor, windows that throw light, a soft vignette; columns and banners for a hall, a shelf for a home.
- **Five new background shapes**: house (windows glow at night), castle, pine, lamp post, fence. Streets are paved, and their buildings take a stone tone instead of the grass tone.
- **Shot sizes** (`engine/src/camera/Framing.tsx`): wide, medium, close-up, over-the-shoulder. A scene is laid out once, wide; a closer shot is the same layout with the camera moved in (`Framed`), so the place and where people stand never change inside a scene.
- **Back view** (`back` on the Character): no face, hair and headwear cover the back of the head, a cape hangs over the body. For the near person in an over-the-shoulder shot.
- **Title card and labels** (`engine/src/overlays/Titles.tsx`): a ribbon banner for a title, a small box for a place, date or name, in the caption font. Text with an em dash is refused (ground rule 14).
- **Library:** 184 assets (33 new: 14 props, 7 places, 5 background shapes, 4 shot sizes, the back view, 2 overlays). New kind `place`.
- **Sheets:** `props`, `props-in-use`, `places`, `framing`, `back-views`, `titles` (`npm run sheets -- --only=props,props-in-use,places,framing,back-views,titles`), golden copies in `knowledge/golden/`.
- **Test scene:** `engine/out/sandbox/story.mp4`, "The Golden Coin" (14 seconds, no sound; `npm run sheets -- --only=story --video`). A girl finds a coin on the street; that evening she shows it to her grandmother at home. Title card, two places with a fade and a label between them, coin, door, chair, table, book, lantern and cup, and all four shot sizes.

### Draw, look and fix loop

1. Props: read right on the first pass. The coin was mostly outline at its real size, so its ring went and its star became a flat darker shape.
2. Places: the houses on the day street were the color of grass (they now take their tone from the paving); the forest was thin (more trees, and dark pines framing both sides).
3. Back view: a hairline and the edge of the hair cap showed across the back of the head (both removed).
4. Framing: the near head in the over-the-shoulder shot hid the coin being shown (it now sits low in a bottom corner, mostly out of frame).

### Acceptance (the part of Phase 2 that 2E covers)

| Check                                                        | Result                                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Golden still for every new asset that can be pictured        | Yes, 27 of 27 (shot sizes and overlays have no still)                                                              |
| Library search finds the new assets by tag                   | Yes: "treasure", "knock", "watchman", "village night", "palace hall", "reaction", "from behind", "chapter"; tested |
| Backgrounds have no outlines; props are outlined             | Yes, tested for every palette                                                                                      |
| Faces stay in the upper part of the frame in every shot size | Yes, tested                                                                                                        |
| Tests, typecheck, lint, format                               | Pass (258 tests)                                                                                                   |

### Open after 2E

- **Props are a starter set.** Anything else a story needs (a crown on a cushion, a cart, a boat, food) is drawn on demand with `/draw` and saved.
- **The action clip still uses plain blocks** for its crate and boulder. They can be swapped for real props when those are drawn.
- **Nine places from the plan are left for on-demand drawing:** harbor and ship deck, battlefield, office, classroom, laboratory, courtroom, church, city skyline, space.
- **Rooms are seen straight on,** with one back wall. There are no corners or side walls.
- **The back view is simple:** the body is the same from behind, and long hair hangs to one side.
- **A two-person medium shot is only a little closer than the wide shot** when the two stand far apart, because the camera never cuts anyone off. Stand them closer for a tighter two-shot.
- **Title text width is estimated,** not measured, so very long titles shrink a little more than they need to.

## Feedback on the story clip (2026-10-06): applied

1. **"The dress doesn't cover the legs; the grandma is sitting but the clothes is straight."** Every skirt was one fixed shape hung from the hips, so on a seated figure it hung straight down while the legs stuck out bare. Skirts, dresses, robes and the queen's gown now drape over the legs wherever they are (`drapeOverLegs` in `engine/src/wardrobe/cloth.tsx`): over the lap and down from the knees when sitting, open with a stride, round a bent knee, never through the ground. Standing figures look almost the same as before; every golden still, sheet and catalog page was rendered again. New check sheet: `skirts` (four garments in eight leg poses). Lesson L-0017. The story clip is re-rendered.

## Feedback on the action clip (2026-10-06): applied

Biku watched the first cut and said three things, then one more on each of the next two cuts. All are fixed and the clip is re-cut (still `engine/out/sandbox/action.mp4`, 13.8 seconds; the clip is a test, not a delivered video).

1. **"The eyes look weird like two eyes."** Both characters were held at a head turn between three-quarter and profile, where the near eye was squashed onto the far one. Fixed in the face itself (`eyeSlots` in `engine/src/face/layout.ts`): the far eye narrows and is gone by three quarters of the way to profile, the near eye slides to the front and is the profile eye, and the two never sit on top of each other. Front and three-quarter views are unchanged. In profile the brow now slopes the right way round (an angry brow is low at the front), so side-view faces changed a little and every golden still was rendered again. New check sheet: `turn-steps`.
2. **"When the soldier punches the thief he doesn't fall immediately, he runs and falls."** The sequence made no sense: punched, then running off, then falling for no reason. In the re-cut the punch knocks him down, with flash, shake and stars. Biku added afterwards that a fall does not always have to come with a blow, since a character can take punches; the point is that what happens must make sense. The stagger, the run and the trip stay in the library for scenes where they fit.
3. **"Why did the surrounding change from light to dark, and the transition is weird."** The whole story is now in one place on one afternoon. The fight shot opens with both still running in, so the chase carries over the cut. The last shot, where time has passed, comes in after a quick fade (`Fade` in `engine/src/camera/Camera.tsx`, new, in the library as `camera/fade`).

4. **"The hand isn't touching the object and the shoes look weirdly positioned"** (second cut, the push). The block was shorter than the hands, so the fists hung above it, and the feet were bunched under the hips. Now both palms are flat on the block, which is placed from the hands and reaches above them, and the legs drive from behind with the back leg stretched out. The pull braces its feet in front. New `footOffset` on the walk settings; lesson L-0014.
5. **"The shoes still look weird, like they are not properly attached to the leg"** (third cut). Boots were always drawn upright and flat, so a slanted leg entered them at the toe. Shoes now follow the leg in every pose: the upper part leans with the shin, a heel lifts when the leg leans far forward, a foot in the air is square to its shin, and a trouser leg always ends inside the shoe (`shoeFit` in `engine/src/wardrobe/Footwear.tsx`). This changes every figure with shoes a little, so all golden stills were rendered again. New close-up check sheet: `shoes`. Lesson L-0015.

Lessons L-0012 (faces at every turn) and L-0013 (story and staging: every action needs a reason the viewer can see; one story, one place, one light; cut on movement, fade for a change of time) are in the log and the playbook. Library: 151 assets.

## Phase 2D. Action: done (2026-10-06)

Asked by Biku ("start 2D"). Characters can run, jump, fall and fight, with the effects and camera moves that go with it.

### Made

- **Ways of moving on foot** (`GAITS` in `engine/src/rig/walk.ts`): run (both feet off the ground between steps), carry, push, pull. They use the same planted-foot cycle as the walk, so no foot slides. Sneak was already there as the sneaky walk.
- **One-shot moves** (`engine/src/rig/moves.ts`): jump, fall forward (a trip), fall backward (a knock-down), punch, swing with something held, recoil from a hit. Each is a pose for the seconds since it began, starts from a stand, and holds its last pose. Each body part is on its own track of timed values. The moments that matter are exported (`PUNCH.hit`, `JUMP.takeoff`, `FALL.ground` and so on).
- **Moves one after another** (`chainAt` in `engine/src/rig/chain.ts`): sneak, then run, then jump. Each move starts where the last one left the body, with a short blend at each change.
- **Effects** (`engine/src/effects/`): tear streams and single tear drops, the red anger mark, dizzy stars, the symbols `!`, `?` and `...`, the impact flash and motion lines. Symbols never read backward on a character facing left.
- **Camera** (`engine/src/camera/Camera.tsx`): shake on an impact, fast push-in, pan. `shakeAt` gives the same jolt on every render.
- **Following camera:** `endless` on the `Background` makes hills, silhouettes and grass repeat for ever, so a camera can follow a chase. Found while making the clip: the scenery ran out after two screens.
- **Violence by implication only:** a hit is the swing, an impact flash over the point of contact, a shake and the other person's recoil. Nothing is wounded. Written into `moves.ts` and the playbook.
- **Library:** 150 assets (24 new: 10 actions, 9 effects, 4 camera moves, the chain), all with previews and golden stills where they can be pictured.
- **Sheets:** `moves-a`, `moves-b` (every move as a strip of moments) and `effects` (`npm run sheets -- --only=moves-a,moves-b,effects`), golden copies in `knowledge/golden/`.
- **Action test clip:** `engine/out/sandbox/action.mp4` (13.8 seconds, no sound; `npm run sheets -- --only=action --video`). A hooded thief is spotted, chased and caught by a guard, in one place on one afternoon. Shot 1: sneak, `!`, run, motion lines, a jump over a crate, following camera. Shot 2: both run in, he stops and turns, hands up, anger mark and sweat, punch, impact flash, shake, head squash, knocked flat at once, landing flash, dizzy stars, cheer. Shot 3, after a quick fade: pushing a block in tears while the guard strolls behind, a pan and a fast push-in. Re-cut after Biku's feedback (section above).

### Draw, look and fix loop

1. Moves: the trip pushed its knees into the ground (now the body tips over its feet like a felled tree, legs straight); falls slowed down before hitting the ground (they now speed up all the way and bounce); the swing's arm crossed the face on the wind-up (it now cocks back behind the head); the run sat too low.
2. Effects: symbols were cut off above the head and the dots read as rings (bigger, finer outline); stars and tear drops were too small.
3. Clip: the background ran out during the chase (endless backgrounds); characters were too small in the frame (head size 150 to 180); the guard was off screen for most of the chase; the dizzy stars were off the right edge.

### Acceptance (the part of Phase 2 that 2D covers)

| Check                                                 | Result                                                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Golden still for every new asset that can be pictured | Yes, 20 of 20 (camera moves have no still)                                                |
| Library search finds the new assets by tag            | Yes: "sprint", "knocked down", "dazed", "bawling", "starburst", "rumble", "chase"; tested |
| Planted feet never slide or sink in any move          | Yes, tested for every gait and move                                                       |
| No blood, wounds or gore                              | Yes: hits are shown by flash, shake and recoil only                                       |
| Tests, typecheck, lint, format                        | Pass (225 tests)                                                                          |

### Open after 2D

- **The crate, the boulder and the club are plain stand-ins.** Real props come in 2E.
- **Motion lines are black** (Style 3.7), so they are faint on night backgrounds. Changing that is a guide change.
- **Symbols are white with a black outline.** The guide gives them no color; say if `!` should be red or gold.
- **Clothes do not follow every move well.** The cloak covers a lying body like a blanket, and tabards do not flare in a jump. (Skirts, dresses, robes and gowns follow the legs since 2026-10-06; they still do not flutter.)
- **Dizzy stars on someone lying down** are partly hidden by an outstretched arm.
- **Only the fighter's front arm punches or swings.** A two-handed swing, a kick and a block are not drawn yet.
- **Endless backgrounds repeat every 1.2 screens,** so one tree comes round again and again in a long chase. More varied scenery comes with the places in 2E.

## Biku's answers after 2C (2026-10-06): applied

Biku said: use the brown, tan and cream clothes, and the head size is fine.

- **Three cloth colors added** (guide and tokens version 9): brown `#7A4B2A`, tan `#C8A66E`, cream `#EEDFB8`, each with one shadow tone. They are in the accent list, so every garment, cloak, hat and head wrap can use them by name (`cloth: 'brown'`).
- **The farmer wears them:** green shirt, tan trousers, brown leather boots, straw hat (was navy trousers and steel boots). `costume/farmer` is version 2.
- **Head size is settled:** it stays as drawn, 0.29 of standing height. The guide said "about a quarter" while its own bone lengths gave 0.29; Style 3.1, Style Check question 5 and the `headToHeight` token now say 0.29. Nothing on screen changed except the speed-test scene, which read that token.
- **Library:** 126 assets (three new colors). Search finds them by "leather", "khaki" and "linen".
- **Sheet:** `villagers` (`npm run sheets -- --only=villagers`), golden copy `knowledge/golden/rig-villagers.png`. Checked on light and dark backgrounds and on skin tones 1, 2, 3, 4, 5, 7 and 8.
- **Found while looking:** tan cloth on a mid skin tone and brown on a dark one are close in color; the outline keeps them apart, but cream or a brighter color reads better there. In the playbook.

## Phase 2C. Poses and motion polish: done (2026-10-06)

Asked by Biku ("start 2c"). Characters have more ways to stand and sit, and they move less like cut-outs.

### Made

- **Eight poses** (`MORE_POSES` in `engine/src/rig/poses.ts`): sit, kneel, lie, cross arms, look up, look down, cower, hug. Their heights come from the bone lengths, so a later head-size change carries over.
- **Two actions** (`engine/src/rig/actions.ts`): cheer (bouncing, arms up in a V) and cry (hunched, shaking with sobs). Every action is listed by name in `ACTIONS`.
- **Four mood walks** (`WALKS` in `engine/src/rig/walk.ts`): proud, tired, sneaky, happy. Each is the same planted-foot walk with different numbers for speed, step height, bounce, lean, head and arms.
- **Wind-up and settle** (`poseAt` in `engine/src/rig/pose.ts`): a big move starts with a short wind-up the other way, snaps, overshoots a little while the hips dip, then holds. Small moves skip the wind-up. Hands and heads travel on arcs because joints turn.
- **Weight and breathing** (`withLife` in `engine/src/rig/life.ts`): during a hold the weight shifts slowly from leg to leg (planted feet stay put) and the arms move with the breath.
- **Eye darts** (`gazeAt` in `life.ts`) and **smooth head turns** (`turnAt` in `engine/src/rig/turn.ts`): turning to face the other way swings through the front view instead of flipping.
- **Follow-through** (`engine/src/rig/follow.ts`): loose things lag the body. The king's cape, the cloak and long hair trail a walk and swing on past when the body stops; the top of the held scepter tips back as the arm moves. A scene passes `sway={swayOf(...)}`.
- **Talking with five mouth shapes** (`engine/src/face/talk.ts`): closed, half, open, wide ("ee", top teeth showing) and round ("oo"). The mouth forms each word from its spelling, holds every shape at least two frames, and stays a little open in the short gaps inside a phrase. A scene passes `talk={talkAt(frame, fps, words)}`. This is **guide version 8** (Style 8 said three shapes).
- **Library:** 123 assets now (18 new: 8 poses, 6 actions, 4 motion pieces), all with previews and golden stills. The check covers every action.
- **Sheets and clips:** stills `poses-b` and `mouths` (`npm run sheets -- --only=poses-b,mouths`); clips `polish` (cape, hair and scepter follow-through), `moods` (the four walks) and `motion` (wind-up, turns, talking) with `npm run sheets -- --only=polish,moods,motion --video`. They land in `engine/out/sandbox/`.

### Draw, look and fix loop

1. Poses: the two hugging figures stood too far apart, the cheering arms met over the head instead of making a V, the cowering hands hid the face, and the lying figure ran off its cell. All fixed.
2. Follow-through: the first cape was too stiff and never swung past the body. Retuned so it trails a walk by about a seventh of a head and swings about half that far past when the body stops.
3. Mood walks: all four read on the first pass (frame strips of each).
4. Mouths: the open shape was a pointed drop on a small mouth (now a rounded U); the shapes were thin slits on frowning faces (a talking mouth now opens more on a frown); the "ee" shape ran off the face on wide mouths (it now widens by a share of a calm mouth, not of its own width).

### Acceptance (the part of Phase 2 that 2C covers)

| Check                                                    | Result                                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Golden still for every new asset                         | Yes, 18 of 18                                                                                            |
| Library search finds the new assets by tag               | Yes: "sneak" finds the sneaky walk, "cape swing" the follow-through, "turn around" the head turn; tested |
| Feet stay planted through weight shifts and pose changes | Yes, tested                                                                                              |
| Loose parts come to rest when the body stops             | Yes, tested                                                                                              |
| Tests, typecheck, lint, format                           | Pass (152 tests)                                                                                         |

### Open after 2C

- **Head size:** answered on 2026-10-06, it stays (see the section above).
- **Guide version 8** changed "three mouth shapes" to five. It was built under the agreed motion polish scope ("more mouth shapes for talking"); Biku should say if the talking looks wrong.
- **The mouth reads spelling, not sound.** Lips meet on m, b and p, round on o and u, open on a. Words spelled oddly ("one", "though") get an approximate shape. Kokoro could give real sounds later if this is not good enough.
- **Wide frowning mouths** (the angry face) open only a little on the half and "ee" shapes.
- **Only capes, cloaks, long hair, ponytails and the scepter swing.** Dress and robe hems, sleeves and other props do not yet.
- **The sneaking figure's cloak** lies along the bent back instead of hanging straight down.
- **The example videos** (`LookTest.tsx`, `MoonTax.tsx`) now use the new talking shapes. The delivered files are untouched; a new render would get a new version number.

## Phase 2B. People: done (2026-10-05)

Asked by Biku ("start 2B"). Ordinary people can now be dressed, aged and saved.

### Made

- **Tier 1 clothes** (`engine/src/wardrobe/garments.tsx`): tank top, shirt (long or short sleeves), trousers, skirt, dress, robe, cloak, hood, brimmed hat, sneakers, boots. Mixed freely with `outfitFrom({ top, bottom, onePiece, shoes, hat, cloak })`. Shapes measured from the clothed figure in Reference B.
- **Cloth colors** (`engine/src/wardrobe/cloth.tsx`): white plus the seven token accents, by name. In clothes data the field is called `cloth`, never `color`, so the guard against hand-typed colors stays strict.
- **Three costumes** (`engine/src/wardrobe/costumes/`): `SOLDIER` (pointed helmet with gold band over a mail coif, crimson tabard, steel plates), `QUEEN` (navy gown to the ground, gold belt and hem, low crown of three arches with pearls, white gloves), `FARMER` (green shirt, navy trousers, boots, straw hat, built from the tier 1 garments).
- **Long hair** (`hair/long`), drawn behind the whole body.
- **Ages** (`age` on the Character): `child` shrinks the body to 0.78 under a full-size head; `elder` stoops (less from the front, fully in profile) and gets permanent face creases; `adult` is the default.
- **Rig support:** `hipSpread` (trouser legs hang from hips set apart, planted feet stay put), short sleeves, a sneaker style in `Footwear.tsx`.
- **Character cards:** schema in `shared/src/character.schema.ts`, `castFromCard` in `engine/src/wardrobe/cast.ts`, three sample cards in `characters/` (a child, an adult, an elder), `npm run library -- characters`, and saved characters show up in `search`.
- **Library:** 105 assets now (18 new: 11 clothing, 3 costumes, long hair, 3 ages), all with previews and golden stills; the check covers garments, costumes and ages. Catalog is 5 pages.
- **Sheets:** `clothes`, `costumes-b`, `ages`, `people` (`npm run sheets -- --only=clothes,costumes-b,ages,people`), golden copies in `knowledge/golden/rig-*.png`.

### Draw, look and fix loop

1. First pass: all four sheets rendered; clothes, queen, farmer and child read well at once.
2. Fixed: the soldier's kettle helmet read as a bowler hat (now a pointed helmet over a mail coif); hats floated above the head (crown now comes down over the head, brim just above the brows); the elder leaned sideways in the front view (stoop now grows with the turn); long hair fell over one arm (now behind the body); the queen's crown was too small.
3. Checked every new outfit in front, three-quarter and profile for which arm is in front (lesson L-0008), and the clothes sheet at phone size.

### Acceptance (the part of Phase 2 that 2B covers)

| Check                                                         | Result                                                                                       |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Golden still for every new asset                              | Yes, 103 of 103 that can be pictured                                                         |
| Library search finds the new assets by tag                    | Yes: "guard helmet" finds the soldier, "grandmother" the elder, "jeans" the trousers; tested |
| All eight skin tones and the hair styles checked with clothes | Yes, on the `people` and `identity` sheets                                                   |
| Character cards load and draw                                 | Yes, three samples; a card naming something unknown fails in plain words                     |
| Tests, typecheck, lint, format                                | Pass (119 tests)                                                                             |

### Open after 2B

- **Head size:** closed on 2026-10-06. Biku said it is fine; it stays at 0.29.
- **Cloth colors were few:** closed on 2026-10-06. Biku asked for brown, tan and cream; they are in guide version 9.
- **Black brows on the two darkest skin tones** still have low contrast (known since Phase 1).
- **A child's limbs are thinner** than an adult's at the same head size, because the whole body shrinks. It reads as a child; say so if it looks too thin.
- **Soldier hands** are plain black mittens; steel gauntlets would need a new hand style.
- **Legs** still use the fixed order (back leg behind, front leg in front). It looked right on every 2B outfit.
- **Sample cards** in `characters/` are examples only. Biku decided characters are not saved by default.

## Phase 2A. Library foundation: done (2026-10-05)

Asked by Biku ("start phase 2A"). Everything already drawn is now listed, searchable and pictured.

### Made

- `library/index.json`: 87 assets, each with an id (`<kind>/<name>`), a plain description, tags, the code file and exported name, a `use` hint, a golden still path, a version and a date. Schema and search in `shared/src/library.schema.ts`.
- `npm run library -- search | list | show | look | stills | catalog | check` (`cli/src/library.ts`).
- `engine/src/library/`: one preview drawing per asset (`previews.tsx`), and the pages that render them (`LibraryAsset`, `LibraryLook`, `LibraryCatalog`).
- Golden stills for the 85 assets that can be pictured, in `knowledge/golden/assets/`. The camera move and the captions have none: they are judged in a shot.
- `library/catalog/page-1.png` to `page-4.png`: the picture catalog for Biku.
- `.claude/commands/draw.md`: `/draw <description>` runs the draw, look and fix loop and files the result in the library.
- The check (`engine/src/library/library.test.tsx`, also `npm run library -- check`): fails if an expression, pose, hand shape, hair style, hair color, skin tone, facial hair, palette, accent color, background treatment or silhouette exists without an index entry; if a costume, prop, effect, camera or overlay file has no entry; if an entry points at code or a still that is not there; or if a pictured asset has no preview.

### What is in the library now

rig 1, poses 7, action 1 (walk), motion 2, expressions 14, eye style 1, hands 3, skin tones 8, hair styles 10, hair colors 7, facial hair 2, costume 1, prop 1, effects 2, backgrounds 2, palettes 6, background elements 6, silhouettes 4, accent colors 7, camera 1, overlay 1.

### Acceptance (the part of Phase 2 that 2A covers)

| Check                                               | Result                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Golden still saved for every asset                  | Yes, 85 of 85 that can be pictured                                                                                             |
| Library search finds assets by tag                  | Yes: "king" finds the ruler costume, "scared" the afraid face, "night violet" the dusk palette; tested                         |
| The check fails on an unindexed piece               | Yes, tried with a dummy prop file                                                                                              |
| `/draw` exists and follows current Claude Code docs | Yes; custom commands in `.claude/commands/` still work and are the same as skills (checked in the official docs on 2026-10-05) |
| Tests, typecheck, lint, format                      | Pass (104 tests)                                                                                                               |

### Not done in 2A

- **Head size.** The step was to apply Biku's answer, and there is no answer yet. Heads stay at 0.29 of standing height. Changing it later means re-checking every pose, so it should be settled before 2C.
- **`characters/`** is still empty. Character cards are part of 2B.

## Feedback on the king's arms (2026-10-05): applied

Biku said the king in the moon video looked weird: he faces forward but his arms are backward. Lesson L-0008.

- **What was wrong:** the head was turned three-quarter but the body was layered as if turned the other way. The far arm was drawn over the chest with its elbow tucked back, the near arm was hidden behind the chest, the resting arm bent backward at the elbow, and the gripping fingers stuck out past the scepter.
- **Made:** `engine/src/rig/layers.ts` (`armLayers`: which arm passes behind, in front of the chest, or on top, by view) used by `Character.tsx`; `naturalArm` in `skeleton.ts` (a hanging arm bends forward once the body is turned three-quarter or more; front-view poses keep mirrored arms); `hold-object` reaches out (0.92, 0.46) with a relaxed resting arm, `point` got the same resting arm; the grip in `Hand.tsx` is a closed fist that hides the handle.
- **Reframed for the longer reach:** the king moved a little in three moon video shots and in look test shot 1.
- **Checked on:** costume, hands, poses and turns sheets, and the stills of both videos. Golden stills re-saved. `moon-tax-v4.mp4` is the new version; `look-test-round4.mp4` keeps the previous look test video.
- **For Phase 2:** every new costume and every new pose must be checked in front, three-quarter and profile for which arm is in front. Legs still use the old fixed order (back leg behind the skirt, front leg over it); it has not looked wrong so far, but check it when trousers and skirts arrive in 2B.

## Checkpoint 1 feedback, round 4 (2026-10-04): applied

Biku sent Reference B's frightened face again: the fixes had helped, but the face was still not like the reference and the wrinkles did not look real. Biku approved loosening the guide's rule against tapered lines. Lessons L-0006 (Biku) and L-0007 (self-check: measure, do not eyeball).

- **Method:** the reference face was enlarged 8 times with a grid and measured in head units; ours was compared at the same head size.
- **What measuring found:** our face tipped the opposite way to the reference; the shading was on the upper lids, the reference has it on raised lower lids; the grimace was a quarter too narrow and lens-shaped; wrinkles were about twice too thick and all alike.
- **Made:** `engine/src/face/crease.tsx` (tapered filled strokes: `Crease`, `TaperedStroke`), token `face.creasePctOfHead` 0.012 (tokens and guide version 7). In `Face.tsx`: worry ticks, under-eye creases, cheek, chin, strain and mouth-corner creases are all tapered and unequal; a closed mouth line thins toward its corners; `lowerShaded` lower lids with the pupil resting on them; the near eye is drawn over the far eye; the far brow is short; a wide mouth is pushed back to fit inside the head; a new grimace shape measured lip by lip.
- **Expressions changed:** `afraid` rebuilt (frame tilt +11, lower lids 0.25 shaded, brows light and sagging, mouth width 0.46). `surprised` and `horrified` got lighter brows that stay inside the head outline. `BROW_LEN` and `BROW_OUT` in `layout.ts` changed, so every brow is a little shorter and further out.
- **Look and fix:** three rounds on the face match sheet, then the expression, turn, identity and costume sheets and the stills of both videos. Golden stills re-saved.
- **Kept for comparison:** `out/face-match-round3.png` and `out/look-test-round3.mp4` in the look test run; the moon video got a new version, `moon-tax-v3.mp4`.
- **Still different from Reference B, by guide rule:** the mouth interior is dark maroon, not black; the sweat drop is one bold outlined drop, not two pale ones; face lines are soft gray, as Biku asked in round 3; heads stay perfect circles (the reference's jaw bulges around the mouth).

## Phase 2 scope addition (2026-10-04, agreed by Biku)

Biku asked for more lifelike motion and agreed to add a **motion polish** step to Phase 2, on top of the plan's list (Part 2, sections 7.3 to 7.7):

- Wind-up before big moves and overshoot-and-settle after them.
- Parts that lag behind: capes, hair and held objects swing and catch up after the body.
- Weight: leg-to-leg shifts, breathing, shoulders, heavier steps when tired.
- Livelier faces: eye darts, smooth head turns toward the speaker, more mouth shapes for talking.
- Walks with mood (proud, tired, sneaky, happy) and hands and heads moving in arcs.

Goal is "alive", not "realistic": it must still read as the snappy reference style. **Decided by Biku (2026-10-04): starter set.** Phase 2 covers every category in the plan (poses, actions, clothes, hair and skin, character cards, effects, places, props, camera, on-screen extras, library index, `/draw`, motion polish) with a small, most-useful selection in each; the rest is drawn on demand during videos and saved to the library. Claude's reading of Biku's words; the exact selection is to be shown to Biku before building.

**Action is a priority (Biku, 2026-10-04).** The Phase 2 starter selection must include the action set, not leave it to on-demand drawing: run, jump, fall, fight (wind-up, swing, hit, recoil), push, pull, carry; impact flash, motion lines, dizzy stars; camera shake and fast push-in. Limits stay as the style sets them: violence by implication only, no blood or gore.

### Phase 2 steps (agreed split, 2026-10-04)

Each step ends with contact sheets for Biku, a commit and an update here. Start a step only when Biku asks.

- **2A. Library foundation: done (2026-10-05)** except the head-size answer, which Biku has not given yet. Was: apply Biku's head-size answer; `library/index.json` with every existing piece registered (tags, picture, code path); golden stills; the check that fails on unindexed pieces; `/draw`.
- **Faces round 4: done (2026-10-04).** Built ahead of 2A at Biku's go-ahead; see the round 4 section above. Waiting for Biku's verdict on the face match sheet.
- **2B. People: done (2026-10-05).** Was: Tier 1 clothes (shirt, tank top, trousers, skirt or dress, shoes, plain hat, hood or cloak, robe); costumes (soldier, queen or noble gown, villager or farmer); long hair; all skin tones and hair checked; age cues (child, adult, elder); character cards.
- **2C. Poses and motion polish: done (2026-10-06).** Was: sit, kneel, lie, cross arms, look up, look down, cower; cry, cheer, hug; wind-up and settle; lagging capes, hair and held objects; weight and breathing; eye darts, smooth head turns, more mouth shapes; mood walks; arcs.
- **2D. Action: done (2026-10-06).** Was: run, jump, fall, fight (wind-up, swing, hit, recoil), push, pull, carry, sneak; tears, anger mark, motion lines, impact flash, dizzy stars, symbols; camera shake, fast push-in, pan; a short action test clip.
- **2E. World: done (2026-10-06).** Was: places (night street, day street, field, forest, castle and throne room, home interior); about 10 props (sword, shield, coin, bag, book, lantern, door, chair, table, cup); wide, medium, close-up and over-the-shoulder framing; title card and labels.
- **2F. Wrap-up: done (2026-10-06).** Was: full contact sheets of everything, index complete, all checks passing, Phase 2 report (`PHASE-2-REPORT.md`).

Left for on-demand drawing: the other nine places, climb, write, read, steer, row, salute, march, turn out pockets, lean, hands on head, counters, charts, maps, animals.

## Extra: first short video, "The King Who Taxed the Moon" (2026-10-04, asked by Biku)

Biku asked for a short folktale of Claude's own. Written, drawn, voiced and rendered by hand, since the pipeline arrives in Phase 4.

- **Video:** `runs/2026-10-04-moon-tax/out/moon-tax-v1.mp4` (26.7 s, 1080x1920, voice and captions, no music or sound effects yet). Script and shot list in `runs/2026-10-04-moon-tax/script.md`.
- **Made:** `engine/src/compositions/MoonTax.tsx` (5 shots), `engine/src/compositions/shotPlan.ts` (shot times from any list of voice lines), `cli/src/short.ts` and `npm run short -- --run=<folder> --voice --stills --video` (reads `shots.json` in the run folder; each render takes the next version number, so nothing delivered is overwritten).
- **Reused:** the ruler costume and scepter, both background treatments, the walk, existing expressions. New for this video, kept inside the composition: a point-up pose for Mira and two king faces whose brows sit below the crown.
- **Look and fix:** raised brows hid under the crown, Mira's pointing arm crossed her face, a foreground bush covered the walker, the belt and glove sat behind the captions. All fixed before the render.
- **Measured:** -14.1 LUFS, peak -1.3 dB, 3.0 s of render per second of video.
- **Feedback (2026-10-04):** Biku could not see the pupil in the king's far eye on the angry face. Fixed in the face code for every character (lesson L-0005) and re-rendered as `moon-tax-v2.mp4`; v1 is kept. Biku also found the story not very immersive: a note for future scripts, no remake asked.
- **Version 4 (2026-10-05):** re-rendered as `moon-tax-v4.mp4` after the arm fixes above (lesson L-0008). v1 to v3 are kept.
- **Version 3 (2026-10-04):** re-rendered as `moon-tax-v3.mp4` with the round 4 faces (the king's worried close-up shows the new lower lids, grimace and creases). v1 and v2 are kept.
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

- **Guide version 9 (2026-10-06, asked by Biku):** brown, tan and cream cloth colors for ordinary people, and the head size wording now matches what is drawn (0.29 of standing height).

- **Guide version 8 (2026-10-06, under the Phase 2 motion polish scope Biku agreed):** talking uses five mouth shapes instead of three. Wide ("ee", top teeth showing) and round ("oo") join closed, half and open, and the mouth forms each word. `tokens.json` is version 8 with five names in `motion.mouthShapes`.

- **Guide version 7 (2026-10-04, asked and approved by Biku):** creases inside the face are fine tapered pen strokes, about 1.2% of the head at their fullest, each a different length and angle; tapering is allowed inside the face (brows, creases, the ends of a closed mouth line). The frightened face follows Reference B as measured. New token `face.creasePctOfHead`. Versions 4 to 6 (faces closer to the references, thinner and softer face lines) are described in the guide's version history.

- **Guide version 3 (2026-10-03, needs Biku's confirmation):** the guide names seven hair colors but gave no color values, and components may only use token colors. Added a `hair` block to `tokens.json` (black, dark brown, brown, auburn, blond, gray, white, each with one shadow tone). No existing rule changed. If Biku prefers other shades, only `tokens.json` and the Style 12 copy in the guide change.

- **Guide version 2 (2026-10-02, asked by Biku):** hands that hold or point show fingers, like the king's glove on the sword in Reference A. Resting hands stay mittens. Style Check question 11 added. `tokens.json` is now version 2 with a `hands` block. Phase 1 must draw both hand types and a gripping hand on a prop.

## Open problems and notes

1. **Head size: resolved (2026-10-06).** Biku said the head size is fine. Heads stay at 0.29 of standing height and the guide now says so (version 9).
1. **Face layout constants.** Eye width and pupil size come from tokens. Eye spacing, brow gap, mouth height and the head-turn shifts are named in `engine/src/face/layout.ts`, because tokens do not cover them.
1. **Effects: built in 2D (2026-10-06).** Sweat, tears, anger mark, dizzy stars, symbols, impact flash and motion lines are in `engine/src/effects/`.
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
1. **Font chosen** (Fredoka, OFL). SoundFont chosen in Phase 3: GeneralUser GS 2.0.3 (see `LICENSES.md`).

## How to continue

Open Claude Code in this folder and paste:

> Read BUILD-STATUS.md and continue the build from where it stopped.
