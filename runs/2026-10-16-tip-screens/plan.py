"""Why Every Screen Asks You for a Tip Now, the second video of What's the Catch?

Biku's script, refined with his OK (2026-10-16, "yes go ahead") in two lines only: the coffee shop
experiment it cites found that people did NOT tip more when the server was visible (Goh, Jungck
and Stevens, 2022 preprint: "people did not tip more when a server was visible (versus absent)"),
so that line now says what the study did find, and the last line no longer leans on it. Every
other spoken word is his. Every line has the picture he asked for after it, turned here into the
shot's `graphic`; each piece arrives on the word he named for it.

The first video in the new look: the small 2.5D world in deep ocean colours (`explainerLook:
world`), with the moving titles and the camera travelling between pictures.

Run:  python runs/2026-10-16-tip-screens/plan.py script      (writes script.json)
      npm run plan -- draft --run=2026-10-16-tip-screens      (keep its output as storyboard.draft.json)
      python runs/2026-10-16-tip-screens/plan.py storyboard  (writes storyboard.json)
"""
import io
import json
import sys

RUN = 'F:/Video Studio/runs/2026-10-16-tip-screens/'
N = 'narrator'
Q, MOMENT, MONEY, TRICK, PROOF, MOVE = ('the-question', 'the-moment', 'follow-the-money', 'the-trick',
                                        'the-proof', 'your-move')


def title(a, b=None, stress=None):
    t = {'lines': [a] + ([b] if b else [])}
    if stress is not None:
        t['stress'] = stress
    return t


def counter(*show, t=None):
    """The coffee counter, its things arriving in order: (item, word) or item."""
    g = {'kind': 'scene', 'name': 'coffee-counter',
         'show': [{'item': s[0], 'on': s[1]} if isinstance(s, tuple) else {'item': s} for s in show]}
    if t:
        g['title'] = t
    return g


def coin_number(value, caption, on, count=True):
    return {'kind': 'number', 'value': value, 'caption': caption, 'picture': 'coin', 'countUp': count, 'on': on}


def queue(t, sign, on):
    return {'kind': 'queue', 'title': t, 'people': 4, 'sign': sign, 'on': on}


