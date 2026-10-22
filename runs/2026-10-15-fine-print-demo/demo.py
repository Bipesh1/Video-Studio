"""A demo of The Fine Print's explainer look (look 4, picked by Biku on 2026-10-15): every kind
of graphic, each building up step by step as the narrator names its pieces. Sample numbers: this
is a look demo, not a video to post.

Run:  python runs/2026-10-15-fine-print-demo/demo.py script     (writes script.json)
      npm run plan -- draft --run=2026-10-15-fine-print-demo
      python runs/2026-10-15-fine-print-demo/demo.py storyboard (writes storyboard.json)
"""
import io
import json
import sys

RUN = 'F:/Video Studio/runs/2026-10-15-fine-print-demo/'
N = 'narrator'

# (text, beat, pause after ms, the graphic of its one shot)
LINES = [
    ('Why does a bucket of cinema popcorn cost nine dollars?', 'the-question', 700,
     {'kind': 'scene', 'name': 'cinema-counter',
      'title': {'lines': ['WHY DOES POPCORN', 'COST $9?'], 'stress': 1},
      'show': [{'item': 'machine', 'on': 'cinema'}, {'item': 'bucket', 'on': 'popcorn'},
               {'item': 'hand', 'on': 'nine'}]}),
    ('Almost everyone has paid it, and almost nobody asks why.', 'the-moment', 600,
     {'kind': 'number', 'value': '$9', 'caption': 'FOR ONE BUCKET', 'countUp': True, 'on': 'paid'}),
    ('The corn costs about thirty five cents, the bucket forty five, and the butter fifty five.', 'the-moment',
     600,
     {'kind': 'receipt', 'title': {'lines': ['WHAT GOES IN'], 'stress': 0},
      'lines': [{'label': 'CORN', 'value': '35¢', 'on': 'corn'},
                {'label': 'BUCKET', 'value': '45¢', 'on': 'bucket'},
                {'label': 'BUTTER', 'value': '55¢', 'on': 'butter'}],
      'total': {'label': 'TOTAL', 'value': '$1.35'}}),
    ('That is one dollar and thirty five cents of real cost.', 'follow-the-money', 600,
     {'kind': 'number', 'value': '$1.35', 'caption': 'WHAT IT REALLY COSTS', 'countUp': True, 'on': 'one'}),
    ('So the cinema keeps the rest, seven dollars and sixty five cents.', 'follow-the-money', 700,
     {'kind': 'split', 'title': {'lines': ['WHERE YOUR', '$9 GOES'], 'stress': 1},
      'parts': [{'label': 'THE CINEMA', 'value': '$7.65', 'share': 0.85, 'on': 'cinema'},
                {'label': 'BUTTER', 'value': '55¢', 'share': 0.061, 'on': 'rest'},
                {'label': 'BUCKET', 'value': '45¢', 'share': 0.05},
                {'label': 'CORN', 'value': '35¢', 'share': 0.039}]}),
    ('Your ticket money goes the other way, mostly to the film studio.', 'follow-the-money', 700,
     {'kind': 'flow', 'title': {'lines': ['FOLLOW THE', 'MONEY'], 'stress': 1},
      'nodes': [{'label': 'YOU', 'on': 'your'}, {'label': 'THE CINEMA', 'on': 'goes'},
                {'label': 'THE FILM STUDIO', 'on': 'studio'}],
      'links': [{'label': '$15 TICKET / $9 POPCORN', 'on': 'ticket'},
                {'label': 'MOST OF THE / TICKET', 'aside': 'KEEPS THE / POPCORN', 'on': 'mostly'}]}),
    ('The studio can take more than half of every ticket in the first weeks of a new film.', 'the-trick', 600,
     {'kind': 'bars', 'title': {'lines': ['WHO GETS', 'YOUR TICKET'], 'stress': 1},
      'bars': [{'label': 'THE / STUDIO', 'value': 8, 'text': '$8', 'on': 'studio'},
               {'label': 'THE / CINEMA', 'value': 7, 'text': '$7', 'on': 'ticket'}],
      'stress': 0}),
    ('So the cinema earns more from one bucket than from one ticket.', 'the-trick', 700,
     {'kind': 'bars', 'title': {'lines': ['WHAT THE CINEMA', 'KEEPS'], 'stress': 1},
      'bars': [{'label': 'ONE / BUCKET', 'value': 7.65, 'text': '$7.65', 'on': 'bucket'},
               {'label': 'ONE / TICKET', 'value': 6, 'text': '$6', 'on': 'ticket'}],
      'stress': 0}),
    ('That is why you walk past the snack counter before you reach your seat.', 'the-trick', 600,
     {'kind': 'scene', 'name': 'cinema-counter', 'signLabel': 'POPCORN', 'sign': '$9',
      'show': [{'item': 'board', 'on': 'why'}, {'item': 'machine', 'on': 'snack'}, {'item': 'bucket', 'on': 'counter'},
               {'item': 'hand', 'on': 'seat'}]}),
    ('And every one of us in the queue pays it.', 'the-proof', 600,
     {'kind': 'queue', 'title': {'lines': ['EVERY ONE OF US', 'PAYS $9'], 'stress': 1}, 'people': 4, 'sign': '$9',
      'on': 'every'}),
    ('It is the same at airports, stadiums and theme parks.', 'the-proof', 700,
     {'kind': 'number', 'value': 'SAME TRICK', 'caption': 'AIRPORTS, STADIUMS, PARKS', 'on': 'same'}),
    ('Next time, share one bucket, and it costs you four fifty.', 'your-move', 700,
     {'kind': 'tag', 'title': {'lines': ['SHARE IT'], 'stress': 0}, 'price': '$4.50', 'note': 'EACH, SHARED',
      'was': '$9', 'on': 'share', 'wasOn': 'costs'}),
    ('Or eat before you go, and it costs you nothing.', 'your-move', 1400,
     {'kind': 'number', 'value': '$0', 'caption': 'IF YOU EAT FIRST', 'on': 'nothing'}),
]

