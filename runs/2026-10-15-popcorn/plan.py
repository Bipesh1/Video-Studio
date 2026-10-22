"""Why Does Cinema Popcorn Cost Ten Dollars?, the first video of What's the Catch?

Biku's script, used word for word (as-is), written from the script guide v2.0. Every line has the
picture he asked for after it, turned here into the shot's `graphic`; each piece arrives on the
word he named for it. Where a picture of his did not fit the builder, the change is noted.

Run:  python runs/2026-10-15-popcorn/plan.py script      (writes script.json)
      npm run plan -- draft --run=2026-10-15-popcorn      (twice the first time: the draft copy)
      python runs/2026-10-15-popcorn/plan.py storyboard  (writes storyboard.json)
"""
import io
import json
import sys

RUN = 'F:/Video Studio/runs/2026-10-15-popcorn/'
N = 'narrator'
Q, MOMENT, MONEY, TRICK, PROOF, MOVE = ('the-question', 'the-moment', 'follow-the-money', 'the-trick',
                                        'the-proof', 'your-move')


def title(a, b=None, stress=None):
    t = {'lines': [a] + ([b] if b else [])}
    if stress is not None:
        t['stress'] = stress
    return t


# (text, beat, part, pause after ms, graphic, sound effects)
LINES = [
    ('Why does a bucket of cinema popcorn cost ten dollars?', Q, 1, 600,
     {'kind': 'scene', 'name': 'cinema-counter', 'title': title('WHY DOES POPCORN', 'COST $10?', 1), 'sign': '$10',
      'note': '$10', 'show': [{'item': 'machine', 'on': 'cinema'}, {'item': 'bucket', 'on': 'popcorn'},
                              {'item': 'hand', 'on': 'ten'}]}, []),
    ('The surprising answer has almost nothing to do with the corn.', Q, 1, 700,
     {'kind': 'number', 'title': title('NOTHING TO DO', 'WITH THE CORN', 1), 'value': '$10', 'caption': 'FOR ONE BUCKET',
      'picture': 'bucket', 'countUp': True, 'on': 'answer'},
     []),
    ('Everyone in the queue pays the ten dollars, because the film is about to start.', MOMENT, 1, 500,
     {'kind': 'queue', 'title': title('EVERYONE PAYS', '$10', 1), 'people': 4, 'sign': '$10', 'on': 'everyone'},
     [('footsteps', 'start', -10)]),
    ('Most of us assume the cinema makes its money from our *tickets*.', MOMENT, 1, 500,
     {'kind': 'tag', 'title': title('WHAT WE THINK', 'PAYS THE BILLS', 1), 'price': 'TICKETS', 'on': 'tickets'},
     []),
    ('In the US and Canada, the average ticket in 2025 cost about eleven dollars and thirty cents.', MOMENT, 1,
     700,
     {'kind': 'number', 'value': '$11.31', 'caption': 'AVERAGE TICKET IN 2025', 'picture': 'ticket', 'countUp': True, 'on': 'eleven'},
     []),
    ('Your ticket goes to the cinema, and about half of that money goes on to the studio.', MONEY, 1, 600,
     {'kind': 'flow', 'title': title('FOLLOW THE', 'TICKET MONEY', 1),
      'nodes': [{'label': 'YOU', 'on': 'your'}, {'label': 'THE CINEMA', 'on': 'cinema'},
                {'label': 'THE FILM STUDIO', 'on': 'studio'}],
      'links': [{'label': '$11.31 TICKET', 'on': 'ticket'}, {'label': 'ABOUT HALF', 'on': 'half'}]},
     [('whoosh', 'start', -8)]),
    ("Of every ticket dollar last year, the world's biggest cinema chain paid studios about forty eight cents.",
     MONEY, 1, 600,
     {'kind': 'number', 'value': '48¢', 'caption': 'TO THE STUDIO, PER $1', 'picture': 'coin', 'countUp': True, 'on': 'forty'}, []),
    ("The studio's cut can be *seventy* percent in the opening week, and about thirty five by week six.", MONEY,
     1, 600,
     {'kind': 'bars', 'title': title("STUDIO'S SHARE", 'OF EACH TICKET', 1),
      'bars': [{'label': 'OPENING / WEEK', 'value': 70, 'text': '70%', 'on': 'opening'},
               {'label': 'WEEK SIX', 'value': 35, 'text': '35%', 'on': 'six'}], 'stress': 0}, []),
    ('Most tickets sell in those first weeks, when the cinema may keep just thirty cents of each dollar.', MONEY,
     1, 1200,
     {'kind': 'number', 'value': '30¢', 'caption': 'CINEMA KEEPS, OPENING WEEK', 'picture': 'coin', 'countUp': True,
      'on': 'thirty'}, []),

    ('So the cinema makes its real money where the studio gets *nothing*: the snack counter.', TRICK, 2, 600,
     {'kind': 'scene', 'name': 'cinema-counter', 'title': title('WHERE THE CINEMA', 'REALLY EARNS', 1),
      'show': [{'item': 'machine', 'on': 'snack'}, {'item': 'bucket', 'on': 'counter'}]}, []),
    ('One cinema owner said the corn costs about eight cents and the tub ninety two, so a dollar in all.',
     TRICK, 2, 600,
     {'kind': 'receipt', 'title': title('WHAT GOES IN', stress=0),
      'lines': [{'label': 'CORN', 'value': '8¢', 'on': 'corn'}, {'label': 'TUB', 'value': '92¢', 'on': 'tub'}],
      'total': {'label': 'TOTAL', 'value': '$1', 'on': 'dollar'}}, [('pop', 'end', -6)]),
    ('Of every snack dollar, the food and cups cost about eighteen cents, and the cinema *keeps* eighty two.',
     TRICK, 2, 600,
     # Shown with the cinema's share first, so the big share fills the top of the bar as in every split.
     {'kind': 'split', 'title': title('EVERY SNACK', 'DOLLAR', 1),
      'parts': [{'label': 'THE CINEMA KEEPS', 'value': '82¢', 'share': 0.82, 'on': 'keeps'},
                {'label': 'FOOD AND CUPS', 'value': '18¢', 'share': 0.18, 'on': 'food'}]}, []),
    ('That same owner even pipes the popcorn *smell* into the room where the film plays.', TRICK, 2, 600,
     {'kind': 'scene', 'name': 'cinema-auditorium', 'title': title('THE SMELL IS', 'PART OF THE PLAN', 1),
      'show': [{'item': 'pipe', 'on': 'pipes'}, {'item': 'smell', 'on': 'smell'}, {'item': 'screen', 'on': 'film'}]},
     []),
    ('In opening week, the cinema keeps about eight dollars twenty from a bucket, but three forty from a ticket.',
     TRICK, 2, 700,
     {'kind': 'bars', 'title': title('OPENING WEEK:', 'WHAT THE CINEMA KEEPS', 1),
      'bars': [{'label': 'ONE / BUCKET', 'value': 8.2, 'text': '$8.20', 'on': 'bucket'},
               {'label': 'ONE / TICKET', 'value': 3.4, 'text': '$3.40', 'on': 'ticket'}], 'stress': 0}, []),
    ('In 2025, the average visitor to America\'s biggest chain spent about eight dollars and fifty seven cents on '
     'snacks.', PROOF, 2, 600,
     # Nine seconds is too long for one picture: the counter with a visitor paying, then the number.
     [('In 2025, the average visitor to America\'s biggest chain',
       {'kind': 'scene', 'name': 'cinema-counter', 'title': title('THE AVERAGE VISITOR', 'IN 2025', 1), 'note': '$10',
        'show': [{'item': 'machine', 'on': 'visitor'},
                 {'item': 'bucket', 'on': 'biggest'}, {'item': 'hand', 'on': 'chain'}]}),
      ('spent about eight dollars and fifty seven cents on snacks.',
       {'kind': 'number', 'value': '$8.57', 'caption': 'SNACKS PER VISITOR, 2025', 'picture': 'bucket', 'countUp': True,
        'on': 'eight'})],
     []),
    ('You meet the same trick at home, where the printer is cheap and the ink is not.', PROOF, 2, 700,
     {'kind': 'tag', 'title': title('SAME TRICK', 'AT HOME', 1), 'price': 'CHEAP PRINTER', 'note': 'PRICEY INK',
      'on': 'printer'}, [('ding', 'middle', -6)]),
    ('So *share* one bucket between two, and it costs you five dollars each.', MOVE, 2, 600,
     {'kind': 'tag', 'title': title('SHARE IT', stress=0), 'price': '$5', 'note': 'EACH, SHARED', 'was': '$10',
      'on': 'share', 'wasOn': 'costs'}, [('ding', 'end', -6)]),
    ('Because the ticket pays for the movie, but the popcorn pays for the cinema.', MOVE, 2, 1500,
     {'kind': 'number', 'value': '$10', 'caption': 'PAYS FOR THE CINEMA', 'picture': 'bucket', 'on': 'popcorn'}, [('pop', 'middle', -4)]),
]

