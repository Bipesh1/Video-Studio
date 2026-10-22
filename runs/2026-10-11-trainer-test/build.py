"""A test of the Trainer in the real builder, not a video for viewers.

Step 1 (`python build.py script`) writes script.json. Step 2 (`python build.py plan`), run
after `npm run plan -- draft`, writes storyboard.json. Nine short shots try what the game
theory videos now lean on: the Trainer standing in the room behind the table, friendly to the
player, the smile dropping as he turns to the camera inside one shot, the tie, the card read
by the voice from outside, and his last look at us.
"""
import io
import json
import sys

RUN = 'F:/Video Studio/runs/2026-10-11-trainer-test/'
N, T, S = 'narrator', 'trainer', 'saint'

LINES = [
    ('l1', T, 'Would you sit down at *this table?*', 'hook', None),
    ('l2', T, 'Welcome back, trainees.', 'setup', None),
    ('l3', T, 'Take your time. No pressure at all.', 'setup', None),
    ('l4', S, 'Thank you. That is kind.', 'rising-trouble', None),
    ('l5', T, 'There is *pressure.*', 'rising-trouble', None),
    ('l6', S, 'He seems honest.', 'rising-trouble', True),
    ('l7', T, 'And there it is.', 'turning-point', None),
    ('l8', N, 'Next time, ask who set the table.', 'payoff', None),
    ('l9', T, 'Tape ends.', 'closing-line', None),
]

if sys.argv[1] == 'script':
    lines = []
    for lid, speaker, text, beat, thought in LINES:
        line = {'id': lid, 'speaker': speaker, 'text': text, 'beat': beat, 'chapter': 1, 'pauseAfterMs': 1300}
        if thought:
            line['thought'] = True
        lines.append(line)
    script = {
        'version': 1, 'title': 'Trainer test',
        'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
        'mode': 'as-is', 'format': 'story', 'brand': 'my-page', 'voice': 'leak',
        'speakers': [{'id': T, 'name': 'The Trainer', 'voice': 'trainer'},
                     {'id': S, 'name': 'The Saint', 'voice': 'saint'}],
        'lines': lines, 'sources': [], 'changes': [],
    }
    with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
        json.dump(script, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(len(lines), 'lines')
    sys.exit(0)

draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
L = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}
HEAD = 1 / 9.5
CX = 0.5
LX, RX = CX - 1.75 * HEAD, CX + 1.75 * HEAD
# The gold lies on the player's side of the table, so it never hides the Trainer's tie.
GOLD = round(CX - 0.5 * HEAD, 3)
CHEAT = 'cheat'


def room(bulb='bulb', gloom=None, row='house-row'):
    # The back row is listed first, so everything else is drawn in front of it.
    things = [{'prop': row, 'x': CX}, {'prop': bulb, 'x': CX, 'y': 4.7},
              {'prop': 'iron-chair', 'x': round(LX, 3)}, {'prop': 'iron-chair', 'x': round(RX, 3)},
              {'prop': 'iron-table', 'x': CX}, {'prop': 'coin-stack', 'x': GOLD, 'y': 1.22}]
    if gloom:
        things.append({'prop': gloom, 'x': CX})
    return things


def who(pid, face, pose, x, facing, look=None, then=None):
    a = {'character': pid, 'expression': face, 'pose': pose, 'facing': facing, 'x': round(x, 3)}
    if look:
        a['lookAt'] = look
    if then:
        a['then'] = then
    return a


def trainer(face, pose='stand', look='camera', then=None):
    return who(T, face, pose, CX, 'left', look, then)


def saint(face, pose='sit', look=T, then=None):
    return who(S, face, pose, LX, 'right', look, then)


def cheat(face='calculating', look=S):
    return who(CHEAT, face, 'sit', RX, 'left', look)


