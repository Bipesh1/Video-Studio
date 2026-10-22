# The Dilemma Table: how to write a script

## Script guide, explainer edition (v1.0, the Kurzgesagt way)

For Biku: paste everything under the line into whichever AI writes the script, and fill in the INPUTS at the bottom. Pick the topic first with the topic finder (`prompts/dilemma-topics.md`, v5.1) or from the bank (`knowledge/topics/dilemma-bank.md`).

Why this edition (2026-10-22): Biku wants the channel made "the Kurzgesagt way", "the best" it can be. The invented little stories of the story edition felt weird; this edition tells **true** stories and real experiments, explained beautifully, with the social dilemma or game hidden underneath, and the rule shown played out by the channel's cast. Kept from before: open on the strangest moment, never a bare question; plain words a stranger follows; every explaining line shown on screen as it is said; clear before clever. The shape of the middle follows the story ("don't always follow a rigid structure"). The story edition (`prompts/dilemma-story.md`) stays for the videos made in it. Research and direction: `knowledge/playbooks/formats/dilemma-explainer.md`.

---

You are writing a script for The Dilemma Table, a channel of animated explainers about **the hidden rules of why people (and animals, and cells) do what they do**. Each video is a vertical Short of about two minutes (260 to 330 words), told by one narrator, with the channel's cast acting the rule out in a drawn world. Think Kurzgesagt: a big truth about all of us, told with wonder, humour and honesty, that leaves the viewer seeing their own life a little differently, and a little more hopeful.

## 0. The package first

Before any line, write the package. If it cannot be packaged, choose another topic.

- **TITLE:** plain words naming the strange true thing, about 40 characters, the key words first, no filler ("Monkeys Refuse Unfair Pay", "The Day Soldiers Stopped Shooting Each Other"). Not a bare "Why...".
- **THE QUESTION IN A STRANGER'S HEAD:** what a viewer wonders after the first three seconds.
- **THE PROMISE:** what they will understand by the end.
- **THE ANSWER IN ONE SENTENCE.**
- **THE GAME AT ITS HEART:** the social dilemma for the plan (fairness, cheating and punishing, reputation, the commons, trust, an arms race, a promise...). The video never needs these words.
- **THUMBNAIL:** one big picture and up to six words that add to the title.
- **THE FIRST TEN SECONDS.**
- **WHY A STRANGER CLICKS.**

## 1. What every video does

1. **It is true.** A real event, a real experiment, a real pattern in nature, from the sources given. Nothing invented is passed off as real. When the cast act it out, they are a picture of the idea, not the real people.
2. **It opens on the strangest true moment** (0 to 3 seconds): one plain line of at most 12 words that states it, the same words big on screen, the scene already moving. Then one line (3 to 10 seconds) that makes it stranger or promises more. Never "In this video", "Did you know", "Have you ever wondered", "Imagine", or a bare question.
3. **One rule per video.** The viewer leaves with one idea they can use, not three.
4. **Shown, not told.** The rule is played out by the cast where the viewer can watch it work: two of them face to face, or many of them at once in the arena, choosing, scoring, winning, losing. Write what we see after every line.
5. **Plain words.** A stranger of twelve could follow every line. No "game theory", "Nash", "equilibrium", "prisoner's dilemma"; if an idea needs a name, the same sentence says what it means.
6. **It ends where the viewer lives,** on a hopeful, thoughtful line, never doom, and the last line leads back to the first so the Short plays round again.

## 2. The shape of the middle: chosen for the story

Only the opening and the ending hold their places. Between them, use the parts the story needs, in the order it needs them, and leave out the rest:

- **The true story:** who, when, where, what was at stake.
- **The game:** the rule underneath, played out by the cast.
- **The twist:** the turn nobody expected.
- **The proof:** the real result in one or two lines, who found it and when; what is still argued, said plainly.

Some shapes that work (pick one, or mix):

- **A timeline:** a truce growing day by day, then breaking.
- **The experiment step by step:** 22 cars, one brakes a little, the wave runs back.
- **Myth then truth:** everyone predicted chaos; the surprise; the reason.
- **You play it:** the viewer is offered the deal, has a second to choose, then sees what thousands chose.
- **A tournament:** strategy after strategy knocked out in the arena, one left standing.
- **Across scales:** the same game in cells, in monkeys, in people, in nations.
- **What if everyone...:** one rule followed by all, played out until we see the world it makes.

Something new must happen on screen every few seconds, and the story must re-hook every 10 to 20 seconds with a turn, a question or a surprise.

## 3. The cast

At least two of the three, always the same look and voice (`characters/cheat.json`, `saint.json`, `copycat.json`, `trainer.json`):

- **The Cheat** takes and keeps; charming about it.
- **The Saint** gives, always, even when it costs her.
- **The Copycat** does whatever you did to him last time.
- **The Trainer** runs the games and tells the camera the truth. He is the narrator (his voice, `voices/trainer.json`); he can appear on screen setting up a game.
- **You**, the silent figure in the green cap, can stand for the viewer.

They act the rule out; they may say a short line in their own voice when it makes the moment land (at most a few per video). In a true story they play the roles of the real people (the soldiers, the monkeys, the fishermen) and the video says so plainly when it matters.

## 4. How it sounds

- Short sentences, one idea each; a comma where the narrator breathes.
- Humour that grows out of the topic, about once every 20 to 30 seconds: a look from the Cheat, a deadpan line, a cast member's tiny protest.
- A pause before the twist, and the music drops there (mark it).
- Mark one stressed word per line with _asterisks_.
- No em dashes in anything the viewer reads or hears.

## 5. What to give back

1. **THE PACKAGE** (section 0).
2. **THE WORLD:** where the video takes place and the arena if used; and **NEEDS DRAWING:** anything the studio may not have yet.
3. **THE SCRIPT**, in numbered parts, each line as:

   `NARRATOR: the line, with one *stressed* word.`
   `[SHOW: what we see | on: the word it happens on]`

   A cast line is written `CHEAT: ...` (or SAINT, COPYCAT, TRAINER). Mark `[DROP]` before the line where the twist lands.

4. **SOURCES:** each with who, what, where published and the year, and how sure (sure / fairly sure); what the video simplifies.
5. **YOUTUBE:** the title, two lines of description with the source, and five hashtags; **FACEBOOK CAPTION:** two lines ending in a question viewers will answer.

## INPUTS

- **TOPIC:** (from the topic finder or the bank, with its sources)
- **LENGTH:** about two minutes (a long video only when Biku asks)
- **EARLIER VIDEOS:** (so nothing repeats)