SOURCES = io.open(RUN + 'script-original.md', encoding='utf8').read().split('SOURCES:')[1].split('YOUTUBE:')[0]
SOURCES = [s.strip()[2:] for s in SOURCES.strip().splitlines() if s.strip().startswith('- ')]
SOURCES.append('Checked by Claude on 2026-10-15: $11.31 against The Numbers 2025 summary; $8.57 (US markets), '
               'film costs 48.1% of admissions (consolidated) and food and drink costs about 18.1% of food and drink '
               'revenue (US) against AMC\'s results for the full year 2025 (8-K exhibit 99.1, 23 February 2026, '
               'https://www.sec.gov/Archives/edgar/data/1411579/000141157926000018/amc-20260223xex99d1.htm). The '
               'CNN, ABC and KTLA figures are as given in Biku\'s script and were not opened.')

# The camera travels from picture to picture as through one world (2026-10-16, "very immersive"):
# into the bucket on the counter, across to the queue, up to the tag, into the tag's ticket. Every
# piece that lands makes its own small sound (graphicSoundCues in shared/src/assembly.ts).
# A match turns a thing of one picture into a thing of the next (where it is and how big, as
# shares of the frame): the bucket on the counter becomes the $10 bucket, the price tag the ticket.
# Shots between two graphics that name no move travel by themselves (arrivalOf).
MOVES = {
    's02': ('match', {'matchFrom': {'x': 0.707, 'y': 0.436, 'size': 0.16},
                      'matchTo': {'x': 0.5, 'y': 0.324, 'size': 0.211}}),
    's03': ('wipe', None),
    's04': ('iris', {'diveAt': {'x': 0.5, 'y': 0.55}}),
    's05': ('match', {'matchFrom': {'x': 0.5, 'y': 0.436, 'size': 0.296},
                      'matchTo': {'x': 0.5, 'y': 0.324, 'size': 0.284}}),
}

