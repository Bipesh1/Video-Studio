"""The thumbnails of "Why Every Screen Asks You for a Tip Now". Writes thumbnails.json.

In the saved What's the Catch? design, "circled" (library/thumbnail-designs/whats-the-catch.py,
picked by Biku for the popcorn video on 2026-10-15): huge words that name the video with one line
boxed, the thing the money is really made on circled in red with an arrow, the thing people
think they pay for crossed out, a small shocked figure. Here the circled thing is the tip screen
with its 20/25/30 buttons, and the crossed-out thing is the old usual tip, 15%. Three wordings
on the yellow page, and the first again in the video's own deep ocean colours.

Run:  python runs/2026-10-16-tip-screens/thumbnails.py
then: npm run thumbnail -- --run=2026-10-16-tip-screens [--size=9:16]
"""
import importlib.util
import io
import json

spec = importlib.util.spec_from_file_location('design', 'F:/Video Studio/library/thumbnail-designs/whats-the-catch.py')
design = importlib.util.module_from_spec(spec)
spec.loader.exec_module(design)

LOOKS = [
    ('why-every-screen', [('WHY EVERY SCREEN', 'ink'), ('WANTS A TIP', 'boxed')], 'yellow',
     "The video's own question, naming the thing everyone has seen."),
    ('the-tip-screen-trick', [('THE TIP', 'ink'), ('SCREEN', 'ink'), ('TRICK', 'boxed')], 'yellow',
     'The topic as a catch: the tip screen trick.'),
    ('twenty-is-the-new-cheap', [('20% IS THE', 'ink'), ('NEW "CHEAP"', 'boxed')], 'yellow',
     'The surprise in four words: the smallest button is no longer small.'),
    ('why-every-screen-dark', [('WHY EVERY SCREEN', 'ink'), ('WANTS A TIP', 'boxed')], 'dark',
     'Option 1 on the dark page, closer to the video\'s deep ocean look.'),
]

THUMBS = []
for size in ('16:9', '9:16'):
    for name, lines, colour, why in LOOKS:
        if colour == 'dark':
            lines = [(t, 'light' if s == 'ink' else 'gold') for t, s in lines]
        THUMBS.append(design.circled(name + ('-tall' if size == '9:16' else ''), lines, 'tip-screen', 'old-tip', size,
                                     colour=colour,
                                     why=why + (' Tall, for Reels and Shorts.' if size == '9:16' else '')))
        if colour == 'dark':
            for layer in THUMBS[-1]['layers']:
                if layer.get('name') == 'shocked':
                    layer['name'] = 'shocked-light'

io.open('F:/Video Studio/runs/2026-10-16-tip-screens/thumbnails.json', 'w', encoding='utf8', newline='\n').write(
    json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
