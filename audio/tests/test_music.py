"""Music: every note belongs to its mood's key and chords, and every sample is on target."""

import numpy as np
import pytest

from conftest import names_in_shared
from studio_audio import music
from studio_audio.files import write_wav
from studio_audio.levels import SAMPLE_RATE, loudness, master, to_stereo

SR = SAMPLE_RATE
NAMES = music.mood_names()
BARS = 16


def layers_of(name: str, seed: int = 0, bars: int = BARS):
    mood = music.MOODS[name]
    return mood, music.compose(mood, bars, seed)


def test_the_engine_and_the_worker_name_the_same_moods():
    assert NAMES == names_in_shared("MUSIC_MOODS")
    assert len(NAMES) == 9


@pytest.mark.parametrize("name", NAMES)
def test_every_note_is_playable_and_inside_the_piece(name):
    _, layers = layers_of(name)
    assert layers
    for layer, events in layers:
        assert events, f"{layer.role} plays nothing"
        for start, length, notes, velocity in events:
            assert 0 <= start < BARS * music.BEATS
            assert length > 0
            assert 1 <= velocity <= 127
            assert notes and all(21 <= n <= 108 for n in notes)


@pytest.mark.parametrize("name", NAMES)
def test_the_tune_stays_in_the_key_and_lands_on_the_chords(name):
    mood, layers = layers_of(name)
    scale = set(music.scale_classes(mood))
    for layer, events in layers:
        if layer.role != "melody":
            continue
        for start, length, notes, _ in events:
            assert notes[0] % 12 in scale, f"{notes[0]} is outside the key"
            bar, beat = int(start // music.BEATS), start % music.BEATS
            if bar == BARS - 1:
                continue
            chord = music.chord_classes(mood, mood.chords[bar % len(mood.chords)])
            in_scale_chord = [pc for pc in chord if pc in scale]
            if beat in (0.0, 2.0) and in_scale_chord:
                assert notes[0] % 12 in chord, f"bar {bar} beat {beat}: {notes[0]} is not in the chord"
        # It travels: more than three different notes, and no leap wider than an octave.
        pitches = [e[2][0] for e in events]
        assert len(set(pitches)) > 3
        assert max(abs(a - b) for a, b in zip(pitches, pitches[1:])) <= 12


@pytest.mark.parametrize("name", NAMES)
def test_chords_bass_and_runs_play_only_chord_notes(name):
    mood, layers = layers_of(name)
    home = music.chord_classes(mood, (0, "maj" if mood.scale[2] == 4 else "min"))
    for layer, events in layers:
        if layer.role not in ("pad", "stabs", "arp", "bass", "timpani"):
            continue
        for start, _, notes, _ in events:
            bar = int(start // music.BEATS)
            chord = home if bar == BARS - 1 else music.chord_classes(mood, mood.chords[bar % len(mood.chords)])
            assert all(n % 12 in chord for n in notes), f"{layer.role} bar {bar}"


@pytest.mark.parametrize("name", NAMES)
def test_the_piece_comes_home_at_the_end(name):
    mood, layers = layers_of(name)
    for layer, events in layers:
        last = [e for e in events if e[0] >= (BARS - 1) * music.BEATS]
        assert last, f"{layer.role} drops out before the end"
        if layer.role == "melody":
            assert last[-1][2][0] % 12 == mood.key % 12
        if layer.role == "bass":
            assert last[0][2][0] % 12 == mood.key % 12


@pytest.mark.parametrize("name", NAMES)
def test_drums_use_the_drum_channel_notes(name):
    _, layers = layers_of(name)
    for layer, events in layers:
        if layer.role == "drums":
            assert all(35 <= n <= 81 for e in events for n in e[2])


def test_the_same_seed_writes_the_same_music_and_another_seed_another_tune():
    for name in NAMES:
        _, a = layers_of(name, 4)
        _, b = layers_of(name, 4)
        _, c = layers_of(name, 5)
        assert [e for _, e in a] == [e for _, e in b]
        tune = lambda layers: [e[2] for layer, ev in layers if layer.role == "melody" for e in ev]  # noqa: E731
        assert tune(a) != tune(c), name


def test_the_second_phrase_repeats_the_first_with_a_new_ending():
    mood, layers = layers_of("hope")
    events = next(ev for layer, ev in layers if layer.role == "melody")
    rhythm = lambda bar: [(e[0] - bar * 4, e[1]) for e in events if bar * 4 <= e[0] < (bar + 1) * 4]  # noqa: E731
    for place in range(3):
        assert rhythm(place) == rhythm(place + 4)


def test_moods_differ_in_speed_and_bars_cover_the_length():
    assert music.MOODS["sorrow"].tempo < music.MOODS["hope"].tempo < music.MOODS["comic"].tempo
    for name in NAMES:
        mood = music.MOODS[name]
        bar_s = music.BEATS * 60 / mood.tempo
        assert music.bars_for(mood, 20) * bar_s >= 20
        assert (music.bars_for(mood, 20) - 1) * bar_s < 20
    with pytest.raises(KeyError, match="no music mood called"):
        music.resolve("spooky")


def test_crossfade_keeps_the_length_and_the_level():
    a = to_stereo(np.sin(2 * np.pi * 220 * np.arange(SR * 3) / SR) * 0.2)
    rng = np.random.default_rng(0)
    b = to_stereo(rng.standard_normal(SR * 3) * 0.2)
    out = music.crossfade(a, b, 1.0)
    assert len(out) == len(a) + len(b) - SR
    rms = lambda x: float(np.sqrt(np.mean(x**2)))  # noqa: E731
    middle = out[len(a) - SR // 2 - 2400 : len(a) - SR // 2 + 2400]
    assert rms(middle) > 0.7 * min(rms(a), rms(b))


def test_held_tone_is_quiet_at_both_ends():
    mood = music.MOODS["tense"]
    assert mood.drone is not None
    tone = music.held_tone(mood, mood.drone, 6.0, np.random.default_rng(1))
    assert tone.shape == (6 * SR, 2) and np.all(np.isfinite(tone))
    assert abs(tone[0]).max() < 1e-6 and abs(tone[-1]).max() < 1e-3


# ---- the tests below play the notes through FluidSynth, so they need the instrument set


@pytest.mark.parametrize("name", NAMES)
def test_every_mood_renders_at_the_stem_loudness_and_masters_on_target(name, soundfont):
    audio = music.render(name, 8.0, overrides=None, use_cache=False)
    assert audio.shape == (8 * SR, 2) and np.all(np.isfinite(audio))
    assert loudness(audio) == pytest.approx(music.STEM_LUFS, abs=0.3)
    assert abs(audio[-1]).max() < 1e-3
    # Sound all the way through: no second of the piece is silent.
    for second in range(7):
        assert np.sqrt(np.mean(audio[second * SR : (second + 1) * SR] ** 2)) > 1e-3, f"silent at {second} s"
    _, report = master(audio)
    assert report["onTarget"] and not report["clipped"], report


def test_an_arc_changes_mood_without_a_hole(soundfont):
    audio = music.arc([{"mood": "calm", "startMs": 0}, {"mood": "upbeat", "startMs": 5000}], 10.0)
    assert audio.shape == (10 * SR, 2)
    win = SR // 2
    levels = [float(np.sqrt(np.mean(audio[i : i + win] ** 2))) for i in range(win, 9 * SR, win)]
    assert min(levels) > 0.25 * float(np.median(levels))


def test_a_track_in_the_music_folder_replaces_the_written_one(tmp_path):
    t = np.arange(SR * 2) / SR
    write_wav(tmp_path / "calm.wav", to_stereo(0.2 * np.sin(2 * np.pi * 330 * t)))
    audio = music.render("calm", 5.0, overrides=tmp_path)
    assert audio.shape == (5 * SR, 2)
    assert loudness(audio) == pytest.approx(music.STEM_LUFS, abs=0.5)
    spectrum = np.abs(np.fft.rfft(audio.mean(axis=1)))
    assert np.fft.rfftfreq(len(audio), 1 / SR)[np.argmax(spectrum)] == pytest.approx(330, abs=2)
