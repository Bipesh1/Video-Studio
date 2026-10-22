"""The spoken words of "Why Is the Sun Already Gone When You Watch It Set?", as script.json.

Biku's script (What's the Catch?), used as it is: "make a video for this script for whats the
catch" (2026-10-18). What is decided here is only the beat, the part and the pause after a line.

The parts:
  1  the question and the moment: the phone, the beach, the straight line that is wrong
  2  the clue: the straw, the layers of air, a high Sun and a low one
  3  the catch, the proof and what you'll notice

Facts checked on 2026-10-18: David Basey, "Atmospheric Refraction", British Astronomical Association,
2 March 2019 ("As it approaches the horizon the amount of refraction is around 0.5o, which is roughly
the Sun's apparent diameter"; "When the Sun appears to be sitting on the horizon ... it is really below
the geometric horizon"; the lower limb is lifted more than the upper, so the disc looks oval). Tong
Yu-fai, "Effect of atmospheric refraction on the times of sunrise and sunset", Hong Kong Observatory,
August 2017 (refraction makes sunset about 2 minutes later; the published times already include it;
"The Sun truly disappears below the horizon before sunset happens").
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-18-sunset-already-gone/'
N = 'narrator'
Q, MOMENT, CLUE, CATCH, PROOF, NOTICE = ('the-question', 'the-moment', 'follow-the-money', 'the-trick',
                                         'the-proof', 'your-move')

#  (text, beat, part, pause after in ms)
LINES = [
    ('Where is the Sun really when it touches the sea at sunset?', Q, 1, 700),
    ('The answer is in the air around you, and it tricks your *eyes*.', Q, 1, 900),
    ('You hold up your phone as the bottom of the Sun touches the sea.', MOMENT, 1, 500),
    ('Everyone filming thinks the Sun is right there, sitting on the water.', MOMENT, 1, 500),
    ('And they think its light flies to them in a *straight* line.', MOMENT, 1, 600),
    ('Both of those ideas are *wrong*.', MOMENT, 1, 1100),

    ('The straw in the drink beside you shows why.', CLUE, 2, 500),
    ('The straw looks snapped because light changes direction when it crosses from water into air.', CLUE, 2, 600),
    ('Air bends light too, because air gets *thicker* the closer it is to the ground.', CLUE, 2, 600),
    ('So sunlight curves a little as it passes down through each layer.', CLUE, 2, 500),
    ("A high Sun's light comes almost straight down, so it barely bends.", CLUE, 2, 500),
    ("But a low Sun's light skims sideways through the thickest air, so it bends the *most*.", CLUE, 2, 1100),

    ('Follow one beam from that low Sun as it curves down into your phone.', CATCH, 3, 500),
    ('Your eyes and your camera assume that light came in a *straight* line.', CATCH, 3, 500),
    ('But trace the curved beam back, and the real Sun is already *below* the horizon.', CATCH, 3, 600),
    ('The air lifts the picture of the Sun by about its own *width*.', CATCH, 3, 500),
    ('So the Sun on your screen has, in a way, already *set*.', CATCH, 3, 900),
    ('The British Astronomical Association puts that lift at about half a degree, roughly one whole Sun.',
     PROOF, 3, 500),
    ('The Hong Kong Observatory says this makes sunset there about two minutes *later* than with no air.',
     PROOF, 3, 500),
    ('And official sunset times already include those extra minutes.', PROOF, 3, 800),
    ("You'll also notice a low Sun looks squashed, flat at the bottom.", NOTICE, 3, 500),
    ('That is the air lifting its bottom edge more than its top.', NOTICE, 3, 600),
    ('So when the Sun touches the sea, the real Sun is already just *below* it.', NOTICE, 3, 1500),
]

SOURCES = [
    'David Basey, "Atmospheric Refraction", British Astronomical Association, 2 March 2019. Near the horizon the '
    "air lifts the Sun's image by about half a degree, roughly the Sun's apparent diameter; a Sun that seems to "
    'sit on the horizon is really below it; the lower edge is lifted more than the upper, so the disc looks oval. '
    'https://britastro.org/2019/atmospheric-refraction',
    'Tong Yu-fai, "Effect of atmospheric refraction on the times of sunrise and sunset", Hong Kong Observatory, '
    'August 2017. Refraction makes sunset about 2 minutes later in Hong Kong than with no air (about 34 arcminutes '
    'of lift under average conditions); the published times already include it; the Sun truly disappears below '
    'the horizon before sunset happens. https://www.hko.gov.hk/en/education/astronomy-and-time/astronomy/'
    '00493-effect-of-atmospheric-refraction-on-the-times-of-sunrise-and-sunset.html',
    'Checked by Claude against both pages on 2026-10-18.',
]

lines = [{'id': f'l{i:02d}', 'speaker': N, 'text': t, 'beat': b, 'chapter': c, 'pauseAfterMs': p}
         for i, (t, b, c, p) in enumerate(LINES, start=1)]
script = {
    'version': 1,
    'title': 'Why Is the Sun Already Gone When You Watch It Set?',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is', 'format': 'fine-print', 'brand': 'fine-print', 'voice': 'narrator',
    'speakers': [], 'lines': lines, 'sources': SOURCES, 'changes': [],
    'masterPrompt': 'prompts/fine-print.md',
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(lines), 'lines,', sum(len(t.replace('*', '').split()) for t, *_ in LINES), 'words')
