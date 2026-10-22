"""Music worker: simple mood music written as notes, played by FluidSynth.

Usage:
  uv run python -m studio_audio.music list
  uv run python -m studio_audio.music render --mood tense --seconds 20 --out engine/out/sound/tense.wav
  uv run python -m studio_audio.music samples --out runs/<run>/out

music21 writes the notes to a MIDI file, FluidSynth plays it through the SoundFont, and scipy
adds a held tone under the moods that want one. A track in the project's music/ folder named
after a mood (music/tense.mp3) is used instead of the written one.

This is mood music, not a film score: a chord loop, a bass line, a simple tune and light
percussion. Every note comes from the mood's scale and chords, and the same mood, length and
seed always give the same music.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import zlib
from dataclasses import dataclass, field, replace
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

from .files import read_audio, write_mp3, write_wav
from .levels import SAMPLE_RATE, db_to_gain, fade, loudness, master, set_loudness
from .paths import MUSIC_OVERRIDES, SCRATCH, find_override
from .soundfont import find_soundfont

SR = SAMPLE_RATE
STEM_LUFS = -18.0
"""Every mood comes out at this loudness, so a change of mood is not a change of volume."""
CROSSFADE_S = 1.5
MUSIC_VERSION = 2
"""Raise when the writing changes, so saved renders are made again."""
BEATS = 4

# General MIDI instrument numbers.
PIANO, EPIANO, GLOCK, VIBES, MARIMBA, XYLO = 0, 4, 9, 11, 12, 13
NYLON, STEEL, BASS, FINGER_BASS = 24, 25, 32, 33
CELLO, TREMOLO, PIZZ, HARP, TIMPANI = 42, 44, 45, 46, 47
STRINGS, SLOW_STRINGS, TRUMPET, TUBA, HORN, BRASS = 48, 49, 56, 58, 60, 61
BASSOON, CLARINET, FLUTE, WARM_PAD = 70, 71, 73, 89
# General MIDI drum notes.
KICK, RIM, SNARE, CLAP, HAT, OPEN_HAT, CRASH, TAMB, SHAKER, BLOCK_HI, BLOCK_LO = 36, 37, 38, 39, 42, 46, 49, 54, 70, 76, 77

MAJOR = (0, 2, 4, 5, 7, 9, 11)
MINOR = (0, 2, 3, 5, 7, 8, 10)
LYDIAN = (0, 2, 4, 6, 7, 9, 11)
PHRYGIAN = (0, 1, 3, 5, 7, 8, 10)

QUALITIES = {
    "maj": (0, 4, 7),
    "min": (0, 3, 7),
    "maj7": (0, 4, 7, 11),
    "min7": (0, 3, 7, 10),
    "dom7": (0, 4, 7, 10),
    "sus4": (0, 5, 7),
}

Chord = tuple[int, str]
"""A chord: how many semitones its root is above the key note, and its kind."""
Event = tuple[float, float, list[int], int]
"""A note or chord: when it starts and how long it lasts (in beats), its notes, how hard."""


@dataclass(frozen=True)
class Layer:
    role: str
    """pad, stabs, arp, bass, melody, timpani or drums."""
    program: int = 0
    pattern: str = ""
    velocity: int = 64
    centre: int = 60
    """The note the layer plays around."""
    gate: float = 0.95
    """How much of each note's length it sounds. Short for plucked and bouncy lines."""
    rest: float = 0.0
    """For a melody: how often a note is left out."""
    cells: str = "medium"


@dataclass(frozen=True)
class Drone:
    """A held tone made with scipy under the played music."""

    level_db: float
    octave: int = -2
    colour: str = "dark"


@dataclass(frozen=True)
class Mood:
    name: str
    description: str
    tempo: int
    key: int
    """The key note as a MIDI number near middle C."""
    scale: tuple[int, ...]
    chords: tuple[Chord, ...]
    """One chord per bar, looped."""
    layers: tuple[Layer, ...]
    drone: Drone | None = None
    reverb: float = 0.6
    extra: dict = field(default_factory=dict)


# ------------------------------------------------------------------ a video's own music

