# Thumbnails: how they are made

Researched on 2026-10-13, after Biku rejected three rounds and said "first research how a youtube thumbnail is made and then do it. research properly first". What he asked for is in lesson L-0044. This page is what the research says and how the studio applies it. Most sources are creator-tool companies; the numbers are theirs and are marked as such. YouTube's own advice is short and is listed first.

## What the sources say

**YouTube itself** (Help Center):

- Use the rule of thirds for the picture, then add descriptive text in a font that is easy to read.
- Keep it uncluttered: too much colour and composition overwhelms the eye.
- Make the subject as large as possible, because a thumbnail is shown at very different sizes.
- Be accurate. A picture or title that misrepresents the video makes viewers leave, and that hurts the video.
- New viewers respond to universally readable feelings on a face; subscribers respond to what they recognise.

**The file:** 1280 by 720 (16:9), at least 640 wide, under 2 MB, JPG or PNG. The length of the video is stamped on the lower right corner, so nothing to read goes there. Keep faces and words off the edges.

**vidIQ's study of 500 breakout videos (their numbers):**

- 69% showed a face; 80% of the top 50 did. "A clear face matters far more than a wild expression."
- 56% used high-contrast colour; 89% used a face, high contrast, or both.
- Where there were words, the middle count was five. Past five or six they cannot be read in a feed.
- One subject, cropped tight, with the background clutter gone. At most one or two cues such as an arrow.
- The face fills roughly a quarter to a third of the frame and does not collide with the words.
- Red, white and black blend into YouTube's own page; orange, yellow, teal and purple stand out.
- Keep one layout, font and colour scheme so the channel is recognised at a glance.
- Shrink it to the size of a phone's feed (about 168 by 94) and check the subject, the words and the feeling still read.

**The usual kinds** (thumbnailtest.com): one question; a big fact or number (science, history, money); before and after; versus (two things side by side, as in the example Biku showed); a quote; a hidden thing; a product.

**Words and title:** the sources say the title explains and the thumbnail adds a short hook, so the two do not repeat each other. Biku's rule is firmer and comes first: the words on the thumbnail must themselves say what the video is. The two agree when the words are a short plain name for the story that is not the upload title word for word ("THE SMOKE TEST" over a video titled "How to Make Someone Sit in Smoke").

**Shorts:** on 2026-07-24 YouTube began letting Partner Program channels upload a custom thumbnail for a Short, to be widened to more channels later. Without that, a Short's cover is a frame picked in the app. A Reel takes an uploaded cover. So a vertical video needs a tall cover as well as (or instead of) the wide thumbnail.

**Shorts covers, researched again 2026-10-21** (Biku, of look-test covers that were frames with words on them: "the thumbnails are still not good, have you not researched about the thumbnails?"):

