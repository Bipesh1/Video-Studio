"""Environment smoke tests: every audio dependency imports and the external tools answer."""

import shutil

import pytest


@pytest.mark.parametrize(
    "name", ["kokoro", "soundfile", "music21", "pydub", "scipy", "numpy", "pyloudnorm"]
)
def test_package_imports(name: str) -> None:
    __import__(name)


@pytest.mark.parametrize("tool", ["ffmpeg", "espeak-ng", "fluidsynth"])
def test_external_tool_on_path(tool: str) -> None:
    assert shutil.which(tool) is not None, f"{tool} is not on PATH"
