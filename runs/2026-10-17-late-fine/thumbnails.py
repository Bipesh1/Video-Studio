"""The thumbnails of "Why a Fine for Being Late Made Parents Even Later". Writes thumbnails.json.

Biku, 2026-10-17, of the first three (the saved game theory layout again): "the thumbnail design is
always the same ... although the design is like that make it different". So each option here has a
layout of its own, built round something only this story has, and none is the saved layout: the
style is kept (huge heavy words that name the video, gold on the last line, a red mark on the thing
that matters, the cast cut out with a pale edge), the composition changes.

  1  the notice      the LATE FINE $3 notice huge in the middle, its $3 circled in red, the Cheat in
                     front with dollar eyes, warm rays behind: "THE FINE THAT BACKFIRED"
  2  sorry or pay    the picture cut in two: the Copycat sorry on the cold side (NO FINE), the same
                     man smug with his dollar on the gold side ($3): "SORRY OR PAY?"
  3  the clock       the clock at twenty to five, huge, over the little boy alone at the window:
                     "PAYING TO BE LATE"

Run:  python runs/2026-10-17-late-fine/thumbnails.py
then: npm run thumbnail -- --run=2026-10-17-late-fine --size=9:16
"""
import io
import json

BOY = {'age': 'child', 'outfit': {'clothes': {'top': {'kind': 't-shirt', 'cloth': 'glint'},
                                              'bottom': {'kind': 'trousers', 'cloth': 'denim'},
                                              'shoes': {'kind': 'sneakers', 'cloth': 'white'},
                                              'hat': {'kind': 'beanie', 'cloth': 'orange'}}}}


def headline(lines, top, size=0.085, x=0.06, width=0.88):
    return {'kind': 'headline', 'lines': [{'text': t, 'style': s} for t, s in lines], 'x': x, 'top': top,
            'size': size, 'width': width}


def person(who, x, ground, head, face, facing='right', pose='stand', look=None, effects=(), outline=0.04):
    p = {'kind': 'person', 'character': who, 'x': x, 'y': 0.5, 'ground': ground, 'head': head, 'pose': pose,
         'facing': facing, 'turn': 0.3, 'expression': face, 'effects': list(effects), 'outline': outline}
    if look:
        p['looksAt'] = {'x': look[0], 'y': look[1]}
    return p


def hung(prop, x, middle, head, hangs):
    """A thing of the wall placed by where its middle should be: the poster stands a hung thing
    `hangs` heads above the point it is given."""
    return {'kind': 'thing', 'prop': prop, 'x': x, 'y': round(middle + hangs * head, 3), 'head': head}


# 1  The notice, huge, and the man who read it as a price.
NOTICE = [
    {'kind': 'backdrop', 'inner': 'orange', 'outer': 'crimson', 'at': {'x': 0.5, 'y': 0.42}, 'rays': 18,
     'deep': 0.6},
    headline([('THE FINE THAT', 'light'), ('BACKFIRED', 'gold')], 0.05),
    hung('notice-board-fine', 0.5, 0.43, 0.2, 2.5),
    {'kind': 'mark', 'shape': 'circle', 'at': {'x': 0.5, 'y': 0.472}, 'rx': 0.11, 'ry': 0.042},
    person('cheat', 0.66, 1.08, 0.15, 'sly-grin', facing='left', look=(0.45, 0.45), effects=['dollar-eyes']),
]

# 2  Before and after: the same man, sorry with no fine, smug with a $3 one.
SPLIT = [
    {'kind': 'split', 'at': 0.5, 'lean': 0.08, 'seam': 0.01,
     'left': [
         {'kind': 'backdrop', 'inner': 'steel', 'outer': 'denim', 'at': {'x': 0.25, 'y': 0.6}, 'rays': 0,
          'deep': 0.5},
         person('copycat', 0.25, 1.0, 0.12, 'guilty', facing='right', effects=['sweat-resting']),
         {'kind': 'tag', 'text': 'NO FINE', 'x': 0.25, 'y': 0.9, 'size': 0.04, 'paint': 'glint', 'tilt': -4},
     ],
     'right': [
         {'kind': 'backdrop', 'inner': 'gold', 'outer': 'orange', 'at': {'x': 0.75, 'y': 0.6}, 'rays': 14,
          'deep': 0.45},
         person('copycat', 0.75, 1.0, 0.12, 'smug', facing='left', pose='hold-object'),
         {'kind': 'thing', 'prop': 'banknote', 'x': 0.545, 'y': 0.79, 'head': 0.06},
         {'kind': 'tag', 'text': '$3', 'x': 0.75, 'y': 0.9, 'size': 0.05, 'paint': 'crimson', 'tilt': 4},
     ]},
    {'kind': 'band', 'top': 0, 'bottom': 0.29},
    headline([('SORRY', 'light'), ('OR PAY?', 'gold')], 0.04, size=0.1),
]

# 3  The clock that kept going, and the boy it kept waiting.
CLOCK = [
    {'kind': 'room', 'place': 'daycare', 'palette': 'dusk-violet', 'treatment': 'atmospheric'},
    {'kind': 'shade', 'from': 'top', 'reach': 0.4, 'strength': 0.8},
    {'kind': 'glow', 'at': {'x': 0.5, 'y': 0.8}, 'radius': 0.22, 'paint': 'gold', 'strength': 0.6},
    headline([('PAYING TO', 'light'), ('BE LATE', 'gold')], 0.05, size=0.1),
    hung('wall-clock-4-40', 0.5, 0.48, 0.24, 3.1),
    {'kind': 'extra', 'x': 0.55, 'y': 0.5, 'ground': 0.97, 'head': 0.075, 'pose': 'stand', 'facing': 'left',
     'turn': 0.3, 'expression': 'sad', 'look': BOY, 'light': 1, 'outline': 0.04, 'effects': []},
    {'kind': 'tag', 'text': 'STILL WAITING', 'x': 0.5, 'y': 0.665, 'size': 0.034, 'paint': 'cream', 'tilt': -4},
]

LOOKS = [
    ('fine-that-backfired', NOTICE, 'The notice itself is the subject: the $3 that turned a favor into a price.'),
    ('sorry-or-pay', SPLIT, 'Before and after side by side: the same father sorry, then just paying.'),
    ('paying-to-be-late', CLOCK, 'The cost of it: the clock past the hour and the boy left waiting.'),
]
THUMBS = [{'id': name + '-tall', 'size': '9:16', 'why': why + ' Tall, for Reels and Shorts.', 'layers': layers}
          for name, layers, why in LOOKS]

io.open('F:/Video Studio/runs/2026-10-17-late-fine/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
