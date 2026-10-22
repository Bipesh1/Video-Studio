"""The shot plan of Tape 01, "How to Make Someone Sit in Smoke": writes storyboard.json.

Run it after `npm run plan -- draft` has laid the script out (kept as storyboard.draft.json),
and again after any change here. The words and the cut of the shots are the draft's; this
decides who is in each shot, their faces, the camera, the things in the room and the sound.

The room never changes: the Trainer stands behind the table under the bulb, the Copycat sits on
the left and the Cheat on the right, and the House's four stand in the gallery behind them.

Faces hold (lesson L-0040). Each person has one line of feeling, and a face changes inside a
shot, after what causes it:
  the Copycat  glad of an easy twenty; a first doubt at the smoke; half reassured;
               (part 2) suspicious; a smile he does not mean; afraid; dread; hollow.
  the Cheat    one face from start to finish. He is paid to stay calm.
  the Trainer  a smile for the Subject, none for us; pleased with himself when it works.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-12-the-smoke/'
T, K, C = 'trainer', 'copycat', 'cheat'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
DRAFT = {sh['id']: sh for sc in draft['scenes'] for sh in sc['shots']}

HEAD = 1 / 9.5
CX = 0.5
LX, RX = round(CX - 1.75 * HEAD, 3), round(CX + 1.75 * HEAD, 3)
NOTE = round(CX - 0.5 * HEAD, 3)   # the twenty lies on the Subject's side, clear of the Trainer's tie
COIN = round(RX - 0.13, 3)         # the gold coin lies just in front of the Cheat, to be taken
ROW = 'house-row'


def room(smoke=None, coin=False, tag=False, light='bulb', gloom=None, near=False):
    """Everything standing in the room, back to front. `near` is the room behind a face seen
    close: the gallery and the things on the table are left out, so nothing crosses behind the
    head or pokes up under the caption."""
    note = {'prop': 'banknote-20', 'x': NOTE, 'y': 1.22}
    if tag:
        note['tag'] = '$20'
    things = [] if near else [{'prop': ROW, 'x': CX}]
    things += [{'prop': light, 'x': CX, 'y': 4.7},
               {'prop': 'iron-chair', 'x': LX}, {'prop': 'iron-chair', 'x': RX},
               {'prop': 'iron-table', 'x': CX}]
    if not near:
        things.append(note)
    if coin and not near:
        things.append({'prop': 'coin', 'x': COIN, 'y': 1.22})
    if smoke:
        things.append({'prop': smoke, 'x': CX})
    if gloom:
        things.append({'prop': gloom, 'x': CX})
    return things


def person(pid, face, x, facing, look, pose='sit', then=None, strength=None, holds=None, action=None, back=False):
    a = {'character': pid, 'expression': face, 'facing': facing, 'x': x, 'lookAt': look}
    a['action' if action else 'pose'] = action or pose
    if strength is not None:
        a['strength'] = strength
    if holds:
        a['holds'] = holds
    if back:
        a['back'] = True
    if then:
        a['then'] = then
    return a


def trainer(face='bored', look='camera', pose='stand', **more):
    return person(T, face, CX, 'left', look, pose, **more)


def copycat(face, look=T, pose='sit', **more):
    return person(K, face, LX, 'right', look, pose, **more)


def cheat(look=K, face='smug', pose='sit', **more):
    return person(C, face, RX, 'left', look, pose, **more)


def paid(look=K, **more):
    """The Cheat once the coin is in his hand: it stays there."""
    return cheat(look, holds='coin', **more)


def step(at, **change):
    return {'at': at, **change}


def to_us(at=0.12):
    """The smile drops and his eyes come to the camera, inside the shot."""
    return [step(at, expression='bored', lookAt='camera')]


def to_him(at=0.15):
    """He turns to the Subject, and the smile comes on."""
    return [step(at, expression='happy', lookAt=K)]


SHOTS = {}


def shot(sid, framing, actors, props, focus=None, overlay=None, move='none', strength=0.2, sfx=(), fade=False):
    d = DRAFT[sid]
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    if framing in ('close-up', 'eyes') and any(p['prop'] in (ROW, 'banknote-20', 'coin') for p in props):
        raise SystemExit(f'{sid}: a close shot takes room(near=True)')
    s = {'id': sid, 'line': d['line'], 'words': d['words'], 'camera': cam, 'actors': list(actors),
         'props': props, 'effects': [], 'sfx': [{'name': n, 'at': at, 'gainDb': g} for n, at, g in sfx],
         'transition': 'fade' if fade else 'cut'}
    if overlay:
        s['overlay'] = overlay
    SHOTS[sid] = s


# ------------------------------------------------------------------ part 1
# 1. THE QUESTION. His face, close, and the question under it. The Subject has not come in yet.
shot('s1a', 'close-up', [trainer(), cheat(T)], room(near=True), focus=T,
     overlay={'kind': 'words', 'lines': ['How long', 'would you sit', 'in smoke?'], 'stress': 2, 'low': True})
shot('s1b', 'wide', [trainer(), cheat(T)], room(coin=True))
shot('s1c', 'close-up', [trainer(), cheat(T)], room(near=True), focus=T)

# 2. THE PRODUCT. The Copycat walks in and sits; the Trainer names his type and his number.
shot('s2a', 'wide',
     [trainer(), copycat('happy', look=T, action='walk', then=[step(0.5, pose='sit')]), cheat()],
     room(coin=True), overlay={'kind': 'pointer', 'text': 'SUBJECT 112', 'to': K, 'at': {'x': 0.25, 'y': 0.12}},
     # Held on the Trainer, so the camera does not stand back to take in the walk from the edge.
     focus=T, sfx=[('footsteps', 'start', 0)])
shot('s2b', 'wide', [trainer(), copycat('happy', look='banknote-20'), cheat()], room(coin=True, tag=True))
shot('s2c', 'close-up', [trainer(look='camera', then=to_him()), copycat('happy'), cheat()], room(near=True),
     focus=T)
shot('s2d', 'close-up', [trainer('happy', look=K), copycat('happy'), cheat()], room(near=True), focus=K)
shot('s2e', 'close-up', [trainer('happy', look=K), copycat('happy', look=C), cheat()], room(near=True), focus=C)
# The bomb: the coin is taken where we can see it, while the Subject looks the other way.
shot('s2f', 'wide',
     [trainer('happy', look=K, then=to_us()), copycat('happy', look='up'),
      cheat('coin', then=[step(0.3, holds='coin'), step(0.75, lookAt=K)])],
     room(coin=True), focus=T, sfx=[('ding', 'middle', -4)])
shot('s2g', 'close-up', [trainer(), copycat('happy', look='up'), paid()], room(near=True), focus=T,
     sfx=[('click', 'end', 0)])

# 3. THE DEMONSTRATION. The smoke comes in, and the counter starts with it.
shot('s3a', 'wide',
     [trainer(look=K), copycat('happy', look='up', then=[step(0.4, expression='thinking', lookAt='smoke-creeping')]),
      paid()],
     room(smoke='smoke-creeping'))
shot('s3b', 'close-up', [trainer(look=K), copycat('thinking', look=C), paid()], room(smoke='smoke-low', near=True), focus=C)
shot('s3c', 'close-up',
     [trainer(look=K), copycat('thinking', look=C, then=[step(0.3, expression='happy', strength=0.6)]), paid()],
     room(smoke='smoke-low', near=True), focus=K)
shot('s3d', 'close-up', [trainer(look=K), copycat('happy', look=C, strength=0.6), paid()],
     room(smoke='smoke-low', near=True), focus=C)
# He checks the room and not the smoke: the calm row is the picture.
shot('s3e', 'wide', [trainer(look=K), copycat('happy', look=ROW, strength=0.6), paid()], room(smoke='smoke-low'))
shot('s3f', 'close-up', [trainer(), copycat('happy', look='up', strength=0.6), paid()], room(smoke='smoke-low', near=True),
     focus=T)

# ------------------------------------------------------------------ part 2
# Thicker. The smoke climbs to the table, and he says "fine" out loud.
shot('s4a', 'wide',
     [trainer(look=K),
      copycat('happy', look='smoke-rising', strength=0.6, then=[step(0.4, expression='suspicious')]), paid()],
     room(smoke='smoke-rising'))
shot('s4b', 'close-up', [trainer(look=K), copycat('suspicious', look=C), paid()], room(smoke='smoke-table', near=True),
     focus=C)
shot('s4c', 'close-up', [trainer(look=K), copycat('suspicious', look=C), paid()], room(smoke='smoke-table', near=True),
     focus=K)
# Wide again: the smoke is at the table now, and nobody but him has stirred.
shot('s4d', 'wide', [trainer(look=K), copycat('suspicious', look=C), paid()], room(smoke='smoke-table'))
shot('s4e', 'close-up', [trainer(look='camera', then=to_him()), copycat('suspicious', look=T), paid()],
     room(smoke='smoke-table', near=True), focus=T)
# The smile he does not mean: it comes on a beat after the Trainer's.
shot('s4f', 'close-up',
     [trainer('happy', look=K), copycat('suspicious', look=T, then=[step(0.25, expression='lying')]), paid()],
     room(smoke='smoke-table', near=True), focus=K)
shot('s4g', 'close-up', [trainer('happy', look=K, then=to_us()), copycat('lying', look=T), paid()],
     room(smoke='smoke-table', near=True), focus=T)

# 4. THE TRAP. To his shoulders. He starts to stand, looks at the row, and sits back down.
shot('s5a', 'wide',
     [trainer(look=K), copycat('lying', look=C, then=[step(0.3, expression='afraid')]), paid()],
     room(smoke='smoke-filling'), move='push-in', strength=0.3)
shot('s5b', 'close-up', [trainer(look=K), copycat('afraid', look=C), paid()], room(smoke='smoke-high', near=True), focus=C)
shot('s5c', 'close-up', [trainer(look=K), copycat('afraid', look=C), paid()], room(smoke='smoke-high', near=True), focus=K)
shot('s5d', 'wide',
     [trainer(look=K), copycat('afraid', look=C, then=[step(0.2, pose='stand', lookAt=ROW)]), paid()],
     room(smoke='smoke-high'), sfx=[('creak', 'start', -4)])
# The Bet, then the long quiet.
shot('s5e', 'close-up', [trainer(), copycat('afraid', look='up', pose='stand'), paid()], room(smoke='smoke-high', near=True),
     focus=T)
shot('s5f', 'eyes',
     [trainer(look=K), copycat('afraid', look='up', pose='stand', then=[step(0.35, expression='dread')]), paid()],
     room(smoke='smoke-high', near=True), focus=K, sfx=[('heartbeat-rising', 'start', 0)])
shot('s5g', 'wide',
     [trainer(then=[step(0.55, pose='fix-tie', expression='smug')]),
      copycat('dread', look='up', pose='stand', then=[step(0.15, pose='sit-slump', expression='hollow', lookAt='down')]),
      paid()],
     # A gentle tip: a strong one closes in and cuts his head at the edge of a tall picture.
     room(smoke='smoke-high'), move='tilt', strength=0.15, sfx=[('boom', 'start', -3)])

# ------------------------------------------------------------------ part 3
# 5. THE RESULTS. The pen, the study, the two numbers.
# Slumped, the Copycat leans in toward the table, and his beanie would poke into the edge of a
# close shot of the Trainer: those shots are of the Trainer alone.
SMOKED = dict(pose='sit-slump', look='down')
# The pen clicks and he is back to business: the study's name and year stand under his face.
shot('s6a', 'close-up',
     [trainer('smug', pose='fix-tie', then=[step(0.2, pose='stand', expression='bored')])],
     room(smoke='smoke-high', near=True), focus=T,
     overlay={'kind': 'words', 'lines': ['Latané and Darley', '1968'], 'stress': 1, 'low': True},
     sfx=[('click', 'start', 0)])
shot('s6b', 'wide', [trainer(), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'),
     overlay={'kind': 'number', 'text': '75%', 'caption': 'alone', 'countUp': True})
shot('s6c', 'wide', [trainer(), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'),
     overlay={'kind': 'number', 'text': '10%', 'caption': 'with two calm strangers'})
shot('s6d', 'close-up', [trainer()], room(smoke='smoke-high', near=True), focus=T)
# Where it is done to the viewer: three lines over the room, with the Trainer still seen saying
# "You've seen it." A card would cover every face in the picture.
shot('s6e', 'wide', [trainer(), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'),
     overlay={'kind': 'words', 'lines': ['A fire alarm rings.', 'Everyone looks around.', 'Nobody moves first.'],
              'stress': 2})

# 6. THE LEAK. The light fails; the card is read by the voice from outside, a line at a time.
CARD = ['Calm faces are guessing too.', 'Trust what you see.', 'Say it out loud.', 'Stand up first.']


def leak(sid, reading, light, gloom):
    # A card is a shot of nobody: it fills the middle of the picture, where the faces are.
    shot(sid, 'wide', [], room(smoke='smoke-high', light=light, gloom=gloom),
         overlay={'kind': 'page', 'lines': CARD, 'stress': reading})


leak('s7a', 0, 'bulb-flicker', 'gloom-flicker')
leak('s7b', 0, 'bulb-dim', 'gloom')
leak('s7c', 1, 'bulb-dim', 'gloom')
leak('s7d', 3, 'bulb-dim', 'gloom')
# The light steadies. He is looking up at where the card was; a beat, and he turns to us with
# the smile back. One change of face, and we see it.
shot('s7e', 'close-up',
     [trainer(look='up', then=[step(0.3, expression='smug', lookAt='camera')])], room(smoke='smoke-high', near=True), focus=T)
shot('s7f', 'close-up', [trainer('smug')], room(smoke='smoke-high', near=True), focus=T)
shot('s7g', 'wide', [trainer('smug'), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'),
     move='push-in', strength=0.3)
shot('s7h', 'eyes', [trainer('smug', then=[step(0.3, expression='bored')])],
     room(smoke='smoke-high', light='bulb-dim', gloom='gloom', near=True), focus=T, sfx=[('clunk', 'end', 0)])

# ------------------------------------------------------------------ the storyboard
MOODS = {'s1': 'unease', 's2': 'unease', 's3': 'unease', 's4': 'closing-in', 's5': 'closing-in',
         's6': 'aftermath', 's7': 'aftermath'}
scenes = []
for sc in draft['scenes']:
    missing = [sh['id'] for sh in sc['shots'] if sh['id'] not in SHOTS]
    if missing:
        raise SystemExit(f'no plan yet for {missing}')
    scenes.append({**{k: v for k, v in sc.items() if k != 'shots'},
                   'mood': MOODS[sc['id']], 'place': 'the-table', 'treatment': 'atmospheric',
                   'palette': 'table-grey', 'quiet': False,
                   'shots': [SHOTS[sh['id']] for sh in sc['shots']]})

sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = [{'id': T, 'name': 'The Trainer', 'card': 'trainer'},
              {'id': K, 'name': 'The Copycat', 'card': 'copycat'},
              {'id': C, 'name': 'The Cheat', 'card': 'cheat'}]
sb['series'] = 'game-theory'
sb['meter'] = {'label': 'SECONDS IN SMOKE', 'perSecond': 1, 'from': 's3a'}
sb['scenes'] = scenes
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
