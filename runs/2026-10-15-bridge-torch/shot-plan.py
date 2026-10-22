"""The shot plan of "How to Get Four People Across a Bridge Before the Torch Dies": writes storyboard.json.

Run it after `npm run plan -- draft`, and again after any change here.

One place for the story, the gorge at night (`gorge-bridge`: the near cliff on the left, the
rope bridge, the far cliff on the right, GORGE in engine/src/backgrounds/Background.tsx), and
the Trainer's dark room at the end only (the thriller playbook). The Trainer is heard over the
gorge and seen only in his room.

Who stands where, through the five crossings (x across the scene):
  start         old man .04, woman .15, Saint .26, Cheat .37 on the near cliff
  1 cross       Saint and Cheat walk over: Saint stops .95, Cheat .83
  2 back        the Cheat runs back with the torch: stops .37
  3 cross       the old man and the woman walk over: the woman stops .83, the old man .71
  4 back        the Saint walks back with the torch: stops .26
  5 cross       the Saint and the Cheat walk over: the Saint stops .73, the Cheat .61
  end           old man .85, woman .97, Saint .73, Cheat .61 (the two who waited moved along)
The torch burns down: full in the rules, low from "only lasts seventeen minutes", dying on the
last two trips, out as they arrive.

Faces hold (L-0040), each change after its cause:
  the Saint    afraid of the bridge; hopeful asking the fast man; afraid at nineteen; firm
               on "Nobody stays behind"; thinking; dread at the question; firm as she sees it;
               glad at the end.
  the Cheat    calculating; thinking as he counts; shocked at nineteen; afraid; cold as he
               says to leave the old man; plain through the crossings; glad at the end.
  the old man  afraid; empty when the Cheat would leave him; glad at the end.
  the woman    afraid; suspicious of the Cheat; glad at the end.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-15-bridge-torch/'
T, S, C = 'trainer', 'saint', 'cheat'
OLD, BAG = 'old-man', 'woman'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINE = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}

OLD_X, BAG_X, SAINT_X, CHEAT_X = 0.03, 0.15, 0.27, 0.39
HEAD = 1 / 9.5
CX = 0.5
LX, RX = round(CX - 1.5 * HEAD, 3), round(CX + 1.5 * HEAD, 3)
WIND = ('wind', 'start', -6)
RAIN = ('rain', 'start', -6)


def gorge():
    return []


def room(light='bulb', gloom=None, near=False):
    out = [{'prop': light, 'x': CX, 'y': 4.7},
           {'prop': 'iron-chair', 'x': LX}, {'prop': 'iron-chair', 'x': RX},
           {'prop': 'iron-table', 'x': CX}]
    if gloom:
        out.append({'prop': gloom, 'x': CX})
    return out


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


def saint(face, x=SAINT_X, look='ahead', facing='right', **more):
    return person(S, face, x, facing, look, **more)


def cheat(face, x=CHEAT_X, look='ahead', facing='right', **more):
    return person(C, face, x, facing, look, **more)


def old(face, x=OLD_X, look='ahead', facing='right', **more):
    return person(OLD, face, x, facing, look, **more)


def bag(face, x=BAG_X, look='ahead', facing='right', **more):
    return person(BAG, face, x, facing, look, holds='bag', **more)


def trainer(face='bored', look='camera', pose='stand', **more):
    return person(T, face, CX, 'left', look, pose, **more)


SHOTS = {}


def shot(sid, line, words, framing, actors, props=None, focus=None, overlay=None, move='none', strength=0.2,
         sfx=(), effects=(), transition='cut', picture=None):
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': words or LINE[line]['text'], 'camera': cam,
         'actors': list(actors), 'props': props if props is not None else gorge(), 'effects': list(effects),
         'sfx': [{'name': n, 'at': at, 'gainDb': g} for n, at, g in sfx], 'transition': transition}
    # Someone looking at a person who is not in the shot looks the way they face.
    here = {a['character'] for a in s['actors']} | {p['prop'] for p in s['props']}
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


def number(text, caption):
    return {'kind': 'number', 'text': text, 'caption': caption}


def four(saint_face='afraid', cheat_face='calculating', old_face='afraid', bag_face='afraid', torch='torch',
         saint_strength=0.5, **more):
    """The four at the edge of the near cliff, the Cheat with the torch at the bridge."""
    return [old(old_face, strength=0.5), bag(bag_face, strength=0.5),
            saint(saint_face, strength=saint_strength, look=C),
            cheat(cheat_face, holds=torch, look='ahead', **more)]


# ------------------------------------------------------------------ part 1
# The question in big words over the gorge, the four of them small at the edge.
# The gorge and its bridge alone, under the question: the place before the people.
shot('s1a', 'l01', None, 'wide', [], move='push-in', strength=0.15, sfx=[WIND],
     overlay={'kind': 'words', 'lines': ['If the slowest person', 'holds everyone back,', 'who should walk with them?'],
              'stress': 2})
shot('s1b', 'l02', None, 'close-up', [saint('afraid', strength=0.5, look='ahead')], focus=S,
     sfx=[WIND, ('thunder', 'start', -4)])

shot('s2a', 'l03', None, 'wide', four(), sfx=[WIND])
shot('s2b', 'l04', 'Two fit at a time,', 'wide', four(), sfx=[WIND])
shot('s2b2', 'l04', 'and someone must carry the torch back each time.', 'medium',
     [cheat('calculating', holds='torch', pose='wave')], focus=C, sfx=[WIND])
shot('s2c', 'l05', 'The man in the red tie crosses in one minute,', 'medium',
     [cheat('calculating', holds='torch', pose='wave')], focus=C, overlay=number('1', 'minute'), sfx=[WIND])
shot('s2d', 'l05', 'and the woman in the scarf in two.', 'medium', [saint('afraid', strength=0.5)], focus=S,
     overlay=number('2', 'minutes'), sfx=[WIND])
shot('s2e', 'l06', 'The woman with the bag needs five,', 'medium', [bag('afraid', strength=0.5)], focus=BAG,
     overlay=number('5', 'minutes'), sfx=[WIND])
shot('s2f', 'l06', 'the old man ten.', 'medium', [old('afraid', strength=0.5)], focus=OLD,
     overlay=number('10', 'minutes'), sfx=[WIND])
shot('s2g', 'l07', None, 'wide', four(), sfx=[WIND])
# He lowers the torch in his own shot, so it does not swing across her face on the next cut.
shot('s2h', 'l08', None, 'medium', [cheat('calculating', holds='torch', pose='wave', then=[step(0.75, pose='stand')])],
     focus=C,
     overlay=number('17', 'minutes of fire'), sfx=[WIND, ('tick', 'start', -4)])

# The obvious plan, and why it fails.
shot('s3a', 'l09', None, 'wide',
     [saint('happy', strength=0.5, look=C, then=[step(0.15, look=C)]), cheat('calculating', holds='torch', look=S,
                                                                            facing='left')],
     sfx=[WIND])
shot('s3b', 'l10', 'Ten, five and two minutes, plus two runs back,', 'medium',
     [cheat('thinking', holds='torch', look='up', facing='left')], focus=C, sfx=[WIND])
shot('s3c', 'l10', 'makes *nineteen* minutes.', 'medium',
     [cheat('thinking', holds='torch', facing='left', then=[step(0.2, expression='horrified')])], focus=C,
     overlay=number('19', 'minutes'), effects=[{'effect': 'shock-lines', 'on': C}], sfx=[WIND, ('boom', 'start', -6)])
shot('s3d', 'l11', None, 'close-up', [cheat('horrified', holds='torch-low', facing='left',
                                              then=[step(0.3, expression='afraid')])], focus=C, sfx=[WIND])
# The storm closes in and he says it: leave the old man.
shot('s3e', 'l12', 'So we leave the old man.', 'wide',
     [old('afraid', strength=0.5, look=C), bag('afraid', strength=0.5, look=C), saint('afraid', look=C),
      cheat('afraid', holds='torch-low', look=OLD, facing='left',
            then=[step(0.25, expression='calculating')])],
     move='push-in', strength=0.2, sfx=[WIND, ('thunder', 'start', -2), ('creak', 'middle', -4)])
shot('s3f', 'l12', 'Without him, we make it easily.', 'close-up',
     [cheat('calculating', holds='torch-low', look='ahead', facing='left')], focus=C, sfx=[WIND])

# ------------------------------------------------------------------ part 2
shot('s4a', 'l13', None, 'wide',
     [old('afraid', look='down', then=[step(0.15, expression='hollow')]),
      bag('afraid', look=C, then=[step(0.2, expression='suspicious', pose='cross-arms')]),
      saint('afraid', look=C, then=[step(0.2, expression='determined')]),
      cheat('calculating', holds='torch-low', look=OLD, facing='left')], sfx=[WIND])
shot('s4b', 'l14', 'Every trip with the old man takes ten minutes,', 'close-up',
     [saint('determined', look='down', then=[step(0.35, expression='thinking')])], focus=S, sfx=[WIND])
shot('s4c', 'l14', 'whoever walks beside him.', 'wide',
     [old('hollow', look='down'), bag('suspicious', look=C, pose='cross-arms'), saint('thinking', look='down'),
      cheat('calculating', holds='torch-low', look=OLD, facing='left')], sfx=[WIND])
# The question to us, and the silence: rain starts, her eyes, her heart.
shot('s5a', 'l15', None, 'eyes', [saint('thinking', look='ahead', then=[step(0.4, expression='dread', strength=0.7)])],
     focus=S, sfx=[RAIN, ('thunder', 'start', -6), ('heartbeat-rising', 'start', -4)])

# ------------------------------------------------------------------ part 3
shot('s6a', 'l16', None, 'close-up', [saint('dread', strength=0.7, then=[step(0.4, expression='determined')])],
     focus=S, sfx=[RAIN])
# 1: the two fastest over.
shot('s6b', 'l17', 'The two fastest cross in two minutes.', 'wide',
     [cheat('determined', x=0.83, holds='torch-low', action='walk', then=[step(0.75, pose='stand')]),
      saint('determined', x=0.95, action='walk', then=[step(0.8, pose='stand')])],
     sfx=[RAIN, ('footsteps', 'start', -6)])
# 2: the fast man runs back with the torch.
# Wide: a close shot cannot keep up with a man running, and the torch must be seen going back.
# He runs to the end of the shot: from a run's stride to standing is a jump in one frame (qa, s6c).
shot('s6c', 'l17', 'The man in the red tie runs back in one.', 'wide',
     [cheat('determined', x=CHEAT_X, holds='torch-low', facing='left', action='run')],
     sfx=[RAIN, ('footsteps', 'start', -4)])
# 3: the two slowest over together, the torch held high, the ropes creaking.
shot('s6d', 'l18', None, 'wide',
     [old('afraid', x=0.71, holds='torch-low', action='walk', strength=0.5, then=[step(0.8, pose='stand')]),
      person(BAG, 'afraid', 0.83, 'right', 'ahead', strength=0.5, holds='bag', action='walk',
             then=[step(0.75, pose='stand')]),
      saint('happy', x=0.95, facing='left', strength=0.5)],
     sfx=[RAIN, ('creak', 'start', -4), ('footsteps', 'start', -8)])
# 4: the Saint back with what is left of the torch.
shot('s6e', 'l19', 'The woman in the scarf returns in two,', 'medium',
     [saint('determined', x=SAINT_X, holds='torch-dying', facing='left', action='walk', then=[step(0.75, pose='stand')])],
     focus=S, sfx=[RAIN, ('footsteps', 'start', -6)])
# 5: the two fastest over again, the flame almost gone.
shot('s6f', 'l19', 'and the two fastest cross again in two.', 'wide',
     [old('happy', x=0.85, strength=0.6, facing='left'), bag('happy', x=0.97, strength=0.6, facing='left'),
      cheat('determined', x=0.61, action='walk', then=[step(0.75, pose='stand')]),
      saint('determined', x=0.73, holds='torch-dying', action='walk', then=[step(0.8, pose='stand')])],
     sfx=[RAIN, ('footsteps', 'start', -6)])
# All four across, and the torch goes out.
shot('s6g', 'l20', None, 'wide',
     [old('happy', x=0.85, facing='left', strength=0.6, then=[step(0.5, strength=1)]),
      bag('happy', x=0.97, facing='left', strength=0.6, then=[step(0.5, strength=1)]),
      cheat('determined', x=0.61, then=[step(0.45, expression='happy', strength=0.6)]),
      saint('determined', x=0.73, holds='torch-dying', look=C, facing='left',
            then=[step(0.3, holds='torch-out'), step(0.5, expression='happy')])],
     move='push-in', strength=0.15, sfx=[RAIN])

OLD_LOOK = {'age': 'elder', 'identity': {'skinTone': 2, 'hair': 'short-crop', 'hairColor': 'white'},
            'outfit': {'clothes': {'top': {'kind': 'jacket', 'cloth': 'tan', 'under': 'cream'},
                                   'bottom': {'kind': 'trousers', 'cloth': 'brown'},
                                   'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}
BAG_LOOK = {'outfit': {'clothes': {'top': {'kind': 'shirt', 'cloth': 'cream'},
                                   'bottom': {'kind': 'skirt', 'cloth': 'brown'},
                                   'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}


def walker(x, ground, face, look=None, who=None, facing='right'):
    body = {'x': x, 'y': 0.5, 'ground': ground, 'head': 0.062, 'pose': 'stand', 'facing': facing,
            'expression': face, 'turn': 0.3, 'effects': []}
    if who:
        return {'kind': 'person', 'character': who, **body}
    return {'kind': 'extra', 'light': 1, 'look': look, **body}


# What each plan gets you, one above the other (2026-10-16: who walks in each plan is the plan).
GOT = {'layers': [
    {'kind': 'band', 'top': 0, 'bottom': 1},
    # The obvious plan: the fastest walks everyone over, one at a time; here, the old man.
    {'kind': 'panel', 'top': 0.05, 'bottom': 0.33, 'place': 'gorge-bridge', 'palette': 'storm-slate'},
    walker(0.4, 0.315, 'afraid', OLD_LOOK),
    walker(0.6, 0.315, 'determined', who=C, facing='left'),
    {'kind': 'tag', 'text': 'FASTEST WALKS EVERYONE', 'x': 0.5, 'y': 0.075, 'size': 0.026, 'paint': 'cream'},
    {'kind': 'tag', 'text': '19 MINUTES, THE TORCH DIES', 'x': 0.5, 'y': 0.3, 'size': 0.026, 'paint': 'crimson'},
    # The clever plan: the two slowest walk together.
    {'kind': 'panel', 'top': 0.35, 'bottom': 0.63, 'place': 'gorge-bridge', 'palette': 'storm-slate'},
    walker(0.4, 0.615, 'neutral', OLD_LOOK),
    walker(0.6, 0.615, 'neutral', BAG_LOOK, facing='left'),
    {'kind': 'tag', 'text': 'SLOWEST WALK TOGETHER', 'x': 0.5, 'y': 0.375, 'size': 0.026, 'paint': 'cream'},
    {'kind': 'tag', 'text': '17 MINUTES, EVERYONE ACROSS', 'x': 0.5, 'y': 0.6, 'size': 0.026, 'paint': 'forest'},
    {'kind': 'band', 'top': 0.63, 'bottom': 1},
]}
shot('s6h', 'l21', "The old man's ten minutes were coming anyway,", 'wide', [trainer()], room(),
     picture={**GOT, 'from': {'x': 0.5, 'y': 0.5, 'zoom': 1}, 'to': {'x': 0.5, 'y': 0.505, 'zoom': 1.03}})
shot('s6i', 'l21', 'so the five fit inside them.', 'wide', [trainer()], room(),
     picture={**GOT, 'from': {'x': 0.5, 'y': 0.505, 'zoom': 1.03}, 'to': {'x': 0.5, 'y': 0.51, 'zoom': 1.06}})

# ------------------------------------------------------------------ the room: it was real, the answer
shot('s7a', 'l22', 'This is a real puzzle.', 'medium', [trainer('smug', pose='fix-tie',
                                                                  then=[step(0.4, pose='stand', expression='bored')])],
     room(), focus=T, transition='fade')
shot('s7b', 'l22', 'Saul Levmore and Elizabeth Cook printed it in a book in 1981.', 'wide', [trainer()], room(),
     overlay=number('1981', 'the first time in print'))
shot('s7c', 'l23', None, 'medium', [trainer()], room(), focus=T, overlay=number('2002', 'proved for any group'))
CROWD = [
    {'kind': 'room', 'place': 'city', 'palette': 'storm-slate'},
    {'kind': 'crowd', 'rows': 7, 'cols': 9, 'top': 0.3, 'bottom': 0.66, 'head': 0.055, 'back': 0.45,
     'pose': 'look-down', 'expression': 'exhausted', 'light': 0.65, 'hole': {'x': 0.5, 'y': 0.55},
     'holeRadius': 0.07, 'seed': 4},
    {'kind': 'person', 'character': S, 'x': 0.5, 'y': 0.55, 'head': 0.05, 'pose': 'look-down',
     'expression': 'exhausted', 'facing': 'right', 'turn': 0.3, 'effects': []},
]
shot('s7d', 'l24', 'You make the first plan every time', 'wide', [trainer()], room(),
     picture={'layers': CROWD, 'from': {'x': 0.5, 'y': 0.56, 'zoom': 5}, 'to': {'x': 0.5, 'y': 0.54, 'zoom': 2.5}})
shot('s7e', 'l24', 'you spread slow jobs across your day.', 'wide', [trainer()], room(),
     picture={'layers': CROWD, 'from': {'x': 0.5, 'y': 0.54, 'zoom': 2.5}, 'to': {'x': 0.5, 'y': 0.48, 'zoom': 1}})

CARD = ['Slow jobs?', 'Start them together.', 'Wait once.']


def leak(sid, line, words, reading, light, gloom):
    overlay = {'kind': 'page', 'lines': CARD}
    if reading is not None:
        overlay['stress'] = reading
    shot(sid, line, words, 'wide', [], room(light=light, gloom=gloom), overlay=overlay)


leak('s8a', 'l25', 'Start your slowest jobs at the same time,', 1, 'bulb-flicker', 'gloom-flicker')
leak('s8b', 'l25', 'so you only wait once.', 2, 'bulb-dim', 'gloom')
shot('s8c', 'l26', 'So who should walk with the slowest person?', 'wide', [trainer()], room(), move='push-in',
     strength=0.3)
shot('s8d', 'l26', 'The next slowest *one*.', 'close-up',
     [trainer(then=[step(0.4, expression='smug')])], room(near=True), focus=T, sfx=[('clunk', 'end', 0)])

# ------------------------------------------------------------------ the storyboard
GORGE = {'place': 'gorge-bridge', 'treatment': 'atmospheric', 'palette': 'storm-slate'}
ROOM = {'place': 'the-table', 'treatment': 'atmospheric', 'palette': 'table-grey'}
PLAN = [
    ('s1', 'tense', GORGE, ['s1a', 's1b']),
    ('s2', 'unease', GORGE, ['s2a', 's2b', 's2b2', 's2c', 's2d', 's2e', 's2f', 's2g', 's2h']),
    ('s3', 'closing-in', GORGE, ['s3a', 's3b', 's3c', 's3d', 's3e', 's3f']),
    ('s4', 'closing-in', GORGE, ['s4a', 's4b', 's4c']),
    ('s5', 'closing-in', GORGE, ['s5a']),
    ('s6', 'tense', GORGE, ['s6a', 's6b', 's6c', 's6d', 's6e', 's6f', 's6g', 's6h', 's6i']),
    ('s7', 'aftermath', ROOM, ['s7a', 's7b', 's7c', 's7d', 's7e']),
    ('s8', 'aftermath', ROOM, ['s8a', 's8b', 's8c', 's8d']),
]
by_id = {sc['id']: sc for sc in draft['scenes']}
scenes = []
used = []
for sid, mood, where, shot_ids in PLAN:
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
                   'mood': mood, **where, 'quiet': False, 'shots': mine})
missing = [s for s in SHOTS if s not in used]
if missing:
    raise SystemExit(f'shots in no scene: {missing}')

sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = [
    {'id': T, 'name': 'The Trainer', 'card': 'trainer', 'host': True},
    {'id': S, 'name': 'The Saint', 'card': 'saint'},
    {'id': C, 'name': 'The Cheat', 'card': 'cheat'},
    {'id': OLD, 'name': 'The old man',
     'look': {'age': 'elder', 'identity': {'skinTone': 2, 'hair': 'short-crop', 'hairColor': 'white'},
              'outfit': {'clothes': {'top': {'kind': 'jacket', 'cloth': 'tan', 'under': 'cream'},
                                     'bottom': {'kind': 'trousers', 'cloth': 'brown'},
                                     'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}},
    {'id': BAG, 'name': 'The woman with the bag',
     'look': {'outfit': {'clothes': {'top': {'kind': 'shirt', 'cloth': 'cream'},
                                     'bottom': {'kind': 'skirt', 'cloth': 'brown'},
                                     'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}},
]
sb['series'] = 'game-theory'
sb['cover'] = {'shot': 's3e', 'at': 0.7}
sb['scenes'] = scenes
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
