"""The thumbnails of the plain-words Smoke video, as layered posters. Writes thumbnails.json.

Laid out from what the research says (knowledge/playbooks/thumbnails.md) and what Biku asked
(L-0044): a wide picture, one focal point (his face, about a third of the frame), three or four
words that name the video, strong light-on-dark contrast with one bright colour, the lower
right corner left free for YouTube's time stamp, and readable at the size of a phone's feed.

Run:  python runs/2026-10-12-the-smoke-plain/thumbnails.py
then: npm run thumbnail -- --run=2026-10-12-the-smoke-plain
"""
import io
import json

ROOM = {'kind': 'room', 'place': 'the-table', 'palette': 'table-grey'}


def extra(x, y, head, light=0.5, facing='left', turn=0.15, badge=False):
    return {'kind': 'extra', 'x': x, 'y': y, 'head': head, 'light': light, 'facing': facing, 'turn': turn,
            'badge': badge, 'pose': 'stand'}


def man(face, x, y, head, look=None, effects=('sweat-resting',), turn=0.2, facing='left'):
    layer = {'kind': 'person', 'character': 'copycat', 'x': x, 'y': y, 'head': head, 'pose': 'stand',
             'expression': face, 'facing': facing, 'turn': turn, 'effects': list(effects)}
    if look:
        layer['looksAt'] = {'x': look[0], 'y': look[1]}
    return layer


def smoke(top, head, seed=1, light=1.0):
    return {'kind': 'smoke', 'top': top, 'head': head, 'seed': seed, 'light': light}


def shade(side, reach, strength=0.8):
    return {'kind': 'shade', 'from': side, 'reach': reach, 'strength': strength}


def words(lines, x, bottom, size, gold, width):
    return {'kind': 'words', 'lines': list(lines), 'gold': list(gold), 'x': x, 'bottom': bottom, 'size': size,
            'width': width, 'justify': True}


def backdrop(inner, outer, x, y, rays=18, deep=0.6):
    return {'kind': 'backdrop', 'inner': inner, 'outer': outer, 'at': {'x': x, 'y': y}, 'rays': rays,
            'deep': deep}


def glow(x, y, radius, paint='cream', strength=0.75):
    return {'kind': 'glow', 'at': {'x': x, 'y': y}, 'radius': radius, 'paint': paint, 'strength': strength}


def sign(text, at, to, paint='forest'):
    return {'kind': 'sign', 'text': text, 'at': {'x': at[0], 'y': at[1]}, 'to': {'x': to[0], 'y': to[1]},
            'paint': paint}


# The thumbnail has a look of its own, brighter than the grey room of the video (Biku: "a little
# bit different than what the actual video looks like, attractive and good"): a colour glowing
# out from behind his head with rays of light, him cut out with a pale edge like a sticker, the
# calm ones grey beside him, and the smoke across the bottom.
def wide(lines, gold, colours, face='dread', cue=None, bottom=0.66):
    inner, outer = colours
    layers = [
        backdrop(inner, outer, 0.775, 0.5),
        glow(0.775, 0.5, 0.52),
        extra(0.565, 0.4, 0.33, light=0.6, facing='right'),
        extra(0.985, 0.38, 0.33, light=0.6),
        smoke(0.68, 0.3, seed=3, light=0.8),
        {**man(face, 0.775, 0.55, 0.58, look=(0.565, 0.4)), 'outline': 0.03},
        smoke(0.87, 0.4, seed=2),
        shade('left', 0.5, 0.45),
        words(lines, 0.265, bottom, 0.3, gold, 0.56),
    ]
    if cue:
        layers.append(cue)
    return layers


def tall(lines, gold, colours, face='dread'):
    inner, outer = colours
    return [
        backdrop(inner, outer, 0.5, 0.62),
        glow(0.5, 0.62, 0.3),
        shade('top', 0.4, 0.5),
        extra(0.09, 0.47, 0.19, light=0.6, facing='right'),
        extra(0.91, 0.47, 0.19, light=0.6),
        smoke(0.58, 0.14, seed=3, light=0.8),
        {**man(face, 0.5, 0.64, 0.33, look=(0.09, 0.47), facing='right'), 'outline': 0.03},
        smoke(0.84, 0.2, seed=2),
        smoke(0.93, 0.26, seed=5),
        shade('bottom', 0.22, 0.75),
        words(lines, 0.5, 0.33, 0.16, gold, 0.92),
    ]


BLUE = ('glint', 'ocean')
FIRE = ('gold', 'crimson')
GREEN = ('cream', 'forest')
LOOKS = [
    ('the-smoke-test', ['THE SMOKE', 'TEST'], [1], BLUE, 'dread',
     'The plain title on a deep blue that sets off his orange hat: cool, clear, a little eerie.'),
    ('nine-in-ten', ['9 IN 10', 'SAT IN SMOKE'], [0], FIRE, 'dread',
     'The result of the real study on a hot red and gold: alarm, danger, hard to scroll past.'),
    ('why-nobody-leaves', ['WHY NOBODY', 'LEAVES'], [1], GREEN, 'lying',
     'What the video explains, on the green of an exit sign, with his false smile.'),
]
THUMBS = []
for name, lines, gold, colours, face, why in LOOKS:
    THUMBS.append({'id': name, 'size': '16:9', 'why': why, 'layers': wide(lines, gold, colours, face)})
for name, lines, gold, colours, face, why in LOOKS:
    THUMBS.append({'id': name + '-tall', 'size': '9:16', 'why': why + ' Stood up, for a Short or a Reel.',
                   'layers': tall(lines, gold, colours, face)})

io.open('F:/Video Studio/runs/2026-10-12-the-smoke-plain/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
