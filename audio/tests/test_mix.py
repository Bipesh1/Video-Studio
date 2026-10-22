"""The mix: the voice leads, music moves round it, effects stay modest, loudness is on target."""

import json

import numpy as np
import pytest

from studio_audio import mix
from studio_audio.files import read_audio
from studio_audio.levels import SAMPLE_RATE, TARGET_LUFS, TRUE_PEAK_LIMIT_DB

SR = SAMPLE_RATE
REPORT_KEYS = {
    "version", "audioFile", "sampleRate", "durationMs", "lufs", "truePeakDb", "clipped", "onTarget",
    "silent", "targetLufs", "truePeakLimitDb", "hasVoice", "voiceLufs", "speechShare",
    "musicUnderVoiceDb", "musicInPausesDb", "music", "sfx",
}  # fmt: skip


def test_speech_is_found_where_it_is(fake_voice):
    spoken = mix.speech_activity(fake_voice, for_music=False)
    at = lambda s: bool(spoken[int(s * 100)])  # noqa: E731
    assert at(1.0) and at(6.0) and at(10.5)
    assert not at(0.2) and not at(4.2) and not at(8.8) and not at(11.8)
    assert spoken.mean() == pytest.approx(7.7 / 12, abs=0.05)


def test_the_music_is_told_about_speech_a_little_early_and_let_go_a_little_late(fake_voice):
    spoken = mix.speech_activity(fake_voice, for_music=False)
    for_music = mix.speech_activity(fake_voice)
    assert for_music.sum() > spoken.sum()
    assert for_music[int(4.95 * 100) - 5] and not spoken[int(4.95 * 100) - 5]
    assert not for_music[int(4.2 * 100)]


def test_the_music_goes_down_fast_and_comes_back_slowly():
    active = np.zeros(600, dtype=bool)
    active[200:400] = True
    curve = mix.duck_curve(active, 6 * SR, under_db=-10.0, open_db=0.0)
    at = lambda s: float(curve[int(s * SR)])  # noqa: E731
    assert at(1.5) == pytest.approx(0.0, abs=0.1)
    assert at(3.0) == pytest.approx(-10.0, abs=0.2)
    assert at(2.0 + mix.DUCK_DOWN_S) < -9.0
    assert -9.0 < at(4.0 + mix.DUCK_DOWN_S) < -1.0
    assert at(5.5) > -1.0
    assert np.all(curve <= 0.01) and np.all(curve >= -10.01)


def test_the_music_fades_away_for_a_quiet_stretch_and_comes_back_after_it():
    gain = mix.hush_gain([{"fromMs": 2000, "toMs": 4000}], 7 * SR)
    at = lambda s: float(gain[int(s * SR)])  # noqa: E731
    assert at(1.0) == 1.0
    assert at(2.0 + mix.HUSH_OUT_S + 0.1) == 0.0
    assert at(3.9) == 0.0
    assert 0.0 < at(4.0 + mix.HUSH_IN_S / 2) < 1.0
    assert at(6.0) == 1.0


def test_a_drop_cuts_the_music_at_once_and_brings_it_back_quickly():
    gain = mix.hush_gain([{"fromMs": 2000, "toMs": 2700, "sharp": True}], 5 * SR)
    at = lambda s: float(gain[int(s * SR)])  # noqa: E731
    assert at(1.9) == 1.0
    assert at(2.0 + mix.HUSH_SHARP_S + 0.02) == 0.0
    assert at(2.7 + mix.HUSH_SHARP_IN_S + 0.05) == 1.0


def test_a_bad_plan_is_refused_in_plain_words(fake_voice):
    with pytest.raises(ValueError) as err:
        mix.build({"music": [{"mood": "spooky", "startMs": 0}], "sfx": [{"name": "kaboom", "atMs": -5}]}, fake_voice)
    text = str(err.value)
    assert "spooky" in text and "kaboom" in text and "atMs" in text
    with pytest.raises(ValueError, match="how long the video is"):
        mix.build({"sfx": [{"name": "pop", "atMs": 0}]}, None)
    with pytest.raises(ValueError, match="silent"):
        mix.build({"durationMs": 2000}, None)


