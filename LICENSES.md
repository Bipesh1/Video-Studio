# Licenses

Every third-party tool, library, font and sound asset used by Video Studio, with its license. Update this file whenever something is added.

## Tools installed on the machine (Phase 0)

| Tool       | Version                     | License                                      | How installed                       | Notes                                                               |
| ---------- | --------------------------- | -------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| Node.js    | 24.12.0                     | MIT                                          | already present (`F:\node.exe`)     |                                                                     |
| npm        | 11.6.2                      | Artistic-2.0                                 | with Node                           |                                                                     |
| git        | 2.39.1                      | GPL-2.0                                      | already present                     | local history only                                                  |
| uv         | 0.12.22                     | MIT or Apache-2.0                            | Scoop (main bucket)                 | Python environment manager                                          |
| FFmpeg     | 9.0.2 full build (gyan.dev) | GPL-3.0 (full build includes GPL components) | Scoop (main bucket)                 | Used as a command-line tool only, never linked into the application |
| espeak-ng  | 1.52.0                      | GPL-3.0-or-later                             | Scoop (main bucket)                 | Used by Kokoro as a command-line phonemizer fallback only           |
| FluidSynth | 2.6.1                       | LGPL-2.1                                     | Scoop (extras bucket)               | Used as a command-line tool to turn MIDI into audio                 |
| Python     | 3.11                        | PSF                                          | already present, managed through uv |                                                                     |

## Libraries

| Library                                                          | License                         | Notes                                                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Remotion 4.x                                                     | Remotion License                | Free for individuals and for-profit organizations of up to 3 employees. Above that a company license is needed. See remotion.dev/license |
| React 19                                                         | MIT                             |                                                                                                                                          |
| Zod 4                                                            | MIT                             |                                                                                                                                          |
| TypeScript, Vitest, tsx, ESLint, Prettier                        | MIT (Apache-2.0 for TypeScript) | development only                                                                                                                         |
| Kokoro TTS (`kokoro` Python package, model `hexgrad/Kokoro-82M`) | Apache-2.0                      | Model weights download on first use                                                                                                      |
| music21                                                          | BSD-3-Clause                    |                                                                                                                                          |
| pydub                                                            | MIT                             |                                                                                                                                          |
| scipy, numpy                                                     | BSD-3-Clause                    |                                                                                                                                          |
| soundfile                                                        | BSD-3-Clause                    | bundles libsndfile (LGPL-2.1)                                                                                                            |
| pyloudnorm                                                       | MIT                             | loudness measurement                                                                                                                     |
| pytest                                                           | MIT                             | development only                                                                                                                         |

## Fonts

| Font                                   | License                   | Where                                                                         | Notes                                                                                                   |
| -------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Fredoka (variable, weights 300 to 700) | SIL Open Font License 1.1 | `engine/public/fonts/Fredoka-Variable.ttf`, license text in `Fredoka-OFL.txt` | Caption and label font (Style 9: heavy rounded sans-serif). Downloaded from the google/fonts repository |

## Voice

| Item                                  | License          | Notes                                                                          |
| ------------------------------------- | ---------------- | ------------------------------------------------------------------------------ |
| Kokoro-82M model and voices (hexgrad) | Apache-2.0       | Downloaded on first use into the Hugging Face cache (about 330 MB with voices) |
| misaki (Kokoro phonemizer)            | Apache-2.0       | installed with kokoro                                                          |
| spaCy en_core_web_sm 3.8.0            | MIT              | English grammar model misaki loads; pinned in `audio/pyproject.toml`           |
| espeak-ng (fallback phonemes)         | GPL-3.0-or-later | command-line tool only                                                         |

## SoundFonts and sound assets

| Asset                                                 | License                     | Notes                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GeneralUser GS 2.0.3 SoundFont (S. Christian Collins) | GeneralUser GS License v2.0 | The instruments FluidSynth plays the music with. Free for private and commercial music. Downloaded once into `audio/soundfonts/` (32 MB, not kept in git) from the author's repository, pinned to one commit and checked by its SHA-256 (`audio/src/studio_audio/soundfont.py`). The full license text is in `audio/soundfonts/GeneralUser-GS-LICENSE.txt`. |
| Music                                                 | made by the studio          | Every tune is written by `audio/src/studio_audio/music.py` from chords and scales. No recording or existing melody is used.                                                                                                                                                                                                                                 |
| Sound effects                                         | made by the studio          | Every effect is synthesized by `audio/src/studio_audio/sfx.py` with numpy and scipy. No sample library is used.                                                                                                                                                                                                                                             |

**One caution about the SoundFont.** Its author says some of its instrument samples came from free banks on the internet and he cannot be fully sure where every one began, though none came from a commercial product and nobody has complained since 2000. That is normal for free SoundFonts and the license allows making money from music made with it. If Biku ever wants no doubt at all, drop another `.sf2` into `audio/soundfonts/` (for example FluidR3_GM, MIT license, 140 MB) or put finished tracks in `music/`; nothing else has to change.

Files Biku adds to `music/` or `sfx/` replace the studio's own sounds. Their licenses are Biku's to check and should be listed here.

## Reference images

The two images in `styles/ink-stick/reference/` were supplied by Biku as style references only. They define a look, not characters to copy. No artwork is traced or copied from them.