# (text, beat, part, pause after ms, graphic)
LINES = [
    ('Why does every payment screen ask you for a *tip* now?', Q, 1, 600,
     counter(('tablet', 'screen'), ('buttons', 'tip'), t=title('WHY DOES EVERY SCREEN', 'ASK FOR A TIP?', 1))),
    ('The answer hides in three little buttons, and it is *smarter* than it looks.', Q, 1, 700,
     counter('tablet', 'buttons', ('zoom', 'buttons'))),
    ('In a big 2023 survey, seventy two percent of Americans said tipping is expected in *more* places now.', MOMENT,
     1, 500, coin_number('72%', 'TIPS EXPECTED IN MORE PLACES', 'seventy')),
    ('Food trucks ask, coffee counters ask, and even some self-checkout machines *ask*.', MOMENT, 1, 500,
     queue(title('FOOD TRUCKS, COUNTERS,', 'EVEN SELF-CHECKOUT', 1), 'TIP?', 'food')),
    ('So you order a six dollar coffee, and the screen turns round to *face* you.', MOMENT, 1, 500,
     counter(('sign', 'six'), ('cup', 'coffee'), 'tablet', ('turn', 'screen'))),
    ('It offers you a tip of twenty, twenty five or *thirty* percent.', MOMENT, 1, 500,
     {'kind': 'bars', 'title': title('WHAT THE SCREEN', 'OFFERS', 1),
      'bars': [{'label': 'LOW', 'value': 20, 'text': '20%', 'on': 'twenty'},
               {'label': 'MIDDLE', 'value': 25, 'text': '25%'},
               {'label': 'HIGH', 'value': 30, 'text': '30%', 'on': 'thirty'}]}),
    ('Most of us assume those buttons are simply the *normal* amounts.', MOMENT, 1, 600,
     queue(title("THAT'S NORMAL,", 'RIGHT?', 1), '20% 25% 30%', 'normal')),
    ('But for a long time, fifteen percent was the *usual* tip for good service.', MONEY, 1, 500,
     {'kind': 'tag', 'title': title('THE OLD USUAL TIP', stress=0), 'price': '15%', 'note': 'FOR GOOD SERVICE',
      'on': 'fifteen'}),
    ('In that same survey, more than *half* said they tip fifteen percent or less at a sit-down restaurant.', MONEY,
     1, 600, coin_number('57%', 'TIP 15% OR LESS AT DINNER', 'half')),
    ('On a six dollar coffee, that old usual tip is just ninety *cents*.', MONEY, 2, 500,
     {'kind': 'receipt', 'title': title('ONE $6 COFFEE', stress=0),
      'lines': [{'label': 'COFFEE', 'value': '$6.00', 'on': 'coffee'},
                {'label': 'OLD USUAL TIP', 'value': '90¢', 'on': 'ninety'}],
      'total': {'label': 'TOTAL', 'value': '$6.90'}}),
    ('Next to those ninety cents, the smallest button asks for a dollar twenty, and the biggest a dollar *eighty*.',
     MONEY, 2, 500,
     {'kind': 'bars', 'title': title('THE TIP ON A', '$6 COFFEE', 1), 'stress': 1,
      'bars': [{'label': 'OLD USUAL / TIP', 'value': 0.9, 'text': '90¢', 'on': 'ninety'},
               {'label': 'SMALLEST / BUTTON', 'value': 1.2, 'text': '$1.20', 'on': 'smallest'},
               {'label': 'BIGGEST / BUTTON', 'value': 1.8, 'text': '$1.80', 'on': 'biggest'}]}),
    ('So the cheapest button is already a *third* more than the old usual tip.', MONEY, 2, 700,
     {'kind': 'tag', 'title': title('THE "CHEAP" BUTTON', stress=0), 'price': '$1.20', 'note': 'A THIRD MORE',
      'was': '90¢', 'on': 'cheapest', 'wasOn': 'old'}),
    ('Here is the trick: the buttons quietly tell you what a *normal* tip is.', TRICK, 2, 500,
     counter('tablet', ('buttons', 'buttons'), t=title('THE BUTTONS DECIDE', 'WHAT IS NORMAL', 1))),
    ('The shop picks the buttons, the screen shows them, and *your* choices start right there.', TRICK, 2, 500,
     {'kind': 'flow', 'title': title('WHO PICKS', 'THE BUTTONS', 1),
      'nodes': [{'label': 'THE SHOP', 'on': 'shop'}, {'label': 'THE SCREEN', 'on': 'screen'},
                {'label': 'YOU', 'on': 'your'}],
      'links': [{'label': 'PICKS / 20% 25% 30%', 'on': 'buttons'}, {'label': 'SHOWS THEM TO', 'on': 'shows'}]}),
    ('When the buttons start at twenty, twenty starts to feel like the *cheap* choice.', TRICK, 2, 500,
     queue(title('20% NOW FEELS', 'LIKE THE CHEAP ONE', 1), '20% 25% 30%', 'cheap')),
    ('Then comes a second push: someone is standing right there, *watching* you choose.', TRICK, 2, 500,
     counter('tablet', ('barista', 'someone'), ('gaze', 'watching'))),
    ('In a coffee shop experiment, the tip screen mostly made people feel *worse* about the shop.', TRICK, 3, 700,
     {'kind': 'tag', 'title': title('IN THE EXPERIMENT', stress=0), 'price': 'FELT WORSE', 'note': 'ABOUT THE SHOP',
      'on': 'worse'}),
    ('A study of thirteen million New York taxi rides found higher buttons raised tips about ten *percent*.', PROOF,
     3, 500, coin_number('+10%', 'AVERAGE TAXI TIP', 'ten')),
    ('But with those higher buttons, more riders gave up and left *no* tip at all.', PROOF, 3, 700,
     queue(title('PUSH TOO HARD,', 'GET NOTHING', 1), 'NO TIP', 'riders')),
    ('So decide your tip before you reach the counter, and press *custom* if the buttons are not yours.', MOVE, 3,
     600, counter('tablet', 'buttons', ('finger', 'press'), ('custom', 'custom'))),
    ('Every screen asks now because higher buttons really do make people tip *more*.', MOVE, 3, 1500,
     coin_number('+10%', 'WHY EVERY SCREEN ASKS', 'more', count=False)),
]

CHANGES = [
    'Line 17: "In a coffee shop experiment, people tipped more when the worker was in view." became "In a coffee '
    'shop experiment, the tip screen mostly made people feel worse about the shop." The study the script cites '
    '(Goh, Jungck and Stevens, 2022 preprint) found the opposite of the old line: "people did not tip more when a '
    'server was visible (versus absent)"; it found people feel negatively about tip screens. Agreed by Biku, '
    '2026-10-16. Its picture is a tag, IN THE EXPERIMENT / FELT WORSE / ABOUT THE SHOP.',
    'Line 21: "Every screen asks now because high buttons, with someone watching, really do make people tip more." '
    'became "Every screen asks now because higher buttons really do make people tip more." The watching part had '
    'no source; the higher buttons are backed by the taxi study. Agreed by Biku, 2026-10-16.',
]