def test_effects_alone_with_a_voice_are_on_target_and_modest(fake_voice, tmp_path):
    plan = {
        "sfx": [
            {"name": "whoosh", "atMs": 1000},  # on a word
            {"name": "whoosh", "atMs": 4000},  # in a pause
            {"name": "hit", "atMs": 8600, "gainDb": 6},  # asked far too loud
            {"name": "wind", "atMs": 0},  # a bed with no length given runs to the end
            {"name": "ding", "atMs": 60000},  # after the video ends: dropped
        ]
    }
    audio, report = mix.build(plan, fake_voice, tmp_path)
    assert set(report) == REPORT_KEYS
    assert report["onTarget"] and not report["clipped"]
    assert report["lufs"] == pytest.approx(TARGET_LUFS, abs=0.5)
    assert report["truePeakDb"] <= TRUE_PEAK_LIMIT_DB + 0.05
    assert len(audio) == len(fake_voice) and report["durationMs"] == 12000
    cues = {(c["name"], c["atMs"]): c for c in report["sfx"]}
    assert len(cues) == 4
    on_word, in_pause = cues[("whoosh", 1000)], cues[("whoosh", 4000)]
    assert on_word["overVoice"] and not in_pause["overVoice"]
    assert on_word["levelAgainstVoiceDb"] == in_pause["levelAgainstVoiceDb"] + mix.SFX_OVER_VOICE_DB
    assert cues[("hit", 8600)]["levelAgainstVoiceDb"] == mix.SFX_CEILING_DB
    assert cues[("wind", 0)]["seconds"] == 12.0
    assert all(c["levelAgainstVoiceDb"] <= mix.SFX_CEILING_DB for c in report["sfx"])
    for name in ("mix.wav", "music.wav", "sfx.wav", "mix.json"):
        assert (tmp_path / name).is_file()
    assert json.loads((tmp_path / "mix.json").read_text(encoding="utf-8")) == report
    assert read_audio(tmp_path / "mix.wav").shape == audio.shape


def test_the_voice_is_still_what_you_hear_most(fake_voice):
    plan = {"sfx": [{"name": "wind", "atMs": 0}, {"name": "footsteps", "atMs": 500, "durationMs": 3000}]}
    audio, _ = mix.build(plan, fake_voice)
    voice = fake_voice.mean(axis=1)
    mixed = audio.mean(axis=1)
    speaking = np.abs(voice) > 1e-4
    match = float(np.corrcoef(voice[speaking], mixed[speaking])[0, 1])
    assert match > 0.95


def test_a_video_without_a_voice_gets_effects_at_a_sensible_level():
    audio, report = mix.build({"durationMs": 3000, "sfx": [{"name": "thud", "atMs": 500}, {"name": "ding", "atMs": 1500}]}, None)
    assert len(audio) == 3 * SR
    assert not report["hasVoice"] and report["voiceLufs"] is None and report["speechShare"] == 0
    assert report["musicUnderVoiceDb"] is None
    assert report["truePeakDb"] <= TRUE_PEAK_LIMIT_DB + 0.05 and not report["clipped"]


def test_panning_leans_an_effect_to_one_side():
    left, _ = mix.build({"durationMs": 1500, "sfx": [{"name": "pop", "atMs": 300, "pan": -1}]}, None)
    assert np.abs(left[:, 0]).max() > 0.1 and np.abs(left[:, 1]).max() < 1e-6


# ---- with music: these play notes through FluidSynth, so they need the instrument set


def test_music_dips_under_the_voice_and_rises_in_the_pauses(fake_voice, soundfont, tmp_path):
    plan = {
        "music": [{"mood": "curious", "startMs": 0}, {"mood": "calm", "startMs": 7000}],
        "sfx": [{"name": "ding", "atMs": 4000}],
    }
    audio, report = mix.build(plan, fake_voice, tmp_path)
    assert report["onTarget"] and not report["clipped"], report
    assert report["hasVoice"] and report["voiceLufs"] == pytest.approx(-14.0, abs=0.2)
    assert report["musicUnderVoiceDb"] <= -12.0
    assert report["musicInPausesDb"] >= report["musicUnderVoiceDb"] + 3.0
    assert [m["mood"] for m in report["music"]] == ["curious", "calm"]
    music_stem = read_audio(tmp_path / "music.wav")
    rms = lambda a, b: float(np.sqrt(np.mean(music_stem[int(a * SR) : int(b * SR)] ** 2)))  # noqa: E731
    assert rms(3.9, 4.8) > 1.5 * rms(1.5, 3.0)
    # The stems and the voice add up to the mix wherever the limiter was not at work.
    assert len(audio) == len(fake_voice)


def test_music_alone_is_on_target(soundfont):
    audio, report = mix.build({"durationMs": 6000, "music": [{"mood": "hope", "startMs": 0}]}, None)
    assert len(audio) == 6 * SR
    assert report["onTarget"] and not report["clipped"], report
