"""Voice audition for the game theory cast: three voices each for the Cheat, the Saint and the
Copycat, all saying the same test line. Writes one MP3 per voice and one file with all nine.

Run from the audio folder:  uv run python ../runs/2026-10-11-dilemma-cast/audition.py
"""

import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

from studio_audio.voice import KokoroProvider, normalize, speech_bounds

LINE = "Every choice is a game. Pull up a chair."

# character, option number, Kokoro voice, speed, what it is like
OPTIONS = [
    ("cheat", 1, "am_puck", 1.08, "lively and quick; the voice the Stranger had in Split or Steal"),
    ("cheat", 2, "am_eric", 1.08, "lighter and brisk"),
    ("cheat", 3, "am_liam", 1.1, "young and fast"),
    ("saint", 1, "af_heart", 0.95, "a warm, bright woman's voice, a little slower"),
    ("saint", 2, "af_sarah", 0.95, "a softer woman's voice"),
    ("saint", 3, "am_echo", 0.95, "a gentle man's voice"),
    ("copycat", 1, "am_fenrir", 0.97, "a steady, deeper man's voice"),
    ("copycat", 2, "af_kore", 0.97, "a level, plain woman's voice"),
    ("copycat", 3, "am_onyx", 0.97, "a low, flat man's voice"),
]

out = Path(__file__).parent / "voices"
out.mkdir(parents=True, exist_ok=True)
provider = KokoroProvider()
sr = provider.sample_rate
gap = np.zeros(int(sr * 1.0), dtype=np.float32)
combined = []
index = []
cursor = 0.0


def mp3(wav: Path) -> Path:
    target = wav.with_suffix(".mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", "128k", str(target)], check=True)
    wav.unlink()
    return target


for character, n, voice, speed, like in OPTIONS:
    s = provider.synthesize(LINE, voice, speed)
    a, b = speech_bounds(s.audio, sr)
    clip, lufs = normalize(s.audio[int(a * sr) : int(b * sr)], sr)
    wav = out / f"{character}-{n}.wav"
    sf.write(wav, clip, sr, subtype="PCM_16")
    file = mp3(wav)
    index.append(
        {
            "character": character,
            "option": n,
            "kokoroVoice": voice,
            "speed": speed,
            "like": like,
            "file": file.name,
            "seconds": round(len(clip) / sr, 2),
            "lufs": round(lufs, 1),
            "startsAtSecInAll": round(cursor, 1),
        }
    )
    combined += [clip, gap]
    cursor += (len(clip) + len(gap)) / sr
    print(f"  {file.name}: {voice} at {speed}, {len(clip) / sr:.2f} s, {lufs:.1f} LUFS", flush=True)

all_wav = out / "all-nine.wav"
sf.write(all_wav, np.concatenate(combined), sr, subtype="PCM_16")
mp3(all_wav)
(out / "audition.json").write_text(json.dumps({"line": LINE, "options": index}, indent=2), encoding="utf-8")
print(f"{len(index)} test lines written to {out}")
