"""The spoken words of Tape 01 in plain words, "How to Make Someone Sit in Smoke", as script.json.

This is the second script for this tape. Biku found the first one (runs/2026-10-12-the-smoke)
"weird random texts ... broken englishes like things". Claude rewrote the same story in full
plain sentences, showed it to him, and he said "yes do it" (2026-10-12). The words here are
the ones he approved, word for word (as-is mode). What is decided here is only which beat of
the format a line belongs to, which part, the stress marks for the captions and how long the
silence after a line is, and how each line is said: its pace against the voice's own, and
where the voice breathes (commas and "..." that the voice reads and the captions never show).
Biku picked this way of speaking by ear on 2026-10-13 (option 3 of the listening test in
voice-test/: a pace and pauses for each line, and the Trainer's blended voice).

The three parts:
  1  the question, the room, the first smoke
  2  thicker, and the choice
  3  the real study, the way out, the answer
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-12-the-smoke-plain/'
N, T, K, C = 'narrator', 'trainer', 'copycat', 'cheat'
Q, RULE, SMART, TRAP, RESULT, STAYS = ('the-question', 'the-rule', 'the-smart-choice', 'the-trap',
                                       'the-result', 'what-stays')

#  (speaker, text, beat, part, pause after in ms, a thought?)
LINES = [
    (T, 'If a room filled with smoke, would you get up and *leave?*', Q, 1, 500),
    (T, 'You think you would. Watch this.', Q, 1, 700),
    (T, 'This man came here to earn twenty dollars. All he has to do is sit and wait.', RULE, 1, 400),
    (K, 'Twenty dollars just to sit here? *Easy.*', RULE, 1, 600),
    (T, 'What he does not know is that everyone else in this room *works for me.*', RULE, 1, 500),
    (T, 'I pay them to do one thing. Stay *calm,* whatever happens.', RULE, 1, 900),
    (T, 'Now I let *smoke* into the room.', SMART, 1, 600),
    (K, 'Is that smoke?', SMART, 1, 500),
    (C, "It's nothing. Probably the kitchen.", SMART, 1, 600),
    (K, 'Nobody else looks worried. So it must be fine.', SMART, 1, 600, True),
    (T, 'See what he did? He did not look at the smoke. He looked at *the people.*', SMART, 1, 1000),

    (K, "It's getting hard to breathe. Shouldn't we tell someone?", SMART, 2, 400),
    (C, 'Relax. If it was dangerous, somebody would say so.', SMART, 2, 500),
    (K, "Yeah. You're right. It's *fine.*", SMART, 2, 600),
    (T, 'Now he has said it is fine. Leaving would mean admitting he was *wrong.*', SMART, 2, 900),
    (K, 'My eyes are burning. Is nobody going to move?', TRAP, 2, 700),
    # The viewer's turn to guess: a long quiet, with the music still under it.
    (T, 'What do you think he *does?*', TRAP, 2, 1800),
    (K, 'They are all calm. I must be the one who is *wrong.*', TRAP, 2, 1200, True),
    (T, 'He *stays.*', TRAP, 2, 2200),

    (T, 'This is not a story. In 1968, two scientists did this *for real.*', RESULT, 3, 500),
    (T, 'Alone in the smoke, three people out of four got up and reported it.', RESULT, 3, 500),
    (T, 'With two calm strangers beside them, only *one in ten* did.', RESULT, 3, 800),
    (T, 'The smoke was the same. Only the faces changed.', RESULT, 3, 800),
    (T, 'You do this too. A fire alarm rings, everyone looks around, and nobody moves first.', RESULT, 3, 1200),
    (N, 'Here is how you beat it. When something feels wrong, do not check the faces around you.', STAYS, 3, 400),
    (N, 'They are checking yours. Say it out loud, and *stand up first.*', STAYS, 3, 1200),
    (T, 'One person standing up breaks the whole trick.', STAYS, 3, 600),
    (T, 'So how long would you sit in smoke? As long as everyone else does.', STAYS, 3, 1400),
]

# How each line is said, by its number: (pace, the words as the voice reads them). A line that
# is not here is said as written at the voice's own pace. The words are never changed.
#   scared lines run a little fast; calm ones and the ones that sink in are slower; a "..."
#   holds the word after it back, so the word lands.
#   Not after a one-word opening ("He...", "Now..."): the voice leaves that word hanging in the
#   air. And a line of two or three words is not slowed much: the voice drags its last word.
SAID = {
    2: (0.97, 'You think you would... Watch this.'),
    4: (1.04, 'Twenty dollars, just to sit here? Easy.'),
    5: (0.97, 'What he does not know, is that everyone else in this room... works for me.'),
    6: (0.95, 'I pay them to do one thing. Stay calm... whatever happens.'),
    7: (0.95, 'Now... I let smoke into the room.'),
    8: (0.97, 'Is that... smoke?'),
    9: (0.95, "It's nothing. Probably the kitchen."),
    10: (0.93, 'Nobody else looks worried... So, it must be fine.'),
    11: (0.96, 'See what he did? He did not look at the smoke. He looked... at the people.'),

    12: (1.04, "It's getting hard to breathe... Shouldn't we tell someone?"),
    13: (0.92, 'Relax. If it was dangerous, somebody would say so.'),
    14: (0.93, "Yeah... You're right. It's fine."),
    15: (0.98, 'Now, he has said it is fine. Leaving would mean admitting... he was wrong.'),
    16: (1.1, 'My eyes are burning! Is nobody going to move?'),
    17: (0.92, 'What do you think... he does?'),
    18: (0.9, 'They are all calm... I must be the one, who is wrong.'),
    # Said plainly. Slowed to 0.84 with dots after "He", the voice sent "He" up like a question
    # and dragged "stays" out to over a second, down into a croak; Biku: "it sounds weird".
    19: (0.95, 'He stays.'),

    20: (0.96, 'This is not a story. In 1968, two scientists did this... for real.'),
    22: (0.93, 'With two calm strangers beside them... only one in ten did.'),
    23: (0.94, 'The smoke was the same. Only the faces... changed.'),
    24: (0.98, 'You do this too. A fire alarm rings, everyone looks around... and nobody moves first.'),
    26: (0.95, 'They are checking yours. Say it out loud... and stand up first.'),
    27: (0.96, 'One person standing up, breaks the whole trick.'),
    28: (0.93, 'So, how long would you sit in smoke? As long... as everyone else does.'),
}

SOURCES = [
    'Bibb Latané and John M. Darley, Group inhibition of bystander intervention in emergencies, Journal of '
    'Personality and Social Psychology, 1968, volume 10, number 3, pages 215 to 221, '
    'https://doi.org/10.1037/h0026570 : people filling in a questionnaire while smoke came into the room. Alone, '
    '75% reported the smoke within the six minutes (three out of four); with two others who had been told to stay '
    'passive, 10% did (1 of 10); in groups of three real participants, someone reported it in 38% of groups. '
    'Fairly sure: the figures were checked on 2026-10-12 against several summaries of the paper that agree with '
    'each other and with the citation (a NIST record gives the same journal, volume and pages); the paper itself '
    'was not opened. What the scene invents: the twenty dollars, the Trainer, the room, the Cheat and the row of '
    'four. The study had a questionnaire, a vent and two calm actors.',
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
    'title': 'How to Make Someone Sit in Smoke',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is', 'format': 'dilemma', 'brand': 'dilemma-table', 'voice': 'leak',
    'speakers': [
        {'id': T, 'name': 'The Trainer', 'voice': 'trainer'},
        {'id': K, 'name': 'The Copycat', 'voice': 'copycat'},
        {'id': C, 'name': 'The Cheat', 'voice': 'cheat'},
    ],
    'lines': lines, 'sources': SOURCES, 'changes': [],
    'masterPrompt': 'prompts/dilemma.md',
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
words = sum(len(l['text'].replace('*', '').split()) for l in lines)
by = {}
for l in lines:
    by[l['speaker']] = by.get(l['speaker'], 0) + len(l['text'].replace('*', '').split())
print(len(lines), 'lines,', words, 'words', by)
