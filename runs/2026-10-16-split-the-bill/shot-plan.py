"""The shot plan of "Why Splitting the Bill Makes Everyone Order More": writes storyboard.json.

Run it after `npm run plan -- draft` (its first output is kept as storyboard.draft.json), and
again after any change here.

One place, the restaurant, laid out once (playbook: lay a scene out once, wide, then move the
camera). The table stands in the middle; two sit either side of it, the inner two about two
heads from its middle as at the game table:
  You .155   the Saint .284   | table .5 |   the Cheat .716   the Copycat .845
The waiter stands behind the table when he comes. The Trainer is a voice only, at the start and
the end (Biku's comedy short, 2026-10-16: the jokes are in the faces and the actions).

Every person carries their face, pose, look and what they hold from shot to shot (`STATE`), and
every change happens inside a shot, a beat after its cause (L-0040). The one jump in time,
"Later", the bill arriving, comes in on a fade: menus gone, the lobsters eaten.

Faces:
  the Saint    happy ordering her salad; jaw drop at the lobster; sad at her salad, then fuming;
               jaw drop at the bill; fuming, pointing; tired.
  the Cheat    calm; tempted at "split it four ways"; the sly grin, dollar eyes, ordering the
               lobster; jaw drop at the bill; shouting back; smug as the why is said; tired; happy.
  the Copycat  happy, it was his idea; tempted watching the Cheat, then the same grin; jaw drop;
               angry; tired.
  You          quiet all through; surprised; one hand up for water; jaw drop at the bill;
               at the end hollow, then sad, paying for it.
"""
import copy
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-16-split-the-bill/'
T, S, C, P, Y, W = 'trainer', 'saint', 'cheat', 'copycat', 'you', 'waiter'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINE = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}

TABLE_X = 0.5
SEAT = {Y: (0.155, 'right'), S: (0.284, 'right'), C: (0.716, 'left'), P: (0.845, 'left'), W: (0.44, 'left')}
ON_TABLE = 1.22
ROOM = ('crowd-murmur', 'start', -10)

# Where each person is, carried from shot to shot.
STATE = {
    Y: {'expression': 'neutral', 'pose': 'sit', 'holds': 'menu', 'lookAt': 'ahead'},
    S: {'expression': 'happy', 'pose': 'sit', 'holds': 'menu', 'lookAt': C},
    C: {'expression': 'neutral', 'pose': 'sit', 'holds': 'menu', 'lookAt': S},
    P: {'expression': 'happy', 'pose': 'sit', 'holds': 'menu', 'lookAt': S},
    W: {'expression': 'neutral', 'pose': 'stand', 'holds': 'water-jug', 'lookAt': Y},
}
FOUR = (Y, S, C, P)

ORDERED = [('plate-salad', 0.4)]
DINNER = [('plate-lobster', 0.415), ('plate-lobster', 0.53), ('plate-lobster', 0.625), ('water-glass', 0.355)]

SHOTS = {}


def step(at, **change):
    if 'look' in change:
        change['lookAt'] = change.pop('look')
    return {'at': at, **change}


def things(*items):
    """The chairs (before the people), then the table and what stands on it (after them)."""
    chairs = [{'prop': 'chair', 'x': SEAT[p][0]} for p in FOUR]
    rest = [{'prop': 'dining-table', 'x': TABLE_X}]
    for name, x in items:
        rest.append({'prop': name, 'x': TABLE_X} if name.startswith('bill-long') else
                    {'prop': name, 'x': x, 'y': ON_TABLE})
    return chairs + rest


def shot(sid, line, words, framing, steps=None, start=None, who=FOUR, items=(), focus=None, overlay=None,
         move='none', strength=0.2, sfx=(), effects=(), transition='cut'):
    """`start`: what is already different as the shot opens (only after a fade); `steps`: what
    changes inside it, as (at, change) per person."""
    steps = steps or {}
    for pid, change in (start or {}).items():
        STATE[pid].update(change)
    here = set(who) | {name for name, _ in items}
    actors = []
    for pid in who:
        st = STATE[pid]
        x, facing = SEAT[pid]
        look = st['lookAt'] if st['lookAt'] in here | {'camera', 'up', 'down', 'ahead'} else 'ahead'
        a = {'character': pid, 'expression': st['expression'], 'facing': facing, 'x': x, 'lookAt': look,
             'pose': st['pose']}
        if st.get('holds'):
            a['holds'] = st['holds']
        moments = []
        for at, change in steps.get(pid, []):
            change = dict(change)
            if 'look' in change:
                change['lookAt'] = change.pop('look')
            if change.get('lookAt') and change['lookAt'] not in here | {'camera', 'up', 'down', 'ahead'}:
                change['lookAt'] = 'ahead'
            moments.append({'at': at, **change})
            STATE[pid].update({k: v for k, v in change.items() if k in ('expression', 'pose', 'holds', 'lookAt')})
        if moments:
            a['then'] = moments
        actors.append(a)
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': words or LINE[line]['text'], 'camera': cam, 'actors': actors,
         'props': things(*items), 'effects': list(effects),
         'sfx': [{'name': n, 'at': at, 'gainDb': g} for n, at, g in (ROOM, *sfx)], 'transition': transition}
    if overlay:
        s['overlay'] = overlay
    SHOTS[sid] = s


