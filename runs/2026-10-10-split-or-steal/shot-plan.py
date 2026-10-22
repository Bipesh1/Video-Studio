"""The shot plan of "Split or Steal", decided shot by shot.

It reads the draft (for the lines exactly as the script has them) and writes storyboard.json.
Run it again after any change; nothing else writes that file.

All three parts are planned in full and built: the table, the rules and the cold logic; the real
show; Nick and the ending.

How the pictures are coded, all through the video:
  - warm light is the game as it is being played;
  - red light is a ball opening: what would happen, or what did;
  - pale morning light is the ending.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-10-split-or-steal/'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINES = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}

HEAD = 1 / 9.5  # one head across the stage
STAGE, WARM, RED, DAWN = 'game-show', 'warm-interior', 'danger', 'cold-dawn'
TOP = 1.22  # how high the desk's top is, in heads


def clothes(top=None, top_cloth=None, bottom=None, bottom_cloth='denim', shoes=None, sleeves=None, under=None,
            hat=None, dress=None, tie=None):
    c = {}
    if dress:
        c['onePiece'] = {'kind': 'dress', 'cloth': dress}
    if top:
        t = {'kind': top, 'cloth': top_cloth}
        if sleeves:
            t['sleeves'] = sleeves
        if under:
            t['under'] = under
        c['top'] = t
    if bottom:
        c['bottom'] = {'kind': bottom, 'cloth': bottom_cloth}
    if shoes:
        c['shoes'] = {'kind': 'boots', 'cloth': shoes}
    if hat:
        c['hat'] = {'kind': hat[0], 'cloth': hat[1]}
    if tie:
        c['tie'] = {'cloth': tie[0], 'stripe': tie[1]}
    return {'clothes': c}


def person(pid, name, outfit, voice=None):
    m = {'id': pid, 'name': name, 'look': {'outfit': outfit, 'eyeStyle': 'round'}}
    if voice:
        m['voice'] = voice
    return m


# Everyone is a plain white-headed figure, told apart by one or two clothes. The real players
# are not drawn as likenesses: nothing is known here about how they look.
YOU, STRANGER = 'you', 'stranger'
CAST = [
    person(YOU, 'You, in the green cap', clothes(hat=('cap', 'forest'))),
    person(STRANGER, 'The Stranger, in the striped tie', clothes(tie=('crimson', 'gold')), voice='man'),
    person('player-a', 'A player on the show', clothes('t-shirt', 'orange')),
    person('player-b', 'Another player on the show', clothes('shirt', 'denim', sleeves='long')),
    person('player-c', 'A third player', clothes(dress='denim')),
    person('player-d', 'A fourth player', clothes('hoodie', 'forest')),
    person('sarah', 'Sarah', clothes(dress='cream')),
    person('stephen', 'The other finalist', clothes('jacket', 'steel', under='cream')),
    person('nick', 'Nick', clothes('jacket', 'denim', under='white')),
    person('ibrahim', 'Ibrahim', clothes('shirt', 'tan', sleeves='long')),
    person('host', 'The host of the show', clothes('jacket', 'crimson', under='white', tie=('gold', 'steel'))),
    person('shop-a', 'A shopkeeper', clothes('shirt', 'cream', bottom='trousers', bottom_cloth='brown', sleeves='short')),
    person('shop-b', 'The shopkeeper across the street', clothes('shirt', 'orange', bottom='trousers', bottom_cloth='steel', sleeves='short')),
    person('student-a', 'The student doing the work', clothes('hoodie', 'denim', bottom='trousers', bottom_cloth='steel')),
    person('student-b', 'A student watching', clothes('t-shirt', 'crimson', bottom='trousers', bottom_cloth='denim')),
    person('student-c', 'Another student watching', clothes('t-shirt', 'gold', bottom='trousers', bottom_cloth='brown')),
    person('flat-a', 'A flatmate', clothes('t-shirt', 'forest', bottom='trousers', bottom_cloth='denim')),
    person('flat-b', 'The other flatmate', clothes('hoodie', 'orange', bottom='trousers', bottom_cloth='steel')),
]


def who(pid, face, pose='stand', action=None, x=0.5, facing='right', look=None, holds=None, then=None,
        turn=None):
    a = {'character': pid, 'expression': face, 'facing': facing, 'x': round(x, 3)}
    if action:
        a['action'] = action
    else:
        a['pose'] = pose
    if look:
        a['lookAt'] = look
    if holds:
        a['holds'] = holds
    if then:
        a['then'] = then
    if turn:
        a['headTurn'] = turn
    return a


def shot(sid, line, words, framing, actors=(), props=(), overlay=None, move='none', strength=0.2,
         sfx=(), effects=(), fade=False, focus=None):
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': words, 'camera': cam, 'actors': list(actors),
         'props': [dict(p) for p in props],
         'effects': [{'effect': e, 'on': on} for e, on in effects],
         'sfx': [dict({'name': n[0], 'at': n[1]}, **({'gainDb': n[2]} if len(n) > 2 else {})) for n in sfx],
         'transition': 'fade' if fade else 'cut'}
    if overlay:
        s['overlay'] = overlay
    return s


def scene(sid, chapter, beat, mood, place, palette, lines, shots, treatment='atmospheric', quiet=False):
    for lid in lines:
        said = ' '.join(s['words'] for s in shots if s['line'] == lid).replace('*', '').split()
        assert said == LINES[lid]['text'].replace('*', '').split(), (lid, said)
    sc = {'id': sid, 'chapter': chapter, 'beat': beat, 'mood': mood, 'place': place,
          'treatment': treatment, 'palette': palette, 'lines': [LINES[l] for l in lines], 'shots': shots}
    if quiet:
        sc['quiet'] = True
    return sc


label = lambda text: {'kind': 'label', 'text': text}
number = lambda text, caption=None: dict({'kind': 'number', 'text': text}, **({'caption': caption} if caption else {}))


def thinks(pid, lines, stress=None):
    o = {'kind': 'bubble', 'of': pid, 'shape': 'thought', 'lines': lines}
    if stress is not None:
        o['stress'] = stress
    return o


# ---------------------------------------------------------------- the table
# The desk stands in the middle. Two players sit facing each other across it, each with two
# golden balls in front of them: one within easy reach (near) and one further in (far, where a
# stretched arm lands). The prize is in the middle.
CX = 0.5
LX, RX = CX - 2.05 * HEAD, CX + 2.05 * HEAD  # the left seat and the right seat
NEAR, FAR = 1.38 * HEAD, 0.98 * HEAD  # how far from the middle a player's two balls are
MID = 0.45 * HEAD  # where half the prize ends up when it is shared

DESK = {'prop': 'game-table', 'x': CX}
SEAT_L = {'prop': 'chair', 'x': round(LX, 3)}
SEAT_R = {'prop': 'chair', 'x': round(RX, 3)}


def on_desk(prop, x, **more):
    return dict({'prop': prop, 'x': round(x, 3), 'y': TOP}, **more)


def balls(left='golden-ball', right='golden-ball'):
    """The four balls. `left` and `right` are what each player's far ball is: shut, or open."""
    return [
        on_desk('golden-ball', CX - NEAR), on_desk(left, CX - FAR),
        on_desk(right, CX + FAR), on_desk('golden-ball', CX + NEAR),
    ]


