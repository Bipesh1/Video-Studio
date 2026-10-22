"""The spoken words of Tape 01, "How to Make Someone Sit in Smoke", as script.json.

Biku's words exactly (as-is mode): nothing here changes one. What is decided here is only
which beat of the format a line belongs to, which part, and how long the silence after it is.
His stress marks (*word*) are kept as he wrote them.

The three parts fall where his own scenes turn:
  1  the question, the room, the first smoke (his scenes 1 to 3)
  2  thicker, and the choice (4 and 5)
  3  the numbers and the leak (6 and 7)
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-12-the-smoke/'
N, T, K, C = 'narrator', 'trainer', 'copycat', 'cheat'
Q, RULE, SMART, TRAP, RESULT, STAYS = ('the-question', 'the-rule', 'the-smart-choice', 'the-trap',
                                       'the-result', 'what-stays')

#  (speaker, text, beat, part, pause after in ms or None for the usual, a thought?)
LINES = [
    # 1. THE QUESTION
    (T, 'How long would you sit in *smoke?*', Q, 1, 500),
    # As part 1 was built and shown: 350. (A longer hold on the room was tried and never reached
    # the build; changing it now would mean making part 1 again.)
    (T, 'Welcome back, trainees.', Q, 1, 350),
    (T, 'Today: how to keep someone sitting in *smoke.*', Q, 1, 700),
    # 2. THE PRODUCT
    (T, 'This one is a Copycat. He does what the room does.', RULE, 1, 500),
    (K, 'Is this the waiting room? For the *twenty?*', RULE, 1, 350),
    (T, "Ten minutes, one one two. Then it's yours.", RULE, 1, 400),
    (K, 'Twenty bucks to sit still? Best job I ever had.', RULE, 1, 300),
    (C, 'Easiest twenty in town.', RULE, 1, 700),
    (T, "He's ours. So is the back row.", RULE, 1, 400),
    (T, "Smoke is coming. They're paid to stay *calm.*", RULE, 1, 900),
    # 3. THE DEMONSTRATION: first smoke
    (K, 'Uh. Is that *smoke?*', SMART, 1, 450),
    (C, 'Kitchen, probably. Happens all the time.', SMART, 1, 350),
    (K, 'Right. Somebody burned the *toast.*', SMART, 1, 300),
    (C, 'Ha. Somebody always does.', SMART, 1, 700),
    (K, "Nobody's moving. So it's nothing.", SMART, 1, 500, True),
    (T, 'He reads *faces,* not smoke.', SMART, 1, 1000),
    # 3. THE DEMONSTRATION: thicker
    (K, "It's getting kind of thick in here.", SMART, 2, 350),
    (C, "Relax, man. If it was bad, they'd tell us.", SMART, 2, 400),
    (K, 'Should we... tell someone?', SMART, 2, 300),
    (C, 'And lose the twenty? Sit down.', SMART, 2, 500),
    (T, 'Nearly done, one one two.', SMART, 2, 500),
    (K, 'Yeah. Ha. Totally *fine.*', SMART, 2, 500),
    (T, "He said *fine.* Now he's stuck.", SMART, 2, 900),
    # 4. THE TRAP
    (K, 'My eyes sting. Does nobody else see this?', TRAP, 2, 400),
    (C, 'See what, man?', TRAP, 2, 600),
    (K, 'Okay. Okay. Just me, then.', TRAP, 2, 500),
    (K, 'Nobody else is getting up.', TRAP, 2, 600),
    # His script: (Silence.) after the Bet.
    (T, 'Your turn, trainees. What does he *do?*', TRAP, 2, 1800),
    (K, "If they're calm, I must be *wrong.*", TRAP, 2, 1200, True),
    (T, 'He stays. A very reliable *customer.*', TRAP, 2, 1200),
    # 5. THE RESULTS
    (T, 'Latané and Darley. 1968.', RESULT, 3, 400),
    (T, 'Alone, seventy-five percent reported it.', RESULT, 3, 500),
    (T, 'Two calm strangers? Ten *percent.*', RESULT, 3, 800),
    (T, 'People trust calm faces over their own *eyes.*', RESULT, 3, 600),
    # Long enough to read the three lines on the screen.
    (T, "You've seen it.", RESULT, 3, 2300),
    # 6. THE LEAK
    (N, 'Calm faces are guessing too.', STAYS, 3, 350),
    (N, 'They are reading your face as well.', STAYS, 3, 350),
    (N, 'So trust what you see. Say it out loud.', STAYS, 3, 350),
    (N, 'Then be the first to *stand up.*', STAYS, 3, 1300),
    (T, 'One person standing. Bad for *business.*', STAYS, 3, 500),
    (T, 'How long do you sit in smoke? As long as *they* do.', STAYS, 3, 700),
    (T, 'Tape ends.', STAYS, 3, 1200),
]

SOURCES = [
    'Bibb Latané and John M. Darley, Group inhibition of bystander intervention in emergencies, Journal of '
    'Personality and Social Psychology, 1968, volume 10, number 3, pages 215 to 221, '
    'https://doi.org/10.1037/h0026570 : people filling in a questionnaire while smoke came into the room. Alone, '
    '75% reported the smoke within the six minutes; with two others who had been told to stay passive, 10% did '
    '(1 of 10); in groups of three real participants, someone reported it in 38% of groups. Fairly sure: the '
    'figures were checked on 2026-10-12 against several summaries of the paper that agree with each other and '
    'with the citation (a NIST record gives the same journal, volume and pages); the paper itself was not opened.',
]

lines = []
for i, row in enumerate(LINES, start=1):
    speaker, text, beat, part, pause = row[:5]
    line = {'id': f'l{i:02d}', 'speaker': speaker, 'text': text, 'beat': beat, 'chapter': part}
    if pause is not None:
        line['pauseAfterMs'] = pause
    if len(row) > 5 and row[5]:
        line['thought'] = True
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
print(len(lines), 'lines,', words, 'words')
