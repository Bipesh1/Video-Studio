"""The thumbnails of "Why Does Cinema Popcorn Cost Ten Dollars?", the first video of What's the Catch?

Second round, after the reference Biku gave on 2026-10-15 ("thumbnails should be designed like
this", a wide "THE REAL PRODUCT" picture): a flat yellow page, huge heavy words from the left
with one line white on a black box, the popcorn bucket big and circled in red, a red arrow from
the words to it, the ticket crossed out, a small shocked stick figure. The first round (rays and
explainer graphics) is replaced. The words are this video's own.

Run:  python runs/2026-10-15-popcorn/thumbnails.py
then: npm run thumbnail -- --run=2026-10-15-popcorn [--size=9:16]
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


LOOKS = [
    # The words name the video (Biku, 2026-10-15: "the text there should actually say something
    # about the video"), as the video's own title does.
    ('why-popcorn-costs-10', [('WHY POPCORN', 'ink'), ('COSTS $10', 'boxed')], 'yellow',
     'The video\'s own question, in four words: why popcorn costs $10.'),
    ('the-10-popcorn', [('THE $10', 'boxed'), ('POPCORN', 'ink'), ('EXPLAINED', 'ink')], 'yellow',
     'The video as a topic: the $10 popcorn, explained.'),
    ('why-is-popcorn-10', [('WHY IS POPCORN', 'ink'), ('$10?', 'boxed')], 'background',
     'The question with the price large, on the channel\'s own warm page.'),
]

THUMBS = []
for name, lines, colour, why in LOOKS:
    tall_size = 0.105 if len(lines) == 2 else 0.085
    THUMBS.append({'id': name + '-tall', 'size': '9:16', 'why': why + ' Tall, for Reels and Shorts.', 'layers': [
        {'kind': 'flat', 'colour': colour},
        headline(lines, 0.07, 0.06, tall_size, 0.86),
        icon('ticket', 0.2, 0.9, 0.15, turn=-12, crossed=True),
        icon('shocked', 0.13, 0.6, 0.2),
        icon('bucket', 0.62, 0.62, 0.36),
        circle(0.62, 0.61, 0.36, 0.22),
        arrow(0.3, 0.37 if len(lines) == 2 else 0.42, 0.45, 0.44),
    ]})
for name, lines, colour, why in LOOKS:
    wide_size = 0.22 if len(lines) == 2 else 0.18
    THUMBS.append({'id': name, 'size': '16:9', 'why': why, 'layers': [
        {'kind': 'flat', 'colour': colour},
        headline(lines, 0.04, 0.07, wide_size, 0.45 if len(lines) == 2 else 0.5),
        icon('ticket', 0.15, 0.8, 0.36, turn=-12, crossed=True),
        icon('shocked', 0.47 if len(lines) == 2 else 0.5, 0.75 if len(lines) == 2 else 0.8,
             0.44 if len(lines) == 2 else 0.34),
        icon('bucket', 0.78, 0.55, 0.74),
        circle(0.78, 0.54, 0.215, 0.45),
        arrow(0.535 if len(lines) == 2 else 0.5, 0.11 if len(lines) == 2 else 0.17, 0.63, 0.28),
    ]})

io.open('F:/Video Studio/runs/2026-10-15-popcorn/thumbnails.json', 'w', encoding='utf8', newline='\n').write(
    json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
