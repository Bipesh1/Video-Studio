"""One short scene, planned twice, to compare how faces change. For Biku's eye.

  python build.py script        writes script.json
  python build.py plan old      a new face at every cut, as plans were written before
  python build.py plan new      a face holds, and changes inside a shot after what causes it

The words, the shots and the camera are the same in both; only the faces differ.
"""
import io
import json
import sys

RUN = 'F:/Video Studio/runs/2026-10-12-faces-demo/'
T, S, C = 'trainer', 'saint', 'cheat'

LINES = [
    ('l1', T, 'Twenty dollars. It is *yours.*', 'hook', None),
    ('l2', S, 'Just like that?', 'setup', None),
    ('l3', T, 'Just like that. Sign here.', 'setup', None),
    ('l4', S, 'Nobody gives money away.', 'rising-trouble', True),
    ('l5', T, 'She is right. Nobody does.', 'rising-trouble', None),
    ('l6', S, 'What is the catch?', 'turning-point', None),
    ('l7', T, 'You already agreed to it.', 'payoff', None),
    ('l8', S, 'What did I sign?', 'closing-line', True),
]

if sys.argv[1] == 'script':
    lines = []
    for lid, speaker, text, beat, thought in LINES:
        line = {'id': lid, 'speaker': speaker, 'text': text, 'beat': beat, 'chapter': 1, 'pauseAfterMs': 900}
        if thought:
            line['thought'] = True
        lines.append(line)
    script = {
        'version': 1, 'title': 'The form',
        'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
        'mode': 'as-is', 'format': 'story', 'brand': 'my-page', 'voice': 'narrator',
        'speakers': [{'id': T, 'name': 'The Trainer', 'voice': 'trainer'},
                     {'id': S, 'name': 'The Saint', 'voice': 'saint'}],
        'lines': lines, 'sources': [], 'changes': [],
    }
    with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
        json.dump(script, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(len(lines), 'lines')
    sys.exit(0)

NEW = sys.argv[2] == 'new'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
L = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}
HEAD = 1 / 9.5
CX = 0.5
LX, RX = CX - 1.75 * HEAD, CX + 1.75 * HEAD
NOTE = round(CX - 0.5 * HEAD, 3)


def room():
    return [{'prop': 'bulb', 'x': CX, 'y': 4.7},
            {'prop': 'iron-chair', 'x': round(LX, 3)}, {'prop': 'iron-chair', 'x': round(RX, 3)},
            {'prop': 'iron-table', 'x': CX}, {'prop': 'banknote-20', 'x': NOTE, 'y': 1.22}]


def who(pid, face, pose, x, facing, look, then=None, strength=None):
    a = {'character': pid, 'expression': face, 'pose': pose, 'facing': facing, 'x': round(x, 3), 'lookAt': look}
    if strength is not None:
        a['strength'] = strength
    if then:
        a['then'] = then
    return a


def trainer(face, look=S, pose='stand', then=None):
    return who(T, face, pose, CX, 'left', look, then)


def saint(face, look=T, pose='sit', then=None, strength=None):
    return who(S, face, pose, LX, 'right', look, then, strength)


def cheat(face='calculating'):
    return who(C, face, 'sit', RX, 'left', S)


def shot(sid, line, framing, actors, focus=None, move='none', strength=0.2, sfx=()):
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    return {'id': sid, 'line': line, 'words': L[line]['text'], 'camera': cam, 'actors': list(actors),
            'props': room(), 'effects': [], 'sfx': [{'name': n, 'at': at, 'gainDb': 0} for n, at in sfx],
            'transition': 'cut'}


def scene(sid, beat, mood, lines, shots):
    return {'id': sid, 'chapter': 1, 'beat': beat, 'mood': mood, 'place': 'the-table',
            'treatment': 'atmospheric', 'palette': 'table-grey', 'quiet': False,
            'lines': [L[l] for l in lines], 'shots': shots}


