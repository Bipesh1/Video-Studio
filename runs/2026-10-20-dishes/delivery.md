# She Wrote Down Every Dish She Washed for a Year: what to upload

**Not all ready yet.** See "Still to do" below.

Made on 2026-10-20. Everything is in this run's `out` folder.

## Wide full video (1 min 47 s)

For YouTube, as a normal wide video.

- Video: `dishes-16x9-v1.mp4`
- Thumbnail: **none yet.** A frame of the video is not a thumbnail.
- A frame of the video with the title on it, not for the thumbnail: `dishes-16x9-v1-cover-side.jpg`
- Captions file: `dishes-16x9-v1.srt`
- Title to type in: She Wrote Down Every Dish She Washed for a Year

| Check | Result |
| --- | --- |
| The file plays | passed: 1920x1080, 30 pictures a second, 106.7 s, picture and sound both there; played through from start to finish |
| It is as long as its parts together | passed: 106.7 s; its 3 pieces add up to 106.7 s |
| Its pictures are the parts that passed | passed: every frame against dishes-part-1-16x9-v3.mp4 and dishes-part-2-16x9-v1.mp4 and dishes-part-3-16x9-v1.mp4 (the strongest difference is 1 of 255; over 16 would be a different picture) |
| Its sound is the mix made for the whole video | passed: second for second (what is left over is 34 dB under it at most) |
| There is no dead silence | passed: the sound never drops out; the longest pause between words is 2.7 s |
| The sound is at the right level | passed: loudness -14.0 LUFS, the level video sites play at (the target is -14, give or take 0.5); highest peak -1.2 dB (the limit is -1) |
| Nothing drowns the words | passed: 21 sound effects, the loudest of those over words 13 dB under the voice; the music sits 17.5 dB under the voice while someone speaks |
| Every join and the cover hold up | passed: a strip of frames across each of the 2 joins between parts, and the cover picture |

## Still to do

- dishes-16x9-v1.mp4: its thumbnail. Draw the designed options (`npm run thumbnail`, the rules in knowledge/playbooks/thumbnails.md), let Biku pick one by eye, then `--pick` it and make this page again.

## Worth a second look

- Midnight in the kitchen: she writes in her blue notebook at the sink under SHE WROTE DOWN / EVERY DISH SHE WASHED / FOR A WHOLE YEAR; the tally page fills and counts up to 4,212; she shuts the notebook and looks at us. The film runs back to ONE YEAR EARLIER: winter, the fight at the full sink, her pointing, his shrug, I DO EVERYTHING against I DO PLENTY, he walks off; her rule, the notebook dropping onto the counter; at the table with it. Faces change on some cuts in the quick back and forth of the fight: kept, the fight is the cause.
- A year of writing: snow, then blossom, then autumn in the window while she writes at the sink and the clock's hands run; the tally page counting up. One night: she comes down with a mug, he is at the table with something small and turns from surprise to a lie; her close look, He's hiding something. The anniversary through a dip to dark: the notebook drops between the plates, 4,212 / dishes, all hers, she stands with arms crossed and smug, he looks down guilty; the push in and the ticking clock on So who really did more?
- The drawer opens on his orange notebook as he stands; she turns from smug to surprise, then her jaw drops with shock lines (the one big reaction). His page: FIXED THE BOILER, 2 A.M., WALKED THE DOG IN THE RAIN. Each reads the other's, surprise softening. The kitchen lit in two halves, each lit only on their side. 1979 over the couples; WHO DOES IT? making breakfast to starting the arguments; HERS and HIS sliding onto one plate and spilling over its rim; the two pointing in a fight; NO MORE NUMBERS / JUST A MARK ON A LINE; you in the crowd; the two of them at the table, the faces softening to a smile; the camera pulls back on the whole house.

## What these checks cannot judge

- How it sounds. Claude cannot hear: the levels are measured, the listening is yours.
- Whether the story holds you.
