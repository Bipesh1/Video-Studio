# What's the Catch? format playbook (the hidden money in everyday things; `fine-print` inside the studio)

Why an ordinary thing costs what it costs or works the way it does, told as a short stick-figure story: the viewer's own moment at the counter, the money followed to where it goes, the trick behind it, the real numbers. Set up on 2026-10-15 on Biku's word ("i need a separate environment for this niche apart from game theory"), from a niche suggestion he passed on and chose to work on. **Everything on this page belongs to this niche only**; nothing of the game theory niche (its room, cast, Trainer, dark look, music, thumbnail look) carries over, and nothing here binds another niche. The numbers are in `formats/fine-print.json`, the page file is `brands/fine-print.json`, the script guide is `prompts/fine-print.md` (v4.0), the topic finder `prompts/fine-print-topics.md` (v4.0), and how explainer videos win views is researched in `knowledge/playbooks/explainers.md` (read it before planning a video). Keep this page under 80 lines.

## How a video is made (2026-10-21)

Biku: "I want that channel to be an explainer type channel that explains interesting topics with good drawings and animation", "research how explainer videos work ... and make sure this studio works like that". In order: (1) the idea and its **package** (`packaging.json`: title, question, promise, answer, the thumbnail's subject and words, the first ten seconds, why a stranger clicks; `npm run script -- check` refuses a script without it, the format says `packaging: true`); read the title and thumbnail words alone, and drop an idea that cannot be packaged; (2) the script, in the shape that explains this topic best (journey, loops, myth then truth, follow the money, step by step, what if then the price, countdown, before and after, or a mix; Biku 2026-10-21: "don't always follow a rigid structure"; the format's `freeOrder` lets the middle beats come in any order, only the hook and the payoff hold their places), with a hook in the first three seconds and a last line that answers the first, a laugh every half minute from the topic; mostly a vertical Short of about 1 minute, a little longer is fine (Biku, 2026-10-21: "i will be posting shorts mostly and if i want video i will tell you"; 2026-10-22: "now the shorts will be about 1 minute or a little longer"), a 4 to 6 minute YouTube video only when he asks; (3) the visual metaphors and the world sketched before drawing; (4) the drawing at the channel's quality bar; (5) the thumbnail from the package; (6) for a long video, one Short cut from its strongest moment, ending on an open question. After posting, ask Biku for the 30-second intro figure, the retention line and the click-through rate, and write what they show under Lessons.

## Still to be decided with Biku (none of it is built yet)

- **Before the next video: the drawing.** Biku, 2026-10-20, after the seal video: "the drawings are not that good for whats the catch", and its thumbnail "isnt attractive may be because of the drawing". The seal world was flat shapes (people as blocks, organs as ovals, no light or depth), below the sunset world's polish. The next video starts with a look test: a person, an animal, a scene and two or three thumbnails redrawn with light, shade, depth and detail, as numbered options for him to pick; then a kit of well-drawn parts reused by every world. Thumbnails: one big bright subject close up, strong colour, not two small halves. Do not trade drawing for camera movement: both are asked for.

- ~~The channel name.~~ Decided 2026-10-15: **What's the Catch?** (Biku: "i have changed my channel name to whats the catch?"). Inside the studio the niche, its format, style and page keep the id `fine-print`.
- ~~Who is on screen.~~ Decided 2026-10-15: no characters. The niche is an illustrated explainer in its own style, look 4 ("4 looks good"; `styles/fine-print/guide.md`, `tokens.json`); people appear only as faceless figures.
- **The narrator's voice.** `brands/fine-print.json` names `narrator` (Kokoro, a placeholder). Audition voices for him, Chatterbox included, and save the one he picks as this niche's own voice file.
- **The thumbnail design.** Designed with the first video, numbered options for him to pick, its style saved in `library/thumbnail-designs/`; every video gets its own layout in that style, never the same one again (Biku, 2026-10-18) (`knowledge/playbooks/thumbnails.md`). A price tag, a big number or a split of where the money goes are the obvious pictures; a frame of the video never is.

## The beats, in order (the guide's names in brackets)

- **the-question** (The question), about 8%: one question in big words over the place, then a line that promises a surprise. Biku's opening rule (CLAUDE.md) holds.
- **the-moment** (The moment), about 17%: the customer at the counter, the gate or the shelf, the price in front of them.
- **follow-the-money** (Follow the money), about 30%: each share of the money, on screen as it is said.
- **the-trick** (The trick), about 25%: why the business does it, shown happening.
- **the-proof** (The proof), about 12%: the real numbers with where they come from.
- **your-move** (Your move), about 8%: one thing to do; the last line answers the first.

## Numbers

- About 60 to 80 seconds (from 2026-10-22), one or two parts, 145 to 170 spoken words, a shot 2 to 4 seconds, a little quicker than the game theory videos (120 to 165 words a minute). Sources are required for every figure.

## The world

- **Its own style, not Ink Stick** (Biku, 2026-10-15: "instead of creating these stick men we can use Vox style animations by illustrating about these businesses", then "4 looks good"): flat warm illustration, a fine navy line round things and people, none on charts (`styles/fine-print/guide.md`).
- **Every shot is an explainer graphic** (`graphic` on a shot, `shared/src/graphic.schema.ts`, drawn by `engine/src/explainer/Graphic.tsx`): scene, number, receipt, split, flow, bars, tag, queue. One graphic to a line of the script, and its pieces arrive one at a time on the words that name them (`on`), as Biku asked: "attractive explanation step by step". The script guide v2.0 writes them as `[SPLIT: ...]` and the like after each line; turning those into `graphic` objects is a plain copy.
- **Places** are drawn as scenes of this style (`cinema-counter` is the first); a new one is drawn for the first script that needs it.
- **The scene a storyboard still names** (place, palette) is not drawn under a graphic; any place will do (the demo uses `classroom`).
- **Shots may run 2 to 7 seconds** (`shotLength`): a graphic is held while it builds, and something new arrives every second or two.
- **Captions**: every graphic's body is drawn a fifth smaller under its title so it ends above the captions (they reach up to about 1280 of 1920).
- **Worked example:** `runs/2026-10-15-fine-print-demo/` (`demo.py`), a one-minute popcorn demo with sample numbers.
- **Finish**: snappy, not on twos (graphics move smoothly), a little grain and darker edges, the faint trembling line Biku picked for every niche (`boil` 0.25).

## Beyond money, and the journey (2026-10-17)

- **Any topic, one promise** (Biku: "it shouldn't be always about the business ... it can be about theories related to solar system ... multiple genre of topics", and "I want something which users feel amazed about"): the surprise hiding inside something the viewer used, saw or believed today. Money, space, the body, food, history. The test: they touched it today, and the catch flips what they were sure of ("why doesn't the Moon fall" fails; "your phone's map needs Einstein" passes).
- **The journey picture** (Biku: "the animation should be very immersive, not a bunch of slideshows ... like opening up a planet and showing it"): `graphic.kind: 'journey'` (`shared/src/graphic.schema.ts`, drawn by `engine/src/explainer/Journey.tsx`). One world drawn at its true sizes; the camera flies between named stops without a cut (the smooth zoom of van Wijk and Nuij), things arrive on their words (`show`, `keep` for what is already there), a callout puts a number in the picture. Two journey shots in a row are joined by the camera, never by a travel. The first world is `orbit` (your phone, the street, the clouds, the Earth, the GPS satellites, a satellite opening on its atomic clock, the time signals, the four distances, the grid of gravity, two clocks). A new topic draws its own world.
- **Look at it moving:** `npm run frames -- --video=journey --at=0.5,3,6` renders chosen seconds of a sandbox video side by side; the test clip is `npm run sheets -- --only=journey --video`. Check the moment mid-flight between two scales, where the frame can be nearly empty.
- **The big "what if"** (2026-10-19, Biku: "abstract concepts ... like can human evolve so much that they don't have to sleep"): a second kind of topic, a wild question about you or the human body (never sleeping, living to two hundred, hair never cut) answered with real science. It starts from something everyone does every day, the answer is never a plain yes or no (the price, the limit, or where it already happens in nature), what nobody knows is said plainly, and it never gives health advice. Same six beats; the guide v3.1 says how each goes. Check its facts as hard as any other: a wild question, a real answer.
- The beat ids stay the money names of v2 (`follow-the-money`, `the-trick`, `your-move`); the guide calls them follow the clue, the catch, now you'll notice.

## Sound

- Music under the whole video, light and curious: `curious` and `upbeat` for the story, `comic` for a funny beat, `tense` only for the twist, `reflective` or `hope` at the end. Not the game theory moods.
- Effects a little more often than in the game theory videos (4 to 10 a minute): a till `ding` on a price, `pop` as a number lands, footsteps, the crowd of the place (`crowd-murmur` is the room tone).
- Claude cannot hear: the mix is judged by measurement and Biku is told it needs his ears.

## How a part is checked

- The self-check's `empty-picture` measures the middle of every picture ten times a second and fails the part where it stands nearly empty for more than half a second.
- As every video: stills, strips large, `npm run qa`, one part at a time with his go, the joined video, and **a designed thumbnail picked by him before the video is called finished** (the delivery page says "Not all ready yet" until then).

## Lessons

- The look, v2 (2026-10-16): every picture on its own bold page colour, a big title with its key line boxed, a larger drawing, a camera that never stops, the camera travelling between pictures (slides, dives, and matches that turn one thing into the next), a sound on every arrival. Biku's test: `runs/2026-10-15-popcorn/part-1/clips/immersive-before-after-0-22s-v2.mp4` ("its fine"). When planning, look for the thing two pictures share and match on it; a marker `(from: thing)` in his script asks for it.
- Never stuck on one picture (Biku, 2026-10-19: "it should not be stuck in one photo for long time. each new info should bring a great animation"): every new fact arrives with its own move (a flight, an opening, a thing arriving and moving), and the camera never just waits. The self-check's `still-picture` measures it: the middle of the picture against one second before, ten times a second; nearly still for more than 3 s fails (`stillPictureCheck` in `shared/src/qa.ts`). The sunset video's part 3 held still for nearly 6 s, so it would fail.
- L-0048: the page is never left empty, or nearly empty, while the narrator talks. The engine keeps it filled (first piece at once, pale outlines of what is coming, pictures with numbers) and the self-check measures it (`empty-picture`).

The general ones apply: plain words a stranger follows (L-0042), faces hold (L-0040), look at moves large (L-0041), a question must sound like a question (L-0047).

## Planning a 1-minute Short (2026-10-22, from two Kurzgesagt Shorts)

What the shot plan does in every Short (the study: `knowledge/playbooks/kurzgesagt-study.md`):

- **A gauge only when the story has one** (`gauges` on the storyboard, from the script's THE GAUGE line): a count, a bar or steps, changing on the words that say it. Most Shorts have none; the pictures, the lens and the camera are chosen for each topic, and no two Shorts in a row are staged the same way (Biku, 2026-10-24: "be flexible when you work with other shorts").
- **A label on every new word** as it is said (a journey thing's tag, or a label overlay); the captions stay small.
- **A new picture every 2 to 4 seconds,** by the camera moving (`cam` on a journey thing, a travel, a dive) or by a cut. **The camera is calm** (Biku, 2026-10-22: "is the camera movement too fast?"; measured, ours moved 35% of the time against Kurzgesagt's 18 to 23%): a move takes 1 to 1.5 seconds, the camera then rests at least 1.5 seconds with only a slow drift, and a thing named sooner than that, or too soon for a move to finish, is cut to (`CAMERA_REST` in `engine/src/explainer/BodyWorld.tsx`). Aim for the picture moving about a fifth of the time.
- **A beat after every joke, reveal or finished step** (Biku, 2026-10-23: "the pacing from one info to another is too fast ... from the toilet to another frame"; measured, the toilet was on screen 0.9 s): that line's `pauseAfterMs` is about 1200 to 1500, so its picture stays about 2 seconds before the next idea; ordinary lines keep 400 to 600. Every picture the camera goes to is on screen at least about 1.5 seconds.
- **One continuous camera, a few cuts** (Biku, 2026-10-24: "most of the time it should be continuous camera shots and for few areas it can be separate frames"; the third Kurzgesagt Short has 3 hard cuts in 46 s): build a Short's world so the camera can travel between its places (a door the camera flies through, a lens on the thing named, a lens-out back into the next picture, an x-ray in the same frame), never as separate sets joined by cuts; cut only at a complete change of subject, two or three times a Short.
- **A view through someone's eyes must say whose it is, and leave by a move that links to the next picture** (Biku, 2026-10-24, on "Your First Memory": after the dive through the baby's eye "it stops at a random picture and then shows the mascot"). The baby's view (the hood, the sky, the blanket) had nothing in it to say it was the baby's, was held through a pause with nothing new said, and was left by a hard cut. Next time: keep a clue of whose view it is in the picture (the baby's own hands and cupcake at the bottom, the eye's edge round the view, or a label), do not hold a picture the viewer cannot read, and leave by pulling back out the way you came (out of the eye, back into the bubble over the mascot's head) instead of a cut.
- **A lens into the body or a thing** (`transition: "lens"`, `diveAt` on the spot) once or twice a Short, where the story goes inside.
- **A colour for each part,** matched to its mood: dark for the bad news, a burst of warm light for hope.
- **Big subjects, faces that react,** and the character's one gag where the script puts it.
