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

To be added in Phase 1: one heavy rounded open-licensed font, bundled locally. Candidate: Fredoka (SIL Open Font License 1.1).

## SoundFonts and sound assets

To be added in Phase 3: one free-licensed SoundFont for FluidSynth. Candidate: GeneralUser GS (GeneralUser GS License, free for any use) or FluidR3_GM (MIT).

## Reference images

The two images in `styles/ink-stick/reference/` were supplied by Biku as style references only. They define a look, not characters to copy. No artwork is traced or copied from them.
