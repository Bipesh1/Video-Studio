"""A ten-second sample of a character's Kokoro voice, for Chatterbox to copy.

Chatterbox speaks in whatever voice it is given a short recording of. Each game theory voice
gives it a sample of that character's own Kokoro voice (with its blend and pace), so a
character sounds like the same person, only more alive (Biku, 2026-10-14: "yes use chatterbox
of course"). The sample is a plain passage nobody hears in a video.

  uv run python -m studio_audio.voice_sample --voice trainer [--voice saint ...]

writes voices/samples/<id>.wav at the project root.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import soundfile as sf

from studio_audio.voice import KokoroProvider, normalize, speech_bounds

ROOT = Path(__file__).resolve().parents[3]
SAMPLE = (
    "This is the voice I use every day. I talk at an even pace, in full sentences, and I do not "
    "hurry. Listen to how it rises and falls when I say something that matters."
)


def make_sample(voice_id: str, provider: KokoroProvider) -> Path:
    profile = json.loads((ROOT / "voices" / f"{voice_id}.json").read_text(encoding="utf-8"))
    mixed = profile.get("blend") or []
    rest = 1 - sum(float(m["share"]) for m in mixed)
    voice = (
        tuple([(profile["kokoroVoice"], round(rest, 2))] + [(m["kokoroVoice"], float(m["share"])) for m in mixed])
        if mixed
        else profile["kokoroVoice"]
    )
    s = provider.synthesize(SAMPLE, voice, float(profile["speed"]))
    a, b = speech_bounds(s.audio, provider.sample_rate)
    clip, _ = normalize(s.audio[int(a * provider.sample_rate) : int(b * provider.sample_rate)], provider.sample_rate)
    out = ROOT / "voices" / "samples" / f"{voice_id}.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, clip, provider.sample_rate, subtype="PCM_16")
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--voice", action="append", required=True)
    args = parser.parse_args(argv)
    provider = KokoroProvider()
    for voice_id in args.voice:
        out = make_sample(voice_id, provider)
        print(f"  {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
