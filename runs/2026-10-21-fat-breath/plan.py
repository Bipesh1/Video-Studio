"""The shot plan of "Where Does Your Fat Go When You Lose Weight?": writes storyboard.json.

One journey through the world `body` (engine/src/explainer/BodyWorld.tsx), as Biku's script lays it
out: "One body and one bathroom. The camera starts on the scale, dives into the belly, opens a fat
cell, opens its drop of oil, follows the leftovers through the blood to the lungs, flies out of the
mouth into the room, and comes back down to the scale." The bathroom is one room of a house set on
the stage of a hall, so the camera can pull back from the scale over the experts, and fly on to the
gym, the giant balance and the sofa without a cut. The mascot (design 1, look C) is you.

Every [FLY], [OPEN] and [CALLOUT] of his script is one shot, with its things on his words; a line
whose picture changes halfway (l05) is cut in two at its comma.

Run:  npm run plan -- draft --run=2026-10-21-fat-breath   (keep it as storyboard.draft.json)
      python runs/2026-10-21-fat-breath/plan.py
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-21-fat-breath/'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINE = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}
Q, MOMENT, LOOPS, CATCH, PROOF, PAYOFF = ('the-question', 'the-moment', 'follow-the-money', 'the-trick',
                                          'the-proof', 'your-move')
MOODS = {Q: 'curious', MOMENT: 'curious', LOOPS: 'upbeat', CATCH: 'curious', PROOF: 'reflective', PAYOFF: 'hope'}


def title(a, b=None, stress=None, now=False):
    t = {'lines': [a] + ([b] if b else [])}
    if now:
        t['now'] = True
    if stress is not None:
        t['stress'] = stress
    return t


def g(at, frm=None, keep=(), show=(), callout=None, t=None, fly='start'):
    out = {'kind': 'journey', 'world': 'body', 'at': at, 'fly': fly, 'keep': list(keep),
           'show': [{'item': s[0], 'on': s[1]} if isinstance(s, tuple) else {'item': s} for s in show]}
    if frm and frm != at:
        out['from'] = frm
    if callout:
        value, caption, anchor, on = callout
        out['callout'] = {'value': value, 'caption': caption, 'at': anchor, 'on': on}
    if t:
        out['title'] = t
    return out


def words(lid, a):
    """A line cut in two: the words of the first shot, and of the second (the rest)."""
    text = LINE[lid]['text']
    assert text.startswith(a), (lid, a)
    return a, text[len(a):].strip()


L05 = words('l05', 'Inside your belly, fat sits in tiny fat cells,')
BLOCKS = ('fat-block', 'oxygen-block', 'gas-block', 'water-block')
SHOTS = [
    # 1. The hook: your feet on the scale, the number dropping, the fat lifting off and gone; back
    # over the hall of experts, most of them wrong.
    ('l01', None, g('scale', show=[('readout', 'scale'), ('fat-blob', 'fat')],
                    t=title('WHERE DID', 'THE FAT GO?', 1, now=True))),
    ('l02', None, g('hall', 'scale', keep=('readout', 'fat-blob'),
                    show=[('doctors', 'doctors'), ('dietitians', 'dietitians'), ('trainers', 'trainers'),
                          ('wrong', 'wrong')], t=title('150 EXPERTS', 'ASKED', 0))),
    # 2. The moment: their answers on signs, one pointing at the toilet; back to the blob of fat
    # over the scale, into it until it breaks into atoms.
    ('l03', None, g('crowd', 'hall', keep=('readout', 'fat-blob', 'wrong'),
                    show=[('energy', 'energy'), ('heat', 'heat'), ('muscle', 'muscle'), ('toilet', 'toilet')])),
    ('l04', None, g('atoms', 'crowd', keep=('readout', 'fat-blob'), show=[('atoms', 'atoms')])),
    # 3. The loops: into your belly, a fat cell and its oil, the oil's atoms, the breath in.
    ('l05', L05[0], g('belly', 'atoms', keep=('atoms', 'fat-blob'), show=[('cells', 'cells')])),
    ('l05', L05[1], g('cell', 'belly', keep=('cells',), show=[('oil', 'oil')])),
    ('l06', None, g('chain', 'cell', keep=('cells', 'oil'),
                    show=[('carbon', 'carbon'), ('hydrogen', 'hydrogen'), ('oxygen', 'oxygen')],
                    t=title('FAT IS MADE OF'))),
    ('l07', None, g('nose', 'chain', keep=('cells', 'oil'), show=[('inhale', 'breathe')])),
    ('l08', None, g('lungs', 'nose', keep=('cells', 'oil', 'inhale'), show=[('barbell', 'lifting')],
                    callout=('2.9 KG', 'OXYGEN PER / KILO OF FAT', 'lungs', 'three'))),
    ('l09', None, g('pieces', 'lungs', keep=('cells', 'oil'), show=[('apart', 'apart'), ('joins', 'joins')])),
    ('l10', None, g('leftovers', 'pieces', keep=('cells', 'oil', 'apart', 'joins'),
                    show=[('water', 'water'), ('gas', 'carbon'), ('soda', 'soda')])),
    ('l11', None, g('blood', 'leftovers', keep=('cells', 'oil', 'apart', 'joins', 'water', 'gas', 'soda'),
                    show=[('blood', 'blood'), ('lungs-in', 'lungs')], fly='whole')),
    # 4. The catch: out of your mouth in a breath, 840 g of every kilo; 160 g as water; the gym.
    ('l12', None, g('cloud', 'blood', keep=('cells', 'blood', 'lungs-in'), show=[('exhale', 'mouth')])),
    ('l13', None, g('cloud', keep=('exhale',), callout=('840 G', 'BREATHED OUT', 'cloud', 'eight'))),
    ('l14', None, g('sweat', 'cloud', keep=('exhale',), show=[('sweat', 'sweat'), ('pee', 'pee')],
                    callout=('160 G', 'LEAVES AS WATER', 'sweat', 'hundred'))),
    ('l15', None, g('gym', 'sweat', show=[('burgers', 'burger')])),
    # 5. The proof: the scientists' balance, 10 kg of fat and 29 kg of oxygen in, 28 kg of gas and
    # 11 kg of water out, level; the sofa.
    ('l16', None, g('balance', 'gym', show=[('scientists', 'scientists'), ('fat-block', 'ten')])),
    ('l17', None, g('left-pan', 'balance', keep=('fat-block',), show=[('oxygen-block', 'oxygen')],
                    callout=('29 KG', 'OXYGEN IN', 'left-pan', 'twenty'))),
    ('l18', None, g('right-pan', 'left-pan', keep=('fat-block', 'oxygen-block'),
                    show=[('gas-block', 'carbon'), ('water-block', 'eleven')],
                    callout=('28 + 11 KG', 'GAS AND WATER OUT', 'right-pan', 'twenty'))),
    ('l19', None, g('beam', 'right-pan', keep=BLOCKS, show=[('level', 'missing')],
                    callout=('39 = 39', 'NOTHING VANISHED', 'beam', 'thirty'))),
    ('l20', None, g('sofa', 'beam', keep=BLOCKS, show=[('panting', 'sofa'), ('dizzy', 'dizzy')])),
    # 6. The payoff: back in the bathroom, the breath cloud with a dinner plate in it; the scale.
    ('l21', None, g('plate', 'sofa', keep=('exhale', 'fat-blob'), show=[('plate', 'dinner')])),
    ('l22', None, g('scale', 'plate', keep=('exhale', 'plate', 'fat-blob'), show=[('readout', 'scale')],
                    t=title('YOU BREATHED', 'IT OUT', 1))),
]

# The sound of each place: the people in the hall, the quiet house in its rooms, a muffled hush
# inside you. A whoosh as the camera dives into you and out of you in a breath.
AMBIENCE = {
    'hall': 'crowd-murmur', 'crowd': 'crowd-murmur', 'balance': 'crowd-murmur', 'left-pan': 'crowd-murmur',
    'right-pan': 'crowd-murmur', 'beam': 'crowd-murmur',
    'feet': 'home', 'scale': 'home', 'blob': 'home', 'atoms': 'home', 'cloud': 'home', 'sweat': 'home',
    'plate': 'home', 'sofa': 'home', 'gym': 'home',
    'belly': 'underwater', 'cell': 'underwater', 'chain': 'underwater', 'nose': 'underwater',
    'lungs': 'underwater', 'pieces': 'underwater', 'leftovers': 'underwater', 'blood': 'underwater',
}
INSIDE = {'belly', 'cell', 'chain', 'nose', 'lungs', 'pieces', 'leftovers', 'blood'}


def sounds(graphic):
    out = []
    frm = graphic.get('from')
    if frm and (frm in INSIDE) != (graphic['at'] in INSIDE):
        out.append({'name': 'whoosh', 'at': 'start', 'gainDb': -2})
    items = [x['item'] for x in graphic['show']]
    if 'fat-blob' in items:
        out.append({'name': 'pop', 'at': 'middle', 'gainDb': -4})
    if 'wrong' in items:
        out.append({'name': 'blip', 'at': 'end', 'gainDb': -4})
    if 'fat-block' in items or 'oxygen-block' in items or 'gas-block' in items:
        out.append({'name': 'clunk', 'at': 'end', 'gainDb': -3})
    if 'level' in items:
        out.append({'name': 'ding', 'at': 'end', 'gainDb': -3})
    if 'soda' in items:
        out.append({'name': 'bubbles', 'at': 'end', 'gainDb': -4})
    return out


# The reveal: the music stops just before the catch and comes back with a hit as it lands
# (2026-10-21, the new sound: "it should be different according to shorts or videos").
DROPS = {'l12'}

by_line = {}
for i, (lid, said, graphic) in enumerate(SHOTS, start=1):
    shot = {
        'id': f's{i:02d}', 'line': lid, 'words': said or LINE[lid]['text'],
        'camera': {'framing': 'wide', 'move': 'none', 'strength': 0.2},
        'actors': [], 'props': [], 'effects': [], 'sfx': sounds(graphic), 'transition': 'cut', 'graphic': graphic}
    if graphic['at'] in AMBIENCE:
        shot['ambience'] = AMBIENCE[graphic['at']]
    if lid in DROPS and lid not in by_line:
        shot['drop'] = True
    by_line.setdefault(lid, []).append(shot)
for lid, shots in by_line.items():
    said = ' '.join(s['words'] for s in shots)
    if said != LINE[lid]['text']:
        raise SystemExit(f'{lid}: the shots say "{said}" and the script says "{LINE[lid]["text"]}"')

scenes = []
for sc in draft['scenes']:
    shots = [s for line in sc['lines'] for s in by_line[line['id']]]
    scenes.append({**{k: v for k, v in sc.items() if k != 'shots'}, 'place': 'classroom', 'treatment': 'simple',
                   'palette': 'warm-interior', 'mood': MOODS[sc['beat']], 'quiet': False, 'shots': shots})
sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = []
sb['scenes'] = scenes
sb['explainerLook'] = 'world'
sb['cover'] = {'shot': 's13', 'at': 0.85}
# The video's own music: the body's instruments (soft bells, a warm pad, a round bass).
sb['score'] = {'palette': 'body'}
io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(
    json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
