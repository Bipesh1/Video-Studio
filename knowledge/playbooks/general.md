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

## Working with Biku

- Report in plain language: what was made, where it is, what he needs to decide. No code words.
- When he asks for a change of look, show numbered choices side by side and let him pick by eye.
- Claude cannot hear. Sound is judged by measurement, and the report says the listening is his.
- Keep everything on drive F inside the project.
