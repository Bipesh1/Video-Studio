"""Sound-effect worker: every effect is made from scratch with numpy and scipy.

Usage:
  uv run python -m studio_audio.sfx list
  uv run python -m studio_audio.sfx render --name whoosh --out engine/out/sound/whoosh.wav
  uv run python -m studio_audio.sfx reel --out engine/out/sound

A file in the project's sfx/ folder named after an effect (sfx/whoosh.wav) is used instead of
the made one. Every effect comes out at 48 kHz stereo and at the same working level, so the
mix worker can set each one against the voice.
"""

from __future__ import annotations

import argparse
import json
import sys
import zlib
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np
from scipy.signal import butter, sosfilt

from .files import read_audio, write_mp3, write_wav
from .levels import SAMPLE_RATE, db_to_gain, fade, gain_to_db, level_report, master
from .paths import SFX_OVERRIDES, find_override

SR = SAMPLE_RATE
WORKING_LEVEL_DB = -18.0
"""Every effect's loudest tenth of a second sits at this level (RMS), before the mix places it."""
WORKING_PEAK_DB = -3.0

Maker = Callable[[np.random.Generator, float], np.ndarray]


# ------------------------------------------------------------------ building blocks


def _n(seconds: float) -> int:
    return max(1, int(round(seconds * SR)))


def _noise(rng: np.random.Generator, n: int) -> np.ndarray:
    return rng.standard_normal(n)


def _filter(x: np.ndarray, kind: str, freq: float | tuple[float, float], order: int = 2) -> np.ndarray:
    nyq = SR / 2
    wn = [f / nyq for f in freq] if isinstance(freq, tuple) else freq / nyq
    return sosfilt(butter(order, wn, btype=kind, output="sos"), x)


def _band(rng: np.random.Generator, n: int, kind: str, freq: float | tuple[float, float]) -> np.ndarray:
    """Noise kept to one part of the range, at the strength of a full-size sine wave, so a
    narrow band is as strong as a wide one and the weights in each effect mean what they say."""
    x = _filter(_noise(rng, n), kind, freq)
    return x * (0.707 / (float(np.sqrt(np.mean(x**2))) + 1e-12))


def _decay(n: int, seconds: float) -> np.ndarray:
    """Falls to about a thousandth of its start over the given time."""
    return np.exp(-6.9 * np.arange(n) / (seconds * SR))


def _attack(n: int, seconds: float) -> np.ndarray:
    k = max(1, min(n, int(seconds * SR)))
    out = np.ones(n)
    out[:k] = np.sin(np.linspace(0, np.pi / 2, k)) ** 2
    return out


def _sine_sweep(f0: float, f1: float, n: int, curve: float = 1.0) -> np.ndarray:
    """A sine whose pitch moves from f0 to f1. curve above 1 gets there early."""
    u = np.linspace(0, 1, n) ** (1 / curve)
    freq = f0 * (f1 / f0) ** u
    return np.sin(2 * np.pi * np.cumsum(freq) / SR)


def _swept_band(x: np.ndarray, centre: np.ndarray, sharpness: float) -> np.ndarray:
    """Noise through a band whose centre moves (a state-variable filter, one sample at a time)."""
    out = np.empty_like(x)
    low = band = 0.0
    f = 2 * np.sin(np.pi * np.clip(centre, 20, SR / 6) / SR)
    q = 1 / sharpness
    for i in range(len(x)):
        low += f[i] * band
        high = x[i] - low - q * band
        band += f[i] * high
        out[i] = band
    return out


def _smooth_random(rng: np.random.Generator, n: int, rate_hz: float) -> np.ndarray:
    """A slow wandering line between 0 and 1 that changes about rate_hz times a second."""
    points = max(4, int(n / SR * rate_hz) + 3)
    knots = rng.random(points)
    x = np.linspace(0, points - 1, n)
    i = np.minimum(x.astype(int), points - 2)
    t = x - i
    t = t * t * (3 - 2 * t)
    return knots[i] * (1 - t) + knots[i + 1] * t


def _pan(mono: np.ndarray, pan: float | np.ndarray) -> np.ndarray:
    """-1 is left, 0 the middle, 1 right. Equal power, so a moving sound keeps its loudness."""
    angle = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([mono * np.cos(angle), mono * np.sin(angle)], axis=1) * np.sqrt(2)


def _place(total: int, pieces: list[tuple[int, np.ndarray]]) -> np.ndarray:
    out = np.zeros((total, 2))
    for at, piece in pieces:
        end = min(total, at + len(piece))
        if end > at:
            out[at:end] += piece[: end - at]
    return out


# ------------------------------------------------------------------ the effects


