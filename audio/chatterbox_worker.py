"""Chatterbox worker: speaks a batch of lines in copied voices, and times their words.

It runs in Chatterbox's own environment (.cache/chatterbox/venv, Python 3.11), apart from the
studio's voice worker, whose Kokoro needs other versions of the same libraries. The voice worker
(studio_audio/chatterbox.py) writes a job, runs this, and reads the result back.

For each line: speak it in the voice of its sample; listen back with a small speech recogniser
(Whisper base.en), which writes down every word and when it was said; if any word came out
wrong (dropped, added, changed), or was said badly (swallowed, or a gap where the line has no
comma), speak it again with another seed, up to TAKES times, and keep the best. Mood and sound tags in what is said ([surprised], [chuckle] ...) are the engine's own
and are not words.

  python chatterbox_worker.py --job job.json --out <dir>

job.json: {"lines": [{"id", "say", "text", "sample"}]}. Writes <dir>/<id>.wav and
<dir>/result.json: {"sampleRate", "lines": [{"id", "file", "words": [[word, start, end]], "wrong", "takes"}]}.
"""

import argparse
import json
import os
import re
import time
from pathlib import Path

os.environ.setdefault("HF_HOME", str(Path(__file__).resolve().parents[1] / ".cache" / "hf"))

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
import torch  # noqa: E402
from chatterbox.tts_turbo import ChatterboxTurboTTS  # noqa: E402
from transformers import pipeline  # noqa: E402

TAKES = 3


_ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
_TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def _say_number(n):
    """A whole number as words, the way it is said: 38000 is "thirty eight thousand"."""
    if n < 20:
        return _ONES[n]
    if n < 100:
        return _TENS[n // 10] + ("" if n % 10 == 0 else " " + _ONES[n % 10])
    if n < 1000:
        return _ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + _say_number(n % 100))
    for size, name in ((1_000_000_000, "billion"), (1_000_000, "million"), (1000, "thousand")):
        if n >= size:
            rest = n % size
            return _say_number(n // size) + " " + name + ("" if rest == 0 else " " + _say_number(rest))
    return str(n)


def _say_year(n):
    """A year as it is said: 1981 is "nineteen eighty one", 2002 is "two thousand two"."""
    if 1100 <= n <= 1999 and n % 100 != 0:
        return _say_number(n // 100) + " " + (_say_number(n % 100) if n % 100 >= 10 else "oh " + _ONES[n % 100])
    return _say_number(n)


def _words_for_numbers(text):
    """Figures written as words, so "10, 5" and "ten, five" are the same words (the listening
    writes figures; the script spells them out). A four-figure number is read both ways, as a
    year and as a count, and the script's own way is kept by the caller."""
    def one(m):
        digits = m.group(0).replace(",", "")
        n = int(digits)
        if len(digits) == 4 and "," not in m.group(0):
            return _say_year(n)
        return _say_number(n)
    return re.sub(r"\d+(?:,\d{3})*", one, text)


def bare(text):
    text = _words_for_numbers(re.sub(r"\[[^\]]*\]", " ", text.lower()))
    return re.sub(r"[^a-z0-9' ]", " ", text).split()


def wrong_words(said, heard):
    """How many words a take got wrong: an edit distance on words."""
    a, b = bare(said), bare(heard)
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(b) + 1):
            cur = d[j]
            d[j] = min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
            prev = cur
    return d[-1]


def flaws(said, words):
    """How many places a take was said badly though every word was heard: a word swallowed to
    almost nothing, or a gap inside a phrase where the line has no comma or full stop (Biku,
    2026-10-14: "what do you thin... he oes?", which the listening had passed)."""
    said_words = [w for w in re.sub(r"\[[^\]]*\]", " ", said).split() if re.search(r"[A-Za-z0-9]", w)]
    n = 0
    for i, (_, a, b) in enumerate(words):
        if b is not None and b - a < 0.06:
            n += 1
        if i + 1 < len(words) and b is not None:
            gap = words[i + 1][1] - b
            stop = i < len(said_words) and re.search(r"[.,!?;:]$", said_words[i])
            if gap > 0.3 and not stop:
                n += 1
    return n


def trim(audio, sr):
    loud = np.abs(audio) > 0.01
    if not loud.any():
        return audio
    first, last = int(np.argmax(loud)), len(loud) - int(np.argmax(loud[::-1]))
    return audio[max(0, first - int(0.03 * sr)) : min(len(audio), last + int(0.08 * sr))]


def die_with_parent():
    """End this worker the moment whatever started it is gone (2026-10-16): the parent holds
    the worker's stdin open while it waits, and when the parent ends, for any reason, the pipe
    closes. A worker left running after its job had failed once ran beside a second one and
    froze Biku's laptop."""
    import sys
    import threading

    def watch():
        try:
            sys.stdin.read()
        finally:
            os._exit(3)

    threading.Thread(target=watch, daemon=True).start()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--job", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--watch-parent", action="store_true")
    args = parser.parse_args()
    if args.watch_parent:
        die_with_parent()
    job = json.loads(Path(args.job).read_text(encoding="utf-8"))
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    t0 = time.time()
    model = ChatterboxTurboTTS.from_pretrained(device="cpu")
    sr = model.sr
    hear = pipeline("automatic-speech-recognition", model="openai/whisper-base.en", device="cpu")
    print(f"chatterbox ready in {time.time() - t0:.0f} s", flush=True)

    results = []
    for line in job["lines"]:
        best = None
        for take in range(TAKES):
            torch.manual_seed(7 + 100 * take)
            with torch.inference_mode():
                wav = model.generate(line["say"], audio_prompt_path=line["sample"], temperature=0.8)
            audio = trim(wav.squeeze().cpu().numpy().astype(np.float32), sr)
            got = hear({"raw": audio, "sampling_rate": sr}, return_timestamps="word")
            words = [
                (c["text"].strip(), c["timestamp"][0], c["timestamp"][1])
                for c in got.get("chunks", [])
                if c["timestamp"][0] is not None
            ]
            wrong = wrong_words(line["text"], got["text"])
            bad = flaws(line["say"], words)
            # A wrong word counts for more than a badly said one.
            score = wrong * 10 + bad
            if best is None or score < best[4]:
                best = (audio, wrong, words, take + 1, score)
            print(
                f"  {line['id']} take {take + 1}: {len(audio) / sr:.1f} s, {wrong} wrong, {bad} badly said",
                flush=True,
            )
            if score == 0:
                break
        audio, wrong, words, takes, _ = best
        file = out / f"{line['id']}.wav"
        sf.write(file, audio, sr, subtype="FLOAT")
        # Whisper can leave the end of the last word open; it ends with the speech.
        words = [(w, a, b if b is not None else len(audio) / sr) for w, a, b in words]
        results.append({"id": line["id"], "file": file.name, "words": words, "wrong": wrong, "takes": takes})
        # Each line as it is done, so a job that is stopped keeps what it finished.
        with (out / "done.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps({"sampleRate": sr, **results[-1]}) + "\n")
    (out / "result.json").write_text(json.dumps({"sampleRate": sr, "lines": results}, indent=2), encoding="utf-8")
    print(f"chatterbox done in {time.time() - t0:.0f} s", flush=True)


if __name__ == "__main__":
    main()