PRIZE = on_desk('cash-pile', CX)


def table(left='golden-ball', right='golden-ball', prize=(PRIZE,), seats=(SEAT_L, SEAT_R)):
    """Everything standing in the scene: the seats, the desk, then what is on its top."""
    return [*seats, DESK, *prize, *balls(left, right)]


def left(pid, face, pose='sit', **more):
    return who(pid, face, pose, x=LX, facing='right', **more)


def right(pid, face, pose='sit', **more):
    return who(pid, face, pose, x=RX, facing='left', **more)


TICK = ('tick', 'start')

# ---------------------------------------------------------------- part 1, the table (hook)
s1 = scene('s1', 1, 'hook', 'curious', STAGE, WARM, ['n1'], [
    # One shot for the whole line, so the title has its full time; the camera closes in on the
    # pile as it is named.
    shot('s1a', 'n1', 'Two strangers. One table. A pile of cash.', 'wide',
         [right(STRANGER, 'happy', look='camera', then=[{'at': 0.6, 'lookAt': 'cash-pile', 'expression': 'smug'}])],
         table(), move='push-in', strength=0.9,
         overlay={'kind': 'title', 'text': 'Split or Steal'}, sfx=[('ding', 'end')]),
], quiet=True)

# What is inside them, seen big and in red light: this is the only time the words are read.
s1balls = scene('s1balls', 1, 'hook', 'curious', STAGE, RED, ['n2'], [
    shot('s1c', 'n2', 'Each holds two golden balls:', 'wide', [], [
        {'prop': 'golden-ball', 'x': 0.36, 'y': 0.9, 'size': 3.4},
        {'prop': 'golden-ball', 'x': 0.64, 'y': 0.9, 'size': 3.4},
    ]),
    shot('s1d', 'n2', '*split, or steal.*', 'wide', [], [
        {'prop': 'ball-split-opening', 'x': 0.36, 'y': 0.9, 'size': 3.4},
        {'prop': 'ball-steal-opening', 'x': 0.64, 'y': 0.9, 'size': 3.4},
    ], sfx=[('pop', 'middle')]),
], quiet=True)

