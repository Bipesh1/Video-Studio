import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KINDS_WITHOUT_STILL, searchLibrary, stillPathFor } from '@studio/shared';
import { describe, expect, it } from 'vitest';
import { SILHOUETTE_KINDS, TREATMENTS } from '../backgrounds/Background';
import { EXPRESSION_NAMES } from '../face/expressions';
import { POSES } from '../rig/poses';
import { HAND_SHAPES } from '../rig/types';
import { tokens } from '../tokens';
import { HAIR_STYLES } from '../wardrobe/hair';
import { FACIAL_HAIR } from '../wardrobe/types';
import { library } from './data';
import { PREVIEWS } from './previews';

/**
 * The library check (Phase 2 acceptance): nothing drawn is missing from library/index.json, and
 * every entry points at code, a preview and a golden still that really exist. A failure names
 * the asset and what is missing. `npm run library -- check` runs this same file.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ids = new Set(library.assets.map((a) => a.id));
const missing = (wanted: string[]) => wanted.filter((id) => !ids.has(id));

/** Component files in a folder that each draw one asset: every file must be in the index. */
const componentFiles = (folder: string) =>
  readdirSync(join(root, folder))
    .filter((f) => /\.tsx$/.test(f) && !/\.test\.tsx$/.test(f))
    .map((f) => `${folder}/${f}`);

describe('library index', () => {
  it('lists every piece the engine can draw by name', () => {
    const wanted = [
      ...EXPRESSION_NAMES.map((n) => `expression/${n}`),
      ...POSES.map((p) => `pose/${p.id}`),
      ...HAND_SHAPES.map((s) => `hand/${s}`),
      ...HAIR_STYLES.map((h) => `hair/${h}`),
      ...FACIAL_HAIR.map((f) => `facial-hair/${f}`),
      ...tokens.skinTones.map((_, i) => `skin/tone-${i + 1}`),
      ...Object.keys(tokens.hair).map((c) => `hair-color/${c}`),
      ...Object.keys(tokens.accents).map((c) => `color/${c}`),
      ...Object.keys(tokens.palettes).map((p) => `palette/${p}`),
      ...TREATMENTS.map((t) => `background/${t}`),
      ...SILHOUETTE_KINDS.map((k) => `silhouette/${k}`),
    ];
    expect(missing(wanted), 'drawn but not in library/index.json').toEqual([]);
  });

  it('has an entry for every costume, prop, effect, camera and overlay file', () => {
    const indexed = new Set(library.assets.map((a) => a.code.file));
    const files = [
      'engine/src/wardrobe/costumes',
      'engine/src/props',
      'engine/src/effects',
      'engine/src/camera',
      'engine/src/overlays',
    ].flatMap(componentFiles);
    expect(
      files.filter((f) => !indexed.has(f)),
      'component files with no entry in library/index.json',
    ).toEqual([]);
  });

  it('points every entry at code that exists and exports the named piece', () => {
    const broken = library.assets.flatMap((a) => {
      const file = join(root, a.code.file);
      if (!existsSync(file)) return [`${a.id}: no file ${a.code.file}`];
      const exported = new RegExp(String.raw`\bexport\b[^\n]*\b${a.code.export}\b`).test(
        readFileSync(file, 'utf8'),
      );
      return exported ? [] : [`${a.id}: ${a.code.file} does not export ${a.code.export}`];
    });
    expect(broken).toEqual([]);
  });

  it('has a preview and a golden still for every asset that can be pictured', () => {
    const problems = library.assets.flatMap((a) => {
      if (KINDS_WITHOUT_STILL.includes(a.kind)) return [];
      const out: string[] = [];
      if (!PREVIEWS[a.id]) out.push(`${a.id}: no preview in engine/src/library/previews.tsx`);
      if (a.still !== stillPathFor(a.id))
        out.push(`${a.id}: still should be ${stillPathFor(a.id)}`);
      else if (!existsSync(join(root, a.still))) {
        out.push(`${a.id}: no golden still yet; run: npm run library -- stills --only=${a.id}`);
      }
      return out;
    });
    expect(problems).toEqual([]);
  });

  it('has no preview without an entry', () => {
    expect(Object.keys(PREVIEWS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('finds assets by tag (Phase 2 acceptance)', () => {
    const first = (q: string) => searchLibrary(library, q)[0]?.asset.id;
    expect(first('king')).toBe('costume/ruler');
    expect(first('crown cape')).toBe('costume/ruler');
    expect(first('scared')).toBe('expression/afraid');
    // A pointing pose and a pointing hand both answer "pointing": both come first.
    const pointing = searchLibrary(library, 'pointing').slice(0, 2);
    expect(pointing.map((h) => h.asset.id).sort()).toEqual(['hand/point', 'pose/point']);
    expect(first('night violet')).toBe('palette/dusk-violet');
    expect(first('tree')).toBe('silhouette/tree');
    expect(searchLibrary(library, 'walk').map((h) => h.asset.id)).toContain('action/walk');
    expect(searchLibrary(library, 'gray', { kind: 'hair-color' })[0]?.asset.id).toBe(
      'hair-color/gray',
    );
  });
});
