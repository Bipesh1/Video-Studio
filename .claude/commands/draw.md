---
description: Draw a new asset (character part, costume, hair, prop, set piece, effect) in the Ink Stick style and add it to the library
argument-hint: <what to draw, in plain words>
---

Draw this new asset for the Video Studio library: $ARGUMENTS

Follow the draw, look and fix loop (Build Plan Part 2, section 6). Do every step in order. Report to Biku in plain language, with no code terms.

## 1. Search first

Run `npm run library -- search <plain words for the thing>` with two or three different wordings. Look at the stills of anything that comes back (`still:` in the result).

- If an existing asset already does the job, stop. Tell Biku which one, show its still, and say how a scene asks for it (`use:` in the result).
- If an existing asset is close, prefer adding an option to it (a color, a size, a variant) over drawing a second one.
- Only draw what is truly missing.

## 2. Read the rules

- Read all of `styles/ink-stick/guide.md`.
- Read `knowledge/playbooks/styles/ink-stick.md`.
- Look at both pictures in `styles/ink-stick/reference/`.
- Open the code of the most similar existing asset (`npm run library -- list --kind=<kind>` shows them) and follow how it is built.

If the asset has a counterpart in a reference picture, measure the reference before drawing: enlarge it 8 times with a grid and read sizes, positions and line thickness in head units (lesson L-0007).

## 3. Draw it

- Write it as an SVG React component in the right folder under `engine/src/` (CLAUDE.md, "Where the drawing code lives").
- Take every color, line weight and proportion from `styles/ink-stick/tokens.json` through `engine/src/tokens.ts`. Never type a color or a line weight by hand.
- Expose the options a scene will need (colors, size, pose or state).
- Original designs only: nothing copied from an existing channel, character, logo or brand.

## 4. Add it to the library

- Add a preview for it in `engine/src/library/previews.tsx`, keyed by its id `<kind>/<name>`.
- Add its entry to `library/index.json`: id, kind, name, one plain sentence of description, at least six tags a script might use for it (what it is, who uses it, where, when, mood), the code file and exported name, a short `use` hint, the still path `knowledge/golden/assets/<kind>-<name>.png`, `version: 1` and today's date.

## 5. Render, look, fix

1. `npm run library -- look <id>` renders it in front, three-quarter and profile views on a light and a dark field, plus a phone-size copy, into `engine/out/library/`.
2. Open both pictures and look at them. Run the Style Check (guide, Style 11) on what you see.
3. Check it on a character in a pose too if it is worn or held: which arm is in front, does anything poke through an outline, is any hand or key detail in the caption area.
4. Fix what fails and render again. Stop after 4 rounds and tell Biku what still looks wrong, instead of looping.

## 6. Save it

1. `npm run library -- stills --only=<id>` writes its golden still.
2. `npm run library -- catalog` refreshes the picture catalog in `library/catalog/`.
3. `npm run library -- check`, then `npm test`, `npm run typecheck`, `npm run lint` and `npm run format` must all pass.
4. Commit.

## 7. Tell Biku

In a few plain sentences: what was drawn, where its picture is (the golden still and the catalog page), what it can be combined with, and anything that still looks off.
