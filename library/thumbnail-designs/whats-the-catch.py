"""The saved thumbnail design for What's the Catch? (the `fine-print` page): "circled".

Biku, 2026-10-15, showing a wide reference ("thumbnails should be designed like this although
this is wide its a reference for the style"), then on the first tries: "the text there should
actually say something about the video" and "make popcorn seem like a popcorn". He picked
THE $10 / POPCORN / EXPLAINED for the popcorn video.

The design, in the channel's own drawing (styles/fine-print):
  - one flat page colour, yellow by default (the channel's warm page also works)
  - huge heavy words from the top left that name the video, the way its title does: two or
    three lines, one of them light on a dark box (usually the price or the number)
  - the thing the money is really made on, drawn big and clearly what it is, circled in red
  - a red arrow from the words to it
  - the thing people think they pay for, small and crossed out in red
  - a small shocked stick figure between them
  - nothing to read in the lower right corner, where YouTube stamps the length

`circled(...)` builds one in either shape. The things are the poster's `icon` layer
(`engine/src/explainer/ThumbParts.tsx`); a new video draws its own two things there first
(for the ink video: a printer and an ink cartridge).

Run:   python library/thumbnail-designs/whats-the-catch.py
then:  npm run thumbnail -- --file=library/thumbnail-designs/whats-the-catch.json [--size=9:16]
"""
import io
import json


def headline(lines, x, top, size, width):
    return {'kind': 'headline', 'lines': [{'text': t, 'style': s} for t, s in lines], 'x': x, 'top': top,
            'size': size, 'width': width}


def icon(name, x, y, size, turn=0, crossed=False):
    return {'kind': 'icon', 'name': name, 'x': x, 'y': y, 'size': size, 'turn': turn, 'crossed': crossed}


def circle(x, y, rx, ry):
    return {'kind': 'mark', 'shape': 'circle', 'at': {'x': x, 'y': y}, 'rx': rx, 'ry': ry}


def arrow(fx, fy, tx, ty):
    return {'kind': 'mark', 'shape': 'arrow', 'at': {'x': fx, 'y': fy}, 'to': {'x': tx, 'y': ty}}


def circled(id, lines, hero, loser, size='16:9', colour='yellow', why=''):
    """lines: [(words, 'ink' | 'boxed' | 'red')]; hero: the thing circled; loser: the one crossed."""
    two = len(lines) == 2
    if size == '9:16':
        layers = [
            {'kind': 'flat', 'colour': colour},
            headline(lines, 0.07, 0.06, 0.105 if two else 0.085, 0.86),
            icon(loser, 0.2, 0.9, 0.15, turn=-12, crossed=True),
            icon('shocked', 0.13, 0.6, 0.2),
            icon(hero, 0.62, 0.62, 0.36),
            circle(0.62, 0.61, 0.36, 0.22),
            arrow(0.3, 0.37 if two else 0.42, 0.45, 0.44),
        ]
    else:
        layers = [
            {'kind': 'flat', 'colour': colour},
            headline(lines, 0.04, 0.07, 0.22 if two else 0.18, 0.45 if two else 0.5),
            icon(loser, 0.15, 0.8, 0.36, turn=-12, crossed=True),
            icon('shocked', 0.47 if two else 0.5, 0.75 if two else 0.8, 0.44 if two else 0.34),
            icon(hero, 0.78, 0.55, 0.74),
            circle(0.78, 0.54, 0.215, 0.45),
            arrow(0.535 if two else 0.5, 0.11 if two else 0.17, 0.63, 0.28),
        ]
    return {'id': id, 'size': size, 'why': why, 'layers': layers}


# The one he picked, in both shapes, as the sample.
PICKED = [('THE $10', 'boxed'), ('POPCORN', 'ink'), ('EXPLAINED', 'ink')]
THUMBS = [
    circled('popcorn', PICKED, 'bucket', 'ticket', '16:9',
            why='Picked by Biku for the popcorn video, 2026-10-15.'),
    circled('popcorn-tall', PICKED, 'bucket', 'ticket', '9:16',
            why='The same, tall, for Reels and Shorts.'),
]

io.open('F:/Video Studio/library/thumbnail-designs/whats-the-catch.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
