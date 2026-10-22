"""The spoken words of "Why Is the Water in Your Glass Older Than the Sun?", as script.json.

Biku's script (What's the Catch? 03), used as it is: "make a video for this now. the animation was
good for the gps video. use those kinds of animations" (2026-10-18). Written from guide v3.0.
What is decided here is only the beat of each line, the part, and the pause after it.

The parts:
  1  the question, the moment, and into one drop: the heavy fingerprint
  2  the oceans, the comets and the Sun; the model that could not make it; the cloud before the Sun
  3  the cloud falls in, the ice rides to Earth; the proof; every glass

Facts checked on 2026-10-18: Cleeves and colleagues, "The ancient heritage of water ice in the
solar system", Science, 26 September 2014: the young solar system could not have made the heavy
water of the oceans and comets, so a share of it (30 to 50 percent at the high end) is ice
inherited from the cloud before the Sun, roughly a million years older than the solar system.
Ocean water holds about 156 heavy hydrogen atoms in a million, about one molecule in 3,200.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-18-water-older-than-sun/'
N = 'narrator'
Q, MOMENT, CLUE, CATCH, PROOF, NOTICE = ('the-question', 'the-moment', 'follow-the-money', 'the-trick',
                                         'the-proof', 'your-move')

#  (text, beat, part, pause after in ms)
LINES = [
    ('How can the water in your glass be older than the Sun?', Q, 1, 700),
    ('The answer is hiding inside one drop, and it begins somewhere very *cold*.', Q, 1, 900),
    ('Most of us think the water in a glass is as fresh as the *tap*.', MOMENT, 1, 500),
    ('That water goes round and round, from the sea to the clouds to the rain.', MOMENT, 1, 500),
    ('But nobody asks where that water was before the *sea*.', MOMENT, 1, 900),
    ("So let's push into one drop, down to one water molecule, the tiniest bit of water.", CLUE, 1, 500),
    ('Each water molecule is one oxygen atom holding on to two *hydrogen* atoms.', CLUE, 1, 500),
    ('But in about one water molecule in every three thousand, a hydrogen atom carries extra *weight*.',
     CLUE, 1, 600),
    ('Scientists call that heavy water, and it is a *fingerprint* of where water was born.', CLUE, 1, 1200),

    ('Our oceans carry that heavy fingerprint, and so do the icy *comets*.', CLUE, 2, 500),
    ('But the Sun has much less, because heat wipes the fingerprint *away*.', CLUE, 2, 900),
    ('So scientists rebuilt the newborn Sun and its planets inside a *computer*.', CATCH, 2, 500),
    ('But the newborn Sun and planets made nowhere near *enough* heavy water.', CATCH, 2, 700),
    ('Heavy water needs deep cold, close to the coldest cold there *is*.', CATCH, 2, 600),
    ('And the only place that cold was the dark cloud that came *before* the Sun.', CATCH, 2, 900),
    ('There, on a speck of dust, our water molecule froze into *ice*.', CATCH, 2, 1200),

    ('Then the cloud collapsed into the Sun and planets, and that ice *survived*.', CATCH, 3, 500),
    ('That ice rode to Earth on comets and rocks, and melted into the *sea*.', CATCH, 3, 900),
    ('Astronomers at the University of Michigan published this in the journal *Science* in twenty fourteen.',
     PROOF, 3, 500),
    ('Their model says as much as thirty to fifty percent of ocean water is older than the *Sun*.',
     PROOF, 3, 500),
    ('That ice formed roughly a *million* years before the Sun and its planets.', PROOF, 3, 900),
    ('So every shower, raindrop and glass is partly ice from before the *Sun*.', NOTICE, 3, 600),
    ('Your water is older than the Sun because it froze before the Sun was *born*.', NOTICE, 3, 1500),
]

SOURCES = [
    'L. Ilsedore Cleeves, Edwin A. Bergin, Conel M. O\'D. Alexander and colleagues, "The ancient heritage of water '
    'ice in the solar system", Science, vol. 345, 26 September 2014, pages 1590 to 1593. A model of the young solar '
    'system could not make the heavy water found in the oceans and in comets, so part of that water must be ice '
    'inherited from the cold cloud before the Sun; 30 to 50 percent of ocean water at the high end of the estimate.',
    'University of Michigan news release, "The water in your bottle might be older than the sun", 25 September 2014: '
    'that water would be roughly a million years older than the solar system. Reported by ScienceDaily, '
    'https://www.sciencedaily.com/releases/2014/09/140925141226.htm',
    'IAEA standard for ocean water (VSMOW): about 156 heavy hydrogen atoms in a million, so about one water '
    'molecule in 3,200 carries one. Biku\'s script rounds it to one in three thousand, said with "about".',
    'Checked by Claude on 2026-10-18. Strictly, a molecule with one heavy hydrogen is "semi-heavy water"; the study\'s '
    'own news release says heavy water, as the script does.',
]

lines = [{'id': f'l{i:02d}', 'speaker': N, 'text': text, 'beat': beat, 'chapter': part, 'pauseAfterMs': pause}
         for i, (text, beat, part, pause) in enumerate(LINES, start=1)]
script = {
    'version': 1,
    'title': 'Why Is the Water in Your Glass Older Than the Sun?',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is', 'format': 'fine-print', 'brand': 'fine-print', 'voice': 'narrator',
    'speakers': [],
    'lines': lines, 'sources': SOURCES, 'changes': [],
    'masterPrompt': 'prompts/fine-print.md',
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(lines), 'lines,', sum(len(l['text'].replace('*', '').split()) for l in lines), 'words')
