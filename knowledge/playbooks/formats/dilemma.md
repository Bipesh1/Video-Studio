# Dilemma format playbook (game theory, The Dilemma Table)

One real trap of human behaviour, shown happening to someone, told in plain words: set up and wrapped up in one dark room, and played out in the place it really happens. The Trainer stands in the room and tells the viewer what he is doing and why; the person it happens to is one of the fixed cast. **Everything on this page belongs to the game theory niche only** (Biku, 2026-10-11: "whatever changes are they should be tied to this niche"). The binding numbers are in `formats/dilemma.json`, the page file is `brands/dilemma-table.json`, the script guide is `prompts/dilemma.md` (v2.0, plain words). Read this before every game theory video; keep it under 80 lines.

## Plain words first (L-0042, Biku on the first Tape 01)

He read the first script for The Smoke, written from guide v1.4, and said: "its so obvious the texts are so random ... this weird random texts", "i had absolutely no idea even if i knew something about the story. broken englishes like things". Claude had built all three parts of it, and had told him the words made sense.

- **A stranger who knows nothing must follow every sentence the first time.** Read a script line by line as that stranger before building anything, and before telling him it makes sense: who is talking, about whom, is it a whole sentence, is there a word you would have to know the show to understand. Knowing the study is what makes a bad script read as fine.
- **Full sentences. The Trainer says what is happening:** who this is, what they want, what he is about to do, what they just did, why. No fragments ("Latané and Darley. 1968."), no insider words ("trainees", a subject number, "customer", "tape").
- **Clear beats clever, in the words as in the pictures.** The House, the leaked tape, the two-faced asides were the idea of the earlier guides; none of it is said aloud now. The worked example is `runs/2026-10-12-the-smoke-plain/`.

## The beats, in order (the guide's names in brackets)

- **the-question** (The question), about 8%. The Trainer's face, close: one question to the viewer in big words, then a line that promises the answer.
- **the-rule** (The set-up), about 17%. Who this person is, what they came for, the one thing they do not know.
- **the-smart-choice** (It starts, and the first half of It gets worse), about 25%. He says what he is doing; the person notices and talks themselves out of it; he points out what they did.
- **the-trap** (the rest of It gets worse), about 25%. Stronger; they say it is fine; he asks the viewer what happens next; the choice.
- **the-result** (It was real), about 12%. "This is not a story": the year, who, the numbers, one everyday place the viewer does it.
- **what-stays** (The way out), about 13%. The outside voice gives one thing to do; the Trainer answers the opening question.

## Numbers

- Length: 60 to 130 seconds, three parts of under a minute. 260 to 290 spoken words. A shot stays 2 to 4 seconds. Pauses: 500 ms after a line, more after a big moment. Sound effects: few. Sources are required.

## The world (the room opens and ends every video; the middle goes where the trap happens)

- **Two places a video** (Biku, 2026-10-14: "wouldn't it be the same setting for every game theory video? how do we fix it?"; of three ways offered he picked this one, "yes 2 looks better"). The beats `the-question` and `the-rule` are in the room, and so are `the-result` and `what-stays`. `the-smart-choice` and `the-trap` play in the real place the trap happens, a place of the library in its own colours (`day-street`, `city`, `home-interior`, `living-room` and the rest; draw a new one with `/draw` when none fits). A scene in the same place cuts; going out and coming back are a `fade`. When the trap really happens in a room, as in The Smoke, the whole video may stay in the room. What never changes between videos: the room itself, the Trainer, the cast, the voices, gold, the six steps, and the thumbnail's style (its layout changes with every video: Biku, 2026-10-18).
- **The room:** the place `the-table`, palette `table-grey`, treatment atmospheric. `iron-table` in the middle, an `iron-chair` 1.75 heads either side, the `bulb` over the middle at `y: 4.7`. The cast keep their colours; gold is the Trainer's: the bait, his tie, the badges.
- **The Trainer** (`card: "trainer"`, voice `trainer`) stands at the middle behind the table. Put what lies on the table half a head toward the person it is for, so it never hides his tie. He is in the cast and is not one of its two players.
- **The players** by card, `series: "game-theory"`: two of the Cheat, the Saint (she) and the Copycat (he). One is the person it happens to; the Cheat can be the one who works for the Trainer, shown by a gold coin he takes from the table where the other cannot see. You never speaks.
- **A group:** one back row a video, listed first in a shot at the table's `x`: `back-row` (the public) or `house-row` (gold badges), each also `-raising`, `-raised`, `-turned`. Extras, not cast.
- **Smoke** that fills the room: `smoke-creeping`, `smoke-low`, `smoke-rising`, `smoke-table`, `smoke-filling`, `smoke-high`, listed after the table. **A counter** can start with it: the storyboard's `meter` with `from` a shot.
- **The outside voice** is the narrator in this niche (`voices/leak.json`).
- **Faces hold** (L-0040): one line of feeling for the person it happens to, each step caused by something said or done; the Cheat one face; the Trainer `bored`, and `smug` with `fix-tie` when it works.

## The camera

