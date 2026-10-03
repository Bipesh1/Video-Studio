"""Voice worker: script lines in, one voice track (WAV) and word timings (JSON) out.

Usage:
  uv run python -m studio_audio.voice synth --script runs/<run>/voice-script.json --out runs/<run>/audio
  uv run python -m studio_audio.voice audition --out runs/<run>/out

The engine reads timings.json (contract: shared/src/voice.schema.ts, voiceTrackSchema).
Kokoro is behind the VoiceProvider interface so another voice service can replace it later.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

TARGET_LUFS = -17.0
"""Mono voice stem loudness. Played on both stereo channels it measures about 3 LU louder,
so a video with only the voice lands near -14 LUFS. Phase 3 masters the full mix."""
PEAK_LIMIT = 10 ** (-1.5 / 20)
"""Sample-peak ceiling of -1.5 dBFS, leaving room for AAC encoding to stay under -1 dB true peak."""

AMERICAN_VOICES = [
    # id, grade from the Kokoro-82M VOICES.md table
    ("af_heart", "A"), ("af_bella", "A-"), ("af_nicole", "B-"), ("af_aoede", "C+"),
    ("af_kore", "C+"), ("af_sarah", "C+"), ("af_alloy", "C"), ("af_nova", "C"),
    ("af_sky", "C-"), ("af_jessica", "D"), ("af_river", "D"),
    ("am_fenrir", "C+"), ("am_michael", "C+"), ("am_puck", "C+"), ("am_echo", "D"),
    ("am_eric", "D"), ("am_liam", "D"), ("am_onyx", "D"), ("am_santa", "D-"), ("am_adam", "F+"),
]


@dataclass
class TimedWord:
    text: str
    start: float  # seconds, relative to the start of this synthesis
    end: float


@dataclass
class Synthesis:
    audio: np.ndarray  # mono float32
    words: list[TimedWord] = field(default_factory=list)
    timing_source: str = "kokoro"  # or "estimated"


class VoiceProvider(Protocol):
    """Anything that turns text into speech with word timings."""

    sample_rate: int

    def synthesize(self, text: str, voice: str, speed: float) -> Synthesis: ...


WORD_RE = re.compile(r"[A-Za-z0-9']")


def _is_word(token_text: str) -> bool:
    return bool(WORD_RE.search(token_text))


class KokoroProvider:
    """Kokoro-82M, American English pipeline (lang_code 'a'), Apache 2.0."""

    sample_rate = 24000

    def __init__(self) -> None:
        from kokoro import KPipeline  # imported here so --help works without loading torch

        self._pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")

    def synthesize(self, text: str, voice: str, speed: float) -> Synthesis:
        chunks: list[np.ndarray] = []
        words: list[TimedWord] = []
        offset = 0.0
        has_timestamps = True
        for result in self._pipe(text, voice=voice, speed=speed):
            if result.audio is None:
                continue
            audio = result.audio.detach().cpu().numpy() if hasattr(result.audio, "detach") else np.asarray(result.audio)
            audio = audio.astype(np.float32).reshape(-1)
            for tok in getattr(result, "tokens", None) or []:
                if not _is_word(tok.text):
                    continue
                start = getattr(tok, "start_ts", None)
                end = getattr(tok, "end_ts", None)
                if start is None or end is None:
                    has_timestamps = False
                    words.append(TimedWord(tok.text, offset, offset))
                else:
                    words.append(TimedWord(tok.text, offset + float(start), offset + float(end)))
            chunks.append(audio)
            offset += len(audio) / self.sample_rate
        audio = np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)
        if not has_timestamps or not words:
            return Synthesis(audio, estimate_words(text, audio, self.sample_rate), "estimated")
        return Synthesis(audio, words, "kokoro")


def speech_bounds(audio: np.ndarray, sr: int, threshold_db: float = -40.0) -> tuple[float, float]:
    """First and last moment the audio is louder than threshold, in seconds (10 ms windows)."""
    if audio.size == 0:
        return 0.0, 0.0
    win = max(1, sr // 100)
    n = audio.size // win
    if n == 0:
        return 0.0, audio.size / sr
    rms = np.sqrt(np.mean(audio[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms / (np.max(rms) + 1e-12))
    loud = np.where(db > threshold_db)[0]
    if loud.size == 0:
        return 0.0, audio.size / sr
    return loud[0] * win / sr, (loud[-1] + 1) * win / sr


def estimate_words(text: str, audio: np.ndarray, sr: int) -> list[TimedWord]:
    """Fallback timings: spread the speech time across the words by their length."""
    plain = [w for w in strip_markup(text).split() if _is_word(w)]
    start, end = speech_bounds(audio, sr)
    weights = np.array([len(w) + 1 for w in plain], dtype=float)
    edges = start + np.concatenate([[0.0], np.cumsum(weights)]) / weights.sum() * (end - start)
    return [TimedWord(w, float(edges[i]), float(edges[i + 1])) for i, w in enumerate(plain)]


def strip_markup(text: str) -> str:
    return text.replace("*", "")


def script_words(text: str) -> list[tuple[str, bool]]:
    """Display words with emphasis flags. *word* or *two words* marks emphasis."""
    out: list[tuple[str, bool]] = []
    emphasis = False
    for raw in text.split():
        starts = raw.startswith("*") or raw.lstrip("\"'(").startswith("*")
        if starts:
            emphasis = True
        word = raw.replace("*", "")
        out.append((word, emphasis))
        if raw.rstrip(".,!?;:\"')").endswith("*"):
            emphasis = False
    return [(w, e) for w, e in out if w]


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def align(display: list[tuple[str, bool]], timed: list[TimedWord]) -> list[tuple[str, bool, float, float]]:
    """Give each display word (with its punctuation) the time of the model tokens that spell it."""
    out: list[tuple[str, bool, float, float]] = []
    j = 0
    for word, emph in display:
        target = _norm(word)
        if not target:
            continue
        if j >= len(timed):
            last = out[-1][3] if out else 0.0
            out.append((word, emph, last, last))
            continue
        start = timed[j].start
        acc = ""
        end = timed[j].end
        while j < len(timed) and len(acc) < len(target):
            acc += _norm(timed[j].text)
            end = timed[j].end
            j += 1
        out.append((word, emph, start, end))
    return out


def limit(audio: np.ndarray, sr: int, ceiling: float = PEAK_LIMIT) -> np.ndarray:
    """Peak limiter: turns down only the moments that would pass the ceiling, with a fast
    attack (2 ms look-ahead) and a 60 ms release, so speech keeps its loudness."""
    if audio.size == 0:
        return audio
    look = max(1, int(sr * 0.002))
    env = np.abs(audio)
    # Look-ahead: each sample sees the loudest sample in the next 2 ms.
    padded = np.concatenate([env, np.zeros(look, dtype=env.dtype)])
    peak = np.lib.stride_tricks.sliding_window_view(padded, look + 1).max(axis=1)[: env.size]
    target = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    release = np.exp(-1.0 / (sr * 0.06))
    gain = np.empty_like(target)
    g = 1.0
    for i, t in enumerate(target):
        g = t if t < g else t + (g - t) * release
        gain[i] = g
    return (audio * gain).astype(np.float32)


def normalize(audio: np.ndarray, sr: int) -> tuple[np.ndarray, float]:
    """Bring speech to TARGET_LUFS with peaks held under the ceiling. Two passes, because
    limiting a little lowers the loudness."""
    meter = pyln.Meter(sr)
    out = audio.astype(np.float64)
    for _ in range(2):
        loud = meter.integrated_loudness(out)
        if not np.isfinite(loud):
            break
        out = pyln.normalize.loudness(out, loud, TARGET_LUFS)
        out = limit(out.astype(np.float32), sr).astype(np.float64)
    final = meter.integrated_loudness(out)
    return out.astype(np.float32), float(final) if np.isfinite(final) else TARGET_LUFS


def synth(script_path: Path, out_dir: Path, provider: VoiceProvider | None = None) -> dict:
    script = json.loads(script_path.read_text(encoding="utf-8"))
    provider = provider or KokoroProvider()
    sr = provider.sample_rate
    lead = int(script.get("leadInMs", 300))
    tail = int(script.get("tailMs", 800))
    pieces = [np.zeros(int(sr * lead / 1000), dtype=np.float32)]
    cursor = lead / 1000
    lines_out, words_out, sources = [], [], set()
    for line in script["lines"]:
        s = provider.synthesize(strip_markup(line["text"]), line["voice"], float(line.get("speed", 1.0)))
        sources.add(s.timing_source)
        # Trim the model's leading and trailing silence so pauses are exactly what the script asks.
        a, b = speech_bounds(s.audio, sr)
        a = max(0.0, a - 0.03)
        b = min(len(s.audio) / sr, b + 0.08)
        clip = s.audio[int(a * sr) : int(b * sr)]
        aligned = align(script_words(line["text"]), s.words)
        line_start = cursor
        for word, emph, ws, we in aligned:
            ws_abs = line_start + max(0.0, ws - a)
            we_abs = line_start + min(max(0.0, we - a), len(clip) / sr)
            words_out.append(
                {
                    "text": word,
                    "startMs": round(ws_abs * 1000),
                    "endMs": round(max(we_abs, ws_abs) * 1000),
                    "lineId": line["id"],
                    "emphasis": emph,
                }
            )
        cursor += len(clip) / sr
        lines_out.append(
            {
                "id": line["id"],
                "speaker": line["speaker"],
                "voice": line["voice"],
                "text": strip_markup(line["text"]),
                "startMs": round(line_start * 1000),
                "endMs": round(cursor * 1000),
            }
        )
        pause = int(line.get("pauseAfterMs", 500))
        pieces.append(clip)
        pieces.append(np.zeros(int(sr * pause / 1000), dtype=np.float32))
        cursor += pause / 1000
    pieces.append(np.zeros(int(sr * tail / 1000), dtype=np.float32))
    audio, lufs = normalize(np.concatenate(pieces), sr)
    out_dir.mkdir(parents=True, exist_ok=True)
    wav = out_dir / "voice.wav"
    sf.write(wav, audio, sr, subtype="PCM_16")
    track = {
        "version": 1,
        "audioFile": wav.name,
        "sampleRate": sr,
        "durationMs": round(len(audio) / sr * 1000),
        "timingSource": "kokoro" if sources == {"kokoro"} else "estimated",
        "loudnessLufs": round(lufs, 2),
        "lines": lines_out,
        "words": words_out,
    }
    (out_dir / "timings.json").write_text(json.dumps(track, indent=2), encoding="utf-8")
    return track


def audition(out_dir: Path, lines: list[str], provider: VoiceProvider | None = None) -> dict:
    """The same lines in every American English Kokoro voice, as MP3s plus one combined file."""
    provider = provider or KokoroProvider()
    sr = provider.sample_rate
    out_dir.mkdir(parents=True, exist_ok=True)
    gap = np.zeros(int(sr * 1.2), dtype=np.float32)
    combined: list[np.ndarray] = []
    index = []
    cursor = 0.0
    for voice, grade in AMERICAN_VOICES:
        parts = []
        for text in lines:
            s = provider.synthesize(strip_markup(text), voice, 1.0)
            a, b = speech_bounds(s.audio, sr)
            parts += [s.audio[int(a * sr) : int(b * sr)], np.zeros(int(sr * 0.45), dtype=np.float32)]
        clip, lufs = normalize(np.concatenate(parts), sr)
        wav = out_dir / f"{voice}.wav"
        sf.write(wav, clip, sr, subtype="PCM_16")
        mp3 = out_dir / f"{voice}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", "128k", str(mp3)], check=True)
        wav.unlink()
        index.append({"voice": voice, "grade": grade, "file": mp3.name, "startsAtSec": round(cursor, 1), "lufs": round(lufs, 1)})
        combined += [clip, gap]
        cursor += (len(clip) + len(gap)) / sr
        print(f"  {voice} ({grade})", flush=True)
    all_wav = out_dir / "all-voices.wav"
    sf.write(all_wav, np.concatenate(combined), sr, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(all_wav), "-b:a", "128k", str(out_dir / "all-voices.mp3")], check=True)
    all_wav.unlink()
    result = {"lines": [strip_markup(t) for t in lines], "voices": index, "combinedFile": "all-voices.mp3"}
    (out_dir / "audition.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_synth = sub.add_parser("synth", help="speak a voice script into voice.wav and timings.json")
    p_synth.add_argument("--script", type=Path, required=True)
    p_synth.add_argument("--out", type=Path, required=True)
    p_aud = sub.add_parser("audition", help="the same lines in every American English voice")
    p_aud.add_argument("--out", type=Path, required=True)
    p_aud.add_argument("--line", action="append", required=True, help="a line to speak; repeat for more")
    args = parser.parse_args(argv)
    if args.cmd == "synth":
        track = synth(args.script, args.out)
        print(f"voice.wav: {track['durationMs'] / 1000:.2f} s, {len(track['words'])} words, timings from {track['timingSource']}, {track['loudnessLufs']} LUFS")
    else:
        result = audition(args.out, args.line)
        print(f"{len(result['voices'])} voices written to {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
