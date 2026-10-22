"""The thumbnails of "Why Is the Sun Already Gone When You Watch It Set?". Writes thumbnails.json.

Each in a layout of its own, built from what only this story has (Biku, 2026-10-18: "it should be
different based on what the video is", for both channels), and, as he asked of the water video,
the Sun and the sea in one picture with the title the video is about. The style of What's the
Catch? is kept: huge heavy words, one line gold, a red mark on the thing that matters. The
pictures are the video's own world (the journey world `sunset`), drawn as the video draws it.

  1  caught         you on the beach, the Sun you see above the sea, the real one dashed below it,
                    circled in red
  2  your phone     the sunset on your phone screen, the real Sun a ghost under the sea line, an
                    arrow to it ("replay" was dropped: the picture is lifted by the air, not late)
  3  see / really   the picture cut in two and labelled: the Sun as you see it, where it really is

Run:  python runs/2026-10-18-sunset-already-gone/thumbnails.py
then: npm run thumbnail -- --run=2026-10-18-sunset-already-gone --size=9:16
"""
import io
import json


def world(at, keep=()):
    return {'kind': 'journey', 'world': 'sunset', 'at': at, 'fly': 'start', 'keep': list(keep), 'show': []}


def picture(g, x=0.5, y=0.5, size=1.0):
    return {'kind': 'graphic', 'graphic': g, 'x': x, 'y': y, 'size': size}


def headline(lines, top, size=0.1, x=0.06, width=0.88):
    return {'kind': 'headline', 'lines': [{'text': t, 'style': s} for t, s in lines], 'x': x, 'top': top,
            'size': size, 'width': width}


# 1  Caught: the Sun you see, and the real one already under the sea.
CAUGHT = [
    picture(world('below', ('ride', 'straight-back', 'real-sun')), y=0.56, size=1.2),
    {'kind': 'shade', 'from': 'top', 'reach': 0.36, 'strength': 0.85},
    headline([('THIS SUN IS', 'light'), ('ALREADY GONE', 'gold')], 0.05, size=0.1),
    {'kind': 'mark', 'shape': 'circle', 'at': {'x': 0.79, 'y': 0.52}, 'rx': 0.14, 'ry': 0.085},
]

# 2  Your phone: the sunset you are filming, its real Sun a ghost below the sea line.
PHONE = [
    picture(world('screen', ('ghost',)), y=0.55, size=1.1),
    {'kind': 'shade', 'from': 'top', 'reach': 0.3, 'strength': 0.8},
    headline([("YOUR PHOTO'S SUN", 'light'), ('IS ALREADY', 'light'), ('GONE', 'gold')], 0.04, size=0.085),
    {'kind': 'mark', 'shape': 'arrow', 'at': {'x': 0.12, 'y': 0.5}, 'to': {'x': 0.47, 'y': 0.64}},
]

# 3  Two sides, labelled: the Sun as you see it, and where it really is.
SEE_REALLY = [
    {'kind': 'split', 'at': 0.5, 'lean': 0.1, 'seam': 0.01,
     'left': [picture(world('sea', ('shimmer',)), x=0.02, y=0.57, size=1.15)],
     'right': [picture(world('gap', ('real-sun',)), x=0.5, y=0.57, size=1.15)]},
    {'kind': 'shade', 'from': 'top', 'reach': 0.32, 'strength': 0.85},
    headline([("THE SUN'S", 'light'), ('NOT THERE', 'gold')], 0.05, size=0.1),
    {'kind': 'tag', 'text': 'SEEN', 'x': 0.24, 'y': 0.84, 'size': 0.04, 'paint': 'cream', 'tilt': -4},
    {'kind': 'mark', 'shape': 'circle', 'at': {'x': 0.75, 'y': 0.56}, 'rx': 0.11, 'ry': 0.065},
    {'kind': 'tag', 'text': 'REAL', 'x': 0.76, 'y': 0.84, 'size': 0.04, 'paint': 'gold', 'tilt': 4},
]

LOOKS = [
    ('caught', CAUGHT, 'You on the beach: the Sun you see above the sea, the real one dashed below it, circled.'),
    ('your-phone', PHONE, 'The sunset on your phone, its real Sun a ghost under the sea line, an arrow to it.'),
    ('see-and-really', SEE_REALLY, 'Cut in two and labelled: the Sun as you see it, and where it really is.'),
]
THUMBS = [{'id': name + '-tall', 'size': '9:16', 'why': why + ' Tall, for Reels and Shorts.', 'layers': layers}
          for name, layers, why in LOOKS]
io.open('F:/Video Studio/runs/2026-10-18-sunset-already-gone/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
