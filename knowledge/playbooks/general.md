# General playbook

How to make any video in this studio: the script, the plan and the working habits that hold for every format and style. Read it before every video. The format playbook (`formats/<format>.md`) and the style playbook (`styles/ink-stick.md`) add to it. Lessons from Biku's feedback are added here by `/review`; keep it under 120 lines.

## The three script modes

Start every run with `npm run script -- new`. It saves Biku's request and his script untouched.

- **as-is** ("use my script"): narration and captions are Biku's words exactly. Not one word changes, not even to fix a slip. A word Kokoro says wrongly is fixed in the voice file's pronunciations, never in the script. The writing rules below are not applied to his words; they still guide the shot plan.
- **refine** ("refine my script"): keep the story, the facts and his voice. Improve the hook, the rhythm for the ear, sentence length and slow passages. Every number he gave stays and none is added. List every change in `changes`, one plain sentence each. Do not stop for approval unless he asked.
- **original** ("make a story about X"): research first, then write from the format's beats. Save every source with what it was used for. A factual format with no sources is refused.

**Characters speak for themselves.** Alongside the narration, the stick figures say their own lines in their own voices, with words that come from the script provided. In refine mode, turn reported speech ("his wife told him to keep the gold") into a spoken line and list the change. In as-is mode, give a character only the speech the script already quotes, word for word. Never invent something for a character to say. (L-0022, Biku)

If `prompts/<format>.md` or `prompts/master.md` exists, it is Biku's master prompt and replaces the writing rules below. Record it in the script as `masterPrompt`.

## Writing for attention

Apply these in refine and original modes, and to shot planning in every mode.

1. **The first 3 seconds** are the most striking image or line. No greeting, no "in this video", no logo.
2. **Stakes early:** within 10 seconds it is clear what someone could lose or gain.
3. **Specific beats general:** a name, a number, an object.
4. **Re-hook every 20 to 30 seconds:** a question, a turn or a new danger.
5. **One idea per sentence.** Short sentences, written to be heard. Read it aloud in your head; split what runs out of breath.
6. **The picture changes every 2 to 4 seconds,** so write lines that can be shown: someone doing something, somewhere.
7. **Faces carry the feeling.** Every shot with a character names the expression it needs.
8. **Pay off what the opening promised,** and end on a line worth remembering.
9. **Factual formats stay accurate.** Every claim is traceable to a saved source.

Also: no em dashes in anything a viewer reads or hears written down (ground rule 14). Mark the one word a caption should stress with asterisks, at most one or two a line.

## Script to data

- The script is `script.json` (`shared/src/script.schema.ts`): each line has a speaker, its words, the beat of the format it plays and its chapter. Beats run in the format's order and every beat that is not optional is used.
- A line is one breath: usually one or two sentences. Give the big moments a longer `pauseAfterMs` so the picture can land.
- Everyone who speaks besides the narrator is listed with a voice. How they look is decided in the shot plan.
- Lengths are estimates until the voice exists: the Kokoro voices speak about 195 words a minute, pauses not counted, and a guess can be an eighth out.

## Chapters

- Biku's videos run 2 to 3 minutes. Anything over a minute is made in parts of at most 60 seconds: `npm run script -- chapters` splits the script, as evenly as it can, where the story turns.
- Each part is built and checked alone, shown to Biku in the phone size, and the next part starts only when he says so. The other sizes and the joined video are made after every part is approved.
- Write so the joins do not show: a part ends on a finished thought and a pause, never mid-sentence; the title is only on the first part and the closing card only on the last.

## Before the shot plan

Run `npm run script -- check`. It refuses: an as-is script that is not word for word the original, a refine with no changes listed or with a number lost or invented, a factual original with no sources, a greeting as the opening, an em dash, a beat missing or out of order, a part over a minute. Then `npm run script -- page` writes `script.md` for Biku.

## The shot plan

`npm run plan -- draft` lays the checked script out as `storyboard.json`: scenes, lines, and the words cut into shots of 2 to 4 seconds, with every decision marked "todo". `npm run plan -- menu` lists everything a shot can use. Then decide, shot by shot:

- **A scene is one place and one time.** Regroup the draft's scenes by where things happen. Change place only when the story moves, and bring a new time or place in with a fade (L-0013).
- **Lay each scene out once, wide:** give everyone a spot (`x`, 0 left to 1 right) and keep it for the scene. Closer shots are the same layout with the camera moved in (L-0016).
- **Every shot is a picture of its words.** Someone doing something: a pose or an action, an expression, where they look, what they hold. A shot of nobody and nothing is refused.
- **Open on the most striking picture,** with a character in it. The title goes on that first shot, once.
- **Whoever speaks is on screen, face to us,** for their line. People face who they look at.
- **Change the picture:** vary the shot size, never the same picture twice in a row, close-ups for the moments that matter, wide when someone arrives or the place is new.
- **Know what a closer shot cuts off.** A thing standing on the ground shows only in a wide shot. A thing in a hand shows in a medium shot, not a close-up. Someone lying down beside someone standing needs a wide shot. (L-0023, self-check)
- **Someone sitting, kneeling or lying does not hold a bag or a lantern;** it would hang to the floor. Stand it in the scene beside them. A chair or throne goes at the same `x` as its sitter. (L-0027)
- **Let people move inside a shot** when the words describe something happening: a person's `then` lists what they do next (`at` a point of the shot from 0 to 1: a new pose or action, face, look, or thing in the hand). Walk in and stop, stand up, kneel, lift the coin, point. Give a move a medium or wide shot; a close-up shows only the change of face. (L-0029)
- **A cut inside a scene keeps everyone as they were:** same place, same way round, same posture. Kneeling, getting up, turning round or picking a thing up happens inside a shot, as a step, never between two shots. To have someone pick a thing up, stand it in the shot just in front of them (about 0.13 along) and give them a step that holds it; the hand goes to it first. (L-0030)
- **A thing follows the same rule as a person.** What is in a hand at the end of a shot is in it the next time that person is seen, even a few shots later; a thing is taken inside a shot, never between two. A thing standing in a room stays where it stands from shot to shot. Leave a thing on the ground out of a medium or closer shot: its top pokes up behind the caption. The builder cannot show a thing being put down yet, so plan round it: leave it where it stands and bring the person to it. A travelling shot cut against a still one of the same size makes the place jump: change the size. When the story goes to another time in the same place, fade in. (L-0031)
- **Recut the words when a cut falls badly.** A shot needs at least about a second and a half of words; move words between the shots of a line, never between lines.
- **Faces carry the feeling:** pick the expression for what the character feels at those words, and change it when the feeling changes.
- **Sound:** one music mood per scene from the beat's list; steps, doors, things landing and coins as effects, within the format's count.
- Reuse the library. If the plan needs something it lacks, `npm run plan -- needs` names it; draw it with `/draw` before going on.

