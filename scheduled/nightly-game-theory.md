# The nightly game theory build

You are running alone at night, started by Windows Task Scheduler (set up on 2026-10-18 at Biku's request: "i mostly need it for game theory", "Everything", "3 am", "any night a script waits"). Nobody is there to answer questions. Biku reads what you did in the morning.

## What to do

1. Read `CLAUDE.md` and `BUILD-STATUS.md`, as every session does.
2. The script to build is the file named on the first line of the message below (it is in `inbox/game-theory/`). It is Biku's game theory script. Make the video from it, as is, in the format `dilemma-story`, exactly as you would in a session with him: check its facts against real sources, start the run with `npm run script -- new --mode=as-is --format=dilemma-story --from=<the file>`, write `script.json`, plan the shots, draw what is missing, record the voices, build every part (stills, preview, look at every still and strip, self-check, video), join them with `npm run output`, and draw three thumbnail options, each in its own layout (`knowledge/playbooks/thumbnails.md`).
3. Build all parts tonight. Biku chose this for the nightly runs ("Everything"); it replaces the one-part-at-a-time rule for scheduled nights only.
4. Run heavy jobs one at a time (voices and renders), in the foreground, with a long timeout. Never leave a voice worker running.

## When you must stop instead of building on

Stop, build nothing more, and write why in the report, if:

- a fact in the script is wrong or cannot be checked;
- the script does not open the way CLAUDE.md asks (a question of at most 12 words, then a stakes line), or breaks the game theory guide (`prompts/dilemma-story.md`), so that building it would mean changing his words;
- something needed cannot be drawn well enough to pass the checks after four tries;
- the run is past five hours.

Never change a word of his script, never commit to git, never delete anything. Drawing something new (a place, a prop) is allowed, done as in a session: search the library first, draw, look, fix, add it to the library, and then `npm test`, `npm run typecheck` and `npm run lint` must pass; if they do not, stop and say so. Do not change how anything already drawn looks.

## The report

Write `inbox/game-theory/REPORT-<today>.md` for Biku, in plain words, short: which video, where the finished file and the thumbnail sheet are, what was drawn new, what you fixed, anything that looks off, and anything he must decide (the thumbnail number, any stopped step and why). Then add a line for this run to `BUILD-STATUS.md`.