PALETTES: dict[str, dict[str, int]] = {
    # Each mood's own instruments.
    "own": {},
    # The body: soft bells and a warm pad, a round bass, like something living.
    "body": {"melody": VIBES, "arp": MARIMBA, "stabs": EPIANO, "pad": WARM_PAD, "bass": FINGER_BASS},
    # Space: a flute over a harp, slow strings, wide and floating.
    "space": {"melody": FLUTE, "arp": HARP, "stabs": GLOCK, "pad": SLOW_STRINGS, "bass": BASS},
    # Water and the sea: harp and flute, flowing.
    "water": {"melody": FLUTE, "arp": HARP, "stabs": VIBES, "pad": SLOW_STRINGS, "bass": FINGER_BASS},
    # Food and fun: plucked strings, a xylophone, a tuba bass.
    "food": {"melody": XYLO, "arp": PIZZ, "stabs": PIZZ, "pad": STRINGS, "bass": TUBA},
    # A mystery: a clarinet, trembling strings, a cello under.
    "mystery": {"melody": CLARINET, "arp": TREMOLO, "stabs": PIZZ, "pad": CELLO, "bass": BASS},
    # Bright everyday: piano and nylon guitar.
    "bright": {"melody": PIANO, "arp": NYLON, "stabs": PIANO, "pad": STRINGS, "bass": FINGER_BASS},
}
"""The instruments a video's music is played on, by role, chosen for its topic (2026-10-21, Biku:
every Short "has the same background sounds"). Drums keep their kit."""


def coloured(mood: Mood, score: dict | None) -> Mood:
    """The mood moved to the video's own key and speed, on its palette's instruments."""
    if not score:
        return mood
    palette = PALETTES.get(str(score.get("palette", "own")), {})
    layers = tuple(
        replace(layer, program=palette.get(layer.role, layer.program)) if layer.role != "drums" else layer
        for layer in mood.layers
    )
    return replace(
        mood,
        key=mood.key + int(score.get("shift", 0)),
        tempo=max(40, int(round(mood.tempo * float(score.get("tempo", 1.0))))),
        layers=layers,
    )


