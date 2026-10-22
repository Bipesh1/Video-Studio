"""Mix worker: voice, music and sound effects in, one finished sound track out.

Usage:
  uv run python -m studio_audio.mix build --plan runs/<run>/sound-plan.json \
      --voice runs/<run>/audio/voice.wav --out runs/<run>/audio

The plan (contract: shared/src/sound.schema.ts, soundPlanSchema) names the music moods and
when each starts, and the sound effects and when each happens. The worker writes mix.wav, the
music and effects on their own (music.wav, sfx.wav) and mix.json with the measured levels.

Rules of the mix (plan, Part 2 section 4, steps 6 to 8):
  - The voice is never changed. Everything else is set against it.
  - Music dips under the voice and rises in the pauses.
  - Sound effects sit at modest levels, and lower still while someone is speaking.
  - The result is mastered to -14 LUFS with its true peak at or below -1 dB.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

from . import music, sfx
from .files import read_audio, write_wav
from .levels import (
    SAMPLE_RATE,
    TARGET_LUFS,
    TRUE_PEAK_LIMIT_DB,
    db_to_gain,
    gain_to_db,
    level_report,
    loudness,
    master,
)

SR = SAMPLE_RATE

MUSIC_UNDER_VOICE_DB = -17.0
MUSIC_UNDER_VOICE_LONG_DB = -19.0
"""A long video's music sits further under the voice: calmer, for listening longer (the
clear-speech guideline is about 20 dB; a Short keeps its music a little nearer)."""
"""Music loudness against the voice while someone speaks."""
MUSIC_IN_PAUSES_DB = -9.0
"""Music loudness against the voice when nobody speaks."""
MUSIC_ALONE_LUFS = -16.0
"""Music loudness before mastering in a video with no voice at all."""
DUCK_DOWN_S = 0.18
DUCK_UP_S = 0.6
PAUSE_MIN_S = 0.45
"""A gap between words shorter than this is not a pause; the music stays down through it."""
WORD_GAP_S = 0.15
"""Silence this short inside a line is just the space between two words."""
SPEECH_LEAD_S = 0.15
SPEECH_TAIL_S = 0.25
SFX_OVER_VOICE_DB = -4.0
"""Extra drop for an effect that lands while someone is speaking."""
SFX_CEILING_DB = -3.0
"""No effect is ever placed louder than this against the voice, whatever a cue asks."""
SILENT_VOICE_RMS_DB = -23.0
"""Stand-in voice level for placing effects in a video with no voice."""

_FRAME_S = 0.01


def _frames(audio: np.ndarray) -> np.ndarray:
    """Level (RMS) of the sound in 10 ms steps."""
    mono = audio.mean(axis=1) if audio.ndim == 2 else audio
    win = int(_FRAME_S * SR)
    n = len(mono) // win
    if n == 0:
        return np.zeros(0)
    return np.sqrt(np.mean(mono[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)


def speech_activity(voice: np.ndarray, for_music: bool = True) -> np.ndarray:
    """True for every 10 ms step in which someone is speaking.

    For the music, gaps shorter than a pause are filled in and each stretch starts a little
    early and ends a little late, so the music is already down when a word begins. For placing
    effects (for_music=False) only the gaps between words are filled, so an effect that lands
    just after a line is not treated as landing on it."""
    rms = _frames(voice)
    if rms.size == 0 or float(rms.max()) < 1e-5:
        return np.zeros(rms.size, dtype=bool)
    active = 20 * np.log10(rms / rms.max()) > -35.0
    edges = np.flatnonzero(np.diff(np.concatenate([[0], active.astype(np.int8), [0]])))
    starts, ends = edges[::2], edges[1::2]
    out = np.zeros(rms.size, dtype=bool)
    gap = int((PAUSE_MIN_S if for_music else WORD_GAP_S) / _FRAME_S)
    lead = int(SPEECH_LEAD_S / _FRAME_S) if for_music else 0
    tail = int(SPEECH_TAIL_S / _FRAME_S) if for_music else 0
    merged: list[list[int]] = []
    for a, b in zip(starts, ends):
        if merged and a - merged[-1][1] < gap:
            merged[-1][1] = int(b)
        else:
            merged.append([int(a), int(b)])
    for a, b in merged:
        out[max(0, a - lead) : min(rms.size, b + tail)] = True
    return out


def duck_curve(active: np.ndarray, n_samples: int, under_db: float, open_db: float) -> np.ndarray:
    """The music's gain over time, in dB: down quickly when speech starts, up slowly after."""
    if active.size == 0:
        return np.full(n_samples, open_db)
    target = np.where(active, under_db, open_db).astype(np.float64)
    down = 1 - np.exp(-_FRAME_S / (DUCK_DOWN_S / 3))
    up = 1 - np.exp(-_FRAME_S / (DUCK_UP_S / 3))
    out = np.empty_like(target)
    level = target[0]
    for i, want in enumerate(target):
        level += (want - level) * (down if want < level else up)
        out[i] = level
    centres = (np.arange(target.size) + 0.5) * _FRAME_S * SR
    return np.interp(np.arange(n_samples), centres, out)