def number(text, caption):
    return {'kind': 'number', 'text': text, 'caption': caption}


# ------------------------------------------------------------------ the question, the trap
shot('s1a', 'l01', None, 'wide', move='push-in', strength=0.15,
     overlay={'kind': 'words', 'lines': ['Why does splitting', 'the bill make', 'everyone order more?'], 'stress': 2})
shot('s2a', 'l02', None, 'medium', focus=P, steps={
    P: [(0.15, {'pose': 'sit-hands-up', 'look': 'camera'})],
    S: [(0.1, {'look': P})],
    Y: [(0.15, {'look': P})],
    C: [(0.55, {'expression': 'tempted', 'look': 'camera'})],
})

# ------------------------------------------------------------------ the orders
shot('s3a', 'l03', 'A small salad for me,', 'medium', focus=S, steps={
    S: [(0.05, {'look': 'ahead'})],
    P: [(0.1, {'pose': 'sit', 'look': S})],
    Y: [(0.2, {'look': S})],
})
# Her "please" over his face: he looks down at the menu, then at her, and the grin spreads.
shot('s3a2', 'l03', 'please.', 'close-up', focus=C, who=(C,), sfx=[('blip', 'end', -6)], steps={
    C: [(0.05, {'look': 'down'}), (0.35, {'look': S}), (0.65, {'expression': 'sly-grin', 'look': 'camera'})],
})
shot('s3b', 'l04', None, 'close-up', focus=C, who=(C,), effects=[{'effect': 'dollar-eyes', 'on': C}],
     sfx=[('ding', 'start', -6)], move='push-in', strength=0.25)
shot('s3c1', 'l05', "Then I'll have the lobster", 'medium', focus=S, who=(Y, S), effects=[{'effect': 'shock-lines', 'on': S}],
     move='punch-in', strength=0.3, steps={
         S: [(0.08, {'expression': 'jaw-drop', 'look': C})],
         Y: [(0.2, {'expression': 'surprised', 'look': C})],
     })
shot('s3c2', 'l05', 'too.', 'close-up', focus=P, who=(P,), steps={
    P: [(0.05, {'expression': 'tempted', 'look': C}), (0.5, {'expression': 'sly-grin', 'look': 'camera'})],
})
shot('s3d', 'l06', None, 'medium', focus=S, effects=[{'effect': 'anger-mark', 'on': S}], items=ORDERED,
     move='punch-in', strength=0.25, sfx=[('thud', 'middle', -2)], steps={
         S: [(0.08, {'expression': 'sad', 'look': 'down'}),
             (0.42, {'expression': 'fuming', 'look': 'camera', 'pose': 'sit-hands-up'})],
         Y: [(0.5, {'look': S})],
     })
shot('s3e', 'l07', None, 'wide', who=(W, Y, S), items=ORDERED, steps={
    Y: [(0.15, {'expression': 'neutral', 'look': W}), (0.6, {'pose': 'sit-reach'})],
    S: [(0.1, {'pose': 'sit', 'look': C})],
})

# ------------------------------------------------------------------ later: the bill
shot('s4a', 'l08', None, 'wide', who=(W, *FOUR), items=DINNER + [('bill-long', TABLE_X)], transition='fade',
     start={
         W: {'holds': None, 'lookAt': 'down'},
         Y: {'holds': None, 'expression': 'neutral', 'pose': 'sit', 'lookAt': 'water-glass'},
         S: {'holds': None, 'expression': 'happy', 'pose': 'sit', 'lookAt': 'down'},
         C: {'holds': None, 'expression': 'happy', 'pose': 'sit', 'lookAt': 'down'},
         P: {'holds': None, 'expression': 'happy', 'pose': 'sit', 'lookAt': 'down'},
     },
     steps={
         Y: [(0.35, {'expression': 'jaw-drop', 'look': 'down'})],
         S: [(0.3, {'expression': 'jaw-drop'})],
         C: [(0.4, {'expression': 'jaw-drop'})],
         P: [(0.45, {'expression': 'jaw-drop'})],
     },
     sfx=[('whoosh', 'start', -4), ('drumroll', 'middle', -6)], effects=[{'effect': 'sweat-flying', 'on': P}])

