"""The spoken words of "Why a Fine for Being Late Made Parents Even Later", as script.json.

Biku's script, used as it is (as-is mode): he gave it on 2026-10-17 with "make a video for
this". The first video in the one game theory shape, the story (format dilemma-story, guide
prompts/dilemma-story.md). What is decided here is only which beat of the format a line belongs
to, which part, how long the silence after it is, and how a line is said (`say` and `speed`:
the same words with a mood tag or a comma where the voice breathes; the captions keep his text).

The parts:
  1  the strange ending, and the rewind: no fine, then the rule
  2  the trap closes, and the freeze: you, stuck in traffic. Ends on "Do you still rush?"
  3  the reveal and the sting

Facts checked against the study on 2026-10-17 (.cache/pdf/fine.pdf): January to June 1998,
ten private daycares in Haifa, the fine at six of them chosen at random, NIS 10 per child for
pickups more than ten minutes after four; late pickups rose over 3 to 4 weeks to "almost twice"
the starting level, stayed there after the fine was removed in week 17, and the money went to
the owner, not to the teacher who stayed (who got nothing more).
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-17-late-fine/'
N, T, S, C, P = 'narrator', 'trainer', 'saint', 'cheat', 'copycat'
END, REWIND, TRAP, FREEZE, REVEAL, STING = ('the-strange-ending', 'rewind', 'the-trap-closes', 'the-freeze',
                                            'the-reveal', 'the-sting')

#  (speaker, text, beat, part, pause after in ms, a thought?)
LINES = [
    (T, 'Why did a fine for being late make parents even *later?*', END, 1, 800),
    (T, 'And when this daycare dropped the fine, they *still* came late.', END, 1, 1400),
    (T, 'Earlier, there was no fine at *all.*', REWIND, 1, 600),
    (P, "I'm so *sorry!* It won't happen again.", REWIND, 1, 700),
    (S, "It's okay. My *last* bus is at four forty.", REWIND, 1, 900),
    (T, 'The teacher waited as a favor. Late parents paid only with a *sorry.*', REWIND, 1, 1300),
    (T, 'Then this daycare made one rule. Pick up your child by *four.*', REWIND, 1, 700),
    (T, "Each time you're more than ten minutes late, you pay three *dollars.*", REWIND, 1, 1800),

    (C, "So I can *buy* twenty extra minutes for three dollars. That's cheaper than a babysitter.", TRAP, 2, 1200,
     True),
    (C, "Here's my *fee.*", TRAP, 2, 700),
    (S, 'The fine is meant to make you *hurry.*', TRAP, 2, 800),
    (C, "I'm paying it, so we're *even.*", TRAP, 2, 1200),
    (P, "He didn't even say sorry. He just *paid.* So can I.", TRAP, 2, 1100, True),
    (P, 'Put it on my *bill.*', TRAP, 2, 1000),
    (T, 'Soon, more parents paid instead of saying *sorry.*', TRAP, 2, 800),
    (T, 'The teacher missed her bus. A little boy waited *alone* at the window.', TRAP, 2, 1600),
    (T, "Now it's almost four, and *you* are stuck in traffic.", FREEZE, 2, 700),
    # The viewer's turn: a long quiet, and the part ends on it.
    (T, 'Being late now just costs three dollars. Do you still *rush?*', FREEZE, 2, 3000),

    (T, "The fine turned the teacher's *favor* into something you could buy.", REVEAL, 3, 600),
    (T, 'And nobody says sorry for *buying* something.', REVEAL, 3, 1200),
    (T, 'This is not a story. In 1998, two economists tried this at six *daycares* in Israel.', REVEAL, 3, 600),
    (T, 'Within a few weeks, late pickups there nearly *doubled.*', REVEAL, 3, 1000),
    (T, 'When the fine was dropped, late pickups stayed just as *high.*', REVEAL, 3, 600),
    (T, 'Now being late cost no money and no *sorry.*', REVEAL, 3, 900),
    (T, 'The fine went to the owner. The teacher who waited got *nothing.*', REVEAL, 3, 1400),
    (T, 'You do this too. When a late fee is small, you just *pay* it.', STING, 3, 900),
    (N, 'If you make a rule, skip the *small* fine. Ask as a favor, or make the fine big.', STING, 3, 1200),
    (T, 'So why did the fine make parents *later?*', STING, 3, 700),
    (T, "Because the fine didn't make them *sorry.*", STING, 3, 600),
    (T, 'It told them what sorry *costs.*', STING, 3, 1500),
]

# How a line is said, by its number: (pace, the words as spoken). The players get a mood tag
# where the moment calls for it; the Trainer stays steady.
SAID = {
    4: (1.06, "[gasp] I'm so sorry! It won't happen again."),
    5: (0.97, "[sigh] It's okay. My last bus is at four forty."),
    9: (0.98, "[chuckle] So, I can buy twenty extra minutes, for three dollars. That's cheaper than a babysitter."),
    10: (1, "[chuckle] Here's my fee."),
    11: (0.97, 'The fine is meant to make you hurry.'),
    12: (1, "[sarcastic] I'm paying it, so we're even."),
    13: (1, "He didn't even say sorry. He just paid. So can I."),
    16: (0.95, 'The teacher missed her bus. A little boy waited alone, at the window.'),
    18: (0.95, 'Being late now just costs three dollars. Do you still rush?'),
    21: (0.97, 'This is not a story. In 1998, two economists tried this at six daycares in Israel.'),
    30: (0.93, 'It told them what sorry costs.'),
}

SOURCES = [
    'Uri Gneezy and Aldo Rustichini, "A Fine Is a Price", The Journal of Legal Studies, vol. 29, no. 1, '
    'January 2000, pages 1 to 17. Ten private daycares in Haifa, Israel, watched for 20 weeks from January to '
    'June 1998. At the start of week 5 a fine of NIS 10 per child for coming more than ten minutes after closing '
    '(four in the afternoon) was brought in at six of them, chosen at random; late pickups rose over 3 to 4 weeks '
    'and settled at almost twice the starting level, and did not come down when the fine was removed at the start '
    'of week 17. Nothing changed at the four daycares without a fine. The fine was paid to the owner, not to the '
    'teacher who stayed late, who got no extra money. https://rady.ucsd.edu/_files/faculty-research/uri-gneezy/fine.pdf',
    'Checked by Claude against the paper on 2026-10-17. What the story invents: the teacher, the fathers, the '
    'boy, the bus, and the fine in dollars (NIS 10 was about $2.70 then; Biku\'s script rounds it to three).',
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
    'title': 'Why a Fine for Being Late Made Parents Even Later',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is', 'format': 'dilemma-story', 'brand': 'dilemma-table', 'voice': 'leak',
    'speakers': [
        {'id': T, 'name': 'The Trainer', 'voice': 'trainer'},
        {'id': S, 'name': 'The Saint', 'voice': 'saint'},
        {'id': C, 'name': 'The Cheat', 'voice': 'cheat'},
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