Run `npm run plan -- check` (names, staging, word for word against the script), then `npm run plan -- page` for `storyboard.md`, the shot list Biku reads.

## Building a part

`npm run make -- --run=<run> --part=<n> --size=<shape> --voice --time --sound --stills` speaks the part, writes the voice's times into its shots, mixes its sound and draws one still per shot. Look at the sheet of stills (`part-<n>/stills/sheet-*.png`) before anything else: floating feet, a covered face or a thing cut off show there at a glance (L-0024). Fix the storyboard, make it again, then add `--preview` (a half-size video, quicker to make), and look at a strip of frames across every step and every cut that keeps someone on screen: a still shows a pose, only a strip shows a move (L-0030).

Then the self-check, before Biku sees anything: `npm run qa -- --run=<run> --part=<n> --preview`. It measures the newest video (the file plays, the length, picture and voice in step, silence, loudness, nothing drowning the words, captions, everyone in frame, no face under the title or captions, feet on the ground, nothing jumping, no picture held too long, things within reach, the plan's own checks) and cuts a strip of frames across every move and every change of shot into `part-<n>/qa/<video>/`. Look at every still against the 11 questions of the Style Check and the 7 of the story check, and at every strip; write what you saw in `part-<n>/qa-look-<shape>.json` (the video's name, "ok" or each "no" for every still and strip, what was put right on the way, what is worth Biku's eye). Fix what is found in the storyboard, make the part again, and look again: a look at an older render does not count. When it says ready, `part-<n>/qa-report-<shape>.md` is the page Biku reads with the video. The look is the part that finds what cannot be measured (L-0031).

A part is shown to Biku and the next one waits for his word.

When the preview passes, make the final video (`--video`) and run `npm run qa` once more without `--preview`: the look carries over if every frame of the final shows the same picture as the preview, and it says so (L-0034).

## The other shape, and the finished files

A part is shown to Biku in the page's first shape. When every part is approved, make the others the same way (`--size=9:16`: stills, preview, check and look, final), then `npm run output -- --run=<run>`.

- **Look at a tall frame as its own picture.** A place is drawn at the same size beside a person as in the wide cut (L-0035), but the frame is narrow: a shot that favours one of two people shows that one alone, three people side by side put the camera further back, and a medium shot shows the whole body with the caption over the legs. A fault there is a fault to fix; say plainly what is only different (L-0033).
- **The cover is one shot of the video**, named in the storyboard (`cover`: the shot, how far into it, and a shot size). Pick the moment that shows who the story is about and what is at stake, with the face readable when the picture is small.
- **The output step** mixes the sound once for the whole video, joins the parts, adds the page's closing card if it has one, and checks the finished file. Look at the strip across each join and at the cover, write `out/<name>.look.json`, and run it again. `delivery.md` is the page Biku reads: what to upload where.
- A new style of cover, mark or closing card is a change of look: show Biku numbered choices.

## Science videos ("what if")

- **One host.** The same scientist explains in every video (Biku, 2026-10-07); other people are cast as needed. The host opens and closes in the lab; the "what if" itself happens out in the world or in space.
- **Places:** `lab`, `living-room`, `city` (palette `clear-day`, or `dusk-violet` for night), `space`, `earth-orbit`, `moon-surface`. Space is always dark whatever palette a scene names. In `space` and `earth-orbit` there is no ground: give people the `float` action.
- **Things of the sky are props:** `sun`, `full-moon`, `earth`, `planet`, `planet-ringed`, `planet-giant`, `planet-ice`, `asteroid`, `black-hole`, `rocket`, `rocket-flying`. Each hangs at a sensible height; `y` (heads off the ground) and `size` move and scale it. In a wide frame the sky of a wide shot is about five heads tall, so keep `y` under about 4.
- **Explosion, fire and smoke** stand in a scene the same way (`explosion`, `fire`, `smoke`). An explosion goes off as its shot begins. Nobody is shown hurt by one: people cower, run or look on.
- **Explainer graphics** are a shot's `overlay`: `number` (one figure, with a few words under it), `pointer` (an arrow from a label to a person or thing named in `to`), `orbit` (one body going round another). One per shot. Keep a person out from under the number: use a wide shot.
- In a tall frame the camera stays on the people. A thing far from them is in the picture only when someone looks at it (`lookAt`) or an arrow names it; otherwise keep it within about a third of the stage of them.

## Working with Biku

- Report in plain language: what was made, where it is, what he needs to decide. No code words.
- When he asks for a change of look, show numbered choices side by side and let him pick by eye.
- Claude cannot hear. Sound is judged by measurement, and the report says the listening is his.
- Keep everything on drive F inside the project.
