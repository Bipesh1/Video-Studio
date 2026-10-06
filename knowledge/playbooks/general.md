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
- **Recut the words when a cut falls badly.** A shot needs at least about a second and a half of words; move words between the shots of a line, never between lines.
- **Faces carry the feeling:** pick the expression for what the character feels at those words, and change it when the feeling changes.
- **Sound:** one music mood per scene from the beat's list; steps, doors, things landing and coins as effects, within the format's count.
- Reuse the library. If the plan needs something it lacks, `npm run plan -- needs` names it; draw it with `/draw` before going on.

Run `npm run plan -- check` (names, staging, word for word against the script), then `npm run plan -- page` for `storyboard.md`, the shot list Biku reads.

## Building a part

`npm run make -- --run=<run> --part=<n> --size=<shape> --voice --time --sound --stills` speaks the part, writes the voice's times into its shots, mixes its sound and draws one still per shot. Look at the sheet of stills (`part-<n>/stills/sheet-*.png`) before anything else: floating feet, a covered face or a thing cut off show there at a glance (L-0024). Fix the storyboard, make it again, then add `--video`. A part is shown to Biku and the next one waits for his word.

## Working with Biku

- Report in plain language: what was made, where it is, what he needs to decide. No code words.
- When he asks for a change of look, show numbered choices side by side and let him pick by eye.
- Claude cannot hear. Sound is judged by measurement, and the report says the listening is his.
- Keep everything on drive F inside the project.