- **Pictures made for the moment** (2026-10-14): a shot's `picture` (layers like a thumbnail's, `shared/src/thumbnail.schema.ts`) drawn instead of the scene, said over by the Trainer or the Leak. For `[WHAT YOU GET]`: two `panel`s one above the other (in a tall picture the two outcomes never sit side by side), a person in each, a `tag` with the result, everything above 0.63 of the height so the captions stay clear. For `[EVERYONE]`: the room, a `crowd` (rows of dressed figures, `hole` where the cast member stands) and the cast member, with `from` close on them (zoom about 5) and `to` the whole crowd (zoom 1). Worked examples: shots s6e2 and s6h of `runs/2026-10-14-finish-demo/storyboard.json`.
- **One big reaction** at the turn: `dollar-eyes` or `shock-lines` in a shot's effects, once a video.
- **A whip** (`transition: "whip"`) swings the camera into a shot: two or three times a video, between moments of one scene, never into a fade.
- **A Short opens moving and ends where it began:** the plan check notes a first shot that holds still and a last shot not in the first shot's place and size.

- **Wide:** where we are and how things stand. Anyone coming, going, standing up or sitting down is seen in it.
- **Close shots take the near room:** leave the back row and the things on the table out of a close-up or an eyes shot, and the Trainer's close shots have only him in them. Otherwise a rail crosses behind the head, a banknote pokes up under the caption, or a slumped neighbour's hat comes in at the edge.
- **Whoever is speaking is in the picture, in every shot of their line** (the self-check refuses otherwise). Cut the Trainer's long sentences in two: the first half close on him, the second half wide, over the room he is talking about.
- **The opening** is his close-up with the question as `words` set `low: true`. Words that say exactly what is being spoken replace the caption; words that differ do not, so never set differing words low, where the caption sits.
- **Only the eyes** (`eyes`): the person deciding, with `heartbeat-rising`; and the Trainer's last look. At most twice.
- **`tilt`:** once, where it is done, and gently (`strength` 0.15): a strong one closes in and cuts a head at the edge of a tall picture. **`push-in`:** the trap closing.
- **A card (`page`) is a shot of nobody.** It fills the middle of the picture, where the faces are; the self-check refuses a card over a face. So a card is for the outside voice. What the Trainer says is shown as `words` or a `number` over the room.
- **The light:** `bulb-flicker` with `gloom-flicker` as the outside voice comes in, `bulb-dim` with `gloom` after. Never as decoration.
- **Not there yet:** a door, a wall clock (no clean place beside the gallery in a tall picture); a seated shrug or crossed arms; passing a thing from hand to hand; picking a card up.

## Sound

- **Music runs under the whole video and follows what is happening** (Biku, 2026-10-11): `unease`, then `closing-in` as it thickens, then `aftermath` from "This is not a story". No scene is marked `quiet`.
- `heartbeat-rising` under the eyes; `boom` once, on the choice; `clunk` to end; `creak`, `footsteps`, `ding` where someone moves or takes something.
- Seen while building part 3 of Tape 01: a card read aloud lights each of its lines as the voice reads that line (one shot to a line of the card); big words at the top of a tall picture sit on the bulb and run into the counter, so stand them `low`; and someone with heavy lids (the Trainer's `bored`) who looks `up` loses his pupils under them, so he looks at the camera or at a person.
- **The voices are Chatterbox** (Biku, 2026-10-14: "yes use chatterbox of course"): every voice of this niche copies a sample of its own Kokoro voice, so the cast sound like themselves, more alive. Give the players a mood or sound tag in `say` where the moment calls for it ([surprised] before "Is that smoke?", [chuckle], [sigh]); the Trainer stays steady, with [narration] at most. A line takes about five times its length to speak on this laptop: a part of 40 seconds about four minutes.
- **How the lines are said** (Biku picked it by ear, 2026-10-13, L-0043): each line has a pace of its own (`speed`: scared lines a little fast, calm ones and the ones that sink in slower) and a `say`, the same words with commas and "..." where the voice breathes, so the word after the "..." lands. The captions never show them. The Trainer's voice is a blend (`voices/trainer.json`). The worked example is `SAID` in `runs/2026-10-12-the-smoke-plain/script-lines.py`. A slower line can push a shot past four seconds: run the plan check again and split it. Two things the voice cannot do (Biku heard the first, on "He... stays.": "it sounds weird"): a "..." after a one-word opening leaves that word hanging in the air like a question, and a line of two or three words slowed much below its pace has its last word dragged out into a croak. Say short lines plainly and let the quiet round them carry the weight.
- Print how Kokoro says a name before trusting it (`pipe(text).phonemes`). Claude cannot hear: the mix is judged by measurement, and Biku is told it needs his ears.

## One story, told in order (L-0038, L-0039)

- **One thing happening, first moment to last, in at most two places** (the room, and where the trap happens). Nothing but "now". Each step is caused by the one before.
- **The real study is told in the room,** by the Trainer, with its number over the picture. No cutting away.
- **One thing that only moves one way** is in the picture from when it starts to the end (the smoke, the counter).
- **The last line answers the first.**

## How a part is checked

- Look at every strip that crosses a move of the body large, one or two to a picture (L-0041): a chair that slides and an arrow left behind got past a sheet of thumbnails.
- `npm run plan -- draft` writes `storyboard.draft.json` itself once a storyboard exists. Never copy `storyboard.json` over it.

## Lessons

L-0038, L-0039 (one story, alive), L-0040 (faces hold), L-0041 (seat and arrow; look large), L-0042 (plain words).