if not NEW:
    # As plans were written before: each shot names the face that fits its line, from its first frame.
    SCENES = [
        scene('s1', 'hook', 'unease', ['l1'], [
            shot('s1a', 'l1', 'wide', [trainer('happy'), saint('happy', look='banknote-20'), cheat()]),
        ]),
        scene('s2', 'setup', 'unease', ['l2', 'l3'], [
            shot('s2a', 'l2', 'close-up', [trainer('happy'), saint('surprised'), cheat()], focus=S),
            shot('s2b', 'l3', 'close-up', [trainer('happy'), saint('happy'), cheat()], focus=T),
        ]),
        scene('s3', 'rising-trouble', 'unease', ['l4', 'l5'], [
            shot('s3a', 'l4', 'eyes', [trainer('happy'), saint('suspicious', look='banknote-20'), cheat()], focus=S),
            shot('s3b', 'l5', 'close-up', [trainer('bored', look='camera'), saint('suspicious'), cheat()], focus=T),
        ]),
        scene('s4', 'turning-point', 'closing-in', ['l6'], [
            shot('s4a', 'l6', 'close-up', [trainer('happy'), saint('afraid'), cheat()], focus=S),
        ]),
        scene('s5', 'payoff', 'closing-in', ['l7'], [
            shot('s5a', 'l7', 'wide', [trainer('smug'), saint('dread'), cheat('smug')], move='push-in', strength=0.4),
        ]),
        scene('s6', 'closing-line', 'closing-in', ['l8'], [
            shot('s6a', 'l8', 'eyes', [trainer('smug'), saint('hollow', look='banknote-20'), cheat('smug')], focus=S,
                 sfx=[('heartbeat-rising', 'start')]),
        ]),
    ]
else:
    # One line of feeling for her: hopeful, a first doubt, suspicion, dread. Each step is caused
    # by something said to her, and happens inside a shot, a beat after it.
    SCENES = [
        scene('s1', 'hook', 'unease', ['l1'], [
            shot('s1a', 'l1', 'wide', [trainer('happy'), saint('happy', look='banknote-20'), cheat()]),
        ]),
        scene('s2', 'setup', 'unease', ['l2', 'l3'], [
            # She asks, and the asking is the first doubt.
            shot('s2a', 'l2', 'close-up',
                 [trainer('happy'),
                  saint('happy', then=[{'at': 0.45, 'expression': 'thinking', 'strength': 0.5}]), cheat()],
                 focus=S),
            shot('s2b', 'l3', 'close-up', [trainer('happy'), saint('thinking', strength=0.5), cheat()], focus=T),
        ]),
        scene('s3', 'rising-trouble', 'unease', ['l4', 'l5'], [
            # "Sign here" is what does it: her eyes go to the note, then the doubt hardens.
            shot('s3a', 'l4', 'eyes',
                 [trainer('happy'),
                  saint('thinking', strength=0.5, look='banknote-20',
                        then=[{'at': 0.3, 'expression': 'suspicious'}]), cheat()], focus=S),
            shot('s3b', 'l5', 'close-up',
                 [trainer('happy', then=[{'at': 0.12, 'expression': 'bored', 'lookAt': 'camera'}]),
                  saint('suspicious'), cheat()], focus=T),
        ]),
        scene('s4', 'turning-point', 'closing-in', ['l6'], [
            # He comes back from his aside to her with the smile, while we are on her.
            shot('s4a', 'l6', 'close-up',
                 [trainer('bored', look='camera', then=[{'at': 0.3, 'expression': 'happy', 'lookAt': S}]),
                  saint('suspicious'), cheat()], focus=S),
        ]),
        scene('s5', 'payoff', 'closing-in', ['l7'], [
            # She hears "agreed", and it lands at the end of his line.
            shot('s5a', 'l7', 'wide',
                 [trainer('happy'),
                  saint('suspicious', then=[{'at': 0.7, 'expression': 'dread', 'strength': 0.6}]), cheat()],
                 move='push-in', strength=0.4),
        ]),
        scene('s6', 'closing-line', 'closing-in', ['l8'], [
            shot('s6a', 'l8', 'eyes',
                 [trainer('happy'),
                  saint('dread', strength=0.6, look='banknote-20', then=[{'at': 0.35, 'expression': 'dread'}]),
                  cheat()], focus=S, sfx=[('heartbeat-rising', 'start')]),
        ]),
    ]

sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = [{'id': T, 'name': 'The Trainer', 'card': 'trainer'},
              {'id': S, 'name': 'The Saint', 'card': 'saint'},
              {'id': C, 'name': 'The Cheat', 'card': 'cheat'}]
sb['series'] = 'game-theory'
sb['scenes'] = SCENES
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('new' if NEW else 'old', len(SCENES), 'scenes,', sum(len(s['shots']) for s in SCENES), 'shots')
