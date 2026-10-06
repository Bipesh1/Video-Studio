# Sound test (Phase 3)

Phase 3 is built: the studio can now make music, sound effects and a finished mix. **I cannot hear.** Everything below was checked by measuring it, so it is on target and nothing clips, but only you can say whether it sounds good. Please listen with a phone speaker as well as headphones.

## What to listen to

| File | What it is |
| --- | --- |
| `../2026-10-04-moon-tax/out/moon-tax-v5.mp4` | The Moon Tax short with music and sound effects under the voice (v4 is the same video with voice only) |
| `out/music-<mood>.mp3` | One 20-second sample of each of the nine moods (table below) |
| `out/sfx-reel.mp3` | All eleven sound effects, one after another (table below) |

## The nine moods

| File | What it is for | Beats a minute | Loudness (LUFS) | True peak (dB) |
| --- | --- | --- | --- | --- |
| `out/music-tense.mp3` | Danger close by: a low pulse, trembling strings, a drum that waits | 96 | -14.01 | -1.29 |
| `out/music-sorrow.mp3` | Loss and regret: a slow piano under a cello line | 58 | -14.0 | -3.3 |
| `out/music-hope.mp3` | Things may turn out well: rising piano, warm strings, a flute | 84 | -14.0 | -1.75 |
| `out/music-triumph.mp3` | A win: brass, a marching drum and a trumpet tune | 112 | -14.01 | -1.28 |
| `out/music-reflective.mp3` | Thinking it over: soft electric piano and a few vibraphone notes | 68 | -14.01 | -1.29 |
| `out/music-curious.mp3` | Something odd to find out: plucked strings and a marimba that pokes about | 104 | -14.03 | -1.1 |
| `out/music-upbeat.mp3` | Good news and energy: strummed guitar, bass, drums and a bright piano tune | 124 | -14.02 | -1.25 |
| `out/music-calm.mp3` | Peace and rest: a harp, a soft pad and a little flute | 66 | -14.0 | -3.1 |
| `out/music-comic.mp3` | Something silly: an oom-pah tuba and a bassoon with a spring in its step | 132 | -14.03 | -1.29 |

Each mood is a short chord loop with a bass line, a simple tune and, where it fits, light drums. It is mood music, not a film score. The same mood can be made at any length, and a different tune of the same mood is one number away.

## The sound effects reel

| Starts at | Effect | What it is for |
| --- | --- | --- |
| 0.3 s | whoosh | A fast move through the air: a swing, a dash, a quick camera move |
| 1.6 s | pop | A small bright pop: something appears, a title lands |
| 2.4 s | thud | A heavy dull landing: a fall, a dropped load, a door closing |
| 3.6 s | click | A tiny tick: a latch, a switch, a cut on the beat |
| 4.4 s | footsteps | Steps on a hard floor, two a second |
| 7.1 s | wind | Open-air wind with soft gusts (runs under a whole shot) |
| 10.8 s | crowd-murmur | A room or street full of people talking, no words (runs under a whole shot) |
| 14.5 s | creak | Wood under strain: a door, a floorboard, a ship |
| 16.1 s | blip | A drop: sweat, a small idea, a tiny surprise |
| 17.1 s | hit | A cartoon blow landing |
| 18.1 s | ding | A coin or a small bell |

Reel loudness: -14.04 LUFS, true peak -1.1 dB.

## How the mix works

- **The voice is never changed.** Everything else is set against it.
- **Music dips under the voice and rises in the pauses.** In the Moon Tax mix the music sits 17.1 dB under the voice while someone speaks and 11.5 dB under it in the gaps.
- **Sound effects stay modest,** each at its own level under the voice, and lower still when one lands on a word. No effect can be turned up to the level of the voice.
- **Every finished track is brought to the same loudness:** -14 LUFS with the true peak at or below -1 dB, the usual level for social video. (Meta publishes no loudness figure of its own for Facebook; checked 2026-10-06.) Moon Tax v5 measures -14.04 LUFS and -1.1 dB in the mix, and -14.0 LUFS and -1.1 dB in the finished video file.
- A video says what it wants in a small plan: which mood starts when, and which effect happens when (`../2026-10-04-moon-tax/sound-plan.json` is the example). Moods blend into each other over a second and a half.

## Your own music and sounds

Put a track named after a mood in the `music/` folder (for example `music/tense.mp3`) and the studio uses it instead of its own. The same goes for `sfx/` (for example `sfx/whoosh.wav`). You are responsible for the license of anything you add.

## What is not there yet

- The music is simple and repeats. A long video will hear the same loop come round.
- A change of mood happens at the time the plan gives, not on a musical beat.
- Nothing picks the music and effects for a video automatically yet. That is the shot planner in Phase 4; for now a plan is written by hand.
- The Phase 2 test clips (the chase, the Golden Coin) still have no sound.
- More effects (a door knock, a sword clang, rain, a crowd cheer, a splash) are made when a story first needs them.

## Questions for you

1. Does any mood sound wrong, annoying or not like its name?
2. Does any effect sound wrong or not like the thing it stands for?
3. In Moon Tax v5, is the music too loud, too quiet or about right under the voice? Are the effects?
4. The free instrument set has one caution in its license (see `LICENSES.md`, "One caution about the SoundFont"). Are you happy to use it, or would you rather I switch to the larger MIT-licensed one?
