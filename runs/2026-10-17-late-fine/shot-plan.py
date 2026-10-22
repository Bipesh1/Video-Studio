"""The shot plan of "Why a Fine for Being Late Made Parents Even Later": writes storyboard.json.

Run it after `npm run plan -- draft`, and again after any change here.

One place for the story, the front of a daycare at closing time (`daycare`, dusk colours: the
door with its DAYCARE sign on the left, the playroom window on the right), and a street of
stuck cars for the freeze. The Trainer is a voice over the story (he is the host) and is not
seen; the story ends where it began, on the boy alone at the window.

Who stands where (x across the scene):
  the Saint (the teacher)    at the door, .36
  the notice board           on the wall between door and window, .52, at eye height
  the clock                  small, over the notice board, .52
  the boy (the Copycat's)    at the window, .74
  a father arriving          comes in from the left and stops at .16, facing her; two at .08 and .24

The board and the clock tell the time of the story: empty board and a quarter past four (the
rewind), the fine pinned up, twenty past four (the Cheat), half past (the Copycat), twenty to
five (her bus gone), NO MORE LATE FINE and a quarter past four (the ending and the start).

Faces hold (L-0040), each change after its cause:
  the Saint    kind (happy, light) before the fine; firm pinning it up; surprised at the money;
               angry, then tired; exhausted at her phone; hollow at the end.
  the Cheat    calculating at the notice, then a sly grin (the one big reaction: dollar eyes);
               smug from then on.
  the Copycat  guilty and out of breath before the fine; thinking as he watches the Cheat; smug
               once he copies him.
  the boy      sad at the window; happy when his father comes in the rewind.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-17-late-fine/'
T, S, C, P, Y, B = 'trainer', 'saint', 'cheat', 'copycat', 'you', 'boy'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINE = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}

SAINT_X, BOARD_X, CLOCK_X, BOY_X = 0.36, 0.52, 0.52, 0.74
CHEAT_X, COPY_X = 0.16, 0.16
TICK = ('tick', 'start', -10)


def daycare(board='notice-board', clock='wall-clock-4-15'):
    out = [{'prop': board, 'x': BOARD_X, 'y': 2.4}]
    if clock:
        out.append({'prop': clock, 'x': CLOCK_X, 'y': 3.55, 'size': 0.55})
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


def saint(face, x=SAINT_X, look='ahead', facing=None, **more):
    # She turns to whoever she talks to: the fathers come in from the left.
    facing = facing or ('left' if look in (C, P) else 'right')
    return person(S, face, x, facing, look, **more)


def cheat(face, x=CHEAT_X, look=S, facing='right', **more):
    return person(C, face, x, facing, look, **more)


def copycat(face, x=COPY_X, look=S, facing='right', **more):
    return person(P, face, x, facing, look, **more)


def boy(face='sad', x=BOY_X, look='ahead', facing='left', **more):
    return person(B, face, x, facing, look, **more)


SHOTS = {}


def shot(sid, line, words, framing, actors, props=None, focus=None, overlay=None, move='none', strength=0.2,
         sfx=(), effects=(), transition='cut', picture=None):
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': words or LINE[line]['text'], 'camera': cam,
         'actors': list(actors), 'props': props if props is not None else daycare(), 'effects': list(effects),
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


# ------------------------------------------------------------------ part 1
# The strange ending: a quarter past four, the fine taken back, the boy still waiting.
ENDING = daycare('notice-board-no-fine', 'wall-clock-4-15')
shot('s1a', 'l01', None, 'wide', [saint('exhausted', look=B, strength=0.6), boy('sad')], ENDING,
     move='push-in', strength=0.12, sfx=[TICK],
     overlay={'kind': 'words', 'lines': ['Why did a fine', 'for being late make', 'parents even later?'],
              'stress': 2})
shot('s1b', 'l02', 'And when this daycare dropped the fine,', 'medium',
     [saint('exhausted', look=B, strength=0.6)], ENDING, focus=S, sfx=[TICK])
shot('s1c', 'l02', 'they *still* came late.', 'wide',
     [saint('exhausted', look=B, strength=0.6), boy('sad'),
      cheat('smug', look=S, holds='cup', action='walk', then=[step(0.7, pose='hold-cup')])], ENDING,
     sfx=[TICK, ('footsteps', 'start', -10)])

# The rewind: no fine at all. The Copycat runs in late and says sorry; she is kind about it.
NO_FINE = daycare('notice-board', 'wall-clock-4-15')
shot('s2a', 'l03', None, 'wide',
     [saint('neutral', look='ahead', facing='left'), boy('sad')],
     NO_FINE, transition='fade',
     sfx=[('footsteps', 'start', -6)])
shot('s2b', 'l04', None, 'medium', [copycat('guilty', x=COPY_X)], NO_FINE, focus=P,
     effects=[{'effect': 'sweat-flying', 'on': P}])
shot('s2c', 'l05', None, 'medium',
     [saint('neutral', look=P, then=[step(0.25, expression='happy', strength=0.5)])], NO_FINE, focus=S,
     overlay=number('4:40', 'her last bus'))
shot('s2d', 'l06', 'The teacher waited as a favor.', 'wide',
     [saint('happy', look=P, strength=0.5), copycat('guilty', x=COPY_X),
      boy('sad', then=[step(0.2, look=P, expression='happy')])],
     NO_FINE)
shot('s2e', 'l06', 'Late parents paid only with a *sorry.*', 'close-up',
     [copycat('guilty', x=COPY_X)], NO_FINE, focus=P)

# The rule: she pins it up.
shot('s2f', 'l07', 'Then this daycare made one rule.', 'wide',
     [saint('happy', x=0.38, strength=0.5, look='ahead',
            then=[step(0.3, expression='determined', strength=1)])],
     daycare('notice-board-fine-pinning', 'wall-clock-4-00'), transition='fade', sfx=[('click', 'start', -4)])
shot('s2g', 'l07', 'Pick up your child by *four.*', 'medium',
     [saint('determined', x=0.44, look='camera')], daycare('notice-board-fine', 'wall-clock-4-00'), focus=S,
     overlay=number('4:00', 'pick-up time'))
shot('s2h', 'l08', "Each time you're more than ten minutes late,", 'close-up',
     [saint('determined', x=0.44, look='camera')], daycare('notice-board-fine', None), focus=S)
shot('s2i', 'l08', 'you pay three *dollars.*', 'medium',
     [saint('determined', x=0.44, look='camera')], daycare('notice-board-fine', None), focus=S,
     overlay=number('$3', 'each time'), sfx=[('ding', 'start', -6)])

# ------------------------------------------------------------------ part 2
FINE = 'notice-board-fine'
# The Cheat reads the notice and sees a price.
shot('s3a', 'l09', 'So I can *buy* twenty extra minutes for three dollars.', 'medium',
     [cheat('calculating', x=0.6, facing='left', look='ahead', then=[step(0.55, expression='sly-grin')])],
     daycare(FINE, None), focus=C)
shot('s3b', 'l09', "That's cheaper than a babysitter.", 'close-up',
     [cheat('sly-grin', x=0.6, facing='left', look='camera')], daycare(FINE, None), focus=C,
     effects=[{'effect': 'dollar-eyes', 'on': C}], sfx=[('ding', 'start', -4)])
# The next day, twenty past four: he holds out the money. The time is said in big numbers, so a
# short shot reads at once. The Cheat keeps his grin from here (one face for him).
shot('s3c', 'l10', None, 'wide',
     [saint('determined', look=C, then=[step(0.45, expression='surprised')]), boy('sad'),
      cheat('sly-grin', holds='banknote', pose='hold-object')],
     daycare(FINE, 'wall-clock-4-20'), transition='fade', overlay=number('4:20', 'the next day'), sfx=[TICK])
shot('s3d', 'l11', None, 'medium',
     [saint('surprised', look=C, then=[step(0.3, expression='angry', strength=0.5)])], daycare(FINE, None),
     focus=S)
shot('s3e', 'l12', None, 'medium', [cheat('sly-grin', holds='banknote', pose='shrug')], daycare(FINE, None),
     focus=C)
# The Copycat, at the gate, watching: sorry turns into thinking, then into his own grin.
shot('s3f', 'l13', "He didn't even say sorry. He just *paid.*", 'medium',
     [copycat('guilty', x=0.1, pose='head-tilt', look='ahead', then=[step(0.35, expression='thinking')])], daycare(FINE, None), focus=P)
shot('s3g', 'l13', 'So can I.', 'close-up',
     [copycat('thinking', x=0.1, look='camera', then=[step(0.3, expression='smug')])],
     daycare(FINE, None), focus=P)
# The next week, half past four: he holds out money too. She is still cross.
shot('s3h', 'l14', None, 'wide',
     [saint('angry', look=P, strength=0.5), boy('sad'),
      copycat('smug', holds='banknote', pose='hold-object')], daycare(FINE, 'wall-clock-4-30'), transition='fade',
     overlay=number('4:30', 'the next week'), sfx=[TICK])
# The two of them, money out: closer, so they need not jump into new places.
shot('s3i', 'l15', None, 'medium',
     [cheat('sly-grin', x=0.08, holds='banknote', look='ahead'),
      copycat('smug', x=0.24, holds='banknote', pose='hold-object', look='ahead')], daycare(FINE, None))
# Twenty to five: her bus is gone, and the boy is alone.
shot('s3j', 'l16', 'The teacher missed her bus.', 'medium',
     [saint('angry', strength=0.5, facing='left', look='ahead',
            then=[step(0.2, pose='hold-object', holds='phone', look='down', expression='exhausted')])],
     daycare(FINE, 'wall-clock-to-4-40'), focus=S, overlay=number('4:40', 'her last bus is gone'), sfx=[TICK])
shot('s3k', 'l16', 'A little boy waited *alone* at the window.', 'medium', [boy('sad')],
     daycare(FINE, None), focus=B, move='push-in', strength=0.15, sfx=[TICK])

# The freeze: you, stuck in traffic at five to four, in the middle car of three that do not move.
TRAFFIC = [{'prop': 'car-crimson', 'x': 0.04}, {'prop': 'car', 'x': 0.5}, {'prop': 'car-gold', 'x': 0.96}]


def you(face, look='down', **more):
    return person(Y, face, 0.5, 'right', look, holds='phone', pose='sit-phone', **more)


shot('s4a', 'l17', None, 'wide', [you('neutral', then=[step(0.5, expression='afraid', strength=0.5)])], TRAFFIC,
     overlay=number('3:55', 'and you are still in traffic'), transition='fade')
shot('s4b', 'l18', 'Being late now just costs three dollars.', 'medium',
     [you('afraid', strength=0.5, then=[step(0.5, expression='thinking', look='camera')])], TRAFFIC, focus=Y)
shot('s4c', 'l18', 'Do you still *rush?*', 'eyes', [you('thinking', look='camera')], TRAFFIC, focus=Y,
     sfx=[('heartbeat-rising', 'start', -4)])

# ------------------------------------------------------------------ part 3
# The reveal, back at the door.

def figure(who, x, ground, face, facing, pose='stand'):
    return {'kind': 'person', 'character': who, 'x': x, 'y': 0.5, 'ground': ground, 'head': 0.062, 'pose': pose,
            'facing': facing, 'expression': face, 'turn': 0.3, 'effects': []}


GOT = {'layers': [
    {'kind': 'band', 'top': 0, 'bottom': 1},
    # No fine: a late parent says sorry.
    {'kind': 'panel', 'top': 0.05, 'bottom': 0.33, 'place': 'daycare', 'palette': 'dusk-violet'},
    figure(P, 0.4, 0.315, 'guilty', 'right'),
    figure(S, 0.62, 0.315, 'happy', 'left'),
    {'kind': 'tag', 'text': 'NO FINE', 'x': 0.5, 'y': 0.075, 'size': 0.026, 'paint': 'cream'},
    {'kind': 'tag', 'text': 'SAY SORRY', 'x': 0.5, 'y': 0.3, 'size': 0.026, 'paint': 'forest'},
    # A $3 fine: a late parent just pays.
    {'kind': 'panel', 'top': 0.35, 'bottom': 0.63, 'place': 'daycare', 'palette': 'dusk-violet'},
    figure(C, 0.4, 0.615, 'smug', 'right', pose='hold-object'),
    {'kind': 'thing', 'prop': 'banknote', 'x': 0.525, 'y': 0.512, 'head': 0.03},
    figure(S, 0.62, 0.615, 'hollow', 'left'),
    {'kind': 'tag', 'text': '$3 FINE', 'x': 0.5, 'y': 0.375, 'size': 0.026, 'paint': 'cream'},
    {'kind': 'tag', 'text': 'JUST PAY', 'x': 0.5, 'y': 0.6, 'size': 0.026, 'paint': 'crimson'},
    {'kind': 'band', 'top': 0.63, 'bottom': 1},
]}
shot('s5a', 'l19', "The fine turned the teacher's *favor*", 'wide', [], daycare(FINE),
     picture={**GOT, 'from': {'x': 0.5, 'y': 0.5, 'zoom': 1}, 'to': {'x': 0.5, 'y': 0.505, 'zoom': 1.03}},
     transition='fade')
shot('s5b', 'l19', 'into something you could buy.', 'wide', [], daycare(FINE),
     picture={**GOT, 'from': {'x': 0.5, 'y': 0.505, 'zoom': 1.03}, 'to': {'x': 0.5, 'y': 0.49, 'zoom': 1.7}})
shot('s5c', 'l20', None, 'medium', [cheat('smug', holds='banknote', pose='hold-object', look='camera')],
     daycare(FINE, None), focus=C)
# Parents stroll past the notice with money in hand.
shot('s5d', 'l21', 'This is not a story.', 'wide',
     [saint('hollow', strength=0.6, look=C), boy('sad'),
      cheat('smug', x=0.18, holds='banknote', action='walk', then=[step(0.75, pose='hold-object')]),
      copycat('smug', x=0.04, holds='banknote', action='walk', then=[step(0.8, pose='stand')])],
     daycare(FINE, 'wall-clock-4-30'), sfx=[('footsteps', 'start', -10)])
shot('s5e', 'l21', 'In 1998, two economists tried this at six *daycares* in Israel.', 'wide',
     [saint('hollow', strength=0.6, look=C), boy('sad'),
      cheat('smug', x=0.18, holds='banknote', pose='hold-object'),
      copycat('smug', x=0.04, holds='banknote')],
     daycare(FINE, 'wall-clock-4-30'), overlay=number('1998', 'six daycares in Israel'))
shot('s5f', 'l22', None, 'wide',
     [saint('hollow', strength=0.6, look=C), boy('sad'),
      cheat('smug', x=0.18, holds='banknote', pose='hold-object'),
      copycat('smug', x=0.04, holds='banknote')],
     daycare(FINE, 'wall-clock-4-40'), overlay=number('2x', 'late pickups'), sfx=[('boom', 'start', -8)])
# She takes it down; they keep coming late.
shot('s5g', 'l23', 'When the fine was dropped,', 'medium',
     [saint('hollow', x=0.62, facing='left', look='ahead', strength=0.6)],
     daycare('notice-board-no-fine', None), focus=S, transition='fade')
shot('s5h', 'l23', 'late pickups stayed just as *high.*', 'wide',
     [saint('hollow', strength=0.6, look=C), boy('sad'),
      cheat('smug', x=0.18, holds='cup', action='walk', then=[step(0.75, pose='hold-cup')]),
      copycat('smug', x=0.04, action='walk', then=[step(0.8, pose='stand')])],
     daycare('notice-board-no-fine', 'wall-clock-4-40'), sfx=[('footsteps', 'start', -10)])
shot('s5i', 'l24', None, 'medium',
     [cheat('smug', x=0.18, holds='cup', pose='hold-cup', look='camera'),
      copycat('smug', x=0.04, look=C)], daycare('notice-board-no-fine', None))
shot('s5j', 'l25', 'The fine went to the owner.', 'medium',
     [saint('hollow', facing='left', look='down', strength=0.6)], daycare('notice-board-no-fine', None), focus=S)
shot('s5k', 'l25', 'The teacher who waited got *nothing.*', 'close-up',
     [saint('hollow', facing='left', look='camera', strength=0.6,
            then=[step(0.5, expression='sad', strength=0.7)])],
     daycare('notice-board-no-fine', None), focus=S)

# The sting: you, in the crowd; the outside voice's card; the answer, and the boy at the window.
CROWD = [
    {'kind': 'room', 'place': 'city', 'palette': 'dusk-violet'},
    {'kind': 'crowd', 'rows': 7, 'cols': 9, 'top': 0.3, 'bottom': 0.66, 'head': 0.055, 'back': 0.45,
     'pose': 'stand', 'expression': 'smug', 'light': 0.65, 'hole': {'x': 0.5, 'y': 0.55},
     'holeRadius': 0.07, 'seed': 6},
    {'kind': 'person', 'character': Y, 'x': 0.5, 'y': 0.55, 'head': 0.05, 'pose': 'stand',
     'expression': 'smug', 'facing': 'right', 'turn': 0.3, 'effects': []},
]
shot('s6a', 'l26', 'You do this too. When a late fee is small,', 'wide', [], daycare('notice-board-no-fine'),
     picture={'layers': CROWD, 'from': {'x': 0.5, 'y': 0.56, 'zoom': 5}, 'to': {'x': 0.5, 'y': 0.54, 'zoom': 2.5}})
shot('s6b', 'l26', 'you just *pay* it.', 'wide', [], daycare('notice-board-no-fine'),
     picture={'layers': CROWD, 'from': {'x': 0.5, 'y': 0.54, 'zoom': 2.5}, 'to': {'x': 0.5, 'y': 0.48, 'zoom': 1}})
CARD = ['Making a rule?', 'Skip the small fine.', 'Ask as a favor,', 'or make it count.']
shot('s6c', 'l27', 'If you make a rule, skip the *small* fine.', 'wide', [], daycare('notice-board-no-fine'),
     overlay={'kind': 'page', 'lines': CARD, 'stress': 1})
shot('s6d', 'l27', 'Ask as a favor, or make the fine big.', 'wide', [], daycare('notice-board-no-fine'),
     overlay={'kind': 'page', 'lines': CARD, 'stress': 3})
shot('s6e', 'l28', None, 'medium', [boy('sad')], ENDING, focus=B, move='push-in', strength=0.12, sfx=[TICK])
shot('s6f', 'l29', None, 'medium',
     [cheat('smug', holds='cup', action='walk', look='ahead', then=[step(0.7, pose='hold-cup')])],
     ENDING, focus=C)
shot('s6g', 'l30', None, 'wide', [saint('sad', look=B, strength=0.7), boy('sad')], ENDING,
     sfx=[TICK, ('clunk', 'end', 0)])

# ------------------------------------------------------------------ the storyboard
DOOR = {'place': 'daycare', 'treatment': 'atmospheric', 'palette': 'dusk-violet'}
STREET = {'place': 'city', 'treatment': 'atmospheric', 'palette': 'cold-dawn'}
PLAN = [
    ('s1', 'unease', DOOR, ['s1a', 's1b', 's1c']),
    ('s2', 'curious', DOOR, ['s2a', 's2b', 's2c', 's2d', 's2e', 's2f', 's2g', 's2h', 's2i']),
    ('s3', 'closing-in', DOOR, ['s3a', 's3b', 's3c', 's3d', 's3e', 's3f', 's3g', 's3h', 's3i', 's3j', 's3k']),
    ('s4', 'tense', STREET, ['s4a', 's4b', 's4c']),
    ('s5', 'aftermath', DOOR, ['s5a', 's5b', 's5c', 's5d', 's5e', 's5f', 's5g', 's5h', 's5i', 's5j', 's5k']),
    ('s6', 'aftermath', DOOR, ['s6a', 's6b', 's6c', 's6d', 's6e', 's6f', 's6g']),
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
    {'id': P, 'name': 'The Copycat', 'card': 'copycat'},
    {'id': Y, 'name': 'You', 'card': 'you'},
    {'id': B, 'name': 'The boy',
     'look': {'age': 'child',
              'outfit': {'clothes': {'top': {'kind': 't-shirt', 'cloth': 'glint'},
                                     'bottom': {'kind': 'trousers', 'cloth': 'denim'},
                                     'shoes': {'kind': 'sneakers', 'cloth': 'white'},
                                     'hat': {'kind': 'beanie', 'cloth': 'orange'}}}}},
]
sb['series'] = 'game-theory'
sb['cover'] = {'shot': 's3b', 'at': 0.7}
sb['scenes'] = scenes
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