s1seat = scene('s1seat', 1, 'hook', 'curious', STAGE, WARM, ['n3', 'n4', 'n5'], [
    shot('s1e', 'n3', 'They choose at the same moment, in secret.', 'medium',
         [right(STRANGER, 'smug', look='golden-ball',
                then=[{'at': 0.55, 'lookAt': 'camera', 'expression': 'happy'}])],
         table(), focus=STRANGER),
    shot('s1f', 'n4', 'Take a seat.', 'wide', [
        who(YOU, 'neutral', action='walk', x=LX, facing='right', look=STRANGER,
            then=[{'at': 0.7, 'pose': 'stand'}]),
        right(STRANGER, 'happy', look=YOU),
    ], table(), sfx=[('footsteps', 'start')]),
    shot('s1g', 'n5', '*You are one of them.*', 'medium', [
        who(YOU, 'neutral', x=LX, facing='right', look=STRANGER,
            then=[{'at': 0.15, 'pose': 'sit'}, {'at': 0.5, 'lookAt': 'camera', 'expression': 'surprised'}]),
        right(STRANGER, 'happy', look=YOU),
    ], table(), move='push-in', strength=0.4, sfx=[('creak', 'start')]),
], quiet=True)

# ---------------------------------------------------------------- part 1, the rules (red light)
SHARED = (on_desk('cash-half', CX - MID, **{'from': round(CX - 0.26 * HEAD, 3)}),
          on_desk('cash-half', CX + MID, **{'from': round(CX + 0.26 * HEAD, 3)}))
HALVES = (on_desk('cash-half', CX - MID), on_desk('cash-half', CX + MID))
TAKEN = (on_desk('cash-pile', CX + 0.42 * HEAD, **{'from': CX}),)

s2 = scene('s2', 1, 'why-it-matters', 'curious', STAGE, RED, ['n6', 'n7', 'n8'], [
    shot('s2a', 'n6', 'If you both split, you share.', 'medium', [
        # They start as the cut found them and throw their hands up as the pile parts.
        left(YOU, 'happy', look=STRANGER, then=[{'at': 0.2, 'pose': 'sit-hands-up'}]),
        right(STRANGER, 'happy', look=YOU, then=[{'at': 0.26, 'pose': 'sit-hands-up'}]),
    ], table('ball-split', 'ball-split', prize=SHARED), sfx=[TICK, ('ding', 'middle')]),
    shot('s2b', 'n7', 'If one splits and one steals,', 'wide', [
        left(YOU, 'happy', 'sit-reach', look=STRANGER,
             then=[{'at': 0.55, 'expression': 'surprised', 'lookAt': 'ball-steal-opening'}]),
        right(STRANGER, 'smug', 'sit-reach', look=YOU),
    ], table('ball-split-opening', 'ball-steal-opening'), sfx=[TICK]),
    shot('s2c', 'n7', '*the thief takes it all.*', 'medium', [
        left(YOU, 'sad', 'sit-slump', look='down'),
        right(STRANGER, 'laughing', 'sit-hands-up', look='cash-pile'),
    ], table('ball-split', 'ball-steal', prize=TAKEN), sfx=[TICK, ('whoosh', 'start')]),
    shot('s2d', 'n8', 'If you both steal,', 'wide', [
        left(YOU, 'smug', 'sit-reach', look=STRANGER),
        right(STRANGER, 'smug', 'sit-reach', look=YOU),
    ], table('ball-steal-opening', 'ball-steal-opening'), sfx=[TICK]),
    shot('s2e', 'n8', 'nobody gets a penny.', 'medium', [
        left(YOU, 'horrified', look='game-table'),
        right(STRANGER, 'horrified', look='game-table'),
    ], table('ball-steal', 'ball-steal', prize=()), sfx=[TICK, ('pop', 'start')]),
], quiet=True)

