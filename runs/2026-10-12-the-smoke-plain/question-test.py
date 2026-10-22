"""The questions of the plain-words Smoke script, three ways, for Biku's ears.

  1  as Kokoro says them: the pitch falls at the end, like a statement
  2  lifted: the last word of each question climbs
  3  lifted further

The eight lines are in story order. Only the pitch at the end of each question changes; the
words, the voices and the pace are the same in all three. Claude cannot hear: what it reports
is the measured pitch at the end of each question against the words before it.

Run from the audio folder:  uv run python ../runs/2026-10-12-the-smoke-plain/question-test.py
"""

import json
from pathlib import Path

import numpy as np
import soundfile as sf

from studio_audio.files import write_mp3
from studio_audio.intonation import end_rise, lift_questions, questions_in
from studio_audio.voice import KokoroProvider, align, normalize, script_words

OUT = Path(__file__).parent / "voice-test"
OUT.mkdir(parents=True, exist_ok=True)

VOICES = {"trainer": ("am_onyx", 0.97), "copycat": ("am_fenrir", 0.97)}
LINES = [
    ("trainer", "If a room filled with smoke, would you get up and leave?", 0.6),
    ("copycat", "Twenty dollars just to sit here? Easy.", 0.6),
    ("copycat", "Is that smoke?", 0.6),
    ("trainer", "See what he did? He did not look at the smoke. He looked at the people.", 0.8),
    ("copycat", "It's getting hard to breathe. Shouldn't we tell someone?", 0.6),
    ("copycat", "My eyes are burning. Is nobody going to move?", 0.7),
    ("trainer", "What do you think he does?", 1.2),
    ("trainer", "So how long would you sit in smoke? As long as everyone else does.", 0.5),
]

provider = KokoroProvider()
sr = provider.sample_rate

spoken = []
for who, text, pause in LINES:
    name, speed = VOICES[who]
    s = provider.synthesize(text, name, speed)
    words = [(w, start, end) for w, _, start, end in align(script_words(text), s.words)]
    spoken.append((who, text, pause, s.audio, words))

report = {"files": [], "questions": []}
for n, label, strength in ((1, "now", 0.0), (2, "lifted", 1.0), (3, "lifted-further", 1.5)):
    parts = []
    for who, text, pause, audio, words in spoken:
        said = lift_questions(audio, sr, words, strength) if strength else audio
        for q in questions_in(words):
            word = next(w for w, start, _ in words if start == q.start)
            report["questions"].append({"option": n, "who": who, "ends on": word,
                                        "rise in semitones": round(end_rise(said, sr, q.start, q.end) or 0.0, 1)})
        parts += [said, np.zeros(int(sr * pause), dtype=np.float32)]
    audio, _ = normalize(np.concatenate(parts[:-1]), sr)
    wav = OUT / f"questions-{n}-{label}.wav"
    sf.write(wav, audio, sr, subtype="PCM_16")
    mp3 = write_mp3(wav)
    wav.unlink()
    report["files"].append({"option": n, "file": mp3.name, "seconds": round(len(audio) / sr, 1)})
    rises = [q["rise in semitones"] for q in report["questions"] if q["option"] == n]
    print(f"  {mp3.name}: {len(audio) / sr:.1f} s, the end of each question against the words before it: {rises}", flush=True)

(OUT / "question-test.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"written to {OUT}")
