# Dilemma thriller format playbook (game theory thrillers)

Two-minute game theory thrillers, mixed in with the usual videos of The Dilemma Table (Biku, 2026-10-15: "it mixes into them and i will put them as video as well"). A few of the fixed cast trapped in a high-stakes game in one place, told from inside the danger, with a twist that is a real result of game theory. The numbers are in `formats/dilemma-thriller.json`; the page is `brands/dilemma-table.json` (it lists this format in `alsoFormats`, so `npm run script -- new --format=dilemma-thriller` takes it); the script guide is `prompts/dilemma-thriller.md` (v1.0). **Everything on this page belongs to the game theory niche.** Read `knowledge/playbooks/formats/dilemma.md` too: the cast, the Trainer, the room, the voices, faces that hold and the camera rules all hold here; this page says only what is different. Keep it under 60 lines.

## What is different from the usual videos

- **Told from inside the danger.** The story's own place from the first frame (a ship's cabin in a storm, a prison cell, a stuck lift), drawn for the first script that needs it with `/draw`, then kept. Atmospheric treatment, a dark palette of the place (`storm-slate`, `dusk-violet`, `danger`), never the grey of the Table.
- **The Trainer is a voice over the story** (he is the host, so the self-check lets him be heard over shots he is not in) and is seen only at the end, in the Table room, for "it was real" and the answer. Going there is a `fade`.
- **A clock** shown at least three times (rising water, a candle, footsteps, the `wall-clock`), and `heartbeat-rising` under the eyes at the decision.
- **Two cliffhangers,** marked `[CLIFFHANGER]` in the script: each ends a part. Split the chapters there (`script.json` chapters), so a part shown alone ends on its open question.
- **The guess:** the Trainer asks the viewer what happens next, `(Silence.)` holds the picture (a long `pauseAfterMs`), then the twist. One `boom` on the twist; the one big reaction of the video (`shock-lines` or `dollar-eyes`) there or on the greed.
- **Danger, never gore:** nobody is shown hurt and no weapon is fired at a person on screen; the light goes out (`bulb-dim`, `gloom`), the camera cuts away, or the Trainer tells it. Biku's to keep or change.
- **At most four people in a picture.** Five across a tall frame made every face tiny (2026-10-14).

## Shapes

- **Both shapes:** tall for Reels and Shorts, wide for YouTube as a normal video. Each part is built and shown to Biku tall first (`--size=9:16`), one part at a time with his go. Once every part is approved, the wide parts are built (`--size=16:9`): a wide picture is laid out on its own, never cut from the tall one, and goes through stills, strips and the self-check like the tall. Then `npm run output -- --run=<run> --sizes=9:16,16:9`.
- **Thumbnails in both shapes,** designed, picked by him before the video is called finished: the game theory design (colour backdrop with rays, one face with a pale edge, two or three words), darker colours for a thriller are his to pick.

## Sound

- Music under the whole film, darker than the usual videos: `tense` and `closing-in` through the squeeze and the twist, `aftermath` from "This is a real puzzle". The room tone is the wind; a storm's `rain` under a storm. `(The music stops.)` in a script is a quiet scene (a hush).

## Lessons

None yet of its own. Those of the game theory niche and the general ones apply: L-0038 to L-0042, L-0047.
