# Why Every Screen Asks You for a Tip Now: what to upload

**Not all ready yet.** See "Still to do" below.

Made on 2026-10-16. Everything is in this run's `out` folder.

## Vertical full video (1 min 58 s)

For Facebook Reels (it also fits as a YouTube Short, if you want one).

- Video: `tip-screens-9x16-v1.mp4`
- Thumbnail: **none yet.** A frame of the video is not a thumbnail.
- A frame of the video with the title on it, not for the thumbnail: `tip-screens-9x16-v1-cover-side.jpg`
- Captions file: `tip-screens-9x16-v1.srt`
- Title to type in: Why Every Screen Asks You for a Tip Now

| Check | Result |
| --- | --- |
| The file plays | passed: 1080x1920, 30 pictures a second, 117.9 s, picture and sound both there; played through from start to finish |
| It is as long as its parts together | passed: 117.9 s; its 3 pieces add up to 117.9 s |
| Its pictures are the parts that passed | passed: every frame against tip-screens-part-1-9x16-v1.mp4 and tip-screens-part-2-9x16-v1.mp4 and tip-screens-part-3-9x16-v1.mp4 (the strongest difference is 1 of 255; over 16 would be a different picture) |
| Its sound is the mix made for the whole video | passed: second for second (what is left over is 40 dB under it at most) |
| There is no dead silence | passed: the sound never drops out; the longest pause between words is 1.8 s |
| The sound is at the right level | passed: loudness -14.0 LUFS, the level video sites play at (the target is -14, give or take 0.5); highest peak -1.1 dB (the limit is -1) |
| Nothing drowns the words | passed: 59 sound effects, the loudest of those over words 18 dB under the voice; the music sits 16.8 dB under the voice while someone speaks |
| Every join and the cover hold up | NOT passed: a strip of frames across each of the 2 joins between parts, and the cover picture |

## Still to do

- tip-screens-9x16-v1.mp4: the joins and the cover have not been looked at yet
- tip-screens-9x16-v1.mp4: its thumbnail. Draw the designed options (`npm run thumbnail`, the rules in knowledge/playbooks/thumbnails.md), let Biku pick one by eye, then `--pick` it and make this page again.

## Worth a second look

- The first video in the new look Biku picked (the 2.5D world, deep ocean colours). Looked at three frames a second across the whole part: the question builds word by word over the counter; the camera dives into the tablet and closes in on the buttons on 'buttons'; 72% counts up on the coin; the queue walks in under TIP?; the tablet turns from its back to face you on 'screen'; the three buttons become the 20, 25 and 30 percent blocks, rising on their words. Nothing appears or vanishes without a move.
- Refined with his OK in two lines of part 3 (the coffee shop study found the opposite of the old line); part 1 is his words.
- The queue is still drawn flat, in front of the 2.5D floor; the people could be drawn in the world later.
- The narrator is the studio's placeholder voice. Claude cannot hear: the voice, music and sounds need Biku's ears.
- Looked at three frames a second across the whole part: the 15% tag drops and swings; 57% counts up on the coin; the receipt prints COFFEE then OLD USUAL TIP 90 cents on 'ninety' and the total; the three blocks rise on 'ninety', 'smallest' and 'biggest', the smallest button in red; the cheap button's tag, the old 90 cents crossed out on 'old'; the counter with the buttons popping on 'buttons'; the wipe into the flow, each box and arrow on its word. Nothing appears or vanishes without a move.
- Titles build word by word as they are said, so a title whose words come late in its line (THE OLD USUAL TIP) fills in over the first seconds.
- Looked at three frames a second across the whole part: the queue under 20% NOW FEELS LIKE THE CHEAP ONE; the barista, a pale outline until 'someone', pops in behind the counter, and the dotted line of his look draws to the screen on 'watching'; the tag IN THE EXPERIMENT / FELT WORSE / ABOUT THE SHOP (Biku's agreed fix); +10% counts up on 'ten'; PUSH TOO HARD, GET NOTHING over the queue; the finger slides in on 'press' and CUSTOM lights up on 'custom'; the closing +10% holds to the end. Nothing appears or vanishes without a move.
- The last shot is 7.5 s of one number; it breathes, but it is the stillest moment of the video.

## What these checks cannot judge

- How it sounds. Claude cannot hear: the levels are measured, the listening is yours.
- Whether the story holds you.
