"""The spoken words of "How to Make Sure You Never Get Asked Out", as script.json.

Biku's script, used as it is (as-is mode): he gave it on 2026-10-14 with "make video for this
script now". It was written from the script guide v2.3. What is decided here is only which beat
of the format a line belongs to, which part, how long the silence after a line is, and where a
voice breathes (commas the voice reads and the captions never show). The voices are Chatterbox:
no "..." inside a question (L-0047), and their pace is their own.

The three parts:
  1  the question, the party, her choice to wait
  2  the party ends, and he walks past her
  3  the real study, the way out, the answer
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-14-never-asked-out/'
N, T, S = 'narrator', 'trainer', 'saint'
Q, RULE, SMART, TRAP, RESULT, STAYS = ('the-question', 'the-rule', 'the-smart-choice', 'the-trap',
                                       'the-result', 'what-stays')

#  (speaker, text, beat, part, pause after in ms, a thought?)
# The pauses are before each voice's own pause scale (two thirds for these voices).
LINES = [
    (T, 'If you liked someone, would you wait for *them* to ask?', Q, 1, 600),
    (T, 'You think waiting is safer. Watch this.', Q, 1, 1200),
    (T, 'This is a house party on a Saturday night.', RULE, 1, 700),
    (T, 'This woman came tonight for one man, the one in the *orange hat.*', RULE, 1, 1500),
    (S, "If he likes me, he'll come *over.*", RULE, 1, 1500, True),
    (T, 'What she does not know is this. The one who asks gets to *choose.*', RULE, 1, 500),
    (T, 'The one who waits only gets *chosen.*', RULE, 1, 1000),
    (T, 'So I give her a choice. Walk over, or stay where it feels *safe.*', SMART, 1, 1500),
    (S, 'What if he says no in front of everyone? Better to *wait.*', SMART, 1, 1500, True),
    (T, 'See what she did? She chose to *wait* to be chosen.', SMART, 1, 1200),

    (T, 'Now the party is ending, and everyone is *pairing up.*', SMART, 2, 1500),
    (S, "He's coming over. See? Waiting *works.*", TRAP, 2, 600),
    (T, 'Now she is sure waiting works, so she will not *move.*', TRAP, 2, 600),
    # The viewer's turn to guess; then he walks past her in the quiet.
    (T, 'What do you think he *does?*', TRAP, 2, 2400),
    (T, 'Another woman made the *first move,* so he goes to her.', TRAP, 2, 600),
    (T, 'Asking lets you choose from the whole room. Waiting leaves you whoever comes to *you.*', TRAP, 2,
     2400),

    (T, 'This is not a story. In 1962, two mathematicians, David Gale and Lloyd Shapley, worked out how '
        'people pair up.', RESULT, 3, 500),
    (T, 'They proved the side that asks gets the best partner it could *keep.*', RESULT, 3, 500),
    (T, 'The side that waits gets the *worst* partner who would still stay.', RESULT, 3, 900),
    (T, 'In 2012, that work won a *Nobel Prize.*', RESULT, 3, 600),
    (T, 'This year, that same method placed more than thirty-eight thousand young doctors in US hospitals.',
     RESULT, 3, 500),
    (T, 'There, the *doctors* do the asking.', RESULT, 3, 800),
    (T, 'You do this too, waiting for the text, the call, the *first move.*', RESULT, 3, 1200),
    (N, 'Here is how you beat it. If you like someone, ask *first.*', STAYS, 3, 500),
    (N, 'Ask once, kindly, and accept a no. A no costs you one *minute.*', STAYS, 3, 1200),
    (T, 'So would you wait for them to ask? Only if you want *what is left.*', STAYS, 3, 1400),
]

# How a line is said, where it is not as written: the same words, with a comma where the voice
# breathes. The words are never changed.
SAID = {
    6: 'What she does not know is this. The one who asks, gets to choose.',
    13: 'Now she is sure waiting works, so she will not move.',
    17: 'This is not a story. In 1962, two mathematicians, David Gale and Lloyd Shapley, worked out how '
        'people pair up.',
    18: 'They proved, the side that asks gets the best partner it could keep.',
    19: 'The side that waits, gets the worst partner who would still stay.',
}

SOURCES = [
    'David Gale and Lloyd S. Shapley, "College Admissions and the Stability of Marriage", The American '
    'Mathematical Monthly, vol. 69, 1962. Showed that when one side does the asking, everyone ends up in pairs '
    'nobody wants to break, and every member of the asking side gets the best partner they could have in any '
    'such pairing. That the waiting side gets its worst such partner was shown soon after (D. G. McVitie and '
    'L. B. Wilson, "The Stable Marriage Problem", Communications of the ACM, 1971). As given in Biku\'s script.',
    'The Sveriges Riksbank Prize in Economic Sciences in Memory of Alfred Nobel 2012, awarded to Alvin E. Roth '
    'and Lloyd S. Shapley for the theory of stable allocations and the practice of market design. '
    'https://www.nobelprize.org/prizes/economic-sciences/2012/summary/',
    'Alvin E. Roth and Elliott Peranson, "The Effects of the Change in the NRMP Matching Algorithm", JAMA, '
    '1997. The US residency match switched to an applicant-proposing version, where the doctors do the '
    'asking, starting with the 1998 match.',
    'National Resident Matching Program, "2026 Main Residency Match By the Numbers": 38,354 active applicants '
    'matched to a first-year position. Checked by Claude on 2026-10-14 against the NRMP news release "NRMP '
    'Releases Results of the 2026 Main Residency Match for More Than 38,000 Future Residents" '
    '(https://www.nrmp.org/about/news/2026/03/nrmp-releases-results-of-the-2026-main-residency-match-for-more-'
    'than-38000-future-residents/), which agrees. What the scene invents: the party, the Trainer, the woman '
    'who waves.',
]

lines = []
for i, row in enumerate(LINES, start=1):
    speaker, text, beat, part, pause = row[:5]
    line = {'id': f'l{i:02d}', 'speaker': speaker, 'text': text, 'beat': beat, 'chapter': part,
            'pauseAfterMs': pause}
    if len(row) > 5 and row[5]:
        line['thought'] = True
    if i in SAID and SAID[i] != text.replace('*', ''):
        line['say'] = SAID[i]
    lines.append(line)

script = {
    'version': 1,
    'title': 'How to Make Sure You Never Get Asked Out',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is', 'format': 'dilemma', 'brand': 'dilemma-table', 'voice': 'leak',
    'speakers': [
        {'id': T, 'name': 'The Trainer', 'voice': 'trainer'},
        {'id': S, 'name': 'The Saint', 'voice': 'saint'},
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
