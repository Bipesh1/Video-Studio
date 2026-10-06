"""Loudness, peaks and limiting, shared by the music, sound-effect and mix workers.

Everything here works on float arrays shaped (samples,) for mono or (samples, 2) for stereo.
The delivery target is the common one for social video (checked 2026-10-06; Meta publishes
codec settings but no loudness figure of its own): -14 LUFS integrated, true peak at or
below -1 dB.
"""

from __future__ import annotations

import numpy as np
import pyloudnorm as pyln
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import resample_poly

SAMPLE_RATE = 48000
"""Every stem and every mix is 48 kHz, the rate video platforms expect."""
TARGET_LUFS = -14.0
LUFS_TOLERANCE = 0.5
TRUE_PEAK_LIMIT_DB = -1.0
"""Lessons can never loosen these two (plan, Part 2 section 11: loudness limits)."""

_LIMIT_START_DB = -1.3
"""Where the limiter first aims its sample peaks; it goes lower if the true peak asks for it."""


def db_to_gain(db: float) -> float:
    return float(10 ** (db / 20))


def gain_to_db(gain: float) -> float:
    return float(20 * np.log10(max(gain, 1e-12)))


def to_stereo(audio: np.ndarray) -> np.ndarray:
    """Mono becomes the same sound on both sides."""
    audio = np.asarray(audio, dtype=np.float64)
    if audio.ndim == 1:
        return np.stack([audio, audio], axis=1)
    if audio.shape[1] == 1:
        return np.repeat(audio, 2, axis=1)
    return audio[:, :2]


def resample(audio: np.ndarray, rate: int, to_rate: int = SAMPLE_RATE) -> np.ndarray:
    if rate == to_rate:
        return np.asarray(audio, dtype=np.float64)
    g = np.gcd(rate, to_rate)
    return resample_poly(np.asarray(audio, dtype=np.float64), to_rate // g, rate // g, axis=0)


def loudness(audio: np.ndarray, rate: int = SAMPLE_RATE) -> float:
    """Integrated loudness in LUFS. Silence, or a sound too short to measure, gives -inf."""
    if len(audio) < int(rate * 0.45):
        pad = np.zeros((int(rate * 0.45) - len(audio),) + audio.shape[1:], dtype=np.float64)
        audio = np.concatenate([audio, pad])
    value = pyln.Meter(rate).integrated_loudness(np.asarray(audio, dtype=np.float64))
    return float(value) if np.isfinite(value) else float("-inf")


def true_peak_db(audio: np.ndarray) -> float:
    """The highest level the sound reaches between samples too, measured at 4 times the rate."""
    if len(audio) == 0:
        return float("-inf")
    over = resample_poly(np.asarray(audio, dtype=np.float64), 4, 1, axis=0)
    return gain_to_db(float(np.max(np.abs(over))))


def sample_peak_db(audio: np.ndarray) -> float:
    return gain_to_db(float(np.max(np.abs(audio)))) if len(audio) else float("-inf")


def limit(audio: np.ndarray, ceiling_db: float, rate: int = SAMPLE_RATE) -> np.ndarray:
    """Turn down only the moments that would pass the ceiling. Both sides are turned down
    together, starting 3 ms early and easing back over about 60 ms, so nothing clicks."""
    audio = np.asarray(audio, dtype=np.float64)
    if len(audio) == 0:
        return audio
    ceiling = db_to_gain(ceiling_db)
    peak = np.abs(audio) if audio.ndim == 1 else np.max(np.abs(audio), axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    if float(need.min()) >= 1.0:
        return audio
    # The lowest gain needed anywhere near each sample, then smoothed over the same width:
    # an average of values that are all low enough is itself low enough.
    width = max(3, int(rate * 0.06)) | 1
    gain = uniform_filter1d(minimum_filter1d(need, size=width, mode="nearest"), size=width, mode="nearest")
    return audio * (gain if audio.ndim == 1 else gain[:, None])


def master(
    audio: np.ndarray,
    target_lufs: float = TARGET_LUFS,
    peak_db: float = TRUE_PEAK_LIMIT_DB,
    rate: int = SAMPLE_RATE,
) -> tuple[np.ndarray, dict]:
    """Bring a finished sound to the target loudness with its true peak under the limit.

    Returns the audio and a small report: loudness, true peak, and whether both are on target.
    Limiting lowers the loudness a little, so the gain is set again after each pass.
    """
    out = np.asarray(audio, dtype=np.float64)
    ceiling = _LIMIT_START_DB + (peak_db - TRUE_PEAK_LIMIT_DB)
    if not np.isfinite(loudness(out, rate)):
        return out, {"lufs": None, "truePeakDb": None, "onTarget": False, "silent": True}
    for _ in range(6):
        for _ in range(4):
            now = loudness(out, rate)
            if abs(now - target_lufs) < 0.05:
                break
            out = limit(out * db_to_gain(target_lufs - now), ceiling, rate)
        over = true_peak_db(out) - peak_db
        if over <= 0:
            break
        ceiling -= over + 0.1
        out = limit(out, ceiling, rate)
    return out, level_report(out, target_lufs, peak_db, rate)


def level_report(
    audio: np.ndarray,
    target_lufs: float = TARGET_LUFS,
    peak_db: float = TRUE_PEAK_LIMIT_DB,
    rate: int = SAMPLE_RATE,
) -> dict:
    lufs = loudness(audio, rate)
    peak = true_peak_db(audio)
    return {
        "lufs": round(lufs, 2),
        "truePeakDb": round(peak, 2),
        "clipped": bool(sample_peak_db(audio) >= -0.01),
        "onTarget": bool(abs(lufs - target_lufs) <= LUFS_TOLERANCE and peak <= peak_db + 0.05),
        "silent": False,
    }


def set_loudness(audio: np.ndarray, lufs: float, rate: int = SAMPLE_RATE) -> np.ndarray:
    """Plain gain so the sound measures the given loudness. Silence is returned as it is."""
    now = loudness(audio, rate)
    if not np.isfinite(now):
        return np.asarray(audio, dtype=np.float64)
    return np.asarray(audio, dtype=np.float64) * db_to_gain(lufs - now)


def fade(audio: np.ndarray, in_s: float = 0.0, out_s: float = 0.0, rate: int = SAMPLE_RATE) -> np.ndarray:
    """Smooth fade in and out (quarter of a sine wave, so loudness changes evenly)."""
    out = np.array(audio, dtype=np.float64, copy=True)
    n = len(out)
    for seconds, at_end in ((in_s, False), (out_s, True)):
        k = min(n, int(seconds * rate))
        if k <= 1:
            continue
        ramp = np.sin(np.linspace(0, np.pi / 2, k))
        if at_end:
            ramp = ramp[::-1]
        ramp = ramp if out.ndim == 1 else ramp[:, None]
        if at_end:
            out[n - k :] *= ramp
        else:
            out[:k] *= ramp
    return out
