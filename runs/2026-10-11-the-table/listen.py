"""Listening files for the Table: the three darker music moods, the four new sounds, and three
voices to choose from for the one who tells these videos. Claude cannot hear; these are for
Biku's ears.

Run from the audio folder:  uv run python ../runs/2026-10-11-the-table/listen.py [music] [sounds] [voices] [speeds]
"""

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

from studio_audio import music, sfx
from studio_audio.files import write_mp3, write_wav
from studio_audio.levels import SAMPLE_RATE, master

OUT = Path(__file__).parent / "sound"
OUT.mkdir(parents=True, exist_ok=True)
WHAT = set(sys.argv[1:]) or {"music", "sounds", "voices", "speeds"}

MOODS = ["unease", "closing-in", "aftermath"]
SOUNDS = [("heartbeat-rising", 8.0), ("clunk", None), ("boom", None), ("hum", 6.0)]

LINE = "Would you sit down at this table? Most people do. That is the first thing we learned about you."
# option number, Kokoro voice, speed, what it is like
VOICES = [
    (1, "am_onyx", 0.9, "a low, flat man's voice, slowed: cold and sure"),
    (2, "am_michael", 0.92, "the studio's usual narrator, slowed: calm and clear"),
    (3, "af_nicole", 0.95, "a soft, close woman's voice, almost a whisper"),
]


def keep(wav: Path) -> Path:
    mp3 = write_mp3(wav)
    wav.unlink()
    return mp3


report: dict = {}

if "music" in WHAT:
    report["music"] = []
    for name in MOODS:
        audio, levels = master(music.render(name, 30.0))
        file = keep(write_wav(OUT / f"music-{name}.wav", audio))
        report["music"].append({"mood": name, "file": file.name, "seconds": 30, **levels})
        print(f"  {file.name}: {levels['lufs']} LUFS, true peak {levels['truePeakDb']} dB", flush=True)

if "sounds" in WHAT:
    report["sounds"] = []
    for name, seconds in SOUNDS:
        audio, levels = master(sfx.make(name, seconds))
        file = keep(write_wav(OUT / f"sound-{name}.wav", audio))
        report["sounds"].append({"name": name, "file": file.name, "seconds": round(len(audio) / SAMPLE_RATE, 2), **levels})
        print(f"  {file.name}: {len(audio) / SAMPLE_RATE:.1f} s, {levels['lufs']} LUFS", flush=True)

if "voices" in WHAT:
    from studio_audio.voice import KokoroProvider, normalize, speech_bounds

    provider = KokoroProvider()
    sr = provider.sample_rate
    report["voices"] = {"line": LINE, "options": []}
    for n, voice, speed, like in VOICES:
        s = provider.synthesize(LINE, voice, speed)
        a, b = speech_bounds(s.audio, sr)
        clip, lufs = normalize(s.audio[int(a * sr) : int(b * sr)], sr)
        wav = OUT / f"voice-{n}.wav"
        sf.write(wav, clip, sr, subtype="PCM_16")
        file = keep(wav)
        report["voices"]["options"].append(
            {"option": n, "kokoroVoice": voice, "speed": speed, "like": like, "file": file.name,
             "seconds": round(len(clip) / sr, 2), "lufs": round(float(lufs), 1)}
        )
        print(f"  {file.name}: {voice} at {speed}, {len(clip) / sr:.2f} s, {lufs:.1f} LUFS", flush=True)

if "speeds" in WHAT:
    # The Trainer's voice (am_onyx) at three paces, four of his lines with the usual half second between.
    from studio_audio.voice import KokoroProvider, normalize, speech_bounds

    provider = KokoroProvider()
    sr = provider.sample_rate
    lines = ["Would you sit down at this table?", "Welcome back, trainees.",
             "Take your time. No pressure at all.", "There is pressure."]
    report["trainerSpeeds"] = []
    for n, speed in ((1, 0.9), (2, 0.97), (3, 1.04)):
        parts = []
        for text in lines:
            s = provider.synthesize(text, "am_onyx", speed)
            a, b = speech_bounds(s.audio, sr)
            parts += [s.audio[int(a * sr) : int(b * sr)], np.zeros(int(sr * 0.5), dtype=np.float32)]
        clip, lufs = normalize(np.concatenate(parts[:-1]), sr)
        wav = OUT / f"trainer-speed-{n}.wav"
        sf.write(wav, clip, sr, subtype="PCM_16")
        file = keep(wav)
        report["trainerSpeeds"].append({"option": n, "speed": speed, "file": file.name, "seconds": round(len(clip) / sr, 2)})
        print(f"  {file.name}: speed {speed}, {len(clip) / sr:.2f} s", flush=True)

index = OUT / "listen.json"
before = json.loads(index.read_text(encoding="utf-8")) if index.is_file() else {}
index.write_text(json.dumps({**before, **report}, indent=2), encoding="utf-8")
print(f"written to {OUT}")
del np
