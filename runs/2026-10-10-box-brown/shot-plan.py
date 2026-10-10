"""The shot plan of "The Man Who Mailed Himself Twice", decided shot by shot.

It reads the draft (for the lines exactly as the script has them) and writes storyboard.json.
Run it again after any change; nothing else writes that file.

Part 1 (the crate, Richmond, the road) is planned in full and built. Parts 2 to 4 are a first
pass with what the library holds today; each is finished, and its missing pieces drawn, when
Biku says to make it.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-10-box-brown/'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINES = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}

HEAD = 1 / 9.5  # one head across the stage


def clothes(top, top_cloth, bottom='trousers', bottom_cloth='brown', shoes='brown', sleeves=None,
            under=None, hat=None, dress=None):
    c = {}
    if dress:
        c['onePiece'] = {'kind': 'dress', 'cloth': dress}
    else:
        t = {'kind': top, 'cloth': top_cloth}
        if sleeves:
            t['sleeves'] = sleeves
        if under:
            t['under'] = under
        c['top'] = t
        c['bottom'] = {'kind': bottom, 'cloth': bottom_cloth}
    if shoes:
        c['shoes'] = {'kind': 'boots', 'cloth': shoes}
    if hat:
        c['hat'] = {'kind': hat[0], 'cloth': hat[1]}
    return {'clothes': c}


def person(pid, name, skin, hair, outfit, hair_color='black', voice=None, age=None, size=None,
           wrap=None, facial=None):
    identity = {'skinTone': skin, 'hair': hair, 'hairColor': hair_color}
    if wrap:
        identity['wrap'] = wrap
    if facial:
        identity['facialHair'] = facial
    look = {'identity': identity, 'outfit': outfit, 'eyeStyle': 'round'}
    if age:
        look['age'] = age
    if size:
        look['size'] = size
    m = {'id': pid, 'name': name, 'look': look}
    if voice:
        m['voice'] = voice
    return m


HENRY, NANCY, CHILD, OWNER = 'henry', 'nancy', 'child', 'owner'
CAST = [
    person(HENRY, 'Henry Brown', 7, 'short-crop', clothes('shirt', 'forest', bottom_cloth='denim', sleeves='long'),
           voice='man-steady'),
    person(NANCY, 'Nancy, his wife', 6, 'head-wrap', clothes(None, None, dress='cream', shoes='brown'),
           wrap='crimson'),
    person(CHILD, 'The eldest child', 7, 'short-crop', clothes('shirt', 'tan', bottom_cloth='brown', shoes=None,
                                                             sleeves='short'),
           voice='woman', age='child', size=0.82),
    person('child2', 'Their second child', 6, 'braids', clothes('shirt', 'cream', bottom_cloth='brown', shoes=None,
                                                            sleeves='short'), age='child', size=0.72),
    person('child3', 'Their youngest child', 7, 'afro', clothes('shirt', 'white', bottom_cloth='brown', shoes=None,
                                                            sleeves='short'), age='child', size=0.64),
    person(OWNER, "Nancy's owner", 1, 'short-crop',
           clothes('jacket', 'steel', bottom_cloth='tan', shoes='steel', under='cream', hat=('top-hat', 'steel')),
           hair_color='brown', facial='moustache'),
    person('walker1', 'A man in the line', 8, 'fade', clothes('shirt', 'tan', bottom_cloth='steel', sleeves='short')),
    person('walker2', 'A woman in the line', 7, 'braids', clothes(None, None, dress='tan')),
    person('porter', 'An express man', 2, 'short-crop',
           clothes('shirt', 'tan', bottom_cloth='steel', shoes='brown', sleeves='long', hat=('brim-hat', 'brown')),
           hair_color='brown'),
    person('james', 'James Smith, his friend', 6, 'fade',
           clothes('jacket', 'brown', bottom_cloth='steel', under='cream'), facial='beard'),
    person('samuel', 'Samuel Smith, the shoemaker', 1, 'short-crop',
           clothes('shirt', 'cream', bottom_cloth='brown', sleeves='long'), hair_color='gray'),
    person('voice-outside', 'A man waiting in Philadelphia', 2, 'short-crop',
           clothes('jacket', 'denim', bottom_cloth='steel', under='white'), hair_color='dark-brown',
           voice='man', facial='beard'),
    person('witness', 'Another man waiting', 6, 'short-crop',
           clothes('jacket', 'brown', bottom_cloth='steel', under='cream')),
    person('catcher', 'A slave catcher', 2, 'short-crop',
           clothes('jacket', 'brown', bottom_cloth='steel', under='tan', hat=('brim-hat', 'steel')),
           hair_color='dark-brown', facial='moustache'),
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
BEAT = ('heartbeat', 'start')

# ---------------------------------------------------------------- part 1, the crate
# The crate stands on its lid in the middle; he is folded inside it, his head on the lid. A half
# turn has left him facing left, toward the air holes.
CX = 0.5
INSIDE = {'prop': 'crate-cutaway-upside-down', 'x': CX}
OUTSIDE = {'prop': 'crate-upside-down', 'x': CX}


def folded(face, look='ahead'):
    return who(HENRY, face, 'folded-upside-down', x=CX + 0.85 * HEAD, facing='left', look=look)


s1 = scene('s1', 1, 'hook', 'tense', 'plain', 'danger', ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7'], [
    shot('s1a', 'n1', 'A man is folded inside a wooden crate,', 'wide', [folded('afraid')], [INSIDE],
         overlay={'kind': 'title', 'text': 'The Man Who Mailed Himself Twice'}, sfx=[BEAT]),
    shot('s1b', 'n1', 'and someone has set it down *upside down.*', 'wide', [], [OUTSIDE],
         move='shake', strength=0.3, sfx=[('thud', 'start')]),
    shot('s1c', 'n2', 'Blood pounds in his head.', 'close-up', [folded('afraid')], [INSIDE],
         effects=[('sweat-flying', HENRY)], sfx=[BEAT]),
    shot('s1d', 'n3', 'The veins at his temples swell as thick as a finger.', 'medium',
         [folded('exhausted')], [INSIDE], move='push-in', strength=0.5,
         effects=[('anger-mark', HENRY)], sfx=[BEAT]),
    shot('s1e', 'n4', '*One sound,* and he is caught.', 'wide',
         # An express man walks up and stops beside it, a step away from hearing him.
         [who('porter', 'neutral', action='walk', x=CX - 2.5 * HEAD, facing='right', look='crate-upside-down',
              then=[{'at': 0.5, 'pose': 'stand', 'expression': 'thinking'}])], [OUTSIDE],
         sfx=[('footsteps', 'start')]),
    shot('s1f', 'n5', 'Years from now, he will climb into', 'medium', [folded('afraid', look='up')], [INSIDE],
         sfx=[BEAT]),
    shot('s1g', 'n5', 'a box like this again.', 'wide', [], [OUTSIDE], move='push-in', strength=0.6,
         sfx=[('creak', 'start')]),
    shot('s1h', 'n6', '*On purpose.*', 'close-up', [folded('determined', look='camera')], [INSIDE],
         sfx=[BEAT]),
    shot('s1i', 'n7', 'First, he has to survive this one.', 'wide', [folded('afraid')], [INSIDE],
         move='push-in', strength=0.5, effects=[('sweat-resting', HENRY)], sfx=[BEAT]),
], quiet=True)

# ---------------------------------------------------------------- part 1, Richmond
STREET, SLATE = 'day-street', 'storm-slate'
s2 = scene('s2', 1, 'setup', 'sorrow', STREET, SLATE, ['n8', 'n9'], [
    shot('s2a', 'n8', 'Richmond, Virginia, eighteen forty-eight.', 'wide', [
        who(HENRY, 'happy', x=0.34, facing='right', look=NANCY),
        who(CHILD, 'happy', 'wave', x=0.5, facing='right', look='camera', turn='front'),
        who(NANCY, 'happy', x=0.66, facing='left', look=HENRY),
    ], fade=True, overlay=label('Richmond, Virginia, 1848'), sfx=[('wind', 'start')]),
    shot('s2b', 'n9', 'Henry Brown is enslaved.', 'close-up',
         [who(HENRY, 'sad', x=0.34, facing='right', look='down')]),
])

OX, HX = 0.39, 0.61  # the owner and Henry, face to face
s2deal = scene('s2deal', 1, 'setup', 'sorrow', STREET, SLATE, ['n10', 'n11'], [
    shot('s2c', 'n10', "He has paid his wife's owner", 'medium', [
        who(OWNER, 'smug', x=OX, facing='right', look='coin'),
        who(HENRY, 'neutral', 'hold-object', x=HX, facing='left', look=OWNER, holds='coin'),
    ], fade=True),
    shot('s2c2', 'n10', 'to keep his family together.', 'wide', [
        who(OWNER, 'smug', 'hold-object', x=OX, facing='right', look=HENRY,
            then=[{'at': 0.35, 'holds': 'coin'}]),
        who(HENRY, 'neutral', 'hold-object', x=HX, facing='left', look=OWNER, holds='coin',
            then=[{'at': 0.35, 'holds': None}, {'at': 0.6, 'pose': 'stand', 'expression': 'happy'}]),
    ], sfx=[('ding', 'middle')]),
    shot('s2d', 'n11', 'The owner takes the money and *sells them anyway:*', 'close-up', [
        who(OWNER, 'smug', 'hold-object', x=OX, facing='right', look='camera', holds='coin',
            then=[{'at': 0.6, 'holds': None}]),
    ]),
    shot('s2e', 'n11', 'Nancy, pregnant, and their three children,', 'medium', [
        who(HENRY, 'horrified', 'hands-over-mouth', x=HX, facing='left', look='ahead'),
    ], move='punch-in', strength=0.4, focus=HENRY),
    shot('s2e2', 'n11', 'south to North Carolina.', 'wide', [
        who(OWNER, 'smug', 'cross-arms', x=OX, facing='right', look=HENRY),
        who(HENRY, 'horrified', 'hands-over-mouth', x=HX, facing='left', look=OWNER),
    ]),
])

RAIN = ('rain', 'start')
ROPE = {'prop': 'rope-barrier', 'x': 0.66}
WAGON = {'prop': 'wagon', 'x': 0.5}
riders = lambda eldest: [
    who('child2', 'sad', x=0.36, facing='left', look='ahead'),
    eldest,
    who('child3', 'afraid', x=0.62, facing='left', look='ahead'),
]
s2road = scene('s2road', 1, 'setup', 'sorrow', STREET, SLATE, ['n12', 'n13', 'c1', 'n14', 'n15'], [
    shot('s2f', 'n12', 'A line of chained people passes in the street.', 'wide', [
        who('walker1', 'determined', action='walk', x=0.34, facing='right', holds='chains'),
        who(NANCY, 'sad', action='walk', x=0.5, facing='right', holds='chains'),
        who('walker2', 'determined', action='walk', x=0.66, facing='right', holds='chains'),
    ], fade=True, sfx=[RAIN, ('footsteps', 'start')]),
    shot('s2g', 'n13', 'From a wagon, his eldest child sees him.', 'wide',
         riders(who(CHILD, 'sad', x=0.49, facing='left', look='ahead',
                    then=[{'at': 0.45, 'expression': 'surprised'}])),
         [WAGON], effects=[('symbol-exclaim', CHILD)], sfx=[('creak', 'start')]),
    shot('s2h', 'c1', '*Father! Father!*', 'medium',
         riders(who(CHILD, 'wailing', 'wave', x=0.49, facing='left', look='ahead')),
         [WAGON], move='push-in', strength=0.5, focus=CHILD, effects=[('tear-drops', CHILD)]),
    shot('s2i', 'n14', 'Henry walks beside Nancy as far as he is allowed.', 'wide', [
        who(HENRY, 'afraid', action='walk', x=0.44, facing='right', look=NANCY,
            then=[{'at': 0.55, 'pose': 'hold-object', 'expression': 'sad'}]),
        who(NANCY, 'sad', action='walk', x=0.6, facing='right', holds='chains'),
    ], [ROPE], sfx=[RAIN, ('footsteps', 'start')]),
    shot('s2j', 'n15', 'Then the road takes her.', 'close-up', [
        who(HENRY, 'sad', 'stand', x=0.44, facing='right', look='ahead'),
    ], move='push-in', strength=0.5, effects=[('tear-drops', HENRY)], sfx=[RAIN]),
])

# ---------------------------------------------------------------- part 2 (first pass)
SHOP, WARM = 'home-interior', 'warm-interior'
BOX = {'prop': 'crate', 'x': 0.74}
s3 = scene('s3', 2, 'rising-trouble', 'tense', SHOP, WARM,
           ['n16', 'n17', 'n18', 'n19', 'n20', 'n21', 'n22'], [
    shot('s3a', 'n16', 'Now he has nothing left to lose.', 'close-up',
         [who(HENRY, 'determined', x=0.3, look='camera')], fade=True),
    shot('s3b', 'n17', 'A free Black friend, James Smith, helps him plan.', 'wide', [
        who(HENRY, 'determined', x=0.3, look='james'),
        who('james', 'thinking', 'point', x=0.48, look='crate'),
    ], [BOX]),
    shot('s3c', 'n18', 'A white shoemaker, Samuel Smith,', 'medium',
         [who('samuel', 'thinking', 'cross-arms', x=0.6, facing='left', look='camera')]),
    shot('s3d', 'n18', 'agrees to ship him north for *eighty-six dollars,*', 'wide', [
        who(HENRY, 'neutral', 'hold-object', x=0.3, look='samuel', holds='bag'),
        who('samuel', 'neutral', x=0.6, facing='left', look='bag'),
    ], overlay={'kind': 'number', 'text': '$86', 'caption': 'of the $166 he has saved'},
        sfx=[('ding', 'start')]),
    shot('s3e', 'n18', 'more than half of all Henry has saved.', 'close-up',
         [who(HENRY, 'sad', 'hold-object', x=0.3, look='down', holds='bag')]),
    shot('s3f', 'n19', 'To get a day off work,', 'medium',
         [who(HENRY, 'thinking', 'hold-object', x=0.3, look='down', holds='bag')], focus=HENRY),
    shot('s3g', 'n19', 'he burns his own hand with acid,', 'close-up',
         [who(HENRY, 'afraid', 'hold-object', x=0.3, look='down', holds='bag')],
         effects=[('sweat-flying', HENRY)]),
    shot('s3h', 'n19', '*down to the bone.*', 'medium',
         [who(HENRY, 'exhausted', 'hold-object', x=0.3, look='ahead', holds='bag')],
         effects=[('sweat-resting', HENRY)], move='push-in', strength=0.4),
    shot('s3i', 'n20', 'The box is about three feet across.', 'wide', [], [BOX],
         overlay={'kind': 'pointer', 'text': 'ABOUT 3 FEET', 'to': 'crate'}),
    shot('s3j', 'n21', 'Inside go a bladder of water', 'wide', [], [{'prop': 'crate-cutaway', 'x': 0.74},
                                                              {'prop': 'bag', 'x': 0.72}]),
    shot('s3k', 'n21', 'and three small air holes.', 'medium', [], [BOX],
         overlay={'kind': 'pointer', 'text': 'AIR HOLES', 'to': 'crate'}),
    shot('s3l', 'n22', 'On the lid: *This side up.*', 'wide', [
        who('james', 'determined', 'point', x=0.48, look='crate'),
    ], [BOX], sfx=[('click', 'start'), ('click', 'middle')]),
], treatment='simple')

ROAD, DUSK = 'plain', 'dusk-violet'
CART = [{'prop': 'crate', 'x': 0.5, 'y': 0.5}, {'prop': 'wagon', 'x': 0.5}]
s3road = scene('s3road', 2, 'rising-trouble', 'tense', ROAD, DUSK, ['n23', 'n24', 'n25', 'n26', 'n27'], [
    shot('s3m', 'n23', 'March, eighteen forty-nine.', 'wide', [], CART, fade=True,
         overlay=label('March 1849'), sfx=[('creak', 'start')]),
    shot('s3n', 'n24', 'A wagon, a train, a steamboat, a ferry, another wagon.', 'medium', [], CART,
         move='pan', strength=0.4, sfx=[('wind', 'start')]),
    shot('s3o', 'n25', 'The express men handle the box *like freight,*', 'wide',
         [who('porter', 'neutral', action='walk', x=0.5)], [OUTSIDE],
         sfx=[('thud', 'start'), ('footsteps', 'middle')]),
    shot('s3p', 'n25', 'because that is what they think it is.', 'medium',
         [who('porter', 'neutral', 'shrug', x=0.26, look='camera')]),
    shot('s3q', 'n26', 'For nearly an hour and a half,', 'wide', [folded('exhausted')], [INSIDE], sfx=[BEAT]),
    shot('s3r', 'n26', 'he rides *on his head.*', 'close-up', [folded('afraid')], [INSIDE],
         effects=[('sweat-flying', HENRY)], sfx=[BEAT]),
    shot('s3s', 'n27', '*Twenty-seven hours,* and he never cries out.', 'wide', [folded('determined')], [INSIDE],
         overlay={'kind': 'number', 'text': '27', 'caption': 'hours in the box'}, sfx=[BEAT]),
])

# ---------------------------------------------------------------- part 3 (first pass)
OFFICE, DAWN = 'home-interior', 'cold-dawn'
MID = {'prop': 'crate', 'x': 0.5}
VOICE, WIT = 'voice-outside', 'witness'
s4 = scene('s4', 3, 'turning-point', 'hope', OFFICE, DAWN,
           ['n28', 'n29', 'v1', 'h1', 'n30', 'n31', 'h2', 'n32', 'n33'], [
    shot('s4a', 'n28', 'Philadelphia, about six in the morning.', 'wide', [
        who(VOICE, 'thinking', x=0.24, look='crate'),
        who(WIT, 'afraid', x=0.76, facing='left', look='crate'),
    ], [MID], fade=True, overlay=label('Philadelphia, 6 in the morning')),
    shot('s4b', 'n29', 'A knuckle raps the lid.', 'wide', [
        who(VOICE, 'thinking', 'point', x=0.24, look='crate'),
        who(WIT, 'afraid', x=0.76, facing='left', look='crate'),
    ], [MID], move='push-in', strength=0.3, sfx=[('click', 'start'), ('click', 'middle')]),
    shot('s4c', 'v1', 'All right?', 'medium', [who(VOICE, 'afraid', 'point', x=0.24, look='camera')],
         effects=[('symbol-question', VOICE)]),
    shot('s4d', 'h1', '*All right, sir.*', 'close-up', [who(HENRY, 'exhausted', 'kneel', x=0.5, look='up')],
         [{'prop': 'crate-cutaway', 'x': 0.5}]),
    shot('s4e', 'n30', 'They pry it open.', 'wide', [
        who(VOICE, 'determined', 'hold-object', x=0.24, look='crate'),
        who(WIT, 'determined', 'hold-object', x=0.76, facing='left', look='crate'),
    ], [MID], move='shake', strength=0.2, sfx=[('creak', 'start')]),
    shot('s4f', 'n31', 'Henry rises, stiff and dizzy, and greets them.', 'wide', [
        who(VOICE, 'surprised', 'hands-up', x=0.24, look=HENRY),
        who(HENRY, 'exhausted', x=0.5, look='camera', turn='front'),
        who(WIT, 'surprised', 'hands-over-mouth', x=0.76, facing='left', look=HENRY),
    ], [MID], effects=[('dizzy-stars', HENRY)]),
    shot('s4g', 'h2', '*How do you do, gentlemen?*', 'medium',
         [who(HENRY, 'happy', 'wave', x=0.5, look='camera', turn='front')], [MID], focus=HENRY),
    shot('s4h', 'n32', 'Then he sings a hymn of thanks.', 'close-up',
         [who(HENRY, 'laughing', 'wave', x=0.5, look='up', turn='front')]),
    shot('s4i', 'n33', 'From now on, people call him Henry Box Brown.', 'wide',
         [who(HENRY, 'happy', 'hands-up', x=0.5, look='camera', turn='front')], [MID],
         overlay=label('Henry BOX Brown'), sfx=[('pop', 'start')]),
])

s5 = scene('s5', 3, 'payoff', 'tense', STREET, SLATE, ['n34', 'n35', 'n36'], [
    shot('s5a', 'n34', 'Then he does something stranger.', 'close-up',
         [who(HENRY, 'thinking', x=0.6, look='camera')], fade=True),
    shot('s5b', 'n35', 'In eighteen fifty, a new law lets slave', 'wide',
         [who(HENRY, 'neutral', action='walk', x=0.6)], overlay=label('1850')),
    shot('s5c', 'n35', 'catchers hunt him even in the North.', 'wide', [
        who('catcher', 'angry', action='walk-sneaky', x=0.3),
        who(HENRY, 'afraid', action='walk', x=0.6, then=[{'at': 0.5, 'action': 'run'}]),
    ], sfx=[('footsteps', 'start')]),
    shot('s5d', 'n36', 'He nearly gets caught in Providence,', 'medium',
         [who(HENRY, 'afraid', action='run', x=0.6)], effects=[('sweat-flying', HENRY)],
         move='follow', sfx=[('whoosh', 'start')]),
    shot('s5e', 'n36', 'so he sails for England.', 'wide', [who(HENRY, 'determined', action='run', x=0.6)],
         sfx=[('wind', 'start')]),
])
s5box = scene('s5box', 3, 'payoff', 'tense', 'plain', 'clear-day', ['n37'], [
    shot('s5f', 'n37', 'And there, *he mails himself again.*', 'wide',
         [who(HENRY, 'smug', x=0.5, look='camera', turn='front')], [MID], fade=True,
         overlay=label('England')),
])

# ---------------------------------------------------------------- part 4 (first pass)
HALL = 'throne-room'
BILL = ['HENRY BOX BROWN', 'KING OF ALL MESMERISERS', 'AND PROFESSOR OF MAGIC']
page = lambda stress: {'kind': 'page', 'lines': BILL, 'stress': stress}
s6 = scene('s6', 4, 'payoff', 'triumph', HALL, WARM, ['n38', 'n39', 'n40'], [
    shot('s6a', 'n38', 'He is shipped in a box from Bradford to Leeds', 'wide', [], [MID], fade=True,
         overlay=label('Leeds, England'), sfx=[('crowd-murmur', 'start')]),
    shot('s6b', 'n38', 'and opened in front of a crowd.', 'wide',
         [who(HENRY, 'happy', 'hands-up', x=0.5, look='camera', turn='front')], [MID],
         sfx=[('creak', 'start'), ('crowd-murmur', 'start')]),
    shot('s6c', 'n39', 'A playbill calls him King of all Mesmerisers', 'wide', [], [], overlay=page(1),
         sfx=[('pop', 'start')]),
    shot('s6d', 'n39', 'and *Professor of Magic.*', 'wide', [], [], overlay=page(2)),
    shot('s6e', 'n40', 'Night after night, he climbs out of a box', 'wide',
         [who(HENRY, 'happy', action='cheer', x=0.5, look='camera', turn='front')], [MID],
         sfx=[('crowd-murmur', 'start')]),
    shot('s6f', 'n40', 'while England watches.', 'medium',
         [who(HENRY, 'smug', 'wave', x=0.5, look='camera', turn='front')], [MID], focus=HENRY),
])
s7 = scene('s7', 4, 'closing-line', 'reflective', HALL, DAWN, ['n41', 'n42', 'n43', 'n44', 'n45'], [
    shot('s7a', 'n41', 'It cost him *almost everything.*', 'close-up',
         [who(HENRY, 'sad', x=0.3, look='down')], fade=True),
    shot('s7b', 'n42', 'There is no record that he ever saw Nancy', 'medium',
         [who(HENRY, 'sad', 'look-down', x=0.3, look='down')]),
    shot('s7c', 'n42', 'or their children again.', 'close-up',
         [who(HENRY, 'sad', 'look-down', x=0.3, look='down')], effects=[('tear-drops', HENRY)],
         move='push-in', strength=0.4),
    shot('s7d', 'n43', 'But the box that once hid him became', 'wide', [], [BOX]),
    shot('s7e', 'n43', 'the stage that made people look.', 'wide',
         [who(HENRY, 'determined', x=0.3, look='crate')], [BOX]),
    shot('s7f', 'n44', 'Once, a crate marked This side up', 'medium', [], [BOX], move='push-in', strength=0.4),
    shot('s7g', 'n44', 'was his only way out.', 'close-up', [who(HENRY, 'determined', x=0.3, look='camera')]),
    shot('s7h', 'n45', 'After that, he made sure the whole world', 'wide',
         [who(HENRY, 'happy', 'hands-up', x=0.3, look='camera', turn='front')], [BOX]),
    shot('s7i', 'n45', 'saw *who climbed out.*', 'wide', [], [BOX], move='push-in', strength=0.6),
])

sb = {k: draft[k] for k in ('version', 'title', 'request', 'mode', 'format', 'style', 'brand', 'voice',
                            'seed', 'sources')}
sb['appliedLessons'] = ['L-0013', 'L-0022', 'L-0023', 'L-0029', 'L-0030', 'L-0031', 'L-0033', 'L-0035']
sb['cast'] = CAST
sb['cover'] = {'shot': 's1i', 'at': 0.5, 'framing': 'wide'}
sb['scenes'] = [s1, s2, s2deal, s2road, s3, s3road, s4, s5, s5box, s6, s7]
io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(
    json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
print('storyboard.json:', len(sb['scenes']), 'scenes,', sum(len(s['shots']) for s in sb['scenes']), 'shots')
