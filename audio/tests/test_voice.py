"""Voice worker helpers: emphasis markup, alignment, limiting, fallback timings, and a full
synth run through a fake provider (no model download needed)."""

import json

import numpy as np
import pyloudnorm as pyln

from studio_audio.voice import (
    PEAK_LIMIT,
    TARGET_LUFS,
    Synthesis,
    TimedWord,
    align,
    estimate_words,
    limit,
    normalize,
    script_words,
    synth,
)

SR = 24000


def test_script_words_marks_emphasis_and_keeps_punctuation():
    words = script_words("The king had *one* rule: nobody *leaves the* castle.")
    assert words[3] == ("one", True)
    assert words[4] == ("rule:", False)
    assert words[6] == ("leaves", True)
    assert words[7] == ("the", True)
    assert words[8] == ("castle.", False)


def test_align_gives_display_words_the_model_token_times():
    timed = [TimedWord("rule", 1.0, 1.4), TimedWord("do", 1.5, 1.6), TimedWord("n't", 1.6, 1.8)]
    out = align([("rule:", False), ("don't", True)], timed)
    assert out[0] == ("rule:", False, 1.0, 1.4)
    assert out[1][:2] == ("don't", True)
    assert out[1][2:] == (1.5, 1.8)


def test_limiter_holds_peaks_under_the_ceiling():
    t = np.linspace(0, 1, SR, endpoint=False)
    loud = (1.6 * np.sin(2 * np.pi * 220 * t)).astype(np.float32)
    out = limit(loud, SR)
    assert np.max(np.abs(out)) <= PEAK_LIMIT + 1e-3


def test_normalize_reaches_target_loudness_with_peaks_limited():
    rng = np.random.default_rng(1)
    t = np.linspace(0, 3, 3 * SR, endpoint=False)
    speechy = (0.05 * np.sin(2 * np.pi * 180 * t) * (1 + np.sin(2 * np.pi * 3 * t)) + 0.01 * rng.standard_normal(t.size)).astype(np.float32)
    out, lufs = normalize(speechy, SR)
    assert abs(lufs - TARGET_LUFS) < 1.5
    assert np.max(np.abs(out)) <= PEAK_LIMIT + 1e-3
    assert abs(pyln.Meter(SR).integrated_loudness(out.astype(np.float64)) - lufs) < 0.1


def test_estimated_timings_cover_the_speech_in_order():
    audio = np.concatenate([np.zeros(SR // 2), 0.3 * np.ones(SR), np.zeros(SR // 2)]).astype(np.float32)
    words = estimate_words("Hello *big* world.", audio, SR)
    assert [w.text for w in words] == ["Hello", "big", "world."]
    assert words[0].start >= 0.45 and words[-1].end <= 1.55
    assert all(a.end <= b.start + 1e-9 for a, b in zip(words, words[1:]))


class FakeProvider:
    """Speaks each word as 0.3 s of tone after 0.2 s of silence, with exact timestamps."""

    sample_rate = SR

    def synthesize(self, text, voice, speed):
        words, chunks, t = [], [np.zeros(int(0.2 * SR), np.float32)], 0.2
        for w in text.split():
            words.append(TimedWord(w.strip(".,!?:"), t, t + 0.3))
            chunks.append((0.2 * np.sin(np.linspace(0, 200, int(0.3 * SR)))).astype(np.float32))
            t += 0.3
        chunks.append(np.zeros(int(0.2 * SR), np.float32))
        return Synthesis(np.concatenate(chunks), words, "kokoro")


def test_synth_writes_a_track_that_matches_the_contract(tmp_path):
    script = {
        "leadInMs": 400,
        "tailMs": 600,
        "lines": [
            {"id": "n1", "speaker": "narrator", "voice": "am_michael", "text": "One *two* three.", "pauseAfterMs": 500},
            {"id": "d1", "speaker": "tom", "voice": "am_puck", "text": "Four five!", "pauseAfterMs": 0},
        ],
    }
    path = tmp_path / "voice-script.json"
    path.write_text(json.dumps(script))
    track = synth(path, tmp_path / "audio", FakeProvider())
    assert (tmp_path / "audio" / "voice.wav").exists()
    assert json.loads((tmp_path / "audio" / "timings.json").read_text())["version"] == 1
    assert [w["text"] for w in track["words"]] == ["One", "two", "three.", "Four", "five!"]
    assert track["words"][1]["emphasis"] is True
    assert track["lines"][0]["startMs"] >= 400 - 40
    assert track["lines"][1]["startMs"] >= track["lines"][0]["endMs"] + 450
    starts = [w["startMs"] for w in track["words"]]
    assert starts == sorted(starts)
    assert track["words"][-1]["endMs"] <= track["durationMs"]
    assert all(w["lineId"] in ("n1", "d1") for w in track["words"])
