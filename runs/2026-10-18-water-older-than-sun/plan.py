"""The shot plan of "Why Is the Water in Your Glass Older Than the Sun?": writes storyboard.json.

One journey through the world `water` (engine/src/explainer/WaterWorld.tsx), never a cut and never
a card: the glass on the kitchen counter, one drop on its rim, the tap, the coast outside, back to
the glass and down into one molecule; out past the Earth to a comet and the Sun; the Sun and its
planets shrinking into a computer's screen; time running back until the Sun goes out and we are in
the dark icy cloud; one speck of dust there, icing over; time running forward as the cloud falls
in to make the Sun and planets; comets and rocks falling to the young Earth; today again; the
house with its shower and rain; and the glass, its drop frosted, where it began.

Each shot flies from the last shot's stop (`from`) to its own (`at`); `keep` carries on what is
already there, `show` brings things in on the words that name them, `callout` puts a number in.

Run:  npm run plan -- draft --run=2026-10-18-water-older-than-sun   (keep it as storyboard.draft.json)
      python runs/2026-10-18-water-older-than-sun/plan.py
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-18-water-older-than-sun/'
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
    out = {'kind': 'journey', 'world': 'water', 'at': at, 'fly': fly, 'keep': list(keep),
           'show': [{'item': s[0], 'on': s[1]} if isinstance(s, tuple) else {'item': s} for s in show]}
    if frm and frm != at:
        out['from'] = frm
    if callout:
        value, caption, anchor, on = callout
        out['callout'] = {'value': value, 'caption': caption, 'at': anchor, 'on': on}
    if t:
        out['title'] = t
    return out


NOW = ()
PAST = ('rewind',)
YOUNG = ('rewind', 'collapse', 'planets')
TODAY = ('rewind', 'collapse', 'planets', 'today')
D = ('drop',)
M = ('drop', 'molecule', 'open')

# (line, words or None for the whole line, graphic)
SHOTS = [
    # 1. The question
    ('l01', None, g('glass', t=title('OLDER THAN', 'THE SUN?', 1), fly='whole')),
    ('l02', None, g('drop', 'glass', show=[('drop', 'drop'), ('frost', 'cold')])),
    # 2. The moment
    ('l03', None, g('tap', 'drop', keep=D, show=[('tap', 'tap')])),
    ('l04', None, g('outside', 'tap', keep=D, show=[('sea', 'sea'), ('clouds', 'clouds'), ('rain', 'rain')])),
    ('l05', None, g('glass', 'outside', keep=D + ('tap',), t=title('WHERE WAS IT', 'BEFORE THE SEA?', 1))),
    # 3. Follow the clue
    ('l06', None, g('molecule', 'glass', keep=D, show=[('molecule', 'molecule')], fly='whole')),
    ('l07', None, g('molecule', keep=('drop', 'molecule'), show=[('open', 'oxygen')])),
    ('l08', None, g('molecule', keep=M, show=[('heavy', 'hydrogen')],
                    callout=('1 IN 3,000', 'HAVE ONE HEAVIER / HYDROGEN', 'atom', 'three'))),
    ('l09', None, g('molecule', keep=M + ('heavy',),
                    callout=('HEAVY', "WATER'S FINGERPRINT", 'atom', 'heavy'))),
    ('l10', 'Our oceans carry that heavy fingerprint,', g('earth', 'molecule', show=[('oceans', 'oceans')])),
    ('l10', 'and so do the icy *comets*.', g('comet', 'earth', keep=('oceans',), show=[('comet', 'comets')])),
    ('l11', None, g('sun', 'comet', keep=('comet',), show=[('sun', 'sun'), ('fade', 'heat')])),
    # 4. The catch
    ('l12', None, g('system', 'sun', keep=('comet',), show=[('computer', 'computer')])),
    ('l13', None, g('system', keep=('comet', 'computer'),
                    callout=('NOT ENOUGH', 'HEAVY WATER MADE', 'screen', 'enough'))),
    ('l14', None, g('system', keep=('comet', 'computer'), show=[('screen-frost', 'cold')],
                    callout=('DEEP COLD', 'NEAR THE COLDEST POSSIBLE', 'screen', 'coldest'))),
    ('l15', None, g('cloud', 'system', keep=('computer', 'screen-frost'), show=[('rewind', 'only')],
                    fly='whole')),
    ('l16', None, g('dust', 'cloud', keep=PAST, show=[('dust', 'dust'), ('ice', 'ice')])),
    # Out to the whole cloud as it falls in on itself, then in to the newborn Sun and its disk.
    ('l17', 'Then the cloud collapsed into the Sun and planets,',
     g('cloud', 'dust', keep=PAST + ('dust', 'ice'), show=[('collapse', 'sun')])),
    ('l17', 'and that ice *survived*.', g('disk', 'cloud', keep=PAST + ('collapse',), show=[('planets', 'ice')])),
    ('l18', None, g('young-earth', 'disk', keep=YOUNG, show=[('rocks', 'comets'), ('oceans', 'sea')])),
    # 5. The proof
    ('l19', None, g('earth', 'young-earth', keep=YOUNG + ('oceans',),
                    callout=('2014', 'PUBLISHED IN SCIENCE', 'sea', 'twenty'))),
    ('l20', None, g('earth', keep=YOUNG, show=[('today', 'model'), ('oceans', 'ocean')],
                    callout=('30-50%', 'OF OCEAN WATER, AT MOST', 'earth', 'thirty'))),
    ('l21', None, g('system', 'earth', keep=TODAY + ('oceans',),
                    callout=('1 MILLION', 'YEARS OLDER THAN THE SUN', 'sun', 'million'))),
    # 6. Now you'll notice
    ('l22', None, g('house', 'system', keep=TODAY + D, show=[('shower', 'shower'), ('raindrop', 'raindrop')])),
    ('l23', None, g('glass', 'house', keep=TODAY + D + ('frost', 'raindrop'), t=title('OLDER THAN', 'THE SUN', 1))),
]

by_line = {}
for i, (lid, words, graphic) in enumerate(SHOTS, start=1):
    by_line.setdefault(lid, []).append({
        'id': f's{i:02d}', 'line': lid, 'words': words or LINE[lid]['text'],
        'camera': {'framing': 'wide', 'move': 'none', 'strength': 0.2},
        'actors': [], 'props': [], 'effects': [], 'sfx': [], 'transition': 'cut', 'graphic': graphic})
for lid, shots in by_line.items():
    said = ' '.join(s['words'] for s in shots)
    if said != LINE[lid]['text']:
        raise SystemExit(f'{lid}: the shots say "{said}" and the script says "{LINE[lid]["text"]}"')

scenes = []
for sc in draft['scenes']:
    shots = [s for line in sc['lines'] for s in by_line[line['id']]]
    # The place a scene names is not drawn under a journey; any will do.
    scenes.append({**{k: v for k, v in sc.items() if k != 'shots'}, 'place': 'classroom', 'treatment': 'simple',
                   'palette': 'warm-interior', 'mood': MOODS[sc['beat']], 'quiet': False, 'shots': shots})
sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = []
sb['scenes'] = scenes
sb['explainerLook'] = 'world'
sb['cover'] = {'shot': 's07', 'at': 0.8}
io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(
    json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
