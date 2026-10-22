"""The shot plan of Tape 01 in plain words: writes storyboard.json.

Run it after `npm run plan -- draft` (which writes storyboard.draft.json once a storyboard
exists; never copy storyboard.json over it), and again after any change here. The words are the
script's; where a line is cut into two shots is decided here, so that the Trainer's longer
sentences are never one long look at his face: he says the first half to us, and the second
half is heard over what he is talking about.

The room never changes: the Trainer stands behind the table under the bulb, the Copycat sits on
the left and the Cheat on the right, and the House's four stand in the gallery behind them.

Faces hold (lesson L-0040), and change inside a shot after what causes them:
  the Copycat  glad of an easy twenty; a doubt when the smoke comes; half reassured by the
               room; uneasy as it thickens; a smile he does not mean on "It's fine"; afraid;
               dread as he decides; hollow when he sits back down.
  the Cheat    one face from start to finish. He is paid to stay calm.
  the Trainer  bored, talking to us; pleased with himself when the man stays, and at the end.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-12-the-smoke-plain/'
T, K, C = 'trainer', 'copycat', 'cheat'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINE = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}

HEAD = 1 / 9.5
CX = 0.5
LX, RX = round(CX - 1.75 * HEAD, 3), round(CX + 1.75 * HEAD, 3)
NOTE = round(CX - 0.5 * HEAD, 3)   # the twenty lies on the Copycat's side, clear of the Trainer's tie
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


def person(pid, face, x, facing, look, pose='sit', then=None, strength=None, holds=None, action=None):
    a = {'character': pid, 'expression': face, 'facing': facing, 'x': x, 'lookAt': look}
    a['action' if action else 'pose'] = action or pose
    if strength is not None:
        a['strength'] = strength
    if holds:
        a['holds'] = holds
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


SHOTS = {}
ORDER = []


def shot(sid, line, words, framing, actors, props, focus=None, overlay=None, move='none', strength=0.2,
         sfx=()):
    if framing in ('close-up', 'eyes') and any(p['prop'] in (ROW, 'banknote-20', 'coin') for p in props):
        raise SystemExit(f'{sid}: a close shot takes room(near=True)')
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': words or LINE[line]['text'], 'camera': cam,
         'actors': list(actors), 'props': props, 'effects': [],
         'sfx': [{'name': n, 'at': at, 'gainDb': g} for n, at, g in sfx], 'transition': 'cut'}
    if overlay:
        s['overlay'] = overlay
    SHOTS[sid] = s
    ORDER.append(sid)


def close_t(sid, line, words=None, face='bored', smoke=None, **more):
    """The Trainer alone, close, talking to us."""
    shot(sid, line, words, 'close-up', [trainer(face, **more)], room(smoke=smoke, near=True), focus=T)


# ------------------------------------------------------------------ part 1
# The question. His face, close, with the question under it; then the room.
shot('s1a', 'l01', None, 'close-up', [trainer()], room(near=True), focus=T,
     overlay={'kind': 'words', 'lines': ['If a room filled', 'with smoke, would you', 'get up and leave?'],
              'stress': 2, 'low': True})
shot('s1b', 'l02', None, 'wide', [trainer(), cheat(T)], room(coin=True))

# The man and his twenty dollars: he walks in and sits as the Trainer says who he is.
shot('s2a', 'l03', 'This man came here to earn twenty dollars.', 'wide',
     [trainer(), copycat('happy', look='banknote-20', action='walk', then=[step(0.55, pose='sit')]), cheat()],
     room(coin=True, tag=True), focus=T, sfx=[('footsteps', 'start', 0)])
close_t('s2b', 'l03', 'All he has to do is sit and wait.')
shot('s2c', 'l04', None, 'close-up', [trainer(look=K), copycat('happy'), cheat()], room(near=True), focus=K)
# What he does not know: the Cheat takes his pay where we can see it, and the row wears gold.
close_t('s2d', 'l05', 'What he does not know is that')
shot('s2e', 'l05', 'everyone else in this room *works for me.*', 'wide',
     [trainer(), copycat('happy', look='banknote-20'),
      cheat('coin', then=[step(0.3, holds='coin'), step(0.8, lookAt=K)])],
     room(coin=True), focus=T, sfx=[('ding', 'middle', -4)])
close_t('s2f', 'l06', 'I pay them to do one thing.')
# The ones he pays, all in one picture: the row with its gold, and the Cheat with his coin.
shot('s2g', 'l06', 'Stay *calm,* whatever happens.', 'wide',
     [trainer(), copycat('happy', look='banknote-20'), paid()], room(), move='push-in', strength=0.15)

# The smoke comes in, and the counter starts with it.
shot('s3a', 'l07', None, 'wide',
     [trainer(), copycat('happy', look='banknote-20', then=[step(0.45, expression='thinking', lookAt='smoke-creeping')]),
      paid()],
     room(smoke='smoke-creeping'))
shot('s3b', 'l08', None, 'close-up', [trainer(look=K), copycat('thinking', look=C), paid()],
     room(smoke='smoke-low', near=True), focus=K)
shot('s3c', 'l09', None, 'close-up', [trainer(look=K), copycat('thinking', look=C), paid()],
     room(smoke='smoke-low', near=True), focus=C)
# He checks the room and not the smoke. The calm row is the picture, and it settles him.
shot('s3d', 'l10', None, 'wide',
     [trainer(look=K), copycat('thinking', look=ROW, then=[step(0.55, expression='happy', strength=0.6)]),
      paid()],
     room(smoke='smoke-low'))
close_t('s3e', 'l11', 'See what he did? He did not look at the smoke.', smoke='smoke-low')
# Whoever is speaking is in the picture: the second half is said over the room, with the
# Copycat still looking at the row.
shot('s3f', 'l11', 'He looked at *the people.*', 'wide',
     [trainer(), copycat('happy', look=ROW, strength=0.6), paid()], room(smoke='smoke-low'))

# ------------------------------------------------------------------ part 2
# Thicker. He asks, is told to relax, and says it is fine.
shot('s4a', 'l12', "It's getting hard to breathe.", 'wide',
     [trainer(look=K),
      # The smile goes as the shot opens: he is not still smiling while he says he cannot breathe.
      copycat('happy', look='smoke-rising', strength=0.6, then=[step(0.1, expression='suspicious')]), paid()],
     room(smoke='smoke-rising'))
shot('s4b', 'l12', "Shouldn't we tell someone?", 'close-up',
     [trainer(look=K), copycat('suspicious', look=C), paid()], room(smoke='smoke-table', near=True), focus=K)
# Wide: "somebody would say so", said in a room where nobody is saying anything.
shot('s4c', 'l13', None, 'wide', [trainer(look=K), copycat('suspicious', look=C), paid()],
     room(smoke='smoke-table'))
# The smile he does not mean.
shot('s4d', 'l14', None, 'close-up',
     [trainer(look=K), copycat('suspicious', look=C, then=[step(0.3, expression='lying')]), paid()],
     room(smoke='smoke-table', near=True), focus=K)
close_t('s4e', 'l15', 'Now he has said it is fine.', smoke='smoke-table')
shot('s4f', 'l15', 'Leaving would mean admitting he was *wrong.*', 'wide',
     # His smile gives way here, before he speaks: he must not say his eyes burn through a grin.
     [trainer(), copycat('lying', look=C, then=[step(0.7, expression='dread')]), paid()],
     room(smoke='smoke-table'))

# The fear is already on his face. Then he is on his feet, looking at the row.
shot('s5a', 'l16', None, 'wide',
     [trainer(look=K),
      copycat('dread', look=C, then=[step(0.5, pose='stand', lookAt=ROW)]),
      paid()],
     room(smoke='smoke-filling'), sfx=[('creak', 'middle', -4)])
close_t('s5c', 'l17', smoke='smoke-high')
# He looks at them, and then we are in his eyes while he decides. His face holds: the dread is
# already there, and the next change is the one that matters.
shot('s5d', 'l18', 'They are all calm.', 'wide',
     [trainer(look=K), copycat('dread', look=ROW, pose='stand'), paid()], room(smoke='smoke-high'))
shot('s5e', 'l18', 'I must be the one who is *wrong.*', 'eyes',
     [trainer(look=K), copycat('dread', look='up', pose='stand'), paid()],
     room(smoke='smoke-high', near=True), focus=K, sfx=[('heartbeat-rising', 'start', 0)])
# A gentle tip: a strong one closes in and cuts his head at the edge of a tall picture.
shot('s5f', 'l19', None, 'wide',
     [trainer(then=[step(0.6, pose='fix-tie', expression='smug')]),
      copycat('dread', look='up', pose='stand', then=[step(0.2, pose='sit-slump', expression='hollow', lookAt='down')]),
      paid()],
     room(smoke='smoke-high'), move='tilt', strength=0.15, sfx=[('boom', 'start', -3)])

# ------------------------------------------------------------------ part 3
# The real study: its year and its names, then the two numbers.
SMOKED = dict(pose='sit-slump', look='down')
shot('s6a', 'l20', 'This is not a story.', 'close-up',
     [trainer('smug', pose='fix-tie', then=[step(0.25, pose='stand', expression='bored')])],
     room(smoke='smoke-high', near=True), focus=T)
shot('s6b', 'l20', 'In 1968, two scientists did this *for real.*', 'wide',
     [trainer(), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'),
     overlay={'kind': 'number', 'text': '1968', 'caption': 'Latané and Darley'})
shot('s6c', 'l21', 'Alone in the smoke, three people out of four', 'wide',
     [trainer(), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'),
     overlay={'kind': 'number', 'text': '75%', 'caption': 'alone', 'countUp': True})
close_t('s6d', 'l21', 'got up and reported it.', smoke='smoke-high')
# The number comes up on the words that say it.
shot('s6e', 'l22', 'With two calm strangers beside them,', 'wide',
     [trainer(look=K), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'))
shot('s6e2', 'l22', 'only *one in ten* did.', 'wide',
     [trainer(), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'),
     overlay={'kind': 'number', 'text': '10%', 'caption': 'with two calm strangers'})
close_t('s6f', 'l23', smoke='smoke-high')
shot('s6g', 'l24', 'You do this too. A fire alarm rings,', 'wide',
     [trainer(), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'))
# The rest of the sentence, large under the room, as he says it. Low: at the top of the picture
# the words sat on the bulb and ran into the counter.
shot('s6h', 'l24', 'everyone looks around, and nobody moves first.', 'wide',
     [trainer(), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'),
     overlay={'kind': 'words', 'lines': ['Everyone looks around,', 'and nobody moves first.'], 'stress': 1,
              'low': True})

# The way out. The light fails; a card is a shot of nobody, read by the voice from outside.
CARD = ['Something feels wrong?', 'Do not check the faces.', 'Say it out loud.', 'Stand up first.']


def leak(sid, line, words, reading, light, gloom):
    overlay = {'kind': 'page', 'lines': CARD}
    if reading is not None:
        overlay['stress'] = reading
    shot(sid, line, words, 'wide', [], room(smoke='smoke-high', light=light, gloom=gloom), overlay=overlay)


leak('s7a', 'l25', 'Here is how you beat it.', None, 'bulb-flicker', 'gloom-flicker')
# Each line of the card lights as the voice reads it.
leak('s7b', 'l25', 'When something feels wrong,', 0, 'bulb-dim', 'gloom')
leak('s7b2', 'l25', 'do not check the faces around you.', 1, 'bulb-dim', 'gloom')
leak('s7c', 'l26', 'They are checking yours.', 1, 'bulb-dim', 'gloom')
leak('s7d', 'l26', 'Say it out loud,', 2, 'bulb-dim', 'gloom')
leak('s7d2', 'l26', 'and *stand up first.*', 3, 'bulb-dim', 'gloom')
# The light steadies and he is talking to us again. (Looking up at where the card was hid his
# pupils under his heavy lids: two blank eyes for a second.)
shot('s7e', 'l27', None, 'close-up', [trainer(then=[step(0.3, expression='smug')])],
     room(smoke='smoke-high', near=True), focus=T)
shot('s7f', 'l28', 'So how long would you sit in smoke?', 'wide',
     [trainer('smug'), copycat('hollow', **SMOKED), paid()], room(smoke='smoke-high'), move='push-in',
     strength=0.3)
shot('s7g', 'l28', 'As long as everyone else does.', 'eyes', [trainer('smug', then=[step(0.4, expression='bored')])],
     room(smoke='smoke-high', light='bulb-dim', gloom='gloom', near=True), focus=T, sfx=[('clunk', 'end', 0)])

# ------------------------------------------------------------------ the storyboard
MOODS = {'s1': 'unease', 's2': 'unease', 's3': 'unease', 's4': 'closing-in', 's5': 'closing-in',
         's6': 'aftermath', 's7': 'aftermath'}
scenes = []
for sc in draft['scenes']:
    mine = [SHOTS[sid] for sid in ORDER if sid.startswith(sc['id'])]
    # Every line of the scene is said in full, in order, by the shots given to it.
    for line in sc['lines']:
        said = ' '.join(s['words'] for s in mine if s['line'] == line['id'])
        if said != line['text']:
            raise SystemExit(f"{line['id']}: the shots say \"{said}\" and the script says \"{line['text']}\"")
    scenes.append({**{k: v for k, v in sc.items() if k != 'shots'},
                   'mood': MOODS[sc['id']], 'place': 'the-table', 'treatment': 'atmospheric',
                   'palette': 'table-grey', 'quiet': False, 'shots': mine})

sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = [{'id': T, 'name': 'The Trainer', 'card': 'trainer'},
              {'id': K, 'name': 'The Copycat', 'card': 'copycat'},
              {'id': C, 'name': 'The Cheat', 'card': 'cheat'}]
sb['series'] = 'game-theory'
sb['meter'] = {'label': 'SECONDS IN SMOKE', 'perSecond': 1, 'from': 's3a'}
# The cover: the room deep in smoke at the closing question. Claude's pick; Biku said to join.
sb['cover'] = {'shot': 's7f', 'at': 0.6}
sb['scenes'] = scenes
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
