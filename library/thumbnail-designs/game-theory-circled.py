"""The saved thumbnail design for game theory videos (The Dilemma Table): "circled, in the room".

Biku, 2026-10-15: he asked for the game theory thumbnails to look like What's the Catch?'s
("i meant the thumbnail of the game dilemma niche to look like whats the catch"), then of the
flat pages: "the background is bland for game theory niche. be a little bit creative". Of three
backgrounds (the video's own place at night, the game theory room under one bulb, a picture cut
in two) he picked the first for Never Asked Out. It replaces the rays-and-face design of The
Smoke (2026-10-13).

The design:
  - the background is a place from the video itself, in a night palette, atmospheric
  - a warm glow on the ones who won the game; the rest of the picture shaded, darker on the
    side where the words and the loser stand
  - huge heavy words from the top left that name the video: the first line light with a dark
    edge, the last on a gold box
  - the winners, whole figures, circled in red, with a red arrow from the words to them
  - the one who lost the game stands apart, smaller, in the dim, looking at them
  - the cast are drawn from their cards, as in the videos
  - nothing to read in the lower right corner, where YouTube stamps the length

`circled(...)` builds one in either shape: `winners` are poster figures (`person` of the cast or
`extra` with a `look`) laid out by `pair`, `loser` is one of the cast.

Run:   python library/thumbnail-designs/game-theory-circled.py
then:  npm run thumbnail -- --file=library/thumbnail-designs/game-theory-circled.json --cast=2026-10-14-never-asked-out [--size=9:16]
"""
import io
import json


def headline(lines, x, top, size, width):
    return {'kind': 'headline', 'lines': [{'text': t, 'style': s} for t, s in lines], 'x': x, 'top': top,
            'size': size, 'width': width}


def circle(x, y, rx, ry):
    return {'kind': 'mark', 'shape': 'circle', 'at': {'x': x, 'y': y}, 'rx': rx, 'ry': ry}


def arrow(fx, fy, tx, ty):
    return {'kind': 'mark', 'shape': 'arrow', 'at': {'x': fx, 'y': fy}, 'to': {'x': tx, 'y': ty}}


def pair(left, right, x, ground, head, gap):
    """Two winners side by side, facing each other, happy. `left` and `right` are partial layers:
    {'character': 'copycat'} for one of the cast, or {'look': {...}} for someone of the poster's own."""
    out = []
    for who, dx, facing in ((left, -gap / 2, 'right'), (right, gap / 2, 'left')):
        kind = 'person' if 'character' in who else 'extra'
        layer = {'kind': kind, 'x': x + dx, 'y': 0.5, 'ground': ground, 'head': head, 'pose': 'stand',
                 'facing': facing, 'turn': 0.4, 'expression': 'happy', 'effects': [], **who}
        if kind == 'extra':
            layer['light'] = 1
        out.append(layer)
    return out


def loser(character, x, ground, head, look, face='sad', light=0.75):
    return {'kind': 'person', 'character': character, 'x': x, 'y': 0.5, 'ground': ground, 'head': head,
            'pose': 'stand', 'expression': face, 'facing': 'right', 'turn': 0.3, 'effects': [],
            'looksAt': {'x': look[0], 'y': look[1]}, 'light': light}


def circled(id, lines, place, palette, winners, lost, size='16:9', why=''):
    """lines: [(words, 'light' | 'gold' | ...)]; winners: (left, right) for `pair`; lost: a cast id."""
    tall = size == '9:16'
    cx, cy = (0.6, 0.55) if tall else (0.76, 0.5)
    back = [
        {'kind': 'room', 'place': place, 'palette': palette, 'treatment': 'atmospheric'},
        {'kind': 'glow', 'at': {'x': cx, 'y': cy}, 'radius': 0.3 if tall else 0.5, 'paint': 'gold',
         'strength': 0.75},
        {'kind': 'shade', 'from': 'top' if tall else 'left', 'reach': 0.45 if tall else 0.55, 'strength': 0.75},
    ]
    if tall:
        front = [
            headline(lines, 0.07, 0.06, 0.105, 0.86),
            *pair(*winners, 0.6, 0.76, 0.095, 0.3),
            circle(0.6, 0.57, 0.39, 0.23),
            loser(lost, 0.2, 0.99, 0.08, look=(0.6, 0.5)),
            arrow(0.2, 0.37, 0.33, 0.41),
        ]
    else:
        front = [
            headline(lines, 0.04, 0.07, 0.22, 0.45),
            loser(lost, 0.42, 0.98, 0.14, look=(0.75, 0.4)),
            *pair(*winners, 0.76, 0.92, 0.19, 0.15),
            circle(0.76, 0.53, 0.215, 0.45),
            arrow(0.42, 0.13, 0.58, 0.24),
        ]
    return {'id': id, 'size': size, 'why': why, 'layers': back + front}


# The one he picked, Never Asked Out, in both shapes, as the sample.
RED_DRESS = {'look': {'outfit': {'clothes': {'onePiece': {'kind': 'dress', 'cloth': 'crimson'},
                                             'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}}
WORDS = [('ASK OR', 'light'), ('WAIT?', 'gold')]
THUMBS = [
    circled('never-asked-out', WORDS, 'living-room', 'dusk-violet', (RED_DRESS, {'character': 'copycat'}),
            'saint', '16:9', why='Picked by Biku for Never Asked Out, 2026-10-15.'),
    circled('never-asked-out-tall', WORDS, 'living-room', 'dusk-violet', (RED_DRESS, {'character': 'copycat'}),
            'saint', '9:16', why='The same, tall, for Reels and Shorts.'),
]

io.open('F:/Video Studio/library/thumbnail-designs/game-theory-circled.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