# Back in the warm light: the game itself, the pile whole again and every ball shut.
s2promise = scene('s2promise', 1, 'why-it-matters', 'curious', STAGE, WARM, ['s1', 'n9'], [
    shot('s2f', 's1', "I'm splitting. *I promise.*", 'medium', [
        right(STRANGER, 'happy', then=[{'at': 0.42, 'pose': 'sit-promise', 'lookAt': 'camera'}]),
    ], table(), focus=STRANGER, move='push-in', strength=0.4, sfx=[TICK]),
    # His script: CHOOSE NOW holds on screen for two silent seconds. The clock has stopped.
    shot('s2h', 'n9', '*Now choose.*', 'wide', [
        left(YOU, 'afraid', look='camera'),
        right(STRANGER, 'happy', look=YOU),
    ], table(), overlay=number('CHOOSE NOW'), effects=[('sweat-resting', YOU)], move='push-in', strength=0.5),
], quiet=True)

# ---------------------------------------------------------------- part 1, the cold logic
# Short lines: a bubble has to fit beside a head in a wide frame and above one in a tall frame.
CASE_1 = ['IF HE SPLITS', 'STEAL = DOUBLE']
CASE_2 = ['IF HE STEALS', 'ZERO EITHER WAY']
SAME = ['STEAL IS', 'NEVER WORSE']
s3 = scene('s3', 1, 'first-part', 'tense', STAGE, WARM, ['n10', 'n11', 'n12', 'n13', 'n14'], [
    shot('s3a', 'n10', 'Here is the cold logic.', 'close-up',
         [left(YOU, 'thinking', look='up')], table(), move='push-in', strength=0.4),
    # You alone with the thought, so the bubble has the room beside your head.
    shot('s3b', 'n11', 'If the stranger splits, stealing gets you double.', 'medium', [
        left(YOU, 'thinking', look='up'),
    ], table(), focus=YOU, overlay=thinks(YOU, CASE_1, 1)),
    shot('s3c', 'n12', 'If the stranger steals, you get nothing either way.', 'medium', [
        left(YOU, 'thinking', look='up', then=[{'at': 0.6, 'expression': 'sad'}]),
    ], table(), focus=YOU, overlay=thinks(YOU, CASE_2, 1)),
    shot('s3d', 'n13', 'So stealing is *never worse.*', 'medium', [
        left(YOU, 'thinking', look='golden-ball',
             then=[{'at': 0.3, 'pose': 'sit-reach', 'expression': 'determined'}]),
        right(STRANGER, 'happy', look=YOU),
    ], table()),
    shot('s3e', 'n14', 'The stranger thinks the same.', 'wide', [
        left(YOU, 'determined', 'sit-reach', look='golden-ball'),
        right(STRANGER, 'smug', look='up', then=[{'at': 0.55, 'pose': 'sit-reach', 'lookAt': 'golden-ball'}]),
    ], table(), overlay=thinks(STRANGER, SAME, 1)),
])

s3steal = scene('s3steal', 1, 'first-part', 'tense', STAGE, RED, ['n15', 'n16'], [
    shot('s3f', 'n15', 'Two steals.', 'medium', [
        left(YOU, 'determined', 'sit-reach', look='ball-steal-opening'),
        right(STRANGER, 'smug', 'sit-reach', look='ball-steal-opening'),
    ], table('ball-steal-opening', 'ball-steal-opening'), sfx=[('click', 'start'), ('click', 'middle')]),
    shot('s3g', 'n16', '*Nobody wins.*', 'medium', [
        left(YOU, 'horrified', look=STRANGER, then=[{'at': 0.45, 'pose': 'sit-slump', 'expression': 'sad'}]),
        right(STRANGER, 'horrified', look=YOU, then=[{'at': 0.55, 'pose': 'sit-slump', 'expression': 'sad'}]),
    ], table('ball-steal', 'ball-steal', prize=()), move='push-in', strength=0.4, sfx=[('pop', 'start')]),
])

