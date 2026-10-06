"""Where the audio workers find things in the project."""

from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
AUDIO_DIR = PROJECT_ROOT / "audio"
SOUNDFONT_DIR = AUDIO_DIR / "soundfonts"
MUSIC_OVERRIDES = PROJECT_ROOT / "music"
"""Drop a track named after a mood here (for example music/tense.mp3) to use it instead."""
SFX_OVERRIDES = PROJECT_ROOT / "sfx"
"""Drop a sound named after an effect here (for example sfx/whoosh.wav) to use it instead."""
SCRATCH = PROJECT_ROOT / ".cache" / "audio"
"""Work files stay inside the project, never in the system temporary folder (lesson L-0018)."""

AUDIO_SUFFIXES = (".wav", ".flac", ".ogg", ".mp3", ".m4a")


def find_override(folder: Path, name: str) -> Path | None:
    """The first file in the folder called <name> with an audio ending, if there is one."""
    for suffix in AUDIO_SUFFIXES:
        candidate = folder / f"{name}{suffix}"
        if candidate.is_file():
            return candidate
    return None
