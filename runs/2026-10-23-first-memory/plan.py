"""The shot plan of "Your First Memory Might Never Have Happened": writes storyboard.json.

One journey through the world `memory` (engine/src/explainer/MemoryWorld.tsx), as Biku's script
lays it out: the mascot with his memory bubble in a dusk; a second bubble of him being born that
pops; a lens into his head, the toddler brain and its three candles; out to the crowd of 6,641
with a bubble each, four in ten turning yellow, 893 glowing; back into his bubble, the garden
memory tipping to above and down into the pram; the bubble taken down and turned over to the
back of a printed photo; the album and the dinner table; the bubble as a collage; the age ruler;
the whole crowd again as his eyes close. One shot a line. The first Short in the toned look (2),
with the calm camera, a gauge and the 1-minute rules (prompts/fine-print.md v4.3).

Run:  npm run plan -- draft --run=2026-10-23-first-memory   (kept as storyboard.draft.json)
      python runs/2026-10-23-first-memory/plan.py
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-23-first-memory/'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINE = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}
Q, MOMENT, LOOPS, CATCH, PROOF, PAYOFF = ('the-question', 'the-moment', 'follow-the-money', 'the-trick',
                                          'the-proof', 'your-move')
MOODS = {Q: 'curious', MOMENT: 'comic', LOOPS: 'curious', CATCH: 'tense', PROOF: 'reflective', PAYOFF: 'hope'}


def title(a, b=None, stress=None):
    t = {'lines': [a] + ([b] if b else [])}
    if stress is not None:
        t['stress'] = stress
    return t


def g(at, frm=None, keep=(), show=(), t=None, fly='start'):
    out = {'kind': 'journey', 'world': 'memory', 'at': at, 'fly': fly, 'keep': list(keep), 'show': []}
    for s in show:
        item = {'item': s[0], 'on': s[1]}
        if len(s) > 2:
            item['cam'] = s[2]
        out['show'].append(item)
    if frm and frm != at:
        out['from'] = frm
    if t:
        out['title'] = t
    return out


MEM = ('bubble', 'pram')
CROWD = MEM + ('crowd',)
# (line, graphic, how the shot arrives, where a lens or dive goes in, sounds, ambience)
SHOTS = [
    # 1. The hook: eyes shut, the bubble opens, the baby in the pram blows out his candle.
    ('l01', g('you', show=[('bubble', 'first'), ('pram', 'memory')], t=title('YOUR VERY', 'FIRST MEMORY', 1)),
     'cut', None, [('pop', 'middle', -5)], None),
    # In close on the bubble: the picture glitches like a bad signal.
    ('l02', g('bubble', 'you', keep=MEM, show=[('glitch', 'never')], t=title('DID IT REALLY', 'HAPPEN?', 1)),
     'cut', None, [('blip', 'end', -6)], None),
    # 2. The moment: a second bubble, you being born; you point at it, proud. It pops.
    ('l03', g('newborn-bubble', 'bubble', keep=MEM + ('glitch',), show=[('newborn', 'born')]),
     'cut', None, [('pop', 'end', -5)], None),
    ('l04', g('newborn-bubble', keep=MEM + ('glitch', 'newborn'), show=[('pop', 'don')]),
     'cut', None, [('pop', 'start', -2)], None),
    # 3. Clue one: the camera pushes in on you and your head turns to an x-ray, a small toddler
    # brain glowing in it; the age ruler's three candles beside you. Into the brain; memory
    # boxes fade before they land. Then straight back out of your head to the crowd round you.
    ('l05', g('head', 'newborn-bubble', keep=MEM, show=[('brain', 'memory'), ('ruler', 'three')]),
     'cut', None, [], None),
    ('l06', g('toddler-brain', 'head', keep=MEM + ('brain', 'ruler'), show=[('boxes', 'nothing')],
              t=title('CHILDHOOD', 'AMNESIA', 1)),
     'cut', None, [], None),
    # Clue two: out to the crowd you stand in, 6,641 of them.
    ('l07', g('crowd', 'toddler-brain', keep=MEM + ('brain', 'boxes'),
              show=[('crowd', 'british'), ('asked', 'six')]),
     'cut', None, [('whoosh', 'start', -4)], 'crowd-murmur'),
    ('l08', g('crowd', keep=CROWD + ('asked',), show=[('yellow', 'four')]),
     'cut', None, [('blip', 'middle', -6)], 'crowd-murmur'),
    ('l09', g('crowd-near', 'crowd', keep=CROWD + ('yellow',), show=[('one-or-younger', 'nine'), ('hand-up', 'younger')]),
     'cut', None, [('ding', 'middle', -6)], 'crowd-murmur'),
    # Clue three: prams in bubbles everywhere.
    ('l10', g('crowd', 'crowd-near', keep=CROWD + ('yellow', 'one-or-younger'), show=[('prams', 'lot')]),
     'cut', None, [('pop', 'middle', -6)], 'crowd-murmur'),
    # The camera flies into your bubble and it opens round you into the garden; the view tips to
    # be seen from above, then dives through the baby's eye into the pram.
    ('l11', g('garden', 'crowd', keep=CROWD + ('yellow', 'one-or-younger', 'prams'), show=[('above', 'above')]),
     'cut', None, [('whoosh', 'start', -5)], 'birds'),
    ('l12', g('garden', keep=('above',), show=[('inside', 'never')]),
     'cut', None, [], 'birds'),
    # 4. The catch: back out of the pram as the garden closes into the bubble over your head; you
    # take the bubble down; it is a printed photo; on its back, "Photo: Mom".
    ('l13', g('you', 'pram-inside', keep=MEM + ('above', 'inside'), show=[('flip', 'picture', 'photo-back')]),
     'cut', None, [('whoosh', 'start', -6), ('paper', 'end', -3)], None),
    # A lens opens on the photo into the family album; along to the dinner table.
    ('l14', g('album', show=[('album', 'photos'), ('dinner', 'stories', 'dinner')]),
     'lens', {'x': 0.51, 'y': 0.43, 'r': 0.2}, [('paper', 'start', -5)], 'home'),
    # 5. The proof: the dinner table closes into your bubble, and the bubble is a collage.
    ('l15', g('bubble', keep=('bubble', 'pram'), show=[('collage', 'and')]),
     'lens-out', {'x': 0.532, 'y': 0.402, 'r': 0.34}, [('pop', 'end', -6)], None),
    # 6. The payoff: the age ruler; the bubble sinks below three; the whole crowd, eyes shut.
    ('l16', g('ruler', 'bubble', keep=('bubble', 'collage'), show=[('ruler', 'three'), ('sink', 'not')]),
     'cut', None, [], None),
    ('l17', g('crowd', 'ruler', keep=('bubble', 'collage', 'ruler', 'sink', 'crowd', 'yellow', 'one-or-younger', 'prams'),
              show=[('eyes-shut', 'yours')], fly='whole'),
     'cut', None, [], 'crowd-murmur'),
]
# The reveal: the music stops just before the catch and comes back with a hit as it lands.
DROPS = {'l13'}

by_line = {}
for i, (lid, graphic, arrives, dive, sfx, ambience) in enumerate(SHOTS, start=1):
    shot = {
        'id': f's{i:02d}', 'line': lid, 'words': LINE[lid]['text'],
        'camera': {'framing': 'wide', 'move': 'none', 'strength': 0.2},
        'actors': [], 'props': [], 'effects': [],
        'sfx': [{'name': n, 'at': w, 'gainDb': db} for n, w, db in sfx],
        'transition': arrives, 'graphic': graphic}
    if dive:
        shot['diveAt'] = dive
    if ambience:
        shot['ambience'] = ambience
    if lid in DROPS:
        shot['drop'] = True
    by_line[lid] = [shot]

scenes = []
for sc in draft['scenes']:
    shots = [s for line in sc['lines'] for s in by_line[line['id']]]
    scenes.append({**{k: v for k, v in sc.items() if k != 'shots'}, 'place': 'classroom', 'treatment': 'simple',
                   'palette': 'warm-interior', 'mood': MOODS[sc['beat']], 'quiet': False, 'shots': shots})
sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = []
sb['scenes'] = scenes
sb['explainerLook'] = 'world'
sb['cover'] = {'shot': 's02', 'at': 0.7}
# The video's own music: a mystery, since the memory turns out not to be what it seems.
sb['score'] = {'palette': 'mystery'}
# The gauge that carries the story: the three clues.
sb['gauges'] = [{'label': 'THE CLUES', 'kind': 'steps', 'of': 3,
                 'keys': [{'shot': 's05', 'on': 'clue', 'value': 1},
                          {'shot': 's07', 'on': 'clue', 'value': 2},
                          {'shot': 's10', 'on': 'clue', 'value': 3}],
                 'until': 's12'}]
io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(
    json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
