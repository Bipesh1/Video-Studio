"""Sound effects: every one is made, sits at the working level, and never clicks or clips."""

import json

import numpy as np
import pytest

from conftest import names_in_shared
from studio_audio import sfx
from studio_audio.files import write_wav
from studio_audio.levels import SAMPLE_RATE, db_to_gain, to_stereo

SR = SAMPLE_RATE
NAMES = sfx.effect_names()


def share_above(audio: np.ndarray, hertz: float) -> float:
    spectrum = np.abs(np.fft.rfft(audio.mean(axis=1))) ** 2
    freqs = np.fft.rfftfreq(len(audio), 1 / SR)
    return float(spectrum[freqs >= hertz].sum() / spectrum.sum())


def test_the_engine_and_the_worker_name_the_same_effects():
    assert NAMES == names_in_shared("SFX_NAMES")
    ambient = [n for n in NAMES if sfx.EFFECTS[n].ambient]
    assert ambient == names_in_shared("AMBIENT_SFX")


@pytest.mark.parametrize("name", NAMES)
def test_every_effect_is_clean_stereo_at_the_working_level(name):
    audio = sfx.make(name, overrides=None)
    assert audio.ndim == 2 and audio.shape[1] == 2
    assert np.all(np.isfinite(audio))
    assert len(audio) == pytest.approx(sfx.EFFECTS[name].seconds * SR, abs=2)
    peak = float(np.max(np.abs(audio)))
    assert peak <= db_to_gain(sfx.WORKING_PEAK_DB) + 1e-9
    # At the working level, unless its peak had to be held down first (very short sounds).
    loud = sfx.loudest_window_db(audio)
    assert loud <= sfx.WORKING_LEVEL_DB + 0.01
    assert loud == pytest.approx(sfx.WORKING_LEVEL_DB, abs=0.01) or peak == pytest.approx(
        db_to_gain(sfx.WORKING_PEAK_DB), rel=1e-6
    )
    # No click at either end.
    assert abs(audio[0]).max() < 0.02 and abs(audio[-1]).max() < 0.02


@pytest.mark.parametrize("name", NAMES)
def test_the_same_seed_gives_the_same_sound(name):
    assert np.array_equal(sfx.make(name, seed=3, overrides=None), sfx.make(name, seed=3, overrides=None))


@pytest.mark.parametrize("name", [n for n in NAMES if n != "blip"])
def test_another_seed_gives_another_take(name):
    assert not np.array_equal(sfx.make(name, seed=0, overrides=None), sfx.make(name, seed=1, overrides=None))


@pytest.mark.parametrize("name", ["thud", "hit", "footsteps", "drumroll", "clunk", "boom", "heartbeat-rising", "hum"])
def test_low_sounds_can_still_be_heard_on_a_phone(name):
    # A phone speaker plays almost nothing below 200 Hz.
    assert share_above(sfx.make(name, overrides=None), 200) > 0.2


def test_beds_and_footsteps_run_as_long_as_asked():
    assert len(sfx.make("wind", seconds=2.5, overrides=None)) == int(2.5 * SR)
    assert len(sfx.make("crowd-murmur", seconds=1.5, overrides=None)) == int(1.5 * SR)
    assert len(sfx.make("tick", seconds=2.5, overrides=None)) == int(2.5 * SR)
    assert len(sfx.make("applause", seconds=1.5, overrides=None)) == int(1.5 * SR)
    steps = sfx.make("footsteps", seconds=3.0, overrides=None)
    assert len(steps) == 3 * SR
    # A one-shot keeps its own length whatever is asked.
    assert len(sfx.make("pop", seconds=5.0, overrides=None)) == int(sfx.EFFECTS["pop"].seconds * SR)