MOODS = {Q: 'curious', MOMENT: 'curious', MONEY: 'upbeat', TRICK: 'upbeat', PROOF: 'hope', MOVE: 'hope'}

if sys.argv[1] == 'script':
    lines = [{'id': f'l{i:02d}', 'speaker': N, 'text': t, 'beat': b, 'chapter': c, 'pauseAfterMs': p}
             for i, (t, b, c, p, _, _) in enumerate(LINES, start=1)]
    script = {'version': 1, 'title': 'Why Does Cinema Popcorn Cost Ten Dollars?',
              'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(), 'mode': 'as-is',
              'format': 'fine-print', 'brand': 'fine-print', 'voice': 'narrator', 'speakers': [], 'lines': lines,
              'sources': SOURCES, 'changes': [], 'masterPrompt': 'prompts/fine-print.md'}
    io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n').write(
        json.dumps(script, indent=2, ensure_ascii=False) + '\n')
    print(len(lines), 'lines')
else:
    draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
    by_line = {f'l{i:02d}': (g, fx) for i, (_, _, _, _, g, fx) in enumerate(LINES, start=1)}
    scenes = []
    for sc in draft['scenes']:
        shots = []
        for line in sc['lines']:
            g, fx = by_line[line['id']]
            # A line is one shot, or several when its picture is a list of (words, graphic).
            parts = g if isinstance(g, list) else [(line['text'], g)]
            for k, (words, graphic) in enumerate(parts):
                shots.append({'id': f"s{line['id'][1:]}" + ('' if k == 0 else 'abcdefg'[k]), 'line': line['id'],
                              'words': words, 'camera': {'framing': 'wide', 'move': 'none', 'strength': 0.2},
                              'actors': [], 'props': [], 'effects': [],
                              'sfx': [{'name': n, 'at': a, 'gainDb': d} for n, a, d in fx] if k == 0 else [],
                              'graphic': graphic})
                sid = shots[-1]['id']
                move, more = MOVES.get(sid, ('cut', None))
                shots[-1]['transition'] = move
                shots[-1].update(more or {})
        # The place and colours a scene names are not drawn under an explainer graphic.
        scenes.append({**{k: v for k, v in sc.items() if k != 'shots'}, 'place': 'classroom', 'treatment': 'simple',
                       'palette': 'warm-interior', 'mood': MOODS[sc['beat']], 'quiet': False, 'shots': shots})
    sb = {k: v for k, v in draft.items() if k != 'scenes'}
    sb['cast'] = []
    sb['scenes'] = scenes
    sb['cover'] = {'shot': 's01', 'at': 0.9}
    io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(
        json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
    print(len(scenes), 'scenes,', sum(len(s['shots']) for s in scenes), 'shots')
