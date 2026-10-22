"""The spoken words of "Split or Steal" as script.json: Biku's words exactly, a breath to a line.

Run it again after any change to how the lines are cut. The parts are set here, where the story
turns (the game, the real show, Nick and the ending): the even split cut Nick's story in two. Nothing here changes a word (as-is mode): only where a line ends, which words the
captions stress (his "Caption emphasis" notes) and how long the silence after a line is.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-10-split-or-steal/'
SPEED = 0.92  # the narrator a little slower than usual, so 280 words fill about two minutes

N, S = 'narrator', 'stranger'
#  (speaker, text, beat, pause after in ms or None for the format's usual)
LINES = [
    (N, 'Two strangers. One table. A pile of cash.', 'hook', None),
    (N, 'Each holds two golden balls: *split, or steal.*', 'hook', None),
    (N, 'They choose at the same moment, in secret.', 'hook', None),
    (N, 'Take a seat.', 'hook', 650),
    (N, '*You are one of them.*', 'hook', 800),
    (N, 'If you both split, you share.', 'why-it-matters', None),
    (N, 'If one splits and one steals, *the thief takes it all.*', 'why-it-matters', None),
    (N, 'If you both steal, nobody gets a penny.', 'why-it-matters', 600),
    (S, "I'm splitting. *I promise.*", 'why-it-matters', 600),
    # His script: CHOOSE NOW holds on screen for two silent seconds.
    (N, '*Now choose.*', 'why-it-matters', 2400),
    (N, 'Here is the cold logic.', 'first-part', None),
    (N, 'If the stranger splits, stealing gets you double.', 'first-part', None),
    (N, 'If the stranger steals, you get nothing either way.', 'first-part', None),
    (N, 'So stealing is *never worse.*', 'first-part', 600),
    (N, 'The stranger thinks the same.', 'first-part', None),
    (N, 'Two steals.', 'first-part', 500),
    (N, '*Nobody wins.*', 'first-part', 1200),
    (N, 'This game was real: a British TV show called Golden Balls.', 'second-part', None),
    (N, 'Economists studied two hundred and eighty-seven of its finals.', 'second-part', None),
    (N, '*About half* the players split anyway.', 'second-part', None),
    (N, 'With only a few hundred pounds on the table, nearly three in four shared.', 'second-part', None),
    (N, 'And promises did something strange.', 'second-part', None),
    (N, 'Making one made a player far more likely to split.', 'second-part', None),
    (N, '*Hearing one changed nothing.*', 'second-part', 700),
    (N, 'The biggest prize ever, over a hundred thousand pounds?', 'second-part', 700),
    (N, '*Sarah stole it.*', 'second-part', 1200),
    (N, 'Then a player named Nick did the opposite.', 'surprise', 300),
    (N, 'He told Ibrahim he was *going to steal,* no matter what, and promised to share the money after the show.',
     'surprise', 300),
    (N, 'The host reminded Ibrahim that nothing forced Nick to pay.', 'surprise', 300),
    (N, 'Think about it.', 'surprise', 350),
    (N, 'If Nick steals, stealing wins Ibrahim nothing.', 'surprise', 300),
    (N, 'His only chance is to *split and hope.*', 'surprise', 300),
    (N, 'So he splits.', 'surprise', 400),
    (N, 'The balls open.', 'surprise', 800),
    (N, '*Nick split too.*', 'surprise', 900),
    (N, 'Nick did not play the game better.', 'takeaway', 250),
    (N, '*He changed it.*', 'takeaway', 500),
    # One sentence of his, cut at its commas into four lines, so each of the three everyday
    # pictures has its own moment: a list read with a short breath after each thing.
    (N, 'You play this game all the time:', 'takeaway', 250),
    (N, 'price wars,', 'takeaway', 380),
    (N, 'group projects,', 'takeaway', 380),
    (N, 'a shared kitchen.', 'takeaway', 500),
    (N, 'When you are stuck between trust and betrayal, do not ask which ball to pick.', 'takeaway', 300),
    (N, 'Ask how to *change the table.*', 'takeaway', 1100),
]

STUDY = ('Van den Assem, Van Dolder and Thaler, Split or Steal? Cooperative Behavior When the Stakes Are Large, '
         'Management Science, 2012, https://repub.eur.nl/pub/31292/SplitorSteal_2012.pdf')
SOURCES = [
    'Wikipedia, Golden Balls, https://en.wikipedia.org/wiki/Golden_Balls : the show ran on ITV from 2007 to 2009; '
    'the rules of the final (both split and share, one steals and takes it all, both steal and nobody wins).',
    STUDY + ' : 287 episodes and 574 final contestants; 52.8% of contestants chose split (about half); about 73% '
    'split with stakes up to 500 pounds (nearly three in four); a player\'s own promise made them about 31 '
    'percentage points more likely to split, and an opponent\'s promise did not make a player more likely to '
    'split; the biggest jackpot, 100,150 pounds, was won by Sarah, who stole it from Stephen, in March 2008.',
    'Cornell University course blog, 2012, '
    'https://blogs.cornell.edu/info2040/2012/09/21/split-or-steal-an-analysis-using-game-theory : Nick announced '
    'he would steal and promised to share after the show, the host noted he had no obligation to pay, Ibrahim '
    'split, and Nick also split. Fairly sure: well documented, but no original transcript was opened.',
    'Xataka, 2016, https://www.xataka.com/magnet/cuando-quedarte-con-6-800-libras-es-mejor-que-ganar-13-600-la-'
    'brutal-logica-del-dilema-del-prisionero/amp : the Nick and Ibrahim episode, as above.',
]

PART = {'hook': 1, 'why-it-matters': 1, 'first-part': 1, 'second-part': 2, 'surprise': 3, 'takeaway': 3}
lines, n, s = [], 0, 0
for speaker, text, beat, pause in LINES:
    if speaker == N:
        n += 1
        line = {'id': f'n{n}', 'speaker': N, 'text': text, 'beat': beat, 'chapter': PART[beat], 'speed': SPEED}
    else:
        s += 1
        line = {'id': f's{s}', 'speaker': speaker, 'text': text, 'beat': beat, 'chapter': PART[beat], 'speed': 1.05}
    if pause is not None:
        line['pauseAfterMs'] = pause
    lines.append(line)

script = {
    'version': 1,
    'title': 'Split or Steal',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is',
    'format': 'explainer',
    'brand': 'my-page',
    'voice': 'narrator',
    'speakers': [{'id': S, 'name': 'The Stranger', 'voice': 'man'}],
    'lines': lines,
    'sources': SOURCES,
    'changes': [],
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(lines), 'lines,', sum(len(l['text'].replace('*', '').split()) for l in lines), 'words')
