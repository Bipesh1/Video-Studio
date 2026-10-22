"""A test of the Table kit in the real builder, not a video for viewers.

Step 1 (`python build.py script`) writes script.json. Step 2 (`python build.py plan`), run
after `npm run plan -- draft`, writes storyboard.json. Six short shots use the pieces made on
2026-10-11: the room `the-table`, the bulb and grey furniture, big words, a shot of the eyes
alone, a thought (heard while the mouth stays shut), the tilted frame, and the failing light.
"""
import io
import json
import sys

RUN = 'F:/Video Studio/runs/2026-10-11-table-kit-test/'
N, S = 'narrator', 'saint'

LINES = [
    ('n1', N, 'Would you sit down at *this table?*', 'hook', None),
    ('n2', N, 'Two strangers. One pile of gold.', 'setup', None),
    ('s1', S, 'He looks calm. So I am calm.', 'rising-trouble', True),
    ('n3', N, 'One of them reaches first.', 'rising-trouble', None),
    ('n4', N, 'And then it is done.', 'turning-point', None),
    ('n5', N, 'The light does not stay on for anyone.', 'payoff', None),
    ('n6', N, 'Would you?', 'closing-line', None),
]

if sys.argv[1] == 'script':
    lines = []
    for lid, speaker, text, beat, thought in LINES:
        line = {'id': lid, 'speaker': speaker, 'text': text, 'beat': beat, 'chapter': 1, 'pauseAfterMs': 1500}
        if thought:
            line['thought'] = True
        lines.append(line)
    script = {
        'version': 1, 'title': 'Table kit test',
        'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
        'mode': 'as-is', 'format': 'story', 'brand': 'my-page', 'voice': 'narrator',
        'speakers': [{'id': S, 'name': 'The Saint', 'voice': 'saint'}],
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
CHEAT, SAINT = 'cheat', 'saint'


def room(bulb='bulb', gloom=None):
    things = [{'prop': bulb, 'x': CX, 'y': 4.0},
              {'prop': 'iron-chair', 'x': round(LX, 3)}, {'prop': 'iron-chair', 'x': round(RX, 3)},
              {'prop': 'iron-table', 'x': CX}, {'prop': 'coin-stack', 'x': CX, 'y': 1.22}]
    if gloom:
        things.append({'prop': gloom, 'x': CX})
    return things


def who(pid, face, pose='sit', x=LX, facing='right', look=None, then=None):
    a = {'character': pid, 'expression': face, 'pose': pose, 'facing': facing, 'x': round(x, 3)}
    if look:
        a['lookAt'] = look
    if then:
        a['then'] = then
    return a


def shot(sid, line, framing, actors=(), props=(), overlay=None, move='none', strength=0.2, focus=None,
         fade=False, sfx=()):
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': L[line]['text'], 'camera': cam, 'actors': list(actors),
         'props': [dict(p) for p in props], 'effects': [],
         'sfx': [{'name': n, 'at': at, 'gainDb': 0} for n, at in sfx], 'transition': 'fade' if fade else 'cut'}
    if overlay:
        s['overlay'] = overlay
    return s


def scene(sid, beat, mood, lines, shots, quiet=False):
    return {'id': sid, 'chapter': 1, 'beat': beat, 'mood': mood, 'place': 'the-table',
            'treatment': 'atmospheric', 'palette': 'table-grey', 'quiet': quiet,
            'lines': [L[l] for l in lines], 'shots': shots}


cheat = lambda face, pose='sit', **more: who(CHEAT, face, pose, x=LX, facing='right', **more)
saint = lambda face, pose='sit', **more: who(SAINT, face, pose, x=RX, facing='left', **more)

SCENES = [
    scene('t1', 'hook', 'unease', ['n1'], [
        shot('t1a', 'n1', 'wide', [], room(),
             overlay={'kind': 'words', 'lines': ['Would you', 'sit down at', 'this table?'], 'stress': 2}),
    ], quiet=True),
    scene('t2', 'setup', 'unease', ['n2'], [
        shot('t2a', 'n2', 'wide', [cheat('calculating', look=SAINT), saint('dread', look=CHEAT)], room()),
    ]),
    scene('t3', 'rising-trouble', 'closing-in', ['s1', 'n3'], [
        shot('t3a', 's1', 'eyes', [saint('dread')], room(), focus=SAINT, sfx=[('heartbeat-rising', 'start')]),
        shot('t3b', 'n3', 'medium', [cheat('tempted', look='coin-stack', then=[{'at': 0.3, 'pose': 'sit-reach'}])],
             room(), focus=CHEAT),
    ]),
    scene('t4', 'turning-point', 'closing-in', ['n4'], [
        shot('t4a', 'n4', 'wide', [cheat('smug', 'sit-reach', look=SAINT), saint('guilty', 'sit-slump', look='down')],
             room(), move='tilt', strength=0.7, sfx=[('boom', 'start')]),
    ]),
    scene('t5', 'payoff', 'aftermath', ['n5'], [
        shot('t5a', 'n5', 'wide', [cheat('hollow', look='down'), saint('hollow', 'sit-slump', look='down')],
             room('bulb-flicker', 'gloom-flicker')),
    ]),
    scene('t6', 'closing-line', 'aftermath', ['n6'], [
        shot('t6a', 'n6', 'eyes', [cheat('calculating', look='camera')], room('bulb-dim', 'gloom'), focus=CHEAT,
             sfx=[('clunk', 'end')]),
    ]),
]
sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = [{'id': CHEAT, 'name': 'The Cheat', 'card': 'cheat'}, {'id': SAINT, 'name': 'The Saint', 'card': 'saint'}]
sb['series'] = 'game-theory'
sb['scenes'] = SCENES
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(SCENES), 'scenes,', sum(len(s['shots']) for s in SCENES), 'shots')
