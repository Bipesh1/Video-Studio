"""The saved thumbnail design for animated short films: "two moods".

Biku, 2026-10-14, showing a short film's thumbnail (a picture cut on a slant, a dark figure
sitting alone on one side, a bright one with raised arms on the other, a note on the cut, the
title across the top): "can you make thumbnails like these for short films. save the design.
not exactly this but use your creativity to work on these and refine them".

The design, in the studio's own drawing:
  - the picture is cut in two along a leaning line: where the film starts, and where it ends
  - the same person stands on both sides: dim and small in themselves on the dark side, lit,
    cut out with a pale edge and with a light behind them on the bright side
  - one thing from the story lies on the cut, a little tipped (a note, a ticket, a letter)
  - the title runs across the top, two or three words, one of them in gold
  - the dark side has weather (rain); the bright side has rays of light
  - nothing to read in the lower right corner, where YouTube stamps the length

`two_moods(...)` builds one. The three below are samples on invented films, to show the range.

Run:   python library/thumbnail-designs/short-film-split.py
then:  npm run thumbnail -- --file=library/thumbnail-designs/short-film-split.json
"""
import io
import json

GROUND = 0.91


def someone(skin, hair, hair_colour, top, cloth, bottom='denim', shoes='steel'):
    """A person for a film that has no saved cast yet."""
    return {'identity': {'skinTone': skin, 'hair': hair, 'hairColor': hair_colour},
            'outfit': {'clothes': {'top': {'kind': top, 'cloth': cloth},
                                   'bottom': {'kind': 'trousers', 'cloth': bottom},
                                   'shoes': {'kind': 'sneakers', 'cloth': shoes}}}}


def figure(look, x, pose, face, facing, head=0.18, light=1.0, outline=0.0, effects=(), turn=0.3):
    return {'kind': 'extra', 'look': look, 'x': x, 'y': 0.5, 'ground': GROUND, 'head': head, 'pose': pose,
            'expression': face, 'facing': facing, 'turn': turn, 'light': light, 'outline': outline,
            'effects': list(effects), 'badge': False}


def two_moods(title, note, look, dark=('denim', 'steel'), bright=('gold', 'orange'), lean=0.13,
              low=('kneel', 'sad'), high=('hands-up', 'laughing'), note_paint='crimson'):
    """One thumbnail of the design. `title` is its lines (a word in *asterisks* is gold), `note`
    the lines written on the thing that lies on the cut."""
    d_in, d_out = dark
    b_in, b_out = bright
    return [
        {'kind': 'split', 'at': 0.5, 'lean': lean, 'seam': 0.008,
         'left': [
             {'kind': 'backdrop', 'inner': d_in, 'outer': d_out, 'at': {'x': 0.25, 'y': 0.55}, 'rays': 0,
              'deep': 0.75},
             {'kind': 'floor', 'y': GROUND, 'paint': d_out, 'deep': 0.6},
             {'kind': 'rain', 'count': 150, 'slant': 0.25, 'light': 0.45, 'seed': 3},
             figure(look, 0.25, low[0], low[1], 'right', light=0.72, effects=('tear-streams',)),
             {'kind': 'shade', 'from': 'left', 'reach': 0.2, 'strength': 0.6},
         ],
         'right': [
             {'kind': 'backdrop', 'inner': b_in, 'outer': b_out, 'at': {'x': 0.75, 'y': 0.58}, 'rays': 20,
              'deep': 0.35},
             {'kind': 'glow', 'at': {'x': 0.75, 'y': 0.58}, 'radius': 0.42, 'paint': 'cream', 'strength': 0.8},
             {'kind': 'floor', 'y': GROUND, 'paint': b_out, 'deep': 0.35},
             figure(look, 0.75, high[0], high[1], 'left', outline=0.035, turn=0.15),
         ]},
        {'kind': 'shade', 'from': 'top', 'reach': 0.32, 'strength': 0.75},
        {'kind': 'paper', 'lines': list(note), 'x': 0.5, 'y': 0.56, 'size': 0.075, 'paint': note_paint,
         'tilt': -7},
        {'kind': 'words', 'lines': list(title), 'gold': [], 'x': 0.5, 'bottom': 0.21, 'size': 0.17,
         'width': 0.9, 'justify': False},
    ]


WRITER = someone(3, 'short-crop', 'black', 'hoodie', 'forest')
RUNNER = someone(6, 'afro', 'black', 't-shirt', 'crimson', bottom='steel')
DREAMER = someone(2, 'ponytail', 'auburn', 'jacket', 'ocean', bottom='brown')

THUMBS = [
    {'id': 'one-letter', 'size': '16:9',
     'why': 'Sample 1. Night and rain against a gold morning, a letter on the cut: someone who was alone '
            'gets one letter and everything changes.',
     'layers': two_moods(['*ONE* LETTER'], ['DEAR', 'ME'], WRITER)},
    {'id': 'last-place', 'size': '16:9',
     'why': 'Sample 2. The same design in other colours and other feelings: a cold grey loss against a '
            'bright blue win, a race number on the cut.',
     'layers': two_moods(['LAST *PLACE*'], ['No. 47'], RUNNER, dark=('steel', 'steel'),
                         bright=('glint', 'ocean'), lean=-0.13, low=('look-down', 'exhausted'),
                         high=('wave', 'happy'), note_paint='ocean')},
    {'id': 'the-day-after', 'size': '16:9',
     'why': 'Sample 3. Warm against cool the other way round: a red dusk on the dark side, a green morning '
            'on the bright one, a ticket on the cut.',
     'layers': two_moods(['THE DAY *AFTER*'], ['ONE', 'WAY'], DREAMER, dark=('crimson', 'crimson'),
                         bright=('cream', 'forest'), low=('look-down', 'sad'), high=('open-arms', 'happy'),
                         note_paint='forest')},
]

OUT = 'F:/Video Studio/library/thumbnail-designs/short-film-split.json'
io.open(OUT, 'w', encoding='utf8', newline='\n').write(
    json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'thumbnails')