- A Short's cover never shows in the swipe feed; there the first second of the video is the cover. It shows on the Shorts shelf, in search, on the channel's Shorts tab and on the home page ([vidIQ](https://vidiq.com/blog/post/youtube-shorts-custom-thumbnails/), [Thumblore](https://www.thumblore.com/blogs/youtube-shorts-thumbnail-guide)).
- Uploading one is limited (Partner Program channels, desktop Studio, from July 2026); otherwise a frame of the Short is picked in the app ([Thumblore](https://www.thumblore.com/blogs/youtube-shorts-thumbnail-guide), [Conthunt](https://conthunt.app/blog/youtube-shorts-thumbnail-best-practices-2026)). So the designed cover also goes into the Short as a frame to pick, and the Short's first second is designed to stop a swipe.
- The shelves crop the edges: the subject and the words sit in the middle band, one to four big words, strong contrast ([Conthunt](https://conthunt.app/blog/youtube-shorts-thumbnail-best-practices-2026), [Piktochart](https://piktochart.com/blog/youtube-shorts-dimensions/)).
- Everything in "How the studio applies it" below still holds for a Short's cover: never a frame of the video, a look of its own brighter than the video, one subject big, a face about a third of the frame cut out with a pale edge, the heavy lettering with one line gold. The black-hole covers (`runs/2026-10-21-catch-look-test/thumbnails.py`) are the worked example; their first try broke every one of these rules.

## How the studio applies it

1. **Never a frame of the video.** `npm run thumbnail -- --run=<run>` draws layered posters from `runs/<run>/thumbnails.json` (rules in `shared/src/thumbnail.schema.ts`).
2. **A look of its own, brighter than the video** (Biku, 2026-10-13, of thumbnails set in the video's grey room: "it should be a little bit diffrent that what actual video looks like should be attractive and good"): a colour backdrop glowing out from behind the subject with rays of light (`backdrop`, `glow`), the subject cut out with a pale edge like a sticker (`outline`), anyone else in solid grey. The characters stay exactly themselves; it is the setting that is the poster's own.
3. **One focal point: a face of the cast, about a third of the frame,** light on dark, with a feeling that is true to the video.
4. **Three or four words that name the video**, six at the very most (the schema refuses more). Each line is fitted to the width (`justify`), the word that matters in gold.
5. **Wide layout:** words on the left half, face on the right third, the lower right corner with nothing to read. **Tall layout:** words across the top, face under them.
6. **Colour:** one strong backdrop colour that sets off the character (blue behind an orange hat), gold for the word that matters.
7. **The same layout every video,** so the page is recognised.
8. **The phone test:** the sheet (`thumbnails/sheet-<shape>.png`) shows every option large and again at feed size. What cannot be read in the small row is not finished. Claude looks at the small row before showing Biku anything.
9. **Options, numbered, side by side,** for him to pick by eye. `--pick=<n>` copies his choice beside the video.

What the rejected rounds got wrong, against this page: a frame of the video (five small figures); a line of dialogue as the words; then two stacked panels with nine words, five labels and a small running figure (clutter, no focal point, unreadable small); then the right layout in the video's own grey room, which looked like a frame of the video and not like a thumbnail.

The worked example is `runs/2026-10-12-the-smoke-plain/thumbnails.py`.

## Every video its own thumbnail (Biku, 2026-10-17 and 2026-10-18, both channels)

Of three late-fine options that were the game theory layout again: "the thumbnail design is always the same ... although the design is like that make it different". Then, for both channels: "for the thumbnail also it should not be the same, although i sent you a design it should be different based on what the video is. should be followed for both the what's the catch and the dilemma table".

- **A saved design is a style, not a layout to fill.** Keep what makes the channel recognisable: the heavy lettering that names the video, the gold or boxed line, a red mark on the thing that matters, cut-out figures with a pale edge, the channel's colours. Change everything else for each video: the composition, the background, what is the subject, what is circled or compared, where the words sit.
- **Start from the story, not from the last thumbnail.** Ask what is particular to this video (the notice with its $3, the giant clock, the same man sorry and then paying, the phone's blue dot sliding off the map) and build the picture round it.
- **The numbered options differ from each other in layout,** not only in their words. Three wordings on one picture is one option.
- **Before showing them, put them beside the channel's earlier thumbnails.** If one would look like an earlier video's at phone size, change it.
- The worked example: `runs/2026-10-17-late-fine/thumbnails.py` (a notice huge on rays; a split, sorry against paying; a clock over a waiting boy).

## Saved designs (the style of each channel)

Each is a small script in `library/thumbnail-designs/` with a function that builds one thumbnail, and samples that `npm run thumbnail -- --file=<its json>` draws beside it. They show the style each channel was picked in; they are not to be repeated video after video (above).

- **Game theory videos (The Dilemma Table): "circled, in the room"** (`library/thumbnail-designs/game-theory-circled.py`, function `circled`; drawn with `--cast=<a run>` for the cast). Since 2026-10-15, after Biku asked for the game theory thumbnails to look like What's the Catch?'s and then said the flat pages were "bland for game theory niche. be a little bit creative"; of three backgrounds he picked the video's own place at night for Never Asked Out. A place from the video in a night palette, a warm glow on the winners and shade over the rest; huge Anton words from the top left that name the video, the first line light, the last on a gold box; the winners circled in red with an arrow from the words; the one who lost apart, smaller, in the dim, looking at them. The cast drawn from their cards. The other two backgrounds he was shown, the game theory room under one bulb and a picture cut in two (rain on the loser's side, warm rays on the winners'), are in `runs/2026-10-14-never-asked-out/thumbnails.py`, for a video where they fit better. The earlier design (words on the left half, the face on the right third, a colour backdrop with rays; The Smoke, 2026-10-13) is replaced.
- **What's the Catch?: "circled"** (`library/thumbnail-designs/whats-the-catch.py`, function `circled`). Picked 2026-10-15 for the popcorn video, after his reference picture: a flat yellow page, huge words that name the video with one line boxed, the thing the money is really made on circled in red with an arrow, the thing people think they pay for crossed out, a small shocked figure. The things are drawn so they are clearly what they are ("make popcorn seem like a popcorn").
- **What's the Catch? Shorts, from 2026-10-21: "the face over the subject"** (Biku picked cover 1 of the black-hole look test, "1 i guess"; `runs/2026-10-21-catch-look-test/thumbnails.py`, option `terrified-close`). A tall cover: a bright colour backdrop with rays glowing out of the topic's subject, the subject drawn at the channel's drawing bar low in the frame, the channel's character big in the middle band with a strong true feeling and a pale cut-out edge, his face about a third of the width, and two short lines of heavy lettering across the top, the second gold, that add to the title. Each Short changes the subject, the backdrop colours, the pose, the feeling and the words; the face-over-the-subject idea stays. It replaces the flat yellow "circled" page for this channel's Shorts.
- **Animated short films: "two moods"** (`library/thumbnail-designs/short-film-split.py`, function `two_moods`). Biku showed a short film's thumbnail on 2026-10-14 and said "can you make thumbnails like these for short films. save the design. not exactly this but use your creativity". The picture is cut in two along a leaning line: where the film starts (dark, rain, the person dim and low) and where it ends (bright, rays, the same person lit with a pale edge). One thing from the story lies on the cut, tipped (a note, a ticket). The title runs across the top in two or three words, one in gold (`*word*`). The lower right corner has nothing to read. The colours of the two sides, the way the line leans, the two poses and faces, and the thing on the cut change with the film; the layout does not. A film with no saved cast yet dresses its people with `look` on an `extra`.

## Sources

- YouTube Help, tips for thumbnails and titles: https://support.google.com/youtube/answer/12340300
- YouTube Blog, custom thumbnails for Shorts (2026-07-24): https://blog.youtube/news-and-events/youtube-studio-custom-thumbnail-updates/
- vidIQ, thumbnail design tips and the 500-video study: https://vidiq.com/blog/post/youtube-thumbnail-design-tips/
- thumbnailtest.com, the kinds of thumbnail: https://thumbnailtest.com/guides/types-of-youtube-thumbnails/
- TechSmith, thumbnail sizes: https://www.techsmith.com/blog/youtube-thumbnail-sizes/
- Snappa, best practices and mistakes: https://snappa.com/blog/youtube-thumbnail-best-practices/ and https://snappa.com/blog/youtube-thumbnail-mistakes/
