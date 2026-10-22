# Dilemma story format playbook (game theory, from 2026-10-17)

The one kind of game theory video from 2026-10-17 on. Biku: "for game theory i think every thing should be like a story ... mystery, cynical and thriller combined", then "the videos should be more detailed even in 2 mins, like no random words ... everything should be understandable". It replaces the normal, thriller and comedy shapes for new videos; finished videos keep their own formats.

Writing rules: `prompts/dilemma-story.md` (v4.0); stories from `prompts/dilemma-topics.md` (v4.0). Read a new script against it before building, and tell him where it breaks instead of building over it.

## The six beats

the strange ending (the question in big words over the result) > rewind (who, what each wants, the rule) > the trap closes (the characters talk and choose, pressure rising) > the freeze (the Trainer asks the viewer, silence) > the reveal (what happened, then the real study) > the sting (where the viewer does it, the outside voice's advice, a dry last line answering the first).

## How it is filmed

- The cast, the dark room, the faces and the sounds of the game theory videos (`knowledge/playbooks/formats/dilemma.md`) and the thriller's pressure (`dilemma-thriller.md`: a clock, a cliffhanger at a part's end, nothing violent shown) both apply.
- The story plays where it really happens (a restaurant, a street, a party); the Trainer's room is for the reveal and the sting if the script asks for it.
- The characters carry the middle in their own voices; the Trainer speaks at the ending, the rule, the freeze, the reveal and the sting.
- The freeze is a held picture in silence; the big faces (`jaw-drop`, `sly-grin`, `fuming`) are for the turning points.
- The opening rule of every video holds: the question in the first three seconds, as big words over the scene.

## Stories with a mystery, not questions (Biku, 2026-10-18)

After another AI suggested fables about human nature, Biku: the opening questions "are so weird that no one can relate", "these questions are not stories that anyone would watch, there is nothing interesting", and "it should always be stories with mystery and other things that keep people hooked". So from v4.0: every video is a short everyday story (friends, family, love, neighbours, money between people) with a mystery at its heart; it opens on its strangest moment, shown, with one line that states it (no question, CLAUDE.md's opening rule changed for game theory only); the real game or experiment comes only in step 5, in one or two lines; the last line leaves a meaning. Titles state the strange moment ("He Threw $100 Into the River on Purpose"). Still a choice for the viewer in step 4. At least two of the Saint, the Copycat and the Cheat in every video, playing whatever roles the story needs. Category on YouTube: Education stays honest (each ends on a real result); set "not made for kids".

## The rewind (Biku, 2026-10-18)

"I want a proper rewind animation"; of three looks (tape, cartoon, film) he picked the film reel ("3 is alright"). Step 2 begins with `transition: "rewind"` and `rewind: { label: "10 MINUTES EARLIER" }` on its first shot (style `film` by default): the opening plays backwards over the last 1.4 s of the shot before (keep a pause of about 1.4 s after the opening's last line), captions hidden, the `rewind` sound cued by itself, the label stamped on as it stops. The script asks for it with `[REWIND: ...]`. Test: `runs/2026-10-18-rewind-test/rewind-styles-side-by-side.mp4`.
(Biku, 2026-10-18)

"You know how properly it's explained in this what's the catch niche, it should be like that for game theory too, the narration and interaction should all make sense." Of the daycare video, the lines that explain were told over pictures that did not show them: "late pickups nearly doubled" over three people standing with "2x" on them, "the fine went to the owner" with no owner and no money moving, "you just pay it" over a crowd with no fee. The rule (guide v3.1, section 4, rule 8): every explaining line is shown as it is said, each piece on its word, in the story's own people and things (no charts). When planning, read every explaining line with the sound off: if the picture would be the same without the line, it is not shown yet. He asked for the rule only for now (2026-10-18); the pieces to show it (a growing row, money passing, a before and after) are to be drawn when a script needs them.

## Lessons

The general ones apply: plain words a stranger follows (L-0042), faces hold (L-0040), look at moves large (L-0041), a question must sound like a question (L-0047). Check that nobody vanishes between shots in one place (the split-the-bill test, 2026-10-16).
