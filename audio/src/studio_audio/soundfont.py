"""The instrument set FluidSynth plays the music with.

Usage:
  uv run python -m studio_audio.soundfont fetch     download it once (32 MB, into the project)
  uv run python -m studio_audio.soundfont where     print which file is in use

The file is GeneralUser GS 2.0.3 by S. Christian Collins (GeneralUser GS License v2.0: free for
private and commercial music; see audio/soundfonts/GeneralUser-GS-LICENSE.txt and LICENSES.md).
It is not kept in git. Any other .sf2 placed in audio/soundfonts/ is used if this one is absent,
and the STUDIO_SOUNDFONT environment variable overrides both.
"""

from __future__ import annotations

import hashlib
import os
import sys
import urllib.request
from pathlib import Path

from .paths import SOUNDFONT_DIR

NAME = "GeneralUser-GS.sf2"
VERSION = "2.0.3"
# Pinned to one commit of the author's own repository, so every machine gets the same sounds.
COMMIT = "97049183643d5fc5a9322a69c5b09efb667c6c3a"
URL = f"https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/{COMMIT}/{NAME}"
SHA256 = "9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe"


class SoundFontMissing(RuntimeError):
    pass


def find_soundfont() -> Path:
    """The instrument file to use, or a plain-language error saying how to get it."""
    env = os.environ.get("STUDIO_SOUNDFONT")
    if env and Path(env).is_file():
        return Path(env)
    pinned = SOUNDFONT_DIR / NAME
    if pinned.is_file():
        return pinned
    others = sorted(SOUNDFONT_DIR.glob("*.sf2")) + sorted(SOUNDFONT_DIR.glob("*.sf3"))
    if others:
        return others[0]
    raise SoundFontMissing(
        "The instrument set for the music is not installed. Get it once with:\n"
        "  cd audio && uv run python -m studio_audio.soundfont fetch"
    )


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def fetch() -> Path:
    target = SOUNDFONT_DIR / NAME
    if target.is_file() and sha256_of(target) == SHA256:
        return target
    SOUNDFONT_DIR.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(".part")
    urllib.request.urlretrieve(URL, partial)  # noqa: S310 - fixed https address, pinned commit
    found = sha256_of(partial)
    if found != SHA256:
        partial.unlink()
        raise RuntimeError("The downloaded instrument set is not the expected file. Nothing was installed.")
    partial.replace(target)
    return target


def main(argv: list[str] | None = None) -> int:
    cmd = (argv if argv is not None else sys.argv[1:] or ["where"])[0]
    if cmd == "fetch":
        print(f"Instrument set ready: {fetch()}")
        return 0
    try:
        print(find_soundfont())
    except SoundFontMissing as exc:
        print(exc)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
