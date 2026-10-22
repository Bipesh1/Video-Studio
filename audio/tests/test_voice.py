"""Voice worker helpers: emphasis markup, alignment, limiting, fallback timings, and a full
synth run through a fake provider (no model download needed)."""

import json

import numpy as np
import pyloudnorm as pyln

from studio_audio import chatterbox
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


class Listener(FakeProvider):
    """Keeps what it was asked to say, and in which voice."""

    def __init__(self):
        self.heard = []

    def synthesize(self, text, voice, speed):
        self.heard.append((text, voice, speed))
        return super().synthesize(text.replace("...", ""), voice, speed)


def test_a_line_is_said_its_own_way_and_shown_as_written(tmp_path):
    script = {
        "questionLift": 0,
        "lines": [
            {"id": "l1", "speaker": "trainer", "voice": "am_onyx", "text": "He *stays.*", "say": "He... stays.",
             "speed": 0.8, "blend": [{"voice": "am_onyx", "weight": 0.7}, {"voice": "am_michael", "weight": 0.3}]},
            {"id": "l2", "speaker": "cheat", "voice": "am_eric", "text": "Relax."},
        ],
    }
    path = tmp_path / "voice-script.json"
    path.write_text(json.dumps(script))
    listener = Listener()
    track = synth(path, tmp_path / "audio", listener)
    assert listener.heard == [
        ("He... stays.", (("am_onyx", 0.7), ("am_michael", 0.3)), 0.8),
        ("Relax.", "am_eric", 1.0),
    ]
    assert [w["text"] for w in track["words"]] == ["He", "stays.", "Relax."]
    assert track["words"][1]["emphasis"] is True
    assert track["lines"][0]["text"] == "He stays." and track["lines"][0]["voice"] == "am_onyx"


def test_synth_lifts_the_questions_when_the_script_asks(tmp_path, monkeypatch):
    seen = []

    def lifted(audio, sr, words, strength):
        seen.append(([w for w, _, _ in words], strength))
        return audio

    monkeypatch.setattr("studio_audio.voice.lift_questions", lifted)
    line = {"id": "l1", "speaker": "copycat", "voice": "am_fenrir", "text": "Is that *smoke?*"}
    for lift in (1.5, 0):
        path = tmp_path / f"voice-script-{lift}.json"
        path.write_text(json.dumps({"questionLift": lift, "lines": [line]}))
        synth(path, tmp_path / "audio", FakeProvider())
    assert seen == [(["Is", "that", "smoke?"], 1.5)]


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


class SoundingProvider(FakeProvider):
    """Like the fake provider, and says which speech sounds it made for each word."""

    def synthesize(self, text, voice, speed):
        s = super().synthesize(text, voice, speed)
        for w in s.words:
            w.sounds = {"Is": "ˌɪz", "that": "ðˈæt", "smoke": "smˈOk"}.get(w.text, "")
        return s


def test_the_sounds_of_each_word_go_into_the_timings(tmp_path):
    path = tmp_path / "voice-script.json"
    path.write_text(json.dumps({"questionLift": 0, "lines": [
        {"id": "l1", "speaker": "copycat", "voice": "am_fenrir", "text": "Is that *smoke?*"}]}))
    track = synth(path, tmp_path / "audio", SoundingProvider())
    assert [w.get("sounds") for w in track["words"]] == ["ˌɪz", "ðˈæt", "smˈOk"]
    plain = synth(path, tmp_path / "plain", FakeProvider())
    assert all("sounds" not in w for w in plain["words"])


def test_lines_in_a_chatterbox_voice_are_spoken_by_it_and_timed_by_listening(tmp_path):
    asked = []

    def fake_chatterbox(lines, sr):
        asked.extend(lines)
        out = {}
        for line in lines:
            n = len(line["text"].split())
            audio = (0.2 * np.sin(np.linspace(0, 400 * n, int(0.3 * SR * n)))).astype(np.float32)
            words = [(w, 0.3 * i, 0.3 * i + 0.28) for i, w in enumerate(line["text"].split())]
            out[line["id"]] = chatterbox.Spoken(audio, words, 0, 1)
        return out

    script = {
        "questionLift": 0,
        "lines": [
            {"id": "l1", "speaker": "copycat", "voice": "am_fenrir", "text": "Is that *smoke?*",
             "say": "[surprised] Is that smoke?", "engine": "chatterbox", "sample": "voices/samples/copycat.wav"},
            {"id": "l2", "speaker": "cheat", "voice": "am_eric", "text": "Relax."},
        ],
    }
    path = tmp_path / "voice-script.json"
    path.write_text(json.dumps(script))
    track = synth(path, tmp_path / "audio", FakeProvider(), fake_chatterbox)
    assert [a["id"] for a in asked] == ["l1"]
    assert asked[0]["say"] == "[surprised] Is that smoke?"
    assert asked[0]["sample"].endswith("copycat.wav")
    assert [w["text"] for w in track["words"]] == ["Is", "that", "smoke?", "Relax."]
    assert track["words"][2]["emphasis"] is True
    assert track["timingSource"] == "heard"