MOODS: dict[str, Mood] = {
    m.name: m
    for m in (
        Mood(
            "tense",
            "Danger close by: a low pulse, trembling strings, a drum that waits",
            96, 62, MINOR,
            ((0, "min"), (0, "min"), (8, "maj"), (7, "maj")),
            (
                Layer("bass", CELLO, "pulse8", 100, 38, 0.6),
                Layer("pad", TREMOLO, "", 64, 58),
                Layer("timpani", TIMPANI, "", 84, 38),
                Layer("melody", HORN, "", 52, 62, 0.95, 0.4, "long"),
            ),
            Drone(-9.0, -2, "dark"),
            0.75,
        ),
        Mood(
            "sorrow",
            "Loss and regret: a slow piano under a cello line",
            58, 57, MINOR,
            ((0, "min"), (8, "maj"), (5, "min"), (7, "maj")),
            (
                Layer("arp", PIANO, "slow8", 72, 57),
                Layer("pad", SLOW_STRINGS, "", 50, 60),
                Layer("melody", CELLO, "", 64, 60, 1.0, 0.25, "long"),
            ),
            Drone(-16.0, -1, "soft"),
            0.8,
        ),
        Mood(
            "hope",
            "Things may turn out well: rising piano, warm strings, a flute",
            84, 60, MAJOR,
            ((0, "maj"), (7, "maj"), (9, "min"), (5, "maj"), (0, "maj"), (7, "maj"), (5, "maj"), (7, "sus4")),
            (
                Layer("arp", PIANO, "updown8", 80, 60),
                Layer("pad", STRINGS, "", 54, 62),
                Layer("bass", BASS, "whole", 72, 36),
                Layer("melody", FLUTE, "", 60, 76, 0.95, 0.15, "medium"),
            ),
            None,
            0.65,
        ),
        Mood(
            "triumph",
            "A win: brass, a marching drum and a trumpet tune",
            112, 62, MAJOR,
            ((0, "maj"), (5, "maj"), (7, "maj"), (0, "maj"), (9, "min"), (5, "maj"), (7, "maj"), (0, "maj")),
            (
                Layer("stabs", BRASS, "fanfare", 70, 60, 0.85),
                Layer("pad", STRINGS, "", 56, 64),
                Layer("bass", TUBA, "half", 96, 38, 0.8),
                Layer("timpani", TIMPANI, "", 96, 38),
                Layer("melody", TRUMPET, "", 108, 72, 0.85, 0.08, "fanfare"),
                Layer("drums", 0, "march", 92),
            ),
            None,
            0.6,
        ),
        Mood(
            "reflective",
            "Thinking it over: soft electric piano and a few vibraphone notes",
            68, 65, MAJOR,
            ((0, "maj7"), (9, "min7"), (5, "maj7"), (7, "sus4")),
            (
                Layer("stabs", EPIANO, "half", 48, 60, 1.0),
                Layer("pad", WARM_PAD, "", 38, 60),
                Layer("bass", BASS, "whole", 50, 41),
                Layer("melody", VIBES, "", 70, 74, 1.0, 0.3, "long"),
            ),
            Drone(-18.0, -1, "soft"),
            0.8,
        ),
        Mood(
            "curious",
            "Something odd to find out: plucked strings and a marimba that pokes about",
            104, 67, LYDIAN,
            ((0, "maj"), (2, "maj"), (9, "min"), (0, "maj"), (0, "maj"), (2, "maj"), (4, "min"), (7, "sus4")),
            (
                Layer("arp", PIZZ, "skip8", 64, 60, 0.5),
                Layer("bass", PIZZ, "oompah", 76, 43, 0.5),
                Layer("melody", MARIMBA, "", 80, 74, 0.6, 0.22, "bouncy"),
                Layer("drums", 0, "tick", 90),
            ),
            None,
            0.5,
        ),
        Mood(
            "upbeat",
            "Good news and energy: strummed guitar, bass, drums and a bright piano tune",
            124, 60, MAJOR,
            ((0, "maj"), (7, "maj"), (9, "min"), (5, "maj")),
            (
                Layer("stabs", STEEL, "strum", 72, 60, 0.8),
                Layer("bass", FINGER_BASS, "pop", 66, 36, 0.85),
                Layer("melody", PIANO, "", 100, 76, 0.85, 0.1, "active"),
                Layer("drums", 0, "pop", 80),
            ),
            None,
            0.4,
        ),
        Mood(
            "calm",
            "Peace and rest: a harp, a soft pad and a little flute",
            66, 67, MAJOR,
            ((0, "maj"), (9, "min"), (5, "maj"), (7, "maj")),
            (
                Layer("arp", HARP, "updown8", 66, 62),
                Layer("pad", WARM_PAD, "", 46, 62),
                Layer("bass", BASS, "whole", 56, 43),
                Layer("melody", FLUTE, "", 42, 79, 1.0, 0.35, "long"),
            ),
            Drone(-20.0, 0, "soft"),
            0.8,
        ),
        Mood(
            "comic",
            "Something silly: an oom-pah tuba and a bassoon with a spring in its step",
            132, 65, MAJOR,
            ((0, "maj"), (7, "dom7"), (7, "dom7"), (0, "maj"), (5, "maj"), (0, "maj"), (7, "dom7"), (0, "maj")),
            (
                Layer("bass", TUBA, "oompah", 90, 41, 0.55),
                Layer("stabs", PIZZ, "offbeat", 70, 62, 0.4),
                Layer("melody", BASSOON, "", 92, 62, 0.6, 0.12, "bouncy"),
                Layer("melody", XYLO, "", 84, 86, 0.5, 0.5, "bouncy"),
                Layer("drums", 0, "comic", 84),
            ),
            None,
            0.4,
        ),
        # Three darker moods, written for the game theory videos: the room, the trap, what stays.
        Mood(
            "unease",
            "Something is wrong and nobody says so: a low held note, far strings, a few lonely piano notes",
            54, 62, PHRYGIAN,
            ((0, "min"), (0, "min"), (1, "maj"), (0, "min")),
            (
                Layer("pad", SLOW_STRINGS, "", 38, 50),
                Layer("bass", CELLO, "whole", 56, 38),
                Layer("melody", PIANO, "", 60, 74, 1.0, 0.5, "long"),
            ),
            Drone(-5.0, -2, "dark"),
            0.9,
        ),
        Mood(
            "closing-in",
            "The trap shuts: a tight plucked figure that will not stop, a drum like a pulse, low strings pressing",
            112, 57, MINOR,
            ((0, "min"), (0, "min"), (8, "maj"), (0, "min"), (0, "min"), (5, "min"), (8, "maj"), (7, "maj")),
            (
                Layer("arp", PIZZ, "skip8", 62, 57, 0.4),
                Layer("bass", CELLO, "pulse8", 94, 33, 0.5),
                Layer("pad", TREMOLO, "", 48, 57),
                Layer("melody", CLARINET, "", 54, 57, 0.95, 0.45, "long"),
                Layer("drums", 0, "heart", 78),
            ),
            Drone(-10.0, -2, "dark"),
            0.6,
        ),
        Mood(
            "aftermath",
            "What is left when it is over: one slow low chord at a time and a cold, high bell line",
            46, 64, MINOR,
            ((0, "min"), (0, "min"), (5, "min"), (0, "min")),
            (
                Layer("stabs", PIANO, "toll", 54, 48, 1.0),
                Layer("bass", CELLO, "whole", 44, 40),
                Layer("melody", GLOCK, "", 44, 79, 1.0, 0.5, "long"),
            ),
            Drone(-8.0, -2, "dark"),
            0.95,
        ),
    )
}

