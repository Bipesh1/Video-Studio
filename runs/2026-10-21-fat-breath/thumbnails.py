"""Covers for "Where Does Your Fat Go When You Lose Weight?". Writes thumbnails.json.

Biku's package: "A person breathing out a big, bright, visible cloud, close up, the cloud filling
half the frame. Words: YOU BREATHE IT OUT". In the cover style he picked on 2026-10-21 (style 1,
the face over the subject) and the studio's rules (knowledge/playbooks/thumbnails.md): a poster
brighter than the video, one subject big in the middle band (Shorts shelves crop the edges), the
mascot's face about a third of the frame with a pale edge, the words in the heavy lettering with
one line gold, nothing to read in the corners. The same design goes into the Short as a frame to
pick, since custom covers are limited.

  1  face and cloud     his face low at the left, the big cloud beside it, on blue
  2  warm               the same on a warm red and gold ground, his jaw dropped
  3  facing in          his face at the right turned in, the cloud on the left, on dark blue

Run:  python runs/2026-10-21-fat-breath/thumbnails.py
then: npm run thumbnail -- --run=2026-10-21-fat-breath --size=9:16
"""
import io
import json

MASCOT = {'identity': {'skinTone': 4, 'hair': 'afro', 'hairColor': 'black'},
          'outfit': {'clothes': {'top': {'kind': 'hoodie', 'cloth': 'ocean'},
                                 'bottom': {'kind': 'trousers', 'cloth': 'tan'},
                                 'shoes': {'kind': 'sneakers', 'cloth': 'white'}}}}


def mascot(x, ground, head, face, facing='right', pose='stand', turn=0.25):
    return {'kind': 'extra', 'x': x, 'y': 0.5, 'ground': ground, 'head': head, 'pose': pose, 'facing': facing,
            'turn': turn, 'expression': face, 'look': MASCOT, 'light': 1, 'outline': 0.07}


def words(lines, bottom, gold, size=0.1, width=0.9):
    return {'kind': 'words', 'lines': lines, 'gold': gold, 'bottom': bottom, 'size': size, 'width': width,
            'justify': True}


def cloud(x, y, head):
    return {'kind': 'thing', 'prop': 'breath-cloud', 'x': x, 'y': y, 'head': head}


# Close up: head and shoulders, the face low in the middle band, the words at the top, the cloud
# beside the face and above it, its trail ending at the mouth (never over the face: a cloud over
# the head would read as a thought).
FACE_AND_CLOUD = [
    {'kind': 'backdrop', 'inner': 'gold', 'outer': 'ocean', 'at': {'x': 0.66, 'y': 0.5}, 'rays': 18, 'deep': 0.6},
    mascot(0.24, 1.42, 0.26, 'surprised', turn=0.75),
    cloud(0.74, 0.62, 0.33),
    words(['YOU BREATHE', 'IT OUT'], 0.25, [1], size=0.11),
]
WARM = [
    {'kind': 'backdrop', 'inner': 'gold', 'outer': 'crimson', 'at': {'x': 0.66, 'y': 0.5}, 'rays': 18, 'deep': 0.6},
    mascot(0.24, 1.42, 0.26, 'jaw-drop', turn=0.75),
    cloud(0.74, 0.62, 0.33),
    words(['YOU BREATHE', 'IT OUT'], 0.25, [1], size=0.11),
]
FACING_IN = [
    {'kind': 'backdrop', 'inner': 'glint', 'outer': 'denim', 'at': {'x': 0.34, 'y': 0.5}, 'rays': 20, 'deep': 0.75},
    mascot(0.76, 1.42, 0.26, 'surprised', facing='left', turn=0.75),
    dict(cloud(0.26, 0.62, 0.33), flip=True),
    words(['YOU BREATHE', 'IT OUT'], 0.25, [0], size=0.11),
]

# Round two (Biku, 2026-10-21: "the drawing of the thumbnail isn't good. it should be shown in a
# way that catches the viewer's attention"; he asked for ideas 1 and 2): one surprising picture
# each, the fat drawn yellow so it reads as fat, a dark ground so it glows, one red mark.
BURGER_BREATH = [
    {'kind': 'backdrop', 'inner': 'gold', 'outer': 'denim', 'at': {'x': 0.68, 'y': 0.58}, 'rays': 18, 'deep': 0.85},
    mascot(0.24, 1.42, 0.26, 'jaw-drop', turn=0.75),
    {'kind': 'thing', 'prop': 'food-breath-cloud', 'x': 0.74, 'y': 0.6, 'head': 0.36},
    words(['YOU BREATHE', 'IT OUT'], 0.25, [1], size=0.11),
]
XRAY = [
    {'kind': 'backdrop', 'inner': 'cream', 'outer': 'denim', 'at': {'x': 0.52, 'y': 0.47}, 'rays': 14, 'deep': 0.9},
    {'kind': 'thing', 'prop': 'xray-fat', 'x': 0.4, 'y': 0.7, 'head': 0.62},
    {'kind': 'mark', 'shape': 'circle', 'at': {'x': 0.585, 'y': 0.505}, 'rx': 0.1, 'ry': 0.055},
    words(['IT LEAVES', 'THROUGH HERE'], 0.25, [1], size=0.11),
]

LOOKS = [
    ('burger-breath', BURGER_BREATH, 'He breathes out a cloud full of burgers, fries, pizza and a doughnut, on dark blue.'),
    ('xray', XRAY, 'See through him: the yellow fat in his belly rises up and out of his mouth, circled.'),
]
THUMBS = [{'id': name + '-tall', 'size': '9:16', 'why': why + ' Tall, a Short cover.', 'layers': layers}
          for name, layers, why in LOOKS]
io.open('F:/Video Studio/runs/2026-10-21-fat-breath/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