def shot(sid, line, framing, actors, props, overlay=None, move='none', strength=0.2, focus=None, sfx=()):
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': L[line]['text'], 'camera': cam, 'actors': list(actors),
         'props': [dict(p) for p in props], 'effects': [],
         'sfx': [{'name': n, 'at': at, 'gainDb': 0} for n, at in sfx], 'transition': 'cut'}
    if overlay:
        s['overlay'] = overlay
    return s


def scene(sid, beat, mood, lines, shots, quiet=True):
    return {'id': sid, 'chapter': 1, 'beat': beat, 'mood': mood, 'place': 'the-table',
            'treatment': 'atmospheric', 'palette': 'table-grey', 'quiet': quiet,
            'lines': [L[l] for l in lines], 'shots': shots}


SCENES = [
    scene('s1', 'hook', 'unease', ['l1'], [
        # He asks it to our face: the question stands low, where the captions would be.
        shot('s1a', 'l1', 'close-up', [trainer('bored'), saint('happy', look='coin-stack'), cheat()], room(),
             focus=T, overlay={'kind': 'words', 'lines': ['Would you', 'sit down at', 'this table?'], 'stress': 2,
                               'low': True}),
    ]),
    scene('s2', 'setup', 'unease', ['l2', 'l3'], [
        shot('s2a', 'l2', 'wide', [trainer('bored'), saint('happy', look='coin-stack'), cheat()], room()),
        # Close, not medium: a medium on him cuts the players either side in half at the frame's edges.
        shot('s2b', 'l3', 'close-up', [trainer('happy', look=S), saint('happy'), cheat()], room(), focus=T),
    ]),
    scene('s3', 'rising-trouble', 'unease', ['l4', 'l5', 'l6'], [
        shot('s3a', 'l4', 'close-up', [trainer('happy', look=S), saint('happy', 'sit-promise'), cheat()], room(),
             focus=S),
        # The smile drops inside the shot as he turns from the player to us.
        shot('s3b', 'l5', 'close-up',
             [trainer('happy', look=S, then=[{'at': 0.12, 'expression': 'bored', 'lookAt': 'camera'}]),
              saint('happy', look='coin-stack'), cheat()], room(), focus=T, sfx=[('click', 'start')]),
        shot('s3c', 'l6', 'eyes', [trainer('bored'), saint('tempted', look='coin-stack'), cheat()], room(),
             focus=S, sfx=[('heartbeat-rising', 'start')]),
    ]),
    scene('s4', 'turning-point', 'closing-in', ['l7'], [
        shot('s4a', 'l7', 'wide',
             [trainer('smug', 'fix-tie'), saint('tempted', 'sit-reach', look='coin-stack'), cheat('smug')], room(),
             move='push-in', strength=0.4, sfx=[('boom', 'start')]),
    ]),
    scene('s5', 'payoff', 'aftermath', ['l8'], [
        shot('s5a', 'l8', 'wide',
             [trainer('surprised', look='up'), saint('guilty', 'sit-slump', look='down'), cheat('suspicious', look=T)],
             room('bulb-flicker', 'gloom-flicker'),
             overlay={'kind': 'page', 'lines': ['Next time,', 'ask who set', 'the table.'], 'stress': 1}),
    ], quiet=False),
    scene('s6', 'closing-line', 'aftermath', ['l9'], [
        shot('s6a', 'l9', 'eyes', [trainer('bored'), saint('hollow', 'sit-slump', look='down'), cheat()],
             room('bulb-dim', 'gloom'), focus=T, sfx=[('clunk', 'end')]),
    ], quiet=False),
]
sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = [{'id': T, 'name': 'The Trainer', 'card': 'trainer'},
              {'id': S, 'name': 'The Saint', 'card': 'saint'},
              {'id': CHEAT, 'name': 'The Cheat', 'card': 'cheat'}]
sb['series'] = 'game-theory'
sb['scenes'] = SCENES
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(SCENES), 'scenes,', sum(len(s['shots']) for s in SCENES), 'shots')
