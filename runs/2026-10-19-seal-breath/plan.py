"""The shot plan of "Could Humans Evolve to Hold Their Breath Like Seals?": writes storyboard.json.

One journey through the world `dive` (engine/src/explainer/DiveWorld.tsx), as Biku's script lays it
out. Its places are joined by water: the camera dives into the water of one and comes up in the
next (the bath, the ocean of the Earth from space, the seal's cold sea, the Bajau's warm sea, the
pool of the record). Biku, 2026-10-19: "it should not be stuck in one photo for long time. each
new info should bring a great animation": so every new fact has its own move, and a long line is
cut in two at its comma, each half with its own flight.

Run:  npm run plan -- draft --run=2026-10-19-seal-breath   (keep it as storyboard.draft.json)
      python runs/2026-10-19-seal-breath/plan.py
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-19-seal-breath/'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINE = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}
Q, MOMENT, CLUE, CATCH, PROOF, NOTICE = ('the-question', 'the-moment', 'follow-the-money', 'the-trick',
                                         'the-proof', 'your-move')
MOODS = {Q: 'curious', MOMENT: 'curious', CLUE: 'upbeat', CATCH: 'tense', PROOF: 'reflective', NOTICE: 'hope'}


def title(a, b=None, stress=None):
    t = {'lines': [a] + ([b] if b else [])}
    if stress is not None:
        t['stress'] = stress
    return t


def g(at, frm=None, keep=(), show=(), callout=None, t=None, fly='start'):
    out = {'kind': 'journey', 'world': 'dive', 'at': at, 'fly': fly, 'keep': list(keep),
           'show': [{'item': s[0], 'on': s[1]} if isinstance(s, tuple) else {'item': s} for s in show]}
    if frm and frm != at:
        out['from'] = frm
    if callout:
        value, caption, anchor, on = callout
        out['callout'] = {'value': value, 'caption': caption, 'at': anchor, 'on': on}
    if t:
        out['title'] = t
    return out


def words(lid, a, b=None):
    """A line cut in two: the words of the first shot, and of the second (the rest)."""
    text = LINE[lid]['text']
    assert text.startswith(a), (lid, a)
    return a, text[len(a):].strip()


L06 = words('l06', 'So your body switches on its dive reflex: your heart slows,')
L07 = words('l07', 'Then your spleen, a small organ under your ribs,')
L10 = words('l10', 'And here is the catch: the Bajau, sea nomads of Southeast Asia,')
L13 = words('l13', 'The Bajau spleen was about fifty percent *bigger*,')
L19 = words('l19', 'The breath hold world record is twenty nine minutes,')
L22 = words('l22', 'So could humans evolve to hold their breath like seals?')

SHOTS = [
    # 1. The question: you under the bathwater, then down through it and out to the whole Earth.
    ('l01', None, g('bath', 'rise', show=[('ripple-seal', 'seal')], t=title('COULD YOU HOLD IT', 'LIKE A SEAL?', 1),
                    fly='whole')),
    ('l02', None, g('globe', 'bath', show=[('halo', 'Earth')])),
    # 2. The moment: back into the water and up beside the counter; into the chest.
    ('l03', None, g('counter', 'globe', callout=('1 MIN', 'WHEN MOST OF US COME UP', 'counter', 'minute'))),
    ('l04', None, g('chest', 'counter', show=[('lungs', 'chest')], fly='whole')),
    # 3. Follow the clue: the lungs, the heart, the blood leaving the hands and feet, the spleen,
    # in among its red cells, out into the blood, and through the water to a seal.
    ('l05', None, g('lungs', 'chest', keep=('lungs',), show=[('fading', 'oxygen')])),
    ('l06', L06[0], g('heart', 'lungs', keep=('lungs', 'fading'), show=[('heart', 'heart')])),
    ('l06', L06[1], g('limbs', 'heart', keep=('lungs', 'fading', 'heart'), show=[('hands', 'hands'), ('feet', 'feet')])),
    ('l07', L07[0], g('spleen', 'limbs', keep=('lungs', 'heart', 'hands', 'feet'), show=[('spleen', 'spleen')])),
    ('l07', L07[1], g('cells', 'spleen', keep=('lungs', 'heart', 'spleen'), show=[('squeeze', 'sponge')])),
    ('l08', None, g('stream', 'cells', keep=('squeeze',), show=[('pour', 'pushes'), ('tank', 'tank')])),
    ('l09', None, g('seal', 'stream', show=[('seal-spleen', 'spleens')])),
    # 4. The catch: the Bajau, a bigger tank, the diver, the scan, fifty percent, the genes, a
    # thousand years.
    ('l10', L10[0], g('village', 'seal', show=[('houseboats', 'Bajau')], t=title('THE BAJAU', 'SEA NOMADS', 0))),
    ('l10', L10[1], g('family', 'village', keep=('houseboats',), show=[('big-tank', 'bigger')])),
    ('l11', None, g('reef', 'family', keep=('houseboats',), show=[('diver', 'divers'), ('fish', 'fish')])),
    ('l12', None, g('scan', 'reef', keep=('houseboats',), show=[('bajau-spleen', 'Bajau'), ('saluan-spleen', 'Saluan')])),
    ('l13', L13[0], g('scan-close', 'scan', keep=('bajau-spleen', 'saluan-spleen'),
                      callout=('+50%', 'BIGGER THAN THE NEIGHBOURS', 'spleen', 'fifty'))),
    ('l13', L13[1], g('scan', 'scan-close', keep=('bajau-spleen', 'saluan-spleen'), show=[('tennis', 'tennis')])),
    ('l14', None, g('dna', 'scan-close', keep=('bajau-spleen', 'saluan-spleen'), show=[('genes', 'genes')],
                    fly='whole')),
    ('l15', None, g('boats', 'dna', keep=('houseboats',), show=[('years', 'thousand')],
                    callout=('1,000', 'YEARS, SCIENTISTS THINK', 'boats', 'thousand'))),
    # 5. The proof: the journal page in the sky, the gene on it, nobody knows yet, the record.
    ('l16', None, g('page', 'boats', keep=('houseboats',), show=[('journal', 'journal')], t=title('CELL', '2018', 1))),
    ('l17', None, g('page-figure', 'page', keep=('houseboats', 'journal'), show=[('gene', 'gene')])),
    ('l18', None, g('page-figure', keep=('houseboats', 'journal', 'gene'), show=[('hormone', 'hormone')],
                    callout=('?', 'NOBODY KNOWS YET', 'gene', 'nobody'))),
    ('l19', L19[0], g('pool', 'page-figure', show=[('record', 'record')], t=title('29 MINUTES', 'WITH HELP', 0))),
    ('l19', L19[1], g('tank', 'pool', keep=('record',), show=[('oxygen-tank', 'oxygen')])),
    # 6. Now you'll notice: back into the bath, your heart slowing, your spleen squeezing, up out
    # of the water as the counter stops.
    ('l20', None, g('figure', 'tank', show=[('heart-glow', 'heart')])),
    ('l21', None, g('chest', 'figure', keep=('lungs', 'heart-glow'), show=[('spleen-squeeze', 'diving')])),
    ('l22', L22[0], g('bath', 'chest', show=[('ripple-seal', 'seals')])),
    ('l22', L22[1], g('rise', 'bath', keep=('ripple-seal',), show=[('surface', 'yes'), ('stop', 'way')],
                      t=title("IT'S ALREADY", 'HAPPENING', 1))),
]

# The sound of each place (2026-10-20: "more background sounds that's according to the story"):
# the quiet house round the bath, the muffled water inside you and round the seal and the reef,
# the waves at the Bajau village, the people watching at the record's pool; space is left to the
# music. Bubbles as the camera dives into the water, a page as the journal appears.
AMBIENCE = {
    'bath': 'home', 'rise': 'home', 'counter': 'home', 'figure': 'home',
    'chest': 'underwater', 'lungs': 'underwater', 'heart': 'underwater', 'limbs': 'underwater',
    'spleen': 'underwater', 'cells': 'underwater', 'stream': 'underwater',
    'seal': 'underwater', 'reef': 'underwater',
    'village': 'waves', 'family': 'waves', 'boats': 'waves', 'scan': 'waves', 'scan-close': 'waves',
    'page': 'waves', 'page-figure': 'waves',
    'pool': 'crowd-murmur', 'tank': 'crowd-murmur',
}
PLACE = {'globe': 'earth', 'seal': 'cold', 'pool': 'pool', 'tank': 'pool',
         'village': 'bajau', 'family': 'bajau', 'boats': 'bajau', 'reef': 'bajau', 'scan': 'bajau',
         'scan-close': 'bajau', 'dna': 'bajau', 'page': 'bajau', 'page-figure': 'bajau'}
place = lambda stop: PLACE.get(stop, 'home')


def sounds(graphic):
    out = []
    frm = graphic.get('from')
    if frm and place(frm) != place(graphic['at']):
        out.append({'name': 'bubbles', 'at': 'start', 'gainDb': -2})
    if any(x['item'] == 'journal' for x in graphic['show']):
        out.append({'name': 'paper', 'at': 'middle', 'gainDb': 0})
    return out


by_line = {}
for i, (lid, said, graphic) in enumerate(SHOTS, start=1):
    shot = {
        'id': f's{i:02d}', 'line': lid, 'words': said or LINE[lid]['text'],
        'camera': {'framing': 'wide', 'move': 'none', 'strength': 0.2},
        'actors': [], 'props': [], 'effects': [], 'sfx': sounds(graphic), 'transition': 'cut', 'graphic': graphic}
    if graphic['at'] in AMBIENCE:
        shot['ambience'] = AMBIENCE[graphic['at']]
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
sb['cover'] = {'shot': 's14', 'at': 0.85}
io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(
    json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
