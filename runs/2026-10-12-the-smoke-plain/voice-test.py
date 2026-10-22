"""Three ways of speaking the same eight lines, for Biku's ears: can Kokoro sound less flat?

  1  as the studio speaks them now: one speed for each voice, the words as written
  2  a pace of its own for each line, and pauses inside the sentences (commas, "...")
  3  the same as 2, with the Trainer's voice blended from two Kokoro voices

The lines are the tensest stretch of the plain-words Smoke script, in order, so each file is a
small scene that makes sense. The words never change: only how they are said. Claude cannot
hear, so what it can report is measured: how long each line takes.

Run from the audio folder:  uv run python ../runs/2026-10-12-the-smoke-plain/voice-test.py
"""

import json
from pathlib import Path

import numpy as np
import soundfile as sf

from studio_audio.files import write_mp3
from studio_audio.voice import KokoroProvider, normalize, speech_bounds

OUT = Path(__file__).parent / "voice-test"
OUT.mkdir(parents=True, exist_ok=True)

# The voices as their files have them today (voices/trainer.json, copycat.json, cheat.json).
VOICES = {"trainer": ("am_onyx", 0.97), "copycat": ("am_fenrir", 0.97), "cheat": ("am_eric", 1.08)}
# The Trainer's voice with some of the studio's usual narrator mixed in: his own sound.
BLEND = (("am_onyx", 0.7), ("am_michael", 0.3))

#  who, the words as written, pause after (s), [pace against the voice's own, the words as said]
LINES = [
    ("copycat", "It's getting hard to breathe. Shouldn't we tell someone?", 0.4,
     1.04, "It's getting hard to breathe... Shouldn't we tell someone?"),
    ("cheat", "Relax. If it was dangerous, somebody would say so.", 0.5,
     0.92, "Relax. If it was dangerous, somebody would say so."),
    ("copycat", "Yeah. You're right. It's fine.", 0.6,
     0.93, "Yeah... You're right. It's fine."),
    ("trainer", "Now he has said it is fine. Leaving would mean admitting he was wrong.", 0.9,
     0.98, "Now, he has said it is fine. Leaving would mean admitting... he was wrong."),
    ("copycat", "My eyes are burning. Is nobody going to move?", 0.7,
     1.1, "My eyes are burning! Is nobody going to move?"),
    ("trainer", "What do you think he does?", 1.8,
     0.92, "What do you think... he does?"),
    ("copycat", "They are all calm. I must be the one who is wrong.", 1.2,
     0.9, "They are all calm... I must be the one, who is wrong."),
    ("trainer", "He stays.", 1.0,
     0.84, "He... stays."),
]

provider = KokoroProvider()
sr = provider.sample_rate
pipe = provider._pipe


def blended():
    """One voice made of two, by weight."""
    load = getattr(pipe, "load_single_voice", None) or pipe.load_voice
    return sum(load(name) * weight for name, weight in BLEND)


def speak(text, voice, speed):
    s = provider.synthesize(text, voice, speed)
    a, b = speech_bounds(s.audio, sr)
    return s.audio[int(a * sr) : int(b * sr)]


def version(shaped, trainer_voice):
    parts, lengths = [], []
    for who, written, pause, pace, said in LINES:
        name, speed = VOICES[who]
        voice = trainer_voice if (who == "trainer" and trainer_voice is not None) else name
        clip = speak(said if shaped else written, voice, speed * (pace if shaped else 1.0))
        lengths.append(round(len(clip) / sr, 2))
        parts += [clip, np.zeros(int(sr * pause), dtype=np.float32)]
    audio, _ = normalize(np.concatenate(parts[:-1]), sr)
    return audio, lengths


report = {"lines": [{"who": w, "written": t, "said": s, "pace": p} for w, t, _, p, s in LINES], "files": []}
for n, label, shaped, voice in (
    (1, "now", False, None),
    (2, "pace-and-pauses", True, None),
    (3, "pace-pauses-and-blended-trainer", True, blended()),
):
    audio, lengths = version(shaped, voice)
    wav = OUT / f"{n}-{label}.wav"
    sf.write(wav, audio, sr, subtype="PCM_16")
    mp3 = write_mp3(wav)
    wav.unlink()
    report["files"].append({"option": n, "file": mp3.name, "seconds": round(len(audio) / sr, 1),
                            "lineSeconds": lengths})
    print(f"  {mp3.name}: {len(audio) / sr:.1f} s, lines {lengths}", flush=True)

(OUT / "voice-test.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"written to {OUT}")
