"""Voice engine test, step 1 (run in the studio's own voice worker): the four lines as Kokoro
says them today, and a ten-second sample of each character's Kokoro voice for the other engine
to copy, so both engines speak as the same four people.

Biku passed on advice to try Chatterbox Turbo (Resemble AI, MIT licence) beside Kokoro, because
Kokoro reads everything flat. The lines are from the Smoke script, in story order.

Run from the audio folder:
  uv run python ../runs/2026-10-12-the-smoke-plain/engine-test-kokoro.py
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf

from studio_audio.files import write_mp3
from studio_audio.intonation import lift_questions
from studio_audio.voice import KokoroProvider, align, normalize, script_words, speech_bounds

WORK = Path("F:/Video Studio/.cache/chatterbox")
OUT = Path(__file__).parent / "voice-test"
(WORK / "ref").mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

VOICES = {
    "trainer": ((("am_onyx", 0.7), ("am_michael", 0.3)), 0.97),
    "copycat": ("am_fenrir", 0.97),
    "cheat": ("am_eric", 1.08),
    "leak": ("af_nicole", 0.95),
}
# A plain passage for the other engine to learn each voice from. It is never heard in a video.
SAMPLE = ("This is the voice I use every day. I talk at an even pace, in full sentences, and I do not hurry. "
          "Listen to how it rises and falls when I say something that matters.")
LINES = [
    ("trainer", "If a room filled with smoke, would you get up and leave? You think you would. Watch this."),
    ("copycat", "Is that smoke? Nobody else looks worried. So it must be fine."),
    ("cheat", "Relax. If it was dangerous, somebody would say so."),
    ("leak", "When something feels wrong, do not check the faces around you. Say it out loud, and stand up first."),
]

provider = KokoroProvider()
sr = provider.sample_rate


def speak(text, who, lift=True):
    voice, speed = VOICES[who]
    s = provider.synthesize(text, voice, speed)
    audio = s.audio
    if lift:
        words = [(w, a, b) for w, _, a, b in align(script_words(text), s.words)]
        audio = lift_questions(audio, sr, words, 1.5)
    a, b = speech_bounds(audio, sr)
    return audio[int(a * sr): int(b * sr)]


for who in VOICES:
    clip, _ = normalize(speak(SAMPLE, who, lift=False), sr)
    sf.write(WORK / "ref" / f"{who}.wav", clip, sr, subtype="PCM_16")
    print(f"  sample of {who}: {len(clip) / sr:.1f} s", flush=True)

parts, lengths = [], []
for who, text in LINES:
    clip = speak(text, who)
    lengths.append(round(len(clip) / sr, 2))
    parts += [clip, np.zeros(int(sr * 0.7), dtype=np.float32)]
audio, _ = normalize(np.concatenate(parts[:-1]), sr)
wav = OUT / "engine-1-kokoro.wav"
sf.write(wav, audio, sr, subtype="PCM_16")
mp3 = write_mp3(wav)
wav.unlink()
(WORK / "kokoro.json").write_text(json.dumps({"lines": LINES, "seconds": lengths}, indent=2), encoding="utf-8")
print(f"  {mp3.name}: {len(audio) / sr:.1f} s, lines {lengths}")
