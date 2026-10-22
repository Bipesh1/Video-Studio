"""The spoken words of "Why Splitting the Bill Makes Everyone Order More", as script.json.

The first game theory comedy short (format dilemma-comedy). Written by Claude and approved by
Biku on 2026-10-16 ("yes lets try"), after he compared our videos with relatable stick-figure
comedy shorts with far more views. One change to the approved script: a waiter says "And for
you?" and "Your bill.", so the two silent jokes (You's glass of water, the bill that never ends)
have their moment; a shot needs words to stand on.

One part of about 40 seconds. The laughs are in the faces and the actions; the Trainer's voice is
heard only at the start and the end.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-16-split-the-bill/'
T, S, C, P, W = 'trainer', 'saint', 'cheat', 'copycat', 'waiter'
Q, SETUP, ESC, PAY, WHY, PUNCH = ('the-question', 'the-setup', 'the-escalation', 'the-payoff', 'the-why',
                                  'the-punchline')

#  (speaker, text, beat, pause after in ms)
LINES = [
    (T, 'Why does splitting the bill make everyone order more?', Q, 900),
    (P, "Let's just split it four ways. Easier.", SETUP, 1000),
    (S, 'A small salad for me, please.', ESC, 1600),
    (C, 'The lobster. The big one.', ESC, 1300),
    (P, "Then I'll have the lobster too.", ESC, 1300),
    (S, 'Make it three lobsters.', ESC, 900),
    (W, 'And for you?', ESC, 1600),
    (W, 'Your bill.', PAY, 2800),
    (T, 'When you split the bill, every extra dish costs you only a quarter of its price.', WHY, 400),
    (T, 'So everyone orders more, and everyone pays more.', WHY, 700),
    (T, 'Economists tested this in a real restaurant. When the bill was split, people ate more.', WHY, 900),
    (T, 'Even the one who only had water.', PUNCH, 1800),
]

SOURCES = [
    'Uri Gneezy, Ernan Haruvy and Hadas Yafe, "The Inefficiency of Splitting the Bill", The Economic Journal, '
    'vol. 114, no. 495, April 2004, pages 265 to 280. A field experiment in a restaurant: diners who split the '
    'bill equally ate more than diners who each paid for their own, and they said they preferred paying for '
    'their own. https://ideas.repec.org/a/ecj/econjl/v114y2004i495p265-280.html',
    'What the story invents: the four friends, the restaurant and the prices. Three lobsters at $60 is $180, '
    'split four ways $45 each, the glass of water included.',
]

lines = [{'id': f'l{i:02d}', 'speaker': sp, 'text': text, 'beat': beat, 'chapter': 1, 'pauseAfterMs': pause}
         for i, (sp, text, beat, pause) in enumerate(LINES, start=1)]

script = {
    'version': 1,
    'title': 'Why Splitting the Bill Makes Everyone Order More',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'original', 'format': 'dilemma-comedy', 'brand': 'dilemma-table', 'voice': 'leak',
    'speakers': [
        {'id': T, 'name': 'The Trainer', 'voice': 'trainer'},
        {'id': S, 'name': 'The Saint', 'voice': 'saint'},
        {'id': C, 'name': 'The Cheat', 'voice': 'cheat'},
        {'id': P, 'name': 'The Copycat', 'voice': 'copycat'},
        {'id': W, 'name': 'The waiter', 'voice': 'man'},
    ],
    'lines': lines, 'sources': SOURCES, 'changes': [],
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
words = sum(len(l['text'].split()) for l in lines)
print(len(lines), 'lines,', words, 'words')