# ------------------------------------------------------------------ the why
OUT = DINNER + [('bill-long-out', TABLE_X)]
shot('s5a', 'l09', 'When you split the bill,', 'wide', items=OUT, steps={
    S: [(0.1, {'expression': 'fuming', 'pose': 'sit-reach', 'look': C})],
    C: [(0.25, {'expression': 'shouting', 'pose': 'sit-reach', 'look': S})],
    P: [(0.35, {'expression': 'angry', 'pose': 'sit-reach', 'look': S})],
    Y: [(0.5, {'look': S})],
})
shot('s5b', 'l09', 'every extra dish costs you only a quarter of its price.', 'medium', focus=C, items=OUT,
     overlay=number('$15', 'your share of a $60 lobster'), steps={
         C: [(0.15, {'expression': 'smug', 'pose': 'sit', 'look': 'camera'})],
     })
shot('s5c', 'l10', None, 'wide', items=OUT, move='pull-back', strength=0.2, steps={
    S: [(0.15, {'expression': 'exhausted', 'pose': 'sit', 'look': 'down'})],
    C: [(0.25, {'expression': 'exhausted', 'look': 'down'})],
    P: [(0.3, {'expression': 'exhausted', 'pose': 'sit', 'look': 'down'})],
    Y: [(0.4, {'expression': 'hollow', 'look': 'down'})],
})
shot('s5d', 'l11', 'Economists tested this in a real restaurant.', 'medium', focus=P, items=OUT,
     overlay=number('2004', 'tested in a real restaurant'))
shot('s5e', 'l11', 'When the bill was split, people ate more.', 'medium', focus=C, items=OUT, steps={
    C: [(0.35, {'expression': 'happy', 'look': 'camera'})],
})

# ------------------------------------------------------------------ the punchline
shot('s6a', 'l12', None, 'close-up', focus=Y, items=OUT, effects=[{'effect': 'coin-rain', 'on': Y}],
     overlay=number('$45', 'for a glass of water'), steps={
         Y: [(0.45, {'expression': 'sad', 'look': 'water-glass'})],
     })

# ------------------------------------------------------------------ the storyboard
PLACE = {'place': 'restaurant', 'treatment': 'simple', 'palette': 'warm-interior'}
PLAN = [
    ('s1', 'comic', ['s1a']),
    ('s2', 'comic', ['s2a']),
    ('s3', 'comic', ['s3a', 's3a2', 's3b', 's3c1', 's3c2', 's3d', 's3e']),
    ('s4', 'comic', ['s4a']),
    ('s5', 'curious', ['s5a', 's5b', 's5c', 's5d', 's5e']),
    ('s6', 'comic', ['s6a']),
]
by_id = {sc['id']: sc for sc in draft['scenes']}
scenes = []
used = []
for sid, mood, shot_ids in PLAN:
    mine = [SHOTS[s] for s in shot_ids]
    used += shot_ids
    line_ids = []
    for s in mine:
        if s['line'] not in line_ids:
            line_ids.append(s['line'])
    lines = [LINE[i] for i in line_ids]
    for line in lines:
        said = ' '.join(s['words'] for s in mine if s['line'] == line['id'])
        if said != line['text']:
            raise SystemExit(f"{line['id']}: the shots say \"{said}\" and the script says \"{line['text']}\"")
    base = by_id[sid]
    scenes.append({**{k: v for k, v in base.items() if k not in ('shots', 'lines')}, 'lines': lines,
                   'mood': mood, **PLACE, 'quiet': False, 'shots': mine})
missing = [s for s in SHOTS if s not in used]
if missing:
    raise SystemExit(f'shots in no scene: {missing}')

sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = [
    {'id': T, 'name': 'The Trainer', 'card': 'trainer', 'host': True},
    {'id': S, 'name': 'The Saint', 'card': 'saint'},
    {'id': C, 'name': 'The Cheat', 'card': 'cheat'},
    {'id': P, 'name': 'The Copycat', 'card': 'copycat'},
    {'id': Y, 'name': 'You', 'card': 'you'},
    {'id': W, 'name': 'The waiter', 'voice': 'man',
     'look': {'identity': {'skinTone': 3, 'hair': 'short-crop', 'hairColor': 'black'},
              'outfit': {'clothes': {'top': {'kind': 'jacket', 'cloth': 'steel', 'under': 'cream'},
                                     'bottom': {'kind': 'trousers', 'cloth': 'steel'},
                                     'shoes': {'kind': 'boots', 'cloth': 'steel'}}}}},
]
sb['series'] = 'game-theory'
sb['cover'] = {'shot': 's4a', 'at': 0.8}
sb['scenes'] = scenes
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
