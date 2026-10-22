"""The spoken words of "The Dollar Auction" as script.json: Biku's words exactly, a breath to a line.

Run it again after any change to how the lines are cut. Nothing here changes a word (as-is mode):
only where a line ends, which words the captions stress (his "Caption emphasis" notes) and how
long the silence after a line is. The parts are set here, where the story turns: the auction
(his beats 1 to 3), the real numbers and where the money goes (4 and 5), the answer and the
ending (6 and 7).

The Cheat, the Copycat and the Saint speak in their own saved voices, at their own pace.
"""
import io
import json

RUN = 'F:/Video Studio/runs/2026-10-11-dollar-auction/'
SPEED = 0.95  # the auctioneer a touch slower than the voice's usual, so 293 words fill about 1:53

N, C, K, S = 'narrator', 'cheat', 'copycat', 'saint'
#  (speaker, text, beat, part, pause after in ms or None for the format's usual)
# The opening, added on 2026-10-11 at Biku's asking and approved by him: the question the video
# answers, in its first three seconds, then one line of stakes. They have ids of their own (q1,
# q2), so no line after them changes its name and parts 2 and 3 stay exactly as they were.
OPENING = [
    ('q1', 'Would you bid a nickel for *a dollar bill?*', 500),
    ('q2', 'Two bidders said yes. Watch what it cost them.', 700),
]

LINES = [
    # Beat 1. Sold.
    (N, '*Sold.*', 'hook', 1, 450),
    (N, 'One dollar bill, to the Cheat, for *a dollar eighty-five.*', 'hook', 1, None),
    (N, 'And the Copycat pays a dollar eighty.', 'hook', 1, 300),
    (N, '*For nothing.*', 'hook', 1, 600),
    (N, 'So who won?', 'hook', 1, 350),
    (C, 'Me. *Obviously.*', 'hook', 1, 800),
    # Beat 2. The tiny rule.
    (N, 'Rewind.', 'why-it-matters', 1, 450),
    (N, 'One dollar. Bids start at a nickel.', 'why-it-matters', 1, None),
    (N, 'Highest bid takes it.', 'why-it-matters', 1, None),
    (N, 'One tiny rule.', 'why-it-matters', 1, 300),
    (N, '*Second place pays too,* and gets nothing.', 'why-it-matters', 1, 700),
    (N, 'A dollar for a nickel.', 'why-it-matters', 1, 300),
    # His script: hold on You for a beat of silence.
    (N, 'Would you *raise your hand?*', 'why-it-matters', 1, 1500),
    (C, 'Five cents.', 'why-it-matters', 1, 300),
    (K, 'Ten cents.', 'why-it-matters', 1, 700),
    # Beat 3. Past a dollar.
    (N, 'Ninety-five cents from the Cheat.', 'first-part', 1, 250),
    (N, 'One dollar from the Copycat.', 'first-part', 1, 500),
    (C, 'If I stop, I lose ninety-five cents.', 'first-part', 1, 250),
    (C, 'If I bid *a dollar five* and win, I only lose a nickel.', 'first-part', 1, 500),
    (K, 'If I stop, I lose a dollar.', 'first-part', 1, 300),
    (K, 'A dollar ten.', 'first-part', 1, 700),
    (N, 'Nobody is chasing the dollar now.', 'first-part', 1, 300),
    (N, "They just *can't afford to come second.*", 'first-part', 1, 1200),
    # Beat 4. The party game.
    (N, 'The economist who published this game, in *nineteen seventy-one,* said to play it at a party, '
        'when spirits are high.', 'second-part', 2, None),
    (N, 'He wrote that three to five dollars for one dollar was not unusual.', 'second-part', 2, 500),
    (N, 'In one business school class, a twenty-dollar bill went for *two thousand dollars.*',
     'second-part', 2, 400),
    (N, 'A hundred times its worth.', 'second-part', 2, 900),
    # Beat 5. Where the money goes.
    (S, 'Sorry. Where does all that money go?', 'surprise', 2, 600),
    (N, '*To me.*', 'surprise', 2, 500),
    (N, "I'm the one selling the dollar.", 'surprise', 2, 600),
    (N, 'A real website ran a close cousin of this game.', 'surprise', 2, None),
    (N, 'One study counted *twenty-six million dollars* in profit.', 'surprise', 2, 500),
    (N, 'It even auctioned cash, and took in about two dollars for every dollar it gave away.',
     'surprise', 2, 1100),
    # Beat 6. Sixty cents.
    (N, "I'd rather you missed this part.", 'surprise', 3, 350),
    (N, 'A game theorist solved my auction.', 'surprise', 3, 500),
    (N, 'Give both players two dollars and fifty cents.', 'surprise', 3, None),
    (N, 'Perfect logic says one opening bid of *sixty cents.*', 'surprise', 3, 400),
    (N, 'The other player *stays silent.*', 'surprise', 3, 1000),
    # Beat 7. You played this today.
    (N, 'The trap was never the dollar, it was *the second bid.*', 'takeaway', 3, 700),
    (N, '*You played this today.*', 'takeaway', 3, 400),
    (N, 'That group chat argument nobody would drop.', 'takeaway', 3, None),
    (N, 'Every reply cost you more of your evening, and neither side could afford to come second.',
     'takeaway', 3, 800),
    (N, 'So.', 'takeaway', 3, 500),
    (N, "Who'll start me at a nickel?", 'takeaway', 3, 1300),
]

