"""Voice engine test, step 3: Chatterbox Turbo refined. Biku: "can you do more refining on the
chatterbox one?" (2026-10-14).

What changes against step 2:
  - each line is directed with the engine's own mood and sound tags (its tokenizer knows
    [narration], [surprised], [sarcastic], [fear], [sigh], [chuckle], [gasp] and others);
    the words themselves never change
  - three takes of every line, with and without its direction; a speech recogniser writes down
    each take, and a take that drops, adds or changes a word is thrown out
  - of the good takes, the one whose pace is nearest the character's own is kept
  - each line is set to the studio's loudness, its silences trimmed, and the pauses between
    the lines are the ones the script has
  - every question is measured at its end, and lifted the studio's way only if it falls

It writes, into voice-test/:
  engine-3-chatterbox-refined.mp3   the four lines, the best directed take of each
  engine-3-directed-or-not.mp3      each line twice: the best plain take, then the best directed one

Run:  .cache/chatterbox/venv/Scripts/python.exe runs/2026-10-12-the-smoke-plain/engine-test-chatterbox-refined.py
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

WORK = Path("F:/Video Studio/.cache/chatterbox")
os.environ.setdefault("HF_HOME", "F:/Video Studio/.cache/hf")
sys.path.insert(0, "F:/Video Studio/audio/src")

import numpy as np  # noqa: E402
import pyloudnorm as pyln  # noqa: E402
import soundfile as sf  # noqa: E402
import torch  # noqa: E402
from chatterbox.tts_turbo import ChatterboxTurboTTS  # noqa: E402
from transformers import pipeline  # noqa: E402

from studio_audio.intonation import end_rise, lift_questions  # noqa: E402

OUT = Path(__file__).parent / "voice-test"
TAKES = 3
TARGET_LUFS = -17.0

#  who, the words, how it is directed, pause after (s), the pace that suits them (words a second)
LINES = [
    ("trainer", "If a room filled with smoke, would you get up and leave? You think you would. Watch this.",
     "[narration] {}", 0.6, 2.5),
    ("copycat", "Is that smoke? Nobody else looks worried. So it must be fine.",
     "[surprised] Is that smoke? [chuckle] Nobody else looks worried. So it must be fine.", 0.6, 2.7),
    ("cheat", "Relax. If it was dangerous, somebody would say so.",
     "[sarcastic] {}", 0.7, 2.6),
    ("leak", "When something feels wrong, do not check the faces around you. Say it out loud, and stand up first.",
     "[narration] {}", 0.0, 2.6),
]

bare = lambda s: re.sub(r"[^a-z0-9 ]", "", re.sub(r"\[[^\]]*\]", "", s.lower())).split()  # noqa: E731


def wrong_words(said, heard):
    """How many words a take got wrong: dropped, added or changed (an edit distance on words)."""
    a, b = bare(said), bare(heard)
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(b) + 1):
            cur = d[j]
            d[j] = min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
            prev = cur
    return d[-1]


meter = None


def tidy(audio, sr):
    """Trimmed of silence at both ends and set to the studio's loudness."""
    global meter
    meter = meter or pyln.Meter(sr)
    loud = np.abs(audio) > 0.01
    if loud.any():
        first, last = np.argmax(loud), len(loud) - np.argmax(loud[::-1])
        audio = audio[max(0, first - int(0.03 * sr)): min(len(audio), last + int(0.08 * sr))]
    level = meter.integrated_loudness(audio.astype(np.float64))
    if np.isfinite(level):
        audio = pyln.normalize.loudness(audio.astype(np.float64), level, TARGET_LUFS)
    return np.clip(audio, -0.95, 0.95).astype(np.float32)


t0 = time.time()
model = ChatterboxTurboTTS.from_pretrained(device="cpu")
sr = model.sr
hear = pipeline("automatic-speech-recognition", model="openai/whisper-base.en", device="cpu")
print(f"loaded in {time.time() - t0:.0f} s", flush=True)

report = []
chosen, compared = [], []
for who, text, directed, pause, pace in LINES:
    said_directed = directed.format(text) if "{}" in directed else directed
    takes = []
    for version, said in (("plain", text), ("directed", said_directed)):
        for k in range(TAKES):
            torch.manual_seed(100 * k + 7)
            t1 = time.time()
            with torch.inference_mode():
                wav = model.generate(said, audio_prompt_path=str(WORK / "ref" / f"{who}.wav"), temperature=0.8)
            audio = tidy(wav.squeeze().cpu().numpy(), sr)
            got = hear({"raw": audio, "sampling_rate": sr}, return_timestamps="word")
            heard = got["text"].strip()
            words = [(c["text"].strip(), c["timestamp"][0], c["timestamp"][1]) for c in got.get("chunks", [])]
            seconds = len(audio) / sr
            take = {"version": version, "take": k + 1, "said": said, "heard": heard,
                    "wrong": wrong_words(text, heard), "seconds": round(seconds, 2),
                    "wordsPerSecond": round(len(bare(text)) / seconds, 2), "took": round(time.time() - t1, 1)}
            takes.append((take, audio, words))
            print(f"  {who} {version} {k + 1}: {seconds:.1f} s, {take['wrong']} wrong, heard: {heard}", flush=True)

    def best(version):
        good = [t for t in takes if t[0]["version"] == version]
        return min(good, key=lambda t: (t[0]["wrong"], abs(t[0]["wordsPerSecond"] - pace)))

    plain, directed_take = best("plain"), best("directed")
    pick = directed_take if directed_take[0]["wrong"] <= plain[0]["wrong"] else plain
    take, audio, words = pick
    # A question that falls at its end is lifted; one that already rises is left alone.
    rises = []
    for i, (w, a, b) in enumerate(words):
        if w.endswith("?") and a is not None and b is not None:
            rises.append(round(end_rise(audio, sr, a, b) or 0.0, 1))
    if any(r < 1.0 for r in rises):
        audio = lift_questions(audio, sr, [(w, a, b) for w, a, b in words if a is not None and b is not None], 1.5)
        take["lifted"] = True
    take["questionEnds"] = rises
    report.append({"who": who, "kept": take, "takes": [t[0] for t in takes]})
    chosen += [audio, np.zeros(int(sr * pause), dtype=np.float32)]
    compared += [plain[1], np.zeros(int(sr * 0.5), dtype=np.float32), directed_take[1],
                 np.zeros(int(sr * 1.2), dtype=np.float32)]
    print(f"  {who}: kept {take['version']} take {take['take']}, question ends {rises}", flush=True)


def save(parts, name):
    whole = np.concatenate(parts)
    wav = OUT / f"{name}.wav"
    sf.write(wav, whole, sr, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", "128k", str(wav.with_suffix(".mp3"))],
                   check=True)
    wav.unlink()
    print(f"{name}.mp3: {len(whole) / sr:.1f} s", flush=True)


save(chosen, "engine-3-chatterbox-refined")
save(compared, "engine-3-directed-or-not")
(WORK / "refined.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
