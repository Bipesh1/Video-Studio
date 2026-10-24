# Your First Memory Might Never Have Happened: what to upload

**Ready to upload.** Every file below passed its checks.

Made on 2026-10-24. Everything is in this run's `out` folder.

## Vertical full video (1 min 10 s)

For Facebook Reels (it also fits as a YouTube Short, if you want one).

- Video: `first-memory-9x16-v3.mp4`
- Thumbnail: `first-memory-9x16-thumbnail-v1.jpg` (the wide one is YouTube's size, the tall one is for the cover of a Short or a Reel)
- A frame of the video with the title on it, if a site wants one: `first-memory-9x16-v3-cover-side.jpg`
- Captions file: `first-memory-9x16-v3.srt`
- Title to type in: Your First Memory Might Never Have Happened

| Check | Result |
| --- | --- |
| The file plays | passed: 1080x1920, 30 pictures a second, 70.4 s, picture and sound both there; played through from start to finish |
| It is as long as its parts together | passed: 70.4 s; its 2 pieces add up to 70.4 s |
| Its pictures are the parts that passed | passed: every frame against first-memory-part-1-9x16-v4.mp4 and first-memory-part-2-9x16-v4.mp4 (the strongest difference is 1 of 255; over 16 would be a different picture) |
| Its sound is the mix made for the whole video | passed: second for second (what is left over is 36 dB under it at most) |
| There is no dead silence | passed: the sound never drops out; the longest pause between words is 2.5 s |
| The sound is at the right level | passed: loudness -14.0 LUFS, the level video sites play at (the target is -14, give or take 0.5); highest peak -1.2 dB (the limit is -1) |
| Nothing drowns the words | passed: 53 sound effects, the loudest of those over words 14 dB under the voice; the music sits 17.3 dB under the voice while someone speaks |
| Every join and the cover hold up | passed: a strip of frames across the join between parts, and the cover picture |

## What these checks cannot judge

- How it sounds. Claude cannot hear: the levels are measured, the listening is yours.
- Whether the story holds you.