CELLS: dict[str, list[list[float]]] = {
    "long": [[4], [2, 2], [3, 1], [2, 1, 1], [1, 3]],
    "medium": [[1, 1, 2], [1.5, 0.5, 2], [1, 1, 1, 1], [2, 1, 1], [1, 2, 1]],
    "active": [[0.5, 0.5, 1, 0.5, 0.5, 1], [1, 0.5, 0.5, 1, 1], [0.5, 0.5, 0.5, 0.5, 2], [1.5, 0.5, 1, 1]],
    "bouncy": [[0.5, 0.5, 1, 0.5, 0.5, 1], [1, 1, 0.5, 0.5, 1], [0.5, 1, 0.5, 1, 1], [0.5, 0.5, 0.5, 0.5, 1, 1]],
    "fanfare": [[1.5, 0.5, 1, 1], [0.75, 0.25, 1, 2], [1, 0.5, 0.5, 2], [1, 1, 2]],
}
CADENCES: list[list[float]] = [[2, 2], [1, 1, 2], [4]]

ARPS: dict[str, tuple[float, list[int]]] = {
    "updown8": (0.5, [0, 1, 2, 3, 4, 3, 2, 1]),
    "skip8": (0.5, [0, 2, 1, 3, 0, 2, 1, 3]),
    "slow8": (0.5, [0, 1, 2, 3, 2, 1, 2, 1]),
}
STABS: dict[str, list[tuple[float, float, float]]] = {
    # start, length, strength
    "half": [(0, 2, 1.0), (2, 2, 0.85)],
    "offbeat": [(1, 0.5, 1.0), (3, 0.5, 1.0)],
    "strum": [(0, 1, 1.0), (1, 0.5, 0.7), (1.5, 1, 0.9), (2.5, 0.5, 0.7), (3, 0.5, 0.95), (3.5, 0.5, 0.7)],
    "fanfare": [(0, 1.5, 1.0), (1.5, 0.5, 0.8), (2, 1, 0.95), (3, 1, 0.85)],
    "toll": [(0, 4, 1.0)],
}
BASS_LINES: dict[str, list[tuple[float, float, int, float]]] = {
    # start, length, which chord note (0 root, 2 fifth), strength
    "whole": [(0, 4, 0, 1.0)],
    "half": [(0, 2, 0, 1.0), (2, 2, 2, 0.9)],
    "oompah": [(0, 1, 0, 1.0), (2, 1, 2, 0.9)],
    "pulse8": [(i * 0.5, 0.5, 0, 1.0 if i % 4 == 0 else 0.78) for i in range(8)],
    "pop": [(0, 1.5, 0, 1.0), (1.5, 0.5, 0, 0.8), (2, 1, 2, 0.9), (3, 1, 0, 0.85)],
}
DRUMS: dict[str, list[tuple[float, int, float]]] = {
    # start, drum, strength
    "pop": [(0, KICK, 1.0), (2, KICK, 0.95), (2.5, KICK, 0.7), (1, SNARE, 0.95), (3, SNARE, 1.0), (1, CLAP, 0.5), (3, CLAP, 0.5)]
    + [(i * 0.5, HAT, 0.6 if i % 2 == 0 else 0.42) for i in range(8)],
    "march": [(0, KICK, 1.0), (2, KICK, 0.9), (0, SNARE, 0.8), (0.75, SNARE, 0.5), (1, SNARE, 0.9), (2, SNARE, 0.8), (2.5, SNARE, 0.6), (3, SNARE, 0.9), (3.5, SNARE, 0.55), (3.75, SNARE, 0.6)],
    "tick": [(i * 0.5, SHAKER, 0.55 if i % 2 == 0 else 0.4) for i in range(8)] + [(1, RIM, 0.7), (3, RIM, 0.7), (2.5, BLOCK_HI, 0.6)],
    "comic": [(0, KICK, 0.9), (2, KICK, 0.85), (1, HAT, 0.7), (3, HAT, 0.7), (1.5, BLOCK_LO, 0.6), (3.5, BLOCK_HI, 0.75)],
    # A pulse, two close blows and a wait, with a dry tap marking the time between.
    "heart": [(0, KICK, 1.0), (0.5, KICK, 0.7), (2, KICK, 0.95), (2.5, KICK, 0.65), (1, RIM, 0.5), (3, RIM, 0.55), (3.5, RIM, 0.35)],
}


