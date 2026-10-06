"""Reading and writing sound files at the studio's one format: 48 kHz stereo."""

from __future__ import annotations

import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

from .levels import SAMPLE_RATE, resample, to_stereo

_SOUNDFILE_SUFFIXES = {".wav", ".flac", ".ogg"}


def read_audio(path: Path) -> np.ndarray:
    """Any common audio file as 48 kHz stereo. MP3 and M4A go through pydub and FFmpeg."""
    path = Path(path)
    if not path.is_file():
        raise FileNotFoundError(f"There is no sound file at {path}")
    if path.suffix.lower() in _SOUNDFILE_SUFFIXES:
        audio, rate = sf.read(path, dtype="float64", always_2d=False)
    else:
        from pydub import AudioSegment  # imported here: pydub looks for FFmpeg when loaded

        seg = AudioSegment.from_file(path)
        raw = np.array(seg.get_array_of_samples(), dtype=np.float64) / float(1 << (8 * seg.sample_width - 1))
        audio = raw.reshape(-1, seg.channels) if seg.channels > 1 else raw
        rate = seg.frame_rate
    return to_stereo(resample(audio, rate, SAMPLE_RATE))


def write_wav(path: Path, audio: np.ndarray, rate: int = SAMPLE_RATE) -> Path:
    """16-bit WAV. Values are held inside the range a file can store."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(path, np.clip(audio, -1.0, 1.0), rate, subtype="PCM_16")
    return path


def write_mp3(wav: Path, mp3: Path | None = None, bitrate: str = "192k") -> Path:
    """An MP3 copy that is easy to play anywhere, made with FFmpeg."""
    wav = Path(wav)
    mp3 = Path(mp3) if mp3 else wav.with_suffix(".mp3")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", bitrate, str(mp3)],
        check=True,
    )
    return mp3