def _per_sample(steps: np.ndarray, n: int) -> np.ndarray:
    out = np.repeat(steps, int(_FRAME_S * SR))
    return np.concatenate([out, np.zeros(max(0, n - len(out)), dtype=bool)])[:n]


def _rms_db(audio: np.ndarray, mask: np.ndarray | None = None) -> float:
    mono = audio.mean(axis=1) if audio.ndim == 2 else audio
    if mask is not None:
        mono = mono[mask[: len(mono)]] if mask.any() else mono[:0]
    if mono.size == 0:
        return float("-inf")
    return gain_to_db(float(np.sqrt(np.mean(mono**2))))


def _fit(audio: np.ndarray, n: int) -> np.ndarray:
    if len(audio) >= n:
        return audio[:n]
    return np.concatenate([audio, np.zeros((n - len(audio), 2))])


def _balance(audio: np.ndarray, pan: float) -> np.ndarray:
    """Lean a stereo sound left (-1) or right (1) by turning the other side down."""
    pan = float(np.clip(pan, -1, 1))
    return audio * np.array([min(1.0, 1 - pan), min(1.0, 1 + pan)])


HUSH_OUT_S = 0.6
"""How long the music takes to fade away when a quiet stretch begins."""
HUSH_IN_S = 1.5
HUSH_SHARP_S = 0.12
HUSH_SHARP_IN_S = 0.3
"""A drop before a reveal: the music cut quickly, and back almost at once with the hit."""
"""How long it takes to come back in after one."""


def hush_gain(hush: list[dict], n: int) -> np.ndarray:
    """The music's gain, 0 to 1, with every quiet stretch faded out and back in."""
    gain = np.ones(n)
    t = np.arange(n) / SR
    for h in hush:
        start, end = h["fromMs"] / 1000, h["toMs"] / 1000
        fade_out, fade_in = (HUSH_SHARP_S, HUSH_SHARP_IN_S) if h.get("sharp") else (HUSH_OUT_S, HUSH_IN_S)
        out = np.clip((start + fade_out - t) / fade_out, 0, 1)
        back = np.clip((t - end) / fade_in, 0, 1)
        gain = np.minimum(gain, np.where(t < start, 1.0, np.where(t <= end, out, np.maximum(out, back))))
    return gain


def validate_plan(plan: dict) -> dict:
    """Plain-language checks, so a bad plan fails before any sound is made."""
    problems = []
    for i, seg in enumerate(plan.get("music", [])):
        if seg.get("mood") not in music.MOODS:
            problems.append(f'music {i}: there is no mood called "{seg.get("mood")}" (moods: {", ".join(music.MOODS)})')
        if not isinstance(seg.get("startMs"), (int, float)) or seg["startMs"] < 0:
            problems.append(f"music {i}: startMs must be zero or more")
    for i, cue in enumerate(plan.get("sfx", [])):
        try:
            sfx.resolve(str(cue.get("name")))
        except KeyError as exc:
            problems.append(f"sfx {i}: {exc.args[0]}")
        if not isinstance(cue.get("atMs"), (int, float)) or cue["atMs"] < 0:
            problems.append(f"sfx {i}: atMs must be zero or more")
    if problems:
        raise ValueError("The sound plan is not valid:\n" + "\n".join(f"  - {p}" for p in problems))
    return plan