SHUBIK = ('Martin Shubik, The Dollar Auction Game: A Paradox in Noncooperative Behavior and Escalation, Journal '
          'of Conflict Resolution, March 1971, pages 109 to 111, as quoted word for word by Timothy Taylor, '
          'https://conversableeconomist.com/2011/11/15/martin-shubiks-dollar-auction-game/')
AUGENBLICK = ('Ned Augenblick, The Sunk-Cost Fallacy in Penny Auctions, Review of Economic Studies, 2016, volume '
              '83, pages 58 to 86, https://kylewoodward.com/blog-data/pdfs/references/augenblick-the-review-of-'
              'economic-studies-2015A.pdf')
SOURCES = [
    SHUBIK + ' : the rule (the highest and the second-highest bidder both pay, only the highest gets the '
    'dollar); published in 1971; best played during a party when spirits are high; a total of payments between '
    'three and five dollars is not uncommon; once two bids are in, the escalation is real. Sure: read through '
    "Taylor's quotations; the scan of the paper itself could not be read.",
    'J. Keith Murnighan, A Very Extreme Case of the Dollar Auction, Journal of Management Education, 2002, '
    'volume 26, pages 56 to 69, https://www.kellogg.northwestern.edu/faculty/research/detail/2002/a-very-'
    'extreme-case-of-the-dollar-auction ; figure as reported by Gillian Ku, https://www.kellogg.northwestern.edu/'
    'research/ktag/resources/papers/ku.pdf : a 20 dollar bill sold for 2,000 dollars in an executive MBA class '
    '(a hundred times its worth is 2,000 divided by 20). Fairly sure: three academic summaries agree; the '
    'article itself was not opened.',
    AUGENBLICK + ' : a real penny auction website made about 26 million dollars in profit across 166,000 '
    'auctions, September 2005 to June 2009; when it auctioned cash, average revenue was 204% of face value '
    'across more than 2,000 cash auctions (about two dollars for every dollar); the paper says the penny '
    'auction shares many characteristics with the dollar auction (a close cousin). Sure: the full paper was read.',
    "Barry O'Neill, International Escalation and the Dollar Auction, Journal of Conflict Resolution, 1986, "
    'volume 30, pages 33 to 50, https://ideas.repec.org/a/sae/jocore/v30y1986i1p33-50.html : with 2 dollars 50 '
    'each, the first bidder should open at 60 cents and the other should stay silent. Sure of the figures, '
    "which are in the paper's own abstract; the full article was not opened.",
    'Wikipedia, Dollar auction, https://en.wikipedia.org/wiki/Dollar_auction : bids start at a nickel and rise '
    "in nickels. Fairly sure: not checked against the original paper; it matches O'Neill's 60 cent answer.",
    "Biku's accuracy notes (script-brief.md): the opening sale (1.85 and 1.80) and every bid the cast makes "
    'are an invented scene.',
]

counts = {}
lines = [{'id': lid, 'speaker': N, 'text': text, 'beat': 'hook', 'chapter': 1, 'speed': SPEED,
          'pauseAfterMs': pause} for lid, text, pause in OPENING]
PREFIX = {N: 'n', C: 'c', K: 'k', S: 's'}
for speaker, text, beat, part, pause in LINES:
    counts[speaker] = counts.get(speaker, 0) + 1
    line = {'id': f'{PREFIX[speaker]}{counts[speaker]}', 'speaker': speaker, 'text': text, 'beat': beat,
            'chapter': part}
    if speaker == N:
        line['speed'] = SPEED
    if pause is not None:
        line['pauseAfterMs'] = pause
    lines.append(line)

script = {
    'version': 1,
    'title': 'The Dollar Auction',
    'request': io.open(RUN + 'request.txt', encoding='utf8').read().strip(),
    'mode': 'as-is',
    'format': 'explainer',
    'brand': 'my-page',
    'voice': 'narrator',
    'speakers': [
        {'id': C, 'name': 'The Cheat', 'voice': 'cheat'},
        {'id': K, 'name': 'The Copycat', 'voice': 'copycat'},
        {'id': S, 'name': 'The Saint', 'voice': 'saint'},
    ],
    'lines': lines,
    'sources': SOURCES,
    'changes': [],
}
with io.open(RUN + 'script.json', 'w', encoding='utf8', newline='\n') as f:
    json.dump(script, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(lines), 'lines,', sum(len(l['text'].replace('*', '').split()) for l in lines), 'words')
