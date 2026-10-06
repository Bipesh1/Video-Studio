"""Print the version of every Python package and external tool the audio workers use.

Run with:  uv run python -m studio_audio.doctor
"""

from __future__ import annotations

import importlib
import shutil
import subprocess
import sys

PACKAGES = ["kokoro", "torch", "soundfile", "music21", "pydub", "scipy", "numpy", "pyloudnorm"]
TOOLS = [("ffmpeg", ["-version"]), ("espeak-ng", ["--version"]), ("fluidsynth", ["--version"])]


def package_version(name: str) -> str:
    try:
        module = importlib.import_module(name)
    except Exception as exc:  # noqa: BLE001 - report any failure plainly
        return f"MISSING ({exc.__class__.__name__}: {exc})"
    return str(getattr(module, "__version__", "installed, no version attribute"))


def tool_version(name: str, args: list[str]) -> str:
    exe = shutil.which(name)
    if exe is None:
        return "MISSING (not on PATH)"
    try:
        out = subprocess.run([exe, *args], capture_output=True, text=True, timeout=30, check=False)
    except Exception as exc:  # noqa: BLE001
        return f"MISSING ({exc})"
    text = (out.stdout or out.stderr).strip().splitlines()
    return text[0] if text else f"exit code {out.returncode}"


def soundfont_report() -> str:
    from .soundfont import NAME, SHA256, SoundFontMissing, find_soundfont, sha256_of

    try:
        path = find_soundfont()
    except SoundFontMissing:
        return "MISSING (run: uv run python -m studio_audio.soundfont fetch)"
    size = path.stat().st_size / 1e6
    if path.name == NAME and sha256_of(path) != SHA256:
        return f"{path.name}, {size:.0f} MB, but not the expected file (fetch it again)"
    return f"{path.name}, {size:.0f} MB"


def main() -> int:
    print(f"python     {sys.version.split()[0]}  ({sys.executable})")
    missing = 0
    for name in PACKAGES:
        v = package_version(name)
        missing += v.startswith("MISSING")
        print(f"{name:<11}{v}")
    for name, args in TOOLS:
        v = tool_version(name, args)
        missing += v.startswith("MISSING")
        print(f"{name:<11}{v}")
    font = soundfont_report()
    missing += font.startswith("MISSING")
    print(f"{'soundfont':<11}{font}")
    print("All audio dependencies present." if missing == 0 else f"{missing} missing.")
    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
