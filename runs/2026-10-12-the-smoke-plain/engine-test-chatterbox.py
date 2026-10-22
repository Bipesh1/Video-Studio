"""Voice engine test, step 2 (run in Chatterbox's own environment, .cache/chatterbox/venv): the
same four lines by Chatterbox Turbo, each in a copy of that character's Kokoro voice, on this
laptop's processor. It also times every line, and listens back to the line with a [chuckle] in
it with a small speech recogniser, to see whether the chuckle was performed or read out.

Run:  .cache/chatterbox/venv/Scripts/python.exe runs/2026-10-12-the-smoke-plain/engine-test-chatterbox.py
"""
import json
import os
import subprocess
import time
from pathlib import Path

WORK = Path("F:/Video Studio/.cache/chatterbox")
os.environ.setdefault("HF_HOME", "F:/Video Studio/.cache/hf")

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
import torch  # noqa: E402
from chatterbox.tts_turbo import ChatterboxTurboTTS  # noqa: E402

OUT = Path(__file__).parent / "voice-test"
LINES = [
    ("trainer", "If a room filled with smoke, would you get up and leave? You think you would. Watch this."),
    ("copycat", "Is that smoke? [chuckle] Nobody else looks worried. So it must be fine."),
    ("cheat", "Relax. If it was dangerous, somebody would say so."),
    ("leak", "When something feels wrong, do not check the faces around you. Say it out loud, and stand up first."),
]

t0 = time.time()
model = ChatterboxTurboTTS.from_pretrained(device="cpu")
sr = model.sr
print(f"model loaded in {time.time() - t0:.0f} s, {sr} Hz", flush=True)

report = {"loadSeconds": round(time.time() - t0), "lines": []}
parts = []
for who, text in LINES:
    t1 = time.time()
    with torch.inference_mode():
        wav = model.generate(text, audio_prompt_path=str(WORK / "ref" / f"{who}.wav"))
    audio = wav.squeeze().cpu().numpy().astype(np.float32)
    took = time.time() - t1
    sf.write(WORK / f"line-{who}.wav", audio, sr, subtype="PCM_16")
    report["lines"].append({"who": who, "text": text, "seconds": round(len(audio) / sr, 2),
                            "took": round(took, 1), "timesRealTime": round(took / (len(audio) / sr), 1)})
    print(f"  {who}: {len(audio) / sr:.1f} s of speech in {took:.0f} s", flush=True)
    parts += [audio, np.zeros(int(sr * 0.7), dtype=np.float32)]

whole = np.concatenate(parts[:-1])
wav = OUT / "engine-2-chatterbox.wav"
sf.write(wav, whole, sr, subtype="PCM_16")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", "128k", str(wav.with_suffix(".mp3"))],
               check=True)
wav.unlink()

# Was the chuckle a sound, or the word? A recogniser writes down what it hears.
try:
    from transformers import pipeline

    hear = pipeline("automatic-speech-recognition", model="openai/whisper-tiny.en", device="cpu")
    audio, _ = sf.read(WORK / "line-copycat.wav", dtype="float32")
    heard = hear({"raw": audio, "sampling_rate": sr})["text"].strip()
    report["copycatHeardAs"] = heard
    print(f"  the copycat's line was heard as: {heard}", flush=True)
except Exception as e:  # noqa: BLE001
    report["copycatHeardAs"] = f"could not check: {e}"
    print(f"  could not listen back: {e}", flush=True)

(WORK / "chatterbox.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(f"engine-2-chatterbox.mp3: {len(whole) / sr:.1f} s")
