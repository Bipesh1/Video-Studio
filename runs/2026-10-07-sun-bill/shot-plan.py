"""The shot plan of "What If the Sun Sent You a Bill?", decided shot by shot.

It reads the draft (for the lines exactly as the script has them) and writes storyboard.json.
Run it again after any change; nothing else writes that file.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-07-sun-bill/'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINES = {l['id']: dict(l, speaker='host') for sc in draft['scenes'] for l in sc['lines']}

YOU = 'you'
HOST = 'host'
HX = 0.13  # where the host stands in the room, at the side of the story she tells

CAST = [
    {'id': HOST, 'name': 'The host', 'card': 'host', 'voice': 'woman-calm', 'host': True},
    {'id': YOU, 'name': 'You',
     'look': {'identity': {'skinTone': 3, 'hair': 'short-crop', 'hairColor': 'black'},
              'outfit': {'clothes': {'top': {'kind': 'hoodie', 'cloth': 'ocean'},
                                     'bottom': {'kind': 'trousers', 'cloth': 'denim'},
                                     'shoes': {'kind': 'sneakers', 'cloth': 'white'}}},
              'eyeStyle': 'round'}},
]
for i, (skin, hair, color, cloth) in enumerate([(5, 'fade', 'black', 'tan'), (1, 'bun', 'brown', 'cream'), (6, 'short-crop', 'black', 'brown')]):
    CAST.append({'id': 'taker%d' % (i + 1), 'name': 'Someone with a sack',
                 'look': {'identity': {'skinTone': skin, 'hair': hair, 'hairColor': color},
                          'outfit': {'clothes': {'top': {'kind': 'shirt', 'cloth': cloth},
                                                 'bottom': {'kind': 'trousers', 'cloth': 'steel'},
                                                 'shoes': {'kind': 'boots', 'cloth': 'brown'}}},
                          'eyeStyle': 'round'}})

X = 0.4  # where you stand in the room, all through
ENV = 'envelope'


def you(face, pose='stand', action=None, look=None, holds=ENV, then=None, x=X, facing='right', turn=None):
    a = {'character': YOU, 'expression': face, 'facing': facing, 'x': x}
    if action:
        a['action'] = action
    else:
        # The envelope is carried like a lamp: held out in front, not hanging at the side.
        a['pose'] = 'hold-object' if holds and pose == 'stand' else pose
    if look:
        a['lookAt'] = look
    if holds:
        a['holds'] = holds
    if then:
        a['then'] = then
    if turn:
        a['headTurn'] = turn
    return a


def host(face='neutral', pose='stand', look='camera', x=HX, action=None, facing='right'):
    a = {'character': HOST, 'expression': face, 'facing': facing, 'x': x, 'lookAt': look, 'headTurn': 'three-quarter'}
    if action:
        a['action'] = action
    else:
        a['pose'] = pose
    return a


# How the host stands in the wide shots of the room, where nothing else is said about her.
HOST_IN = {
    's1a': host('thinking', 'point', look=ENV),
    's1b': host('neutral', look=YOU),
    's2c': host('happy', 'point', look='earth'),
    's2d': host('smug', 'shrug'),
    's2e': host('surprised', 'point'),
    's2g': host('happy', 'point'),
    's4b': host('happy', 'point', look='earth'),
    's4d': host('happy', 'hands-up'),
    's5a': host('neutral', 'point'),
    's5c': host('happy', 'point', look='coal'),
    's5e': host('happy'),
    's7a': host('happy', 'point', look='bread'),
    's8a': host('thinking', 'shrug'),
}


def shot(sid, line, words, framing, actors=(), props=(), overlay=None, move='none', strength=0.2,
         sfx=(), effects=(), fade=False, focus=None):
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': words, 'camera': cam, 'actors': list(actors),
         'props': [dict(p) for p in props], 'effects': [dict(e) for e in effects],
         'sfx': [{'name': n, 'at': at} for n, at in sfx], 'transition': 'fade' if fade else 'cut'}
    if overlay:
        s['overlay'] = overlay
    return s


def scene(sid, chapter, beat, mood, place, palette, lines, shots, treatment='simple', quiet=False):
    sc = {'id': sid, 'chapter': chapter, 'beat': beat, 'mood': mood, 'place': place,
          'treatment': treatment, 'palette': palette, 'lines': [LINES[l] for l in lines], 'shots': shots}
    if quiet:
        sc['quiet'] = True
    return sc


NIGHT = 'storm-slate'
DOOR = {'prop': 'door', 'x': 0.97}
TABLE = [{'prop': 'table', 'x': 0.72}, {'prop': 'bills', 'x': 0.76, 'y': 1.25}]
BILL_1 = ['FROM: THE SUN', 'FOR: ONE HOUR OF SUNLIGHT', 'AMOUNT DUE: $30,000,000,000,000']
BILL_2 = ['AMOUNT DUE: $30,000,000,000,000', 'SPLIT BETWEEN EVERYONE ALIVE', 'YOUR SHARE: $3,600 PER HOUR']
BILL_3 = ['PAGE 2', 'WHAT THIS COSTS THE SENDER']
BILL_4 = ['AMOUNT DUE: $0', 'PAID IN FULL BY SENDER', 'REMAINING CREDIT: 5,000,000,000 YEARS']


def page(lines, stress):
    return {'kind': 'page', 'lines': lines, 'stress': stress}


def earth(tag=None, size=0.75):
    p = {'prop': 'earth', 'x': 0.74, 'y': 3.0, 'size': size, 'tall': {'x': 0.52, 'y': 5.7}}
    if tag:
        p['tag'] = tag
    return p


def towers(second=None):
    out = [{'prop': 'coin-stack', 'x': 0.62, 'size': 2.0, 'tag': 'SUN: 1 HOUR'}]
    if second:
        out.append({'prop': 'coin-stack', 'x': 0.88, 'size': 2.0, 'tag': second})
    return out


def suns(tag=False):
    out = []
    for i in range(4):
        p = {'prop': 'sun', 'x': 0.5 + i * 0.07, 'y': 4.25, 'size': 0.26, 'tall': {'x': 0.3 + i * 0.12, 'y': 6.4}}
        out.append(p)
    return out


SUN_CITY = {'prop': 'sun', 'x': 0.64, 'y': 2.3, 'size': 0.7, 'tall': {'x': 0.5, 'y': 5.4}}

SCENES = [
    # ------------------------------------------------------------------ part 1
    scene('s1', 1, 'hook', 'curious', 'living-room', NIGHT, ['n1', 'n2', 'n3', 'n4', 'n5'], [
        shot('s1a', 'n1', 'An envelope slides under your door.', 'wide',
             [you('neutral', look=ENV, holds=None, then=[{'at': 0.45, 'expression': 'surprised'}])],
             [DOOR, {'prop': ENV, 'x': X + 0.1, 'from': 0.93}],
             overlay={'kind': 'title', 'text': draft['title']}, sfx=[('whoosh', 'start')]),
        shot('s1b', 'n2', 'No stamp. It is warm.', 'wide',
             [you('surprised', look=ENV, holds=None,
                  then=[{'at': 0.04, 'pose': 'kneel', 'expression': 'surprised'},
                        {'at': 0.34, 'pose': 'kneel', 'holds': ENV, 'expression': 'surprised'}])],
             [DOOR, {'prop': ENV, 'x': X + 0.1}], sfx=[('blip', 'middle')]),
        shot('s1c', 'n3', 'Inside is a bill, and the name at the top is yours.', 'medium',
             [host('happy', 'point', look='camera'),
              you('thinking', pose='kneel', look=ENV,
                  then=[{'at': 0.04, 'pose': 'hold-object', 'holds': ENV, 'expression': 'thinking'},
                        {'at': 0.55, 'pose': 'hold-object', 'holds': ENV, 'expression': 'surprised'}])]),
        shot('s1e', 'n4', 'Sender: the *Sun.*', 'wide', overlay=page(BILL_1, 0), sfx=[('pop', 'start')]),
        shot('s1f', 'n5', 'Amount due, for the last hour of sunlight on Earth:', 'wide', overlay=page(BILL_1, 1)),
        shot('s1g', 'n5', 'thirty *trillion* dollars.', 'wide', overlay=page(BILL_1, 2), sfx=[('thud', 'start')]),
    ], treatment='atmospheric', quiet=True),
    scene('s2', 1, 'why-it-matters', 'curious', 'living-room', NIGHT, ['n6', 'n7', 'n8', 'n9', 'n10', 'n11'], [
        shot('s2a', 'n6', 'You laugh. Then you check the sum.', 'medium',
             [you('laughing', then=[{'at': 0.45, 'expression': 'thinking', 'lookAt': ENV}])]),
        shot('s2b', 'n7', 'Take all the sunlight that lands on', 'medium', [host('happy', 'point')], focus=HOST),
        shot('s2c', 'n7', 'this planet in one *hour.*', 'wide', [you('surprised', look='earth')],
             [DOOR, earth('ONE HOUR OF SUNLIGHT')], sfx=[('pop', 'start')]),
        shot('s2d', 'n8', 'Price it like the electricity in your wall.', 'wide', [you('determined', look='earth')],
             [DOOR, earth('$30 TRILLION')], sfx=[('click', 'middle')]),
        shot('s2e', 'n9', 'Thirty trillion. About what the whole United', 'wide',
             [you('surprised', look='up')], [DOOR] + towers('USA: 1 YEAR'), sfx=[('click', 'start'), ('click', 'middle')]),
        shot('s2f', 'n9', 'States earns in a year.', 'close-up', [you('surprised')]),
        shot('s2g', 'n10', 'Every *four* hours, the Sun delivers the value of', 'wide',
             [you('thinking', look='up')],
             [DOOR, {'prop': 'coin-tower', 'x': 0.89, 'size': 0.85, 'tag': 'WORLD: 1 YEAR'}] + suns(),
             sfx=[('click', 'start')]),
        shot('s2h', 'n10', 'everything the entire world earns in a year.', 'medium',
             [host('surprised', 'hands-up')], focus=HOST, sfx=[('ding', 'start')]),
        shot('s2i', 'n11', 'And then it does it again.', 'close-up', [you('exhausted')]),
    ], quiet=True),
    scene('s3', 1, 'why-it-matters', 'curious', 'city', 'clear-day', ['n12'], [
        shot('s3a', 'n12', 'In under ninety minutes, the Earth soaks up', 'wide', [host('happy', 'point', x=0.24)], [SUN_CITY],
             overlay={'kind': 'number', 'text': '90 minutes', 'caption': 'of sunlight'}, fade=True, sfx=[('pop', 'start')]),
        shot('s3b', 'n12', 'more energy than every city, car and factory', 'medium', [host('happy', 'shrug', x=0.24)]),
        shot('s3c', 'n12', 'will use this year.', 'wide', [host('smug', x=0.24)], [SUN_CITY],
             overlay={'kind': 'label', 'text': 'More than a whole year of it'}, move='push-in', strength=0.4),
    ], quiet=True),
    # ------------------------------------------------------------------ part 2
    scene('s4', 2, 'first-part', 'curious', 'living-room', NIGHT, ['n13', 'n14', 'n15', 'n16'], [
        shot('s4a', 'n13', 'You try the obvious defence. That is not all mine.', 'medium',
             [you('smug', pose='shrug')], fade=True),
        shot('s4b', 'n14', 'Fine. Split it between every person alive.', 'wide', [you('thinking', look='earth')],
             [DOOR, earth('8.3 BILLION PEOPLE', 0.9)], sfx=[('pop', 'start')]),
        shot('s4c', 'n15', 'Your share is more than three thousand dollars. An hour.', 'wide', overlay=page(BILL_2, 2),
             sfx=[('pop', 'start')]),
        shot('s4d', 'n16', 'Thirty *million* dollars a year, delivered to you, for free,', 'wide',
             [you('surprised', look='up', then=[{'at': 0.5, 'expression': 'happy'}])], [DOOR],
             effects=[{'effect': 'coin-rain', 'on': YOU}], sfx=[('ding', 'start'), ('ding', 'middle')]),
        shot('s4e', 'n16', 'since the day you were born.', 'medium', [you('happy', look='up')],
             effects=[{'effect': 'coin-rain', 'on': YOU}], sfx=[('ding', 'start')]),
    ], quiet=True),
    scene('s5', 2, 'first-part', 'curious', 'living-room', NIGHT, ['n17', 'n18', 'n19', 'n20'], [
        shot('s5a', 'n17', 'Then you look at your real bills. Electricity. Fuel. Food.', 'wide',
             [you('neutral', look='bills')], [DOOR] + TABLE),
        shot('s5b', 'n18', 'And you notice something.', 'close-up', [you('thinking', look='down')], move='push-in', strength=0.5),
        shot('s5c', 'n19', 'Coal is sunlight that plants caught hundreds', 'wide', [you('thinking', look='coal')],
             [DOOR] + TABLE + [{'prop': 'coal', 'x': 0.56, 'tag': 'SUNLIGHT'}], sfx=[('ding', 'start')]),
        shot('s5d', 'n19', 'of millions of years ago.', 'close-up', [you('surprised', look='down')]),
        shot('s5e', 'n20', 'Oil is the same story.', 'wide', [you('thinking', look='fuel-can')],
             [DOOR] + TABLE + [{'prop': 'coal', 'x': 0.56, 'tag': 'SUNLIGHT'}, {'prop': 'fuel-can', 'x': 0.25, 'tag': 'SUNLIGHT'}],
             sfx=[('ding', 'start')]),
    ], quiet=True),
    scene('s6', 2, 'first-part', 'curious', 'field', NIGHT, ['n21'], [
        shot('s6a', 'n21', 'Wind is air the Sun warmed.', 'wide', [],
             [{'prop': 'wind', 'x': 0.5, 'y': 2.7, 'tag': 'SUNLIGHT'}], fade=True, sfx=[('wind', 'start')]),
        shot('s6b', 'n21', 'Rain is water the Sun lifted.', 'wide', [],
             [{'prop': 'rain-cloud', 'x': 0.5, 'y': 3.3, 'tag': 'SUNLIGHT'}], sfx=[('ding', 'start')]),
    ], quiet=True),
    scene('s7', 2, 'first-part', 'curious', 'living-room', NIGHT, ['n22', 'n23', 'n24'], [
        shot('s7a', 'n22', "Your dinner is this summer's light.", 'wide', [you('happy', look='bread')],
             [DOOR] + TABLE + [{'prop': 'bread', 'x': 0.66, 'y': 1.25, 'tag': 'SUNLIGHT'}], fade=True, sfx=[('ding', 'start')]),
        shot('s7b', 'n23', 'You have almost never paid for energy.', 'medium', [you('surprised', look=ENV)]),
        shot('s7c', 'n24', 'You have only paid for *delivery.*', 'close-up', [you('smug')], move='push-in', strength=0.5),
    ], quiet=True),
    # ------------------------------------------------------------------ part 3
    scene('s8', 3, 'second-part', 'curious', 'living-room', NIGHT, ['n25'], [
        shot('s8a', 'n25', 'And the coal and the oil?', 'wide', [you('thinking', look='coal')],
             [DOOR] + TABLE + [{'prop': 'coal', 'x': 0.56, 'tag': 'SUNLIGHT'}, {'prop': 'fuel-can', 'x': 0.25, 'tag': 'SUNLIGHT'}],
             fade=True),
        shot('s8b', 'n25', 'That is a *savings* account.', 'close-up', [you('determined')], move='push-in', strength=0.5),
    ], quiet=True),
    scene('s9', 3, 'second-part', 'curious', 'vault', NIGHT, ['n26', 'n27', 'n28'], [
        shot('s9a', 'n26', 'Sunlight, deposited a little at a time,', 'wide', [],
             [{'prop': 'coin-stack', 'x': 0.76, 'size': 0.5}, {'prop': 'coin', 'x': 0.76, 'y': 1.5}], fade=True,
             sfx=[('ding', 'start'), ('ding', 'end')]),
        shot('s9b', 'n26', 'over hundreds of millions of years.', 'wide', [],
             [{'prop': 'coin-tower', 'x': x} for x in (0.28, 0.4, 0.52, 0.64, 0.76)],
             overlay={'kind': 'label', 'text': 'Hundreds of millions of years later'}, fade=True, sfx=[('ding', 'start')]),
        shot('s9c', 'n27', 'We found the account a few hundred years ago.', 'wide',
             [{'character': 'taker1', 'action': 'walk', 'expression': 'happy', 'facing': 'right', 'x': 0.14, 'holds': 'bag'},
              {'character': 'taker2', 'action': 'walk', 'expression': 'smug', 'facing': 'right', 'x': 0.34, 'holds': 'bag'}],
             [{'prop': 'coin-tower', 'x': x} for x in (0.52, 0.64, 0.76)], sfx=[('footsteps', 'start')]),
        shot('s9d', 'n28', 'We have been emptying it ever since.', 'wide',
             [{'character': 'taker1', 'action': 'run', 'expression': 'happy', 'facing': 'right', 'x': 0.14, 'holds': 'bag'},
              {'character': 'taker2', 'action': 'run', 'expression': 'laughing', 'facing': 'right', 'x': 0.34, 'holds': 'bag'},
              {'character': 'taker3', 'action': 'run', 'expression': 'smug', 'facing': 'right', 'x': 0.56, 'holds': 'bag'}],
             [{'prop': 'coin-stack', 'x': 0.76}], sfx=[('footsteps', 'start'), ('whoosh', 'middle')]),
    ], quiet=True),
    scene('s10', 3, 'surprise', 'tense', 'living-room', NIGHT, ['n29', 'n30'], [
        shot('s10a', 'n29', 'So you turn the bill over, looking for the catch.', 'medium', [you('thinking', look=ENV)], fade=True),
        shot('s10b', 'n30', 'There is a second page.', 'wide', overlay=page(BILL_3, 0), sfx=[('pop', 'start')]),
        shot('s10c', 'n30', 'It shows what this costs the sender.', 'wide', overlay=page(BILL_3, 1)),
    ], treatment='atmospheric'),
    scene('s11', 3, 'surprise', 'tense', 'space', 'deep-space', ['n31', 'n32', 'n33'], [
        shot('s11a', 'n31', 'Every second, the Sun destroys four million *tonnes*', 'wide',
             [you('surprised', action='float', look='sun', holds=None, x=0.72, facing='left')],
             [{'prop': 'sun', 'x': 0.26, 'y': 3.0, 'size': 1.3, 'tall': {'x': 0.5, 'y': 6.4, 'size': 1.1}}],
             overlay={'kind': 'number', 'text': '4,000,000 tonnes', 'caption': 'every second'}, fade=True),
        shot('s11b', 'n31', 'of itself to make that light.', 'close-up', [you('horrified', action='float', holds=None, x=0.72, facing='left')]),
        shot('s11c', 'n32', 'And Earth catches almost none of it.', 'wide', [],
             [{'prop': 'sun', 'x': 0.26, 'y': 3.0, 'size': 1.3, 'tall': {'x': 0.5, 'y': 6.4, 'size': 1.1}},
              {'prop': 'earth', 'x': 0.88, 'y': 3.0, 'size': 0.14, 'tall': {'x': 0.5, 'y': 1.6}}],
             overlay={'kind': 'pointer', 'text': 'Earth', 'to': 'earth'}),
        shot('s11d', 'n32', 'One part in two billion.', 'wide', [],
             [{'prop': 'sun', 'x': 0.26, 'y': 3.0, 'size': 1.3, 'tall': {'x': 0.5, 'y': 6.4, 'size': 1.1}},
              {'prop': 'earth', 'x': 0.88, 'y': 3.0, 'size': 0.14, 'tall': {'x': 0.5, 'y': 1.6}}],
             overlay={'kind': 'number', 'text': '1 in 2,000,000,000'}, move='push-in', strength=0.3),
        shot('s11e', 'n33', 'The rest pours into empty space, unbilled,', 'wide',
             [you('sad', action='float', look='sun', holds=None, x=0.72, facing='left')],
             [{'prop': 'sun', 'x': 0.26, 'y': 3.0, 'size': 1.3, 'tall': {'x': 0.5, 'y': 6.4, 'size': 1.1}}]),
        shot('s11f', 'n33', 'unseen, for *nobody.*', 'close-up', [you('sad', action='float', holds=None, x=0.72, facing='left')],
             move='push-in', strength=0.5),
    ], treatment='atmospheric'),
    # ------------------------------------------------------------------ part 4
]

SUN_SKY = {'prop': 'sun', 'x': 0.72, 'y': 3.7, 'size': 0.7, 'tall': {'x': 0.5, 'y': 6.2}}
SCENES += [
    scene('s12', 4, 'surprise', 'tense', 'city', 'clear-day', ['n34'], [
        shot('s12a', 'n34', 'It has done this for four and a half billion years.', 'wide', [], [SUN_SKY],
             overlay={'kind': 'number', 'text': '4,500,000,000 years'}, fade=True),
    ]),
    scene('s13', 4, 'surprise', 'tense', 'plain', 'clear-day', ['n35'], [
        shot('s13a', 'n35', 'Before your street. Before people.', 'wide', [], [SUN_SKY], fade=True),
    ]),
    scene('s14', 4, 'surprise', 'tense', 'bare-rock', 'cold-dawn', ['n36'], [
        shot('s14a', 'n36', 'Before anything alive could look up.', 'wide', [], [SUN_SKY], fade=True),
    ]),
    scene('s15', 4, 'surprise', 'tense', 'sea', 'clear-day', ['n37'], [
        shot('s15a', 'n37', 'It lit oceans with nothing in them.', 'wide', [], [SUN_SKY], fade=True),
    ]),
    scene('s16', 4, 'surprise', 'tense', 'space', 'deep-space', ['n38'], [
        shot('s16a', 'n38', 'No *invoice.* No reminder. No *interest.*', 'wide', [],
             [{'prop': 'sun', 'x': 0.5, 'y': 3.0, 'size': 1.7, 'tall': {'y': 5.2, 'size': 1.3}}], fade=True,
             move='push-in', strength=0.4),
    ], treatment='atmospheric'),
    scene('s17', 4, 'takeaway', 'hope', 'living-room', 'warm-interior', ['n39', 'n40', 'n41', 'n42', 'n43', 'n44'], [
        shot('s17a', 'n39', 'At the bottom there is one last line,', 'medium', [you('thinking', look=ENV)], fade=True),
        shot('s17b', 'n39', 'and it is not a demand.', 'close-up', [you('surprised', look='down')]),
        shot('s17c', 'n40', 'Amount due: nothing.', 'wide', overlay=page(BILL_4, 0), sfx=[('pop', 'start')]),
        shot('s17d', 'n41', 'It was never a bill. It was a statement.', 'medium',
             [you('surprised', then=[{'at': 0.45, 'expression': 'happy'}])]),
        shot('s17e', 'n42', '*Paid* in full, by the sender.', 'wide', overlay=page(BILL_4, 1), sfx=[('ding', 'start')]),
        shot('s17f', 'n43', 'Remaining credit: about five billion years.', 'wide', overlay=page(BILL_4, 2)),
        shot('s17g', 'n44', 'You fold it up. Outside, it is morning.', 'medium',
             [you('happy', look='door', then=[{'at': 0.5, 'action': 'walk', 'holds': ENV, 'expression': 'happy'}])],
             [DOOR], sfx=[('creak', 'end')]),
    ]),
    scene('s18', 4, 'takeaway', 'hope', 'day-street', 'clear-day', ['n45'], [
        shot('s18a', 'n45', 'And for the first time in your life,', 'wide',
             [you('neutral', holds=None, x=0.42, look='up')], [dict(SUN_SKY, x=0.7)], fade=True),
        shot('s18b', 'n45', 'you feel the Sun on your face', 'medium', [you('happy', pose='look-up', holds=None, x=0.42, look='up')]),
        shot('s18c', 'n45', 'and know exactly what it is *worth.*', 'close-up',
             [you('happy', pose='look-up', holds=None, x=0.42, look='up')], move='push-in', strength=0.5),
    ]),
]

# The host stands at the side of every wide shot of the room that has you in it.
for sc in SCENES:
    if sc['place'] != 'living-room':
        continue
    for sh in sc['shots']:
        there = any(a['character'] == HOST for a in sh['actors'])
        if sh['camera']['framing'] == 'wide' and sh['actors'] and not there:
            sh['actors'].insert(0, HOST_IN.get(sh['id'], host()))

sb = {k: v for k, v in draft.items() if k not in ('scenes', 'cast')}
sb['cast'] = CAST
sb['meter'] = {'label': 'Sunlight delivered since you pressed play', 'perSecond': 8360000000, 'prefix': '$'}
sb['scenes'] = SCENES
io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
print('ok', len(SCENES), sum(len(s['shots']) for s in SCENES))
