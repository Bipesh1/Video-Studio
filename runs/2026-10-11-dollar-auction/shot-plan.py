"""The shot plan of "The Dollar Auction", decided shot by shot.

It reads the draft (for the lines exactly as the script has them) and writes storyboard.json.
Run it again after any change; nothing else writes that file.

All three parts are planned in full: the auction; the real numbers and where the money goes;
the answer and the ending at home.

A game theory video: the Cheat, the Copycat, the Saint and You are cast from their saved cards.
The auctioneer is the narrator, and is never seen above the wrist: a gloved hand and a gavel
behind the podium.

How the pictures are coded, all through the video:
  - warm light is the auction as it is played;
  - red light is the bidding once it has passed one dollar;
  - pale light is the ending, at home.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-11-dollar-auction/'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINES = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}

HEAD = 1 / 9.5  # one head across the stage
ROOM, WARM, RED, DAWN = 'auction-room', 'warm-interior', 'danger', 'cold-dawn'
TOP = 1.5  # how high the podium's top is, in heads

CHEAT, COPYCAT, SAINT, YOU = 'cheat', 'copycat', 'saint', 'you'


def clothes(top=None, top_cloth=None, bottom=None, bottom_cloth='denim', sleeves=None, under=None, tie=None,
            dress=None):
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
    if tie:
        c['tie'] = {'cloth': tie[0], 'stripe': tie[1]}
    return {'clothes': c}


def extra(pid, name, outfit):
    return {'id': pid, 'name': name, 'look': {'outfit': outfit, 'eyeStyle': 'round'}}


# The fixed cast comes from the cards: no look and no voice of this video's own. Everyone else is
# a plain figure told apart by one or two clothes; no real person is drawn.
CAST = [
    {'id': CHEAT, 'name': 'The Cheat', 'card': 'cheat'},
    {'id': COPYCAT, 'name': 'The Copycat', 'card': 'copycat'},
    {'id': SAINT, 'name': 'The Saint', 'card': 'saint'},
    {'id': YOU, 'name': 'You, in the green cap', 'card': 'you'},
    extra('guest-a', 'A party guest', clothes('t-shirt', 'orange', bottom='trousers')),
    extra('guest-b', 'Another party guest', clothes(dress='crimson')),
    extra('guest-c', 'A third party guest', clothes('hoodie', 'ocean', bottom='trousers', bottom_cloth='steel')),
    extra('student-a', 'A business student', clothes('shirt', 'white', bottom='trousers', bottom_cloth='steel',
                                                      sleeves='long', tie=('denim', 'glint'))),
    extra('student-b', 'Another business student', clothes('shirt', 'cream', bottom='trousers',
                                                            bottom_cloth='brown', sleeves='long',
                                                            tie=('forest', 'gold'))),
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
page = lambda lines, stress=None: dict({'kind': 'page', 'lines': lines}, **({} if stress is None else {'stress': stress}))


def thinks(pid, lines, stress=None):
    o = {'kind': 'bubble', 'of': pid, 'shape': 'thought', 'lines': lines}
    if stress is not None:
        o['stress'] = stress
    return o


# ---------------------------------------------------------------- the auction room
# The podium stands in the middle under the lamp. The dollar stands on its top, a little to the
# left; the auctioneer's gloved hand comes up from behind it on the right, the gavel over its
# block. The Cheat bids from the left, the Copycat from the right. You stand far to the left
# and the Saint far to the right, each seen alone.
CX = 0.5
LX, RX = CX - 1.9 * HEAD, CX + 1.9 * HEAD
YOU_X, SAINT_X = CX - 3.7 * HEAD, CX + 3.7 * HEAD
NOTE_AT, GAVEL_AT = -0.56, 0.22  # where the dollar and the gavel's block are on the podium, in heads
NOTE_X, GAVEL_X = CX + NOTE_AT * HEAD, CX + GAVEL_AT * HEAD


def room(gavel='gavel', tag=None, note=True):
    """Everything standing in the scene: the hand first, so the podium hides its arm."""
    things = [{'prop': gavel, 'x': round(GAVEL_X, 3), 'y': TOP}, {'prop': 'podium', 'x': CX}]
    if note:
        n = {'prop': 'banknote', 'x': round(NOTE_X, 3), 'y': TOP}
        if tag:
            n['tag'] = tag
        things.append(n)
    return things


BIG = 2.1  # how much bigger the podium is drawn when a shot is about what is on it


def close_on_podium(gavel='gavel', tag=None, note=True):
    """The top of the podium, big, with nobody in the picture: the dollar under the lamp."""
    things = [{'prop': gavel, 'x': round(CX + GAVEL_AT * BIG * HEAD, 3), 'y': TOP * BIG, 'size': BIG},
              {'prop': 'podium', 'x': CX, 'size': BIG}]
    if note:
        n = {'prop': 'banknote', 'x': round(CX + NOTE_AT * BIG * HEAD, 3), 'y': TOP * BIG, 'size': BIG}
        if tag:
            n['tag'] = tag
        things.append(n)
    return things


def cheat(face, pose='stand', **more):
    return who(CHEAT, face, pose, x=LX, facing='right', **more)


def copycat(face, pose='stand', **more):
    return who(COPYCAT, face, pose, x=RX, facing='left', **more)


TICK = ('tick', 'start')
MURMUR = ('crowd-murmur', 'start', -6)
BID = [{'at': 0.15, 'pose': 'wave'}]  # the paddle goes up

# ---------------------------------------------------------------- part 1, the question
# The opening rule (Biku, 2026-10-11): the question the video answers is asked in the first three
# seconds and stands as big words over the scene, which is already there behind them: the
# dollar under the lamp, the gloved hand on the gavel. Then one line of stakes, and the two
# bidders who said yes, the Copycat a beat behind the Cheat.
QUESTION = ['Would you bid', 'a nickel for', 'a dollar bill?']
s0 = scene('s0', 1, 'hook', 'curious', ROOM, WARM, ['q1', 'q2'], [
    shot('s0a', 'q1', 'Would you bid a nickel for *a dollar bill?*', 'wide', [], close_on_podium(),
         overlay={'kind': 'words', 'lines': QUESTION, 'stress': 2}),
    shot('s0b', 'q2', 'Two bidders said yes. Watch what it cost them.', 'wide', [
        cheat('happy', look='banknote', holds='paddle',
              then=[{'at': 0.12, 'pose': 'wave'}, {'at': 0.6, 'lookAt': COPYCAT, 'expression': 'smug'}]),
        copycat('neutral', 'head-tilt', look=CHEAT, holds='paddle',
                then=[{'at': 0.32, 'pose': 'wave'}]),
    ], room(), sfx=[MURMUR, ('click', 'start'), ('click', 'middle')]),
], quiet=True)

# ---------------------------------------------------------------- part 1, sold (hook)
# The gavel comes down before anyone is seen: the sale is over as the video begins.
s1knock = scene('s1knock', 1, 'hook', 'curious', ROOM, WARM, ['n1'], [
    shot('s1a', 'n1', '*Sold.*', 'wide', [], close_on_podium('gavel-knock', note=False),
         sfx=[('thud', 'start')]),
], quiet=True)

s1 = scene('s1', 1, 'hook', 'curious', ROOM, WARM, ['n2', 'n3', 'n4', 'n5', 'c1'], [
    shot('s1b', 'n2', 'One dollar bill, to the Cheat, for *a dollar eighty-five.*', 'wide', [
        cheat('laughing', 'wave', look='camera', holds='banknote',
              then=[{'at': 0.5, 'expression': 'smug'}]),
        copycat('sad', 'look-down', look='down'),
    ], room(note=False), overlay=number('$1.85', 'for a $1 bill'), sfx=[MURMUR]),
    shot('s1c', 'n3', 'And the Copycat pays a dollar eighty.', 'medium', [
        copycat('sad', look='down', then=[{'at': 0.55, 'expression': 'horrified'}]),
    ], room(note=False), focus=COPYCAT, overlay=label('COPYCAT PAID $1.80')),
    shot('s1d', 'n4', '*For nothing.*', 'close-up', [
        copycat('horrified', look='down', then=[{'at': 0.4, 'lookAt': 'camera', 'expression': 'sad'}]),
    ], room(note=False), move='push-in', strength=0.4),
    shot('s1e', 'n5', 'So who won?', 'wide', [
        cheat('smug', 'wave', look='camera', holds='banknote'),
        copycat('sad', 'look-down', look=CHEAT),
    ], room(note=False)),
    shot('s1f', 'c1', 'Me. *Obviously.*', 'medium', [
        cheat('smug', 'wave', look='camera', holds='banknote', turn='front',
              then=[{'at': 0.35, 'expression': 'laughing'}, {'at': 0.75, 'expression': 'wink'}]),
    ], room(note=False), focus=CHEAT, move='push-in', strength=0.4, sfx=[('ding', 'middle')]),
], quiet=True)

# ---------------------------------------------------------------- part 1, the tiny rule
# Back to the start: nobody holds anything, the dollar is on the podium with no price on it.
s2 = scene('s2', 1, 'why-it-matters', 'curious', ROOM, WARM, ['n6'], [
    shot('s2a', 'n6', 'Rewind.', 'wide', [
        cheat('surprised', look='banknote'),
        copycat('surprised', 'head-tilt', look='banknote'),
    ], room(), fade=True, sfx=[('whoosh', 'start')]),
], quiet=True)

s2bill = scene('s2bill', 1, 'why-it-matters', 'curious', ROOM, WARM, ['n7'], [
    # One shot for the whole line: the dollar under the lamp, and then the tag pops up on it.
    shot('s2b', 'n7', 'One dollar. Bids start at a nickel.', 'wide', [], close_on_podium(tag='BIDS FROM 5¢'),
         sfx=[('pop', 'middle')]),
], quiet=True)

RULE = ['ONE TINY RULE', 'SECOND PLACE', 'PAYS TOO', 'AND GETS NOTHING']
s2rule = scene('s2rule', 1, 'why-it-matters', 'curious', ROOM, WARM, ['n8', 'n9', 'n10'], [
    shot('s2d', 'n8', 'Highest bid takes it.', 'medium', [
        cheat('smug', 'rub-hands'),
    ], room(), focus=CHEAT),
    # The card on the podium, held up to us: the one line of small print.
    shot('s2e', 'n9', 'One tiny rule.', 'wide', [], close_on_podium(), overlay=page(RULE, 0)),
    shot('s2f', 'n10', '*Second place pays too,*', 'wide', [], close_on_podium(), overlay=page(RULE, 2)),
    shot('s2g', 'n10', 'and gets nothing.', 'wide', [], close_on_podium(), overlay=page(RULE, 3)),
], quiet=True)

s2ask = scene('s2ask', 1, 'why-it-matters', 'curious', ROOM, WARM, ['n11'], [
    shot('s2h', 'n11', 'A dollar for a nickel.', 'wide', [], close_on_podium(tag='5¢ ?')),
], quiet=True)

s2bids = scene('s2bids', 1, 'why-it-matters', 'curious', ROOM, WARM, ['n12', 'c2', 'k1'], [
    # His script: You alone, a hand half raised, and a beat of silence.
    shot('s2i', 'n12', 'Would you *raise your hand?*', 'medium', [
        who(YOU, 'thinking', x=YOU_X, facing='right', look='camera',
            then=[{'at': 0.3, 'pose': 'wave', 'expression': 'neutral'},
                  {'at': 0.66, 'pose': 'stand', 'expression': 'suspicious'}]),
    ], room(), focus=YOU),
    shot('s2j', 'c2', 'Five cents.', 'medium', [
        cheat('smug', look='camera', holds='paddle-5c', then=BID),
    ], room(), focus=CHEAT, sfx=[('click', 'middle')]),
    # The same move, a beat later.
    shot('s2k', 'k1', 'Ten cents.', 'medium', [
        cheat('smug', 'wave', look=COPYCAT, holds='paddle-5c'),
        copycat('neutral', look=CHEAT, holds='paddle-10c', then=BID),
    ], room(), focus=COPYCAT, sfx=[('click', 'middle')]),
], quiet=True)

# ---------------------------------------------------------------- part 1, past a dollar
s3 = scene('s3', 1, 'first-part', 'curious', ROOM, WARM, ['n13', 'n14', 'c3'], [
    shot('s3a', 'n13', 'Ninety-five cents from the Cheat.', 'medium', [
        cheat('determined', 'wave', look=COPYCAT, holds='paddle'),
        copycat('neutral', look=CHEAT, holds='paddle'),
    ], room(), focus=CHEAT, fade=True, overlay=label('CHEAT 95¢')),
    shot('s3b', 'n14', 'One dollar from the Copycat.', 'wide', [
        cheat('determined', 'wave', look=COPYCAT, holds='paddle',
              then=[{'at': 0.35, 'pose': 'stand', 'expression': 'surprised'}]),
        copycat('neutral', look=CHEAT, holds='paddle', then=[{'at': 0.2, 'pose': 'wave'}]),
    ], room(tag='$1.00'), overlay=label('CHEAT 95¢   COPYCAT $1.00'), sfx=[('click', 'middle')]),
    # He counts it out. The sum is the picture.
    shot('s3c', 'c3', 'If I stop, I lose ninety-five cents.', 'medium', [
        cheat('thinking', look='up', holds='paddle', then=[{'at': 0.6, 'expression': 'afraid'}]),
    ], room(), focus=CHEAT, overlay=thinks(CHEAT, ['IF I STOP', 'I LOSE 95¢'], 1)),
], quiet=True)

# The light turns red as the bidding goes past what the dollar is worth.
s3red = scene('s3red', 1, 'first-part', 'tense', ROOM, RED, ['c4', 'k2', 'k3'], [
    shot('s3d', 'c4', 'If I bid *a dollar five* and win,', 'medium', [
        cheat('thinking', look='up', holds='paddle'),
    ], room(), focus=CHEAT, overlay=thinks(CHEAT, ['BID $1.05, WIN', 'LOSE ONLY 5¢'], 1), sfx=[TICK]),
    shot('s3e', 'c4', 'I only lose a nickel.', 'medium', [
        cheat('thinking', look='camera', holds='paddle',
              then=[{'at': 0.2, 'pose': 'wave', 'expression': 'determined'}]),
    ], room(), focus=CHEAT, overlay=label('CHEAT $1.05'), sfx=[TICK, ('click', 'middle')]),
    # The Copycat counts the same way, word for word.
    # Seen wide: his beanie leaves no room for a bubble over his head in a closer shot.
    shot('s3f', 'k2', 'If I stop, I lose a dollar.', 'wide', [
        cheat('determined', 'wave', look=COPYCAT, holds='paddle'),
        copycat('thinking', look='up', holds='paddle'),
    ], room(tag='$1.05'), overlay=thinks(COPYCAT, ['IF I STOP', 'I LOSE $1.00'], 1), sfx=[TICK]),
    shot('s3g', 'k3', 'A dollar ten.', 'medium', [
        copycat('thinking', look='camera', holds='paddle',
                then=[{'at': 0.2, 'pose': 'wave', 'expression': 'determined'}]),
    ], room(), focus=COPYCAT, sfx=[TICK, ('click', 'middle')]),
])

# The dollar, with more than a dollar on its tag and nobody looking at it.
s3bill = scene('s3bill', 1, 'first-part', 'tense', ROOM, RED, ['n15'], [
    shot('s3h', 'n15', 'Nobody is chasing the dollar now.', 'wide', [], close_on_podium(tag='$1.10'),
         sfx=[TICK]),
])

s3stuck = scene('s3stuck', 1, 'first-part', 'tense', ROOM, RED, ['n16'], [
    shot('s3i', 'n16', "They just *can't afford to come second.*", 'wide', [
        cheat('afraid', 'wave', look=COPYCAT, holds='paddle'),
        copycat('afraid', 'wave', look=CHEAT, holds='paddle'),
    ], room(tag='$1.10'), overlay=label('CHEAT $1.05   COPYCAT $1.10'), move='push-in', strength=0.6,
         effects=[('sweat-flying', CHEAT), ('sweat-flying', COPYCAT)], sfx=[TICK]),
])

# ---------------------------------------------------------------- part 2, the party game
# A short visit elsewhere: a party round a table with a dollar on it, and the paper the game was
# printed in, held up to us. No real person is drawn.
PAPER = ['THE DOLLAR', 'AUCTION GAME', 'PUBLISHED 1971']
PX = CX - 0.35 * HEAD
GA, GB, GC = PX - 1.9 * HEAD, PX + 1.25 * HEAD, PX + 2.5 * HEAD


def party(tag=None):
    n = {'prop': 'banknote', 'x': round(PX, 3), 'y': 1.22}
    if tag:
        n['tag'] = tag
    return [{'prop': 'table', 'x': round(PX, 3)}, n]


def guest_a(face, pose='stand', **more):
    return who('guest-a', face, pose, x=GA, facing='right', **more)


def guest_b(face, pose='stand', **more):
    return who('guest-b', face, pose, x=GB, facing='left', holds='paddle', **more)


def guest_c(face, pose='stand', **more):
    return who('guest-c', face, pose, x=GC, facing='left', **more)


CHATTER = ('crowd-murmur', 'start', -4)
s4 = scene('s4', 2, 'second-part', 'upbeat', 'living-room', WARM, ['n17', 'n18'], [
    # The page alone, with the party heard behind it: a page held up over people would cover
    # their faces. The guests are seen when it comes down.
    shot('s4a', 'n17', 'The economist who published this game,', 'wide', [], party(), fade=True,
         overlay=page(PAPER, 0), sfx=[CHATTER]),
    shot('s4b', 'n17', 'in *nineteen seventy-one,*', 'wide', [], party(), overlay=page(PAPER, 2)),
    # The page is gone and the party is on: one waves, one bids, one laughs. Nobody throws both
    # arms out: at the edge of a narrow picture a hand would leave it.
    shot('s4c', 'n17', 'said to play it at a party, when spirits are high.', 'wide', [
        guest_a('happy', look='guest-b', then=[{'at': 0.15, 'pose': 'wave', 'expression': 'laughing'}]),
        guest_b('happy', look='guest-a', then=[{'at': 0.28, 'pose': 'wave', 'expression': 'laughing'}]),
        guest_c('happy', look='guest-b', then=[{'at': 0.4, 'expression': 'laughing'}]),
    ], party(), sfx=[CHATTER]),
    shot('s4d', 'n18', 'He wrote that three to five dollars', 'medium', [
        guest_b('laughing', 'wave', look='camera'),
    ], party(), focus='guest-b'),
    shot('s4e', 'n18', 'for one dollar was not unusual.', 'wide', [
        guest_a('laughing', 'wave', look='banknote',
                then=[{'at': 0.3, 'pose': 'stand', 'expression': 'surprised'}]),
        guest_b('laughing', 'wave', look='guest-a'),
        guest_c('laughing', look='banknote', then=[{'at': 0.45, 'expression': 'surprised'}]),
    ], party(tag='$3 TO $5'), sfx=[('ding', 'start')]),
], treatment='simple')

# A classroom: two students across one table, a twenty between them.
SA, SB = CX - 1.75 * HEAD, CX + 1.75 * HEAD


def desk(tag=None):
    n = {'prop': 'banknote-20', 'x': CX, 'y': 1.22}
    if tag:
        n['tag'] = tag
    return [{'prop': 'chair', 'x': round(SA, 3)}, {'prop': 'chair', 'x': round(SB, 3)},
            {'prop': 'table', 'x': CX}, n]


def student_a(face, pose='sit', **more):
    return who('student-a', face, pose, x=SA, facing='right', **more)


def student_b(face, pose='sit', **more):
    return who('student-b', face, pose, x=SB, facing='left', **more)


s4class = scene('s4class', 2, 'second-part', 'curious', 'classroom', DAWN, ['n19', 'n20'], [
    shot('s4f', 'n19', 'In one business school class,', 'wide', [
        student_a('neutral', look='banknote-20'), student_b('neutral', look='banknote-20'),
    ], desk(), fade=True, overlay=label('A business school class'), sfx=[('ding', 'start')]),
    # They outbid each other until the tag on the twenty says two thousand.
    shot('s4g', 'n19', 'a twenty-dollar bill went for *two thousand dollars.*', 'wide', [
        student_a('determined', look='student-b', then=[{'at': 0.15, 'pose': 'sit-hands-up'}]),
        student_b('determined', look='student-a', then=[{'at': 0.32, 'pose': 'sit-hands-up'}]),
    ], desk(tag='$2,000'), sfx=[('click', 'start'), ('click', 'middle')]),
    shot('s4h', 'n20', 'A hundred times its worth.', 'wide', [
        student_a('horrified', 'sit-hands-up', look='banknote-20',
                  then=[{'at': 0.3, 'pose': 'sit-slump', 'expression': 'sad'}]),
        student_b('horrified', 'sit-hands-up', look='banknote-20',
                  then=[{'at': 0.45, 'pose': 'sit-slump', 'expression': 'sad'}]),
    ], desk(tag='$2,000'), overlay=number('100 x', 'what it was worth'), move='push-in', strength=0.4),
], treatment='simple')

# ---------------------------------------------------------------- part 2, where the money goes
# Back in the auction room. Behind the podium stands a huge jar stuffed with notes, the
# auctioneer's other gloved hand on its lid: it slides into view as he says "To me."
JAR_AT = 0.6  # how far right of the podium's middle the jar stands, in heads
JAR = {'prop': 'cash-jar', 'x': round(CX + JAR_AT * HEAD, 3)}
MID = 1.55  # the podium smaller than in the shots of it alone, so the jar and a number fit over it


def podium_and_jar(slides=False):
    """The podium and the jar behind it, big, with nobody in the picture."""
    jar = {'prop': 'cash-jar', 'x': round(CX + JAR_AT * MID * HEAD, 3), 'size': MID}
    if slides:
        jar['from'] = 1.1
    return [jar,
            {'prop': 'gavel', 'x': round(CX + GAVEL_AT * MID * HEAD, 3), 'y': TOP * MID, 'size': MID},
            {'prop': 'podium', 'x': CX, 'size': MID},
            {'prop': 'banknote', 'x': round(CX + NOTE_AT * MID * HEAD, 3), 'y': TOP * MID, 'size': MID}]


def saint(face, pose='stand', **more):
    return who(SAINT, face, pose, x=SAINT_X, facing='left', **more)


s5 = scene('s5', 2, 'surprise', 'tense', ROOM, WARM, ['s1', 'n21', 'n22', 'n23', 'n24', 'n25'], [
    # The Saint, from the front row, one polite hand up.
    shot('s5a', 's1', 'Sorry. Where does all that money go?', 'medium', [
        saint('happy', 'wave', look='camera', then=[{'at': 0.55, 'pose': 'stand', 'expression': 'thinking'}]),
    ], room(), focus=SAINT, fade=True),
    shot('s5b', 'n21', '*To me.*', 'wide', [], podium_and_jar(slides=True), sfx=[('whoosh', 'start')]),
    shot('s5c', 'n22', "I'm the one selling the dollar.", 'wide', [
        cheat('horrified', look='cash-jar'),
        copycat('horrified', look='cash-jar'),
    ], [JAR, *room(tag='$1.10')], sfx=[('ding', 'start')]),
    shot('s5d', 'n23', 'A real website ran a close cousin of this game.', 'wide', [], podium_and_jar(),
         overlay=label('A penny auction website')),
    # The counter on the jar: it runs up to the figure as he says it.
    shot('s5e', 'n24', 'One study counted *twenty-six million dollars* in profit.', 'wide', [], podium_and_jar(),
         overlay=dict(number('$26,000,000', 'profit, by one study'), countUp=True),
         sfx=[('ding', 'start'), ('ding', 'middle')]),
    shot('s5f', 'n25', 'It even auctioned cash,', 'wide', [
        cheat('surprised', look='cash-jar'),
        copycat('surprised', look='cash-jar'),
    ], [JAR, *room(tag='$1.10')]),
    shot('s5g', 'n25', 'and took in about two dollars', 'wide', [], podium_and_jar(),
         overlay=number('$2 IN', 'for every $1 of cash sold')),
    shot('s5h', 'n25', 'for every dollar it gave away.', 'medium', [
        saint('sad', look='camera', then=[{'at': 0.35, 'pose': 'look-down', 'lookAt': 'down'}]),
    ], room(), focus=SAINT),
])

# ---------------------------------------------------------------- part 3, sixty cents
# The auctioneer owns up. The full jar is still behind the podium; in the replay that follows
# it holds a few coins.
def podium_with(jar, gavel='gavel', tag=None):
    """The podium with a jar behind it, big, with nobody in the picture."""
    note = {'prop': 'banknote', 'x': round(CX + NOTE_AT * MID * HEAD, 3), 'y': TOP * MID, 'size': MID}
    if tag:
        note['tag'] = tag
    return [{'prop': jar, 'x': round(CX + JAR_AT * MID * HEAD, 3), 'size': MID},
            {'prop': gavel, 'x': round(CX + GAVEL_AT * MID * HEAD, 3), 'y': TOP * MID, 'size': MID},
            {'prop': 'podium', 'x': CX, 'size': MID}, note]


SHEET = ['EACH PLAYER HAS', '$2.50']
s6 = scene('s6', 3, 'surprise', 'curious', ROOM, WARM, ['n26', 'n27', 'n28'], [
    shot('s6a', 'n26', "I'd rather you missed this part.", 'wide', [], podium_with('cash-jar'), fade=True),
    shot('s6b', 'n27', 'A game theorist solved my auction.', 'wide', [
        cheat('thinking', look='banknote'),
        copycat('thinking', 'head-tilt', look='banknote'),
    ], [JAR, *room()], overlay=label('Solved in 1986')),
    # The sheet he would rather not show, held up to us.
    shot('s6c', 'n28', 'Give both players two dollars and fifty cents.', 'wide', [], podium_with('cash-jar'),
         overlay=page(SHEET, 1)),
])

# The auction again, played with perfect logic: one bid, and the jar stays nearly empty.
JAR_LOW = {'prop': 'cash-jar-low', 'x': round(CX + JAR_AT * HEAD, 3)}
s6replay = scene('s6replay', 3, 'surprise', 'curious', ROOM, WARM, ['n29', 'n30'], [
    shot('s6d', 'n29', 'Perfect logic says one opening bid of *sixty cents.*', 'medium', [
        cheat('thinking', look='up', holds='paddle-60c',
              then=[{'at': 0.45, 'pose': 'wave', 'expression': 'smug', 'lookAt': 'camera'}]),
    ], [JAR_LOW, *room()], focus=CHEAT, fade=True, sfx=[('click', 'middle')]),
    # Nobody answers. The gavel comes down on one bid, and one coin drops into the jar.
    shot('s6e', 'n30', 'The other player *stays silent.*', 'wide', [
        cheat('smug', 'wave', look=COPYCAT, holds='paddle-60c'),
        copycat('neutral', 'cross-arms', look=CHEAT),
    ], [JAR_LOW, *room('gavel-knock', tag='60¢')], sfx=[('thud', 'start'), ('ding', 'end')]),
])

# ---------------------------------------------------------------- part 3, you played this today
s7 = scene('s7', 3, 'takeaway', 'reflective', ROOM, WARM, ['n31'], [
    shot('s7a', 'n31', 'The trap was never the dollar,', 'wide', [], podium_with('cash-jar-low')),
    # The moment it began: the Copycat's paddle going up after the Cheat's.
    shot('s7b', 'n31', 'it was *the second bid.*', 'wide', [
        cheat('smug', 'wave', look=COPYCAT, holds='paddle-5c'),
        copycat('neutral', look=CHEAT, holds='paddle-10c', then=[{'at': 0.15, 'pose': 'wave'}]),
    ], [JAR_LOW, *room()], overlay=number('THE SECOND BID'), sfx=[('click', 'start')]),
])

# At home, in pale light: you on the sofa with the phone, a chat filling up, and a clock on the
# wall whose hands run away with the evening.
SOFA_X = CX - 0.55 * HEAD
CLOCK_X, CHAT_X = CX - 1.75 * HEAD, CX + 1.45 * HEAD
SOFA = {'prop': 'sofa', 'x': round(SOFA_X, 3)}


def home(clock='wall-clock', chat=None):
    things = [SOFA, {'prop': clock, 'x': round(CLOCK_X, 3), 'y': 3.5}]
    if chat:
        things.append({'prop': chat, 'x': round(CHAT_X, 3), 'y': 2.75})
    return things


def you(face, pose='sit-phone', **more):
    return who(YOU, face, pose, x=SOFA_X, facing='right', holds='phone', **more)


PING = ('blip', 'start', -4)
s7home = scene('s7home', 3, 'takeaway', 'reflective', 'home-interior', DAWN, ['n32', 'n33', 'n34'], [
    shot('s7c', 'n32', '*You played this today.*', 'wide', [
        you('neutral', look='phone'),
    ], home(), fade=True, sfx=[PING]),
    shot('s7d', 'n33', 'That group chat argument nobody would drop.', 'wide', [
        you('determined', look='phone', then=[{'at': 0.5, 'expression': 'angry'}]),
    ], home(chat='chat-bubbles'), sfx=[PING, ('blip', 'middle', -4), ('blip', 'end', -4)]),
    shot('s7e', 'n34', 'Every reply cost you more of your evening,', 'wide', [
        # His mouth stays shut all through: he never speaks, and an open one could read as talking.
        you('angry', look='phone', then=[{'at': 0.5, 'expression': 'sad'}]),
    ], home(clock='wall-clock-spinning', chat='chat-full'), sfx=[('tick', 'start'), ('blip', 'middle', -4)]),
    # The closer shot: you alone, giving up.
    shot('s7f', 'n34', 'and neither side could afford to come second.', 'medium', [
        you('sad', look='phone', then=[{'at': 0.35, 'pose': 'sit-slump'}, {'at': 0.7, 'lookAt': 'camera'}]),
    ], [SOFA], focus=YOU),
], treatment='simple')

# Back under the lamp, as the video began: a fresh note, the gavel going up, the question again.
FRESH = {'prop': 'banknote', 'x': round(CX + NOTE_AT * BIG * HEAD, 3), 'y': TOP * BIG, 'size': BIG,
         'from': round(CX - 2.2 * BIG * HEAD, 3), 'tag': '5¢ ?'}
s7end = scene('s7end', 3, 'takeaway', 'reflective', ROOM, WARM, ['n35', 'n36'], [
    shot('s7g', 'n35', 'So.', 'wide', [], close_on_podium(note=False), fade=True),
    shot('s7h', 'n36', "Who'll start me at a nickel?", 'wide', [],
         [*close_on_podium('gavel-rise', note=False), FRESH]),
])

SCENES = [s0, s1knock, s1, s2, s2bill, s2rule, s2ask, s2bids, s3, s3red, s3bill, s3stuck,
          s4, s4class, s5, s6, s6replay, s7, s7home, s7end]
storyboard = {k: v for k, v in draft.items() if k != 'scenes'}
storyboard['cast'] = CAST
storyboard['series'] = 'game-theory'
storyboard['appliedLessons'] = ['L-0013', 'L-0023', 'L-0029', 'L-0030', 'L-0031', 'L-0033']
# The cover: the Cheat with the dollar he paid a dollar eighty-five for.
storyboard['cover'] = {'shot': 's1f', 'at': 0.6, 'framing': 'medium'}
storyboard['scenes'] = SCENES
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(storyboard, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(SCENES), 'scenes,', sum(len(s['shots']) for s in SCENES), 'shots')
