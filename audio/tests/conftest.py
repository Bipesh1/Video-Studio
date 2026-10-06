"""Shared helpers for the sound tests."""

import re

import numpy as np
import pytest

from studio_audio.levels import SAMPLE_RATE, set_loudness
from studio_audio.paths import PROJECT_ROOT
from studio_audio.soundfont import SoundFontMissing, find_soundfont


def names_in_shared(constant: str) -> list[str]:
    """The names in one of the lists in shared/src/sound.schema.ts, which the engine reads."""
    text = (PROJECT_ROOT / "shared" / "src" / "sound.schema.ts").read_text(encoding="utf-8")
    block = re.search(rf"export const {constant}\b[^=]*=\s*\[(.*?)\]", text, re.S)
    assert block, f"{constant} is not in shared/src/sound.schema.ts"
    return re.findall(r"'([a-z-]+)'", block.group(1))


@pytest.fixture(scope="session")
def soundfont():
    """Music tests need the instrument set. Without it they are skipped, and the doctor
    command says how to get it."""
    try:
        return find_soundfont()
    except SoundFontMissing as exc:
        pytest.skip(str(exc))


@pytest.fixture(scope="session")
def fake_voice() -> np.ndarray:
    """Twelve seconds that behave like narration: three stretches of speech-shaped noise with
    pauses between, at the loudness the voice worker delivers."""
    rng = np.random.default_rng(7)
    n = SAMPLE_RATE * 12
    t = np.arange(n) / SAMPLE_RATE
    carrier = rng.standard_normal(n)
    # Syllables: the level rises and falls about four times a second while "speaking".
    syllables = 0.55 + 0.45 * np.sin(2 * np.pi * 4.3 * t)
    speaking = ((t > 0.5) & (t < 3.5)) | ((t > 5.0) & (t < 8.0)) | ((t > 9.5) & (t < 11.2))
    mono = carrier * syllables * speaking
    # Keep it in the range of a voice.
    from scipy.signal import butter, sosfilt

    mono = sosfilt(butter(2, [200 / 24000, 3500 / 24000], btype="bandpass", output="sos"), mono)
    mono = mono * speaking
    stereo = np.stack([mono, mono], axis=1)
    return set_loudness(stereo, -14.0)