def test_footsteps_come_two_a_second():
    steps = sfx.make("footsteps", seconds=3.0, overrides=None).mean(axis=1)
    win = SR // 100
    level = np.sqrt(np.mean(steps[: len(steps) // win * win].reshape(-1, win) ** 2, axis=1))
    loud = level > level.max() * 0.3
    onsets = int(np.sum(loud[1:] & ~loud[:-1]) + loud[0])
    assert onsets == 6


def rms(audio: np.ndarray, start: float, end: float) -> float:
    """The level of a stretch of a sound, given as shares of its length."""
    mono = audio.mean(axis=1)
    return float(np.sqrt(np.mean(mono[int(start * len(mono)) : int(end * len(mono))] ** 2)))


def test_the_clock_ticks_twice_a_second_and_the_tock_is_lower():
    ticks = sfx.make("tick", seconds=3.0, overrides=None).mean(axis=1)
    win = SR // 100
    level = np.sqrt(np.mean(ticks[: len(ticks) // win * win].reshape(-1, win) ** 2, axis=1))
    loud = level > level.max() * 0.3
    starts = np.flatnonzero(loud[1:] & ~loud[:-1]) + 1
    assert len(starts) == 6
    assert np.allclose(np.diff(starts) * win / SR, 0.5, atol=0.011)
    # Dry: nothing left of a tick a tenth of a second after it starts.
    assert level[starts[0] + 10 : starts[1] - 1].max() < level.max() * 0.01

    def pitch(i: int) -> float:
        piece = ticks[starts[i] * win - win : starts[i] * win + SR // 10]
        return float(np.fft.rfftfreq(len(piece), 1 / SR)[np.argmax(np.abs(np.fft.rfft(piece)))])

    assert pitch(1) == pytest.approx(0.8 * pitch(0), rel=0.03)
    assert pitch(2) == pytest.approx(pitch(0), rel=0.03)


def test_applause_swells_in_and_thins_out():
    for seconds in (3.0, 8.0):
        claps = sfx.make("applause", seconds=seconds, overrides=None)
        middle = rms(claps, 0.3, 0.6)
        assert rms(claps, 0.0, 0.08) < middle / 2
        assert rms(claps, 0.6, 0.8) < middle
        assert rms(claps, 0.88, 1.0) < middle / 2
    # Clapping hands, not a rumble: nearly all of it is where a phone plays.
    assert share_above(claps, 500) > 0.9


def test_the_drumroll_builds_and_stops_dead():
    roll = sfx.make("drumroll", overrides=None)
    assert len(roll) == pytest.approx(1.8 * SR, abs=2)
    quarters = [rms(roll, i / 4, (i + 1) / 4) for i in range(4)]
    assert quarters == sorted(quarters) and quarters[3] > 2.5 * quarters[0]
    # No tail and no crash: a tenth of a second before the end it is still at its loudest,
    # and in its last fiftieth of a second there is a tenth of that or less.
    level = lambda a, b: float(np.sqrt(np.mean(roll[len(roll) - int(a * SR) : len(roll) - int(b * SR)] ** 2)))  # noqa: E731
    assert level(0.16, 0.08) > 0.7 * db_to_gain(sfx.loudest_window_db(roll))
    assert level(0.02, 0.0) < 0.1 * level(0.16, 0.08)
    assert rms(roll, 0.9, 1.0) <= rms(roll, 0.8, 0.9) * 1.2


def onsets_in(audio: np.ndarray, start: float, end: float) -> int:
    """How many separate sounds start in a stretch of a sound, given as shares of its length."""
    mono = audio.mean(axis=1)
    win = SR // 100
    level = np.sqrt(np.mean(mono[: len(mono) // win * win].reshape(-1, win) ** 2, axis=1))
    loud = level > level.max() * 0.25
    starts = np.flatnonzero(loud[1:] & ~loud[:-1]) + 1
    return int(np.sum((starts >= start * len(level)) & (starts < end * len(level))))


def test_the_rising_heartbeat_speeds_up_and_gets_harder():
    for seconds in (6.0, 10.0):
        heart = sfx.make("heartbeat-rising", seconds=seconds, overrides=None)
        assert len(heart) == int(seconds * SR)
        assert onsets_in(heart, 0.66, 1.0) >= 1.3 * onsets_in(heart, 0.0, 0.34)
        assert rms(heart, 0.75, 1.0) > 1.5 * rms(heart, 0.0, 0.25)


def test_the_boom_rings_on_and_the_clunk_does_not():
    boom = sfx.make("boom", overrides=None)
    assert rms(boom, 0.0, 0.15) > 3 * rms(boom, 0.5, 0.8) > 0
    clunk = sfx.make("clunk", overrides=None)
    assert rms(clunk, 0.0, 0.4) > 20 * rms(clunk, 0.8, 1.0)


def test_the_hum_is_steady_from_end_to_end():
    hum = sfx.make("hum", seconds=4.0, overrides=None)
    assert len(hum) == 4 * SR
    quarters = [rms(hum, 0.15 + i * 0.2, 0.35 + i * 0.2) for i in range(4)]
    assert max(quarters) < 1.6 * min(quarters)


def test_other_names_for_an_effect_and_a_plain_error_for_none():
    assert sfx.resolve("wood-creak").name == "creak"
    assert sfx.resolve("sweat-drop").name == "blip"
    with pytest.raises(KeyError, match="no sound effect called"):
        sfx.resolve("explosion")


def test_every_effect_sits_under_the_voice_in_a_mix():
    for effect in sfx.EFFECTS.values():
        assert effect.level_db <= -3.0, effect.name
        if effect.ambient:
            assert effect.level_db <= -15.0, effect.name


def test_a_file_in_the_sfx_folder_replaces_the_made_sound(tmp_path):
    t = np.arange(SR // 2) / SR
    write_wav(tmp_path / "whoosh.wav", to_stereo(0.3 * np.sin(2 * np.pi * 440 * t)))
    own = sfx.make("whoosh", overrides=tmp_path)
    made = sfx.make("whoosh", overrides=None)
    assert len(own) == SR // 2 and len(own) != len(made)
    spectrum = np.abs(np.fft.rfft(own.mean(axis=1)))
    assert np.fft.rfftfreq(len(own), 1 / SR)[np.argmax(spectrum)] == pytest.approx(440, abs=4)
    assert sfx.loudest_window_db(own) == pytest.approx(sfx.WORKING_LEVEL_DB, abs=0.05)


def test_the_reel_holds_every_effect_on_target(tmp_path):
    result = sfx.reel(tmp_path)
    assert (tmp_path / "sfx-reel.mp3").is_file()
    assert json.loads((tmp_path / "sfx-reel.json").read_text(encoding="utf-8")) == result
    assert result["onTarget"] and not result["clipped"]
    assert [e["name"] for e in result["effects"]] == NAMES
    for e in result["effects"]:
        assert (tmp_path / e["file"]).is_file()
        assert not e["clipped"] and e["truePeakDb"] <= -1.0 + 0.05
    starts = [e["startsAtSec"] for e in result["effects"]]
    assert starts == sorted(starts)
