# Why Does Cinema Popcorn Cost Ten Dollars?: what to upload

**Ready to upload.** Every file below passed its checks.

Made on 2026-10-15. Everything is in this run's `out` folder.

## Vertical full video (1 min 51 s)

For Facebook Reels (it also fits as a YouTube Short, if you want one).

- Video: `popcorn-9x16-v1.mp4`
- Thumbnail: `popcorn-9x16-thumbnail-v1.jpg` and `popcorn-16x9-thumbnail-v1.jpg` (the wide one is YouTube's size, the tall one is for the cover of a Short or a Reel)
- A frame of the video with the title on it, if a site wants one: `popcorn-9x16-v1-cover-side.jpg`
- Captions file: `popcorn-9x16-v1.srt`
- Title to type in: Why Does Cinema Popcorn Cost Ten Dollars?

| Check | Result |
| --- | --- |
| The file plays | passed: 1080x1920, 30 pictures a second, 110.9 s, picture and sound both there; played through from start to finish |
| It is as long as its parts together | passed: 110.9 s; its 2 pieces add up to 110.9 s |
| Its pictures are the parts that passed | passed: every frame against popcorn-part-1-9x16-v1.mp4 and popcorn-part-2-9x16-v1.mp4 (the strongest difference is 1 of 255; over 16 would be a different picture) |
| Its sound is the mix made for the whole video | passed: second for second (what is left over is 41 dB under it at most) |
| There is no dead silence | passed: the sound never drops out; the longest pause between words is 2.4 s |
| The sound is at the right level | passed: loudness -14.0 LUFS, the level video sites play at (the target is -14, give or take 0.5); highest peak -1.1 dB (the limit is -1) |
| Nothing drowns the words | passed: 8 sound effects, the loudest of those over words 16 dB under the voice; the music sits 17 dB under the voice while someone speaks |
| Every join and the cover hold up | passed: a strip of frames across the join between parts, and the cover picture |

## Worth a second look

- Biku's script, used word for word (as-is); every picture is the one he wrote after each line, its pieces arriving on the words he named. Looked at as frames across the opening: the machine on 'cinema', the bucket on 'popcorn', the hand with $10 on 'ten'. The self-check cuts no strips for explainer graphics (it follows people), so the moves were looked at as frames by hand.
- Checked against the sources: $11.31 (The Numbers, 2025); 48.1% of admissions to film costs (AMC 2025, whole company); $8.57 snacks per visitor and about 18.1% food and drink costs (AMC 2025, US). The CNN, ABC and KTLA figures are as given in his script.
- The narrator is the studio's placeholder voice (Kokoro): no voice has been picked for What's the Catch? yet.
- Claude cannot hear: the voice, the music and the few sounds need Biku's ears.
- Looked at as frames across the moves (the self-check cuts no strips for explainer graphics): in the auditorium the pipe draws itself along the ceiling on 'pipes', the smell puffs out on 'smell' and keeps coming, the screen lights on 'film'; the $5 tag drops and swings on 'share', the crossed-out $10 arrives on 'costs' and is struck through.

## What these checks cannot judge

- How it sounds. Claude cannot hear: the levels are measured, the listening is yours.
- Whether the story holds you.
