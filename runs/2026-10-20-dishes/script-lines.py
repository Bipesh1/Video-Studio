"""The spoken words of "She Wrote Down Every Dish She Washed for a Year", as script.json.

Biku's script, used as it is (as-is mode): "make a story on this script for youtube video 16:9"
(2026-10-20). A game theory story (format dilemma-story, guide prompts/dilemma-story.md), wide
for YouTube. What is decided here is only which beat of the format a line belongs to, which
part, how long the silence after it is, and how a line is said (`say` and `speed`: the same
words with a mood tag or a comma; the captions keep his text).

The parts:
  1  the strange moment and the rewind: the fight, her rule
  2  the trap closes and the choice: the year of tallies, his secret, the notebook on the table
  3  the answer and the meaning: his notebook, the study, the two halves of the house

Facts checked on 2026-10-20 against reports of the paper (Ross and Sicoly, JPSP 37(3), 1979,
322 to 336; Wikipedia's "Egocentric bias"; quotations of p. 325): 37 married couples among the
groups studied; each spouse rated, alone, who did each of twenty or so jobs, from making
breakfast to causing arguments; each claimed more of the credit than the partner gave them, so
the two self-estimates added up to more than the whole; in pilot work with percentages couples
remembered and compared their answers and it caused friction, so the final study had them mark
a line between "primarily wife" and "primarily husband". Ross and Sicoly were at the University
of Waterloo, in Canada. What the story invents: the couple, the notebooks, 4,212 dishes.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-20-dishes/'
T, S, P = 'trainer', 'saint', 'copycat'
END, REWIND, TRAP, FREEZE, REVEAL, STING = ('the-strange-ending', 'rewind', 'the-trap-closes', 'the-freeze',
                                            'the-reveal', 'the-sting')

#  (speaker, text, beat, part, pause after in ms, a thought?)
LINES = [
    (T, 'She wrote down every dish she washed, for a whole year.', END, 1, 500),
    (T, 'And she was saving every one of them for *one night.*', END, 1, 1500),
    (T, 'One year earlier, this married couple had the same fight every week.', REWIND, 1, 400),
    (S, 'I do *everything* in this house.', REWIND, 1, 300),
    (P, "Everything? I do plenty. You just don't see it.", REWIND, 1, 300),
    (S, 'Then show me.', REWIND, 1, 300),
    (P, 'Show you what? Nobody keeps a *list.*', REWIND, 1, 900),
    (T, 'It was always her word against *his.*', REWIND, 1, 400),
    (T, 'So she made her own rule. Whoever has it in writing *wins.*', REWIND, 1, 400),
    (T, 'On their anniversary, she would put the proof on the table.', REWIND, 1, 1000),

    (S, "He can argue with me. He can't argue with a year of *proof.*", TRAP, 2, 700, True),
    (T, 'Every night the number got *bigger.*', TRAP, 2, 1000),
    (P, "It's nothing. Go back to bed.", TRAP, 2, 500),
    (S, "Nothing? He's hiding *something.*", TRAP, 2, 1000, True),
    (S, 'Four thousand two hundred and twelve dishes. Every one of them was *me.*', TRAP, 2, 1200),
    (T, 'A year of proof, in her own handwriting. So who really did more?', FREEZE, 2, 2200),

    (P, 'I saw you writing, so I started one too. The same *week.*', REVEAL, 3, 700),
    (T, 'His notebook said that *he* did most of the work.', REVEAL, 3, 500),
    (S, 'You fixed the boiler at two in the morning? I never *knew.*', REVEAL, 3, 400),
    (P, 'You washed my work shirts by hand? I never *saw.*', REVEAL, 3, 700),
    (T, 'Neither of them was lying. Each one only saw their *own* half.', REVEAL, 3, 900),
    (T, 'This is not just a story. In 1979, two Canadian psychologists asked thirty seven married couples who '
        'did each job at home.', REVEAL, 3, 400),
    (T, 'The jobs went from making breakfast to starting the *arguments.*', REVEAL, 3, 400),
    (T, 'Each spouse answered alone. Added together, their two shares usually came to more than the whole *job.*',
     REVEAL, 3, 500),
    (T, 'In early tests, couples compared their answers at home and *fought.* So the researchers changed the '
        'questions.', REVEAL, 3, 900),
    (T, 'You do this too, at work and with roommates. You remember what you did, because you were *there.*',
     STING, 3, 600),
    (T, 'Both notebooks were honest. It just took two of them to see the whole *house.*', STING, 3, 1500),
]

# How a line is said, by its number: (pace, the words as spoken). The players get a mood tag
# where the moment calls for it; the Trainer stays steady.
SAID = {
    4: (1, '[angry] I do everything in this house.'),
    5: (1.02, "[sarcastic] Everything? I do plenty. You just don't see it."),
    6: (0.97, 'Then, show me.'),
    7: (1, "[chuckle] Show you what? Nobody keeps a list."),
    13: (1.02, "[surprised] It's nothing. Go back to bed."),
    15: (0.96, '[dramatic] Four thousand two hundred and twelve dishes. Every one of them was me.'),
    16: (0.95, 'A year of proof, in her own handwriting. So, who really did more?'),
    17: (0.97, '[sigh] I saw you writing, so I started one too. The same week.'),
    19: (0.98, '[surprised] You fixed the boiler at two in the morning? I never knew.'),
    20: (0.98, 'You washed my work shirts by hand? I never saw.'),
    27: (0.94, 'Both notebooks were honest. It just took two of them to see the whole house.'),
}

SOURCES = [
    'Michael Ross and Fiore Sicoly, "Egocentric Biases in Availability and Attribution", Journal of Personality '
    'and Social Psychology, volume 37, issue 3, pages 322 to 336, 1979. Among five experiments, 37 married couples '
    'separately rated each spouse\'s share of everyday jobs (from making breakfast to causing arguments); each '
    'person recalled more of their own contributions and claimed more of the credit than their partner gave them, '
    'so the two self-estimates typically added up to more than the whole. In pilot tests with percentages, '
    'couples remembered and compared their answers afterwards and it caused friction, so the final study had them '
    'mark a line instead. https://doi.org/10.1037/0022-3514.37.3.322',
    'Daniel Kahneman, Thinking, Fast and Slow, 2011. Retells the study: the self-assessed shares added up to more '
    'than 100 percent.',
    'Checked by Claude on 2026-10-20 against reports of the paper. What the story invents: the couple, the '
    'notebooks, the 4,212 dishes, the boiler and the shirts.',
]

lines = []
for i, row in enumerate(LINES, start=1):
    speaker, text, beat, part, pause = row[:5]
    line = {'id': f'l{i:02d}', 'speaker': speaker, 'text': text, 'beat': beat, 'chapter': part,
            'pauseAfterMs': pause}
    if len(row) > 5 and row[5]:
        line['thought'] = True
    if i in SAID:
        pace, say = SAID[i]
        if pace != 1:
            line['speed'] = pace
        if say != text.replace('*', ''):
            line['say'] = say
    lines.append(line)

script = {
    'version': 1,
    'title': 'She Wrote Down Every Dish She Washed for a Year',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is', 'format': 'dilemma-story', 'brand': 'dilemma-table', 'voice': 'leak',
    'speakers': [
        {'id': T, 'name': 'The Trainer', 'voice': 'trainer'},
        {'id': S, 'name': 'The Saint', 'voice': 'saint'},
        {'id': P, 'name': 'The Copycat', 'voice': 'copycat'},
    ],
    'lines': lines, 'sources': SOURCES, 'changes': [],
    'masterPrompt': 'prompts/dilemma-story.md',
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
words = sum(len(l['text'].replace('*', '').split()) for l in lines)
print(len(lines), 'lines,', words, 'words')
