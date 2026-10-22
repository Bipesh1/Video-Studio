"""The thumbnails of "She Wrote Down Every Dish She Washed for a Year". Writes thumbnails.json.

Wide (16:9) for YouTube. Each in a layout of its own, built from what only this story has (Biku,
2026-10-18: "it should be different based on what the video is"), and the words say what the
video is about read alone, without the picture (Biku, 2026-10-20, of a thumbnail that said "this":
"nobody understands anything from that question"). The game theory style is kept: the cast cut
out and lit, huge heavy words, one line gold, a red mark on the thing that matters.

  1  his and hers    the picture cut in two, blue for her and orange for him, each glaring with
                     their own notebook
  2  her tally       her, smug, beside her open notebook full of tally marks, circled, on a gold burst
  3  his drawer      her jaw dropped in the dark kitchen, an arrow to the drawer with his notebook

Run:  python runs/2026-10-20-dishes/thumbnails.py
then: npm run thumbnail -- --run=2026-10-20-dishes --size=16:9
"""
import io
import json


def headline(lines, top, size=0.16, x=0.04, width=0.6):
    return {'kind': 'headline', 'lines': [{'text': t, 'style': s} for t, s in lines], 'x': x, 'top': top,
            'size': size, 'width': width}


def person(who, x, ground, head, face, facing, effects=(), looks=None, light=1.0, outline=0.04):
    out = {'kind': 'person', 'character': who, 'x': x, 'y': 0.5, 'ground': ground, 'head': head, 'pose': 'stand',
           'facing': facing, 'turn': 0.35, 'expression': face, 'effects': list(effects), 'light': light,
           'outline': outline}
    if looks:
        out['looksAt'] = {'x': looks[0], 'y': looks[1]}
    return out


def thing(prop, x, y, head):
    return {'kind': 'thing', 'prop': prop, 'x': x, 'y': y, 'head': head}


def circle(x, y, rx, ry):
    return {'kind': 'mark', 'shape': 'circle', 'at': {'x': x, 'y': y}, 'rx': rx, 'ry': ry}


def arrow(fx, fy, tx, ty):
    return {'kind': 'mark', 'shape': 'arrow', 'at': {'x': fx, 'y': fy}, 'to': {'x': tx, 'y': ty}}


# 1  His and hers: two sides, each with its own colour, person and notebook.
HIS_AND_HERS = [
    {'kind': 'split', 'at': 0.5, 'lean': 0.06, 'seam': 0.014,
     'left': [{'kind': 'backdrop', 'inner': 'glint', 'outer': 'ocean', 'at': {'x': 0.25, 'y': 0.6}, 'rays': 14},
              person('saint', 0.28, 1.04, 0.2, 'fuming', 'right', looks=(0.75, 0.5)),
              thing('notebook-blue', 0.41, 0.84, 0.36)],
     'right': [{'kind': 'backdrop', 'inner': 'gold', 'outer': 'orange', 'at': {'x': 0.75, 'y': 0.6}, 'rays': 14},
               person('copycat', 0.72, 1.04, 0.2, 'fuming', 'left', looks=(0.25, 0.5)),
               thing('notebook-orange', 0.59, 0.84, 0.36)]},
    {'kind': 'shade', 'from': 'top', 'reach': 0.34, 'strength': 0.8},
    headline([('WHO REALLY DID', 'light'), ('THE DISHES?', 'gold')], 0.03, size=0.13, x=0.04, width=0.92),
]

# 2  Her tally: smug beside the notebook she kept for a year.
HER_TALLY = [
    {'kind': 'backdrop', 'inner': 'gold', 'outer': 'crimson', 'at': {'x': 0.72, 'y': 0.55}, 'rays': 18},
    {'kind': 'shade', 'from': 'left', 'reach': 0.5, 'strength': 0.8},
    person('saint', 0.82, 1.06, 0.24, 'smug', 'left', looks=(0.55, 0.55)),
    thing('notebook-blue-open', 0.56, 0.72, 0.62),
    circle(0.58, 0.53, 0.14, 0.2),
    headline([('SHE COUNTED', 'light'), ('EVERY DISH', 'gold')], 0.1, size=0.2, x=0.04, width=0.48),
]

# 3  His drawer: her shock, and the notebook he hid.
HIS_DRAWER = [
    {'kind': 'room', 'place': 'kitchen', 'palette': 'dusk-violet', 'treatment': 'atmospheric'},
    {'kind': 'glow', 'at': {'x': 0.78, 'y': 0.62}, 'radius': 0.4, 'paint': 'gold', 'strength': 0.8},
    {'kind': 'shade', 'from': 'top', 'reach': 0.4, 'strength': 0.75},
    person('saint', 0.2, 1.08, 0.26, 'jaw-drop', 'right', effects=['shock-lines'], looks=(0.8, 0.6)),
    thing('drawer-cabinet-open', 0.8, 0.98, 0.4),
    circle(0.8, 0.5, 0.13, 0.14),
    arrow(0.33, 0.62, 0.66, 0.52),
    headline([('HE KEPT', 'light'), ('A LIST TOO', 'gold')], 0.05, size=0.15, x=0.42, width=0.55),
]

LOOKS = [
    ('his-and-hers', HIS_AND_HERS, 'Cut in two, blue for her and orange for him, each glaring with their notebook.'),
    ('her-tally', HER_TALLY, 'Her, smug, beside her notebook full of tally marks, circled.'),
    ('his-drawer', HIS_DRAWER, 'Her jaw dropped, an arrow to the drawer where he hid his own notebook.'),
]
THUMBS = [{'id': name + '-wide', 'size': '16:9', 'why': why + ' Wide, for YouTube.', 'layers': layers}
          for name, layers, why in LOOKS]
io.open('F:/Video Studio/runs/2026-10-20-dishes/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