# ---------------------------------------------------------------- part 2, the real show
# Round after round at the same desk: one pair of players for the figures, another pair for the
# small prize, the first pair again for the promise, and then Sarah and the biggest prize.
A, B, C, D = 'player-a', 'player-b', 'player-c', 'player-d'
s4 = scene('s4', 2, 'second-part', 'upbeat', STAGE, WARM, ['n17', 'n18', 'n19'], [
    shot('s4a', 'n17', 'This game was real: a British TV show called Golden Balls.', 'wide', [
        left(A, 'happy', look=B, then=[{'at': 0.3, 'pose': 'sit-hands-up', 'lookAt': 'camera'}]),
        right(B, 'happy', look=A, then=[{'at': 0.38, 'lookAt': 'camera'}]),
    ], table(), fade=True, move='push-in', strength=0.7, overlay=label('Golden Balls, British TV'),
         sfx=[('applause', 'start')]),
    shot('s4c', 'n18', 'Economists studied two hundred and eighty-seven of its finals.', 'wide', [
        left(A, 'thinking', look=B), right(B, 'thinking', look=A),
    ], table(), overlay=number('287', 'finals studied')),
    shot('s4d', 'n19', '*About half* the players split anyway.', 'wide', [
        left(A, 'happy', 'sit-reach', look=B),
        right(B, 'thinking', look=A, then=[{'at': 0.4, 'expression': 'surprised', 'lookAt': 'ball-split-opening'}]),
    ], table('ball-split-opening', 'golden-ball'), overlay=number('53%', 'chose SPLIT'), sfx=[('ding', 'middle')]),
])

SMALL = (on_desk('cash-half', CX, size=0.6),)
s4small = scene('s4small', 2, 'second-part', 'upbeat', STAGE, WARM, ['n20'], [
    shot('s4e', 'n20', 'With only a few hundred pounds on the table,', 'medium', [
        left(C, 'neutral', look='cash-half'), right(D, 'thinking', look='cash-half'),
    ], table(prize=SMALL)),
    shot('s4f', 'n20', 'nearly three in four shared.', 'wide', [
        left(C, 'happy', look=D, then=[{'at': 0.45, 'pose': 'sit-hands-up'}]),
        right(D, 'happy', look=C, then=[{'at': 0.5, 'pose': 'sit-hands-up'}]),
    ], table('ball-split-opening', 'ball-split-opening', prize=SMALL),
         overlay=number('3 in 4', 'shared a small prize'), sfx=[('applause', 'start')]),
])

PROMISE = ['I PROMISE']
s4promise = scene('s4promise', 2, 'second-part', 'curious', STAGE, WARM, ['n21', 'n22', 'n23'], [
    shot('s4g', 'n21', 'And promises did something strange.', 'medium', [
        left(A, 'neutral', look=B),
        right(B, 'happy', look=A, then=[{'at': 0.25, 'pose': 'sit-promise'}]),
    ], table(), overlay={'kind': 'bubble', 'of': B, 'shape': 'speech', 'lines': PROMISE}),
    # The one who promised: his own ball opens on SPLIT.
    shot('s4h', 'n22', 'Making one made a player far more likely to split.', 'medium', [
        right(B, 'happy', 'sit-reach', look='ball-split-opening'),
    ], table('golden-ball', 'ball-split-opening'), focus=B, sfx=[('ding', 'middle')]),
    # The one who heard it: the same words float across and burst on a face that does not change.
    shot('s4i', 'n23', '*Hearing one changed nothing.*', 'medium', [
        left(A, 'neutral', look=B),
        right(B, 'happy', 'sit-promise', look=A),
    ], table('golden-ball', 'ball-split'),
         overlay={'kind': 'bubble', 'of': B, 'shape': 'speech', 'lines': PROMISE, 'to': A},
         sfx=[('pop', 'end')]),
])

