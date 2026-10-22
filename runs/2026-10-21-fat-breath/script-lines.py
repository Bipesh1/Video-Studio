"""The spoken words of "Where Does Your Fat Go When You Lose Weight?", as script.json.

Biku's script (What's the Catch?, the first Short in the new look), used as it is: "this is the
script build for this script" (2026-10-21). What is decided here is only the beat, the part and the
pause after a line. His six sections map onto the format's beats: THE HOOK on the-question, THE
MOMENT on the-moment, THE LOOPS on follow-the-money, THE CATCH on the-trick, THE PROOF on the-proof,
THE PAYOFF on your-move.

The parts (each under a minute):
  1  the scale, the experts, the wrong answers, into the atoms, the fat cell, the bead chain, the
     breath in, the lungs lifting
  2  the oil pulled apart, the two leftovers, the blood, out of the mouth, 840 g, 160 g, the burger
  3  the scientists and the balance, 29 kg in, 28 + 11 kg out, 39 = 39, the sofa, the dinner, the scale

Facts checked on 2026-10-21 against Meerman and Brown, BMJ 2014, the UNSW release and NPR: 10 kg of
fat with 29 kg of oxygen gives 28 kg of carbon dioxide and 11 kg of water; 84% leaves as breath, 16%
as water; of 150 doctors, dietitians and trainers asked, only 3 gave the right answer (so "more than
half got it wrong" is true, and milder than the source; his words are kept, he is told).
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-21-fat-breath/'
N = 'narrator'
Q, MOMENT, LOOPS, CATCH, PROOF, PAYOFF = ('the-question', 'the-moment', 'follow-the-money', 'the-trick',
                                          'the-proof', 'your-move')

#  (text, beat, part, pause after in ms, how it is said or None)
LINES = [
    ('When your bathroom scale drops by one kilo of fat, where does that fat actually *go*?', Q, 1, 600, None),
    ('When a hundred and fifty doctors, dietitians and trainers were asked, more than half got it *wrong*.',
     Q, 1, 700, None),
    ('Most said it turns into *energy* or heat, and a few said muscle, or the toilet.', MOMENT, 1, 500, None),
    ("But fat is made of atoms, and atoms cannot just *vanish*, so let's follow them.", MOMENT, 1, 700, None),
    ('Inside your belly, fat sits in tiny fat cells, each one a little bag of *oil*.', LOOPS, 1, 400, None),
    ('That oil is built from just three kinds of atoms: carbon, hydrogen and *oxygen*.', LOOPS, 1, 400, None),
    ('To burn that oil, your body needs extra oxygen, which you breathe *in*.', LOOPS, 1, 400, None),
    ('One kilo of fat needs nearly three kilos of oxygen, so your lungs do the heavy *lifting*.', LOOPS, 1, 900,
     None),

    ('Your body pulls the oil apart and joins each piece to that *oxygen*.', LOOPS, 2, 400, None),
    ('Only two leftovers come out: water, and carbon dioxide, the gas that fizzes in *soda*.', LOOPS, 2, 400, None),
    ('That gas slips into your blood and rides it all the way up to your *lungs*.', LOOPS, 2, 600, None),
    ('And then, with your next breath, it floats right out of your *mouth*.', CATCH, 2, 700, None),
    ('Out of every kilo you lose, about eight hundred and forty grams leaves as *breath*.', CATCH, 2, 400, None),
    ('The other hundred and sixty grams becomes water, and leaves as *sweat* and pee.', CATCH, 2, 500, None),
    ('So the gym is really where you go to exhale your *burger*.', CATCH, 2, 1000, None),

    ('Two scientists in Australia worked this out by tracking every *atom* in ten kilos of fat.', PROOF, 3, 400,
     None),
    ('Ten kilos of fat plus twenty nine kilos of oxygen went *in*.', PROOF, 3, 400, None),
    ('Twenty eight kilos of carbon dioxide and eleven kilos of water came *out*.', PROOF, 3, 400, None),
    ('Both sides weigh thirty nine kilos, so not a single atom went *missing*.', PROOF, 3, 700, None),
    ('And no, panting on the sofa will not burn more fat. You will just get *dizzy*.', PROOF, 3, 800, None),
    ("From now on, every breath out carries a tiny piece of yesterday's *dinner*.", PAYOFF, 3, 600, None),
    ('So where did that kilo on your scale go? You breathed it *out*.', PAYOFF, 3, 1500, None),
]

SOURCES = [
    'Meerman, R. and Brown, A. J., "When somebody loses weight, where does the fat go?", BMJ, 2014, 349: g7257. '
    '10 kg of fat needs 29 kg of oxygen and becomes 28 kg of carbon dioxide and 11 kg of water; 84% leaves through '
    'the lungs, 16% as water; a survey of 150 doctors, dietitians and personal trainers, with the common wrong '
    'answers (energy, heat, muscle, faeces). https://doi.org/10.1136/bmj.g7257',
    'UNSW press release, "When you lose weight, where does the fat go?", via ScienceDaily, 2014. '
    'https://www.sciencedaily.com/releases/2014/12/141216212047.htm',
    'AsianScientist, "Where Did The Fat Go?", 2014. Breathing more on its own does not make you lose weight.',
    'NPR, "When You Burn Off That Fat, Where Does It Go?", 2014. The 84% to 16% split; the water leaves as urine, '
    'sweat and other body fluids.',
    'Checked by Claude on 2026-10-21: of the 150 asked, only 3 gave the right answer, so "more than half got it '
    'wrong" is true and milder than the source; kept as Biku wrote it.',
]

lines = []
for i, (t, b, c, p, say) in enumerate(LINES, start=1):
    line = {'id': f'l{i:02d}', 'speaker': N, 'text': t, 'beat': b, 'chapter': c, 'pauseAfterMs': p}
    if say:
        line['say'] = say
    lines.append(line)
script = {
    'version': 1,
    'title': 'Where Does Your Fat Go When You Lose Weight?',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is', 'format': 'fine-print', 'brand': 'fine-print', 'voice': 'narrator',
    'speakers': [], 'lines': lines, 'sources': SOURCES, 'changes': [],
    'masterPrompt': 'prompts/fine-print.md',
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
words = [len(t.replace('*', '').split()) for t, *_ in LINES]
print(len(lines), 'lines,', sum(words), 'words; by part:',
      [sum(w for w, (_, _, c, *_r) in zip(words, LINES) if c == k) for k in (1, 2, 3)])