def _whoosh(rng: np.random.Generator, seconds: float) -> np.ndarray:
    n = _n(seconds)
    u = np.linspace(0, 1, n)
    centre = 260 + 1500 * np.sin(np.pi * u) ** 1.5
    body = _swept_band(_noise(rng, n), centre, 2.6)
    body *= 0.707 / (float(np.sqrt(np.mean(body**2))) + 1e-12)
    air = _band(rng, n, "bandpass", (2500, 6000)) * 0.12
    env = np.sin(np.pi * u ** 0.8) ** 2
    return _pan(_filter(body + air, "lowpass", 5000) * env, np.linspace(-0.7, 0.7, n))


def _pop(rng: np.random.Generator, seconds: float) -> np.ndarray:
    n = _n(seconds)
    tone = _sine_sweep(320, 1150, n, curve=3.0) * _decay(n, 0.07)
    snap = _band(rng, n, "highpass", 2500) * _decay(n, 0.012) * 0.3
    return _pan((tone + snap) * _attack(n, 0.002), 0.0)


def _thud(rng: np.random.Generator, seconds: float) -> np.ndarray:
    n = _n(seconds)
    body = _sine_sweep(150, 55, n, curve=2.0) * _decay(n, 0.28)
    # A phone plays almost nothing below 200 Hz, so the knock carries the sound there.
    knock = _band(rng, n, "bandpass", (180, 700)) * _decay(n, 0.11) * 1.3
    return _pan((body + knock) * _attack(n, 0.003), 0.0)


def _click(rng: np.random.Generator, seconds: float) -> np.ndarray:
    n = _n(seconds)
    tick = _band(rng, n, "highpass", 1800) * _decay(n, 0.006)
    ping = np.sin(2 * np.pi * 2300 * np.arange(n) / SR) * _decay(n, 0.02) * 0.6
    return _pan(tick + ping, 0.0)


def _step(rng: np.random.Generator, heavy: float) -> np.ndarray:
    n = _n(0.16)
    heel = _sine_sweep(190 * heavy, 90 * heavy, n, curve=2.0) * _decay(n, 0.07) * 0.6
    scuff = _band(rng, n, "bandpass", (500, 2600)) * _decay(n, 0.05) * 0.45
    sole = _band(rng, n, "bandpass", (200, 600)) * _decay(n, 0.05) * 0.8
    return (heel + scuff + sole) * _attack(n, 0.002)


