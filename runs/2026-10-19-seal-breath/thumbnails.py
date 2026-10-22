"""The thumbnails of "Could Humans Evolve to Hold Their Breath Like Seals?". Writes thumbnails.json.

Wide (16:9), for YouTube (Biku, 2026-10-19: "this should be 16:9 i will put it in youtube video
not shorts"). Each in a layout of its own, built from what only this story has (Biku,
2026-10-18: "it should be different based on what the video is"). The style of What's the
Catch? is kept: huge heavy words, one line gold or boxed, a red mark on the thing that matters,
nothing to read in the lower right where YouTube stamps the length. The pictures are the
video's own world (the journey world `dive`), drawn as the video draws it.

  1  you and the seal   cut in two: you under the bathwater, a seal with its spleen glowing
  2  the diver          a Bajau diver on the reef among the fish, circled
  3  the scan           the two spleens side by side on the scan, the bigger one circled

Run:  python runs/2026-10-19-seal-breath/thumbnails.py
then: npm run thumbnail -- --run=2026-10-19-seal-breath --size=16:9
"""
import io
import json


def world(at, keep=()):
    return {'kind': 'journey', 'world': 'dive', 'at': at, 'fly': 'start', 'keep': list(keep), 'show': []}


def picture(g, x=0.5, y=0.5, size=1.0):
    return {'kind': 'graphic', 'graphic': g, 'x': x, 'y': y, 'size': size}


def headline(lines, top, size=0.13, x=0.04, width=0.6):
    return {'kind': 'headline', 'lines': [{'text': t, 'style': s} for t, s in lines], 'x': x, 'top': top,
            'size': size, 'width': width}


def circle(x, y, rx, ry):
    return {'kind': 'mark', 'shape': 'circle', 'at': {'x': x, 'y': y}, 'rx': rx, 'ry': ry}


# 1  You and the seal: the picture cut in two, the words across the top.
YOU_AND_SEAL = [
    {'kind': 'split', 'at': 0.5, 'lean': 0.08, 'seam': 0.012,
     'left': [picture(world('rise'), x=0.26, y=0.72, size=1.45)],
     'right': [picture(world('seal', ('seal-spleen',)), x=0.75, y=0.62, size=1.7)]},
    {'kind': 'shade', 'from': 'top', 'reach': 0.42, 'strength': 0.85},
    # Biku, 2026-10-20, of COULD YOU EVOLVE THIS?: "nobody understands anything from that question".
    # The words say the topic plainly; the picture shows which side is you and which the seal.
    headline([('HOLD YOUR BREATH', 'light'), ('LIKE A SEAL?', 'gold')], 0.05, size=0.14, width=0.9),
]

# 2  The diver: a Bajau diver among the fish, the words to the left.
DIVER = [
    picture(world('reef', ('diver', 'fish')), x=0.8, y=0.56, size=1.9),
    {'kind': 'shade', 'from': 'left', 'reach': 0.5, 'strength': 0.85},
    headline([('SEA NOMADS', 'light'), ('EVOLVED TO DIVE', 'gold')], 0.12, size=0.15, width=0.55),
    circle(0.7, 0.48, 0.11, 0.17),
]

# 3  The scan: the two spleens, the bigger one circled.
SCAN = [
    picture(world('scan-close', ('bajau-spleen', 'saluan-spleen')), x=0.5, y=0.74, size=1.8),
    {'kind': 'shade', 'from': 'top', 'reach': 0.38, 'strength': 0.85},
    headline([('SEA NOMADS HAVE', 'light'), ('BIGGER SPLEENS', 'gold')], 0.04, size=0.12, width=0.9),
    circle(0.31, 0.52, 0.13, 0.15),
]

LOOKS = [
    ('you-and-the-seal', YOU_AND_SEAL, 'Cut in two: you under the bathwater, a seal with its spleen glowing.'),
    ('the-diver', DIVER, 'A Bajau diver on the reef among the fish, circled.'),
    ('the-scan', SCAN, 'The two spleens side by side on the scan, the bigger one circled.'),
]
THUMBS = [{'id': name + '-wide', 'size': '16:9', 'why': why + ' Wide, for YouTube.', 'layers': layers}
          for name, layers, why in LOOKS]
io.open('F:/Video Studio/runs/2026-10-19-seal-breath/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
