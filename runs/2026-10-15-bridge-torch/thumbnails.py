"""The thumbnails of "How to Get Four People Across a Bridge Before the Torch Dies". Writes thumbnails.json.

In the saved game theory design, "circled, in the room" (library/thumbnail-designs/game-theory-circled.py,
picked by Biku for Never Asked Out on 2026-10-15): the video's own place at night, huge words that
name the video, the ones who matter circled in red with an arrow, the one who lost apart in the dim.
Here the place is the gorge, the circled pair is the answer (the two slowest, walking together) and
the one apart is the Cheat, whose plan would have left the old man behind.

Run:  python runs/2026-10-15-bridge-torch/thumbnails.py
then: npm run thumbnail -- --run=2026-10-15-bridge-torch [--size=16:9]
"""
import importlib.util
import io
import json

spec = importlib.util.spec_from_file_location(
    'design', 'F:/Video Studio/library/thumbnail-designs/game-theory-circled.py')
design = importlib.util.module_from_spec(spec)
spec.loader.exec_module(design)

OLD = {'look': {'age': 'elder', 'identity': {'skinTone': 2, 'hair': 'short-crop', 'hairColor': 'white'},
                'outfit': {'clothes': {'top': {'kind': 'jacket', 'cloth': 'tan', 'under': 'cream'},
                                       'bottom': {'kind': 'trousers', 'cloth': 'brown'},
                                       'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}}
BAG = {'look': {'outfit': {'clothes': {'top': {'kind': 'shirt', 'cloth': 'cream'},
                                       'bottom': {'kind': 'skirt', 'cloth': 'brown'},
                                       'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}}

LOOKS = [
    ('who-walks-with-him', [('WHO WALKS', 'light'), ('WITH HIM?', 'gold')],
     "The video's own question: who should walk beside the old man?"),
    ('beat-the-torch', [('BEAT THE', 'light'), ('TORCH', 'gold')],
     'The race against the fire, in three words.'),
    ('seventeen-minutes', [('17 MINUTES', 'light'), ('TO CROSS', 'gold')],
     'The clock: seventeen minutes of fire for four people.'),
]

THUMBS = []
for size in ('9:16', '16:9'):
    for name, lines, why in LOOKS:
        t = design.circled(name + ('-tall' if size == '9:16' else ''), lines, 'gorge-bridge', 'storm-slate',
                           (OLD, BAG), 'cheat', size, why=why + (' Tall, for Reels and Shorts.' if size == '9:16' else ''))
        tall = size == '9:16'
        # The torch, burning, planted between the two who walk together: the clock of the story.
        torch = {'kind': 'thing', 'prop': 'torch-planted', 'x': 0.6 if tall else 0.76,
                 'y': 0.76 if tall else 0.92, 'head': 0.095 if tall else 0.19}
        layers = t['layers']
        at = max(i for i, l in enumerate(layers) if l['kind'] in ('person', 'extra'))
        layers.insert(at + 1, torch)
        if not tall:
            # The first lines here are long: the arrow comes from under the words, over the Cheat's head.
            arrow = next(l for l in layers if l['kind'] == 'mark' and l['shape'] == 'arrow')
            arrow['at'], arrow['to'] = {'x': 0.36, 'y': 0.5}, {'x': 0.55, 'y': 0.45}
        THUMBS.append(t)

io.open('F:/Video Studio/runs/2026-10-15-bridge-torch/thumbnails.json', 'w', encoding='utf8',
        newline='\n').write(json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