SOURCES = ['Sample numbers for a look demo of The Fine Print, made on 2026-10-15. Not a video to post: a real '
           'video takes every price and share from a saved source.']

if sys.argv[1] == 'script':
    lines = [{'id': f'l{i:02d}', 'speaker': N, 'text': t, 'beat': b, 'chapter': 1, 'pauseAfterMs': p}
             for i, (t, b, p, _) in enumerate(LINES, start=1)]
    script = {'version': 1, 'title': 'Why Cinema Popcorn Costs $9 (look demo)',
              'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(), 'mode': 'original',
              'format': 'fine-print', 'brand': 'fine-print', 'voice': 'narrator', 'speakers': [],
              'lines': lines, 'sources': SOURCES, 'changes': [], 'masterPrompt': 'prompts/fine-print.md'}
    io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n').write(
        json.dumps(script, indent=2, ensure_ascii=False) + '\n')
    print(len(lines), 'lines')
else:
    draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
    graphic = {f'l{i:02d}': g for i, (_, _, _, g) in enumerate(LINES, start=1)}
    scenes = []
    for sc in draft['scenes']:
        shots = []
        for line in sc['lines']:
            shots.append({'id': f"s{line['id'][1:]}", 'line': line['id'], 'words': line['text'],
                          'camera': {'framing': 'wide', 'move': 'none', 'strength': 0.2}, 'actors': [], 'props': [],
                          'effects': [], 'sfx': [], 'transition': 'cut', 'graphic': graphic[line['id']]})
        # The place and colours are not drawn under an explainer graphic; a scene still names them.
        scenes.append({**{k: v for k, v in sc.items() if k != 'shots'}, 'place': 'classroom', 'treatment': 'simple',
                       'palette': 'warm-interior', 'mood': 'curious', 'quiet': False, 'shots': shots})
    sb = {k: v for k, v in draft.items() if k != 'scenes'}
    sb['cast'] = []
    sb['scenes'] = scenes
    io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n').write(
        json.dumps(sb, indent=2, ensure_ascii=False) + '\n')
    print(len(scenes), 'scenes')
