"""Lines spoken by Chatterbox Turbo (Resemble AI, MIT licence) in a copied voice.

Biku chose it on 2026-10-14 ("yes use chatterbox of course") after hearing it beside Kokoro: it
sounds more alive and performs mood and sound tags. It runs in its own environment, so this
writes a job, runs audio/chatterbox_worker.py there, and turns what it returns into the same
Synthesis the Kokoro provider gives, with the words timed by the speech recogniser.

Install once (on drive F, apart from the studio's own environment):
  uv venv --python 3.11 .cache/chatterbox/venv
  uv pip install --python .cache/chatterbox/venv chatterbox-tts "setuptools<80"
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import tempfile
from dataclasses import dataclass
from math import gcd
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[3]
WORKER = ROOT / "audio" / "chatterbox_worker.py"
PYTHON = ROOT / ".cache" / "chatterbox" / "venv" / "Scripts" / "python.exe"
CACHE = ROOT / ".cache" / "chatterbox" / "lines"


@dataclass
class Spoken:
    audio: np.ndarray
    words: list[tuple[str, float, float]]
    wrong: int
    takes: int


def available() -> bool:
    return PYTHON.exists() and WORKER.exists()


WORKER_VERSION = "2"
"""Raised when a change to the worker changes the sound it makes, so lines are spoken again. A
change only to how it checks a take does not: the check is made again here on every line."""


def _key(line: dict) -> str:
    """What a spoken line depends on: its words, the voice it copies and how the worker speaks."""
    h = hashlib.sha256()
    for part in (line["say"], line["text"], WORKER_VERSION):
        h.update(part.encode("utf-8") + b"\0")
    h.update(Path(line["sample"]).read_bytes())
    return h.hexdigest()[:24]


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


def _bare(text: str) -> list[str]:
    text = _words_for_numbers(re.sub(r"\[[^\]]*\]", " ", text.lower()))
    return re.sub(r"[^a-z0-9' ]", " ", text).split()


def wrong_words(said: str, heard: str) -> int:
    """How many words a take got wrong: an edit distance on words, figures read as words."""
    a, b = _bare(said), _bare(heard)
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(b) + 1):
            cur = d[j]
            d[j] = min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
            prev = cur
    return d[-1]


def speak(lines: list[dict], sample_rate: int) -> dict[str, Spoken]:
    """Speak every line ({id, say, text, sample}) and return each, at `sample_rate`.

    A line spoken before with the same words, sample and worker is taken from CACHE instead of
    being spoken again (a part's voice is often made again for a change of pause or one line)."""
    if not lines:
        return {}
    CACHE.mkdir(parents=True, exist_ok=True)
    keys = {line["id"]: _key(line) for line in lines}
    out: dict[str, Spoken] = {}
    for line in lines:
        cached = CACHE / f"{keys[line['id']]}.json"
        if cached.exists():
            got = json.loads(cached.read_text(encoding="utf-8"))
            audio, rate = sf.read(CACHE / f"{keys[line['id']]}.wav", dtype="float32")
            out[line["id"]] = _checked(_spoken(audio, rate, sample_rate, got), line["text"])
    todo = [line for line in lines if line["id"] not in out]
    if not todo:
        return out
    if not available():
        raise RuntimeError(
            "Chatterbox is not installed: see audio/src/studio_audio/chatterbox.py for the two commands."
        )
    # Its own scratch folder: .cache/tmp is emptied by other commands (the tests among them),
    # which once took a job file from under a running worker.
    scratch = ROOT / ".cache" / "chatterbox" / "jobs"
    scratch.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=scratch) as work:
        job = Path(work) / "job.json"
        job.write_text(json.dumps({"lines": todo}), encoding="utf-8")
        log = Path(work) / "worker.log"
        # The worker's stdin stays open while this waits, and closes if this process ends for
        # any reason: the worker then ends too (`--watch-parent`), and never runs on alone.
        with log.open("w", encoding="utf-8") as sink:
            proc = subprocess.Popen(
                [str(PYTHON), str(WORKER), "--job", str(job), "--out", work, "--watch-parent"],
                stdin=subprocess.PIPE,
                stdout=sink,
                stderr=subprocess.STDOUT,
            )
            try:
                code = proc.wait()
            finally:
                if proc.poll() is None:
                    proc.kill()
                if proc.stdin:
                    proc.stdin.close()

        def keep(line: dict, rate: int) -> None:
            audio, _ = sf.read(Path(work) / line["file"], dtype="float32")
            key = keys[line["id"]]
            sf.write(CACHE / f"{key}.wav", audio, rate, subtype="FLOAT")
            (CACHE / f"{key}.json").write_text(
                json.dumps({k: v for k, v in line.items() if k != "sampleRate"}), encoding="utf-8"
            )
            text = next(x["text"] for x in todo if x["id"] == line["id"])
            out[line["id"]] = _checked(_spoken(audio, rate, sample_rate, line), text)

        # Every line it finished is kept, even when it did not finish them all.
        done = Path(work) / "done.jsonl"
        if done.exists():
            for row in done.read_text(encoding="utf-8").splitlines():
                if row.strip():
                    line = json.loads(row)
                    keep(line, int(line["sampleRate"]))
        if code != 0:
            said = log.read_text(encoding="utf-8", errors="replace")[-1500:]
            raise RuntimeError(f"Chatterbox failed (the lines it finished are kept):\n{said}")
        return out


def _spoken(audio: np.ndarray, rate: int, sample_rate: int, line: dict) -> Spoken:
    if rate != sample_rate:
        g = gcd(rate, sample_rate)
        audio = resample_poly(audio, sample_rate // g, rate // g).astype(np.float32)
    words = [(str(w), float(a), float(b)) for w, a, b in line["words"]]
    return Spoken(audio, words, int(line["wrong"]), int(line["takes"]))


def _checked(spoken: Spoken, text: str) -> Spoken:
    """The take checked again here, with figures read as words (2026-10-15: "19" heard for
    "nineteen" counted as a wrong word, so whole lines lost their heard timings)."""
    # The heard words themselves are written as words too, so they line up with the script's
    # ("19" with "nineteen"); a figure said as several words shares its time among them.
    words: list[tuple[str, float, float]] = []
    for w, a, b in spoken.words:
        said = _words_for_numbers(w).split() or [w]
        step = (b - a) / len(said)
        words += [(x, a + i * step, a + (i + 1) * step) for i, x in enumerate(said)]
    heard = " ".join(w for w, _, _ in words)
    return Spoken(spoken.audio, words, wrong_words(text, heard), spoken.takes)
