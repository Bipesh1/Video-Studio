"""The thumbnails of "Why Is the Water in Your Glass Older Than the Sun?". Writes thumbnails.json.

Each in a layout of its own, built from what only this story has (Biku, 2026-10-18: "it should be
different based on what the video is", for both channels). The style of What's the Catch? is kept:
huge heavy words that name it, one line gold or boxed, a red mark on the thing that matters. The
pictures are the video's own world (the journey world `water`), drawn as the video draws it.

  Biku, 2026-10-18: the main topic is water and the Sun, so every option shows both in one picture
  with the title the video is about ("your water is older than the sun").

  1  in front       the glass of water standing in front of the blazing Sun, rays behind
  2  side by side   the glass and the Sun on a dark page, the glass circled, the words below
  3  two worlds     the video's own kitchen glass beside its own Sun, cut along a leaning line

Run:  python runs/2026-10-18-water-older-than-sun/thumbnails.py
then: npm run thumbnail -- --run=2026-10-18-water-older-than-sun --size=9:16
"""
import io
import json


def world(at, keep=()):
    return {'kind': 'journey', 'world': 'water', 'at': at, 'fly': 'start', 'keep': list(keep), 'show': []}


def picture(g, x=0.5, y=0.5, size=1.0):
    return {'kind': 'graphic', 'graphic': g, 'x': x, 'y': y, 'size': size}


def headline(lines, top, size=0.1, x=0.06, width=0.88):
    return {'kind': 'headline', 'lines': [{'text': t, 'style': s} for t, s in lines], 'x': x, 'top': top,
            'size': size, 'width': width}


WORDS = [("YOUR WATER'S", 'light'), ('OLDER THAN', 'light'), ('THE SUN', 'gold')]

# 1  The glass standing in front of the blazing Sun.
IN_FRONT = [
    {'kind': 'backdrop', 'inner': 'orange', 'outer': 'denim', 'at': {'x': 0.5, 'y': 0.52}, 'rays': 20, 'deep': 0.65},
    {'kind': 'icon', 'name': 'sun-blaze', 'x': 0.5, 'y': 0.54, 'size': 0.62},
    {'kind': 'icon', 'name': 'water-glass', 'x': 0.5, 'y': 0.76, 'size': 0.42},
    {'kind': 'shade', 'from': 'top', 'reach': 0.34, 'strength': 0.75},
    headline(WORDS, 0.04, size=0.1),
]

# 2  Side by side, the glass circled: the small thing is the older one.
SIDE_BY_SIDE = [
    {'kind': 'flat', 'colour': 'dark'},
    {'kind': 'icon', 'name': 'water-glass', 'x': 0.27, 'y': 0.36, 'size': 0.3},
    {'kind': 'icon', 'name': 'sun-blaze', 'x': 0.72, 'y': 0.35, 'size': 0.44},
    {'kind': 'mark', 'shape': 'circle', 'at': {'x': 0.27, 'y': 0.36}, 'rx': 0.2, 'ry': 0.19},
    headline(WORDS, 0.6, size=0.1),
]

# 3  The video's own world cut in two: the glass in your kitchen, the Sun in space.
SPLIT = [
    {'kind': 'split', 'at': 0.5, 'lean': 0.12, 'seam': 0.012,
     'left': [picture(world('glass', ('drop',)), x=0.3, y=0.62, size=1.25)],
     'right': [picture(world('sun', ('sun',)), x=0.78, y=0.6, size=1.0)]},
    {'kind': 'shade', 'from': 'top', 'reach': 0.42, 'strength': 0.85},
    headline(WORDS, 0.05, size=0.095),
    {'kind': 'mark', 'shape': 'circle', 'at': {'x': 0.3, 'y': 0.6}, 'rx': 0.19, 'ry': 0.15},
]

LOOKS = [
    ('in-front-of-the-sun', IN_FRONT, 'The glass of water standing in front of the blazing Sun.'),
    ('side-by-side', SIDE_BY_SIDE, 'The glass and the Sun side by side, the glass circled as the older one.'),
    ('kitchen-and-space', SPLIT, "The video's own world cut in two: your glass in the kitchen, the Sun in space."),
]
THUMBS = [{'id': name + '-tall', 'size': '9:16', 'why': why + ' Tall, for Reels and Shorts.', 'layers': layers}
          for name, layers, why in LOOKS]
io.open('F:/Video Studio/runs/2026-10-18-water-older-than-sun/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
