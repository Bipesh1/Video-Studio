"""Questions that sound like questions.

Kokoro speaks a question with the falling pitch of a statement: measured on six questions in
three voices, the pitch at the end was 3 to 13 semitones below the rest of the sentence, and
no way of writing the question changed that (two question marks, a stress mark, the question
said alone). Biku heard it too (2026-10-13: "i don't feel question vibe from a question").

So the rise is put in afterwards. Praat (through parselmouth) redraws the pitch of the last
word of a question so that it climbs, and rebuilds the sound by overlap-add, which keeps the
voice and the timing as they were. Only a short stretch round that word is touched. How high
it climbs is set against the question's own words, not the few before the last one, which
are already on their way down.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

import numpy as np

# How far above the pitch of the words before it a question ends, in semitones.
RISE_YES_NO = 6.0
RISE_WH = 4.0
"""A question that opens on what, how, why and the like falls in ordinary speech; it gets a
smaller lift, enough to be heard as asked."""
WH = re.compile(r"^(what|how|why|who|whom|whose|where|when|which)\b", re.IGNORECASE)

PITCH_FLOOR, PITCH_CEILING = 60.0, 400.0
LEAD_S = 0.35
"""How much of the sound before the last word is rebuilt with it, so the join is in speech."""
TAIL_S = 0.12
FADE_S = 0.008


@dataclass(frozen=True)
class Question:
    """The last word of one question in a line: when it is said, and how far to lift it."""

    start: float
    end: float
    semitones: float
    since: float = 0.0
    """When the question itself begins: its own words set the level it rises above."""


def questions_in(words: list[tuple[str, float, float]], strength: float = 1.0) -> list[Question]:
    """Find the questions in a spoken line. `words` are its words as written, with their marks
    still on them ("someone?"), and when each is said."""
    found: list[Question] = []
    first = 0
    for i, (text, start, end) in enumerate(words):
        bare = text.strip("*\"')”’")
        if bare.endswith("?") and end > start:
            opener = words[first][0].strip("*\"'(“‘")
            lift = RISE_WH if WH.match(opener) else RISE_YES_NO
            found.append(Question(start, end, lift * strength, words[first][1]))
        if bare.endswith((".", "?", "!", "…")):
            first = i + 1
    return found


def lift(audio: np.ndarray, sr: int, question: Question) -> np.ndarray:
    """The same sound with the end of one question rising. Returns the audio unchanged when
    the word has no pitch to redraw (a whisper, a clipped ending)."""
    import parselmouth  # imported here so the rest of the worker loads without it
    from parselmouth.praat import call

    # The whole question is read, so the rise is measured against its own words and not only
    # the last, already falling ones; only a short stretch round the last word is put back.
    a = max(0, int((min(question.since, question.start - LEAD_S) - 0.05) * sr))
    b = min(len(audio), int((question.end + TAIL_S) * sr))
    if b - a < int(0.1 * sr):
        return audio
    piece = audio[a:b].astype(np.float64)
    t0 = question.start - a / sr
    t1 = min(question.end - a / sr, len(piece) / sr - 0.01)

    sound = parselmouth.Sound(piece, sampling_frequency=sr)
    manipulation = call(sound, "To Manipulation", 0.01, PITCH_FLOOR, PITCH_CEILING)
    tier = call(manipulation, "Extract pitch tier")
    count = int(call(tier, "Get number of points"))
    points = [
        (call(tier, "Get time from index", i), call(tier, "Get value at index", i))
        for i in range(1, count + 1)
    ]
    before = [f for t, f in points if t < t0]
    inside = [f for t, f in points if t0 <= t <= t1]
    if len(before) < 3 or not inside:
        return audio
    level = float(np.median(before))
    # It starts from where the voice already is, and climbs to its mark by the end of the word.
    opening = float(call(tier, "Get value at time", t0))
    top = max(level, opening) * 2 ** (question.semitones / 12)
    call(tier, "Remove points between", t0, len(piece) / sr)
    call(tier, "Add point", t0, opening)
    call(tier, "Add point", t0 + 0.3 * (t1 - t0), opening * (top / opening) ** 0.45)
    call(tier, "Add point", t1, top)
    call(tier, "Add point", len(piece) / sr - 0.001, top)
    call([tier, manipulation], "Replace pitch tier")
    rebuilt = call(manipulation, "Get resynthesis (overlap-add)").values[0]

    out = audio.astype(np.float32).copy()
    # Put back only from a little before the last word to the end of the piece.
    cut = max(0, int((question.start - LEAD_S) * sr) - a)
    n = min(len(rebuilt), b - a)
    new = rebuilt[cut:n].astype(np.float32)
    at = a + cut
    k = min(int(FADE_S * sr), len(new) // 4)
    if k > 0:
        ramp = np.linspace(0.0, 1.0, k, dtype=np.float32)
        new[:k] = out[at : at + k] * (1 - ramp) + new[:k] * ramp
        new[-k:] = new[-k:] * (1 - ramp) + out[at + len(new) - k : at + len(new)] * ramp
    out[at : at + len(new)] = new
    return out


def lift_questions(
    audio: np.ndarray, sr: int, words: list[tuple[str, float, float]], strength: float = 1.0
) -> np.ndarray:
    """A spoken line with every question in it made to rise at its end."""
    for question in questions_in(words, strength):
        audio = lift(audio, sr, question)
    return audio


def pitch_track(audio: np.ndarray, sr: int) -> tuple[np.ndarray, np.ndarray]:
    """Times and pitches (Hz, nan where there is no voice), for measuring a rise."""
    import parselmouth

    pitch = parselmouth.Sound(audio.astype(np.float64), sampling_frequency=sr).to_pitch(
        0.01, PITCH_FLOOR, PITCH_CEILING
    )
    hz = pitch.selected_array["frequency"]
    return pitch.xs(), np.where(hz > 0, hz, np.nan)


def end_rise(audio: np.ndarray, sr: int, start: float, end: float) -> float | None:
    """How far the last third of a word sits above the words before it, in semitones."""
    t, f = pitch_track(audio, sr)
    before = f[(t < start) & ~np.isnan(f)]
    inside = f[(t >= start) & (t <= end + 0.05) & ~np.isnan(f)]
    if len(before) < 5 or len(inside) < 3:
        return None
    tail = inside[-max(3, len(inside) // 3) :]
    return float(12 * np.log2(np.median(tail) / np.median(before)))
