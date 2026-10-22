# What's the Catch?: how to write a script

## Script guide, explainer edition (v3.0)

For Biku: paste everything under the line into whichever AI writes the script, and fill in the INPUTS at the bottom.

What changed from v2.2 (2026-10-17): the channel is no longer only about money. Biku: "it shouldn't be always about the business ... it can be about theories related to solar system ... may include multiple genre of topics", and the pictures must feel "very immersive, not a bunch of slideshows ... like opening up a planet and showing it". So: one promise for every topic (the surprise hiding inside something you use or see every day); the middle steps have names that fit any topic; and three new kinds of picture, FLY, OPEN and CALLOUT, that keep the camera moving through one drawn world instead of cutting from card to card. v2.2 is kept in `prompts/old/` for the money videos made with it.

---

## 1. The one rule

**A stranger scrolling past, who knows nothing about the subject, must understand every sentence the first time they hear it, and see it explained on screen at the same moment.**

If a line is clever but a stranger would not follow it, rewrite it plainly. No specialist words ("margin", "relativity", "orbit decay", "photosynthesis") unless the same sentence says what they mean in everyday words.

## 2. What the video is

A two-minute vertical explainer that shows the surprise hiding inside something everyone uses, sees or believes every day.

- **Money:** why cinema popcorn costs nine dollars, why airlines sell more seats than the plane has.
- **Science and space:** why your phone's map only works because time runs faster in space, why the Amazon is not really the Earth's lungs, why the gold in your ring came from two dead stars colliding.
- **Anything else** that passes the same test: the body, food, history, the home.

The test for every topic: **the viewer has touched it today, and the catch flips something they were sure about.** "Why doesn't the Moon fall down?" fails: many learned the answer at school, and nobody's day depends on it. "Your phone's map needs Einstein" passes: everyone used a map today and almost nobody knows it.

- **One narrator** tells it, like a friend letting you in on something: curious, a little amazed, never smug. Nobody else speaks.
- **The camera travels.** The best videos of this channel are one journey through one drawn world: from the blue dot on your phone, up through the sky, out to the satellites, into one of them. Things open up to show their inside. The viewer should feel they went somewhere, not that they watched slides.
- **Every line has one picture**, which builds up piece by piece while the line is spoken. There are no characters with faces; when people are needed, they are simple faceless figures.
- **One explanation at a time, in order.** The viewer never sees a number before it is said, or a thing before it is named.

## 3. How to write every line

1. **Full sentences.** Never a fragment such as "Popcorn. Ninety percent profit."
2. **One step to a line.** Each line explains one thing, and that one thing is what its picture shows. If a line needs two pictures, it is two lines.
3. **Name the first piece in the first few words**, so the picture never waits empty while the line gets going.
4. **Name every piece in the words.** If the picture shows a satellite, the line says "satellite". If a number is "38", the line says "thirty eight". This is how each piece knows when to appear.
5. **Every number says what it is a number of, and how big that is in everyday terms.** "Thirty eight millionths of a second a day", then what that means: "light travels more than eleven kilometres in that time".
6. **Say numbers the way people say them**, and write them that way in the spoken line: "nine dollars", "about thirty", "more than half". The picture shows them as figures.
7. **One idea to a sentence,** up to about 18 words. A line takes about 2 to 6 seconds to say.
8. **Every "it", "they" and "this" has an owner the viewer has just heard.**
9. **Join the steps with "so", "but" and "because".** Each step is caused by the one before.
10. No em dashes. No emoji. Mark one important word a line with asterisks for the captions: `Up there, time runs *faster*.`

## 4. The six steps, in this order

About 260 to 300 spoken words in all. That is about two minutes.

