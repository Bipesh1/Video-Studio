"""The shot plan of "Why Is the Sun Already Gone When You Watch It Set?": writes storyboard.json.

One journey through the world `sunset` (engine/src/explainer/SunsetWorld.tsx), as Biku's script lays
it out: the phone's screen, back to the beach, the straight line everyone imagines cracking away,
down to the straw, up to the sky cut open into its layers, a high Sun, out over the curve of the
Earth to a low Sun, riding its beam back down into the phone, the real Sun under the horizon, the
two Suns side by side, the squashed low Sun, and the screen where it began.

Run:  npm run plan -- draft --run=2026-10-18-sunset-already-gone   (keep it as storyboard.draft.json)
      python runs/2026-10-18-sunset-already-gone/plan.py
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-18-sunset-already-gone/'
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
    out = {'kind': 'journey', 'world': 'sunset', 'at': at, 'fly': fly, 'keep': list(keep),
           'show': [{'item': s[0], 'on': s[1]} if isinstance(s, tuple) else {'item': s} for s in show]}
    if frm and frm != at:
        out['from'] = frm
    if callout:
        value, caption, anchor, on = callout
        out['callout'] = {'value': value, 'caption': caption, 'at': anchor, 'on': on}
    if t:
        out['title'] = t
    return out


SHOTS = [
    # 1. The question
    ('l01', None, g('screen', show=[('sun', 'sun')], t=title('WHERE IS THE', 'SUN REALLY?', 1), fly='whole')),
    ('l02', None, g('beach', 'screen', show=[('shimmer', 'air')])),
    # 2. The moment
    ('l03', None, g('beach', keep=('shimmer',), show=[('phone', 'phone'), ('sun-on-sea', 'bottom')])),
    ('l04', None, g('beach', keep=('shimmer', 'phone'), callout=('HERE?', 'WHERE EVERYONE THINKS IT IS', 'sun', 'there'))),
    ('l05', None, g('sea', 'beach', keep=('shimmer',), show=[('straight', 'straight')])),
    ('l06', None, g('sea', keep=('shimmer', 'straight'), show=[('crack', 'both')])),
    # 3. Follow the clue
    ('l07', None, g('glass', 'sea', show=[('straw', 'straw')])),
    ('l08', None, g('straw', 'glass', keep=('straw',), callout=('BENT HERE', 'LIGHT CHANGES DIRECTION', 'straw', 'direction'))),
    ('l09', None, g('sky', 'straw', show=[('layers', 'thicker')])),
    ('l10', None, g('sky', keep=('layers',), show=[('beam', 'sunlight')])),
    ('l11', None, g('high', 'sky', keep=('layers',), show=[('high-sun', 'high')])),
    ('l12', None, g('curve', 'high', show=[('low-sun', 'low'), ('skim', 'skims')])),
    # 4. The catch
    ('l13', None, g('phone', 'curve', keep=('low-sun',), show=[('ride', 'beam')], fly='whole')),
    ('l14', None, g('phone', keep=('ride',), show=[('straight-back', 'straight')])),
    ('l15', None, g('below', 'phone', keep=('ride', 'straight-back'), show=[('real-sun', 'below')])),
    ('l16', None, g('below', keep=('ride', 'straight-back', 'real-sun'),
                    callout=('1 SUN', 'LIFTED BY ITS OWN WIDTH', 'gap', 'width'))),
    ('l17', None, g('gap', 'below', keep=('real-sun',), show=[('screen-front', 'screen')])),
    # 5. The proof
    ('l18', None, g('gap', keep=('real-sun',), callout=('0.5°', 'ABOUT ONE WHOLE SUN', 'gap', 'half'))),
    ('l19', None, g('gap', keep=('real-sun',), callout=('+2 MIN', 'LATER SUNSET IN HONG KONG', 'sun', 'two'))),
    ('l20', None, g('screen', 'gap', callout=('SUNSET', 'INCLUDES THE 2 MINUTES', 'screen', 'official'))),
    # 6. Now you'll notice
    ('l21', None, g('sunclose', 'screen', show=[('oval', 'flat')])),
    ('l22', None, g('sunclose', keep=('oval',), callout=('BOTTOM', 'LIFTED MORE THAN THE TOP', 'bottom', 'bottom'))),
    ('l23', None, g('screen', 'sunclose', show=[('ghost', 'below')], t=title('ALREADY', 'GONE', 1))),
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
    scenes.append({**{k: v for k, v in sc.items() if k != 'shots'}, 'place': 'classroom', 'treatment': 'simple',
                   'palette': 'warm-interior', 'mood': MOODS[sc['beat']], 'quiet': False, 'shots': shots})
sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = []
sb['scenes'] = scenes
sb['explainerLook'] = 'world'
sb['cover'] = {'shot': 's15', 'at': 0.9}
io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(
    json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