BIG = on_desk('cash-pile', CX, size=1.45)
BIG_TAGGED = on_desk('cash-pile', CX, size=1.45, tag='£100,150')
BIG_TAKEN = on_desk('cash-pile', CX - 0.5 * HEAD, size=1.45, tag='£100,150', **{'from': CX, 'slideAt': 0.42})
s4sarah = scene('s4sarah', 2, 'second-part', 'tense', STAGE, RED, ['n24', 'n25'], [
    shot('s4j', 'n24', 'The biggest prize ever,', 'wide', [
        left('sarah', 'neutral', look='cash-pile'), right('stephen', 'neutral', look='cash-pile'),
    ], table(prize=(BIG,)), fade=True, move='push-in', strength=0.6),
    shot('s4j2', 'n24', 'over a hundred thousand pounds?', 'medium', [
        left('sarah', 'thinking', look='cash-pile'), right('stephen', 'happy', look='cash-pile'),
    ], table(prize=(BIG_TAGGED,)), sfx=[('drumroll', 'start')]),
    # She stole it from the other finalist, who had split: both balls open, then the pile goes to her.
    shot('s4k', 'n25', '*Sarah stole it.*', 'medium', [
        left('sarah', 'neutral', 'sit-reach', look='ball-steal-opening', then=[{'at': 0.5, 'expression': 'happy', 'lookAt': 'cash-pile'}]),
        right('stephen', 'happy', 'sit-reach', look='ball-steal-opening',
              then=[{'at': 0.36, 'expression': 'horrified'}]),
    ], table('ball-steal-opening', 'ball-split-opening', prize=(BIG_TAKEN,)), sfx=[('whoosh', 'middle')]),
])

# ---------------------------------------------------------------- part 3, Nick
N, I = 'nick', 'ibrahim'
nick_table = table  # Nick's game is played at the same desk, every ball shut until the end


NOTE = ['STEAL: NOTHING', 'SPLIT: A CHANCE']
s5 = scene('s5', 3, 'surprise', 'tense', STAGE, WARM, ['n26', 'n27', 'n28', 'n29', 'n30', 'n31', 'n32'], [
    shot('s5a', 'n26', 'Then a player named Nick did the opposite.', 'wide', [
        left(N, 'determined', look=I), right(I, 'neutral', look=N),
    ], table(), fade=True, move='push-in', strength=0.6, overlay={'kind': 'pointer', 'text': 'Nick', 'to': N}),
    # He puts a hand on one ball and says which it is; Ibrahim throws up his hands and looks away.
    shot('s5b', 'n27', 'He told Ibrahim he was *going to steal,* no matter what,', 'medium', [
        left(N, 'determined', look=I, then=[{'at': 0.15, 'pose': 'sit-reach'}]),
        right(I, 'surprised', look=N, then=[{'at': 0.62, 'pose': 'sit-hands-up', 'expression': 'angry', 'lookAt': 'up'}]),
    ], nick_table()),
    shot('s5d', 'n27', 'and promised to share the money after the show.', 'medium', [
        left(N, 'happy', 'sit-reach', look=I, then=[{'at': 0.25, 'pose': 'sit-promise'}]),
        right(I, 'angry', look='up', then=[{'at': 0.6, 'lookAt': N, 'expression': 'thinking'}]),
    ], nick_table()),
    shot('s5e', 'n28', 'The host reminded Ibrahim that nothing forced Nick to pay.', 'wide', [
        left(N, 'happy', look=I),
        who('host', 'neutral', 'shrug', x=CX, facing='right', look=I),
        right(I, 'afraid', look='host'),
    ], nick_table()),
    shot('s5f', 'n29', 'Think about it.', 'close-up', [right(I, 'thinking', look='up')], nick_table(),
         move='push-in', strength=0.4),
    shot('s5g', 'n30', 'If Nick steals, stealing wins Ibrahim nothing.', 'medium', [
        right(I, 'thinking', look='up'),
    ], nick_table(), focus=I, overlay=thinks(I, NOTE, 0)),
    shot('s5h', 'n31', 'His only chance is to *split and hope.*', 'medium', [
        right(I, 'thinking', look='up', then=[{'at': 0.55, 'expression': 'sad', 'lookAt': 'golden-ball'}]),
    ], nick_table(), focus=I, overlay=thinks(I, NOTE, 1)),
    shot('s5i', 'n32', 'So he splits.', 'medium', [
        left(N, 'determined', 'sit-reach', look=I),
        right(I, 'sad', look='golden-ball', then=[{'at': 0.25, 'pose': 'sit-reach'}]),
    ], nick_table()),
])

