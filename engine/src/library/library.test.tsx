import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KINDS_WITHOUT_STILL,
  MUSIC_MOODS,
  SFX_NAMES,
  searchLibrary,
  stillPathFor,
} from '@studio/shared';
import type { AssetKind } from '@studio/shared';
import { describe, expect, it } from 'vitest';
import { SILHOUETTE_KINDS, TREATMENTS } from '../backgrounds/Background';
import { EXPRESSION_NAMES } from '../face/expressions';
import { ACTIONS } from '../rig/actions';
import { POSES } from '../rig/poses';
import { HAND_SHAPES } from '../rig/types';
import { tokens } from '../tokens';
import { COSTUMES } from '../wardrobe/cast';
import { GARMENTS } from '../wardrobe/garments';
import { HAIR_STYLES } from '../wardrobe/hair';
import { AGES, FACIAL_HAIR } from '../wardrobe/types';
import { library } from './data';
import { PLACES } from '../backgrounds/places';
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
      ...Object.keys(ACTIONS).map((a) => `action/${a}`),
      ...HAND_SHAPES.map((s) => `hand/${s}`),
      ...HAIR_STYLES.map((h) => `hair/${h}`),
      ...FACIAL_HAIR.map((f) => `facial-hair/${f}`),
      ...GARMENTS.map((g) => `clothing/${g}`),
      ...Object.keys(COSTUMES).map((c) => `costume/${c}`),
      ...AGES.map((a) => `age/${a}`),
      ...tokens.skinTones.map((_, i) => `skin/tone-${i + 1}`),
      ...Object.keys(tokens.hair).map((c) => `hair-color/${c}`),
      ...Object.keys(tokens.accents).map((c) => `color/${c}`),
      ...Object.keys(tokens.palettes).map((p) => `palette/${p}`),
      ...TREATMENTS.map((t) => `background/${t}`),
      ...Object.keys(PLACES).map((p) => `place/${p}`),
      ...SILHOUETTE_KINDS.map((k) => `silhouette/${k}`),
      ...MUSIC_MOODS.map((m) => `music/${m}`),
      ...SFX_NAMES.map((n) => `sfx/${n}`),
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
      const source = readFileSync(file, 'utf8');
      if (a.code.file.endsWith('.py')) {
        // A sound: the Python worker holds a list by that name, with this piece in it.
        const name = a.id.slice(a.id.indexOf('/') + 1);
        const listed =
          new RegExp(String.raw`^${a.code.export}\b`, 'm').test(source) &&
          source.includes(`"${name}"`);
        return listed ? [] : [`${a.id}: ${a.code.file} has no "${name}" in ${a.code.export}`];
      }
      const exported = new RegExp(String.raw`\bexport\b[^\n]*\b${a.code.export}\b`).test(source);
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
    const first = (q: string, kind?: AssetKind) =>
      searchLibrary(library, q, kind ? { kind } : {})[0]?.asset.id;
    expect(first('king')).toBe('costume/ruler');
    expect(first('throne', 'pose')).toBe('pose/sit');
    expect(first('celebrate')).toBe('action/cheer');
    expect(first('sobbing')).toBe('action/cry');
    expect(first('guard helmet')).toBe('costume/soldier');
    expect(first('grandmother')).toBe('age/elder');
    expect(first('jeans')).toBe('clothing/trousers');
    expect(first('straw hat', 'clothing')).toBe('clothing/brim-hat');
    expect(first('crown cape')).toBe('costume/ruler');
    expect(first('sneak')).toBe('action/walk-sneaky');
    expect(first('cape swing')).toBe('motion/follow-through');
    expect(first('turn around')).toBe('motion/head-turn');
    expect(first('lip sync')).toBe('motion/talking-mouth');
    expect(first('sprint')).toBe('action/run');
    expect(first('knocked down')).toBe('action/fall-back');
    expect(first('punch', 'action')).toBe('action/punch');
    expect(first('dazed')).toBe('effect/dizzy-stars');
    expect(first('bawling')).toBe('effect/tear-streams');
    expect(first('starburst')).toBe('effect/impact');
    expect(first('rumble')).toBe('camera/shake');
    expect(first('chase', 'camera')).toBe('camera/follow');
    // Sound is found the same way as pictures.
    expect(first('danger', 'music')).toBe('music/tense');
    expect(first('funny', 'music')).toBe('music/comic');
    expect(first('victory', 'music')).toBe('music/triumph');
    expect(first('coin', 'sfx')).toBe('sfx/ding');
    expect(first('punch', 'sfx')).toBe('sfx/hit');
    expect(first('walking', 'sfx')).toBe('sfx/footsteps');
    expect(first('treasure', 'prop')).toBe('prop/coin');
    expect(first('wine feast')).toBe('prop/goblet');
    expect(first('knock', 'prop')).toBe('prop/door');
    expect(first('watchman')).toBe('prop/lantern');
    expect(first('court palace', 'prop')).toBe('prop/throne');
    expect(first('village night')).toBe('place/night-street');
    expect(first('palace hall')).toBe('place/throne-room');
    expect(first('woods', 'place')).toBe('place/forest');
    expect(first('kitchen', 'place')).toBe('place/home-interior');
    expect(first('reaction', 'camera')).toBe('camera/close-up');
    expect(first('from behind')).toBe('rig/back-view');
    expect(first('chapter')).toBe('overlay/title-card');
    expect(first('leather')).toBe('color/brown');
    expect(first('khaki')).toBe('color/tan');
    expect(first('linen')).toBe('color/cream');
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
