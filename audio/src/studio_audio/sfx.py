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
    # Each take a little higher or lower, so a run of pops is not one sound over and over.
    k = rng.uniform(0.85, 1.18)
    tone = _sine_sweep(320 * k, 1150 * k, n, curve=3.0) * _decay(n, 0.07)
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


def _thump(rng: np.random.Generator, weight: float, pitch: float, knock_level: float = 0.55) -> np.ndarray:
    """One thump of a heart. A phone plays almost nothing below 200 Hz, so it has a soft knock
    in the middle range as well as its low body."""
    n = _n(0.24)
    body = _sine_sweep(118 * pitch, 46 * pitch, n, curve=2.0) * _decay(n, 0.085)
    knock = _band(rng, n, "bandpass", (170, 520)) * _decay(n, 0.04) * knock_level
    return _pan((body + knock) * _attack(n, 0.004) * weight, 0.0)


def _heartbeat(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A heart pounding in the ears, about 76 beats a minute: a heavy first thump and a lighter
    second one."""
    total = _n(seconds)
    beat = 60.0 / 76.0
    pieces = []
    for i in range(max(1, int(np.ceil(seconds / beat)))):
        for delay, weight, pitch in ((0.0, 1.0, 1.0), (0.27, 0.62, 1.18)):
            thump = _thump(rng, weight, pitch)
            at = _n(i * beat + delay + rng.uniform(-0.008, 0.008) + 0.05)
            if at + len(thump) <= total:
                pieces.append((at, thump))
    return fade(_place(total, pieces), 0.0, min(0.2, seconds / 6))


RISING_BEATS = (62.0, 132.0)
"""Beats a minute at the start and at the end of the heartbeat that speeds up."""


def _heartbeat_rising(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """The same heart speeding up over its whole length, from a slow beat to more than twice
    as fast, each thump a little harder than the one before: the moment of deciding."""
    total = _n(seconds)
    slow, fast = RISING_BEATS
    pieces = []
    t = 0.05
    while t < seconds:
        u = t / seconds
        gap = 60.0 / (slow + (fast - slow) * u**1.3)
        hard = 0.55 + 0.45 * u
        for delay, weight, pitch in ((0.0, 1.0, 1.0), (min(0.27, 0.36 * gap), 0.62, 1.18)):
            # More knock than the steady heart: this one has to carry a scene on a phone.
            thump = _thump(rng, weight * hard, pitch * (1 + 0.12 * u), 1.1)
            at = _n(t + delay + rng.uniform(-0.006, 0.006))
            if at + len(thump) <= total:
                pieces.append((at, thump))
        t += gap
    return _place(total, pieces)


def _rain(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """Steady rain on a street: a soft hiss that swells and thins, with a patter of single drops."""
    n = _n(seconds)
    sides = []
    for _ in range(2):
        swell = 0.75 + 0.25 * _smooth_random(rng, n, 0.3)
        hiss = _band(rng, n, "bandpass", (1400, 7500)) * swell
        low = _band(rng, n, "bandpass", (300, 900)) * 0.35
        patter = np.zeros(n)
        for at in rng.integers(0, max(1, n - _n(0.02)), size=int(seconds * 26)):
            m = _n(0.012)
            patter[at : at + m] += _band(rng, m, "highpass", 2200) * _decay(m, 0.003) * rng.uniform(0.6, 1.6)
        sides.append(hiss + low + patter)
    return fade(np.stack(sides, axis=1), 0.4, 0.6)


def _tick(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A clock ticking, two ticks a second: a tick, then a tock a little lower. Dry and small:
    the knock of a small case with a snap on top, gone in under a tenth of a second with
    nothing ringing after it. All of it sits above 1 kHz, where a phone plays well."""
    total = _n(seconds)
    gap = 0.5
    n = _n(0.09)
    t = np.arange(n) / SR
    pieces = []
    for i in range(max(1, int(np.ceil(seconds / gap)))):
        pitch, weight = (1.0, 1.0) if i % 2 == 0 else (0.8, 0.85)
        snap = _band(rng, n, "bandpass", (2400 * pitch, 6500 * pitch)) * _decay(n, 0.008) * 0.4
        knock = np.sin(2 * np.pi * 1500 * pitch * t) * _decay(n, 0.07)
        knock += np.sin(2 * np.pi * 2450 * pitch * t) * _decay(n, 0.04) * 0.5
        at = _n(i * gap + 0.04)
        if at + n <= total:
            pieces.append((at, _pan((snap + knock) * _attack(n, 0.0005) * weight, 0.0)))
    return _place(total, pieces)


_CLAPPERS = 44


def _applause(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A studio audience clapping: many pairs of hands, each a short burst of noise with its
    own pitch and pace, spread from left to right, over the blur of the hands further back.
    They join in over the first part and drop out one by one towards the end, so the wash
    swells in and thins out. No voices."""
    n = _n(seconds)
    u = np.linspace(0, 1, n)
    out = np.zeros((n, 2))
    clapping = np.zeros(n)
    for _ in range(_CLAPPERS):
        pace = rng.uniform(2.8, 4.8)
        ring = _n(rng.uniform(0.03, 0.07))
        shape = _decay(ring, ring / SR)
        first, last = rng.uniform(0.0, 0.22) * seconds, rng.uniform(0.55, 1.0) * seconds
        clapping[int(first * SR) : int(last * SR)] += 1.0 / _CLAPPERS
        hits = np.zeros(n)
        at = first
        while at < last:
            i = int(at * SR)
            m = min(ring, n - i)
            if m > 0:
                hits[i : i + m] += shape[:m] * rng.uniform(0.7, 1.15)
            at += rng.uniform(0.88, 1.12) / pace
        centre = rng.uniform(900, 2600)
        clap = _filter(_noise(rng, n) * hits, "bandpass", (centre * 0.7, centre * 1.45))
        out += _pan(clap * rng.uniform(0.45, 1.0), rng.uniform(-0.9, 0.9))
    near = float(np.sqrt(np.mean(out**2))) + 1e-12
    far = np.stack([_band(rng, n, "bandpass", (800, 4200)) for _ in range(2)], axis=1)
    out += far * (clapping * (0.75 + 0.25 * _smooth_random(rng, n, 3.0)))[:, None] * (0.8 * near / 0.707)
    # A few claps landing together must not stand far out of the wash: the tallest spikes are
    # rounded off, so the level of the whole does not hang on one of them.
    top = 6 * float(np.sqrt(np.mean(out**2))) + 1e-12
    out = np.tanh(out / top) * top
    swell = np.interp(u, [0.0, 0.2, 0.6, 1.0], [0.3, 1.0, 1.0, 0.3])
    return fade(out * swell[:, None], 0.4, 0.6)


def _drumroll(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A snare drum roll that builds and then stops dead: strokes that come faster and harder,
    each the knock of the drum head with the rattle of the wires under it, over the steady
    buzz of the wires. The wires ring from one stroke into the next, so it is one roll and not
    a row of taps. After the last and hardest stroke the drum is stopped at once: nothing rings
    on and there is no crash. The head is low, so the wires and a knock in the middle range
    carry it on a phone."""
    total = _n(seconds)
    n = _n(0.2)
    t = np.arange(n) / SR
    last = max(0.1, seconds - 0.09)
    times = [0.02]
    while times[-1] < last:
        times.append(times[-1] + rng.uniform(0.95, 1.05) / (15 + 14 * times[-1] / last))
    roll = np.zeros(total)
    for i, at in enumerate(np.array(times) * (last / times[-1])):
        u = at / last
        pitch, hand = (1.0, 1.0) if i % 2 == 0 else (1.04, 0.86)
        head = _sine_sweep(250 * pitch, 185 * pitch, n, curve=2.0) * _decay(n, 0.07) * 0.7
        head += np.sin(2 * np.pi * 330 * pitch * t) * _decay(n, 0.05) * 0.35
        wires = _band(rng, n, "bandpass", (1500, 7000)) * _decay(n, 0.18) * 0.8
        knock = _band(rng, n, "bandpass", (350, 1100)) * _decay(n, 0.035) * 0.6
        loud = (0.3 + 0.7 * u**1.5) * hand * rng.uniform(0.92, 1.08)
        start = int(at * SR)
        end = min(total, start + n)
        roll[start:end] += ((head + wires + knock) * _attack(n, 0.001) * loud)[: end - start]
    build = 0.3 + 0.7 * np.linspace(0, 1, total) ** 1.5
    buzz = _band(rng, total, "bandpass", (1800, 6500)) * build * 0.1
    return fade(_pan(roll + buzz, 0.0), 0.0, min(0.06, seconds / 10))


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
    k = rng.uniform(0.88, 1.14)
    plip = _sine_sweep(620 * k, 1750 * k, n, curve=2.5) * _decay(n, 0.09)
    tail = np.sin(2 * np.pi * 1750 * k * np.arange(n) / SR) * _decay(n, 0.16) * 0.15
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


def _clunk(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A heavy metal latch going home: the bolt slides, then stops hard and rings for a moment.
    A door locked, a switch thrown, a lid shut."""
    n = _n(seconds)
    t = np.arange(n) / SR

    def knock(weight: float, pitch: float) -> np.ndarray:
        body = _sine_sweep(210 * pitch, 95 * pitch, n, curve=2.0) * _decay(n, 0.1)
        ring = np.zeros(n)
        for freq, level, length in ((412, 1.0, 0.22), (733, 0.7, 0.16), (1190, 0.5, 0.11), (1870, 0.3, 0.07)):
            ring += np.sin(2 * np.pi * freq * pitch * t + rng.uniform(0, 6.28)) * level * _decay(n, length)
        strike = _band(rng, n, "bandpass", (900, 5000)) * _decay(n, 0.012) * 0.8
        return (body * 0.9 + ring * 0.5 + strike) * _attack(n, 0.001) * weight

    slide = _n(0.09)
    out = knock(0.4, 1.25)
    out[slide:] += knock(1.0, 1.0)[: n - slide]
    return _pan(out, 0.0)


def _boom(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A deep blow with a long dark tail: the moment everything turns. The low body is felt on
    good speakers; a phone plays the knock and the rumble in the middle range."""
    n = _n(seconds)
    body = _sine_sweep(96, 38, n, curve=2.5) * _decay(n, seconds * 0.7)
    # The same fall an octave up, and a knock: what a small speaker can play of it.
    over = _sine_sweep(300, 205, n, curve=2.5) * _decay(n, seconds * 0.45) * 0.5
    knock = _band(rng, n, "bandpass", (180, 640)) * _decay(n, 0.22) * 1.5
    swell = 0.6 + 0.4 * _smooth_random(rng, n, 9)
    rumble = _band(rng, n, "bandpass", (200, 420)) * _decay(n, seconds * 0.55) * 0.7 * swell
    air = _band(rng, n, "highpass", 2400) * _decay(n, 0.03) * 0.25
    return fade(_pan((body + over + knock + rumble + air) * _attack(n, 0.004), 0.0), 0.0, seconds * 0.3)


def _thunder(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """Thunder in a storm (made for the bridge and torch thriller, 2026-10-15): a crack, then a
    rumble that rolls in waves and dies away. The low roll is felt on good speakers; a phone
    plays the crack and the rumble in the middle range."""
    n = _n(seconds)
    crack = _band(rng, n, "highpass", 1800) * _decay(n, 0.06) * 0.9
    snap = _band(rng, n, "bandpass", (400, 2400)) * _decay(n, 0.35) * 0.8
    rolls = 0.35 + 0.65 * np.clip(_smooth_random(rng, n, 2.2), 0, 1)
    swell = np.minimum(1.0, np.arange(n) / _n(0.25))
    low = _band(rng, n, "lowpass", 160) * _decay(n, seconds * 0.55) * 1.3 * rolls * swell
    mid = _band(rng, n, "bandpass", (160, 520)) * _decay(n, seconds * 0.45) * 0.8 * rolls * swell
    out = crack + snap + low + mid
    left = out
    right = np.roll(out, _n(0.012)) * 0.9 + _band(rng, n, "bandpass", (160, 520)) * _decay(n, seconds * 0.4) * 0.15
    return fade(np.stack([left, right], axis=1) * _attack(n, 0.003)[:, None], 0.0, seconds * 0.35)


def _hum(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """The hum of one bare bulb in an empty room: a low electric note with a faint fizz on top,
    never quite steady. It is what silence sounds like in a closed room."""
    n = _n(seconds)
    t = np.arange(n) / SR
    sides = []
    for detune in (-0.15, 0.15):
        waver = 0.75 + 0.25 * _smooth_random(rng, n, 0.7)
        tone = np.zeros(n)
        for k, level in ((1, 0.2), (2, 0.6), (4, 0.8), (6, 0.55), (8, 0.3), (10, 0.15)):
            tone += level * np.sin(2 * np.pi * 60.0 * k * (1 + detune / 100) * t + rng.uniform(0, 6.28))
        fizz = _band(rng, n, "bandpass", (3200, 6800)) * 0.05 * (0.5 + 0.5 * _smooth_random(rng, n, 5))
        sides.append(tone * waver + fizz)
    return fade(np.stack(sides, axis=1), 0.4, 0.5)


def _rewind(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A tape rewinding: a whirring warble that speeds up and rises, rushes, then slows and stops
    with a click (the rewind of the game theory stories, 2026-10-18)."""
    n = _n(seconds)
    u = np.linspace(0, 1, n)
    speed = np.sin(np.pi * u) ** 1.2
    # The spinning reel: a buzz whose pitch follows the speed, with its harmonics.
    f = 90 + 520 * speed
    phase = 2 * np.pi * np.cumsum(f) / SR
    reel = sum(level * np.sin(k * phase) for k, level in ((1, 0.5), (2, 0.35), (3, 0.22), (5, 0.12)))
    reel *= 1 + 0.25 * np.sin(2 * np.pi * 7 * u * seconds)
    hiss = _swept_band(_noise(rng, n), 600 + 3800 * speed, 2.2) * 0.35
    body = (reel * 0.6 + hiss) * (0.15 + 0.85 * speed)
    body = _filter(body, "lowpass", 6500)
    click_n = _n(0.06)
    click = _band(rng, click_n, "highpass", 1500) * _decay(click_n, 0.01) * 1.2
    return _place(n, [(0, _pan(body, 0.0)), (n - click_n, _pan(click, 0.0))])


# ------------------------------------------------------------------ places (2026-10-20)
# Biku, 2026-10-20: "we need more background sounds that's according to the story and whatever
# these story needs". Each is the sound of a place, to run under a scene set there.


def _bubble(rng: np.random.Generator, size: float) -> np.ndarray:
    """One bubble: a short note that rises as it leaves, smaller bubbles higher."""
    n = _n(0.05 + 0.04 * size)
    f0 = 380 / size * rng.uniform(0.85, 1.2)
    return _sine_sweep(f0, f0 * 2.2, n, curve=1.6) * _decay(n, 0.045 + 0.03 * size) * _attack(n, 0.002)


def _river(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A river running over stones: a rushing hiss that churns, and water babbling on top."""
    n = _n(seconds)
    sides = []
    for _ in range(2):
        churn = 0.6 + 0.4 * _smooth_random(rng, n, 7.0)
        rush = _band(rng, n, "bandpass", (250, 2200)) * churn
        sparkle = _band(rng, n, "bandpass", (2500, 6000)) * 0.25 * _smooth_random(rng, n, 11.0)
        pieces = []
        for _k in range(int(seconds * 9)):
            b = _bubble(rng, rng.uniform(0.5, 1.6)) * rng.uniform(0.2, 0.5)
            pieces.append((int(rng.integers(0, max(1, n - len(b)))), b))
        babble = np.zeros(n)
        for at, b in pieces:
            babble[at : at + len(b)] += b[: n - at]
        sides.append(rush + sparkle + babble)
    return fade(np.stack(sides, axis=1), 0.5, 0.6)


def _waves(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """The sea on a shore: a wave gathers, breaks into a hiss of foam and draws back, every few
    seconds."""
    n = _n(seconds)
    t = np.arange(n) / SR
    sides = []
    for side in range(2):
        swell = np.zeros(n)
        at = rng.uniform(-2.0, 0.5)
        while at < seconds:
            period = rng.uniform(4.5, 7.0)
            u = (t - at) / period
            inside = (u >= 0) & (u < 1)
            shape = np.where(inside, np.sin(np.pi * np.clip(u, 0, 1) ** 0.6) ** 2, 0.0)
            swell += shape * rng.uniform(0.7, 1.0)
            at += period * rng.uniform(0.75, 0.95)
        foam = _band(rng, n, "bandpass", (700, 5200)) * swell
        body = _band(rng, n, "bandpass", (180, 700)) * (0.35 + 0.65 * swell)
        sides.append(foam * 0.8 + body * 0.6 + _band(rng, n, "lowpass", 300) * 0.15 * (side + 0.5))
    return fade(np.stack(sides, axis=1), 0.6, 0.8)


def _underwater(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """Under the water: a deep muffled hush that slowly moves, and bubbles rising past."""
    n = _n(seconds)
    sides = []
    for _ in range(2):
        drift = 0.6 + 0.4 * _smooth_random(rng, n, 0.4)
        hush = _band(rng, n, "bandpass", (200, 560)) * drift
        murk = _swept_band(_noise(rng, n), 260 + 160 * _smooth_random(rng, n, 0.3), 3.0) * 0.08
        bubbles = np.zeros(n)
        for _k in range(int(seconds * 5)):
            b = _bubble(rng, rng.uniform(0.6, 1.4)) * rng.uniform(0.3, 0.7)
            at = int(rng.integers(0, max(1, n - len(b))))
            bubbles[at : at + len(b)] += b[: n - at]
        sides.append(hush + murk + bubbles * 0.9)
    return fade(np.stack(sides, axis=1), 0.5, 0.6)


def _chirp(rng: np.random.Generator, kind: int) -> np.ndarray:
    """One bird's call: a few quick whistles that slide, each bird in its own way."""
    notes = []
    base = rng.uniform(2600, 4800)
    for _k in range(int(rng.integers(2, 6))):
        n = _n(rng.uniform(0.04, 0.11))
        f0 = base * rng.uniform(0.85, 1.15)
        f1 = f0 * (rng.uniform(1.2, 1.6) if kind % 2 else rng.uniform(0.65, 0.85))
        notes.append(_sine_sweep(f0, f1, n, curve=1.4) * np.sin(np.linspace(0, np.pi, n)) ** 1.5)
        notes.append(np.zeros(_n(rng.uniform(0.03, 0.08))))
    return np.concatenate(notes)


def _birds(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A garden or a park by day: birds calling here and there over a soft breath of air."""
    n = _n(seconds)
    pieces = []
    t = rng.uniform(0.1, 0.5)
    while t < seconds - 0.3:
        call = _chirp(rng, int(rng.integers(0, 4))) * rng.uniform(0.25, 0.7)
        pieces.append((_n(t), _pan(call, rng.uniform(-0.8, 0.8))))
        t += rng.uniform(0.35, 1.2)
    air = np.stack([_band(rng, n, "bandpass", (300, 1500)) * 0.07 for _ in range(2)], axis=1)
    return fade(_place(n, pieces) + air, 0.3, 0.4)


def _night(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A warm night outside: crickets chirping in pulses, near and far, over a still hush."""
    n = _n(seconds)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for k in range(5):
        carrier = np.sin(2 * np.pi * rng.uniform(4200, 5200) * t)
        pulses = (np.sin(2 * np.pi * rng.uniform(28, 36) * t) > 0.2).astype(float)
        period = rng.uniform(0.45, 0.9)
        gate = ((t + rng.uniform(0, period)) % period) < period * rng.uniform(0.25, 0.4)
        near = rng.uniform(0.25, 1.0)
        cricket = _filter(carrier * pulses * gate, "bandpass", (3500, 6500)) * near
        out += _pan(cricket, rng.uniform(-0.9, 0.9)) * (0.6 if k else 1.0)
    hush = np.stack([_band(rng, n, "bandpass", (200, 900)) * 0.05 for _ in range(2)], axis=1)
    return fade(out + hush, 0.4, 0.5)


def _traffic(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A town street: a low rumble of traffic, and now and then a car passing from one side to
    the other."""
    n = _n(seconds)
    rumble = np.stack(
        [_band(rng, n, "bandpass", (220, 900)) * (0.6 + 0.3 * _smooth_random(rng, n, 0.3)) for _ in range(2)],
        axis=1,
    ) * 0.5
    pieces = []
    t = rng.uniform(0.0, 1.5)
    while t < seconds:
        m = _n(rng.uniform(2.2, 3.4))
        u = np.linspace(0, 1, m)
        loud = np.exp(-((u - 0.5) ** 2) / 0.03)
        tone = _swept_band(_noise(rng, m), 900 - 450 * u, 1.6) * 0.5 + _band(rng, m, "bandpass", (250, 700)) * 0.6
        way = 1 if rng.random() < 0.5 else -1
        pieces.append((_n(t), _pan(tone * loud * rng.uniform(0.6, 1.0), way * (2 * u - 1) * 0.9)))
        t += rng.uniform(1.6, 3.5)
    return fade(rumble + _place(n, pieces), 0.5, 0.6)


def _clink(rng: np.random.Generator, size: float) -> np.ndarray:
    """A cup on a saucer or a spoon on a glass: a few bright notes that do not agree, short."""
    n = _n(0.35)
    t = np.arange(n) / SR
    tone = np.zeros(n)
    base = rng.uniform(1800, 3200) / size
    for ratio, level in ((1.0, 1.0), (2.32, 0.6), (4.25, 0.35), (6.1, 0.2)):
        tone += np.sin(2 * np.pi * base * ratio * t + rng.uniform(0, 6.28)) * level * _decay(n, 0.25 / ratio**0.5)
    tick = _band(rng, n, "highpass", 3000) * _decay(n, 0.006) * 0.4
    return (tone + tick) * _attack(n, 0.001)


def _cafe(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A café: people talking quietly at their tables, cups and spoons clinking now and then."""
    n = _n(seconds)
    talk = _crowd(rng, seconds) * 0.55
    pieces = []
    t = rng.uniform(0.2, 0.9)
    while t < seconds - 0.4:
        pieces.append((_n(t), _pan(_clink(rng, rng.uniform(0.8, 1.3)) * rng.uniform(0.2, 0.5), rng.uniform(-0.8, 0.8))))
        t += rng.uniform(0.5, 1.8)
    return fade(talk + _place(n, pieces), 0.4, 0.5)


def _home(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A quiet house: the low hum of the fridge, the air of the room, and a clock ticking softly
    in another room."""
    n = _n(seconds)
    t = np.arange(n) / SR
    fridge = sum(level * np.sin(2 * np.pi * 50.0 * k * t + rng.uniform(0, 6.28)) for k, level in ((2, 0.3), (4, 0.25), (6, 0.12)))
    fridge = fridge * (0.8 + 0.2 * _smooth_random(rng, n, 0.2)) * 0.25
    air = _band(rng, n, "bandpass", (300, 2400)) * 0.05
    ticks = np.zeros(n)
    m = _n(0.05)
    for i in range(int(seconds / 1.0) + 1):
        at = _n(0.3 + i * 1.0)
        if at + m < n:
            tick = _band(rng, m, "bandpass", (2200, 5200)) * _decay(m, 0.02) * (0.25 if i % 2 else 0.2)
            ticks[at : at + m] += tick
    mono = fridge + air + ticks
    return fade(np.stack([mono, np.roll(mono, _n(0.004)) * 0.95], axis=1), 0.4, 0.5)


def _office(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """An office: the steady air of the building, and keyboards tapping in bursts around the room."""
    n = _n(seconds)
    air = np.stack([_band(rng, n, "bandpass", (250, 1800)) * 0.1 for _ in range(2)], axis=1)
    pieces = []
    t = rng.uniform(0.0, 0.6)
    while t < seconds - 0.3:
        pan = rng.uniform(-0.8, 0.8)
        burst = rng.uniform(0.6, 2.0)
        k = t
        while k < min(seconds - 0.05, t + burst):
            m = _n(0.025)
            key = _band(rng, m, "bandpass", (1500, 6000)) * _decay(m, 0.01) * rng.uniform(0.15, 0.35)
            pieces.append((_n(k), _pan(key, pan)))
            k += rng.uniform(0.07, 0.18)
        t += burst + rng.uniform(0.3, 1.2)
    return fade(air + _place(n, pieces), 0.4, 0.5)


def _phone_ring(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A phone ringing: two quick warbling rings and a pause, then again."""
    n = _n(seconds)
    t = np.arange(n) / SR
    warble = np.where(np.sin(2 * np.pi * 18 * t) > 0, 1.0, 0.0)
    lift = rng.uniform(0.94, 1.06)
    tone = np.sin(2 * np.pi * 1250 * lift * t) * warble + np.sin(2 * np.pi * 1550 * lift * t) * (1 - warble)
    on = (((t % 1.6) < 0.45) | (((t % 1.6) > 0.55) & ((t % 1.6) < 1.0))).astype(float)
    on = _filter(on, "lowpass", 200, order=1)
    return _pan(_filter(tone * on * 0.8, "bandpass", (700, 4000)), 0.15)


def _knock(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """Three knocks on a wooden door."""
    n = _n(seconds)
    pieces = []
    for i, at in enumerate((0.03, 0.24, 0.45)):
        m = _n(0.16)
        body = _band(rng, m, "bandpass", (180, 900)) * _decay(m, 0.07)
        tap = _band(rng, m, "bandpass", (1200, 3500)) * _decay(m, 0.012) * 0.5
        pieces.append((_n(at), _pan((body + tap) * _attack(m, 0.001) * (1.0 if i < 2 else 1.1), 0.0)))
    return _place(n, pieces)


def _splash(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """Something going into water: a slap, a burst of spray, drops falling back."""
    n = _n(seconds)
    slap = _band(rng, n, "bandpass", (300, 2400)) * _decay(n, 0.08)
    spray = _band(rng, n, "bandpass", (1800, 8000)) * _decay(n, seconds * 0.35) * 0.7
    drops = np.zeros(n)
    for _k in range(18):
        b = _bubble(rng, rng.uniform(0.4, 1.0)) * rng.uniform(0.2, 0.5)
        at = int(rng.integers(_n(0.08), max(_n(0.09), n - len(b))))
        drops[at : at + len(b)] += b[: n - at]
    mono = (slap + spray + drops) * _attack(n, 0.002)
    return np.stack([mono, np.roll(mono, _n(0.007)) * 0.9], axis=1)


def _paper(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A page turned or a note unfolded: a dry crackling rustle."""
    n = _n(seconds)
    u = np.linspace(0, 1, n)
    swell = np.sin(np.pi * u) ** 0.8
    crackle = (rng.random(n) < 0.004).astype(float)
    crackle = _filter(crackle, "bandpass", (2500, 7000)) * 6
    rustle = _band(rng, n, "bandpass", (1800, 7500)) * (0.4 + 0.6 * _smooth_random(rng, n, 30))
    return _pan((rustle + crackle) * swell, 0.1)


def _coins(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A handful of coins set down: a quick run of small metal clinks."""
    n = _n(seconds)
    pieces = []
    t = 0.02
    for _k in range(int(rng.integers(5, 8))):
        pieces.append((_n(t), _pan(_clink(rng, rng.uniform(0.55, 0.8)) * rng.uniform(0.5, 1.0), rng.uniform(-0.3, 0.3))))
        t += rng.uniform(0.04, 0.12)
    return _place(n, pieces)


def _bubbles(rng: np.random.Generator, seconds: float) -> np.ndarray:
    """A breath let go under water: a rush of bubbles rising and gone."""
    n = _n(seconds)
    pieces = []
    for _k in range(26):
        b = _bubble(rng, rng.uniform(0.4, 1.3)) * rng.uniform(0.3, 0.9)
        at = int(min(n - len(b) - 1, abs(rng.normal(0.25, 0.22)) * SR))
        pieces.append((max(0, at), _pan(b, rng.uniform(-0.5, 0.5))))
    return _place(n, pieces)


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
        Effect("heartbeat", "A heart pounding in the ears: fear, effort, waiting", _heartbeat, 4.0, -15.0, ambient=True),
        Effect("rain", "Steady rain on a street or a roof", _rain, 5.0, -20.0, ambient=True),
        Effect("tick", "A clock ticking, two ticks a second: a countdown, time running out", _tick, 4.0, -15.0, ambient=True),
        Effect("applause", "A studio audience clapping, no voices", _applause, 5.0, -17.0, ambient=True),
        Effect("drumroll", "A snare drum roll that builds and stops dead", _drumroll, 1.8, -9.0),
        Effect("heartbeat-rising", "A heart that speeds up over the whole shot: the moment of deciding", _heartbeat_rising, 6.0, -15.0, ambient=True),
        Effect("clunk", "A heavy metal latch going home: a door locked, a switch thrown", _clunk, 0.6, -6.0),
        Effect("boom", "A deep blow with a long dark tail: the moment everything turns", _boom, 2.4, -5.0),
        Effect("hum", "One bare bulb humming in an empty room: what silence sounds like indoors", _hum, 5.0, -22.0, ambient=True),
        Effect("thunder", "Thunder in a storm: a crack, then a rumble that rolls away", _thunder, 4.0, -7.0),
        Effect("rewind", "A tape rewinding fast, then a click as it stops: time running back", _rewind, 1.45, -9.0),
        Effect("river", "A river running over stones, water babbling", _river, 5.0, -20.0, ambient=True),
        Effect("waves", "The sea on a shore: waves breaking and drawing back", _waves, 6.0, -20.0, ambient=True),
        Effect("underwater", "Under the water: a deep muffled hush and bubbles rising", _underwater, 5.0, -20.0, ambient=True),
        Effect("birds", "A garden or a park by day: birds calling here and there", _birds, 5.0, -21.0, ambient=True),
        Effect("night", "A warm night outside: crickets near and far", _night, 5.0, -22.0, ambient=True),
        Effect("traffic", "A town street: traffic rumbling, cars passing", _traffic, 6.0, -21.0, ambient=True),
        Effect("cafe", "A cafe: quiet talk at the tables, cups and spoons clinking", _cafe, 5.0, -20.0, ambient=True),
        Effect("home", "A quiet house: the fridge humming, a clock ticking in another room", _home, 5.0, -22.0, ambient=True),
        Effect("office", "An office: the building's air and keyboards tapping", _office, 5.0, -21.0, ambient=True),
        Effect("phone-ring", "A phone ringing: two warbling rings and a pause, twice", _phone_ring, 3.2, -9.0),
        Effect("knock", "Three knocks on a wooden door", _knock, 0.7, -6.0),
        Effect("splash", "Something going into water: a slap, spray and drops", _splash, 0.9, -7.0),
        Effect("paper", "A page turned or a note unfolded", _paper, 0.6, -10.0),
        Effect("coins", "A handful of coins set down", _coins, 0.9, -9.0),
        Effect("bubbles", "A breath let go under water: bubbles rising", _bubbles, 1.2, -9.0),
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
    "latch": "clunk",
    "lock": "clunk",
    "bulb-hum": "hum",
    "stream": "river",
    "sea": "waves",
    "ocean": "waves",
    "crickets": "night",
    "street": "traffic",
    "cars": "traffic",
    "coffee": "cafe",
    "house": "home",
    "ring": "phone-ring",
    "phone": "phone-ring",
    "door-knock": "knock",
    "page": "paper",
    "money": "coins",
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