s5open = scene('s5open', 3, 'surprise', 'tense', STAGE, RED, ['n33', 'n34'], [
    shot('s5j', 'n33', 'The balls open.', 'medium', [
        left(N, 'determined', 'sit-reach', look=I),
        right(I, 'afraid', 'sit-reach', look='ball-split-opening'),
    ], table('golden-ball', 'ball-split-opening'), sfx=[('click', 'start')]),
    shot('s5k', 'n34', '*Nick split too.*', 'medium', [
        left(N, 'happy', 'sit-reach', look=I),
        right(I, 'afraid', 'sit-reach', look='ball-split-opening',
              then=[{'at': 0.3, 'expression': 'surprised'}, {'at': 0.62, 'expression': 'laughing', 'lookAt': N}]),
    ], table('ball-split-opening', 'ball-split'), move='push-in', strength=0.4,
         sfx=[('click', 'start'), ('applause', 'middle')]),
])

# ---------------------------------------------------------------- part 3, the ending (pale light)
s6 = scene('s6', 3, 'takeaway', 'hope', STAGE, DAWN, ['n35', 'n36'], [
    shot('s6a', 'n35', 'Nick did not play the game better.', 'medium', [
        left(N, 'laughing', look=I, then=[{'at': 0.3, 'pose': 'sit-hands-up'}]),
        right(I, 'laughing', look=N, then=[{'at': 0.38, 'pose': 'sit-hands-up'}]),
    ], table('ball-split', 'ball-split', prize=SHARED), sfx=[('ding', 'start')]),
    shot('s6b', 'n36', '*He changed it.*', 'close-up', [
        left(N, 'happy', then=[{'at': 0.3, 'lookAt': 'camera', 'expression': 'smug'}]),
    ], table('ball-split', 'ball-split', prize=HALVES), move='push-in', strength=0.4),
])

s6you = scene('s6you', 3, 'takeaway', 'hope', STAGE, DAWN, ['n37'], [
    shot('s6c', 'n37', 'You play this game all the time:', 'medium', [
        left(YOU, 'neutral', look=STRANGER, then=[{'at': 0.35, 'lookAt': 'camera', 'expression': 'thinking'}]),
        right(STRANGER, 'happy', look=YOU),
    ], table(), fade=True),
])

# Three everyday pictures of the same game, a moment each, the two golden balls in every one.
# In a tall picture the two balls are smaller and closer, to fit between the stalls.
BALLS = lambda x, y=0.0, size=1.5: [
    {'prop': 'golden-ball', 'x': round(x - 0.34 * HEAD, 3), 'y': y, 'size': size,
     'tall': {'x': round(x - 0.2 * HEAD, 3), 'size': 0.95}},
    {'prop': 'golden-ball', 'x': round(x + 0.34 * HEAD, 3), 'y': y, 'size': size,
     'tall': {'x': round(x + 0.2 * HEAD, 3), 'size': 0.95}}]
s6price = scene('s6price', 3, 'takeaway', 'hope', 'day-street', 'clear-day', ['n38'], [
    shot('s6d', 'n38', 'price wars,', 'wide', [
        who('shop-a', 'angry', 'point', x=CX - 2.45 * HEAD, facing='right', look='shop-b'),
        who('shop-b', 'shouting', 'point', x=CX + 2.45 * HEAD, facing='left', look='shop-a'),
    ], [
        # In a tall picture each stall stands in front of its keeper, between the two of them, so
        # the stalls and their price cards are not cut by the edges.
        {'prop': 'table', 'x': round(CX - 3.75 * HEAD, 3), 'tall': {'x': round(CX - 1.15 * HEAD, 3)}},
        {'prop': 'table', 'x': round(CX + 3.75 * HEAD, 3), 'tall': {'x': round(CX + 1.15 * HEAD, 3)}},
        {'prop': 'bread', 'x': round(CX - 3.75 * HEAD, 3), 'y': TOP, 'tag': '50% OFF',
         'tall': {'x': round(CX - 1.15 * HEAD, 3)}},
        {'prop': 'bread', 'x': round(CX + 3.75 * HEAD, 3), 'y': TOP, 'tag': '60% OFF',
         'tall': {'x': round(CX + 1.15 * HEAD, 3)}},
        *BALLS(CX),
    ]),
], treatment='simple')

