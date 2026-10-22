"""Questions: found in a line, and made to rise at the end without changing anything else."""

import numpy as np

from studio_audio.intonation import (
    RISE_WH,
    RISE_YES_NO,
    end_rise,
    lift_questions,
    questions_in,
)

SR = 24000


def voiced(hertz: np.ndarray) -> np.ndarray:
    """A plain voiced sound that follows the given pitch, one value per sample."""
    phase = 2 * np.pi * np.cumsum(hertz) / SR
    wave = sum(np.sin(k * phase) / k for k in range(1, 9))
    return (0.2 * wave).astype(np.float32)


def falling_line(seconds: float = 1.2, last: float = 0.4) -> np.ndarray:
    """A line said level and then dropping across its last word, the way Kokoro asks."""
    n, tail = int(seconds * SR), int(last * SR)
    hertz = np.full(n, 120.0)
    hertz[-tail:] = np.linspace(120.0, 80.0, tail)
    return voiced(hertz)


WORDS = [("Is", 0.0, 0.4), ("that", 0.4, 0.8), ("smoke?", 0.8, 1.2)]


def test_a_question_is_found_by_its_mark_and_sized_by_how_it_opens():
    asked = questions_in(WORDS)
    assert [(q.start, q.end, q.semitones, q.since) for q in asked] == [(0.8, 1.2, RISE_YES_NO, 0.0)]
    opened = questions_in([("What", 0.0, 0.3), ("now?", 0.3, 0.7)])
    assert opened[0].semitones == RISE_WH
    assert questions_in([("It", 0.0, 0.3), ("is", 0.3, 0.5), ("smoke.", 0.5, 0.9)]) == []


def test_each_question_in_a_line_is_measured_from_its_own_first_word():
    words = [("Easy.", 0.0, 0.4), ("Is", 0.6, 0.8), ('"that"', 0.8, 1.0), ("smoke?”", 1.0, 1.4)]
    (asked,) = questions_in(words, strength=1.5)
    assert (asked.start, asked.since) == (1.0, 0.6)
    assert asked.semitones == RISE_YES_NO * 1.5


def test_a_falling_question_ends_above_the_words_before_it():
    said = falling_line()
    assert end_rise(said, SR, 0.8, 1.2) < -3
    lifted = lift_questions(said, SR, WORDS)
    assert end_rise(lifted, SR, 0.8, 1.2) > 3
    assert end_rise(lift_questions(said, SR, WORDS, 1.5), SR, 0.8, 1.2) > end_rise(lifted, SR, 0.8, 1.2)


def test_only_the_end_of_the_question_is_touched():
    said = falling_line()
    lifted = lift_questions(said, SR, WORDS)
    assert lifted.shape == said.shape and lifted.dtype == np.float32
    untouched = int(0.4 * SR)
    assert np.array_equal(lifted[:untouched], said[:untouched])
    assert np.abs(lifted).max() <= np.abs(said).max() * 1.5


def test_a_line_with_no_question_or_no_voice_comes_back_as_it_was():
    said = falling_line()
    plain = [("It", 0.0, 0.4), ("is", 0.4, 0.8), ("smoke.", 0.8, 1.2)]
    assert lift_questions(said, SR, plain) is said
    hush = (0.05 * np.random.default_rng(1).standard_normal(len(said))).astype(np.float32)
    assert np.array_equal(lift_questions(hush, SR, WORDS), hush)
