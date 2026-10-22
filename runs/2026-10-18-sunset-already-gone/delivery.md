# Why Is the Sun Already Gone When You Watch It Set?: what to upload

**Not all ready yet.** See "Still to do" below.

Made on 2026-10-19. Everything is in this run's `out` folder.

## Vertical full video (1 min 50 s)

For Facebook Reels (it also fits as a YouTube Short, if you want one).

- Video: `sunset-already-gone-9x16-v1.mp4`
- Thumbnail: **none yet.** A frame of the video is not a thumbnail.
- A frame of the video with the title on it, not for the thumbnail: `sunset-already-gone-9x16-v1-cover-side.jpg`
- Captions file: `sunset-already-gone-9x16-v1.srt`
- Title to type in: Why Is the Sun Already Gone When You Watch It Set?

| Check | Result |
| --- | --- |
| The file plays | passed: 1080x1920, 30 pictures a second, 109.7 s, picture and sound both there; played through from start to finish |
| It is as long as its parts together | passed: 109.7 s; its 3 pieces add up to 109.7 s |
| Its pictures are the parts that passed | passed: every frame against sunset-already-gone-part-1-9x16-v2.mp4 and sunset-already-gone-part-2-9x16-v1.mp4 and sunset-already-gone-part-3-9x16-v1.mp4 (the strongest difference is 1 of 255; over 16 would be a different picture) |
| Its sound is the mix made for the whole video | passed: second for second (what is left over is 38 dB under it at most) |
| There is no dead silence | passed: the sound never drops out; the longest pause between words is 2.3 s |
| The sound is at the right level | passed: loudness -14.0 LUFS, the level video sites play at (the target is -14, give or take 0.5); highest peak -1.1 dB (the limit is -1) |
| Nothing drowns the words | passed: 38 sound effects, the loudest of those over words 18 dB under the voice; the music sits 16.8 dB under the voice while someone speaks |
| Every join and the cover hold up | passed: a strip of frames across each of the 2 joins between parts, and the cover picture |

## Still to do

- sunset-already-gone-9x16-v1.mp4: its thumbnail. Draw the designed options (`npm run thumbnail`, the rules in knowledge/playbooks/thumbnails.md), let Biku pick one by eye, then `--pick` it and make this page again.

## Worth a second look

- One journey: out of the phone's screen past your shoulder to the beach, closer to the sea, the straight line drawn and cracked away.
- One journey: from the beach down to the glass and its snapped straw, up to the sky cut open into layers with a beam bending through them, a high Sun whose light drops straight down, and out to the curve of the Earth with a low Sun.
- One journey from space down the curved beam into your phone; the straight line your eyes assume, the real Sun dashed below the horizon by its own width; 0.5 degrees, +2 MIN, SUNSET includes the 2 minutes, the squashed Sun with BOTTOM lifted more than the top, and the phone screen ending on ALREADY GONE with the real Sun just below.

## What these checks cannot judge

- How it sounds. Claude cannot hear: the levels are measured, the listening is yours.
- Whether the story holds you.