def mood_names() -> list[str]:
    return list(MOODS)


def resolve(name: str) -> Mood:
    if name not in MOODS:
        raise KeyError(f'There is no music mood called "{name}". The moods are: {", ".join(MOODS)}.')
    return MOODS[name]


# ------------------------------------------------------------------ writing the notes


def chord_classes(mood: Mood, chord: Chord) -> list[int]:
    """The chord's notes as pitch classes (0 to 11), root first."""
    root, quality = chord
    return [(mood.key + root + step) % 12 for step in QUALITIES[quality]]


def scale_classes(mood: Mood) -> list[int]:
    return [(mood.key + step) % 12 for step in mood.scale]


def _near(pitch_class: int, centre: int) -> int:
    """The note of that pitch class closest to the centre."""
    base = centre - 6
    return base + (pitch_class - base) % 12


def _voicing(mood: Mood, chord: Chord, centre: int) -> list[int]:
    """The chord's notes gathered round one centre, so chords move by small steps."""
    return sorted({_near(pc, centre) for pc in chord_classes(mood, chord)})


def _ladder(classes: list[int], low: int, high: int) -> list[int]:
    return [n for n in range(low, high + 1) if n % 12 in classes]


def _hard(velocity: int, strength: float, rng: np.random.Generator) -> int:
    return int(np.clip(round(velocity * strength + rng.integers(-4, 5)), 1, 127))


CONTOURS = {0: (0, 2, 4, 1), 1: (0, 2, 4, 2), 2: (5, 3, 2, 0), 3: (0, 2, 4, 1)}
"""Where each bar of a phrase aims, in scale steps above the middle of the range: the first
phrase climbs and falls back, the second ends a step higher, the third starts high and comes
down, and the fourth is the first again."""


