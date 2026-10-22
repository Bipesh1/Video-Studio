"""Covers for the look test's Short, "What Happens If You Fall Into a Black Hole?". Writes thumbnails.json.

Redone 2026-10-21 after Biku: "the thumbnails are still not good, have you not researched about
the thumbnails?". The first three broke the studio's own rules (knowledge/playbooks/thumbnails.md):
a frame of the video with words on it, the video's dark background, a small face, none of the
channel's lettering. These follow them, and the Shorts research of the same day:
  - a poster with a look of its own, brighter than the video: a colour backdrop with rays;
  - one subject, big and centred (Shorts shelves crop the edges), a face about a third of the frame,
    cut out with a pale edge, a feeling that reads at once;
  - one to four big words in the heavy thumbnail lettering, one line gold, that add to the title;
  - a red mark on the thing that matters, only where it helps;
  - the cover never shows in the swipe feed, only on the shelf, search and the channel page, and
    uploading one is still limited, so the same design goes into the Short as a frame to pick.

  1  terrified, close   the mascot huge and horrified, the glowing hole behind him, YOU'D BE SPAGHETTI
  2  tiny you           the hole enormous, the mascot small at its edge, circled, an arrow from YOU
  3  no way back        the mascot reaching up and away from the hole below, NO WAY BACK

Run:  python runs/2026-10-21-catch-look-test/thumbnails.py
then: npm run thumbnail -- --run=2026-10-21-catch-look-test --size=9:16
"""
import io
import json

MASCOT = {'identity': {'skinTone': 3, 'hair': 'short-crop', 'hairColor': 'dark-brown'},
          'outfit': {'costume': 'astronaut'}}


def mascot(x, ground, head, face, pose='stand', facing='right', outline=0.07):
    return {'kind': 'extra', 'x': x, 'y': 0.5, 'ground': ground, 'head': head, 'pose': pose, 'facing': facing,
            'turn': 0.25, 'expression': face, 'look': MASCOT, 'light': 1, 'outline': outline}


def words(lines, bottom, gold, size=0.1, width=0.9):
    return {'kind': 'words', 'lines': lines, 'gold': gold, 'bottom': bottom, 'size': size, 'width': width,
            'justify': True}


def hole(x, y, head):
    return {'kind': 'thing', 'prop': 'black-hole-glow-centred', 'x': x, 'y': y, 'head': head}


# 1  Terrified, close: his face is the cover.
TERRIFIED = [
    {'kind': 'backdrop', 'inner': 'orange', 'outer': 'denim', 'at': {'x': 0.5, 'y': 0.72}, 'rays': 18, 'deep': 0.7},
    hole(0.5, 0.97, 0.3),
    mascot(0.5, 0.93, 0.14, 'horrified', pose='float'),
    words(["YOU'D BE", 'SPAGHETTI'], 0.22, [1], size=0.1),
]

# 2  Tiny you: the scale is the shock.
TINY = [
    {'kind': 'backdrop', 'inner': 'gold', 'outer': 'denim', 'at': {'x': 0.5, 'y': 0.62}, 'rays': 14, 'deep': 0.8},
    hole(0.5, 0.64, 0.4),
    mascot(0.7, 0.4, 0.04, 'horrified', pose='float'),
    {'kind': 'mark', 'shape': 'circle', 'at': {'x': 0.7, 'y': 0.35}, 'rx': 0.11, 'ry': 0.07},
    {'kind': 'mark', 'shape': 'arrow', 'at': {'x': 0.35, 'y': 0.25}, 'to': {'x': 0.6, 'y': 0.33}},
    words(['THIS IS YOU'], 0.2, [0], size=0.11),
]

# 3  No way back: reaching up, the hole pulling from below.
NO_WAY_BACK = [
    {'kind': 'backdrop', 'inner': 'crimson', 'outer': 'denim', 'at': {'x': 0.5, 'y': 0.9}, 'rays': 16, 'deep': 0.75},
    hole(0.5, 1.0, 0.42),
    mascot(0.5, 0.8, 0.12, 'dread', pose='float'),
    words(['NO WAY', 'BACK'], 0.26, [1], size=0.13),
]

LOOKS = [
    ('terrified-close', TERRIFIED, "His terrified face huge before the glowing hole: YOU'D BE SPAGHETTI."),
    ('tiny-you', TINY, 'The hole enormous, him tiny at its edge, circled: THIS IS YOU.'),
    ('no-way-back', NO_WAY_BACK, 'Reaching up and away from the hole below: NO WAY BACK.'),
]
THUMBS = [{'id': name + '-tall', 'size': '9:16', 'why': why + ' Tall, a Short cover.', 'layers': layers}
          for name, layers, why in LOOKS]
io.open('F:/Video Studio/runs/2026-10-21-catch-look-test/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
