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


@pytest.mark.parametrize("name", ["thud", "hit", "footsteps"])
def test_low_sounds_can_still_be_heard_on_a_phone(name):
    # A phone speaker plays almost nothing below 200 Hz.
    assert share_above(sfx.make(name, overrides=None), 200) > 0.2


def test_beds_and_footsteps_run_as_long_as_asked():
    assert len(sfx.make("wind", seconds=2.5, overrides=None)) == int(2.5 * SR)
    assert len(sfx.make("crowd-murmur", seconds=1.5, overrides=None)) == int(1.5 * SR)
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