def _footsteps(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """Steps half a second apart, one foot a little heavier than the other."""
    total = _n(seconds)
    gap = 0.5
    pieces = []
    for i in range(max(1, int(seconds / gap))):
        at = _n(i * gap + rng.uniform(-0.015, 0.015) + 0.02)
        heavy = (1.0 if i % 2 == 0 else 1.12) * rng.uniform(0.96, 1.04)
        pieces.append((at, _pan(_step(rng, heavy), -0.2 if i % 2 == 0 else 0.2)))
    return _place(total, pieces)


def _wind(rng: np.random.Generator, seconds: float) -> np.ndarray:
    n = _n(seconds)
    sides = []
    for _ in range(2):
        gust = _smooth_random(rng, n, 0.6)
        low = _swept_band(_noise(rng, n), 260 + 520 * gust, 1.4)
        whistle = _swept_band(_noise(rng, n), 900 + 700 * _smooth_random(rng, n, 0.4), 9.0) * 0.12
        sides.append((low + whistle) * (0.45 + 0.55 * gust))
    return fade(np.stack(sides, axis=1), 0.4, 0.6)


_VOWELS = [(730, 1090), (270, 2290), (570, 840), (300, 870), (530, 1840), (660, 1720), (440, 1020)]


def _crowd(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """Many people talking at once: each voice is a buzzing tone shaped like a vowel, coming
    and going in syllables. No words can be made out, which is the point."""
    n = _n(seconds)
    out = np.zeros((n, 2))
    for _ in range(26):
        pitch = rng.uniform(95, 240) * (1 + 0.12 * (_smooth_random(rng, n, 2.5) - 0.5))
        phase = np.cumsum(pitch) / SR
        buzz = _filter(2 * (phase % 1) - 1, "lowpass", 3000, order=1)
        f1, f2 = _VOWELS[rng.integers(len(_VOWELS))]
        voice = _filter(buzz, "bandpass", (f1 * 0.85, f1 * 1.15)) + 1.6 * _filter(
            buzz, "bandpass", (f2 * 0.9, f2 * 1.1)
        )
        syllables = np.clip(_smooth_random(rng, n, rng.uniform(3.5, 6.0)) * 2.4 - 0.9, 0, 1)
        phrases = np.clip(_smooth_random(rng, n, 0.5) * 2.0 - 0.5, 0, 1)
        breath = _filter(_noise(rng, n), "bandpass", (1800, 4200)) * 0.12
        out += _pan((voice + breath) * syllables * phrases * rng.uniform(0.5, 1.0), rng.uniform(-0.9, 0.9))
    return fade(out, 0.5, 0.7)


def _creak(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """Wood under strain: a slow rasp that climbs in pitch, ringing through a few wooden notes."""
    n = _n(seconds)
    u = np.linspace(0, 1, n)
    rate = (38 + 70 * u ** 1.4) * (1 + 0.25 * (_smooth_random(rng, n, 14) - 0.5))
    phase = np.cumsum(rate) / SR
    rasp = np.diff(np.floor(phase), prepend=0.0) + 0.3 * (2 * (phase % 1) - 1)
    ring = sum(
        _filter(rasp, "bandpass", (f * 0.93, f * 1.07)) * w
        for f, w in ((520, 1.0), (1180, 0.8), (1900, 0.6), (2900, 0.35))
    )
    env = np.sin(np.pi * u ** 0.7) ** 1.5
    return _pan(ring * env, 0.0)


def _blip(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A drop: a quick rising plip with a short tail, for a sweat drop or a small idea."""
    n = _n(seconds)
    plip = _sine_sweep(620, 1750, n, curve=2.5) * _decay(n, 0.09)
    tail = np.sin(2 * np.pi * 1750 * np.arange(n) / SR) * _decay(n, 0.16) * 0.15
    del rng
    return _pan((plip + tail) * _attack(n, 0.003), 0.0)


def _hit(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A cartoon blow: a slap of noise on top of a short low punch. No crunch, no gore."""
    n = _n(seconds)
    slap = _band(rng, n, "bandpass", (700, 4200)) * _decay(n, 0.06) * 1.0
    punch = _sine_sweep(220, 70, n, curve=2.5) * _decay(n, 0.16) * 0.7
    air = _band(rng, n, "bandpass", (200, 900)) * _decay(n, 0.1) * 0.9
    return _pan((slap + punch + air) * _attack(n, 0.001), 0.0)


def _ding(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A coin or a small bell: a few bright notes that do not quite agree, ringing out."""
    n = _n(seconds)
    t = np.arange(n) / SR
    tone = np.zeros(n)
    for freq, level, ring in ((2640, 1.0, 0.9), (2655, 0.5, 0.8), (4210, 0.6, 0.5), (6180, 0.35, 0.3), (8900, 0.15, 0.15)):
        tone += np.sin(2 * np.pi * freq * t + rng.uniform(0, 6.28)) * level * _decay(n, ring * seconds / 0.9)
    strike = _band(rng, n, "highpass", 4000) * _decay(n, 0.008) * 0.3
    return _pan((tone + strike) * _attack(n, 0.001), 0.0)


# ------------------------------------------------------------------ the list


@dataclass(frozen=True)
class Effect:
    name: str
    description: str
    make: Maker
    seconds: float
    """Its natural length. Ambient effects can be made at any length."""
    level_db: float
    """How far under the voice it sits in a mix, in dB (see mix.py)."""
    ambient: bool = False
    """A bed that runs under a whole shot, not a single moment."""


EFFECTS: dict[str, Effect] = {
    e.name: e
    for e in (
        Effect("whoosh", "A fast move through the air: a swing, a dash, a quick camera move", _whoosh, 0.55, -7.0),
        Effect("pop", "A small bright pop: something appears, a title lands", _pop, 0.18, -8.0),
        Effect("thud", "A heavy dull landing: a fall, a dropped load, a door closing", _thud, 0.5, -5.0),
        Effect("click", "A tiny tick: a latch, a switch, a cut on the beat", _click, 0.08, -10.0),
        Effect("footsteps", "Steps on a hard floor, two a second", _footsteps, 2.0, -11.0),
        Effect("wind", "Open-air wind with soft gusts", _wind, 5.0, -20.0, ambient=True),
        Effect("crowd-murmur", "A room or street full of people talking, no words", _crowd, 5.0, -19.0, ambient=True),
        Effect("creak", "Wood under strain: a door, a floorboard, a ship", _creak, 0.9, -8.0),
        Effect("blip", "A drop: sweat, a small idea, a tiny surprise", _blip, 0.3, -9.0),
        Effect("hit", "A cartoon blow landing", _hit, 0.32, -4.0),
        Effect("ding", "A coin or a small bell", _ding, 0.9, -8.0),
    )
}

ALIASES = {
    "wood-creak": "creak",
    "sweat-drop": "blip",
    "drop": "blip",
    "crowd": "crowd-murmur",
    "murmur": "crowd-murmur",
    "steps": "footsteps",
    "punch": "hit",
    "impact": "hit",
    "coin": "ding",
    "bell": "ding",
}


def effect_names() -> list[str]:
    return list(EFFECTS)


def resolve(name: str) -> Effect:
    key = ALIASES.get(name, name)
    if key not in EFFECTS:
        raise KeyError(f'There is no sound effect called "{name}". The effects are: {", ".join(EFFECTS)}.')
    return EFFECTS[key]


def loudest_window_db(audio: np.ndarray, seconds: float = 0.1) -> float:
    """The level (RMS) of the loudest stretch of the given length."""
    power = np.mean(np.asarray(audio, dtype=np.float64) ** 2, axis=1) if audio.ndim == 2 else audio**2
    win = min(len(power), max(1, int(seconds * SR)))
    if win == 0:
        return float("-inf")
    sums = np.cumsum(np.concatenate([[0.0], power]))
    return gain_to_db(float(np.sqrt(np.max(sums[win:] - sums[:-win]) / win)))


def to_working_level(audio: np.ndarray) -> np.ndarray:
    """Same loudest-moment level for every effect, with the peak kept clear of the top."""
    loud = loudest_window_db(audio)
    if not np.isfinite(loud):
        return audio
    out = audio * db_to_gain(WORKING_LEVEL_DB - loud)
    peak = float(np.max(np.abs(out)))
    ceiling = db_to_gain(WORKING_PEAK_DB)
    return out * (ceiling / peak) if peak > ceiling else out


def make(name: str, seconds: float | None = None, seed: int = 0, overrides: Path | None = SFX_OVERRIDES) -> np.ndarray:
    """One effect as 48 kHz stereo at the working level. The same name and seed always give
    the same sound. A file in the overrides folder wins over the made sound."""
    effect = resolve(name)
    found = find_override(overrides, effect.name) if overrides else None
    if found:
        audio = read_audio(found)
        if seconds and effect.ambient and len(audio) < _n(seconds):
            audio = np.tile(audio, (int(np.ceil(_n(seconds) / len(audio))), 1))
        if seconds:
            audio = fade(audio[: _n(seconds)], 0.0, min(0.3, seconds / 4))
        return to_working_level(audio)
    length = seconds if seconds and (effect.ambient or effect.name == "footsteps") else effect.seconds
    rng = np.random.default_rng([zlib.crc32(effect.name.encode()), seed])
    audio = effect.make(rng, float(length))
    # A short fade at each end so no effect starts or stops with a click.
    return to_working_level(fade(audio, 0.001, min(0.02, length / 10)))


def reel(out_dir: Path) -> dict:
    """Every effect in turn with a gap between, as one file to listen to, plus each on its own."""
    out_dir = Path(out_dir)
    each_dir = out_dir / "sfx"
    gap = np.zeros((_n(0.7), 2))
    parts: list[np.ndarray] = [np.zeros((_n(0.3), 2))]
    index = []
    cursor = 0.3
    for name, effect in EFFECTS.items():
        clip = make(name, seconds=3.0 if effect.ambient else None)
        single, report = master(np.concatenate([np.zeros((_n(0.05), 2)), clip, np.zeros((_n(0.05), 2))]))
        if not effect.ambient:
            # A sound shorter than the meter's window is judged by its peak alone.
            report["onTarget"] = bool(report["truePeakDb"] <= -1.0 + 0.05 and not report["clipped"])
        write_wav(each_dir / f"{name}.wav", single)
        index.append(
            {
                "name": name,
                "description": effect.description,
                "ambient": effect.ambient,
                "seconds": round(len(clip) / SR, 2),
                "startsAtSec": round(cursor, 2),
                "file": f"sfx/{name}.wav",
                "truePeakDb": report["truePeakDb"],
                "clipped": report["clipped"],
            }
        )
        parts += [clip, gap]
        cursor += (len(clip) + len(gap)) / SR
    audio, report = master(np.concatenate(parts))
    wav = write_wav(out_dir / "sfx-reel.wav", audio)
    write_mp3(wav)
    result = {"file": "sfx-reel.mp3", "seconds": round(len(audio) / SR, 2), **report, "effects": index}
    (out_dir / "sfx-reel.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list", help="name every effect")
    p_render = sub.add_parser("render", help="write one effect to a WAV file")
    p_render.add_argument("--name", required=True)
    p_render.add_argument("--out", type=Path, required=True)
    p_render.add_argument("--seconds", type=float)
    p_render.add_argument("--seed", type=int, default=0)
    p_reel = sub.add_parser("reel", help="every effect in one file to listen to")
    p_reel.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(argv)
    if args.cmd == "list":
        for e in EFFECTS.values():
            print(f"{e.name:<14}{'bed ' if e.ambient else '    '}{e.description}")
    elif args.cmd == "render":
        audio = make(args.name, args.seconds, args.seed)
        write_wav(args.out, audio)
        print(f"{args.out}: {len(audio) / SR:.2f} s, {level_report(audio)['truePeakDb']} dB peak")
    else:
        result = reel(args.out)
        print(
            f"{args.out / result['file']}: {len(result['effects'])} effects, {result['seconds']} s, "
            f"{result['lufs']} LUFS, true peak {result['truePeakDb']} dB"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
