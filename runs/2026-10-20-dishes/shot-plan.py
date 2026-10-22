"""The shot plan of "She Wrote Down Every Dish She Washed for a Year": writes storyboard.json.

Run it after `npm run plan -- draft` (kept as storyboard.draft.json), and again after any change.

Wide (16:9) for YouTube. One place, their kitchen (`kitchen`): the counter with its sink on the
left, the window in the middle of the wall, the table with his chair on the right and the small
cabinet by the fridge. Night scenes in the night colours, the year earlier and the days in the
warm ones. The Trainer is a voice over the story (he is the host) and is not seen.

Who stands where (x across the scene):
  the counter and sink   .24       the Saint washing up stands at .3, facing right
  the window             .55, hung at 2.9; the wall clock .42 over the counter
  the table              .72, his chair .84 (he sits facing left), her place .6 (standing)
  the cabinet            .95, by the fridge

Every explaining line is shown as it is said (guide v4.0, rule 11): the tally page filling up,
her word and his as two bubbles, the notebook landing on the counter, the seasons passing in
the window, the number of dishes, his page of jobs, the kitchen lit in two halves, the couples,
the list of jobs, the plate whose two shares spill over its rim, the crowd of you.

Faces hold (L-0040), each change after its cause:
  the Saint    determined writing; angry in the fight; determined making her rule; suspicious
               at his secret; smug with her proof; surprised, then jaw-drop at his notebook;
               soft (sad, light) as she reads; happy at the end.
  the Copycat  smug in the fight; lying when caught; guilty at her proof; sad as he shows his
               notebook; surprised at hers; happy at the end.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-20-dishes/'
T, S, P, Y = 'trainer', 'saint', 'copycat', 'you'
draft = json.load(io.open(RUN + 'storyboard.draft.json', encoding='utf8'))
LINE = {l['id']: l for sc in draft['scenes'] for l in sc['lines']}

SINK_X, WINDOW_X, CLOCK_X, TABLE_X, CHAIR_X, CABINET_X = 0.24, 0.55, 0.42, 0.72, 0.84, 0.95
SAINT_SINK, SAINT_TABLE, COPY_STAND = 0.3, 0.6, 0.86
TICK = ('tick', 'start', -12)


def kitchen(window='window-night', sink='kitchen-sink', table=True, chair=True, cabinet='drawer-cabinet',
            clock='wall-clock', on_table=(), on_counter=()):
    out = [{'prop': sink, 'x': SINK_X}, {'prop': window, 'x': WINDOW_X, 'y': 2.9}]
    if clock:
        out.append({'prop': clock, 'x': CLOCK_X, 'y': 3.55, 'size': 0.5})
    if cabinet:
        out.append({'prop': cabinet, 'x': CABINET_X})
    if chair:
        out.append({'prop': 'chair', 'x': CHAIR_X})
    if table:
        out.append({'prop': 'table', 'x': TABLE_X})
        for prop, x in on_table:
            out.append({'prop': prop, 'x': x, 'y': 1.22})
    for prop, x in on_counter:
        out.append({'prop': prop, 'x': x, 'y': 1.75})
    return out


def person(pid, face, x, facing, look, pose='stand', then=None, strength=None, holds=None, action=None):
    a = {'character': pid, 'expression': face, 'facing': facing, 'x': x, 'lookAt': look}
    a['action' if action else 'pose'] = action or pose
    if strength is not None:
        a['strength'] = strength
    if holds:
        a['holds'] = holds
    if then:
        a['then'] = then
    return a


def step(at, **change):
    if 'look' in change:
        change['lookAt'] = change.pop('look')
    return {'at': at, **change}


def saint(face, x=SAINT_SINK, look='ahead', facing='right', **more):
    return person(S, face, x, facing, look, **more)


def copycat(face, x=COPY_STAND, look=S, facing='left', **more):
    return person(P, face, x, facing, look, **more)


def seated(face, look=S, **more):
    """The Copycat on his chair at the table."""
    return person(P, face, CHAIR_X, 'left', look, pose=more.pop('pose', 'sit'), **more)


SHOTS = {}


def shot(sid, line, words, framing, actors, props=None, focus=None, overlay=None, move='none', strength=0.2,
         sfx=(), effects=(), transition='cut', picture=None, rewind=None):
    cam = {'framing': framing, 'move': move, 'strength': strength}
    if focus:
        cam['focus'] = focus
    s = {'id': sid, 'line': line, 'words': words or LINE[line]['text'], 'camera': cam,
         'actors': list(actors), 'props': props if props is not None else kitchen(), 'effects': list(effects),
         'sfx': [{'name': n, 'at': at, 'gainDb': g} for n, at, g in sfx], 'transition': transition}
    here = {a['character'] for a in s['actors']} | {p['prop'] for p in s['props']}
    for a in s['actors']:
        if a['lookAt'] not in here and a['lookAt'] not in ('camera', 'up', 'down', 'ahead'):
            a['lookAt'] = 'ahead'
        for st in a.get('then', []):
            if st.get('lookAt') not in (None, 'camera', 'up', 'down', 'ahead') and st['lookAt'] not in here:
                st['lookAt'] = 'ahead'
    if overlay:
        s['overlay'] = overlay
    if picture:
        s['picture'] = picture
    if rewind:
        s['rewind'] = {'label': rewind}
    SHOTS[sid] = s


def number(text, caption):
    return {'kind': 'number', 'text': text, 'caption': caption}


def page(lines, stress=None, tally=None, cover=None):
    out = {'kind': 'page', 'lines': lines}
    if stress is not None:
        out['stress'] = stress
    if tally:
        out['tally'] = tally
    if cover:
        out['cover'] = cover
    return out


def bubble(of, lines, shape='speech', stress=None):
    out = {'kind': 'bubble', 'of': of, 'shape': shape, 'lines': lines}
    if stress is not None:
        out['stress'] = stress
    return out


# ------------------------------------------------------------------ part 1
# The strange moment: midnight, she writes down the plate she has just washed.
NIGHT = kitchen('window-night')
# She stands at the far end of the sink, so the big words sit over the kitchen and not her face.
shot('s1a', 'l01', 'She wrote down every dish she washed,', 'wide',
     [saint('determined', x=0.15, look='down', holds='notebook-blue-open')], NIGHT, move='push-in', strength=0.12,
     overlay={'kind': 'words', 'lines': ['She wrote down', 'every dish she washed', 'for a whole year'], 'stress': 1},
     sfx=[TICK])
shot('s1b', 'l01', 'for a whole year.', 'wide', [],
     NIGHT, overlay=page(['DISHES I WASHED'], tally=4212, cover='blue'), sfx=[('paper', 'start', -2)])
shot('s1c', 'l02', None, 'medium',
     [saint('determined', look='down', holds='notebook-blue-open',
            then=[step(0.45, holds='notebook-blue', look='camera', expression='smug', strength=0.6)])],
     NIGHT, focus=S, move='push-in', strength=0.15, sfx=[TICK])

# The rewind: a year earlier, winter, the same fight at the full sink.
DAY = kitchen('window-winter', table=False, chair=False, clock='wall-clock')
shot('s2a', 'l03', None, 'wide',
     [saint('angry', strength=0.5, look=P), copycat('smug', x=0.52, look=S, strength=0.6)], DAY,
     transition='rewind', rewind='ONE YEAR EARLIER')
shot('s2b', 'l04', None, 'medium', [saint('angry', look=P, pose='point')], DAY, focus=S)
shot('s2c', 'l05', None, 'medium', [copycat('smug', x=0.52, look=S, pose='shrug')], DAY, focus=P)
shot('s2d', 'l06', None, 'close-up', [saint('determined', look=P, pose='cross-arms')], DAY, focus=S)
shot('s2e', 'l07', None, 'medium',
     [copycat('smug', x=0.52, look=S, pose='shrug', facing='right',
              then=[step(0.7, action='walk', look='ahead')])], DAY, focus=P,
     sfx=[('footsteps', 'end', -8)])
# Her word against his: two bubbles, one after the other, neither giving way.
shot('s2f', 'l08', 'It was always her word', 'wide',
     [saint('angry', strength=0.6, look=P, pose='cross-arms'), copycat('smug', x=0.52, look=S, pose='cross-arms')],
     DAY, overlay=bubble(S, ['I DO EVERYTHING']))
shot('s2g', 'l08', 'against *his.*', 'wide',
     [saint('angry', strength=0.6, look=P, pose='cross-arms'), copycat('smug', x=0.52, look=S, pose='cross-arms')],
     DAY, overlay=bubble(P, ['I DO PLENTY']))
# Her rule: the notebook lands on the counter.
shot('s2h', 'l09', 'So she made her own rule.', 'medium',
     [saint('angry', strength=0.5, look='down', then=[step(0.4, expression='determined', strength=1)])], DAY,
     focus=S)
shot('s2i', 'l09', 'Whoever has it in writing *wins.*', 'medium',
     [saint('determined', look='down')], kitchen('window-winter', table=False, chair=False,
                                                 on_counter=[('notebook-blue-landing', 0.44)]), focus=S,
     sfx=[('thud', 'start', -6)])
shot('s2j', 'l10', None, 'wide',
     [saint('determined', x=SAINT_TABLE, look='down', holds='notebook-blue', facing='right')],
     kitchen('window-winter'))

# ------------------------------------------------------------------ part 2
# A year of writing: the seasons pass in the window while she writes at the sink.
shot('s3a', 'l11', 'He can argue with me.', 'medium',
     [saint('determined', look='down', holds='notebook-blue-open')],
     kitchen('window-seasons', clock='wall-clock-spinning'), focus=S, transition='fade')
shot('s3a2', 'l11', "He can't argue with a year of *proof.*", 'wide',
     [saint('determined', look='down', holds='notebook-blue-open', then=[step(0.5, expression='smug', strength=0.5)])],
     kitchen('window-autumn', clock='wall-clock-spinning'))
shot('s3b', 'l12', None, 'wide', [],
     kitchen('window-autumn', 'kitchen-sink-done'), overlay=page(['DISHES I WASHED'], tally=4212, cover='blue'),
     sfx=[('paper', 'start', -2)])
# One night: he is at the table, writing in something small; she comes down for water.
NIGHT2 = kitchen('window-night', 'kitchen-sink-done')
shot('s3c', 'l13', None, 'wide',
     [saint('surprised', x=0.42, look=P, holds='cup', facing='right', strength=0.6),
      seated('surprised', look=S, holds='notebook-orange',
             then=[step(0.3, expression='lying', look=S)])],
     NIGHT2, transition='fade')
shot('s3d', 'l14', None, 'close-up', [saint('suspicious', x=0.42, look=P, holds='cup', facing='right')], NIGHT2,
     focus=S)
# The anniversary: dinner on the table, she drops the notebook between the plates.
DINNER = kitchen('window-night', 'kitchen-sink-done',
                 on_table=[('plate-salad', 0.66), ('notebook-blue-landing', 0.72), ('plate-salad', 0.78)])
DINNER_AFTER = kitchen('window-night', 'kitchen-sink-done',
                       on_table=[('plate-salad', 0.66), ('notebook-blue', 0.72), ('plate-salad', 0.78)])
shot('s3e', 'l15', 'Four thousand two hundred and twelve dishes.', 'wide',
     [saint('smug', x=SAINT_TABLE, look=P), seated('guilty', look='down')], DINNER, transition='fade',
     sfx=[('thud', 'start', -4)])
shot('s3f', 'l15', 'Every one of them was *me.*', 'medium',
     [saint('smug', x=SAINT_TABLE, look=P, pose='cross-arms')], DINNER_AFTER, focus=S,
     overlay=number('4,212', 'dishes, all hers'), sfx=[('ding', 'start', -6)])
# The choice: the picture holds in silence, the clock ticking.
shot('s4a', 'l16', 'A year of proof, in her own handwriting.', 'wide',
     [saint('smug', x=SAINT_TABLE, look=P, pose='cross-arms'), seated('guilty', look='down')], DINNER_AFTER,
     move='push-in', strength=0.12, sfx=[TICK])
shot('s4b', 'l16', 'So who really did more?', 'medium',
     [saint('smug', x=SAINT_TABLE, look=P, pose='cross-arms'), seated('guilty', look='down')], DINNER_AFTER,
     move='push-in', strength=0.15, sfx=[TICK])

# ------------------------------------------------------------------ part 3
# He stands, opens the drawer, and puts his orange notebook beside hers.
OPENING = kitchen('window-night', 'kitchen-sink-done', cabinet='drawer-cabinet-opening',
                  on_table=[('plate-salad', 0.66), ('notebook-blue', 0.72), ('plate-salad', 0.78)])
BOTH = kitchen('window-night', 'kitchen-sink-done', cabinet='drawer-cabinet-empty',
               on_table=[('plate-salad', 0.64), ('notebook-blue', 0.69), ('notebook-orange', 0.76)])
shot('s5a', 'l17', 'I saw you writing,', 'wide',
     [saint('smug', x=SAINT_TABLE, look=P, pose='cross-arms', then=[step(0.5, expression='surprised')]),
      copycat('sad', x=0.9, look=S, strength=0.6)], OPENING, sfx=[('creak', 'middle', -6)])
shot('s5b', 'l17', 'so I started one too. The same *week.*', 'wide',
     [saint('surprised', x=SAINT_TABLE, look='down',
            then=[step(0.55, expression='jaw-drop', look=P)]),
      copycat('sad', x=COPY_STAND, look=S, strength=0.6)], BOTH,
     effects=[{'effect': 'shock-lines', 'on': S}], sfx=[('paper', 'start', -4)])
# His page: the jobs she never saw.
shot('s5c', 'l18', None, 'wide', [], BOTH,
     overlay=page(['HIS NOTEBOOK', 'FIXED THE BOILER, 2 A.M.', 'WALKED THE DOG IN THE RAIN'], stress=1,
                  cover='orange'), sfx=[('paper', 'start', -2)])
shot('s5d', 'l19', None, 'medium',
     [saint('surprised', x=SAINT_TABLE, look=P, holds='notebook-orange-open',
            then=[step(0.6, expression='sad', strength=0.5)])], BOTH, focus=S)
shot('s5e', 'l20', None, 'medium',
     [copycat('surprised', x=COPY_STAND, look=S, holds='notebook-blue-open',
              then=[step(0.6, expression='sad', strength=0.5)])], BOTH, focus=P)
# Each one only saw their own half: the kitchen lit in two.
SPLIT = kitchen('window-night', 'kitchen-sink-done', cabinet='drawer-cabinet-empty',
                on_table=[('notebook-blue', 0.69), ('notebook-orange', 0.76)])
shot('s5f', 'l21', None, 'wide',
     [saint('sad', x=0.5, look='down', strength=0.5, holds='notebook-blue-open'),
      copycat('sad', x=0.8, look='down', strength=0.5, holds='notebook-orange-open')],
     SPLIT + [{'prop': 'gloom-split', 'x': 0.65}])

# The study: 1979, thirty seven couples, each answering alone.
# Five couples standing in a row, each a man and a woman side by side, for the thirty seven.
MAN = {'outfit': {'clothes': {'top': {'kind': 'shirt', 'cloth': 'steel'}, 'bottom': {'kind': 'trousers', 'cloth': 'denim'},
                              'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}
WOMAN = {'outfit': {'clothes': {'top': {'kind': 'shirt', 'cloth': 'crimson'}, 'bottom': {'kind': 'skirt', 'cloth': 'forest'},
                                'shoes': {'kind': 'boots', 'cloth': 'brown'}}}}
COUPLE_ROW = [{'kind': 'room', 'place': 'living-room', 'palette': 'warm-interior'}]
for i, c in enumerate([0.14, 0.32, 0.5, 0.68, 0.86]):
    COUPLE_ROW.append({'kind': 'extra', 'x': c - 0.035, 'y': 0.6, 'ground': 0.8, 'head': 0.065, 'facing': 'right',
                       'expression': 'thinking', 'look': MAN})
    COUPLE_ROW.append({'kind': 'extra', 'x': c + 0.035, 'y': 0.6, 'ground': 0.8, 'head': 0.062, 'facing': 'left',
                       'expression': 'thinking', 'look': WOMAN})
COUPLES = COUPLE_ROW
COUPLES_TAGGED = COUPLE_ROW + [
    {'kind': 'tag', 'text': '37 MARRIED COUPLES', 'x': 0.5, 'y': 0.2, 'size': 0.05, 'paint': 'cream'},
]
shot('s5g', 'l22', 'This is not just a story.', 'wide',
     [saint('sad', x=0.5, look='down', strength=0.5, holds='notebook-blue-open'),
      copycat('sad', x=0.8, look='down', strength=0.5, holds='notebook-orange-open')],
     SPLIT + [{'prop': 'gloom-split', 'x': 0.65}], move='pull-back', strength=0.2)
shot('s5h', 'l22', 'In 1979, two Canadian psychologists', 'wide', [], SPLIT,
     picture={'layers': COUPLES, 'from': {'x': 0.5, 'y': 0.52, 'zoom': 2.6}, 'to': {'x': 0.5, 'y': 0.52, 'zoom': 1.8}},
     overlay=number('1979', 'two psychologists in Canada'), transition='fade')
shot('s5h2', 'l22', 'asked thirty seven married couples who did each job at home.', 'wide', [], SPLIT,
     picture={'layers': COUPLES_TAGGED, 'from': {'x': 0.5, 'y': 0.52, 'zoom': 1.8}, 'to': {'x': 0.5, 'y': 0.5, 'zoom': 1}})
shot('s5i', 'l23', None, 'wide', [], SPLIT,
     overlay=page(['WHO DOES IT?', 'MAKING BREAKFAST', 'STARTING THE ARGUMENTS'], stress=2),
     sfx=[('paper', 'start', -2)])
shot('s5j', 'l24', 'Each spouse answered alone.', 'wide',
     [saint('thinking', x=0.5, look='down', holds='notebook-blue-open'),
      copycat('thinking', x=0.8, look='down', holds='notebook-orange-open')],
     SPLIT + [{'prop': 'gloom-split', 'x': 0.65}])
shot('s5k', 'l24', 'Added together, their two shares usually came to more than the whole *job.*', 'wide',
     [saint('surprised', x=0.5, look='up'), copycat('surprised', x=0.8, look='up')],
     SPLIT + [{'prop': 'gloom', 'x': 0.65}, {'prop': 'plate-shares', 'x': 0.64, 'y': 1.75, 'size': 1.15}],
     sfx=[('pop', 'start', -4), ('ding', 'middle', -6)])
# In early tests the couples fought over their numbers; so the questions changed.
shot('s5l', 'l25', 'In early tests, couples compared their answers at home and *fought.*', 'wide',
     [saint('angry', x=0.5, look=P, pose='point'), copycat('fuming', x=0.8, look=S, pose='point')], SPLIT,
     effects=[{'effect': 'anger-mark', 'on': S}, {'effect': 'anger-mark', 'on': P}])
shot('s5m', 'l25', 'So the researchers changed the questions.', 'wide', [], SPLIT,
     overlay=page(['THE QUESTIONS', 'NO MORE NUMBERS', 'JUST A MARK ON A LINE'], stress=1),
     sfx=[('paper', 'start', -2)])

# The meaning: you, in the crowd; then the two notebooks together, and the two of them.
CROWD = [
    {'kind': 'room', 'place': 'city', 'palette': 'cold-dawn'},
    {'kind': 'crowd', 'rows': 7, 'cols': 11, 'top': 0.28, 'bottom': 0.68, 'head': 0.05, 'back': 0.45,
     'pose': 'stand', 'expression': 'smug', 'light': 0.65, 'hole': {'x': 0.5, 'y': 0.55},
     'holeRadius': 0.06, 'seed': 6},
    {'kind': 'person', 'character': Y, 'x': 0.5, 'y': 0.55, 'head': 0.05, 'pose': 'stand',
     'expression': 'smug', 'facing': 'right', 'turn': 0.3, 'effects': []},
]
shot('s6a', 'l26', 'You do this too, at work and with roommates.', 'wide', [], SPLIT,
     picture={'layers': CROWD, 'from': {'x': 0.5, 'y': 0.56, 'zoom': 5}, 'to': {'x': 0.5, 'y': 0.54, 'zoom': 2.5}},
     transition='fade')
shot('s6b', 'l26', 'You remember what you did, because you were *there.*', 'wide', [], SPLIT,
     picture={'layers': CROWD, 'from': {'x': 0.5, 'y': 0.54, 'zoom': 2.5}, 'to': {'x': 0.5, 'y': 0.48, 'zoom': 1}})
TOGETHER = kitchen('window-night', 'kitchen-sink-done', cabinet='drawer-cabinet-empty',
                   on_table=[('notebook-blue', 0.69), ('notebook-orange', 0.75)])
shot('s6c', 'l27', 'Both notebooks were honest.', 'medium',
     [saint('sad', x=SAINT_TABLE, look=P, strength=0.4, then=[step(0.5, expression='happy', strength=0.6)]),
      copycat('sad', x=COPY_STAND, look=S, strength=0.4, then=[step(0.55, expression='happy', strength=0.6)])],
     TOGETHER, transition='fade')
shot('s6d', 'l27', 'It just took two of them', 'medium',
     [saint('happy', x=SAINT_TABLE, look=P, strength=0.7), copycat('happy', x=COPY_STAND, look=S, strength=0.7)],
     TOGETHER)
shot('s6e', 'l27', 'to see the whole *house.*', 'wide',
     [saint('happy', x=SAINT_TABLE, look=P, strength=0.7), copycat('happy', x=COPY_STAND, look=S, strength=0.7)],
     TOGETHER, move='pull-back', strength=0.25, sfx=[TICK])

# ------------------------------------------------------------------ the storyboard
HOME_NIGHT = {'place': 'kitchen', 'treatment': 'atmospheric', 'palette': 'dusk-violet', 'ambience': 'home'}
HOME_DAY = {'place': 'kitchen', 'treatment': 'simple', 'palette': 'warm-interior', 'ambience': 'home'}
PLAN = [
    ('s1', 'unease', HOME_NIGHT, ['s1a', 's1b', 's1c']),
    ('s2', 'tense', HOME_DAY, ['s2a', 's2b', 's2c', 's2d', 's2e', 's2f', 's2g', 's2h', 's2i', 's2j']),
    ('s3', 'closing-in', HOME_NIGHT, ['s3a', 's3a2', 's3b', 's3c', 's3d', 's3e', 's3f']),
    ('s4', 'tense', HOME_NIGHT, ['s4a', 's4b']),
    ('s5', 'reflective', HOME_NIGHT, ['s5a', 's5b', 's5c', 's5d', 's5e', 's5f', 's5g', 's5h', 's5h2', 's5i', 's5j', 's5k',
                                      's5l', 's5m']),
    ('s6', 'hope', HOME_NIGHT, ['s6a', 's6b', 's6c', 's6d', 's6e']),
]
by_id = {sc['id']: sc for sc in draft['scenes']}
scenes = []
used = []
for sid, mood, where, shot_ids in PLAN:
    mine = [SHOTS[s] for s in shot_ids]
    used += shot_ids
    line_ids = []
    for s in mine:
        if s['line'] not in line_ids:
            line_ids.append(s['line'])
    lines = [LINE[i] for i in line_ids]
    for line in lines:
        said = ' '.join(s['words'] for s in mine if s['line'] == line['id'])
        if said != line['text']:
            raise SystemExit(f"{line['id']}: the shots say \"{said}\" and the script says \"{line['text']}\"")
    base = by_id[sid]
    scenes.append({**{k: v for k, v in base.items() if k not in ('shots', 'lines')}, 'lines': lines,
                   'mood': mood, **where, 'quiet': False, 'shots': mine})
missing = [s for s in SHOTS if s not in used]
if missing:
    raise SystemExit(f'shots in no scene: {missing}')

sb = {k: v for k, v in draft.items() if k != 'scenes'}
sb['cast'] = [
    {'id': T, 'name': 'The Trainer', 'card': 'trainer', 'host': True},
    {'id': S, 'name': 'The Saint', 'card': 'saint'},
    {'id': P, 'name': 'The Copycat', 'card': 'copycat'},
    {'id': Y, 'name': 'You', 'card': 'you'},
]
sb['series'] = 'game-theory'
sb['cover'] = {'shot': 's5b', 'at': 0.8}
sb['scenes'] = scenes
with io.open(RUN + 'storyboard.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(scenes), 'scenes,', len(SHOTS), 'shots')
