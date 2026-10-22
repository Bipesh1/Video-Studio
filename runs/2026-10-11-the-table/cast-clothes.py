"""Clothes for the game theory cast: three numbered looks, side by side, for Biku to pick from.

Biku, 2026-10-14: "can you make all this guys who actually appear in there all wear clothes".
Until now the Cheat, the Saint, the Copycat and You were bare stick figures with one accessory
each, the Trainer had a jacket and bare stick legs, and the row at the back wore nothing.

Each of them keeps what makes them themselves: the Cheat his red striped tie, the Saint her
glasses and sky-blue scarf, the Copycat his orange beanie, You the green cap, the Trainer his
grey suit and gold tie. Heads stay as they are. Nothing on their cards is changed by this file:
the cards change, and their versions go up, when he has picked.

Run:   python runs/2026-10-11-the-table/cast-clothes.py
then:  npm run thumbnail -- --file=runs/2026-10-11-the-table/cast-clothes.json
"""
import io
import json

ROOM = {'kind': 'room', 'place': 'the-table', 'palette': 'table-grey'}
GROUND = 0.93


def clothes(top=None, cloth=None, under=None, bottom=None, shoes=None, dress=None, skirt=None, **more):
    c = dict(more)
    if dress:
        c['onePiece'] = {'kind': 'dress', 'cloth': dress}
    if top:
        c['top'] = {'kind': top, 'cloth': cloth, **({'under': under} if under else {})}
    if skirt:
        c['bottom'] = {'kind': 'skirt', 'cloth': skirt}
    elif bottom:
        c['bottom'] = {'kind': 'trousers', 'cloth': bottom}
    if shoes:
        c['shoes'] = {'kind': shoes[0], 'cloth': shoes[1]}
    return {'outfit': {'clothes': c}}


# What each of them always wears.
TIE = {'tie': {'cloth': 'crimson', 'stripe': 'gold'}}
SCARF = {'glasses': True, 'scarf': {'cloth': 'glint'}}
BEANIE = {'hat': {'kind': 'beanie', 'cloth': 'orange'}}
CAP = {'hat': {'kind': 'cap', 'cloth': 'forest'}}
GOLD_TIE = {'tie': {'cloth': 'gold'}}
TRAINER_FACE = {'identity': {'skinTone': 1, 'hair': 'short-crop', 'hairColor': 'black'}}
SUIT = {**TRAINER_FACE, **clothes('jacket', 'steel', 'white', 'steel', ('boots', 'brown'), **GOLD_TIE)}

LOOKS = {
    # 1: plain and quiet. White and grey clothes, so the one coloured thing each wears stands out.
    1: {'cheat': clothes('shirt', 'white', bottom='steel', shoes=('boots', 'brown'), **TIE),
        'saint': clothes('shirt', 'white', skirt='steel', shoes=('boots', 'brown'), **SCARF),
        'copycat': clothes('t-shirt', 'white', bottom='denim', shoes=('sneakers', 'steel'), **BEANIE),
        'you': clothes('t-shirt', 'white', bottom='denim', shoes=('sneakers', 'steel'), **CAP),
        'row': clothes('shirt', 'white', bottom='steel', shoes=('boots', 'steel'))},
    # 2: each in a colour of their own, the same family as their accessory.
    2: {'cheat': clothes('jacket', 'brown', 'white', 'steel', ('boots', 'brown'), **TIE),
        'saint': clothes(dress='cream', shoes=('boots', 'tan'), **SCARF),
        'copycat': clothes('hoodie', 'orange', bottom='denim', shoes=('sneakers', 'steel'), **BEANIE),
        'you': clothes('hoodie', 'forest', bottom='denim', shoes=('sneakers', 'steel'), **CAP),
        'row': clothes('hoodie', 'steel', bottom='steel', shoes=('sneakers', 'steel'))},
    # 3: smarter and darker, closer to the Trainer's world.
    3: {'cheat': clothes('jacket', 'denim', 'white', 'denim', ('boots', 'brown'), **TIE),
        'saint': clothes('shirt', 'cream', skirt='ocean', shoes=('boots', 'brown'), **SCARF),
        'copycat': clothes('jacket', 'tan', 'white', 'brown', ('boots', 'brown'), **BEANIE),
        'you': clothes('shirt', 'forest', bottom='steel', shoes=('sneakers', 'steel'), **CAP),
        'row': clothes('jacket', 'steel', 'white', 'steel', ('boots', 'steel'))},
}

# Who stands where, with the face their card gives them.
ORDER = [('cheat', 'smug', 'right', 1.0, 1.0), ('saint', 'happy', 'right', 1.0, 1.0),
         ('trainer', 'bored', 'right', 1.06, 1.0), ('copycat', 'neutral', 'left', 1.0, 1.0),
         ('you', 'neutral', 'left', 1.0, 1.0), ('row', 'neutral', 'left', 1.0, 0.62)]


def lineup(n):
    layers = [ROOM]
    for i, (who, face, facing, size, light) in enumerate(ORDER):
        look = SUIT if who == 'trainer' else LOOKS[n][who]
        layers.append({'kind': 'extra', 'look': look, 'x': 0.1 + 0.16 * i, 'y': 0.5, 'ground': GROUND,
                       'head': 0.17 * size, 'pose': 'stand', 'expression': face, 'facing': facing, 'turn': 0.3,
                       'light': light, 'badge': who == 'row'})
    layers.append({'kind': 'words', 'lines': [f'LOOK {n}'], 'gold': [0], 'x': 0.5, 'bottom': 0.16, 'size': 0.11,
                   'width': 0.5})
    return layers


THUMBS = [{'id': f'look-{n}', 'size': '16:9',
           'why': 'The Cheat, the Saint, the Trainer, the Copycat, You and one of the row at the back, dressed.',
           'layers': lineup(n)} for n in (1, 2, 3)]

io.open('F:/Video Studio/runs/2026-10-11-the-table/cast-clothes.json', 'w', encoding='utf8', newline='\n').write(
    json.dumps({'version': 1, 'thumbnails': THUMBS}, indent=2, ensure_ascii=False) + '\n')
print(len(THUMBS), 'looks')
