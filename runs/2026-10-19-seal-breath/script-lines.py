"""The spoken words of "Could Humans Evolve to Hold Their Breath Like Seals?", as script.json.

Biku's script (What's the Catch?, its first big "what if"), used as it is: "Make a video on this
script for the whats if part" (2026-10-19). What is decided here is only the beat, the part and the
pause after a line. The voice says the hard names well enough as written (checked: PDE10A as
"P D E ten A", 2018 as "twenty eighteen", Bajau close to "BAJ-ow").

The parts:
  1  the question, the moment and the clue: the bath, the chest, the dive reflex, the spleen, the seal
  2  the catch: the Bajau, the diver, the scan, fifty percent bigger, in their genes, a thousand years
  3  the proof and what you'll notice: Cell 2018, the gene, nobody knows yet, the record, back in the bath

Facts checked on 2026-10-19 against reports of Ilardo et al., Cell, 2018 (Science News, NPR, AFP,
The Scientist, Scientific American): Bajau spleens about 50% larger than the Saluan's, also in Bajau
who do not dive; a variant at PDE10A thought to act through thyroid hormone, not yet proved; up to
60% of a working day diving; a way of life of more than 1,000 years. Guinness: 29 min 3 s, Vitomir
Maričić, 14 June 2025, on pure oxygen. Not found in any source: "roughly the size of a tennis ball"
(no report gives the spleens' size, only the difference); Biku is told.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-19-seal-breath/'
N = 'narrator'
Q, MOMENT, CLUE, CATCH, PROOF, NOTICE = ('the-question', 'the-moment', 'follow-the-money', 'the-trick',
                                         'the-proof', 'your-move')

#  (text, beat, part, pause after in ms, how it is said or None)
LINES = [
    ('Could your body ever evolve to hold its breath like a *seal*?', Q, 1, 700, None),
    ('The surprise is that, somewhere on Earth, it has *already* happened.', Q, 1, 900, None),
    ('Most of us come up for air within about a minute, and think that is our *limit*.', MOMENT, 1, 500, None),
    ('But your body hides an old diving trick, and it starts in your *chest*.', MOMENT, 1, 800, None),
    ('While you hold your breath, the oxygen in your blood slowly *runs down*.', CLUE, 1, 500, None),
    ('So your body switches on its dive reflex: your heart slows, and blood leaves your hands and *feet*.',
     CLUE, 1, 500, None),
    ('Then your spleen, a small organ under your ribs, squeezes like a *sponge*.', CLUE, 1, 500, None),
    ('It pushes spare red blood cells, which carry oxygen, into your blood like a *backup tank*.', CLUE, 1, 500,
     None),
    ('Seals have enormous spleens for exactly this *reason*.', CLUE, 1, 1100, None),

    ('And here is the catch: the Bajau, sea nomads of Southeast Asia, have already grown a *bigger* tank.',
     CATCH, 2, 500, None),
    ('Their divers spend up to sixty percent of a working day diving for *fish*.', CATCH, 2, 500, None),
    ('Scientists scanned the spleens of the Bajau and of their farming neighbours, the *Saluan*.', CATCH, 2, 500, None),
    ('The Bajau spleen was about fifty percent *bigger*, roughly the size of a tennis ball.', CATCH, 2, 500, None),
    ('It was big even in Bajau who do not dive, so it is in their *genes*.', CATCH, 2, 500, None),
    ('Scientists think it took only around a thousand years at sea, a *blink* for evolution.', CATCH, 2, 1100,
     None),

    ("Melissa Ilardo's team published this in the journal *Cell* in 2018.", PROOF, 3, 500, None),
    ('They also found a gene, PDE10A, that may make the spleen *bigger*.', PROOF, 3, 500, None),
    ('Scientists think it works through a body hormone, but nobody has *proved* that yet.', PROOF, 3, 500, None),
    ('The breath hold world record is twenty nine minutes, but only after breathing pure *oxygen*.', PROOF, 3,
     900, None),
    ('Next time you slip under the water, your heart is already *slowing* down.', NOTICE, 3, 500, None),
    ('Your body is still running a diving program far *older* than you.', NOTICE, 3, 600, None),
    ('So could humans evolve to hold their breath like seals? Slowly, yes, and one people is already *on the way*.',
     NOTICE, 3, 1500, None),
]

SOURCES = [
    'Ilardo, M. et al., "Physiological and genetic adaptations to diving in sea nomads", Cell, 2018. Bajau spleens '
    'about 50% larger than the neighbouring Saluan, also in Bajau who do not dive; a gene variant near PDE10A '
    'linked to spleen size. https://doi.org/10.1016/j.cell.2018.03.054',
    'NPR (via KPBS), "The Secret To Deep Diving May Lie In The Spleen", 2018. Researchers still hope to confirm the '
    'thyroid hormone link and that red blood cell levels change during dives. '
    'https://www.kpbs.org/news/2018/04/24/the-secret-to-deep-diving-may-lie-in-the-spleen',
    'AFP report on the Cell study (via Philstar), 2018. Bajau spend up to 60% of their working day diving. '
    'https://www.philstar.com/business/science-and-environment/2018/04/20/1807756/'
    'scientists-discover-secret-why-bajaus-are-stronger-divers',
    'The Scientist, "Free Divers from Southeast Asia Evolved Bigger Spleens", 2018. A rare example of natural '
    'selection in modern humans, over hundreds to thousands of years. '
    'https://mobile.the-scientist.com/article/52347/free-divers-from-southeast-asia-evolved-bigger-spleens',
    'Guinness World Records, "Longest time breath held voluntarily underwater (male)". 29 min 3 sec, Vitomir '
    'Maričić, Opatija, Croatia, 14 June 2025, after pre-breathing pure oxygen. '
    'https://www.guinnessworldrecords.com/world-records/longest-time-breath-held-voluntarily-male',
    'Checked by Claude on 2026-10-19 against Science News, NPR, The Scientist, Scientific American and reports of '
    'the record; no source gives the size of the spleens, so "roughly the size of a tennis ball" is unchecked.',
]

lines = []
for i, (t, b, c, p, say) in enumerate(LINES, start=1):
    line = {'id': f'l{i:02d}', 'speaker': N, 'text': t, 'beat': b, 'chapter': c, 'pauseAfterMs': p}
    if say:
        line['say'] = say
    lines.append(line)
script = {
    'version': 1,
    'title': 'Could Humans Evolve to Hold Their Breath Like Seals?',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is', 'format': 'fine-print', 'brand': 'fine-print', 'voice': 'narrator',
    'speakers': [], 'lines': lines, 'sources': SOURCES, 'changes': [],
    'masterPrompt': 'prompts/fine-print.md',
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
words = [len(t.replace('*', '').split()) for t, *_ in LINES]
print(len(lines), 'lines,', sum(words), 'words; by part:',
      [sum(w for w, (_, _, c, *_r) in zip(words, LINES) if c == k) for k in (1, 2, 3)])
