"""The thumbnails of "How to Make Sure You Never Get Asked Out", as layered posters. Writes thumbnails.json.

The saved game theory design (knowledge/playbooks/thumbnails.md, the one Biku picked for The
Smoke): a colour backdrop glowing from behind the face with rays, one face of the cast about a
third of the frame with a pale edge like a sticker, two or three words that name the video with
the one that matters in gold, the lower right corner left free, readable at feed size. Never a
frame of the video (Biku, 2026-10-15: "i talked about the thumbnail design right before? why is it
again like this?").

The face is the Saint, who waited; behind her, dimmer and smaller, the Copycat with the woman
in red who asked him.

Run:  python runs/2026-10-14-never-asked-out/thumbnails.py
then: npm run thumbnail -- --run=2026-10-14-never-asked-out [--size=9:16]
"""
import io
import json

RED_DRESS = {'outfit': {'clothes': {'onePiece': {'kind': 'dress', 'cloth': 'crimson'},
                                    'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}


def backdrop(inner, outer, x, y, rays=18, deep=0.6):
    return {'kind': 'backdrop', 'inner': inner, 'outer': outer, 'at': {'x': x, 'y': y}, 'rays': rays,
            'deep': deep}


def glow(x, y, radius, paint='cream', strength=0.75):
    return {'kind': 'glow', 'at': {'x': x, 'y': y}, 'radius': radius, 'paint': paint, 'strength': strength}


def shade(side, reach, strength=0.8):
    return {'kind': 'shade', 'from': side, 'reach': reach, 'strength': strength}


def words(lines, x, bottom, size, gold, width):
    return {'kind': 'words', 'lines': list(lines), 'gold': list(gold), 'x': x, 'bottom': bottom, 'size': size,
            'width': width, 'justify': True}


def couple(x, y, head, gap, light=0.62):
    """The Copycat and the woman in red, together, happy: what she missed. `gap` is a share of the width."""
    return [
        {'kind': 'extra', 'x': x - gap / 2, 'y': y, 'head': head, 'pose': 'stand', 'facing': 'right',
         'turn': 0.4, 'expression': 'happy', 'look': RED_DRESS, 'light': light},
        {'kind': 'person', 'character': 'copycat', 'x': x + gap / 2, 'y': y, 'head': head, 'pose': 'stand',
         'expression': 'happy', 'facing': 'left', 'turn': 0.4, 'effects': [], 'light': light},
    ]


def saint(face, x, y, head, look):
    return {'kind': 'person', 'character': 'saint', 'x': x, 'y': y, 'head': head, 'pose': 'stand',
            'expression': face, 'facing': 'left', 'turn': 0.25, 'effects': [], 'outline': 0.03,
            'looksAt': {'x': look[0], 'y': look[1]}}


def wide(lines, gold, colours, face):
    inner, outer = colours
    return [
        backdrop(inner, outer, 0.775, 0.5),
        glow(0.775, 0.5, 0.52),
        # Under the words, at the lower left (the lower right is the time stamp's).
        *couple(0.3, 0.8, 0.2, 0.15),
        saint(face, 0.79, 0.56, 0.56, look=(0.3, 0.8)),
        shade('left', 0.5, 0.45),
        words(lines, 0.27, 0.56, 0.26, gold, 0.5),
    ]


def tall(lines, gold, colours, face):
    inner, outer = colours
    return [
        backdrop(inner, outer, 0.5, 0.64),
        glow(0.5, 0.64, 0.3),
        shade('top', 0.4, 0.5),
        *couple(0.2, 0.52, 0.12, 0.16),
        saint(face, 0.58, 0.66, 0.31, look=(0.2, 0.52)),
        shade('bottom', 0.2, 0.7),
        words(lines, 0.5, 0.33, 0.16, gold, 0.92),
    ]


WARM = ('gold', 'crimson')
SUNSET = ('orange', 'brown')
GREEN = ('cream', 'forest')
LOOKS = [
    ('still-waiting', ['STILL', 'WAITING'], [1], WARM, 'sad',
     'Where waiting got her, on a warm red and gold that sets off her blue: sad, and true to the end.'),
    ('she-waited', ['SHE', 'WAITED'], [1], SUNSET, 'hollow',
     'The story in two words, on a late-evening orange, her face empty as he leaves with someone else.'),
    ('ask-or-wait', ['ASK', 'OR WAIT?'], [0], GREEN, 'thinking',
     'The choice the video is about, as a question to the viewer, on green: go.'),
]
THUMBS = []
for name, lines, gold, colours, face, why in LOOKS:
    THUMBS.append({'id': name + '-tall', 'size': '9:16', 'why': why + ' Tall, for Reels and Shorts.',
                   'layers': tall(lines, gold, colours, face)})
for name, lines, gold, colours, face, why in LOOKS:
    THUMBS.append({'id': name, 'size': '16:9', 'why': why, 'layers': wide(lines, gold, colours, face)})

io.open('F:/Video Studio/runs/2026-10-14-never-asked-out/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