| Step                 | About      | What the viewer must come away knowing                                                                                                                      |
| -------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. The question      | 10 seconds | One question about something they use, see or believe, 12 words or fewer, as the first line, over the thing itself. Then one line that promises a surprise. |
| 2. The moment        | 20 seconds | The everyday moment, and what everyone assumes about it.                                                                                                    |
| 3. Follow the clue   | 35 seconds | How it really works, step by step. In a money video this is following the money: where each part of it goes.                                                |
| 4. The catch         | 30 seconds | The surprise that answers the question: the clever trick of a business, or the part of nature stranger than anyone thought.                                 |
| 5. The proof         | 15 seconds | The real numbers with where they come from: who found it, measured it or published it, and when.                                                            |
| 6. Now you'll notice | 10 seconds | What the viewer will see differently from now on (in a money video: one thing they can actually do), then one line that answers the opening question.       |

The first line must be a real question that the last line answers. It must not start with "In this video", "Did you know", "Have you ever wondered" or "Imagine".

## 5. The pictures: one after each line

After each spoken line, on its own line, write the picture in square brackets. Every piece marked `(on: word)` appears when that word is spoken; choose a word that is in the line. Pieces without `(on: ...)` appear one after another.

### The journey pictures (use these for most lines)

They keep the camera moving through one drawn world. The studio draws the world for each video, so describe it in plain words and list it under NEEDS DRAWING.

- `[FLY: up from the phone, through the clouds, to the whole Earth | show: satellites (on: satellites)]`
  The camera travels, without a cut, from wherever the last picture was to the new place: closer in, further out, round, along, down. Say where it ends and what arrives on the way.
- `[OPEN: the satellite | inside: the clock (on: clock)]`
  A thing opens up to show its inside, as if cut away or lifted off: a planet peeled back to its layers, a satellite's shell lifting off its clock, a phone's back sliding off to its chip.
- `[CALLOUT: 38 | caption: MILLIONTHS OF A SECOND / A DAY | at: the satellite clock | on: thirty]`
  A number or two or three words appear inside the picture, pointing at a thing in it, without leaving the world. Up to 10 characters for the number and 28 letters for the caption.

### The explainer cards (for the money in a money video, or one big comparison)

- `[SCENE: cinema counter | sign: POPCORN $9 | show: machine (on: cinema), bucket (on: popcorn), hand with $10 (on: nine)]`
  An illustrated place. Drawn so far: the cinema counter and its auditorium, the coffee counter with its tip screen. Any other place goes under NEEDS DRAWING.
- `[NUMBER: $9 | caption: FOR ONE BUCKET | picture: bucket | count up | on: paid]`
- `[RECEIPT: title: WHAT GOES IN | CORN 35¢ (on: corn) | BUCKET 45¢ (on: bucket) | TOTAL $1.35]`
- `[SPLIT: title: WHERE YOUR / $9 GOES | THE CINEMA $7.65 85% (on: cinema) | BUTTER 55¢ 6% | CORN 35¢ 4%]`
- `[FLOW: title: FOLLOW THE / MONEY | YOU (on: your) -> THE CINEMA (on: goes) -> THE FILM STUDIO (on: studio)]`
- `[BARS: title: WHAT THE CINEMA / KEEPS | ONE BUCKET 7.65 "$7.65" (on: bucket) | ONE TICKET 6 "$6" | red: ONE BUCKET]`
- `[TAG: $4.50 | note: EACH, SHARED | was $9 (on: costs) | on: share]`
- `[QUEUE: 4 people | sign: $9 | on: every]`

Every picture may have a title: one or two short lines at the top (a "/" splits them), up to 24 letters each.

**Make it immersive:**

- Prefer the journey pictures. A science video should be almost all FLY, OPEN and CALLOUT: one world, one camera, from the first line to the last.
- The camera goes from the everyday to the hidden: start on the thing in the viewer's hand, then go up, in, down or through it to where the catch is, then come back to the hand at the end.
- Open things up at least once: the moment the inside is shown is the moment viewers remember.
- Show scale by moving through it (from your hand to the whole Earth in one move), not by telling it.
- When a card is needed (a money split, a comparison), keep it to one or two in a video, and say `(from: thing)` on it when it grows out of a thing already on screen.

Do not write: characters, faces or dialogue; more than one picture for one line; real logos or brand names in the pictures; a real company accused of anything a source does not say.

## 6. The facts

