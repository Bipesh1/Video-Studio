# Why a Fine for Being Late Made Parents Even Later: what to upload

**Not all ready yet.** See "Still to do" below.

Made on 2026-10-17. Everything is in this run's `out` folder.

## Vertical full video (1 min 49 s)

For Facebook Reels (it also fits as a YouTube Short, if you want one).

- Video: `late-fine-9x16-v1.mp4`
- Thumbnail: **none yet.** A frame of the video is not a thumbnail.
- A frame of the video with the title on it, not for the thumbnail: `late-fine-9x16-v1-cover-side.jpg`
- Captions file: `late-fine-9x16-v1.srt`
- Title to type in: Why a Fine for Being Late Made Parents Even Later

| Check | Result |
| --- | --- |
| The file plays | passed: 1080x1920, 30 pictures a second, 108.8 s, picture and sound both there; played through from start to finish |
| It is as long as its parts together | passed: 108.8 s; its 3 pieces add up to 108.8 s |
| Its pictures are the parts that passed | passed: every frame against late-fine-part-1-9x16-v1.mp4 and late-fine-part-2-9x16-v1.mp4 and late-fine-part-3-9x16-v1.mp4 (the strongest difference is 1 of 255; over 16 would be a different picture) |
| Its sound is the mix made for the whole video | passed: second for second (what is left over is 35 dB under it at most) |
| There is no dead silence | passed: the sound never drops out; the longest pause between words is 3.3 s |
| The sound is at the right level | passed: loudness -14.0 LUFS, the level video sites play at (the target is -14, give or take 0.5); highest peak -1.2 dB (the limit is -1) |
| Nothing drowns the words | passed: 16 sound effects, the loudest of those over words 16 dB under the voice; the music sits 17.4 dB under the voice while someone speaks |
| Every join and the cover hold up | passed: a strip of frames across each of the 2 joins between parts, and the cover picture |

## Still to do

- late-fine-9x16-v1.mp4: its thumbnail. Draw the designed options (`npm run thumbnail`, the rules in knowledge/playbooks/thumbnails.md), let Biku pick one by eye, then `--pick` it and make this page again.

## Worth a second look

- Every shot checked large: in s2d the Copycat, the teacher and the boy are in every frame; the boy brightens when his father arrives (one change of face, the one leap of feeling, on purpose).
- The voices took 34 minutes for 29 seconds of speech: the laptop was busy with other programs (the processor at 60% with nothing of the studio running).
- Every cut looked at large: nobody vanishes; the teacher, the boy and the father are in every frame of each wide shot.
- The voices of part 2 took 12 minutes.
- Every cut looked at large: nobody vanishes; the ending is the opening's place and size, the boy alone at the window.
- The voices of part 3 took 16 minutes.

## What these checks cannot judge

- How it sounds. Claude cannot hear: the levels are measured, the listening is yours.
- Whether the story holds you.