DESK_X = CX - 0.3 * HEAD
s6group = scene('s6group', 3, 'takeaway', 'hope', 'lab', 'cold-dawn', ['n39'], [
    shot('s6e', 'n39', 'group projects,', 'wide', [
        who('student-a', 'exhausted', 'sit-reach', x=DESK_X - 1.75 * HEAD, facing='right', look='book-open'),
        who('student-b', 'smug', 'cross-arms', x=DESK_X + 1.7 * HEAD, facing='left', look='student-a'),
        who('student-c', 'happy', 'shrug', x=DESK_X + 3.2 * HEAD, facing='left', look='camera'),
    ], [
        {'prop': 'chair', 'x': round(DESK_X - 1.75 * HEAD, 3)},
        {'prop': 'table', 'x': round(DESK_X, 3)},
        {'prop': 'book-open', 'x': round(DESK_X - 0.3 * HEAD, 3), 'y': TOP},
        {'prop': 'golden-ball', 'x': round(DESK_X + 0.22 * HEAD, 3), 'y': TOP},
        {'prop': 'golden-ball', 'x': round(DESK_X + 0.55 * HEAD, 3), 'y': TOP},
    ], effects=[('sweat-flying', 'student-a')]),
], treatment='simple')

s6kitchen = scene('s6kitchen', 3, 'takeaway', 'hope', 'home-interior', 'warm-interior', ['n40'], [
    shot('s6f', 'n40', 'a shared kitchen.', 'wide', [
        who('flat-a', 'angry', 'point', x=CX - 1.9 * HEAD, facing='right', look='flat-b'),
        who('flat-b', 'angry', 'cross-arms', x=CX + 1.9 * HEAD, facing='left', look='flat-a'),
    ], [
        {'prop': 'table', 'x': CX},
        # The washing up nobody has done.
        {'prop': 'cup', 'x': round(CX - 0.5 * HEAD, 3), 'y': TOP},
        {'prop': 'goblet', 'x': round(CX - 0.28 * HEAD, 3), 'y': TOP},
        {'prop': 'cup', 'x': round(CX - 0.06 * HEAD, 3), 'y': TOP},
        {'prop': 'cup', 'x': round(CX - 0.28 * HEAD, 3), 'y': TOP + 0.4},
        {'prop': 'golden-ball', 'x': round(CX + 0.28 * HEAD, 3), 'y': TOP},
        {'prop': 'golden-ball', 'x': round(CX + 0.6 * HEAD, 3), 'y': TOP},
    ]),
], treatment='simple')

# Back at the first table. You do not pick a ball: you get up and go round to his side of it.
BESIDE = RX - 1.25 * HEAD
s6end = scene('s6end', 3, 'takeaway', 'hope', STAGE, DAWN, ['n41', 'n42'], [
    shot('s6g', 'n41', 'When you are stuck between trust and betrayal,', 'medium', [
        left(YOU, 'thinking', look='golden-ball'),
        right(STRANGER, 'happy', look=YOU),
    ], table(), fade=True),
    shot('s6h', 'n41', 'do not ask which ball to pick.', 'wide', [
        left(YOU, 'thinking', look='golden-ball',
             then=[{'at': 0.2, 'pose': 'stand', 'expression': 'determined', 'lookAt': STRANGER},
                   {'at': 0.7, 'action': 'walk'}]),
        right(STRANGER, 'happy', look=YOU, then=[{'at': 0.4, 'expression': 'surprised'}]),
    ], table()),
    shot('s6i', 'n42', 'Ask how to *change the table.*', 'wide', [
        who(YOU, 'determined', action='walk', x=BESIDE, facing='right', look=STRANGER,
            then=[{'at': 0.4, 'pose': 'stand', 'expression': 'happy'}]),
        right(STRANGER, 'surprised', look=YOU, then=[{'at': 0.55, 'expression': 'happy'}]),
    ], table(), move='push-in', strength=0.8, sfx=[('ding', 'end')]),
])

SCENES = [s1, s1balls, s1seat, s2, s2promise, s3, s3steal, s4, s4small, s4promise, s4sarah,
          s5, s5open, s6, s6you, s6price, s6group, s6kitchen, s6end]
storyboard = {k: v for k, v in draft.items() if k != 'scenes'}
storyboard['cast'] = CAST
storyboard['appliedLessons'] = ['L-0013', 'L-0023', 'L-0027', 'L-0029', 'L-0030', 'L-0031']
# The cover: the thief takes it all. A ball open on STEAL, one figure laughing, the other slumped.
storyboard['cover'] = {'shot': 's2c', 'at': 0.75, 'framing': 'medium'}
storyboard['scenes'] = SCENES
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(storyboard, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(SCENES), 'scenes,', sum(len(s['shots']) for s in SCENES), 'shots')