def build(plan: dict, voice: np.ndarray | None, out_dir: Path | None = None, seed: int = 0) -> tuple[np.ndarray, dict]:
    """Make the finished track. `voice` is 48 kHz stereo, or None for a video without one.
    Returns the mastered audio and the report that is also written as mix.json."""
    validate_plan(plan)
    if voice is None:
        if not plan.get("durationMs"):
            raise ValueError("A sound plan without a voice must say how long the video is (durationMs).")
        n = int(plan["durationMs"] / 1000 * SR)
        voice_track = np.zeros((n, 2))
        active = np.zeros(int(n / SR / _FRAME_S), dtype=bool)
        spoken = active
        voice_lufs = float("-inf")
    else:
        n = len(voice)
        voice_track = voice
        active = speech_activity(voice)
        spoken = speech_activity(voice, for_music=False)
        voice_lufs = loudness(voice)
    has_voice = bool(active.any() and np.isfinite(voice_lufs))
    active_samples = _per_sample(active, n)
    spoken_samples = _per_sample(spoken, n)
    speech_db = _rms_db(voice_track, spoken_samples) if has_voice else SILENT_VOICE_RMS_DB

    # Music: every mood arrives at the same loudness, then follows the voice.
    trim = float(plan.get("musicGainDb", 0.0))
    music_track = np.zeros((n, 2))
    if plan.get("music"):
        score = plan.get("score")
        # The video's own music: its seed, key, speed and instruments (2026-10-21).
        stem = _fit(music.arc(plan["music"], n / SR, int(score["seed"]) if score else seed, score), n)
        under_db = MUSIC_UNDER_VOICE_LONG_DB if score and score.get("profile") == "long" else MUSIC_UNDER_VOICE_DB
        if has_voice:
            under = voice_lufs + under_db - music.STEM_LUFS + trim
            opened = voice_lufs + MUSIC_IN_PAUSES_DB - music.STEM_LUFS + trim
            curve = duck_curve(active, n, under, opened)
        else:
            curve = np.full(n, MUSIC_ALONE_LUFS - music.STEM_LUFS + trim)
        music_track = stem * (10 ** (curve / 20))[:, None] * hush_gain(plan.get("hush", []), n)[:, None]

    # Effects: each one is placed against the level of the speech.
    sfx_track = np.zeros((n, 2))
    placed = []
    for cue in sorted(plan.get("sfx", []), key=lambda c: c["atMs"]):
        effect = sfx.resolve(cue["name"])
        start = int(cue["atMs"] / 1000 * SR)
        if start >= n:
            continue
        seconds = cue["durationMs"] / 1000 if cue.get("durationMs") else None
        if effect.ambient and seconds is None:
            seconds = (n - start) / SR
        clip = sfx.make(effect.name, seconds, int(cue.get("seed", 0)))
        clip = clip[: n - start]
        over_voice = bool(spoken_samples[start : start + len(clip)].mean() > 0.2) if has_voice else False
        level = min(SFX_CEILING_DB, effect.level_db + float(cue.get("gainDb", 0.0)))
        if over_voice:
            level += SFX_OVER_VOICE_DB
        gain = speech_db + level - sfx.WORKING_LEVEL_DB
        sfx_track[start : start + len(clip)] += _balance(clip, float(cue.get("pan", 0.0))) * db_to_gain(gain)
        placed.append(
            {
                "name": effect.name,
                "atMs": int(cue["atMs"]),
                "seconds": round(len(clip) / SR, 2),
                "levelAgainstVoiceDb": round(level, 1),
                "overVoice": over_voice,
            }
        )

    mixed, report = master(voice_track + music_track + sfx_track)
    if report.get("silent"):
        raise ValueError("The mix is silent: the plan has no music and no effects, and there is no voice.")
    # The stems get the same overall gain as the mix, so they add up to it (before limiting).
    stem_gain = db_to_gain(report["lufs"] - loudness(voice_track + music_track + sfx_track))
    pauses = ~active_samples
    report.update(
        {
            "version": 1,
            "audioFile": "mix.wav",
            "sampleRate": SR,
            "durationMs": round(n / SR * 1000),
            "targetLufs": TARGET_LUFS,
            "truePeakLimitDb": TRUE_PEAK_LIMIT_DB,
            "hasVoice": has_voice,
            "voiceLufs": round(voice_lufs, 2) if has_voice else None,
            "speechShare": round(float(spoken_samples.mean()), 3) if has_voice else 0.0,
            "musicUnderVoiceDb": round(_rms_db(music_track, spoken_samples) - speech_db, 1)
            if has_voice and plan.get("music")
            else None,
            "musicInPausesDb": round(_rms_db(music_track, pauses) - speech_db, 1)
            if has_voice and plan.get("music") and pauses.any()
            else None,
            "music": [{"mood": s["mood"], "startMs": int(s["startMs"])} for s in sorted(plan.get("music", []), key=lambda s: s["startMs"])],
            "sfx": placed,
        }
    )
    if out_dir is not None:
        out_dir = Path(out_dir)
        write_wav(out_dir / "mix.wav", mixed)
        write_wav(out_dir / "music.wav", music_track * stem_gain)
        write_wav(out_dir / "sfx.wav", sfx_track * stem_gain)
        (out_dir / "mix.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return mixed, report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("build", help="mix a voice track with the music and effects of a sound plan")
    p.add_argument("--plan", type=Path, required=True)
    p.add_argument("--voice", type=Path, help="the voice track; leave out for a video with no voice")
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--seed", type=int, default=0)
    args = parser.parse_args(argv)
    plan = json.loads(args.plan.read_text(encoding="utf-8"))
    voice = read_audio(args.voice) if args.voice else None
    try:
        _, report = build(plan, voice, args.out, args.seed)
    except ValueError as exc:
        print(exc)
        return 1
    print(
        f"{args.out / 'mix.wav'}: {report['durationMs'] / 1000:.2f} s, {report['lufs']} LUFS, "
        f"true peak {report['truePeakDb']} dB, {len(report['music'])} music moods, {len(report['sfx'])} effects"
        + (f", music {report['musicUnderVoiceDb']} dB under the voice" if report["musicUnderVoiceDb"] is not None else "")
    )
    return 0 if report["onTarget"] and not report["clipped"] else 1


if __name__ == "__main__":
    sys.exit(main())
