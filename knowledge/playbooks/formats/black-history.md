# The Black history page: how a Reel is made

Biku's Black history page on Facebook, set up on 2026-10-24 after a 15-second Robert Smalls test he liked ("looks good so set it up properly but make it different than the What's the Catch"). Its own format (`formats/black-history.json`), page (`brands/black-history.json`), narrator (`voices/history-narrator.json`, provisional), style (`styles/black-history/guide.md` and `tokens.json`), writing guide (`prompts/black-history.md`) and story finder (`prompts/black-history-topics.md`). `npm run script -- new --format=black-history` picks them. **Nothing of What's the Catch? or the game theory videos applies here, and nothing of this page applies to them.**

## How it differs from What's the Catch?

|                  | What's the Catch?                           | Black history page                                                      |
| ---------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| What it is       | An explainer of a surprising everyday topic | One true story, told as it happened, from inside it                     |
| Where it goes    | YouTube Shorts                              | Facebook Reels                                                          |
| Length           | About 1 minute                              | About 75 to 90 seconds                                                  |
| Who is on screen | The channel's mascot                        | The real person, drawn from their portraits                             |
| Tone             | Curious, light, a joke or two               | Serious, warm, tense when the story is                                  |
| Look             | Bright illustrated worlds                   | The place and hour as they were: lantern light, dawn, a period interior |
| Research         | Studies and numbers                         | Official histories first, every fact sure, disputed or legend           |
| Narrator         | catch-narrator (calm, clear)                | history-narrator (deep, unhurried; still Biku's to pick)                |

## Research, every video

1. **A fact sheet before the script:** each fact on one line, marked sure (two good sources agree), disputed (say how) or legend (never told as fact). Official sources first: the National Park Service, the Library of Congress, the National Archives, the Smithsonian's National Museum of African American History and Culture, the House of Representatives' history pages, university and museum pages, the person's own words. Popular articles are leads to check.
2. **Picture research too:** photographs or portraits of the person (skin tone, hair, build, age then), what they wore, what the place looked like (maps, engravings of the time), the objects (a ship, a tool, a document). Note where no picture exists.
3. **The worked example:** Robert Smalls (13 May 1862): the NPS says about 3 a.m. from the wharf and seventeen people aboard; other sources say sixteen and differ on how many forts were passed; the hat-waving at Fort Sumter is a legend. The test said only what they agree on.

## Drawing: dignity first

The page's style guide is binding: no caricature (the NAACP's guidelines for the depiction of Black life in media; the history of Black images in early animation), real skin tones and portraits, period clothes, calm readable faces, hardship told by its traces and never shown in detail, the person acting at the centre. The studio's figure for now; a more detailed figure is a look test to show Biku first.

## The camera: one world, one camera

As the What's the Catch? lessons taught (Biku, 2026-10-24: "most of the time it should be continuous camera shots"), but in this page's own worlds: one place and hour drawn as a world the camera travels through (the harbour: close on the hat by the lantern, back out of the wheelhouse to the whole ship, on to the fort), a lens on the thing named into a close-up, an x-ray in the same frame, a map or document as part of the world; two or three cuts at most, at a complete change of time or place.

## Sound

The place itself under every scene (water and a paddle wheel, wind over a field, a crowd), music written for the moment (tense, hope, triumph, aftermath; the `mystery` palette for a night escape), a few true sounds of the story (the steam whistle). The test's mix is `.cache/smalls_sound.py`; a full video uses the studio's sound plan.

## Facebook Reels

- Vertical 9:16, about 75 to 90 seconds: Facebook has lifted its Reels length limit (June 2025), and one study found 1 to 2 minute videos engage more than 30-second ones.
- Big captions always: many people scroll with the sound off.
- The first 3 seconds are the boldest true moment, in big words.
- End on a question for the comments, and write the post's caption with it.

## Still Biku's to decide

- The page's name for the videos (the page file says "Black History" for now).
- The narrator (the provisional one is the deep voice of the test).
- Whether to look at a more detailed figure for real people, side by side with the test's.
- The first story to make in full (Robert Smalls is ready to go).
