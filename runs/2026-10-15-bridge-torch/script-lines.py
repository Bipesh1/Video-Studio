"""The spoken words of "How to Get Four People Across a Bridge Before the Torch Dies", as script.json.

Biku's thriller script, used as it is (as-is mode): he gave it on 2026-10-15 with "this is a
thriller script make a video for this one you must use the dark background sounds". Written
from the thriller guide (prompts/dilemma-thriller.md). What is decided here is only which beat
of the format a line belongs to, which part, and how long the silence after a line is. The
parts end on his two [CLIFFHANGER] marks, as the guide asks.

The parts:
  1  the question, the rules, the obvious plan fails, "So we leave the old man."
  2  "Nobody stays behind." and the Trainer's question to us, then silence
  3  the crossing, it was real, the answer
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-15-bridge-torch/'
N, T, S, C = 'narrator', 'trainer', 'saint', 'cheat'
Q, RULES, SQUEEZE, TWIST, REAL, ANSWER = ('the-question', 'the-rules', 'the-squeeze', 'the-twist',
                                          'it-was-real', 'the-answer')

#  (speaker, text, beat, part, pause after in ms, a thought?)
# The pauses are before each voice's own pause scale (about two thirds for these voices).
LINES = [
    (T, 'If the slowest person holds everyone back, who should walk with them?', Q, 1, 700),
    (T, 'The smart plan fails. Watch.', Q, 1, 1400),
    (T, 'Four people must cross this rope bridge before the storm breaks it.', RULES, 1, 700),
    (T, 'Two fit at a time, and someone must carry the torch back each time.', RULES, 1, 900),
    (T, 'The man in the red tie crosses in one minute, and the woman in the scarf in two.', RULES, 1, 500),
    (T, 'The woman with the bag needs five, the old man ten.', RULES, 1, 600),
    (T, 'Two together walk at the slower pace.', RULES, 1, 1100),
    (T, 'And the torch will last *seventeen* minutes.', RULES, 1, 1500),
    (S, "You're fastest. Walk us over one at a time.", SQUEEZE, 1, 1300),
    (T, 'Ten, five and two minutes, plus two runs back, makes *nineteen* minutes.', SQUEEZE, 1, 700),
    (C, 'The torch only lasts seventeen minutes.', SQUEEZE, 1, 1500),
    (C, 'So we leave the old man. Without him, we make it easily.', SQUEEZE, 1, 1800),

    (S, 'Nobody stays behind.', SQUEEZE, 2, 900),
    (S, 'Every trip with the old man takes ten minutes, whoever walks beside him.', SQUEEZE, 2, 1300, True),
    # The viewer's turn to guess: a long quiet, the part ends on it.
    (T, 'So who should walk beside the old man?', TWIST, 2, 3000),

    (S, 'Put the two slow ones together, and we only wait once.', TWIST, 3, 1300, True),
    (T, 'The two fastest cross in two minutes. The man in the red tie runs back in one.', TWIST, 3, 1200),
    (T, 'Then the two slowest cross *together*, in ten.', TWIST, 3, 1500),
    (T, 'The woman in the scarf returns in two, and the two fastest cross again in two.', TWIST, 3, 1500),
    (T, 'That is exactly *seventeen* minutes.', TWIST, 3, 900),
    (T, "The old man's ten minutes were coming anyway, so the five fit inside them.", TWIST, 3, 1500),
    (T, 'This is a real puzzle. Saul Levmore and Elizabeth Cook printed it in a book in 1981.', REAL, 3, 500),
    (T, 'In 2002, the mathematician Günter Rote proved the fastest way for any group.', REAL, 3, 700),
    (T, 'You make the first plan every time you spread slow jobs across your day.', REAL, 3, 1200),
    (N, 'Start your slowest jobs at the same time, so you only wait once.', ANSWER, 3, 1200),
    (T, 'So who should walk with the slowest person? The next slowest *one*.', ANSWER, 3, 1500),
]

SOURCES = [
    'Saul X. Levmore and Elizabeth Early Cook, Super Strategies for Puzzles and Games, Doubleday, 1981. The '
    'earliest known printed version of the bridge puzzle: four people, one light, a bridge that holds two at a '
    'time. As given in Biku\'s script.',
    'Günter Rote, "Crossing the Bridge at Night", Bulletin of the EATCS, No. 78, October 2002, pages 241 to 246. '
    'Solves the puzzle for any number of people with any walking times. '
    'https://page.mi.fu-berlin.de/rote/Papers/abstract/Crossing+the+bridge+at+night.html',
    'Checked by Claude on 2026-10-15: with crossing times of 1, 2, 5 and 10 minutes, the fastest walking each one '
    'over takes 10 + 1 + 5 + 1 + 2 = 19 minutes; the two fastest over, the fastest back, the two slowest over '
    'together, the second fastest back, the two fastest over takes 2 + 1 + 10 + 2 + 2 = 17. What the scene '
    'invents: the gorge, the storm, the people.',
]

lines = []
for i, row in enumerate(LINES, start=1):
    speaker, text, beat, part, pause = row[:5]
    line = {'id': f'l{i:02d}', 'speaker': speaker, 'text': text, 'beat': beat, 'chapter': part,
            'pauseAfterMs': pause}
    if len(row) > 5 and row[5]:
        line['thought'] = True
    lines.append(line)

script = {
    'version': 1,
    'title': 'How to Get Four People Across a Bridge Before the Torch Dies',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is', 'format': 'dilemma-thriller', 'brand': 'dilemma-table', 'voice': 'leak',
    'speakers': [
        {'id': T, 'name': 'The Trainer', 'voice': 'trainer'},
        {'id': S, 'name': 'The Saint', 'voice': 'saint'},
        {'id': C, 'name': 'The Cheat', 'voice': 'cheat'},
    ],
    'lines': lines, 'sources': SOURCES, 'changes': [],
    'masterPrompt': 'prompts/dilemma-thriller.md',
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
words = sum(len(l['text'].replace('*', '').split()) for l in lines)
print(len(lines), 'lines,', words, 'words')
