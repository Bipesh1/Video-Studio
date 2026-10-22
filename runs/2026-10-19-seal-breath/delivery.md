# Could Humans Evolve to Hold Their Breath Like Seals?: what to upload

**Not all ready yet.** See "Still to do" below.

Made on 2026-10-20. Everything is in this run's `out` folder.

## Wide full video (2 min 02 s)

For YouTube, as a normal wide video.

- Video: `seal-breath-16x9-v1.mp4`
- Thumbnail: **none yet.** A frame of the video is not a thumbnail.
- A frame of the video with the title on it, not for the thumbnail: `seal-breath-16x9-v1-cover-side.jpg`
- Captions file: `seal-breath-16x9-v1.srt`
- Title to type in: Could Humans Evolve to Hold Their Breath Like Seals?

| Check | Result |
| --- | --- |
| The file plays | passed: 1920x1080, 30 pictures a second, 121.8 s, picture and sound both there; played through from start to finish |
| It is as long as its parts together | passed: 121.8 s; its 3 pieces add up to 121.8 s |
| Its pictures are the parts that passed | passed: every frame against seal-breath-part-1-16x9-v5.mp4 and seal-breath-part-2-16x9-v2.mp4 and seal-breath-part-3-16x9-v2.mp4 (the strongest difference is 1 of 255; over 16 would be a different picture) |
| Its sound is the mix made for the whole video | passed: second for second (what is left over is 36 dB under it at most) |
| There is no dead silence | passed: the sound never drops out; the longest pause between words is 2.3 s |
| The sound is at the right level | passed: loudness -14.0 LUFS, the level video sites play at (the target is -14, give or take 0.5); highest peak -1.1 dB (the limit is -1) |
| Nothing drowns the words | passed: 81 sound effects, the loudest of those over words 14 dB under the voice; the music sits 17 dB under the voice while someone speaks |
| Every join and the cover hold up | passed: a strip of frames across each of the 2 joins between parts, and the cover picture |

## Still to do

- seal-breath-16x9-v1.mp4: its thumbnail. Draw the designed options (`npm run thumbnail`, the rules in knowledge/playbooks/thumbnails.md), let Biku pick one by eye, then `--pick` it and make this page again.

## Worth a second look

- One journey: you under the bathwater with the counter ticking, down through the water to the turning Earth, back to the counter (1 MIN), into your chest, the lungs and the beating heart, the blood leaving the hands and feet, into the spleen's sponge of red cells, the cells pouring out like a backup tank, and through the water to a seal with its spleen glowing. Measured: never empty for more than 0.4 s, never still.
- Through the water from the seal up to the Bajau village on stilts (THE BAJAU / SEA NOMADS), the houseboats sailing in; a family on its platform, a gold tank glowing in the grown-up; a diver diving to the reef among fish; the scan on the shore, the two spleens arriving on their names, +50%, a tennis ball beside the screen; into the Bajau spleen to a turning strand of DNA, one piece glowing (IN THEIR GENES); out to the houseboats, 1,000 YEARS, days and nights flickering past. Measured: never empty for more than 0.4 s, never still.
- Up from the houseboats to the journal page in the sky (CELL 2018); into its figure, the gene glowing (PDE10A), a hormone drifting to the spleen with a question mark (NOBODY KNOWS YET); through the water to the record's pool, its clock running up to 29:03 (29 MINUTES / WITH HELP), close on the oxygen tank (PURE OXYGEN); through the water home to the bath, your chest opening on a slow glowing heart, the spleen squeezing, and up out of the bath as the counter stops (IT'S ALREADY HAPPENING). Measured: never empty for more than 0.4 s, never still for more than 2 s.

## What these checks cannot judge

- How it sounds. Claude cannot hear: the levels are measured, the listening is yours.
- Whether the story holds you.