- Build the video on real, checkable facts and numbers. Every number is the source's own. If it is rounded, say "about", "nearly" or "more than". If you are not sure of a figure, do not use it.
- Science: use what the scientists who measured it say, not what websites repeat. When a famous number is disputed, say what is certain instead. A simplification is fine; a wrong picture is not.
- A number that changes by country or year says which ("in the US in 2025").
- Do not claim a named company does something unless a source says so.
- End with SOURCES: who published it, the title and the year, and one line on what it says. Give a link only if you are certain it is real.
- In a money video, the tip in step 6 is legal, safe and something a person can really do.

## 7. Read it as a stranger before you hand it over

1. Do I know what or whom every line is about?
2. Is it a whole sentence?
3. Is there any specialist word I would have to already know?
4. Is every piece of the picture named in its line's words?
5. After step 3, could I tell a friend how it works?
6. Would I want to tell a friend the catch?
7. Does the last line answer the first?

If any answer is no, rewrite that line more plainly.

## 8. A finished example (the opening)

```
1. THE QUESTION
NARRATOR: How does the blue dot on your map know exactly where you are?
[FLY: close on a phone in a hand, its map with a blue dot | title: HOW DOES THE / BLUE DOT KNOW?]
NARRATOR: The answer is twenty thousand kilometres above your head, and it bends *time*.
[FLY: up from the phone, through the sky, to the whole Earth | show: satellites (on: twenty)]

2. THE MOMENT
NARRATOR: Most people think a satellite is watching their phone.
[FLY: closer to the Earth, a satellite turning its eye toward the city]
```

## 9. The layout to deliver

```
TITLE: (a "Why..." or "How..." title)
THE QUESTION IN ONE SENTENCE:
THE WORLD: (where the camera travels, in one or two lines)
NEEDS DRAWING: (the things of that world the camera visits or opens)

1. THE QUESTION
NARRATOR: ...
[PICTURE]
...
6. NOW YOU'LL NOTICE
...

SOURCES:
- ...
```

Then add:

- **YOUTUBE:** a title, two plain lines of description, one line naming the source, three to five hashtags.
- **FACEBOOK CAPTION:** one or two plain lines ending on a question for the viewer.

## 10. INPUTS

- **TOPIC:**1. Why Is the Sun Already Gone When You Watch It Set?
- **THE WORLD:** (where the camera should travel, or leave it to you)
- **EARLIER VIDEOS:** Why Does Cinema Popcorn Cost Ten Dollars?; Why Every Screen Asks You for a Tip Now; (add every video since)
- **NOTES:**
  The catch: When the Sun touches the horizon at sunset, it has already set; the air is bending its light up so you see a Sun that is really below the ground.

The journey: Start on a phone screen filming a beach sunset. Pull back to see the person filming, then rise up and turn sideways so we see the Earth's curve, the layer of air, and the real Sun sitting below the horizon. Follow one beam of sunlight as it bends through the air and curves into the person's eye.

The clue path:

Light bends when it moves from thin air into thicker air, like a straw looking bent in water.
Near the ground the air is thickest, so light from a low Sun bends the most.
That bend lifts the Sun's picture by about its own width.
So when it looks like it is sitting on the horizon, it is really one full Sun-width below it.
The light is also over eight minutes old, so you are watching an old picture of a Sun that is not there.

The facts and numbers:

Near the horizon, the air lifts the Sun's image by about half a degree, roughly the Sun's full width. British Astronomical Association. Sure.
Air bending makes sunset happen about two minutes later than it would with no air (Hong Kong example). Hong Kong Observatory. Sure.
Official sunrise and sunset tables already include this bending. Hong Kong Observatory. Sure.
Sunlight takes about 8 minutes 20 seconds to reach Earth. NASA. Sure.

Now you'll notice: Every sunset you film is partly a mirage, and the squashed, oval look of a low Sun is the air bending its bottom more than its top.

Three comments:

"So my sunset pics are fake? Great."
"This is why the sun looks flat at the bottom!"
"Bro I've watched 10,000 sunsets and none of them were real."

Scores: one-second 5 · "wait, what?" 5 · comment 4 · share 5 · journey 4
