"""The thumbnails of "How to Make Sure You Never Get Asked Out", as layered posters. Writes thumbnails.json.

Second round. Biku picked the words of the first round's 3 (ASK OR WAIT?), then asked for the
game theory thumbnails to look like What's the Catch?'s (2026-10-15: "i meant the thumbnail of
the game dilemma niche to look like whats the catch"). So, in that design
(library/thumbnail-designs/whats-the-catch.py): a flat page, huge heavy words with one line on a
dark box, the thing that matters circled in red with an arrow from the words. Here what matters
is what the asker got: the Copycat with the woman in red who asked him, circled. The Saint, who
waited, stands apart and sad. The cast are drawn from their cards, as in the videos. The first
round is kept in thumbnails-round1.py.

Run:  python runs/2026-10-14-never-asked-out/thumbnails.py
then: npm run thumbnail -- --run=2026-10-14-never-asked-out [--size=9:16]
"""
import io
import json

RED_DRESS = {'outfit': {'clothes': {'onePiece': {'kind': 'dress', 'cloth': 'crimson'},
                                    'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}


def headline(lines, x, top, size, width):
    return {'kind': 'headline', 'lines': [{'text': t, 'style': s} for t, s in lines], 'x': x, 'top': top,
            'size': size, 'width': width}


def circle(x, y, rx, ry):
    return {'kind': 'mark', 'shape': 'circle', 'at': {'x': x, 'y': y}, 'rx': rx, 'ry': ry}


def arrow(fx, fy, tx, ty):
    return {'kind': 'mark', 'shape': 'arrow', 'at': {'x': fx, 'y': fy}, 'to': {'x': tx, 'y': ty}}


def couple(x, ground, head, gap):
    """The Copycat and the woman in red who asked him, together and happy."""
    return [
        {'kind': 'extra', 'x': x - gap / 2, 'y': 0.5, 'ground': ground, 'head': head, 'pose': 'stand',
         'facing': 'right', 'turn': 0.4, 'expression': 'happy', 'look': RED_DRESS, 'light': 1},
        {'kind': 'person', 'character': 'copycat', 'x': x + gap / 2, 'y': 0.5, 'ground': ground, 'head': head,
         'pose': 'stand', 'expression': 'happy', 'facing': 'left', 'turn': 0.4, 'effects': []},
    ]


def saint(x, ground, head, look, light=1.0):
    return {'kind': 'person', 'character': 'saint', 'x': x, 'y': 0.5, 'ground': ground, 'head': head,
            'pose': 'stand', 'expression': 'sad', 'facing': 'right', 'turn': 0.3, 'effects': [],
            'looksAt': {'x': look[0], 'y': look[1]}, 'light': light}


def room(place, palette):
    return {'kind': 'room', 'place': place, 'palette': palette, 'treatment': 'atmospheric'}


def glow(x, y, radius, paint='gold', strength=0.75):
    return {'kind': 'glow', 'at': {'x': x, 'y': y}, 'radius': radius, 'paint': paint, 'strength': strength}


def shade(side, reach, strength=0.8):
    return {'kind': 'shade', 'from': side, 'reach': reach, 'strength': strength}


def backdrop(inner, outer, x, y, rays=18, deep=0.6):
    return {'kind': 'backdrop', 'inner': inner, 'outer': outer, 'at': {'x': x, 'y': y}, 'rays': rays,
            'deep': deep}


RAIN = {'kind': 'rain', 'count': 90, 'slant': 0.25, 'light': 0.45, 'seed': 3}


# Behind the same layout, three backgrounds of the game theory videos' own (Biku, 2026-10-15:
# "the background is bland for game theory niche. be a little bit creative").
def backgrounds(tall):
    cx, cy = (0.6, 0.55) if tall else (0.76, 0.5)
    return {
        # The party from the video, at night: a warm light on the couple, the waiting side dark.
        'party': ([room('living-room', 'dusk-violet'), glow(cx, cy, 0.3 if tall else 0.5),
                   shade('top' if tall else 'left', 0.45 if tall else 0.55, 0.75)], 0.75),
        # The game theory room: one bulb over the couple, the rest of the room in shadow.
        'table': ([room('the-table', 'table-grey'),
                   {'kind': 'thing', 'prop': 'bulb', 'x': cx, 'y': 0.56 if tall else 0.6,
                    'head': 0.06 if tall else 0.12},
                   glow(cx, cy, 0.28 if tall else 0.48, 'cream', 0.8),
                   shade('top' if tall else 'left', 0.45 if tall else 0.5, 0.8)], 0.7),
        # Two sides of one choice: rain where she waits, warm rays where they went.
        'split': ([{'kind': 'split', 'at': 0.36 if tall else 0.54, 'lean': -0.25 if tall else 0.08,
                    'left': [backdrop('steel', 'ocean', 0.2, 0.8, rays=0, deep=0.75), RAIN],
                    'right': [backdrop('gold', 'crimson', cx, cy, rays=18, deep=0.55)]}], 0.85),
    }


def wide(bg, lines):
    layers, light = backgrounds(False)[bg]
    return [
        *layers,
        headline(lines, 0.04, 0.07, 0.22, 0.45),
        saint(0.42, 0.98, 0.14, look=(0.75, 0.4), light=light),
        *couple(0.76, 0.92, 0.19, 0.15),
        circle(0.76, 0.53, 0.215, 0.45),
        arrow(0.42, 0.13, 0.58, 0.24),
    ]


def tall(bg, lines):
    layers, light = backgrounds(True)[bg]
    return [
        *layers,
        headline(lines, 0.07, 0.06, 0.105, 0.86),
        *couple(0.6, 0.76, 0.095, 0.3),
        circle(0.6, 0.57, 0.39, 0.23),
        saint(0.2, 0.99, 0.08, look=(0.6, 0.5), light=light),
        arrow(0.2, 0.37, 0.33, 0.41),
    ]


WORDS = [('ASK OR', 'light'), ('WAIT?', 'gold')]
LOOKS = [
    ('ask-or-wait-party', 'party',
     'The house party from the video, at night: a warm light on the couple, the one who waited in the dark.'),
    ('ask-or-wait-table', 'table',
     'The game theory room: one bulb over the couple, the rest in shadow.'),
    ('ask-or-wait-split', 'split',
     'Two sides of one choice: cold rain where she waits, warm rays where they went.'),
]
THUMBS = []
for name, bg, why in LOOKS:
    THUMBS.append({'id': name + '-tall', 'size': '9:16', 'why': why + ' Tall, for Reels and Shorts.',
                   'layers': tall(bg, WORDS)})
for name, bg, why in LOOKS:
    THUMBS.append({'id': name, 'size': '16:9', 'why': why, 'layers': wide(bg, WORDS)})

io.open('F:/Video Studio/runs/2026-10-14-never-asked-out/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