SOURCES = io.open(RUN + 'script-original.md', encoding='utf8').read().split('SOURCES:')[1].split('YOUTUBE:')[0]
SOURCES = [s.strip()[2:] for s in SOURCES.strip().splitlines() if s.strip().startswith('- ')]
SOURCES = [s for s in SOURCES if not s.startswith('Goh and colleagues')]
SOURCES.append('Francine W. Goh, Alexandria C. Jungck and Jeffrey R. Stevens, "Pro tip: Screen-based payment methods '
               'increase negative feelings in consumers but do not increase tip sizes", University of Nebraska-Lincoln '
               'preprint, 2022. In a simulated coffee shop, people felt negatively about tip screens and did not tip '
               'more with them, and did not tip more when a server was visible. '
               'https://decisionslab.unl.edu/pubs/goh_etal_2022_preprint.pdf')
SOURCES.append('Checked by Claude on 2026-10-16: the 72% and 57% against Pew\'s report; the taxi study\'s "more than '
               'a 10 percent increase in the average tip" and "over 50 percent more likely to receive a zero-valued '
               'tip" in Haggag and Paci (2014); the coffee arithmetic (15% of $6 is 90 cents; 20% $1.20; 30% $1.80; '
               '1.20 is a third more than 0.90).')

# The camera between pictures (positions and sizes as shares of the frame). A shot not named here
# travels by itself (arrivalOf).
TABLET = {'x': 0.666, 'y': 0.402}
MOVES = {
    's02': ('dive', {'diveAt': TABLET}),
    's06': ('match', {'matchFrom': {**TABLET, 'size': 0.18}, 'matchTo': {'x': 0.5, 'y': 0.5, 'size': 0.3}}),
    's09': ('iris', {'diveAt': {'x': 0.5, 'y': 0.45}}),
    's12': ('dive', {'diveAt': {'x': 0.5, 'y': 0.5}}),
    's14': ('wipe', None),
    's18': ('wipe', None),
    's21': ('iris', {'diveAt': {'x': 0.5, 'y': 0.45}}),
}

MOODS = {Q: 'curious', MOMENT: 'curious', MONEY: 'upbeat', TRICK: 'upbeat', PROOF: 'hope', MOVE: 'hope'}

if sys.argv[1] == 'script':
    # Three parts of about 35 seconds, as `npm run script -- chapters` splits it.
    lines = [{'id': f'l{i:02d}', 'speaker': N, 'text': t, 'beat': b, 'chapter': 1 if i <= 7 else 2 if i <= 14 else 3,
              'pauseAfterMs': p} for i, (t, b, c, p, _) in enumerate(LINES, start=1)]
    script = {'version': 1, 'title': 'Why Every Screen Asks You for a Tip Now',
              'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(), 'mode': 'refine',
              'format': 'fine-print', 'brand': 'fine-print', 'voice': 'narrator', 'speakers': [], 'lines': lines,
              'sources': SOURCES, 'changes': CHANGES, 'masterPrompt': 'prompts/fine-print.md'}
    io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n').write(
        json.dumps(script, indent=2, ensure_ascii=False) + '\n')
    print(len(lines), 'lines,', sum(len(t.split()) for t, *_ in LINES), 'words')
else:
    draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
    by_line = {f'l{i:02d}': g for i, (_, _, _, _, g) in enumerate(LINES, start=1)}
    scenes = []
    for sc in draft['scenes']:
        shots = []
        for line in sc['lines']:
            sid = f"s{line['id'][1:]}"
            move, more = MOVES.get(sid, ('cut', None))
            shot = {'id': sid, 'line': line['id'], 'words': line['text'],
                    'camera': {'framing': 'wide', 'move': 'none', 'strength': 0.2},
                    'actors': [], 'props': [], 'effects': [], 'sfx': [], 'transition': move,
                    'graphic': by_line[line['id']]}
            shot.update(more or {})
            shots.append(shot)
        # The place and colours a scene names are not drawn under an explainer graphic.
        scenes.append({**{k: v for k, v in sc.items() if k != 'shots'}, 'place': 'classroom', 'treatment': 'simple',
                       'palette': 'warm-interior', 'mood': MOODS[sc['beat']], 'quiet': False, 'shots': shots})
    sb = {k: v for k, v in draft.items() if k != 'scenes'}
    sb['cast'] = []
    sb['scenes'] = scenes
    sb['explainerLook'] = 'world'
    sb['cover'] = {'shot': 's01', 'at': 0.9}
    io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(
        json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
    print(len(scenes), 'scenes,', sum(len(s['shots']) for s in scenes), 'shots')