def _melody(mood: Mood, layer: Layer, bars: int, rng: np.random.Generator) -> list[Event]:
    """A tune in four-bar phrases: a first phrase, the same again a little changed, a different
    one, and the first once more. Long and strong notes land on notes of the chord and follow
    the phrase's shape; the notes between move by step along the scale. The last bar comes
    home to the key note."""
    scale = _ladder(scale_classes(mood), layer.centre - 8, layer.centre + 9)
    cells = CELLS[layer.cells]
    middle = int(np.argmin([abs(n - layer.centre) for n in scale])) - 2
    events: list[Event] = []
    plans: dict[int, tuple[list[float], list[bool], list[int]]] = {}
    at = middle
    last_strong = -1
    for bar in range(bars):
        chord = chord_classes(mood, mood.chords[bar % len(mood.chords)])
        place, section = bar % 4, (bar // 4) % 4
        if bar == bars - 1:
            home = min(scale, key=lambda n: (n % 12 != mood.key % 12, abs(n - layer.centre)))
            events.append((bar * BEATS, BEATS * layer.gate, [home], _hard(layer.velocity, 0.95, rng)))
            continue
        # The second and fourth phrases reuse the plan of the first; only its last bar is new
        # the second time, so the phrase ends differently.
        reuse = section in (1, 3) and place in plans and not (section == 1 and place == 3)
        if reuse:
            cell, rests, nudges = plans[place]
        else:
            pool = CADENCES if place == 3 else cells
            cell = list(pool[rng.integers(len(pool))])
            rests = [bool(i > 0 and rng.random() < layer.rest) for i in range(len(cell))]
            nudges = [int(rng.integers(-1, 2)) for _ in cell]
            if section == 0:
                plans[place] = (cell, rests, nudges)
        aim = middle + CONTOURS[section][place]
        beat = 0.0
        for i, (length, rest, nudge) in enumerate(zip(cell, rests, nudges)):
            strong = beat in (0.0, 2.0) or length >= 2
            if strong:
                want = aim + nudge
                at = min(
                    range(len(scale)),
                    key=lambda k: (
                        scale[k] % 12 not in chord,
                        abs(k - want) + (3 if k == last_strong else 0) + max(0, abs(k - at) - 4),
                    ),
                )
                last_strong = at
            else:
                # A passing note: one step toward where the bar is aiming, or past it and back.
                direction = 1 if aim + nudge > at else -1 if aim + nudge < at else int(nudge or 1)
                at = int(np.clip(at + direction, 0, len(scale) - 1))
            if not rest:
                events.append(
                    (bar * BEATS + beat, length * layer.gate, [scale[at]], _hard(layer.velocity, 1.0 if strong else 0.86, rng))
                )
            beat += length
            del i
    return events


def _layer_events(mood: Mood, layer: Layer, bars: int, rng: np.random.Generator) -> list[Event]:
    if layer.role == "melody":
        return _melody(mood, layer, bars, rng)
    events: list[Event] = []
    for bar in range(bars):
        last = bar == bars - 1
        chord = (0, "maj" if mood.scale[2] == 4 else "min") if last else mood.chords[bar % len(mood.chords)]
        start = bar * BEATS
        voicing = _voicing(mood, chord, layer.centre)
        classes = chord_classes(mood, chord)
        if layer.role == "pad":
            events.append((start, BEATS * (1.0 if not last else 1.0), voicing, _hard(layer.velocity, 1.0, rng)))
        elif layer.role == "stabs":
            hits = [(0.0, float(BEATS), 1.0)] if last else STABS[layer.pattern]
            for beat, length, strength in hits:
                events.append((start + beat, length * layer.gate, voicing, _hard(layer.velocity, strength, rng)))
        elif layer.role == "arp":
            step, order = ARPS[layer.pattern]
            tones = voicing + [n + 12 for n in voicing]
            if last:
                events.append((start, float(BEATS), voicing, _hard(layer.velocity, 0.9, rng)))
                continue
            for i, index in enumerate(order):
                strength = 1.0 if i % 4 == 0 else 0.82
                events.append((start + i * step, step * layer.gate * 1.6, [tones[index % len(tones)]], _hard(layer.velocity, strength, rng)))
        elif layer.role == "bass":
            line = [(0.0, float(BEATS), 0, 1.0)] if last else BASS_LINES[layer.pattern]
            for beat, length, which, strength in line:
                pc = classes[which % len(classes)]
                events.append((start + beat, length * layer.gate, [_near(pc, layer.centre)], _hard(layer.velocity, strength, rng)))
        elif layer.role == "timpani":
            root = _near(classes[0], layer.centre)
            events.append((start, 1.5, [root], _hard(layer.velocity, 1.0, rng)))
            if bar % 4 == 3 and not last:
                # Two quick strokes on the fifth lead into the next phrase.
                fifth = _near(classes[2 % len(classes)], layer.centre)
                events.append((start + 3, 0.5, [fifth], _hard(layer.velocity, 0.7, rng)))
                events.append((start + 3.5, 0.5, [fifth], _hard(layer.velocity, 0.85, rng)))
        elif layer.role == "drums":
            if last:
                events.append((start, 1.0, [KICK], _hard(layer.velocity, 1.0, rng)))
                events.append((start, 2.0, [CRASH], _hard(layer.velocity, 0.7, rng)))
                continue
            if bar % 8 == 0 and layer.pattern in ("pop", "march"):
                events.append((start, 2.0, [CRASH], _hard(layer.velocity, 0.75, rng)))
            for beat, drum, strength in DRUMS[layer.pattern]:
                events.append((start + beat, 0.25, [drum], _hard(layer.velocity, strength, rng)))
    return events


def compose(mood: Mood, bars: int, seed: int = 0) -> list[tuple[Layer, list[Event]]]:
    """Every layer's notes for the given number of bars. The last bar is a held home chord."""
    out = []
    for i, layer in enumerate(mood.layers):
        rng = np.random.default_rng([zlib.crc32(mood.name.encode()), seed, i])
        out.append((layer, _layer_events(mood, layer, bars, rng)))
    return out


def write_midi(mood: Mood, layers: list[tuple[Layer, list[Event]]], bars: int, path: Path) -> Path:
    from music21 import chord as m21chord
    from music21 import instrument, midi, note, stream, tempo

    score = stream.Score()
    score.insert(0, tempo.MetronomeMark(number=mood.tempo))
    for layer, events in layers:
        part = stream.Part()
        inst = instrument.Instrument()
        if layer.role == "drums":
            inst.midiChannel = 9
        else:
            inst.midiProgram = layer.program
        part.insert(0, inst)
        for start, length, notes, velocity in events:
            item = note.Note(notes[0]) if len(notes) == 1 else m21chord.Chord(notes)
            item.quarterLength = max(0.125, round(length * 8) / 8)
            item.volume.velocity = velocity
            part.insert(round(start * 8) / 8, item)
        if layer is layers[0][0]:
            # A note too quiet to hear, two bars after the end, keeps the player running while
            # the last chord and its echo die away.
            ghost = note.Note(60)
            ghost.quarterLength = 0.25
            ghost.volume.velocity = 1
            part.insert((bars + 2) * BEATS, ghost)
        score.insert(0, part)
    path.parent.mkdir(parents=True, exist_ok=True)
    mf = midi.translate.streamToMidiFile(score)
    mf.open(str(path), "wb")
    mf.write()
    mf.close()
    return path


def play_midi(midi_path: Path, wav_path: Path, reverb: float) -> np.ndarray:
    """FluidSynth turns the MIDI file into sound through the SoundFont."""
    exe = shutil.which("fluidsynth")
    if exe is None:
        raise RuntimeError("FluidSynth is not installed or not on the PATH. Run: npm run doctor")
    cmd = [
        exe, "-ni", "-q",
        "-F", str(wav_path),
        "-r", str(SR),
        "-g", "0.5",
        "-o", f"synth.reverb.room-size={reverb:.2f}",
        "-o", "synth.reverb.level=0.6",
        "-o", "synth.chorus.active=0",
        str(find_soundfont()), str(midi_path),
    ]
    done = subprocess.run(cmd, capture_output=True, text=True, timeout=300, check=False)
    if done.returncode != 0 or not wav_path.is_file():
        raise RuntimeError(f"FluidSynth could not play the music: {(done.stdout + done.stderr).strip()[:400]}")
    return read_audio(wav_path)


def held_tone(mood: Mood, drone: Drone, seconds: float, rng: np.random.Generator) -> np.ndarray:
    """A long quiet tone on the key note and the note a fifth above, slowly swelling. The two
    sides are tuned a hair apart so it drifts instead of sitting still."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    base = 440.0 * 2 ** ((mood.key + 12 * drone.octave - 69) / 12)
    sides = []
    for detune in (-0.12, 0.12):
        tone = np.zeros(n)
        partials = [(1, 1.0), (1.5, 0.45), (2, 0.3)] if drone.colour == "dark" else [(1, 1.0), (1.5, 0.35)]
        if drone.colour == "dark":
            partials += [(3, 0.14), (4.02, 0.08)]
        for ratio, level in partials:
            freq = base * ratio * (1 + detune / 100 * ratio)
            swell = 0.7 + 0.3 * np.sin(2 * np.pi * rng.uniform(0.05, 0.12) * t + rng.uniform(0, 6.28))
            tone += level * swell * np.sin(2 * np.pi * freq * t + rng.uniform(0, 6.28))
        sides.append(tone)
    out = np.stack(sides, axis=1)
    if drone.colour == "dark":
        out = sosfilt(butter(2, 900 / (SR / 2), output="sos"), out, axis=0)
    return fade(out, 1.5, 2.0)


# ------------------------------------------------------------------ rendering


def _cache_key(mood: Mood, seconds: float, seed: int) -> str:
    font = find_soundfont()
    stamp = f"{MUSIC_VERSION}|{mood!r}|{seconds:.3f}|{seed}|{font.name}|{font.stat().st_size}"
    return hashlib.sha256(stamp.encode()).hexdigest()[:20]


def bars_for(mood: Mood, seconds: float) -> int:
    """Whole bars that cover the length, always ending a phrase on the home chord."""
    bar_s = BEATS * 60 / mood.tempo
    return max(2, int(np.ceil(seconds / bar_s)))


def render(
    name: str,
    seconds: float,
    seed: int = 0,
    overrides: Path | None = MUSIC_OVERRIDES,
    use_cache: bool = True,
    score: dict | None = None,
) -> np.ndarray:
    """One mood at the given length: 48 kHz stereo at the stem loudness, faded in and out. With
    a video's score, in its own key, speed and instruments."""
    mood = coloured(resolve(name), score)
    n = int(round(seconds * SR))
    found = find_override(overrides, mood.name) if overrides else None
    if found:
        audio = read_audio(found)
        if len(audio) < n:
            audio = np.tile(audio, (int(np.ceil(n / len(audio))), 1))
        return set_loudness(fade(audio[:n], 0.3, min(2.0, seconds / 4)), STEM_LUFS)
    cache = SCRATCH / "music" / f"{mood.name}-{_cache_key(mood, seconds, seed)}.wav"
    if use_cache and cache.is_file():
        return read_audio(cache)
    bars = bars_for(mood, seconds)
    work = SCRATCH / "work"
    midi_path = work / f"{mood.name}-{seed}.mid"
    wav_path = work / f"{mood.name}-{seed}.wav"
    write_midi(mood, compose(mood, bars, seed), bars, midi_path)
    played = play_midi(midi_path, wav_path, mood.reverb)
    midi_path.unlink(missing_ok=True)
    wav_path.unlink(missing_ok=True)
    # The piece is written in whole bars; a shorter request is cut and faded.
    whole = bars * BEATS * 60 / mood.tempo
    keep = int(min(len(played), max(n, 1)))
    audio = played[:keep]
    if len(audio) < n:
        audio = np.concatenate([audio, np.zeros((n - len(audio), 2))])
    if mood.drone:
        rng = np.random.default_rng([zlib.crc32(mood.name.encode()), seed, 99])
        tone = held_tone(mood, mood.drone, seconds + 0.01, rng)[: len(audio)]
        if len(tone) < len(audio):
            tone = np.concatenate([tone, np.zeros((len(audio) - len(tone), 2))])
        music_level, tone_level = loudness(audio), loudness(tone)
        if np.isfinite(music_level) and np.isfinite(tone_level):
            audio = audio + tone * db_to_gain(music_level + mood.drone.level_db - tone_level)
    tail = 2.0 if seconds < whole - 0.5 else 0.6
    audio = set_loudness(fade(audio, 0.05, min(tail, seconds / 4)), STEM_LUFS)
    if use_cache:
        write_wav(cache, audio)
    return audio


def crossfade(a: np.ndarray, b: np.ndarray, seconds: float = CROSSFADE_S) -> np.ndarray:
    """a, then b, with the end of a and the start of b blended at even loudness."""
    k = min(len(a), len(b), int(seconds * SR))
    if k <= 1:
        return np.concatenate([a, b])
    ramp = np.sin(np.linspace(0, np.pi / 2, k))[:, None]
    blend = a[len(a) - k :] * ramp[::-1] + b[:k] * ramp
    return np.concatenate([a[: len(a) - k], blend, b[k:]])


def arc(segments: list[dict], total_s: float, seed: int = 0, score: dict | None = None) -> np.ndarray:
    """Music for a whole video: each segment names a mood and when it starts (ms). Moods blend
    into each other over a second and a half. A score gives the video its own music."""
    if not segments:
        return np.zeros((int(total_s * SR), 2))
    ordered = sorted(segments, key=lambda s: s["startMs"])
    out: np.ndarray | None = None
    for i, seg in enumerate(ordered):
        start = seg["startMs"] / 1000
        end = ordered[i + 1]["startMs"] / 1000 if i + 1 < len(ordered) else total_s
        last = i + 1 == len(ordered)
        length = max(0.5, end - start + (0 if last else CROSSFADE_S))
        piece = render(seg["mood"], length, seed + i, score=score)
        if out is None:
            lead = np.zeros((int(start * SR), 2))
            out = np.concatenate([lead, piece])
        else:
            out = crossfade(out, piece)
    n = int(total_s * SR)
    assert out is not None
    out = out[:n] if len(out) >= n else np.concatenate([out, np.zeros((n - len(out), 2))])
    return out


def samples(out_dir: Path, seconds: float = 20.0) -> dict:
    """One sample of every mood, mastered for listening, with its measured levels."""
    out_dir = Path(out_dir)
    index = []
    for name, mood in MOODS.items():
        audio, report = master(render(name, seconds))
        wav = write_wav(out_dir / f"music-{name}.wav", audio)
        mp3 = write_mp3(wav)
        wav.unlink()
        index.append({"mood": name, "description": mood.description, "tempo": mood.tempo, "file": mp3.name, "seconds": seconds, **report})
        print(f"  {name:<11}{report['lufs']} LUFS, true peak {report['truePeakDb']} dB", flush=True)
    result = {"moods": index}
    (out_dir / "music-samples.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list", help="name every mood")
    p_render = sub.add_parser("render", help="write one mood to a WAV file")
    p_render.add_argument("--mood", required=True)
    p_render.add_argument("--seconds", type=float, default=20.0)
    p_render.add_argument("--seed", type=int, default=0)
    p_render.add_argument("--out", type=Path, required=True)
    p_samples = sub.add_parser("samples", help="one sample of every mood")
    p_samples.add_argument("--out", type=Path, required=True)
    p_samples.add_argument("--seconds", type=float, default=20.0)
    args = parser.parse_args(argv)
    if args.cmd == "list":
        for m in MOODS.values():
            print(f"{m.name:<11}{m.tempo:>4} bpm  {m.description}")
    elif args.cmd == "render":
        audio = render(args.mood, args.seconds, args.seed)
        write_wav(args.out, audio)
        print(f"{args.out}: {len(audio) / SR:.1f} s, {loudness(audio):.1f} LUFS")
    else:
        result = samples(args.out, args.seconds)
        print(f"{len(result['moods'])} mood samples written to {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
