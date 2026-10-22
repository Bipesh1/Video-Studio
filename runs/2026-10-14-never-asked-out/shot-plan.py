"""The shot plan of "How to Make Sure You Never Get Asked Out": writes storyboard.json.

Run it after `npm run plan -- draft` (which writes storyboard.draft.json once a storyboard
exists; never copy storyboard.json over it), and again after any change here.

Two places (the format's "room and real place", Biku 2026-10-14): the question opens in the
room, the story plays at a house party on a Saturday night, and the room comes back for what
was real and the way out. The Trainer runs it all: at the party he is heard, and twice he
stands at the edge of it and talks to us.

At the party, left to right: a woman in a red dress by the wall (the one who waves), the Saint
with her cup, the Copycat across the room, and a guest he is talking to. A second guest leaves
with the first as the party ends.

Faces hold (lesson L-0040), and change inside a shot after what causes them:
  the Saint    hopeful, looking at him; a smile when he smiles back; scared at the thought of
               a no; settles for waiting; watches the others pair up; glad and sure as he
               walks her way; shocked as he walks past; hollow, with her phone.
  the Copycat  easy and friendly all night: smiles back at her; looks round; happy with the
               woman who asked.
  the Trainer  bored, talking to us; pleased with himself when she waits, and at the end.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-14-never-asked-out/'
T, S, K = 'trainer', 'saint', 'copycat'
RIVAL, G1, G2 = 'red-dress', 'guest', 'guest-two'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINE = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}

HEAD = 1 / 9.5
CX = 0.5
# A little closer than the room's usual 1.75 heads: at 1.75 the Saint, slumped, was half out of a
# tall wide shot.
LX, RX = round(CX - 1.5 * HEAD, 3), round(CX + 1.5 * HEAD, 3)

# ------------------------------------------------------------------ the room
CUP = round(CX - 0.5 * HEAD, 3)   # on the table, clear of the Trainer's tie


def room(light='bulb', gloom=None, near=False, things=True):
    """The room, back to front. `near` is the room behind a face seen close."""
    out = [{'prop': light, 'x': CX, 'y': 4.7},
           {'prop': 'iron-chair', 'x': LX}, {'prop': 'iron-chair', 'x': RX},
           {'prop': 'iron-table', 'x': CX}]
    if things and not near:
        # Her cup. (Her phone cannot stand on a table yet: only in a hand.)
        out += [{'prop': 'cup', 'x': CUP, 'y': 1.22}]
    if gloom:
        out.append({'prop': gloom, 'x': CX})
    return out


# ------------------------------------------------------------------ the party
# Close together, so a wide shot in the tall picture comes in near: it pulls back until
# everyone in it is whole, and five people across the room made them tiny.
RIVAL_X, SAINT_X, COPY_X, G1_X, G2_X = 0.3, 0.43, 0.64, 0.77, 0.9
# Late in the party the woman in red is further along the wall, and the Copycat passes the
# Saint on his way to her.
LATE_RIVAL_X, PASS_X = 0.19, 0.31


def party(clock=None, near=False):
    """The house party: the room itself is the place; a wall clock once it is getting late."""
    if near or not clock:
        return []
    return [{'prop': clock, 'x': 0.82, 'y': 4.4}]


def person(pid, face, x, facing, look, pose='stand', then=None, strength=None, holds=None, action=None):
    a = {'character': pid, 'expression': face, 'facing': facing, 'x': x, 'lookAt': look}
    a['action' if action else 'pose'] = action or pose
    if strength is not None:
        a['strength'] = strength
    if holds:
        a['holds'] = holds
    if then:
        a['then'] = then
    return a


def step(at, **change):
    if 'look' in change:
        change['lookAt'] = change.pop('look')
    return {'at': at, **change}


def trainer(face='bored', look='camera', pose='stand', x=CX, **more):
    return person(T, face, x, 'left', look, pose, **more)


def saint(face, look=K, pose='stand', x=SAINT_X, holds='cup', **more):
    # The cup hangs at her side all night, so it never swings out of a close picture on a cut;
    # it comes up only for the sip.
    return person(S, face, x, 'right', look, pose, holds=holds, **more)


def copycat(face='happy', look='ahead', pose='stand', x=COPY_X, facing='left', **more):
    return person(K, face, x, facing, look, pose, **more)


def rival(face='neutral', look=K, pose='stand', x=RIVAL_X, **more):
    return person(RIVAL, face, x, 'right', look, pose, **more)


def guest(face='happy', look=K, x=G1_X, facing='left', **more):
    return person(G1, face, x, facing, look, 'stand', **more)


def guest_two(face='happy', look=G1, x=G2_X, facing='left', **more):
    return person(G2, face, x, facing, look, 'stand', **more)


SHOTS = {}
ORDER = []
MURMUR = ('crowd-murmur', 'start', -12)


def shot(sid, line, words, framing, actors, props, focus=None, overlay=None, move='none', strength=0.2,
         sfx=(), effects=(), transition='cut', picture=None):
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': words or LINE[line]['text'], 'camera': cam,
         'actors': list(actors), 'props': props, 'effects': list(effects),
         'sfx': [{'name': n, 'at': at, 'gainDb': g} for n, at, g in sfx], 'transition': transition}
    # Someone looking at a person who is not in the shot looks the way they face, which is where
    # that person is.
    here = {a['character'] for a in s['actors']} | {p['prop'] for p in props}
    for a in s['actors']:
        if a['lookAt'] not in here and a['lookAt'] not in ('camera', 'up', 'down', 'ahead'):
            a['lookAt'] = 'ahead'
        for st in a.get('then', []):
            if st.get('lookAt') not in (None, 'camera', 'up', 'down', 'ahead') and st['lookAt'] not in here:
                st['lookAt'] = 'ahead'
    if overlay:
        s['overlay'] = overlay
    if picture:
        s['picture'] = picture
    SHOTS[sid] = s
    ORDER.append(sid)


def close_t(sid, line, words=None, face='bored', place='room', **more):
    """The Trainer alone, close, talking to us: in the room, or at the edge of the party."""
    props = room(near=True) if place == 'room' else party(near=True)
    shot(sid, line, words, 'close-up', [trainer(face, **more)], props, focus=T,
         sfx=[] if place == 'room' else [MURMUR])


# ------------------------------------------------------------------ part 1
# The question, close on him in the room, in big words under his face.
shot('s1a', 'l01', None, 'close-up', [trainer()], room(near=True), focus=T, move='push-in', strength=0.12,
     overlay={'kind': 'words', 'lines': ['If you liked someone,', 'would you wait', 'for them to ask?'],
              'stress': 2, 'low': True})
# The room, with her cup on the table.
shot('s1b', 'l02', None, 'wide', [trainer()], room())

# The party. Everyone is there; she is looking at him.
PARTY_ALL = lambda saint_face='happy', saint_strength=0.5, copy_face='happy', two=False: [  # noqa: E731
    rival(), saint(saint_face, strength=saint_strength),
    copycat(copy_face), guest()] + ([guest_two()] if two else [])
shot('s2a', 'l03', None, 'wide', PARTY_ALL(copy_face='neutral', two=True), party(), transition='fade', sfx=[MURMUR])
shot('s2b', 'l04', 'This woman came tonight for one man,', 'medium', [saint('happy', strength=0.5)], party(),
     focus=S, sfx=[MURMUR])
# He catches her eye and smiles.
shot('s2c', 'l04', 'the one in the *orange hat.*', 'medium',
     [copycat('neutral', facing='left', look='down', then=[step(0.35, look='ahead'), step(0.6, expression='happy')])],
     party(),
     focus=K, sfx=[MURMUR])
# She thinks it, mouth shut, smiling back. Her phone goes in her bag; she does not look.
shot('s2d', 'l05', None, 'close-up', [saint('happy', strength=0.5, then=[step(0.25, strength=0.8)])],
     party(near=True), focus=S,
     sfx=[MURMUR, ('ding', 'end', -8)])
close_t('s2e', 'l06', 'What she does not know is this.', place='party')
shot('s2f', 'l06', 'The one who asks gets to *choose.*', 'wide', PARTY_ALL(saint_strength=0.8), party(),
     overlay={'kind': 'words', 'lines': ['The one who asks', 'gets to choose.'], 'stress': 1, 'low': True},
     sfx=[MURMUR])
shot('s2g', 'l07', None, 'medium', [saint('happy', strength=0.8)], party(), focus=S,
     overlay={'kind': 'words', 'lines': ['The one who waits', 'only gets chosen.'], 'stress': 1, 'low': True},
     sfx=[MURMUR])

# The choice: she takes one step toward him and stops.
shot('s3a', 'l08', 'So I give her a choice. Walk over,', 'wide', PARTY_ALL(saint_strength=0.8), party(),
     sfx=[MURMUR])
shot('s3b', 'l08', 'or stay where it feels *safe.*', 'wide',
     [rival(), saint('happy', strength=0.8, x=SAINT_X,
                     then=[step(0.12, action='walk'), step(0.19, pose='stand'),
                           step(0.45, expression='afraid', strength=0.7)]),
      copycat(), guest()], party(), sfx=[MURMUR])
# What stops her, close: a no in front of everyone.
shot('s3c', 'l09', 'What if he says no in front of everyone?', 'close-up',
     [saint('afraid', strength=0.7, x=SAINT_X + 0.04, look='down', pose='stand', then=[step(0.4, strength=1)])],
     party(near=True), focus=S,
     sfx=[MURMUR, ('heartbeat', 'start', -10)])
# She settles it, and sips from her cup.
shot('s3d', 'l09', 'Better to *wait.*', 'medium',
     [saint('afraid', look='down', x=SAINT_X + 0.04,
            then=[step(0.15, expression='neutral'), step(0.35, pose='sip'), step(0.75, pose='stand', look=K)])],
     party(), focus=S, sfx=[MURMUR])
shot('s3e', 'l10', None, 'wide',
     [rival(), saint('neutral', x=SAINT_X + 0.04), copycat(), guest()], party(), move='push-in',
     strength=0.15, sfx=[MURMUR])

# ------------------------------------------------------------------ part 2
# Late. The clock runs past midnight and the guests leave in pairs.
shot('s4a', 'l11', None, 'wide',
     [rival(look='ahead', x=LATE_RIVAL_X),
      saint('neutral', x=SAINT_X + 0.04, look=G1, then=[step(0.45, expression='sad', strength=0.4)]),
      copycat(look='ahead', facing='left', then=[step(0.55, look=S), step(0.85, action='walk')]),
      guest(look='ahead', facing='right', then=[step(0.2, action='walk')]),
      guest_two(look='ahead', facing='right', then=[step(0.25, action='walk')])],
     party('wall-clock-spinning'), sfx=[('tick', 'start', -6), ('crowd-murmur', 'start', -18)])

# He comes her way. She is sure now.
shot('s5a', 'l12', None, 'close-up',
     [saint('sad', strength=0.4, x=SAINT_X + 0.04, pose='stand',
            then=[step(0.15, expression='happy', strength=1), step(0.5, expression='smug')])],
     party(near=True), focus=S,
     sfx=[('tick', 'start', -8)])
shot('s5b', 'l13', None, 'wide',
     [rival(look=K, x=LATE_RIVAL_X), saint('happy', x=SAINT_X + 0.04),
      copycat('happy', look=S, x=0.62, facing='left', action='walk', then=[step(0.6, pose='stand')])],
     party(), sfx=[('footsteps', 'start', -6)])
# The question to us, and in the quiet after it the woman by the wall waves, and he walks
# straight past the Saint to her.
shot('s5c', 'l14', None, 'wide',
     [rival('neutral', look=K, x=LATE_RIVAL_X, then=[step(0.35, pose='wave', expression='happy')]),
      saint('happy', x=SAINT_X + 0.04, look='ahead', then=[step(0.62, expression='surprised')]),
      # He walks in from beside her, past her, and stops by the woman who waved.
      copycat('happy', look=RIVAL, x=PASS_X, facing='left', action='walk', then=[step(0.55, pose='stand')])],
     party(), sfx=[('footsteps', 'start', -6)])
shot('s5d', 'l15', None, 'close-up',
     [saint('surprised', x=SAINT_X + 0.04, look='ahead', pose='stand', then=[step(0.25, expression='horrified')])],
     party(near=True), focus=S,
     effects=[{'effect': 'shock-lines', 'on': S}], sfx=[('boom', 'start', -3)])

# The music stops. He is with her; the Saint is left with her cup, then her phone.
shot('s5e', 'l16', 'Asking lets you choose from the whole room. Waiting leaves you', 'wide',
     [rival('happy', look=K, pose='stand', x=LATE_RIVAL_X), copycat('happy', look=RIVAL, x=PASS_X, facing='left')],
     party())
shot('s5f', 'l16', 'whoever comes to *you.*', 'medium',
     [saint('horrified', x=SAINT_X + 0.04, look='down',
            then=[step(0.2, expression='hollow'), step(0.5, pose='hold-cup', holds='phone')])], party(), focus=S)

# ------------------------------------------------------------------ part 3
# Back in the room, and what was real.
SEATED = [person(S, 'hollow', LX, 'right', 'down', 'sit-slump'), person(K, 'neutral', RX, 'left', T, 'sit')]
shot('s6a', 'l17', 'This is not a story. In 1962, two mathematicians,', 'wide', [trainer()] + SEATED, room(),
     transition='fade', overlay={'kind': 'number', 'text': '1962', 'caption': 'two mathematicians'})
close_t('s6b', 'l17', 'David Gale and Lloyd Shapley, worked out how people pair up.')
shot('s6c', 'l18', 'They proved the side that asks gets', 'medium', [trainer()], room(), focus=T)
shot('s6d', 'l18', 'the best partner it could *keep.*', 'wide', [trainer(look=S)] + SEATED, room())

# What each side gets, as two pictures, one above the other.
GOT = {'layers': [
    {'kind': 'band', 'top': 0, 'bottom': 1},
    {'kind': 'panel', 'top': 0.05, 'bottom': 0.33, 'place': 'living-room', 'palette': 'dusk-violet'},
    {'kind': 'extra', 'x': 0.42, 'y': 0.2, 'head': 0.05, 'pose': 'stand', 'facing': 'right', 'expression': 'happy',
     'light': 1, 'look': {'outfit': {'clothes': {'onePiece': {'kind': 'dress', 'cloth': 'crimson'},
                                                  'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}},
    {'kind': 'person', 'character': K, 'x': 0.58, 'y': 0.2, 'head': 0.05, 'pose': 'stand', 'expression': 'happy',
     'facing': 'left', 'turn': 0.3, 'effects': []},
    {'kind': 'tag', 'text': 'ASKED', 'x': 0.14, 'y': 0.08, 'size': 0.03, 'paint': 'cream'},
    {'kind': 'tag', 'text': 'BEST PARTNER YOU COULD KEEP', 'x': 0.5, 'y': 0.3, 'size': 0.026, 'paint': 'forest'},
    {'kind': 'panel', 'top': 0.35, 'bottom': 0.63, 'place': 'living-room', 'palette': 'dusk-violet'},
    {'kind': 'person', 'character': S, 'x': 0.42, 'y': 0.5, 'head': 0.05, 'pose': 'stand', 'expression': 'hollow',
     'facing': 'right', 'turn': 0.3, 'effects': []},
    {'kind': 'extra', 'x': 0.6, 'y': 0.5, 'head': 0.05, 'pose': 'cross-arms', 'facing': 'left',
     'expression': 'bored', 'light': 0.8},
    {'kind': 'tag', 'text': 'WAITED', 'x': 0.15, 'y': 0.38, 'size': 0.03, 'paint': 'cream'},
    {'kind': 'tag', 'text': 'WORST PARTNER WHO STILL STAYS', 'x': 0.5, 'y': 0.6, 'size': 0.026, 'paint': 'crimson'},
    {'kind': 'band', 'top': 0.63, 'bottom': 1},
]}
shot('s6e', 'l19', 'The side that waits gets the *worst*', 'wide', [trainer()], room(),
     # A camera at y 0.4 moved the lower picture down under the captions; the picture is drawn for
     # the middle of the frame, and eases in only as far as keeps its labels clear of them.
     picture={**GOT, 'from': {'x': 0.5, 'y': 0.5, 'zoom': 1}, 'to': {'x': 0.5, 'y': 0.505, 'zoom': 1.03}})
shot('s6f', 'l19', 'partner who would still stay.', 'wide', [trainer()], room(),
     picture={**GOT, 'from': {'x': 0.5, 'y': 0.505, 'zoom': 1.03}, 'to': {'x': 0.5, 'y': 0.51, 'zoom': 1.06}})
shot('s6g', 'l20', None, 'medium', [trainer()], room(), focus=T,
     overlay={'kind': 'number', 'text': '2012', 'caption': 'Nobel Prize'})
close_t('s6h', 'l21', 'This year, that same method placed more than')
shot('s6i', 'l21', 'thirty-eight thousand young doctors in US hospitals.', 'wide', [trainer()] + SEATED, room(),
     overlay={'kind': 'number', 'text': '38,000', 'caption': 'young doctors', 'countUp': True})
close_t('s6j', 'l22', None)
# Everyone waiting: from the Saint alone to a whole crowd of people looking down at their phones.
CROWD = [
    {'kind': 'room', 'place': 'living-room', 'palette': 'dusk-violet'},
    {'kind': 'crowd', 'rows': 7, 'cols': 9, 'top': 0.3, 'bottom': 0.66, 'head': 0.055, 'back': 0.45,
     'pose': 'look-down', 'expression': 'neutral', 'light': 0.65, 'hole': {'x': 0.5, 'y': 0.55},
     'holeRadius': 0.07, 'seed': 3},
    {'kind': 'person', 'character': S, 'x': 0.5, 'y': 0.55, 'head': 0.05, 'pose': 'look-down',
     'expression': 'hollow', 'facing': 'right', 'turn': 0.3, 'effects': []},
]
shot('s6k', 'l23', 'You do this too, waiting for the text,', 'wide', [trainer()], room(),
     picture={'layers': CROWD, 'from': {'x': 0.5, 'y': 0.56, 'zoom': 5}, 'to': {'x': 0.5, 'y': 0.54, 'zoom': 2.5}})
shot('s6l', 'l23', 'the call, the *first move.*', 'wide', [trainer()], room(),
     picture={'layers': CROWD, 'from': {'x': 0.5, 'y': 0.54, 'zoom': 2.5}, 'to': {'x': 0.5, 'y': 0.48, 'zoom': 1}})

# The way out: a card read by the voice from outside, each line lit as it is read.
CARD = ['Like someone?', 'Ask first.', 'Ask once, kindly.', 'Take no for an answer.']


def leak(sid, line, words, reading, light, gloom):
    overlay = {'kind': 'page', 'lines': CARD}
    if reading is not None:
        overlay['stress'] = reading
    shot(sid, line, words, 'wide', [], room(light=light, gloom=gloom), overlay=overlay)


leak('s7a', 'l24', 'Here is how you beat it.', None, 'bulb-flicker', 'gloom-flicker')
leak('s7b', 'l24', 'If you like someone, ask *first.*', 1, 'bulb-dim', 'gloom')
leak('s7c', 'l25', 'Ask once, kindly, and accept a no.', 2, 'bulb-dim', 'gloom')
leak('s7d', 'l25', 'A no costs you one *minute.*', 3, 'bulb-dim', 'gloom')
shot('s7e', 'l26', 'So would you wait for them to ask?', 'wide',
     [trainer(then=[step(0.5, expression='smug')])] + SEATED, room(), move='push-in',
     strength=0.3)
shot('s7f', 'l26', 'Only if you want *what is left.*', 'close-up',
     [trainer('smug', then=[step(0.6, expression='bored')])], room(near=True),
     focus=T, sfx=[('clunk', 'end', 0)])

# ------------------------------------------------------------------ the storyboard
PARTY = {'place': 'living-room', 'treatment': 'atmospheric', 'palette': 'dusk-violet'}
ROOM = {'place': 'the-table', 'treatment': 'atmospheric', 'palette': 'table-grey'}
# Each scene of the draft, and the extra quiet scene the last line of part 2 is moved into
# (Biku's script: "The music stops.").
PLAN = [
    ('s1', 'unease', ROOM, ['s1a', 's1b'], False),
    ('s2', 'unease', PARTY, ['s2a', 's2b', 's2c', 's2d', 's2e', 's2f', 's2g'], False),
    ('s3', 'unease', PARTY, ['s3a', 's3b', 's3c', 's3d', 's3e'], False),
    ('s4', 'closing-in', PARTY, ['s4a'], False),
    ('s5', 'closing-in', PARTY, ['s5a', 's5b', 's5c', 's5d'], False),
    ('s5q', 'closing-in', PARTY, ['s5e', 's5f'], True),
    ('s6', 'aftermath', ROOM, ['s6a', 's6b', 's6c', 's6d', 's6e', 's6f', 's6g', 's6h', 's6i', 's6j', 's6k',
                               's6l'], False),
    ('s7', 'aftermath', ROOM, ['s7a', 's7b', 's7c', 's7d', 's7e', 's7f'], False),
]
by_id = {sc['id']: sc for sc in draft['scenes']}
scenes = []
for sid, mood, where, shot_ids, quiet in PLAN:
    mine = [SHOTS[s] for s in shot_ids]
    line_ids = []
    for s in mine:
        if s['line'] not in line_ids:
            line_ids.append(s['line'])
    base = by_id.get(sid) or by_id['s5']
    lines = [LINE[i] for i in line_ids]
    for line in lines:
        said = ' '.join(s['words'] for s in mine if s['line'] == line['id'])
        if said != line['text']:
            raise SystemExit(f"{line['id']}: the shots say \"{said}\" and the script says \"{line['text']}\"")
    scene = {**{k: v for k, v in base.items() if k not in ('shots', 'lines')}, 'id': sid, 'lines': lines,
             'mood': mood, **where, 'quiet': quiet, 'shots': mine}
    scenes.append(scene)
missing = [s for s in ORDER if not any(s in [x['id'] for x in sc['shots']] for sc in scenes)]
if missing:
    raise SystemExit(f'shots in no scene: {missing}')

sb = {k: v for k, v in draft.items() if k != 'scenes'}
GUEST_LOOK = {'outfit': {'clothes': {'top': {'kind': 'shirt', 'cloth': 'steel'},
                                     'bottom': {'kind': 'trousers', 'cloth': 'denim'},
                                     'shoes': {'kind': 'sneakers', 'cloth': 'brown'}}}}
sb['cast'] = [{'id': T, 'name': 'The Trainer', 'card': 'trainer', 'host': True},
              {'id': S, 'name': 'The Saint', 'card': 'saint'},
              {'id': K, 'name': 'The Copycat', 'card': 'copycat'},
              {'id': RIVAL, 'name': 'The woman in the red dress',
               'look': {'outfit': {'clothes': {'onePiece': {'kind': 'dress', 'cloth': 'crimson'},
                                               'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}},
              {'id': G1, 'name': 'A guest', 'look': GUEST_LOOK},
              {'id': G2, 'name': 'Another guest',
               'look': {'outfit': {'clothes': {'onePiece': {'kind': 'dress', 'cloth': 'forest'},
                                               'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}}]
sb['series'] = 'game-theory'
sb['cover'] = {'shot': 's5c', 'at': 0.7}
sb['scenes'] = scenes
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
