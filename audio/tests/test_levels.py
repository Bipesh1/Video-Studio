"""Loudness, true peak and limiting: the numbers every finished sound must meet."""

import numpy as np
import pytest

from studio_audio.levels import (
    SAMPLE_RATE,
    TARGET_LUFS,
    TRUE_PEAK_LIMIT_DB,
    db_to_gain,
    fade,
    level_report,
    limit,
    loudness,
    master,
    resample,
    sample_peak_db,
    set_loudness,
    to_stereo,
    true_peak_db,
)

SR = SAMPLE_RATE


def tone(freq: float, seconds: float, level: float = 0.5) -> np.ndarray:
    t = np.arange(int(seconds * SR)) / SR
    return to_stereo(level * np.sin(2 * np.pi * freq * t))


def test_true_peak_sees_what_falls_between_the_samples():
    # A quarter-rate sine sampled off its crests: every sample is 0.707, the wave reaches 1.
    t = np.arange(SR) / SR
    audio = to_stereo(np.sin(2 * np.pi * (SR / 4) * t + np.pi / 4))
    assert sample_peak_db(audio) == pytest.approx(-3.01, abs=0.05)
    assert true_peak_db(audio) > sample_peak_db(audio) + 2.0


def test_limit_holds_the_ceiling_and_leaves_quiet_sound_alone():
    rng = np.random.default_rng(1)
    loud = to_stereo(rng.standard_normal(SR * 2) * 0.6)
    held = limit(loud, -3.0)
    assert sample_peak_db(held) <= -3.0 + 1e-6
    quiet = tone(440, 1.0, 0.1)
    assert np.array_equal(limit(quiet, -3.0), quiet)


def test_limit_turns_both_sides_down_together():
    audio = tone(300, 1.0, 0.2)
    audio[SR // 2 : SR // 2 + 200, 0] = 0.99
    held = limit(audio, -6.0)
    ratio = held[SR // 2 + 100] / audio[SR // 2 + 100]
    assert ratio[0] == pytest.approx(ratio[1], rel=1e-9)


@pytest.mark.parametrize("start_level", [0.01, 0.2, 0.9])
def test_master_reaches_the_target_from_any_starting_level(start_level):
    rng = np.random.default_rng(2)
    t = np.arange(SR * 5) / SR
    audio = to_stereo((np.sin(2 * np.pi * 220 * t) + 0.3 * rng.standard_normal(t.size)) * start_level)
    out, report = master(audio)
    assert report["onTarget"] and not report["clipped"]
    assert report["lufs"] == pytest.approx(TARGET_LUFS, abs=0.5)
    assert report["truePeakDb"] <= TRUE_PEAK_LIMIT_DB + 0.05
    assert level_report(out)["lufs"] == report["lufs"]


def test_master_keeps_the_peak_under_the_limit_for_spiky_sound():
    rng = np.random.default_rng(3)
    audio = to_stereo(rng.standard_normal(SR * 4) * 0.05)
    audio[:: SR // 3] = 0.98  # sharp clicks three times a second
    _, report = master(audio)
    assert report["truePeakDb"] <= TRUE_PEAK_LIMIT_DB + 0.05
    assert not report["clipped"]


def test_master_says_so_when_there_is_nothing_to_hear():
    _, report = master(np.zeros((SR, 2)))
    assert report["silent"] and not report["onTarget"]


def test_set_loudness_and_resample_and_stereo():
    audio = set_loudness(tone(330, 3.0, 0.05), -20.0)
    assert loudness(audio) == pytest.approx(-20.0, abs=0.1)
    half = resample(np.sin(2 * np.pi * 100 * np.arange(24000) / 24000), 24000)
    assert len(half) == SR
    assert to_stereo(np.zeros(10)).shape == (10, 2)
    assert db_to_gain(-6.0) == pytest.approx(0.501, abs=0.001)


def test_fade_starts_and_ends_in_silence():
    out = fade(np.ones((SR, 2)), 0.1, 0.2)
    assert out[0, 0] == 0 and out[-1, 0] == pytest.approx(0, abs=1e-6)
    assert out[SR // 2, 0] == 1
